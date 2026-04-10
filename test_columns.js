
const GRIST_DOC_ID = 'qzzYmeoVSwbYGWhqw2kYZz';
const GRIST_API_KEY = '66b78f463e92382af2ac4657e9032f14ff8dc487';

async function testGrist() {
  const resp = await fetch(`https://grist.numerique.gouv.fr/api/docs/${GRIST_DOC_ID}/tables/Structures_nantes/columns`, {
    headers: { 'Authorization': `Bearer ${GRIST_API_KEY}` }
  });
  const data = await resp.json();
  console.log(data.columns.map(c => `${c.fields.label} -> ${c.id}`).join('\n'));
}
testGrist();
