# Druid — Directory for Researchers, Units & Identifiers

**Druid** is a web application for managing and browsing an institution's research directory: researchers, labs, and structures — all driven by a [Grist](https://grist.numerique.gouv.fr) spreadsheet.

---

## Try the demo

| | |
|---|---|
| **Live app** | [guillaumegodet.github.io/Druid](https://guillaumegodet.github.io/Druid) |
| **Demo Grist document** | [Demo-Druid on grist.numerique.gouv.fr](https://grist.numerique.gouv.fr/o/docs/bWVMq9SHJes7/Demo-Druid) |

The live app connects directly to the public Grist document (read-only, no account needed). Open it, browse researchers and structures, use the filters, and click **Synchroniser → Synchroniser avec SoVisu+** to download a sample `people.csv` export.

To edit data, open the Grist document and modify the `Demo_data_researchers` or `Demo_data_structures` tables — the app will pick up the changes on the next sync.

---

## What it does

- Browse and filter researchers and research structures loaded from Grist
- Filter by status, employer, lab, grade, contract type, location, identifier presence
- Edit researcher and structure records and write changes back to Grist
- Manage structure memberships (inclusions / supervisions) in the **Appartenances** tab
- Visualise the structure hierarchy (inclusions / participations) in the structures **Dataviz** tab
- Align researchers with their [IdRef](https://www.idref.fr) authority record via **Synchroniser → Aligner / Vérifier IdRef** (propose → review → apply: fill missing IdRefs, arbitrate ambiguous matches and name discrepancies, enrich ORCID / IdHAL)
- Export the directory as `people.csv` for [CRISalid](https://crisalid.org) / SoVisu+
- Optional LDAP enrichment (status, civility, birth date, EPPN)
- Optional Keycloak authentication

---

## Deploy your own instance

### 1. Prepare your Grist document

Import the provided CSV files into a new Grist document:

- `demo-data-researchers.csv` → table for researchers
- `demo-data-structuresv2.csv` → table for structures (CRISalid V2 schema, with `inclusions` / `participations` columns)

> The structures **Dataviz** tab embeds a pre-generated hierarchy
> (`public/structures-hierarchy.html`). It is a static asset built from
> `demo-data-structuresv2.csv` (so it works on GitHub Pages without a server).
> After changing the structures data, regenerate it with `npm run gen:hierarchy`

> **IdRef alignment** uses a pre-computed sample cache
> (`public/idref_align_cache.json`) instead of live calls to idref.fr, which the
> browser cannot reach from GitHub Pages (CORS). On the static demo the **Apply**
> button updates the view in memory only (the demo Grist document is read-only).
> The "enrich IdHAL" example in *Vérifier IdRef* assumes the latest
> `demo-data-researchers.csv` (one record has a blank `idhals`) — re-import it if
> your Grist table predates this.
> (requires `python3`, standard library only).

Note the document ID from the URL (e.g. `bWVMq9SHJes7ngCuHsN9iD`) and the table names.

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_GRIST_DOC_ID=<your-grist-doc-id>
VITE_GRIST_RESEARCHERS_TABLE=<researchers-table-name>
VITE_GRIST_STRUCTURES_TABLE=<structures-table-name>
```

### 3. Run with Docker Compose

```bash
docker compose up --build
```

Open http://localhost:3000.

### 4. Run without Docker

```bash
npm install
npm run build
node server.cjs
```

### 5. Deploy as a static site (GitHub Pages)

Set `VITE_BASE=/your-repo-name/` in your GitHub Actions workflow and enable GitHub Pages (Actions deployment). No server required — the app connects to Grist directly from the browser.

---

## Grist document schema

### Researchers table

| Column | Description |
|---|---|
| `tracking_id` | Internal UID |
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

---

## Authentication

Disabled by default (`DRUID_AUTH_ENABLED=false`). To enable Keycloak:

```
DRUID_AUTH_ENABLED=true
KEYCLOAK_URL=https://your-keycloak:8080
KEYCLOAK_REALM=your-realm
KEYCLOAK_CLIENT_ID=druid
SESSION_SECRET=<random-string>
APP_URL=https://your-druid-public-url
```

## LDAP enrichment (optional)

When configured, the **Synchroniser LDAP** button enriches researcher records with live LDAP data (status, civility, birth date, EPPN) and caches the result in `ldap_status_cache.json`.

```
LDAP_URL=ldaps://your-ldap-server
LDAP_BIND_DN=cn=service,ou=Applications,dc=example,dc=fr
LDAP_BIND_PW=your-password
LDAP_BASE_DN=ou=People,dc=example,dc=fr
LDAP_FILTER=(&(objectClass=supannPerson)(population=PERSONNEL))
```

## CSV export for SoVisu+ / CRISalid

**Synchroniser → Synchroniser avec SoVisu+** builds a `people.csv` file and triggers a browser download. This file feeds the CRISalid data pipeline.

---

## License

[EUPL-1.2](https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12)
