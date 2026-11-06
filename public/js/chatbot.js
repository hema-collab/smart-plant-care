/**
 * FloraBot Frontend Module
 * ========================
 * Interactive Multilingual AI Chatbot with CNN Leaf Image Analysis,
 * Voice Recognition, Product Recommendation Cards, and Cart Integration.
 */

window.FloraBot = (function () {
  // Chatbot State
  const state = {
    isOpen: false,
    currentLang: 'en',
    isListening: false,
    recognition: null,
    sessionId: getOrCreateSessionId(),
    messages: []
  };

  // DOM Elements
  let elements = {};

  function getOrCreateSessionId() {
    let id = localStorage.getItem('florabot_session');
    if (!id) {
      id = 'session_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('florabot_session', id);
    }
    return id;
  }

  function init() {
    createChatbotUI();
    bindEvents();
    initSpeechRecognition();
    loadGreeting();
  }

  function createChatbotUI() {
    // 1. Floating Toggle Button
    const toggleBtn = document.createElement('button');
    toggleBtn.id = 'florabot-toggle';
    toggleBtn.className = 'florabot-toggle-btn';
    toggleBtn.setAttribute('aria-label', 'Open AI Assistant');
    toggleBtn.innerHTML = `
      <div class="florabot-toggle-icon">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2a8 8 0 0 0-8 8c0 5.25 7 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <span class="florabot-badge">AI</span>
    `;
    document.body.appendChild(toggleBtn);

    // 2. Chat Widget Window
    const widget = document.createElement('div');
    widget.id = 'florabot-widget';
    widget.className = 'florabot-widget hidden';
    widget.innerHTML = `
      <div class="florabot-header">
        <div class="florabot-brand">
          <div class="florabot-avatar">🤖</div>
          <div>
            <h3 class="florabot-title">FloraBot AI</h3>
            <span class="florabot-status"><span class="status-dot"></span> Online • Multilingual</span>
          </div>
        </div>
        <div class="florabot-header-actions">
          <select id="florabot-lang-select" class="florabot-lang-select" title="Change Language">
            <option value="en">English</option>
            <option value="hi">हिन्दी (Hindi)</option>
            <option value="kn">ಕನ್ನಡ (Kannada)</option>
            <option value="te">తెలుగు (Telugu)</option>
            <option value="ta">தமிழ் (Tamil)</option>
            <option value="ml">മലയാളം (Malayalam)</option>
            <option value="mr">मराठी (Marathi)</option>
          </select>
          <button id="florabot-clear-btn" class="florabot-icon-btn" title="Clear Chat">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
          <button id="florabot-close-btn" class="florabot-icon-btn" title="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Messages Box -->
      <div id="florabot-messages" class="florabot-messages"></div>

      <!-- Suggested Questions Pill Box -->
      <div id="florabot-suggestions" class="florabot-suggestions"></div>

      <!-- Typing Indicator -->
      <div id="florabot-typing" class="florabot-typing hidden">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        <span id="florabot-typing-text">FloraBot is thinking...</span>
      </div>

      <!-- Input Area -->
      <div class="florabot-input-area">
        <input type="file" id="florabot-file-input" accept="image/*" class="hidden" />
        
        <button id="florabot-upload-btn" class="florabot-tool-btn" title="Upload Leaf Photo for CNN Diagnosis">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
            <circle cx="12" cy="13" r="4"></circle>
          </svg>
        </button>

        <button id="florabot-voice-btn" class="florabot-tool-btn" title="Voice Input">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        </button>

        <input type="text" id="florabot-input" class="florabot-input" placeholder="Type or ask a question..." autocomplete="off" />

        <button id="florabot-send-btn" class="florabot-send-btn" title="Send">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </div>
      <div class="florabot-footer">
        Powered by MobileNetV2 CNN & FloraShield Agricultural AI
      </div>
    `;
    document.body.appendChild(widget);

    // Cache elements
    elements = {
      toggleBtn,
      widget,
      messages: document.getElementById('florabot-messages'),
      suggestions: document.getElementById('florabot-suggestions'),
      typing: document.getElementById('florabot-typing'),
      typingText: document.getElementById('florabot-typing-text'),
      input: document.getElementById('florabot-input'),
      sendBtn: document.getElementById('florabot-send-btn'),
      uploadBtn: document.getElementById('florabot-upload-btn'),
      fileInput: document.getElementById('florabot-file-input'),
      voiceBtn: document.getElementById('florabot-voice-btn'),
      langSelect: document.getElementById('florabot-lang-select'),
      clearBtn: document.getElementById('florabot-clear-btn'),
      closeBtn: document.getElementById('florabot-close-btn')
    };
  }

  function bindEvents() {
    elements.toggleBtn.addEventListener('click', toggleChat);
    elements.closeBtn.addEventListener('click', toggleChat);

    elements.sendBtn.addEventListener('click', handleSendMessage);
    elements.input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleSendMessage();
    });

    elements.uploadBtn.addEventListener('click', () => elements.fileInput.click());
    elements.fileInput.addEventListener('change', handleImageUpload);

    elements.voiceBtn.addEventListener('click', toggleVoiceRecognition);

    elements.langSelect.addEventListener('change', (e) => {
      state.currentLang = e.target.value;
      sendBotMessage(`Switched language to ${getLangName(state.currentLang)}. How can I assist you?`, []);
      loadSuggestionsForLang(state.currentLang);
    });

    elements.clearBtn.addEventListener('click', clearChat);

    // Global Event Delegation for Chat Add to Cart Buttons
    document.addEventListener('click', async (e) => {
      const btn = e.target.closest('.chat-add-cart-btn');
      if (btn) {
        e.preventDefault();
        e.stopPropagation();
        
        const rawId = btn.getAttribute('data-id') || btn.dataset.id;
        const pId = (rawId && rawId !== 'undefined' && rawId !== 'null') ? rawId : null;
        const pName = btn.getAttribute('data-name') || btn.dataset.name;
        const pPrice = parseFloat(btn.getAttribute('data-price') || btn.dataset.price) || 0;
        const pImage = btn.getAttribute('data-image') || btn.dataset.image;

        // Instant visual feedback on button
        const origText = btn.innerText;
        btn.innerText = '✓ Added!';
        btn.style.background = '#059669';
        btn.style.color = '#ffffff';
        setTimeout(() => {
          btn.innerText = origText;
          btn.style.background = '';
          btn.style.color = '';
        }, 1500);

        const appObj = window.app || (typeof app !== 'undefined' ? app : null);
        if (appObj && appObj.addToCart) {
          if (pName) {
            await appObj.addToCart({
              id: pId || pName,
              name: pName,
              price: pPrice,
              imageUrl: pImage || '/images/neem_oil.jpg',
              stock: 50
            });
          } else if (pId) {
            await appObj.addToCart(pId);
          }
          if (appObj.toggleCart) {
            appObj.toggleCart(true); // Open sliding cart drawer
          }
        }
      }
    });
  }

  function toggleChat() {
    state.isOpen = !state.isOpen;
    if (state.isOpen) {
      elements.widget.classList.remove('hidden');
      elements.widget.classList.add('active');
      elements.input.focus();
    } else {
      elements.widget.classList.remove('active');
      elements.widget.classList.add('hidden');
    }
  }

  function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      state.recognition = new SpeechRecognition();
      state.recognition.continuous = false;
      state.recognition.interimResults = false;

      state.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        elements.input.value = transcript;
        stopVoiceRecognition();
        handleSendMessage();
      };

      state.recognition.onerror = () => {
        stopVoiceRecognition();
      };

      state.recognition.onend = () => {
        stopVoiceRecognition();
      };
    } else {
      elements.voiceBtn.style.display = 'none'; // Hide if browser doesn't support
    }
  }

  function toggleVoiceRecognition() {
    if (!state.recognition) return;
    if (state.isListening) {
      stopVoiceRecognition();
    } else {
      startVoiceRecognition();
    }
  }

  function startVoiceRecognition() {
    if (!state.recognition) return;
    state.isListening = true;
    elements.voiceBtn.classList.add('listening');
    
    // Set speech language code
    const langMap = {
      en: 'en-US', hi: 'hi-IN', kn: 'kn-IN', te: 'te-IN',
      ta: 'ta-IN', ml: 'ml-IN', mr: 'mr-IN'
    };
    state.recognition.lang = langMap[state.currentLang] || 'en-US';
    state.recognition.start();
  }

  function stopVoiceRecognition() {
    state.isListening = false;
    elements.voiceBtn.classList.remove('listening');
    if (state.recognition) {
      try { state.recognition.stop(); } catch(e) {}
    }
  }

  function loadGreeting() {
    fetch(`/api/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '', lang: state.currentLang, sessionId: state.sessionId })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        addMessage(data.text, 'bot', data.products, data.suggestions);
      }
    })
    .catch(() => {
      addMessage("🌿 Hello! I'm FloraBot. How can I help you with your plant care today?", 'bot', [], [
        "Upload leaf photo for CNN diagnosis",
        "Which fertilizer for tomato?",
        "How to control aphids?"
      ]);
    });
  }

  function handleSendMessage() {
    const text = elements.input.value.trim();
    if (!text) return;

    // Add User Message
    addMessage(text, 'user');
    elements.input.value = '';
    showTyping(true, "FloraBot is thinking...");

    // Send to backend API
    const userId = window.app && window.app.state.user ? window.app.state.user.id : null;

    fetch('/api/chatbot/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        lang: state.currentLang,
        userId,
        sessionId: state.sessionId
      })
    })
    .then(res => res.json())
    .then(data => {
      showTyping(false);
      if (data.success) {
        addMessage(data.text, 'bot', data.products, data.suggestions);
      } else {
        addMessage("Sorry, I encountered an issue. Please try again.", 'bot');
      }
    })
    .catch(() => {
      showTyping(false);
      addMessage("Network error. Please check your connection.", 'bot');
    });
  }

  function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Show image preview message from user
    const reader = new FileReader();
    reader.onload = function (evt) {
      addMessage(`<img src="${evt.target.result}" class="chat-img-preview" /> Leaf uploaded for analysis`, 'user');
    };
    reader.readAsDataURL(file);

    showTyping(true, "🧠 Analyzing leaf image with MobileNetV2 CNN...");

    const formData = new FormData();
    formData.append('image', file);
    formData.append('lang', state.currentLang);
    formData.append('sessionId', state.sessionId);
    if (window.app && window.app.state.user) {
      formData.append('userId', window.app.state.user.id);
    }

    fetch('/api/chatbot/upload-image', {
      method: 'POST',
      body: formData
    })
    .then(res => res.json())
    .then(data => {
      showTyping(false);
      if (data.success) {
        addMessage(data.text, 'bot', data.products, data.suggestions);
      } else {
        addMessage("⚠️ " + (data.error || "Failed to analyze image."), 'bot');
      }
    })
    .catch((err) => {
      showTyping(false);
      console.error("Chatbot upload error:", err);
      addMessage("⚠️ Network error. Please try uploading the image again.", 'bot');
    });

    elements.fileInput.value = '';
  }

  function addMessage(text, sender, products = [], suggestions = []) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `florabot-msg ${sender}`;

    const formattedText = formatMarkdown(text);
    
    msgDiv.innerHTML = `
      <div class="msg-bubble">
        <div class="msg-content">${formattedText}</div>
        ${renderProductCards(products)}
        <div class="msg-time">${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    `;

    elements.messages.appendChild(msgDiv);
    elements.messages.scrollTop = elements.messages.scrollHeight;

    // Render suggestions pills
    renderSuggestions(suggestions);
  }

  function renderProductCards(products) {
    if (!products || products.length === 0) return '';

    return `
      <div class="chat-products-container">
        <div class="chat-products-title">🛒 Recommended Store Products & E-Commerce Apps:</div>
        <div class="chat-products-grid">
          ${products.map(p => {
            const appObj = window.app || (typeof app !== 'undefined' ? app : null);
            const storeBadges = (appObj && appObj.getStoreBadgesHTML) 
              ? appObj.getStoreBadgesHTML(p) 
              : '';

            const safeName = (p.name || '').replace(/"/g, '&quot;');
            return `
              <div class="chat-product-card" style="flex-direction:column;align-items:stretch;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <img src="${p.imageUrl || '/images/neem_oil.jpg'}" alt="${safeName}" class="chat-prod-img" onerror="this.src='/images/neem_oil.jpg'" />
                  <div class="chat-prod-info">
                    <div class="chat-prod-name">${p.name}</div>
                    <div class="chat-prod-cat">${p.category}</div>
                    <div class="chat-prod-price">$${p.price.toFixed(2)}</div>
                  </div>
                  <button class="chat-add-cart-btn" 
                          data-id="${p.id}" 
                          data-name="${safeName}" 
                          data-price="${p.price}" 
                          data-image="${p.imageUrl || '/images/neem_oil.jpg'}">+ Add to Cart</button>
                </div>
                ${storeBadges}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  function renderSuggestions(suggestions) {
    if (!suggestions || suggestions.length === 0) {
      elements.suggestions.innerHTML = '';
      return;
    }

    elements.suggestions.innerHTML = suggestions.map(s => `
      <button class="suggestion-pill">${s}</button>
    `).join('');

    elements.suggestions.querySelectorAll('.suggestion-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        elements.input.value = btn.innerText;
        handleSendMessage();
      });
    });
  }

  function showTyping(show, text = "FloraBot is thinking...") {
    if (show) {
      elements.typingText.innerText = text;
      elements.typing.classList.remove('hidden');
      elements.messages.scrollTop = elements.messages.scrollHeight;
    } else {
      elements.typing.classList.add('hidden');
    }
  }

  function clearChat() {
    if (confirm("Clear chat history?")) {
      elements.messages.innerHTML = '';
      fetch('/api/chatbot/clear-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: state.sessionId })
      });
      loadGreeting();
    }
  }

  function formatMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>')
      .replace(/• /g, '•&nbsp;');
  }

  function getLangName(code) {
    const names = { en: 'English', hi: 'Hindi', kn: 'Kannada', te: 'Telugu', ta: 'Tamil', ml: 'Malayalam', mr: 'Marathi' };
    return names[code] || 'English';
  }

  function sendBotMessage(text, suggestions = []) {
    addMessage(text, 'bot', [], suggestions);
  }

  function loadSuggestionsForLang(lang) {
    // Reload prompt for current lang
    fetch(`/api/chatbot/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '', lang: lang, sessionId: state.sessionId })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        renderSuggestions(data.suggestions);
      }
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    toggle: toggleChat,
    open: () => { if (!state.isOpen) toggleChat(); },
    close: () => { if (state.isOpen) toggleChat(); }
  };
})();
