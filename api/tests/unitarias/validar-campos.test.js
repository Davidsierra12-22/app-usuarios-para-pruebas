// ============================================================
// 🧪 Pruebas unitarias: validarCampos
// Revisa si express-validator encontró errores en la petición
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";

// Mockeamos express-validator antes de importar validarCampos
vi.mock("express-validator", () => ({
  validationResult: vi.fn(),
}));

import { validationResult } from "express-validator";
import { validarCampos } from "../../middlewares/validar-campos.js";

describe("Middleware validarCampos", () => {
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
    vi.clearAllMocks();
  });

  it("llama a next() cuando no existen errores de validación", () => {
    validationResult.mockReturnValue({
      isEmpty: () => true,
    });

    validarCampos(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("responde 400 con la lista de errores cuando hay fallos de validación", () => {
    validationResult.mockReturnValue({
      isEmpty: () => false,
      array: () => [
        { path: "email", msg: "Email no válido" },
        { path: "password", msg: "La contraseña es obligatoria" },
      ],
    });

    validarCampos(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      errores: [
        { path: "email", msg: "Email no válido" },
        { path: "password", msg: "La contraseña es obligatoria" },
      ],
    });
    expect(next).not.toHaveBeenCalled();
  });
});
