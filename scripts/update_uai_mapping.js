import fs from 'fs';

const GRIST_DOC_ID = 'qzzYmeoVSwbYGWhqw2kYZz';
const GRIST_API_KEY = '66b78f463e92382af2ac4657e9032f14ff8dc487';

async function run() {
  try {
    const res = await fetch(`http://localhost:3000/api/grist/docs/${GRIST_DOC_ID}/tables/Structures_nantes/records`, {
      headers: { 'Authorization': `Bearer ${GRIST_API_KEY}` }
    });
    const data = await res.json();
    const uais = new Set();
    data.records.forEach(r => {
      const t = r.fields.tutelles || '';
      t.split('|').forEach(u => {
        const trimmed = u.trim();
        if (trimmed) uais.add(trimmed);
      });
    });
    console.log("UAIs in Grist:", Array.from(uais));
    
    // Read UAI.txt and match
    const uaiText = fs.readFileSync('UAI.txt', 'utf8');
    const uaiLines = uaiText.split('\n');
    const mapping = {};
    uaiLines.forEach(line => {
      const parts = line.split('\t');
      if (parts.length >= 2) {
        mapping[parts[0].trim()] = parts[1].trim();
      }
    });
    
    const finalMapping = {};
    uais.forEach(u => {
      finalMapping[u] = mapping[u] || u;
    });
    
    console.log("MAPPING:", finalMapping);
    
    const tsCode = `export const UAI_MAPPING: Record<string, string> = ${JSON.stringify(mapping, null, 2)};\n\nexport const getTutelleName = (uai: string): string => {\n  return UAI_MAPPING[uai.toUpperCase()] || uai;\n};\n`;
    fs.writeFileSync('lib/uaiMapping.ts', tsCode);
    console.log("Updated lib/uaiMapping.ts");
  } catch(e) {
    console.error("ERROR", e);
  }
}
run();
