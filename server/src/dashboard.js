// DraftRoom Backend Live Observer Dashboard HTML Generator

function renderDashboardHtml(frontendUrl = 'http://localhost:3000') {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DraftRoom Server Dashboard — Live Observer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #090d16;
      --card-bg: #111726;
      --card-border: #1e293b;
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #6366f1;
      --accent-hover: #4f46e5;
      --success: #10b981;
      --warning: #f59e0b;
      --danger: #ef4444;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg);
      color: var(--text-main);
      font-family: 'Plus Jakarta Sans', sans-serif;
      padding: 24px;
      line-height: 1.5;
    }
    header {
      max-width: 1300px;
      margin: 0 auto 24px auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      padding-bottom: 20px;
      border-bottom: 1px solid var(--card-border);
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .logo-badge {
      background: var(--accent);
      color: white;
      font-weight: 800;
      padding: 6px 12px;
      border-radius: 10px;
      font-size: 16px;
      letter-spacing: -0.5px;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
    }
    .brand h1 {
      font-size: 20px;
      font-weight: 800;
      letter-spacing: -0.5px;
    }
    .brand p {
      font-size: 12px;
      color: var(--text-muted);
    }
    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .btn {
      background: #1e293b;
      border: 1px solid #334155;
      color: var(--text-main);
      padding: 8px 16px;
      border-radius: 10px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn:hover { background: #334155; }
    .btn-primary {
      background: var(--accent);
      border-color: var(--accent);
    }
    .btn-primary:hover { background: var(--accent-hover); }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background: var(--success);
      border-radius: 50%;
      box-shadow: 0 0 10px var(--success);
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.95); opacity: 0.8; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.95); opacity: 0.8; }
    }
    main {
      max-width: 1300px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 24px;
    }
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    .metric-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      padding: 20px;
      position: relative;
      overflow: hidden;
    }
    .metric-title {
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      font-weight: 700;
      margin-bottom: 6px;
    }
    .metric-value {
      font-size: 28px;
      font-weight: 800;
      color: #ffffff;
      font-family: 'JetBrains Mono', monospace;
    }
    .metric-sub {
      font-size: 11px;
      color: var(--text-muted);
      margin-top: 4px;
    }
    .content-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
    }
    @media (max-width: 960px) {
      .content-grid { grid-template-columns: 1fr; }
    }
    .panel {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 20px;
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .panel-title {
      font-size: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .badge {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .badge-lobby { background: #1e293b; color: #94a3b8; }
    .badge-word_select { background: #451a03; color: #f59e0b; border: 1px solid #78350f; }
    .badge-drawing { background: #064e3b; color: #34d399; border: 1px solid #047857; }
    .badge-turn_tally { background: #312e81; color: #a5b4fc; border: 1px solid #4338ca; }
    .badge-game_over { background: #831843; color: #f472b6; border: 1px solid #be185d; }
    .room-card {
      background: #090d16;
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      transition: border-color 0.2s;
    }
    .room-card:hover { border-color: #3b82f6; }
    .room-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }
    .room-code-tag {
      font-family: 'JetBrains Mono', monospace;
      font-size: 20px;
      font-weight: 800;
      color: #818cf8;
      background: #1e1b4b;
      padding: 2px 10px;
      border-radius: 8px;
      border: 1px solid #3730a3;
      text-decoration: none;
    }
    .room-details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
      gap: 12px;
      background: #111726;
      padding: 12px;
      border-radius: 12px;
      font-size: 12px;
    }
    .detail-item span {
      display: block;
      color: var(--text-muted);
      font-size: 11px;
    }
    .detail-item strong {
      color: #e2e8f0;
      font-size: 13px;
    }
    .player-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .player-pill {
      background: #1e293b;
      border: 1px solid #334155;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 12px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .player-pill.drawer { border-color: #f59e0b; color: #fbbf24; }
    .player-pill.guessed { border-color: #10b981; color: #34d399; }
    .player-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
    }
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: var(--text-muted);
      font-size: 14px;
    }
    .event-feed {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 520px;
      overflow-y: auto;
      padding-right: 4px;
    }
    .event-item {
      background: #090d16;
      border-left: 3px solid var(--accent);
      padding: 10px 14px;
      border-radius: 0 10px 10px 0;
      font-size: 12px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .event-item.ROOM_CREATE { border-left-color: #8b5cf6; }
    .event-item.PLAYER_JOIN { border-left-color: #3b82f6; }
    .event-item.WORD_SELECT { border-left-color: #f59e0b; }
    .event-item.CORRECT_GUESS { border-left-color: #10b981; }
    .event-item.TURN_TALLY { border-left-color: #ec4899; }
    .event-meta {
      display: flex;
      justify-content: space-between;
      color: var(--text-muted);
      font-size: 10px;
      font-family: 'JetBrains Mono', monospace;
    }
    .mono { font-family: 'JetBrains Mono', monospace; }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <div class="logo-badge">DRAFTROOM</div>
      <div>
        <h1>Backend Live Observer Console</h1>
        <p>Port 4000 &bull; WebSocket & Express Service &bull; Authoritative Game Core</p>
      </div>
    </div>
    <div class="header-actions">
      <div style="display:flex; align-items:center; gap:8px; font-size:12px; color:var(--text-muted);">
        <div class="pulse-dot"></div>
        <span>Live Sync Active</span>
      </div>
      <button class="btn" id="refreshBtn" onclick="fetchStatus()">Refresh Now</button>
      <a href="${frontendUrl}" target="_blank" class="btn btn-primary">Open Client UI &rarr;</a>
    </div>
  </header>

  <main>
    <!-- Server Key Metrics -->
    <div class="metrics-grid">
      <div class="metric-card">
        <div class="metric-title">Active Rooms</div>
        <div class="metric-value" id="valRooms">0</div>
        <div class="metric-sub">In memory</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Total Players</div>
        <div class="metric-value" id="valPlayers">0</div>
        <div class="metric-sub">Across all rooms</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Connected Sockets</div>
        <div class="metric-value" id="valSockets">0</div>
        <div class="metric-sub">Live WS clients</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">Server Uptime</div>
        <div class="metric-value" id="valUptime">0s</div>
        <div class="metric-sub" id="valMemory">Heap: 0MB</div>
      </div>
    </div>

    <!-- Main Content Split -->
    <div class="content-grid">
      <!-- Active Rooms List -->
      <section class="panel">
        <div class="panel-header">
          <div class="panel-title">
            <span>Active Game Rooms</span>
            <span id="roomCountBadge" class="badge" style="background:#1e293b; color:#94a3b8;">0</span>
          </div>
          <span style="font-size:12px; color:var(--text-muted);">Auto-updating every 1.5s</span>
        </div>

        <div id="roomsContainer" style="display:flex; flex-direction:column; gap:16px;">
          <div class="empty-state">
            No active rooms yet. Go to <a href="${frontendUrl}" target="_blank" style="color:#818cf8;">${frontendUrl}</a> and create one!
          </div>
        </div>
      </section>

      <!-- Live Events Stream -->
      <section class="panel">
        <div class="panel-header">
          <div class="panel-title">Recent Event Log</div>
          <span style="font-size:11px; color:var(--text-muted);">Last 50 events</span>
        </div>

        <div class="event-feed" id="eventFeed">
          <div class="empty-state">No events recorded yet.</div>
        </div>
      </section>
    </div>
  </main>

  <script>
    async function fetchStatus() {
      try {
        const res = await fetch('/api/status');
        if (!res.ok) return;
        const data = await res.json();
        renderStats(data);
      } catch (err) {
        console.error('Failed to fetch status:', err);
      }
    }

    function formatUptime(seconds) {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      if (m > 60) {
        const h = Math.floor(m / 60);
        return h + 'h ' + (m % 60) + 'm';
      }
      return m + 'm ' + s + 's';
    }

    function renderStats(data) {
      document.getElementById('valRooms').innerText = data.activeRoomsCount;
      document.getElementById('valPlayers').innerText = data.totalPlayersCount;
      document.getElementById('valSockets').innerText = data.connectedSocketsCount;
      document.getElementById('valUptime').innerText = formatUptime(data.uptime);
      document.getElementById('valMemory').innerText = 'Heap: ' + data.memory.heapUsedMB + 'MB / RSS: ' + data.memory.rssMB + 'MB';
      document.getElementById('roomCountBadge').innerText = data.rooms.length;

      // Render Rooms
      const container = document.getElementById('roomsContainer');
      if (!data.rooms || data.rooms.length === 0) {
        container.innerHTML = '<div class="empty-state">No active rooms currently. Open the <a href="${frontendUrl}" target="_blank" style="color:#818cf8;">frontend</a> to start a room!</div>';
      } else {
        container.innerHTML = data.rooms.map(r => {
          const stateBadgeClass = 'badge badge-' + r.state.toLowerCase();
          const wordDisplay = r.currentWord ? ('<span style="color:#34d399; font-weight:700;">' + r.currentWord + '</span> <span style="color:#64748b; font-family:monospace;">(' + r.wordMask + ')</span>') : '<span style="color:#64748b;">(None)</span>';

          const playersHtml = r.players.map(p => {
            const isDrawer = p.nickname === r.drawer;
            const extraClass = isDrawer ? 'drawer' : (p.hasGuessed ? 'guessed' : '');
            const dotColor = (p.avatar && p.avatar.color) ? p.avatar.color : '#3b82f6';
            return '<div class="player-pill ' + extraClass + '">' +
              '<div class="player-dot" style="background:' + dotColor + '"></div>' +
              '<strong>' + p.nickname + '</strong>' +
              '<span style="color:#94a3b8; font-size:11px;">' + p.score + 'p</span>' +
              (isDrawer ? ' <span style="font-size:10px; color:#f59e0b;">(Draw)</span>' : '') +
              (p.hasGuessed ? ' <span style="font-size:10px; color:#10b981;">✓</span>' : '') +
              (!p.connected ? ' <span style="font-size:10px; color:#ef4444;">(disc)</span>' : '') +
            '</div>';
          }).join('');

          return '<div class="room-card">' +
            '<div class="room-top">' +
              '<div>' +
                '<a href="${frontendUrl}/r/' + r.code + '" target="_blank" class="room-code-tag">' + r.code + '</a>' +
                '<span class="' + stateBadgeClass + '" style="margin-left: 10px;">' + r.state + '</span>' +
              '</div>' +
              '<span style="font-size:12px; color:#94a3b8;">Host: <strong>' + r.host + '</strong></span>' +
            '</div>' +
            '<div class="room-details-grid">' +
              '<div class="detail-item"><span>Round</span><strong>' + (r.round > 0 ? (r.round + ' / ' + r.totalRounds) : 'Lobby') + '</strong></div>' +
              '<div class="detail-item"><span>Drawer</span><strong>' + (r.drawer || '—') + '</strong></div>' +
              '<div class="detail-item"><span>Current Word</span><div>' + wordDisplay + '</div></div>' +
              '<div class="detail-item"><span>Strokes in History</span><strong class="mono">' + r.canvasOps + ' ops</strong></div>' +
            '</div>' +
            '<div>' +
              '<div style="font-size:11px; text-transform:uppercase; color:#94a3b8; font-weight:700; margin-bottom:6px;">Players (' + r.players.length + ' / ' + r.maxPlayers + ')</div>' +
              '<div class="player-pills">' + playersHtml + '</div>' +
            '</div>' +
          '</div>';
        }).join('');
      }

      // Render Recent Events
      const feed = document.getElementById('eventFeed');
      if (!data.recentEvents || data.recentEvents.length === 0) {
        feed.innerHTML = '<div class="empty-state">No events recorded yet.</div>';
      } else {
        feed.innerHTML = data.recentEvents.map(e => {
          const time = new Date(e.ts).toLocaleTimeString();
          return '<div class="event-item ' + e.type + '">' +
            '<div class="event-meta">' +
              '<span>[' + e.roomCode + '] ' + e.type + '</span>' +
              '<span>' + time + '</span>' +
            '</div>' +
            '<div style="color:#e2e8f0; margin-top:2px;">' + e.message + '</div>' +
          '</div>';
        }).join('');
      }
    }

    // Initial load + interval
    fetchStatus();
    setInterval(fetchStatus, 1500);
  </script>
</body>
</html>`;
}

module.exports = {
  renderDashboardHtml
};

