import fs from 'fs';
import { UAI_MAPPING } from './lib/uaiMapping.js';

const GRIST_DOC_ID = 'qzzYmeoVSwbYGWhqw2kYZz';
const GRIST_API_KEY = '66b78f463e92382af2ac4657e9032f14ff8dc487';

async function run() {
  try {
    const res = await fetch(`http://localhost:3000/api/grist/docs/${GRIST_DOC_ID}/tables/Structures_nantes/records`, {
      headers: { 'Authorization': `Bearer ${GRIST_API_KEY}` }
    });
    const data = await res.json();
    const missing = new Set();
    data.records.forEach(r => {
      const t = r.fields.tutelles || '';
      t.split('|').forEach(u => {
        const trimmed = u.trim().toUpperCase();
        if (trimmed && !UAI_MAPPING[trimmed]) {
          missing.add(trimmed);
        }
      });
    });
    console.log("Missing UAIs:", Array.from(missing));
  } catch(e) {
    console.error("ERROR", e);
  }
}
run();
