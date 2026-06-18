#!/usr/bin/env node
/**
 * add_validation_columns.cjs — provisionne les colonnes de la couche de
 * fiabilisation (statut/rattachement validés) dans la table `Annuaire` du Grist.
 *
 * Idempotent : n'ajoute que les colonnes manquantes. DRY-RUN par défaut
 * (affiche ce qui serait fait) ; passez `--apply` pour écrire réellement.
 *
 * Les noms/types DOIVENT rester alignés sur GRIST_VALIDATION_COLUMNS de
 * lib/validation.ts. Le code applicatif est rétro-compatible : tant que ces
 * colonnes n'existent pas, toutes les fiches sont simplement « non validées ».
 *
 * Env :
 *   GRIST_API_URL  (défaut https://grist.numerique.gouv.fr/api)
 *   GRIST_DOC_ID   (défaut = VITE_GRIST_DOC_ID du .env si chargé)
 *   GRIST_API_KEY  (défaut = VITE_GRIST_API_KEY)
 *   GRIST_TABLE    (défaut Annuaire)
 *   HTTPS_PROXY    (réseau FortiGate : http://cache.univ-nantes.fr:3128)
 *
 * Usage :
 *   node scripts/add_validation_columns.cjs            # dry-run
 *   node scripts/add_validation_columns.cjs --apply    # écrit les colonnes
 */
'use strict';

// FortiGate : le proxy fait de l'inspection SSL (cf. docker/CLAUDE.md).
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

try { require('dotenv').config(); } catch { /* dotenv optionnel */ }

const API_URL = process.env.GRIST_API_URL || 'https://grist.numerique.gouv.fr/api';
const DOC = process.env.GRIST_DOC_ID || process.env.VITE_GRIST_DOC_ID;
const KEY = process.env.GRIST_API_KEY || process.env.VITE_GRIST_API_KEY;
const TABLE = process.env.GRIST_TABLE || 'Annuaire';
const APPLY = process.argv.includes('--apply');

// Doit rester synchronisé avec GRIST_VALIDATION_COLUMNS (lib/validation.ts).
const COLUMNS = [
  { id: 'validated',         label: 'Validé (manuel)',      type: 'Bool' },
  { id: 'validated_status',  label: 'Statut validé',        type: 'Text' },
  { id: 'validation_date',   label: 'Date de validation',   type: 'Date' },
  { id: 'validation_source', label: 'Source de validation', type: 'Text' },
  { id: 'validation_scope',  label: 'Portée (statut,rattachement)', type: 'Text' },
  { id: 'validated_by',      label: 'Validé par',           type: 'Text' },
];

const headers = { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

async function main() {
  if (!DOC || !KEY) {
    console.error('✗ GRIST_DOC_ID et GRIST_API_KEY requis (ou VITE_GRIST_*). Abandon.');
    process.exit(1);
  }
  console.log(`Grist : ${API_URL} · doc ${DOC} · table ${TABLE} · ${APPLY ? 'APPLY' : 'DRY-RUN'}`);

  const colResp = await fetch(`${API_URL}/docs/${DOC}/tables/${TABLE}/columns`, { headers });
  if (!colResp.ok) {
    console.error(`✗ Lecture des colonnes échouée : ${colResp.status} ${await colResp.text()}`);
    process.exit(1);
  }
  const existing = new Set((await colResp.json()).columns.map((c) => c.id));
  const missing = COLUMNS.filter((c) => !existing.has(c.id));

  if (missing.length === 0) {
    console.log('✓ Toutes les colonnes de validation existent déjà. Rien à faire.');
    return;
  }
  console.log(`Colonnes manquantes : ${missing.map((c) => c.id).join(', ')}`);

  if (!APPLY) {
    console.log('\n(DRY-RUN) Relancez avec --apply pour créer ces colonnes.');
    return;
  }

  const body = JSON.stringify({ columns: missing.map((c) => ({ id: c.id, fields: { label: c.label, type: c.type } })) });
  const resp = await fetch(`${API_URL}/docs/${DOC}/tables/${TABLE}/columns`, { method: 'POST', headers, body });
  if (!resp.ok) {
    console.error(`✗ Création échouée : ${resp.status} ${await resp.text()}`);
    process.exit(1);
  }
  console.log(`✓ ${missing.length} colonne(s) créée(s) dans ${TABLE}.`);
}

main().catch((e) => { console.error('✗', e.message); process.exit(1); });
