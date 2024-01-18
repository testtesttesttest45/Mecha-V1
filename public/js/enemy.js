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
        this.speed = character.speed;
        this.attackRange = character.range;
        this.isMoving = false;
        this.moveTween = null;
        this.spritesheetKey = character.spritesheetKey;
        this.detectionRadius = 150;
        this.timeOutOfDetection = 0;
        this.detectionBar = null;
        this.isAlert = false; // enemy is on alert. during alert, enemy will never stop chasing player
        this.alertTime = 2000;
        this.timeInAlert = 0;
        this.hasPlayerBeenDetected = false;
        this.lastActionTime = 0;
        this.isAttacking = false;
        this.attackEvent = null;
        this.damage = character.attack;
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
            frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, { start: 100, end: 104 }),
            frameRate: 6,
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
                frameRate: 5,
                repeat: -1
            });
        });

        this.sprite.play(`character${this.characterCode}Idle1`);
        // this.scheduleNextAnimation();
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

        this.detectionField = this.scene.add.circle(this.x, this.y, 150);
        this.detectionField.setStrokeStyle(4, 0xff0000);

        this.detectionBar = this.scene.add.graphics();
        this.updateDetectionBar(1);
    }

    takeDamage(damage, player) {
        console.log('Enemy taking damage');
        if (this.isDead) return;

        this.attacker = player; // Store reference to the attacking player

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

        this.isMoving = true;
        this.isAttacking = false;

        const updateMovement = () => {
            if (!this.attacker || !this.attacker.getPosition || this.isDead) {
                console.warn("Attacking player is undefined or getPosition method is not available");
                return;
            }

            const playerPosition = this.attacker.getPosition();
            let distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerPosition.x, playerPosition.y);
            let duration = distance / this.speed * 1000;

            // Determine the new direction
            const newDirection = this.determineDirectionToPlayer(playerPosition.x, playerPosition.y);
            const movingAnimationKey = `character${this.characterCode}Moving${newDirection}`;

            // Play the moving animation only if it's not already playing
            if (this.sprite.anims.currentAnim.key !== movingAnimationKey) {
                this.sprite.play(movingAnimationKey);
            }

            if (this.moveTween) {
                this.moveTween.stop();
            }

            this.moveTween = this.scene.tweens.add({
                targets: this.sprite,
                x: playerPosition.x,
                y: playerPosition.y,
                duration: duration,
                ease: 'Linear',
                onUpdate: () => {
                    // Update direction based on player's current position
                    const updatedPlayerPosition = this.attacker.getPosition();
                    const updatedDirection = this.determineDirectionToPlayer(updatedPlayerPosition.x, updatedPlayerPosition.y);
                    const updatedAnimationKey = `character${this.characterCode}Moving${updatedDirection}`;

                    // Play the updated moving animation only if it's different
                    if (this.sprite.anims.currentAnim.key !== updatedAnimationKey) {
                        this.sprite.play(updatedAnimationKey);
                    }

                    if (Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, updatedPlayerPosition.x, updatedPlayerPosition.y) > 100) {
                        playerX = updatedPlayerPosition.x;
                        playerY = updatedPlayerPosition.y;
                        updateMovement(); // Recalculate the path and direction
                    }
                },
                onComplete: () => {
                    this.isMoving = false;
                }
            });
        };

        updateMovement(); // Start the movement
    }

    updateEnemy(playerX, playerY, player, delta) {
        this.attacker = player;
        if (this.isDead) return;
    
        const distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerX, playerY);
    
        // Determine the direction to the player
        const direction = this.determineDirectionToPlayer(playerX, playerY);
        const attackAnimationKey = `character${this.characterCode}Attack${direction}`;
    
        // Player is within detection radius or the enemy is attacking
        if (distance < this.detectionRadius || this.isAttacking) {
            if (!this.hasPlayerBeenDetected) {
                this.hasPlayerBeenDetected = true; // Player detected for the first time
            }
    
            this.isAlert = true;
            this.timeOutOfDetection = 0; // Reset out-of-detection timer
            this.updateDetectionBar(1); // full bar
    
            if (distance <= this.attackRange) {
                this.isMoving = false;
                if (this.moveTween) {
                    this.moveTween.stop();
                }
                if (!this.sprite.anims.currentAnim || this.sprite.anims.currentAnim.key !== attackAnimationKey) {
                    this.sprite.play(attackAnimationKey);
                }
                this.attackPlayer(player);
            } else if (distance > this.attackRange && !this.isMoving) {
                this.moveToPlayer(playerX, playerY); // Chase the player
            }
    
            if (this.isAttacking) {
                this.timeInAlert = 0; // Reset alert timer when attacking
            } else {
                this.timeInAlert += Math.round(delta); // Increment alert timer when not attacking
            }
    
        } else {
            if (!this.hasPlayerBeenDetected) {
                return;
            }
    
            // Player is outside the detection radius and not attacking
            if (this.isAlert && !this.isAttacking) {
                if (this.timeInAlert >= this.alertTime) {
                    this.isAlert = false; // End alert state after specified time
                } else {
                    this.timeInAlert += Math.round(delta); // Increment alert timer
                }
                this.updateDetectionBar(1);
            } else {
                this.timeOutOfDetection += Math.round(delta);
                const detectionPercentage = 1 - (this.timeOutOfDetection / 4000);
                this.updateDetectionBar(Math.max(detectionPercentage, 0));
                if (this.timeOutOfDetection >= 4000) {
                    this.isMoving = false;
                    if (this.moveTween) {
                        this.moveTween.stop();
                    }
                    if (!this.sprite.anims.currentAnim || !this.sprite.anims.currentAnim.key.includes('Idle')) {
                        this.sprite.play(`character${this.characterCode}Idle1`);
                    }
                }
            }
        }
    }
    
    
    
    getPosition() {
        return {
            x: this.sprite.x,
            y: this.sprite.y
        };
    }

    attackPlayer(player) {
        console.log('Enemy attacking player');
        if (player.isDead) {
            this.stopAttackingPlayer();
            return;
        }
    
        this.isAttacking = true;
        this.attacker = player;
    
        // Setting up the damage application logic
        if (this.attackEvent) {
            this.attackEvent.remove(false);
        }
        this.sprite.off('animationupdate');
    
        // Add a listener for the animation frame event
        this.sprite.on('animationupdate', (anim, frame) => {
            // Check if the current frame is the specific frame where damage should be applied
            if (anim.key.includes('Attack') && frame.index === 4) {
                if (this.attacker) {
                    this.attacker.takeDamage(this.damage, this); // Apply the damage
                }
            }
        }, this);
    
        // Ensure that the listener is removed after the attack animation completes
        this.sprite.once('animationcomplete', () => {
            this.sprite.off('animationupdate');
            this.isAttacking = false;
        }, this);
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

        // Stop any ongoing movement
        if (this.moveTween) {
            this.moveTween.stop();
        }
        this.isMoving = false;

        // Stop any ongoing animation and play the death animation
        this.sprite.stop();
        this.sprite.play(`character${this.characterCode}Death`);
        this.sprite.removeInteractive();
        setDefaultCursor(this.scene);

        if (this.attacker) {
            this.attacker.stopAttackingEnemy();
        }

        this.healthBar.destroy();

        this.detectionBar.clear();
        this.detectionField.setVisible(false);
    }

    createHealthBar() {
        this.healthBar = this.scene.add.graphics();
        this.updateHealthBar(); // initial display
    }

    updateHealthBar() {
        const barX = this.sprite.x - 30;
        const barY = this.sprite.y - this.sprite.displayHeight + 80;

        this.healthBar.clear();
        this.healthBar.setPosition(barX, barY);

        // Background of health bar (transparent part)
        this.healthBar.fillStyle(0x000000, 0.5);
        this.healthBar.fillRect(0, 0, 60, 7);

        // Health portion (dynamic width based on current health)
        const healthPercentage = this.health / this.totalHealth;
        const healthBarWidth = healthPercentage * 60; // Calculate the width based on health percentage
        this.healthBar.fillStyle(0xff0000, 1);
        this.healthBar.fillRect(0, 0, healthBarWidth, 7);
    }

    updateDetectionBar(percentage) {
        if (!this.hasPlayerBeenDetected) return;
        const barX = this.sprite.x - 30; // same x as the health bar
        const barY = this.sprite.y - this.sprite.displayHeight + 90; // slightly below the health bar

        this.detectionField.alpha = percentage;
        this.detectionBar.clear();
        this.detectionBar.setPosition(barX, barY);

        // White background
        this.detectionBar.fillStyle(0xffffff, 1);
        this.detectionBar.fillRect(0, 0, 60 * percentage, 5);

        // transparent background
        this.detectionBar.fillStyle(0xffffff, 0.4);
        this.detectionBar.fillRect(60 * percentage, 0, 60 * (1 - percentage), 5);

        if (percentage == 0) {
            this.detectionBar.clear();
        }
    }

    stopAttackingPlayer() {
        if (this.attackEvent) {
            this.attackEvent.remove(false);
            this.attackEvent = null;
        }
        this.isAttacking = false;
        this.attacker = null;

        if (!this.sprite.anims.currentAnim || !this.sprite.anims.currentAnim.key.includes('Idle')) {
            this.sprite.play(`character${this.characterCode}Idle1`);
        }
    }

    update(time, delta) {
        if (this.isDead) return;
        this.detectionField.setPosition(this.sprite.x, this.sprite.y);
        this.updateHealthBar();

        const isMoving = this.moveTween && this.moveTween.isPlaying();
        const isAttacking = this.sprite.anims.isPlaying && this.sprite.anims.currentAnim.key.startsWith('Attack');

        if (!isMoving && !isAttacking) {
            // Check if enough time has passed to change the animation
            if (time - this.lastActionTime > 5000) { // 5 seconds of inactivity
                this.currentAnimationIndex = (this.currentAnimationIndex + 1) % 4;
                this.sprite.play(`character${this.characterCode}Idle${this.currentAnimationIndex + 1}`);
                this.lastActionTime = time;
            }
        } else {
            this.lastActionTime = time; // Reset the last action time if the enemy is moving or attacking
        }
    }

}

export default Enemy;