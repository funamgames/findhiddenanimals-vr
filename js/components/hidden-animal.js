/**
 * Hidden Animal Component for A-Frame
 * Handles the hidden animal entity behavior
 */
AFRAME.registerComponent('hidden-animal', {
    schema: {
        animalId: { type: 'string', default: 'cow' }
    },

    init: function () {
        this.found = false;
        this.el.addEventListener('click', this.onAnimalFound.bind(this));
        this.el.addEventListener('raycaster-intersected', this.onIntersected.bind(this));
        this.el.addEventListener('raycaster-intersected-cleared', this.onIntersectedCleared.bind(this));
    },

    onAnimalFound: function () {
        if (this.found) return;
        this.found = true;

        // Dispatch custom event for game manager
        window.dispatchEvent(new CustomEvent('animal-found', {
            detail: { animalId: this.data.animalId }
        }));
    },

    onIntersected: function (evt) {
        // Visual feedback when pointing at animal
        if (!this.found) {
            this.el.querySelector('#animal-sprite').setAttribute('opacity', 0.3);
        }
    },

    onIntersectedCleared: function (evt) {
        if (!this.found) {
            this.el.querySelector('#animal-sprite').setAttribute('opacity', 0.05);
        }
    },

    setAnimal: function (animalId) {
        this.data.animalId = animalId;
        this.found = false;

        const animal = window.animalData.find(a => a.id === animalId);
        if (animal) {
            const sprite = this.el.querySelector('#animal-sprite');
            const revealed = this.el.querySelector('#animal-revealed');

            sprite.setAttribute('src', animal.imageAsset);
            sprite.setAttribute('opacity', 0.05);
            sprite.setAttribute('visible', true);

            revealed.setAttribute('src', animal.imageAsset);
            revealed.setAttribute('visible', false);
        }
    },

    reveal: function () {
        const sprite = this.el.querySelector('#animal-sprite');
        const revealed = this.el.querySelector('#animal-revealed');

        sprite.setAttribute('visible', false);
        revealed.setAttribute('visible', true);

        // Play celebration animation
        revealed.setAttribute('animation__pop', {
            property: 'scale',
            from: '0.1 0.1 0.1',
            to: '1.2 1.2 1.2',
            dur: 400,
            easing: 'easeOutElastic'
        });
    },

    randomizePosition: function () {
        // Position animal in FRONT of player at comfortable viewing height
        const distance = 4 + Math.random() * 4; // 4-8 meters away (closer)

        // Limit angle to front area (-45 to +45 degrees from forward)
        const angleRange = Math.PI / 4; // 45 degrees each side
        const angle = (Math.random() - 0.5) * 2 * angleRange;

        // Keep at lower height (0.5 to 1.2 meters - ground/waist level)
        const height = 0.5 + Math.random() * 0.7;

        const x = Math.sin(angle) * distance;
        const z = -Math.cos(angle) * distance; // Negative Z = in front of player

        this.el.setAttribute('position', { x, y: height, z });
        this.el.setAttribute('visible', true);
    }
});
