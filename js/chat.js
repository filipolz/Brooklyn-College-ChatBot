const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const sendBtn = document.getElementById('sendBtn');
const quickActions = document.getElementById('quickActions');

let messageCount = 1;

// In-memory routing data loaded from routingHub.json
let routingItems = [];
let routingDataLoaded = false;

loadRoutingData();

function loadRoutingData() {
  fetch('routingHub.json')
    .then((response) => {
      if (!response.ok) {
        throw new Error('Failed to load routingHub.json');
      }
      return response.json();
    })
    .then((data) => {
      routingItems = flattenRoutingItems(data);
      routingDataLoaded = true;
    })
    .catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Error loading routing hub data:', error);
      routingDataLoaded = false;
    });
}

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

  respondToUser(content);
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

function appendBotMessage(item) {
  messageCount++;
  const row = document.createElement('div');
  row.className = 'message-row message-row--bot';

  const bubble = document.createElement('div');
  bubble.className = 'message-bubble message-bubble--bot';

  const p = document.createElement('p');
  p.textContent = item.answer || "Here's some information that might help you.";

  bubble.appendChild(p);

  if (Array.isArray(item.links) && item.links.length > 0) {
    const linksList = document.createElement('div');
    linksList.className = 'message-links';

    item.links.forEach((link) => {
      if (!link || !link.url) return;
      const a = document.createElement('a');
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.textContent = link.text || link.url;
      a.className = 'message-link';
      linksList.appendChild(a);
    });

    bubble.appendChild(linksList);
  }

  row.appendChild(bubble);
  chatMessages.appendChild(row);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function respondToUser(userText) {
  if (!routingDataLoaded || !routingItems.length) {
    appendMessage(
      'bot',
      "I'm getting set up. Please try asking again in a moment.",
    );
    return;
  }

  const bestMatch = getBestMatch(userText, routingItems);

  if (!bestMatch) {
    appendMessage(
      'bot',
      "I'm not sure who to connect you with for that. Try asking about topics like financial aid, registration, bursar, advising, library, or IT help.",
    );
    return;
  }

  appendBotMessage(bestMatch);
}

function getBestMatch(userText, items) {
  const normalized = normalizeText(userText);
  let bestItem = null;
  let bestScore = 0;

  items.forEach((item) => {
    const score = scoreItem(item, normalized);
    if (score > bestScore) {
      bestScore = score;
      bestItem = item;
    }
  });

  const MIN_SCORE = 1.5;
  if (!bestItem || bestScore < MIN_SCORE) {
    return null;
  }

  return bestItem;
}

function normalizeText(text) {
  if (!text) return '';
  return text.toLowerCase();
}

function scoreItem(item, normalizedUserText) {
  let score = 0;

  if (Array.isArray(item.keywords)) {
    item.keywords.forEach((rawKeyword) => {
      const keyword = rawKeyword.toLowerCase();
      if (!keyword) return;

      if (normalizedUserText.includes(keyword)) {
        const lengthBonus = Math.min(keyword.split(/\s+/).length, 3);
        score += 1 + 0.2 * lengthBonus;
      }
    });
  }

  if (item.question) {
    const q = item.question.toLowerCase();
    const importantWords = q.split(/\W+/).filter((w) => w.length > 3);
    importantWords.forEach((word) => {
      if (normalizedUserText.includes(word)) {
        score += 0.2;
      }
    });
  }

  if (item.answer) {
    const a = item.answer.toLowerCase();
    const importantAnswerWords = a.split(/\W+/).filter((w) => w.length > 5);
    importantAnswerWords.forEach((word) => {
      if (normalizedUserText.includes(word)) {
        score += 0.1;
      }
    });
  }

  return score;
}

function flattenRoutingItems(data) {
  if (!data || !Array.isArray(data.categories)) return [];

  const flattened = [];

  data.categories.forEach((category) => {
    if (!Array.isArray(category.items)) return;

    category.items.forEach((item) => {
      flattened.push({
        ...item,
        categoryId: category.id,
        categoryName: category.name,
      });
    });
  });

  return flattened;
}
