const Activity = (() => {
  async function addLog(entityType, entityId, entityName, action, detail = '') {
    await sb.from('client_timeline').insert({
      client_id: entityType === 'client' ? entityId : null,
      type: 'nota',
      title: action,
      description: detail || null
    });
  }

  async function loadForLead(leadId) {
    const { data } = await sb.from('lead_followups').select('*')
      .eq('lead_id', leadId).order('created_at', { ascending: false });
    return data || [];
  }

  async function loadForClient(clientId) {
    const { data } = await sb.from('client_timeline').select('*')
      .eq('client_id', clientId).order('created_at', { ascending: false }).limit(50);
    return data || [];
  }

  async function addNote(entityType, entityId, note) {
    if (!note?.trim()) return;
    if (entityType === 'lead') {
      await sb.from('lead_followups').insert({ lead_id: entityId, note: note.trim() });
      const lead = Store.leads.find(l => l.id === entityId);
      await sb.from('leads').update({
        followup_count: (lead?.followup_count || 0) + 1,
        last_contact_at: new Date().toISOString()
      }).eq('id', entityId);
    } else {
      await sb.from('client_timeline').insert({
        client_id: entityId, type: 'nota', title: note.trim()
      });
    }
    App.loadAll();
  }

  function renderFeed(items, type = 'client') {
    if (!items.length) return '<div style="font-size:13px;color:var(--w4);padding:12px 0;">Nenhuma atividade registrada.</div>';
    const typeColors = {
      reunião: 'var(--blue)', entrega: 'var(--green)', contrato: 'var(--amber)',
      nota: 'var(--w4)', projeto: 'var(--green)', onboarding: 'var(--amber)', conteúdo: 'var(--amber)'
    };
    return items.map(item => {
      const color = typeColors[item.type] || 'var(--blue)';
      const time = timeAgo(item.created_at);
      return `<div class="act-item">
        <div class="act-dot" style="background:${color};"></div>
        <div class="act-content">
          <div class="act-title">${item.title || item.note || '—'}</div>
          ${item.description ? `<div class="act-desc">${item.description}</div>` : ''}
          <div class="act-time">${time}${item.type ? ' · ' + item.type : ''}</div>
        </div>
      </div>`;
    }).join('');
  }

  function timeAgo(ts) {
    if (!ts) return '—';
    const d = Math.floor((Date.now() - new Date(ts)) / 86400000);
    const h = Math.floor((Date.now() - new Date(ts)) / 3600000);
    const m = Math.floor((Date.now() - new Date(ts)) / 60000);
    return d > 0 ? d + 'd atrás' : h > 0 ? h + 'h atrás' : m > 0 ? m + 'min atrás' : 'agora';
  }

  return { addLog, loadForLead, loadForClient, addNote, renderFeed };
})();
