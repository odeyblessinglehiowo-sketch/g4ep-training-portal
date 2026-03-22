import "dotenv/config";
import { defineConfig } from "prisma/config";
export const dynamic = "force-dynamic";
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
});