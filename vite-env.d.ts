/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GRIST_API_KEY: string
  readonly VITE_GRIST_DOC_ID: string
  readonly VITE_KEYCLOAK_URL: string
  readonly VITE_KEYCLOAK_REALM: string
  readonly VITE_KEYCLOAK_CLIENT_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
