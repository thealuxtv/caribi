// Menu móvel
const toggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!open));
    nav.classList.toggle('open', !open);
  });
}

// Galeria da viatura
const main = document.getElementById('gallery-main');
document.querySelectorAll('.gallery-thumbs button').forEach((btn) => {
  btn.addEventListener('click', () => {
    main.src = btn.dataset.src;
    main.alt = btn.dataset.alt;
    document.querySelectorAll('.gallery-thumbs button').forEach((b) => b.removeAttribute('aria-current'));
    btn.setAttribute('aria-current', 'true');
  });
});

// Confirmação antes de apagar (painel)
document.querySelectorAll('form[data-confirm]').forEach((form) => {
  form.addEventListener('submit', (e) => {
    if (!confirm(form.dataset.confirm)) e.preventDefault();
  });
});

// Entrada suave das secções ao fazer scroll.
// Os elementos de cada grupo entram um a um, com um pequeno atraso entre eles.
const grupos = [
  '.steps > li', '.car-grid > .car-card', '.contact-grid > .contact-item', '.mini-specs > div',
  '.specs > div', '.dossier-body > .dossier-block', '.ticks > li', '.gallery-thumbs > li',
  '.footer-grid > div', '.footer-ral', '.cta-inner > *', '.section-head > *', '.process h2', '.process .eyebrow',
  '.prose > *', '.quote > *', '.contact-extra > *', '.count', '.filters', '.empty > *', '.dossier-head',
];
document.querySelectorAll(grupos.join(',')).forEach((el) => {
  const i = [...el.parentElement.children].indexOf(el) % 8;
  el.classList.add('reveal');
  el.style.setProperty('--atraso', `${i * 90}ms`);
});
const reveals = document.querySelectorAll('.reveal');
let inicio = performance.now();
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        // O que já está no ecrã ao abrir a página entra depois do título
        if (performance.now() - inicio < 600) {
          const atraso = parseInt(e.target.style.getPropertyValue('--atraso'), 10) || 0;
          e.target.style.setProperty('--atraso', `${atraso + 450}ms`);
        }
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('is-in'));
}
