const Projects = (() => {
  let curId = null;
  const STAGES = [
    { id: 'backlog', label: 'A fazer' },
    { id: 'em_andamento', label: 'Em andamento' },
    { id: 'aguardando', label: 'Aguardando' },
    { id: 'concluido', label: 'Concluído' }
  ];
  const TASKS = {
    site: ['Verificar se cliente já tem domínio', 'Comprar domínio (se necessário)', 'Enviar contrato de criação de site', 'Confirmar pagamento', 'Solicitar identidade visual (logo, cores, fontes)', 'Coletar fotos profissionais', 'Fazer briefing de SEO e conteúdo', 'Definir estrutura de páginas (especialidades + cidades)', 'Apresentar wireframe ao cliente', 'Escrever textos otimizados para SEO', 'Criar e revisar o design', 'Desenvolver o site', 'Configurar Google Analytics 4', 'Configurar Search Console + sitemap', 'Instalar pixel do Meta', 'Testar formulários e WhatsApp', 'Revisão final com o cliente', 'Publicar o site', 'Verificar indexação no Google'],
    tráfego: ['Acessar ou criar conta Google Ads', 'Acessar ou criar Meta Business Suite', 'Instalar e testar pixel no site', 'Configurar conversões no Google Ads', 'Pesquisa de palavras-chave', 'Definir público-alvo e segmentação', 'Criar criativos (artes + copy) - 3 variações', 'Apresentar campanhas para aprovação', 'Ativar campanhas', 'Configurar painel de leads', 'Testar recebimento de leads no WhatsApp', 'Primeira revisão após 7 dias'],
    social: ['Acessar ou criar perfil no Instagram', 'Otimizar bio, foto e link', 'Definir pilares de conteúdo', 'Criar identidade visual dos posts', 'Montar calendário editorial do 1º mês', 'Apresentar calendário para aprovação', 'Produzir posts da primeira quinzena', 'Enviar para aprovação', 'Agendar e publicar primeiros posts', 'Configurar agendamento recorrente'],
    gmb: ['Verificar se escritório já tem perfil no GMB', 'Solicitar acesso ou criar perfil', 'Verificar o perfil junto ao Google', 'Preencher todas as informações', 'Adicionar categorias corretas', 'Escrever descrição otimizada', 'Cadastrar todos os serviços jurídicos', 'Adicionar fotos profissionais (mínimo 10)', 'Configurar horário de funcionamento', 'Criar primeira publicação', 'Pedir avaliações para primeiros clientes']
  };

  function stageOf(t) { return t.stage || (t.done ? 'concluido' : 'backlog'); }

  function render() {
    const el = document.getElementById('projectsList');
    if (!Store.projects.length) { el.innerHTML = '<div class="card"><div style="padding:32px;text-align:center;color:var(--w4);font-size:13px;">Nenhum projeto. Clique em "+ Novo Projeto".</div></div>'; return; }
    el.innerHTML = Store.projects.map(proj => {
      const client = Store.clients.find(c => c.id === proj.client_id);
      const ptasks = Store.tasks.filter(t => t.project_id === proj.id);
      const done = ptasks.filter(t => stageOf(t) === 'concluido' || t.done).length; const total = ptasks.length;
      const pct = total ? Math.round(done / total * 100) : 0;
      const pc = pct >= 80 ? 'var(--green)' : pct >= 40 ? 'var(--amber)' : 'var(--blue)';
      const sb = proj.status === 'ativo' ? 'b-green' : proj.status === 'onboarding' ? 'b-amber' : 'b-gray';
      return `<div class="card" style="cursor:pointer;" onclick="Projects.openDetail('${proj.id}')">
        <div class="card-head"><div><div class="card-title">${client?.name || '—'}</div><div style="font-size:12px;color:var(--w4);margin-top:2px;">${(proj.services || []).join(' · ') || '—'}</div></div><span class="badge ${sb}">${proj.status}</span></div>
        <div style="padding:14px 18px;"><div class="prog-wrap"><div class="prog-bg"><div class="prog-fill" style="width:${pct}%;background:${pc};"></div></div><div class="prog-txt">${done}/${total} · ${pct}%</div></div></div>
      </div>`;
    }).join('');
  }

  async function openDetail(id) {
    curId = id; const proj = Store.projects.find(p => p.id === id);
    const client = Store.clients.find(c => c.id === proj?.client_id);
    UI.set('dpProjTitle', client?.name || '—');
    UI.set('dpProjSub', (proj?.services || []).join(' · ') || '—');
    const ptasks = Store.tasks.filter(t => t.project_id === id);
    const done = ptasks.filter(t => stageOf(t) === 'concluido' || t.done).length; const total = ptasks.length;
    const pct = total ? Math.round(done / total * 100) : 0;
    const progEl = document.getElementById('dpProjProg');
    if (progEl) { progEl.style.width = pct + '%'; }
    UI.set('dpProjProgTxt', pct + '%');
    renderTaskKanban(ptasks);
    UI.openDP('dpProject');
  }

  function renderTaskKanban(ptasks) {
    UI.set('dpProjChecklist', `<div class="task-kanban">${STAGES.map(stage => {
      const items = ptasks.filter(t => stageOf(t) === stage.id);
      return `<div class="kanban-col compact" ondragover="event.preventDefault()" ondrop="Projects.dropTask(event,'${stage.id}')">
        <div class="kanban-head"><span>${stage.label}</span><strong>${items.length}</strong></div>
        <div class="kanban-list">
          ${items.length ? items.map(t => `<div class="kanban-card task-card" draggable="true" ondragstart="Projects.dragTask(event,'${t.id}')">
            <div class="kanban-title">${t.task}</div>
            <div class="kanban-meta">${t.service || 'Livre'}</div>
            <div class="kanban-foot">
              ${stage.id !== 'concluido' ? `<button class="fu-btn" onclick="Projects.moveTask('${t.id}','concluido')">Concluir</button>` : `<button class="fu-btn" onclick="Projects.moveTask('${t.id}','backlog')">Reabrir</button>`}
              <button class="btn btn-red btn-sm" onclick="Projects.deleteTask('${t.id}')">Excluir</button>
            </div>
          </div>`).join('') : `<div class="kanban-empty">Sem tarefas</div>`}
        </div>
      </div>`;
    }).join('')}</div>`);
  }

  function dragTask(ev, id) { ev.dataTransfer.setData('text/plain', id); }
  async function dropTask(ev, stage) { const id = ev.dataTransfer.getData('text/plain'); if (id) await moveTask(id, stage); }

  async function moveTask(id, stage) {
    const done = stage === 'concluido';
    const payload = { stage, done, done_at: done ? new Date().toISOString() : null };
    const { error } = await sb.from('project_tasks').update(payload).eq('id', id);
    if (error) await sb.from('project_tasks').update({ done, done_at: payload.done_at }).eq('id', id);
    await App.loadAll(); openDetail(curId);
  }

  async function toggleTask(id, done) { await moveTask(id, done ? 'concluido' : 'backlog'); }

  async function addFreeTask() {
    const input = document.getElementById('freeTaskTitle');
    const title = input.value.trim();
    const stage = document.getElementById('freeTaskStage').value || 'backlog';
    if (!title || !curId) return;
    const rows = Store.tasks.filter(t => t.project_id === curId);
    const payload = { project_id: curId, service: 'Livre', task: title, order: rows.length + 1, done: stage === 'concluido', stage };
    const { error } = await sb.from('project_tasks').insert(payload);
    if (error) {
      const fallback = { project_id: curId, service: 'Livre', task: title, order: rows.length + 1, done: false };
      const retry = await sb.from('project_tasks').insert(fallback);
      if (retry.error) { alert('Nao foi possivel criar a tarefa. Verifique permissoes/RLS no Supabase.'); return; }
    }
    input.value = '';
    await App.loadAll(); openDetail(curId);
  }

  async function deleteTask(id) {
    const t = Store.tasks.find(x => x.id === id);
    if (!confirm(`Excluir a tarefa "${t?.task || 'selecionada'}"?`)) return;
    const { error } = await sb.from('project_tasks').delete().eq('id', id);
    if (error) { alert('Nao foi possivel excluir a tarefa.'); return; }
    await App.loadAll(); openDetail(curId);
  }

  function updateChecklist() {
    const sel = [...document.querySelectorAll('#projSvcs input:checked')].map(c => c.value);
    const total = sel.reduce((s, svc) => s + (TASKS[svc]?.length || 0), 0);
    UI.set('chkPreview', sel.length ? `<div style="font-size:12px;color:var(--w4);padding:8px 0;">${sel.map(s => `<strong style="color:var(--blue);">${s}</strong> (${TASKS[s]?.length || 0})`).join(', ')} - ${total} tarefas</div>` : '');
  }

  async function save() {
    const cId = document.getElementById('projClient').value;
    const svcs = [...document.querySelectorAll('#projSvcs input:checked')].map(c => c.value);
    const start = document.getElementById('projStart').value;
    if (!cId || !svcs.length) { alert('Selecione o cliente e pelo menos um serviço.'); return; }
    const { data: proj } = await sb.from('projects').insert({ client_id: cId, services: svcs, status: 'onboarding', started_at: start || null }).select().single();
    if (proj) {
      const rows = svcs.flatMap(svc => (TASKS[svc] || []).map((task, i) => ({ project_id: proj.id, service: svc, task, order: i, done: false })));
      if (rows.length) await sb.from('project_tasks').insert(rows);
      await sb.from('client_timeline').insert({ client_id: cId, type: 'projeto', title: `Projeto iniciado: ${svcs.join(', ')}` });
    }
    UI.closeModal('moProject'); App.loadAll();
  }

  function openModal() {
    document.querySelectorAll('#projSvcs input').forEach(c => c.checked = false);
    document.getElementById('projStart').value = new Date().toISOString().slice(0, 10);
    UI.set('chkPreview', '');
    const ac = Store.clients.filter(c => c.status === 'ativo');
    document.getElementById('projClient').innerHTML = ac.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    UI.openModal('moProject');
  }

  async function deleteCurrent() {
    const proj = Store.projects.find(p => p.id === curId); if (!proj) return;
    const client = Store.clients.find(c => c.id === proj.client_id);
    if (!confirm(`Excluir o projeto de "${client?.name || 'cliente'}"?\n\nTodas as tarefas deste projeto tambem serao removidas. Esta acao nao pode ser desfeita.`)) return;
    await sb.from('project_tasks').delete().eq('project_id', curId);
    const { error } = await sb.from('projects').delete().eq('id', curId);
    if (error) { alert('Nao foi possivel excluir. Verifique permissoes/RLS no Supabase.'); return; }
    UI.closeDP('dpProject'); curId = null; App.loadAll();
  }

  return { render, openDetail, toggleTask, updateChecklist, save, openModal, addFreeTask, dragTask, dropTask, moveTask, deleteTask, deleteCurrent };
})();
