const Alerts = (() => {
  function getAlerts(){
    const list=[];const now=new Date();
    Store.clients.filter(c=>c.status==='ativo').forEach(c=>{
      if(c.contract_end){
        const days=Math.ceil((new Date(c.contract_end)-now)/86400000);
        if(days<=60&&days>0) list.push({color:days<=30?'var(--red)':'var(--amber)',text:`<strong>${c.name}</strong> — contrato vence em ${days} dias`,tag:'Renovação'});
      }
      if((c.health_score||100)<60) list.push({color:'var(--red)',text:`<strong>${c.name}</strong> — saúde baixa (${c.health_score||0}%)`,tag:'Atenção'});
    });
    const h48=new Date(now-48*3600000);
    Store.leads.filter(l=>l.stage==='novo'&&(!l.last_contact_at||new Date(l.last_contact_at)<h48)).forEach(l=>{
      list.push({color:'var(--red)',text:`Lead <strong>${l.name}</strong> sem contato há +48h`,tag:'Lead parado'});
    });
    Store.payments.filter(p=>p.status==='pendente'&&p.due_date&&new Date(p.due_date)<now).forEach(p=>{
      const c=Store.clients.find(x=>x.id===p.client_id);
      list.push({color:'var(--red)',text:`Pagamento de <strong>${c?.name||'cliente'}</strong> em atraso — R$ ${(p.amount||0).toLocaleString('pt-BR')}`,tag:'Financeiro'});
    });
    Store.approvals.filter(a=>a.status==='pendente').forEach(a=>{
      const c=Store.clients.find(x=>x.id===a.client_id);
      const days=Math.ceil((now-new Date(a.created_at||now))/86400000);
      if(days>=3) list.push({color:'var(--amber)',text:`Aprovação de <strong>${c?.name||'cliente'}</strong> pendente há ${days} dias`,tag:'Conteúdo'});
    });
    return list;
  }
  function render(){
    const alerts=getAlerts();
    const badge=document.getElementById('alertBadge');
    if(badge){badge.style.display=alerts.length?'':'none';badge.textContent=alerts.length;}
    UI.set('alertList',alerts.length?alerts.map(a=>`<div class="alert-item"><div class="alert-dot" style="background:${a.color};"></div><div><div class="alert-text">${a.text}</div><div class="alert-tag">${a.tag}</div></div></div>`).join(''):`<div style="padding:32px;text-align:center;color:var(--w4);font-size:13px;">Nenhum alerta no momento ✓</div>`);
  }
  return{getAlerts,render};
})();
