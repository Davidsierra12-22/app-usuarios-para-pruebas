// ============================================================
// 🧪 Pruebas unitarias: validarJWT
// Verifica la autenticación mediante el header x-token
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import Usuario from "../../models/usuario.js";
import { validarJWT } from "../../middlewares/validar-jwt.js";

describe("Middleware validarJWT", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      header: vi.fn(),
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
    vi.restoreAllMocks();
  });

  it("responde 401 si no se envía el header x-token", async () => {
    req.header.mockReturnValue(null);

    await validarJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "No hay token en la petición" });
    expect(next).not.toHaveBeenCalled();
  });

  it("responde 401 si el token es inválido o está manipulado", async () => {
    req.header.mockReturnValue("token-invalido");
    vi.spyOn(jwt, "verify").mockImplementation(() => {
      throw new Error("invalid token");
    });

    await validarJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Token no válido o expirado" });
    expect(next).not.toHaveBeenCalled();
  });

  it("responde 401 si el usuario asociado al token no existe en la BD", async () => {
    req.header.mockReturnValue("token-valido");
    vi.spyOn(jwt, "verify").mockReturnValue({ uid: "60c72b2f9b1d8b001c8e4d2a" });
    vi.spyOn(Usuario, "findById").mockResolvedValue(null);

    await validarJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Usuario desactivado" });
    expect(next).not.toHaveBeenCalled();
  });

  it("responde 401 si el usuario existe pero tiene estado false (borrado lógico)", async () => {
    req.header.mockReturnValue("token-valido");
    vi.spyOn(jwt, "verify").mockReturnValue({ uid: "60c72b2f9b1d8b001c8e4d2a" });
    vi.spyOn(Usuario, "findById").mockResolvedValue({ id: "60c72b2f9b1d8b001c8e4d2a", estado: false });

    await validarJWT(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Usuario desactivado" });
    expect(next).not.toHaveBeenCalled();
  });

  it("llama a next() y adjunta el usuario a req.usuario cuando el token y usuario son válidos", async () => {
    const usuarioMock = { id: "60c72b2f9b1d8b001c8e4d2a", rol: "admin", estado: true };
    req.header.mockReturnValue("token-valido");
    vi.spyOn(jwt, "verify").mockReturnValue({ uid: "60c72b2f9b1d8b001c8e4d2a" });
    vi.spyOn(Usuario, "findById").mockResolvedValue(usuarioMock);

    await validarJWT(req, res, next);

    expect(req.usuario).toBe(usuarioMock);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
