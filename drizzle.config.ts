import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: "postgresql://neondb_owner:npg_BOY7iGsWAt4c@ep-wild-math-amwnl30t-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
  },
});