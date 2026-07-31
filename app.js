/* ─────────────────────────────────────────────────────────────────
   FOOTBALL AUCTION – app.js
   ───────────────────────────────────────────────────────────────── */

// ── State ────────────────────────────────────────────────────────
const STATE = {
  teams: [
    { name: 'Team 1', purse: 50, players: [] },
    { name: 'Team 2', purse: 50, players: [] }
  ],
  players: [],          // { name, sold, soldTo, price }
  round: 1,             // 1 = first pass, 2 = re-auction
  currentIdx: 0,
  currentBid: 2,        // Cr
  currentLeader: -1,    // team index (-1 = no bid yet)
  BASE_PRICE: 2,        // Cr
  INCREMENT: 2,         // Cr
  bidHistory: [],
  unsold: []
};

// ── DOM helpers ──────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const showScreen = id => {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
};

// ── SETUP: Build player inputs ───────────────────────────────────
function buildPlayerInputs() {
  const grid = $('playersGrid');
  grid.innerHTML = '';
  for (let i = 1; i <= 14; i++) {
    const wrap = document.createElement('div');
    wrap.className = 'player-input-wrap';
    wrap.innerHTML = `
      <label>Player ${i}</label>
      <input type="text" id="p${i}" placeholder="Enter name..." maxlength="22"/>
    `;
    grid.appendChild(wrap);
  }
}

// ── Particles ────────────────────────────────────────────────────
function spawnParticles() {
  const container = $('particles');
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.width = p.style.height = (Math.random() * 4 + 2) + 'px';
    p.style.animationDuration = (Math.random() * 12 + 8) + 's';
    p.style.animationDelay = (Math.random() * 10) + 's';
    p.style.opacity = Math.random() * 0.4 + 0.1;
    container.appendChild(p);
  }
}

// ── Start Auction ────────────────────────────────────────────────
function startAuction() {
  const t1 = $('team1Name').value.trim() || 'Team Alpha';
  const t2 = $('team2Name').value.trim() || 'Team Beta';
  STATE.teams[0].name = t1;
  STATE.teams[1].name = t2;
  STATE.teams[0].purse = 50;
  STATE.teams[1].purse = 50;
  STATE.teams[0].players = [];
  STATE.teams[1].players = [];

  // Collect players
  const players = [];
  for (let i = 1; i <= 14; i++) {
    const val = $(`p${i}`)?.value.trim() || `Player ${i}`;
    players.push({ name: val, sold: false, soldTo: -1, price: 0 });
  }
  STATE.players = players;
  STATE.currentIdx = 0;
  STATE.unsold = [];
  STATE.round = 1;

  showScreen('auctionScreen');
  renderAuction();
}

// ── Render Auction ───────────────────────────────────────────────
function renderAuction() {
  // Header
  $('t1Name').textContent = STATE.teams[0].name;
  $('t2Name').textContent = STATE.teams[1].name;
  $('t1Avatar').textContent = abbr(STATE.teams[0].name);
  $('t2Avatar').textContent = abbr(STATE.teams[1].name);

  loadPlayer(STATE.currentIdx);
  updateTeamPanels();
}

function loadPlayer(idx) {
  if (idx >= STATE.players.length) {
    endAuction();
    return;
  }
  const player = STATE.players[idx];
  STATE.currentBid = STATE.BASE_PRICE;
  STATE.currentLeader = -1;
  STATE.bidHistory = [];

  // Progress
  const total = STATE.players.length;
  const pct = (idx / total) * 100;
  $('progressBar').style.width = pct + '%';
  $('progressText').textContent = `Player ${idx + 1} / ${total}`;

  // Round badge
  const roundBadge = $('roundBadge');
  if (roundBadge) {
    roundBadge.textContent = STATE.round === 2 ? '🔄 ROUND 2' : 'ROUND 1';
    roundBadge.className = 'round-badge' + (STATE.round === 2 ? ' round2' : '');
  }

  // Player card
  $('playerNumber').textContent = `#${idx + 1}`;
  $('playerNameBig').textContent = player.name.toUpperCase();
  $('playerNameShirt').textContent = player.name.split(' ')[0].toUpperCase();

  // Bid display
  $('currentBidDisplay').textContent = `${STATE.currentBid} Cr`;
  $('currentBidDisplay').classList.remove('bump');
  $('bidLeader').textContent = '— No bids yet —';
  $('bidLeader').className = 'bid-leader';

  // Bid history
  $('bidHistoryList').innerHTML = '<div class="bh-empty">Place your first bid!</div>';

  // Buttons
  updateBidButtons();
  $('soldBtn').disabled = true;
}

function updateTeamPanels() {
  // Purse
  $('t1Purse').textContent = `💰 ${STATE.teams[0].purse} Cr`;
  $('t2Purse').textContent = `💰 ${STATE.teams[1].purse} Cr`;

  // Player lists
  renderPlayerList('t1PlayersList', 0);
  renderPlayerList('t2PlayersList', 1);
}

function renderPlayerList(elementId, teamIdx) {
  const el = $(elementId);
  const list = STATE.teams[teamIdx].players;
  if (list.length === 0) {
    el.innerHTML = '<div class="no-players">No players yet</div>';
    return;
  }
  el.innerHTML = list.map(p =>
    `<div class="player-tag">
      <span class="player-tag-name">${p.name}</span>
      <span class="player-tag-price">${p.price}Cr</span>
    </div>`
  ).join('');
}

function updateBidButtons() {
  const nextBid = STATE.currentLeader === -1 ? STATE.currentBid : STATE.currentBid + STATE.INCREMENT;

  // Team 1
  const canT1 = STATE.currentLeader !== 0 && STATE.teams[0].purse >= nextBid;
  $('t1BidBtn').disabled = !canT1;
  $('t1BidAmount').textContent = `${nextBid} Cr`;

  // Team 2
  const canT2 = STATE.currentLeader !== 1 && STATE.teams[1].purse >= nextBid;
  $('t2BidBtn').disabled = !canT2;
  $('t2BidAmount').textContent = `${nextBid} Cr`;
}

// ── Place Bid ────────────────────────────────────────────────────
function placeBid(teamIdx) {
  const nextBid = STATE.currentLeader === -1 ? STATE.currentBid : STATE.currentBid + STATE.INCREMENT;

  if (STATE.teams[teamIdx].purse < nextBid) {
    showToast(`⚠️ ${STATE.teams[teamIdx].name} doesn't have enough funds!`);
    return;
  }
  if (STATE.currentLeader === teamIdx) {
    showToast('You already have the highest bid!');
    return;
  }

  STATE.currentBid = nextBid;
  STATE.currentLeader = teamIdx;

  // Update display
  const bidEl = $('currentBidDisplay');
  bidEl.textContent = `${STATE.currentBid} Cr`;
  bidEl.classList.remove('bump');
  void bidEl.offsetWidth; // reflow
  bidEl.classList.add('bump');

  const leaderEl = $('bidLeader');
  leaderEl.textContent = `🔥 ${STATE.teams[teamIdx].name}`;
  leaderEl.className = `bid-leader ${teamIdx === 0 ? 't1-lead' : 't2-lead'}`;

  // Bid history
  STATE.bidHistory.unshift({ team: teamIdx, price: STATE.currentBid });
  renderBidHistory();

  // Enable Sold button
  $('soldBtn').disabled = false;

  updateBidButtons();

  // Highlight active team
  highlightTeam(teamIdx);
}

function renderBidHistory() {
  const el = $('bidHistoryList');
  el.innerHTML = STATE.bidHistory.map(b =>
    `<div class="bh-item">
      <span class="bh-team ${b.team === 0 ? 't1' : 't2'}">${STATE.teams[b.team].name}</span>
      <span class="bh-price">${b.price} Cr</span>
    </div>`
  ).join('');
}

function highlightTeam(teamIdx) {
  const panel = teamIdx === 0 ? $('team1Panel') : $('team2Panel');
  panel.style.boxShadow = `inset 0 0 30px ${teamIdx === 0 ? 'rgba(249,115,22,0.12)' : 'rgba(99,102,241,0.12)'}`;
  setTimeout(() => { panel.style.boxShadow = ''; }, 600);
}

// ── Sold ─────────────────────────────────────────────────────────
function soldPlayer() {
  if (STATE.currentLeader === -1) return;
  const player = STATE.players[STATE.currentIdx];
  const team = STATE.teams[STATE.currentLeader];

  team.purse -= STATE.currentBid;
  team.players.push({ name: player.name, price: STATE.currentBid });
  player.sold = true;
  player.soldTo = STATE.currentLeader;
  player.price = STATE.currentBid;

  showToast(`🎉 ${player.name} SOLD to ${team.name} for ${STATE.currentBid} Cr!`);
  updateTeamPanels();

  setTimeout(() => nextPlayer(), 800);
}

// ── Unsold ───────────────────────────────────────────────────────
function unsoldPlayer() {
  const player = STATE.players[STATE.currentIdx];
  STATE.unsold.push(player.name);
  showToast(`❌ ${player.name} went UNSOLD`);
  setTimeout(() => nextPlayer(), 500);
}

// ── Next Player ──────────────────────────────────────────────────
function nextPlayer() {
  STATE.currentIdx++;
  if (STATE.currentIdx >= STATE.players.length) {
    endAuction();
  } else {
    loadPlayer(STATE.currentIdx);
  }
}

// ── End Auction ──────────────────────────────────────────────────
function endAuction() {
  if (STATE.round === 1 && STATE.unsold.length > 0) {
    showReAuctionScreen();
  } else {
    showScreen('resultsScreen');
    renderResults();
    spawnConfetti();
  }
}

// ── Re-Auction Interstitial ───────────────────────────────────────
function showReAuctionScreen() {
  const list = $('raPlayerList');
  list.innerHTML = STATE.unsold
    .map(n => `<div class="ra-chip">${n}</div>`)
    .join('');
  showScreen('reAuctionScreen');
}

function startReAuction() {
  STATE.round = 2;
  STATE.players = STATE.unsold.map(name => ({ name, sold: false, soldTo: -1, price: 0 }));
  STATE.unsold = [];
  STATE.currentIdx = 0;
  STATE.currentBid = STATE.BASE_PRICE;
  STATE.currentLeader = -1;
  STATE.bidHistory = [];
  showScreen('auctionScreen');
  renderAuction();
}

function skipReAuction() {
  showScreen('resultsScreen');
  renderResults();
  spawnConfetti();
}

// ── Results ──────────────────────────────────────────────────────
function renderResults() {
  const container = $('resultsTeams');
  const t1 = STATE.teams[0];
  const t2 = STATE.teams[1];
  const t1Spent = 50 - t1.purse;
  const t2Spent = 50 - t2.purse;
  const winner = t1.players.length > t2.players.length ? 0 :
                 t2.players.length > t1.players.length ? 1 : -1;

  container.innerHTML = [0, 1].map(i => {
    const team = STATE.teams[i];
    const spent = 50 - team.purse;
    const isWinner = winner === i;
    return `
      <div class="result-team-card ${isWinner ? 'winner' : ''}">
        <div class="rtc-header">
          <div class="team-avatar ${i === 0 ? 't1' : 't2'}" style="width:40px;height:40px;border-radius:10px;font-weight:800;display:flex;align-items:center;justify-content:center;">
            ${abbr(team.name)}
          </div>
          <div class="rtc-name">${team.name}</div>
          ${isWinner ? '<div class="rtc-winner-badge">🏆 WINNER</div>' : ''}
        </div>
        <div class="rtc-stat">Players Signed: <span>${team.players.length}</span></div>
        <div class="rtc-stat">Total Spent: <span>${spent} Cr</span></div>
        <div class="rtc-stat">Remaining Purse: <span>${team.purse} Cr</span></div>
        <div style="margin-top:0.75rem">
          ${team.players.map(p =>
            `<div class="rtc-player">
              <span>${p.name}</span>
              <span style="color:var(--gold)">${p.price} Cr</span>
            </div>`
          ).join('') || '<div class="rtc-stat">No players signed</div>'}
        </div>
      </div>`;
  }).join('');

  // Unsold
  const unsoldEl = $('unsoldSection');
  if (STATE.unsold.length) {
    unsoldEl.innerHTML = `
      <div class="unsold-title">❌ Unsold Players (${STATE.unsold.length})</div>
      <div class="unsold-players">
        ${STATE.unsold.map(n => `<span class="unsold-chip">${n}</span>`).join('')}
      </div>`;
  } else {
    unsoldEl.innerHTML = '<div style="color:var(--green);font-weight:600;font-size:0.9rem">✅ All players were sold!</div>';
  }
}

// ── Confetti ─────────────────────────────────────────────────────
function spawnConfetti() {
  const wrap = $('confettiWrap');
  wrap.innerHTML = '';
  const colors = ['#f59e0b','#f97316','#6366f1','#22c55e','#ef4444','#fde68a','#a78bfa'];
  for (let i = 0; i < 120; i++) {
    const el = document.createElement('div');
    el.className = 'confetto';
    el.style.left = Math.random() * 100 + 'vw';
    el.style.background = colors[Math.floor(Math.random() * colors.length)];
    el.style.width = (Math.random() * 10 + 6) + 'px';
    el.style.height = (Math.random() * 10 + 6) + 'px';
    el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    el.style.animationDuration = (Math.random() * 3 + 2) + 's';
    el.style.animationDelay = (Math.random() * 2) + 's';
    wrap.appendChild(el);
  }
}

// ── Reset ────────────────────────────────────────────────────────
function resetAll() {
  STATE.teams[0] = { name: 'Team 1', purse: 50, players: [] };
  STATE.teams[1] = { name: 'Team 2', purse: 50, players: [] };
  STATE.players = [];
  STATE.currentIdx = 0;
  STATE.currentBid = 2;
  STATE.currentLeader = -1;
  STATE.bidHistory = [];
  STATE.unsold = [];
  STATE.round = 1;
  $('team1Name').value = '';
  $('team2Name').value = '';
  buildPlayerInputs();
  showScreen('setupScreen');
}

// ── Toast ────────────────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// ── Utils ────────────────────────────────────────────────────────
function abbr(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// ── Shuffle Players ──────────────────────────────────────────────
function shufflePlayers() {
  // Collect current values
  const values = [];
  for (let i = 1; i <= 14; i++) {
    values.push($(`p${i}`)?.value ?? '');
  }

  // Fisher-Yates shuffle
  for (let i = values.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [values[i], values[j]] = [values[j], values[i]];
  }

  // Write back
  for (let i = 1; i <= 14; i++) {
    const inp = $(`p${i}`);
    if (inp) inp.value = values[i - 1];
  }

  // Animate button & show hint
  const btn = $('shuffleBtn');
  btn.classList.add('shuffled');
  setTimeout(() => btn.classList.remove('shuffled'), 600);

  const hint = $('shuffleHint');
  hint.textContent = '✅ Order randomised!';
  hint.classList.add('hint-visible');
  setTimeout(() => {
    hint.textContent = '';
    hint.classList.remove('hint-visible');
  }, 2000);
}

// ── Init ─────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  buildPlayerInputs();
  spawnParticles();
});
