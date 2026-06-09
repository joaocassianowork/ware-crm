const Clients = (() => {
  let curId=null;
  function render(){
    const q=(document.getElementById('clientSearch')?.value||'').toLowerCase();
    const list=Store.clients.filter(c=>!q||c.name?.toLowerCase().includes(q)||c.lawyer_name?.toLowerCase().includes(q));
    if(!list.length){UI.set('clientsTbody',`<tr><td colspan="6" class="td-empty">Nenhum cliente cadastrado</td></tr>`);return;}
    UI.set('clientsTbody',list.map(c=>{
      const h=c.health_score??100;const hc=h>=70?'var(--green)':h>=40?'var(--amber)':'var(--red)';
      const sb=c.status==='ativo'?'b-green':c.status==='pausado'?'b-amber':'b-red';
      const end=c.contract_end?new Date(c.contract_end+'T12:00').toLocaleDateString('pt-BR'):'—';
      return `<tr onclick="Clients.openDetail('${c.id}')">
        <td><div class="td-name">${c.name}</div><div class="td-sub">${c.lawyer_name}</div></td>
        <td style="font-size:12px;color:var(--w4);">${(c.services||[]).join(', ')||'—'}</td>
        <td style="font-weight:500;">R$ ${(c.monthly_value||0).toLocaleString('pt-BR')}</td>
        <td><div style="display:flex;align-items:center;gap:7px;"><div class="hbar"><div class="hbar-fill" style="width:${h}%;background:${hc};"></div></div><span style="font-size:11px;color:${hc};">${h}%</span></div></td>
        <td style="font-size:12px;color:var(--w4);">${end}</td>
        <td><span class="badge ${sb}">${c.status}</span></td>
      </tr>`;
    }).join(''));
  }
  async function openDetail(id){
    curId=id;const c=Store.clients.find(x=>x.id===id);if(!c)return;
    UI.set('dpClientName',c.name);UI.set('dpClientSub',c.lawyer_name);
    UI.set('dpClientInfo',`
      <div class="dp-row"><span class="dp-key">E-mail</span><span class="dp-val">${c.email||'—'}</span></div>
      <div class="dp-row"><span class="dp-key">WhatsApp</span><span class="dp-val">${c.whatsapp||'—'}</span></div>
      <div class="dp-row"><span class="dp-key">Cidade</span><span class="dp-val">${c.city||'—'}</span></div>
      <div class="dp-row"><span class="dp-key">Serviços</span><span class="dp-val">${(c.services||[]).join(', ')||'—'}</span></div>
      <div class="dp-row"><span class="dp-key">Especialidades</span><span class="dp-val">${(c.specialties||[]).join(', ')||'—'}</span></div>
      <div class="dp-row"><span class="dp-key">Valor/mês</span><span class="dp-val">R$ ${(c.monthly_value||0).toLocaleString('pt-BR')}</span></div>
      <div class="dp-row"><span class="dp-key">Contrato</span><span class="dp-val">${c.contract_start?new Date(c.contract_start+'T12:00').toLocaleDateString('pt-BR'):'—'} → ${c.contract_end?new Date(c.contract_end+'T12:00').toLocaleDateString('pt-BR'):'—'}</span></div>
      <div class="dp-row"><span class="dp-key">Saúde</span><span class="dp-val" style="color:${(c.health_score||100)>=70?'var(--green)':'var(--amber)'};">${c.health_score||100}%</span></div>
      ${c.notes?`<div class="dp-row"><span class="dp-key">Notas</span><span class="dp-val" style="font-size:12px;">${c.notes}</span></div>`:''}
    `);
    if(typeof Growth !== 'undefined')Growth.renderClientPanel(id);
    UI.openDP('dpClient');
    const{data:tl}=await sb.from('client_timeline').select('*').eq('client_id',id).order('created_at',{ascending:false}).limit(20);
    const typeC={reunião:'var(--blue)',entrega:'var(--green)',contrato:'var(--amber)',nota:'var(--w4)',projeto:'var(--green)',onboarding:'var(--amber)'};
    UI.set('dpClientTimeline',(tl||[]).length?(tl||[]).map(t=>`<div class="tl-item"><div class="tl-dot" style="background:${typeC[t.type]||'var(--blue)'};"></div><div><div class="tl-title">${t.title}</div><div class="tl-meta">${Utils.timeAgo(t.created_at)}${t.description?' · '+t.description:''}</div></div></div>`).join(''):`<div style="font-size:13px;color:var(--w4);">Sem eventos ainda.</div>`);
  }
  async function save(){
    const id=document.getElementById('cId').value;
    const svcs=[...document.querySelectorAll('#cServices input:checked')].map(x=>x.value);
    const specs=document.getElementById('cSpecialties').value.split(',').map(s=>s.trim()).filter(Boolean);
    const payload={name:document.getElementById('cName').value,lawyer_name:document.getElementById('cLawyer').value,email:document.getElementById('cEmail').value||null,whatsapp:document.getElementById('cWpp').value||null,city:document.getElementById('cCity').value||null,monthly_value:parseFloat(document.getElementById('cValue').value)||0,contract_start:document.getElementById('cStart').value||null,contract_end:document.getElementById('cEnd').value||null,status:document.getElementById('cStatus').value,notes:document.getElementById('cNotes').value||null,services:svcs,specialties:specs};
    if(id){await sb.from('clients').update(payload).eq('id',id);}
    else{const{data}=await sb.from('clients').insert(payload).select().single();if(data)await sb.from('client_timeline').insert({client_id:data.id,type:'contrato',title:'Cliente cadastrado na Ware'});}
    UI.closeModal('moClient');App.loadAll();
  }
  function openModal(c){
    document.getElementById('moClientTitle').textContent=c?'Editar Cliente':'Novo Cliente';
    document.getElementById('cId').value=c?.id||'';
    document.getElementById('cName').value=c?.name||'';
    document.getElementById('cLawyer').value=c?.lawyer_name||'';
    document.getElementById('cEmail').value=c?.email||'';
    document.getElementById('cWpp').value=c?.whatsapp||'';
    document.getElementById('cCity').value=c?.city||'';
    document.getElementById('cValue').value=c?.monthly_value||'';
    document.getElementById('cStart').value=c?.contract_start||'';
    document.getElementById('cEnd').value=c?.contract_end||'';
    document.getElementById('cStatus').value=c?.status||'ativo';
    document.getElementById('cNotes').value=c?.notes||'';
    document.getElementById('cSpecialties').value=(c?.specialties||[]).join(', ');
    document.querySelectorAll('#cServices input').forEach(cb=>{cb.checked=(c?.services||[]).includes(cb.value);});
    UI.openModal('moClient');
  }
  function editCurrent(){const c=Store.clients.find(x=>x.id===curId);if(!c)return;UI.closeDP('dpClient');openModal(c);}
  async function deleteCurrent(){
    const c=Store.clients.find(x=>x.id===curId);if(!c)return;
    const ok=confirm(`Excluir o cliente "${c.name}"?\n\nIsso tambem remove projetos, tarefas, cobrancas, reunioes, relatorios, aprovacoes, pesquisas e eventos ligados a ele. Esta acao nao pode ser desfeita.`);
    if(!ok)return;
    const projectIds=Store.projects.filter(p=>p.client_id===curId).map(p=>p.id);
    if(projectIds.length)await sb.from('project_tasks').delete().in('project_id',projectIds);
    await Promise.all([
      projectIds.length?sb.from('projects').delete().in('id',projectIds):Promise.resolve(),
      sb.from('payments').delete().eq('client_id',curId),
      sb.from('client_timeline').delete().eq('client_id',curId),
      sb.from('onboardings').delete().eq('client_id',curId),
      sb.from('approvals').delete().eq('client_id',curId),
      sb.from('reports').delete().eq('client_id',curId),
      sb.from('meetings').delete().eq('client_id',curId),
      sb.from('satisfaction_surveys').delete().eq('client_id',curId),
      sb.from('client_accesses').delete().eq('client_id',curId),
      sb.from('client_milestones').delete().eq('client_id',curId),
      sb.from('client_checkins').delete().eq('client_id',curId)
    ]);
    const{error}=await sb.from('clients').delete().eq('id',curId);
    if(error){alert('Nao foi possivel excluir. Verifique permissoes/RLS no Supabase.');return;}
    UI.closeDP('dpClient');curId=null;App.loadAll();
  }
  return{render,openDetail,save,openModal,editCurrent,deleteCurrent};
})();
