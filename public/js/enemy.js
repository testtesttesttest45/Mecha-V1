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
        this.totalHealth = character.health; // Store the total health
        this.healthBar = null;
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

        this.createHealthBar();
    }

    takeDamage(damage, player) {
        if (this.isDead) return;
    
        this.attackingPlayer = player; // Store reference to the attacking player
    
        this.health -= damage;
        this.health = Math.max(this.health, 0);
        console.log(`Enemy took ${damage} damage. ${this.health} health remaining`);
    
        // Create and display damage text
        this.createDamageText(damage);
    
        if (this.health <= 0 && !this.isDead) {
            this.die();
        }
    
        this.updateHealthBar();
    }

    createDamageText(damage) {
        const damageText = this.scene.add.text(this.sprite.x, this.sprite.y - 100, `-${damage}`, { font: '36px Orbitron', fill: '#ff0000' });
        damageText.setOrigin(0.5, 0.5);
    
        // Animation for damage text (move up and fade out)
        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 30, // Move up
            alpha: 0, // Fade out
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                damageText.destroy(); // Remove the text object
            }
        });
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

        this.healthBar.destroy(); // Destroy the health bar
    }

    createHealthBar() {
        this.healthBar = this.scene.add.graphics({ x: this.sprite.x - 25, y: this.sprite.y - this.sprite.displayHeight + 60 });
    
        // Draw the initial health bar
        this.updateHealthBar();
    }
    
    updateHealthBar() {
        this.healthBar.clear();
        
        // Background of health bar (transparent part)
        this.healthBar.fillStyle(0x000000, 0.5);
        this.healthBar.fillRect(0, 0, 60, 10);
        
        // Health portion (dynamic width based on current health)
        const healthPercentage = this.health / this.totalHealth;
        const healthBarWidth = healthPercentage * 60; // Calculate the width based on health percentage
        this.healthBar.fillStyle(0xff0000, 1);
        this.healthBar.fillRect(0, 0, healthBarWidth, 10);
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