import {useEffect,useState} from 'react';
const labels={apertura:'Nuevo caso de seguimiento',actividad:'Nueva intervención en un caso',cambio:'Un caso fue actualizado',cierre:'Un caso fue cerrado',reapertura:'Un caso fue reabierto'};
export default function NotificationsPanel({api,revision,onOpenCase,onUnread}) {
  const [page,setPage]=useState(1),[filter,setFilter]=useState('all'),[data,setData]=useState(null),[error,setError]=useState(''),[busy,setBusy]=useState(false),[tick,setTick]=useState(0);
  useEffect(()=>{
    let active=true;setError('');setData(null);
    api(`/notifications?page=${page}&filter=${filter}`).then(d=>{if(active){setData(d);onUnread(d.unread);}}).catch(e=>{if(active)setError(e.message);});
    return()=>{active=false;};
  },[api,page,filter,revision,tick,onUnread]);
  async function read(id){setBusy(true);setError('');try{await api(`/notifications/${id}/read`,{method:'PATCH',body:{}});setTick(t=>t+1);}catch(e){setError(e.message);}finally{setBusy(false);}}
  return <section className="panel follow-layout"><div><p className="eyebrow">Tu bandeja personal</p><h2>Avisos de seguimiento</h2><p>Recibes avisos de cambios realizados por otras personas en los casos que creaste o tienes a cargo. Solo permanecen visibles mientras conservas acceso al curso.</p></div>
    <div className="follow-actions secure-form"><label>Mostrar avisos<select aria-label="Mostrar avisos" value={filter} onChange={e=>{setFilter(e.target.value);setPage(1);}}><option value="all">Todos</option><option value="unread">Sin leer</option></select></label><button onClick={()=>setTick(t=>t+1)} disabled={busy}>Actualizar avisos</button></div>
    {error&&<p role="alert" className="login-error">{error}</p>}{!data&&!error&&<p role="status">Cargando avisos…</p>}
    {data&&<><p role="status">{data.unread} avisos sin leer · {data.total} resultados</p><div className="follow-records">{data.notifications.map(n=><article key={n.id}><span className="secure-pill">{n.leida_en?'Leído':'Sin leer'}</span><h3>{labels[n.tipo]}</h3><small>{new Date(n.creado_en).toLocaleString('es-CL',{timeZone:'America/Santiago'})}</small><div className="follow-actions"><button onClick={()=>onOpenCase(n.caso_id)}>Ver caso</button>{!n.leida_en&&<button disabled={busy} onClick={()=>read(n.id)}>Marcar como leído</button>}</div></article>)}</div>
    {!data.notifications.length&&<p className="empty-state">No hay avisos en esta página.</p>}<div className="follow-actions"><button disabled={busy||page===1} onClick={()=>setPage(p=>p-1)}>Anterior</button><span>Página {page} de {Math.max(1,Math.ceil(data.total/25))}</span><button disabled={busy||page*25>=data.total} onClick={()=>setPage(p=>p+1)}>Siguiente</button></div></>}
  </section>;
}
