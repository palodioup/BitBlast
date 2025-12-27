// Create or use existing canvas
let canvas = document.getElementById('gameCanvas');
if (!canvas) {
  canvas = document.createElement('canvas');
  canvas.id = 'gameCanvas';
  document.body.appendChild(canvas);
}
canvas.width = 400;
canvas.height = 600;
const ctx = canvas.getContext('2d');

const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

// Car properties
let carImg = new Image();
carImg.src = './img/GRCAR.png';

let carWidth = 50; 
let carHeight = 0;  
let carX = 0;
let carY = 0;
let carSpeed = 5;

let paused = false;
let obstacles = [];
let powerUps = [];
let particles = [];
const keys = {};
let score = 0; // time-based score
let highScore = localStorage.getItem('highScore') || 0;

// Power-up states
let shieldActive = false;
let speedBoostActive = false;
let cheatActive = false;
let shieldEndTime = 0;
let speedEndTime = 0;

// Flash effect
let flashActive = false;
let flashEndTime = 0;

// Cheat code detection (only before game starts)
let cheatInput = '';
const CHEAT_CODE = 'akanji';
let gameStarted = false;

// Keyboard input
window.addEventListener('keydown', function(e) {
  keys[e.key] = true;

  // Pause toggle
  if (e.key === 'p' || e.key === 'P') paused = !paused;

  // Cheat code only works before the game starts
  if (!gameStarted) {
    cheatInput += e.key.toLowerCase();
    if (cheatInput.endsWith(CHEAT_CODE)) {
      shieldActive = true;
      cheatActive = true;
      shieldEndTime = Infinity;
      flashActive = true;
      flashEndTime = Date.now() + 300;
      alert('Infinite Shield Activated!');
      cheatInput = '';
    }
    if (cheatInput.length > CHEAT_CODE.length) {
      cheatInput = cheatInput.slice(-CHEAT_CODE.length);
    }
  }
});
window.addEventListener('keyup', function(e) {
  keys[e.key] = false;
});

// Draw car (upside-down)
function drawCar() {
  ctx.save();
  ctx.translate(carX + carWidth / 2, carY + carHeight / 2);
  ctx.rotate(Math.PI);
  ctx.drawImage(carImg, -carWidth / 2, -carHeight / 2, carWidth, carHeight);
  ctx.restore();

  // Shield outline
  if (shieldActive) {
    ctx.strokeStyle = 'cyan';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(carX + carWidth/2, carY + carHeight/2, carWidth, 0, 2 * Math.PI);
    ctx.stroke();
  }

  // Flash effect
  if (flashActive) {
    ctx.strokeStyle = 'yellow';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(carX + carWidth/2, carY + carHeight/2, carWidth + 5, 0, 2 * Math.PI);
    ctx.stroke();
    if (Date.now() > flashEndTime) flashActive = false;
  }
}

// Particle system for flash effect
function createParticles() {
  for (let i = 0; i < 15; i++) {
    particles.push({
      x: carX + carWidth/2,
      y: carY + carHeight/2,
      vx: (Math.random() - 0.5) * 4,
      vy: (Math.random() - 0.5) * 4,
      alpha: 1
    });
  }
}

function drawParticles() {
  particles.forEach(p => {
    ctx.fillStyle = `rgba(255, 255, 0, ${p.alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, 2 * Math.PI);
    ctx.fill();

    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.05;
  });
  particles = particles.filter(p => p.alpha > 0);
}

// Draw obstacles
function drawObstacles() {
  ctx.fillStyle = 'yellow';
  obstacles.forEach(obs => ctx.fillRect(obs.x, obs.y, obs.width, obs.height));
}

// Draw power-ups
function drawPowerUps() {
  powerUps.forEach(p => {
    ctx.fillStyle = p.type === 'shield' ? 'cyan' : 'orange';
    ctx.fillRect(p.x, p.y, p.width, p.height);
  });
}

// Draw timers above the car
function drawPowerUpTimers() {
  const barWidth = carWidth;
  const barHeight = 5;
  const yOffset = 10;

  if (shieldActive && shieldEndTime !== Infinity) {
    let remaining = Math.max(0, (shieldEndTime - Date.now()) / 1000);
    ctx.fillStyle = 'cyan';
    ctx.fillRect(carX, carY - yOffset - barHeight*2, barWidth * remaining / 15, barHeight);
  }

  if (speedBoostActive) {
    let remaining = Math.max(0, (speedEndTime - Date.now()) / 1000);
    ctx.fillStyle = 'orange';
    ctx.fillRect(carX, carY - yOffset - barHeight, barWidth * remaining / 15, barHeight);
  }
}

// Update obstacles
function updateObstacles() {
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const obs = obstacles[i];
    obs.y += obs.speed;
    if (obs.y > canvasHeight) obstacles.splice(i, 1);
  }

  if (Math.random() < 0.02) {
    const width = 50 + Math.random() * 50;
    obstacles.push({
      x: Math.random() * (canvasWidth - width),
      y: -20,
      width: width,
      height: 20,
      speed: 3
    });
  }
}

// Update power-ups
function updatePowerUps() {
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const p = powerUps[i];
    p.y += 2;

    // Collision with car
    if (carX < p.x + p.width && carX + carWidth > p.x &&
        carY < p.y + p.height && carY + carHeight > p.y) {
      if (p.type === 'shield') activateShield();
      else if (p.type === 'speed') activateSpeedBoost();

      // Flash effect & particles
      flashActive = true;
      flashEndTime = Date.now() + 300;
      createParticles();

      powerUps.splice(i,1);
    }

    if (p.y > canvasHeight) powerUps.splice(i,1);
  }

  const random = Math.random();
  if (random < 0.0005) { 
    powerUps.push({
      x: Math.random() * (canvasWidth - 30),
      y: -30,
      width: 30,
      height: 30,
      type: 'shield'
    });
  } else if (random < 0.008) {
    powerUps.push({
      x: Math.random() * (canvasWidth - 30),
      y: -30,
      width: 30,
      height: 30,
      type: 'speed'
    });
  }
}

// Activate shield
function activateShield() {
  if (cheatActive) return; // infinite shield
  shieldActive = true;
  shieldEndTime = Date.now() + 15000;
  setTimeout(() => { shieldActive = false; }, 15000);
}

// Activate speed boost
function activateSpeedBoost() {
  if (speedBoostActive) return;
  speedBoostActive = true;
  carSpeed *= 2;
  speedEndTime = Date.now() + 15000;
  setTimeout(() => { speedBoostActive = false; carSpeed /= 2; }, 15000);
}

// Move car
function moveCar() {
  if (keys['ArrowLeft'] && carX > 0) carX -= carSpeed;
  if (keys['ArrowRight'] && carX < canvasWidth - carWidth) carX += carSpeed;
}

// Collision detection
function checkCollision() {
  if (shieldActive) return false;
  for (let i = 0; i < obstacles.length; i++) {
    const obs = obstacles[i];
    if (carX < obs.x + obs.width && carX + carWidth > obs.x &&
        carY < obs.y + obs.height && carY + carHeight > obs.y)
      return true;
  }
  return false;
}

// Draw score and high score
function drawScore() {
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('Score: ' + score, 10, 30);
  ctx.fillText('High Score: ' + highScore, 10, 55);
}

// Increase score by 1 every second
setInterval(() => {
  if (!paused && gameStarted) score++;
}, 1000);

// Main game loop
function gameLoop() {
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  if (!paused) {
    moveCar();
    updateObstacles();
    updatePowerUps();

    if (checkCollision()) {
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
      }
      alert("Game Over! Your score: " + score + "\nHigh Score: " + highScore);
      location.reload();
      return;
    }
  }

  drawCar();
  drawObstacles();
  drawPowerUps();
  drawPowerUpTimers();
  drawParticles();
  drawScore();

  if (paused) {
    ctx.fillStyle = 'white';
    ctx.font = '30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvasWidth / 2, canvasHeight / 2);
  }

  requestAnimationFrame(gameLoop);
}

// Start game once car image loads
carImg.onload = function() {
  const aspectRatio = carImg.height / carImg.width;
  carHeight = carWidth * aspectRatio;
  carX = canvasWidth / 2 - carWidth / 2;
  carY = canvasHeight - carHeight - 10;

  gameStarted = true; // game officially starts
  gameLoop();
};
