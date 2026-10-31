// ============================================================
// 🧪 Pruebas unitarias: Modelo Usuario
// Verifica hooks, validación de contraseñas y toJSON()
// ============================================================

import { describe, it, expect } from "vitest";
import Usuario from "../../models/usuario.js";

describe("Modelo Usuario", () => {
  it("el método toJSON devuelve 'uid' y oculta password, _id y __v", () => {
    const usuario = new Usuario({
      nombre: "Carlos Pruebas",
      email: "carlos@demo.com",
      password: "Password123!",
      rol: "usuario",
    });

    const json = usuario.toJSON();

    expect(json.uid).toBeDefined();
    expect(json._id).toBeUndefined();
    expect(json.__v).toBeUndefined();
    expect(json.password).toBeUndefined();
    expect(json.nombre).toBe("Carlos Pruebas");
    expect(json.email).toBe("carlos@demo.com");
  });

  it("el hook pre('save') hashea la contraseña con bcrypt", async () => {
    const passwordPlana = "MiClave123!";
    const usuario = new Usuario({
      nombre: "Maria Pruebas",
      email: "maria@demo.com",
      password: passwordPlana,
      rol: "usuario",
    });

    await usuario.save();

    // La contraseña en la base de datos debe ser un hash de bcrypt, no texto plano
    expect(usuario.password).not.toBe(passwordPlana);
    expect(usuario.password.startsWith("$2")).toBe(true);
  });

  it("el método validarPassword verifica correctamente la contraseña", async () => {
    const usuario = new Usuario({
      nombre: "Pedro Pruebas",
      email: "pedro_val@demo.com",
      password: "MiSuperPassword123!",
      rol: "usuario",
    });

    await usuario.save();

    expect(usuario.validarPassword("MiSuperPassword123!")).toBe(true);
    expect(usuario.validarPassword("ClaveEquivocada")).toBe(false);
  });
});
