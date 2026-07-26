/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEXIE_CLOUD_URL?: string
  /** Production site origin without trailing slash (canonical + Open Graph URLs). */
  readonly VITE_SITE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
