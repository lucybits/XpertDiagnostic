# 02. Requisitos

## Requisitos funcionales

XpertDiagnostic es un sistema independiente que funcionará como aplicación de propósito específico. Se integrará con varias bases de datos, contará con una máquina de inferencia para generar diagnósticos de enfermedades y tratamientos, y ofrecerá utilerías para visualizar y exportar información.

Plataformas: equipo de cómputo fijo (desktop), portátil (laptop) y dispositivos móviles (smartphones y tablets) con Android y iOS. El requisito es contar con conexión a la red telemática de la institución de salud.

Capacidad central: analizar en forma integral los antecedentes médicos del paciente, sus signos y síntomas, inferir la enfermedad que padece y sugerir tratamiento médico.

Red e interfaces físicas:

- Desktop: puerto Ethernet.
- Laptop, smartphone y tablet: conexión inalámbrica mediante módem o router conectado a la red institucional.
- Las impresoras asignadas a cada consultorio están conectadas a la misma red.

Versiones posteriores: XpertDiagnostic interactuará con los sistemas de control del historial médico de los pacientes, de dos maneras posibles:

1. Una interfaz de software lee los datos mostrados en posiciones predefinidas de la pantalla del sistema de control y los carga en XpertDiagnostic.
2. Acceso directo a las tablas de la base de datos del historial médico para actualizar las tablas de XpertDiagnostic.

### Casos de uso

#### CU01. Registrar datos y antecedentes

Incluye el inicio de sesión del médico tratante.

#### CU02. Registrar signos y síntomas

Se realiza previa exploración. Precondición: usuario con sesión iniciada.

#### CU03. Registrar resultados de laboratorio

Precondición: usuario con sesión iniciada.

#### CU04. Solicitar pre-diagnóstico y exámenes de laboratorio complementarios

El médico solicita un pre-diagnóstico y los análisis complementarios que ayuden a establecer un diagnóstico diferencial.

#### CU05. Generar diagnóstico y tratamiento

El sistema genera el diagnóstico y el tratamiento a partir de los datos clínicos disponibles.

#### CU06. Validar diagnóstico y tratamiento de enfermedad no multifactorial

El médico residente de Medicina Interna valida el diagnóstico y el tratamiento.

#### CU07. Validar diagnóstico y tratamiento de enfermedad multifactorial

El Comité de Médicos de Interconsulta de Especialidades valida el diagnóstico y el tratamiento.

#### CU08. Prescribir medicamentos y tratamiento

Precondición: usuario con sesión iniciada.

#### CU09. Agendar cita de seguimiento

El médico agenda una cita de seguimiento según la disponibilidad de recursos.

## Requisitos no funcionales

### Rendimiento

- Navegación fluida en la interfaz, con tiempos de respuesta locales menores a 0.1 s al interactuar entre ventanas, celdas y botones.
- Para la máquina de inferencia (cálculo determinista/probabilístico de pre-diagnóstico y tratamiento), el tiempo máximo de respuesta del backend al cliente será menor o igual a 1.5 s. Ese margen considera la latencia de la red inalámbrica institucional, la consulta concurrente a las tablas relacionales de la base de conocimiento y la ejecución del hilo del modelo de Machine Learning.

### Seguridad

- El acceso es solo mediante contraseña asociada a la cédula profesional de cada usuario. El requisito previo para entregar una contraseña es presentar la cédula profesional del solicitante.
- La contraseña se verifica mediante autenticación fuerte, y hay monitoreo de los usuarios conectados.
- El acceso a los módulos depende del nivel de responsabilidad del usuario en la institución.
- Hay un registro de la navegación y de los módulos utilizados, consultable por el administrador de XpertDiagnostic.
- La base de conocimiento se verifica periódicamente para prevenir daños o pérdida de registros que afecten las predicciones y los tratamientos recomendados.
- Los reportes llevan la leyenda: "Información confidencial, se prohíbe su uso fuera de la institución de salud". Los usuarios se comprometen a un uso razonable y correcto de la información.

### Fiabilidad

- Disponibilidad general de 6:00 a.m. a 8:00 p.m. Fuera de ese horario hay que avisar al superusuario o administrador para que permita el acceso.
- Ante una falla o interrupción, el servicio debe restablecerse en máximo 30 minutos. Mientras tanto se habilita el acceso a la base de conocimiento de respaldo.
- Habrá una bitácora de incidencias para aplicar acciones preventivas del plan del área de sistemas.
- XpertDiagnostic supervisa la captura: verifica cadenas de caracteres y parámetros de resultados de laboratorio, y avisa del error para evitar datos incorrectos.

### Disponibilidad

- Disponible el 100 % del tiempo de labores de la institución de salud.
- Si el usuario olvida o pierde su contraseña, lo comunica por e-mail desde la interfaz de XpertDiagnostic para que el administrador le asigne una nueva.

### Mantenibilidad

- Desarrollo modular, para agregar módulos y opciones en versiones sucesivas.
- El área responsable monitorea la opinión de los usuarios para decidir qué mejoras implementar y cuándo.
- Plan de mantenimiento preventivo: un día a la semana, fuera de horas hábiles, para verificar los componentes del sistema y la base de conocimiento.

### Portabilidad

- La primera versión se desarrolla con el ecosistema Visual C# (.NET) y Microsoft SQL Server como motor centralizado.
- Arquitectura desacoplada: SQL Server reside exclusivamente en el servidor central (o mainframe institucional).
- Los dispositivos móviles y clientes ligeros acceden a datos, diagnósticos y lógica de inferencia mediante una API REST independiente, evitando carga de procesamiento local y garantizando compatibilidad multiplataforma (Windows, Android, iOS).

### Otros requisitos

- Capacitación: a los nuevos usuarios se les impartirá capacitación sobre el uso y funcionamiento del sistema y su potencia predictiva y explicativa.
- Evolución previsible: en versiones posteriores se interactuará con dispositivos de medición de signos y síntomas (estetoscopios, baumanómetros, electrocardiógrafos, etc.), para lo cual se buscarán los conectores de hardware y software adecuados.
