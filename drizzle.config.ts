import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./app/**/schema.ts",
  out: "./app/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
