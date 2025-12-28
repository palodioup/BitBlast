// ================== CANVAS SETUP ==================
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

canvas.width = 400;
canvas.height = 600;

// ================== ASSETS ==================
const carImg = new Image();
carImg.src = "./assets/GRCAR.png";

// ================== GAME STATE ==================
let car = { x: 175, y: 480, w: 50, h: 80, speed: 5 };
let obstacles = [];
let powerups = [];

let score = 0;
let highScore = Number(localStorage.getItem("highScore")) || 0;

let shield = false;
let shieldEnd = 0;

let speedBoost = false;
let speedEnd = 0;

let paused = false;
let gameOver = false;

// ================== INPUT ==================
let left = false;
let right = false;

document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") left = true;
  if (e.key === "ArrowRight") right = true;
  if (e.key === "p") paused = !paused;
  if (e.key === "r" && gameOver) resetGame();
});

document.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft") left = false;
  if (e.key === "ArrowRight") right = false;
});

// ================== MOBILE CONTROLS ==================
document.addEventListener("touchstart", e => {
  const x = e.touches[0].clientX;
  left = x < window.innerWidth / 2;
  right = x >= window.innerWidth / 2;
});

document.addEventListener("touchend", () => {
  left = false;
  right = false;
});

// ================== UI BUTTONS ==================
const pauseBtn = document.getElementById("pauseBtn");
const restartBtn = document.getElementById("restartBtn");

pauseBtn.addEventListener("click", () => {
  paused = !paused;
  pauseBtn.textContent = paused ? "▶️" : "⏸";
});

restartBtn.addEventListener("click", () => {
  resetGame();
  paused = false;
  gameOver = false;
  restartBtn.style.display = "none";
});

// ================== SPAWN SYSTEM ==================
setInterval(() => {
  if (!paused && !gameOver) {
    obstacles.push({
      x: Math.random() * (canvas.width - 50),
      y: -40,
      w: 50,
      h: 30,
      speed: 4
    });
  }
}, 900);

setInterval(() => {
  if (!paused && !gameOver) {
    powerups.push({
      x: Math.random() * (canvas.width - 30),
      y: -40,
      w: 30,
      h: 30,
      type: Math.random() > 0.5 ? "shield" : "speed"
    });
  }
}, 7000);

// ================== GAME UPDATE ==================
function update() {
  if (paused || gameOver) return;

  if (left) car.x -= car.speed;
  if (right) car.x += car.speed;
  car.x = Math.max(0, Math.min(canvas.width - car.w, car.x));

  obstacles.forEach(o => o.y += o.speed);
  powerups.forEach(p => p.y += 3);

  obstacles = obstacles.filter(o => {
    const hit =
      o.x < car.x + car.w &&
      o.x + o.w > car.x &&
      o.y < car.y + car.h &&
      o.y + o.h > car.y;

    if (hit) {
      if (!shield) {
        gameOver = true;
        highScore = Math.max(highScore, score);
        localStorage.setItem("highScore", highScore);
      }
      return false;
    }
    return o.y < canvas.height;
  });

  powerups = powerups.filter(p => {
    const hit =
      p.x < car.x + car.w &&
      p.x + p.w > car.x &&
      p.y < car.y + car.h &&
      p.y + p.h > car.y;

    if (hit) {
      if (p.type === "shield") {
        shield = true;
        shieldEnd = Date.now() + 20000;
      } else {
        speedBoost = true;
        speedEnd = Date.now() + 20000;
        car.speed = 8;
      }
      return false;
    }
    return p.y < canvas.height;
  });

  if (shield && Date.now() > shieldEnd) shield = false;
  if (speedBoost && Date.now() > speedEnd) {
    speedBoost = false;
    car.speed = 5;
  }

  score++;
}

// ================== DRAW ==================
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Car (upside down)
  ctx.save();
  ctx.translate(car.x + car.w / 2, car.y + car.h / 2);
  ctx.rotate(Math.PI);
  ctx.drawImage(carImg, -car.w / 2, -car.h / 2, car.w, car.h);
  ctx.restore();

  // Shield ring
  if (shield) {
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(car.x + car.w / 2, car.y + car.h / 2, 45, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Obstacles
  ctx.fillStyle = "red";
  obstacles.forEach(o => ctx.fillRect(o.x, o.y, o.w, o.h));

  // Powerups
  powerups.forEach(p => {
    ctx.fillStyle = p.type === "shield" ? "cyan" : "orange";
    ctx.fillRect(p.x, p.y, p.w, p.h);
  });

  // UI
  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  ctx.fillText(`Score: ${score}`, 10, 25);
  ctx.fillText(`High: ${highScore}`, 10, 45);

  if (shield) {
    ctx.fillStyle = "cyan";
    ctx.fillRect(10, 55, ((shieldEnd - Date.now()) / 20000) * 120, 8);
  }
  if (speedBoost) {
    ctx.fillStyle = "orange";
    ctx.fillRect(10, 70, ((speedEnd - Date.now()) / 20000) * 120, 8);
  }

  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "30px Arial";
    ctx.fillText("GAME OVER", 110, 300);
    ctx.font = "18px Arial";
    ctx.fillText("Tap Restart", 140, 330);
    restartBtn.style.display = "block";
  }
}

// ================== LOOP ==================
function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}
loop();

// ================== RESET ==================
function resetGame() {
  obstacles = [];
  powerups = [];
  score = 0;
  shield = false;
  speedBoost = false;
  car.x = 175;
  gameOver = false;
}
