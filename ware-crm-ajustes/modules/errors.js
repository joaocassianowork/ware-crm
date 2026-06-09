const Errors = (() => {
  function render(){
    if(!Store.errors.length){UI.set('errorTbody',`<tr><td colspan="4" class="td-empty">Nenhum registro ainda</td></tr>`);return;}
    UI.set('errorTbody',Store.errors.map(e=>`<tr>
      <td><span class="badge b-amber">${e.category||'—'}</span></td>
      <td style="font-size:13px;color:var(--w7);max-width:240px;">${e.what_happened}</td>
      <td style="font-size:13px;color:var(--w4);max-width:200px;">${e.what_changed||'—'}</td>
      <td style="font-size:12px;color:var(--w4);">${e.created_at?new Date(e.created_at).toLocaleDateString('pt-BR'):'—'}</td>
    </tr>`).join(''));
  }
  async function save(){
    await sb.from('error_logs').insert({category:document.getElementById('eCategory').value,what_happened:document.getElementById('eWhat').value,what_changed:document.getElementById('eChanged').value||null});
    UI.closeModal('moError');App.loadAll();
  }
  function openModal(){
    document.getElementById('eCategory').value='campanha';document.getElementById('eWhat').value='';document.getElementById('eChanged').value='';
    UI.openModal('moError');
  }
  return{render,save,openModal};
})();
