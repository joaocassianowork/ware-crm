const Knowledge = (() => {
  function render(){
    if(!Store.docs.length){
      UI.set('docsList',`<div class="card"><div style="padding:32px;text-align:center;color:var(--w4);font-size:13px;">Nenhum documento. Adicione o Manifesto e o Manual Operacional.</div></div>`);return;
    }
    const cats=[...new Set(Store.docs.map(d=>d.category))];
    UI.set('docsList',cats.map(cat=>{
      const catDocs=Store.docs.filter(d=>d.category===cat);
      return `<div class="card" style="margin-bottom:14px;">
        <div class="card-head"><div class="card-title" style="text-transform:capitalize;">${cat}</div></div>
        <div>${catDocs.map(d=>`<div class="doc-item">
          <div class="doc-icon">📄</div>
          <div class="doc-info"><div class="doc-name">${d.title}</div><div class="doc-meta">Atualizado ${Utils.timeAgo(d.updated_at)}</div></div>
          ${d.required?`<span class="badge b-blue">Obrigatório</span>`:''}
          <button class="btn btn-g btn-sm" onclick="Knowledge.view('${d.id}')">Ler</button>
        </div>`).join('')}</div>
      </div>`;
    }).join(''));
  }
  function view(id){
    const d=Store.docs.find(x=>x.id===id);if(!d)return;
    const win=window.open('','_blank');
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${d.title}</title><style>body{font-family:system-ui,sans-serif;max-width:740px;margin:60px auto;padding:0 24px;line-height:1.75;color:#111;background:#fafafa;}h1{font-size:28px;margin-bottom:8px;}hr{margin:24px 0;border:none;border-top:1px solid #e5e5e5;}pre{white-space:pre-wrap;font-family:inherit;font-size:15px;}</style></head><body><h1>${d.title}</h1><hr><pre>${d.content}</pre></body></html>`);
  }
  async function save(){
    await sb.from('knowledge_docs').insert({title:document.getElementById('docTitle').value,category:document.getElementById('docCat').value,required:document.getElementById('docReq').value==='true',content:document.getElementById('docContent').value,updated_at:new Date().toISOString()});
    UI.closeModal('moDoc');App.loadAll();
  }
  function openModal(){
    document.getElementById('docTitle').value='';document.getElementById('docCat').value='manifesto';document.getElementById('docReq').value='false';document.getElementById('docContent').value='';
    UI.openModal('moDoc');
  }
  return{render,view,save,openModal};
})();
