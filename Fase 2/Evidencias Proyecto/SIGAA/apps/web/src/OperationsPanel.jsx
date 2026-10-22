import { useEffect, useState, useRef } from "react";

const labels={abierta:"Abierta",asignada:"Asignada",en_seguimiento:"En seguimiento",resuelta:"Resuelta",descartada:"Descartada",critica:"Crítica",alta:"Alta",media:"Media",informativa:"Informativa"};
const day=v=>String(v??"").slice(0,10);
const decimal=v=>v==null?"Sin datos":Number(v).toFixed(1);
function Feedback({error,notice,busy}) {return <><div role="alert">{error&&<p className="login-error">{error}</p>}</div><div role="status">{notice&&<p className="secure-notice">{notice}</p>}{busy&&<p>Cargando o guardando…</p>}</div></>;}
function useOperation() {
  const [busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
  async function run(action,message="") {setBusy(true);setError("");setNotice("");try{await action();setNotice(message);}catch(e){setError(e.message);}finally{setBusy(false);}}
  return {busy,error,notice,run};
}
const definitions={
  schools:{title:"Establecimientos",fields:[["rbd","RBD","optional"],["nombre","Nombre"],["tipo","Tipo",["colegio","liceo"]],["dependencia","Dependencia",["","municipal","sle","particular_subvencionado","particular_pagado","administracion_delegada"]],["estado","Estado",["activo","inactivo"]]]},
  periods:{title:"Años escolares",fields:[["establecimiento_id","Establecimiento","schools"],["anio","Año","number"],["nombre","Nombre"],["fecha_inicio","Inicio","date"],["fecha_fin","Término","date"],["estado","Estado",["planificado","activo","cerrado"]]]},
  levels:{title:"Niveles",fields:[["codigo","Código"],["nombre","Nombre"],["ciclo","Ciclo",["parvularia","basica","media","especial","adultos"]],["orden","Orden","number"]]},
  subjects:{title:"Asignaturas",fields:[["codigo","Código"],["nombre","Nombre"],["estado","Estado",["activa","inactiva"]]]},
  courses:{title:"Cursos",fields:[["periodo_id","Año escolar","periods"],["nivel_id","Nivel","levels"],["letra","Letra"],["jornada","Jornada",["","manana","tarde","vespertina","completa"]],["sala","Sala","optional"],["capacidad","Capacidad","optionalNumber"],["estado","Estado",["planificado","activo","cerrado","cancelado"]]]},
  assignments:{title:"Asignaciones docentes",fields:[["curso_id","Curso","courses"],["asignatura_id","Asignatura","subjects"],["profesor_id","Docente","teachers"],["horas_semanales","Horas semanales","optionalNumber"],["estado","Estado",["planificada","activa","cerrada","cancelada"]]]},
};
export function StructurePanel({api,revision}) {
  const [data,setData]=useState({}),[kind,setKind]=useState("schools"),[editing,setEditing]=useState(null),[draft,setDraft]=useState({});
  const op=useOperation(),definition=definitions[kind];
  const refresh=async()=>setData(await api("/structure"));
  useEffect(()=>{op.run(refresh);},[revision]);
  function choose(k,row=null) {setKind(k);setEditing(row);setDraft(Object.fromEntries(definitions[k].fields.map(([key,,type])=>[key,type==="date"?day(row?.[key]):row?.[key]??(Array.isArray(type)?type[0]:"")])));}
  function display(k,r) {
    if(k==="courses")return (data.levels?.find(l=>l.id===r.nivel_id)?.nombre??"Nivel")+" "+r.letra+" · "+(data.periods?.find(p=>p.id===r.periodo_id)?.nombre??"");
    if(k==="assignments")return (data.subjects?.find(s=>s.id===r.asignatura_id)?.nombre??"Asignatura")+" · "+display("courses",data.courses?.find(c=>c.id===r.curso_id)??{});
    return r.nombre;
  }
  async function save(e) {e.preventDefault();const body={expectedRevision:editing?.revision};
    for(const [key,,type] of definition.fields) {const v=draft[key]??(Array.isArray(type)?type[0]:"");body[key]=v===""?null:["number","optionalNumber"].includes(type)?Number(v):v;}
    await op.run(async()=>{await api("/structure/"+kind+(editing?"/"+editing.id:""),{method:editing?"PUT":"POST",body});await refresh();choose(kind);},"Registro guardado y auditado.");
  }
  return <><section className="panel"><p className="eyebrow">Administración · estructura escolar</p><p>Configura primero el establecimiento y año, luego niveles, cursos y asignaturas. Los registros se conservan: para retirarlos usa su estado. No se eliminan historiales.</p><div className="ops-tabs">{Object.entries(definitions).map(([k,d])=><button key={k} aria-pressed={kind===k} onClick={()=>choose(k)}>{d.title}</button>)}</div></section>
    <Feedback {...op}/><div className="secure-grid">
      <section className="panel"><h2>{definition.title}</h2><div className="secure-list">{(data[kind]??[]).map(r=><article key={r.id}><div><strong>{display(kind,r)}</strong><small>{r.codigo??r.rbd??""} · {r.estado??r.ciclo??""}</small></div><button disabled={op.busy} onClick={()=>choose(kind,r)}>Editar</button></article>)}</div>{!data[kind]?.length&&<p>No hay registros en este catálogo.</p>}</section>
      <form key={kind+editing?.id} className="panel secure-form" onSubmit={save}><h2>{editing?"Editar registro":"Crear registro"}</h2>
        <fieldset className="academic-fieldset secure-form" disabled={op.busy || !data.schools}>
        {definition.fields.map(([key,label,type])=><label key={key}>{label}
          {Array.isArray(type)||data[type]?<select aria-label={label} required={!["dependencia","jornada","profesor_id"].includes(key)} value={draft[key]??(Array.isArray(type)?type[0]:"")} onChange={e=>setDraft(current=>({...current,[key]:e.target.value}))}>
            {!Array.isArray(type)&&<option value="">Selecciona…</option>}
            {(Array.isArray(type)?type.map(value=>({id:value,nombre:value.replaceAll("_"," ")||"Sin definir"})):(data[type]??[])).map(r=><option key={r.id} value={r.id}>{Array.isArray(type)?r.nombre:display(type,r)}</option>)}
          </select>:<input type={["number","optionalNumber"].includes(type)?"number":type==="date"?"date":"text"} step={key==="horas_semanales"?"0.1":"1"} required={!["optional","optionalNumber"].includes(type)} value={type==="date"?day(draft[key]):draft[key]??""} onChange={e=>setDraft(current=>({...current,[key]:e.target.value}))}/>}
        </label>)}
        {editing&&<p>Las relaciones de un registro existente se conservan. Crea otro registro si necesitas cambiar su año, nivel o curso.</p>}
        <button className="primary-button">{op.busy?"Guardando…":"Guardar registro"}</button>
        {editing&&<button type="button" onClick={()=>choose(kind)}>Cancelar edición</button>}</fieldset>
      </form></div></>;
}
export function RiskPanel({api,user,courses,revision}) {
  const [filters,setFilters]=useState({}),[page,setPage]=useState(1),[data,setData]=useState({alerts:[],summary:{}}),[owners,setOwners]=useState([]),[rules,setRules]=useState([]),[selected,setSelected]=useState(null),[history,setHistory]=useState([]);
  const op=useOperation(), request=useRef(0);
  async function refresh() {
    const current=++request.current;
    const q=new URLSearchParams({...Object.fromEntries(Object.entries(filters).filter(([,v])=>v)),page});
    const [a,o,r]=await Promise.all([api("/risk/alerts?"+q),api("/risk/owners"),api("/risk/rules")]);
    if(current===request.current){setData(a);setOwners(o.users);setRules(r.rules);}
  }
  useEffect(()=>{op.run(refresh);setSelected(null);setHistory([]);},[JSON.stringify(filters),page,revision]);
  function filter(key,value) {setPage(1);setFilters({...filters,[key]:value});}
  async function edit(row) {setSelected(row);await op.run(async()=>setHistory((await api("/risk/alerts/"+row.id+"/history")).events));}
  async function change(e) {e.preventDefault();const b=Object.fromEntries(new FormData(e.currentTarget));await op.run(async()=>{
    await api("/risk/alerts/"+selected.id,{method:"PATCH",body:{status:b.status,ownerId:b.ownerId||null,reason:b.reason,expectedRevision:selected.revision}});
    setSelected(null);await refresh();},"Cambio registrado con responsable y motivo.");
  }
  return <><section className="panel"><p className="eyebrow">Detección temprana · datos persistentes</p><p>Son indicadores preventivos, no diagnósticos ni promedios oficiales. Presente y atraso cuentan como asistencia; justificadas y pendientes se excluyen. Se usan notas publicadas ponderadas del curso.</p><p>Después de registrar notas o asistencia, pulsa recalcular. Las justificaciones aprobadas y cambios de reglas recalculan automáticamente.</p>
    <button className="primary-button" disabled={op.busy} onClick={()=>op.run(async()=>{await api("/risk/recalculate",{method:"POST",body:{}});await refresh();setSelected(null);},"Alertas recalculadas sin duplicar registros.")}>Recalcular alertas</button>
    <small className="ops-caption">Último cálculo en resultados: {data.summary.lastCalculatedAt?new Date(data.summary.lastCalculatedAt).toLocaleString("es-CL"):"Sin cálculo disponible"}</small></section>
    <Feedback {...op}/><div className="secure-metrics">{[["Resultados","total"],["Activas","active"],["Críticas activas","critical"]].map(([label,key])=><section key={key} className="panel"><span>{label}</span><strong>{data.summary[key]??0}</strong></section>)}</div>
    <section className="panel secure-form"><h2>Filtrar alertas</h2><div className="ops-filters">
      <label>Prioridad<select aria-label="Prioridad" value={filters.priority??""} onChange={e=>filter("priority",e.target.value)}><option value="">Todas</option>{["critica","alta","media","informativa"].map(v=><option key={v} value={v}>{labels[v]}</option>)}</select></label>
      <label>Curso<select aria-label="Curso" value={filters.courseId??""} onChange={e=>filter("courseId",e.target.value)}><option value="">Todos</option>{courses.map(c=><option key={c.id} value={c.id}>{c.name} · {c.period}</option>)}</select></label>
      <label>Estado<select aria-label="Estado" value={filters.status??""} onChange={e=>filter("status",e.target.value)}><option value="">Todos</option>{Object.keys(labels).slice(0,5).map(v=><option key={v} value={v}>{labels[v]}</option>)}</select></label>
      <label>Responsable<select aria-label="Responsable" value={filters.ownerId??""} onChange={e=>filter("ownerId",e.target.value)}><option value="">Todos</option>{owners.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
    </div><button type="button" onClick={()=>{setFilters({});setPage(1);}}>Limpiar filtros</button></section>
<section className="panel"><h2>Bandeja de alertas</h2>{!data.alerts.length&&<p>No hay alertas para estos filtros. Si hay datos nuevos, recalcula.</p>}
      {data.alerts.map(a=><article className="academic-note" key={a.id}><span className={"secure-pill priority-"+a.severidad}>{labels[a.severidad]} · {labels[a.estado]}</span><h3>{a.student} · {a.course}</h3><strong>{a.titulo}</strong><p>{a.evidencia.explanation}</p><p>Asistencia: {decimal(a.evidencia.attendancePercent)}{a.evidencia.attendancePercent==null?"":"%"} · Rendimiento orientativo: {decimal(a.evidencia.weightedGrade)} · Regla v{a.evidencia.ruleVersion}</p><small>Umbrales: {Object.entries(a.evidencia.parameters??{}).map(([k,v])=>k.replaceAll("_"," ")+": "+v).join(" · ")}</small><small>Creada: {new Date(a.creado_en).toLocaleString("es-CL")} · Responsable: {a.owner??"Sin asignar"}</small><p>Siguiente acción: {["resuelta","descartada"].includes(a.estado)?"Revisar historial; no hay acción abierta.":a.responsable_id?"Revisar antecedentes y registrar el estado.":"Asignar responsable y revisar antecedentes."}</p><button disabled={op.busy} onClick={()=>edit(a)}>Gestionar alerta e historial</button></article>)}
      <div className="ops-tabs"><button disabled={op.busy||page===1} onClick={()=>setPage(page-1)}>Anterior</button><span>Página {page}</span><button disabled={op.busy||page*50>=data.summary.total} onClick={()=>setPage(page+1)}>Siguiente</button></div>
    </section>
    {selected&&<section key={selected.id+":"+selected.revision} className="panel"><form className="secure-form" onSubmit={change}><h2>Gestionar: {selected.student}</h2><fieldset className="academic-fieldset secure-form" disabled={op.busy}>
      <label>Nuevo estado<select aria-label="Nuevo estado" name="status" defaultValue={selected.estado}>{Object.keys(labels).slice(0,5).map(v=><option key={v} value={v}>{labels[v]}</option>)}</select></label>
      <label>Asignar responsable<select aria-label="Asignar responsable" name="ownerId" defaultValue={selected.responsable_id??""}><option value="">Sin asignar</option>{owners.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
      <label>Motivo del cambio<textarea name="reason" required minLength={8} maxLength={500}/></label><button className="primary-button">Guardar cambio</button><button type="button" onClick={()=>setSelected(null)}>Cancelar</button></fieldset></form>
      <h3>Historial auditable</h3>{history.map(h=><p key={h.id}>{new Date(h.date).toLocaleString("es-CL")} · {h.actor??"Sistema"} · {h.action} · {h.after?.estado} {h.after?.reason??""}</p>)}</section>}
    <section className="panel"><h2>Reglas de demostración</h2><p>Estos umbrales necesitan validación del establecimiento antes de uso real. Solo Administración puede cambiarlos; cada cambio conserva una versión y su motivo.</p>{rules.map(r=><RuleForm key={r.id} rule={r} admin={user.role==="admin"} busy={op.busy} save={(body)=>op.run(async()=>{await api("/risk/rules/"+r.codigo,{method:"PUT",body});await refresh();setSelected(null);},"Nueva versión de regla guardada y alertas recalculadas.")}/>)}</section>
  </>;
}
function RuleForm({rule:r,admin,busy,save}) {
  const fields=r.codigo==="RIESGO_COMBINADO"?[["asistencia_menor_que","Asistencia inferior a (%)",1,100],["promedio_menor_que","Rendimiento inferior a",1,7]]:[["umbral",r.tipo==="asistencia"?"Asistencia inferior a (%)":"Rendimiento inferior a",1,r.tipo==="asistencia"?100:7]];
  function submit(e) {e.preventDefault();const f=new FormData(e.currentTarget);save({parameters:Object.fromEntries(fields.map(([k])=>[k,Number(f.get(k))])),active:f.get("active")==="true",reason:f.get("reason"),expectedVersion:r.version});}
  return <details className="academic-note"><summary>{r.nombre} · v{r.version} · {r.activa?"Activa":"Inactiva"}</summary><form className="secure-form" onSubmit={submit}><fieldset className="academic-fieldset secure-form" disabled={!admin||busy}>{fields.map(([k,label,min,max])=><label key={k}>{label}<input type="number" name={k} min={min} max={max} step="0.1" required defaultValue={r.parametros[k]}/></label>)}<label>Activación<select aria-label="Activación" name="active" defaultValue={String(r.activa)}><option value="true">Activa</option><option value="false">Inactiva</option></select></label>{admin&&<><label>Motivo de configuración<textarea name="reason" minLength={8} maxLength={500} required/></label><button>Guardar nueva versión</button></>}</fieldset></form></details>;
}
export function JustificationPanel({api,student,revision}) {
  const [data,setData]=useState({justifications:[],absences:[]}),[selected,setSelected]=useState(null),op=useOperation();
  async function refresh() {const [j,a]=await Promise.all([api("/support/justifications"),student?Promise.resolve({absences:[]}):api("/support/absences")]);setData({...j,...a});}
  useEffect(()=>{op.run(refresh);},[revision]);
  async function create(e) {e.preventDefault();const form=e.currentTarget,body=Object.fromEntries(new FormData(form));await op.run(async()=>{await api("/support/justifications",{method:"POST",body});form.reset();await refresh();},"Justificación registrada, pendiente de revisión.");}
  async function review(e) {e.preventDefault();const body={...Object.fromEntries(new FormData(e.currentTarget)),expectedRevision:selected.revision};await op.run(async()=>{await api("/support/justifications/"+selected.id,{method:"PATCH",body});setSelected(null);await refresh();},"Revisión registrada. Si fue aprobada, la asistencia y alertas ya están actualizadas.");}
  return <><Feedback {...op}/><div className={student?"":"secure-grid"}>
    <section className="panel"><h2>{student?"Mis justificaciones":"Registro de justificaciones"}</h2>{!data.justifications.length&&<p>No hay justificaciones registradas.</p>}{data.justifications.map(j=><article className="academic-note" key={j.id}><strong>{j.student??"Ausencia"} · {day(j.fecha_desde)}</strong><span className="secure-pill">{j.estado}</span>{!student&&<><p>{j.motivo}</p><small>Respaldo: {j.documento_url}</small><small>Registrada por: {j.registered_by} · {new Date(j.creado_en).toLocaleString("es-CL")}</small>{j.revisada_en&&<small>Revisión: {j.reviewed_by} · {new Date(j.revisada_en).toLocaleString("es-CL")} · {j.observacion_revision}</small>}{j.estado==="pendiente"&&<button disabled={op.busy} onClick={()=>setSelected(j)}>Revisar justificación</button>}</>}</article>)}</section>
    {!student&&<form className="panel secure-form" onSubmit={create}><h2>Registrar justificación</h2><p>Selecciona una ausencia existente. El respaldo es una referencia a un documento custodiado por el colegio; no se publican archivos médicos.</p><fieldset className="academic-fieldset secure-form" disabled={op.busy}>
      <label>Ausencia<select aria-label="Ausencia" name="attendanceId" required><option value="">Selecciona una ausencia…</option>{data.absences.map(a=><option key={a.id} value={a.id}>{a.student} · {day(a.fecha)} · {a.course} · {a.subject} · {a.bloque}</option>)}</select></label>
      <label>Motivo<textarea name="reason" required minLength={8} maxLength={2000}/></label><label>Referencia del respaldo<input name="evidence" required minLength={3} maxLength={1000} placeholder="Ej.: folio del documento en Inspectoría"/></label><button className="primary-button" disabled={!data.absences.length}>Registrar para revisión</button></fieldset></form>}</div>
    {selected&&<form className="panel secure-form" onSubmit={review}><h2>Revisión: {selected.student}</h2><fieldset className="academic-fieldset secure-form" disabled={op.busy}><label>Decisión<select aria-label="Decisión" name="status"><option value="aceptada">Aprobar y justificar asistencia</option><option value="rechazada">Rechazar y conservar ausencia</option></select></label><label>Fundamento de la decisión<textarea name="reason" minLength={8} maxLength={1000} required/></label><button className="primary-button">Confirmar revisión</button><button type="button" onClick={()=>setSelected(null)}>Cancelar</button></fieldset></form>}
  </>;
}
