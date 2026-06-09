const Growth = (() => {
  const money = v => 'R$ ' + (Number(v) || 0).toLocaleString('pt-BR');

  function renderFinancialPipeline() {
    const el = document.getElementById('financialPipeline');
    if (!el) return;
    const today = new Date().toISOString().slice(0, 10);
    const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const cols = [
      { label: 'Atrasado', items: Store.payments.filter(p => p.status === 'atrasado' || (p.status !== 'pago' && p.due_date && p.due_date < today)), color: 'var(--red)' },
      { label: 'Vence em 7 dias', items: Store.payments.filter(p => p.status !== 'pago' && p.due_date >= today && p.due_date <= in7), color: 'var(--amber)' },
      { label: 'Pendente', items: Store.payments.filter(p => p.status === 'pendente' && (!p.due_date || p.due_date > in7)), color: 'var(--blue)' },
      { label: 'Pago', items: Store.payments.filter(p => p.status === 'pago'), color: 'var(--green)' }
    ];
    el.innerHTML = cols.map(col => {
      const total = col.items.reduce((s, p) => s + (Number(p.amount) || 0), 0);
      return `<div class="kanban-col finance-col">
        <div class="kanban-head"><span>${col.label}</span><strong style="color:${col.color};">${money(total)}</strong></div>
        <div class="kanban-list">
          ${col.items.length ? col.items.slice(0, 8).map(p => {
            const c = Store.clients.find(x => x.id === p.client_id);
            const due = p.due_date ? new Date(p.due_date + 'T12:00').toLocaleDateString('pt-BR') : 'Sem vencimento';
            return `<div class="kanban-card">
              <div class="kanban-title">${c?.name || 'Cliente'}</div>
              <div class="kanban-meta">${money(p.amount)} · ${due}</div>
              <div class="kanban-foot">
                ${p.status !== 'pago' ? `<button class="fu-btn" onclick="Finance.markPaid('${p.id}')">Marcar pago</button>` : `<span class="badge b-green">pago</span>`}
                <button class="btn btn-red btn-sm" onclick="Finance.deletePayment('${p.id}')">Excluir</button>
              </div>
            </div>`;
          }).join('') : `<div class="kanban-empty">Nada aqui</div>`}
        </div>
      </div>`;
    }).join('');
  }

  function monthsAsClient(client) {
    if (!client?.contract_start) return 0;
    return Math.max(0, Math.floor((Date.now() - new Date(client.contract_start + 'T12:00')) / (30 * 86400000)));
  }

  function renderClientPanel(clientId) {
    const el = document.getElementById('dpClientGrowth'); if (!el) return;
    const c = Store.clients.find(x => x.id === clientId); if (!c) return;
    const months = monthsAsClient(c);
    const referral = latestMilestone(clientId, 'referral_temperature');
    const result = latestMilestone(clientId, 'first_result');
    const checkin = Store.checkins.find(x => x.client_id === clientId);
    el.innerHTML = `
      <div class="growth-grid">
        <div class="growth-box"><span>Tempo como cliente</span><strong>${months} mes(es)</strong><button class="btn btn-g btn-sm" onclick="Growth.copyNpsMessage('${clientId}')">Copiar NPS</button></div>
        <div class="growth-box"><span>Termometro de indicacao</span><strong>${referral?.score ? referral.score + '/5' : '—'}</strong><button class="btn btn-g btn-sm" onclick="Growth.openModal('referral','${clientId}')">Atualizar</button></div>
        <div class="growth-box"><span>Primeiro resultado</span><strong>${result?.title || '—'}</strong><button class="btn btn-g btn-sm" onclick="Growth.openModal('first_result','${clientId}')">Registrar</button></div>
      </div>
      ${referral?.note ? `<div class="growth-note">Indicacao: ${referral.note}</div>` : ''}
      ${result?.note ? `<div class="growth-note">Resultado: ${result.note}</div>` : ''}
      <div class="growth-checkin">
        <div><strong>Pergunta mensal de check-in</strong><span>${checkin?.question || suggestedCheckin(c, months)}</span>${checkin?.answer ? `<em>${checkin.answer}</em>` : ''}</div>
        <button class="btn btn-g btn-sm" onclick="Growth.openModal('checkin','${clientId}')">Registrar</button>
      </div>
      <textarea readonly class="script-box" style="width:100%;min-height:88px;margin-top:10px;">${buildNpsMessage(c, months)}</textarea>
    `;
  }

  function renderLeadPanel(leadId) {
    const el = document.getElementById('dpLeadGrowth'); if (!el) return;
    const items = Store.objections.filter(o => o.lead_id === leadId);
    el.innerHTML = `
      <button class="btn btn-g btn-sm" onclick="Growth.openModal('objection','${leadId}')">+ Registrar objecao</button>
      <div style="margin-top:10px;">
        ${items.length ? items.map(o => `<div class="objection-item">
          <div><strong>${o.objection}</strong>${o.response ? `<span>${o.response}</span>` : ''}</div>
          <button class="btn btn-red btn-sm" onclick="Growth.deleteObjection('${o.id}','${leadId}')">Excluir</button>
        </div>`).join('') : `<div style="font-size:13px;color:var(--w4);">Nenhuma objecao registrada.</div>`}
      </div>
    `;
  }

  function latestMilestone(clientId, type) {
    return Store.clientMilestones.find(m => m.client_id === clientId && m.type === type);
  }

  function buildNpsMessage(c, months) {
    const name = c?.lawyer_name?.split(' ')[0] || '';
    const url = window.location.origin + '/satisfacao.html?c=' + c.id;
    const hook = months >= 6 ? `ja sao ${months} meses de parceria` : 'queremos acompanhar de perto sua experiencia';
    return `Ola, Dr(a). ${name}! Como ${hook}, queria te pedir uma avaliacao rapida da Ware. Leva menos de 1 minuto e ajuda a gente a melhorar sua operacao: ${url}`;
  }

  function suggestedCheckin(c, months) {
    if (months >= 6) return 'O que hoje faria voce indicar a Ware com mais confianca para outro escritorio?';
    if (months >= 3) return 'Qual resultado voce mais quer ver evoluir no proximo mes?';
    return 'O comeco da operacao esta claro e confortavel para voce?';
  }

  function openModal(kind, entityId) {
    const titles = { referral: 'Termometro de indicacao', first_result: 'Primeiro resultado significativo', checkin: 'Pergunta mensal de check-in', objection: 'Objecao de venda' };
    const mainLabels = { referral: 'Resumo', first_result: 'Resultado', checkin: 'Pergunta', objection: 'Objecao' };
    const noteLabels = { referral: 'Observacao', first_result: 'Detalhes', checkin: 'Resposta / observacao', objection: 'Resposta / proximo argumento' };
    document.getElementById('growthKind').value = kind;
    document.getElementById('growthEntityId').value = entityId;
    document.getElementById('growthTitle').textContent = titles[kind] || 'Registrar';
    document.getElementById('growthMainLabel').textContent = mainLabels[kind] || 'Titulo';
    document.getElementById('growthNoteLabel').textContent = noteLabels[kind] || 'Detalhes';
    document.getElementById('growthScoreWrap').style.display = kind === 'referral' ? 'block' : 'none';
    document.getElementById('growthScore').value = '3';
    document.getElementById('growthMain').value = '';
    document.getElementById('growthNote').value = '';
    if (kind === 'checkin') {
      const c = Store.clients.find(x => x.id === entityId);
      document.getElementById('growthMain').value = suggestedCheckin(c, monthsAsClient(c));
    }
    UI.openModal('moGrowth');
  }

  async function saveModal() {
    const kind = document.getElementById('growthKind').value;
    const entityId = document.getElementById('growthEntityId').value;
    const main = document.getElementById('growthMain').value.trim();
    const note = document.getElementById('growthNote').value.trim();
    const score = Number(document.getElementById('growthScore').value);
    if (!main) { alert('Preencha o campo principal.'); return; }
    if (kind === 'referral') return setReferral(entityId, score, note || main);
    if (kind === 'first_result') return setFirstResult(entityId, main, note);
    if (kind === 'checkin') return saveCheckin(entityId, main, note);
    if (kind === 'objection') return addObjection(entityId, main, note);
  }

  async function copyNpsMessage(clientId) {
    const c = Store.clients.find(x => x.id === clientId);
    const msg = buildNpsMessage(c, monthsAsClient(c));
    navigator.clipboard?.writeText(msg).then(() => alert('Mensagem NPS copiada.')).catch(() => alert(msg));
  }

  async function setReferral(clientId, score, note) {
    const { error } = await sb.from('client_milestones').insert({ client_id: clientId, type: 'referral_temperature', title: 'Termometro de indicacao', score, note });
    if (error) { alert('Nao foi possivel salvar. Rode o SQL de ajustes no Supabase.'); return; }
    UI.closeModal('moGrowth'); await App.loadAll(); renderClientPanel(clientId);
  }

  async function setFirstResult(clientId, title, note) {
    const { error } = await sb.from('client_milestones').insert({ client_id: clientId, type: 'first_result', title, note });
    if (error) { alert('Nao foi possivel salvar. Rode o SQL de ajustes no Supabase.'); return; }
    await sb.from('client_timeline').insert({ client_id: clientId, type: 'entrega', title: `Primeiro resultado: ${title}`, description: note || null });
    UI.closeModal('moGrowth'); await App.loadAll(); renderClientPanel(clientId);
  }

  async function saveCheckin(clientId, question, answer) {
    const { error } = await sb.from('client_checkins').insert({ client_id: clientId, question, answer });
    if (error) { alert('Nao foi possivel salvar. Rode o SQL de ajustes no Supabase.'); return; }
    UI.closeModal('moGrowth'); await App.loadAll(); renderClientPanel(clientId);
  }

  async function addObjection(leadId, objection, response) {
    const { error } = await sb.from('sales_objections').insert({ lead_id: leadId, objection, response, status: 'aberta' });
    if (error) { alert('Nao foi possivel salvar. Rode o SQL de ajustes no Supabase.'); return; }
    UI.closeModal('moGrowth'); await App.loadAll(); renderLeadPanel(leadId);
  }

  async function deleteObjection(id, leadId) {
    if (!confirm('Excluir esta objecao?')) return;
    await sb.from('sales_objections').delete().eq('id', id);
    await App.loadAll(); renderLeadPanel(leadId);
  }

  return { renderFinancialPipeline, renderClientPanel, renderLeadPanel, copyNpsMessage, openModal, saveModal, setReferral, setFirstResult, saveCheckin, addObjection, deleteObjection };
})();
