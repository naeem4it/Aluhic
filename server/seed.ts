import { storage } from "./storage";
import { hashPassword } from "./auth";

async function seedSuperAdmin() {
  try {
    console.log("Checking for super admin user...");
    
    const existingAdmin = await storage.getUserByEmail("naeem4it@gmail.com");
    
    if (existingAdmin) {
      console.log("Super admin user 'naeem4it@gmail.com' already exists");
      return;
    }

    console.log("Creating super admin user 'naeem4it@gmail.com'...");
    
    const passwordHash = await hashPassword("#0321Blouch");
    
    const superAdmin = await storage.createUser({
      email: "naeem4it@gmail.com",
      passwordHash,
      firstName: "Super",
      lastName: "Admin",
      userType: "super_admin",
      role: "super_admin",
      isActive: true,
      subscriptionActive: "active", // Super admin always has active subscription
    });

    console.log("Super admin user created successfully!");
    console.log("Email: naeem4it@gmail.com");
    console.log("Password: #0321Blouch");
    console.log("User ID:", superAdmin.id);
  } catch (error) {
    console.error("Error seeding super admin:", error);
    throw error;
  }
}

// Run the seed function
seedSuperAdmin()
  .then(() => {
    console.log("Seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
