 // Canvas Setup
 const canvas = document.getElementById('gameCanvas');
 const ctx = canvas.getContext('2d');
 const scoreElement = document.getElementById('score');
 const highScoreElement = document.getElementById('highScore');
 const gameOverElement = document.getElementById('gameOver');
 const startBtn = document.getElementById('startBtn');
 const pauseBtn = document.getElementById('pauseBtn');
 const powerupIndicator = document.getElementById('powerupIndicator');

 // Game Variables
 let gridSize = 20;
 let snake = [];
 let food = {};
 let powerup = {};
 let dx = gridSize;
 let dy = 0;
 let score = 0;
 let highScore = localStorage.getItem('snakeHighScore') || 0;
 let gameInterval;
 let gameSpeed = 150;
 let gameRunning = false;
 let isPaused = false;
 let multiplier = 1;
 let powerupActive = false;

 // Responsive Canvas
 function resizeCanvas() {
     const container = document.querySelector('.game-container');
     const size = Math.min(container.offsetWidth, container.offsetHeight);
     canvas.width = size;
     canvas.height = size;
     gridSize = Math.max(15, Math.floor(size / 20));
 }

 window.addEventListener('resize', resizeCanvas);
 resizeCanvas();

 // Mobile Controls
 const setupMobileControls = () => {
     const controls = {
         upBtn: () => { if (dy === 0) { dx = 0; dy = -gridSize; } },
         leftBtn: () => { if (dx === 0) { dx = -gridSize; dy = 0; } },
         rightBtn: () => { if (dx === 0) { dx = gridSize; dy = 0; } },
         downBtn: () => { if (dy === 0) { dx = 0; dy = gridSize; } }
     };

     Object.entries(controls).forEach(([id, fn]) => {
         document.getElementById(id).addEventListener('touchstart', (e) => {
             e.preventDefault();
             fn();
         });
     });
 }

 // Initialize mobile controls
 if ('ontouchstart' in window) {
     setupMobileControls();
     document.querySelector('.mobile-controls').style.display = 'grid';
 }

 // Game Functions
 function initGame() {
     const tileCount = canvas.width / gridSize;
     snake = [
         { x: 5 * gridSize, y: 5 * gridSize },
         { x: 4 * gridSize, y: 5 * gridSize },
         { x: 3 * gridSize, y: 5 * gridSize }
     ];
     spawnFood();
     spawnPowerup();
     dx = gridSize;
     dy = 0;
     score = 0;
     multiplier = 1;
     scoreElement.textContent = score;
     highScoreElement.textContent = highScore;
     gameOverElement.style.display = 'none';
     powerupIndicator.style.display = 'none';
 }

 function spawnFood() {
     const tileCount = canvas.width / gridSize;
     food = {
         x: Math.floor(Math.random() * tileCount) * gridSize,
         y: Math.floor(Math.random() * tileCount) * gridSize,
         type: Math.random() < 0.1 ? 'gold' : 'normal'
     };
     if (snake.some(segment => segment.x === food.x && segment.y === food.y)) {
         spawnFood();
     }
 }

 function spawnPowerup() {
     const tileCount = canvas.width / gridSize;
     powerup = {
         x: Math.floor(Math.random() * tileCount) * gridSize,
         y: Math.floor(Math.random() * tileCount) * gridSize,
         type: ['speed', 'multiplier'][Math.floor(Math.random() * 2)]
     };
     if (snake.some(segment => segment.x === powerup.x && segment.y === powerup.y)) {
         spawnPowerup();
     }
 }

 function createParticles(x, y) {
     for (let i = 0; i < 10; i++) {
         const particle = document.createElement('div');
         particle.className = 'particle';
         particle.style.left = x + 'px';
         particle.style.top = y + 'px';
         particle.style.width = particle.style.height = Math.random() * 4 + 2 + 'px';
         document.body.appendChild(particle);
         setTimeout(() => particle.remove(), 500);
     }
 }

 function drawGame() {
     ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
     ctx.fillRect(0, 0, canvas.width, canvas.height);

     ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
     const tileCount = canvas.width / gridSize;
     for (let i = 0; i < tileCount; i++) {
         for (let j = 0; j < tileCount; j++) {
             ctx.strokeRect(i * gridSize, j * gridSize, gridSize, gridSize);
         }
     }

     snake.forEach((segment, index) => {
         const gradient = ctx.createLinearGradient(
             segment.x, segment.y, 
             segment.x + gridSize, segment.y + gridSize
         );
         gradient.addColorStop(0, index === 0 ? '#0f0' : '#0c0');
         gradient.addColorStop(1, '#090');
         ctx.fillStyle = gradient;
         ctx.fillRect(segment.x, segment.y, gridSize - 2, gridSize - 2);
     });

     ctx.fillStyle = food.type === 'gold' ? '#ffd700' : '#ff0000';
     ctx.beginPath();
     ctx.arc(food.x + gridSize/2, food.y + gridSize/2, gridSize/2 - 2, 0, Math.PI * 2);
     ctx.fill();

     if (!powerupActive) {
         ctx.fillStyle = powerup.type === 'speed' ? '#00ffff' : '#ff00ff';
         ctx.beginPath();
         ctx.arc(powerup.x + gridSize/2, powerup.y + gridSize/2, gridSize/2 - 2, 0, Math.PI * 2);
         ctx.fill();
     }
 }

 function updateGame() {
     const head = { x: snake[0].x + dx, y: snake[0].y + dy };

     if (head.x < 0 || head.x >= canvas.width || 
         head.y < 0 || head.y >= canvas.height ||
         snake.some(segment => segment.x === head.x && segment.y === head.y)) {
         gameOver();
         return;
     }

     snake.unshift(head);

     if (head.x === food.x && head.y === food.y) {
         createParticles(head.x, head.y);
         score += 10 * multiplier;
         if (food.type === 'gold') score += 20;
         scoreElement.textContent = score;
         spawnFood();
         gameSpeed = Math.max(50, gameSpeed - 1);
     } else {
         snake.pop();
     }

     if (!powerupActive && head.x === powerup.x && head.y === powerup.y) {
         activatePowerup(powerup.type);
         createParticles(head.x, head.y);
         spawnPowerup();
     }
 }

 function activatePowerup(type) {
     powerupActive = true;
     powerupIndicator.style.display = 'block';
     
     if (type === 'speed') {
         gameSpeed /= 2;
         powerupIndicator.textContent = 'Speed Boost!';
         powerupIndicator.style.color = '#00ffff';
     } else {
         multiplier = 2;
         powerupIndicator.textContent = '2x Multiplier!';
         powerupIndicator.style.color = '#ff00ff';
     }

     setTimeout(() => {
         powerupActive = false;
         powerupIndicator.style.display = 'none';
         if (type === 'speed') gameSpeed *= 2;
         else multiplier = 1;
     }, 5000);
 }

 function gameOver() {
     clearInterval(gameInterval);
     gameRunning = false;
     gameOverElement.style.display = 'block';
     startBtn.textContent = '🔄 Restart';
     if (score > highScore) {
         highScore = score;
         localStorage.setItem('snakeHighScore', highScore);
         highScoreElement.textContent = highScore;
     }
 }

 document.addEventListener('keydown', (e) => {
     if (!gameRunning || isPaused) return;

     switch(e.key) {
         case 'ArrowUp': if (dy === 0) { dx = 0; dy = -gridSize; } break;
         case 'ArrowDown': if (dy === 0) { dx = 0; dy = gridSize; } break;
         case 'ArrowLeft': if (dx === 0) { dx = -gridSize; dy = 0; } break;
         case 'ArrowRight': if (dx === 0) { dx = gridSize; dy = 0; } break;
     }
 });

 startBtn.addEventListener('click', () => {
     if (gameRunning) return;
     gameRunning = true;
     isPaused = false;
     initGame();
     startBtn.textContent = '🎮 Playing...';
     gameInterval = setInterval(gameLoop, gameSpeed);
 });

 pauseBtn.addEventListener('click', () => {
     if (!gameRunning) return;
     isPaused = !isPaused;
     pauseBtn.textContent = isPaused ? '▶ Resume' : '⏸ Pause';
 });

 function gameLoop() {
     if (!isPaused) {
         updateGame();
         drawGame();
     }
 }

 // Initial Setup
 initGame();
 highScoreElement.textContent = highScore;