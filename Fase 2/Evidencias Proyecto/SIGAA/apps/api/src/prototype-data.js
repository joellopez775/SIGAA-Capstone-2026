export const prototypeData = {
  meta: { synthetic: true, period: "2026 · Segundo semestre", school: "Liceo Bicentenario Los Arrayanes", updatedAt: "2026-10-15T12:00:00.000Z" },
  metrics: { activeStudents: 128, averageAttendance: 87, openAlerts: 12, activeFollowUps: 7 },
  students: [
    { id: "est-001", name: "Camila Soto", identifier: "EST-2026-001", course: "2° Medio A", level: "Enseñanza Media", attendance: 68, average: 4.1, risk: "high", alertIds: ["alt-001", "alt-002"] },
    { id: "est-002", name: "Diego Morales", identifier: "EST-2026-002", course: "2° Medio A", level: "Enseñanza Media", attendance: 74, average: 5.2, risk: "medium", alertIds: ["alt-003"] },
    { id: "est-003", name: "Valentina Rojas", identifier: "EST-2026-003", course: "2° Medio A", level: "Enseñanza Media", attendance: 93, average: 6.1, risk: "low", alertIds: [] },
    { id: "est-004", name: "Tomás Herrera", identifier: "EST-2026-004", course: "2° Medio B", level: "Enseñanza Media", attendance: 81, average: 3.8, risk: "high", alertIds: ["alt-004"] },
    { id: "est-005", name: "Fernanda Silva", identifier: "EST-2026-005", course: "2° Medio B", level: "Enseñanza Media", attendance: 89, average: 5.7, risk: "low", alertIds: [] },
  ],
  teacherWorkspace: {
    teacher: { id: "teacher-001", name: "Daniela Rojas", title: "Profesora de Matemática · Profesora jefe", headCourseId: "course-2a" },
    assignments: [
      { id: "ca-mat-2a", courseId: "course-2a", courseName: "2° Medio A", subjectCode: "MAT-2M", subjectName: "Matemática", room: "Sala 12", schedule: "Lun y mié · 08:00", studentIds: ["est-001", "est-002", "est-003"], isHeadTeacher: true },
      { id: "ca-mat-2b", courseId: "course-2b", courseName: "2° Medio B", subjectCode: "MAT-2M", subjectName: "Matemática", room: "Sala 14", schedule: "Mar y jue · 10:15", studentIds: ["est-004", "est-005"], isHeadTeacher: false },
      { id: "ca-tut-2a", courseId: "course-2a", courseName: "2° Medio A", subjectCode: "ORI-2M", subjectName: "Orientación", room: "Sala 12", schedule: "Vie · 09:30", studentIds: ["est-001", "est-002", "est-003"], isHeadTeacher: true },
    ],
    classSessions: [
      { id: "class-001", courseSubjectId: "ca-mat-2a", date: "2026-08-28", startTime: "08:00", block: "Bloque 1", title: "Funciones lineales", objective: "Representar y analizar funciones lineales en contextos cotidianos.", status: "completed", attendance: { "est-001": "present", "est-002": "late", "est-003": "present" } },
      { id: "class-002", courseSubjectId: "ca-mat-2b", date: "2026-08-28", startTime: "10:15", block: "Bloque 3", title: "Pendiente de una recta", objective: "Calcular e interpretar la pendiente usando tablas y gráficos.", status: "completed", attendance: { "est-004": "absent", "est-005": "present" } },
      { id: "class-003", courseSubjectId: "ca-mat-2a", date: "2026-09-02", startTime: "08:00", block: "Bloque 1", title: "Sistemas de ecuaciones", objective: "Resolver sistemas de dos ecuaciones mediante representación gráfica.", status: "planned", attendance: {} },
      { id: "class-004", courseSubjectId: "ca-mat-2a", date: "2026-10-14", startTime: "08:00", block: "Bloque 1", title: "Modelación de funciones", objective: "Aplicar funciones lineales a una situación escolar.", status: "completed", attendance: { "est-001": "absent", "est-002": "present", "est-003": "present" } },
    ],
    evaluations: [
      { id: "eval-001", courseSubjectId: "ca-mat-2a", name: "Control de álgebra", date: "2026-08-20", weight: 20, grades: { "est-001": 5.6, "est-002": 4.9, "est-003": 6.4 } },
      { id: "eval-002", courseSubjectId: "ca-mat-2a", name: "Guía de funciones", date: "2026-08-27", weight: 30, grades: { "est-001": 5.1, "est-002": 5.5, "est-003": 6.0 } },
      { id: "eval-003", courseSubjectId: "ca-mat-2b", name: "Control de álgebra", date: "2026-08-22", weight: 25, grades: { "est-004": 3.8, "est-005": 5.9 } },
    ],
    annotations: [
      { id: "note-003", courseId: "course-2a", studentId: "est-001", courseSubjectId: "ca-mat-2a", type: "positive", category: "Esfuerzo", text: "Persistió en la resolución de ejercicios y solicitó retroalimentación para mejorar.", author: "Daniela Rojas", createdAt: "2026-08-26T13:15:00.000Z", visibleToStudent: true },
      { id: "note-004", courseId: "course-2a", studentId: "est-001", courseSubjectId: "ca-tut-2a", type: "negative", category: "Responsabilidad", text: "Llegó sin los materiales solicitados para la actividad de orientación.", author: "Daniela Rojas", createdAt: "2026-08-21T10:10:00.000Z", visibleToStudent: true },
      { id: "note-001", courseId: "course-2a", studentId: "est-003", courseSubjectId: "ca-mat-2a", type: "positive", category: "Participación", text: "Explicó su estrategia de resolución y apoyó respetuosamente al grupo.", author: "Daniela Rojas", createdAt: "2026-08-28T12:10:00.000Z" },
      { id: "note-002", courseId: "course-2b", studentId: "est-004", courseSubjectId: "ca-mat-2b", type: "negative", category: "Responsabilidad", text: "No presentó la guía de trabajo después de dos recordatorios.", author: "Daniela Rojas", createdAt: "2026-08-27T15:30:00.000Z" },
    ],
  },
  studentPortal: {
    studentId: "est-001",
    course: "2° Medio A",
    enrollment: { status: "regular", schoolYear: 2026, level: "Enseñanza Media", headTeacher: "Daniela Rojas", school: "Liceo Bicentenario Los Arrayanes" },
    schoolYearProgress: 68,
    completedAssessments: 18,
    totalAssessments: 26,
    courses: [
      { code: "MAT-2M", name: "Matemática", professor: "Daniela Rojas", schedule: "Lun y mié · 08:00", room: "Sala 12", attendance: 82, average: 5.2, color: "sage", grades: [{ id: "g-001", label: "Control de álgebra", date: "2026-08-20", weight: 20, value: 5.6, published: true }, { id: "g-002", label: "Guía de funciones", date: "2026-08-27", weight: 30, value: 5.1, published: true }, { id: "g-003", label: "Prueba de unidad", date: "2026-08-12", weight: 50, value: 5.1, published: true }] },
      { code: "LEN-2M", name: "Lengua y Literatura", professor: "Cristóbal Reyes", schedule: "Mar y jue · 08:00", room: "Sala 12", attendance: 76, average: 4.5, color: "blue", grades: [{ id: "g-004", label: "Ensayo argumentativo", date: "2026-08-19", weight: 25, value: 5.0, published: true }, { id: "g-005", label: "Control de lectura", date: "2026-08-25", weight: 25, value: 4.7, published: true }, { id: "g-006", label: "Prueba de unidad", date: "2026-08-13", weight: 50, value: 4.1, published: true }] },
      { code: "HIS-2M", name: "Historia, Geografía y Cs. Sociales", professor: "Francisca Mella", schedule: "Mar · 11:45", room: "Sala 8", attendance: 68, average: 3.8, color: "gold", grades: [{ id: "g-007", label: "Línea de tiempo", date: "2026-08-18", weight: 30, value: 4.8, published: true }, { id: "g-008", label: "Control de fuentes", date: "2026-08-24", weight: 20, value: 3.2, published: true }, { id: "g-009", label: "Prueba de unidad", date: "2026-08-11", weight: 50, value: 3.4, published: true }] },
      { code: "CIE-2M", name: "Ciencias Naturales", professor: "Andrés Navarro", schedule: "Vie · 10:15", room: "Laboratorio 2", attendance: 61, average: 3.1, color: "clay", grades: [{ id: "g-010", label: "Informe de laboratorio", date: "2026-08-17", weight: 25, value: 4.0, published: true }, { id: "g-011", label: "Actividad experimental", date: "2026-08-23", weight: 25, value: 3.4, published: true }, { id: "g-012", label: "Prueba de unidad", date: "2026-08-10", weight: 50, value: 2.5, published: true }] },
    ],
    upcoming: [
      { id: "cal-001", date: "2026-09-02", time: "08:00", day: "02", month: "SEP", title: "Guía de funciones", course: "Matemática", type: "Entrega" },
      { id: "cal-002", date: "2026-09-05", time: "10:15", day: "05", month: "SEP", title: "Prueba de unidad", course: "Ciencias Naturales", type: "Evaluación" },
      { id: "cal-003", date: "2026-09-08", time: "11:45", day: "08", month: "SEP", title: "Exposición grupal", course: "Historia", type: "Presentación" },
    ],
    messages: [
      { id: "msg-001", title: "Plan de acompañamiento disponible", detail: "Tu profesora jefe recomienda organizar las próximas evaluaciones en bloques breves y revisar el calendario cada lunes.", author: "Daniela Rojas", publishedAt: "2026-08-27" },
    ],
    attendanceSummary: { present: 32, absent: 8, late: 5, excused: 2, total: 47 },
    attendanceSessions: [
      { id: "att-001", date: "2026-08-28", course: "Matemática", title: "Funciones lineales", block: "Bloque 1", status: "present" },
      { id: "att-002", date: "2026-08-27", course: "Lengua y Literatura", title: "Lectura argumentativa", block: "Bloque 2", status: "present" },
      { id: "att-003", date: "2026-08-26", course: "Historia", title: "Fuentes primarias", block: "Bloque 3", status: "late" },
      { id: "att-004", date: "2026-08-25", course: "Ciencias Naturales", title: "Diseño experimental", block: "Bloque 2", status: "absent" },
      { id: "att-005", date: "2026-08-24", course: "Matemática", title: "Pendiente de una recta", block: "Bloque 1", status: "excused" },
    ],
  },
  alerts: [
    { id: "alt-001", studentId: "est-001", severity: "high", status: "open", title: "Asistencia bajo umbral", rule: "ASISTENCIA_MENOR_75_V1", evidence: "68% observado / 75% mínimo", createdAt: "2026-08-27T14:30:00.000Z" },
    { id: "alt-002", studentId: "est-001", severity: "medium", status: "assigned", title: "Promedio en zona preventiva", rule: "PROMEDIO_MENOR_45_V1", evidence: "4,1 observado / 4,5 preventivo", createdAt: "2026-08-26T10:00:00.000Z" },
    { id: "alt-003", studentId: "est-002", severity: "medium", status: "following", title: "Asistencia en descenso", rule: "TENDENCIA_ASISTENCIA_V1", evidence: "-11 puntos porcentuales en 3 semanas", createdAt: "2026-08-25T09:15:00.000Z" },
    { id: "alt-004", studentId: "est-004", severity: "high", status: "open", title: "Promedio bajo aprobación", rule: "PROMEDIO_MENOR_40_V1", evidence: "3,8 observado / 4,0 mínimo", createdAt: "2026-08-28T08:45:00.000Z" },
  ],
  alertRules: [
    { id: "ASISTENCIA_MENOR_75_V1", name: "Asistencia crítica", description: "Activa una alerta cuando la asistencia acumulada es inferior a 75%.", severity: "high", active: true },
    { id: "PROMEDIO_MENOR_40_V1", name: "Promedio bajo aprobación", description: "Activa una alerta cuando el promedio general es inferior a 4,0.", severity: "high", active: true },
    { id: "RIESGO_COMBINADO_V1", name: "Riesgo académico combinado", description: "Activa una alerta preventiva cuando la asistencia es inferior a 80% y el promedio es inferior a 4,5.", severity: "medium", active: true },
  ],
  justifications: [
    { id: "jus-001", studentId: "est-001", classSessionId: "class-004", reason: "Atención médica; certificado entregado a Inspectoría.", attachmentName: "certificado-medico-demo.pdf", status: "pending", submittedAt: "2026-10-14T15:20:00.000Z", reviewedAt: null, reviewedBy: null, reviewNote: "" },
    { id: "jus-002", studentId: "est-004", classSessionId: "class-002", reason: "Trámite familiar informado por el apoderado.", attachmentName: "", status: "approved", submittedAt: "2026-10-10T09:05:00.000Z", reviewedAt: "2026-10-11T11:30:00.000Z", reviewedBy: "Daniela Rojas", reviewNote: "Antecedente verificado por Inspectoría." },
  ],
  interventions: [
    { id: "int-001", studentId: "est-001", alertId: "alt-002", type: "Contacto apoderado", note: "Se acordó revisar la planificación de evaluaciones.", author: "Profesor jefe demo", createdAt: "2026-08-27T16:00:00.000Z" },
    { id: "int-002", studentId: "est-002", alertId: "alt-003", type: "Seguimiento", note: "Caso derivado a UTP para revisión preventiva.", author: "UTP demo", createdAt: "2026-08-26T13:20:00.000Z" },
  ],
};
