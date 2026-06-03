/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NEXT_PUBLIC_API_BASE?: string;
  readonly NEXT_PUBLIC_API_PORT?: string;
  readonly NEXT_PUBLIC_BASE_DOMAIN?: string;
  readonly NEXT_PUBLIC_FRONTEND_PORT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
