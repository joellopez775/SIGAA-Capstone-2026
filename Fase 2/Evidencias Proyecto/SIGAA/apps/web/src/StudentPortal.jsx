import {useEffect,useState} from 'react';

export function Subjects({subjects=[]}) {
  return <section className="panel follow-layout"><div><p className="eyebrow">Tu aprendizaje</p><h2>Asignaturas de mi matrícula</h2><p>Asignaturas activas de tus cursos actuales.</p></div>
    <div className="follow-cards">{subjects.map(s=><article className="follow-card" key={s.id}><h3>{s.subject}</h3><p>{s.course} · {s.period}</p><small>{s.teacher||'Docente por asignar'}</small></article>)}</div>
    {!subjects.length&&<p className="empty-state">No hay asignaturas activas para tu matrícula.</p>}</section>;
}
export function StudentCalendar({api,studentId,revision}) {
  const [month,setMonth]=useState(()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Santiago',year:'numeric',month:'2-digit'}).format(new Date()).slice(0,7));
  const [data,setData]=useState(null),[error,setError]=useState('');
  useEffect(()=>{
    let active=true;setData(null);setError('');
    if(!/^\d{4}-\d{2}$/.test(month))return;
    const [year,m]=month.split('-').map(Number),last=new Date(year,m,0).getDate();
    api(`/student/calendar/${studentId}?from=${month}-01&to=${month}-${last}`)
      .then(d=>{if(active)setData(d);}).catch(e=>{if(active)setError(e.message);});
    return()=>{active=false;};
  },[api,studentId,month,revision]);
  return <section className="panel follow-layout"><div><p className="eyebrow">Tu agenda académica</p><h2>Clases y evaluaciones publicadas</h2><p>Solo aparecen actividades publicadas de tus asignaturas vigentes. El calendario no implica una asistencia registrada.</p></div>
    <label className="secure-form">Mes del calendario<input type="month" value={month} onChange={e=>setMonth(e.target.value)} required/></label>
    {error&&<p role="alert" className="login-error">{error}</p>}
    {!data&&!error&&<p role="status">Cargando calendario…</p>}
    {data&&<><p role="status">{data.events.length} actividades publicadas en este mes.</p>{data.limited&&<p>Se muestran las primeras 500 actividades. Consulta otro mes para revisar más registros.</p>}
      <div className="follow-records">{data.events.map(e=><article key={e.kind+e.id}><small>{e.date.split('-').reverse().join('/')} · {e.kind==='class'?'Clase':'Evaluación'}{e.block?' · '+e.block:''}</small><h3>{e.title}</h3><p>{e.subject}</p>{e.objective&&<p>{e.objective}</p>}</article>)}</div>
      {!data.events.length&&<p className="empty-state">No hay actividades publicadas para este mes.</p>}</>}
  </section>;
}
