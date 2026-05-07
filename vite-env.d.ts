/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GRIST_API_KEY: string
  readonly VITE_GRIST_DOC_ID: string
  readonly VITE_GRIST_RESEARCHERS_TABLE: string
  readonly VITE_GRIST_STRUCTURES_TABLE: string
  readonly VITE_GRIST_BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
