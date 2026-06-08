const Health = (() => {
  // Calculates health score 0-100 for a client
  function calcHealth(clientId) {
    const now = new Date();
    let score = 100;
    const deductions = [];

    // Last meeting (max -25)
    const meetings = Store.meetings.filter(m => m.client_id === clientId);
    if (meetings.length === 0) {
      score -= 25; deductions.push('Sem reunião registrada');
    } else {
      const lastMeet = new Date(meetings[0].date + 'T12:00');
      const daysSince = Math.floor((now - lastMeet) / 86400000);
      if (daysSince > 45) { score -= 25; deductions.push(`Última reunião há ${daysSince} dias`); }
      else if (daysSince > 30) { score -= 10; deductions.push(`Reunião há ${daysSince} dias`); }
    }

    // Last report (max -20)
    const reports = Store.reports.filter(r => r.client_id === clientId);
    if (reports.length === 0) {
      score -= 20; deductions.push('Sem relatório enviado');
    } else {
      const lastRep = new Date(reports[0].created_at);
      const daysSince = Math.floor((now - lastRep) / 86400000);
      if (daysSince > 40) { score -= 20; deductions.push(`Último relatório há ${daysSince} dias`); }
      else if (daysSince > 30) { score -= 8; }
    }

    // Pending approvals (max -15)
    const pendingAp = Store.approvals.filter(a => a.client_id === clientId && a.status === 'pendente');
    if (pendingAp.length > 0) {
      const oldest = pendingAp.reduce((o, a) => new Date(a.created_at) < new Date(o.created_at) ? a : o);
      const days = Math.floor((now - new Date(oldest.created_at)) / 86400000);
      if (days > 7) { score -= 15; deductions.push(`Aprovação pendente há ${days} dias`); }
      else if (days > 3) { score -= 5; }
    }

    // Overdue payments (max -20)
    const overdueP = Store.payments.filter(p => p.client_id === clientId && p.status === 'atrasado');
    if (overdueP.length > 0) { score -= 20; deductions.push(`${overdueP.length} pagamento(s) em atraso`); }

    // Contract expiring (max -20)
    const client = Store.clients.find(c => c.id === clientId);
    if (client?.contract_end) {
      const days = Math.ceil((new Date(client.contract_end) - now) / 86400000);
      if (days <= 0) { score -= 20; deductions.push('Contrato vencido'); }
      else if (days <= 30) { score -= 10; deductions.push(`Contrato vence em ${days} dias`); }
    }

    return { score: Math.max(0, score), deductions };
  }

  // Calculates renewal probability 0-100
  function calcRenewal(clientId) {
    let score = 100;
    const client = Store.clients.find(c => c.id === clientId);
    const health = calcHealth(clientId).score;

    // Health weight (40%)
    score = score * 0.6 + health * 0.4;

    // Contract age — longer = more likely to renew
    if (client?.contract_start) {
      const months = Math.floor((new Date() - new Date(client.contract_start)) / (30 * 86400000));
      if (months >= 6) score = Math.min(100, score + 10);
      if (months >= 12) score = Math.min(100, score + 5);
    }

    // Days to contract end
    if (client?.contract_end) {
      const days = Math.ceil((new Date(client.contract_end) - new Date()) / 86400000);
      if (days <= 0) score = Math.max(0, score - 30);
      else if (days <= 15) score = Math.max(0, score - 15);
      else if (days <= 30) score = Math.max(0, score - 5);
    }

    return Math.round(Math.max(0, Math.min(100, score)));
  }

  async function updateAllScores() {
    const active = Store.clients.filter(c => c.status === 'ativo');
    for (const client of active) {
      const { score } = calcHealth(client.id);
      const renewal = calcRenewal(client.id);
      if (score !== client.health_score || renewal !== client.renewal_score) {
        await sb.from('clients').update({ health_score: score, renewal_score: renewal }).eq('id', client.id);
      }
    }
  }

  function getRenewalColor(score) {
    if (score >= 75) return 'var(--green)';
    if (score >= 50) return 'var(--amber)';
    return 'var(--red)';
  }

  function getRenewalLabel(score) {
    if (score >= 75) return 'Alta';
    if (score >= 50) return 'Média';
    return 'Baixa';
  }

  return { calcHealth, calcRenewal, updateAllScores, getRenewalColor, getRenewalLabel };
})();
