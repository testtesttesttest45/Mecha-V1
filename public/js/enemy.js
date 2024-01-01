import characterMap from './characters.js';

class Enemy {
    constructor(scene, x, y, characterCode = 3) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.characterCode = characterCode;
        this.sprite = null;
    }

    create() {
        const character = characterMap[this.characterCode];

        this.sprite = this.scene.add.sprite(this.x, this.y, character.idle);
        this.sprite.setOrigin(0.5, 1); // Set origin to bottom center

        // Create animations for idle and possibly other states
        for (let i = 0; i < 4; i++) {
            this.scene.anims.create({
                key: `enemyIdle${i + 1}`,
                frames: this.scene.anims.generateFrameNumbers(character.idle, { start: i * 15, end: (i + 1) * 15 - 1 }),
                frameRate: 10,
                repeat: -1
            });
        }

        this.sprite.play('enemyIdle1');
        this.sprite.setScale(0.5);
    }

    // Additional methods for enemy behavior
}

export default Enemy;