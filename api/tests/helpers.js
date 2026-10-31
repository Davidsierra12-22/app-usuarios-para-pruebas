// ============================================================
// 🛠️ Helpers de pruebas de la API
// Funciones auxiliares para crear usuarios y generar tokens
// ============================================================

import Usuario from "../models/usuario.js";
import { generarJWT } from "../helpers/generar-jwt.js";

let contador = 1;

/**
 * Crea un usuario en la base de datos en memoria para pruebas
 */
export const crearUsuario = async (datos = {}) => {
  contador++;
  const usuario = new Usuario({
    nombre: datos.nombre ?? `Usuario Prueba ${contador}`,
    email: datos.email ?? `test_${contador}_${Date.now()}@demo.com`,
    password: datos.password ?? "Password123!",
    rol: datos.rol ?? "usuario",
    estado: datos.estado ?? true,
  });
  await usuario.save();
  return usuario;
};

/**
 * Crea un usuario administrador y devuelve su token JWT
 */
export const tokenAdmin = async (datos = {}) => {
  const admin = await crearUsuario({
    nombre: datos.nombre ?? `Admin Prueba ${contador}`,
    email: datos.email ?? `admin_${contador}_${Date.now()}@demo.com`,
    password: datos.password ?? "Admin123!",
    rol: "admin",
    estado: true,
  });
  return generarJWT(admin);
};

/**
 * Crea un usuario estándar y devuelve su token JWT
 */
export const tokenUsuario = async (datos = {}) => {
  const usuario = await crearUsuario({
    nombre: datos.nombre ?? `Usuario Normal ${contador}`,
    email: datos.email ?? `user_${contador}_${Date.now()}@demo.com`,
    password: datos.password ?? "Usuario123!",
    rol: "usuario",
    estado: true,
  });
  return generarJWT(usuario);
};

/**
 * Helper para generar token a partir de cualquier usuario existente
 */
export const obtenerToken = (usuario) => generarJWT(usuario);
