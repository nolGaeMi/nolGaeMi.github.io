(() => {
  const prefersReduced = false; // 강제로 애니메이션 ON (테스트용)

  // ---------- Smooth scroll for navbar ----------
  function setupSmoothScroll() {
    const header = document.querySelector('header');
    if (!header) return;

    const headerHeight = header.offsetHeight;

    document.querySelectorAll('a.nav-link').forEach(anchor => {
      anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href') || '';
        if (!href.startsWith('#')) return; // external links pass through

        e.preventDefault();
        const targetId = href.substring(1);
        const target = document.getElementById(targetId);
        if (!target) return;

        window.scrollTo({
          top: target.offsetTop - headerHeight,
          behavior: 'smooth'
        });
      });
    });
  }

  // ---------- Featured projects from all_projects.html ----------
  function setupFeaturedProjects() {
    const featured = document.getElementById('featured-projects');
    if (!featured) return;

    fetch('all_projects.html')
      .then(r => r.text())
      .then(html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const project1 = doc.querySelector('#project7');
        const project2 = doc.querySelector('#project9');

        if (project1) featured.appendChild(createProjectCard(project1));
        if (project2) featured.appendChild(createProjectCard(project2));
      })
      .catch(err => console.error('Error fetching projects:', err));

    function createProjectCard(row) {
      const title = row.querySelector('td:nth-child(2)')?.textContent?.trim() || '프로젝트';
      const source = row.querySelector('td:nth-child(3)')?.innerHTML || '';
      const description = row.querySelector('td:nth-child(4)')?.textContent?.trim() || '';
      const link = row.querySelector('td:nth-child(5)')?.innerHTML || '';

      const col = document.createElement('div');
      col.className = 'col-md-6';
      col.innerHTML = `
        <div class="card mb-4">
          <div class="card-body">
            <h5 class="card-title">${escapeHtml(title)}</h5>
            <p class="card-text">${escapeHtml(description)}</p>
            <div class="mb-2">${link}</div>
            <div class="small opacity-75">${source}</div>
          </div>
        </div>
      `;
      return col;
    }

    function escapeHtml(str) {
      return String(str).replace(/[&<>"']/g, m => ({
        '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
      }[m]));
    }
  }

  // ---------- Starfield canvas ----------
  function setupStarfield() {
    const canvas = document.getElementById('stars');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    let w = 0, h = 0, dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));

    const stars = [];
    const STAR_LAYERS = [
      { count: 90, speed: 0.08, size: 1.1 },
      { count: 70, speed: 0.14, size: 1.4 },
      { count: 45, speed: 0.22, size: 1.8 },
    ];

    let mx = 0, my = 0; // mouse for parallax

    function resize() {
      w = Math.floor(window.innerWidth);
      h = Math.floor(window.innerHeight);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      stars.length = 0;
      STAR_LAYERS.forEach((layer, li) => {
        for (let i = 0; i < layer.count; i++) {
          stars.push({
            x: Math.random() * w,
            y: Math.random() * h,
            r: (Math.random() * 0.9 + 0.3) * layer.size,
            a: Math.random() * 0.55 + 0.15,
            layer: li,
            tw: Math.random() * 1.5 + 0.6,
            ph: Math.random() * Math.PI * 2,
          });
        }
      });
    }

    function draw(t) {
      if (prefersReduced) return; // no animation

      ctx.clearRect(0, 0, w, h);

      // subtle vignette
      const grd = ctx.createRadialGradient(w * 0.5, h * 0.3, 0, w * 0.5, h * 0.5, Math.max(w, h) * 0.7);
      grd.addColorStop(0, 'rgba(255,255,255,0.03)');
      grd.addColorStop(1, 'rgba(0,0,0,0.18)');
      ctx.fillStyle = grd;
      ctx.fillRect(0, 0, w, h);

      for (const s of stars) {
        const layer = STAR_LAYERS[s.layer];
        // drift left-down a bit
        s.x -= layer.speed * 60 * 0.016;
        s.y += layer.speed * 20 * 0.016;

        if (s.x < -10) s.x = w + 10;
        if (s.y > h + 10) s.y = -10;

        // twinkle + parallax
        const twinkle = (Math.sin((t * 0.001) * s.tw + s.ph) + 1) * 0.5; // 0..1
        const alpha = s.a + twinkle * 0.18;

        const px = s.x + mx * (0.6 + s.layer * 0.25);
        const py = s.y + my * (0.6 + s.layer * 0.25);

        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fill();
      }

      requestAnimationFrame(draw);
    }

    window.addEventListener('mousemove', (e) => {
      const cx = w / 2, cy = h / 2;
      mx = ((e.clientX - cx) / cx) * 3;  // small movement
      my = ((e.clientY - cy) / cy) * 3;
    }, { passive: true });

    window.addEventListener('resize', resize, { passive: true });
    resize();
    requestAnimationFrame(draw);
  }

// ---------- Spaceship flight ----------
function setupShip() {
  const ship = document.getElementById('ship');
  if (!ship || prefersReduced) return;

  console.log("setupShip() ✅"); // 로딩 확인용

  let start = performance.now();
  const period = 12000 + Math.random() * 8000; // ms

  function tick(now) {
    const t = (now - start) % period;
    const p = t / period; // 0..1
    const w = window.innerWidth;
    const h = window.innerHeight;

    // left -> right
    const x = -260 + (w + 520) * p;

    // Y는 화면 상단 기준 픽셀로 안정적으로
    const baseY = Math.max(90, h * 0.14);
    const y = baseY + Math.sin(p * Math.PI * 2) * 22 + Math.sin(p * Math.PI * 6) * 6;

    const rot = Math.sin(p * Math.PI * 2) * 2.2; // degrees
    const scale = 0.92 + Math.sin(p * Math.PI) * 0.06;

    ship.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg) scale(${scale})`;

    // fade in/out
    const fade = p < 0.08 ? (p / 0.08) : (p > 0.92 ? ((1 - p) / 0.08) : 1);
    ship.style.opacity = String(0.15 + fade * 0.85);

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  window.addEventListener('focus', () => { start = performance.now(); }, { passive: true });
}

  // ---------- Init ----------
  document.addEventListener('DOMContentLoaded', () => {
    setupSmoothScroll();
    setupFeaturedProjects();
    setupStarfield();
    setupShip();
  });
})();
