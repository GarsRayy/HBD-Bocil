// ==========================================================================
// GAMEBOY BIRTHDAY - FULL SCRIPT (UPDATED FOR 3 PHOTOS @ 480x308)
// ==========================================================================

// Game state management
let currentScreen = 'loading';
let tetrisGame = null;
let gameScore = 0;
let gameHighScore = localStorage.getItem('tetrisHighScore') || 0;
let gameLevel = 1;
let gameLines = 0;
let typewriterInterval = null;
let isTyping = false;
let currentPhotoIndex = 0;
let currentMusicIndex = 0;
let isPlaying = false;
let playbackInterval = null;

let selectedMenuIndex = 0;
const menuItems = ['message', 'gallery', 'music', 'tetris']; // Urutan sesuai grid 2x2

// Konami Code State
const konamiCode = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'];
let konamiHistory = [];

const audio = {
    mainBgm: null, tetrisBgm: null, click: null, shutter: null, startup: null, win: null,
    init: function() {
        this.mainBgm = document.getElementById('bgm-main');
        this.tetrisBgm = document.getElementById('bgm-tetris');
        this.click = document.getElementById('sfx-click');
        this.shutter = document.getElementById('sfx-shutter');
        this.startup = document.getElementById('sfx-startup');
        this.win = new Audio('audio/win.mp3'); // Pastikan file win.mp3 ada
        if(this.mainBgm) this.mainBgm.volume = 0.5;
        if(this.tetrisBgm) this.tetrisBgm.volume = 0.4;
    },
    playClick: function() { if (this.click) { this.click.currentTime = 0; this.click.play().catch(() => {}); } },
    playShutter: function() { if (this.shutter) { this.shutter.currentTime = 0; this.shutter.play().catch(() => {}); } },
    playStartup: function() { if (this.startup) { this.startup.currentTime = 0; this.startup.play().catch(() => {}); } },
    playWin: function() { if (this.win) { this.win.currentTime = 0; this.win.play().catch(() => {}); } },
    startMainBgm: function() {
        if (this.tetrisBgm) this.tetrisBgm.pause();
        if (this.mainBgm && this.mainBgm.paused) this.mainBgm.play().catch(() => {});
    },
    startTetrisBgm: function() {
        if (this.mainBgm) this.mainBgm.pause();
        if (this.tetrisBgm) { this.tetrisBgm.currentTime = 0; this.tetrisBgm.play().catch(() => {}); }
    }
};
// === KONFIGURASI PHOTOBOOTH TERBARU ===
const PHOTO_WIDTH = 480;  // Lebar target sesuai permintaan
const PHOTO_HEIGHT = 308; // Tinggi target sesuai permintaan
const PHOTO_COUNT = 3;    // Jumlah foto dikurangi jadi 3
let videoStream = null;
let capturedPhotos = []; 

const FRAME_URL = 'images/2025.png'; 
const FRAME_WIDTH = 540;   // Misal: lebar asli gambar 2025.jpg (atau lebar yang diinginkan)
const FRAME_HEIGHT = 1620; // Misal: tinggi asli gambar 2025.jpg
// Posisi & Ukuran Foto di dalam Frame saat Download:
const DL_PHOTO_WIDTH = 480;  // Lebar foto di dalam frame
const DL_PHOTO_HEIGHT = 350; // Tinggi foto di dalam frame
const DL_START_X = 30;       // Jarak dari kiri frame ke foto
const DL_START_Y = 90;      // Jarak dari atas frame ke foto pertama
const DL_GAP_Y = 95;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    audio.init();
    showScreen('loading');
    simulateLoading();
    addEventListeners();
    initializeTetris();
    initBattery();
}

function initBattery() {
    const batteryEl = document.querySelector('.battery');
    if (batteryEl) {
        // Ganti ikon statis dengan bar dinamis
        batteryEl.innerHTML = '<div class="battery-level"><div class="battery-fill"></div></div>';
        let level = 100;
        setInterval(() => {
            level = Math.max(0, level - 1); // Kurangi 1% setiap interval
            updateBatteryUI(level);
        }, 60000); // Update setiap 1 menit (simulasi)
    }
}

function updateBatteryUI(level) {
    const fill = document.querySelector('.battery-fill');
    if (fill) {
        fill.style.width = level + '%';
        if (level <= 20) fill.className = 'battery-fill low';
        else if (level <= 50) fill.className = 'battery-fill medium';
        else fill.className = 'battery-fill';
    }
}

function simulateLoading() {
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.querySelector('.progress-text');
    const loadingText = document.querySelector('.loading-text');
    const loadingScreen = document.getElementById('loading-screen');
    
    let progress = 0;
    const loadingMessages = [
        '> INITIALIZING..._',
        '> LOADING MEMORIES..._',
        '> PREPARING SURPRISE..._',
        '> ALMOST READY..._',
        '> LOADING COMPLETE!_'
    ];
    
    let messageIndex = 0;
    
    const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress > 100) progress = 100;
        
        progressFill.style.width = progress + '%';
        progressText.textContent = Math.floor(progress) + '%';
        
        const newMessageIndex = Math.floor((progress / 100) * (loadingMessages.length - 1));
        if (newMessageIndex !== messageIndex && newMessageIndex < loadingMessages.length) {
            messageIndex = newMessageIndex;
            loadingText.style.opacity = '0';
            setTimeout(() => {
                loadingText.innerHTML = loadingMessages[messageIndex];
                loadingText.style.opacity = '1';
            }, 200);
        }
        
        if (progress >= 100) {
            clearInterval(interval);
            audio.playStartup();
            loadingScreen.classList.add('loading-complete');
            setTimeout(() => {
                transitionToMainScreen();
            }, 1000);
        }
    }, 200);
}

function transitionToMainScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    const mainScreen = document.getElementById('main-screen');
    
    loadingScreen.classList.add('fade-out');
    
    setTimeout(() => {
        loadingScreen.classList.remove('active', 'fade-out', 'loading-complete');
        mainScreen.classList.add('active', 'screen-entering');
        currentScreen = 'main';

        audio.startMainBgm();
        
        setTimeout(() => {
            initializeMainScreen();
        }, 100);
        
        setTimeout(() => {
            mainScreen.classList.remove('screen-entering');
        }, 1200);
        
    }, 600);
}

function initializeMainScreen() {
   updateMenuSelection();
}

function updateMenuSelection() {
    document.querySelectorAll('.menu-btn').forEach((btn, index) => {
        if (index === selectedMenuIndex) btn.classList.add('selected');
        else btn.classList.remove('selected');
    });
}

function showScreen(screenName) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => {
        screen.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(screenName + '-screen');
    if (targetScreen) {
        targetScreen.classList.add('active');
        currentScreen = screenName;
        
        if (screenName === 'tetris') {
            audio.startTetrisBgm();
        } else if (screenName !== 'loading') {
            // Jika kembali dari tetris atau pindah layar lain, pastikan Main BGM nyala
            audio.startMainBgm();
        }

        switch(screenName) {
            case 'message':
                setTimeout(initializeMessage, 100);
                break;
            case 'gallery':
                setTimeout(initializeGallery, 100);
                break;
            case 'music':
                setTimeout(initializeMusicPlayer, 100);
                break;
            case 'tetris':
                setTimeout(() => {
                    if (tetrisGame && !tetrisGame.gameRunning) {
                        startTetrisGame();
                    }
                }, 100);
                break;
        }
    }
}

// ===================================
// MESSAGE FUNCTIONS
// ===================================
function initializeMessage() {
    if (typewriterInterval) clearInterval(typewriterInterval);
    
    const pageScreen = document.querySelector('#message-screen .page-screen');
    if (pageScreen) {
        pageScreen.innerHTML = `
            <div class="page-header">Message</div>
            <div class="message-content"></div>
            <button class="skip-btn">SKIP</button>
        `;
        pageScreen.querySelector('.skip-btn').addEventListener('click', skipTypewriter);
    }
    setTimeout(startTypewriter, 300);
}

function startTypewriter() {
    const messageContent = document.querySelector('.message-content');
    if (!messageContent) return;
    
    const fullMessage = `Hi,

Happy Birthday!

Hari ini aku pengen kamu ngerasain semua hal positif dan keajaiban yang cuma bisa didapetin kalo kamu ada di dunia ini. Semoga segala keinginanmu tercapai, apalagi yang kocak-kocak dan gak biasa, karena kamu tuh unik banget! Aku selalu percaya kalau kamu bisa melewati semua tantangan dengan kekuatan dan semangat yang luar biasa.

Terima kasih udah jadi bagian hidup aku yang paling berharga. Kamu bener-bener bikin hari-hari aku jadi lebih berarti dan penuh warna. Semoga di tahun yang baru ini, kamu makin bahagia, makin sukses, dan tentunya makin cantik (walaupun udah cantik banget sih!).

I love you so much! 💕`;
    
    messageContent.innerHTML = '';
    let charIndex = 0;
    isTyping = true;
    
    if (typewriterInterval) clearInterval(typewriterInterval);
    
    typewriterInterval = setInterval(() => {
        if (charIndex < fullMessage.length) {
            const char = fullMessage[charIndex];
            messageContent.innerHTML += (char === '\n') ? '<br>' : char;
            charIndex++;
            messageContent.scrollTop = messageContent.scrollHeight;
        } else {
            clearInterval(typewriterInterval);
            isTyping = false;
        }
    }, 50);
}

function skipTypewriter() {
    if (isTyping && typewriterInterval) {
        clearInterval(typewriterInterval);
        const messageContent = document.querySelector('.message-content');
        if (messageContent) {
            const fullMessage = `Hi Cel,<br><br>Happy Birthday!<br><br>Hari ini aku pengen kamu ngerasain semua hal positif dan keajaiban yang cuma bisa didapetin kalo kamu ada di dunia ini. Semoga segala keinginanmu tercapai, apalagi yang kocak-kocak dan gak biasa, karena kamu tuh unik banget! Aku selalu percaya kalau kamu bisa melewati semua tantangan dengan kekuatan dan semangat yang luar biasa.<br><br>Terima kasih udah jadi bagian hidup aku yang paling berharga. Kamu bener-bener bikin hari-hari aku jadi lebih berarti dan penuh warna. Semoga di tahun yang baru ini, kamu makin bahagia, makin sukses, dan tentunya makin cantik (walaupun udah cantik banget sih!).<br><br>I love you so much! 💕`;
            messageContent.innerHTML = fullMessage;
            isTyping = false;
            messageContent.scrollTop = messageContent.scrollHeight;
        }
    }
}

// ===================================
// GALLERY FUNCTIONS (UPDATED FOR 480x308 & AUTO-CROP)
// ===================================

function initializeGallery() {
    const galleryContent = document.querySelector('.gallery-content');
    if (!galleryContent) return;
    
    capturedPhotos = [];
    
    const galleryHTML = `
        <div class="photobox-header">
            <div class="photobox-dot red"></div>
            <span class="photobox-title">LIVE PHOTOBOOTH</span>
            <div class="photobox-dot green"></div>
        </div>

        <div class="camera-viewfinder">
            <video id="camera-feed" autoplay playsinline></video>
            <canvas id="photo-canvas" style="display: none;"></canvas>
            <canvas id="download-canvas" style="display: none;"></canvas>
        </div>
        
        <div class="photobox-progress">Tekan MULAI SESI untuk menyalakan kamera</div>

        <div class="photobox-controls">
            <button class="photo-btn" id="session-btn">MULAI SESI</button>
            <button class="photo-btn" id="download-btn" style="display: none;">SIMPAN FOTO</button>
        </div>

        <div class="photo-display">
            <div class="photo-placeholder">Tempat foto akan muncul di sini...</div>
        </div>
    `;
    
    galleryContent.innerHTML = galleryHTML;
    
    setTimeout(() => {
        const sessionBtn = document.getElementById('session-btn');
        if (sessionBtn) {
            sessionBtn.addEventListener('click', startCameraSession);
        }
    }, 100);
}

async function startCameraSession() {
    const videoElement = document.getElementById('camera-feed');
    const sessionBtn = document.getElementById('session-btn');
    const downloadBtn = document.getElementById('download-btn');
    const progressDiv = document.querySelector('.photobox-progress');
    
    if (!videoElement || !sessionBtn || !progressDiv) return;

    setupPhotoStrip();
    progressDiv.textContent = 'Menyalakan kamera...';
    sessionBtn.disabled = true;
    downloadBtn.style.display = 'none';
    capturedPhotos = [];

    try {
        // Minta resolusi standar, nanti di-crop
        videoStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } }, 
            audio: false 
        });
        
        videoElement.srcObject = videoStream;
        videoElement.style.display = 'block';

        progressDiv.textContent = 'Kamera siap! Tekan untuk mulai.';
        sessionBtn.textContent = '📸 MULAI OTOMATIS';
        sessionBtn.disabled = false;
        
        sessionBtn.removeEventListener('click', startCameraSession);
        sessionBtn.addEventListener('click', startAutomaticCapture);

    } catch (err) {
        console.error("Error mengakses kamera: ", err);
        progressDiv.textContent = 'Kamera tidak diizinkan 😭';
        alert('Anda perlu mengizinkan akses kamera. Pastikan menggunakan HTTPS.');
    }
}

function setupPhotoStrip() {
    const photoDisplay = document.querySelector('.photo-display');
    let framesHTML = '';
    for (let i = 0; i < PHOTO_COUNT; i++) {
        framesHTML += `
            <div class="photo-frame" id="frame-${i + 1}">
                <div class="photo-content">Slot ${i + 1}</div>
            </div>
        `;
    }
    
    photoDisplay.innerHTML = `
        <div class="photo-strip">
            <div class="photo-strip-header">PHOTOSTRIP SESSION</div>
            <div class="photo-frames-container">
                ${framesHTML}
            </div>
            <div class="photo-strip-footer">💕 BIRTHDAY MEMORIES 💕</div>
        </div>
    `;
    currentPhotoIndex = 0;
}

async function runCountdown(seconds) {
    const progressDiv = document.querySelector('.photobox-progress');
    for (let i = seconds; i > 0; i--) {
        progressDiv.textContent = `${i}...`;
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    progressDiv.textContent = 'SMILE! 📸';
    await new Promise(resolve => setTimeout(resolve, 500));
}

// FUNGSI CROP BARU (PENTING AGAR TIDAK GEPENG)
function takeSnapshotInternal() {
    const videoElement = document.getElementById('camera-feed');
    const canvas = document.getElementById('photo-canvas');
    const context = canvas.getContext('2d');

    if (!videoElement || !canvas) return null;

    // Set ukuran canvas ke target 480x308
    canvas.width = PHOTO_WIDTH;
    canvas.height = PHOTO_HEIGHT;

    // Hitung rasio untuk cropping (object-fit: cover manual)
    const videoRatio = videoElement.videoWidth / videoElement.videoHeight;
    const targetRatio = PHOTO_WIDTH / PHOTO_HEIGHT;
    let sWidth, sHeight, sx, sy;

    if (videoRatio > targetRatio) {
        sHeight = videoElement.videoHeight;
        sWidth = sHeight * targetRatio;
        sy = 0;
        sx = (videoElement.videoWidth - sWidth) / 2;
    } else {
        sWidth = videoElement.videoWidth;
        sHeight = sWidth / targetRatio;
        sx = 0;
        sy = (videoElement.videoHeight - sHeight) / 2;
    }

    context.save();
    context.translate(canvas.width, 0);
    context.scale(-1, 1); // Efek cermin
    // Gambar dengan cropping
    context.drawImage(videoElement, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
    context.restore();

    return canvas.toDataURL('image/jpeg', 0.9);
}

async function startAutomaticCapture() {
    const sessionBtn = document.getElementById('session-btn');
    const downloadBtn = document.getElementById('download-btn');
    const framesContainer = document.querySelector('.photo-frames-container');

    sessionBtn.disabled = true;
    sessionBtn.textContent = 'MENGAMBIL FOTO...';
    downloadBtn.style.display = 'none';
    
    for (let i = 0; i < PHOTO_COUNT; i++) {
        await runCountdown(3);
        audio.playShutter();

        const photoDataUrl = takeSnapshotInternal();
        if (photoDataUrl) {
            capturedPhotos.push(photoDataUrl);

            const frame = document.getElementById(`frame-${i + 1}`);
            if (frame) {
                frame.classList.add('filled');
                frame.innerHTML = `
                    <img src="${photoDataUrl}" alt="Foto ${i + 1}" class="photo-image">
                    <div class="photo-overlay">
                        <div class="photo-content">Foto ${i + 1}</div>
                    </div>
                `;
                if (framesContainer) {
                    frame.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    stopCamera();
    document.querySelector('.photobox-progress').textContent = '🎉 FOTO SELESAI!';
    sessionBtn.textContent = 'ULANGI SESI';
    sessionBtn.disabled = false;
    downloadBtn.style.display = 'inline-block';

    sessionBtn.removeEventListener('click', startAutomaticCapture);
    sessionBtn.addEventListener('click', initializeGallery);
    
    downloadBtn.removeEventListener('click', downloadPhotoStrip);
    downloadBtn.addEventListener('click', downloadPhotoStrip);
}

async function downloadPhotoStrip() {
    const downloadBtn = document.getElementById('download-btn');
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'LAGI NYUSUN FRAME...';

    if (capturedPhotos.length === 0) {
        alert('Belum ada foto nih!');
        resetDownloadButton();
        return;
    }

    const canvas = document.getElementById('download-canvas');
    const ctx = canvas.getContext('2d');

    // 1. Atur ukuran kanvas sesuai frame
    canvas.width = FRAME_WIDTH;
    canvas.height = FRAME_HEIGHT;

    try {
        // 2. Muat gambar FRAME PNG
        const frameImg = await new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = (e) => reject('Gagal muat images/2025.png. Pastikan filenya ada!');
            img.src = FRAME_URL;
        });

        // 3. Muat semua FOTO user
        const userPhotos = await Promise.all(capturedPhotos.map(dataUrl => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = dataUrl;
            });
        }));

        // --- PROSES MENGGAMBAR (URUTAN DIBALIK) ---

        // 4. Bersihkan kanvas
        ctx.clearRect(0, 0, FRAME_WIDTH, FRAME_HEIGHT);

        // 5. GAMBAR FOTO DULUAN (agar posisinya di BELAKANG)
        // Kita isi background putih dulu di area foto agar jika PNG-nya transparan, tidak bolong tembus pandang.
        ctx.fillStyle = '#ffffff';
        userPhotos.forEach((img, index) => {
            const currentY = DL_START_Y + (index * (DL_PHOTO_HEIGHT + DL_GAP_Y));
            
            // (Opsional) Gambar kotak putih di belakang foto jika perlu
            // ctx.fillRect(DL_START_X, currentY, DL_PHOTO_WIDTH, DL_PHOTO_HEIGHT);

            // Gambar foto user
            ctx.drawImage(img, DL_START_X, currentY, DL_PHOTO_WIDTH, DL_PHOTO_HEIGHT);
        });

        // 6. BARU GAMBAR FRAME PNG DI ATASNYA
        ctx.drawImage(frameImg, 0, 0, FRAME_WIDTH, FRAME_HEIGHT);

        // 7. Download hasilnya
        const link = document.createElement('a');
        link.download = 'photostrip-birthday-special.png';
        link.href = canvas.toDataURL('image/png', 1.0);
        link.click();

        resetDownloadButton();

    } catch (error) {
        console.error('Gagal saat proses download:', error);
        alert('Gagal bikin photostrip: ' + error);
        resetDownloadButton();
    }
}

function resetDownloadButton() {
    const downloadBtn = document.getElementById('download-btn');
    if (downloadBtn) {
        downloadBtn.disabled = false;
        downloadBtn.textContent = 'SIMPAN FOTO';
    }
}

function stopCamera() {
    const videoElement = document.getElementById('camera-feed');
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
        if (videoElement) {
            videoElement.style.display = 'none';
        }
    }
}

// ===================================
// MUSIC FUNCTIONS
// ===================================

function initializeMusicPlayer() {
    const musicContent = document.querySelector('.music-content');
    if (!musicContent) return;
    
    musicContent.innerHTML = `
        <div class="spotify-container">
            <div class="spotify-header">
                <div class="spotify-logo">♪ Spotify Playlists</div>
            </div>
            <div class="spotify-embed-container">
                <iframe id="spotify-iframe" style="border-radius:12px" src="" width="100%" height="200" frameBorder="0" allowfullscreen="" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe>
            </div>
            <div class="playlist-controls">
                <button class="playlist-btn active" data-playlist="1">Playlist 1</button>
                <button class="playlist-btn" data-playlist="2">Playlist 2</button>
                <button class="playlist-btn" data-playlist="3">Playlist 3</button>
            </div>
            <div class="music-info">
                <div class="current-playlist">Now Playing: Birthday Special Mix</div>
                <div class="playlist-description">Lagu-lagu spesial untuk hari istimewa kamu ✨</div>
            </div>
        </div>
    `;
    
    addSpotifyPlayerListeners();
    loadSpotifyPlaylist(1);
}

function addSpotifyPlayerListeners() {
    const playlistBtns = document.querySelectorAll('.playlist-btn');
    playlistBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            playlistBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const playlistNum = parseInt(this.getAttribute('data-playlist'));
            loadSpotifyPlaylist(playlistNum);
        });
    });
}

function loadSpotifyPlaylist(playlistNumber) {
    const iframe = document.getElementById('spotify-iframe');
    const currentPlaylist = document.querySelector('.current-playlist');
    const playlistDescription = document.querySelector('.playlist-description');
    if (!iframe) return;
    
    const playlists = {
        1: { embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWYtQSOiZF6hj?si=0b945793c2934ba1', name: 'Birthday Special Mix', description: 'Lagu-lagu spesial untuk hari istimewa kamu ✨' },
        2: { embedUrl: 'https://open.spotify.com/embed/playlist/2iFBJqKpGdMJKpc72jOtOc?utm_source=generator', name: 'Choyya Vibes', description: 'Blend spotify kamu dan aku ❤️' },
        3: { embedUrl: 'https://open.spotify.com/embed/playlist/7dGB9r1L7pkovQPD3TAD4J?utm_source=generator', name: 'Happy Memories', description: 'Lagu-lagu yang mengingatkan kenangan indah 🌟' }
    };
    
    const selectedPlaylist = playlists[playlistNumber];
    
    if (selectedPlaylist) {
        iframe.src = selectedPlaylist.embedUrl;
        if (currentPlaylist) currentPlaylist.textContent = `Now Playing: ${selectedPlaylist.name}`;
        if (playlistDescription) playlistDescription.textContent = selectedPlaylist.description;
        
        iframe.style.opacity = '0.5';
        iframe.onload = function() { this.style.opacity = '1'; };
    }
}

// ===================================
// TETRIS FUNCTIONS
// ===================================

function initializeTetris() {
    const canvas = document.getElementById('tetris-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    document.querySelector('.tetris-stats').innerHTML = `
        <div class="stat">HI: <span id="high-score">${gameHighScore}</span></div>
        <div class="stat">Score: <span id="score">0</span></div>
        <div class="stat">Lvl: <span id="level">1</span></div>
    `;
    
    const gameContainer = document.querySelector('.tetris-game');
    let canvasWidth = 500, canvasHeight = 600;

    if (gameContainer) {
        const containerRect = gameContainer.getBoundingClientRect();
        const maxWidth = containerRect.width - 15;
        const maxHeight = containerRect.height - 15;
        const aspectRatio = 1 / 2;
        
        canvasWidth = Math.min(maxWidth, maxHeight * aspectRatio);
        canvasHeight = canvasWidth / aspectRatio;
        
        if (canvasHeight > maxHeight) {
            canvasHeight = maxHeight;
            canvasWidth = canvasHeight * aspectRatio;
        }
        
        canvasWidth = Math.max(canvasWidth, 200);
        canvasHeight = Math.max(canvasHeight, 400);
        
        canvas.width = Math.floor(canvasWidth);
        canvas.height = Math.floor(canvasHeight);
    } else {
        canvas.width = 500;
        canvas.height = 600;
    }
    
    const blockSize = Math.max(Math.floor(canvas.width / 10), 20);
    const boardHeight = Math.floor(canvas.height / blockSize);
    
    tetrisGame = {
        canvas: canvas, ctx: ctx,
        board: createEmptyBoard(10, boardHeight),
        currentPiece: null, gameRunning: false,
        dropTime: 0, lastTime: 0, dropInterval: 1000,
        blockSize: blockSize, boardWidth: 10, boardHeight: boardHeight
    };
    
    updateTetrisStats();
    drawTetrisBoard();
    addTetrisListeners();
}

function createEmptyBoard(width, height) {
    return Array.from({ length: height }, () => Array(width).fill(0));
}

function drawTetrisBoard() {
    if (!tetrisGame) return;
    const { ctx, canvas, board, blockSize } = tetrisGame;
    
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= tetrisGame.boardWidth; x++) {
        ctx.beginPath();
        ctx.moveTo(x * blockSize, 0);
        ctx.lineTo(x * blockSize, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= board.length; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * blockSize);
        ctx.lineTo(canvas.width, y * blockSize);
        ctx.stroke();
    }
    
    board.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) drawBlock(x, y, getBlockColor(value));
        });
    });
    
    if (tetrisGame.currentPiece) drawPiece(tetrisGame.currentPiece);
    
    ctx.strokeStyle = '#9bbc0f';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
}

function drawBlock(x, y, color) {
    if (!tetrisGame) return;
    const { ctx, blockSize } = tetrisGame;
    const padding = Math.max(2, Math.floor(blockSize * 0.08));
    
    ctx.fillStyle = color;
    ctx.fillRect(x * blockSize + padding, y * blockSize + padding, blockSize - padding * 2, blockSize - padding * 2);
    
    if (blockSize > 20) {
        const effectSize = Math.max(2, Math.floor(blockSize * 0.12));
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillRect(x * blockSize + padding, y * blockSize + padding, blockSize - padding * 2, effectSize);
        ctx.fillRect(x * blockSize + padding, y * blockSize + padding, effectSize, blockSize - padding * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x * blockSize + padding, y * blockSize + blockSize - padding - effectSize, blockSize - padding * 2, effectSize);
        ctx.fillRect(x * blockSize + blockSize - padding - effectSize, y * blockSize + padding, effectSize, blockSize - padding * 2);
    }
}

function drawPiece(piece) {
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) drawBlock(piece.x + x, piece.y + y, getBlockColor(value));
        });
    });
}

function getBlockColor(type) {
    const colors = {1: '#ff4757', 2: '#2ed573', 3: '#3742fa', 4: '#ff6b35', 5: '#ffa502', 6: '#a55eea', 7: '#26d0ce'};
    return colors[type] || '#ffffff';
}

function createTetrisPiece() {
    const pieces = [
        { shape: [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]], x: 3, y: 0 }, // I
        { shape: [[2,2],[2,2]], x: 4, y: 0 }, // O
        { shape: [[0,3,0],[3,3,3],[0,0,0]], x: 3, y: 0 }, // T
        { shape: [[0,4,4],[4,4,0],[0,0,0]], x: 3, y: 0 }, // S
        { shape: [[5,5,0],[0,5,5],[0,0,0]], x: 3, y: 0 }, // Z
        { shape: [[6,0,0],[6,6,6],[0,0,0]], x: 3, y: 0 }, // J
        { shape: [[0,0,7],[7,7,7],[0,0,0]], x: 3, y: 0 }  // L
    ];
    return pieces[Math.floor(Math.random() * pieces.length)];
}

function startTetrisGame() {
    if (!tetrisGame) return;
    tetrisGame.gameRunning = true;
    tetrisGame.currentPiece = createTetrisPiece();
    gameScore = 0; gameLevel = 1; gameLines = 0;
    updateTetrisStats();
    tetrisGameLoop();
}

function tetrisGameLoop(time = 0) {
    if (!tetrisGame || !tetrisGame.gameRunning) return;
    
    const deltaTime = time - tetrisGame.lastTime;
    tetrisGame.lastTime = time;
    tetrisGame.dropTime += deltaTime;
    
    if (tetrisGame.dropTime > tetrisGame.dropInterval) {
        moveTetrisPiece('down');
        tetrisGame.dropTime = 0;
    }
    
    drawTetrisBoard();
    requestAnimationFrame(tetrisGameLoop);
}

function moveTetrisPiece(direction) {
    if (!tetrisGame || !tetrisGame.currentPiece) return;
    
    const piece = tetrisGame.currentPiece;
    let newX = piece.x, newY = piece.y;
    
    if (direction === 'left') newX--;
    if (direction === 'right') newX++;
    if (direction === 'down') newY++;
    
    if (isValidMove(piece.shape, newX, newY)) {
        piece.x = newX;
        piece.y = newY;
    } else if (direction === 'down') {
        placePiece();
        clearLines();
        tetrisGame.currentPiece = createTetrisPiece();
        if (!isValidMove(tetrisGame.currentPiece.shape, tetrisGame.currentPiece.x, tetrisGame.currentPiece.y)) {
            gameOver();
        }
    }
}

function rotateTetrisPiece() {
    if (!tetrisGame || !tetrisGame.currentPiece) return;
    const rotatedShape = rotateMatrix(tetrisGame.currentPiece.shape);
    if (isValidMove(rotatedShape, tetrisGame.currentPiece.x, tetrisGame.currentPiece.y)) {
        tetrisGame.currentPiece.shape = rotatedShape;
    }
}

function isValidMove(shape, x, y) {
    if (!tetrisGame) return false;
    for (let py = 0; py < shape.length; py++) {
        for (let px = 0; px < shape[py].length; px++) {
            if (shape[py][px] !== 0) {
                const newX = x + px, newY = y + py;
                if (newX < 0 || newX >= tetrisGame.boardWidth || newY >= tetrisGame.boardHeight || (newY >= 0 && tetrisGame.board[newY] && tetrisGame.board[newY][newX] !== 0)) {
                    return false;
                }
            }
        }
    }
    return true;
}

function placePiece() {
    if (!tetrisGame || !tetrisGame.currentPiece) return;
    const piece = tetrisGame.currentPiece;
    piece.shape.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const boardX = piece.x + x, boardY = piece.y + y;
                if (boardY >= 0) tetrisGame.board[boardY][boardX] = value;
            }
        });
    });
}

function clearLines() {
    if (!tetrisGame) return;
    let linesCleared = 0;
    for (let y = tetrisGame.board.length - 1; y >= 0; y--) {
        if (tetrisGame.board[y].every(cell => cell !== 0)) {
            tetrisGame.board.splice(y, 1);
            tetrisGame.board.unshift(Array(tetrisGame.boardWidth).fill(0));
            linesCleared++;
            y++;
        }
    }
    if (linesCleared > 0) {
        gameLines += linesCleared;
        const lineScores = [0, 40, 100, 300, 1200];
        gameScore += (lineScores[linesCleared] || 0) * gameLevel;
        gameLevel = Math.floor(gameLines / 10) + 1;
        tetrisGame.dropInterval = Math.max(50, 1000 - (gameLevel - 1) * 50);
        updateTetrisStats();
    }
}

function rotateMatrix(matrix) {
    const rows = matrix.length, cols = matrix[0].length;
    const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            rotated[i][j] = matrix[rows - 1 - j][i];
        }
    }
    return rotated;
}

function updateTetrisStats() {
    const scoreEl = document.getElementById('score'), levelEl = document.getElementById('level'), linesEl = document.getElementById('lines');
    if (scoreEl) scoreEl.textContent = gameScore;
    if (levelEl) levelEl.textContent = gameLevel;
    if (linesEl) linesEl.textContent = gameLines;
}

function gameOver() {
    if (tetrisGame) tetrisGame.gameRunning = false;
    if (gameScore > gameHighScore) {
        gameHighScore = gameScore;
        localStorage.setItem('tetrisHighScore', gameHighScore);
        alert("NEW HIGH SCORE! 🎉");
    }
    document.getElementById('game-over-modal').classList.add('active');
}

function resetTetrisGame() {
    if (tetrisGame) {
        tetrisGame.board = createEmptyBoard(tetrisGame.boardWidth, tetrisGame.boardHeight);
        tetrisGame.currentPiece = null;
        tetrisGame.gameRunning = false;
        gameScore = 0; gameLevel = 1; gameLines = 0;
        updateTetrisStats();
        drawTetrisBoard();
    }
}

window.addEventListener('resize', () => {
    if (currentScreen === 'tetris') initializeTetris();
});



// ===================================
// EVENT LISTENERS
// ===================================

function addEventListeners() {
    document.querySelectorAll('.menu-btn').forEach(button => {
        button.addEventListener('click', function() {
            showScreen(this.getAttribute('data-page'));
        });
    });

    document.querySelector('.dpad-up')?.addEventListener('click', () => handleInput('up'));
    document.querySelector('.dpad-down')?.addEventListener('click', () => handleInput('down'));
    document.querySelector('.dpad-left')?.addEventListener('click', () => handleInput('left'));
    document.querySelector('.dpad-right')?.addEventListener('click', () => handleInput('right'));
    document.querySelector('.a-btn')?.addEventListener('click', () => handleInput('a'));
    document.querySelector('.b-btn')?.addEventListener('click', () => handleInput('b'));

    
    const allButtons = document.querySelectorAll('button, .menu-btn, .action-btn, .dpad-center div, .control-btn, .page-btn');
    allButtons.forEach(btn => {
        btn.addEventListener('click', () => audio.playClick());
     });

    const aBtn = document.querySelector('.a-btn');
    const bBtn = document.querySelector('.b-btn');
    const selectBtn = document.querySelector('.select-btn');

    if (aBtn) {
        aBtn.addEventListener('click', () => {
            // Arahkan ke Flip Book
            window.location.href = '../flip-book/index.html';
        });
    }

    if (bBtn) {
        bBtn.addEventListener('click', () => {
             // Arahkan ke Bunga Flower
            window.location.href = '../bunga-flower/index.html';
        });
    }

    if (selectBtn) {
        selectBtn.addEventListener('click', () => {
            // Arahkan ke Infinite Love (sebagai "lain-lain")
            window.location.href = '../infinite-love/index.html';
        });
    }
    
    document.querySelectorAll('.back-btn').forEach(button => {
        button.addEventListener('click', function() {
            if (currentScreen === 'gallery' && videoStream) {
                stopCamera();
            }
            showScreen(this.getAttribute('data-page'));
        });
    });
    
    const startBtn = document.querySelector('.start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (currentScreen === 'main') showScreen('message');
        });
    }
    
    document.querySelectorAll('.continue-btn').forEach(button => {
        button.addEventListener('click', handleContinueNavigation);
    });
    
    const confirmBtn = document.getElementById('confirm-btn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            document.getElementById('game-over-modal').classList.remove('active');
            document.getElementById('final-message-modal').classList.add('active');
        });
    }
    
    const okBtn = document.getElementById('ok-btn');
    if (okBtn) {
        okBtn.addEventListener('click', () => {
            document.getElementById('final-message-modal').classList.remove('active');
            showScreen('main');
            resetTetrisGame();
        });
    }
    
    document.addEventListener('keydown', (e) => {
        const keyMap = { 
            'ArrowUp': 'up', 'ArrowDown': 'down', 'ArrowLeft': 'left', 'ArrowRight': 'right',
            'z': 'a', 'x': 'b', 'Enter': 'start', 'Shift': 'select' 
        };
        if (keyMap[e.key]) {
            e.preventDefault(); // Cegah scroll halaman
            handleInput(keyMap[e.key]);
        }
    });
}

function addTetrisListeners() {
    const leftBtn = document.getElementById('left-btn');
    const rightBtn = document.getElementById('right-btn');
    const rotateBtn = document.getElementById('rotate-btn');
    
    if (leftBtn) leftBtn.addEventListener('click', () => moveTetrisPiece('left'));
    if (rightBtn) rightBtn.addEventListener('click', () => moveTetrisPiece('right'));
    if (rotateBtn) rotateBtn.addEventListener('click', () => rotateTetrisPiece());
}

function handleContinueNavigation() {
    if (currentScreen === 'gallery' && videoStream) stopCamera();
    
    switch(currentScreen) {
        case 'message': showScreen('gallery'); break;
        case 'gallery': showScreen('music'); break;
        case 'music': showScreen('tetris'); break;
        default: showScreen('main');
    }
}


function handleInput(input) {
    // Konami Code Tracker
    konamiHistory.push(input);
    if (konamiHistory.length > konamiCode.length) konamiHistory.shift();
    if (konamiHistory.join(',') === konamiCode.join(',')) {
        triggerEasterEgg();
        konamiHistory = [];
    }

    // Menu Navigation (hanya aktif di layar 'main')
    if (currentScreen === 'main') {
        if (input === 'up') selectedMenuIndex = (selectedMenuIndex - 2 + 4) % 4;
        if (input === 'down') selectedMenuIndex = (selectedMenuIndex + 2) % 4;
        if (input === 'left') selectedMenuIndex = (selectedMenuIndex % 2 === 0) ? selectedMenuIndex : selectedMenuIndex - 1;
        if (input === 'right') selectedMenuIndex = (selectedMenuIndex % 2 !== 0) ? selectedMenuIndex : selectedMenuIndex + 1;
        
        if (input === 'a') { // Tombol A untuk memilih
            showScreen(menuItems[selectedMenuIndex]);
            return;
        }
        updateMenuSelection();
    }
    
    // Tetris Controls (hanya aktif di layar 'tetris')
    if (currentScreen === 'tetris' && tetrisGame?.gameRunning) {
        if (input === 'left') moveTetrisPiece('left');
        if (input === 'right') moveTetrisPiece('right');
        if (input === 'down') moveTetrisPiece('down');
        if (input === 'a' || input === 'up') rotateTetrisPiece();
    }
}
function triggerEasterEgg() {
    audio.playWin();
    alert("🌟 KONAMI CODE ACTIVATED! 🌟\nKamu menemukan rahasia ini! I love you more! ❤️");
    document.body.style.animation = "rainbow-bg 5s infinite"; // Tambahkan keyframe rainbow-bg di CSS jika mau
}