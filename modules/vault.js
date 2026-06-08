const Vault = (() => {
  let curClientId = null;
  function render() {
    const el = document.getElementById('vaultClientSel');
    if (!el) return;
  }
  async function loadByClient(clientId) {
    curClientId = clientId;
    const { data } = await sb.from('client_accesses').select('*').eq('client_id', clientId).order('platform');
    const el = document.getElementById('vaultItems');
    if (!el) return;
    if (!data?.length) { el.innerHTML = '<div style="padding:20px;text-align:center;color:var(--w4);font-size:13px;">Nenhum acesso cadastrado para este cliente.</div>'; return; }
    el.innerHTML = data.map(a => `<div class="vault-item">
      <div class="vault-platform">${a.platform}</div>
      <div class="vault-creds">
        <div class="vault-row"><span class="vault-key">Login</span><span class="vault-val">${a.login || '—'}</span></div>
        <div class="vault-row"><span class="vault-key">Senha</span>
          <span class="vault-val vault-pass" id="pass_${a.id}" data-visible="false" onclick="Vault.togglePass('${a.id}','${(a.password||'').replace(/'/g,"\\'")}')">••••••••</span>
        </div>
        ${a.notes ? `<div class="vault-row"><span class="vault-key">Obs.</span><span class="vault-val">${a.notes}</span></div>` : ''}
      </div>
      <button class="btn btn-g btn-sm" onclick="Vault.copy('${(a.password||'').replace(/'/g,"\\'")}')">Copiar senha</button>
    </div>`).join('');
  }
  function togglePass(id, pass) {
    const el = document.getElementById('pass_' + id);
    if (!el) return;
    const visible = el.dataset.visible === 'true';
    el.textContent = visible ? '••••••••' : pass;
    el.dataset.visible = String(!visible);
  }
  function copy(pass) {
    navigator.clipboard?.writeText(pass).then(() => alert('Senha copiada!')).catch(() => alert(pass));
  }
  async function save() {
    const cId = document.getElementById('vaultClient').value;
    await sb.from('client_accesses').insert({
      client_id: cId,
      platform: document.getElementById('vaultPlatform').value,
      login: document.getElementById('vaultLogin').value || null,
      password: document.getElementById('vaultPassword').value || null,
      notes: document.getElementById('vaultNotes').value || null,
    });
    UI.closeModal('moVault');
    if (curClientId === cId) loadByClient(cId);
  }
  function openModal(clientId) {
    const ac = Store.clients;
    document.getElementById('vaultClient').innerHTML = ac.map(c => `<option value="${c.id}" ${c.id === clientId ? 'selected' : ''}>${c.name}</option>`).join('');
    ['vaultPlatform','vaultLogin','vaultPassword','vaultNotes'].forEach(id => { document.getElementById(id).value = ''; });
    UI.openModal('moVault');
  }
  function renderPage() {
    const ac = Store.clients;
    const sel = document.getElementById('vaultClientFilter');
    if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="">Selecionar cliente...</option>' + ac.map(c => `<option value="${c.id}" ${c.id === cur ? 'selected' : ''}>${c.name}</option>`).join('');
    if (cur) loadByClient(cur);
  }
  return { render, renderPage, loadByClient, togglePass, copy, save, openModal };
})();
