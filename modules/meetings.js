const Meetings = (() => {
  function render() {
    const el = document.getElementById('meetingsList');
    if (!el) return;
    if (!Store.meetings.length) { el.innerHTML = '<div style="padding:32px;text-align:center;color:var(--w4);font-size:13px;">Nenhuma reunião registrada ainda.</div>'; return; }
    el.innerHTML = Store.meetings.map(m => {
      const c = Store.clients.find(x => x.id === m.client_id);
      const dt = m.date ? new Date(m.date + 'T12:00').toLocaleDateString('pt-BR') : '—';
      return `<div class="meet-item">
        <div class="meet-date">${dt}</div>
        <div class="meet-info">
          <div class="meet-name">${c?.name || '—'}</div>
          <div class="meet-summary">${m.summary ? m.summary.slice(0, 100) + '...' : '—'}</div>
          ${m.next_steps ? `<div class="meet-next"><strong>Próximos passos:</strong> ${m.next_steps}</div>` : ''}
        </div>
      </div>`;
    }).join('');
  }
  async function save() {
    const cId = document.getElementById('meetClient').value;
    await sb.from('meetings').insert({
      client_id: cId,
      date: document.getElementById('meetDate').value,
      summary: document.getElementById('meetSummary').value,
      next_steps: document.getElementById('meetNext').value || null
    });
    await sb.from('client_timeline').insert({ client_id: cId, type: 'reunião', title: `Reunião registrada — ${document.getElementById('meetDate').value}`, description: document.getElementById('meetNext').value || null });
    UI.closeModal('moMeeting'); App.loadAll();
  }
  function openModal() {
    const ac = Store.clients.filter(c => c.status === 'ativo');
    document.getElementById('meetClient').innerHTML = ac.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    document.getElementById('meetDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('meetSummary').value = '';
    document.getElementById('meetNext').value = '';
    UI.openModal('moMeeting');
  }
  return { render, save, openModal };
})();
