# 03. Especificación: inicio de sesión

| Campo | Valor |
|---|---|
| Identificador | ESP-001 |
| Caso de uso de origen | CU01. Registrar datos y antecedentes, que incluye el inicio de sesión del médico tratante ([02-requisitos.md](02-requisitos.md)) |
| Estado | Implementada, pendiente de la ejecución manual de pruebas |
| Plan | [planes/02-plan-inicio-sesion.md](../planes/02-plan-inicio-sesion.md) |
| Tareas | [tareas/inicio-sesion.md](../tareas/inicio-sesion.md) |
| Casos de prueba | [04-pruebas-tdd.md](04-pruebas-tdd.md), PT01 a PT16 |

> **Nota de trazabilidad (R-IA-06).** La primera versión de la pantalla y del endpoint de inicio de sesión se programó antes de adoptar SDD. Esta especificación se redactó el 2026-11-16 a partir de los requisitos de la ERS y del comportamiento existente, y guió la refactorización registrada en la bitácora de prompts. Las funcionalidades nuevas deben especificarse antes de programarse.

## 1. Objetivo

Permitir que los usuarios autorizados (médicos y administradores) accedan a XpertDiagnostic con su ID y su contraseña, de forma segura y accesible.

## 2. Historias de usuario

- **HU-01.** Como **médico**, quiero iniciar sesión con mi ID y mi contraseña para acceder a las funciones del sistema.
- **HU-02.** Como **administrador**, quiero iniciar sesión desde la misma pantalla, eligiendo mi tipo de cuenta.
- **HU-03.** Como **usuario**, quiero saber de inmediato si me equivoqué en algún dato y qué debo corregir.
- **HU-04.** Como **usuario que navega con teclado o lector de pantalla**, quiero poder completar el inicio de sesión sin usar el ratón.
- **HU-05.** Como **institución de salud**, quiero que las contraseñas y las claves del sistema estén protegidas, aunque alguien acceda al código o a la base de datos.

## 3. Requisitos funcionales

| ID | Requisito | Historia |
|---|---|---|
| RF-01 | El sistema recibe un ID numérico (1 a 2 147 483 647) y una contraseña (1 a 72 caracteres). | HU-01 |
| RF-02 | El sistema valida los datos en el servidor y rechaza los inválidos sin consultar la base de datos. | HU-01, HU-05 |
| RF-03 | El sistema verifica la contraseña contra el hash guardado en `USUARIOS.PASS`. | HU-01, HU-05 |
| RF-04 | Si las credenciales son correctas, el sistema emite un token de sesión con el ID y el rol del usuario, con una vigencia limitada (120 minutos). | HU-01 |
| RF-05 | Si una contraseña sigue guardada en texto plano y es correcta, el sistema la reemplaza por su hash BCrypt. | HU-05 |
| RF-06 | La pantalla permite elegir el apartado Médico (tratante o internista) o Administrador. Ambos roles médicos usan el mismo apartado; el token conserva el rol de la cuenta (`T` o `I`), y con él se decide la pantalla: el tratante va a `/home` y el internista a `/internista` (P-140). | HU-02 |
| RF-07 | La pantalla valida los campos antes de enviarlos y explica qué falta corregir. | HU-03 |
| RF-08 | La pantalla muestra un estado de carga mientras espera la respuesta e impide enviar dos veces. | HU-03 |
| RF-09 | La opción "Recuérdame" conserva la sesión al cerrar el navegador, hasta que expire el token. | HU-01 |

## 4. Requisitos no funcionales

| ID | Requisito | Origen |
|---|---|---|
| RNF-01 | El token no es accesible desde JavaScript del navegador. | Seguridad (ERS) |
| RNF-02 | Los mensajes de error no revelan si un ID existe ni detalles técnicos. | Seguridad (ERS) |
| RNF-03 | La cadena de conexión y la clave de firma se configuran fuera del código. | Seguridad, R-SEG-01 |
| RNF-04 | La respuesta del backend tarda menos de 1.5 s en condiciones normales. | Rendimiento (ERS) |
| RNF-05 | La pantalla cumple las reglas R-UI-01 a R-UI-06: etiquetas, ARIA, teclado y texto alternativo. | Constitución |

## 5. Criterios de aceptación

| ID | Criterio | Pruebas |
|---|---|---|
| CA-01 | Con credenciales correctas se responde 200 con el ID, el rol y la expiración, y se guarda el token en una cookie `httpOnly`. | PT01, PT13 |
| CA-02 | Con una contraseña incorrecta o un ID inexistente se responde 401, con el mismo mensaje en ambos casos. | PT02, PT03, PT12 |
| CA-03 | Con datos inválidos se responde 400. | PT04, PT05 |
| CA-04 | Una contraseña heredada en texto plano queda como hash BCrypt después del primer inicio de sesión correcto. | PT06 |
| CA-05 | Si la base de datos no responde, se devuelve 503 sin detalles internos. | PT07, PT15 |
| CA-06 | La API no arranca sin la clave JWT o sin la cadena de conexión. | PT08 |
| CA-07 | Los campos vacíos o inválidos se señalan en la pantalla sin enviar la solicitud. | PT09, PT10 |
| CA-08 | Durante la espera se muestra la carga y se bloquea el doble envío. | PT11 |
| CA-09 | Todo el flujo se puede completar con teclado. | PT14 |
| CA-10 | Al editar un campo después de un error, el mensaje desaparece. | PT16 |
| CA-11 | Una cuenta `T` o `I` puede iniciar sesión desde Médico; una cuenta `A`, desde Administrador. El rol real se conserva en la sesión. | PT94 |

## 6. Fuera de alcance

- Recuperar la contraseña desde la interfaz. Por ahora, el usuario contacta a soporte técnico.
- Página de términos y privacidad.
- La pantalla principal real y la protección de su ruta. Por ahora, tras un inicio de sesión exitoso, se muestra una capa de carga simulada y se redirige a `/home`, que solo tiene un texto de prueba (T28).
- Distinguir permisos por tipo de cuenta en el frontend. El rol viaja en el token y se usará en funcionalidades posteriores.
- Cerrar sesión.
