declare namespace NodeJS {
  interface ProcessEnv {
    DATABASE_URL: string;
    NODE_ENV: "development" | "production" | "test";
    NEXTAUTH_SECRET: string;
    NEXTAUTH_URL: string;
    GOOGLE_PLACES_API_KEY: string;
    UPLOAD_MAX_SIZE: string;
    UPLOAD_DIR: string;
    APP_NAME: string;
    APP_VERSION: string;
  }
}