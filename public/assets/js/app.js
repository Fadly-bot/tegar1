const $ = (selector) => document.querySelector(selector);
let currentUser = null;

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || 'Permintaan belum berhasil.');
    error.code = data.code;
    throw error;
  }
  return data;
}

const DEMO_USERS_KEY = 'potong_users';
const DEMO_ORDERS_KEY = 'potong_orders';
const DEMO_SESSION_KEY = 'potong_session';
let demoMode = false;
function demoUsers() {
  let users = JSON.parse(localStorage.getItem(DEMO_USERS_KEY) || 'null');
  if (!users) {
    users = [
      { username: 'a', password: 'a', name: 'Alya Demo', email: 'alya@example.com', role: 'customer' },
      { username: 'admin', password: 'admin', name: 'Admin Potong', email: 'admin@potong.studio', role: 'admin' },
    ];
    localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
  }
  return users;
}
function demoOrders() { return JSON.parse(localStorage.getItem(DEMO_ORDERS_KEY) || '[]'); }
function demoCall(url, options = {}) {
  const method = options.method || 'GET';
  const data = JSON.parse(options.body || '{}');
  const action = new URL(url, location.origin);
  if (action.pathname.endsWith('/auth.php')) {
    const act = action.searchParams.get('action');
    if (act === 'me') {
      const username = localStorage.getItem(DEMO_SESSION_KEY);
      return Promise.resolve({ user: demoUsers().find((user) => user.username === username) || null });
    }
    if (act === 'logout') { localStorage.removeItem(DEMO_SESSION_KEY); return Promise.resolve({ ok: true }); }
    if (act === 'login') {
      const user = demoUsers().find((entry) => entry.username.toLowerCase() === String(data.username).toLowerCase() && entry.password === data.password);
      if (!user) return Promise.reject(new Error('Username atau password tidak cocok.'));
      localStorage.setItem(DEMO_SESSION_KEY, user.username);
      return Promise.resolve({ user });
    }
    if (act === 'register') {
      const users = demoUsers();
      if (users.some((user) => user.username.toLowerCase() === String(data.username).toLowerCase())) return Promise.reject(new Error('Username sudah dipakai. Coba username lain.'));
      const user = { username: data.username, password: data.password, name: data.name, email: data.email, role: 'customer' };
      users.push(user); localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users)); localStorage.setItem(DEMO_SESSION_KEY, user.username);
      return Promise.resolve({ user });
    }
  }
  const user = demoUsers().find((entry) => entry.username === localStorage.getItem(DEMO_SESSION_KEY));
  if (!user) return Promise.reject(new Error('Silakan masuk terlebih dahulu.'));
  let orders = demoOrders();
  if (method === 'GET') {
    if (user.role === 'admin') {
      const status = action.searchParams.get('status') || 'all';
      const visible = status === 'all' ? orders : orders.filter((order) => order.status === status);
      return Promise.resolve({ orders: visible });
    }
    return Promise.resolve({ orders: orders.filter((order) => order.username === user.username) });
  }
  if (method === 'POST') {
    const prices = { 'Short & simple': 50000, 'Creator cut': 150000, 'Project cut': 300000 };
    if (!prices[data.package]) return Promise.reject(new Error('Pilih paket yang tersedia.'));
    const order = { code: `PTG-${Date.now().toString().slice(-6)}`, id: `PTG-${Date.now().toString().slice(-6)}`, username: user.username, name: user.name, email: user.email, package: data.package, price: prices[data.package], deadline: data.deadline, drive_url: data.drive, notes: data.notes, status: 'Menunggu konfirmasi', created_at: new Date().toISOString() };
    orders.push(order); localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(orders));
    return Promise.resolve({ ok: true, id: order.id });
  }
  if (method === 'PATCH') {
    if (user.role !== 'admin') return Promise.reject(new Error('Akses hanya untuk admin.'));
    orders = orders.map((order) => order.code === data.id ? { ...order, status: data.status } : order);
    localStorage.setItem(DEMO_ORDERS_KEY, JSON.stringify(orders));
    return Promise.resolve({ ok: true });
  }
  return Promise.reject(new Error('Metode tidak didukung.'));
}
async function request(url, options = {}) {
  if (demoMode) return demoCall(url, options);
  try {
    return await api(url, options);
  } catch (error) {
    if (error.code !== 'DATABASE_UNAVAILABLE') throw error;
    demoMode = true;
    toast('Mode demo browser aktif. Data hanya tersimpan di browser ini.');
    return demoCall(url, options);
  }
}

function showView(name) {
  document.querySelectorAll('.view').forEach((view) => view.classList.remove('active'));
  $(`#${name}View`).classList.add('active');
  window.scrollTo(0, 0);
  if (name === 'app') renderApp();
}
function goAuth(mode = 'login') { showView('auth'); authMode(mode); }
function authMode(mode) {
  $('#loginForm').style.display = mode === 'login' ? 'block' : 'none';
  $('#registerForm').style.display = mode === 'register' ? 'block' : 'none';
}
function showMessage(id, message) {
  const box = $(id);
  box.textContent = message;
  box.style.display = 'block';
}
let toastTimer;
function toast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('show'), 2700);
}
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char]);
}
function formatDate(value) {
  const date = new Date(value.replace(' ', 'T') + (value.includes('Z') ? '' : 'Z'));
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
}

$('#loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const result = await request('/api/auth.php?action=login', {
      method: 'POST', body: JSON.stringify({ username: $('#loginUser').value.trim(), password: $('#loginPass').value }),
    });
    currentUser = result.user;
    showView('app');
  } catch (error) { showMessage('#loginMsg', error.message); }
});
$('#registerForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    const result = await request('/api/auth.php?action=register', {
      method: 'POST',
      body: JSON.stringify({ name: $('#regName').value.trim(), email: $('#regEmail').value.trim(), username: $('#regUser').value.trim(), password: $('#regPass').value }),
    });
    currentUser = result.user;
    showView('app');
    toast('Akun berhasil dibuat.');
  } catch (error) { showMessage('#registerMsg', error.message); }
});
async function logout() {
  try { await request('/api/auth.php?action=logout', { method: 'POST', body: '{}' }); } catch (_) { /* tetap kembali ke halaman publik */ }
  currentUser = null;
  showView('home');
  toast('Kamu sudah keluar.');
}

function renderApp() {
  if (!currentUser) { showView('home'); return; }
  $('#sideName').textContent = currentUser.name;
  $('#sideRole').textContent = currentUser.role === 'admin' ? 'Administrator' : 'Pelanggan';
  $('#avatarLetter').textContent = (currentUser.name || 'P').charAt(0).toUpperCase();
  $('#helloName').textContent = currentUser.name.split(' ')[0];
  $('#adminLink').style.display = currentUser.role === 'admin' ? 'flex' : 'none';
  $('#accountName').value = currentUser.name;
  $('#accountUser').value = currentUser.username;
  $('#accountEmail').value = currentUser.email;
  $('#dashDate').textContent = 'POTONG / ' + new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  dashboardTab(currentUser.role === 'admin' ? 'admin' : 'orders');
  if (currentUser.role === 'customer') renderMyOrders();
}
function dashboardTab(name) {
  if (name === 'admin' && currentUser?.role !== 'admin') return;
  document.querySelectorAll('.dash-panel').forEach((panel) => { panel.style.display = 'none'; });
  $(`#${name}Panel`).style.display = 'block';
  document.querySelectorAll('.side-link[data-section]').forEach((link) => link.classList.toggle('active', link.dataset.section === name));
  if (name === 'orders') renderMyOrders();
  if (name === 'admin') renderAdmin();
}
function statusClass(status) { return status === 'Selesai' ? 'done' : status === 'Dalam pengerjaan' ? 'pending' : ''; }
async function renderMyOrders() {
  try {
    const { orders } = await request('/api/orders.php');
    $('#myCount').textContent = orders.length;
    $('#myQueue').textContent = orders.filter((order) => order.status !== 'Selesai').length;
    $('#myDone').textContent = orders.filter((order) => order.status === 'Selesai').length;
    $('#tableCount').textContent = `${orders.length} PESANAN`;
    $('#myEmpty').style.display = orders.length ? 'none' : 'block';
    $('#myOrders').innerHTML = orders.map((order) => `<tr><td><strong>${escapeHtml(order.id)}</strong></td><td>${escapeHtml(order.package)}</td><td>${escapeHtml(formatDate(order.created_at))}</td><td>${escapeHtml(order.notes || '—')}</td><td><span class="status ${statusClass(order.status)}">${escapeHtml(order.status)}</span></td></tr>`).join('');
  } catch (error) { toast(error.message); }
}
function orderPackage(name, price) {
  if (!currentUser) { goAuth('login'); toast('Masuk atau daftar untuk memesan.'); return; }
  showView('app');
  dashboardTab('neworder');
  $('#package').value = `${name} — ${price}`;
}
$('#orderForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const selected = $('#package').value.split(' — ')[0];
  try {
    await request('/api/orders.php', { method: 'POST', body: JSON.stringify({ package: selected, deadline: $('#deadline').value, drive: $('#drive').value.trim(), notes: $('#notes').value.trim() }) });
    event.target.reset();
    dashboardTab('orders');
    toast('Pesanan tersimpan. Admin dapat melihatnya.');
  } catch (error) { toast(error.message); }
});
async function renderAdmin() {
  if (currentUser?.role !== 'admin') return;
  try {
    const [result, totalsResult] = await Promise.all([
      request(`/api/orders.php?status=${encodeURIComponent($('#statusFilter').value)}`),
      request('/api/orders.php?status=all&summary=1'),
    ]);
    const allOrders = totalsResult.orders;
    $('#adminOrdersCount').textContent = allOrders.length;
    $('#adminCustomers').textContent = new Set(allOrders.map((order) => order.username)).size;
    $('#adminRevenue').textContent = 'Rp' + allOrders.reduce((sum, order) => sum + Number(order.price), 0).toLocaleString('id-ID');
    $('#adminEmpty').style.display = result.orders.length ? 'none' : 'block';
    $('#adminOrders').innerHTML = result.orders.map((order) => `<tr><td><strong>${escapeHtml(order.code)}</strong></td><td><strong>${escapeHtml(order.name)}</strong><br><span style="color:#81837b">${escapeHtml(order.email)}</span></td><td>${escapeHtml(order.package)}</td><td>${escapeHtml(formatDate(order.created_at))}<br><span style="color:#81837b">${escapeHtml(order.deadline)}</span></td><td>Rp${Number(order.price).toLocaleString('id-ID')}</td><td><select class="filter" onchange="changeStatus('${escapeHtml(order.code)}',this.value)">${['Menunggu konfirmasi', 'Dalam pengerjaan', 'Selesai'].map((status) => `<option ${status === order.status ? 'selected' : ''}>${status}</option>`).join('')}</select></td></tr>`).join('');
  } catch (error) { toast(error.message); }
}
async function changeStatus(id, status) {
  try { await request('/api/orders.php', { method: 'PATCH', body: JSON.stringify({ id, status }) }); await renderAdmin(); toast('Status pesanan diperbarui.'); }
  catch (error) { toast(error.message); }
}
function exportOrders() {
  request('/api/orders.php?status=all').then(({ orders }) => {
    if (!orders.length) { toast('Belum ada pesanan untuk diunduh.'); return; }
    const values = [['ID', 'Nama', 'Email', 'Paket', 'Estimasi', 'Tanggal', 'Target', 'Catatan', 'Status'], ...orders.map((order) => [order.code, order.name, order.email, order.package, order.price, order.created_at, order.deadline, order.notes, order.status])];
    const csv = values.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv' }));
    link.download = 'pesanan-potong.csv'; link.click(); URL.revokeObjectURL(link.href);
  }).catch((error) => toast(error.message));
}
function orderPackageFromQuery() {
  const name = new URLSearchParams(location.search).get('paket');
  const prices = { 'Short & simple': 'Rp50.000', 'Creator cut': 'Rp150.000', 'Project cut': 'Rp300.000' };
  if (prices[name]) orderPackage(name, prices[name]);
  if (location.search) history.replaceState({}, '', location.pathname);
}

request('/api/auth.php?action=me').then(({ user }) => {
  currentUser = user;
  if (user) showView('app');
}).catch(() => {});
orderPackageFromQuery();
