import { useEffect, useRef, useState } from 'react';
import './followup.css';

const day = v => v ? String(v).slice(0,10) : '';
const when = v => v ? new Date(v).toLocaleString('es-CL') : 'Sin registro';
const names = {abierto:'Abierto',en_curso:'En curso',cerrado:'Cerrado',media:'Media',alta:'Alta',critica:'Crítica',apertura:'Apertura',actividad:'Intervención',cambio:'Cambio',cierre:'Cierre',reapertura:'Reapertura'};
const formData = e => {e.preventDefault(); return Object.fromEntries(new FormData(e.currentTarget));};
function useWork() {
  const [busy,setBusy]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const run=async(fn,message='')=>{setBusy(true);setError('');setNotice('');try{await fn();setNotice(message);}catch(e){setError(e.message);}finally{setBusy(false);}};
  return {busy,error,notice,run};
}
function Feedback({busy,error,notice}) {return <div className="follow-feedback" aria-live="polite">{busy&&<p role="status">Consultando registros…</p>}{error&&<p role="alert" className="secure-notice error">{error}</p>}{notice&&<p role="status" className="secure-notice">{notice}</p>}</div>;}
function Pages({page,total,busy,setPage}) {return <div className="follow-actions"><button disabled={busy||page===1} onClick={()=>setPage(page-1)}>Anterior</button><span>Página {page} · {total} registros</span><button disabled={busy||page*50>=total} onClick={()=>setPage(page+1)}>Siguiente</button></div>;}
function Empty({children='No hay registros disponibles.'}) {return <p className="follow-empty">{children}</p>;}
function Reason({label='Motivo del cambio',name='reason'}) {return <label>{label}<textarea name={name} required minLength={8} maxLength={2000}/></label>;}

export function GuardiansPanel({api,user,students,revision}) {
  const op=useWork(),seq=useRef(0),[q,setQ]=useState(''),[page,setPage]=useState(1),[list,setList]=useState({guardians:[],total:0}),[detail,setDetail]=useState(null),[editing,setEditing]=useState(false);
  const writable=['admin','inspector'].includes(user.role);
  const [draft,setDraft]=useState({code:'',firstName:'',lastName:'',email:'',phone:'',status:'activo'});
  const field=(name)=>({value:draft[name],onChange:e=>setDraft(d=>({...d,[name]:e.target.value}))});
  function editContact(){const g=detail.guardian;setDraft({code:g.codigo??'',firstName:g.nombres,lastName:g.apellidos,email:g.email??'',phone:g.telefono??'',status:g.estado});setEditing(true);}
  function clearDraft(){setEditing(false);setDraft({code:'',firstName:'',lastName:'',email:'',phone:'',status:'activo'});}
  async function refresh() {const n=++seq.current; const result=await api('/guardians?'+new URLSearchParams({q,page}));if(n===seq.current)setList(result);}
  async function select(id) {const result=await api('/guardians/'+id);setDetail(result);setEditing(false);}
  useEffect(()=>{setDetail(null);setEditing(false);op.run(refresh);return()=>{seq.current++;};},[q,page,revision]);
  async function save(e) {const b=formData(e),g=editing?detail?.guardian:null;await op.run(async()=>{
    const r=await api('/guardians'+(g?'/'+g.id:''),{method:g?'PUT':'POST',body:{...b,...(g?{expectedRevision:g.revision}:{})}});
    await refresh();await select(r.guardian.id);clearDraft();
  },'Apoderado guardado.');}
  async function saveLink(e,link) {const b=formData(e),guardianId=detail.guardian.id;await op.run(async()=>{
    await api(link?'/guardian-links/'+link.id:'/guardians/'+guardianId+'/links',{method:link?'PATCH':'POST',body:{...b,active:b.active==='on',primary:b.primary==='on',notifications:b.notifications==='on',...(link?{expectedRevision:link.revision}:{})}});
    await select(guardianId);
  },'Vínculo guardado y cambio registrado.');}
  return <div className="follow-layout"><section className="panel follow-intro"><p className="eyebrow">Familia y comunidad</p><h2>Apoderados</h2><p>Un registro por persona; varios estudiantes pueden estar vinculados. Cada estudiante tiene un apoderado principal entre sus vínculos activos.</p><p>La preferencia de notificaciones se conserva, pero este módulo todavía no envía avisos ni habilita cuentas de apoderado.</p></section><Feedback {...op}/>
    <div className="follow-columns"><section className="panel"><label className="secure-form">Buscar apoderado<input aria-label="Buscar apoderado" value={q} maxLength={100} onChange={e=>{setQ(e.target.value);setPage(1);}} placeholder="Nombre o código"/></label>
      {!list.guardians.length&&!op.busy&&<Empty/>}<div className="follow-list">{list.guardians.map(g=><button className="follow-row" aria-pressed={detail?.guardian.id===g.id} disabled={op.busy} key={g.id} onClick={()=>op.run(()=>select(g.id))}><strong>{g.nombres} {g.apellidos}</strong><span>{g.codigo??'Código por completar'} · {g.estado}</span></button>)}</div><Pages page={page} total={list.total} setPage={setPage} busy={op.busy}/></section>
      {writable&&<section className="panel"><form className="secure-form" key={editing?detail?.guardian.id+':'+detail?.guardian.revision:'new'} onSubmit={save}><h2>{editing?'Editar apoderado':'Nuevo apoderado'}</h2><fieldset className="academic-fieldset secure-form" disabled={op.busy}>
        <label>Código interno<input name="code" required pattern="[A-Z0-9](?:[A-Z0-9._]|-){2,39}" maxLength={40} {...field('code')} readOnly={editing&&!!detail.guardian.codigo}/></label>
        <label>Nombres<input name="firstName" required maxLength={100} {...field('firstName')}/></label><label>Apellidos<input name="lastName" required maxLength={120} {...field('lastName')}/></label>
        <label>Correo de contacto<input type="email" name="email" maxLength={254} {...field('email')}/></label><label>Teléfono<input name="phone" type="tel" maxLength={30} {...field('phone')}/></label>
        <label>Estado del apoderado<select aria-label="Estado del apoderado" name="status" {...field('status')}><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select></label>{editing&&<Reason/>}
        <button className="primary-button">Guardar apoderado</button>{editing&&<button type="button" onClick={clearDraft}>Crear otro apoderado</button>}</fieldset></form></section>}
    </div>
    {detail&&<section className="panel"><h2>{detail.guardian.nombres} {detail.guardian.apellidos}</h2><p>{detail.guardian.email??'Sin correo'} · {detail.guardian.telefono??'Sin teléfono'}</p><div className="follow-actions"><button disabled={op.busy} onClick={()=>op.run(()=>select(detail.guardian.id))}>Recargar apoderado</button>{writable&&<button disabled={op.busy} onClick={editContact}>Editar datos de contacto</button>}</div>
      <h3>Estudiantes vinculados</h3>{!detail.links.length&&<Empty/>}{detail.links.map(l=><details className="follow-detail" key={l.id+':'+l.revision}><summary>{l.student} · {l.parentesco} · {l.activo?(l.es_principal?'Principal':'Secundario'):'Inactivo'}</summary>{writable?<LinkForm students={students} link={l} busy={op.busy} onSubmit={e=>saveLink(e,l)}/>:<p>Preferencia de notificaciones: {l.recibe_notificaciones?'Sí':'No'}</p>}</details>)}
      {writable&&detail.guardian.estado==='activo'&&<details className="follow-detail"><summary>Vincular estudiante</summary><LinkForm key={detail.guardian.id+':'+detail.links.length} students={students} busy={op.busy} onSubmit={e=>saveLink(e)}/></details>}
      <details className="follow-detail"><summary>Historial de cambios ({detail.history.length}, hasta 100)</summary>{detail.history.map(h=><article key={h.id}><p>{when(h.date)} · {h.actor??'Sistema'} · {h.action}</p><p>{h.after?.reason??'Creación del registro'}</p></article>)}</details>
    </section>}
  </div>;
}
function LinkForm({students,link,busy,onSubmit}) {return <form className="secure-form" onSubmit={onSubmit}><fieldset className="academic-fieldset secure-form" disabled={busy}>
  {!link&&<label>Estudiante a vincular<select aria-label="Estudiante a vincular" name="studentId" required defaultValue=""><option value="" disabled>Selecciona…</option>{students.map(s=><option key={s.id} value={s.id}>{s.firstName} {s.lastName} · {s.identifier}</option>)}</select></label>}
  <label>Parentesco o vínculo<input name="relationship" required maxLength={40} defaultValue={link?.parentesco??''}/></label>
  <label className="follow-check"><input type="checkbox" name="active" defaultChecked={link?.activo??true}/>Vínculo activo</label><label className="follow-check"><input type="checkbox" name="primary" defaultChecked={link?.es_principal??true}/>Apoderado principal</label><label className="follow-check"><input type="checkbox" name="notifications" defaultChecked={link?.recibe_notificaciones??true}/>Desea recibir avisos cuando estén disponibles</label>
  <p>Al elegir un nuevo principal, el anterior pasa a secundario. Para desvincular, desmarca activo y principal; si hay otros vínculos, elige primero otro principal.</p><Reason/><button className="primary-button">Guardar vínculo</button></fieldset></form>;}

export function CasesPanel({api,user,courses,students,revision,initialCaseId}) {
  const op=useWork(),seq=useRef(0),[filters,setFilters]=useState({}),[page,setPage]=useState(1),[data,setData]=useState({cases:[],total:0}),[owners,setOwners]=useState([]),[alerts,setAlerts]=useState({alerts:[],summary:{}}),[alertPage,setAlertPage]=useState(1),[selected,setSelected]=useState(null),[draftAlert,setDraftAlert]=useState('');
  async function refresh() {const n=++seq.current;const q=new URLSearchParams({...Object.fromEntries(Object.entries(filters).filter(([,v])=>v)),page});const [c,o,a]=await Promise.all([api('/followup/cases?'+q),api('/risk/owners'),api('/risk/alerts?'+new URLSearchParams({page:alertPage,...(filters.courseId?{courseId:filters.courseId}:{})}))]);if(n===seq.current){setData(c);setOwners(o.users);setAlerts(a);}}
  async function select(id) {setSelected(await api('/followup/cases/'+id));}
  useEffect(()=>{setSelected(null);setDraftAlert('');op.run(async()=>{await refresh();if(initialCaseId)await select(initialCaseId);});return()=>{seq.current++;};},[JSON.stringify(filters),page,alertPage,revision,initialCaseId]);
  const filter=(k,v)=>{setFilters({...filters,[k]:v});setPage(1);setAlertPage(1);};
  async function create(e) {const b=formData(e);await op.run(async()=>{const r=await api('/followup/cases',{method:'POST',body:b});await refresh();await select(r.case.id);setDraftAlert('');},'Caso abierto y persistido.');}
  async function change(e,activity=false) {const b=formData(e),id=selected.case.id;await op.run(async()=>{await api('/followup/cases/'+id+(activity?'/activities':''),{method:activity?'POST':'PATCH',body:{...b,expectedRevision:selected.case.revision}});await refresh();await select(id);},activity?'Intervención registrada.':'Caso actualizado con historial.');}
  const current=selected?.case,canEdit=current&&(user.role!=='teacher'||current.responsable_id===user.id);
  return <div className="follow-layout"><section className="panel follow-intro"><p className="eyebrow">Acompañamiento escolar</p><h2>Casos de seguimiento</h2><p>Convierte una alerta en un plan con responsable, próxima acción y fecha. Registra solo intervenciones que realmente se realizaron.</p><p>El cierre del caso conserva su historial y no resuelve automáticamente la alerta que lo originó.</p></section><Feedback {...op}/>
    <section className="panel secure-form"><h2>Filtrar casos</h2><div className="follow-form-grid">
      <label>Estado del caso<select aria-label="Estado del caso" value={filters.status??''} onChange={e=>filter('status',e.target.value)}><option value="">Todos</option>{['abierto','en_curso','cerrado'].map(s=><option key={s} value={s}>{names[s]}</option>)}</select></label>
      <label>Curso del caso<select aria-label="Curso del caso" value={filters.courseId??''} onChange={e=>filter('courseId',e.target.value)}><option value="">Todos</option>{courses.map(c=><option key={c.id} value={c.id}>{c.name} · {c.period}</option>)}</select></label>
      <label>Estudiante del caso<select aria-label="Estudiante del caso" value={filters.studentId??''} onChange={e=>filter('studentId',e.target.value)}><option value="">Todos</option>{students.map(s=><option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}</select></label>
      <label>Responsable del caso<select aria-label="Responsable del caso" value={filters.ownerId??''} onChange={e=>filter('ownerId',e.target.value)}><option value="">Todos</option>{owners.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
    </div></section>
    <section className="panel"><h2>Bandeja de casos</h2>{!data.cases.length&&!op.busy&&<Empty>No hay casos para estos filtros.</Empty>}<div className="follow-cards">{data.cases.map(c=><article className="follow-card" key={c.id}><span className="secure-pill">{names[c.estado]} · {names[c.prioridad]}</span><h3>{c.student}</h3><p>{c.course} · {c.owner}</p><p>{c.siguiente_accion}</p><p>Seguimiento: {day(c.fecha_seguimiento)}</p><button disabled={op.busy} onClick={()=>op.run(()=>select(c.id))}>Abrir caso</button></article>)}</div><Pages page={page} total={data.total} busy={op.busy} setPage={setPage}/></section>
    <section className="panel"><h2>Abrir caso desde una alerta</h2><p>Un solo caso activo por alerta. Si ya existe, ábrelo desde la bandeja.</p><form className="secure-form" onSubmit={create}><fieldset className="academic-fieldset secure-form" disabled={op.busy}>
      <label>Alerta de origen<select aria-label="Alerta de origen" name="alertId" required value={draftAlert} onChange={e=>setDraftAlert(e.target.value)}><option value="" disabled>Selecciona una alerta abierta…</option>{alerts.alerts.filter(a=>!['resuelta','descartada'].includes(a.estado)).map(a=><option key={a.id} value={a.id}>{a.student} · {a.titulo}</option>)}</select></label>
      <CaseFields owners={owners} user={user}/><Reason label="Motivo de apertura"/><button className="primary-button" disabled={!draftAlert}>Crear caso</button></fieldset></form><Pages page={alertPage} total={alerts.summary.total??0} busy={op.busy} setPage={setAlertPage}/>
    </section>
    {current&&<section className="panel" key={current.id+':'+current.revision}><h2>Seguimiento de {current.student}</h2><span className="secure-pill">{names[current.estado]} · Revisión {current.revision}</span><p>{current.motivo}</p><p>{current.owner} · {day(current.fecha_seguimiento)}</p>{current.resultado&&<p>Resultado: {current.resultado}</p>}<button disabled={op.busy} onClick={()=>op.run(()=>select(current.id))}>Recargar caso</button>
      {!canEdit&&<p>Solo el docente responsable o el equipo de gestión pueden modificar este caso.</p>}
      {canEdit&&<><details className="follow-detail"><summary>{current.estado==='cerrado'?'Reabrir caso':'Cambiar estado, responsable o cerrar'}</summary><form className="secure-form" onSubmit={e=>change(e)}><fieldset className="academic-fieldset secure-form" disabled={op.busy}>
        <label>Nuevo estado del caso<select aria-label="Nuevo estado del caso" name="status" defaultValue={current.estado==='cerrado'?'en_curso':current.estado}>{(current.estado==='cerrado'?['en_curso']:['abierto','en_curso','cerrado']).map(s=><option key={s} value={s}>{names[s]}</option>)}</select></label><CaseFields owners={owners} user={user} record={current}/><Reason label="Fundamento del cambio" name="note"/><label>Resultado de cierre (obligatorio al cerrar)<textarea name="outcome" minLength={8} maxLength={2000}/></label><button className="primary-button">Guardar estado del caso</button></fieldset></form></details>
        {current.estado!=='cerrado'&&<details className="follow-detail"><summary>Registrar intervención</summary><form className="secure-form" onSubmit={e=>change(e,true)}><fieldset className="academic-fieldset secure-form" disabled={op.busy}><Reason label="Intervención realizada" name="note"/><Plan record={current}/><button className="primary-button">Guardar intervención</button></fieldset></form></details>}
      </>}
      <h3>Historial del caso (últimos 500 registros)</h3><ol className="follow-timeline">{selected.activities.map(a=><li key={a.id}><strong>{names[a.tipo]} · {a.actor}</strong><small>{when(a.creado_en)}</small><p>{a.nota}</p><small>Estado: {names[a.detalle.status]} · Próximo seguimiento: {day(a.detalle.followupDate)}</small></li>)}</ol>
    </section>}
  </div>;
}
function Plan({record}) {return <><label>Próxima acción<input name="nextAction" required minLength={3} maxLength={1000} defaultValue={record?.siguiente_accion??''}/></label><label>Fecha de seguimiento<input name="followupDate" type="date" required defaultValue={day(record?.fecha_seguimiento)}/></label></>;}
function CaseFields({owners,user,record}) {return <><label>Asignar responsable del caso<select aria-label="Asignar responsable del caso" name="ownerId" required defaultValue={record?.responsable_id??user.id}>{owners.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}</select></label><label>Prioridad del caso<select aria-label="Prioridad del caso" name="priority" defaultValue={record?.prioridad??'media'}>{['media','alta','critica'].map(v=><option key={v} value={v}>{names[v]}</option>)}</select></label><Plan record={record}/></>;}

export function DossierPanel({api,user,students,revision}) {
  const op=useWork(),seq=useRef(0),[id,setId]=useState(user.studentId??''),[data,setData]=useState(null);
  async function refresh() {const n=++seq.current;setData(null);if(!id)return;const d=await api('/students/'+id+'/dossier');if(n===seq.current)setData(d);}
  useEffect(()=>{op.run(refresh);return()=>{seq.current++;};},[id,revision]);
  const self=user.role==='student';
  return <div className="follow-layout"><section className="panel secure-form"><p className="eyebrow">Una mirada completa</p><h2>Ficha integral</h2>{!self&&<label>Estudiante de la ficha<select aria-label="Estudiante de la ficha" value={id} onChange={e=>setId(e.target.value)}><option value="">Selecciona un estudiante…</option>{students.map(s=><option key={s.id} value={s.id}>{s.firstName} {s.lastName} · {s.identifier}</option>)}</select></label>}<p>Información consolidada desde los registros guardados. Las secciones respetan tus permisos y las publicaciones académicas.</p><button disabled={op.busy||!id} onClick={()=>op.run(refresh)}>Actualizar ficha</button></section><Feedback {...op}/>
    {data&&<><section className="panel follow-intro"><h2>{data.student.nombres} {data.student.apellidos}</h2><p>{data.student.identifier} · {data.student.estado}</p><p>{data.privacy}</p><small>Consultado: {when(data.generatedAt)} · {data.source}</small>{data.truncated.length>0&&<p role="status">Vista limitada a los últimos 500 registros por sección. Hay más datos en: {data.truncated.join(', ')}.</p>}</section>
      <div className="follow-cards">{[['Notas publicadas',data.grades.length],['Asistencias publicadas',data.attendance.length],['Anotaciones visibles',data.annotations.length],...(!self?[['Casos abiertos',data.cases.filter(c=>c.estado!=='cerrado').length]]:[])].map(([label,value])=><section className="panel" key={label}><span>{label}</span><h2>{value}</h2></section>)}</div>
      <DossierSection title="Matrículas" rows={data.enrollments} render={r=><>{r.course} · {r.period} · {r.estado}</>}/>
      <DossierSection title="Notas publicadas" rows={data.grades} render={r=><><strong>{r.subject} · {r.evaluation}</strong><p>Nota {Number(r.valor).toLocaleString('es-CL')} · Ponderación {r.ponderacion}% · {day(r.fecha)}</p></>}/>
      <DossierSection title="Asistencia publicada" rows={data.attendance} render={r=><><strong>{day(r.fecha)} · {r.subject}</strong><p>{r.titulo} · {r.estado}</p></>}/>
      <DossierSection title="Anotaciones visibles" rows={data.annotations} render={r=><><strong>{r.tipo} · {r.categoria}</strong><p>{r.detalle}</p><small>{when(r.creado_en)} · {r.subject??'Curso'}</small></>}/>
      {!self&&<><DossierSection title="Apoderados activos" rows={data.guardians} render={r=><><strong>{r.nombres} {r.apellidos}</strong><p>{r.parentesco} · {r.es_principal?'Principal':'Secundario'}</p>{'email' in r&&<p>{r.email??'Sin correo'} · {r.telefono??'Sin teléfono'}</p>}</>}/>
        <DossierSection title="Alertas" rows={data.alerts} render={r=><><strong>{r.titulo}</strong><p>{r.severidad} · {r.estado}</p></>}/>
        <DossierSection title="Casos de seguimiento" rows={data.cases} render={r=><><strong>{names[r.estado]} · {r.owner}</strong><p>{r.motivo}</p><p>Próxima acción: {r.siguiente_accion} · {day(r.fecha_seguimiento)}</p>{r.resultado&&<p>Resultado: {r.resultado}</p>}</>}/>
        <DossierSection title="Intervenciones y cambios de casos" rows={data.activities} render={r=><><strong>{names[r.tipo]} · {r.actor}</strong><p>{r.nota}</p><small>{when(r.creado_en)}</small></>}/>
        <DossierSection title="Intervenciones anteriores" rows={data.interventions} render={r=><><strong>{r.tipo} · {r.actor}</strong><p>{r.nota} · {r.resultado}</p><small>{when(r.creado_en)}</small></>}/>
      </>}
    </>}
  </div>;
}
function DossierSection({title,rows,render}) {return <section className="panel"><details open><summary className="follow-section-title">{title} <span className="secure-pill">{rows.length}</span></summary>{!rows.length?<Empty/>:<div className="follow-records">{rows.map(r=><article key={r.id}>{render(r)}</article>)}</div>}</details></section>;}
