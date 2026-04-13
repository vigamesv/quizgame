// shared.js — Quiz app utilities

const AVATAR_COLORS = [
  '#7c6fff','#3ecf8e','#f0a040','#f25c5c','#38bdf8','#e879f9','#a3e635','#fb923c'
];

function initials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}
function avatarColor(i) {
  return AVATAR_COLORS[i % AVATAR_COLORS.length];
}
function renderAvatar(name, index, size = 28, fontSize = '0.55rem') {
  const c = avatarColor(index);
  return `<span class="avatar" style="width:${size}px;height:${size}px;font-size:${fontSize};background:${c}22;color:${c};">${initials(name)}</span>`;
}

// ── Starfield ──
function initStarfield() {
  const canvas = document.getElementById('stars');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let stars = [];

  function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
  function init() {
    stars = [];
    for (let i = 0; i < 180; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.2 + 0.2,
        o: Math.random() * 0.5 + 0.1,
        s: Math.random() * 0.25 + 0.05
      });
    }
  }
  let t = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    t += 0.006;
    stars.forEach((s, i) => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(200,200,230,${s.o * (0.5 + 0.5 * Math.sin(t * s.s + i))})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  resize(); init(); draw();
  window.addEventListener('resize', () => { resize(); init(); });
}

// ── State ──
const STATE_KEY = 'quiz_game_state';
function saveState(state) { localStorage.setItem(STATE_KEY, JSON.stringify(state)); }
function loadState() { try { return JSON.parse(localStorage.getItem(STATE_KEY)) || null; } catch { return null; } }
function clearState() { localStorage.removeItem(STATE_KEY); }

// ── API ──
async function generateQuestions(topic, count, apiKey) {
  const prompt = `Generate ${count} multiple-choice trivia questions about: ${topic}.
Return ONLY a raw JSON array. No markdown, no explanation, no code fences. Format:
[{"q":"Question?","options":["A","B","C","D"],"correct":0,"explanation":"One sentence explanation."}]
"correct" is the 0-based index of the right answer. Vary difficulty. Be specific and interesting.`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API error ${res.status}`);
  }
  const data = await res.json();
  const text = data.content.map(c => c.text || '').join('').replace(/```json|```/g, '').trim();
  return JSON.parse(text);
}
