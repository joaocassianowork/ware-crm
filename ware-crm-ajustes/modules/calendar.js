const Calendar = (() => {
  let curYear, curMonth;

  function init() {
    const now = new Date();
    curYear = now.getFullYear();
    curMonth = now.getMonth();
    render();
  }

  function render() {
    const el = document.getElementById('calendarGrid');
    const titleEl = document.getElementById('calTitle');
    if (!el || !titleEl) return;

    const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    titleEl.textContent = monthNames[curMonth] + ' ' + curYear;

    const firstDay = new Date(curYear, curMonth, 1).getDay();
    const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();

    // Build events map
    const events = {};
    const addEv = (dateStr, text, color) => {
      if (!events[dateStr]) events[dateStr] = [];
      events[dateStr].push({ text, color });
    };

    // Contract expirations
    Store.clients.filter(c => c.contract_end).forEach(c => {
      const d = c.contract_end;
      if (d && d.startsWith(`${curYear}-${String(curMonth+1).padStart(2,'0')}`)) {
        addEv(d, `Venc. ${c.name.split(' ')[0]}`, 'var(--red)');
      }
    });

    // Payments due
    Store.payments.filter(p => p.due_date && p.status !== 'pago').forEach(p => {
      const d = p.due_date;
      if (d && d.startsWith(`${curYear}-${String(curMonth+1).padStart(2,'0')}`)) {
        const c = Store.clients.find(x => x.id === p.client_id);
        addEv(d, `💰 ${c?.name?.split(' ')[0] || '—'}`, 'var(--amber)');
      }
    });

    // Meetings
    Store.meetings.filter(m => m.date).forEach(m => {
      const d = m.date;
      if (d && d.startsWith(`${curYear}-${String(curMonth+1).padStart(2,'0')}`)) {
        const c = Store.clients.find(x => x.id === m.client_id);
        addEv(d, `📅 ${c?.name?.split(' ')[0] || '—'}`, 'var(--blue)');
      }
    });

    const days = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    let html = `<div class="cal-header">${days.map(d => `<div class="cal-day-name">${d}</div>`).join('')}</div><div class="cal-grid">`;

    for (let i = 0; i < firstDay; i++) html += '<div class="cal-cell empty"></div>';

    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${curYear}-${String(curMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const isToday = today.getFullYear()===curYear && today.getMonth()===curMonth && today.getDate()===day;
      const dayEvents = events[dateStr] || [];
      html += `<div class="cal-cell ${isToday ? 'today' : ''}">
        <div class="cal-day-num ${isToday ? 'today-num' : ''}">${day}</div>
        ${dayEvents.map(e => `<div class="cal-event" style="background:${e.color}15;border-left:2px solid ${e.color};color:${e.color};">${e.text}</div>`).join('')}
      </div>`;
    }
    html += '</div>';
    el.innerHTML = html;
  }

  function prev() { curMonth--; if (curMonth < 0) { curMonth = 11; curYear--; } render(); }
  function next() { curMonth++; if (curMonth > 11) { curMonth = 0; curYear++; } render(); }

  return { init, render, prev, next };
})();
