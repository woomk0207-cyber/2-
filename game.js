const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const MAX_HP = 100;
const BULLET_DAMAGE = 10;
const BULLET_SPEED = 9;
const SHOOT_COOLDOWN = 250; // ms
const WIN_SCORE = 3;

const keys = {};
window.addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (e.key.startsWith('Arrow') || e.key === ' ' || e.key === 'Enter') e.preventDefault();
  if (k === 'r') restartMatch();
  if (k === 'enter' && state.roundOver) nextRound();
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

function makePlayer(name, color, controls, startX, dirX) {
  return {
    name, color, controls, startX, startDir: { x: dirX, y: 0 },
    x: startX, y: canvas.height / 2, size: 30, speed: 4,
    dir: { x: dirX, y: 0 }, hp: MAX_HP, lastShot: 0, score: 0,
  };
}

const players = [
  makePlayer('P1', '#4fc3f7', { up: 'w', down: 's', left: 'a', right: 'd', shoot: 'f' }, 100, 1),
  makePlayer('P2', '#ff8a65', { up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright', shoot: 'l' }, 670, -1),
];

let bullets = [];
const state = { roundOver: false, winner: null, matchOver: false };

const walls = [
  { x: 380, y: 150, w: 40, h: 200 },
  { x: 180, y: 60, w: 100, h: 20 },
  { x: 520, y: 420, w: 100, h: 20 },
];

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function nextRound() {
  for (const p of players) {
    p.x = p.startX; p.y = canvas.height / 2;
    p.hp = MAX_HP; p.dir = { ...p.startDir };
  }
  bullets = [];
  state.roundOver = false;
  state.winner = null;
}

function restartMatch() {
  players.forEach((p) => { p.score = 0; });
  state.matchOver = false;
  nextRound();
}

function movePlayer(p) {
  const c = p.controls;
  let dx = (keys[c.right] ? 1 : 0) - (keys[c.left] ? 1 : 0);
  let dy = (keys[c.down] ? 1 : 0) - (keys[c.up] ? 1 : 0);
  if (dx || dy) {
    const len = Math.hypot(dx, dy);
    p.dir = { x: dx / len, y: dy / len };
    const tryMove = (mx, my) => {
      const nx = Math.max(0, Math.min(canvas.width - p.size, p.x + mx));
      const ny = Math.max(0, Math.min(canvas.height - p.size, p.y + my));
      const box = { x: nx, y: ny, w: p.size, h: p.size };
      if (!walls.some((w) => overlap(box, w))) { p.x = nx; p.y = ny; }
    };
    tryMove((dx / len) * p.speed, 0);
    tryMove(0, (dy / len) * p.speed);
  }
}

function tryShoot(p, now) {
  if (keys[p.controls.shoot] && now - p.lastShot > SHOOT_COOLDOWN) {
    p.lastShot = now;
    bullets.push({
      x: p.x + p.size / 2, y: p.y + p.size / 2,
      vx: p.dir.x * BULLET_SPEED, vy: p.dir.y * BULLET_SPEED,
      owner: p, r: 5,
    });
  }
}

function update(now) {
  if (state.roundOver) return;
  players.forEach((p) => { movePlayer(p); tryShoot(p, now); });

  for (const b of bullets) { b.x += b.vx; b.y += b.vy; }
  bullets = bullets.filter((b) => {
    if (b.x < 0 || b.x > canvas.width || b.y < 0 || b.y > canvas.height) return false;
    const bb = { x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 };
    if (walls.some((w) => overlap(bb, w))) return false;
    for (const p of players) {
      if (p === b.owner) continue;
      if (overlap(bb, { x: p.x, y: p.y, w: p.size, h: p.size })) {
        p.hp = Math.max(0, p.hp - BULLET_DAMAGE);
        return false;
      }
    }
    return true;
  });

  const dead = players.find((p) => p.hp <= 0);
  if (dead) {
    const winner = players.find((p) => p !== dead);
    winner.score++;
    state.winner = winner;
    state.roundOver = true;
    if (winner.score >= WIN_SCORE) state.matchOver = true;
  }
}

function drawHpBar(p, x) {
  ctx.fillStyle = '#333';
  ctx.fillRect(x, 10, 200, 14);
  ctx.fillStyle = p.color;
  ctx.fillRect(x, 10, 200 * (p.hp / MAX_HP), 14);
  ctx.strokeStyle = '#fff';
  ctx.strokeRect(x, 10, 200, 14);
}

function drawCenterText(lines) {
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, canvas.height / 2 - 60, canvas.width, 120);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 36px sans-serif';
  ctx.fillText(lines[0], canvas.width / 2, canvas.height / 2 - 5);
  ctx.font = '20px sans-serif';
  ctx.fillText(lines[1], canvas.width / 2, canvas.height / 2 + 35);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#5c6b8a';
  walls.forEach((w) => ctx.fillRect(w.x, w.y, w.w, w.h));

  for (const p of players) {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
    // 조준 방향 표시
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(p.x + p.size / 2, p.y + p.size / 2);
    ctx.lineTo(p.x + p.size / 2 + p.dir.x * 25, p.y + p.size / 2 + p.dir.y * 25);
    ctx.stroke();
  }
  for (const b of bullets) {
    ctx.fillStyle = b.owner.color;
    ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.fill();
  }

  drawHpBar(players[0], 10);
  drawHpBar(players[1], canvas.width - 210);

  document.getElementById('score1').textContent = players[0].score;
  document.getElementById('score2').textContent = players[1].score;

  if (state.matchOver) {
    drawCenterText([`${state.winner.name} 최종 승리!`, 'R 키로 새 경기 시작']);
  } else if (state.roundOver) {
    drawCenterText([`${state.winner.name} 라운드 승리!`, 'Enter 키로 다음 라운드']);
  }
}

function loop(now) {
  update(now);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
