import {AuditFilters,emptyAuditFilters} from './AuditFilters.jsx';
import {useEffect,useState} from 'react';
export function OversightPanel({api,audit=false,revision}){
 const [data,setData]=useState(null),[error,setError]=useState(''),[page,setPage]=useState(1),[filters,setFilters]=useState(emptyAuditFilters),[draft,setDraft]=useState(emptyAuditFilters);
 useEffect(()=>{let active=true;setError('');setData(null);api(audit?`/oversight/audit?${new URLSearchParams({...filters,page})}`:'/oversight/indicators').then(d=>{if(active)setData(d)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[audit,page,filters,revision]);
 return <section className="panel follow-layout"><h2>{audit?'Bitácora de cambios':'Panorama del establecimiento'}</h2>{error&&<p role="alert">{error}</p>}{!data&&!error&&<p role="status">Consultando registros…</p>}
 {audit?<><AuditFilters draft={draft}
   onChange={(key,value)=>setDraft(current=>({...current,[key]:value}))}
   onApply={()=>{setPage(1);setFilters({...draft,action:draft.action.trim(),entity:draft.entity.trim()});}}
   onClear={()=>{setPage(1);setDraft(emptyAuditFilters);setFilters({...emptyAuditFilters});}}/>{data&&<><p role="status">{data.total} eventos registrados. Se muestran fecha, autor y operación.</p><div className="secure-list">{data.events.map(e=><article key={e.id}><div><strong>{e.accion} · {e.entidad}</strong><p>{e.actor}</p><small>{new Date(e.creado_en).toLocaleString('es-CL',{timeZone:'America/Santiago'})}</small></div></article>)}</div>{!data.events.length&&<p>No hay eventos con este filtro.</p>}<div className="follow-actions"><button disabled={page===1} onClick={()=>setPage(page-1)}>Anterior</button><span>Página {page}</span><button disabled={page*25>=data.total} onClick={()=>setPage(page+1)}>Siguiente</button></div></>}</>:data&&<><p>{data.scope} · Consultado: {new Date(data.generatedAt).toLocaleString('es-CL')}</p><div className="follow-cards">{Object.entries({students:'Estudiantes regulares',courses:'Cursos activos',enrollments:'Matrículas activas',open_cases:'Casos abiertos',pending_justifications:'Justificaciones pendientes',published_evaluations:'Evaluaciones publicadas'}).map(([key,label])=><section className="panel" key={key}><span>{label}</span><h3>{data.indicators[key]}</h3></section>)}</div><p>{data.definition}</p></>}
 </section>
}
