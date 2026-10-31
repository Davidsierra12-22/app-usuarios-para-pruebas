// ============================================================
// 🧪 Pruebas de integración: CRUD de usuarios (/api/usuarios)
// Valida listado, filtrado, creación, edición, borrado y permisos
// ============================================================

import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app.js";
import Usuario from "../../models/usuario.js";
import { crearUsuario, tokenAdmin, tokenUsuario, obtenerToken } from "../helpers.js";

describe("Integración: Endpoints de Usuarios (/api/usuarios)", () => {
  // ------------------------------------------------------------
  // GET /api/usuarios
  // ------------------------------------------------------------
  describe("GET /api/usuarios", () => {
    it("sin token responde 401", async () => {
      const res = await request(app).get("/api/usuarios");
      expect(res.status).toBe(401);
      expect(res.body.error).toBe("No hay token en la petición");
    });

    it("con token de rol usuario responde 403 con error 'No tiene permisos para esto'", async () => {
      const token = await tokenUsuario();
      const res = await request(app).get("/api/usuarios").set("x-token", token);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("No tiene permisos para esto");
    });

    it("con token de admin responde 200 con total, pagina, limite, totalPaginas y usuarios (solo activos)", async () => {
      // Crear un usuario activo y uno inactivo
      await crearUsuario({ nombre: "Activo", email: "activo@demo.com", estado: true });
      await crearUsuario({ nombre: "Inactivo", email: "inactivo@demo.com", estado: false });

      const token = await tokenAdmin();
      const res = await request(app).get("/api/usuarios").set("x-token", token);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("total");
      expect(res.body).toHaveProperty("pagina", 1);
      expect(res.body).toHaveProperty("limite");
      expect(res.body).toHaveProperty("totalPaginas");
      expect(Array.isArray(res.body.usuarios)).toBe(true);

      // Los inactivos no deben aparecer en la lista
      const inactivoEnLista = res.body.usuarios.find((u) => u.email === "inactivo@demo.com");
      expect(inactivoEnLista).toBeUndefined();
    });

    it("GET /?limite=51 responde 400 por límite fuera de rango (máximo 50)", async () => {
      const token = await tokenAdmin();
      const res = await request(app).get("/api/usuarios?limite=51").set("x-token", token);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errores");
      const errLimite = res.body.errores.find((e) => e.path === "limite");
      expect(errLimite).toBeDefined();
    });

    it("rechaza una página menor que 1 y un rol no permitido", async () => {
      const token = await tokenAdmin();
      const pagina = await request(app)
        .get("/api/usuarios?pagina=0")
        .set("x-token", token);
      const rol = await request(app)
        .get("/api/usuarios?rol=superadmin")
        .set("x-token", token);

      expect(pagina.status).toBe(400);
      expect(pagina.body.errores.some((error) => error.path === "pagina")).toBe(true);
      expect(rol.status).toBe(400);
      expect(rol.body.errores.some((error) => error.path === "rol")).toBe(true);
    });

    it("GET /?buscar=ana&rol=usuario responde 200 con búsqueda por nombre o email combinada con filtro de rol", async () => {
      await crearUsuario({ nombre: "Ana Gomez", email: "ana.gomez@demo.com", rol: "usuario" });
      await crearUsuario({ nombre: "Ana Admin", email: "ana.admin@demo.com", rol: "admin" });
      await crearUsuario({ nombre: "Carlos Perez", email: "carlos@demo.com", rol: "usuario" });

      const token = await tokenAdmin();
      const res = await request(app)
        .get("/api/usuarios?buscar=ana&rol=usuario")
        .set("x-token", token);

      expect(res.status).toBe(200);
      expect(res.body.usuarios.length).toBe(1);
      expect(res.body.usuarios[0].email).toBe("ana.gomez@demo.com");
    });
  });

  // ------------------------------------------------------------
  // GET /api/usuarios/:id
  // ------------------------------------------------------------
  describe("GET /api/usuarios/:id", () => {
    it("con id mal formado ('abc') responde 400", async () => {
      const token = await tokenAdmin();
      const res = await request(app).get("/api/usuarios/abc").set("x-token", token);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("errores");
    });

    it("con id válido que no existe responde 404", async () => {
      const token = await tokenAdmin();
      const idInexistente = "60c72b2f9b1d8b001c8e4d2a";
      const res = await request(app).get(`/api/usuarios/${idInexistente}`).set("x-token", token);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Usuario no encontrado");
    });

    it("con id válido existente responde 200 con los datos del usuario", async () => {
      const usuario = await crearUsuario({ nombre: "Usuario Consultar", email: "consultar@demo.com" });
      const token = await tokenAdmin();

      const res = await request(app).get(`/api/usuarios/${usuario.id}`).set("x-token", token);

      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });

    it("no expone usuarios desactivados y responde 404", async () => {
      const usuario = await crearUsuario({ estado: false });
      const token = await tokenAdmin();

      const res = await request(app)
        .get(`/api/usuarios/${usuario.id}`)
        .set("x-token", token);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Usuario no encontrado");
    });
  });

  // ------------------------------------------------------------
  // POST /api/usuarios
  // ------------------------------------------------------------
  describe("POST /api/usuarios", () => {
    it("rechaza la creación si el token pertenece a un usuario estándar", async () => {
      const token = await tokenUsuario();
      const res = await request(app)
        .post("/api/usuarios")
        .set("x-token", token)
        .send({
          nombre: "Intento no autorizado",
          email: "intento@demo.com",
          password: "Password123!",
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("No tiene permisos para esto");
    });

    it("Admin crea usuario: responde 201 y la contraseña queda hasheada en la base de datos", async () => {
      const token = await tokenAdmin();
      const passwordOriginal = "PasswordCreada123!";

      const res = await request(app)
        .post("/api/usuarios")
        .set("x-token", token)
        .send({
          nombre: "Nuevo Desde Admin",
          email: "creado_admin@demo.com",
          password: passwordOriginal,
          rol: "usuario",
        });

      expect(res.status).toBe(201);
      expect(res.body.email).toBe("creado_admin@demo.com");
      expect(res.body.password).toBeUndefined();

      // Verificar en la BD directamente que la clave está hasheada
      const usuarioEnBd = await Usuario.findOne({ email: "creado_admin@demo.com" });
      expect(usuarioEnBd.password).not.toBe(passwordOriginal);
      expect(usuarioEnBd.validarPassword(passwordOriginal)).toBe(true);
    });
  });

  // ------------------------------------------------------------
  // PUT /api/usuarios/:id
  // ------------------------------------------------------------
  describe("PUT /api/usuarios/:id", () => {
    it("actualiza un usuario y hashea la nueva contraseña", async () => {
      const usuario = await crearUsuario({ password: "PasswordOriginal123!" });
      const token = await tokenAdmin();
      const nuevaPassword = "PasswordNueva456!";

      const res = await request(app)
        .put(`/api/usuarios/${usuario.id}`)
        .set("x-token", token)
        .send({ nombre: "Nombre actualizado", password: nuevaPassword });

      expect(res.status).toBe(200);
      expect(res.body.nombre).toBe("Nombre actualizado");
      expect(res.body.password).toBeUndefined();
      const actualizado = await Usuario.findById(usuario.id);
      expect(actualizado.password).not.toBe(nuevaPassword);
      expect(actualizado.validarPassword(nuevaPassword)).toBe(true);
    });

    it("responde 404 al actualizar un usuario inexistente", async () => {
      const token = await tokenAdmin();
      const res = await request(app)
        .put("/api/usuarios/60c72b2f9b1d8b001c8e4d2a")
        .set("x-token", token)
        .send({ nombre: "Sin usuario" });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Usuario no encontrado");
    });

    it("Admin intenta cambiar su propio rol responde 400 ('No puedes cambiar tu propio rol')", async () => {
      // Creamos un admin específico
      const adminPropio = await crearUsuario({
        nombre: "Super Admin",
        email: "superadmin_propio@demo.com",
        rol: "admin",
      });
      const token = obtenerToken(adminPropio);

      const res = await request(app)
        .put(`/api/usuarios/${adminPropio.id}`)
        .set("x-token", token)
        .send({ rol: "usuario" });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("No puedes cambiar tu propio rol");
    });

    it("Password vacía: no se cambia y el login sigue funcionando (responde 200)", async () => {
      const usuario = await crearUsuario({
        nombre: "Usuario Clave Intacta",
        email: "clave_intacta@demo.com",
        password: "MiClaveOriginal123!",
      });
      const token = await tokenAdmin();

      const res = await request(app)
        .put(`/api/usuarios/${usuario.id}`)
        .set("x-token", token)
        .send({
          nombre: "Nombre Modificado",
          password: "", // Contraseña vacía: se debe ignorar sin sobreescribir la original
        });

      expect(res.status).toBe(200);
      expect(res.body.nombre).toBe("Nombre Modificado");

      // Comprobar que el login sigue funcionando con la clave original
      const resLogin = await request(app).post("/api/auth/login").send({
        email: "clave_intacta@demo.com",
        password: "MiClaveOriginal123!",
      });

      expect(resLogin.status).toBe(200);
    });
  });

  // ------------------------------------------------------------
  // DELETE /api/usuarios/:id
  // ------------------------------------------------------------
  describe("DELETE /api/usuarios/:id", () => {
    it("responde 404 al eliminar un usuario inexistente", async () => {
      const token = await tokenAdmin();
      const res = await request(app)
        .delete("/api/usuarios/60c72b2f9b1d8b001c8e4d2a")
        .set("x-token", token);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe("Usuario no encontrado");
    });

    it("Admin intenta eliminarse a sí mismo responde 400 ('No puedes eliminar tu propia cuenta')", async () => {
      const adminPropio = await crearUsuario({
        nombre: "Admin Autodestructivo",
        email: "autodestruccion@demo.com",
        rol: "admin",
      });
      const token = obtenerToken(adminPropio);

      const res = await request(app)
        .delete(`/api/usuarios/${adminPropio.id}`)
        .set("x-token", token);

      expect(res.status).toBe(400);
      expect(res.body.error).toBe("No puedes eliminar tu propia cuenta");
    });

    it("Borrado lógico: responde 200, deja de aparecer en el listado y ya no puede iniciar sesión", async () => {
      const usuario = await crearUsuario({
        nombre: "Usuario Para Eliminar",
        email: "para_eliminar@demo.com",
        password: "Password123!",
      });
      const token = await tokenAdmin();

      const resDelete = await request(app)
        .delete(`/api/usuarios/${usuario.id}`)
        .set("x-token", token);

      expect(resDelete.status).toBe(200);
      expect(resDelete.body.mensaje).toBe("Usuario eliminado");

      // Ya no debe aparecer en el listado activo
      const resListado = await request(app).get("/api/usuarios").set("x-token", token);
      const encontrado = resListado.body.usuarios.find((u) => u.email === "para_eliminar@demo.com");
      expect(encontrado).toBeUndefined();

      // Ya no puede iniciar sesión
      const resLogin = await request(app).post("/api/auth/login").send({
        email: "para_eliminar@demo.com",
        password: "Password123!",
      });
      expect(resLogin.status).toBe(401);
      expect(resLogin.body.error).toBe("Usuario desactivado");
    });
  });
});
