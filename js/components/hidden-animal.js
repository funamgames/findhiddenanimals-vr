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
        // Random position in a hemisphere around the player
        const distance = 4 + Math.random() * 6; // 4-10 meters away
        const angle = Math.random() * Math.PI * 2; // 360 degrees
        const height = 0.5 + Math.random() * 2.5; // 0.5-3 meters high

        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;

        this.el.setAttribute('position', { x, y: height, z: -Math.abs(z) });
        this.el.setAttribute('visible', true);
    }
});
