/**
 * Animal data - shared with Android app
 */
const animals = [
    {
        id: 'cow',
        name: 'Cow',
        imageAsset: '#cow-img',
        soundAsset: '#cow-sound',
        unlockRequirement: 0 // Always unlocked
    },
    {
        id: 'pig',
        name: 'Pig',
        imageAsset: '#pig-img',
        soundAsset: '#pig-sound',
        unlockRequirement: 5 // Unlock after finding cow 5 times
    },
    {
        id: 'chicken',
        name: 'Chicken',
        imageAsset: '#chicken-img',
        soundAsset: '#chicken-sound',
        unlockRequirement: 5
    },
    {
        id: 'sheep',
        name: 'Sheep',
        imageAsset: '#sheep-img',
        soundAsset: '#sheep-sound',
        unlockRequirement: 5
    },
    {
        id: 'horse',
        name: 'Horse',
        imageAsset: '#horse-img',
        soundAsset: '#horse-sound',
        unlockRequirement: 5
    }
];

// Export for use in other modules
window.animalData = animals;
