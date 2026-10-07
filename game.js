const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const keys = {};
window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.key.startsWith('Arrow')) e.preventDefault();
  if (e.key.toLowerCase() === 'r') reset();
});
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

function makePlayer(x, y, color, controls) {
  return { x, y, size: 30, speed: 4, color, controls, score: 0 };
}

const players = [
  makePlayer(100, 235, '#4fc3f7', { up: 'w', down: 's', left: 'a', right: 'd' }),
  makePlayer(670, 235, '#ff8a65', { up: 'arrowup', down: 'arrowdown', left: 'arrowleft', right: 'arrowright' }),
];

function reset() {
  players[0].x = 100; players[0].y = 235;
  players[1].x = 670; players[1].y = 235;
}

function update() {
  for (const p of players) {
    const c = p.controls;
    if (keys[c.up]) p.y -= p.speed;
    if (keys[c.down]) p.y += p.speed;
    if (keys[c.left]) p.x -= p.speed;
    if (keys[c.right]) p.x += p.speed;
    p.x = Math.max(0, Math.min(canvas.width - p.size, p.x));
    p.y = Math.max(0, Math.min(canvas.height - p.size, p.y));
  }
  // TODO: 여기에 게임 규칙(충돌, 점수 등)을 추가하세요.
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (const p of players) {
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  document.getElementById('score1').textContent = players[0].score;
  document.getElementById('score2').textContent = players[1].score;
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();
