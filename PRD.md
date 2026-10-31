# PRD — Aplicación de gestión de usuarios

## Objetivo

Construir una aplicación web accesible para registrar usuarios, iniciar/cerrar sesión, gestionar un perfil y permitir que los administradores administren cuentas con reglas de autorización seguras.

## Roles y autorización

- **Usuario estándar:** puede registrarse, autenticarse, consultar/editar sus propios datos, cambiar su contraseña y cerrar sesión.
- **Administrador:** puede hacer lo anterior y listar, buscar, filtrar, paginar, crear, editar y desactivar usuarios.
- Las rutas privadas sin JWT responden HTTP 401. Las operaciones administrativas solicitadas por un usuario estándar responden HTTP 403.
- El registro público siempre asigna el rol `usuario`; no acepta elevación de privilegios desde el cuerpo.
- Un administrador no puede cambiar su propio rol ni desactivar su propia cuenta.

## Reglas de cuenta y seguridad

- El email debe tener formato válido y ser único.
- El nombre debe tener entre 2 y 60 caracteres.
- La contraseña debe tener entre 8 y 64 caracteres e incluir mayúscula, minúscula y número.
- Las contraseñas se almacenan hasheadas; nunca se devuelven en JSON.
- El cambio de contraseña requiere la clave actual, una clave nueva válida y que sea distinta de la anterior.
- El borrado de usuarios es lógico: los usuarios desactivados no aparecen en el listado ni pueden iniciar sesión.
- JWT se transmite con el header `x-token`; un token ausente, manipulado o expirado no autoriza la operación.

## API

- `GET /api/health`: estado de salud.
- `POST /api/auth/registro`, `POST /api/auth/login`.
- `GET /api/auth/perfil`, `PUT /api/auth/perfil`, `PUT /api/auth/password`.
- CRUD administrativo en `/api/usuarios` y `/api/usuarios/:id`.
- El listado retorna total, página, límite, total de páginas y usuarios activos; permite búsqueda por nombre/email, filtro por rol y paginación con límite máximo de 50.
- Errores HTTP se devuelven como JSON; validaciones por campo usan `errores` con `path` y `msg`.

## Aplicación web

- Login y registro con validación en cliente y mensajes de error del servidor.
- Guardas de router: invitados no acceden a rutas protegidas; sesión de usuario se restaura al recargar; un usuario estándar no accede al panel admin.
- Perfil personal y formulario de cambio de contraseña.
- Panel admin con búsqueda, filtro de rol, paginación, alta/edición y confirmación de desactivación.
- Página 404 para rutas desconocidas, navegación con teclado, estados de carga/vacío y notificaciones accesibles.

## Cuentas de prueba

La base E2E local exclusiva se inicializa mediante el seed idempotente del servidor con `admin@demo.com` / `Admin123!`. Los tests crean usuarios con emails únicos. En la base de desarrollo, las cuentas demo dependen de ejecutar conscientemente `npm run seed`; el comando borra la colección y no se debe usar en una base compartida.

## Criterios de aceptación verificables

1. Registro y login validan credenciales y crean una sesión JWT; el usuario registrado conserva rol estándar.
2. Usuario puede actualizar perfil y cambiar contraseña, y después autenticarse con la nueva clave.
3. Admin puede crear, buscar, filtrar, editar y desactivar usuarios; los cambios se reflejan en la base y en la UI.
4. No autenticado y usuario estándar reciben redirecciones/401/403 apropiados.
5. Cuenta desactivada queda fuera del listado y no puede autenticarse.
6. API y web pasan unitarias/componentes; E2E API y E2E navegador cubren flujos completos.
7. Cobertura mínima: 80% líneas, sentencias y funciones; 70% ramas en cada proyecto.
8. Playwright ejecuta Chromium y Firefox contra la API y MongoDB local de E2E, sin interceptar las rutas `/api`.
