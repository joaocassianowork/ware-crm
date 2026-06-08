const Dash = (() => {
  function render() {
    const active = Store.clients.filter(c => c.status === 'ativo');
    const mrr = active.reduce((s, c) => s + (c.monthly_value || 0), 0);
    const activeLeads = Store.leads.filter(l => !['fechado','perdido'].includes(l.stage));
    const avgHealth = active.length ? Math.round(active.reduce((s,c)=>s+(c.health_score||100),0)/active.length) : 0;
    const pendente = Store.payments.filter(p=>p.status==='pendente').reduce((s,p)=>s+(p.amount||0),0);
    const goal = Store.goals[0];
    UI.set('kpiMrr','R$ '+mrr.toLocaleString('pt-BR'));
    UI.set('kpiClients',active.length);
    UI.set('kpiLeads',activeLeads.length);
    UI.set('kpiHealth',avgHealth+'%');
    UI.set('kpiReceivable','R$ '+pendente.toLocaleString('pt-BR'));
    UI.set('dashDate',new Date().toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'}));
    renderFunil(); renderGoals(goal,mrr); renderAlertsSummary();
  }
  function renderFunil(){
    const stages=['novo','contatado','reunião','proposta','fechado','perdido'];
    const labels=['Novos','Contato','Reunião','Proposta','Fechados','Perdidos'];
    const colors=['var(--blue)','var(--w7)','var(--amber)','var(--amber)','var(--green)','var(--red)'];
    UI.set('funilGrid',stages.map((s,i)=>{
      const n=Store.leads.filter(l=>l.stage===s).length;
      return `<div class="funil-col"><div class="funil-stage">${labels[i]}</div><div class="funil-num" style="color:${colors[i]};">${n}</div></div>`;
    }).join(''));
  }
  function renderGoals(goal,mrr){
    if(!goal){UI.set('goalList',`<div style="padding:20px;text-align:center;color:var(--w4);font-size:13px;">Nenhuma meta. <span style="color:var(--blue);cursor:pointer;" onclick="Modals.goal()">Criar →</span></div>`);return;}
    const now=new Date();const ms=new Date(now.getFullYear(),now.getMonth(),1);
    const newC=Store.clients.filter(c=>c.created_at&&new Date(c.created_at)>=ms).length;
    const items=[
      {n:'MRR',cur:mrr,tgt:goal.mrr_target,fmt:v=>'R$ '+v.toLocaleString('pt-BR'),c:'var(--blue)'},
      {n:'Novos Clientes',cur:newC,tgt:goal.new_clients_target,fmt:v=>v,c:'var(--green)'},
      {n:'Renovação',cur:90,tgt:goal.renewal_rate_target||90,fmt:v=>v+'%',c:'var(--amber)'},
    ];
    UI.set('goalList',`<div style="padding:14px 18px;">${items.map(item=>{
      const pct=item.tgt?Math.min(100,Math.round(item.cur/item.tgt*100)):0;
      return `<div class="goal-item"><div class="goal-top"><span class="goal-name">${item.n}</span><span class="goal-vals"><strong>${item.fmt(item.cur)}</strong> / ${item.fmt(item.tgt)}</span></div><div class="prog-bg"><div class="prog-fill" style="width:${pct}%;background:${item.c};"></div></div></div>`;
    }).join('')}</div>`);
  }
  function renderAlertsSummary(){
    const alerts=Alerts.getAlerts().slice(0,5);
    UI.set('dashAlerts',alerts.length?alerts.map(a=>`<div class="alert-item"><div class="alert-dot" style="background:${a.color};"></div><div><div class="alert-text">${a.text}</div><div class="alert-tag">${a.tag}</div></div></div>`).join(''):`<div style="padding:24px;text-align:center;color:var(--w4);font-size:13px;">Tudo em dia ✓</div>`);
  }
  return{render};
})();
