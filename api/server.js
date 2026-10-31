// ============================================================
// 🚀 Servidor de la API — Conexión a la base de datos y arranque HTTP
// ============================================================

import "dotenv/config";
import app from "./app.js";
import { dbConnection } from "./database/config.js";
import { crearAdminInicial } from "./database/seed.js";

// La BD primero, el servidor después
dbConnection()
  .then(async () => {
    const admin = await crearAdminInicial();
    if (admin) console.log(`Administrador inicial creado: ${admin.email}`);

    const puerto = process.env.PUERTO ?? 3000;
    app
      .listen(puerto, () => {
        console.log(`API en http://localhost:${puerto}/api`);
      })
      .on("error", (error) => {
        console.log(`No se pudo usar el puerto ${puerto}:`, error.message);
        process.exit(1);
      });
  })
  .catch((error) => {
    console.log("No se pudo iniciar:", error.message);
  });
