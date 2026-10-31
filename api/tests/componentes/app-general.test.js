// ============================================================
// 🧪 Pruebas de integración: Casos generales de la aplicación
// Valida healthcheck, rutas inexistentes (404) y JSON mal formado (400)
// ============================================================

import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../../app.js";

describe("Integración: Casos Generales de la API", () => {
  it("GET /api/health responde 200 con { status: 'ok' }", async () => {
    const res = await request(app).get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });

  it("una ruta inexistente responde 404 en formato JSON", async () => {
    const res = await request(app).get("/api/ruta-que-no-existe-nunca");

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: "Ruta no encontrada" });
  });

  it("un body con JSON mal formado responde 400 con 'El cuerpo de la petición no es un JSON válido'", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .set("Content-Type", "application/json")
      .send("{ email: 'invalido-json' sin-cerrar ");

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: "El cuerpo de la petición no es un JSON válido" });
  });
});
