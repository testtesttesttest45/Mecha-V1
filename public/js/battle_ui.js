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
        this.gold = 100;
        this.cash = 0;
        this.scrollbarTrack = null;
        this.scrollbarHandle = null;
        this.scrollPosition = 0;
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
        this.goldText.setText(`    ${this.gold} Shop`);
    }

    addCash(value) {
        this.cash += value;
        this.updateCashDisplay();
    }

    updateCashDisplay() {
        this.cashText.setText(`Cash:   ${this.cash}`);
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

        this.shopButtonContainer = this.add.container(panelCenterX, shopTextY).setScrollFactor(0);

        this.shopIcon = this.add.image(-140, 0, 'gold').setOrigin(0, 0.5).setScale(0.75);

        this.goldText = this.add.text(0, 0, `Gold: ${this.gold}`, {
            font: '20px Orbitron',
            fill: '#ffffff'
        }).setOrigin(0.5, 0);

        this.shopButtonContainer.add([this.shopIcon, this.goldText]);

        this.shopButtonContainer.setSize(300, 50);

        this.shopButtonContainer.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            this.createShopModal(); // Create or prepare the modal
            this.toggleShopModal(true); // Open the modal
        });

        let outline = this.add.graphics();
        outline.lineStyle(2, 0xffffff, 1); // white
        outline.strokeRect(
            this.shopButtonContainer.x - this.shopButtonContainer.width / 2,
            this.shopButtonContainer.y - this.shopButtonContainer.height / 2,
            this.shopButtonContainer.width,
            this.shopButtonContainer.height
        );

        const scorePanelX = this.scale.width - 30;
        const scorePanelY = this.scale.height - 120;
        const scorePanelWidth = 350;
        const scorePanelHeight = 100;


        const scorePanelBackground = this.add.rectangle(scorePanelX, scorePanelY, scorePanelWidth, scorePanelHeight, 0x000000, 0.5);
        scorePanelBackground.setOrigin(1, 1);

        const scoreTextX = scorePanelX - scorePanelWidth + 20;
        const scoreTextY = scorePanelY - scorePanelHeight / 2 - 20;
        this.scoreText = this.add.text(scoreTextX, scoreTextY, 'Score: 0', {
            font: '20px Orbitron',
            fill: '#ffffff'
        }).setOrigin(0, 0.5);


        const cashTextX = scorePanelX - scorePanelWidth + 20;
        const cashTextY = scorePanelY - scorePanelHeight / 2 + 30;
        this.cashText = this.add.text(cashTextX, cashTextY, 'Cash:   0', {
            font: '20px Orbitron',
            fill: '#ffffff'
        }).setOrigin(0, 0.5);

        this.cashIcon = this.add.image(cashTextX + 200, cashTextY, 'cash').setScrollFactor(0).setOrigin(1, 0.5);


        this.createBaseRebuildTimer();
    }

    createShopModal() {
        const screenWidth = this.scale.width;
        const screenHeight = this.scale.height;

        this.shopModalContainer = this.add.container(0, 0).setDepth(10).setVisible(false);

        const modalWidth = 1000;
        const modalHeight = 800;
        const modalX = (screenWidth - modalWidth) / 2;
        const modalY = (screenHeight - modalHeight) / 2;

        this.invisibleBackground = this.add.rectangle(0, 0, screenWidth, screenHeight, 0x000000, 0.5)
            .setOrigin(0, 0)
            .setInteractive()
            .setDepth(-1)
            .on('pointerdown', () => { });

        this.modalBackground = this.add.graphics()
            .fillStyle(0x222222, 0.95)
            .fillRoundedRect(modalX, modalY, modalWidth, modalHeight, 20);

        const viewportWidth = modalWidth;
        const viewportHeight = modalHeight;
        const viewportX = modalX;
        const viewportY = modalY;

        this.mask = this.add.graphics({ fillStyle: { color: 0xffffff } });
        this.mask.beginPath();
        this.mask.fillRoundedRect(viewportX, viewportY, viewportWidth, viewportHeight, 20);
        this.mask.closePath();

        this.scrollableContainer = this.add.container(0, 0);
        this.scrollableContainer.setMask(new Phaser.Display.Masks.GeometryMask(this, this.mask));

        this.shopModalContainer.add([this.mask, this.invisibleBackground, this.modalBackground, this.scrollableContainer]);

        this.closeButtonText = this.add.text(modalX + modalWidth - 40, modalY + 20, 'CLOSE', {
            font: '24px Orbitron',
            fill: '#ff0000'
        }).setInteractive({ useHandCursor: true }).setOrigin(1, 0)
            .on('pointerdown', () => this.toggleShopModal(false));

        const sectionWidth = modalWidth / 2 - 60;
        const damageSectionX = modalX + 30;
        const healthSectionX = modalX + sectionWidth + 90;
        const sectionY = modalY + 70;

        const itemsPerColumn = 2;
        const spacingBetweenItems = 200;
        const attackSpeedSectionY = sectionY + (itemsPerColumn * spacingBetweenItems);

        this.damageSectionTitle = this.add.text(damageSectionX, sectionY, "Damage Upgrades", {
            font: '28px Orbitron',
            fill: '#FFD700'
        });

        this.healthSectionTitle = this.add.text(healthSectionX, sectionY, "Health Upgrades", {
            font: '28px Orbitron',
            fill: '#FFD700'
        });

        this.attackSpeedSectionTitle = this.add.text(damageSectionX, attackSpeedSectionY + 50, "Attack Speed Upgrades", {
            font: '28px Orbitron',
            fill: '#FFD700'
        });

        this.movementSpeedSectionTitle = this.add.text(healthSectionX, attackSpeedSectionY + 50, "Movement Speed Upgrades", {
            font: '28px Orbitron',
            fill: '#FFD700'
        });

        // Upgrades definition
        const damageUpgrades = [
            { description: "Enhanced Sword - Increase damage by 10%", cost: 200, icon: 'sword1' },
            { description: "Sharpened Edge - Increase critical hit chance", cost: 300, icon: 'sword2' },
        ];

        const healthUpgrades = [
            { description: "Advanced Armor - Increase health by 20%", cost: 300, icon: 'health1' },
            { description: "Regeneration Boost - Increase health regeneration rate", cost: 400, icon: 'health2' },
        ];

        const attackSpeedUpgrades = [
            { description: "Swift Strikes - Increase attack speed by 10%", cost: 200, icon: 'attackSpeed1' },
            { description: "Faster Reload - Increase reload speed", cost: 300, icon: 'attackSpeed2' },
        ];

        const movementSpeedUpgrades = [
            { description: "Faster Movement - Increase movement speed by 10%", cost: 200, icon: '' },
            { description: "Agility Training - Increase dodge chance", cost: 300, icon: 'speed2' },
        ];

        this.createItems(damageUpgrades, damageSectionX, sectionY + 60, sectionWidth);
        this.createItems(healthUpgrades, healthSectionX, sectionY + 60, sectionWidth);
        this.createItems(attackSpeedUpgrades, damageSectionX, attackSpeedSectionY + 100, sectionWidth);
        this.createItems(movementSpeedUpgrades, healthSectionX, attackSpeedSectionY + 100, sectionWidth);

        this.shopModalContainer.add([this.closeButtonText]);
        this.scrollableContainer.add([this.damageSectionTitle, this.healthSectionTitle, this.attackSpeedSectionTitle, this.movementSpeedSectionTitle]);
        this.toggleShopModal(false);
        let lastPointerY = 0;
        let isScrolling = false;

        this.invisibleBackground.setInteractive().on('pointerdown', function (pointer) {
            isScrolling = true;
            lastPointerY = pointer.y;
        });

        const totalContentHeight = 1000;
        const minScrollY = viewportHeight - totalContentHeight;
        const maxScrollY = 0;
        const handleHeight = 300;
        const scrollbarTrackHeight = viewportHeight;
        const scrollbarTrackWidth = 20;
        const scrollbarMargin = 0;

        this.scrollbarTrack = this.add.graphics({ fillStyle: { color: 0x888888 } })
        this.scrollbarTrack.fillRect(viewportX + viewportWidth, viewportY + 150, scrollbarTrackWidth, scrollbarTrackHeight - 200);

        const scrollbarHandleWidth = scrollbarTrackWidth;
        const scrollbarHandleHeight = handleHeight - 100;

        this.scrollbarHandle = this.add.graphics({ fillStyle: { color: 0xff0000 } })
            .fillRect(viewportX + viewportWidth, viewportY, scrollbarTrackWidth, scrollbarHandleHeight);

        this.scrollbarHandle.setInteractive(new Phaser.Geom.Rectangle(viewportX + viewportWidth + scrollbarMargin, viewportY, scrollbarTrackWidth, scrollbarTrackHeight), Phaser.Geom.Rectangle.Contains);
        this.scrollbarHandle.setDepth(10)
        this.shopModalContainer.add([this.scrollbarTrack, this.scrollbarHandle]);
        const initialHandleY = 140;
        this.scrollbarHandle.y = initialHandleY;
        let isScrollbarHandleDragging = false;
        let initialPointerY = 0;

        this.scrollbarHandle.on('pointerdown', (pointer) => {
            isScrollbarHandleDragging = true;
            initialPointerY = pointer.y;
        });
        this.input.on('pointermove', (pointer) => {
            const handleRange = 550 - 140;
            const contentRange = -136 - 0;
            const handleMinY = 140;
            const handleMaxY = 550;
            const contentMinY = -136;
            const contentMaxY = 0;
            if (isScrolling) {
                const deltaY = pointer.y - lastPointerY;
                lastPointerY = pointer.y;
                let newY = this.scrollableContainer.y + deltaY;
                newY = Phaser.Math.Clamp(newY, contentMinY, contentMaxY);
                this.scrollableContainer.y = newY;
            
                const contentScrollRatio = (newY - contentMaxY) / (contentMinY - contentMaxY);
                const handleNewY = handleMinY + (contentScrollRatio * handleRange);
                this.scrollbarHandle.y = handleNewY;
                // console.log(`Scrolling Content: newY=${newY} HandleY=${this.scrollbarHandle.y}`);
            }

            else if (isScrollbarHandleDragging) {
                const deltaY = pointer.y - initialPointerY;
                initialPointerY = pointer.y;
            
                let handleNewY = this.scrollbarHandle.y + deltaY;
                handleNewY = Phaser.Math.Clamp(handleNewY, handleMinY, handleMaxY);
                this.scrollbarHandle.y = handleNewY;
            
                const handlePositionRatio = (handleNewY - handleMinY) / handleRange;
                const contentNewY = contentMaxY + (handlePositionRatio * contentRange);
                this.scrollableContainer.y = contentNewY;
                // console.log(`Dragging Handle: handleNewY=${handleNewY}, ContentY=${this.scrollableContainer.y}`);
            }
        });

        this.input.on('pointerup', (pointer) => {
            if (isScrollbarHandleDragging) {
                isScrollbarHandleDragging = false;
            }
            if (isScrolling) {
                isScrolling = false;
            }
        });
    }


    createItems(upgrades, startX, startY, sectionWidth) {
        upgrades.forEach((upgrade, index) => {
            const itemY = startY + (index * 200);
            const itemWidth = sectionWidth - 20;
            const itemHeight = 150;

            const itemBg = this.add.graphics()
                .fillStyle(0x333333, 0.8)
                .fillRoundedRect(startX, itemY, itemWidth, itemHeight, 10);

            const icon = this.add.image(startX + 40, itemY + 40, upgrade.icon).setScale(0.5);

            const descText = this.add.text(startX + 80, itemY + 10, upgrade.description, {
                font: '18px Orbitron',
                fill: '#FFFFFF',
                wordWrap: { width: itemWidth - 140 },
                wordWrapWidth: itemWidth - 140
            });

            const costText = this.add.text(startX + 60, itemY + itemHeight - 40, upgrade.cost, {
                font: '16px Orbitron',
                fill: '#FFD700'
            });

            const buyButton = this.add.text(startX + itemWidth - 100, itemY + itemHeight - 40, 'BUY', {
                font: '20px Orbitron',
                fill: '#4CAF50'
            }).setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.purchaseUpgrade(upgrade.description));

            this.scrollableContainer.add([itemBg, icon, descText, costText, buyButton]);
        });
    }




    toggleShopModal(visible) {
        // Set the container (and all its children) visibility
        this.shopModalContainer.setVisible(visible);

    }

    purchaseUpgrade(upgradeDescription) {
        console.log(`Purchasing Upgrade: ${upgradeDescription}`);
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

