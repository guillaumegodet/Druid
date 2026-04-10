const ldap = require('ldapjs');
const fs = require('fs');

const LDAP_URL = 'ldaps://annuaire.intra.univ-nantes.fr';
const BIND_DN = 'cn=SVP,ou=Applications,dc=univ-nantes,dc=fr';
const BIND_PW = 'uu3uqEQ5t0ucf3jI'; 

const client = ldap.createClient({ url: LDAP_URL });

async function syncAllStatuses() {
    return new Promise((resolve, reject) => {
        client.bind(BIND_DN, BIND_PW, (err) => {
            if (err) return reject(err);
            console.log('Bind successful!');

            const opts = {
                filter: '(&(objectClass=supannPerson)(population=PERSONNEL))',
                scope: 'sub',
                attributes: ['uid', 'dynaEtat', 'supannCivilite', 'supannOIDCDateDeNaissance'],
            };

            const results = {};
            const stats = {};

            client.search('ou=People,dc=univ-nantes,dc=fr', opts, (err, res) => {
                if (err) return reject(err);

                res.on('searchEntry', (entry) => {
                    const attrs = entry.pojo.attributes || [];
                    let p = {};
                    attrs.forEach(a => {
                        const type = a.type.toLowerCase();
                        p[type] = a.values[0];
                    });

                    const uid = p['uid'];
                    const etat = p['dynaetat']; 
                    const civilite = p['supanncivilite'];
                    const birthDate = p['supannoidcdatedenaissance'];
                    
                    if (uid) {
                        results[uid] = { 
                          etat: etat || 'N/A', 
                          civilite: civilite || '',
                          birthDate: birthDate || ''
                        };
                        stats[etat] = (stats[etat] || 0) + 1;
                    }
                });

                res.on('error', (err) => {
                    console.error('Search error:', err);
                });

                res.on('end', (result) => {
                    console.log('Search end. Total found:', Object.keys(results).length);
                    console.log('Stats by dynaEtat:', stats);
                    fs.writeFileSync('ldap_status_cache.json', JSON.stringify(results, null, 2));
                    console.log(`Fichier ldap_status_cache.json généré.`);
                    client.unbind();
                    resolve(results);
                });
            });
        });
    });
}

syncAllStatuses().catch(console.error);
