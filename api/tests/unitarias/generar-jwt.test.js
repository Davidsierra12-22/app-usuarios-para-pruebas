// ============================================================
// 🧪 Pruebas unitarias: generarJWT
// Verifica la creación del token y su contenido (uid y rol)
// ============================================================

import { describe, it, expect } from "vitest";
import jwt from "jsonwebtoken";
import { generarJWT } from "../../helpers/generar-jwt.js";

describe("Helper generarJWT", () => {
  it("genera un token JWT válido que contiene el uid y el rol del usuario", () => {
    const usuarioFalso = {
      id: "60c72b2f9b1d8b001c8e4d2a",
      rol: "admin",
    };

    const token = generarJWT(usuarioFalso);

    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(10);

    // Decodificar el token para verificar su payload
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.uid).toBe(usuarioFalso.id);
    expect(decoded.rol).toBe(usuarioFalso.rol);
  });
});
