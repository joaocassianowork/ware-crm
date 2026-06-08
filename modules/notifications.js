const Notifications = (() => {
  const WORKER_URL = 'https://ware-email.joaocassianowork-55c.workers.dev';
  const FROM = 'joao@warejuridico.com.br';

  async function send(to, subject, html) {
    try {
      const key = localStorage.getItem('resend_key') || '';
      if (!key) return false;
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + key },
        body: JSON.stringify({ from: FROM, to, subject, html })
      });
      return res.ok;
    } catch { return false; }
  }

  function emailHtml(title, body, cta = null) {
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="background:#080808;color:#f5f2ee;font-family:'Helvetica Neue',sans-serif;padding:40px 20px;margin:0;">
      <div style="max-width:520px;margin:0 auto;">
        <div style="font-size:20px;font-weight:800;letter-spacing:-0.03em;margin-bottom:32px;">Ware<span style="color:#4F7EFF;">.</span></div>
        <div style="background:#0f0f0f;border:1px solid rgba(245,242,238,0.08);border-radius:12px;padding:28px;">
          <div style="font-size:18px;font-weight:700;margin-bottom:12px;">${title}</div>
          <div style="font-size:14px;color:rgba(245,242,238,0.6);line-height:1.7;">${body}</div>
          ${cta ? `<a href="${cta.url}" style="display:inline-block;margin-top:20px;background:#4F7EFF;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;">${cta.label}</a>` : ''}
        </div>
        <div style="font-size:11px;color:rgba(245,242,238,0.3);margin-top:24px;text-align:center;">Ware Jurídico · warejuridico.com.br</div>
      </div>
    </body></html>`;
  }

  async function checkAndSend() {
    const now = new Date();
    const alerts = [];

    // Leads sem contato há +48h
    const h48 = new Date(now - 48 * 3600000);
    Store.leads.filter(l => l.stage === 'novo' && (!l.last_contact_at || new Date(l.last_contact_at) < h48)).forEach(l => {
      alerts.push({ type: 'lead_cold', name: l.name, id: l.id });
    });

    // Contratos vencendo em 30 dias
    Store.clients.filter(c => c.status === 'ativo' && c.contract_end).forEach(c => {
      const days = Math.ceil((new Date(c.contract_end) - now) / 86400000);
      if (days === 30 || days === 15 || days === 7) {
        alerts.push({ type: 'contract_expiring', name: c.name, days, id: c.id });
      }
    });

    // Pagamentos atrasados
    Store.payments.filter(p => p.status === 'pendente' && p.due_date && new Date(p.due_date) < now).forEach(p => {
      const c = Store.clients.find(x => x.id === p.client_id);
      if (c) alerts.push({ type: 'payment_overdue', name: c.name, amount: p.amount, id: p.id });
    });

    if (!alerts.length) return;

    // Get current user email
    const { data: { user } } = await sb.auth.getUser();
    if (!user?.email) return;

    const leadAlerts = alerts.filter(a => a.type === 'lead_cold');
    const contractAlerts = alerts.filter(a => a.type === 'contract_expiring');
    const paymentAlerts = alerts.filter(a => a.type === 'payment_overdue');

    let body = '';
    if (leadAlerts.length) body += `<p><strong style="color:#FF5C5C;">Leads parados (${leadAlerts.length}):</strong> ${leadAlerts.map(a => a.name).join(', ')}</p>`;
    if (contractAlerts.length) body += `<p><strong style="color:#F5A623;">Contratos vencendo:</strong> ${contractAlerts.map(a => `${a.name} (${a.days} dias)`).join(', ')}</p>`;
    if (paymentAlerts.length) body += `<p><strong style="color:#FF5C5C;">Pagamentos em atraso (${paymentAlerts.length}):</strong> ${paymentAlerts.map(a => a.name).join(', ')}</p>`;

    await send(user.email, `⚠️ Ware CRM — ${alerts.length} alerta(s) precisam de atenção`,
      emailHtml('Alertas do dia', body, { url: 'https://crm.warejuridico.com.br', label: 'Abrir CRM →' }));
  }

  async function notifyApproval(clientId, status) {
    const c = Store.clients.find(x => x.id === clientId);
    if (!c?.email) return;
    const msg = status === 'aprovado'
      ? 'Ótima notícia! O conteúdo foi aprovado e está agendado para publicação.'
      : 'Recebemos seu pedido de revisão. Nossa equipe já está trabalhando nos ajustes.';
    await send(c.email, `Ware — Atualização sobre seus conteúdos`, emailHtml('Conteúdo ' + status, msg));
  }

  async function notifyOnboarding(clientId) {
    const c = Store.clients.find(x => x.id === clientId);
    if (!c?.email) return;
    const url = 'https://crm.warejuridico.com.br/onboarding.html';
    await send(c.email, 'Ware — Seu onboarding está pronto!',
      emailHtml('Bem-vindo(a) à Ware!',
        `Estamos muito felizes em ter você como cliente. Para começarmos da melhor forma, precisamos de algumas informações sobre o seu escritório. O processo leva cerca de 5 minutos.`,
        { url, label: 'Preencher Onboarding →' }));
  }

  function render() {
    const el = document.getElementById('notifSettings');
    if (!el) return;
    el.innerHTML = `
      <div style="padding:20px 18px;">
        <div style="font-size:13px;color:var(--w7);line-height:1.7;margin-bottom:16px;">
          Configure sua chave do <strong>Resend</strong> para ativar os e-mails automáticos. Crie uma conta gratuita em <a href="https://resend.com" target="_blank" style="color:var(--blue);">resend.com</a> (até 3.000 e-mails/mês grátis).
        </div>
        <div class="fr"><label>Chave da API Resend</label>
          <input id="resendKey" placeholder="re_xxxxxxxxxxxx" value="${localStorage.getItem('resend_key')||''}">
        </div>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button class="btn btn-p btn-sm" onclick="Notifications.saveKey()">Salvar Chave</button>
          <button class="btn btn-g btn-sm" onclick="Notifications.testEmail()">Enviar E-mail de Teste</button>
        </div>
        <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--br);">
          <div style="font-size:10px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--blue);margin-bottom:12px;">E-mails automáticos ativos</div>
          ${[
            ['Lead sem contato há +48h', 'Para você (gestor)'],
            ['Contrato vencendo em 30, 15 e 7 dias', 'Para você (gestor)'],
            ['Pagamento em atraso', 'Para você (gestor)'],
            ['Onboarding enviado ao fechar cliente', 'Para o cliente'],
            ['Atualização de aprovação de conteúdo', 'Para o cliente'],
          ].map(([n,d])=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--br);">
            <span style="font-size:13px;color:var(--w7);">${n}</span>
            <span style="font-size:11px;color:var(--w4);">${d}</span>
          </div>`).join('')}
        </div>
      </div>
    `;
  }

  function saveKey() {
    const key = document.getElementById('resendKey')?.value?.trim();
    if (key) { localStorage.setItem('resend_key', key); alert('Chave salva!'); }
  }

  async function testEmail() {
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return;
    const ok = await send(user.email, 'Ware CRM — Teste de e-mail',
      emailHtml('Tudo funcionando!', 'Seu e-mail está configurado corretamente. Os alertas automáticos estão ativos.'));
    alert(ok ? 'E-mail enviado! Verifique sua caixa de entrada.' : 'Erro ao enviar. Verifique a chave do Resend.');
  }

  return { checkAndSend, notifyApproval, notifyOnboarding, render, saveKey, testEmail, send, emailHtml };
})();
