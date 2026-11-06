// FloraShield Client Controller
// Handles client routing, shopping cart, AI scanner, authentication, and admin metrics

const app = {
  // App State
  state: {
    user: null,
    token: null,
    cart: [],
    products: [],
    careTips: [],
    currentUploadFile: null,
    lastDiagnosisData: null,
    lastRecommendedProducts: []
  },

  // Initialize App
  init: function() {
    this.loadStateFromStorage();
    this.setupEventListeners();
    this.checkAuth();
    this.updateCartBadge();
    this.prefetchProducts();
    
    // Default: load home view
    this.switchView('home');
  },

  prefetchProducts: async function() {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        this.state.products = await res.json();
      }
    } catch (err) {}
  },

  // Load JWT token and cart from LocalStorage
  loadStateFromStorage: function() {
    const token = localStorage.getItem('flora_token');
    const user = localStorage.getItem('flora_user');
    const cart = localStorage.getItem('flora_cart');

    if (token && user) {
      this.state.token = token;
      this.state.user = JSON.parse(user);
    }
    if (cart) {
      this.state.cart = JSON.parse(cart);
    }
  },

  // Synchronize authentication tokens and headers
  getHeaders: function() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.state.token) {
      headers['Authorization'] = `Bearer ${this.state.token}`;
    }
    return headers;
  },

  // Setup UI event listeners
  setupEventListeners: function() {
    // Navigation view buttons
    document.querySelectorAll('.main-nav button, #nav-logo').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const view = btn.dataset.view || 'home';
        this.switchView(view);
      });
    });

    // Auth trigger login
    document.getElementById('btn-login-open').addEventListener('click', () => this.toggleAuthModal(true));
    document.getElementById('auth-modal-close').addEventListener('click', () => this.toggleAuthModal(false));
    document.getElementById('link-show-register').addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleAuthForm('register');
    });
    document.getElementById('link-show-login').addEventListener('click', (e) => {
      e.preventDefault();
      this.toggleAuthForm('login');
    });

    // Auth Form Submits
    document.getElementById('form-login').addEventListener('submit', (e) => this.handleLogin(e));
    document.getElementById('form-register').addEventListener('submit', (e) => this.handleRegister(e));

    // Cart trigger drawer
    document.getElementById('cart-trigger').addEventListener('click', () => this.toggleCart(true));
    document.getElementById('cart-close').addEventListener('click', () => this.toggleCart(false));
    document.getElementById('cart-overlay').addEventListener('click', () => this.toggleCart(false));
    document.getElementById('btn-checkout').addEventListener('click', () => this.handleCheckout());

    // File Upload Drag and Drop
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('leaf-image-input');
    const browseBtn = document.getElementById('btn-browse-file');

    browseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });

    uploadZone.addEventListener('click', () => {
      if (!this.state.currentUploadFile) {
        fileInput.click();
      }
    });

    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('dragover');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        this.handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleFileSelect(e.target.files[0]);
      }
    });

    document.getElementById('btn-remove-image').addEventListener('click', (e) => {
      e.stopPropagation();
      this.clearUploadedFile();
    });

    document.getElementById('btn-diagnose').addEventListener('click', () => this.triggerDiagnosis());
    document.getElementById('btn-download-word-report').addEventListener('click', () => this.downloadWordReport());

    // Result tabs switching
    document.querySelectorAll('.result-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.result-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.result-tab-content').forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        const contentId = `result-tab-${tab.dataset.resultTab}`;
        document.getElementById(contentId).classList.add('active');
      });
    });

    // Shop filters
    document.getElementById('shop-search').addEventListener('input', () => this.loadShopProducts());
    document.getElementById('shop-sort').addEventListener('change', () => this.loadShopProducts());
    document.querySelectorAll('.cat-link').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.cat-link').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.loadShopProducts();
      });
    });

    // Admin product modal triggers
    document.getElementById('btn-add-product-open').addEventListener('click', () => this.openProductModal());
    document.getElementById('product-modal-close').addEventListener('click', () => this.toggleProductModal(false));
    document.getElementById('form-product').addEventListener('submit', (e) => this.handleProductSubmit(e));

    // Admin sub-tabs switcher
    document.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        const contentId = `admin-tab-${tab.dataset.adminTab}`;
        document.getElementById(contentId).classList.add('active');
      });
    });
  },

  // Verify and update interface according to user tokens
  checkAuth: function() {
    if (this.state.token && this.state.user) {
      // Logged in UI shifts
      document.getElementById('nav-btn-orders').classList.remove('hidden');
      if (this.state.user.role === 'admin') {
        document.getElementById('nav-btn-admin').classList.remove('hidden');
      } else {
        document.getElementById('nav-btn-admin').classList.add('hidden');
      }

      document.getElementById('auth-nav-container').innerHTML = `
        <div class="user-menu" style="display: flex; align-items: center; gap: 12px;">
          <span style="font-size: 0.9rem; font-weight: 600; color: var(--primary);">👤 ${this.state.user.username}</span>
          <button class="btn btn-secondary btn-sm" id="btn-logout">Logout</button>
        </div>
      `;
      document.getElementById('btn-logout').addEventListener('click', () => this.handleLogout());
    } else {
      // Logged out state
      document.getElementById('nav-btn-orders').classList.add('hidden');
      document.getElementById('nav-btn-admin').classList.add('hidden');
      document.getElementById('auth-nav-container').innerHTML = `
        <button class="btn btn-primary" id="btn-login-open" onclick="window.location.href='/login'">Login</button>
      `;

      // If we are currently on orders or admin tab, redirect to home
      const currentActiveView = document.querySelector('.view-section.active').id;
      if (currentActiveView === 'view-orders' || currentActiveView === 'view-admin') {
        this.switchView('home');
      }
    }
  },

  // Toggle View Panel (Tabs Switching)
  switchView: function(viewName) {
    // Hide all sections
    document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
    // Remove active link class
    document.querySelectorAll('.main-nav button').forEach(b => b.classList.remove('active'));

    // Show destination
    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
      targetSection.classList.add('active');
    }

    const targetNavBtn = document.querySelector(`.main-nav button[data-view="${viewName}"]`);
    if (targetNavBtn) {
      targetNavBtn.classList.add('active');
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Load data specific to tabs
    if (viewName === 'shop') {
      this.loadShopProducts();
    } else if (viewName === 'tips') {
      this.loadCareTips();
    } else if (viewName === 'orders') {
      this.loadUserOrders();
    } else if (viewName === 'admin') {
      this.loadAdminDashboard();
    }
  },

  // Modals Toggles
  toggleAuthModal: function(show) {
    const modal = document.getElementById('auth-modal');
    document.getElementById('auth-error-alert').classList.add('hidden');
    if (show) {
      modal.classList.add('active');
      this.toggleAuthForm('login');
    } else {
      modal.classList.remove('active');
    }
  },

  toggleAuthForm: function(type) {
    const loginForm = document.getElementById('form-login');
    const registerForm = document.getElementById('form-register');
    const title = document.getElementById('auth-modal-title');

    if (type === 'login') {
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
      title.innerText = 'Login to FloraShield';
    } else {
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
      title.innerText = 'Register Gardener Account';
    }
  },

  // Authentication Handlers
  handleLogin: async function(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const errorAlert = document.getElementById('auth-error-alert');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Login failed.');

      localStorage.setItem('flora_token', data.token);
      localStorage.setItem('flora_user', JSON.stringify(data.user));
      
      this.state.token = data.token;
      this.state.user = data.user;

      this.toggleAuthModal(false);
      this.checkAuth();
      this.showToast('Logged in successfully!');
    } catch (err) {
      errorAlert.innerText = err.message;
      errorAlert.classList.remove('hidden');
    }
  },

  handleRegister: async function(e) {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const errorAlert = document.getElementById('auth-error-alert');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Registration failed.');

      localStorage.setItem('flora_token', data.token);
      localStorage.setItem('flora_user', JSON.stringify(data.user));
      
      this.state.token = data.token;
      this.state.user = data.user;

      this.toggleAuthModal(false);
      this.checkAuth();
      this.showToast('Account registered successfully!');
    } catch (err) {
      errorAlert.innerText = err.message;
      errorAlert.classList.remove('hidden');
    }
  },

  handleLogout: function() {
    localStorage.removeItem('flora_token');
    localStorage.removeItem('flora_user');
    this.state.token = null;
    this.state.user = null;
    this.checkAuth();
    this.showToast('Logged out successfully.');
    this.switchView('home');
  },

  // AI Disease Diagnosis Upload Handlers
  handleFileSelect: function(file) {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }
    this.state.currentUploadFile = file;

    // Show image preview
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('img-preview').src = e.target.result;
      document.getElementById('dropzone-default').classList.add('hidden');
      document.getElementById('dropzone-preview-container').classList.remove('hidden');
      
      // Enable diagnosis button
      const diagnoseBtn = document.getElementById('btn-diagnose');
      diagnoseBtn.classList.remove('disabled');
      diagnoseBtn.removeAttribute('disabled');
    };
    reader.readAsDataURL(file);
  },

  clearUploadedFile: function() {
    this.state.currentUploadFile = null;
    document.getElementById('leaf-image-input').value = '';
    document.getElementById('dropzone-default').classList.remove('hidden');
    document.getElementById('dropzone-preview-container').classList.add('hidden');
    
    // Reset buttons
    const diagnoseBtn = document.getElementById('btn-diagnose');
    diagnoseBtn.classList.add('disabled');
    diagnoseBtn.setAttribute('disabled', 'true');
    
    // Hide laser scanning overlays
    document.getElementById('laser-beam').classList.add('hidden');
    document.getElementById('scan-status-text').classList.add('hidden');
  },

  triggerDiagnosis: async function() {
    if (!this.state.currentUploadFile) return;

    const diagnoseBtn = document.getElementById('btn-diagnose');
    const removeBtn = document.getElementById('btn-remove-image');
    const laser = document.getElementById('laser-beam');
    const statusText = document.getElementById('scan-status-text');

    // Trigger visual loading
    diagnoseBtn.classList.add('disabled');
    diagnoseBtn.setAttribute('disabled', 'true');
    removeBtn.classList.add('hidden');
    laser.classList.remove('hidden');
    statusText.classList.remove('hidden');
    document.getElementById('diagnose-btn-text').innerText = 'Analyzing Leaf...';

    const formData = new FormData();
    formData.append('image', this.state.currentUploadFile);
    formData.append('plantType', document.getElementById('select-plant-hint').value);

    const startTime = Date.now();

    try {
      const res = await fetch('/api/disease/detect', {
        method: 'POST',
        // Note: Do NOT set Content-Type header when uploading files with FormData; 
        // the browser needs to set the boundary string automatically.
        body: formData
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Diagnosis failed.');

      // Introduce an artificial 2-second delay to showcase the gorgeous laser scan line
      const elapsed = Date.now() - startTime;
      const delay = Math.max(2000 - elapsed, 0);

      setTimeout(() => {
        // Reset scanner button
        document.getElementById('diagnose-btn-text').innerText = 'Diagnose Plant';
        laser.classList.add('hidden');
        statusText.classList.add('hidden');
        removeBtn.classList.remove('hidden');
        diagnoseBtn.classList.remove('disabled');
        diagnoseBtn.removeAttribute('disabled');

        // Render diagnosis
        this.renderDiagnosisReport(data);
      }, delay);

    } catch (err) {
      alert(err.message);
      document.getElementById('diagnose-btn-text').innerText = 'Diagnose Plant';
      laser.classList.add('hidden');
      statusText.classList.add('hidden');
      removeBtn.classList.remove('hidden');
      diagnoseBtn.classList.remove('disabled');
      diagnoseBtn.removeAttribute('disabled');
    }
  },

  renderDiagnosisReport: function(data) {
    this.state.lastDiagnosisData = data;
    const emptyState = document.querySelector('.empty-results-state');
    const reportCard = document.getElementById('diagnosis-card-content');
    
    emptyState.classList.add('hidden');
    reportCard.classList.remove('hidden');

    // Scientific name & Title
    document.getElementById('result-disease-name').innerText = data.disease.name;
    document.getElementById('result-scientific-name').innerText = data.disease.scientificName;
    document.getElementById('result-confidence').innerText = `${data.confidence}%`;
    document.getElementById('result-confidence-bar').style.width = `${data.confidence}%`;

    // Symptoms
    const symptomsList = document.getElementById('result-list-symptoms');
    symptomsList.innerHTML = data.disease.symptoms.map(s => `<li>${s}</li>`).join('');

    // Causes
    document.getElementById('result-text-causes').innerText = data.disease.causes;

    // Prevention & Treatment
    const treatmentList = document.getElementById('result-list-treatment');
    treatmentList.innerHTML = data.disease.treatment.map(t => `<li>${t}</li>`).join('');

    const preventionList = document.getElementById('result-list-prevention');
    preventionList.innerHTML = data.disease.prevention.map(p => `<li>${p}</li>`).join('');

    // Select recommendation products based on diagnostic results
    // Bridge to shop
    this.renderRecommendedProducts(data.disease.name);
  },

  downloadWordReport: async function() {
    if (!this.state.lastDiagnosisData) {
      alert('Please perform a plant diagnosis first to generate a report.');
      return;
    }

    const btn = document.getElementById('btn-download-word-report');
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span>⌛ Generating Word Document...</span>';
    btn.disabled = true;

    try {
      const selectedPlant = document.getElementById('select-plant-hint').value;
      const payload = {
        plantType: selectedPlant !== 'Unknown' ? selectedPlant : this.state.lastDiagnosisData.disease.plantType,
        disease: this.state.lastDiagnosisData.disease,
        confidence: this.state.lastDiagnosisData.confidence,
        recommendedProducts: this.state.lastRecommendedProducts || []
      };

      const res = await fetch('/api/disease/download-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to generate Word report.');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const diseaseName = (this.state.lastDiagnosisData.disease.name || 'Plant_Disease').replace(/[^a-zA-Z0-9_-]/g, '_');
      a.download = `Plant_Health_Report_${diseaseName}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error downloading Word report: ' + err.message);
    } finally {
      btn.innerHTML = originalHTML;
      btn.disabled = false;
    }
  },

  getStoreBadgesHTML: function(product) {
    const nameEnc = encodeURIComponent(product.name || 'plant fertilizer pesticide');
    const links = product.purchaseLinks || {};
    
    const amazonUrl = links.amazon || `https://www.amazon.in/s?k=${nameEnc}`;
    const flipkartUrl = links.flipkart || `https://www.flipkart.com/search?q=${nameEnc}`;
    const meeshoUrl = links.meesho || `https://www.meesho.com/search?q=${nameEnc}`;
    const agribegriUrl = links.agribegri || `https://agribegri.com/search.php?q=${nameEnc}`;
    const bighaatUrl = links.bighaat || `https://www.bighaat.com/search?q=${nameEnc}`;

    return `
      <div class="store-links-container">
        <div class="store-links-header">🛒 Buy on Online Apps:</div>
        <div class="store-badges-grid">
          <a href="${amazonUrl}" target="_blank" rel="noopener noreferrer" class="store-badge amazon" title="Buy ${product.name} on Amazon">
            <span>📦 Amazon</span>
          </a>
          <a href="${flipkartUrl}" target="_blank" rel="noopener noreferrer" class="store-badge flipkart" title="Buy ${product.name} on Flipkart">
            <span>🛍️ Flipkart</span>
          </a>
          <a href="${meeshoUrl}" target="_blank" rel="noopener noreferrer" class="store-badge meesho" title="Buy ${product.name} on Meesho">
            <span>🌸 Meesho</span>
          </a>
          <a href="${agribegriUrl}" target="_blank" rel="noopener noreferrer" class="store-badge agribegri" title="Buy ${product.name} on AgriBegri">
            <span>🌾 AgriBegri</span>
          </a>
          <a href="${bighaatUrl}" target="_blank" rel="noopener noreferrer" class="store-badge bighaat" title="Buy ${product.name} on BigHaat">
            <span>🌱 BigHaat</span>
          </a>
        </div>
      </div>
    `;
  },

  renderRecommendedProducts: async function(diseaseName) {
    const recsList = document.getElementById('result-recs-list');
    recsList.innerHTML = '<p style="font-size:0.8rem;color:var(--text-muted);">Loading care suggestions...</p>';

    try {
      const res = await fetch('/api/products');
      const products = await res.json();
      let matched = [];

      const name = diseaseName.toLowerCase();
      if (name.includes('blight') || name.includes('scab') || name.includes('rot')) {
        // Recommend pesticides/fungicides
        matched = products.filter(p => p.category === 'Pesticides').slice(0, 2);
      } else {
        // Recommend compost and plant foods
        matched = products.filter(p => p.category === 'Fertilizers').slice(0, 2);
      }

      if (matched.length === 0) {
        matched = products.slice(0, 2);
      }

      this.state.lastRecommendedProducts = matched;

      recsList.innerHTML = matched.map(p => `
        <div class="rec-item" style="display:flex;flex-direction:column;gap:6px;padding:12px;background:rgba(255,255,255,0.03);border-radius:var(--radius-md);border:1px solid var(--border-color);">
          <div style="display:flex;align-items:center;gap:12px;cursor:pointer;" onclick="app.switchView('shop')">
            <img src="${p.imageUrl}" class="rec-img" alt="${p.name}">
            <div>
              <div class="rec-title">${p.name}</div>
              <div class="rec-price">$${p.price.toFixed(2)}</div>
            </div>
          </div>
          ${this.getStoreBadgesHTML(p)}
        </div>
      `).join('');
    } catch (err) {
      recsList.innerHTML = '<p style="color:var(--danger)">Unable to load product recommendations.</p>';
    }
  },

  // Expert Care Guidance Loader
  loadCareTips: async function() {
    const container = document.getElementById('tips-container');

    try {
      const res = await fetch('/api/disease/care-tips');
      const data = await res.json();
      this.state.careTips = data;

      container.innerHTML = data.map(tip => `
        <div class="tip-card">
          <div class="tip-card-header">
            <span class="tip-plant-icon">${
              tip.plant === 'Tomato' ? '🍅' :
              tip.plant === 'Potato' ? '🥔' :
              tip.plant === 'Apple'  ? '🍎' :
              tip.plant === 'Grape'  ? '🍇' :
              tip.plant === 'Corn'   ? '🌽' :
              tip.plant === 'Rice'   ? '🌾' :
              tip.plant === 'Strawberry' ? '🍓' :
              tip.plant === 'Pepper' ? '🌶️' :
              tip.plant === 'Cherry' ? '🍒' :
              tip.plant === 'Cucumber' ? '🥒' :
              tip.plant === 'Sunflower' ? '🌻' :
              tip.plant === 'Basil'  ? '🌿' :
              tip.plant === 'Rose'   ? '🌹' :
              tip.plant === 'Mango'  ? '🥭' :
              tip.plant === 'Banana' ? '🍌' :
              tip.plant === 'Lettuce' ? '🥬' :
              tip.plant === 'Carrot' ? '🥕' :
              tip.plant === 'Citrus' ? '🍋' : '☘️'
            }</span>
            <h3>${tip.plant} Care Formula</h3>
          </div>
          <div class="tip-row">
            <span class="tip-label">Watering schedule</span>
            <span class="tip-text">${tip.watering}</span>
          </div>
          <div class="tip-row">
            <span class="tip-label">NPK Fertilizing</span>
            <span class="tip-text">${tip.fertilizing}</span>
          </div>
          <div class="tip-row">
            <span class="tip-label">Pruning & Maintenance</span>
            <span class="tip-text">${tip.maintenance}</span>
          </div>
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = `<p class="text-center" style="color:var(--danger)">Error loading care guides: ${err.message}</p>`;
    }
  },

  // E-Commerce Product Loader
  loadShopProducts: async function() {
    const container = document.getElementById('products-container');
    const search = document.getElementById('shop-search').value;
    const sort = document.getElementById('shop-sort').value;
    const activeCatLink = document.querySelector('.cat-link.active');
    const category = activeCatLink ? activeCatLink.dataset.category : 'All';

    try {
      const queryParams = new URLSearchParams({
        category,
        search,
        sort
      });

      const res = await fetch(`/api/products?${queryParams}`);
      const data = await res.json();
      this.state.products = data;

      document.getElementById('products-count-label').innerText = `Showing ${data.length} items`;

      if (data.length === 0) {
        container.innerHTML = '<p class="text-center" style="grid-column:1/-1;padding:40px;color:var(--text-muted);">No products found matching filters.</p>';
        return;
      }

      container.innerHTML = data.map(p => `
        <div class="product-card">
          <div class="product-img-wrapper">
            <span class="product-category-tag">${p.category}</span>
            <img src="${p.imageUrl}" alt="${p.name}" onerror="this.src='/images/default_product.svg'">
          </div>
          <div class="product-info">
            <h4 class="product-title">${p.name}</h4>
            <p class="product-desc">${p.description}</p>
            <div class="product-meta">
              <span class="product-price">$${p.price.toFixed(2)}</span>
              <span class="product-stock ${p.stock < 10 ? 'low' : ''}">${p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}</span>
            </div>
            <button class="btn btn-primary product-action-btn ${p.stock === 0 ? 'disabled' : ''}" 
                    ${p.stock === 0 ? 'disabled' : ''} 
                    onclick="app.addToCart('${p.id}')">
              ${p.stock > 0 ? 'Add to Local Cart' : 'Out of Stock'}
            </button>
            ${this.getStoreBadgesHTML(p)}
          </div>
        </div>
      `).join('');
    } catch (err) {
      container.innerHTML = `<p class="text-center" style="color:var(--danger)">Error loading products: ${err.message}</p>`;
    }
  },

  // Cart Management Engine
  addToCart: async function(productOrId) {
    let product = null;

    if (typeof productOrId === 'object' && productOrId !== null && productOrId.name) {
      product = productOrId;
    } else {
      const idStr = String(productOrId);
      if (!this.state.products || this.state.products.length === 0) {
        try {
          const res = await fetch('/api/products');
          this.state.products = await res.json();
        } catch (err) {}
      }
      product = (this.state.products || []).find(p => String(p.id) === idStr || p.name === idStr);
      if (!product) {
        try {
          const res = await fetch(`/api/products/${encodeURIComponent(idStr)}`);
          if (res.ok) {
            product = await res.json();
          }
        } catch (err) {}
      }
    }

    if (!product) {
      alert("Product details not found.");
      return;
    }

    const pId = product.id || product.name;
    const existingIndex = this.state.cart.findIndex(item => item.productId === pId || item.name === product.name);
    
    if (existingIndex > -1) {
      const maxStock = Number(product.stock) || 99;
      if (this.state.cart[existingIndex].quantity >= maxStock) {
        alert(`Cannot add more. Only ${maxStock} units available in stock.`);
        return;
      }
      this.state.cart[existingIndex].quantity += 1;
    } else {
      this.state.cart.push({
        productId: pId,
        name: product.name,
        price: Number(product.price) || 0,
        imageUrl: product.imageUrl || '/images/neem_oil.jpg',
        quantity: 1,
        maxStock: Number(product.stock) || 99
      });
    }

    this.saveCartAndSync();
    this.showToast(`Added ${product.name} to cart!`);
  },

  saveCartAndSync: function() {
    localStorage.setItem('flora_cart', JSON.stringify(this.state.cart));
    this.updateCartBadge();
    this.renderCartDrawer();
  },

  updateCartBadge: function() {
    const count = this.state.cart.reduce((sum, item) => sum + item.quantity, 0);
    document.getElementById('cart-count').innerText = count;
  },

  toggleCart: function(open) {
    const overlay = document.getElementById('cart-overlay');
    const drawer = document.getElementById('cart-drawer');
    if (open) {
      overlay.classList.add('active');
      drawer.classList.add('active');
      this.renderCartDrawer();
    } else {
      overlay.classList.remove('active');
      drawer.classList.remove('active');
    }
  },

  renderCartDrawer: function() {
    const container = document.getElementById('cart-items-container');
    const summarySection = document.getElementById('cart-summary-section');

    if (this.state.cart.length === 0) {
      container.innerHTML = `
        <div class="cart-empty-state">
          <span class="empty-cart-icon">🛒</span>
          <p>Your shopping cart is empty</p>
          <button class="btn btn-secondary btn-sm" onclick="app.switchView('shop'); app.toggleCart(false);">Browse Shop</button>
        </div>
      `;
      summarySection.classList.add('hidden');
      return;
    }

    summarySection.classList.remove('hidden');
    container.innerHTML = this.state.cart.map(item => `
      <div class="cart-item-row">
        <img src="${item.imageUrl}" class="cart-item-thumb" alt="${item.name}" onerror="this.src='/images/default_product.svg'">
        <div class="cart-item-info">
          <h4 class="cart-item-name">${item.name}</h4>
          <span class="cart-item-price">$${item.price.toFixed(2)}</span>
        </div>
        <div class="cart-item-qty-control">
          <button class="qty-btn" onclick="app.updateQty('${item.productId}', -1)">&minus;</button>
          <span class="qty-val">${item.quantity}</span>
          <button class="qty-btn" onclick="app.updateQty('${item.productId}', 1)">&plus;</button>
        </div>
        <button class="icon-btn delete-item-btn" style="color:var(--danger)" onclick="app.removeCartItem('${item.productId}')" aria-label="Remove item">
          🗑️
        </button>
      </div>
    `).join('');

    const subtotal = this.state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('cart-subtotal').innerText = `$${subtotal.toFixed(2)}`;
  },

  updateQty: function(productId, delta) {
    const idx = this.state.cart.findIndex(i => i.productId === productId);
    if (idx === -1) return;

    const newQty = this.state.cart[idx].quantity + delta;
    if (newQty <= 0) {
      this.removeCartItem(productId);
      return;
    }

    if (delta > 0 && newQty > this.state.cart[idx].maxStock) {
      alert(`Only ${this.state.cart[idx].maxStock} units of this item are currently in stock.`);
      return;
    }

    this.state.cart[idx].quantity = newQty;
    this.saveCartAndSync();
  },

  removeCartItem: function(productId) {
    this.state.cart = this.state.cart.filter(item => item.productId !== productId);
    this.saveCartAndSync();
  },

  handleCheckout: async function() {
    if (!this.state.token) {
      this.toggleCart(false);
      this.toggleAuthModal(true);
      alert('Please register or log in to complete your checkout purchase.');
      return;
    }

    const shippingAddress = document.getElementById('cart-address').value;
    if (!shippingAddress.trim()) {
      alert('Please enter a shipping address.');
      return;
    }

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          items: this.state.cart,
          shippingAddress
        })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Checkout failed.');

      this.state.cart = [];
      this.saveCartAndSync();
      document.getElementById('cart-address').value = '';
      this.toggleCart(false);
      
      this.showToast('Order placed successfully!');
      this.switchView('orders');
    } catch (err) {
      alert(err.message);
    }
  },

  // Load User Orders history
  loadUserOrders: async function() {
    const tbody = document.getElementById('user-orders-body');
    tbody.innerHTML = '<tr><td colspan="6" class="text-center"><div class="spinner" style="margin:0 auto"></div></td></tr>';

    try {
      const res = await fetch('/api/orders/my-orders', {
        headers: this.getHeaders()
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to load orders.');

      if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center">No orders placed yet.</td></tr>';
        return;
      }

      tbody.innerHTML = data.map(o => `
        <tr>
          <td><span style="font-family:monospace;font-size:0.8rem;color:var(--primary);">${o.id}</span></td>
          <td>${new Date(o.createdAt).toLocaleDateString()}</td>
          <td>
            <ul style="list-style:none;padding:0;font-size:0.85rem;">
              ${o.items.map(item => `<li>${item.name} (x${item.quantity})</li>`).join('')}
            </ul>
          </td>
          <td>${o.shippingAddress}</td>
          <td style="color:var(--accent);font-weight:700;">$${o.totalAmount.toFixed(2)}</td>
          <td>
            <span class="status-badge ${o.status.toLowerCase()}">${o.status}</span>
          </td>
        </tr>
      `).join('');

    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color:var(--danger)">Error loading order history: ${err.message}</td></tr>`;
    }
  },

  // Admin Dashboard Core
  loadAdminDashboard: async function() {
    try {
      const res = await fetch('/api/admin/stats', {
        headers: this.getHeaders()
      });
      const stats = await res.json();

      if (!res.ok) throw new Error(stats.error || 'Failed to load stats.');

      // Load counters
      document.getElementById('stat-sales').innerText = `$${stats.totalSales.toFixed(2)}`;
      document.getElementById('stat-orders').innerText = stats.totalOrders;
      document.getElementById('stat-users').innerText = stats.totalUsers;
      document.getElementById('stat-stock-alert').innerText = stats.lowStockCount;

      // Render Admin Lists
      this.loadAdminOrders();
      this.loadAdminProducts();

    } catch (err) {
      alert(`Admin error: ${err.message}`);
      this.switchView('home');
    }
  },

  loadAdminOrders: async function() {
    const tbody = document.getElementById('admin-orders-body');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Loading orders...</td></tr>';

    try {
      const res = await fetch('/api/admin/orders', {
        headers: this.getHeaders()
      });
      const orders = await res.json();

      if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">No orders found in database.</td></tr>';
        return;
      }

      tbody.innerHTML = orders.map(o => `
        <tr>
          <td><span style="font-family:monospace;font-size:0.8rem;color:var(--primary);">${o.id}</span></td>
          <td>
            <div style="font-weight:600;">${o.customerName}</div>
            <div style="font-size:0.75rem;color:var(--text-muted);">${o.email}</div>
          </td>
          <td>
            <ul style="list-style:none;padding:0;font-size:0.8rem;">
              ${o.items.map(item => `<li>${item.name} (x${item.quantity})</li>`).join('')}
            </ul>
          </td>
          <td style="max-width:180px;font-size:0.8rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${o.shippingAddress}</td>
          <td style="color:var(--accent);font-weight:700;">$${o.totalAmount.toFixed(2)}</td>
          <td>
            <span class="status-badge ${o.status.toLowerCase()}">${o.status}</span>
          </td>
          <td>
            <select class="form-input" style="padding:4px 8px;font-size:0.75rem;" onchange="app.updateOrderStatus('${o.id}', this.value)">
              <option value="Pending" ${o.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="Shipped" ${o.status === 'Shipped' ? 'selected' : ''}>Shipped</option>
              <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
              <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="color:var(--danger)">Error: ${err.message}</td></tr>`;
    }
  },

  updateOrderStatus: async function(orderId, newStatus) {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to update order status.');
      this.showToast('Order status updated.');
      this.loadAdminDashboard();
    } catch (err) {
      alert(err.message);
    }
  },

  loadAdminProducts: async function() {
    const tbody = document.getElementById('admin-products-body');
    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Loading catalog...</td></tr>';

    try {
      const res = await fetch('/api/products');
      const products = await res.json();

      tbody.innerHTML = products.map(p => `
        <tr>
          <td><img src="${p.imageUrl}" class="table-thumb" alt="${p.name}" onerror="this.src='/images/default_product.jpg'"></td>
          <td style="font-weight:600;">${p.name}</td>
          <td>${p.category}</td>
          <td style="color:var(--accent);font-weight:700;">$${p.price.toFixed(2)}</td>
          <td class="${p.stock < 10 ? 'text-warning' : ''}" style="font-weight:600;">${p.stock}</td>
          <td style="max-width:240px;font-size:0.8rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.description}</td>
          <td>
            <div class="admin-actions-cell">
              <button class="btn btn-secondary btn-xs" onclick="app.openProductModal('${p.id}')">Edit</button>
              <button class="btn btn-danger btn-xs" onclick="app.deleteProduct('${p.id}')">Delete</button>
            </div>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="color:var(--danger)">Error: ${err.message}</td></tr>`;
    }
  },

  deleteProduct: async function(productId) {
    if (!confirm('Are you sure you want to delete this product listing from the catalog?')) return;

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to delete product.');
      this.showToast('Product listing deleted.');
      this.loadAdminDashboard();
    } catch (err) {
      alert(err.message);
    }
  },

  toggleProductModal: function(show) {
    const modal = document.getElementById('product-modal');
    document.getElementById('product-error-alert').classList.add('hidden');
    if (show) {
      modal.classList.add('active');
    } else {
      modal.classList.remove('active');
    }
  },

  openProductModal: function(productId = null) {
    const title = document.getElementById('product-modal-title');
    const form = document.getElementById('form-product');
    form.reset();

    if (productId) {
      title.innerText = 'Edit Product Catalog Item';
      document.getElementById('product-id-field').value = productId;
      
      const product = this.state.products.find(p => p.id === productId);
      if (product) {
        document.getElementById('prod-name').value = product.name;
        document.getElementById('prod-category').value = product.category;
        document.getElementById('prod-price').value = product.price;
        document.getElementById('prod-stock').value = product.stock;
        document.getElementById('prod-desc').value = product.description;
        document.getElementById('prod-image').value = product.imageUrl;
      }
    } else {
      title.innerText = 'Add New Product Listing';
      document.getElementById('product-id-field').value = '';
    }

    this.toggleProductModal(true);
  },

  handleProductSubmit: async function(e) {
    e.preventDefault();
    const productId = document.getElementById('product-id-field').value;
    const name = document.getElementById('prod-name').value;
    const category = document.getElementById('prod-category').value;
    const price = Number(document.getElementById('prod-price').value);
    const stock = Number(document.getElementById('prod-stock').value);
    const description = document.getElementById('prod-desc').value;
    const imageUrl = document.getElementById('prod-image').value || undefined;

    const body = { name, category, price, stock, description, imageUrl };
    const method = productId ? 'PUT' : 'POST';
    const url = productId ? `/api/admin/products/${productId}` : '/api/admin/products';

    try {
      const res = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to save product catalog entry.');

      this.toggleProductModal(false);
      this.showToast(productId ? 'Product updated.' : 'Product added to catalog.');
      this.loadAdminDashboard();
    } catch (err) {
      const errorAlert = document.getElementById('product-error-alert');
      errorAlert.innerText = err.message;
      errorAlert.classList.remove('hidden');
    }
  },

  // Toast Notification Flash
  showToast: function(message) {
    const toast = document.getElementById('toast-message');
    toast.innerText = message;
    toast.classList.remove('hidden');
    
    // Clear old timeouts
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    
    this.toastTimeout = setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }
};

// Expose app object globally on window for external scripts (such as FloraBot)
window.app = app;

// Start app on DOM loaded
window.addEventListener('DOMContentLoaded', () => {
  app.init();
});
