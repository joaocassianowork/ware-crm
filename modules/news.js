const News = (() => {
  function render() {
    const el = document.getElementById('newsList');
    if (!el) return;
    if (!Store.news.length) { el.innerHTML = '<div style="padding:32px;text-align:center;color:var(--w4);font-size:13px;">Nenhuma notícia enviada ainda.</div>'; return; }
    el.innerHTML = Store.news.map(n => {
      const specs = (n.specialties || []).join(', ') || 'Todas';
      const sent = n.sent_to?.length || 0;
      return `<div class="news-item">
        <div class="news-info">
          <div class="news-title">${n.title}</div>
          <div class="news-meta">Para: <strong>${specs}</strong> · ${sent} destinatário(s) · ${Utils.timeAgo(n.sent_at)}</div>
          <div class="news-preview">${n.content.slice(0, 120)}...</div>
        </div>
        <span class="badge b-green">Enviada</span>
      </div>`;
    }).join('');
  }

  async function save() {
    const title = document.getElementById('newsTitle').value.trim();
    const content = document.getElementById('newsContent').value.trim();
    const specsRaw = document.getElementById('newsSpecs').value.trim();
    if (!title || !content) { alert('Preencha título e conteúdo.'); return; }
    const specs = specsRaw ? specsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

    // Find matching clients
    let targets = Store.clients.filter(c => c.status === 'ativo' && c.email);
    if (specs.length) {
      targets = targets.filter(c => (c.specialties || []).some(s => specs.some(sp => s.toLowerCase().includes(sp.toLowerCase()))));
    }
    const emails = targets.map(c => c.email).filter(Boolean);

    await sb.from('news_sends').insert({ title, content, specialties: specs, sent_to: emails, sent_at: new Date().toISOString() });
    UI.closeModal('moNews');
    alert(`Notícia registrada! ${emails.length} cliente(s) seriam notificados via e-mail (configure o Resend para envio automático).`);
    App.loadAll();
  }

  function openModal() {
    document.getElementById('newsTitle').value = '';
    document.getElementById('newsContent').value = '';
    document.getElementById('newsSpecs').value = '';
    UI.openModal('moNews');
  }

  return { render, save, openModal };
})();
