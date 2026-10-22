import { useEffect, useMemo, useState } from "react";
import sigaaLogo from "./assets/sigaa-logo.png";

const labels = {
  high: "Alto",
  medium: "Medio",
  low: "Bajo",
  open: "Abierta",
  assigned: "Asignada",
  following: "En seguimiento",
};

async function teacherMutation(path, options) {
  const response = await fetch(`/api/teacher${path}`, {
    ...options,
    headers: { "content-type": "application/json", "x-demo-role": "teacher", ...(options?.headers ?? {}) },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "teacher_operation_failed");
  return body;
}

function formatSchoolDate(value) {
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function Icon({ name }) {
  const paths = {
    dashboard: <><path d="M4 13h6V4H4v9Zm0 7h6v-4H4v4Zm10 0h6v-9h-6v9Zm0-16v4h6V4h-6Z" /></>,
    students: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    alerts: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></>,
    grades: <><path d="M4 4h16v16H4zM8 9h8M8 13h5" /><path d="m15 16 1.5 1.5L20 14" /></>,
    notes: <><path d="M4 4h16v14H7l-3 3V4Z" /><path d="M8 9h8M8 13h5" /></>,
  };
  return <svg aria-hidden="true" className="icon" fill={name === "dashboard" ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Metric({ label, value, detail, accent = "sage", trend = [3, 5, 4, 7, 6] }) {
  return (
    <article className={`metric metric--${accent}`}>
      <div className="metric__top"><span>{label}</span><span className="metric__signal">En vivo</span></div>
      <div className="metric__body"><strong>{value}</strong><div className="micro-chart" aria-hidden="true">{trend.map((height, index) => <i key={index} style={{ height: `${height * 5}px` }} />)}</div></div>
      <small>{detail}</small>
    </article>
  );
}

function RiskBadge({ value }) {
  return <span className={`badge badge--${value}`}>{labels[value] ?? value}</span>;
}

function BrandMark() {
  return <span className="brand-logo" aria-hidden="true"><img src={sigaaLogo} alt="" /></span>;
}

function AppShell({ activeView, onNavigate, onLogout, children, system }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigation = [["dashboard", "Resumen", "dashboard"], ["courses", "Mis cursos", "book"], ["classes", "Clases y asistencia", "calendar"], ["grades", "Calificaciones", "grades"], ["annotations", "Anotaciones", "notes"], ["justifications", "Justificaciones", "notes"], ["alerts", "Alertas", "alerts"]];
  return (
    <div className="app-shell">
      <aside className={mobileMenuOpen ? "sidebar mobile-menu-open" : "sidebar"}>
        <div className="brand">
          <BrandMark />
          <div><strong>SIGAA</strong><small>Gestión escolar inteligente</small></div>
        </div>
        <button className="mobile-menu-toggle" aria-expanded={mobileMenuOpen} aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"} onClick={() => setMobileMenuOpen((open) => !open)} type="button"><span /><span /></button>
        <nav aria-label="Navegación principal">
          <span className="nav-caption">Espacio de trabajo</span>
          {navigation.map(([view, label, icon]) => (
            <button className={activeView === view ? "nav-button nav-button--active" : "nav-button"} key={view} onClick={() => { onNavigate(view); setMobileMenuOpen(false); }} type="button"><Icon name={icon} /><span>{label}</span>{view === "alerts" && <em>12</em>}</button>
          ))}
          <div className="mobile-menu-account"><span>DR</span><div><strong>Daniela Rojas</strong><small>Profesora · 3 asignaciones</small></div></div>
          <button className="mobile-menu-logout" onClick={onLogout} type="button"><span>Cerrar sesión</span><span>↗</span></button>
        </nav>
        <div className="sidebar__footer">
          <div className="profile-card"><span className="profile-card__avatar">DR</span><div><strong>Daniela Rojas</strong><small>Profesora · 3 asignaciones</small></div><button aria-label="Salir de demo" onClick={onLogout} type="button">•••</button></div>
          <div className="system-status"><div className={`system-dot system-dot--${system.status}`} /><span>{system.message}</span></div>
        </div>
      </aside>
      <div className="app-stage">
        <header className="topbar">
          <div className="topbar__context"><span>Panel institucional</span><i>/</i><strong>{navigation.find(([view]) => view === activeView)?.[1]}</strong></div>
          <div className="topbar__actions"><button className="command-button" type="button"><Icon name="search" /><span>Buscar en SIGAA</span><kbd>⌘ K</kbd></button><button className="notification-button" aria-label="Notificaciones" type="button"><Icon name="alerts" /><i /></button><span className="topbar__avatar">DR</span></div>
        </header>
        <main className="workspace">{children}</main>
      </div>
    </div>
  );
}

function Login({ onAuthenticate, system }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onAuthenticate(email, password);
    } catch (_error) {
      setError("Correo o contraseña incorrectos.");
    } finally {
      setSubmitting(false);
    }
  }

  function useDemoAccount(type) {
    if (type === "teacher") {
      setEmail("docente@sigaa.demo");
      setPassword("Docente2026!");
    } else {
      setEmail("estudiante@sigaa.demo");
      setPassword("Estudiante2026!");
    }
    setError("");
  }

  return (
    <main className="login-page">
      <section className="login-intro">
        <div className="login-logo"><img src={sigaaLogo} alt="SIGAA Gestión Escolar Inteligente" /></div>
        <p className="eyebrow">Gestión escolar · Comunidad educativa</p>
        <h1>Cada estudiante merece llegar más lejos.</h1>
        <p>Una experiencia escolar diseñada para convertir señales tempranas en acompañamiento humano, oportuno y trazable.</p>
        <div className="prototype-note"><span className="prototype-note__dot" /><strong>Entorno de demostración</strong><span>Información completamente sintética.</span></div>
      </section>
      <form className="login-card" aria-labelledby="demo-title" onSubmit={submit}>
        <div className="login-card__header"><span className="login-card__logo"><img src={sigaaLogo} alt="SIGAA" /></span><span>Portal del establecimiento</span></div>
        <h2 id="demo-title">Bienvenido de vuelta</h2>
        <p>Tu cuenta determina automáticamente si ingresas como profesor, estudiante u otro integrante autorizado.</p>
        <label>Correo institucional<input autoComplete="username" onChange={(event) => setEmail(event.target.value)} placeholder="nombre@sigaa.demo" required type="email" value={email} /></label>
        <label>Contraseña<input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} placeholder="Ingresa tu contraseña" required type="password" value={password} /></label>
        {error && <div className="login-error" role="alert">{error}</div>}
        <button className="primary-button" disabled={submitting} type="submit"><span>{submitting ? "Validando…" : "Ingresar al portal"}</span><span>→</span></button>
        <div className="demo-accounts"><span>Accesos de demostración</span><div><button onClick={() => useDemoAccount("teacher")} type="button">Usar cuenta profesor jefe</button><button onClick={() => useDemoAccount("student")} type="button">Usar cuenta estudiante</button></div></div>
        <small className={`connection connection--${system.status}`}>{system.message}</small>
      </form>
    </main>
  );
}

function CourseCard({ course }) {
  return (
    <article className={`course-card course-card--${course.color}`}>
      <div className="course-card__top"><span>{course.code}</span><span>{course.attendance}% asistencia</span></div>
      <h3>{course.name}</h3>
      <p>{course.professor}</p>
      <div className="course-card__footer"><div><small>Promedio actual</small><strong>{course.average.toFixed(1)}</strong></div><div className="course-grade-dots" aria-label={`${course.grades.length} evaluaciones registradas`}>{course.grades.map((grade) => <i className={grade.value < 4 ? "grade-dot grade-dot--low" : "grade-dot"} key={grade.label} title={`${grade.label}: ${grade.value.toFixed(1)}`} />)}</div></div>
    </article>
  );
}

const studentViews = [["home", "Mi inicio", "dashboard"], ["subjects", "Mis asignaturas", "book"], ["attendance", "Mi asistencia", "grades"], ["calendar", "Calendario", "calendar"], ["annotations", "Mis anotaciones", "notes"]];
const attendanceLabels = { present: "Presente", absent: "Ausente", late: "Atraso", excused: "Justificada" };

function StudentHome({ workspace }) {
  const { student } = workspace;
  return <><header className="student-welcome"><div><p>{student.course.toUpperCase()} · SEGUNDO SEMESTRE 2026</p><h1>Hola, {student.name.split(" ")[0]}.</h1><span>Este es tu pulso escolar actualizado.</span></div><div className="student-id"><span>Estudiante regular</span><strong>{student.identifier}</strong></div></header><section className="student-overview"><article className="academic-progress"><div><p>Avance del año escolar</p><strong>{workspace.schoolYearProgress}%</strong><span>{workspace.completedAssessments} de {workspace.totalAssessments} evaluaciones registradas</span></div><div className="progress-ring" style={{ "--progress": `${workspace.schoolYearProgress * 3.6}deg` }}><span>{workspace.schoolYearProgress}%</span></div></article><article className="student-stat"><span>Promedio general</span><strong>{student.average.toFixed(1)}</strong><small>Escala de 1,0 a 7,0</small></article><article className="student-stat student-stat--warning"><span>Asistencia global</span><strong>{student.attendance}%</strong><small>Meta recomendada: 75%</small></article><article className="student-stat"><span>Curso actual</span><strong>{student.course}</strong><small>{workspace.enrollment.school}</small></article></section><section className="student-layout"><div><div className="section-heading"><div><p>Mis asignaturas</p><h2>Notas del semestre</h2></div><span>{workspace.subjects.length} asignaturas inscritas</span></div><div className="course-grid">{workspace.subjects.map((course) => <CourseCard course={course} key={course.code} />)}</div><article className="gradebook panel"><div className="panel__header"><div><p>Detalle</p><h2>Últimas calificaciones publicadas</h2></div></div><div className="gradebook__head"><span>Evaluación</span><span>Asignatura</span><span>Ponderación</span><span>Nota</span></div>{workspace.subjects.flatMap((course) => course.grades.slice(-1).map((grade) => <div className="gradebook__row" key={grade.id}><span><strong>{grade.label}</strong><small>{formatSchoolDate(grade.date)}</small></span><span>{course.name}</span><span>{grade.weight}%</span><strong className={grade.value < 4 ? "grade-value grade-value--low" : "grade-value"}>{grade.value.toFixed(1)}</strong></div>))}</article></div><aside className="student-rail"><article className="student-message"><span>ACOMPAÑAMIENTO</span><h3>{workspace.messages[0].title}</h3><p>{workspace.messages[0].detail}</p><small>{workspace.messages[0].author}</small></article><article className="upcoming-panel"><div className="section-heading"><div><p>Agenda</p><h2>Próximamente</h2></div></div>{workspace.calendar.map((item) => <div className="upcoming-item" key={item.id}><time><strong>{item.day}</strong><span>{item.month}</span></time><div><span>{item.type}</span><strong>{item.title}</strong><small>{item.course} · {item.time}</small></div></div>)}</article></aside></section></>;
}

function StudentSubjects({ workspace }) {
  return <><header className="student-section-header"><p>TRAYECTORIA ACADÉMICA</p><h1>Mis asignaturas</h1><span>Solo ves calificaciones que ya fueron publicadas por tus profesores.</span></header><section className="subject-detail-grid">{workspace.subjects.map((subject) => <article className={`subject-detail subject-detail--${subject.color}`} key={subject.code}><div className="subject-detail__head"><div><span>{subject.code}</span><h2>{subject.name}</h2><p>{subject.professor} · {subject.schedule} · {subject.room}</p></div><strong>{subject.average.toFixed(1)}</strong></div><div className="subject-detail__meta"><span>{subject.attendance}% asistencia</span><span>{subject.grades.length} notas publicadas</span></div><div className="subject-grades">{subject.grades.map((grade) => <div key={grade.id}><span><strong>{grade.label}</strong><small>{formatSchoolDate(grade.date)} · {grade.weight}%</small></span><b className={grade.value < 4 ? "grade-value--low" : ""}>{grade.value.toFixed(1)}</b></div>)}</div></article>)}</section></>;
}

function StudentAttendance({ workspace }) {
  const summary = workspace.attendanceSummary;
  return <><header className="student-section-header"><p>REGISTRO PERSONAL</p><h1>Mi asistencia</h1><span>Consulta tus registros y solicita revisión al establecimiento si encuentras una diferencia.</span></header><section className="attendance-summary"><article><span>Asistencia global</span><strong>{workspace.student.attendance}%</strong><small>{summary.total} clases registradas</small></article>{[["present", summary.present], ["absent", summary.absent], ["late", summary.late], ["excused", summary.excused]].map(([status, value]) => <article className={`attendance-count attendance-count--${status}`} key={status}><span>{attendanceLabels[status]}</span><strong>{value}</strong><small>registro{value === 1 ? "" : "s"}</small></article>)}</section><section className="student-two-column"><article className="panel student-attendance-list"><div className="panel__header"><div><p>Historial reciente</p><h2>Últimas clases</h2></div></div>{workspace.attendanceSessions.map((session) => <div className="attendance-session" key={session.id}><time>{formatSchoolDate(session.date)}</time><span><strong>{session.course}</strong><small>{session.title} · {session.block}</small></span><em className={`attendance-pill attendance-pill--${session.status}`}>{attendanceLabels[session.status]}</em></div>)}</article><article className="panel subject-attendance"><div className="panel__header"><div><p>Por asignatura</p><h2>Detalle del semestre</h2></div></div>{workspace.subjects.map((subject) => <div key={subject.code}><span><strong>{subject.name}</strong><small>{subject.attendance}%</small></span><div><i style={{ width: `${subject.attendance}%` }} /></div></div>)}</article></section></>;
}

function StudentCalendar({ workspace }) {
  return <><header className="student-section-header"><p>PLANIFICACIÓN PERSONAL</p><h1>Calendario</h1><span>Evaluaciones, entregas y actividades publicadas para tu curso.</span></header><section className="calendar-board">{workspace.calendar.map((item) => <article className="calendar-card" key={item.id}><time><strong>{item.day}</strong><span>{item.month}</span></time><div><span>{item.type}</span><h2>{item.title}</h2><p>{item.course}</p><small>{item.time} · Publicado para {workspace.student.course}</small></div></article>)}</section></>;
}

function StudentAnnotations({ workspace }) {
  return <><header className="student-section-header"><p>DESARROLLO Y CONVIVENCIA</p><h1>Mis anotaciones</h1><span>Aquí aparecen únicamente registros que el establecimiento decidió compartir contigo.</span></header><section className="student-annotation-feed">{workspace.annotations.map((annotation) => <article className={`student-annotation student-annotation--${annotation.type}`} key={annotation.id}><span>{annotation.type === "positive" ? "+" : "−"}</span><div><div><em>{annotation.type === "positive" ? "Positiva" : "Por mejorar"}</em><time>{new Date(annotation.createdAt).toLocaleDateString("es-CL")}</time></div><h2>{annotation.category}</h2><p>{annotation.text}</p><small>{annotation.author}</small></div></article>)}</section><article className="privacy-note"><strong>Tu privacidad importa</strong><p>Las observaciones internas del equipo escolar y los datos de otros estudiantes nunca se muestran en este espacio.</p></article></>;
}

function StudentPortal({ workspace, onLogout, system }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeView, setActiveView] = useState("home");
  const student = workspace.student;
  const navigate = (next) => { setActiveView(next); setMobileMenuOpen(false); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const content = activeView === "subjects" ? <StudentSubjects workspace={workspace} /> : activeView === "attendance" ? <StudentAttendance workspace={workspace} /> : activeView === "calendar" ? <StudentCalendar workspace={workspace} /> : activeView === "annotations" ? <StudentAnnotations workspace={workspace} /> : <StudentHome workspace={workspace} />;
  return (
    <div className="student-portal-shell">
      <aside className={mobileMenuOpen ? "student-sidebar mobile-menu-open" : "student-sidebar"}>
        <div className="brand"><BrandMark /><div><strong>SIGAA</strong><small>Portal del estudiante</small></div></div>
        <button className="mobile-menu-toggle" aria-expanded={mobileMenuOpen} aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"} onClick={() => setMobileMenuOpen((open) => !open)} type="button"><span /><span /></button>
        <nav aria-label="Navegación del estudiante"><span className="nav-caption">Mi experiencia</span>{studentViews.map(([view, label, icon]) => <button className={activeView === view ? "nav-button nav-button--active" : "nav-button"} key={view} onClick={() => navigate(view)} type="button"><Icon name={icon} /><span>{label}</span></button>)}<div className="mobile-menu-account"><span>CS</span><div><strong>{student.name}</strong><small>{student.course}</small></div></div><button className="mobile-menu-logout" onClick={onLogout} type="button"><span>Cerrar sesión</span><span>↗</span></button></nav>
        <div className="student-profile"><span className="student-profile__avatar">CS</span><div><strong>{student.name}</strong><small>{student.course}</small></div></div>
        <div className="system-status"><div className={`system-dot system-dot--${system.status}`} /><span>{system.message}</span></div>
      </aside>
      <div className="student-stage">
        <header className="student-topbar"><div><span>Portal académico</span><i>/</i><strong>{studentViews.find(([view]) => view === activeView)?.[1]}</strong></div><div><button className="notification-button" aria-label="Notificaciones" type="button"><Icon name="alerts" /></button><button className="student-logout" onClick={onLogout} type="button">Cerrar sesión</button></div></header>
        <main className="student-workspace">{content}</main>
      </div>
    </div>
  );
}

function AssignmentPicker({ assignments, value, onChange, label = "Curso y asignatura" }) {
  return (
    <label className="field-control"><span>{label}</span><select onChange={(event) => onChange(event.target.value)} value={value}>{assignments.map((assignment) => <option key={assignment.id} value={assignment.id}>{assignment.courseName} · {assignment.subjectName}</option>)}</select></label>
  );
}

function TeacherCourses({ data, onNavigate }) {
  const { assignments } = data.teacherWorkspace;
  return (
    <>
      <Header kicker="Carga docente · 2026" title="Mis cursos" subtitle="Solo aparecen los cursos y asignaturas vigentes de la profesora" />
      <section className="teacher-course-grid">
        {assignments.map((assignment) => {
          const nextClass = data.teacherWorkspace.classSessions.filter(({ courseSubjectId, status }) => courseSubjectId === assignment.id && status === "planned").sort((a, b) => a.date.localeCompare(b.date))[0];
          return <article className="teacher-course" key={assignment.id}><div className="teacher-course__head"><span>{assignment.subjectCode}</span>{assignment.isHeadTeacher && <em>Jefatura</em>}</div><h2>{assignment.courseName}</h2><p>{assignment.subjectName}</p><dl><div><dt>Horario</dt><dd>{assignment.schedule}</dd></div><div><dt>Estudiantes</dt><dd>{assignment.studentIds.length}</dd></div><div><dt>Próxima clase</dt><dd>{nextClass ? formatSchoolDate(nextClass.date) : "Por planificar"}</dd></div></dl><div className="teacher-course__actions"><button onClick={() => onNavigate("classes")} type="button">Abrir libro de clases</button><button onClick={() => onNavigate("grades")} type="button">Calificaciones</button></div></article>;
        })}
      </section>
      <article className="scope-notice"><strong>Ámbito protegido</strong><p>Daniela puede planificar, pasar asistencia y calificar únicamente dentro de estas asignaciones. La jefatura le permite acompañar a 2° Medio A, pero no modificar notas registradas por otros profesores.</p></article>
    </>
  );
}

function AttendanceEditor({ data, session, assignment, onWorkspaceChange, onClose }) {
  const students = data.students.filter(({ id }) => assignment.studentIds.includes(id));
  const [records, setRecords] = useState(() => Object.fromEntries(students.map(({ id }) => [id, session.attendance[id] ?? "present"])));
  const [saving, setSaving] = useState(false);
  const statusOptions = [["present", "Presente"], ["absent", "Ausente"], ["late", "Atraso"], ["excused", "Justificado"]];

  async function saveAttendance() {
    setSaving(true);
    try {
      const body = await teacherMutation(`/classes/${session.id}/attendance`, { method: "PUT", body: JSON.stringify({ records: students.map(({ id }) => ({ studentId: id, status: records[id] })) }) });
      onWorkspaceChange(body.workspace);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return <div className="record-editor"><div className="record-editor__header"><div><span>ASISTENCIA</span><h3>{session.title}</h3><p>{assignment.courseName} · {formatSchoolDate(session.date)} · {session.block}</p></div><button aria-label="Cerrar asistencia" onClick={onClose} type="button">×</button></div><div className="attendance-list">{students.map((student) => <div className="attendance-row" key={student.id}><span className="avatar">{student.name.split(" ").map((part) => part[0]).join("")}</span><div><strong>{student.name}</strong><small>{student.identifier}</small></div><div className="attendance-options">{statusOptions.map(([value, label]) => <button className={records[student.id] === value ? `attendance-state attendance-state--${value} attendance-state--active` : `attendance-state attendance-state--${value}`} key={value} onClick={() => setRecords((current) => ({ ...current, [student.id]: value }))} type="button">{label}</button>)}</div></div>)}</div><button className="teacher-primary" disabled={saving} onClick={saveAttendance} type="button">{saving ? "Guardando…" : "Guardar asistencia"}</button></div>;
}

function TeacherClasses({ data, onWorkspaceChange }) {
  const workspace = data.teacherWorkspace;
  const [assignmentId, setAssignmentId] = useState(workspace.assignments[0].id);
  const [attendanceSessionId, setAttendanceSessionId] = useState(null);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ date: "2026-09-09", startTime: "08:00", block: "Bloque 1", title: "", objective: "" });
  const assignment = workspace.assignments.find(({ id }) => id === assignmentId);
  const sessions = workspace.classSessions.filter(({ courseSubjectId }) => courseSubjectId === assignmentId).sort((a, b) => `${a.date}${a.startTime}`.localeCompare(`${b.date}${b.startTime}`));
  const attendanceSession = workspace.classSessions.find(({ id }) => id === attendanceSessionId);

  async function scheduleClass(event) {
    event.preventDefault();
    const body = await teacherMutation("/classes", { method: "POST", body: JSON.stringify({ courseSubjectId: assignmentId, ...form }) });
    onWorkspaceChange(body.workspace);
    setMessage("Clase futura agregada correctamente.");
    setForm((current) => ({ ...current, title: "", objective: "" }));
  }

  return <><Header kicker="Libro de clases" title="Clases y asistencia" subtitle="Planifica sesiones futuras y registra la asistencia del curso" /><section className="teacher-work-grid"><div><div className="teacher-toolbar"><AssignmentPicker assignments={workspace.assignments} onChange={(value) => { setAssignmentId(value); setAttendanceSessionId(null); }} value={assignmentId} /><span>{assignment.room} · {assignment.schedule}</span></div><div className="class-timeline">{sessions.map((session) => { const attendanceCount = Object.keys(session.attendance).length; return <article className="class-entry" key={session.id}><time><strong>{new Date(`${session.date}T12:00:00`).getDate()}</strong><span>{new Date(`${session.date}T12:00:00`).toLocaleDateString("es-CL", { month: "short" })}</span></time><div><span className={`class-status class-status--${session.status}`}>{session.status === "planned" ? "Planificada" : "Realizada"}</span><h3>{session.title}</h3><p>{session.objective}</p><small>{session.startTime} · {session.block}</small></div><button onClick={() => setAttendanceSessionId(session.id)} type="button">{attendanceCount ? `Asistencia ${attendanceCount}/${assignment.studentIds.length}` : "Pasar asistencia"}</button></article>; })}</div>{attendanceSession && <AttendanceEditor assignment={assignmentBySession(workspace, attendanceSession)} data={data} onClose={() => setAttendanceSessionId(null)} onWorkspaceChange={onWorkspaceChange} session={attendanceSession} />}</div><form className="teacher-form" onSubmit={scheduleClass}><div className="teacher-form__title"><span>PLANIFICACIÓN</span><h2>Agregar clase futura</h2><p>La clase quedará disponible para registrar asistencia cuando corresponda.</p></div><label><span>Fecha</span><input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label><div className="form-split"><label><span>Hora</span><input required type="time" value={form.startTime} onChange={(event) => setForm({ ...form, startTime: event.target.value })} /></label><label><span>Bloque</span><input required value={form.block} onChange={(event) => setForm({ ...form, block: event.target.value })} /></label></div><label><span>Título o contenido</span><input required placeholder="Ej. Sistemas de ecuaciones" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label><label><span>Objetivo de aprendizaje</span><textarea required rows="4" placeholder="Describe el propósito pedagógico de la clase" value={form.objective} onChange={(event) => setForm({ ...form, objective: event.target.value })} /></label>{message && <div className="form-success">{message}</div>}<button className="teacher-primary" type="submit">Agregar al calendario</button></form></section></>;
}

function assignmentBySession(workspace, session) {
  return workspace.assignments.find(({ id }) => id === session.courseSubjectId);
}

function TeacherGrades({ data, onWorkspaceChange }) {
  const workspace = data.teacherWorkspace;
  const [assignmentId, setAssignmentId] = useState(workspace.assignments[0].id);
  const assignment = workspace.assignments.find(({ id }) => id === assignmentId);
  const evaluations = workspace.evaluations.filter(({ courseSubjectId }) => courseSubjectId === assignmentId);
  const [evaluationId, setEvaluationId] = useState(evaluations[0]?.id ?? "");
  const evaluation = workspace.evaluations.find(({ id }) => id === evaluationId);
  const students = data.students.filter(({ id }) => assignment.studentIds.includes(id));
  const [grades, setGrades] = useState({});
  const [form, setForm] = useState({ name: "", date: "2026-09-12", weight: 25 });
  const [message, setMessage] = useState("");

  useEffect(() => { setGrades(evaluation?.grades ?? {}); }, [evaluationId, evaluation]);

  function changeAssignment(value) {
    const firstEvaluation = workspace.evaluations.find(({ courseSubjectId }) => courseSubjectId === value);
    setAssignmentId(value);
    setEvaluationId(firstEvaluation?.id ?? "");
    setMessage("");
  }

  async function createEvaluation(event) {
    event.preventDefault();
    const body = await teacherMutation("/evaluations", { method: "POST", body: JSON.stringify({ courseSubjectId: assignmentId, ...form, weight: Number(form.weight) }) });
    onWorkspaceChange(body.workspace);
    setEvaluationId(body.evaluation.id);
    setForm((current) => ({ ...current, name: "" }));
    setMessage("Evaluación creada. Ya puedes ingresar sus calificaciones.");
  }

  async function saveGrades() {
    const records = students.filter(({ id }) => grades[id] !== "" && grades[id] != null).map(({ id }) => ({ studentId: id, value: Number(grades[id]) }));
    const body = await teacherMutation(`/evaluations/${evaluationId}/grades`, { method: "PUT", body: JSON.stringify({ records }) });
    onWorkspaceChange(body.workspace);
    setMessage("Calificaciones guardadas correctamente.");
  }

  return <><Header kicker="Evaluación" title="Calificaciones" subtitle="Crea evaluaciones e ingresa notas solo para tus asignaturas" /><div className="teacher-toolbar teacher-toolbar--grades"><AssignmentPicker assignments={workspace.assignments.filter(({ subjectCode }) => subjectCode !== "ORI-2M")} onChange={changeAssignment} value={assignmentId} /><label className="field-control"><span>Evaluación</span><select onChange={(event) => setEvaluationId(event.target.value)} value={evaluationId}><option value="">Selecciona una evaluación</option>{evaluations.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.weight}%</option>)}</select></label></div><section className="teacher-work-grid"><article className="panel grade-entry"><div className="panel__header"><div><p>LIBRO DE NOTAS</p><h2>{evaluation?.name ?? "Sin evaluación seleccionada"}</h2></div>{evaluation && <span>{formatSchoolDate(evaluation.date)} · {evaluation.weight}%</span>}</div>{evaluation ? <><div className="grade-entry__head"><span>Estudiante</span><span>Nota</span><span>Estado</span></div>{students.map((student) => { const value = grades[student.id]; return <div className="grade-entry__row" key={student.id}><div><strong>{student.name}</strong><small>{student.identifier}</small></div><input aria-label={`Nota de ${student.name}`} max="7" min="1" onChange={(event) => setGrades({ ...grades, [student.id]: event.target.value })} placeholder="—" step="0.1" type="number" value={value ?? ""} /><span className={Number(value) >= 4 ? "grade-state grade-state--pass" : value ? "grade-state grade-state--low" : "grade-state"}>{value ? (Number(value) >= 4 ? "Aprobada" : "Bajo 4,0") : "Pendiente"}</span></div>})}<button className="teacher-primary" onClick={saveGrades} type="button">Guardar calificaciones</button></> : <div className="empty-state">Crea o selecciona una evaluación para comenzar.</div>}</article><form className="teacher-form" onSubmit={createEvaluation}><div className="teacher-form__title"><span>NUEVA EVALUACIÓN</span><h2>Crear evaluación</h2><p>La ponderación debe corresponder al plan de la asignatura.</p></div><label><span>Nombre</span><input required placeholder="Ej. Prueba de funciones" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label><span>Fecha</span><input required type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></label><label><span>Ponderación (%)</span><input max="100" min="1" required type="number" value={form.weight} onChange={(event) => setForm({ ...form, weight: event.target.value })} /></label>{message && <div className="form-success">{message}</div>}<button className="teacher-primary" type="submit">Crear evaluación</button></form></section></>;
}

function TeacherAnnotations({ data, onWorkspaceChange }) {
  const workspace = data.teacherWorkspace;
  const [assignmentId, setAssignmentId] = useState(workspace.assignments[0].id);
  const assignment = workspace.assignments.find(({ id }) => id === assignmentId);
  const students = data.students.filter(({ id }) => assignment.studentIds.includes(id));
  const [form, setForm] = useState({ studentId: students[0]?.id ?? "", type: "positive", category: "Participación", text: "" });
  const [message, setMessage] = useState("");
  const visibleAnnotations = workspace.annotations.filter(({ courseId }) => courseId === assignment.courseId);

  function changeAssignment(value) {
    const next = workspace.assignments.find(({ id }) => id === value);
    setAssignmentId(value);
    setForm((current) => ({ ...current, studentId: next.studentIds[0] }));
  }

  async function addAnnotation(event) {
    event.preventDefault();
    const body = await teacherMutation("/annotations", { method: "POST", body: JSON.stringify({ courseSubjectId: assignmentId, ...form }) });
    onWorkspaceChange(body.workspace);
    setForm((current) => ({ ...current, text: "" }));
    setMessage("Anotación registrada en el historial del estudiante.");
  }

  return <><Header kicker="Convivencia y desarrollo" title="Anotaciones" subtitle="Registra hechos observables, positivos o negativos, con contexto y trazabilidad" /><section className="teacher-work-grid"><div><div className="teacher-toolbar"><AssignmentPicker assignments={workspace.assignments} onChange={changeAssignment} value={assignmentId} /></div><div className="annotation-feed">{visibleAnnotations.length ? visibleAnnotations.map((annotation) => { const student = data.students.find(({ id }) => id === annotation.studentId); return <article className={`annotation annotation--${annotation.type}`} key={annotation.id}><div className="annotation__mark">{annotation.type === "positive" ? "+" : "−"}</div><div><div className="annotation__meta"><span>{annotation.type === "positive" ? "Positiva" : "Negativa"}</span><time>{new Date(annotation.createdAt).toLocaleDateString("es-CL")}</time></div><h3>{student?.name} · {annotation.category}</h3><p>{annotation.text}</p><small>{annotation.author} · {assignment.courseName}</small></div></article>; }) : <div className="empty-state">No existen anotaciones para este curso.</div>}</div></div><form className="teacher-form" onSubmit={addAnnotation}><div className="teacher-form__title"><span>NUEVO REGISTRO</span><h2>Agregar anotación</h2><p>Describe un hecho concreto. Evita juicios personales o información innecesaria.</p></div><label><span>Estudiante</span><select value={form.studentId} onChange={(event) => setForm({ ...form, studentId: event.target.value })}>{students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}</select></label><fieldset className="annotation-type"><legend>Tipo</legend><button className={form.type === "positive" ? "annotation-type__positive annotation-type--active" : "annotation-type__positive"} onClick={() => setForm({ ...form, type: "positive" })} type="button">+ Positiva</button><button className={form.type === "negative" ? "annotation-type__negative annotation-type--active" : "annotation-type__negative"} onClick={() => setForm({ ...form, type: "negative" })} type="button">− Negativa</button></fieldset><label><span>Categoría</span><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}><option>Participación</option><option>Responsabilidad</option><option>Convivencia</option><option>Esfuerzo</option><option>Presentación personal</option></select></label><label><span>Detalle observable</span><textarea minLength="8" required rows="5" value={form.text} onChange={(event) => setForm({ ...form, text: event.target.value })} placeholder="Describe qué ocurrió, cuándo y en qué contexto." /></label>{message && <div className="form-success">{message}</div>}<button className="teacher-primary" type="submit">Guardar anotación</button></form></section></>;
}

function Header({ kicker, title, subtitle }) {
  return (
    <header className="page-header">
      <div><p>{kicker}</p><h1>{title}</h1><span>{subtitle}</span></div>
      <div className="header-meta"><span className="demo-chip"><i /> Datos sintéticos</span><span className="academic-cycle">Año escolar · 2026</span></div>
    </header>
  );
}

function Dashboard({ data, onOpenStudent, onNavigate }) {
  const workspace = data.teacherWorkspace;
  const assignedStudentIds = [...new Set(workspace.assignments.flatMap(({ studentIds }) => studentIds))];
  const prioritized = data.students.filter(({ id, risk }) => assignedStudentIds.includes(id) && risk !== "low");
  const plannedClasses = workspace.classSessions.filter(({ status }) => status === "planned");
  return (
    <>
      <Header kicker="Segundo semestre · 2026" title="Resumen docente" subtitle="Tus cursos, próximas clases y estudiantes que requieren atención" />
      <section className="metrics-grid" aria-label="Indicadores principales">
        <Metric label="Asignaciones vigentes" value={workspace.assignments.length} detail="2 cursos · 2 asignaturas" trend={[2, 3, 3, 3, 3]} />
        <Metric label="Estudiantes en alcance" value={assignedStudentIds.length} detail="Según matrícula de tus cursos" accent="gold" trend={[4, 5, 5, 5, 5]} />
        <Metric label="Clases planificadas" value={plannedClasses.length} detail="Próximas sesiones" accent="blue" trend={[2, 3, 4, 4, 6]} />
        <Metric label="Anotaciones recientes" value={workspace.annotations.length} detail="Positivas y negativas" accent="clay" trend={[1, 2, 2, 3, 4]} />
      </section>
      <section className="content-grid">
        <article className="panel panel--wide">
          <div className="panel__header"><div><p>Prioridad</p><h2>Estudiantes que requieren revisión</h2></div><button onClick={() => onNavigate("students")} type="button">Ver todos</button></div>
          <div className="student-list">
            {prioritized.map((student) => (
              <button className="student-row" key={student.id} onClick={() => onOpenStudent(student.id)} type="button">
                <span className="avatar">{student.name.split(" ").map((part) => part[0]).join("")}</span>
                <span className="student-row__identity"><strong>{student.name}</strong><small>{student.course}</small></span>
                <span><small>Asistencia</small><strong>{student.attendance}%</strong></span>
                <span><small>Promedio</small><strong>{student.average.toFixed(1)}</strong></span>
                <RiskBadge value={student.risk} />
              </button>
            ))}
          </div>
        </article>
        <article className="panel"><div className="panel__header"><div><p>Agenda</p><h2>Próximas clases</h2></div><button onClick={() => onNavigate("classes")} type="button">Abrir planificación</button></div><div className="alert-stack">{plannedClasses.slice(0, 3).map((session) => { const assignment = assignmentBySession(workspace, session); return <div className="alert-card" key={session.id}><span className="class-status">Planificada</span><strong>{session.title}</strong><span>{assignment.courseName} · {assignment.subjectName}</span><small>{formatSchoolDate(session.date)} · {session.startTime}</small></div>; })}</div></article>
      </section>
    </>
  );
}

function Students({ data, onOpenStudent }) {
  const [query, setQuery] = useState("");
  const filtered = data.students.filter((student) => `${student.name} ${student.identifier} ${student.course}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <>
      <Header kicker="Directorio escolar" title="Estudiantes" subtitle="Búsqueda y contexto escolar sintético" />
      <section className="toolbar"><label htmlFor="student-search">Buscar estudiante</label><input id="student-search" onChange={(event) => setQuery(event.target.value)} placeholder="Nombre, identificador o curso" value={query} /></section>
      <section className="panel table-panel">
        <div className="table-heading"><span>Estudiante</span><span>Curso</span><span>Asistencia</span><span>Promedio</span><span>Riesgo</span></div>
        {filtered.map((student) => (
          <button className="table-row" key={student.id} onClick={() => onOpenStudent(student.id)} type="button"><span><strong>{student.name}</strong><small>{student.identifier}</small></span><span>{student.course}</span><span>{student.attendance}%</span><span>{student.average.toFixed(1)}</span><RiskBadge value={student.risk} /></button>
        ))}
        {filtered.length === 0 && <div className="empty-state">No hay estudiantes que coincidan con la búsqueda.</div>}
      </section>
    </>
  );
}

function Justifications({ data, onDataChange }) {
  const [reviewNote, setReviewNote] = useState({});
  const [message, setMessage] = useState("");
  const statusLabels = { pending: "Pendiente", approved: "Aprobada", rejected: "Rechazada" };

  async function review(id, status) {
    const body = await teacherMutation(`/justifications/${id}`, { method: "PATCH", body: JSON.stringify({ status, reviewNote: reviewNote[id] || "Revisado con antecedentes disponibles." }) });
    onDataChange((current) => ({ ...current, justifications: body.justifications }));
    setMessage(status === "approved" ? "Justificación aprobada y trazabilidad registrada." : "Justificación rechazada con observación registrada.");
  }

  return <><Header kicker="Inspectoría y asistencia" title="Justificaciones" subtitle="Revisa solicitudes de ausencia sin exponer documentos sensibles" />{message && <div className="form-success justification-message">{message}</div>}<section className="justification-list">{data.justifications.map((item) => { const student = data.students.find(({ id }) => id === item.studentId); const session = data.teacherWorkspace.classSessions.find(({ id }) => id === item.classSessionId); return <article className="justification-card" key={item.id}><div className="justification-card__head"><div><span>{student?.course}</span><h2>{student?.name}</h2><p>{session?.title ?? "Clase registrada"} · {session ? formatSchoolDate(session.date) : "Fecha no disponible"}</p></div><em className={`justification-status justification-status--${item.status}`}>{statusLabels[item.status]}</em></div><blockquote>{item.reason}</blockquote><dl><div><dt>Respaldo</dt><dd>{item.attachmentName || "Sin archivo adjunto"}</dd></div><div><dt>Solicitud</dt><dd>{new Date(item.submittedAt).toLocaleString("es-CL")}</dd></div></dl>{item.status === "pending" ? <div className="justification-review"><input aria-label={`Observación para ${student?.name}`} onChange={(event) => setReviewNote({ ...reviewNote, [item.id]: event.target.value })} placeholder="Observación de revisión" value={reviewNote[item.id] ?? ""} /><button onClick={() => review(item.id, "approved")} type="button">Aprobar</button><button className="teacher-secondary" onClick={() => review(item.id, "rejected")} type="button">Rechazar</button></div> : <small>Revisó {item.reviewedBy} · {item.reviewNote}</small>}</article>; })}</section></>;
}

function Alerts({ data, onDataChange, onOpenStudent }) {
  const [severity, setSeverity] = useState("all");
  const [message, setMessage] = useState("");
  const alerts = severity === "all" ? data.alerts : data.alerts.filter((alert) => alert.severity === severity);
  async function recalculate() {
    const body = await teacherMutation("/alerts/recalculate", { method: "POST" });
    onDataChange((current) => ({ ...current, alerts: body.alerts, alertRules: body.rules, students: body.students, metrics: body.metrics, meta: { ...current.meta, updatedAt: body.updatedAt } }));
    setMessage(`${body.alerts.length} alertas recalculadas con tres reglas transparentes.`);
  }
  return (
    <>
      <Header kicker="Seguimiento" title="Bandeja de alertas" subtitle="Cada alerta muestra la regla y la evidencia que la originó" />
      <section className="alerts-toolbar"><div className="filter-group" aria-label="Filtrar por severidad">
        {["all", "high", "medium"].map((value) => <button className={severity === value ? "filter filter--active" : "filter"} key={value} onClick={() => setSeverity(value)} type="button">{value === "all" ? "Todas" : labels[value]}</button>)}
      </div><button className="teacher-primary" onClick={recalculate} type="button">Recalcular alertas</button></section>
      {message && <div className="form-success justification-message">{message}</div>}
      <section className="rule-strip">{data.alertRules?.map((rule) => <article key={rule.id}><span>{rule.severity === "high" ? "Crítica" : "Preventiva"}</span><strong>{rule.name}</strong><small>{rule.description}</small></article>)}</section>
      <section className="alert-board">
        {alerts.map((alert) => {
          const student = data.students.find(({ id }) => id === alert.studentId);
          return <article className="alert-detail" key={alert.id}><div className="alert-detail__top"><RiskBadge value={alert.severity} /><span>{labels[alert.status]}</span></div><h2>{alert.title}</h2><button className="link-button" onClick={() => onOpenStudent(alert.studentId)} type="button">{student?.name} · {student?.course}</button><dl><div><dt>Regla aplicada</dt><dd>{alert.rule}</dd></div><div><dt>Evidencia</dt><dd>{alert.evidence}</dd></div></dl></article>;
        })}
      </section>
    </>
  );
}

function StudentDetail({ data, studentId, onBack }) {
  const student = data.students.find(({ id }) => id === studentId);
  const alerts = data.alerts.filter(({ studentId: id }) => id === studentId);
  const interventions = data.interventions.filter(({ studentId: id }) => id === studentId);
  if (!student) return <div className="empty-state">Estudiante no encontrado.</div>;
  return (
    <>
      <button className="back-button" onClick={onBack} type="button">← Volver a estudiantes</button>
      <Header kicker={student.identifier} title={student.name} subtitle={`${student.course} · ${student.level}`} />
      <section className="metrics-grid metrics-grid--three"><Metric label="Asistencia" value={`${student.attendance}%`} detail="Ejemplo del periodo" /><Metric label="Promedio" value={student.average.toFixed(1)} detail="Escala referencial 1,0 a 7,0" /><Metric label="Nivel de riesgo" value={labels[student.risk]} detail={`${alerts.length} alerta(s) relacionada(s)`} /></section>
      <section className="content-grid">
        <article className="panel panel--wide"><div className="panel__header"><div><p>Explicabilidad</p><h2>Alertas relacionadas</h2></div></div>{alerts.length ? alerts.map((alert) => <div className="timeline-item" key={alert.id}><RiskBadge value={alert.severity} /><div><strong>{alert.title}</strong><span>{alert.rule}</span><small>{alert.evidence}</small></div></div>) : <div className="empty-state">Sin alertas abiertas.</div>}</article>
        <article className="panel"><div className="panel__header"><div><p>Trazabilidad</p><h2>Intervenciones</h2></div></div>{interventions.length ? interventions.map((item) => <div className="intervention" key={item.id}><strong>{item.type}</strong><p>{item.note}</p><small>{item.author}</small></div>) : <div className="empty-state">Sin intervenciones registradas.</div>}</article>
      </section>
    </>
  );
}

export default function App() {
  const [entered, setEntered] = useState(false);
  const [persona, setPersona] = useState("staff");
  const [view, setView] = useState("dashboard");
  const [studentId, setStudentId] = useState(null);
  const [studentWorkspace, setStudentWorkspace] = useState(null);
  const [data, setData] = useState(null);
  const [system, setSystem] = useState({ status: "checking", message: "Verificando servicios…" });

  useEffect(() => {
    async function loadPrototype() {
      try {
        const [healthResponse, dbResponse, prototypeResponse] = await Promise.all([fetch("/api/health"), fetch("/api/db-health"), fetch("/api/prototype")]);
        if (!healthResponse.ok || !dbResponse.ok || !prototypeResponse.ok) throw new Error("Servicios no disponibles");
        setData(await prototypeResponse.json());
        setSystem({ status: "ready", message: "Web, API y base operativas" });
      } catch (error) {
        setSystem({ status: "error", message: error.message });
      }
    }
    loadPrototype();
  }, []);

  async function authenticate(email, password) {
    const response = await fetch("/api/auth/demo-login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
    if (!response.ok) throw new Error("invalid_credentials");
    const session = await response.json();
    if (session.role === "student") {
      const workspaceResponse = await fetch(`/api/student/workspace/${session.profile.studentId}`, { headers: { "x-demo-role": "student", "x-demo-student-id": session.profile.studentId } });
      if (!workspaceResponse.ok) throw new Error("student_workspace_unavailable");
      setStudentWorkspace(await workspaceResponse.json());
    }
    setPersona(session.role === "student" ? "student" : "staff");
    setEntered(true);
  }

  const content = useMemo(() => {
    if (!data) return <div className="loading-state"><span /><p>Cargando prototipo…</p></div>;
    const updateTeacherWorkspace = (workspace) => setData((current) => ({ ...current, teacherWorkspace: workspace }));
    if (studentId) return <StudentDetail data={data} studentId={studentId} onBack={() => { setStudentId(null); setView("students"); }} />;
    if (view === "courses") return <TeacherCourses data={data} onNavigate={setView} />;
    if (view === "classes") return <TeacherClasses data={data} onWorkspaceChange={updateTeacherWorkspace} />;
    if (view === "grades") return <TeacherGrades data={data} onWorkspaceChange={updateTeacherWorkspace} />;
    if (view === "annotations") return <TeacherAnnotations data={data} onWorkspaceChange={updateTeacherWorkspace} />;
    if (view === "justifications") return <Justifications data={data} onDataChange={setData} />;
    if (view === "students") return <Students data={data} onOpenStudent={setStudentId} />;
    if (view === "alerts") return <Alerts data={data} onDataChange={setData} onOpenStudent={setStudentId} />;
    return <Dashboard data={data} onNavigate={setView} onOpenStudent={setStudentId} />;
  }, [data, studentId, view]);

  if (!entered) return <Login onAuthenticate={authenticate} system={system} />;
  if (persona === "student" && studentWorkspace) return <StudentPortal workspace={studentWorkspace} onLogout={() => { setEntered(false); setStudentWorkspace(null); }} system={system} />;
  return <AppShell activeView={view} onLogout={() => setEntered(false)} onNavigate={(next) => { setStudentId(null); setView(next); }} system={system}>{content}</AppShell>;
}
