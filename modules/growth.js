const Growth = (() => {
  const money = v => 'R$ ' + (Number(v) || 0).toLocaleString('pt-BR');

  function renderFinancialPipeline() {
    const el = document.getElementById('financialPipeline');
    if (!el) return;
    const today = new Date().toISOString().slice(0, 10);
    const in7 = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    const cols = [
      { id: 'atrasado', label: 'Atrasado', items: Store.payments.filter(p => p.status === 'atrasado' || (p.status !== 'pago' && p.due_date && p.due_date < today)), color: 'var(--red)' },
      { id: 'semana', label: 'Vence em 7 dias', items: Store.payments.filter(p => p.status !== 'pago' && p.due_date >= today && p.due_date <= in7), color: 'var(--amber)' },
      { id: 'pendente', label: 'Pendente', items: Store.payments.filter(p => p.status === 'pendente' && (!p.due_date || p.due_date > in7)), color: 'var(--blue)' },
      { id: 'pago', label: 'Pago', items: Store.payments.filter(p => p.status === 'pago'), color: 'var(--green)' }
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
    const npsMsg = buildNpsMessage(c, months);
    const checkin = Store.checkins.find(x => x.client_id === clientId);
    el.innerHTML = `
      <div class="growth-grid">
        <div class="growth-box"><span>Tempo como cliente</span><strong>${months} mês(es)</strong><button class="btn btn-g btn-sm" onclick="Growth.copyNpsMessage('${clientId}')">Copiar NPS</button></div>
        <div class="growth-box"><span>Termômetro de indicação</span><strong>${referral?.score ? referral.score + '/5' : '—'}</strong><button class="btn btn-g btn-sm" onclick="Growth.setReferral('${clientId}')">Atualizar</button></div>
        <div class="growth-box"><span>Primeiro resultado</span><strong>${result?.title || '—'}</strong><button class="btn btn-g btn-sm" onclick="Growth.setFirstResult('${clientId}')">Registrar</button></div>
      </div>
      ${referral?.note ? `<div class="growth-note">Indicação: ${referral.note}</div>` : ''}
      ${result?.note ? `<div class="growth-note">Resultado: ${result.note}</div>` : ''}
      <div class="growth-checkin">
        <div><strong>Pergunta mensal de check-in</strong><span>${checkin?.question || suggestedCheckin(c, months)}</span>${checkin?.answer ? `<em>${checkin.answer}</em>` : ''}</div>
        <button class="btn btn-g btn-sm" onclick="Growth.saveCheckin('${clientId}')">Registrar</button>
      </div>
      <textarea readonly class="script-box" style="width:100%;min-height:88px;margin-top:10px;">${npsMsg}</textarea>
    `;
  }

  function renderLeadPanel(leadId) {
    const el = document.getElementById('dpLeadGrowth'); if (!el) return;
    const items = Store.objections.filter(o => o.lead_id === leadId);
    el.innerHTML = `
      <button class="btn btn-g btn-sm" onclick="Growth.addObjection('${leadId}')">+ Registrar objeção</button>
      <div style="margin-top:10px;">
        ${items.length ? items.map(o => `<div class="objection-item">
          <div><strong>${o.objection}</strong>${o.response ? `<span>${o.response}</span>` : ''}</div>
          <button class="btn btn-red btn-sm" onclick="Growth.deleteObjection('${o.id}','${leadId}')">Excluir</button>
        </div>`).join('') : `<div style="font-size:13px;color:var(--w4);">Nenhuma objeção registrada.</div>`}
      </div>
    `;
  }

  function latestMilestone(clientId, type) {
    return Store.clientMilestones.find(m => m.client_id === clientId && m.type === type);
  }

  function buildNpsMessage(c, months) {
    const name = c?.lawyer_name?.split(' ')[0] || '';
    const url = window.location.origin + '/satisfacao.html?c=' + c.id;
    const hook = months >= 6 ? `já são ${months} meses de parceria` : 'queremos acompanhar de perto sua experiência';
    return `Olá, Dr(a). ${name}! Como ${hook}, queria te pedir uma avaliação rápida da Ware. Leva menos de 1 minuto e ajuda a gente a melhorar sua operação: ${url}`;
  }

  function suggestedCheckin(c, months) {
    if (months >= 6) return 'O que hoje faria você indicar a Ware com mais confiança para outro escritório?';
    if (months >= 3) return 'Qual resultado você mais quer ver evoluir no próximo mês?';
    return 'O começo da operação está claro e confortável para você?';
  }

  async function copyNpsMessage(clientId) {
    const c = Store.clients.find(x => x.id === clientId);
    const msg = buildNpsMessage(c, monthsAsClient(c));
    navigator.clipboard?.writeText(msg).then(() => alert('Mensagem NPS copiada.')).catch(() => alert(msg));
  }

  async function setReferral(clientId) {
    const score = prompt('Nota de 1 a 5: qual a chance deste cliente indicar a Ware?');
    if (!score) return;
    const note = prompt('Observação rápida sobre indicação:', '') || '';
    const { error } = await sb.from('client_milestones').insert({ client_id: clientId, type: 'referral_temperature', title: 'Termômetro de indicação', score: Number(score), note });
    if (error) { alert('Nao foi possivel salvar. Rode o SQL do bloco 2 no Supabase.'); return; }
    await App.loadAll(); renderClientPanel(clientId);
  }

  async function setFirstResult(clientId) {
    const title = prompt('Qual foi o primeiro resultado significativo? Ex: primeiro lead qualificado, primeira reunião, primeira conversão.');
    if (!title) return;
    const note = prompt('Detalhe opcional:', '') || '';
    const { error } = await sb.from('client_milestones').insert({ client_id: clientId, type: 'first_result', title, note });
    if (error) { alert('Nao foi possivel salvar. Rode o SQL do bloco 2 no Supabase.'); return; }
    await sb.from('client_timeline').insert({ client_id: clientId, type: 'entrega', title: `Primeiro resultado: ${title}`, description: note || null });
    await App.loadAll(); renderClientPanel(clientId);
  }

  async function saveCheckin(clientId) {
    const c = Store.clients.find(x => x.id === clientId);
    const question = prompt('Pergunta mensal de check-in:', suggestedCheckin(c, monthsAsClient(c)));
    if (!question) return;
    const answer = prompt('Resposta/observação do cliente:', '') || '';
    const { error } = await sb.from('client_checkins').insert({ client_id: clientId, question, answer });
    if (error) { alert('Nao foi possivel salvar. Rode o SQL do bloco 2 no Supabase.'); return; }
    await App.loadAll(); renderClientPanel(clientId);
  }

  async function addObjection(leadId) {
    const objection = prompt('Qual objeção o lead trouxe?');
    if (!objection) return;
    const response = prompt('Como respondemos / próximo argumento?', '') || '';
    const { error } = await sb.from('sales_objections').insert({ lead_id: leadId, objection, response, status: 'aberta' });
    if (error) { alert('Nao foi possivel salvar. Rode o SQL do bloco 2 no Supabase.'); return; }
    await App.loadAll(); renderLeadPanel(leadId);
  }

  async function deleteObjection(id, leadId) {
    if (!confirm('Excluir esta objeção?')) return;
    await sb.from('sales_objections').delete().eq('id', id);
    await App.loadAll(); renderLeadPanel(leadId);
  }

  return { renderFinancialPipeline, renderClientPanel, renderLeadPanel, copyNpsMessage, setReferral, setFirstResult, saveCheckin, addObjection, deleteObjection };
})();
