# Druid — Directory for Researchers, Units & Identifiers

Druid is a web application for managing and browsing your institution's research directory. It reads researchers and structures from a [Grist](https://grist.numerique.gouv.fr/o/docs/bWVMq9SHJes7/Demo-Druid) document and lets you explore, filter, edit and export them. 

## Features

- Browse researchers and research structures from Grist
- Filter by status, employer, lab, grade, contract type, identifier presence
- Edit researcher records and write changes back to Grist
- Export the directory as CSV (`people.csv`) for CRISalid / SoVisu+
- Optional LDAP enrichment (status, civility, birth date, EPPN)
- Optional Keycloak authentication

## Quick start

### 1. Copy the example env file

```bash
cp .env.example .env
```

Edit `.env` and set at minimum:

```
VITE_GRIST_DOC_ID=<your-grist-doc-id>
VITE_GRIST_RESEARCHERS_TABLE=Annuaire   # table name in your Grist doc
VITE_GRIST_STRUCTURES_TABLE=Structures  # table name in your Grist doc
```

### 2. Run with Docker Compose

```bash
docker compose up --build
```

Open http://localhost:3000.

### 3. Run without Docker

```bash
npm install
npm run build
node server.cjs
```

## Grist document schema

Druid expects the following column names in your researchers table:

| Column | Description |
|---|---|
| `tracking_id` | Internal UID / identifier |
| `last_name` | Family name |
| `first_names` | Given name(s) |
| `gender` | `M` or `F` |
| `birthdate` | Birth date (YYYY-MM-DD) |
| `contact_email` | Professional email |
| `nationality` | Nationality |
| `status` | `INTERNE`, `EXTERNE`, `DEPART`, or `PARTI` |
| `eppn` | eduPersonPrincipalName (for SoVisu+ export) |
| `orcid` | ORCID identifier |
| `idref` | IdRef identifier |
| `idhals` | HAL author identifier |
| `scopus` | Scopus ID |
| `position` | Grade / position |
| `membership_type` | Contract type |
| `institution_identifier` | UAI or institution code |
| `institution_id_nomenclature` | Institution label |
| `employment_start_date` | Start date (YYYY-MM-DD) |
| `employment_end_date` | End date (YYYY-MM-DD) |
| `main_research_structure` | Lab / unit acronym |
| `team` | Internal team |
| `membership_start_date` | Membership start date |
| `membership_end_date` | Membership end date |
| `hdr` | `true` / `false` — Habilitation à Diriger des Recherches |
| `localisation` | Campus / site |

A public demo document is available at: `bWVMq9SHJes7ngCuHsN9iD`

Set `VITE_GRIST_DOC_ID=bWVMq9SHJes7ngCuHsN9iD` and `VITE_GRIST_RESEARCHERS_TABLE=Annuaire_chercheursNU_Annuaire_1_` to try the demo (read-only, no API key needed).

## Authentication

By default authentication is disabled (`DRUID_AUTH_ENABLED=false`). To enable Keycloak:

```
DRUID_AUTH_ENABLED=true
KEYCLOAK_URL=https://your-keycloak:8080
KEYCLOAK_REALM=your-realm
KEYCLOAK_CLIENT_ID=druid
SESSION_SECRET=<random-string>
APP_URL=https://your-druid-public-url
```

## LDAP enrichment (optional)

When configured, the "Sync LDAP" button enriches researcher records with live LDAP data (status, civility, birth date, EPPN) and caches the result in `ldap_status_cache.json`.

```
LDAP_URL=ldaps://your-ldap-server
LDAP_BIND_DN=cn=service,ou=Applications,dc=example,dc=fr
LDAP_BIND_PW=your-password
LDAP_BASE_DN=ou=People,dc=example,dc=fr
LDAP_FILTER=(&(objectClass=supannPerson)(population=PERSONNEL))
```

## CSV export for SoVisu+ / CRISalid

The "Synchroniser avec SoVisu+" button builds a `people.csv` file and triggers a browser download. This file can be loaded into the CRISalid data pipeline.

## License

[EUPL-1.2](https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12)
