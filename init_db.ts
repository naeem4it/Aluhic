import pkg from "pg";
const { Client } = pkg;

async function initDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error("DATABASE_URL is not defined in .env");
    process.exit(1);
  }

  try {
    const url = new URL(dbUrl);
    const targetDbName = url.pathname.replace(/^\//, "") || "aluhicdb";
    
    // Connect to the default 'postgres' maintenance database first
    url.pathname = "/postgres";
    const client = new Client({ connectionString: url.toString() });

    console.log(`Connecting to PostgreSQL to check database "${targetDbName}"...`);
    await client.connect();

    const checkRes = await client.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [targetDbName]
    );

    if (checkRes.rows.length === 0) {
      console.log(`Database "${targetDbName}" does not exist. Creating it now...`);
      await client.query(`CREATE DATABASE "${targetDbName}"`);
      console.log(` Database "${targetDbName}" created successfully!`);
    } else {
      console.log(` Database "${targetDbName}" already exists.`);
    }

    await client.end();
    process.exit(0);
  } catch (err: any) {
    console.error(" Failed to initialize database:", err.message);
    process.exit(1);
  }
}

initDatabase();
