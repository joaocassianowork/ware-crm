# Como configurar o Resend no CRM Ware

## 1. Criar conta no Resend
Acesse https://resend.com e crie uma conta gratuita.
Plano free: até 3.000 e-mails por mês. Suficiente para a operação atual.

## 2. Verificar o domínio warejuridico.com.br
No painel do Resend: Domains → Add Domain → cole `warejuridico.com.br`
O Resend vai te dar 3 registros DNS para adicionar no Cloudflare:
- 1 registro TXT (SPF)
- 1 registro TXT (DKIM)
- 1 registro CNAME (DMARC)

No Cloudflare (onde está o domínio):
DNS → Add Record → adicione os 3 registros que o Resend mostrou.
Aguarde até 24h para verificar (geralmente menos de 1h).

## 3. Criar a chave de API
No painel do Resend: API Keys → Create API Key
Nome: "Ware CRM"
Permissão: Full Access
Copie a chave (começa com re_...)

## 4. Configurar no CRM
Abra o CRM → menu lateral → Configurações
Cole a chave no campo "Chave da API Resend"
Clique em Salvar Chave
Clique em Enviar E-mail de Teste para confirmar

## 5. Configurar no Supabase (para magic link do portal)
No Supabase → Authentication → SMTP Settings:
- Enable Custom SMTP: OFF (deixa o Supabase usar o Resend via integração)

Ou: Authentication → Email Templates → customize os templates

Alternativamente, em Authentication → Providers → Email:
- Confirme que "Enable Email Signup" está ativado
- "Secure Email Change" pode ficar ativado

## 6. Testar o convite do portal
No CRM → abra um cliente que tenha e-mail cadastrado
No painel lateral → clique em "Convidar para o Portal"
O cliente vai receber um e-mail com o link
No primeiro acesso, ele clica em "Primeiro acesso" e recebe o magic link

## Observações importantes
- O e-mail remetente será joao@warejuridico.com.br
- O domínio precisa estar verificado no Resend para enviar
- Sem verificação, os e-mails vão para spam ou são bloqueados
- A chave fica salva no localStorage do seu navegador (não no banco)
