import characterMap from './characters.js';

class Enemy {
    constructor(scene, x, y, characterCode = 3) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.characterCode = characterCode;
        this.sprite = null;
        this.currentAnimationIndex = 0;
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
        this.scheduleNextAnimation();
        this.sprite.setScale(0.5);
        this.scene.physics.world.enable(this.sprite);

        const bodyWidth = 200;
        const bodyHeight = 230;
        const offsetX = (this.sprite.width - bodyWidth) / 2;
        const offsetY = this.sprite.height - 320;

        this.sprite.body.setSize(bodyWidth, bodyHeight);
        this.sprite.body.setOffset(offsetX, offsetY);

        // Define a custom hit area that matches the body size and position
        const hitArea = new Phaser.Geom.Rectangle(offsetX, offsetY, bodyWidth, bodyHeight);

        // Set the sprite to be interactive with the custom hit area
        this.sprite.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    }

    scheduleNextAnimation() {
        this.scene.time.addEvent({
            delay: 4000,
            callback: () => {
                this.currentAnimationIndex = (this.currentAnimationIndex + 1) % 4;

                this.sprite.play(`enemyIdle${this.currentAnimationIndex + 1}`);

                this.scheduleNextAnimation();
            }
        });
    }

}

export default Enemy;