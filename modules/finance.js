const Finance = (() => {
  function render(){
    const pend=Store.payments.filter(p=>p.status==='pendente').reduce((s,p)=>s+(p.amount||0),0);
    const pago=Store.payments.filter(p=>p.status==='pago').reduce((s,p)=>s+(p.amount||0),0);
    const atr=Store.payments.filter(p=>p.status==='atrasado').reduce((s,p)=>s+(p.amount||0),0);
    UI.set('finPend','R$ '+pend.toLocaleString('pt-BR'));
    UI.set('finPago','R$ '+pago.toLocaleString('pt-BR'));
    UI.set('finAtr','R$ '+atr.toLocaleString('pt-BR'));
    if(typeof Growth !== 'undefined')Growth.renderFinancialPipeline();
    if(!Store.payments.length){UI.set('payTbody',`<tr><td colspan="6" class="td-empty">Nenhuma cobrança lançada</td></tr>`);return;}
    UI.set('payTbody',Store.payments.map(p=>{
      const c=Store.clients.find(x=>x.id===p.client_id);
      const sb=p.status==='pago'?'b-green':p.status==='atrasado'?'b-red':'b-amber';
      const mo=p.month?new Date(p.month+'T12:00').toLocaleDateString('pt-BR',{month:'long',year:'numeric'}):'—';
      const due=p.due_date?new Date(p.due_date+'T12:00').toLocaleDateString('pt-BR'):'—';
      return `<tr>
        <td class="td-name">${c?.name||'—'}</td>
        <td style="font-size:12px;color:var(--w4);">${mo}</td>
        <td style="font-weight:500;">R$ ${(p.amount||0).toLocaleString('pt-BR')}</td>
        <td style="font-size:12px;color:var(--w4);">${due}</td>
        <td><span class="badge ${sb}">${p.status}</span></td>
        <td style="display:flex;gap:6px;align-items:center;">${p.status!=='pago'?`<button class="btn btn-g btn-sm" onclick="Finance.markPaid('${p.id}')">Marcar Pago</button>`:''}<button class="btn btn-red btn-sm" onclick="Finance.deletePayment('${p.id}')">Excluir</button></td>
      </tr>`;
    }).join(''));
  }
  async function markPaid(id){
    await sb.from('payments').update({status:'pago',paid_at:new Date().toISOString().slice(0,10)}).eq('id',id);
    App.loadAll();
  }
  async function save(){
    const cId=document.getElementById('pClient').value;
    const c=Store.clients.find(x=>x.id===cId);
    await sb.from('payments').insert({client_id:cId,month:document.getElementById('pMonth').value+'-01',amount:parseFloat(document.getElementById('pAmount').value)||c?.monthly_value||0,due_date:document.getElementById('pDue').value||null,status:document.getElementById('pStatus').value});
    UI.closeModal('moPayment');App.loadAll();
  }
  async function deletePayment(id){
    if(!confirm('Excluir esta cobranca?\n\nEsta acao nao pode ser desfeita.'))return;
    const{error}=await sb.from('payments').delete().eq('id',id);
    if(error){alert('Nao foi possivel excluir. Verifique permissoes/RLS no Supabase.');return;}
    App.loadAll();
  }
  function openModal(){
    const ac=Store.clients.filter(c=>c.status==='ativo');
    document.getElementById('pClient').innerHTML=ac.map(c=>`<option value="${c.id}">${c.name}</option>`).join('');
    document.getElementById('pMonth').value=new Date().toISOString().slice(0,7);
    document.getElementById('pDue').value='';document.getElementById('pAmount').value='';document.getElementById('pStatus').value='pendente';
    UI.openModal('moPayment');
  }
  return{render,markPaid,save,openModal,deletePayment};
})();
