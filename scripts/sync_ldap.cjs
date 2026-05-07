// Load .env when run directly (server.cjs already has env vars in its process)
try { require('dotenv').config(); } catch (_) {}

const ldap = require('ldapjs');
const fs = require('fs');

const LDAP_URL = process.env.LDAP_URL;
const BIND_DN = process.env.LDAP_BIND_DN;
const BIND_PW = process.env.LDAP_BIND_PW;
const BASE_DN = process.env.LDAP_BASE_DN;
const FILTER = process.env.LDAP_FILTER || '(&(objectClass=supannPerson)(population=PERSONNEL))';

if (!LDAP_URL || !BIND_DN || !BIND_PW || !BASE_DN) {
  console.error('[LDAP] Missing required env vars: LDAP_URL, LDAP_BIND_DN, LDAP_BIND_PW, LDAP_BASE_DN');
  process.exit(1);
}

const client = ldap.createClient({ url: LDAP_URL, tlsOptions: { rejectUnauthorized: process.env.NODE_ENV === 'production' } });

async function syncAllStatuses() {
  return new Promise((resolve, reject) => {
    client.bind(BIND_DN, BIND_PW, (err) => {
      if (err) return reject(err);
      console.log('[LDAP] Bind successful');

      const opts = {
        filter: FILTER,
        scope: 'sub',
        attributes: [
          'uid', 'dynaEtat', 'dynaCategorie', 'supannEmpCorps',
          'supannCivilite', 'supannOIDCDateDeNaissance', 'eduPersonPrincipalName',
        ],
      };

      const results = {};
      const stats = {};

      client.search(BASE_DN, opts, (err, res) => {
        if (err) return reject(err);

        res.on('searchEntry', (entry) => {
          const attrs = entry.pojo.attributes || [];
          const p = {};
          attrs.forEach((a) => { p[a.type.toLowerCase()] = a.values[0]; });

          const uid = p['uid'];
          if (!uid) return;

          const etat = p['dynaetat'] || 'N/A';
          const categorie = p['dynacategorie'] || '';
          const empCorpsRaw = p['supannempcorps'] || '';
          const empCorps = empCorpsRaw.replace(/^\{[^}]+\}/, '');
          const civilite = p['supanncivilite'] || '';
          const birthDate = p['supannoidcdatedenaissance'] || '';
          const eppn = p['edupersonprincipalname'] || '';

          results[uid] = { etat, categorie, empCorps, civilite, birthDate, eppn };
          stats[etat] = (stats[etat] || 0) + 1;
        });

        res.on('error', (err) => { console.error('[LDAP] Search error:', err); });

        res.on('end', () => {
          console.log(`[LDAP] Done. ${Object.keys(results).length} entries found.`);
          console.log('[LDAP] Stats by dynaEtat:', stats);
          fs.writeFileSync('ldap_status_cache.json', JSON.stringify(results, null, 2));
          console.log('[LDAP] ldap_status_cache.json written.');
          client.unbind();
          resolve(results);
        });
      });
    });
  });
}

syncAllStatuses().catch((err) => {
  console.error('[LDAP] Sync failed:', err);
  process.exit(1);
});
