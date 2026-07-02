import { db } from "./server/db";
import { users } from "./shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function createAdmin() {
  const email = "naeem4it@gmail.com";
  const password = "#0321Blouch";
  
  console.log("Hashing password...");
  const passwordHash = await bcrypt.hash(password, 10);
  
  console.log("Checking if user exists...");
  const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
  
  if (existingUser.length > 0) {
    console.log("User found, updating to super admin...");
    await db.update(users).set({
      passwordHash,
      isSuperAdmin: true,
      role: "super_admin",
      userType: "super_admin",
      isEmailVerified: true
    }).where(eq(users.email, email));
    console.log("Admin user successfully updated!");
  } else {
    console.log("Creating new super admin user...");
    await db.insert(users).values({
      email,
      passwordHash,
      firstName: "Naeem",
      lastName: "Super Admin",
      isSuperAdmin: true,
      role: "super_admin",
      userType: "super_admin",
      isEmailVerified: true
    });
    console.log("Admin user successfully created!");
  }
  
  process.exit(0);
}

createAdmin().catch((err) => {
  console.error("Failed to create admin:", err);
  process.exit(1);
});
