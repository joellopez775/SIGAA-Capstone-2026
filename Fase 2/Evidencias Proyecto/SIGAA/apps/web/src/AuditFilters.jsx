export const emptyAuditFilters = { action: '', entity: '', from: '', to: '' };

export function AuditFilters({ draft, onChange, onApply, onClear }) {
  function submit(event) {
    event.preventDefault();
    onApply();
  }
  return (
    <form className="secure-form" onSubmit={submit}>
      <div className="follow-cards">
        <label>Acción exacta
          <input value={draft.action} maxLength={80} onChange={e => onChange('action', e.target.value)} />
        </label>
        <label>Entidad exacta
          <input value={draft.entity} maxLength={80} onChange={e => onChange('entity', e.target.value)} />
        </label>
        <label>Desde
          <input type="date" value={draft.from} max={draft.to || undefined} onChange={e => onChange('from', e.target.value)} />
        </label>
        <label>Hasta
          <input type="date" value={draft.to} min={draft.from || undefined} onChange={e => onChange('to', e.target.value)} />
        </label>
      </div>
      <p>Las fechas incluyen ambos días y se interpretan en horario de Santiago.</p>
      <div className="follow-actions">
        <button type="submit" className="primary-button">Aplicar filtros</button>
        <button type="button" onClick={onClear}>Limpiar filtros</button>
      </div>
    </form>
  );
}
