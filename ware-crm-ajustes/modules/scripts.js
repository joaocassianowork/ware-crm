const Scripts = (() => {
  const DEFAULTS = [
    { title: 'Abordagem — Lead Google', category: 'prospecção', content: 'Olá, Dr(a). [Nome]! Vi que você pesquisou sobre marketing jurídico e nos encontrou pelo Google. A Ware é especializada exclusivamente em advogados. Posso entender um pouco sobre o seu escritório para ver se conseguimos ajudar?' },
    { title: 'Abordagem — Lead Instagram', category: 'prospecção', content: 'Olá, Dr(a). [Nome]! Você nos encontrou pelo Instagram — ótimo! A Ware trabalha exclusivamente com advogados e fico feliz em entender como está sua presença digital hoje. Teria 15 minutinhos para conversar?' },
    { title: 'Abordagem — Indicação', category: 'prospecção', content: 'Olá, Dr(a). [Nome]! Recebi seu contato por indicação — isso significa muito para nós, pois quem te indicou confia no nosso trabalho. Me conta um pouco sobre o seu escritório?' },
    { title: 'Follow-up após 48h sem resposta', category: 'follow-up', content: 'Olá, Dr(a). [Nome]! Tudo bem? Apenas queria retomar nosso contato. Sei que a agenda de um advogado é corrida — se quiser, posso apresentar rapidamente o que fazemos por outros escritórios similares ao seu. Sem compromisso.' },
    { title: 'Follow-up pós-reunião', category: 'follow-up', content: 'Dr(a). [Nome], foi um prazer conversar hoje! Conforme combinamos, segue a proposta em anexo. Qualquer dúvida, estou à disposição. Prazo para retorno: [data].' },
    { title: 'Boas-vindas após fechamento', category: 'onboarding', content: 'Dr(a). [Nome], seja muito bem-vindo(a) à Ware! Estamos muito felizes em ter você como cliente. Em breve você receberá o formulário de onboarding — ele nos ajuda a entender seu escritório em profundidade para construirmos a melhor estratégia. Qualquer dúvida, estou aqui.' },
    { title: 'Solicitação de aprovação de conteúdo', category: 'operação', content: 'Dr(a). [Nome], os conteúdos de [mês] estão prontos para sua aprovação! Acesse o link abaixo e nos diga se aprova ou se quer algum ajuste. Prazo para retorno: [data]. [link]' },
    { title: 'Envio de relatório mensal', category: 'operação', content: 'Dr(a). [Nome], segue o relatório de [mês] com o resumo completo das ações realizadas e resultados. Agende nossa reunião mensal pelo link: [link]. Qualquer dúvida estou à disposição.' },
  ];

  function render() {
    const el = document.getElementById('scriptsList');
    if (!el) return;
    const allScripts = Store.scripts?.length ? Store.scripts : DEFAULTS;
    const cats = [...new Set(allScripts.map(s => s.category))];
    el.innerHTML = cats.map(cat => {
      const catS = allScripts.filter(s => s.category === cat);
      return `<div class="card" style="margin-bottom:14px;">
        <div class="card-head"><div class="card-title" style="text-transform:capitalize;">${cat}</div></div>
        <div>${catS.map((s, i) => `<div class="script-list-item">
          <div class="script-list-name">${s.title}</div>
          <div class="script-list-preview">${s.content.slice(0, 80)}...</div>
          <button class="btn btn-g btn-sm" onclick="Scripts.viewScript(${JSON.stringify(s).replace(/"/g, '&quot;')})">Ver & Copiar</button>
        </div>`).join('')}</div>
      </div>`;
    }).join('');
  }

  function viewScript(s) {
    UI.set('dpScriptTitle', s.title);
    UI.set('dpScriptCat', s.category);
    UI.set('dpScriptContent', s.content);
    UI.openDP('dpScript');
  }

  function copyScript() {
    const content = document.getElementById('dpScriptContent')?.textContent;
    if (!content) return;
    navigator.clipboard?.writeText(content).then(() => alert('Script copiado!')).catch(() => alert(content));
  }

  async function save() {
    const payload = {
      title: document.getElementById('sTitle').value,
      category: document.getElementById('sCat').value,
      content: document.getElementById('sContent').value,
    };
    if (!payload.title || !payload.content) { alert('Preencha título e conteúdo.'); return; }
    await sb.from('knowledge_docs').insert({ title: payload.title, category: 'scripts:' + payload.category, content: payload.content, updated_at: new Date().toISOString() });
    UI.closeModal('moScript'); App.loadAll();
  }

  function openModal() {
    document.getElementById('sTitle').value = '';
    document.getElementById('sCat').value = 'prospecção';
    document.getElementById('sContent').value = '';
    UI.openModal('moScript');
  }

  return { render, viewScript, copyScript, save, openModal };
})();
