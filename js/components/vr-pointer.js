/**
 * VR Pointer Component for A-Frame
 * Handles controller pointing and hot/cold feedback
 */
AFRAME.registerComponent('vr-pointer', {
    init: function () {
        this.raycaster = this.el.components.raycaster;
        this.lastFeedbackTime = 0;
        this.bellSound = document.querySelector('#bell-sound');

        // Listen for trigger press
        this.el.addEventListener('triggerdown', this.onTriggerDown.bind(this));
        this.el.addEventListener('gripdown', this.onTriggerDown.bind(this));

        // For desktop - click anywhere
        document.addEventListener('click', this.onDesktopClick.bind(this));
    },

    tick: function () {
        if (!window.gameManager || window.gameManager.state !== 'playing') return;

        // Throttle feedback to every 200ms
        const now = Date.now();
        if (now - this.lastFeedbackTime < 200) return;
        this.lastFeedbackTime = now;

        // Check distance to hidden animal for hot/cold feedback
        this.updateHotColdFeedback();
    },

    onTriggerDown: function (evt) {
        if (!window.gameManager || window.gameManager.state !== 'playing') return;

        // Check if pointing at the animal
        const intersection = this.raycaster?.getIntersection(document.querySelector('#hidden-animal'));

        if (intersection) {
            // Found it!
            window.dispatchEvent(new CustomEvent('animal-found', {
                detail: { animalId: window.gameManager.currentAnimal.id }
            }));
        } else {
            // Miss - give hot/cold feedback and deduct points
            this.giveProximityFeedback();
            window.gameManager.deductPoints(10);
        }
    },

    onDesktopClick: function (evt) {
        // Only handle clicks inside the scene (not on UI buttons)
        if (evt.target.closest('#game-ui')) return;
        if (!window.gameManager || window.gameManager.state !== 'playing') return;

        // The cursor component handles animal clicks via fuse
        // This is just for background clicks (misses)
        const cursor = document.querySelector('#cursor');
        if (cursor && cursor.components.raycaster) {
            const intersection = cursor.components.raycaster.getIntersection(document.querySelector('#hidden-animal'));
            if (!intersection) {
                this.giveProximityFeedback();
                window.gameManager.deductPoints(10);
            }
        }
    },

    updateHotColdFeedback: function () {
        const hiddenAnimal = document.querySelector('#hidden-animal');
        if (!hiddenAnimal) return;

        const camera = document.querySelector('#camera');
        const animalPos = hiddenAnimal.object3D.position;
        const cameraPos = camera.object3D.position;

        // Calculate distance
        const distance = animalPos.distanceTo(cameraPos);

        // Update HUD color based on proximity
        const scoreText = document.querySelector('#score-text');
        if (distance < 3) {
            scoreText.setAttribute('color', '#FF0000'); // Very hot!
        } else if (distance < 5) {
            scoreText.setAttribute('color', '#FF6B00'); // Hot
        } else if (distance < 8) {
            scoreText.setAttribute('color', '#FFA500'); // Warm
        } else {
            scoreText.setAttribute('color', '#4CAF50'); // Cold
        }
    },

    giveProximityFeedback: function () {
        const hiddenAnimal = document.querySelector('#hidden-animal');
        const camera = document.querySelector('#camera');

        if (!hiddenAnimal || !camera) return;

        const animalPos = hiddenAnimal.object3D.position;
        const cameraPos = camera.object3D.position;
        const distance = animalPos.distanceTo(cameraPos);

        // Calculate proximity for sound volume (closer = louder)
        const maxDist = 15;
        const proximity = Math.max(0, 1 - (distance / maxDist));

        // Play bell with volume based on proximity
        if (this.bellSound) {
            this.bellSound.volume = proximity * proximity; // Quadratic for better feel
            this.bellSound.currentTime = 0;
            this.bellSound.play().catch(() => { });
        }

        // Haptic feedback on controllers (if available)
        const gamepad = this.el.components['tracked-controls']?.controller;
        if (gamepad && gamepad.hapticActuators && gamepad.hapticActuators.length > 0) {
            const intensity = proximity;
            const duration = 100 + proximity * 200;
            gamepad.hapticActuators[0].pulse(intensity, duration);
        }

        // Show visual feedback indicator
        this.showFeedbackIndicator(distance);
    },

    showFeedbackIndicator: function (distance) {
        const indicator = document.querySelector('#feedback-indicator');
        if (!indicator) return;

        let color, text;
        if (distance < 3) {
            color = '#FF0000';
            text = '🔥 Very Hot!';
        } else if (distance < 5) {
            color = '#FF6B00';
            text = '🔥 Hot!';
        } else if (distance < 8) {
            color = '#FFA500';
            text = '☀️ Warm';
        } else {
            color = '#4169E1';
            text = '❄️ Cold';
        }

        // Position indicator in front of camera
        const camera = document.querySelector('#camera');
        const cameraDirection = new THREE.Vector3();
        camera.object3D.getWorldDirection(cameraDirection);

        const indicatorPos = camera.object3D.position.clone().add(cameraDirection.multiplyScalar(2));
        indicator.setAttribute('position', indicatorPos);

        // Update appearance
        indicator.querySelector('a-sphere').setAttribute('material', 'color', color);
        indicator.querySelector('a-text').setAttribute('value', text);
        indicator.setAttribute('visible', true);

        // Hide after 1 second
        setTimeout(() => {
            indicator.setAttribute('visible', false);
        }, 1000);
    }
});
