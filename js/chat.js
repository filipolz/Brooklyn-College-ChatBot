const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const quickActions = document.getElementById('quickActions');

let messageCount = 1;

chatInput.addEventListener('input', () => {
  sendBtn.disabled = !chatInput.value.trim();
});

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendBtn.addEventListener('click', sendMessage);

quickActions.addEventListener('click', (e) => {
  const btn = e.target.closest('.quick-action-btn');
  if (!btn) return;
  sendMessage(btn.dataset.action);
});

function sendMessage(text) {
  const content = text || chatInput.value.trim();
  if (!content) return;

  appendMessage('user', content);
  chatInput.value = '';
  sendBtn.disabled = true;

  if (quickActions) {
    quickActions.remove();
  }
}

function appendMessage(type, text) {
  messageCount++;
  const row = document.createElement('div');
  row.className = `message-row message-row--${type}`;

  const bubble = document.createElement('div');
  bubble.className = `message-bubble message-bubble--${type}`;

  const p = document.createElement('p');
  p.textContent = text;

  bubble.appendChild(p);
  row.appendChild(bubble);
  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
