import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "mysql",
  dbCredentials: {
    url: 'mysql://4W2CMgAo8hPpomX.root:3CGJJ5uW5cw4UWqO@gateway01.eu-central-1.prod.aws.tidbcloud.com:4000/test?ssl={\"rejectUnauthorized\":true}',
  },
});
