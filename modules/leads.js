const Leads = (() => {
  let curTab = 'todos', curId = null, view = 'kanban';
  const STAGES = [
    { id: 'novo', label: 'Novos', cls: 'b-blue' },
    { id: 'contatado', label: 'Contatados', cls: 'b-gray' },
    { id: 'reunião', label: 'Reunião', cls: 'b-amber' },
    { id: 'proposta', label: 'Proposta', cls: 'b-amber' },
    { id: 'fechado', label: 'Fechados', cls: 'b-green' },
    { id: 'perdido', label: 'Perdidos', cls: 'b-red' }
  ];
  const SCRIPTS = {
    google: 'Olá, Dr(a). {nome}! Você nos encontrou pelo Google - ótimo! A Ware trabalha exclusivamente com advogados. Posso entender um pouco sobre o seu escritório?',
    instagram: 'Olá, Dr(a). {nome}! Vi que você chegou pelo Instagram. A Ware é especializada em marketing jurídico. Teria 10 minutinhos para conversar?',
    indicação: 'Olá, Dr(a). {nome}! Recebi seu contato por indicação - isso significa muito para nós. Me conta sobre o seu escritório?',
    default: 'Olá, Dr(a). {nome}! Tudo bem? Somos a Ware Jurídico, especializados em marketing para advogados. Podemos conversar?'
  };

  function render() {
    renderKanban();
    const card = document.querySelector('#page-leads .card');
    if (card) card.style.display = view === 'table' ? 'block' : 'none';
    const btn = document.getElementById('leadViewBtn');
    if (btn) btn.textContent = view === 'table' ? 'Ver kanban' : 'Ver tabela';

    const list = curTab === 'todos' ? Store.leads : Store.leads.filter(l => l.stage === curTab);
    const now = new Date(); const h48 = new Date(now - 48 * 3600000);
    const stC = { novo: 'b-blue', contatado: 'b-gray', reunião: 'b-amber', proposta: 'b-amber', fechado: 'b-green', perdido: 'b-red' };
    UI.set('leadsTbody', list.length ? list.map(l => {
      const hot = l.stage === 'novo' && (!l.last_contact_at || new Date(l.last_contact_at) < h48);
      return `<tr onclick="Leads.openDetail('${l.id}')">
        <td><div class="td-name" style="${hot ? 'color:var(--red)' : ''}">${l.name}${hot ? ' !' : ''}</div><div class="td-sub">${l.city || '—'}</div></td>
        <td style="font-size:12px;color:var(--w4);">${l.specialty || '—'}</td>
        <td><span class="badge b-gray">${l.source || '—'}</span></td>
        <td><span class="badge ${stC[l.stage] || 'b-gray'}">${l.stage}</span></td>
        <td style="text-align:center;font-weight:500;">${l.followup_count || 0}</td>
        <td style="font-size:12px;color:var(--w4);">${Utils.timeAgo(l.last_contact_at)}</td>
        <td onclick="event.stopPropagation()"><button class="fu-btn" onclick="Leads.quickFU('${l.id}')">+ Follow-up</button></td>
      </tr>`;
    }).join('') : `<tr><td colspan="7" class="td-empty">Nenhum lead neste estágio</td></tr>`);
  }

  function renderKanban() {
    const el = document.getElementById('leadsKanban'); if (!el) return;
    el.style.display = view === 'kanban' ? 'grid' : 'none';
    const now = new Date(); const h48 = new Date(now - 48 * 3600000);
    el.innerHTML = STAGES.map(stage => {
      const leads = Store.leads.filter(l => l.stage === stage.id);
      return `<div class="kanban-col" ondragover="event.preventDefault()" ondrop="Leads.dropLead(event,'${stage.id}')">
        <div class="kanban-head"><span>${stage.label}</span><strong>${leads.length}</strong></div>
        <div class="kanban-list">
          ${leads.length ? leads.map(l => {
            const hot = l.stage === 'novo' && (!l.last_contact_at || new Date(l.last_contact_at) < h48);
            return `<div class="kanban-card" draggable="true" ondragstart="Leads.dragLead(event,'${l.id}')" onclick="Leads.openDetail('${l.id}')">
              <div class="kanban-title" style="${hot ? 'color:var(--red)' : ''}">${l.name}${hot ? ' !' : ''}</div>
              <div class="kanban-meta">${l.specialty || 'Sem especialidade'} · ${l.city || 'Sem cidade'}</div>
              <div class="kanban-foot"><span class="badge ${stage.cls}">${l.source || 'origem'}</span><button class="fu-btn" onclick="event.stopPropagation();Leads.quickFU('${l.id}')">+ Follow-up</button></div>
            </div>`;
          }).join('') : `<div class="kanban-empty">Sem leads</div>`}
        </div>
      </div>`;
    }).join('');
  }

  function toggleView() { view = view === 'kanban' ? 'table' : 'kanban'; render(); }
  function dragLead(ev, id) { ev.dataTransfer.setData('text/plain', id); }
  async function dropLead(ev, stage) { const id = ev.dataTransfer.getData('text/plain'); if (id) await updateStage(id, stage, false); }

  async function openDetail(id) {
    curId = id; const l = Store.leads.find(x => x.id === id); if (!l) return;
    UI.set('dpLeadName', l.name);
    UI.set('dpLeadSub', (l.specialty || '') + (l.city ? ' · ' + l.city : ''));
    const scr = (SCRIPTS[l.source] || SCRIPTS.default).replace('{nome}', l.name.split(' ')[0]);
    UI.set('dpLeadScript', scr);
    UI.set('dpLeadInfo', `
      <div class="dp-row"><span class="dp-key">WhatsApp</span><span class="dp-val">${l.whatsapp || '—'}</span></div>
      <div class="dp-row"><span class="dp-key">E-mail</span><span class="dp-val">${l.email || '—'}</span></div>
      <div class="dp-row"><span class="dp-key">Origem</span><span class="dp-val">${l.source || '—'}</span></div>
      <div class="dp-row"><span class="dp-key">Estágio</span><span class="dp-val">${l.stage}</span></div>
      <div class="dp-row"><span class="dp-key">Follow-ups</span><span class="dp-val">${l.followup_count || 0}</span></div>
      <div class="dp-row"><span class="dp-key">Último contato</span><span class="dp-val">${Utils.timeAgo(l.last_contact_at)}</span></div>
      ${l.notes ? `<div class="dp-row"><span class="dp-key">Notas</span><span class="dp-val" style="font-size:12px;">${l.notes}</span></div>` : ''}
    `);
    UI.set('dpLeadStages', STAGES.map(s => `<button class="stage-btn ${s.id === l.stage ? 'on' : ''}" onclick="Leads.updateStage('${id}','${s.id}')">${s.id}</button>`).join(''));
    const { data: fups } = await sb.from('lead_followups').select('*').eq('lead_id', id).order('created_at', { ascending: false });
    UI.set('dpLeadFups', (fups || []).length ? (fups || []).map(f => `<div class="tl-item"><div class="tl-dot" style="background:var(--green);"></div><div><div class="tl-title">${f.note || 'Follow-up registrado'}</div><div class="tl-meta">${Utils.timeAgo(f.created_at)}</div></div></div>`).join('') : `<div style="font-size:13px;color:var(--w4);">Nenhum follow-up ainda.</div>`);
    UI.openDP('dpLead');
  }

  async function registerFU() {
    const note = prompt('O que foi feito/dito neste follow-up?'); if (!note) return;
    const l = Store.leads.find(x => x.id === curId);
    await sb.from('lead_followups').insert({ lead_id: curId, note });
    await sb.from('leads').update({ followup_count: (l?.followup_count || 0) + 1, last_contact_at: new Date().toISOString() }).eq('id', curId);
    await App.loadAll(); openDetail(curId);
  }
  async function quickFU(id) { curId = id; await registerFU(); }
  async function updateStage(id, stage, reopen = true) {
    await sb.from('leads').update({ stage }).eq('id', id);
    await App.loadAll(); if (reopen) openDetail(id);
  }
  function switchTab(tab, el) {
    curTab = tab;
    document.querySelectorAll('#page-leads .tab').forEach(t => t.classList.remove('on'));
    el.classList.add('on'); render();
  }
  async function save() {
    const id = document.getElementById('lId').value;
    const payload = { name: document.getElementById('lName').value, email: document.getElementById('lEmail').value || null, whatsapp: document.getElementById('lWpp').value || null, city: document.getElementById('lCity').value || null, specialty: document.getElementById('lSpecialty').value || null, source: document.getElementById('lSource').value, stage: document.getElementById('lStage').value, notes: document.getElementById('lNotes').value || null };
    if (id) await sb.from('leads').update(payload).eq('id', id);
    else await sb.from('leads').insert({ ...payload, followup_count: 0 });
    UI.closeModal('moLead'); App.loadAll();
  }
  function openModal(l) {
    document.getElementById('lId').value = l?.id || '';
    document.getElementById('lName').value = l?.name || '';
    document.getElementById('lEmail').value = l?.email || '';
    document.getElementById('lWpp').value = l?.whatsapp || '';
    document.getElementById('lCity').value = l?.city || '';
    document.getElementById('lSpecialty').value = l?.specialty || '';
    document.getElementById('lSource').value = l?.source || 'google';
    document.getElementById('lStage').value = l?.stage || 'novo';
    document.getElementById('lNotes').value = l?.notes || '';
    UI.openModal('moLead');
  }
  async function deleteCurrent() {
    const l = Store.leads.find(x => x.id === curId); if (!l) return;
    if (!confirm(`Excluir o lead "${l.name}"?\n\nOs follow-ups deste lead tambem serao removidos. Esta acao nao pode ser desfeita.`)) return;
    await sb.from('lead_followups').delete().eq('lead_id', curId);
    const { error } = await sb.from('leads').delete().eq('id', curId);
    if (error) { alert('Nao foi possivel excluir. Verifique permissoes/RLS no Supabase.'); return; }
    UI.closeDP('dpLead'); curId = null; App.loadAll();
  }

  return { render, openDetail, registerFU, quickFU, updateStage, switchTab, save, openModal, toggleView, dragLead, dropLead, deleteCurrent };
})();
