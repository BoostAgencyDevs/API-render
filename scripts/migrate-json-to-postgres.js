/**
 * @fileoverview Script de migración de JSON a PostgreSQL
 *
 * Este script migra TODOS los datos de tus archivos JSON a PostgreSQL:
 * - contenido.json → tabla content
 * - servicios.json → tabla services
 * - blog.json → tabla blog_posts
 * - planes.json → tabla plans
 * - tienda.json → tabla products (con categorías)
 * - fundacion.json → tabla foundation
 * - leads.json → tabla leads
 * - users.json → tabla users (si existe)
 *
 * USO:
 * node scripts/migrate-json-to-postgres.js
 *
 * @author Boost Agency Development Team
 * @version 1.0.0
 */
require("dotenv").config();

// AGREGAR ESTAS LÍNEAS PARA DEBUG:
console.log("🔍 Variables de entorno cargadas:");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_USER:", process.env.DB_USER);
console.log(
  "DB_PASSWORD:",
  process.env.DB_PASSWORD ? "***[CONFIGURADA]***" : "❌ FALTA"
);
console.log("");

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const { pool, query } = require("../config/database");
const {
  User,
  Lead,
  Content,
  Service,
  BlogPost,
  Plan,
  Product,
} = require("../models");

// Colores para la consola
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Lee un archivo JSON
 */
function readJSON(filePath) {
  try {
    const fullPath = path.join(__dirname, "..", filePath);
    if (!fs.existsSync(fullPath)) {
      log(`⚠️  Archivo no encontrado: ${filePath}`, "yellow");
      return null;
    }
    const data = fs.readFileSync(fullPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    log(`❌ Error leyendo ${filePath}: ${error.message}`, "red");
    return null;
  }
}

/**
 * 1. Migrar Usuario Administrador
 */
async function migrateAdmin() {
  log("\n📝 Paso 1: Creando usuario administrador...", "blue");

  try {
    // Verificar si ya existe un admin
    const existing = await User.findByEmail("admin@boostagency.com");

    if (existing) {
      log("✅ Usuario admin ya existe, saltando...", "green");
      return existing.id;
    }

    // Crear admin
    const admin = await User.create({
      email: "eixond@gmail.com",
      password: "admin321", // CAMBIAR DESPUÉS DEL PRIMER LOGIN
      full_name: "eixon de la torres",
      role: "admin",
      phone: null,
    });

    log(`✅ Usuario admin creado: ${admin.email}`, "green");
    log(
      `⚠️  IMPORTANTE: Cambia la contraseña después del primer login`,
      "yellow"
    );

    return admin.id;
  } catch (error) {
    log(`❌ Error creando admin: ${error.message}`, "red");
    throw error;
  }
}

/**
 * 2. Migrar Contenido (inicio, nosotros, contacto, footer, fundacion)
 */
async function migrateContent(adminId) {
  log("\n📝 Paso 2: Migrando contenido...", "blue");

  try {
    // Migrar contenido.json
    const contenido = readJSON("content/formularios/contenido.json");
    if (contenido) {
      // Migrar cada sección
      for (const [key, value] of Object.entries(contenido)) {
        await Content.upsert({
          section_key: key,
          section_name: key.charAt(0).toUpperCase() + key.slice(1),
          content_data: value,
          status: "published",
          updated_by: adminId,
        });
        log(`  ✅ Migrado: ${key}`, "green");
      }
    }

    // Migrar fundacion.json
    const fundacion = readJSON("content/formularios/fundacion.json");
    if (fundacion && fundacion.fundacion) {
      await Content.upsert({
        section_key: "fundacion",
        section_name: "Fundación BOOST",
        content_data: fundacion.fundacion,
        status: "published",
        updated_by: adminId,
      });
      log(`  ✅ Migrado: fundacion`, "green");
    }

    log("✅ Contenido migrado exitosamente", "green");
  } catch (error) {
    log(`❌ Error migrando contenido: ${error.message}`, "red");
    throw error;
  }
}

/**
 * 3. Migrar Servicios
 */
async function migrateServices(adminId) {
  log("\n📝 Paso 3: Migrando servicios...", "blue");

  try {
    const data = readJSON("content/formularios/servicios.json");
    if (!data || !data.servicios) {
      log("⚠️  No hay servicios para migrar", "yellow");
      return;
    }

    const servicios = await Service.importFromJSON(data.servicios, adminId);
    log(`✅ ${servicios.length} servicios migrados`, "green");
  } catch (error) {
    log(`❌ Error migrando servicios: ${error.message}`, "red");
    throw error;
  }
}

/**
 * 4. Migrar Blog/Podcast
 */
async function migrateBlog(adminId) {
  log("\n📝 Paso 4: Migrando episodios de podcast...", "blue");

  try {
    const data = readJSON("content/formularios/blog.json");
    if (!data || !data.episodios) {
      log("⚠️  No hay episodios para migrar", "yellow");
      return;
    }

    // Migrar info general del podcast
    if (data.boostcast) {
      await Content.upsert({
        section_key: "boostcast",
        section_name: "Podcast BOOSTCAST",
        content_data: data.boostcast,
        status: "published",
        updated_by: adminId,
      });
      log(`  ✅ Info del podcast migrada`, "green");
    }

    // Migrar episodios
    const episodios = await BlogPost.importFromJSON(data.episodios, adminId);
    log(`✅ ${episodios.length} episodios migrados`, "green");
  } catch (error) {
    log(`❌ Error migrando blog: ${error.message}`, "red");
    throw error;
  }
}

/**
 * 5. Migrar Planes
 */
async function migratePlans() {
  log("\n📝 Paso 5: Migrando planes...", "blue");

  try {
    const data = readJSON("content/formularios/planes.json");
    if (!data || !data.planes) {
      log("⚠️  No hay planes para migrar", "yellow");
      return;
    }

    const planes = await Plan.importFromJSON(data.planes);
    log(`✅ ${planes.length} planes migrados`, "green");

    // Migrar beneficios y FAQs
    if (data.beneficios_generales || data.preguntas_frecuentes) {
      await Content.upsert({
        section_key: "planes_info",
        section_name: "Información de Planes",
        content_data: {
          beneficios: data.beneficios_generales || [],
          faqs: data.preguntas_frecuentes || [],
        },
        status: "published",
        updated_by: null,
      });
      log(`  ✅ Info adicional de planes migrada`, "green");
    }
  } catch (error) {
    log(`❌ Error migrando planes: ${error.message}`, "red");
    throw error;
  }
}

/**
 * 6. Migrar Tienda (Categorías + Productos)
 */
async function migrateTienda() {
  log("\n📝 Paso 6: Migrando tienda (categorías + productos)...", "blue");

  try {
    const data = readJSON("content/formularios/tienda.json");
    if (!data) {
      log("⚠️  No hay datos de tienda para migrar", "yellow");
      return;
    }

    // Primero crear las categorías
    const categoriesMap = {};
    if (data.categorias) {
      for (const cat of data.categorias) {
        const sql = `
          INSERT INTO categories (name, slug, description, type)
          VALUES ($1, $2, $3, 'product')
          ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
          RETURNING id, slug
        `;
        const result = await query(sql, [cat.nombre, cat.id, cat.descripcion]);
        categoriesMap[cat.id] = result.rows[0].id;
        log(`  ✅ Categoría: ${cat.nombre}`, "green");
      }
    }

    // Migrar productos
    if (data.productos) {
      const productos = await Product.importFromJSON(
        data.productos,
        categoriesMap
      );
      log(`✅ ${productos.length} productos migrados`, "green");
    }

    // Migrar info adicional de la tienda
    if (data.beneficios_compra || data.metodos_pago) {
      await Content.upsert({
        section_key: "tienda_info",
        section_name: "Información de Tienda",
        content_data: {
          beneficios: data.beneficios_compra || [],
          metodos_pago: data.metodos_pago || [],
        },
        status: "published",
        updated_by: null,
      });
      log(`  ✅ Info adicional de tienda migrada`, "green");
    }
  } catch (error) {
    log(`❌ Error migrando tienda: ${error.message}`, "red");
    throw error;
  }
}

/**
 * 7. Migrar Leads
 */
async function migrateLeads() {
  log("\n📝 Paso 7: Migrando leads...", "blue");

  try {
    const data = readJSON("content/formularios/leads.json");
    if (!data || !data.leads) {
      log("⚠️  No hay leads para migrar", "yellow");
      return;
    }

    let migratedCount = 0;
    for (const lead of data.leads) {
      try {
        await Lead.create({
          nombre: lead.nombre,
          email: lead.email,
          telefono: lead.telefono,
          empresa: lead.empresa || "",
          servicio_interes: lead.servicio_interes,
          presupuesto: lead.presupuesto || "",
          mensaje: lead.mensaje || "",
          origen: lead.origen || "formulario-web",
        });

        // Actualizar estado si no es 'nuevo'
        if (lead.estado && lead.estado !== "nuevo") {
          const result = await query(
            "UPDATE leads SET estado = $1 WHERE email = $2 RETURNING id",
            [lead.estado, lead.email]
          );
          if (result.rows.length > 0) {
            await query("UPDATE leads SET fecha = $1 WHERE id = $2", [
              lead.fecha,
              result.rows[0].id,
            ]);
          }
        }

        migratedCount++;
      } catch (error) {
        // Si hay error (ej: duplicate email), continuar con el siguiente
        log(`  ⚠️  Error con lead ${lead.email}: ${error.message}`, "yellow");
      }
    }

    log(`✅ ${migratedCount} leads migrados`, "green");
  } catch (error) {
    log(`❌ Error migrando leads: ${error.message}`, "red");
    throw error;
  }
}

/**
 * 8. Migrar Plataformas de Podcast
 */
async function migratePodcastPlatforms() {
  log("\n📝 Paso 8: Migrando plataformas de podcast...", "blue");

  try {
    const data = readJSON("content/formularios/blog.json");
    if (!data || !data.boostcast || !data.boostcast.plataformas) {
      log("⚠️  No hay plataformas para migrar", "yellow");
      return;
    }

    for (let i = 0; i < data.boostcast.plataformas.length; i++) {
      const platform = data.boostcast.plataformas[i];
      await query(
        `
        INSERT INTO podcast_platforms (name, link, icon_class, display_order, is_active)
        VALUES ($1, $2, $3, $4, true)
        ON CONFLICT (name) DO UPDATE SET link = EXCLUDED.link
      `,
        [platform.nombre, platform.link, platform.icono, i + 1]
      );

      log(`  ✅ Plataforma: ${platform.nombre}`, "green");
    }

    log(`✅ Plataformas de podcast migradas`, "green");
  } catch (error) {
    log(`❌ Error migrando plataformas: ${error.message}`, "red");
    throw error;
  }
}

/**
 * 9. Verificar migración
 */
async function verifyMigration() {
  log("\n📝 Paso 9: Verificando migración...", "blue");

  try {
    const checks = [
      { table: "users", name: "Usuarios" },
      { table: "content", name: "Contenido" },
      { table: "services", name: "Servicios" },
      { table: "blog_posts", name: "Episodios" },
      { table: "plans", name: "Planes" },
      { table: "categories", name: "Categorías" },
      { table: "products", name: "Productos" },
      { table: "leads", name: "Leads" },
      { table: "podcast_platforms", name: "Plataformas" },
    ];

    log("\n📊 Resumen de la migración:", "blue");
    log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "blue");

    for (const check of checks) {
      const result = await query(`SELECT COUNT(*) FROM ${check.table}`);
      const count = parseInt(result.rows[0].count);
      log(
        `  ${check.name.padEnd(20)} : ${count} registros`,
        count > 0 ? "green" : "yellow"
      );
    }

    log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n", "blue");
  } catch (error) {
    log(`❌ Error verificando migración: ${error.message}`, "red");
  }
}

/**
 * Función principal
 */
async function migrate() {
  log("\n╔════════════════════════════════════════╗", "blue");
  log("║  MIGRACIÓN JSON → POSTGRESQL           ║", "blue");
  log("║  Boost Agency API v2.0                 ║", "blue");
  log("╚════════════════════════════════════════╝\n", "blue");

  try {
    // Verificar conexión a la base de datos
    await pool.query("SELECT NOW()");
    log("✅ Conexión a PostgreSQL exitosa\n", "green");

    // Confirmar antes de continuar
    log(
      "⚠️  ADVERTENCIA: Este script migrará todos los datos de JSON a PostgreSQL",
      "yellow"
    );
    log("⚠️  Si ya existen datos, algunos podrían ser reemplazados", "yellow");
    log(
      "\nPresiona Ctrl+C para cancelar o espera 5 segundos para continuar...",
      "yellow"
    );

    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Ejecutar migración
    const startTime = Date.now();

    const adminId = await migrateAdmin();
    await migrateContent(adminId);
    await migrateServices(adminId);
    await migrateBlog(adminId);
    await migratePlans();
    await migrateTienda();
    await migrateLeads();
    await migratePodcastPlatforms();
    await verifyMigration();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━", "green");
    log(`✅ MIGRACIÓN COMPLETADA EN ${duration}s`, "green");
    log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n", "green");

    log("📝 SIGUIENTES PASOS:", "blue");
    log("1. Verificar los datos en PostgreSQL", "yellow");
    log("2. Cambiar la contraseña del admin: admin@boostagency.com", "yellow");
    log("3. Probar los endpoints de la API", "yellow");
    log("4. Hacer backup de los archivos JSON originales", "yellow");
    log("5. Actualizar tu dashboard para usar la nueva API\n", "yellow");

    process.exit(0);
  } catch (error) {
    log("\n❌ ERROR EN LA MIGRACIÓN:", "red");
    log(error.message, "red");
    log("\nStack trace:", "red");
    console.error(error);
    process.exit(1);
  }
}

// Ejecutar migración
migrate();
