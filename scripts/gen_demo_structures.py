#!/usr/bin/env python3
# Génère un structures.csv de DÉMO (données fictives) au format CRISalid V2,
# calqué sur le schéma du structures.csv nantais (24 colonnes) mais avec une
# université inventée illustrant inclusions + participations.
import csv, sys, re

HEADERS = [
    'generic_type', 'type', 'local_types', 'main_mission', 'secondary_missions',
    'local_id', 'tracking_id', 'short_labels', 'long_labels', 'descriptions',
    'inclusions', 'participations', 'uai', 'nns', 'ror', 'isni', 'wikidata',
    'scopus', 'erc_research_field', 'hceres_research_areas', 'hal_collection',
    'web', 'signature', 'campus',
]

def row(generic_type, type_, local_id, short, long_, *, mission='', inclusions='',
        participations='', uai='', nns='', web='', signature=''):
    d = {h: '' for h in HEADERS}
    d.update({
        'generic_type': generic_type, 'type': type_, 'local_id': local_id,
        'main_mission': mission,
        'short_labels': f'{short}[fr]', 'long_labels': f'{long_}[fr]',
        'inclusions': inclusions, 'participations': participations,
        'uai': uai, 'nns': nns, 'web': web, 'signature': signature,
    })
    return d

ROWS = [
    # — Institutions (niveau 4) —
    row('institution', 'EPE', 'DEMO-UNIV', 'UDémo', 'Université de Démonstration',
        uai='DEMO-UNIV', web='https://example.org/udemo'),
    row('institution', 'GE', 'DEMO-ENS', 'ENS-Démo', 'École Nationale Supérieure de Démonstration',
        uai='DEMO-ENS', web='https://example.org/ens-demo'),
    row('institution', 'EPST', 'DEMO-CNR', 'CNRD', 'Centre National de Recherche de Démonstration',
        uai='DEMO-CNR', web='https://example.org/cnrd'),

    # — Pôles de recherche (niveau 3, intermédiaire) : cibles de participations faibles —
    row('unit', 'POLE', 'POLE-ST', 'PST', 'Pôle Sciences et Technologies', mission='research'),
    row('unit', 'POLE', 'POLE-VIE', 'PVS', 'Pôle Vie et Santé', mission='research'),

    # — Composantes / facultés (niveau 3) : incluses dans l'université —
    row('unit', 'UFR', 'UFR-SCI', 'FacSciences', 'Faculté des Sciences et Techniques',
        inclusions='local-DEMO-UNIV[20150901-]'),
    row('unit', 'UFR', 'UFR-MED', 'FacSanté', 'Faculté de Santé',
        inclusions='local-DEMO-UNIV[20150901-]'),

    # — Unités de recherche (niveau 2) : inclusion dans une composante + tutelles + pôle —
    row('unit', 'UMR', 'LIRA', 'LIRA', "Laboratoire d'Informatique et Réseaux Appliqués",
        mission='research', inclusions='local-UFR-SCI[20160101-]',
        participations=('local-DEMO-UNIV[main_supervision][20160101-]'
                        '|local-DEMO-ENS[associated_supervision][20160101-]'
                        '|local-DEMO-CNR[associated_supervision][20160101-]'
                        '|local-POLE-ST[20160101-]'),
        nns='DEMO-UMR-001', web='https://example.org/lira',
        signature='Université de Démonstration, ENS-Démo, CNRD, LIRA, UMR 0001, Démoville, France'),
    row('unit', 'UMR', 'BIOS', 'BIOS', 'Biologie des Organismes et des Systèmes',
        mission='research', inclusions='local-UFR-MED[20160101-]',
        participations=('local-DEMO-UNIV[main_supervision][20160101-]'
                        '|local-DEMO-CNR[associated_supervision][20160101-]'
                        '|local-POLE-VIE[20160101-]'),
        nns='DEMO-UMR-002', web='https://example.org/bios',
        signature='Université de Démonstration, CNRD, BIOS, UMR 0002, Démoville, France'),
    # UR mono-tutelle + une tutelle EXTERNE par identifiant ROR (non présente dans la base)
    row('unit', 'UR', 'LMD', 'LMD', 'Laboratoire de Mathématiques de Démonstration',
        mission='research', inclusions='local-UFR-SCI[20160101-]',
        participations=('local-DEMO-UNIV[main_supervision][20160101-]'
                        '|ror-02demo45[associated_supervision][20160101-]'
                        '|local-POLE-ST[20160101-]'),
        nns='DEMO-UR-003', web='https://example.org/lmd'),

    # — Équipes (niveau 1) : incluses dans une unité —
    row('unit', 'ER', 'LIRA-AI', 'IA-Démo', 'Équipe Intelligence Artificielle',
        mission='research', inclusions='local-LIRA[20170101-]'),
    row('unit', 'ER', 'LIRA-NET', 'Net-Démo', 'Équipe Réseaux et Systèmes Distribués',
        mission='research', inclusions='local-LIRA[20170101-]'),
    row('unit', 'ER', 'BIOS-GEN', 'Gen-Démo', 'Équipe Génomique Fonctionnelle',
        mission='research', inclusions='local-BIOS[20170101-]'),
]

out = sys.argv[1] if len(sys.argv) > 1 else 'demo-structures-v2.csv'
with open(out, 'w', newline='', encoding='utf-8') as f:
    w = csv.DictWriter(f, fieldnames=HEADERS, quoting=csv.QUOTE_MINIMAL, lineterminator='\n')
    w.writeheader()
    for r in ROWS:
        w.writerow(r)

# --- Vérification d'intégrité ---
ids = {r['local_id'] for r in ROWS}
dangling = []
ref_re = re.compile(r'local-([^\[\]|]+)')
for r in ROWS:
    for col in ('inclusions', 'participations'):
        for ref in ref_re.findall(r[col] or ''):
            if ref not in ids:
                dangling.append((r['local_id'], col, ref))

# Relecture pour valider le nombre de colonnes
with open(out, encoding='utf-8') as f:
    rd = list(csv.reader(f))
bad = [i for i, line in enumerate(rd) if len(line) != len(HEADERS)]

print(f'Écrit : {out}')
print(f'Lignes (hors en-tête) : {len(ROWS)}')
print(f'Colonnes attendues : {len(HEADERS)} ; lignes au mauvais compte : {bad or "aucune"}')
print(f'Références local- pendantes : {dangling or "aucune"}')
