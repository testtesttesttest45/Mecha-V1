import characterMap from './characters.js';
import { setDefaultCursor } from './utilities.js';

class Enemy {
    constructor(scene, x, y, characterCode = 3) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.characterCode = characterCode;
        this.sprite = null;
        this.currentAnimationIndex = 0;
        const character = characterMap[this.characterCode];
        this.health = character.health;
        this.isDead = false;
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

        // create for death animation
        this.scene.anims.create({
            key: 'enemyDeath',
            frames: this.scene.anims.generateFrameNumbers(character.death, { start: 0, end: 49 }),
            frameRate: 10,
            repeat: 0
        });

        this.sprite.play('enemyIdle1');
        this.scheduleNextAnimation();
        this.sprite.setScale(0.5);
        this.scene.physics.world.enable(this.sprite);

        const bodyWidth = 160;
        const bodyHeight = 180;
        const offsetX = (this.sprite.width - bodyWidth) / 2;
        const offsetY = this.sprite.height - 280;

        this.sprite.body.setSize(bodyWidth, bodyHeight);
        this.sprite.body.setOffset(offsetX, offsetY);

        // Define a custom hit area that matches the body size and position
        const hitArea = new Phaser.Geom.Rectangle(offsetX, offsetY, bodyWidth, bodyHeight);

        // Set the sprite to be interactive with the custom hit area
        this.sprite.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
    }

    takeDamage(damage, player) {
        if (this.isDead) return;

        this.attackingPlayer = player; // Store reference to the attacking player

        this.health -= damage;
        this.health = Math.max(this.health, 0);
        console.log(`Enemy took ${damage} damage. ${this.health} health remaining`);
        if (this.health <= 0 && !this.isDead) {
            this.die();
        }
    }

    die() {
        if (this.isDead) return;

        this.isDead = true;
        console.log('Enemy died');
        this.sprite.setInteractive(false);  // Make the sprite uninteractable
        this.sprite.stop();  // Stop any current animation
        this.sprite.play('enemyDeath');
        this.sprite.removeInteractive();
        setDefaultCursor(this.scene); // Reset cursor if needed

        if (this.attackingPlayer) {
            console.log('Enemy stopped attacking');
            this.attackingPlayer.stopAttacking(); // Stop the player from attacking
        }
    }


    scheduleNextAnimation() {
        if (this.isDead) return;
        this.scene.time.addEvent({
            delay: 4000,
            callback: () => {
                if (this.isDead) return;
                this.currentAnimationIndex = (this.currentAnimationIndex + 1) % 4;

                this.sprite.play(`enemyIdle${this.currentAnimationIndex + 1}`);

                this.scheduleNextAnimation();
            }
        });
    }

}

export default Enemy;