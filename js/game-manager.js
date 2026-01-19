/**
 * Game Manager - Core game logic for Find Hidden Animals VR
 */
class GameManager {
    constructor() {
        this.state = 'start'; // start, playing, won
        this.score = 1000;
        this.currentAnimalIndex = 0;
        this.currentAnimal = window.animalData[0];
        this.foundCounts = {};
        this.scoreInterval = null;

        // Initialize found counts
        window.animalData.forEach(animal => {
            this.foundCounts[animal.id] = parseInt(localStorage.getItem(`found_${animal.id}`) || '0');
        });

        this.init();
    }

    init() {
        // Wait for A-Frame to be ready
        const scene = document.querySelector('a-scene');
        if (scene.hasLoaded) {
            this.setupEventListeners();
            this.renderAnimalGrid();
        } else {
            scene.addEventListener('loaded', () => {
                this.setupEventListeners();
                this.renderAnimalGrid();
            });
        }

        // Unlock audio on first user interaction (required for WebXR)
        this.audioUnlocked = false;
        const unlockAudio = () => {
            if (this.audioUnlocked) return;
            this.audioUnlocked = true;

            // Play and immediately pause all audio to unlock them
            document.querySelectorAll('audio').forEach(audio => {
                audio.play().then(() => {
                    audio.pause();
                    audio.currentTime = 0;
                }).catch(() => { });
            });

            console.log('Audio unlocked!');
        };

        document.addEventListener('click', unlockAudio, { once: true });
        document.addEventListener('touchstart', unlockAudio, { once: true });
    }

    setupEventListeners() {
        // Start button (also triggers VR mode via vr-mode-ui)
        document.querySelector('#start-btn').addEventListener('click', () => {
            this.startGame();
        });

        // Play again button
        document.querySelector('#play-again-btn').addEventListener('click', () => {
            this.hideScreen('win-screen');
            this.startGame();
        });

        // Animal found event
        window.addEventListener('animal-found', (e) => {
            this.onAnimalFound(e.detail.animalId);
        });

        // VR mode events
        const scene = document.querySelector('a-scene');
        scene.addEventListener('enter-vr', () => {
            document.querySelector('#hud').setAttribute('visible', true);
            this.hideScreen('start-screen');
        });

        scene.addEventListener('exit-vr', () => {
            document.querySelector('#hud').setAttribute('visible', false);
            if (this.state === 'playing') {
                this.pauseGame();
            }
        });

        // Cursor click on animal (for non-VR / fuse cursor)
        document.querySelector('#hidden-animal').addEventListener('click', () => {
            if (this.state === 'playing') {
                window.dispatchEvent(new CustomEvent('animal-found', {
                    detail: { animalId: this.currentAnimal.id }
                }));
            }
        });
    }

    renderAnimalGrid() {
        const grid = document.querySelector('#animal-grid');
        grid.innerHTML = '';

        window.animalData.forEach((animal, index) => {
            const card = document.createElement('div');
            card.className = 'animal-card';
            card.dataset.animalId = animal.id;

            // Check if unlocked
            const isUnlocked = index === 0 || this.foundCounts[window.animalData[index - 1].id] >= animal.unlockRequirement;

            if (!isUnlocked) {
                card.classList.add('locked');
            }

            if (animal.id === this.currentAnimal.id && isUnlocked) {
                card.classList.add('selected');
            }

            const img = document.createElement('img');
            img.src = `assets/images/${animal.id}.png`;
            img.alt = animal.name;

            const name = document.createElement('span');
            name.textContent = animal.name;

            card.appendChild(img);
            card.appendChild(name);

            if (!isUnlocked) {
                const lock = document.createElement('span');
                lock.className = 'lock-icon';
                lock.textContent = '🔒';
                card.appendChild(lock);
            }

            card.addEventListener('click', () => {
                if (isUnlocked) {
                    this.selectAnimal(animal.id);
                }
            });

            grid.appendChild(card);
        });
    }

    selectAnimal(animalId) {
        const animal = window.animalData.find(a => a.id === animalId);
        if (!animal) return;

        this.currentAnimal = animal;
        this.currentAnimalIndex = window.animalData.indexOf(animal);

        // Update UI
        document.querySelectorAll('.animal-card').forEach(card => {
            card.classList.remove('selected');
            if (card.dataset.animalId === animalId) {
                card.classList.add('selected');
            }
        });
    }

    startGame() {
        this.state = 'playing';
        this.score = 1000;

        // Hide start screen
        this.hideScreen('start-screen');

        // Setup hidden animal
        const hiddenAnimal = document.querySelector('#hidden-animal');
        const component = hiddenAnimal.components['hidden-animal'];
        component.setAnimal(this.currentAnimal.id);
        component.randomizePosition();

        // Show HUD
        document.querySelector('#hud').setAttribute('visible', true);
        this.updateScoreDisplay();

        // Start score decay timer
        this.startScoreTimer();
    }

    startScoreTimer() {
        if (this.scoreInterval) clearInterval(this.scoreInterval);

        this.scoreInterval = setInterval(() => {
            if (this.state === 'playing') {
                this.score = Math.max(0, this.score - 2);
                this.updateScoreDisplay();
            }
        }, 1000);
    }

    pauseGame() {
        if (this.scoreInterval) {
            clearInterval(this.scoreInterval);
            this.scoreInterval = null;
        }
        this.showScreen('start-screen');
    }

    deductPoints(amount) {
        this.score = Math.max(0, this.score - amount);
        this.updateScoreDisplay();
    }

    updateScoreDisplay() {
        document.querySelector('#score-text').setAttribute('value', `Score: ${this.score}`);
    }

    onAnimalFound(animalId) {
        if (this.state !== 'playing') return;

        this.state = 'won';

        // Stop timer
        if (this.scoreInterval) {
            clearInterval(this.scoreInterval);
            this.scoreInterval = null;
        }

        // Update found count
        this.foundCounts[animalId] = (this.foundCounts[animalId] || 0) + 1;
        localStorage.setItem(`found_${animalId}`, this.foundCounts[animalId].toString());

        // Reveal animal
        const hiddenAnimal = document.querySelector('#hidden-animal');
        hiddenAnimal.components['hidden-animal'].reveal();

        // Play animal sound
        const animal = window.animalData.find(a => a.id === animalId);
        if (animal) {
            const soundEl = document.querySelector(animal.soundAsset);
            if (soundEl) {
                soundEl.currentTime = 0;
                soundEl.play().catch(() => { });
            }
        }

        // Show confetti
        this.showConfetti();

        // Show win screen after delay
        setTimeout(() => {
            this.showWinScreen();
        }, 2000);
    }

    showConfetti() {
        const confetti = document.querySelector('#confetti');
        if (confetti) {
            confetti.setAttribute('visible', true);

            // Hide after animation
            setTimeout(() => {
                confetti.setAttribute('visible', false);
            }, 4000);
        }
    }

    showWinScreen() {
        // Exit VR for win screen
        const scene = document.querySelector('a-scene');
        if (scene.is('vr-mode')) {
            scene.exitVR();
        }

        // Update win screen content
        const foundAnimalDiv = document.querySelector('#found-animal');
        foundAnimalDiv.innerHTML = `<img src="assets/images/${this.currentAnimal.id}.png" alt="${this.currentAnimal.name}">`;

        document.querySelector('#final-score').textContent = `Score: ${this.score} | Found: ${this.foundCounts[this.currentAnimal.id]}x`;

        // Update animal grid (might have unlocked new animal)
        this.renderAnimalGrid();

        this.showScreen('win-screen');
    }

    showScreen(screenId) {
        document.querySelector(`#${screenId}`).classList.add('active');
    }

    hideScreen(screenId) {
        document.querySelector(`#${screenId}`).classList.remove('active');
    }
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.gameManager = new GameManager();
});
