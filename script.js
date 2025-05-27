document.addEventListener('DOMContentLoaded', () => {
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
    
    const VALID_ZONE = {
        left: 50,
        right: 750,
        top: 430,
        bottom: 580
    };
    
    const STREAMER_AREA = {
        left: 250,
        right: 550,
        top: 200,
        bottom: 400
    };
    
    let timeLeft = 30;
    let lives = 3;
    let gameInterval;
    let posterCheckInterval;
    let timeInterval;
    let posters = [];
    let gameActive = false;
    let isMuted = false;
    
    const createPoster = () => {
        const poster = document.createElement('div');
        poster.className = 'poster';
        
        // Posición inicial aleatoria segura
        let x, y;
        do {
            x = Math.random() * 600;
            y = Math.random() * 300;
        } while (
            (x > STREAMER_AREA.left - 100 && x < STREAMER_AREA.right) ||
            (y > STREAMER_AREA.top - 100 && y < STREAMER_AREA.bottom)
        );
        
        poster.style.left = `${x}px`;
        poster.style.top = `${y}px`;
        
        let isDragging = false;
        let offsetX, offsetY;
        
        const updatePosterState = () => {
            const rect = poster.getBoundingClientRect();
            
            // 1. Verificar si está en zona válida
            const inValidZone = 
                rect.left >= VALID_ZONE.left &&
                rect.right <= VALID_ZONE.right &&
                rect.top >= VALID_ZONE.top &&
                rect.bottom <= VALID_ZONE.bottom;
            
            // 2. Verificar superposición solo en zona válida
            let overlapping = false;
            if (inValidZone) {
                overlapping = posters.some(p => 
                    p !== poster && 
                    rect.left < p.getBoundingClientRect().right &&
                    rect.right > p.getBoundingClientRect().left &&
                    rect.top < p.getBoundingClientRect().bottom &&
                    rect.bottom > p.getBoundingClientRect().top
                );
            }
            
            // 3. Verificar si cubre al streamer
            const coveringStreamer = 
                rect.left < STREAMER_AREA.right &&
                rect.right > STREAMER_AREA.left &&
                rect.top < STREAMER_AREA.bottom &&
                rect.bottom > STREAMER_AREA.top;
            
            // Actualizar clases
            poster.classList.toggle('valid', inValidZone && !overlapping);
            poster.classList.toggle('invalid', (inValidZone && overlapping) || coveringStreamer);
        };
        
        poster.addEventListener('mousedown', (e) => {
            if (!gameActive) return;
            isDragging = true;
            offsetX = e.clientX - poster.getBoundingClientRect().left;
            offsetY = e.clientY - poster.getBoundingClientRect().top;
            poster.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging || !gameActive) return;
            
            const x = e.clientX - offsetX;
            const y = e.clientY - offsetY;
            
            poster.style.left = `${x}px`;
            poster.style.top = `${y}px`;
            updatePosterState();
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            if (gameActive) poster.style.cursor = 'grab';
            updatePosterState();
            
            // Perder vida solo si está en estado inválido al soltar
            if (poster.classList.contains('invalid')) {
                loseLife();
            }
        });
        
        postersContainer.appendChild(poster);
        posters.push(poster);
    };
    
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
        
        gameMusic.currentTime = 0;
        gameMusic.play();
        
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
    
    startBtn.addEventListener('click', startGame);
    restartBtn.addEventListener('click', startGame);
    winRestartBtn.addEventListener('click', startGame);
    
    muteBtn.addEventListener('click', () => {
        isMuted = !isMuted;
        gameMusic.muted = isMuted;
        muteBtn.textContent = isMuted ? '🔇' : '🔊';
    });
    
    gameMusic.load();
});