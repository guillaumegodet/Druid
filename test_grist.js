
const GRIST_DOC_ID = 'qzzYmeoVSwbYGWhqw2kYZz';
const GRIST_API_KEY = '66b78f463e92382af2ac4657e9032f14ff8dc487';
const GRIST_BASE_URL = 'https://grist.numerique.gouv.fr/api';

async function testGrist() {
  try {
    const tablesResp = await fetch(`${GRIST_BASE_URL}/docs/${GRIST_DOC_ID}/tables`, {
      headers: { 'Authorization': `Bearer ${GRIST_API_KEY}` }
    });
    
    if (!tablesResp.ok) {
        console.error('Failed to fetch tables:', await tablesResp.text());
        return;
    }
    const data = await tablesResp.json();
    const tables = data.tables;
    console.log('Tables found:', tables.map(t => t.id).join(', '));
    
    const tableId = tables.find(t => t.id.toLowerCase().includes('chercheur') || t.id.toLowerCase().includes('annuaire'))?.id || tables[0].id;
    console.log('Using table:', tableId);
    
    const recordsResp = await fetch(`${GRIST_BASE_URL}/docs/${GRIST_DOC_ID}/tables/${tableId}/records`, {
      headers: { 'Authorization': `Bearer ${GRIST_API_KEY}` }
    });
    
    if (!recordsResp.ok) {
        console.error('Failed to fetch records:', await recordsResp.text());
        return;
    }
    const rData = await recordsResp.json();
    const records = rData.records;
    console.log('Total records:', records.length);
    if (records.length > 0) {
        console.log('First record fields:', Object.keys(records[0].fields).join(', '));
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

testGrist().then(() => console.log('Done test.'));
