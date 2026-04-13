# Quiz

Space trivia game for your group.

---

## Running locally (same device)

Just open `index.html` in a browser. No install needed.

1. Click **Host**
2. Pick a topic, set question count and timer
3. Add players by name
4. Paste your Anthropic API key → **Start**

Everyone plays on the same screen and buzzes in with their own button.

---

## Running on a local network (multi-device)

To let people join from their phones or laptops on the same Wi-Fi:

**Python** (no install needed on Mac/Linux):
```bash
cd quiz
python3 -m http.server 8080
```

**Node** (via npx):
```bash
cd quiz
npx serve .
```

Then find your local IP:
- Mac/Linux: `ifconfig | grep "inet "`
- Windows: `ipconfig`

Open `http://YOUR_LOCAL_IP:8080` on all devices. Players go to `/join.html` and enter the room code shown on the host's lobby screen.

> Note: State is shared via `localStorage`, which only works when everyone is on the **same browser/device**. For true real-time multi-device play (separate phones), you'd need a WebSocket server backend. This is a future addition.

---

## Pages

| File | Purpose |
|------|---------|
| `index.html` | Home |
| `host.html` | Game setup |
| `loading.html` | Generating questions |
| `lobby.html` | Waiting room |
| `game.html` | Gameplay |
| `results.html` | Leaderboard |
| `join.html` | Player join |

---

## API key

Get one at [console.anthropic.com](https://console.anthropic.com). It's only used in your browser session and never stored anywhere.
