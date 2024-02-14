class Base {
    constructor(scene, player, camps, enemies, baseLevel = 1) {
        this.originalHealth = 250; // 6000 at level 1
        this.baseLevel = baseLevel;
        this.scene = scene;
        this.player = player;
        this.camps = camps;
        this.sprite = null;
        this.safeDistanceFromPlayer = 500; // not too close to player
        this.minX = 1200; this.maxX = 2800;
        this.minY = 700; this.maxY = 1300;
        this.totalHealth = Math.round(this.originalHealth * Math.pow(1.2, this.baseLevel - 1));
        this.health = this.totalHealth;
        this.healthBar = null;
        this.isDestroyed = false;
        this.rebuildTime = 10000;
        this.destroyedTime = 0;
        this.customSquare = null;
        this.enemies = enemies;
        this.isRebuilding = false;
        this.healthText = null; 
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

        if (!this.healthText) {
            const barX = this.sprite.x - this.sprite.width / 2;
            const barY = this.sprite.y - 150 + 10;
            this.healthText = this.scene.add.text(barX, barY, '', {
                font: '16px Orbitron',
                fill: '#ffffff'
            }).setOrigin(0, 0.5).setDepth(11);
        }

        this.updateHealthBar();
    }

    updateHealthBar() {
        const barX = this.sprite.x - this.sprite.width / 2;
        const barY = this.sprite.y - 150;
        this.healthBar.clear();
        this.healthBar.setPosition(barX, barY);
        // Background of health bar (transparent part)
        this.healthBar.fillStyle(0x000000, 0.5);
        this.healthBar.fillRect(-40, 0, this.sprite.width + 100, 20);
        this.healthBar.setDepth(11);
    
        const healthPercentage = this.health / this.totalHealth;
        const healthBarWidth = healthPercentage * this.sprite.width + 100;
        this.healthBar.fillStyle(0xff0000, 1);
        this.healthBar.fillRect(-40, 0, healthBarWidth, 20);
    
        const squareSize = 20;
        const containerX = barX - squareSize / 2 - 40;
        const containerY = barY + 10;
    
        if (this.customSquareContainer) {
            this.customSquareContainer.setPosition(containerX, containerY);
        }

        if (this.healthText) {
            this.healthText.setText(`${this.health}/${this.totalHealth}`);
            const barX = this.sprite.x - this.sprite.width / 2 + 10;
            const barY = this.sprite.y - 150 + 10;
            this.healthText.setPosition(barX, barY);
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

        this.randomGoldDrop();

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
        if (this.healthText) {
            this.healthText.destroy();
            this.healthText = null;
        }
        this.destroyedTime = this.scene.activeGameTime;
        
        this.isRebuilding = true; // Indicate that the base is now rebuilding.
        this.scene.scene.get('BattleUI').pauseMultiplier();
    }

    randomGoldDrop() {
        const goldPieces = 4;
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

    enrageEnemies() {
        this.enemies.forEach(enemy => {
            if (!enemy.isDead) {
                enemy.setEnraged();
            }
        });
    }

    recreateBaseAndEnemies() {
        this.baseLevel++;
        this.totalHealth = Math.round(this.originalHealth * Math.pow(1.2, this.baseLevel - 1));

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
        this.scene.createEnemy(this.baseLevel);
        this.scene.catastrophe.updateDamage(this.baseLevel);
    }
    
    update(time, delta) {
        if (this.isDestroyed && this.isRebuilding) {
            if (time - this.destroyedTime > this.rebuildTime) {
                this.isRebuilding = false;
                this.recreateBaseAndEnemies();
                this.scene.scene.get('BattleUI').resetMultiplier(); // Call a method in BattleUI to reset the multiplier.
            }
        }
    }



}



export default Base;