const Satisfaction = (() => {
  function render() {
    const el = document.getElementById('satList');
    if (!el) return;
    if (!Store.surveys.length) {
      el.innerHTML = '<div style="padding:32px;text-align:center;color:var(--w4);font-size:13px;">Nenhuma pesquisa respondida ainda. Envie o link para seus clientes.</div>';
      return;
    }
    const avg = Math.round(Store.surveys.reduce((s,x)=>s+(x.nps_score||0),0)/Store.surveys.length);
    const promoters = Store.surveys.filter(s=>s.nps_score>=9).length;
    const detractors = Store.surveys.filter(s=>s.nps_score<=6).length;
    const nps = Math.round(((promoters - detractors) / Store.surveys.length) * 100);

    el.innerHTML = `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px;background:var(--br);border-radius:12px 12px 0 0;overflow:hidden;margin-bottom:1px;">
        <div style="background:var(--s1);padding:20px;text-align:center;"><div style="font-family:'Sora',sans-serif;font-size:32px;font-weight:800;color:var(--blue);">${avg}/10</div><div style="font-size:11px;color:var(--w4);margin-top:4px;">Nota Média</div></div>
        <div style="background:var(--s1);padding:20px;text-align:center;"><div style="font-family:'Sora',sans-serif;font-size:32px;font-weight:800;color:${nps>=30?'var(--green)':nps>=0?'var(--amber)':'var(--red)'};">${nps}</div><div style="font-size:11px;color:var(--w4);margin-top:4px;">NPS Score</div></div>
        <div style="background:var(--s1);padding:20px;text-align:center;"><div style="font-family:'Sora',sans-serif;font-size:32px;font-weight:800;color:var(--w);">${Store.surveys.length}</div><div style="font-size:11px;color:var(--w4);margin-top:4px;">Respostas</div></div>
      </div>
      ${Store.surveys.map(s => {
        const c = Store.clients.find(x=>x.id===s.client_id);
        const sc = s.nps_score;
        const col = sc>=9?'var(--green)':sc>=7?'var(--blue)':sc>=5?'var(--amber)':'var(--red)';
        return `<div style="display:flex;align-items:flex-start;gap:14px;padding:14px 18px;border-bottom:1px solid var(--br);">
          <div style="font-family:'Sora',sans-serif;font-size:28px;font-weight:800;color:${col};min-width:40px;">${sc}</div>
          <div style="flex:1;">
            <div style="font-size:13px;font-weight:500;color:var(--w);">${c?.name||'—'}</div>
            ${s.best_part?`<div style="font-size:12px;color:var(--green);margin-top:4px;">✓ ${s.best_part}</div>`:''}
            ${s.improve?`<div style="font-size:12px;color:var(--amber);margin-top:2px;">↑ ${s.improve}</div>`:''}
          </div>
          <div style="font-size:11px;color:var(--w4);">${s.responded_at?new Date(s.responded_at).toLocaleDateString('pt-BR'):'—'}</div>
        </div>`;
      }).join('')}
    `;
  }

  function copyLink(clientId) {
    const url = window.location.origin + '/satisfacao.html?c=' + clientId;
    navigator.clipboard?.writeText(url).then(()=>alert('Link copiado!\n\n'+url)).catch(()=>alert('Link:\n\n'+url));
  }

  function openSendModal() {
    const ac = Store.clients.filter(c=>c.status==='ativo');
    document.getElementById('satClient').innerHTML = ac.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
    UI.openModal('moSatisfaction');
  }

  function sendLink() {
    const cId = document.getElementById('satClient').value;
    const c = Store.clients.find(x=>x.id===cId);
    const url = window.location.origin + '/satisfacao.html?c=' + cId;
    const msg = `Olá, Dr(a). ${c?.lawyer_name?.split(' ')[0]||''}! Sua opinião é muito importante para nós. Leva apenas 1 minutinho. ${url}`;
    navigator.clipboard?.writeText(msg).then(()=>alert('Mensagem copiada! Cole no WhatsApp do cliente.')).catch(()=>alert(msg));
    UI.closeModal('moSatisfaction');
  }

  return { render, copyLink, openSendModal, sendLink };
})();
