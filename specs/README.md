# Especificaciones de XpertDiagnostic (SDD)

XpertDiagnostic se desarrolla con **desarrollo guiado por especificaciones** (*Spec-Driven Development*, SDD) y con apoyo de asistentes de IA. Primero se especifica qué se necesita, luego se planea cómo construirlo, se divide en tareas, se implementa y, por último, una persona revisa lo producido. Las reglas completas están en la [constitución](reglas/constitucion.md).

```text
reglas > especificación > casos de prueba > plan > tareas > implementación > auditoría humana
                                   (cada prompt de IA queda en la bitácora)
```

## Contenido

### Reglas
- [Constitución del proyecto](reglas/constitucion.md): flujo SDD, arquitectura, seguridad, accesibilidad, pruebas, ramas y uso de IA.

### Especificaciones
- [01. Introducción](especificaciones/01-introduccion.md): propósito, alcance y usuarios (ERS, IEEE 830).
- [02. Requisitos](especificaciones/02-requisitos.md): requisitos funcionales, casos de uso y requisitos no funcionales.
- [03. Inicio de sesión (ESP-001)](especificaciones/03-inicio-sesion.md): historias de usuario, requisitos y criterios de aceptación.
- [04. Pruebas TDD](especificaciones/04-pruebas-tdd.md): casos Given-When-Then y registro de su ejecución manual.
- [05. Médicos y cuentas (ESP-002)](especificaciones/05-registro-medicos.md): perfil del médico con sesión y alta de médicos por un administrador, con sus casos PT17 a PT28.
- [06. Bienvenida del asistente (ESP-003)](especificaciones/06-bienvenida-asistente.md): recorrido guiado la primera vez de cada cuenta, con sus casos PT29 a PT34.

### Planes
- [01. Arquitectura, SOLID y patrones](planes/01-arquitectura-y-patrones.md): capas MVC, SOLID, contratos y patrones Singleton, Fachada y Estado.
- [02. Plan técnico del inicio de sesión](planes/02-plan-inicio-sesion.md): flujo, decisiones, archivos y riesgos.

### Tareas
- [Inicio de sesión](tareas/inicio-sesion.md): tareas con su requisito, su prueba, su autor (persona o IA) y su revisión.

### Bitácora y auditoría
- [Bitácora de prompts](bitacora/bitacora-prompts.md): cada prompt de IA, textual, con su resultado.
- [Auditoría y corrección humana](auditoria/auditoria-humana.md): revisiones, correcciones y archivos pendientes de revisión.

### Guías
- [Guía de instalación y colaboración](guias/guia-instalacion.md): requisitos, configuración segura, arranque local y flujo de contribución.

## Nueva funcionalidad

1. Crea `especificaciones/NN-nombre.md` con su ID (`ESP-00X`), historias, requisitos y criterios de aceptación.
2. Agrega sus casos Given-When-Then a `especificaciones/04-pruebas-tdd.md`.
3. Crea `planes/NN-plan-nombre.md` y `tareas/nombre.md`.
4. Implementa una tarea a la vez y registra cada prompt de IA en la bitácora.
5. Registra la auditoría humana antes de abrir el Pull Request hacia `Develop`.
