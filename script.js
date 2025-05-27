document.addEventListener('DOMContentLoaded', () => {
    // Elementos del DOM
    const postersContainer = document.getElementById('posters-container');
    const startBtn = document.getElementById('start-btn');
    const timeElement = document.getElementById('time');
    const livesElement = document.getElementById('lives');
    const gameOverScreen = document.getElementById('game-over');
    const restartBtn = document.getElementById('restart-btn');
    const muteBtn = document.getElementById('mute-btn');
    const gameMusic = document.getElementById('game-music');
    const winMessage = document.getElementById('win-message');
    const winRestartBtn = document.getElementById('win-restart-btn');
    
    // Variables de juego
    let VALID_ZONE = {};
    let STREAMER_AREA = {};
    let timeLeft = 30;
    let lives = 3;
    let gameInterval;
    let timeInterval;
    let posters = [];
    let gameActive = false;
    let isMuted = false;
    let containerRect;

    // Configurar zonas dinámicas
    const calculateZones = () => {
        containerRect = postersContainer.getBoundingClientRect();
        VALID_ZONE = {
            left: containerRect.width * 0.1,
            right: containerRect.width * 0.9,
            top: containerRect.height * 0.7,
            bottom: containerRect.height,
        };
        
        STREAMER_AREA = {
            left: containerRect.width * 0.3,
            right: containerRect.width * 0.7,
            top: containerRect.height * 0.2,
            bottom: containerRect.height * 0.5,
        };
    };

    // Crear póster
    const createPoster = () => {
        const poster = document.createElement('div');
        poster.className = 'poster';
        postersContainer.appendChild(poster);

        // Tamaño responsive del póster
        const posterSize = Math.min(containerRect.width * 0.15, 150);
        poster.style.width = `${posterSize}px`;
        poster.style.height = `${posterSize * 1.33}px`;

        calculateZones();
        
        // Posicionamiento inicial seguro
        let x, y, isValidPosition;
        do {
            x = Math.random() * (containerRect.width - posterSize);
            y = Math.random() * (containerRect.height - posterSize);
            
            isValidPosition = !(
                x + posterSize > STREAMER_AREA.left && 
                x < STREAMER_AREA.right &&
                y + posterSize > STREAMER_AREA.top && 
                y < STREAMER_AREA.bottom
            );
        } while (!isValidPosition);

        poster.style.left = `${x}px`;
        poster.style.top = `${y}px`;

        // Manejo de eventos
        let isDragging = false;
        let offsetX, offsetY;

        const startDrag = (clientX, clientY) => {
            if (!gameActive) return;
            isDragging = true;
            const rect = poster.getBoundingClientRect();
            offsetX = clientX - rect.left;
            offsetY = clientY - rect.top;
            poster.style.zIndex = '100'; // Traer al frente al arrastrar
        };

        // Eventos táctiles
        poster.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startDrag(e.touches[0].clientX, e.touches[0].clientY);
        });

        // Eventos de ratón
        poster.addEventListener('mousedown', (e) => {
            startDrag(e.clientX, e.clientY);
        });

        // Mover
        const moveHandler = (e) => {
            if (!isDragging || !gameActive) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            const x = clientX - containerRect.left - offsetX;
            const y = clientY - containerRect.top - offsetY;
            
            // Limitar movimientos a los bordes del contenedor
            const maxX = containerRect.width - poster.offsetWidth;
            const maxY = containerRect.height - poster.offsetHeight;
            
            poster.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
            poster.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
            
            updatePosterState(poster);
        };

        document.addEventListener('mousemove', moveHandler);
        document.addEventListener('touchmove', moveHandler, { passive: false });

        // Finalizar arrastre
        const endDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            poster.style.zIndex = '1'; // Restaurar z-index
            updatePosterState(poster);
            
            // Solo perder vida si está en estado inválido al soltar
            if (poster.classList.contains('invalid')) {
                loseLife();
            }
        };

        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);

        posters.push(poster);
    };

    // Actualizar estado del póster
    const updatePosterState = (poster) => {
        const rect = poster.getBoundingClientRect();
        
        // Coordenadas relativas al contenedor
        const relLeft = rect.left - containerRect.left;
        const relTop = rect.top - containerRect.top;
        const relRight = relLeft + rect.width;
        const relBottom = relTop + rect.height;

        // Validar zona
        const inValidZone = 
            relLeft >= VALID_ZONE.left &&
            relRight <= VALID_ZONE.right &&
            relTop >= VALID_ZONE.top &&
            relBottom <= VALID_ZONE.bottom;

        // Verificar superposición
        let overlapping = false;
        if (inValidZone) {
            overlapping = posters.some(p => 
                p !== poster &&
                p.classList.contains('valid') &&
                relLeft < (p.offsetLeft + p.offsetWidth) &&
                relRight > p.offsetLeft &&
                relTop < (p.offsetTop + p.offsetHeight) &&
                relBottom > p.offsetTop
            );
        }

        // Verificar streamer
        const coveringStreamer = 
            relLeft < STREAMER_AREA.right &&
            relRight > STREAMER_AREA.left &&
            relTop < STREAMER_AREA.bottom &&
            relBottom > STREAMER_AREA.top;

        poster.classList.toggle('valid', inValidZone && !overlapping);
        poster.classList.toggle('invalid', (inValidZone && overlapping) || coveringStreamer);
    };

    // Resto de funciones del juego
    const loseLife = () => {
        lives--;
        livesElement.textContent = lives;
        
        if (lives <= 0) {
            showGameOver();
        }
    };
    
    const checkWinCondition = () => {
        return posters.every(poster => {
            return poster.classList.contains('valid') && 
                 !poster.classList.contains('invalid');
        });
    };
    
    const updateTimer = () => {
        timeLeft--;
        timeElement.textContent = timeLeft;
        
        if (timeLeft <= 0) {
            checkWinCondition() ? showWinMessage() : showGameOver();
        }
    };
    
    const showGameOver = () => {
        gameActive = false;
        clearInterval(gameInterval);
        clearInterval(timeInterval);
        gameOverScreen.style.display = 'flex';
        gameMusic.pause();
    };
    
    const showWinMessage = () => {
        gameActive = false;
        clearInterval(gameInterval);
        clearInterval(timeInterval);
        winMessage.style.display = 'flex';
        gameMusic.pause();
    };
    
    const startGame = () => {
        gameActive = true;
        timeLeft = 30;
        lives = 3;
        timeElement.textContent = timeLeft;
        livesElement.textContent = lives;
        
        posters.forEach(poster => poster.remove());
        posters = [];
        gameOverScreen.style.display = 'none';
        winMessage.style.display = 'none';
        
        calculateZones(); // Calcular zonas al inicio
        
        // Reproducir música con manejo de errores
        gameMusic.currentTime = 0;
        gameMusic.play().catch(e => console.log("Error de audio:", e));
        
        // Crear 6 afiches iniciales
        for (let i = 0; i < 6; i++) {
            createPoster();
        }
        
        // Nuevo afiche cada 2 segundos
        gameInterval = setInterval(() => {
            if (posters.length < 10) {
                createPoster();
            }
        }, 2000);
        
        timeInterval = setInterval(updateTimer, 1000);
    };
    
    // Event listeners
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    winRestartBtn.addEventListener('click', startGame);
    
    muteBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        gameMusic.muted = isMuted;
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
    });
    
    // Inicialización
    calculateZones();
    window.addEventListener('resize', calculateZones);
    gameMusic.load();
});