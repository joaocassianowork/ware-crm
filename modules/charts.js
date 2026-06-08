const Charts = (() => {
  function drawLine(canvasId, labels, data, color = '#4F7EFF') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.offsetWidth || 400;
    const H = canvas.offsetHeight || 120;
    canvas.width = W * window.devicePixelRatio;
    canvas.height = H * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const pad = { top: 16, right: 16, bottom: 28, left: 40 };
    const w = W - pad.left - pad.right;
    const h = H - pad.top - pad.bottom;
    const max = Math.max(...data, 1);
    const min = 0;

    ctx.clearRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = 'rgba(245,242,238,0.05)';
    ctx.lineWidth = 1;
    [0, 0.25, 0.5, 0.75, 1].forEach(t => {
      const y = pad.top + h * (1 - t);
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + w, y); ctx.stroke();
    });

    if (data.length < 2) {
      ctx.fillStyle = 'rgba(245,242,238,0.3)';
      ctx.font = '12px DM Sans, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Dados insuficientes', W / 2, H / 2);
      return;
    }

    // Gradient fill
    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + h);
    grad.addColorStop(0, color + '33');
    grad.addColorStop(1, color + '00');

    // Points
    const pts = data.map((v, i) => ({
      x: pad.left + (i / (data.length - 1)) * w,
      y: pad.top + h * (1 - (v - min) / (max - min))
    }));

    // Fill
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pad.top + h);
    pts.forEach(p => ctx.lineTo(p.x, p.y));
    ctx.lineTo(pts[pts.length - 1].x, pad.top + h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    pts.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dots
    pts.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });

    // Labels
    ctx.fillStyle = 'rgba(245,242,238,0.4)';
    ctx.font = '10px DM Sans, sans-serif';
    ctx.textAlign = 'center';
    labels.forEach((l, i) => {
      const x = pad.left + (i / (data.length - 1)) * w;
      ctx.fillText(l, x, H - 6);
    });

    // Y axis
    ctx.textAlign = 'right';
    [0, Math.round(max / 2), max].forEach((v, i) => {
      const y = pad.top + h * (1 - (v / max));
      ctx.fillText(v, pad.left - 6, y + 4);
    });
  }

  function renderClientCharts(clientId) {
    const el = document.getElementById('clientChartsPane');
    if (!el) return;

    // Get reports for this client sorted by month
    const clientReports = Store.reports
      .filter(r => r.client_id === clientId && r.data)
      .sort((a, b) => a.month > b.month ? 1 : -1)
      .slice(-6);

    if (clientReports.length < 2) {
      el.innerHTML = '<div style="padding:24px;text-align:center;color:var(--w4);font-size:13px;">Dados insuficientes. Adicione ao menos 2 relatórios mensais para ver os gráficos.</div>';
      return;
    }

    const labels = clientReports.map(r => {
      const d = new Date(r.month + 'T12:00');
      return d.toLocaleDateString('pt-BR', { month: 'short' });
    });

    const leadsData = clientReports.map(r => parseInt(r.data?.leads) || 0);
    const cplData = clientReports.map(r => parseFloat(r.data?.cpl) || 0);
    const reachData = clientReports.map(r => parseInt(r.data?.reach) || 0);
    const gmbData = clientReports.map(r => parseInt(r.data?.gmb_clicks) || 0);

    el.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;padding:18px;">
        <div class="chart-box">
          <div class="chart-title">Leads Gerados</div>
          <canvas id="chart_leads" style="width:100%;height:110px;"></canvas>
        </div>
        <div class="chart-box">
          <div class="chart-title">Custo por Lead (R$)</div>
          <canvas id="chart_cpl" style="width:100%;height:110px;"></canvas>
        </div>
        <div class="chart-box">
          <div class="chart-title">Alcance Total</div>
          <canvas id="chart_reach" style="width:100%;height:110px;"></canvas>
        </div>
        <div class="chart-box">
          <div class="chart-title">Cliques GMB</div>
          <canvas id="chart_gmb" style="width:100%;height:110px;"></canvas>
        </div>
      </div>
    `;

    setTimeout(() => {
      drawLine('chart_leads', labels, leadsData, '#4F7EFF');
      drawLine('chart_cpl', labels, cplData, '#F5A623');
      drawLine('chart_reach', labels, reachData, '#2ECC8A');
      drawLine('chart_gmb', labels, gmbData, '#4F7EFF');
    }, 50);
  }

  return { drawLine, renderClientCharts };
})();
