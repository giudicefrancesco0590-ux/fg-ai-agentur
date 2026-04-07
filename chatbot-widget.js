/*!
 * FG AI Agentur — KI-Chatbot Widget
 * Lead-Qualifizierung + ElevenLabs Voice
 */
(function () {
  'use strict';

  const API_BASE = 'https://fg-chatbot-api.vercel.app';
  const CHAT_ENDPOINT = `${API_BASE}/api/chat`;
  const SPEAK_ENDPOINT = `${API_BASE}/api/speak`;

  // ─── State ───────────────────────────────────────────────────────────────
  let history = [];
  let leadData = {};
  let isOpen = false;
  let isThinking = false;
  let isSpeaking = false;
  let isListening = false;
  let audioObj = null;
  let recognition = null;
  let ttsEnabled = true;
  let ttsChecked = false;

  // ─── Styles ──────────────────────────────────────────────────────────────
  const css = `
    #fg-chat-widget * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', system-ui, sans-serif; }

    #fg-chat-btn {
      position: fixed;
      bottom: 28px;
      right: 28px;
      z-index: 99998;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0099ff, #00ccff);
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 24px rgba(0,153,255,0.4), 0 0 0 0 rgba(0,153,255,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      animation: fg-pulse 2.5s ease infinite;
    }
    #fg-chat-btn:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 32px rgba(0,153,255,0.55);
    }
    #fg-chat-btn svg { width: 26px; height: 26px; color: #fff; transition: opacity 0.2s; }
    #fg-chat-btn.open svg.icon-chat { display: none; }
    #fg-chat-btn.open svg.icon-close { display: block !important; }

    #fg-chat-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      background: #ff3b5c;
      border: 2px solid #000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      color: #fff;
      font-weight: 700;
    }

    @keyframes fg-pulse {
      0%, 100% { box-shadow: 0 4px 24px rgba(0,153,255,0.4), 0 0 0 0 rgba(0,153,255,0.3); }
      50% { box-shadow: 0 4px 24px rgba(0,153,255,0.4), 0 0 0 10px rgba(0,153,255,0); }
    }

    #fg-chat-window {
      position: fixed;
      bottom: 100px;
      right: 28px;
      z-index: 99997;
      width: 380px;
      max-height: 600px;
      border-radius: 20px;
      background: #0a0a0a;
      border: 1px solid rgba(0,153,255,0.2);
      box-shadow: 0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transform: translateY(20px) scale(0.95);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease;
    }
    #fg-chat-window.open {
      transform: translateY(0) scale(1);
      opacity: 1;
      pointer-events: auto;
    }

    /* Header */
    #fg-chat-header {
      background: linear-gradient(135deg, rgba(0,153,255,0.15), rgba(0,204,255,0.08));
      border-bottom: 1px solid rgba(0,153,255,0.15);
      padding: 16px 18px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    #fg-chat-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0099ff, #00ccff);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      position: relative;
    }
    #fg-chat-avatar svg { width: 20px; height: 20px; color: #fff; }
    #fg-chat-status-dot {
      position: absolute;
      bottom: 1px;
      right: 1px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #22c55e;
      border: 2px solid #0a0a0a;
    }
    #fg-chat-header-info { flex: 1; }
    #fg-chat-header-name { font-size: 14px; font-weight: 700; color: #fff; }
    #fg-chat-header-sub { font-size: 11px; color: rgba(0,153,255,0.8); margin-top: 1px; }
    #fg-chat-tts-btn {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.15s;
      color: rgba(255,255,255,0.4);
    }
    #fg-chat-tts-btn:hover { background: rgba(0,153,255,0.15); color: #0099ff; }
    #fg-chat-tts-btn.active { color: #0099ff; background: rgba(0,153,255,0.1); }
    #fg-chat-tts-btn svg { width: 16px; height: 16px; }

    /* Messages */
    #fg-chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      scrollbar-width: thin;
      scrollbar-color: rgba(0,153,255,0.2) transparent;
    }
    #fg-chat-messages::-webkit-scrollbar { width: 3px; }
    #fg-chat-messages::-webkit-scrollbar-thumb { background: rgba(0,153,255,0.3); border-radius: 99px; }

    .fg-msg {
      display: flex;
      gap: 8px;
      align-items: flex-end;
      animation: fg-msg-in 0.2s ease;
    }
    .fg-msg.user { flex-direction: row-reverse; }
    @keyframes fg-msg-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

    .fg-msg-bubble {
      max-width: 82%;
      padding: 10px 14px;
      border-radius: 16px;
      font-size: 13.5px;
      line-height: 1.55;
      word-break: break-word;
    }
    .fg-msg.bot .fg-msg-bubble {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.07);
      color: rgba(255,255,255,0.88);
      border-bottom-left-radius: 4px;
    }
    .fg-msg.user .fg-msg-bubble {
      background: linear-gradient(135deg, #0077cc, #0099ff);
      color: #fff;
      border-bottom-right-radius: 4px;
    }

    /* Links in bot messages */
    .fg-msg.bot .fg-msg-bubble a {
      color: #0099ff;
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    /* Thinking dots */
    #fg-thinking {
      display: none;
      gap: 4px;
      padding: 12px 14px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 16px;
      border-bottom-left-radius: 4px;
      width: fit-content;
    }
    #fg-thinking.show { display: flex; }
    .fg-dot {
      width: 6px; height: 6px;
      border-radius: 50%;
      background: rgba(0,153,255,0.6);
      animation: fg-bounce 1.2s ease infinite;
    }
    .fg-dot:nth-child(2) { animation-delay: 0.2s; }
    .fg-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes fg-bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-5px); } }

    /* Speaking indicator */
    #fg-speaking-bar {
      display: none;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(0,153,255,0.08);
      border-top: 1px solid rgba(0,153,255,0.1);
      font-size: 12px;
      color: rgba(0,153,255,0.8);
    }
    #fg-speaking-bar.show { display: flex; }
    .fg-wave { display: flex; gap: 2px; align-items: center; height: 14px; }
    .fg-wave span {
      display: block; width: 2px; border-radius: 99px;
      background: #0099ff;
      animation: fg-wave-anim 0.8s ease infinite;
    }
    .fg-wave span:nth-child(1) { animation-delay: 0s; height: 4px; }
    .fg-wave span:nth-child(2) { animation-delay: 0.1s; height: 10px; }
    .fg-wave span:nth-child(3) { animation-delay: 0.2s; height: 14px; }
    .fg-wave span:nth-child(4) { animation-delay: 0.3s; height: 10px; }
    .fg-wave span:nth-child(5) { animation-delay: 0.4s; height: 4px; }
    @keyframes fg-wave-anim { 0%,100% { transform: scaleY(0.4); } 50% { transform: scaleY(1); } }
    #fg-stop-speak {
      margin-left: auto; font-size: 11px; color: rgba(255,255,255,0.3);
      cursor: pointer; background: none; border: none; padding: 2px 6px;
      border-radius: 4px; transition: color 0.15s;
    }
    #fg-stop-speak:hover { color: rgba(255,255,255,0.6); }

    /* Input area */
    #fg-chat-input-area {
      padding: 12px 14px;
      border-top: 1px solid rgba(255,255,255,0.06);
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }
    #fg-chat-input {
      flex: 1;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px;
      padding: 10px 14px;
      font-size: 13.5px;
      color: #fff;
      resize: none;
      outline: none;
      line-height: 1.4;
      max-height: 120px;
      transition: border-color 0.15s;
      font-family: 'Inter', system-ui, sans-serif;
    }
    #fg-chat-input::placeholder { color: rgba(255,255,255,0.25); }
    #fg-chat-input:focus { border-color: rgba(0,153,255,0.4); }

    .fg-icon-btn {
      width: 38px; height: 38px;
      border-radius: 10px;
      border: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.05);
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.15s, border-color 0.15s;
      flex-shrink: 0;
    }
    .fg-icon-btn:hover { background: rgba(0,153,255,0.15); border-color: rgba(0,153,255,0.3); }
    .fg-icon-btn.mic-active { background: rgba(255,59,92,0.15); border-color: rgba(255,59,92,0.4); animation: fg-pulse-red 1s ease infinite; }
    .fg-icon-btn svg { width: 17px; height: 17px; color: rgba(255,255,255,0.5); }
    .fg-icon-btn:hover svg { color: #0099ff; }
    .fg-icon-btn.mic-active svg { color: #ff3b5c; }
    @keyframes fg-pulse-red { 0%,100% { box-shadow: 0 0 0 0 rgba(255,59,92,0.3); } 50% { box-shadow: 0 0 0 6px rgba(255,59,92,0); } }

    #fg-send-btn {
      width: 38px; height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, #0077cc, #0099ff);
      border: none;
      cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: opacity 0.15s, transform 0.1s;
      flex-shrink: 0;
      box-shadow: 0 2px 12px rgba(0,153,255,0.3);
    }
    #fg-send-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    #fg-send-btn:not(:disabled):hover { opacity: 0.9; transform: scale(1.05); }
    #fg-send-btn svg { width: 17px; height: 17px; color: #fff; }

    /* Calendly CTA */
    .fg-cta-btn {
      display: inline-flex; align-items: center; gap: 6px;
      background: linear-gradient(135deg, #0077cc, #0099ff);
      color: #fff; border: none; border-radius: 8px;
      padding: 8px 14px; font-size: 12.5px; font-weight: 600;
      cursor: pointer; margin-top: 8px; text-decoration: none;
      transition: opacity 0.15s;
    }
    .fg-cta-btn:hover { opacity: 0.88; }

    /* Quick replies */
    #fg-quick-replies {
      display: flex; gap: 6px; flex-wrap: wrap; padding: 0 14px 10px;
    }
    .fg-quick {
      font-size: 12px; padding: 5px 11px;
      background: rgba(0,153,255,0.08);
      border: 1px solid rgba(0,153,255,0.2);
      border-radius: 99px; color: rgba(0,153,255,0.9);
      cursor: pointer; transition: background 0.15s;
      white-space: nowrap;
    }
    .fg-quick:hover { background: rgba(0,153,255,0.15); }

    @media (max-width: 440px) {
      #fg-chat-btn { right: 16px; bottom: 20px; }

      /* Vollbild auf Mobile — kein Verrutschen bei Tastatur */
      #fg-chat-window {
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100% !important;
        max-height: 100% !important;
        border-radius: 0 !important;
        transform-origin: bottom center;
      }

      /* Input-Bereich: Abstand für Home-Indicator (iPhone) */
      #fg-chat-input-area {
        padding-bottom: max(12px, env(safe-area-inset-bottom, 12px));
      }

      /* 16px verhindert Auto-Zoom auf iOS beim Tippen */
      #fg-chat-input { font-size: 16px !important; }

      /* Touch-Scrolling für Nachrichten */
      #fg-chat-messages { -webkit-overflow-scrolling: touch; }

      /* Header: Safe-Area oben (Notch) */
      #fg-chat-header {
        padding-top: max(16px, env(safe-area-inset-top, 16px));
      }
    }
  `;

  // ─── SVG Icons ────────────────────────────────────────────────────────────
  const ICON_BOT = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2M20 14h2M15 13v2M9 13v2"/></svg>`;
  const ICON_CLOSE = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  const ICON_SEND = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
  const ICON_MIC = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`;
  const ICON_MIC_OFF = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`;
  const ICON_VOLUME = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
  const ICON_VOLUME_OFF = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`;

  // ─── Build HTML ───────────────────────────────────────────────────────────
  function buildWidget() {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);

    const wrapper = document.createElement('div');
    wrapper.id = 'fg-chat-widget';
    wrapper.innerHTML = `
      <!-- Toggle Button -->
      <button id="fg-chat-btn" aria-label="Chat öffnen" title="KI-Assistent öffnen">
        <span id="fg-chat-badge">1</span>
        <svg class="icon-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        <svg class="icon-close" style="display:none" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>

      <!-- Chat Window -->
      <div id="fg-chat-window" role="dialog" aria-label="FG AI Agentur Chatbot" aria-live="polite">
        <div id="fg-chat-header">
          <div id="fg-chat-avatar">
            ${ICON_BOT}
            <div id="fg-chat-status-dot"></div>
          </div>
          <div id="fg-chat-header-info">
            <div id="fg-chat-header-name">FG KI-Assistent</div>
            <div id="fg-chat-header-sub">Online · Antwortet sofort</div>
          </div>
          <button id="fg-chat-tts-btn" title="Sprache ein/aus" aria-label="Sprache umschalten">
            ${ICON_VOLUME}
          </button>
        </div>

        <div id="fg-chat-messages">
          <div id="fg-thinking" role="status" aria-label="Assistent tippt">
            <div class="fg-dot"></div>
            <div class="fg-dot"></div>
            <div class="fg-dot"></div>
          </div>
        </div>

        <div id="fg-quick-replies"></div>

        <div id="fg-speaking-bar">
          <div class="fg-wave">
            <span></span><span></span><span></span><span></span><span></span>
          </div>
          <span style="margin-left:6px;">KI-Assistent spricht...</span>
          <button id="fg-stop-speak">Stop</button>
        </div>

        <div id="fg-chat-input-area">
          <textarea
            id="fg-chat-input"
            placeholder="Nachricht schreiben..."
            rows="1"
            aria-label="Nachricht eingeben"
          ></textarea>
          <button class="fg-icon-btn" id="fg-mic-btn" title="Spracheingabe" aria-label="Spracheingabe starten">
            ${ICON_MIC}
          </button>
          <button id="fg-send-btn" disabled title="Senden" aria-label="Nachricht senden">
            ${ICON_SEND}
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(wrapper);
  }

  // ─── UI helpers ───────────────────────────────────────────────────────────
  function getEl(id) { return document.getElementById(id); }

  function addMessage(role, text) {
    const container = getEl('fg-chat-messages');
    const thinking = getEl('fg-thinking');

    // Parse links & line breaks
    const safe = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    const div = document.createElement('div');
    div.className = `fg-msg ${role}`;
    div.innerHTML = `<div class="fg-msg-bubble">${safe}</div>`;

    // Insert before thinking indicator
    container.insertBefore(div, thinking);
    container.scrollTop = container.scrollHeight;

    // Show Calendly CTA if message contains the link
    if (role === 'bot' && text.includes('calendly.com')) {
      const bubble = div.querySelector('.fg-msg-bubble');
      const cta = document.createElement('a');
      cta.href = 'https://calendly.com/giudicefrancesco0590/30min';
      cta.target = '_blank';
      cta.rel = 'noopener';
      cta.className = 'fg-cta-btn';
      cta.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Jetzt Termin buchen`;
      bubble.appendChild(cta);
    }

    history.push({ role: role === 'bot' ? 'assistant' : 'user', content: text });
    extractLeadData(role, text);
  }

  function extractLeadData(role, text) {
    if (role !== 'user') return;
    const t = text.toLowerCase();
    // Very basic extraction — the AI does the real qualification
    if (!leadData.name) {
      const nameMatch = text.match(/(?:ich bin|ich heiße|mein name ist|ich|bin)\s+([A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)?)/);
      if (nameMatch) leadData.name = nameMatch[1];
    }
    if (!leadData.industry) {
      const industries = { restaurant: 'Gastronomie', handwerk: 'Handwerk', coach: 'Coaching', immobilien: 'Immobilien', arzt: 'Medizin', dienstleist: 'Dienstleistung' };
      for (const [k, v] of Object.entries(industries)) {
        if (t.includes(k)) { leadData.industry = v; break; }
      }
    }
  }

  function setThinking(on) {
    isThinking = on;
    const t = getEl('fg-thinking');
    t.classList.toggle('show', on);
    if (on) getEl('fg-chat-messages').scrollTop = getEl('fg-chat-messages').scrollHeight;
    getEl('fg-send-btn').disabled = on || !getEl('fg-chat-input').value.trim();
  }

  function setQuickReplies(replies) {
    const container = getEl('fg-quick-replies');
    container.innerHTML = '';
    if (!replies || replies.length === 0) return;
    replies.forEach(r => {
      const btn = document.createElement('button');
      btn.className = 'fg-quick';
      btn.textContent = r;
      btn.onclick = () => { container.innerHTML = ''; send(r); };
      container.appendChild(btn);
    });
  }

  // ─── TTS (ElevenLabs + fallback) ─────────────────────────────────────────
  const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
  let iosAudioUnlocked = false;
  let audioCtx = null;
  let audioSource = null;

  // iOS: Audio-Kontext beim ersten Tap entsperren
  function unlockIOSAudio() {
    if (!isIOS || iosAudioUnlocked) return;
    iosAudioUnlocked = true;
    // AudioContext erstellen & entsperren (ermöglicht ElevenLabs auf iOS)
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) { audioCtx = null; }
    // SpeechSynthesis ebenfalls entsperren (als Fallback)
    if (window.speechSynthesis) {
      const u = new SpeechSynthesisUtterance('');
      window.speechSynthesis.speak(u);
      window.speechSynthesis.cancel();
    }
  }

  async function speak(text) {
    if (!ttsEnabled) return;
    stopSpeaking();

    const clean = text
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/\*\*/g, '')
      .replace(/<[^>]+>/g, '')
      .trim()
      .slice(0, 500);

    if (!clean) return;

    getEl('fg-speaking-bar').classList.add('show');
    isSpeaking = true;

    // iOS: SpeechSynthesis sofort starten (braucht synchronen Gesture-Kontext),
    // gleichzeitig ElevenLabs via AudioContext im Hintergrund laden und übernehmen
    if (isIOS) {
      speakBrowser(clean); // sofort starten — kein await davor!
      if (iosAudioUnlocked && audioCtx) {
        (async () => {
          try {
            const res = await fetch(SPEAK_ENDPOINT, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: clean }),
            });
            if (res.ok && isSpeaking) {
              const buffer = await res.arrayBuffer();
              if (buffer.byteLength > 0 && isSpeaking) {
                if (audioCtx.state === 'suspended') await audioCtx.resume();
                const decoded = await audioCtx.decodeAudioData(buffer);
                // SpeechSynthesis durch ElevenLabs ersetzen
                window.speechSynthesis && window.speechSynthesis.cancel();
                if (audioSource) { try { audioSource.stop(); } catch {} }
                audioSource = audioCtx.createBufferSource();
                audioSource.buffer = decoded;
                audioSource.connect(audioCtx.destination);
                audioSource.onended = stopSpeaking;
                audioSource.start(0);
              }
            }
          } catch { /* SpeechSynthesis läuft weiter als Fallback */ }
        })();
      }
      return;
    }

    // Desktop/Android: ElevenLabs zuerst
    if (!ttsChecked || ttsEnabled !== 'browser') {
      try {
        const res = await fetch(SPEAK_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: clean }),
        });

        if (res.ok) {
          ttsChecked = true;
          const blob = await res.blob();
          if (blob.size > 0) {
            const url = URL.createObjectURL(blob);
            audioObj = new Audio(url);
            audioObj.onended = () => { stopSpeaking(); URL.revokeObjectURL(url); };
            audioObj.onerror = () => { stopSpeaking(); speakBrowser(clean); };
            try { await audioObj.play(); return; } catch { speakBrowser(clean); return; }
          }
        }
      } catch { /* fallback */ }
      ttsEnabled = 'browser';
    }

    speakBrowser(clean);
  }

  function speakBrowser(text) {
    if (!window.speechSynthesis) { stopSpeaking(); return; }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'de-DE';
    utter.rate = 1.0;
    // Voices laden (iOS braucht manchmal einen Moment)
    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const de = voices.find(v => v.lang.startsWith('de'));
      if (de) utter.voice = de;
      utter.onend = stopSpeaking;
      utter.onerror = stopSpeaking;
      window.speechSynthesis.speak(utter);
    };
    if (window.speechSynthesis.getVoices().length > 0) {
      trySpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = trySpeak;
    }
  }

  function stopSpeaking() {
    if (audioObj) { audioObj.pause(); audioObj = null; }
    if (audioSource) { try { audioSource.stop(); } catch {} audioSource = null; }
    window.speechSynthesis && window.speechSynthesis.cancel();
    isSpeaking = false;
    getEl('fg-speaking-bar').classList.remove('show');
  }

  // ─── Speech Recognition ────────────────────────────────────────────────────
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  function showToast(msg) {
    const t = document.createElement('div');
    t.style.cssText = 'position:fixed;bottom:110px;right:28px;background:rgba(30,30,30,0.95);color:#fff;font-size:12.5px;padding:9px 14px;border-radius:10px;z-index:999999;max-width:260px;border:1px solid rgba(255,255,255,0.1);pointer-events:none;opacity:1;transition:opacity 0.4s;';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 400); }, 2800);
  }

  function startListening() {
    if (!SR) { showToast('Spracheingabe wird auf diesem Gerät nicht unterstützt.'); return; }
    recognition = new SR();
    recognition.lang = 'de-DE';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = e => {
      const t = e.results[0]?.[0]?.transcript?.trim();
      if (t) {
        getEl('fg-chat-input').value = t;
        updateSendBtn();
        // Auto-send after voice input
        setTimeout(() => { if (getEl('fg-chat-input').value.trim()) send(getEl('fg-chat-input').value.trim()); }, 300);
      }
    };
    recognition.onerror = e => {
      if (e.error === 'not-allowed') showToast('Mikrofon-Zugriff verweigert. Bitte in den Browser-Einstellungen erlauben.');
      else if (e.error === 'no-speech') showToast('Kein Ton erkannt. Bitte nochmal versuchen.');
      stopListening();
    };
    recognition.onend = () => stopListening();
    try {
      recognition.start();
      isListening = true;
      const btn = getEl('fg-mic-btn');
      btn.classList.add('mic-active');
      btn.innerHTML = ICON_MIC_OFF;
      btn.title = 'Aufnahme stoppen';
    } catch { stopListening(); }
  }

  function stopListening() {
    try { recognition && recognition.stop(); } catch { /* ignore */ }
    isListening = false;
    const btn = getEl('fg-mic-btn');
    btn.classList.remove('mic-active');
    btn.innerHTML = ICON_MIC;
    btn.title = 'Spracheingabe';
  }

  // ─── Send message ─────────────────────────────────────────────────────────
  async function send(text) {
    if (!text || isThinking) return;
    setQuickReplies([]);
    addMessage('user', text);
    getEl('fg-chat-input').value = '';
    getEl('fg-chat-input').style.height = '';
    updateSendBtn();
    setThinking(true);

    const payload = JSON.stringify({
      message: text,
      history: history.slice(-20).slice(0, -1),
      leadData,
    });

    let reply = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15000);
        const res = await fetch(CHAT_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        reply = data.text || null;
        if (reply) break;
      } catch (err) {
        if (attempt < 2) {
          await new Promise(r => setTimeout(r, 1500));
          continue;
        }
      }
    }

    setThinking(false);
    if (reply) {
      addMessage('bot', reply);
      if (ttsEnabled) speak(reply);
      suggestQuickReplies(reply);
    } else {
      addMessage('bot', 'Kurze Verbindungspause — bitte nochmal senden. 🔄');
    }
  }

  function suggestQuickReplies(botText) {
    const t = botText.toLowerCase();
    if (t.includes('erstgespräch') || t.includes('calendly') || t.includes('termin')) {
      setQuickReplies(['Jetzt Termin buchen', 'Mehr erfahren', 'Danke!']);
    } else if (t.includes('branche') || t.includes('bereich') || t.includes('unternehmen')) {
      setQuickReplies(['Restaurant', 'Handwerksbetrieb', 'Dienstleistung', 'Anderes']);
    } else if (t.includes('welche leistung') || t.includes('was brauchen')) {
      setQuickReplies(['KI-Chatbot', 'Voice Agent', 'Website', 'Alles zusammen']);
    } else if (history.length <= 2) {
      setQuickReplies(['Was kostet ein Chatbot?', 'Wie funktioniert ein Voice Agent?', 'Beispiele zeigen']);
    }
  }

  function updateSendBtn() {
    getEl('fg-send-btn').disabled = isThinking || !getEl('fg-chat-input').value.trim();
  }

  // ─── Toggle chat ──────────────────────────────────────────────────────────
  function toggleChat(autoOpen = false) {
    isOpen = !isOpen;
    const win = getEl('fg-chat-window');
    const btn = getEl('fg-chat-btn');
    const badge = getEl('fg-chat-badge');

    win.classList.toggle('open', isOpen);
    btn.classList.toggle('open', isOpen);

    if (isOpen) {
      badge.style.display = 'none';
      // Kein auto-focus bei automatischem Öffnen (würde Tastatur auf Mobile triggern)
      if (!autoOpen) setTimeout(() => getEl('fg-chat-input').focus(), 300);
    } else {
      // Inline-Styles vom Tastatur-Handling zurücksetzen
      win.style.height = '';
      win.style.top = '';
    }
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  function init() {
    buildWidget();

    // iOS Audio beim ersten Tap entsperren
    document.addEventListener('touchstart', unlockIOSAudio, { once: true, passive: true });
    document.addEventListener('click', unlockIOSAudio, { once: true, passive: true });

    // Toggle button
    getEl('fg-chat-btn').onclick = toggleChat;

    // TTS toggle
    getEl('fg-chat-tts-btn').onclick = () => {
      ttsEnabled = !ttsEnabled;
      const btn = getEl('fg-chat-tts-btn');
      btn.classList.toggle('active', !!ttsEnabled);
      btn.innerHTML = ttsEnabled ? ICON_VOLUME : ICON_VOLUME_OFF;
      if (!ttsEnabled) stopSpeaking();
    };

    // Stop speaking
    getEl('fg-stop-speak').onclick = stopSpeaking;

    // Mic — verstecken wenn nicht unterstützt (z.B. iOS Safari)
    const micBtn = getEl('fg-mic-btn');
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!SR) {
      micBtn.style.display = 'none';
      // iOS-Hinweis im Input-Placeholder
      if (isIOS) {
        getEl('fg-chat-input').placeholder = 'Schreiben oder Tastatur-Diktat nutzen 🎤';
      }
    } else {
      micBtn.onclick = () => { isListening ? stopListening() : startListening(); };
    }

    // Send button
    getEl('fg-send-btn').onclick = () => {
      const val = getEl('fg-chat-input').value.trim();
      if (val) send(val);
    };

    // Input
    const input = getEl('fg-chat-input');
    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      updateSendBtn();
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const val = input.value.trim();
        if (val && !isThinking) send(val);
      }
    });

    // Mobile: Tastatur-Handling via VisualViewport API
    // Wenn Tastatur aufgeht, Fenster auf verbleibende Höhe anpassen
    if (window.visualViewport) {
      const onViewportChange = () => {
        if (!isOpen || window.innerWidth > 440) return;
        const win = getEl('fg-chat-window');
        const vvh = Math.round(window.visualViewport.height);
        const vvTop = Math.round(window.visualViewport.offsetTop);
        win.style.height = vvh + 'px';
        win.style.top = vvTop + 'px';
        // Nachrichten nach unten scrollen wenn Tastatur erscheint
        const msgs = getEl('fg-chat-messages');
        setTimeout(() => { msgs.scrollTop = msgs.scrollHeight; }, 50);
      };
      window.visualViewport.addEventListener('resize', onViewportChange);
      window.visualViewport.addEventListener('scroll', onViewportChange);
    }

    // Welcome message + auto-open nach 2 Sekunden
    setTimeout(() => {
      addMessage('bot', 'Hallo! 👋 Ich bin der KI-Assistent von **FG AI Agentur**.\n\nWir entwickeln KI-Chatbots, Voice Agents und Websites — alles, was Ihr Unternehmen automatisiert und mehr Kunden gewinnt.\n\nWie kann ich Ihnen helfen?');
      setQuickReplies(['Was kostet ein Chatbot?', 'Wie funktioniert das?', 'Termin buchen']);
    }, 600);

    // Chat automatisch öffnen
    setTimeout(() => {
      if (!isOpen) toggleChat(true);
    }, 2000);
  }

  // Start when DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
