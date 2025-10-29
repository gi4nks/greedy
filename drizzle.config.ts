import { defineConfig } from "drizzle-kit";
import path from "path";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: path.resolve(process.cwd(), "database/campaign.db"),
  },
});
