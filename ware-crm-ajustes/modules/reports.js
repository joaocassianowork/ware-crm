const Reports = (() => {
  let curId = null;
  function render() {
    const el = document.getElementById('reportsList');
    if (!el) return;
    if (!Store.reports.length) { el.innerHTML = '<div style="padding:32px;text-align:center;color:var(--w4);font-size:13px;">Nenhum relatório criado ainda.</div>'; return; }
    el.innerHTML = Store.reports.map(r => {
      const c = Store.clients.find(x => x.id === r.client_id);
      const mo = r.month ? new Date(r.month + 'T12:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '—';
      const sb = r.status === 'enviado' ? 'b-green' : 'b-amber';
      return `<div class="rep-item" onclick="Reports.openDetail('${r.id}')">
        <div class="rep-icon">📊</div>
        <div class="rep-info"><div class="rep-name">${c?.name || '—'} — ${mo}</div><div class="rep-meta">${r.summary ? r.summary.slice(0, 80) + '...' : 'Sem resumo'}</div></div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="badge ${sb}">${r.status}</span>
          <button class="btn btn-g btn-sm" onclick="event.stopPropagation();Reports.openDetail('${r.id}')">Ver</button>
        </div>
      </div>`;
    }).join('');
  }
  function openDetail(id) {
    curId = id;
    const r = Store.reports.find(x => x.id === id);
    const c = Store.clients.find(x => x.id === r?.client_id);
    const mo = r?.month ? new Date(r.month + 'T12:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : '—';
    UI.set('dpRepTitle', c?.name || '—');
    UI.set('dpRepSub', mo);
    const d = r?.data || {};
    UI.set('dpRepBody', `
      <div class="dp-section"><div class="dp-section-lbl">Resumo Executivo</div><div style="font-size:14px;color:var(--w7);line-height:1.7;">${r?.summary || '—'}</div></div>
      <div class="dp-section"><div class="dp-section-lbl">Métricas</div>
        <div class="dp-row"><span class="dp-key">Leads gerados</span><span class="dp-val">${d.leads || '—'}</span></div>
        <div class="dp-row"><span class="dp-key">Custo por lead</span><span class="dp-val">${d.cpl ? 'R$ ' + d.cpl : '—'}</span></div>
        <div class="dp-row"><span class="dp-key">Alcance total</span><span class="dp-val">${d.reach || '—'}</span></div>
        <div class="dp-row"><span class="dp-key">Impressões</span><span class="dp-val">${d.impressions || '—'}</span></div>
        <div class="dp-row"><span class="dp-key">Cliques GMB</span><span class="dp-val">${d.gmb_clicks || '—'}</span></div>
        <div class="dp-row"><span class="dp-key">Visitas ao site</span><span class="dp-val">${d.site_visits || '—'}</span></div>
      </div>
      <div class="dp-section"><div class="dp-section-lbl">Próximos Passos</div><div style="font-size:14px;color:var(--w7);line-height:1.7;">${r?.next_steps || '—'}</div></div>
      ${r?.status === 'rascunho' ? `<button class="btn btn-p" style="width:100%;justify-content:center;" onclick="Reports.markSent('${id}')">Marcar como Enviado</button>` : ''}
    `);
    UI.openDP('dpReport');
  }
  async function markSent(id) {
    await sb.from('reports').update({ status: 'enviado', sent_at: new Date().toISOString() }).eq('id', id);
    UI.closeDP('dpReport'); App.loadAll();
  }
  async function save() {
    const cId = document.getElementById('repClient').value;
    const data = {
      leads: document.getElementById('repLeads').value || null,
      cpl: document.getElementById('repCpl').value || null,
      reach: document.getElementById('repReach').value || null,
      impressions: document.getElementById('repImpressions').value || null,
      gmb_clicks: document.getElementById('repGmb').value || null,
      site_visits: document.getElementById('repSite').value || null,
    };
    await sb.from('reports').insert({
      client_id: cId,
      month: document.getElementById('repMonth').value + '-01',
      summary: document.getElementById('repSummary').value,
      data,
      next_steps: document.getElementById('repNext').value,
      status: 'rascunho'
    });
    await sb.from('client_timeline').insert({ client_id: cId, type: 'entrega', title: `Relatório mensal criado — ${document.getElementById('repMonth').value}` });
    UI.closeModal('moReport'); App.loadAll();
  }
  function openModal() {
    const ac = Store.clients.filter(c => c.status === 'ativo');
    document.getElementById('repClient').innerHTML = ac.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    document.getElementById('repMonth').value = new Date().toISOString().slice(0, 7);
    ['repSummary','repNext','repLeads','repCpl','repReach','repImpressions','repGmb','repSite'].forEach(id => { document.getElementById(id).value = ''; });
    UI.openModal('moReport');
  }
  return { render, openDetail, markSent, save, openModal };
})();
