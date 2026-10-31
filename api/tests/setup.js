// ============================================================
// 🧪 Setup de pruebas de la API
// Inicia MongoDB en memoria con mongodb-memory-server,
// conecta Mongoose antes de todas las pruebas,
// vacía la colección antes de cada prueba y desconecta al final.
// ============================================================

import { beforeAll, afterEach, afterAll } from "vitest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Usuario from "../models/usuario.js";

let mongoServer;

beforeAll(async () => {
  // Crea el servidor de base de datos en memoria para pruebas
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  // Cada prueba es independiente: se vacía la colección de usuarios
  if (mongoose.connection.readyState === 1) {
    await Usuario.deleteMany({});
  }
});

afterAll(async () => {
  // Cierre limpio de conexión y servidor en memoria
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
});
