/**
 * PSDepot AI Chat Widget
 * Connects to Mission Control v2.1 for AI conversations
 * 
 * Usage: Add to any page:
 * <script src="https://psdepot.com/widget/chat-widget.js"></script>
 * <script>PSDepotChat.init({ apiUrl: 'http://localhost:8080' });</script>
 */

(function() {
    'use strict';
    
    const PSDepotChat = {
        config: {
            apiUrl: 'http://localhost:8080',
            position: 'bottom-right',
            theme: 'blue',
            title: 'Chat with Miles',
            subtitle: 'AI Sales Assistant',
            placeholder: 'Ask about POS supplies...',
            voiceEnabled: true
        },
        
        state: {
            isOpen: false,
            messages: [],
            sessionId: null,
            isTyping: false
        },
        
        init: function(options) {
            Object.assign(this.config, options);
            this.createStyles();
            this.createWidget();
            this.bindEvents();
            this.loadSession();
        },
        
        createStyles: function() {
            const styles = document.createElement('style');
            styles.textContent = `
                .psd-chat-widget {
                    position: fixed;
                    ${this.config.position.includes('bottom') ? 'bottom: 20px;' : 'top: 20px;'}
                    ${this.config.position.includes('right') ? 'right: 20px;' : 'left: 20px;'}
                    z-index: 9999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .psd-chat-button {
                    width: 60px;
                    height: 60px;
                    border-radius: 50%;
                    background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
                    border: none;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(26, 54, 93, 0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s, box-shadow 0.2s;
                    color: white;
                    font-size: 24px;
                }
                
                .psd-chat-button:hover {
                    transform: scale(1.05);
                    box-shadow: 0 6px 20px rgba(26, 54, 93, 0.4);
                }
                
                .psd-chat-button.pulse {
                    animation: psd-pulse 2s infinite;
                }
                
                @keyframes psd-pulse {
                    0%, 100% { box-shadow: 0 4px 15px rgba(26, 54, 93, 0.3); }
                    50% { box-shadow: 0 4px 25px rgba(26, 54, 93, 0.6); }
                }
                
                .psd-chat-window {
                    position: absolute;
                    ${this.config.position.includes('bottom') ? 'bottom: 70px;' : 'top: 70px;'}
                    ${this.config.position.includes('right') ? 'right: 0;' : 'left: 0;'}
                    width: 380px;
                    height: 500px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 40px rgba(0,0,0,0.2);
                    display: none;
                    flex-direction: column;
                    overflow: hidden;
                }
                
                .psd-chat-window.open {
                    display: flex;
                }
                
                .psd-chat-header {
                    background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
                    color: white;
                    padding: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                
                .psd-chat-header-info {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                
                .psd-chat-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 20px;
                }
                
                .psd-chat-header-text h3 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 600;
                }
                
                .psd-chat-header-text p {
                    margin: 0;
                    font-size: 12px;
                    opacity: 0.8;
                }
                
                .psd-chat-close {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 20px;
                    cursor: pointer;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                }
                
                .psd-chat-close:hover {
                    opacity: 1;
                }
                
                .psd-chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                    background: #f7fafc;
                }
                
                .psd-message {
                    margin-bottom: 12px;
                    display: flex;
                    align-items: flex-start;
                    gap: 8px;
                }
                
                .psd-message.user {
                    flex-direction: row-reverse;
                }
                
                .psd-message-bubble {
                    max-width: 70%;
                    padding: 10px 14px;
                    border-radius: 18px;
                    font-size: 14px;
                    line-height: 1.4;
                }
                
                .psd-message.bot .psd-message-bubble {
                    background: white;
                    color: #1a202c;
                    border: 1px solid #e2e8f0;
                    border-top-left-radius: 4px;
                }
                
                .psd-message.user .psd-message-bubble {
                    background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
                    color: white;
                    border-top-right-radius: 4px;
                }
                
                .psd-message-time {
                    font-size: 10px;
                    color: #718096;
                    margin-top: 4px;
                }
                
                .psd-message.user .psd-message-time {
                    text-align: right;
                }
                
                .psd-typing-indicator {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding: 10px 14px;
                    background: white;
                    border-radius: 18px;
                    border: 1px solid #e2e8f0;
                    width: fit-content;
                }
                
                .psd-typing-dot {
                    width: 6px;
                    height: 6px;
                    background: #a0aec0;
                    border-radius: 50%;
                    animation: psd-typing 1.4s infinite;
                }
                
                .psd-typing-dot:nth-child(2) { animation-delay: 0.2s; }
                .psd-typing-dot:nth-child(3) { animation-delay: 0.4s; }
                
                @keyframes psd-typing {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-4px); }
                }
                
                .psd-chat-input-area {
                    padding: 12px 16px;
                    background: white;
                    border-top: 1px solid #e2e8f0;
                    display: flex;
                    gap: 8px;
                    align-items: center;
                }
                
                .psd-chat-input {
                    flex: 1;
                    border: 1px solid #e2e8f0;
                    border-radius: 20px;
                    padding: 10px 16px;
                    font-size: 14px;
                    outline: none;
                    transition: border-color 0.2s;
                }
                
                .psd-chat-input:focus {
                    border-color: #2c5282;
                }
                
                .psd-chat-send, .psd-chat-voice {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border: none;
                    background: #edf2f7;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: background 0.2s;
                    font-size: 16px;
                }
                
                .psd-chat-send:hover, .psd-chat-voice:hover {
                    background: #e2e8f0;
                }
                
                .psd-chat-send {
                    background: linear-gradient(135deg, #1a365d 0%, #2c5282 100%);
                    color: white;
                }
                
                .psd-chat-send:hover {
                    background: linear-gradient(135deg, #2c5282 0%, #1a365d 100%);
                }
                
                .psd-chat-voice.recording {
                    background: #f56565;
                    color: white;
                    animation: psd-recording 1s infinite;
                }
                
                @keyframes psd-recording {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                
                @media (max-width: 480px) {
                    .psd-chat-window {
                        width: calc(100vw - 40px);
                        height: calc(100vh - 100px);
                        position: fixed;
                        left: 20px;
                        right: 20px;
                        ${this.config.position.includes('bottom') ? 'bottom: 80px;' : 'top: 20px;'}
                    }
                }
            `;
            document.head.appendChild(styles);
        },
        
        createWidget: function() {
            const widget = document.createElement('div');
            widget.className = 'psd-chat-widget';
            widget.innerHTML = `
                <button class="psd-chat-button pulse" aria-label="Open chat">
                    💬
                </button>
                <div class="psd-chat-window">
                    <div class="psd-chat-header">
                        <div class="psd-chat-header-info">
                            <div class="psd-chat-avatar">🚀</div>
                            <div class="psd-chat-header-text">
                                <h3>${this.config.title}</h3>
                                <p>${this.config.subtitle}</p>
                            </div>
                        </div>
                        <button class="psd-chat-close" aria-label="Close chat">×</button>
                    </div>
                    <div class="psd-chat-messages"></div>
                    <div class="psd-chat-input-area">
                        <input type="text" class="psd-chat-input" placeholder="${this.config.placeholder}" />
                        ${this.config.voiceEnabled ? '<button class="psd-chat-voice" title="Voice message">🎤</button>' : ''}
                        <button class="psd-chat-send" title="Send">➤</button>
                    </div>
                </div>
            `;
            document.body.appendChild(widget);
            
            this.elements = {
                widget: widget,
                button: widget.querySelector('.psd-chat-button'),
                window: widget.querySelector('.psd-chat-window'),
                close: widget.querySelector('.psd-chat-close'),
                messages: widget.querySelector('.psd-chat-messages'),
                input: widget.querySelector('.psd-chat-input'),
                send: widget.querySelector('.psd-chat-send'),
                voice: widget.querySelector('.psd-chat-voice')
            };
            
            // Add welcome message
            this.addMessage('bot', 'Hi, this is Miles from Performance Supply Depot. I hope I\'m not catching you at a bad time. What can I help you with today?');
        },
        
        bindEvents: function() {
            this.elements.button.addEventListener('click', () => this.toggle());
            this.elements.close.addEventListener('click', () => this.close());
            this.elements.send.addEventListener('click', () => this.sendMessage());
            this.elements.input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.sendMessage();
            });
            
            if (this.config.voiceEnabled && this.elements.voice) {
                this.elements.voice.addEventListener('click', () => this.toggleVoice());
            }
        },
        
        toggle: function() {
            this.state.isOpen = !this.state.isOpen;
            this.elements.window.classList.toggle('open', this.state.isOpen);
            this.elements.button.classList.remove('pulse');
            
            if (this.state.isOpen) {
                this.elements.input.focus();
            }
        },
        
        close: function() {
            this.state.isOpen = false;
            this.elements.window.classList.remove('open');
        },
        
        addMessage: function(sender, text) {
            const message = document.createElement('div');
            message.className = `psd-message ${sender}`;
            
            const time = new Date().toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: true 
            });
            
            message.innerHTML = `
                <div>
                    <div class="psd-message-bubble">${this.escapeHtml(text)}</div>
                    <div class="psd-message-time">${time}</div>
                </div>
            `;
            
            this.elements.messages.appendChild(message);
            this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
            
            this.state.messages.push({ sender, text, time });
            this.saveSession();
        },
        
        showTyping: function() {
            const typing = document.createElement('div');
            typing.className = 'psd-message bot psd-typing';
            typing.innerHTML = `
                <div class="psd-typing-indicator">
                    <div class="psd-typing-dot"></div>
                    <div class="psd-typing-dot"></div>
                    <div class="psd-typing-dot"></div>
                </div>
            `;
            this.elements.messages.appendChild(typing);
            this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
            this.state.isTyping = true;
            return typing;
        },
        
        hideTyping: function(typingEl) {
            if (typingEl) typingEl.remove();
            this.state.isTyping = false;
        },
        
        sendMessage: async function() {
            const text = this.elements.input.value.trim();
            if (!text) return;
            
            this.addMessage('user', text);
            this.elements.input.value = '';
            
            const typing = this.showTyping();
            
            try {
                // Call Mission Control API
                const response = await fetch(`${this.config.apiUrl}/api/decide`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        context: {
                            message: text,
                            source: 'chat_widget',
                            timestamp: new Date().toISOString()
                        }
                    })
                });
                
                const data = await response.json();
                this.hideTyping(typing);
                
                const reply = data.response || data.message || 
                    "I'm processing that request. One moment please...";
                this.addMessage('bot', reply);
                
            } catch (error) {
                this.hideTyping(typing);
                this.addMessage('bot', "I'm having trouble connecting right now. You can also reach us at 888-881-6834 or info@psdepot.com");
            }
        },
        
        toggleVoice: async function() {
            if (!this.recording) {
                this.startRecording();
            } else {
                this.stopRecording();
            }
        },
        
        startRecording: function() {
            this.recording = true;
            this.elements.voice.classList.add('recording');
            
            // Show recording state
            this.addMessage('bot', '🎤 Recording... (click again to stop)');
            
            // Note: Actual WebRTC recording would require more setup
            // For now, this is a placeholder for voice input
        },
        
        stopRecording: function() {
            this.recording = false;
            this.elements.voice.classList.remove('recording');
            
            // Placeholder: In full implementation, send audio to /api/speak
            this.addMessage('bot', 'Voice message received. Processing...');
        },
        
        escapeHtml: function(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        },
        
        saveSession: function() {
            localStorage.setItem('psd_chat_session', JSON.stringify({
                messages: this.state.messages.slice(-50), // Keep last 50
                sessionId: this.state.sessionId
            }));
        },
        
        loadSession: function() {
            const saved = localStorage.getItem('psd_chat_session');
            if (saved) {
                try {
                    const data = JSON.parse(saved);
                    this.state.messages = data.messages || [];
                    this.state.sessionId = data.sessionId;
                } catch (e) {}
            }
        }
    };
    
    // Expose to global scope
    window.PSDepotChat = PSDepotChat;
    
    // Auto-init if data attribute present
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            const autoInit = document.querySelector('[data-psd-chat]');
            if (autoInit) {
                PSDepotChat.init({
                    apiUrl: autoInit.dataset.psdChatApi || 'http://localhost:8080'
                });
            }
        });
    }
})();