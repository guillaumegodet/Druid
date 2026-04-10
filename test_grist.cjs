async function testGrist() {
  const GRIST_DOC_ID = 'qzzYmeoVSwbYGWhqw2kYZz';
  const GRIST_API_KEY = '5f685080ed2b67f82134f9fdeb26ff15f930183e';
  const url = `https://grist.numerique.gouv.fr/api/docs/${GRIST_DOC_ID}/tables/Annuaire/records`;

  console.log('--- TEST DE CONNEXION GRIST DIRECT (NODE NATIVE FETCH) ---');
  console.log('URL:', url);

  try {
    const resp = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GRIST_API_KEY}`
      },
      body: JSON.stringify({
        records: [{ id: 1, fields: { Nom: "NODE_TEST_OK" } }]
      })
    });

    console.log('Status Code:', resp.status);
    console.log('Status Text:', resp.statusText);
    
    const text = await resp.text();
    console.log('Raw Response:', text);

    if (resp.ok) {
      console.log('\n✅ SUCCÈS : La clé et l\'ID doc sont valides !');
    } else {
      console.log('\n❌ ÉCHEC : Le serveur rejette l\'écriture.');
    }
  } catch (err) {
    console.error('\n💥 ERREUR RÉSEAU :', err.message);
  }
}

testGrist();
