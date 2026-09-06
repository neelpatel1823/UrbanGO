const sessionKey = 'urbanpulseUser';
const getUser = () => JSON.parse(localStorage.getItem(sessionKey) || 'null');
const setUser = user => localStorage.setItem(sessionKey, JSON.stringify(user));
const esc = value => String(value).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' })[c]);

document.querySelectorAll('[data-report-link]').forEach(link => {
  link.href = getUser() ? 'reportproblem.html' : 'login.html';
});

const loginForm = document.querySelector('#login-form');
if (loginForm) loginForm.addEventListener('submit', async event => {
  event.preventDefault(); const message = document.querySelector('#form-message');
  const data = Object.fromEntries(new FormData(loginForm));
  const response = await fetch('/api/login', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(data) });
  const result = await response.json();
  if (!response.ok) { message.textContent = result.error; message.hidden = false; return; }
  setUser(result.user); location.href = result.user.role === 'admin' ? 'admin-dashboard.html' : 'reportproblem.html';
});

const adminLoginForm = document.querySelector('#admin-login-form');
if (adminLoginForm) adminLoginForm.addEventListener('submit', async event => {
  event.preventDefault(); const message = document.querySelector('#form-message');
  const data = Object.fromEntries(new FormData(adminLoginForm));
  const response = await fetch('/api/login', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(data) });
  const result = await response.json();
  if (!response.ok) { message.textContent = result.error; message.hidden = false; return; }
  setUser(result.user); location.href = result.user.role === 'admin' ? 'admin-dashboard.html' : 'reportproblem.html';
});

const registerForm = document.querySelector('#register-form');
if (registerForm) registerForm.addEventListener('submit', async event => {
  event.preventDefault(); const message = document.querySelector('#form-message');
  const data = Object.fromEntries(new FormData(registerForm));
  if (data.password !== data.confirmPassword) { message.textContent = 'Passwords do not match.'; message.hidden = false; return; }
  const response = await fetch('/api/register', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ name:data.name, email:data.email, password:data.password, role:data.role || 'user' }) });
  const result = await response.json();
  if (!response.ok) { message.textContent = result.error; message.hidden = false; return; }
  setUser(result.user); location.href = result.user.role === 'admin' ? 'admin-dashboard.html' : 'reportproblem.html';
});

const reportForm = document.querySelector('#report-form');
if (reportForm) {
  const user = getUser(); if (!user) location.href = 'login.html';
  const type = document.querySelector('#problem-type'), other = document.querySelector('#other-type-wrap');
  type.addEventListener('change', () => { other.hidden = type.value !== 'Other'; document.querySelector('#other-type').required = type.value === 'Other'; });
  reportForm.addEventListener('submit', async event => {
    event.preventDefault(); const message = document.querySelector('#form-message');
    const data = Object.fromEntries(new FormData(reportForm)); data.reporter = user.name;
    const response = await fetch('/api/reports', { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) { message.textContent = result.error; message.hidden = false; return; }
    location.href = 'problems.html';
  });
}

const grid = document.querySelector('#problems-grid');
if (grid) fetch('/api/reports').then(r => r.json()).then(({ reports }) => {
  grid.innerHTML = reports.map(r => `<article class="problem-card"><div class="problem-icon">!</div><div><span class="tag">${esc(r.type)}</span><h2>${esc(r.type)}</h2><p><b>Location:</b> ${esc(r.location)}</p><p>${esc(r.description)}</p><div class="report-meta"><span class="priority ${esc(r.priority).toLowerCase()}">${esc(r.priority)}</span><span>${esc(r.status)}</span></div></div></article>`).join('');
});