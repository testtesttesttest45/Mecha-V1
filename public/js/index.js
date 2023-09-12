document.addEventListener('DOMContentLoaded', (event) => {
    const gameScreen = document.getElementById('game-screen');
    const battleScene = document.getElementById('battle-scene');
    const playButton = document.querySelector('.play-button');

    playButton.addEventListener('click', () => {
        gameScreen.style.display = 'none';
        battleScene.style.display = 'flex';
    });
});
