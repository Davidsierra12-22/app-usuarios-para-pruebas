// ============================================================
// 🧪 Setup de pruebas de la API
// Inicia MongoDB en memoria con mongodb-memory-server,
// conecta Mongoose antes de todas las pruebas,
// vacía la colección antes de cada prueba y desconecta al final.
// ============================================================

import { beforeAll, afterEach, afterAll, expect } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server-core";
import Usuario from "../models/usuario.js";

let mongoServer;

// Los componentes, las E2E HTTP y dos pruebas del modelo guardan documentos.
const requiereMongo = () => {
  const testPath = expect.getState().testPath ?? "";
  return (
    /[\\/]tests[\\/](componentes|e2e)[\\/]/.test(testPath) ||
    /[\\/]tests[\\/]unitarias[\\/]usuario\.model\.test\.js$/.test(testPath)
  );
};

beforeAll(async () => {
  if (!requiereMongo()) return;
  // Crea el servidor de base de datos en memoria para pruebas
  mongoServer = await MongoMemoryServer.create({
    binary: { version: process.env.MONGOMS_VERSION ?? "6.0.6" },
  });
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  if (!requiereMongo()) return;
  // Cada prueba es independiente: se vacía la colección de usuarios
  if (mongoose.connection.readyState === 1) {
    await Usuario.deleteMany({});
  }
});

afterAll(async () => {
  if (!requiereMongo()) return;
  // Cierre limpio de conexión y servidor en memoria
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});
