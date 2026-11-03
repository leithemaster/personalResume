// Progressive enhancement only: every page reads fully without this file.
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  // Staggered entrances, once per section.
  const targets = document.querySelectorAll('[data-reveal], .plate-reveal');
  document.querySelectorAll('[data-reveal]').forEach((el) => {
    [...el.children].forEach((c, i) => c.style.setProperty('--i', i));
  });
  if ('IntersectionObserver' in window && !reduce.matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    targets.forEach((t) => io.observe(t));
  } else {
    targets.forEach((t) => t.classList.add('is-in'));
  }

  // Gentle parallax on the hero drawing.
  const heroFig = document.querySelector('.hero__plate .drawing');
  if (heroFig && !reduce.matches) {
    let ticking = false;
    const update = () => {
      const y = Math.min(window.scrollY, window.innerHeight);
      heroFig.style.transform = `translate3d(0, ${(y * 0.12).toFixed(1)}px, 0)`;
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  }

  // Case study sheets: read the drawing one stage at a time.
  document.querySelectorAll('[data-stages]').forEach((group) => {
    const sheet = document.getElementById(group.dataset.stages);
    const note = sheet && sheet.querySelector('.sheet__note');
    if (!sheet) return;
    group.classList.add('is-live');
    const buttons = [...group.querySelectorAll('button')];
    const select = (btn) => {
      buttons.forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
      const stage = btn.dataset.stage;
      if (stage === 'all') sheet.removeAttribute('data-stage'); else sheet.dataset.stage = stage;
      if (note) note.textContent = btn.dataset.note || '';
    };
    buttons.forEach((b) => b.addEventListener('click', () => select(b)));
  });
})();
