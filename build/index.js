// ================= CREATE CANVAS =================
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.body.style.background = "#111";

const canvas = document.createElement("canvas");
document.body.appendChild(canvas);
const ctx = canvas.getContext("2d");

// ================= RESIZE =================
function resize() {
  const dpr = window.devicePixelRatio || 1;
  const w = Math.min(window.innerWidth, 420);
  const h = window.innerHeight;

  canvas.style.width = w + "px";
  canvas.style.height = h + "px";
  canvas.width = w * dpr;
  canvas.height = h * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  resetCar();
}
window.addEventListener("resize", resize);
resize();

// ================= GAME STATE =================
let car = { x: 0, y: 0, w: 50, h: 80, speed: 6 };
let obstacles = [];
let powerups = [];
let score = 0;
let highScore = Number(localStorage.getItem("highScore")) || 0;

let shield = false;
let speedBoost = false;
let shieldTimer = 0;
let speedTimer = 0;

const keys = { left: false, right: false };

// ================= INPUT =================
document.addEventListener("keydown", e => {
  if (e.key === "ArrowLeft") keys.left = true;
  if (e.key === "ArrowRight") keys.right = true;
});

document.addEventListener("keyup", e => {
  if (e.key === "ArrowLeft") keys.left = false;
  if (e.key === "ArrowRight") keys.right = false;
});

document.addEventListener("touchstart", e => {
  const x = e.touches[0].clientX;
  keys.left = x < window.innerWidth / 2;
  keys.right = x >= window.innerWidth / 2;
});

document.addEventListener("touchend", () => {
  keys.left = false;
  keys.right = false;
});

// ================= GAME SETUP =================
function resetCar() {
  car.x = canvas.width / 2 - car.w / 2;
  car.y = canvas.height - car.h - 20;
}

setInterval(() => {
  obstacles.push({
    x: Math.random() * (canvas.width - 50),
    y: -40,
    w: 50,
    h: 25,
    speed: 4
  });
}, 900);

setInterval(() => {
  powerups.push({
    x: Math.random() * (canvas.width - 30),
    y: -40,
    w: 30,
    h: 30,
    type: Math.random() > 0.5 ? "shield" : "speed"
  });
}, 7000);

// ================= GAME LOOP =================
function update() {
  if (keys.left && car.x > 0) car.x -= car.speed;
  if (keys.right && car.x < canvas.width - car.w) car.x += car.speed;

  obstacles.forEach((o, i) => {
    o.y += o.speed;
    if (collide(o, car)) {
      if (!shield) return gameOver();
      obstacles.splice(i, 1);
    }
    if (o.y > canvas.height) obstacles.splice(i, 1);
  });

  powerups.forEach((p, i) => {
    p.y += 2;
    if (collide(p, car)) {
      if (p.type === "shield") {
        shield = true;
        shieldTimer = 600;
      } else {
        speedBoost = true;
        speedTimer = 600;
        car.speed = 9;
      }
      powerups.splice(i, 1);
    }
  });

  if (shield && --shieldTimer <= 0) shield = false;
  if (speedBoost && --speedTimer <= 0) {
    speedBoost = false;
    car.speed = 6;
  }

  score++;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Car
  ctx.fillStyle = "#00f6ff";
  ctx.fillRect(car.x, car.y, car.w, car.h);

  // Shield
  if (shield) {
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(car.x + car.w / 2, car.y + car.h / 2, 40, 0, Math.PI * 2);
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

  ctx.fillStyle = "white";
  ctx.font = "16px Arial";
  ctx.fillText("Score: " + score, 10, 20);
  ctx.fillText("High: " + highScore, 10, 40);
}

function collide(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function gameOver() {
  highScore = Math.max(highScore, score);
  localStorage.setItem("highScore", highScore);
  alert("Game Over! Score: " + score);
  location.reload();
}

function loop() {
  update();
  draw();
  requestAnimationFrame(loop);
}

resetCar();
loop();
