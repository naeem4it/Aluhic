import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function fixDb() {
  console.log("Fixing missing columns in users table...");
  const queries = [
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin BOOLEAN NOT NULL DEFAULT false;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN NOT NULL DEFAULT false;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS territory TEXT;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id VARCHAR;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_active TEXT NOT NULL DEFAULT 'trial';`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMP;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url VARCHAR;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS account_type_id VARCHAR;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS role_id VARCHAR;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id VARCHAR;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type TEXT NOT NULL DEFAULT 'individual';`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`
  ];

  for (const q of queries) {
    try {
      await db.execute(sql.raw(q));
      console.log(`Executed: ${q}`);
    } catch (e: any) {
      console.log(`Skipped (or error): ${e.message}`);
    }
  }

  console.log("Done fixing users table!");
  process.exit(0);
}

fixDb();
