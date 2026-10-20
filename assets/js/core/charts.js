/* ==========================================================================
   K.charts — pembungkus Chart.js yang mengikuti token tema.
   Semua chart didaftarkan agar bisa di-destroy saat pindah halaman
   (mencegah memory leak) dan dibuat ulang saat tema berganti.
   ========================================================================== */
(function (K) {
  'use strict';
  const registry = new Set();

  function token(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  /** Hex (#RRGGBB) → rgba() dengan alpha; dipakai untuk gradien area agar tidak keabu-abuan. */
  function alpha(hex, a) {
    const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex.trim());
    return m ? `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${a})` : hex;
  }

  function palette() {
    return ['--chart-c1', '--chart-c2', '--chart-c3', '--chart-c4', '--chart-c5', '--chart-c6'].map(token);
  }

  function applyDefaults() {
    if (!window.Chart) return;
    const C = window.Chart;
    C.defaults.font.family = token('--font-sans');
    C.defaults.font.size = 11;
    C.defaults.color = token('--text-secondary');
    C.defaults.borderColor = token('--chart-grid');
    C.defaults.plugins.legend.display = false;
    C.defaults.plugins.tooltip.backgroundColor = token('--bg-panel');
    C.defaults.plugins.tooltip.titleColor = token('--text-secondary');
    C.defaults.plugins.tooltip.bodyColor = token('--text-strong');
    C.defaults.plugins.tooltip.borderColor = token('--border');
    C.defaults.plugins.tooltip.borderWidth = 1;
    C.defaults.plugins.tooltip.padding = 10;
    C.defaults.plugins.tooltip.cornerRadius = 8;
    C.defaults.plugins.tooltip.boxPadding = 4;
    C.defaults.plugins.tooltip.usePointStyle = true;
    C.defaults.plugins.tooltip.titleFont = { weight: '500', size: 11 };
    C.defaults.plugins.tooltip.bodyFont = { weight: '600', size: 12 };
    C.defaults.maintainAspectRatio = false;
    C.defaults.animation.duration = matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 500;
  }

  function scales({ yFormat, stacked = false, beginAtZero = true, yMax } = {}) {
    return {
      x: { stacked, grid: { display: false }, border: { display: false }, ticks: { maxRotation: 0, autoSkipPadding: 16 } },
      y: {
        stacked, beginAtZero, max: yMax, border: { display: false },
        grid: { color: token('--chart-grid'), drawTicks: false }, ticks: { padding: 8, maxTicksLimit: 5, callback: yFormat || (v => K.util.num(v)) },
      },
    };
  }

  function make(canvas, config) {
    if (!window.Chart) {
      canvas.replaceWith(Object.assign(document.createElement('p'), { className: 'text-secondary text-sm', textContent: 'Grafik tidak tersedia (Chart.js gagal dimuat).' }));
      return null;
    }
    const chart = new window.Chart(canvas, config);
    registry.add(chart);
    return chart;
  }

  const charts = {
    token, palette,

    line(canvas, { labels, datasets, yFormat, tooltipFormat, area = true }) {
      const ctx = canvas.getContext('2d');
      const ds = datasets.map((d, i) => {
        const color = d.color || (i === 0 ? token('--chart-1') : token('--chart-2'));
        let bg = 'transparent';
        if (area && i === 0 && d.fill !== false) {
          const g = ctx.createLinearGradient(0, 0, 0, canvas.parentElement.clientHeight || 240);
          g.addColorStop(0, alpha(color, 0.22)); g.addColorStop(1, alpha(color, 0));
          bg = g;
        }
        return {
          label: d.label, data: d.data, borderColor: color, backgroundColor: bg, fill: area && i === 0 && d.fill !== false,
          borderWidth: d.dashed ? 2 : 2.5, borderDash: d.dashed ? [5, 5] : [], tension: 0.38,
          pointRadius: 0, pointHoverRadius: 5, pointHoverBorderWidth: 2, pointHoverBorderColor: token('--bg-panel'), pointHoverBackgroundColor: color,
        };
      });
      return make(canvas, {
        type: 'line', data: { labels, datasets: ds },
        options: {
          interaction: { mode: 'index', intersect: false },
          scales: scales({ yFormat }),
          plugins: { tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${tooltipFormat ? tooltipFormat(c.parsed.y) : K.util.num(c.parsed.y)}` } } },
        },
      });
    },

    bar(canvas, { labels, datasets, yFormat, tooltipFormat, stacked = false, horizontal = false }) {
      const pal = palette();
      const ds = datasets.map((d, i) => ({
        label: d.label, data: d.data, backgroundColor: d.color || pal[i % pal.length],
        borderRadius: 4, borderSkipped: false, maxBarThickness: 28, categoryPercentage: 0.7, barPercentage: 0.85,
      }));
      const sc = scales({ yFormat, stacked });
      if (horizontal) { const t = sc.x; sc.x = sc.y; sc.y = t; sc.y.grid = { display: false }; sc.x.ticks.callback = yFormat || (v => K.util.num(v)); }
      return make(canvas, {
        type: 'bar', data: { labels, datasets: ds },
        options: {
          indexAxis: horizontal ? 'y' : 'x',
          interaction: { mode: 'index', intersect: false },
          scales: sc,
          plugins: { tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${tooltipFormat ? tooltipFormat(c.parsed[horizontal ? 'x' : 'y']) : K.util.num(c.parsed[horizontal ? 'x' : 'y'])}` } } },
        },
      });
    },

    doughnut(canvas, { labels, data, colors, tooltipFormat, cutout = '72%' }) {
      const pal = colors || palette();
      return make(canvas, {
        type: 'doughnut',
        data: { labels, datasets: [{ data, backgroundColor: pal, borderColor: token('--bg-panel'), borderWidth: 3, hoverOffset: 4 }] },
        options: {
          cutout,
          plugins: { tooltip: { callbacks: { label: c => ` ${c.label}: ${tooltipFormat ? tooltipFormat(c.parsed) : K.util.num(c.parsed)}` } } },
        },
      });
    },

    sparkline(canvas, data, color) {
      return make(canvas, {
        type: 'line',
        data: { labels: data.map((_, i) => i), datasets: [{ data, borderColor: color || token('--chart-1'), borderWidth: 1.8, pointRadius: 0, tension: 0.4, fill: false }] },
        options: { plugins: { tooltip: { enabled: false } }, scales: { x: { display: false }, y: { display: false } }, animation: false, events: [] },
      });
    },

    hasAny() { return registry.size > 0; },
    destroyAll() { registry.forEach(c => c.destroy()); registry.clear(); },
    refreshTheme() { applyDefaults(); },
  };

  applyDefaults();
  K.charts = charts;
})(window.K);
