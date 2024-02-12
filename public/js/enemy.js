import characterMap from './characters.js';

class Enemy {
    constructor(scene, x, y, characterCode = 2, originalCamp, player, level = 1, base) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.characterCode = characterCode;
        this.sprite = null;
        this.currentAnimationIndex = 0;
        const character = characterMap[this.characterCode];
        this.level = level;
        this.strengthenLevel = 1;
        const levelMultiplier = 1 + (this.level - 1) * 0.2; // 20% increase per level
        this.health = Math.round(character.health * levelMultiplier);
        this.maxHealth = this.health;
        this.isDead = false;
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
        this.isAlert = false;
        this.alertTime = 2000;
        this.timeInAlert = 0;
        this.hasPlayerBeenDetected = false;
        this.lastActionTime = 0;
        this.isAttacking = false;
        this.attackEvent = null;
        this.damage = Math.round(character.damage * levelMultiplier);
        this.attackRangeRect = null;
        this.attackRangeArc = null;
        this.projectile = character.projectile;
        this.originalCamp = originalCamp;
        this.returningToCamp = false;
        this.inCamp = true;
        this.lastHealTime = 0;
        this.isEnraged = false;
        this.enrageDuration = 6000;
        this.enrageStartTime = 0;
        this.player = player;
        this.customSquare = null;
        this.customSquareText = null;
        this.strengthenedSquare = null;
        this.strengthenedSquareText = null;
        this.fireTimerEvent = null;
        this.base = base;
        this.idleAnimations = [`character${this.characterCode}Idle1`, `character${this.characterCode}Idle2`, `character${this.characterCode}Idle3`, `character${this.characterCode}Idle4`];
        this.timerStarted = false;
        this.enemyStrengthenInterval = 12000;
        this.attackCount = character.attackCount;
    }

    startTimer() {
        if (!this.timerStarted) {
            this.strengthenTimer = this.scene.time.now + this.enemyStrengthenInterval;
            this.timerStarted = true;
        }
    }

    getTimeUntilNextStrengthen() {
        return Math.max(0, this.strengthenTimer - this.scene.time.now);
    }


    strengthenEnemies() {
        const healthIncrease = Math.round(this.maxHealth * 0.25);
        const damageIncrease = Math.round(this.damage * 0.25);
        this.strengthenLevel++;
        this.maxHealth += healthIncrease;
        this.damage += damageIncrease;
        this.strengthenTimer = this.scene.time.now + this.enemyStrengthenInterval;

        this.createStrengthenedText(damageIncrease, healthIncrease);
    }

    createStrengthenedText(damageIncrease, healthIncrease) {
        const roundedDamageIncrease = Math.round(damageIncrease);
        const roundedHealthIncrease = Math.round(healthIncrease);

        const strengthenedText = this.scene.add.text(this.sprite.x, this.sprite.y - 100, `DMG +${roundedDamageIncrease}\nMax HP +${roundedHealthIncrease}`, {
            font: '24px Orbitron',
            fill: '#0d00ff'
        });
        strengthenedText.setOrigin(0.5, 0.5);
        strengthenedText.setDepth(1);
        this.scene.tweens.add({
            targets: strengthenedText,
            y: strengthenedText.y - 30,
            alpha: 0,
            duration: 2500,
            ease: 'Power2',
            onComplete: () => {
                strengthenedText.destroy();
            }
        });
    }

    create() {
        const character = characterMap[this.characterCode];

        this.sprite = this.scene.add.sprite(this.x, this.y, character.idle);
        this.sprite.setOrigin(0.5, 0.5);
        this.sprite.setScale(0.75);
        
        // Check and create idle animations
        for (let i = 0; i < 4; i++) {
            let idleKey = `character${this.characterCode}Idle${i + 1}`;
            if (!this.scene.anims.exists(idleKey)) {
                this.scene.anims.create({
                    key: idleKey,
                    frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, { start: i * 5, end: i * 5 + 4 }),
                    frameRate: 6,
                    repeat: -1,
                });
            }
        }

        // Check and create death animation
        let deathKey = `character${this.characterCode}Death`;
        if (!this.scene.anims.exists(deathKey)) {
            this.scene.anims.create({
                key: deathKey,
                frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, { start: 100, end: 104 }),
                frameRate: 6,
                repeat: 0
            });
        }

        const directions = ['southeast', 'southwest', 'south', 'east', 'west', 'northeast', 'northwest', 'north'];

        // Check and create moving animations
        directions.forEach((dir, index) => {
            let movingKey = `character${this.characterCode}Moving${dir}`;
            if (!this.scene.anims.exists(movingKey)) {
                this.scene.anims.create({
                    key: movingKey,
                    frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, { start: 20 + (index * 5), end: 20 + (index * 5) + 4 }),
                    frameRate: 6,
                    repeat: -1
                });
            }
        });

        // Check and create attack animations
        directions.forEach((dir, index) => {
            let attackKey = `character${this.characterCode}Attack${dir}`;
            if (!this.scene.anims.exists(attackKey)) {
                this.scene.anims.create({
                    key: attackKey,
                    frames: this.scene.anims.generateFrameNumbers(this.spritesheetKey, { start: 60 + (index * 5), end: 60 + (index * 5) + 4 }),
                    frameRate: 6 * this.attackSpeed,
                    repeat: 0
                });
            }
        });

        const randomIdleAnimation = this.idleAnimations[Math.floor(Math.random() * this.idleAnimations.length)];
        this.sprite.play(randomIdleAnimation);
        this.scene.physics.world.enable(this.sprite);

        const bodyWidth = this.sprite.width * 0.6;
        const bodyHeight = this.sprite.height * 0.6;
        const offsetX = (this.sprite.width - bodyWidth) / 2;
        const offsetY = (this.sprite.height - bodyHeight) / 2;

        this.sprite.body.setSize(bodyWidth, bodyHeight);
        this.sprite.body.setOffset(offsetX, offsetY);

        const hitArea = new Phaser.Geom.Rectangle(offsetX, offsetY, bodyWidth, bodyHeight);
        this.sprite.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);

        this.createHealthBar();

        // this.detectionField = this.scene.add.circle(this.x, this.y, 200);
        // this.detectionField.setStrokeStyle(4, 0xff0000);

        this.detectionBar = this.scene.add.graphics();
        this.updateDetectionBar(1);
        // let dot = this.scene.add.graphics();
        // dot.fillStyle(0xffffff, 1);
        // dot.fillCircle(this.sprite.x, this.sprite.y, 5);
    }

    takeDamage(damage, source) {
        // console.log('Enemy taking damage');
        if (this.isDead) return;

        // Enemy is immune to all damage when returning to camp
        if (this.returningToCamp) return;

        // Enemy is immune to catastrophe damage if it has reached camp but not to player damage
        if (this.inCamp && source === 'catastrophe') return;

        this.health -= damage;
        this.health = Math.max(this.health, 0);

        // Enemy detects player if damage source is the player
        if (source !== 'catastrophe') {
            this.hasPlayerBeenDetected = true;
        };

        const color = source === 'catastrophe' ? '#ff0' : '#ff0000'; // Yellow for catastrophe, red for player
        this.createDamageText(damage, color);

        // Enemy dies if health drops to 0
        if (this.health <= 0 && !this.isDead) {
            this.die();
        }

        this.updateHealthBar();

        if (this.hasPlayerBeenDetected) {
            this.timeInAlert = 0;
            this.timeOutOfDetection = 0;
            this.isAlert = true; // Ensure the enemy is in an alert state
            this.updateDetectionBar(1); // Full detection bar
        }
    }


    moveToPlayer(playerX, playerY) {
        if (this.isDead || this.isMoving || this.isAttacking) {
            return;
        }

        this.isMoving = true;
        this.isAttacking = false;
        this.inCamp = false;
        const updateMovement = () => {
            if (!this.attacker || !this.attacker.getPosition || this.isDead) {
                console.warn("Attacking player is undefined or getPosition method is not available");
                return;
            }

            const playerPosition = this.attacker.getPosition();
            let distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerPosition.x, playerPosition.y);
            let duration = distance / this.speed * 1000;

            // Determine the new direction
            const newDirection = this.determineDirectionToPoint(playerPosition.x, playerPosition.y);
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
                    if (this.player.isDead) {
                        this.moveTween.stop();
                        this.isMoving = false;
                        this.isAttacking = false;
                        this.sprite.play(`character${this.characterCode}Idle1`);
                        return;
                    }
                    // Update direction based on player's current position
                    const updatedPlayerPosition = this.attacker.getPosition();
                    const updatedDirection = this.determineDirectionToPoint(updatedPlayerPosition.x, updatedPlayerPosition.y);
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
        if (this.isDead || this.attacker.isDead) return;
        const distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerX, playerY);

        // Determine the direction to the player
        const direction = this.determineDirectionToPoint(playerX, playerY);
        const attackAnimationKey = `character${this.characterCode}Attack${direction}`;
        if (this.isEnraged) {
            this.hasPlayerBeenDetected = true;
            // Keep the enemy alert and the detection bar full
            this.isAlert = true;
            this.updateDetectionBar(1);  // Full detection bar

            // If the player is within attack range, attack; otherwise, move towards the player
            if (distance <= this.attackRange && !this.isAttacking) {
                this.isMoving = false;
                if (this.moveTween) this.moveTween.stop();
                this.sprite.play(`character${this.characterCode}Attack${this.determineDirectionToPoint(playerX, playerY)}`);
                this.attackPlayer(player);
            } else if (distance > this.attackRange && !this.isMoving) {
                this.moveToPlayer(playerX, playerY);
            }

            // During the enraged state, the alert timer does not decrease
            this.timeInAlert = this.alertTime;

            // Check if the enrage duration has elapsed
            if (this.scene.time.now - this.enrageStartTime > this.enrageDuration) {
                this.disenrage();
            }
        } else {
            if (this.returningToCamp) return;
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
                    const direction = this.determineDirectionToPoint(playerX, playerY);
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
                            // if (!this.sprite.anims.currentAnim || !this.sprite.anims.currentAnim.key.includes('Idle')) {
                            //     this.sprite.play(`character${this.characterCode}Idle1`);
                            // }
                            this.returnToCamp();
                            this.hasPlayerBeenDetected = false;
                        }
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

        const direction = this.determineDirectionToPoint(player.getPosition().x, player.getPosition().y);
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
        this.sprite.off('animationcomplete');

        let damageFrames = [];
        if (this.attackCount > 1 && !hasProjectile) {
            for (let i = 1; i <= this.attackCount; i++) {
                damageFrames.push(Math.ceil((5 / this.attackCount) * i));
            }
        } else if (!hasProjectile) {
            damageFrames.push(5);
        }

        this.sprite.on('animationupdate', (anim, frame) => {
            if (anim.key === attackAnimationKey) {
                if (frame.index === 4 && hasProjectile) {
                    this.launchProjectile(player, angleToPlayer);
                } else if (damageFrames.includes(frame.index) && !hasProjectile) {
                    const playerPos = player.getPosition();
                    if (this.isPlayerInArc(playerPos, this.sprite, this.attackRange, angleToPlayer - Math.PI / 6, angleToPlayer + Math.PI / 6)) {
                        player.takeDamage(this.damage, this);
                    } else {
                        this.createDodgeText(player);
                    }
                }
            }
        });

        this.sprite.once('animationcomplete', anim => {
            if (anim.key === attackAnimationKey) {
                if (player.isDead) {
                    this.stopAttackingPlayer();
                    return;
                }
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
        projectile.setRotation(angleToPlayer);

        const projectileSpeed = 500;
        const maxDistance = this.attackRange;
        projectile.hit = false; // ensure damage is applied only once

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
                if (!projectile.hit && Phaser.Math.Distance.Between(projectile.x, projectile.y, player.getPosition().x, player.getPosition().y) < 10) {
                    player.takeDamage(this.damage, this);
                    projectile.hit = true;
                    projectile.destroy();
                }
            },
            onComplete: () => {
                if (!projectile.hit) {
                    this.createDodgeText(player);
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

    determineDirectionToPoint(playerX, playerY) {
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

    createDamageText(damage, color) {
        const damageText = this.scene.add.text(this.sprite.x, this.sprite.y - 100, `-${damage}`, { font: '36px Orbitron', fill: color });
        damageText.setOrigin(0.5, 0.5);

        // Animation for damage text (move up and fade out)
        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 30, // Move up
            alpha: 0, // Fade out
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                damageText.destroy();
            }
        });
    }

    createDodgeText(player) {
        const dodgeText = this.scene.add.text(player.getPosition().x, player.getPosition().y - 100, 'Dodged!', { font: '24px Orbitron', fill: '#fff' });
        dodgeText.setOrigin(0.5, 0.5);

        this.scene.tweens.add({
            targets: dodgeText,
            y: dodgeText.y - 30,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                dodgeText.destroy();
            }
        });
    }

    die(causedByBaseDestruction = false) {
        if (this.fireTimerEvent) this.fireTimerEvent.destroy();
        if (this.isDead) return;
        if (this.scene.player.targetedEnemy === this) {
            this.scene.player.targetedEnemy = null;
        }
        this.isDead = true;
        const scoreAward = causedByBaseDestruction ? 50 : 100;
        this.scene.scene.get('BattleUI').updateScore(scoreAward);

        console.log('Enemy died');
        // Stop any ongoing movement
        if (this.moveTween) {
            this.moveTween.stop();
        }
        this.isMoving = false;

        this.dropGold(causedByBaseDestruction);
        this.dropCash();

        // Stop any ongoing animation and play the death animation
        this.sprite.stop();
        this.sprite.play(`character${this.characterCode}Death`);
        this.sprite.removeInteractive();

        if (this.attacker) {
            this.attacker.stopAttackingEnemy();
        }

        // this.scene.enemies contain an array of all enemies. We remove the current enemy from the array
        this.scene.enemies = this.scene.enemies.filter(enemy => enemy !== this);

        this.healthBar.destroy();

        this.detectionBar.destroy();

        this.customSquareContainer.destroy();

        this.strengthenedSquareContainer.destroy();

        [this.attackRangeArc, this.attackRangeRect].forEach(banana => {
            if (banana) banana.destroy();
        });
        // this.detectionField.setVisible(false);
    }

    dropGold(causedByBaseDestruction) {
        const goldPieces = causedByBaseDestruction ? 1 : 2;
        for (let i = 0; i < goldPieces; i++) {
            let goldX = this.sprite.x + (Math.random() * 100) - 50; // random between -50 and 50
            let goldY = this.sprite.y + (Math.random() * 100) - 50;
            let gold = this.scene.add.sprite(goldX, goldY, 'gold');
            gold.setScale(0.5);
            gold.setData('value', 100);
            this.scene.time.delayedCall(2000, () => {
                this.scene.collectGold(gold);
            }, [], this);
        }
    }

    dropCash() {
        if (Math.random() < 0.25) {
            let cash = this.scene.add.sprite(this.sprite.x - 70, this.sprite.y, 'cash');
            cash.setData('value', 1);
            this.scene.time.delayedCall(2000, () => {
                this.scene.collectCash(cash);
            }, [], this);
        }
    }

    initializeFire() {
        this.fireWidth = 25;
        this.fireHeight = 25;
        this.fireArray = new Array(this.fireWidth * this.fireHeight).fill(0);
        this.firePixelSize = 1;
        this.fireGradient = chroma.scale(['#000000', '#000000', '#ffff00', '#ff8700', '#FF0000']).domain([0, 10, 20, 50, 100]);
    }

    fireEffect() {
        if (this.isDead) return;
        if (!this.fireGraphics) {
            this.fireGraphics = this.scene.add.graphics();
            this.initializeFire();
            this.fireGraphics.setPosition(-10, -10); // Position relative to the container
        }
        if (!this.fireTimerEvent) {
            this.fireTimerEvent = this.scene.time.addEvent({
                callback: () => {
                    const updateFire = () => {
                        for (let x = 0; x < this.fireWidth; x++) {
                            this.fireArray[(this.fireHeight - 1) * this.fireWidth + x] = Math.floor(Math.random() * 255);
                        }

                        for (let y = 0; y < this.fireHeight - 1; y++) {
                            for (let x = 0; x < this.fireWidth; x++) {
                                let c = 0;
                                c += this.fireArray[Math.max(y + 1, 0) * this.fireWidth + Math.max(x - 1, 0)];
                                c += this.fireArray[Math.max(y + 1, 0) * this.fireWidth + x];
                                c += this.fireArray[Math.max(y + 1, 0) * this.fireWidth + Math.min(x + 1, this.fireWidth - 1)];
                                c += this.fireArray[Math.min(y + 2, this.fireHeight - 1) * this.fireWidth + x];
                                this.fireArray[y * this.fireWidth + x] = c / 4.1;
                            }
                        }

                        this.fireGraphics.clear();
                        for (let y = 0; y < this.fireHeight; y++) {
                            for (let x = 0; x < this.fireWidth; x++) {
                                const colorValue = this.fireArray[y * this.fireWidth + x] * 100.0 / 255;
                                const color = this.fireGradient(colorValue).hex();
                                this.fireGraphics.fillStyle(Phaser.Display.Color.HexStringToColor(color).color, 1);
                                this.fireGraphics.fillRect(x * this.firePixelSize, y * this.firePixelSize, this.firePixelSize, this.firePixelSize);
                            }
                        }
                    };
                    updateFire();
                },
                callbackScope: this,
                loop: true,
                delay: 75
            });
        }

        return this.fireGraphics;
    }

    createHealthBar() {
        this.healthBar = this.scene.add.graphics();
        this.healthBar.setDepth(1);

        // this.customSquare = this.fireEffect(); // i do not understand this fire code by the way!
        this.customSquare = this.scene.add.graphics();
        this.customSquare.fillStyle(0x0000ff, 1);
        this.customSquare.fillRect(-10, -10, 25, 25);
        this.customSquareText = this.scene.add.text(0, 0, this.level, {
            font: '16px Orbitron',
            fill: '#ffffff',
        }).setOrigin(0.5, 0.5);

        this.customSquareContainer = this.scene.add.container(0, 0);
        this.customSquareContainer.add(this.customSquare);
        this.customSquareContainer.add(this.customSquareText);
        this.customSquareContainer.setDepth(1);

        this.strengthenedSquare = this.scene.add.graphics();
        this.strengthenedSquareContainer = this.scene.add.container(this.sprite.x + 40, this.sprite.y);
        this.drawHexagon();
        this.strengthenedSquareContainer.add(this.strengthenedSquare);
        this.strengthenedSquareText = this.scene.add.text(0, 0, '1', {
            font: '16px Orbitron',
            fill: '#ffffff',
        }).setOrigin(0.5, 0.5);
        this.strengthenedSquareContainer.add(this.strengthenedSquareText);
        this.strengthenedSquareContainer.setDepth(1);

        this.updateHealthBar();
    }

    drawHexagon() {
        this.strengthenedSquare.clear();
        this.strengthenedSquare.fillStyle('#000', 1); // black, 100% opacity

        // Draw a hexagon
        const radius = 15;
        this.strengthenedSquare.beginPath();
        for (let i = 0; i < 6; i++) {
            // calculate vertex positions
            const x = radius * Math.cos(2 * Math.PI * i / 6 - Math.PI / 2);
            const y = radius * Math.sin(2 * Math.PI * i / 6 - Math.PI / 2);
            if (i === 0) this.strengthenedSquare.moveTo(x, y);
            else this.strengthenedSquare.lineTo(x, y);
        }
        this.strengthenedSquare.closePath();
        this.strengthenedSquare.fill();
    }

    updateHealthBar() {
        if (this.isDead) return;
        const barX = this.sprite.x - 30;
        const barY = this.sprite.y - this.sprite.body.height / 2;
        this.healthBar.clear();
        this.healthBar.setPosition(barX, barY);

        // Background of health bar (transparent part)
        this.healthBar.fillStyle(0x000000, 0.5);
        this.healthBar.fillRect(0, 0, 60, 7);

        // Health portion (dynamic width based on current health)
        const healthPercentage = this.health / this.maxHealth;
        const healthBarWidth = healthPercentage * 60;
        this.healthBar.fillStyle(0xff0000, 1);
        this.healthBar.fillRect(0, 0, healthBarWidth, 7);

        if (this.customSquareContainer) {
            const containerX = this.sprite.x - 40;
            const containerY = this.sprite.y - this.sprite.body.height / 2 + 5;
            this.customSquareContainer.setPosition(containerX, containerY);
        }
        if (this.strengthenedSquareContainer) {
            const strengthenedSquareX = this.sprite.x + 42;
            const strengthenedSquareY = this.sprite.y - this.sprite.body.height / 2 + 3;
            this.strengthenedSquareContainer.setPosition(strengthenedSquareX, strengthenedSquareY);
            // update the text
            this.strengthenedSquareText.setText(this.strengthenLevel);

        }
    }

    updateDetectionBar(percentage) {
        if (!this.hasPlayerBeenDetected) return;
        const barX = this.sprite.x - 30; // same x as the health bar
        const barY = (this.sprite.y - this.sprite.body.height / 2) + 8;

        // this.detectionField.alpha = percentage;
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
            const randomIdleAnimation = this.idleAnimations[Math.floor(Math.random() * this.idleAnimations.length)];
            this.sprite.play(randomIdleAnimation);
        }
    }

    returnToCamp() {
        if (!this.originalCamp) return;
        this.isMoving = true;
        this.isAttacking = false;
        this.hasPlayerBeenDetected = false;

        let increasedSpeed = this.speed * 1.5; // Increase speed by 50%
        let randomPosition = this.originalCamp.getRandomPositionInRadius();

        let directionToCamp = this.determineDirectionToPoint(randomPosition.x, randomPosition.y);
        const movingAnimationKey = `character${this.characterCode}Moving${directionToCamp}`;

        // Play the moving animation towards the camp
        this.sprite.play(movingAnimationKey);

        let distance = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, randomPosition.x, randomPosition.y);
        let duration = distance / increasedSpeed * 1000;

        if (this.moveTween) {
            this.moveTween.stop();
        }

        this.moveTween = this.scene.tweens.add({
            targets: this.sprite,
            x: randomPosition.x,
            y: randomPosition.y,
            duration: duration,
            ease: 'Linear',
            onUpdate: () => {
                if (this.isEnraged) {
                    this.returningToCamp = false;
                    this.isMoving = false;
                    if (this.moveTween) {
                        this.moveTween.stop();
                    }
                }
                else {
                    this.returningToCamp = true;
                }
                let updatedDirection = this.determineDirectionToPoint(randomPosition.x, randomPosition.y);
                let updatedAnimationKey = `character${this.characterCode}Moving${updatedDirection}`;
                if (this.sprite.anims.currentAnim.key !== updatedAnimationKey) {
                    this.sprite.play(updatedAnimationKey);
                }
            },
            onComplete: () => {
                this.isMoving = false;
                this.returningToCamp = false;
                this.inCamp = true
                this.sprite.play(`character${this.characterCode}Idle1`);
            }
        });
    }

    heal(amount) {
        this.health = Math.min(this.health + amount, this.maxHealth);
        this.updateHealthBar();
        this.createHealingText(amount);
    }

    createHealingText(amount) {
        const healingText = this.scene.add.text(this.sprite.x, this.sprite.y - 100, `+${amount}`, { font: '36px Orbitron', fill: '#00ff00' });
        healingText.setOrigin(0.5, 0.5);

        // Animation for healing text (move up and fade out)
        this.scene.tweens.add({
            targets: healingText,
            y: healingText.y - 30, // Move up
            alpha: 0, // Fade out
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                healingText.destroy(); // Remove the text object
            }
        });
    }

    setEnraged() {
        if (this.base.isDestroyed) return;
        if (!this.isEnraged) {
            this.isEnraged = true;
            this.damage = this.damage * 2;
            this.speed = this.speed * 2;
            this.enrageStartTime = this.scene.time.now;

            this.customSquareContainer.remove(this.customSquare, false);
            this.customSquare = this.fireEffect();
            this.customSquareContainer.addAt(this.customSquare, 0);
        } else {
            // Reset enrage timer
            this.enrageStartTime = this.scene.time.now;
        }
    }

    disenrage() {
        this.isEnraged = false;
        this.damage = Math.round(this.damage / 2);
        this.speed = Math.round(this.speed / 2);

        this.isAlert = true;
        this.timeInAlert = 0;
        this.timeOutOfDetection = 0;
        this.updateDetectionBar(1);

        this.customSquareContainer.remove(this.customSquare, false);
        this.customSquare = this.scene.add.graphics();
        this.customSquare.fillStyle(0x0000ff, 1);
        this.customSquare.fillRect(-10, -10, 25, 25);
        this.customSquareContainer.addAt(this.customSquare, 0);
    }

    update(time, delta) {
        if (this.isDead) return;
        // this.detectionField.setPosition(this.sprite.x, this.sprite.y);
        this.updateHealthBar();

        const isMoving = this.moveTween && this.moveTween.isPlaying();
        const isAttacking = this.sprite.anims.isPlaying && this.sprite.anims.currentAnim.key.includes('Attack');

        if (!isMoving && !isAttacking) {
            // Check if enough time has passed to change the animation
            if (time - this.lastActionTime > 5000) { // 5 seconds of inactivity
                const randomIdleAnimation = this.idleAnimations[Math.floor(Math.random() * this.idleAnimations.length)];
                this.sprite.play(randomIdleAnimation);
                this.lastActionTime = time;
            }
        } else {
            this.lastActionTime = time; // Reset the last action time if the enemy is moving or attacking
        }

        const distanceFromCamp = Phaser.Math.Distance.Between(
            this.sprite.x, this.sprite.y,
            this.originalCamp.x, this.originalCamp.y
        );

        if (distanceFromCamp > this.originalCamp.radius) {
            this.inCamp = false;
        } else if (!this.isMoving && !this.isAttacking) {
            this.inCamp = true;
        } else {
            this.inCamp = false;
        }

        if (this.inCamp && this.health < this.maxHealth) {
            if (time - this.lastHealTime > 1000) { // Heal every 1 second
                const healPercentage = 0.05; // 5% of max health per second
                let healAmount = Math.round(this.maxHealth * healPercentage);

                healAmount = Math.min(healAmount, this.maxHealth - this.health);
                this.heal(healAmount);
                this.lastHealTime = time;
            }
        }

        if (this.isEnraged && time - this.enrageStartTime > this.enrageDuration) {
            this.disenrage();
        }

        if (time > this.strengthenTimer) {
            this.strengthenEnemies();
        }

    }

}

export default Enemy;