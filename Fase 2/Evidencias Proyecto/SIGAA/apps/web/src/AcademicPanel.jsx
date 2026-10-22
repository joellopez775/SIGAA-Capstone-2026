import { useEffect, useState } from "react";

const attendanceLabels = {
  present: "Presente",
  absent: "Ausente",
  late: "Atraso",
  excused: "Justificada",
};
const toInput = {
  presente: "present",
  ausente: "absent",
  atraso: "late",
  justificada: "excused",
};
export const statusLabel = (s) =>
  ({
    presente: "Presente",
    ausente: "Ausente",
    atraso: "Atraso",
    justificada: "Justificada",
    pendiente: "Pendiente",
    borrador: "Borrador",
    publicada: "Publicada",
    programada: "Programada",
    realizada: "Realizada",
    cancelada: "Cancelada",
    positiva: "Positiva",
    negativa: "Negativa",
    privada: "Solo yo",
    equipo_docente: "Equipo docente",
    estudiante: "Visible al estudiante",
    vigente: "Vigente",
    anulada: "Anulada",
  })[s] ?? s;
export function AcademicPanel({ api, view }) {
  const [assignments, setAssignments] = useState([]),
    [id, setId] = useState(""),
    [data, setData] = useState(null),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    api("/teacher/workspace")
      .then((r) => {
        if (active) {
          setAssignments(r.assignments);
          setId(r.assignments[0]?.id ?? "");
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [api]);
  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    setNotice("");
    if (id)
      api(`/teacher/assignments/${id}/records`)
        .then((r) => {
          if (active) setData(r);
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    return () => {
      active = false;
    };
  }, [id, view, api]);
  async function run(path, method, body) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api(path, { method, body });
      setNotice("Guardado en la base de datos.");
      setData(await api(`/teacher/assignments/${id}/records`));
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="academic-panel">
      <div className="panel secure-form">
        <label>
          Curso y asignatura
          <select
            value={id}
            disabled={busy}
            onChange={(e) => setId(e.target.value)}
          >
            <option value="">Selecciona un curso</option>
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.courseName} · {a.subject}
              </option>
            ))}
          </select>
        </label>
        <p>
          Solo puedes trabajar en tus asignaturas vigentes. El estudiante
          consulta sus registros; no puede modificarlos.
        </p>
        <button
          disabled={!id || busy}
          onClick={async () => {
            setError("");
            try {
              setData(await api(`/teacher/assignments/${id}/records`));
              setNotice("Datos actualizados.");
            } catch (e) {
              setError(e.message);
            }
          }}
        >
          Actualizar registros
        </button>
      </div>
      {error && (
        <p className="login-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="secure-notice" role="status">
          {notice}
        </p>
      )}
      {!assignments.length && !error && (
        <p className="empty-state">No tienes asignaturas vigentes asignadas.</p>
      )}
      {id && !data && !error && <p role="status">Cargando registros…</p>}
      {data && (
        <fieldset className="academic-fieldset" disabled={busy}>
          {view === "attendance" && (
            <Attendance key={id} data={data} id={id} run={run} />
          )}
          {view === "grades" && (
            <Grades key={id} data={data} id={id} run={run} />
          )}
          {view === "annotations" && (
            <Annotations key={id} data={data} id={id} run={run} />
          )}
        </fieldset>
      )}
    </section>
  );
}
function Attendance({ data, id, run }) {
  const [selected, setSelected] = useState("");
  const session = data.classes.find((c) => c.id === selected);
  async function create(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const form = e.currentTarget;
    if (
      await run("/teacher/classes", "POST", {
        courseSubjectId: id,
        date: f.get("date"),
        block: f.get("block"),
        title: f.get("title"),
        objective: f.get("objective"),
      })
    )
      form.reset();
  }
  return (
    <>
      <details className="panel" open={!data.classes.length}>
        <summary>Programar una clase</summary>
        <form className="secure-form" onSubmit={create}>
          <label>
            Fecha de la clase
            <input type="date" name="date" required />
          </label>
          <label>
            Bloque
            <input
              name="block"
              maxLength={40}
              required
              placeholder="08:00 - 09:30"
            />
          </label>
          <label>
            Título de la clase
            <input name="title" maxLength={180} required />
          </label>
          <label>
            Objetivo
            <textarea name="objective" maxLength={2000} required />
          </label>
          <button className="primary-button">Crear clase</button>
        </form>
      </details>
      <section className="panel secure-form">
        <h2>Registro de asistencia</h2>
        <label>
          Clase
          <select
            value={selected}
            aria-label="Clase"
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">Selecciona una clase</option>
            {data.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.date} · {c.block} · {c.title} · {statusLabel(c.status)}
              </option>
            ))}
          </select>
        </label>
        <p>
          Selecciona cada estado expresamente. No se presume asistencia. Al
          guardar, el registro queda visible al estudiante. No se permite
          registrar clases futuras o canceladas.
        </p>
        {session && (
          <AttendanceForm
            key={session.id + session.revision}
            session={session}
            data={data}
            run={run}
          />
        )}
        {!data.classes.length && <p>No hay clases programadas todavía.</p>}
      </section>
    </>
  );
}
function AttendanceForm({ session, data, run }) {
  async function save(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await run(`/teacher/classes/${session.id}/attendance`, "PUT", {
      expectedRevision: session.revision,
      records: data.students.map((s) => ({
        studentId: s.id,
        status: f.get(s.id),
      })),
    });
  }
  return (
    <form className="secure-form" onSubmit={save}>
      {data.students.map((s) => (
        <label className="academic-row" key={s.id}>
          {s.name}
          <select
            name={s.id}
            aria-label={s.name}
            defaultValue={
              toInput[
                data.attendance.find(
                  (a) => a.classId === session.id && a.studentId === s.id,
                )?.status
              ] ?? ""
            }
            required
          >
            <option value="">Sin registrar</option>
            {Object.entries(attendanceLabels).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>
      ))}
      <button
        className="primary-button"
        disabled={!data.students.length || session.status === "cancelada"}
      >
        Guardar asistencia
      </button>
    </form>
  );
}
function Grades({ data, id, run }) {
  const [selected, setSelected] = useState("");
  const evaluation = data.evaluations.find((e) => e.id === selected);
  async function create(e) {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form);
    if (
      await run("/teacher/evaluations", "POST", {
        courseSubjectId: id,
        name: f.get("name"),
        date: f.get("date"),
        weight: Number(f.get("weight")),
      })
    )
      form.reset();
  }
  return (
    <>
      <details className="panel" open={!data.evaluations.length}>
        <summary>Crear evaluación</summary>
        <form className="secure-form" onSubmit={create}>
          <label>
            Nombre de la evaluación
            <input name="name" maxLength={160} required />
          </label>
          <label>
            Fecha de evaluación
            <input type="date" name="date" required />
          </label>
          <label>
            Ponderación (%)
            <input
              type="number"
              name="weight"
              min="0.01"
              max="100"
              step="0.01"
              required
            />
          </label>
          <p>
            La suma de ponderaciones de esta asignatura no puede superar el
            100%.
          </p>
          <button className="primary-button">Crear evaluación</button>
        </form>
      </details>
      <section className="panel secure-form">
        <h2>Calificaciones</h2>
        <label>
          Evaluación
          <select
            value={selected}
            aria-label="Evaluación"
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">Selecciona una evaluación</option>
            {data.evaluations.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} · {e.weight}% · {statusLabel(e.status)}
              </option>
            ))}
          </select>
        </label>
        {evaluation && (
          <GradeForm
            key={evaluation.id + evaluation.revision}
            evaluation={evaluation}
            data={data}
            run={run}
          />
        )}
        {!data.evaluations.length && <p>Aún no hay evaluaciones.</p>}
      </section>
    </>
  );
}
function GradeForm({ evaluation, data, run }) {
  async function save(e) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    await run(`/teacher/evaluations/${evaluation.id}/grades`, "PUT", {
      expectedRevision: evaluation.revision,
      reason: f.get("reason"),
      records: data.students
        .filter((s) => f.get(s.id) !== "")
        .map((s) => ({ studentId: s.id, value: Number(f.get(s.id)) })),
    });
  }
  const editable = ["borrador", "publicada"].includes(evaluation.status);
  return (
    <>
      <p>
        Notas de 1,0 a 7,0, con un decimal. Un campo vacío no borra una nota.
        Primero guarda; después publica. Si corriges una nota guardada, explica
        el motivo.
      </p>
      <form className="secure-form" onSubmit={save}>
        {data.students.map((s) => (
          <label className="academic-row" key={s.id}>
            {s.name}
            <input
              type="number"
              step="0.1"
              min="1"
              max="7"
              name={s.id}
              defaultValue={
                data.grades.find(
                  (g) =>
                    g.evaluationId === evaluation.id && g.studentId === s.id,
                )?.value ?? ""
              }
            />
          </label>
        ))}
        <label>
          Motivo de corrección
          <textarea
            name="reason"
            maxLength={2000}
            placeholder="Obligatorio si cambias una nota existente (mínimo 8 caracteres)"
          />
        </label>
        <button
          className="primary-button"
          disabled={!editable || !data.students.length}
        >
          Guardar notas
        </button>
      </form>
      {evaluation.status === "borrador" ? (
        <button
          className="academic-publish"
          onClick={() =>
            run(`/teacher/evaluations/${evaluation.id}/publish`, "POST", {
              expectedRevision: evaluation.revision,
            })
          }
        >
          Publicar notas al estudiante
        </button>
      ) : (
        <p>
          {statusLabel(evaluation.status)}: las correcciones guardadas se
          reflejan en la vista del estudiante.
        </p>
      )}
    </>
  );
}
function Annotations({ data, id, run }) {
  const [voidId, setVoidId] = useState("");
  async function create(e) {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form);
    if (
      await run("/teacher/annotations", "POST", {
        courseSubjectId: id,
        studentId: f.get("studentId"),
        type: f.get("type"),
        category: f.get("category"),
        detail: f.get("detail"),
        visibility: f.get("visibility"),
      })
    )
      form.reset();
  }
  return (
    <>
      <section className="panel">
        <h2>Nueva anotación</h2>
        <form className="secure-form" onSubmit={create}>
          <label>
            Estudiante
            <select name="studentId" aria-label="Estudiante" required>
              <option value="">Selecciona un estudiante</option>
              {data.students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Tipo
            <select name="type" aria-label="Tipo">
              <option value="positiva">Positiva</option>
              <option value="negativa">Negativa</option>
            </select>
          </label>
          <label>
            Categoría
            <input
              name="category"
              maxLength={80}
              required
              placeholder="Participación, convivencia…"
            />
          </label>
          <label>
            Detalle
            <textarea name="detail" minLength={8} maxLength={4000} required />
          </label>
          <label>
            Visibilidad
            <select name="visibility" aria-label="Visibilidad" defaultValue="privada">
              <option value="privada">Solo yo</option>
              <option value="equipo_docente">
                Equipo docente de esta asignatura
              </option>
              <option value="estudiante">Visible al estudiante</option>
            </select>
          </label>
          <button className="primary-button" disabled={!data.students.length}>
            Guardar anotación
          </button>
        </form>
      </section>
      <section className="panel">
        <h2>Historial de anotaciones</h2>
        {!data.annotations.length && (
          <p>No hay anotaciones para esta asignatura.</p>
        )}
        {data.annotations.map((a) => (
          <article className="academic-note" key={a.id}>
            <strong>
              {a.student} · {statusLabel(a.type)}
            </strong>
            <small>
              {a.category} · {statusLabel(a.visibility)} ·{" "}
              {statusLabel(a.status)}
            </small>
            <p>{a.detail}</p>
            {a.voidReason && <p>Motivo de anulación: {a.voidReason}</p>}
            {a.canEdit && a.status === "vigente" && (
              <button onClick={() => setVoidId(a.id)}>Anular anotación</button>
            )}
            {voidId === a.id && a.status === "vigente" && (
              <form
                className="secure-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (
                    await run(`/teacher/annotations/${a.id}/void`, "POST", {
                      expectedRevision: a.revision,
                      reason: new FormData(e.currentTarget).get("reason"),
                    })
                  )
                    setVoidId("");
                }}
              >
                <label>
                  Motivo de anulación
                  <textarea
                    name="reason"
                    required
                    minLength={8}
                    maxLength={2000}
                  />
                </label>
                <button>Confirmar anulación</button>
              </form>
            )}
          </article>
        ))}
      </section>
    </>
  );
}
export function StudentAcademic({ data, view }) {
  const rows =
    view === "attendance" ? (data.attendance ?? []) : (data.annotations ?? []);
  return (
    <section className="panel">
      <h2>
        {view === "attendance"
          ? "Mi asistencia registrada"
          : "Mis anotaciones publicadas"}
      </h2>
      <p>
        {view === "attendance"
          ? "Solo se muestran clases realizadas y registradas por tu docente."
          : "Las anotaciones privadas del docente no se muestran aquí."}
      </p>
      {!rows.length && (
        <p className="empty-state">Aún no hay registros publicados.</p>
      )}
      {rows.map((r) => (
        <article key={r.id} className="academic-note">
          <strong>
            {r.subject} · {statusLabel(r.status ?? r.type)}
          </strong>
          <small>
            {String(r.date).slice(0, 10)} · {r.block ?? r.category}
          </small>
          <p>{r.title ?? r.detail}</p>
        </article>
      ))}
    </section>
  );
}
