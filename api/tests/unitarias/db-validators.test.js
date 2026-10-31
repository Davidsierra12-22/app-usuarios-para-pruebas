// ============================================================
// 🧪 Pruebas unitarias: db-validators
// Valida roles permitidos y unicidad de email
// ============================================================

import { describe, it, expect, vi, beforeEach } from "vitest";
import Usuario from "../../models/usuario.js";
import { esRolValido, emailExiste } from "../../helpers/db-validators.js";

describe("Helpers db-validators", () => {
  describe("esRolValido", () => {
    it("acepta el rol 'admin'", () => {
      expect(esRolValido("admin")).toBe(true);
    });

    it("acepta el rol 'usuario'", () => {
      expect(esRolValido("usuario")).toBe(true);
    });

    it.each(["superadmin", "invitado", "ADMIN", "", null, undefined])(
      "lanza un error si el rol es inválido (%s)",
      (rolInvalido) => {
        expect(() => esRolValido(rolInvalido)).toThrow(
          "El rol debe ser uno de: admin, usuario"
        );
      }
    );
  });

  describe("emailExiste", () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it("no lanza error si el email no está registrado", async () => {
      vi.spyOn(Usuario, "findOne").mockResolvedValue(null);

      await expect(emailExiste("nuevo@correo.com")).resolves.toBeUndefined();
    });

    it("lanza error si el email ya pertenece a otro usuario", async () => {
      vi.spyOn(Usuario, "findOne").mockResolvedValue({ id: "id-usuario-1" });

      await expect(emailExiste("existe@correo.com", "id-usuario-2")).rejects.toThrow(
        "Ese email ya está registrado"
      );
    });

    it("no lanza error si el email pertenece al mismo usuario que se está editando", async () => {
      vi.spyOn(Usuario, "findOne").mockResolvedValue({ id: "mi-mismo-id" });

      await expect(emailExiste("mismo@correo.com", "mi-mismo-id")).resolves.toBeUndefined();
    });
  });
});
