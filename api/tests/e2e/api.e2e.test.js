import { afterAll, beforeAll, describe, expect, it } from "vitest";
import app from "../../app.js";
import { crearUsuario } from "../helpers.js";

let server;
let baseUrl;

beforeAll(async () => {
  await new Promise((resolve, reject) => {
    server = app.listen(0, "127.0.0.1", resolve);
    server.once("error", reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

afterAll(async () => {
  if (server) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

async function api(path, { method = "GET", token, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(token ? { "x-token": token } : {}),
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: response.status, body: await response.json() };
}

describe("E2E HTTP: API, autenticación y persistencia MongoDB", () => {
  it("recorre registro, sesión autenticada y cambio de contraseña por HTTP", async () => {
    const email = `e2e-${Date.now()}@demo.com`;
    const registration = await api("/api/auth/registro", {
      method: "POST",
      body: { nombre: "Usuario E2E", email, password: "Password123!" },
    });

    expect(registration.status).toBe(201);
    expect(registration.body.usuario.rol).toBe("usuario");
    expect(registration.body.usuario.password).toBeUndefined();

    const profile = await api("/api/auth/perfil", { token: registration.body.token });
    expect(profile.status).toBe(200);
    expect(profile.body.email).toBe(email);

    const passwordUpdate = await api("/api/auth/password", {
      method: "PUT",
      token: registration.body.token,
      body: { passwordActual: "Password123!", passwordNueva: "NuevaPassword456!" },
    });
    expect(passwordUpdate.status).toBe(200);

    const login = await api("/api/auth/login", {
      method: "POST",
      body: { email, password: "NuevaPassword456!" },
    });
    expect(login.status).toBe(200);
    expect(login.body.usuario.email).toBe(email);
  });

  it("recorre autorización y CRUD administrativo; el usuario eliminado no inicia sesión", async () => {
    const admin = await crearUsuario({ rol: "admin", email: `admin-e2e-${Date.now()}@demo.com` });
    const adminLogin = await api("/api/auth/login", {
      method: "POST",
      body: { email: admin.email, password: "Password123!" },
    });
    expect(adminLogin.status).toBe(200);

    const member = await crearUsuario({ email: `miembro-e2e-${Date.now()}@demo.com` });
    const deniedList = await api("/api/usuarios", { token: (await api("/api/auth/login", {
      method: "POST",
      body: { email: member.email, password: "Password123!" },
    })).body.token });
    expect(deniedList.status).toBe(403);

    const created = await api("/api/usuarios", {
      method: "POST",
      token: adminLogin.body.token,
      body: { nombre: "Creado E2E", email: `creado-e2e-${Date.now()}@demo.com`, password: "Password123!", rol: "usuario" },
    });
    expect(created.status).toBe(201);

    const updated = await api(`/api/usuarios/${created.body.uid}`, {
      method: "PUT",
      token: adminLogin.body.token,
      body: { nombre: "Actualizado E2E" },
    });
    expect(updated.status).toBe(200);
    expect(updated.body.nombre).toBe("Actualizado E2E");

    const deleted = await api(`/api/usuarios/${created.body.uid}`, {
      method: "DELETE",
      token: adminLogin.body.token,
    });
    expect(deleted.status).toBe(200);

    const inactiveLogin = await api("/api/auth/login", {
      method: "POST",
      body: { email: created.body.email, password: "Password123!" },
    });
    expect(inactiveLogin.status).toBe(401);
    expect(inactiveLogin.body.error).toBe("Usuario desactivado");
  });

  it("expone healthcheck y errores HTTP en JSON", async () => {
    const health = await api("/api/health");
    const notFound = await api("/api/no-existe-e2e");
    const unauthorized = await api("/api/auth/perfil");

    expect(health).toEqual({ status: 200, body: { status: "ok" } });
    expect(notFound.status).toBe(404);
    expect(notFound.body.error).toBe("Ruta no encontrada");
    expect(unauthorized.status).toBe(401);
  });
});
