import { afterEach, describe, expect, it, vi } from "vitest";
import Usuario from "../../models/usuario.js";
import { emailExiste, esRolValido } from "../../helpers/db-validators.js";

describe("Test Helper db-validators", () => {
    describe("Si el rol es valido", () => {

        it("acepta el rol admin", () => {
            expect(esRolValido("admin")).toBe(true)

        });

        it("acepta el rol  usuario", () => {
            expect(esRolValido("usuario")).toBe(true)

        });

        it.each(["jefe", "ADMIN", "", undefined, null])("rechaza el rol %j", (rol) => {
            expect(() => esRolValido(rol)).toThrow("El rol debe ser uno de: admin, usuario")
        })





    })
    describe("Si el email ya existe", () => {
        afterEach(() => {
            vi.restoreAllMocks()
        })

        it("No fallla si no esta el email o no esta registrado", async () => {

            vi.spyOn(Usuario, "findOne").mockResolvedValue(null)

            await expect(emailExiste("test@example.com")).resolves.toBeUndefined()

        })

        it("Creacion y validacion de busqueda de usuario", async () =>{


            const findOne = vi.spyOn(Usuario, "findOne").mockResolvedValue(null)

            await emailExiste("test@test.com")

            expect(findOne).toHaveBeenCalledWith({email: "test@test.com"})
        })

        it("Error si existe el email en la base de datos", async () => {
            vi.spyOn(Usuario, "findOne").mockResolvedValue(null)

            await expect(emailExiste("test@test.com")).resolves.toThrow("Ese email ya esta registrado")


        })
    })
})