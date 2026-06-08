const Diagnosis = (() => {
  let result = null;

  async function run() {
    const name = document.getElementById('diagName').value.trim();
    const city = document.getElementById('diagCity').value.trim();
    const spec = document.getElementById('diagSpec').value.trim();
    if (!name || !city) { alert('Preencha nome e cidade.'); return; }

    const btn = document.getElementById('diagBtn');
    btn.textContent = 'Analisando...'; btn.disabled = true;
    document.getElementById('diagResult').innerHTML = '<div class="loading"><div class="spin"></div>Buscando presença digital...</div>';

    // Simulate analysis with scoring
    await new Promise(r => setTimeout(r, 1200));

    // Build search queries for display
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(name + ' advogado ' + city)}`;
    const gmbUrl = `https://www.google.com/maps/search/${encodeURIComponent(name + ' ' + city)}`;

    // Score factors (user fills manually after checking)
    result = {
      name, city, spec,
      searchUrl, gmbUrl,
      score: null,
      factors: {
        hasSite: null, siteQuality: null, hasGmb: null,
        gmbReviews: null, hasInstagram: null, instagramActive: null
      }
    };

    renderDiagForm();
    btn.textContent = 'Analisar'; btn.disabled = false;
  }

  function renderDiagForm() {
    document.getElementById('diagResult').innerHTML = `
      <div style="margin-top:20px;">
        <div class="dp-section-lbl" style="margin-bottom:12px;">Preencha o que você encontrou</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
          <a href="${result.searchUrl}" target="_blank" class="btn btn-g btn-sm">🔍 Buscar no Google</a>
          <a href="${result.gmbUrl}" target="_blank" class="btn btn-g btn-sm">📍 Ver no Maps</a>
        </div>

        <div class="diag-factors">
          ${renderFactor('Tem site próprio?', 'hasSite')}
          ${renderFactor('Site tem SEO e é profissional?', 'siteQuality', true)}
          ${renderFactor('Tem Google Meu Negócio?', 'hasGmb')}
          ${renderFactor('GMB tem +10 avaliações?', 'gmbReviews', true)}
          ${renderFactor('Tem Instagram ativo?', 'hasInstagram')}
          ${renderFactor('Instagram com +2 posts/semana?', 'instagramActive', true)}
        </div>

        <button class="btn btn-p" style="width:100%;justify-content:center;margin-top:16px;" onclick="Diagnosis.calcScore()">Calcular Score →</button>
      </div>
    `;
  }

  function renderFactor(label, key, dependent = false) {
    return `<div class="diag-factor ${dependent ? 'dep' : ''}">
      <span class="diag-factor-label">${label}</span>
      <div class="diag-factor-btns">
        <button class="diag-btn" id="df_${key}_yes" onclick="Diagnosis.setFactor('${key}',true)">Sim</button>
        <button class="diag-btn" id="df_${key}_no" onclick="Diagnosis.setFactor('${key}',false)">Não</button>
      </div>
    </div>`;
  }

  function setFactor(key, val) {
    result.factors[key] = val;
    const yes = document.getElementById(`df_${key}_yes`);
    const no = document.getElementById(`df_${key}_no`);
    if (yes) yes.classList.toggle('on', val === true);
    if (no) no.classList.toggle('on', val === false);
  }

  function calcScore() {
    const f = result.factors;
    let score = 0;
    const gaps = [];

    if (f.hasSite === true) { score += 20; if (f.siteQuality === true) score += 15; else gaps.push('Site sem SEO ou desatualizado'); }
    else { gaps.push('Não tem site — grande oportunidade'); }
    if (f.hasGmb === true) { score += 20; if (f.gmbReviews === true) score += 15; else gaps.push('GMB com poucas avaliações'); }
    else { gaps.push('Sem Google Meu Negócio — invisível no mapa'); }
    if (f.hasInstagram === true) { score += 15; if (f.instagramActive === true) score += 15; else gaps.push('Instagram inativo ou com pouca frequência'); }
    else { gaps.push('Sem presença no Instagram'); }

    result.score = score;
    result.gaps = gaps;

    const color = score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--amber)' : 'var(--red)';
    const label = score >= 70 ? 'Boa presença' : score >= 40 ? 'Presença média' : 'Presença fraca';

    document.getElementById('diagResult').innerHTML += `
      <div style="margin-top:16px;background:var(--s1);border:1px solid var(--br);border-radius:10px;padding:20px;">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
          <div style="font-family:'Sora',sans-serif;font-size:48px;font-weight:800;color:${color};line-height:1;">${score}</div>
          <div><div style="font-size:14px;font-weight:600;color:${color};">${label}</div><div style="font-size:12px;color:var(--w4);">de 100 pontos</div></div>
        </div>
        ${gaps.length ? `<div style="margin-bottom:12px;"><div style="font-size:10px;font-weight:700;letter-spacing:.15em;text-transform:uppercase;color:var(--red);margin-bottom:8px;">Pontos fracos — use na reunião</div>${gaps.map(g=>`<div style="font-size:13px;color:var(--w7);padding:5px 0;border-bottom:1px solid var(--br);display:flex;gap:8px;align-items:center;"><span style="color:var(--red);">✗</span>${g}</div>`).join('')}</div>` : ''}
        <button class="btn btn-p btn-sm" style="margin-top:8px;" onclick="Diagnosis.saveProspect()">Salvar como Lead →</button>
      </div>
    `;
  }

  async function saveProspect() {
    const { data } = await sb.from('leads').insert({
      name: result.name,
      city: result.city,
      specialty: result.spec || null,
      stage: 'novo',
      followup_count: 0,
      diagnosis_score: result.score,
      diagnosis_data: result.factors,
      notes: result.gaps?.join('\n') || null,
      source: 'prospecção ativa'
    }).select().single();

    if (data) {
      alert(`Lead "${result.name}" salvo no funil com score ${result.score}!`);
      document.getElementById('diagResult').innerHTML = '<div style="padding:20px;text-align:center;color:var(--green);font-size:14px;">✓ Lead salvo no funil de leads.</div>';
    }
  }

  function reset() {
    result = null;
    document.getElementById('diagName').value = '';
    document.getElementById('diagCity').value = '';
    document.getElementById('diagSpec').value = '';
    document.getElementById('diagResult').innerHTML = '';
  }

  return { run, setFactor, calcScore, saveProspect, reset };
})();
