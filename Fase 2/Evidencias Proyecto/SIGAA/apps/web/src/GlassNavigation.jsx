import { useEffect, useRef, useState } from "react";
import logo from "./assets/sigaa-logo.png";
import "./glass.css";

const paths = {
  summary: "M3 10 12 3l9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
  students: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 4a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  courses: "M3 4h6a4 4 0 0 1 3 2 4 4 0 0 1 3-2h6v15h-6a4 4 0 0 0-3 2 4 4 0 0 0-3-2H3ZM12 6v15",
  enrollments: "M8 3H5v18h14V3h-3M8 2h8v4H8ZM8 11h8M8 16h5",
  structure: "M9 3h6v5H9ZM3 16h6v5H3ZM15 16h6v5h-6ZM12 8v4M6 16v-4h12v4",
  risk: "M12 3 2 20h20ZM12 9v5M12 17v.5",
  justifications: "M14 2H5v20h14V7ZM14 2v6h5M8 15l3 3 5-6",
  attendance: "M4 5h16v16H4ZM8 2v6M16 2v6M4 10h16M8 15l3 3 5-5",
  grades: "M4 20V10h4v10M10 20V4h4v16M16 20v-9h4v9",
  annotations: "M4 3h16v14H9l-5 4ZM8 8h8M8 12h5",
  security: "M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6ZM8 12l3 3 5-6",
};
export function NavIcon({ name, ...props }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={paths[name] || paths.summary}/></svg>;
}

export default function GlassNavigation({ items, view, onNavigate, user, role, onLogout, open, setOpen }) {
  const [mobile, setMobile] = useState(() => window.matchMedia("(max-width: 700px)").matches);
  const [pointer, setPointer] = useState(null);
  const [focus, setFocus] = useState(null);
  const panel = useRef(null), trigger = useRef(null), nav = useRef(null);
  useEffect(() => {
    const media = window.matchMedia("(max-width: 700px)");
    const change = () => { setMobile(media.matches); setOpen(false); setPointer(null); };
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, [setOpen]);
  useEffect(() => {
    if (!mobile || !open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Wait for visibility to become effective before focusing the opening panel.
    // A single frame can run before the CSS visibility transition starts.
    let focusFrame;
    const frame = requestAnimationFrame(() => {
      focusFrame = requestAnimationFrame(() => {
        if (!panel.current?.contains(document.activeElement))
          panel.current?.querySelector('[aria-current="page"]')?.focus();
      });
    });
    function keyboard(e) {
      if (e.key === "Escape") { e.preventDefault(); setOpen(false); trigger.current?.focus(); }
      if (e.key === "Tab") {
        const buttons = [...panel.current.querySelectorAll("button")];
        const first = buttons[0], last = buttons.at(-1);
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); trigger.current?.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); trigger.current?.focus(); }
        else if (document.activeElement === trigger.current) { e.preventDefault(); (e.shiftKey ? last : first)?.focus(); }
      }
    }
    document.addEventListener("keydown", keyboard);
    return () => { cancelAnimationFrame(frame); cancelAnimationFrame(focusFrame); document.body.style.overflow = previous; document.removeEventListener("keydown", keyboard); };
  }, [mobile, open, setOpen]);
  function navigate(id) { onNavigate(id); setOpen(false); if (mobile) trigger.current?.focus(); }
  return <>
    <button ref={trigger} className={"glass-menu-trigger" + (open ? " is-open" : "")} type="button" aria-label={open ? "Cerrar menú" : "Abrir menú"} aria-expanded={open} aria-controls="school-navigation" onClick={() => setOpen(!open)}><span/><span/></button>
    {mobile && open && <button className="glass-scrim" aria-label="Cerrar navegación" tabIndex={-1} onClick={() => { setOpen(false); trigger.current?.focus(); }}/ >}
    <aside id="school-navigation" ref={panel} className={"glass-navigation" + (open ? " is-open" : "")} inert={mobile && !open ? true : undefined} aria-label="Menú de SIGAA">
      <div className="glass-brand"><img src={logo} alt="SIGAA"/><div><strong>SIGAA</strong><small>Comunidad escolar</small></div><span className="glass-brand-dot" aria-hidden="true"/></div>
      <p className="glass-nav-caption">TU ESPACIO</p>
      <nav ref={nav} aria-label="Navegación principal" style={{ "--active-index": Math.max(0, items.findIndex(([id]) => id === view)) }} onPointerMove={e => { if(e.pointerType !== "mouse" || mobile) return; const rect = nav.current.getBoundingClientRect(); setPointer(e.clientY - rect.top); }} onPointerLeave={() => setPointer(null)} onBlur={e => { if(!e.currentTarget.contains(e.relatedTarget)) setFocus(null); }}>
        <span className="glass-active-lens" aria-hidden="true"/>
        {items.map(([id, label], i) => {
          const distance = pointer == null ? (focus === i ? 0 : 999) : Math.abs(pointer - (i * 54 + 24));
          const proximity = mobile ? 0 : Math.max(0, 1 - distance / 85);
          return <button key={id} type="button" aria-current={view === id ? "page" : undefined} style={{ "--item-scale": 1 + proximity * .055, "--icon-scale": 1 + proximity * .22, "--item-shift": proximity * 3 }} onFocus={() => setFocus(i)} onClick={() => navigate(id)}><span className="glass-nav-icon"><NavIcon name={id}/></span><span>{label}</span><span className="glass-nav-dot" aria-hidden="true"/></button>;
        })}
      </nav>
      <div className="glass-profile"><span className="glass-avatar" aria-hidden="true">{user.name.split(" ").slice(0,2).map(n=>n[0]).join("")}</span><div><strong>{user.name}</strong><small>{role}</small></div></div>
      <button className="glass-logout" type="button" onClick={onLogout}>Cerrar sesión <span aria-hidden="true">↗</span></button>
      <span className="glass-private"><i aria-hidden="true"/>Espacio privado y personal</span>
    </aside>
  </>;
}
