
const GRIST_DOC_ID = 'qzzYmeoVSwbYGWhqw2kYZz';
const GRIST_API_KEY = '66b78f463e92382af2ac4657e9032f14ff8dc487';
const GRIST_BASE_URL = 'https://grist.numerique.gouv.fr/api';

async function testGrist() {
  try {
    const tableId = 'Annuaire';
    const recordsResp = await fetch(`${GRIST_BASE_URL}/docs/${GRIST_DOC_ID}/tables/${tableId}/records`, {
      headers: { 'Authorization': `Bearer ${GRIST_API_KEY}` }
    });
    
    const rData = await recordsResp.json();
    const records = rData.records;
    console.log('Total records:', records.length);
    if (records.length > 0) {
        for (let i = 0; i < Math.min(5, records.length); i++) {
            console.log(`Record ${i+1} Employeur:`, records[i].fields['Employeur']);
        }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

testGrist();
