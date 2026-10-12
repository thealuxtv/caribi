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

// Entrada suave das secções ao fazer scroll
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -10% 0px' });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('is-in'));
}
