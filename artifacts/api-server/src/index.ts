import app from "./app";
import { logger } from "./lib/logger";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// One-time seed: set Solaf's demo password if not yet hashed.
async function seedDemoAccount() {
  try {
    const [solaf] = await db
      .select({ id: usersTable.id, passwordHash: usersTable.passwordHash })
      .from(usersTable)
      .where(eq(usersTable.id, 1));
    if (solaf && solaf.passwordHash === null) {
      const hash = await bcrypt.hash("solaf2024", 12);
      await db
        .update(usersTable)
        .set({ passwordHash: hash })
        .where(eq(usersTable.id, 1));
      logger.info("Demo account password seeded");
    }
  } catch (err) {
    logger.warn({ err }, "Could not seed demo account password");
  }
}

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
  void seedDemoAccount();
});
