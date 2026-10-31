// ============================================================
// 🧪 Pruebas unitarias: validarRol
// Verifica autorización según roles sin tocar la base de datos
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import { validarRol } from "../../middlewares/validar-rol.js";

describe("Middleware validarRol", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {};
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
  });

  it("responde 500 si no se ejecutó antes validarJWT (sin req.usuario)", () => {
    // req no tiene usuario asignado
    const middleware = validarRol("admin");
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Se requiere validarJWT primero" });
    expect(next).not.toHaveBeenCalled();
  });

  it("responde 403 si el rol del usuario no está dentro de los permitidos", () => {
    req.usuario = { rol: "usuario" };

    const middleware = validarRol("admin");
    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "No tiene permisos para esto" });
    expect(next).not.toHaveBeenCalled();
  });

  it("llama a next() si el rol del usuario está permitido", () => {
    req.usuario = { rol: "admin" };

    const middleware = validarRol("admin");
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("permite múltiples roles autorizados si se definen varios en validarRol", () => {
    req.usuario = { rol: "usuario" };

    const middleware = validarRol("admin", "usuario");
    middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });
});
