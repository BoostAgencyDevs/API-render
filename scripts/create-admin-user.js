require("dotenv").config({ path: "../.env" });
const User = require("../models/User");
const { testConnection } = require("../config/database");

async function createAdmin() {
  console.log("\n🔧 Creando usuario administrador...\n");

  try {
    // Probar conexión
    await testConnection();

    // Verificar si ya existe
    const existing = await User.findByEmail("admin@boostagency.com");

    if (existing) {
      console.log("⚠️  Usuario admin ya existe. Eliminando...");
      await User.deleteHard(existing.id);
    }

    // Crear nuevo admin
    const admin = await User.create({
      email: "eixond@gmail.com",
      password: "12345678", // El modelo lo hasheará automáticamente
      full_name: "Administrador Boost Agency",
      role: "admin",
      phone: null,
    });

    console.log("✅ Usuario admin creado exitosamente!\n");
    console.log("Email:", admin.email);
    console.log("Nombre:", admin.full_name);
    console.log("Rol:", admin.role);
    console.log("ID:", admin.id);
    console.log("\n📝 Credenciales para Postman:");
    console.log("Email: admin@boostagency.com");
    console.log("Password: Admin123!");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

createAdmin();
