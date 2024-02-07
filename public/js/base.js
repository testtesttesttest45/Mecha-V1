class Base {
    constructor(scene, player, camps, enemies) {
        this.scene = scene;
        this.player = player;
        this.camps = camps;
        this.sprite = null;
        this.safeDistanceFromPlayer = 500; // not too close to player
        this.minX = 1200; this.maxX = 2800;
        this.minY = 700; this.maxY = 1300;
        this.health = 1000;
        this.totalHealth = 1000;
        this.healthBar = null;
        this.isDestroyed = false;
        this.rebuildTime = 2000;
        this.destroyedTime = 0;
        this.customSquare = null;
        this.baseLevel = 1;
        this.enemies = enemies;
        this.isRebuilding = false;
    }

    create() {
        const baseLocation = this.findSuitableBaseLocation();
        this.sprite = this.scene.add.image(baseLocation.x, baseLocation.y, 'enemy_base');
        this.sprite.setOrigin(0.5, 0.5);
        this.sprite.setScale(2);
        this.sprite.setInteractive();
        this.isDestroyed = false;
        this.health = this.totalHealth;

        if (this.healthBar) {
            this.healthBar.clear();
        }
        this.createHealthBar();
    }


    findSuitableBaseLocation() {
        let baseX, baseY, tooCloseToPlayer, tooCloseToCamp;
        do { // keep execute until the base is not too close to player or camp
            baseX = Phaser.Math.Between(this.minX, this.maxX);
            baseY = Phaser.Math.Between(this.minY, this.maxY);
            tooCloseToPlayer = Phaser.Math.Distance.Between(this.player.position.x, this.player.position.y, baseX, baseY) < this.safeDistanceFromPlayer;

            tooCloseToCamp = this.camps.some(camp => {
                const distanceToCamp = Phaser.Math.Distance.Between(camp.x, camp.y, baseX, baseY);
                return distanceToCamp <= camp.radius;
            });
        } while (tooCloseToPlayer || tooCloseToCamp); // as long as the base is too close to player or camp, keep execute

        return { x: baseX, y: baseY }; // where the base is located
    }

    getPosition() {
        return {
            x: this.sprite.x,
            y: this.sprite.y
        };
    }

    createHealthBar() {
        this.healthBar = this.scene.add.graphics();
        this.healthBar.setDepth(1);
        this.updateHealthBar();

        this.customSquare = this.scene.add.graphics();
        this.customSquare.fillStyle(0x0000ff, 1);
        this.customSquare.fillRect(-10, -10, 20, 20);
        this.customSquareText = this.scene.add.text(0, 0, this.baseLevel, {
            font: '16px Orbitron',
            fill: '#ffffff',
        }).setOrigin(0.5, 0.5);

        this.customSquareContainer = this.scene.add.container(0, 0);
        this.customSquareContainer.add(this.customSquare);
        this.customSquareContainer.add(this.customSquareText);
        this.customSquareContainer.setDepth(1);

        this.updateHealthBar();
    }

    updateHealthBar() {
        const barX = this.sprite.x - this.sprite.width / 2;
        const barY = this.sprite.y - 150;
        this.healthBar.clear();
        this.healthBar.setPosition(barX, barY);
        // Background of health bar (transparent part)
        this.healthBar.fillStyle(0x000000, 0.5);
        this.healthBar.fillRect(0, 0, this.sprite.width, 10);
        this.healthBar.setDepth(11);
    
        const healthPercentage = this.health / this.totalHealth;
        const healthBarWidth = healthPercentage * this.sprite.width;
        this.healthBar.fillStyle(0xff0000, 1);
        this.healthBar.fillRect(0, 0, healthBarWidth, 10);
    
        const squareSize = 20;
        const containerX = barX - squareSize / 2;
        const containerY = barY + 5;
    
        if (this.customSquareContainer) {
            this.customSquareContainer.setPosition(containerX, containerY);
        }
    }


    takeDamage(damage, player) {
        this.attacker = player; // Store reference to the attacking player
        if (damage >= this.health) {
            this.destroyed();
            return;
        }
        this.enrageEnemies();
        this.health -= damage;
        this.health = Math.max(this.health, 0);
        this.hasPlayerBeenDetected = true;

        // every 10% health of the base, award 50 points
        if (this.health % (this.totalHealth / 10) === 0) {
            console.log('Awarding 50 points');
            this.scene.scene.get('BattleUI').updateScore(50);
        }

        this.createDamageText(damage);

        if (this.health <= 0 && !this.isDestroyed) {
            this.destroyed();
        }
        this.updateHealthBar();
    }

    createDamageText(damage) {
        const damageText = this.scene.add.text(this.sprite.x, this.sprite.y - 100, `-${damage}`, { font: '36px Orbitron', fill: '#ff0000' });
        damageText.setOrigin(0.5, 0.5);

        this.scene.tweens.add({
            targets: damageText,
            y: damageText.y - 30,
            alpha: 0,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                damageText.destroy();
            }
        });
    }

    destroyed() {
        if (this.isDestroyed) return;
        this.isDestroyed = true;
        if (this.scene.player.targetedEnemy === this) {
            this.scene.player.targetedEnemy = null;
        }
        
        this.scene.scene.get('BattleUI').updateScore(200);

        console.log('Base destroyed');
        this.sprite.disableInteractive();
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            duration: 1500,
            ease: 'Power1',
            onComplete: () => {
                this.sprite.setVisible(false);
            }
        });

        this.enemies.forEach(enemy => {
            if (!enemy.isDead) {
               enemy.die(true);
            }
        });

        if (this.attacker) {
            this.attacker.stopAttackingEnemy();
        }

        this.healthBar.destroy();
        this.customSquareContainer.destroy();
        this.destroyedTime = this.scene.time.now;
        
        this.isRebuilding = true; // Indicate that the base is now rebuilding.
        this.scene.scene.get('BattleUI').pauseMultiplier();
    }

    enrageEnemies() {
        this.enemies.forEach(enemy => {
            if (!enemy.isDead) {
                enemy.setEnraged();
            }
        });
    }

    recreateBaseAndEnemies() {
        this.scene.scene.get('BattleUI').resetBaseRebuildUI();
        const newBaseLocation = this.findSuitableBaseLocation();
        this.sprite.setPosition(newBaseLocation.x, newBaseLocation.y);
        this.sprite.setVisible(true).setAlpha(1).setInteractive();
        this.health = this.totalHealth;
        this.isDestroyed = false;
        this.createHealthBar();
        
        this.enemies.forEach(enemy => {
            if (enemy.isDead) {
                enemy.sprite.destroy();
            }
        });
        console.log("Base rebuilt, new sets of enemies created")
        this.scene.createEnemy(this.baseLevel);
    }
    
    update(time, delta) {
        if (this.isDestroyed && this.isRebuilding) {
            if (time - this.destroyedTime > this.rebuildTime) {
                this.baseLevel++;
                this.isRebuilding = false;
                this.recreateBaseAndEnemies();
                this.scene.scene.get('BattleUI').resetMultiplier(); // Call a method in BattleUI to reset the multiplier.
            }
        }
    }



}



export default Base;