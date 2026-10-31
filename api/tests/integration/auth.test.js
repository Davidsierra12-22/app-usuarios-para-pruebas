// ============================================================
// 🧪 Pruebas de integración: Autenticación (/api/auth)
// Valida registro, login, perfil y cambio de contraseña con Supertest
// ============================================================

import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { crearUsuario, tokenUsuario, obtenerToken } from "../helpers.js";

describe("Integración: Endpoints de Autenticación (/api/auth)", () => {
  // ------------------------------------------------------------
  // POST /api/auth/registro
  // ------------------------------------------------------------
  describe("POST /api/auth/registro", () => {
    it("con datos válidos devuelve 201, token, rol 'usuario' (aunque se envíe 'admin') y sin password", async () => {
      const nuevoUsuario = {
        nombre: "Juan Perez",
        email: "juan_reg_valido@ejemplo.com",
        password: "Password123!",
        rol: "admin", // El registro público debe ignorar esto y forzar rol 'usuario'
      };

      const res = await request(app).post("/api/auth/registro").send(nuevoUsuario);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty("token");
      expect(res.body).toHaveProperty("usuario");
      expect(res.body.usuario.rol).toBe("usuario");
      expect(res.body.usuario.email).toBe("juan_reg_valido@ejemplo.com");
      expect(res.body.usuario.password).toBeUndefined();
      expect(res.body.usuario).toHaveProperty("uid");
    });

    it("con email ya registrado responde 400 con error en el path 'email'", async () => {
      // Crear primero un usuario con ese email
      await crearUsuario({ email: "duplicado@ejemplo.com" });

      const res = await request(app).post("/api/auth/registro").send({
        nombre: "Otro Usuario",
        email: "duplicado@ejemplo.com",
        password: "Password123!",
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errores");
      const errorEmail = res.body.errores.find((e) => e.path === "email");
      expect(errorEmail).toBeDefined();
      expect(errorEmail.msg).toBe("Ese email ya está registrado");
    });

    it("con contraseña sin mayúscula responde 400", async () => {
      const res = await request(app).post("/api/auth/registro").send({
        nombre: "Test Password",
        email: "test_sin_mayus@ejemplo.com",
        password: "password123", // sin mayúscula
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errores");
      const errorPass = res.body.errores.find((e) => e.path === "password");
      expect(errorPass).toBeDefined();
    });

    it("con contraseña con menos de 8 caracteres responde 400", async () => {
      const res = await request(app).post("/api/auth/registro").send({
        nombre: "Test Password",
        email: "test_corta@ejemplo.com",
        password: "Abc1", // menos de 8 caracteres
      });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errores");
      const errorPass = res.body.errores.find((e) => e.path === "password");
      expect(errorPass).toBeDefined();
    });
  });

  // ------------------------------------------------------------
  // POST /api/auth/login
  // ------------------------------------------------------------
  describe("POST /api/auth/login", () => {
    it("con credenciales correctas responde 200 y devuelve token y usuario con uid", async () => {
      await crearUsuario({
        email: "login_ok@demo.com",
        password: "Password123!",
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "login_ok@demo.com",
        password: "Password123!",
      });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("token");
      expect(res.body).toHaveProperty("usuario");
      expect(res.body.usuario).toHaveProperty("uid");
      expect(res.body.usuario.password).toBeUndefined();
    });

    it("con contraseña incorrecta responde 401 con mensaje 'Credenciales inválidas'", async () => {
      await crearUsuario({
        email: "clave_mala@demo.com",
        password: "Password123!",
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "clave_mala@demo.com",
        password: "PasswordIncorrecta999!",
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Credenciales inválidas");
    });

    it("con email inexistente responde 401 con el mismo mensaje 'Credenciales inválidas'", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: "no_existe_email@demo.com",
        password: "Password123!",
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Credenciales inválidas");
    });

    it("con usuario desactivado (estado: false) responde 401 con 'Usuario desactivado'", async () => {
      await crearUsuario({
        email: "desactivado@demo.com",
        password: "Password123!",
        estado: false,
      });

      const res = await request(app).post("/api/auth/login").send({
        email: "desactivado@demo.com",
        password: "Password123!",
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Usuario desactivado");
    });
  });

  // ------------------------------------------------------------
  // GET /api/auth/perfil
  // ------------------------------------------------------------
  describe("GET /api/auth/perfil", () => {
    it("sin token responde 401", async () => {
      const res = await request(app).get("/api/auth/perfil");
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("No hay token en la petición");
    });

    it("con token inválido responde 401", async () => {
      const res = await request(app)
        .get("/api/auth/perfil")
        .set("x-token", "token-inventado-invalido");

      expect(res.status).toBe(401);
      expect(res.body.error).toBe("Token no válido o expirado");
    });

    it("con token válido responde 200 y los datos del perfil", async () => {
      const usuario = await crearUsuario({
        nombre: "Perfil Valido",
        email: "perfil_valido@demo.com",
      });
      const token = obtenerToken(usuario);

      const res = await request(app).get("/api/auth/perfil").set("x-token", token);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe(usuario.email);
    });
  });

  // ------------------------------------------------------------
  // PUT /api/auth/perfil
  // ------------------------------------------------------------
  describe("PUT /api/auth/perfil", () => {
    it("permite actualizar el nombre del usuario autenticado y responde 200", async () => {
      const usuario = await crearUsuario({
        nombre: "Nombre Viejo",
        email: "editar_perfil@demo.com",
      });
      const token = obtenerToken(usuario);

      const res = await request(app)
        .put("/api/auth/perfil")
        .set("x-token", token)
        .send({ nombre: "Nombre Nuevo" });

      expect(res.status).toBe(200);
      expect(res.body.nombre).toBe("Nombre Nuevo");
    });
  });

  // ------------------------------------------------------------
  // PUT /api/auth/password
  // ------------------------------------------------------------
  describe("PUT /api/auth/password", () => {
    it("con contraseña actual incorrecta responde 400", async () => {
      const usuario = await crearUsuario({
        email: "cambio_pass_err@demo.com",
        password: "PasswordActual123!",
      });
      const token = obtenerToken(usuario);

      const res = await request(app)
        .put("/api/auth/password")
        .set("x-token", token)
        .send({
          passwordActual: "Incorrecta123!",
          passwordNueva: "NuevaPassword456!",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("La contraseña actual no es correcta");
    });

    it("con contraseña nueva igual a la actual responde 400", async () => {
      const usuario = await crearUsuario({
        email: "misma_pass@demo.com",
        password: "PasswordActual123!",
      });
      const token = obtenerToken(usuario);

      const res = await request(app)
        .put("/api/auth/password")
        .set("x-token", token)
        .send({
          passwordActual: "PasswordActual123!",
          passwordNueva: "PasswordActual123!",
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("La nueva contraseña debe ser distinta de la actual");
    });

    it("con cambio correcto responde 200 y luego el login funciona con la nueva contraseña", async () => {
      const usuario = await crearUsuario({
        email: "cambio_exitoso@demo.com",
        password: "PasswordVieja123!",
      });
      const token = obtenerToken(usuario);

      const resCambio = await request(app)
        .put("/api/auth/password")
        .set("x-token", token)
        .send({
          passwordActual: "PasswordVieja123!",
          passwordNueva: "PasswordNueva999!",
        });

      expect(resCambio.status).toBe(200);
      expect(resCambio.body.mensaje).toBe("Contraseña actualizada");

      // Comprobar que el login funciona con la nueva contraseña
      const resLogin = await request(app).post("/api/auth/login").send({
        email: "cambio_exitoso@demo.com",
        password: "PasswordNueva999!",
      });

      expect(resLogin.status).toBe(200);
      expect(resLogin.body).toHaveProperty("token");
    });
  });
});
