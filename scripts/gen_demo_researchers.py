#!/usr/bin/env python3
# Génère demo-data-researchers.csv (données fictives) aligné sur l'université
# fictive « UDémo » : labos LIRA / BIOS / LMD et équipes IA-Démo / Net-Démo / Gen-Démo.
import csv, sys

HEADERS = [
    'tracking_id', 'last_name', 'first_names', 'gender', 'birthdate', 'contact_email',
    'nationality', 'status', 'orcid', 'idref', 'idhals', 'scopus', 'eppn', 'position',
    'membership_type', 'institution_identifier', 'institution_id_nomenclature',
    'employment_start_date', 'employment_end_date', 'hdr', 'main_research_structure',
    'team', 'membership_start_date', 'membership_end_date', 'localisation',
]

# Employeurs (réfs local des institutions de demo-data-structuresv2.csv)
UNIV, ENS, CNR = 'DEMO-UNIV', 'DEMO-ENS', 'DEMO-CNR'

def r(tid, last, first, gender, birth, position, lab, team, employer, *,
      hdr=False, contractuel=False, start='2015-09-01', campus='Campus UDémo',
      orcid='', idref='', idhal='', scopus=''):
    return {
        'tracking_id': tid, 'last_name': last, 'first_names': first, 'gender': gender,
        'birthdate': birth, 'contact_email': f'{tid}@udemo.example.org',
        'nationality': 'Française', 'status': 'INTERNE',
        'orcid': orcid, 'idref': idref, 'idhals': idhal, 'scopus': scopus,
        'eppn': f'{tid}@udemo.example.org', 'position': position,
        'membership_type': 'Contractuel' if contractuel else 'Titulaire',
        'institution_identifier': employer, 'institution_id_nomenclature': 'local',
        'employment_start_date': start, 'employment_end_date': '',
        'hdr': 'true' if hdr else 'false',
        'main_research_structure': lab, 'team': team,
        'membership_start_date': start, 'membership_end_date': '', 'localisation': campus,
    }

ROWS = [
    # — LIRA / IA-Démo —
    r('roussel-c', 'Roussel', 'Camille', 'F', '1974-04-12', 'PR', 'LIRA', 'IA-Démo', UNIV,
      hdr=True, start='2006-09-01', orcid='0000-0001-1000-0001', idref='100000001', idhal='camille-roussel'),
    r('lefevre-h', 'Lefèvre', 'Hugo', 'M', '1985-01-30', 'MCF', 'LIRA', 'IA-Démo', UNIV,
      start='2014-09-01', orcid='0000-0001-1000-0002', idref='100000002', idhal='hugo-lefevre'),
    r('dasilva-i', 'Da Silva', 'Inês', 'F', '1989-06-08', 'CR', 'LIRA', 'IA-Démo', CNR,
      start='2017-01-01', orcid='0000-0001-1000-0003', idref='100000003', idhal='ines-dasilva'),
    # — LIRA / Net-Démo —
    r('marchand-t', 'Marchand', 'Théo', 'M', '1983-09-19', 'MCF', 'LIRA', 'Net-Démo', UNIV,
      start='2013-09-01', orcid='0000-0001-1000-0004', idref='100000004', idhal='theo-marchand'),
    r('nguyen-l', 'Nguyen', 'Lan', 'F', '1996-02-25', 'DOC', 'LIRA', 'Net-Démo', UNIV,
      contractuel=True, start='2022-10-01', campus='Campus UDémo', orcid='0000-0001-1000-0005'),
    r('bonnet-p', 'Bonnet', 'Pierre', 'M', '1979-12-03', 'IR', 'LIRA', 'Net-Démo', ENS,
      start='2011-03-01', orcid='0000-0001-1000-0006', idref='100000006', idhal='pierre-bonnet'),
    # — BIOS / Gen-Démo —
    r('garnier-s', 'Garnier', 'Sophie', 'F', '1969-11-21', 'DR', 'BIOS', 'Gen-Démo', CNR,
      hdr=True, start='2003-01-01', campus='Campus Santé', orcid='0000-0001-2000-0001', idref='200000001', idhal='sophie-garnier'),
    r('faure-a', 'Faure', 'Adrien', 'M', '1986-05-17', 'MCF', 'BIOS', 'Gen-Démo', UNIV,
      start='2015-09-01', campus='Campus Santé', orcid='0000-0001-2000-0002', idref='200000002', idhal='adrien-faure'),
    r('petit-l', 'Petit', 'Léa', 'F', '1997-08-14', 'DOC', 'BIOS', 'Gen-Démo', UNIV,
      contractuel=True, start='2023-10-01', campus='Campus Santé', orcid='0000-0001-2000-0003'),
    # — BIOS (sans équipe) —
    # idhal volontairement vide : sert la démo d'alignement IdRef en mode « Vérifier »
    # (la notice IdRef propose l'IdHAL absent → cas « à enrichir »). Voir public/idref_align_cache.json.
    r('morel-j', 'Morel', 'Julien', 'M', '1971-03-09', 'PR', 'BIOS', '', UNIV,
      hdr=True, start='2004-09-01', campus='Campus Santé', orcid='0000-0001-2000-0004', idref='200000004', idhal=''),
    # — LMD (sans équipe) —
    r('chevalier-a', 'Chevalier', 'Anne', 'F', '1973-07-02', 'PR', 'LMD', '', UNIV,
      hdr=True, start='2005-09-01', orcid='0000-0001-3000-0001', idref='300000001', idhal='anne-chevalier'),
    r('henry-m', 'Henry', 'Marc', 'M', '1982-10-28', 'MCF', 'LMD', '', UNIV,
      start='2012-09-01', orcid='0000-0001-3000-0002', idref='300000002', idhal='marc-henry'),
    r('robin-c', 'Robin', 'Claire', 'F', '1990-01-15', 'CR', 'LMD', '', CNR,
      start='2018-01-01', orcid='0000-0001-3000-0003', idref='300000003', idhal='claire-robin'),
    r('olivier-s', 'Olivier', 'Sami', 'M', '1995-09-06', 'DOC', 'LMD', '', UNIV,
      contractuel=True, start='2021-10-01', orcid='0000-0001-3000-0004'),
]

out = sys.argv[1] if len(sys.argv) > 1 else 'demo-data-researchers.csv'
with open(out, 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=HEADERS, quoting=csv.QUOTE_MINIMAL, lineterminator='\n')
    w.writeheader()
    for row in ROWS:
        w.writerow(row)

# Vérification
LABS = {'LIRA', 'BIOS', 'LMD'}
TEAMS = {'IA-Démo', 'Net-Démo', 'Gen-Démo', ''}
bad_lab = [x['tracking_id'] for x in ROWS if x['main_research_structure'] not in LABS]
bad_team = [x['tracking_id'] for x in ROWS if x['team'] not in TEAMS]
with open(out, encoding='utf-8') as f:
    rd = list(csv.reader(f))
bad_cols = [i for i, line in enumerate(rd) if len(line) != len(HEADERS)]
print(f'Écrit : {out} — {len(ROWS)} chercheurs')
print(f'Colonnes ({len(HEADERS)}) mauvais compte : {bad_cols or "aucune"}')
print(f'Labo hors {LABS} : {bad_lab or "aucun"} ; équipe hors set : {bad_team or "aucune"}')
