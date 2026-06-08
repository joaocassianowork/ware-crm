const Approvals = (() => {
  function render(){
    const el=document.getElementById('approvalsList');
    if(!Store.approvals.length){el.innerHTML='<div style="padding:32px;text-align:center;color:var(--w4);font-size:13px;">Nenhuma aprovação enviada ainda.</div>';return;}
    el.innerHTML=Store.approvals.map(ap=>{
      const c=Store.clients.find(x=>x.id===ap.client_id);
      const mo=ap.month?new Date(ap.month+'T12:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'}):'—';
      const sb=ap.status==='aprovado'?'b-green':ap.status==='revisão'?'b-red':'b-amber';
      const files=ap.files||[];
      return `<div class="ap-item">
        <div class="ap-icon">📁</div>
        <div class="ap-info"><div class="ap-name">${c?.name||'—'} — ${mo}</div><div class="ap-meta">${files.length} arquivo(s) · ${ap.client_notes||ap.status}</div></div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="badge ${sb}">${ap.status}</span>
          ${files.slice(0,2).map(f=>`<a href="${f}" target="_blank" class="btn btn-g btn-sm">Ver</a>`).join('')}
          ${ap.status==='pendente'?`<button class="btn btn-green btn-sm" onclick="Approvals.update('${ap.id}','aprovado')">✓</button><button class="btn btn-red btn-sm" onclick="Approvals.update('${ap.id}','revisão')">✗</button>`:''}
        </div>
      </div>`;
    }).join('');
  }
  async function update(id,status){
    await sb.from('approvals').update({status,responded_at:new Date().toISOString()}).eq('id',id);
    App.loadAll();
  }
  async function save(){
    const cId=document.getElementById('apClient').value;
    const month=document.getElementById('apMonth').value;
    const files=document.getElementById('apFiles').value.split('\n').map(s=>s.trim()).filter(Boolean);
    if(!cId||!files.length){alert('Selecione o cliente e adicione pelo menos um arquivo.');return;}
    await sb.from('approvals').insert({client_id:cId,month:month+'-01',files,status:'pendente'});
    await sb.from('client_timeline').insert({client_id:cId,type:'conteúdo',title:`Conteúdo enviado para aprovação — ${month}`});
    UI.closeModal('moApproval');App.loadAll();
  }
  function openModal(){
    const ac=Store.clients.filter(c=>c.status==='ativo');
    document.getElementById('apClient').innerHTML=ac.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
    document.getElementById('apMonth').value=new Date().toISOString().slice(0,7);
    document.getElementById('apFiles').value='';
    UI.openModal('moApproval');
  }
  return{render,update,save,openModal};
})();
