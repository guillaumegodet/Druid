const express = require('express');
const session = require('express-session');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');

const app = express();
const PORT = process.env.DRUID_PORT || process.env.PORT || 3000;
const AUTH_ENABLED = process.env.DRUID_AUTH_ENABLED === 'true';

// Bypass SSL verification only outside production (e.g. self-signed certs on internal Grist)
if (process.env.NODE_ENV !== 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

// Keycloak / OAuth2 config — only used when AUTH_ENABLED=true
const KEYCLOAK_URL = process.env.KEYCLOAK_URL || '';
const KEYCLOAK_REALM = process.env.KEYCLOAK_REALM || '';
const KEYCLOAK_CLIENT_ID = process.env.KEYCLOAK_CLIENT_ID || 'druid';
const APP_URL = process.env.APP_URL || `http://localhost:${PORT}`;
const KC_BASE = `${KEYCLOAK_URL}/realms/${KEYCLOAK_REALM}/protocol/openid-connect`;
const CALLBACK_URI = `${APP_URL}/auth/callback`;

app.use(express.json({ limit: '10mb' }));

app.use(session({
  secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, httpOnly: true, maxAge: 8 * 60 * 60 * 1000 },
}));

app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  next();
});

// ── Auth routes (public) ────────────────────────────────────────────────────

app.get('/auth/login', (req, res) => {
  if (!AUTH_ENABLED) return res.redirect('/');
  const state = crypto.randomBytes(16).toString('hex');
  req.session.oauthState = state;
  const url = `${KC_BASE}/auth?response_type=code&client_id=${KEYCLOAK_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(CALLBACK_URI)}` +
    `&state=${state}&scope=openid%20profile%20email`;
  res.redirect(url);
});

app.get('/auth/callback', async (req, res) => {
  if (!AUTH_ENABLED) return res.redirect('/');
  const { code, state } = req.query;
  if (!code || state !== req.session.oauthState) {
    return res.status(400).send('Invalid OAuth state');
  }
  try {
    const tokenRes = await fetch(`${KC_BASE}/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: KEYCLOAK_CLIENT_ID,
        code,
        redirect_uri: CALLBACK_URI,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('[Auth] Token exchange failed:', tokenData);
      return res.status(401).send('Authentication failed');
    }
    const payload = JSON.parse(
      Buffer.from(tokenData.access_token.split('.')[1], 'base64url').toString()
    );
    req.session.user = {
      name: payload.name || payload.preferred_username || '',
      email: payload.email || '',
      preferred_username: payload.preferred_username || '',
      roles: payload.realm_access?.roles || [],
    };
    delete req.session.oauthState;
    console.log(`[Auth] Logged in: ${req.session.user.preferred_username}`);
    res.redirect('/');
  } catch (err) {
    console.error('[Auth] Callback error:', err);
    res.status(500).send('Authentication error');
  }
});

app.get('/auth/logout', (req, res) => {
  req.session.destroy(() => {
    if (!AUTH_ENABLED) return res.redirect('/');
    const postLogout = encodeURIComponent(APP_URL);
    res.redirect(
      `${KC_BASE}/logout?client_id=${KEYCLOAK_CLIENT_ID}&post_logout_redirect_uri=${postLogout}`
    );
  });
});

// Current user info (used by frontend auth.ts)
app.get('/api/me', (req, res) => {
  if (!AUTH_ENABLED) return res.json({ name: 'Demo', email: '', preferred_username: 'demo', roles: [] });
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  res.json(req.session.user);
});

// ── Auth guard middleware ───────────────────────────────────────────────────
app.use((req, res, next) => {
  if (!AUTH_ENABLED) return next();
  const isPublic =
    req.path.startsWith('/auth/') ||
    req.path.startsWith('/assets/') ||
    req.path === '/favicon.ico';
  if (isPublic || req.session.user) return next();
  if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Unauthorized' });
  res.redirect('/auth/login');
});

// ── Export people.csv ───────────────────────────────────────────────────────
// Returns the CSV as a file download — no server-side filesystem write.
const CSV_HEADERS = [
  'first_names', 'last_name', 'main_research_structure', 'tracking_id', 'local',
  'eppn', 'idhals', 'idhali', 'orcid', 'idref', 'scopus',
  'institution_identifier', 'institution_id_nomenclature', 'position',
  'employment_start_date', 'employment_end_date', 'hdr',
];

function csvEscape(value) {
  const str = (value ?? '').toString();
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

const isoDate = (v) => /^\d{4}-\d{2}-\d{2}$/.test(v ?? '') ? v : '';

app.post('/api/sync-sovisuplus', (req, res) => {
  const body = req.body;
  if (!body || !Array.isArray(body.researchers) || !Array.isArray(body.structures)) {
    return res.status(400).json({ error: 'researchers and structures arrays required' });
  }
  const { researchers, structures } = body;

  const structureByAcronym = {};
  for (const s of structures) {
    if (s.acronym) structureByAcronym[s.acronym.toUpperCase().trim()] = s;
  }

  const rows = [CSV_HEADERS.join(',')];
  let skipped = 0;

  for (const r of researchers) {
    if (!r.uid) { skipped++; continue; }

    const labName = r.affiliations?.[0]?.structureName || '';
    const struct = structureByAcronym[labName.toUpperCase().trim()];
    const trackingId = struct?.trackingId || '';
    const uai = r.employment?.institutionId || '';

    const row = [
      r.firstName || '',
      r.lastName || '',
      trackingId,
      r.uid,
      r.uid,
      r.eppn || '',
      r.identifiers?.halId || '',
      '',
      r.identifiers?.orcid || '',
      r.identifiers?.idref || '',
      r.identifiers?.scopusId || '',
      uai,
      uai ? 'UAI' : '',
      r.employment?.grade || '',
      isoDate(r.employment?.startDate),
      isoDate(r.employment?.endDate),
      r.nuFields?.hdr ? 'OUI' : '',
    ].map(csvEscape);

    rows.push(row.join(','));
  }

  const csv = rows.join('\n') + '\n';
  const count = rows.length - 1;
  console.log(`[Export] people.csv: ${count} rows, ${skipped} skipped (no uid)`);

  res.set('Content-Type', 'text/csv; charset=utf-8')
     .set('Content-Disposition', 'attachment; filename="people.csv"')
     .send(csv);
});

// ── Proxy Grist ────────────────────────────────────────────────────────────
app.all('/api/grist/*', async (req, res) => {
  const gristPath = req.url.replace('/api/grist/', '');
  const targetUrl = `https://grist.numerique.gouv.fr/api/${gristPath}`;
  const apiKey = process.env.VITE_GRIST_API_KEY || '';

  console.log(`[Proxy] -> ${targetUrl}`);

  try {
    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Druid/1.0',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
    };
    if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
      options.body = JSON.stringify(req.body);
    }
    const response = await fetch(targetUrl, options);
    const responseText = await response.text();
    if (!response.ok) console.error(`[Proxy Grist Error]: ${responseText}`);
    res.status(response.status).set('Content-Type', 'application/json').send(responseText);
  } catch (err) {
    console.error('[Proxy Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Sync LDAP ──────────────────────────────────────────────────────────────
app.get('/api/sync-ldap-trigger', (req, res) => {
  try {
    console.log('[Sync] Triggering LDAP sync...');
    execSync('node scripts/sync_ldap.cjs', { stdio: 'inherit' });
    if (fs.existsSync('ldap_status_cache.json')) {
      fs.copyFileSync('ldap_status_cache.json', 'dist/ldap_status_cache.json');
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[Sync Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Static + SPA fallback ──────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.use((err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  console.error(`[Error] ${status} ${err.message}`);
  res.status(status).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Druid server running on http://0.0.0.0:${PORT}`);
  if (!AUTH_ENABLED) console.log('[Auth] Authentication disabled (DRUID_AUTH_ENABLED=false)');
});
