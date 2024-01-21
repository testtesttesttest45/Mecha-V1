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
        this.attackSpeed = character.attackSpeed;
        this.attackRange = character.range;
        this.isMoving = false;
        this.moveTween = null;
        this.spritesheetKey = character.spritesheetKey;
        this.detectionRadius = 200;
        this.timeOutOfDetection = 0;
        this.detectionBar = null;
        this.isAlert = false; // enemy is on alert. during alert, enemy will never stop chasing player
        this.alertTime = 2000;
        this.timeInAlert = 0;
        this.hasPlayerBeenDetected = false;
        this.lastActionTime = 0;
        this.isAttacking = false;
        this.attackEvent = null;
        this.damage = character.damage;
        this.attackRangeRect = null;
        this.projectile = character.projectile;
    }

    create() {
        const character = characterMap[this.characterCode];

        this.sprite = this.scene.add.sprite(this.x, this.y, character.idle);
        this.sprite.setOrigin(0.5, 0.5);

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
                frameRate: 6 * this.attackSpeed,
                repeat: 0
            });
        });

        this.sprite.play(`character${this.characterCode}Idle1`);
        // this.scheduleNextAnimation();
        this.sprite.setScale(1);
        this.scene.physics.world.enable(this.sprite);

        // const bodyWidth = 350;
        // const bodyHeight = 300;
        const bodyWidth = this.sprite.width * 0.6;
        const bodyHeight = this.sprite.height * 0.6;
        const offsetX = (this.sprite.width - bodyWidth) / 2;
        const offsetY = (this.sprite.height - bodyHeight) / 2;

        this.sprite.body.setSize(bodyWidth, bodyHeight);
        this.sprite.body.setOffset(offsetX, offsetY);

        // Define a custom hit area that matches the body size and position
        const hitArea = new Phaser.Geom.Rectangle(offsetX, offsetY, bodyWidth, bodyHeight);

        // Set the sprite to be interactive with the custom hit area
        this.sprite.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        this.createHealthBar();

        this.detectionField = this.scene.add.circle(this.x, this.y, 200);
        this.detectionField.setStrokeStyle(4, 0xff0000);

        this.detectionBar = this.scene.add.graphics();
        this.updateDetectionBar(1);

        let dot = this.scene.add.graphics();
        dot.fillStyle(0xffffff, 1); // White color
        dot.fillCircle(this.sprite.x, this.sprite.y, 5);
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
        if (this.isDead || this.isMoving || this.isAttacking) return;

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
        // console.log('fckng cb', this.isAttacking)
        this.attacker = player;
        if (this.isDead || this.attacker.isDead) return;

        const distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerX, playerY);

        // Determine the direction to the player
        const direction = this.determineDirectionToPlayer(playerX, playerY);
        const attackAnimationKey = `character${this.characterCode}Attack${direction}`;

        // Player is within detection radius or the enemy is attacking
        if (distance < this.detectionRadius || (distance <= this.attackRange && this.hasPlayerBeenDetected)) {
            // Set player as detected if within detection radius for the first time
            if (!this.hasPlayerBeenDetected && distance < this.detectionRadius) {
                this.hasPlayerBeenDetected = true;
            }

            this.isAlert = true;
            this.timeOutOfDetection = 0; // Reset out-of-detection timer
            this.updateDetectionBar(1); // full bar
            if (distance <= this.attackRange && !this.isAttacking) {
                this.isMoving = false;
                if (this.moveTween) {
                    this.moveTween.stop();
                }
                const direction = this.determineDirectionToPlayer(playerX, playerY);
                const attackAnimationKey = `character${this.characterCode}Attack${direction}`;
                this.sprite.play(attackAnimationKey);
                this.attackPlayer(player);
            } else if (distance > this.attackRange && !this.isMoving) {
                this.moveToPlayer(playerX, playerY);
            }
            if (this.isAttacking) {
                this.timeInAlert = 0; // Reset alert timer when attacking
            } else {
                this.timeInAlert += Math.round(delta); // Increment alert timer when not attacking
            }
        }
        else {
            // Player is outside the detection radius and attack range
            if (this.hasPlayerBeenDetected) {
                // Enemy will try to move closer to the player if out of attack range
                if (distance > this.attackRange && !this.isMoving) {
                    this.moveToPlayer(playerX, playerY);
                }

                // Handling alert time and going idle
                if (this.isAlert && !this.isAttacking) {
                    if (distance > this.attackRange && this.timeInAlert >= this.alertTime) {
                        this.isAlert = false;
                        this.timeOutOfDetection += Math.round(delta);
                    } else {
                        this.timeInAlert += Math.round(delta);
                        this.updateDetectionBar(1);
                    }
                } else if (distance > this.attackRange) {
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
                        this.hasPlayerBeenDetected = false;
                    }
                }
            }
        }
    }

    attackPlayer(player) {
        if (player.isDead) {
            this.stopAttackingPlayer();
            return;
        }
    
        this.isAttacking = true;
        this.attacker = player;
    
        const direction = this.determineDirectionToPlayer(player.getPosition().x, player.getPosition().y);
        const attackAnimationKey = `character${this.characterCode}Attack${direction}`;
        this.sprite.play(attackAnimationKey);
    
        const angleToPlayer = Phaser.Math.Angle.Between(this.sprite.x, this.sprite.y, player.getPosition().x, player.getPosition().y);
        const hasProjectile = this.projectile !== '';
    
        if (hasProjectile) {
            this.createAttackRangeRectangle(angleToPlayer);
        } else {
            this.createAttackRangeArc(angleToPlayer);
        }
    
        this.sprite.off('animationupdate');
        this.sprite.on('animationupdate', (anim, frame) => {
            if (anim.key === attackAnimationKey) {
                if (frame.index === 4 && hasProjectile) {
                    this.launchProjectile(player, angleToPlayer);
                } else if (frame.index === 5 && !hasProjectile) {
                    const playerPos = player.getPosition();
                    if (this.isPlayerInArc(playerPos, this.sprite, this.attackRange, angleToPlayer - Math.PI / 6, angleToPlayer + Math.PI / 6)) {
                        player.takeDamage(this.damage, this);
                    }
                }
            }
        });
    
        this.sprite.once('animationcomplete', anim => {
            if (anim.key === attackAnimationKey) {
                this.isAttacking = false;
                if (this.attackRangeArc) this.attackRangeArc.destroy();
                if (this.attackRangeRect) this.attackRangeRect.destroy();
            }
        });
    }
    
    
    launchProjectile(player, angleToPlayer) {
        let projectile = this.scene.add.sprite(this.sprite.x, this.sprite.y, this.projectile);
        projectile.setOrigin(0.5, 0.5);
        projectile.setScale(0.5);
        projectile.setRotation(angleToPlayer + Math.PI / 2); // Rotate the projectile
    
        const projectileSpeed = 500;
        const maxDistance = this.attackRange;
    
        // Calculate the end point of the projectile's path within the rectangle path
        const endPointX = this.sprite.x + Math.cos(angleToPlayer) * maxDistance;
        const endPointY = this.sprite.y + Math.sin(angleToPlayer) * maxDistance;
    
        // Calculate the duration for the projectile to travel to the end point
        const distanceToEndPoint = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, endPointX, endPointY);
        const duration = (distanceToEndPoint / projectileSpeed) * 1000;
    
        this.scene.tweens.add({
            targets: projectile,
            x: endPointX,
            y: endPointY,
            duration: duration,
            ease: 'Linear',
            onUpdate: () => {
                // Check if projectile is close to the player for hit detection
                if (Phaser.Math.Distance.Between(projectile.x, projectile.y, player.getPosition().x, player.getPosition().y) < 20) { 
                    player.takeDamage(this.damage, this);
                    // Stop the tween before destroying the projectile
                    projectile.destroy();
                }
            },
            onComplete: () => {
                // Only destroy the projectile if it still exists
                if (projectile.active) {
                    projectile.destroy();
                }
            }
        });
    }
    
    
    
    

    createAttackRangeArc(angleToPlayer) {
        // Define the start and end angles for the arcs
        const startAngle = angleToPlayer - Math.PI / 6;
        const endAngle = angleToPlayer + Math.PI / 6;

        // Draw the attack area with curved edges
        if (this.attackRangeArc) {
            this.attackRangeArc.destroy(); // Destroy existing shape if any
        }
        this.attackRangeArc = this.scene.add.graphics({ fillStyle: { color: 0xffff00, alpha: 0.4 } });
        this.attackRangeArc.beginPath(); // Phaser's graphics API to draw two arcs that form the outer edges
        // https://newdocs.phaser.io/docs/3.54.0/focus/Phaser.GameObjects.Graphics-arc
        this.attackRangeArc.moveTo(this.sprite.x, this.sprite.y); // Move to sprite's position
        this.attackRangeArc.arc(this.sprite.x, this.sprite.y, this.attackRange, startAngle, endAngle, false);
        this.attackRangeArc.closePath();
        this.attackRangeArc.fillPath();
        this.attackRangeArc.strokePath();
    }

    createAttackRangeRectangle(angleToPlayer) {
        if (this.attackRangeRect) {
            this.attackRangeRect.destroy();
        }
        const rectWidth = this.attackRange;
        const rectHeight = 45; // Adjust this value as needed
        this.attackRangeRect = this.scene.add.rectangle(this.sprite.x, this.sprite.y, rectWidth, rectHeight, 0xff0000, 0.4);
        this.attackRangeRect.setOrigin(0, 0.5);
        this.attackRangeRect.setRotation(angleToPlayer);
    }

    isPlayerInArc(playerPos, spritePos, range, startAngle, endAngle) {
        const angleToPlayer = Phaser.Math.Angle.Between(spritePos.x, spritePos.y, playerPos.x, playerPos.y);
        const distanceToPlayer = Phaser.Math.Distance.Between(spritePos.x, spritePos.y, playerPos.x, playerPos.y);
        return distanceToPlayer <= range && angleToPlayer >= startAngle && angleToPlayer <= endAngle;
    }

    playerWithinPursuitRange() { // to fix a rare bug where enemy stops chasing player 
        const playerPosition = this.attacker.getPosition();
        const distanceToPlayer = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerPosition.x, playerPosition.y);
        const pursuitRange = this.attackRange + 100;
        return distanceToPlayer <= pursuitRange;
    }

    getPosition() {
        return {
            x: this.sprite.x,
            y: this.sprite.y
        };
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
        const barY = this.sprite.y - this.sprite.body.height / 2;
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
        const barY = (this.sprite.y - this.sprite.body.height / 2) + 8;

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
            console.log("Going idle");
            this.sprite.play(`character${this.characterCode}Idle1`);
        }
    }

    update(time, delta) {
        if (this.isDead) return;
        this.detectionField.setPosition(this.sprite.x, this.sprite.y);
        this.updateHealthBar();

        const isMoving = this.moveTween && this.moveTween.isPlaying();
        const isAttacking = this.sprite.anims.isPlaying && this.sprite.anims.currentAnim.key.includes('Attack');

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