const Invite = (() => {
  function getResendKey() {
    return localStorage.getItem('resend_key') || '';
  }

  async function sendInvite(clientId) {
    const client = Store.clients.find(c => c.id === clientId);
    if (!client) return;
    if (!client.email) {
      alert('Este cliente não tem e-mail cadastrado. Adicione o e-mail no perfil do cliente antes de enviar o convite.');
      return;
    }

    const key = getResendKey();
    if (!key || key === 'COLOQUE_SUA_CHAVE_RESEND_AQUI') {
      alert('Configure sua chave do Resend em Configurações antes de enviar convites.');
      return;
    }

    // Create magic link via Supabase Auth
    const { data, error } = await sb.auth.admin ? 
      { data: null, error: { message: 'use generateLink' } } :
      { data: null, error: null };

    // Generate invite link via Supabase
    const portalUrl = 'https://crm.warejuridico.com.br/portal.html';
    
    // Send invite email with Supabase Auth
    const { error: invErr } = await sb.auth.signInWithOtp({
      email: client.email,
      options: {
        emailRedirectTo: portalUrl,
        shouldCreateUser: true,
        data: { client_id: clientId, name: client.lawyer_name || client.name }
      }
    });

    if (invErr) {
      // Fallback: send custom email via Resend
      await sendCustomInvite(client, key, portalUrl);
      return;
    }

    // Log in timeline
    await sb.from('client_timeline').insert({
      client_id: clientId,
      type: 'nota',
      title: `Convite do portal enviado para ${client.email}`
    });

    alert(`✓ Convite enviado para ${client.email}!\n\nO cliente receberá um e-mail com o link para criar a senha e acessar o portal.`);
    App.loadAll();
  }

  async function sendCustomInvite(client, resendKey, portalUrl) {
    const name = client.lawyer_name || client.name;
    const firstName = name.split(' ')[0];

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="background:#080808;color:#f5f2ee;font-family:'Helvetica Neue',sans-serif;padding:40px 20px;margin:0;">
<div style="max-width:520px;margin:0 auto;">
  <div style="font-size:20px;font-weight:800;letter-spacing:-0.03em;margin-bottom:32px;">Ware<span style="color:#4F7EFF;">.</span></div>
  <div style="background:#0f0f0f;border:1px solid rgba(245,242,238,0.08);border-radius:12px;padding:32px;">
    <div style="font-size:18px;font-weight:700;margin-bottom:12px;">Seu portal está pronto, ${firstName}!</div>
    <div style="font-size:14px;color:rgba(245,242,238,0.6);line-height:1.75;margin-bottom:24px;">
      A partir de agora você pode acompanhar em tempo real tudo que a Ware está fazendo pelo seu escritório:<br><br>
      ✓ Progresso do seu projeto<br>
      ✓ Conteúdos enviados para aprovação<br>
      ✓ Linha do tempo de entregas<br>
      ✓ Indicadores do mês
    </div>
    <a href="${portalUrl}" style="display:inline-block;background:#4F7EFF;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Acessar meu portal →</a>
    <div style="margin-top:20px;font-size:12px;color:rgba(245,242,238,0.3);">
      Use o e-mail ${client.email} para fazer login. Se for seu primeiro acesso, clique em "Esqueci minha senha" para criar uma senha.
    </div>
  </div>
  <div style="font-size:11px;color:rgba(245,242,238,0.3);margin-top:24px;text-align:center;">Ware Jurídico · warejuridico.com.br</div>
</div>
</body></html>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + resendKey },
      body: JSON.stringify({
        from: 'joao@warejuridico.com.br',
        to: client.email,
        subject: `${firstName}, seu portal da Ware está pronto!`,
        html
      })
    });

    if (res.ok) {
      await sb.from('client_timeline').insert({
        client_id: client.id,
        type: 'nota',
        title: `Convite do portal enviado para ${client.email}`
      });
      alert(`✓ Convite enviado para ${client.email}!\n\nO cliente receberá o link para acessar o portal.`);
      App.loadAll();
    } else {
      alert('Erro ao enviar o convite. Verifique sua chave do Resend em Configurações.');
    }
  }

  function renderInviteButton(clientId) {
    const client = Store.clients.find(c => c.id === clientId);
    if (!client) return '';
    const hasEmail = !!client.email;
    return `<button class="btn btn-g btn-sm" 
      onclick="Invite.sendInvite('${clientId}')" 
      title="${hasEmail ? 'Enviar convite do portal para ' + client.email : 'Cadastre o e-mail do cliente primeiro'}"
      ${hasEmail ? '' : 'style="opacity:.4;cursor:default;"'}>
      📨 Convidar para o Portal
    </button>`;
  }

  return { sendInvite, renderInviteButton };
})();
