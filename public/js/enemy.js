import characterMap from './characters.js';
import { setDefaultCursor } from './utilities.js';

class Enemy {
    constructor(scene, x, y, characterCode = 2) {
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
        this.detectionRadius = 100;
        this.speed = character.speed;
        this.isMoving = false;
        this.moveTween = null;
        this.spritesheetKey = character.spritesheetKey;
    }

    create() {
        const character = characterMap[this.characterCode];

        this.sprite = this.scene.add.sprite(this.x, this.y, character.idle);
        this.sprite.setOrigin(0.5, 0.8); // Set origin to bottom center

        for (let i = 0; i < 4; i++) {
            this.scene.anims.create({
                key: `character${this.characterCode}Idle${i + 1}`, // character2Idle1
                frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, { start: i * 5, end: i * 5 + 4 }),
                frameRate: 6,
                repeat: -1,
            });
        }

        this.scene.anims.create({
            key: `character${this.characterCode}Death`, // character2Idle1
            frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, { start: 100, end: 105 }),
            repeat: 0
        });

        const directions = ['southeast', 'southwest', 'south', 'east', 'west', 'northeast', 'northwest', 'north'];
        directions.forEach((dir, index) => {
            this.scene.anims.create({
                key: `character${this.characterCode}Moving${dir}`,
                frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, { start: 20 + (index * 5), end: 20 + (index * 5) + 4 }),
                frameRate: 6,
                repeat: -1
            });
        });

        directions.forEach((dir, index) => {
            this.scene.anims.create({
                key: `character${this.characterCode}Attack${dir}`,
                frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, { start: 60 + (index * 5), end: 60 + (index * 5) + 4 }),
                frameRate: 6,
                repeat: -1
            });
        });

        this.sprite.play(`character${this.characterCode}Idle1`);
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

        this.detectionField = this.scene.add.circle(this.x, this.y, 100); // adjust radius as needed
        this.detectionField.setStrokeStyle(2, 0xff0000);
    }

    takeDamage(damage, player) {
        console.log('Enemy taking damage');
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

    moveToPlayer(playerX, playerY) {
        if (this.isDead) return;
        const updateDirection = () => {
            const direction = this.determineDirectionToPlayer(playerX, playerY);
            this.sprite.play(`character${this.characterCode}Moving${direction}`);
        };
    
        updateDirection(); // Update direction initially
    
        
    
        this.isMoving = true;
        let distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerX, playerY);
        let duration = distance / this.speed * 1000;
    
        this.moveTween = this.scene.tweens.add({
            targets: this.sprite,
            x: playerX,
            y: playerY,
            duration: duration,
            ease: 'Linear',
            onUpdate: () => {
            },
            onComplete: () => {
                this.isMoving = false;
                

            }
        });

        this.updateHealthBar();
    }
    
    updateEnemy(playerX, playerY) {
        if (this.isDead) return;
        const distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerX, playerY);
        
        if (distance < this.detectionRadius && !this.isMoving) {
           this.moveToPlayer(playerX, playerY);
        } else if (distance >= this.detectionRadius && this.isMoving) {
            this.isMoving = false;
            if (this.moveTween) {
                this.moveTween.stop();
            }
        }
    }

    determineDirectionToPlayer(playerX, playerY) {
        const dx = playerX - this.sprite.x
        const dy = playerY - this.sprite.y
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;

        if (angle >= -22.5 && angle < 22.5) return 'east';
        if (angle >= 22.5 && angle < 67.5) return 'southeast';
        if (angle >= 67.5 && angle < 112.5) return 'south';
        if (angle >= 112.5 && angle < 157.5) return 'southwest';
        if (angle >= 157.5 || angle < -157.5) return 'west';
        if (angle >= -157.5 && angle < -112.5) return 'northwest';
        if (angle >= -112.5 && angle < -67.5) return 'north';
        if (angle >= -67.5 && angle < -22.5) return 'northeast';
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
        this.sprite.stop();
        this.sprite.play(`character${this.characterCode}Death`);
        this.sprite.removeInteractive();
        setDefaultCursor(this.scene);

        if (this.attackingPlayer) {
            console.log('Enemy stopped attacking');
            this.attackingPlayer.stopAttacking();
        }

        this.healthBar.destroy();
    }

    createHealthBar() {
        this.healthBar = this.scene.add.graphics({ x: this.sprite.x, y: this.sprite.y });

        // Draw the initial health bar
        this.updateHealthBar();
    }

    updateHealthBar() {
        const barX = this.sprite.x - 30;
        const barY = this.sprite.y - this.sprite.displayHeight + 50;
        
        this.healthBar.clear();
        this.healthBar.setPosition(barX, barY);

        // Background of health bar (transparent part)
        this.healthBar.fillStyle(0x000000, 0.5);
        this.healthBar.fillRect(0, 0, 60, 10);

        // Health portion (dynamic width based on current health)
        const healthPercentage = this.health / this.totalHealth;
        const healthBarWidth = healthPercentage * 60; // Calculate the width based on health percentage
        this.healthBar.fillStyle(0xff0000, 1);
        this.healthBar.fillRect(0, 0, healthBarWidth, 10);
    }

    update(time, delta) {
        this.updateHealthBar();
    }


    scheduleNextAnimation() {
        if (this.isDead) return;
        this.scene.time.addEvent({
            delay: 4000,
            callback: () => {
                if (this.isDead || this.isMoving) return;
                this.currentAnimationIndex = (this.currentAnimationIndex + 1) % 4;
                this.sprite.play(`character${this.characterCode}Idle${this.currentAnimationIndex + 1}`);

                this.scheduleNextAnimation();
            }
        });
    }

}

export default Enemy;