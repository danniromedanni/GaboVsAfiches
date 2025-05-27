document.addEventListener('DOMContentLoaded', () => {
    const postersContainer = document.getElementById('posters-container');
    const startBtn = document.getElementById('start-btn');
    const timeElement = document.getElementById('time');
    const livesElement = document.getElementById('lives');
    const gameOverScreen = document.getElementById('game-over');
    const winMessage = document.getElementById('win-message');
    const muteBtn = document.getElementById('mute-btn');
    const gameMusic = document.getElementById('game-music');
    
    let timeLeft = 30;
    let lives = 3;
    let gameInterval;
    let posters = [];
    let isDragging = false;
    let currentPoster = null;
    let touchId = null;

    // Configuración inicial
    const VALID_ZONE = {
        left: 0.05,  // 5% del ancho
        right: 0.95, // 95% del ancho
        top: 0.72,   // 72% de la altura
        bottom: 0.95 // 95% de la altura
    };

    const STREAMER_ZONE = {
        left: 0.3,
        right: 0.7,
        top: 0.3,
        bottom: 0.6
    };

    // Funciones de control
    function getGameRect() {
        const gameContainer = document.querySelector('.game-container');
        return gameContainer.getBoundingClientRect();
    }

    function createPoster() {
        const poster = document.createElement('div');
        poster.className = 'poster';
        
        // Posición inicial aleatoria
        const gameRect = getGameRect();
        poster.style.left = `${Math.random() * (gameRect.width - 100)}px`;
        poster.style.top = `${Math.random() * (gameRect.height * 0.4)}px`;
        
        addDragEvents(poster);
        postersContainer.appendChild(poster);
        posters.push(poster);
    }

    function addDragEvents(poster) {
        const handleMove = (x, y) => {
            const gameRect = getGameRect();
            const newX = x - gameRect.left - 50; // Centrar en el dedo/cursor
            const newY = y - gameRect.top - 75;
            
            poster.style.left = `${Math.max(0, Math.min(newX, gameRect.width - 100))}px`;
            poster.style.top = `${Math.max(0, Math.min(newY, gameRect.height - 150))}px`;
            checkPosterState(poster);
        };

        // Eventos táctiles
        poster.addEventListener('touchstart', (e) => {
            if (!isDragging) {
                isDragging = true;
                touchId = e.changedTouches[0].identifier;
                const touch = e.changedTouches[0];
                handleMove(touch.clientX, touch.clientY);
            }
        }, { passive: false });

        poster.addEventListener('touchmove', (e) => {
            if (isDragging) {
                const touch = Array.from(e.changedTouches).find(t => t.identifier === touchId);
                if (touch) {
                    e.preventDefault();
                    handleMove(touch.clientX, touch.clientY);
                }
            }
        }, { passive: false });

        poster.addEventListener('touchend', () => {
            isDragging = false;
            touchId = null;
            checkPosterState(poster, true);
        });

        // Eventos de ratón
        poster.addEventListener('mousedown', (e) => {
            isDragging = true;
            handleMove(e.clientX, e.clientY);
            document.addEventListener('mousemove', mouseMove);
        });

        const mouseMove = (e) => {
            if (isDragging) {
                handleMove(e.clientX, e.clientY);
            }
        };

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                document.removeEventListener('mousemove', mouseMove);
                checkPosterState(poster, true);
            }
        });
    }

    function checkPosterState(poster, finalCheck = false) {
        const gameRect = getGameRect();
        const posterRect = poster.getBoundingClientRect();
        
        // Conversión a porcentajes
        const posterLeft = (posterRect.left - gameRect.left) / gameRect.width;
        const posterRight = (posterRect.right - gameRect.left) / gameRect.width;
        const posterTop = (posterRect.top - gameRect.top) / gameRect.height;
        const posterBottom = (posterRect.bottom - gameRect.top) / gameRect.height;

        // Verificar zona válida
        const inValidZone = posterLeft >= VALID_ZONE.left &&
                          posterRight <= VALID_ZONE.right &&
                          posterTop >= VALID_ZONE.top &&
                          posterBottom <= VALID_ZONE.bottom;

        // Verificar streamer
        const inStreamerZone = posterLeft < STREAMER_ZONE.right &&
                              posterRight > STREAMER_ZONE.left &&
                              posterTop < STREAMER_ZONE.bottom &&
                              posterBottom > STREAMER_ZONE.top;

        // Verificar superposición
        let overlapping = false;
        if (inValidZone) {
            overlapping = posters.some(p => 
                p !== poster && 
                checkCollision(posterRect, p.getBoundingClientRect())
            );
        }

        // Actualizar clases
        poster.classList.toggle('valid', inValidZone && !overlapping);
        poster.classList.toggle('invalid', inValidZone && overlapping || inStreamerZone);

        // Penalización final
        if (finalCheck && (overlapping || inStreamerZone)) {
            loseLife();
        }
    }

    function checkCollision(rect1, rect2) {
        return !(rect1.right < rect2.left || 
               rect1.left > rect2.right || 
               rect1.bottom < rect2.top || 
               rect1.top > rect2.bottom);
    }

    function loseLife() {
        lives--;
        livesElement.textContent = lives;
        if (lives <= 0) showGameOver();
    }

    function showGameOver() {
        gameOverScreen.style.display = 'flex';
        stopGame();
    }

    function showWin() {
        winMessage.style.display = 'flex';
        stopGame();
    }

    function stopGame() {
        clearInterval(gameInterval);
        gameMusic.pause();
    }

    function startGame() {
        // Resetear juego
        timeLeft = 30;
        lives = 3;
        posters.forEach(p => p.remove());
        posters = [];
        gameOverScreen.style.display = 'none';
        winMessage.style.display = 'none';
        timeElement.textContent = timeLeft;
        livesElement.textContent = lives;

        // Iniciar música
        gameMusic.currentTime = 0;
        gameMusic.play();

        // Temporizador
        const timer = setInterval(() => {
            timeLeft--;
            timeElement.textContent = timeLeft;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                checkWinCondition() ? showWin() : showGameOver();
            }
        }, 1000);

        // Generar afiches
        gameInterval = setInterval(() => {
            if (posters.length < 8) createPoster();
        }, 2000);
    }

    function checkWinCondition() {
        return posters.every(p => 
            p.classList.contains('valid') && 
            !p.classList.contains('invalid')
        );
    }

    // Eventos
    startBtn.addEventListener('click', startGame);
    document.getElementById('restart-btn').addEventListener('click', startGame);
    document.getElementById('win-restart-btn').addEventListener('click', startGame);
    
    muteBtn.addEventListener('click', () => {
        gameMusic.muted = !gameMusic.muted;
        muteBtn.textContent = gameMusic.muted ? '🔇' : '🔊';
    });

    // Iniciar en móviles
    if ('ontouchstart' in window) {
        document.body.classList.add('touch-device');
    }
});