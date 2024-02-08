class BattleUI extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleUI', active: false });
        this.score = 0;
        this.scoreText = null;
        this.multiplier = 5;
        this.multiplierMin = 0.5;
        this.multiplierDuration = 3000;
        this.lastMultiplierUpdate = 0;
        this.timerStarted = false;
        this.baseRebuildText = null;
        this.baseRebuildBarBackground = null;
        this.baseRebuildBarFill = null;
        this.baseRebuilding = false;
        this.isMultiplierPaused = false;
        this.gold = 0;
    }

    startMultiplierTimer() {
        if (!this.timerStarted) {
            this.timerStarted = true;
            this.lastMultiplierUpdate = this.time.now;
        }
    }

    addGold(value) {
        this.gold += value;
        this.updateGoldDisplay();
    }
    
    updateGoldDisplay() {
        this.goldText.setText(`${this.gold} Shop`);
    }

    create() {
        const panel = this.add.rectangle(this.scale.width - 30, 150, 350, 600, 0x000000, 0.5);
        panel.setOrigin(1, 0);
        panel.setScrollFactor(0);

        const panelCenterX = this.scale.width - 30 - panel.width / 2;
        const headerTextY = 175;
        this.add.text(panelCenterX, headerTextY, "Battle Panel", {
            font: '20px Orbitron',
            fill: '#ffffff'
        }).setOrigin(0.5, 0).setScrollFactor(0);

        const approachingTextY = headerTextY + 50;
        this.approachingText = this.add.text(panelCenterX + 10, approachingTextY, "Catastrophe approaches", {
            font: '16px Orbitron',
            fill: '#ffffff',
        }).setOrigin(0.5, 0).setScrollFactor(0);

        this.catastropheIcon = this.add.image(panelCenterX - 150, approachingTextY + 15, 'catastrophe').setScale(0.5).setScrollFactor(0).setOrigin(0, 0.5);
        
        this.flashing = false;
        this.flashingTween = null;

        this.timerBarBackground = this.add.rectangle(panelCenterX, approachingTextY + 40, 300, 20, 0xffffff, 0.2).setOrigin(0.5, 0).setScrollFactor(0);
        this.timerBarFill = this.add.rectangle(this.timerBarBackground.x - this.timerBarBackground.width / 2, approachingTextY + 40, 0, 20, 0x00ff00).setOrigin(0, 0).setScrollFactor(0);

        this.stormMaxTime = this.scene.get('GameScene').catastrophe.stormInterval;
        this.currentTime = 0;

        const strengthenTextY = approachingTextY + 80;
        this.add.text(panelCenterX, strengthenTextY, "Enemy strengthens", {
            font: '16px Orbitron',
            fill: '#ffffff'
        }).setOrigin(0.5, 0).setScrollFactor(0);

        this.strengthenIcon = this.add.image(panelCenterX - 150, strengthenTextY + 15, 'strengthen').setScale(0.5).setScrollFactor(0).setOrigin(0, 0.5);

        this.strengthenBarBackground = this.add.rectangle(panelCenterX, strengthenTextY + 40, 300, 20, 0xffffff, 0.2).setOrigin(0.5, 0).setScrollFactor(0);
        this.strengthenBarFill = this.add.rectangle(this.strengthenBarBackground.x - this.strengthenBarBackground.width / 2, strengthenTextY + 40, 0, 20, 0xff0000).setOrigin(0, 0).setScrollFactor(0);

        this.strengthenMaxTime = this.scene.get('GameScene').enemies[0].enemyStrengthenInterval;
        this.strengthenCurrentTime = 0;

        this.strengthenedSquare = this.add.graphics();
        this.strengthenedSquareContainer = this.add.container(panelCenterX + 130, strengthenTextY + 15);
        this.drawHexagon();
        this.strengthenedSquareContainer.add(this.strengthenedSquare);
        this.strengthenedSquareText = this.add.text(0, 0, '1', {
            font: '16px Orbitron',
            fill: '#ffffff',
        }).setOrigin(0.5, 0.5);
        this.strengthenedSquareContainer.add(this.strengthenedSquareText);
        this.strengthenedSquareContainer.setDepth(1);

        const multiplierTextY = strengthenTextY + 80;
        this.multiplierText = this.add.text(panelCenterX, multiplierTextY, `Multiplier: x${this.multiplier}`, {
            font: '16px Orbitron',
            fill: '#ffffff'
        }).setOrigin(0.5, 0).setScrollFactor(0);

        const multiplierBarBackground = this.add.rectangle(panelCenterX, multiplierTextY + 30, 300, 20, 0x000000, 0.5).setOrigin(0.5, 0);
        this.multiplierBarFill = this.add.rectangle(multiplierBarBackground.x - multiplierBarBackground.width / 2, multiplierTextY + 30, 300, 20, 0x00ff00).setOrigin(0, 0).setScrollFactor(0);

        this.lastMultiplierUpdate = this.scene.get('GameScene').time.now;

        const statsTextY = this.multiplierText.y + 80;
        this.add.text(panelCenterX, statsTextY, "Player Stats", {
            font: '20px Orbitron',
            fill: '#ffffff'
        }).setOrigin(0.5, 0).setScrollFactor(0);

        this.playerIcon = this.add.image(panelCenterX - 120, statsTextY + 15, 'player').setScale(0.5).setScrollFactor(0).setOrigin(0, 0.5);

        const playerHealth = this.scene.get('GameScene').player.health;
        const playerDamage = this.scene.get('GameScene').player.damage;

        this.playerHealthText = this.add.text(panelCenterX - 130, statsTextY + 50, `Health: ${playerHealth}`, {
            font: '16px Orbitron',
            fill: '#ffffff'
        }).setOrigin(0, 0.5).setScrollFactor(0);

        this.playerHealthText = this.add.text(panelCenterX - 130, statsTextY + 80, `Damage: ${playerDamage}`, {
            font: '16px Orbitron',
            fill: '#ffffff'
        }).setOrigin(0, 0.5).setScrollFactor(0);


        const shopTextY = statsTextY + 120;
        this.goldText = this.add.text(panelCenterX, shopTextY, "0 Shop", {
            font: '20px Orbitron',
            fill: '#ffffff'
        }).setOrigin(0.5, 0).setScrollFactor(0);

        this.shopIcon = this.add.image(panelCenterX - 140, shopTextY + 15, 'gold').setScrollFactor(0).setOrigin(0, 0.5);
        
        

        const scorePanelX = this.scale.width - 30;
        const scorePanelY = this.scale.height - 120;
        const scorePanelWidth = 350;
        const scorePanelHeight = 100;

        
        const scorePanelBackground = this.add.rectangle(scorePanelX, scorePanelY, scorePanelWidth, scorePanelHeight, 0x000000, 0.5);
        scorePanelBackground.setOrigin(1, 1);

        const scoreTextX = scorePanelX - scorePanelWidth + 20;
        const scoreTextY = scorePanelY - scorePanelHeight / 2;
        this.scoreText = this.add.text(scoreTextX, scoreTextY, 'Score: 0', {
            font: '20px Orbitron',
            fill: '#ffffff'
        }).setOrigin(0, 0.5);


        this.createBaseRebuildTimer();
    }

    getCenter() {
        // get the center of shop icon
        return {
            x: this.goldText.x,
            y: this.goldText.y
        };
    }

    updateTimer(currentTime) {
        this.currentTime = currentTime;
        const fillWidth = Math.max(0, (this.currentTime / this.stormMaxTime) * this.timerBarBackground.width);
        this.timerBarFill.width = fillWidth;

        if (this.currentTime / this.stormMaxTime <= 0.5) {
            this.timerBarFill.setFillStyle(0xff0000); // red
            if (!this.flashing) {
                this.flashing = true;
                this.startFlashing();
            }
        } else {
            this.timerBarFill.setFillStyle(0x00ff00);
            if (this.flashing) {
                this.flashing = false;
                this.stopFlashing();
            }
        }

    }

    startFlashing() {
        if (this.flashingTween) {
            this.flashingTween.restart();
        } else {
            this.flashingTween = this.tweens.add({
                targets: this.timerBarFill,
                alpha: { from: 1, to: 0.2 },
                ease: 'Linear',
                duration: 500,
                repeat: -1,
                yoyo: true
            });
        }
    }

    stopFlashing() {
        if (this.flashingTween) {
            this.flashingTween.stop();
            this.timerBarFill.alpha = 1;
            this.flashingTween = null;
        }
    }

    updateCatastropheText(isStormLaunching) {
        this.approachingText.setText(isStormLaunching ? "Storm launching!" : "Catastrophe approaches");
    }

    updateScore(amount) {
        this.score += amount * this.multiplier;
        this.scoreText.setText(`Score: ${this.score}`);
    }

    createBaseRebuildTimer() {
        this.baseRebuildText = this.add.text(this.scale.width / 2, 150, '', {
            font: '20px Orbitron',
            fill: '#000'
        }).setOrigin(0.5, 0).setScrollFactor(0).setVisible(false);
    
        this.baseRebuildGraphics = this.add.graphics().setScrollFactor(0).setVisible(false);
    }
    
    updateBaseRebuildUI(rebuildProgress) {
        this.baseRebuildText.setVisible(true);
        this.baseRebuildGraphics.setVisible(true);
    
        this.baseRebuildText.setText('REBUILDING BASE...');
    
        this.baseRebuildGraphics.clear();
        this.baseRebuildGraphics.fillStyle(0x000000, 0.5);
        this.baseRebuildGraphics.fillRoundedRect(this.scale.width / 2 - 150, 200, 300, 30, 10);
        this.baseRebuildBarFillWidth = Math.max(0, (1 - rebuildProgress) * 300);
        this.baseRebuildBarFillWidth = Math.min(this.baseRebuildBarFillWidth, 300);
    
        this.baseRebuildGraphics.fillStyle(0x00ff00, 1);
        this.baseRebuildGraphics.fillRoundedRect(this.scale.width / 2 - 150, 200, this.baseRebuildBarFillWidth + 10, 30, 10);
    }

    resetBaseRebuildUI() {
        this.baseRebuilding = false;
        this.baseRebuildText.setText('');
        this.baseRebuildGraphics.clear();
    }

    update() {
        if (!this.timerStarted || this.isMultiplierPaused) return;
        this.updateMultiplierFill();
        if (this.strengthenedSquareText) {
            if (this.scene.get('GameScene').enemies.length > 0) {
                let currentStrengthLevel = this.scene.get('GameScene').enemies[0].strengthenLevel;
                if (this.strengthenedSquareText.text !== `${currentStrengthLevel}`) {
                    this.strengthenedSquareText.setText(`${currentStrengthLevel}`);
                }
            }
        }
    }

    updateMultiplierFill() {
        if (!this.timerStarted || this.isMultiplierPaused) return;
        if (this.multiplier === this.multiplierMin) {
            this.multiplierBarFill.width = 300; // Keep the bar full
            return; // Stop further processing
        }
        const currentTime = this.scene.get('GameScene').time.now;
        const elapsedTime = currentTime - this.lastMultiplierUpdate;
        const remainingTime = this.multiplierDuration - elapsedTime;
        const fillPercentage = remainingTime / this.multiplierDuration;
        const newWidth = fillPercentage * 300; // Assuming full width is 300.
        this.multiplierBarFill.width = newWidth;
    
        // Check if it's time to decrement the multiplier
        if (remainingTime <= 0) {
            if (this.multiplier > this.multiplierMin) {
                this.multiplier -= 0.5; // Decrement by 0.5
                this.multiplier = Math.max(this.multiplier, this.multiplierMin); // Ensure it doesn't go below 0.5
                this.multiplierText.setText(`Multiplier: x${this.multiplier}`);
                this.lastMultiplierUpdate = currentTime;
            }
            
            // If the multiplier is at its minimum, reset the fill width to full
            if (this.multiplier === this.multiplierMin) {
                this.multiplierBarFill.width = 300;
            }
        }
    }
    
    pauseMultiplier() {
        this.isMultiplierPaused = true;
    }

    resetMultiplier() {
        this.multiplier = 5;
        this.multiplierText.setText(`Multiplier: x${this.multiplier}`);
        this.isMultiplierPaused = false;

        this.multiplierBarFill.width = 300;

        this.lastMultiplierUpdate = this.time.now;
    }

    updateStrengthenTimer(currentTime) {
        this.strengthenCurrentTime = currentTime;
        const fillWidth = Math.max(0, (this.strengthenCurrentTime / this.strengthenMaxTime) * this.strengthenBarBackground.width);
        this.strengthenBarFill.width = fillWidth;
        if (this.strengthenCurrentTime / this.strengthenMaxTime <= 0.5) {
            this.strengthenBarFill.setFillStyle(0xff0000); // red
        } else {
            this.strengthenBarFill.setFillStyle(0x00ff00);
        }
    }

    drawHexagon() {
        this.strengthenedSquare.clear();
        this.strengthenedSquare.fillStyle('#000', 1); // black, 100% opacity

        // Draw a hexagon
        const radius = 25;
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

}


export default BattleUI;

