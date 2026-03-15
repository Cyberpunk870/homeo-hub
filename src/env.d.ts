/// <reference types="astro/client" />
/// <reference path="../.astro/types.d.ts" />

import "react-router-dom";

type PageMetadata = {
  pageIdentifier?: string;
};

declare const Astro: Readonly<import("astro").AstroGlobal>;

declare global {
  interface SDKTypeMode {
    strict: true;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  interface ImportMetaEnv {
    readonly BASE_NAME: string;
    readonly PUBLIC_DATA_BACKEND?: string;
    readonly PUBLIC_APP_NAME?: string;
  }
}

declare module "react-router-dom" {
  export interface IndexRouteObject {
    routeMetadata?: PageMetadata;
  }
  export interface NonIndexRouteObject {
    routeMetadata?: PageMetadata;
  }
}
