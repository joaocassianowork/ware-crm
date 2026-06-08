const Tasks = (() => {
  function render() {
    const el = document.getElementById('myTasksList');
    if (!el) return;

    // Get all project tasks not done
    const pending = Store.tasks.filter(t => !t.done);
    if (!pending.length) {
      el.innerHTML = '<div style="padding:32px;text-align:center;color:var(--green);font-size:13px;">✓ Nenhuma tarefa pendente</div>';
      return;
    }

    // Group by project → client
    const byProject = {};
    pending.forEach(t => {
      if (!byProject[t.project_id]) byProject[t.project_id] = [];
      byProject[t.project_id].push(t);
    });

    el.innerHTML = Object.entries(byProject).map(([projId, ptasks]) => {
      const proj = Store.projects.find(p => p.id === projId);
      const client = Store.clients.find(c => c.id === proj?.client_id);
      return `<div style="padding:14px 18px;border-bottom:1px solid var(--br);">
        <div style="font-size:11px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--blue);margin-bottom:10px;">${client?.name || '—'}</div>
        ${ptasks.slice(0, 5).map(t => `
          <div class="task-item">
            <div class="chk-box" onclick="Tasks.complete('${t.id}','${projId}')"></div>
            <div style="flex:1;">
              <div style="font-size:13px;color:var(--w7);">${t.task}</div>
              <div style="font-size:11px;color:var(--w4);margin-top:2px;">${t.service}</div>
            </div>
          </div>`).join('')}
        ${ptasks.length > 5 ? `<div style="font-size:12px;color:var(--w4);padding:6px 0;">+${ptasks.length - 5} tarefas a mais</div>` : ''}
      </div>`;
    }).join('');
  }

  async function complete(taskId, projectId) {
    await sb.from('project_tasks').update({
      done: true,
      done_at: new Date().toISOString()
    }).eq('id', taskId);
    App.loadAll();
  }

  function renderAgenda() {
    const el = document.getElementById('agendaList');
    if (!el) return;

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const in7 = new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10);

    const agenda = [];

    // Contract expirations in 7 days
    Store.clients.filter(c => c.status === 'ativo' && c.contract_end >= today && c.contract_end <= in7).forEach(c => {
      agenda.push({ date: c.contract_end, label: `📋 Vencimento contrato — ${c.name}`, color: 'var(--red)', priority: 1 });
    });

    // Payments due this week
    Store.payments.filter(p => p.status !== 'pago' && p.due_date >= today && p.due_date <= in7).forEach(p => {
      const c = Store.clients.find(x => x.id === p.client_id);
      agenda.push({ date: p.due_date, label: `💰 Cobrança — ${c?.name || '—'} (R$ ${(p.amount || 0).toLocaleString('pt-BR')})`, color: 'var(--amber)', priority: 2 });
    });

    // Meetings this week
    Store.meetings.filter(m => m.date >= today && m.date <= in7).forEach(m => {
      const c = Store.clients.find(x => x.id === m.client_id);
      agenda.push({ date: m.date, label: `📅 Reunião — ${c?.name || '—'}`, color: 'var(--blue)', priority: 3 });
    });

    agenda.sort((a, b) => a.date > b.date ? 1 : -1);

    if (!agenda.length) {
      el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--w4);font-size:13px;">Nada programado para os próximos 7 dias ✓</div>';
      return;
    }

    el.innerHTML = agenda.map(item => {
      const dt = new Date(item.date + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' });
      return `<div style="display:flex;align-items:center;gap:12px;padding:10px 18px;border-bottom:1px solid var(--br);">
        <div style="font-size:11px;font-weight:600;color:${item.color};min-width:80px;">${dt}</div>
        <div style="font-size:13px;color:var(--w7);">${item.label}</div>
      </div>`;
    }).join('');
  }

  return { render, complete, renderAgenda };
})();
