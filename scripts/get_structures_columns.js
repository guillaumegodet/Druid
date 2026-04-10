import fs from 'fs';

const GRIST_DOC_ID = 'qzzYmeoVSwbYGWhqw2kYZz';
const GRIST_API_KEY = '66b78f463e92382af2ac4657e9032f14ff8dc487';

async function run() {
  try {
    const res = await fetch(`http://localhost:3000/api/grist/docs/${GRIST_DOC_ID}/tables/Structures_nantes/columns`, {
      headers: { 'Authorization': `Bearer ${GRIST_API_KEY}` }
    });
    const data = await res.json();
    fs.writeFileSync('grist_structures_columns.json', JSON.stringify(data.columns.map(c => ({id: c.id, label: c.fields.label})), null, 2));
    console.log("JSON written");
  } catch(e) {
    console.error("ERROR", e);
  }
}
run();
