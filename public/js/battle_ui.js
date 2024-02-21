class BattleUI extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleUI', active: false });
        this.gold = 1500;
        this.score = 0;
        this.scoreText = null;
        this.multiplier = 5;
        this.multiplierMin = 0.5;
        this.multiplierDuration = 12000;
        this.lastMultiplierUpdate = 0;
        this.timerStarted = false;
        this.baseRebuildText = null;
        this.baseRebuildBarBackground = null;
        this.baseRebuildBarFill = null;
        this.baseRebuilding = false;
        this.isMultiplierPaused = false;
        this.cash = 0;
        this.scrollbarTrack = null;
        this.scrollbarHandle = null;
        this.scrollPosition = 0;
        this.buyButtons = [];
        this.currentFeedbackText = null;
        this.playerHealthBaseText = null;
        this.playerHealthBonusText = null;
        this.itemPurchaseLimit = 5;
        this.purchaseCounts = {
            "Energy Gun": 0,
            "Quickblade": 0,
            "Lightning Core": 0,
            "Mecha Sneakers": 0,
        };
        this.legendaryPurchaseLimit = 1;
        this.legendaryPurchaseCount = {
            "Thunderlord Seal": 0,
            "Elixir of Life": 0,
            "Winter Frost": 0,
            "Treasure Hunter": 0,
            "Forbidden Excalibur": 0,
            "Soul of the Phoenix": 0,
            "Cosmic Scimitar": 0,
        };
        this.purchaseCountText = null;
        this.legendaryPurchaseCountText = null;
        this.goldTextShop = null;
        this.gameDataSaved = false;
        this.penknifeBulkBuyButton = null;
        this.legendaryIcons = [];
    }

    resetState() {
        console.log('State resetted');
        this.gold = 1500;
        this.score = 0;
        this.scoreText = null;
        this.multiplier = 5;
        this.multiplierMin = 0.5;
        this.multiplierDuration = 12000;
        this.lastMultiplierUpdate = 0;
        this.timerStarted = false;
        this.baseRebuildText = null;
        this.baseRebuildBarBackground = null;
        this.baseRebuildBarFill = null;
        this.baseRebuilding = false;
        this.isMultiplierPaused = false;
        this.cash = 0;
        this.scrollbarTrack = null;
        this.scrollbarHandle = null;
        this.scrollPosition = 0;
        this.buyButtons = [];
        this.currentFeedbackText = null;
        this.playerHealthBaseText = null;
        this.playerHealthBonusText = null;
        this.itemPurchaseLimit = 5;
        this.purchaseCounts = {
            "Energy Gun": 0,
            "Quickblade": 0,
            "Lightning Core": 0,
            "Mecha Sneakers": 0,
        };
        this.legendaryPurchaseLimit = 1;
        this.legendaryPurchaseCount = {
            "Thunderlord Seal": 0,
            "Elixir of Life": 0,
            "Winter Frost": 0,
            "Treasure Hunter": 0,
            "Forbidden Excalibur": 0,
            "Soul of the Phoenix": 0,
            "Cosmic Scimitar": 0,
        };
        this.purchaseCountText = null;
        this.legendaryPurchaseCountText = null;
        this.goldTextShop = null;
        this.gameDataSaved = false;
        this.penknifeBulkBuyButton = null;
        this.legendaryIcons = [];
    }

    startMultiplierTimer() {
        if (!this.timerStarted) {
            this.timerStarted = true;
            this.lastMultiplierUpdate = this.scene.get('GameScene').activeGameTime;
        }
    }

    addGold(value) {
        this.gold += value;
        this.updateGoldDisplay();
    }

    updateGoldDisplay() {
        if (this.goldText) {
            this.goldText.setText(this.gold);
        }
        if (this.goldTextShop) {
            this.goldTextShop.setText(this.gold);
        }
    }

    addCash(value) {
        this.cash += value;
        this.updateCashDisplay();
    }

    updateCashDisplay() {
        this.cashText.setText(`Cash:   ${this.cash}`);
    }

    create() {
        // this.resetState();
        const panel = this.add.rectangle(this.scale.width - 30, 120, 350, 700, 0x000000, 0.5);
        panel.setOrigin(1, 0);
        panel.setScrollFactor(0);

        const panelCenterX = this.scale.width - 30 - panel.width / 2;
        const headerTextY = 150;
        this.add.text(panelCenterX - 50, headerTextY, "Battle Panel", {
            font: '20px Orbitron',
            fill: '#ffffff'
        }).setOrigin(0.5, 0).setScrollFactor(0);

        const pauseButtonX = panelCenterX + 150; // 1865
        const pauseButtonY = headerTextY; // 150
        const pauseButtonRadius = 20;
        const pauseButtonBackground = this.add.graphics();
        pauseButtonBackground.fillStyle(0xff0000, 1);
        pauseButtonBackground.fillCircle(pauseButtonX, pauseButtonY, pauseButtonRadius);

        const pauseButtonText = this.add.text(pauseButtonX, pauseButtonY, '||', {
            font: '24px Orbitron',
            fill: '#ffffff'
        }).setOrigin(0.5, 0.5);

        pauseButtonBackground.setInteractive(new Phaser.Geom.Circle(pauseButtonX, pauseButtonY, pauseButtonRadius), Phaser.Geom.Circle.Contains).on('pointerdown', () => {
            this.pauseGame();
        });

        this.createCameraIcon();
        this.input.keyboard.on('keydown-L', () => {
            this.toggleCameraLock();
        });

        this.createLocationIcon();
        this.input.keyboard.on('keydown-SPACE', () => {
            this.toggleCameraFollow();
        });

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
        this.multiplierText = this.add.text(panelCenterX, multiplierTextY, `Score Multiplier: x${this.multiplier}`, {
            font: '16px Orbitron',
            fill: '#ffffff'
        }).setOrigin(0.5, 0).setScrollFactor(0);

        const multiplierBarBackground = this.add.rectangle(panelCenterX, multiplierTextY + 30, 300, 20, 0x000000, 0.5).setOrigin(0.5, 0);
        this.multiplierBarFill = this.add.rectangle(multiplierBarBackground.x - multiplierBarBackground.width / 2, multiplierTextY + 30, 300, 20, 0x00ff00).setOrigin(0, 0).setScrollFactor(0);

        this.lastMultiplierUpdate = this.scene.get('GameScene').activeGameTime;

        const statsTextY = this.multiplierText.y + 90;
        this.add.text(panelCenterX, statsTextY, "Player Stats", {
            font: '20px Orbitron',
            fill: '#ffffff'
        }).setOrigin(0.5, 0).setScrollFactor(0);


        let partTimeX = this.scale.width - 350;
        let partTimeY = 500;
        const playerName = this.scene.get('GameScene').player.name;
        const playerIcon = this.scene.get('GameScene').player.icon;
        this.playerIcon = this.add.image(panelCenterX - 150, statsTextY + 10, playerIcon).setScale(0.75).setScrollFactor(0).setOrigin(0, 0.5);
        this.playerNameText = this.add.text(partTimeX + 50, partTimeY, playerName, { font: '18px Orbitron', fill: '#ffffff' });
        this.playerHealthText = this.add.text(partTimeX, partTimeY + 30, 'Health: --/--', { font: '16px Orbitron', fill: '#ffffff' });
        this.playerDamageText = this.add.text(partTimeX, partTimeY + 50, 'Damage: --', { font: '16px Orbitron', fill: '#ffffff' });
        this.playerAttackSpeedText = this.add.text(partTimeX, partTimeY + 70, 'Attack Speed: --', { font: '16px Orbitron', fill: '#ffffff' });
        this.playerSpeedText = this.add.text(partTimeX, partTimeY + 90, 'Speed: --', { font: '16px Orbitron', fill: '#ffffff' });

        this.playerHealthBonusText = this.add.text(this.playerHealthText.x + 200, partTimeY + 30, '', { font: '16px Orbitron', fill: '#00BFFF' });
        this.playerDamageBonusText = this.add.text(this.playerDamageText.x + 200, partTimeY + 50, '', { font: '16px Orbitron', fill: '#00BFFF' });
        this.playerAttackSpeedBonusText = this.add.text(this.playerAttackSpeedText.x + 200, partTimeY + 70, '', { font: '16px Orbitron', fill: '#00BFFF' });
        this.playerSpeedBonusText = this.add.text(this.playerSpeedText.x + 200, partTimeY + 90, '', { font: '16px Orbitron', fill: '#00BFFF' });

        const shopTextY = statsTextY + 300;

        this.shopButtonContainer = this.add.container(panelCenterX, shopTextY).setScrollFactor(0);

        this.shopText = this.add.text(-40, -40, 'Shop', {
            font: '20px Orbitron',
            fill: '#ffffff'
        });

        this.goldText = this.add.text(-80, 10, this.gold, {
            font: '24px Orbitron',
            fill: '#ffffff'
        });

        this.shopIcon = this.add.image(this.goldText.width - 80, 25, 'gold').setOrigin(0, 0.5).setScale(0.75);

        this.shopButtonContainer.add([this.shopIcon, this.goldText, this.shopText]);

        this.shopButtonContainer.setSize(300, 100);

        this.shopButtonContainer.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
            this.createShopModal();
            this.toggleShopModal(true);
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

    createCameraIcon() {
        const cameraButtonX = 1820;
        const cameraButtonY = 150;
        const cameraButtonRadius = 20;

        const cameraButtonBackground = this.add.graphics();
        cameraButtonBackground.fillStyle(0x000000, 0.5);
        cameraButtonBackground.fillCircle(cameraButtonX, cameraButtonY, cameraButtonRadius);

        this.cameraIconGraphics = this.add.graphics({ x: cameraButtonX, y: cameraButtonY });
        this.updateCameraIcon();

        this.cameraTooltip = this.add.text(cameraButtonX, cameraButtonY - 25, 'Toggle Camera Lock [L]', {
            font: '14px Orbitron',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: {
                left: 5,
                right: 5,
                top: 2,
                bottom: 2
            }
        }).setOrigin(1, 0).setVisible(false).setDepth(1);

        cameraButtonBackground.setInteractive(new Phaser.Geom.Circle(cameraButtonX, cameraButtonY, cameraButtonRadius), Phaser.Geom.Circle.Contains)
            .on('pointerdown', () => {
                this.toggleCameraLock();
            })
            .on('pointerover', () => {
                this.cameraTooltip.setVisible(true);
            })
            .on('pointerout', () => {
                this.cameraTooltip.setVisible(false);
            });
    }

    createLocationIcon() {
        const locationButtonX = 1775;
        const locationButtonY = 150;
        const locationButtonRadius = 20;

        const locationButtonBackground = this.add.graphics();
        locationButtonBackground.fillStyle(0x000000, 0.5);
        locationButtonBackground.fillCircle(locationButtonX, locationButtonY, locationButtonRadius);

        this.locationIconGraphics = this.add.graphics({ x: locationButtonX, y: locationButtonY - 5 });
        this.drawLocationIcon(this.locationIconGraphics, 0x999999);

        this.locationTooltip = this.add.text(locationButtonX, locationButtonY - 25, 'Toggle Camera Follow [SPACE]', {
            font: '14px Orbitron',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: {
                left: 5,
                right: 5,
                top: 2,
                bottom: 2
            }
        }).setOrigin(1, 0).setVisible(false).setDepth(1);

        locationButtonBackground.setInteractive(new Phaser.Geom.Circle(locationButtonX, locationButtonY, locationButtonRadius), Phaser.Geom.Circle.Contains)
            .on('pointerdown', () => {
                this.toggleCameraFollow();
            }
            )
            .on('pointerover', () => {
                this.locationTooltip.setVisible(true);
            }
            )
            .on('pointerout', () => {
                this.locationTooltip.setVisible(false);
            }
            );
    }

    updateCameraIcon() {
        const gameScene = this.scene.get('GameScene');
        if (!gameScene) return;

        const isCameraLocked = gameScene.isCameraLocked;
        this.drawCameraIcon(this.cameraIconGraphics, isCameraLocked ? 0xffff00 : 0x999999);
    }

    updateLocationIcon() {
        const gameScene = this.scene.get('GameScene');
        if (!gameScene) return;

        const isCameraFollowingPlayer = gameScene.isCameraFollowingPlayer;
        this.drawLocationIcon(this.locationIconGraphics, isCameraFollowingPlayer ? 0xffff00 : 0x999999);
    }

    drawCameraIcon(graphics, fillColor) { // by ChatGPT
        graphics.clear();

        // Camera body
        graphics.fillStyle(fillColor, 1);
        graphics.fillRect(-15, -10, 30, 20);

        // Camera lens
        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(0, 0, 8);

        // Lens reflection (smaller circle inside the lens to give a bit of a glossy effect)
        graphics.fillStyle(0xffffff, 0.5);
        graphics.fillCircle(3, -3, 3);

        // Flash
        graphics.fillStyle(0xffffff, 1);
        graphics.fillRect(-20, -15, 8, 8);

        // Detail on the body (to suggest buttons or camera details)
        graphics.fillStyle(0x777777, 1);
        graphics.fillRect(10, -7, 2, 4);
        graphics.fillRect(10, 3, 2, 4);
    }

    drawLocationIcon(graphics, fillColor) {
        graphics.clear();

        const pinRadius = 10;
        const pinHeight = 20;
        const holeRadius = 3;

        graphics.fillStyle(fillColor, 1);

        graphics.fillCircle(0, 0, pinRadius);

        graphics.beginPath();
        graphics.moveTo(-pinRadius, 0);
        graphics.lineTo(0, pinHeight);
        graphics.lineTo(pinRadius, 0);
        graphics.closePath();
        graphics.fillPath();

        graphics.fillStyle(0x000000, 1);
        graphics.fillCircle(0, 0, holeRadius);
    }


    toggleCameraLock() {
        const gameScene = this.scene.get('GameScene');
        if (!gameScene) return;

        gameScene.toggleCameraLock();

        this.updateCameraIcon();
    }

    toggleCameraFollow() {
        const gameScene = this.scene.get('GameScene');
        if (!gameScene) return;

        gameScene.toggleCameraFollow();

        this.updateLocationIcon();
    }


    displayPlayerStats(x, y) {
        const { originalHealth, currentHealth, maxHealth, damage, originalDamage, attackSpeed, originalAttackSpeed, speed, originalSpeed } = this.scene.get('GameScene').player;
        const bonusHealth = maxHealth - originalHealth;
        const bonusDamage = damage - originalDamage;
        const bonusAttackSpeed = Math.round((attackSpeed - originalAttackSpeed) * 100) / 100;
        const bonusSpeed = speed - originalSpeed;

        this.playerHealthText.setText(`Health: ${currentHealth}/${maxHealth}`);
        this.playerDamageText.setText(`Damage: ${damage}`);
        this.playerAttackSpeedText.setText(`Attack Speed: ${attackSpeed}`);
        this.playerSpeedText.setText(`Speed: ${speed}`);

        this.playerHealthBonusText.setText(bonusHealth > 0 ? `(+${bonusHealth})` : '');
        this.playerDamageBonusText.setText(bonusDamage > 0 ? `(+${bonusDamage})` : '');
        this.playerAttackSpeedBonusText.setText(bonusAttackSpeed > 0 ? `(+${bonusAttackSpeed})` : '');
        this.playerSpeedBonusText.setText(bonusSpeed > 0 ? `(+${bonusSpeed})` : '');
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
        const headerBackgroundHeight = 50;
        const headerY = modalY;

        this.headerBackground = this.add.graphics()
            .fillStyle(0xffffff, 0.5)
            .fillRect(modalX, headerY, modalWidth, headerBackgroundHeight)
            .setDepth(9);

        this.shopModalContainer.add([this.headerBackground]);

        this.closeButtonText = this.add.text(modalX + modalWidth - 40, modalY + 20, 'CLOSE', {
            font: '24px Orbitron',
            fill: '#ff0000'
        }).setInteractive({ useHandCursor: true }).setOrigin(1, 0)
            .on('pointerdown', () => this.toggleShopModal(false));

        this.goldTextShop = this.add.text(modalX + 20, modalY + 20, this.gold, {
            font: '24px Orbitron',
            fill: '#FFA500'
        }).setOrigin(0, 0);
        const sectionWidth = modalWidth / 2 - 60;
        const damageSectionX = modalX + 30;
        const healthSectionX = modalX + sectionWidth + 90;
        const sectionY = modalY + 120;

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
        const legendarySectionY = this.attackSpeedSectionTitle.y + 450;
        // this.legendaryUpgradesSectionTitle = this.add.text(damageSectionX, legendarySectionY, "Legendary Upgrades", {
        // place title in centre of the modal
        this.legendaryUpgradesSectionTitle = this.add.text(modalX + 300, legendarySectionY, "Legendary Upgrades", {
            font: '28px Orbitron',
            fill: '#FFD700'
        })

        // Upgrades definition
        const damageUpgrades = [
            { name: "Penknife", description: "Increase damage by 1", cost: 55, icon: 'sword1' },
            { name: "Hunter's Blade", description: "Increase damage by 2%", cost: 200, icon: 'sword2' }
        ];

        const healthUpgrades = [
            { name: "Heaven's Rain", description: "Increase max health by 5%", cost: 750, icon: 'health1' },
            { name: "Health Potion", description: "Instantly heal back 50% Max Health", cost: 300, icon: 'health2' },
        ];

        const attackSpeedUpgrades = [
            { name: "Energy Gun", description: "Increase attack speed by 6%", cost: 660, icon: 'attackSpeed1' },
            { name: "Quickblade", description: "Increase attack speed by 12%", cost: 1250, icon: 'attackSpeed2' },
        ];

        const movementSpeedUpgrades = [
            { name: "Lightning Core", description: "Increase movement speed by 6%", cost: 700, icon: 'moveSpeed1' },
            { name: "Mecha Sneakers", description: "Increase movement speed by 12%", cost: 1300, icon: 'moveSpeed2' },
        ];

        const legendaryUpgrades = [
            { name: "Cash", description: "Exchange 300 Gold for 1 Cash", cost: 300, icon: 'cash' },
            { name: "Thunderlord Seal", description: "Permanent Immunity to Catastrophe storms", cost: 7000, icon: 'thunderlordSeal' },
            { name: "Elixir of Life", description: "Triple passive Heal amount", cost: 5400, icon: 'elixirOfLife' },
            { name: "Winter Frost", description: "Enraged enemies gain 0.9x original movement speed instead of 2x", cost: 5600, icon: 'winterFrost' },
            { name: "Treasure Hunter", description: "Every Gold is worth 2 times more value", cost: 4800, icon: 'treasureFinder' },
            { name: "Forbidden Excalibur", description: "Gain Double Damage and Health for the next 5 Bases", cost: 9999, icon: 'sword2' },
            { name: "Soul of the Phoenix", description: "Revive once", cost: 9999, icon: 'attackSpeed2' },
            { name: "Cosmic Scimitar", description: "Gain additional 12% damage and max health for every bases destroyed", cost: 9999, icon: 'sword2' },
        ];

        this.createItems(damageUpgrades, damageSectionX, sectionY + 60, sectionWidth);
        this.createItems(healthUpgrades, healthSectionX, sectionY + 60, sectionWidth);
        this.createItems(attackSpeedUpgrades, damageSectionX, attackSpeedSectionY + 100, sectionWidth);
        this.createItems(movementSpeedUpgrades, healthSectionX, attackSpeedSectionY + 100, sectionWidth);

        const fullWidth = modalWidth - 60;

        this.createItems(legendaryUpgrades, damageSectionX, legendarySectionY + 60, fullWidth);

        this.shopModalContainer.add([this.closeButtonText, this.goldTextShop]);
        this.scrollableContainer.add([this.damageSectionTitle, this.healthSectionTitle, this.attackSpeedSectionTitle, this.movementSpeedSectionTitle, this.legendaryUpgradesSectionTitle]);
        let lastPointerY = 0;
        let isScrolling = false;

        this.invisibleBackground.setInteractive().on('pointerdown', function (pointer) {
            isScrolling = true;
            lastPointerY = pointer.y;
        });

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
        const initialHandleY = 150;
        this.scrollbarHandle.y = initialHandleY;
        let isScrollbarHandleDragging = false;
        let initialPointerY = 0;

        this.scrollbarHandle.on('pointerdown', (pointer) => {
            isScrollbarHandleDragging = true;
            initialPointerY = pointer.y;
        });
        this.input.on('pointermove', (pointer) => {
            const handleRange = 550 - 150;
            const contentRange = -1900 - 0;
            const handleMinY = 150;
            const handleMaxY = 550;
            const contentMinY = -1900;
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

        // add mousewheel support
        this.input.on('wheel', (pointer, gameObjects, deltaX, deltaY, deltaZ) => {
            if (gameObjects.length > 0) {
                const handleRange = 550 - 150;
                const contentRange = -1900 - 0;
                const handleMinY = 150;
                const handleMaxY = 550;
                const contentMinY = -1900;
                const contentMaxY = 0;

                let newY = this.scrollableContainer.y + (-deltaY * 2);
                newY = Phaser.Math.Clamp(newY, contentMinY, contentMaxY);
                this.scrollableContainer.y = newY;

                const contentScrollRatio = (newY - contentMaxY) / (contentMinY - contentMaxY);
                const handleNewY = handleMinY + (contentScrollRatio * handleRange);
                this.scrollbarHandle.y = handleNewY;
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

            const icon = this.add.image(startX + 40, itemY + 40, upgrade.icon).setScale(upgrade.icon === 'cash' ? 0.75 : 0.5);

            const nameText = this.add.text(startX + 80, itemY + 10, upgrade.name, {
                font: '18px Orbitron',
                fill: '#00d4FF',
            });

            const descText = this.add.text(startX + 80, itemY + 40, upgrade.description, {
                font: '16px Orbitron',
                fill: '#FFFFFF',
                wordWrap: { width: itemWidth - 140 },
                wordWrapWidth: itemWidth - 140
            });

            const costText = this.add.text(startX + 60, itemY + itemHeight - 50, upgrade.cost, {
                font: '16px Orbitron',
                fill: '#FFD700'
            });

            const buyButton = upgrade.cost === 9999 ? this.add.text(startX + itemWidth - 100, itemY + itemHeight - 40, 'Not for sale', {
                font: '20px Orbitron',
                fill: '#FF0000'
            }).setOrigin(1, 0) : this.add.text(startX + itemWidth - 40, itemY + itemHeight - 50, 'BUY', {
                font: '20px Orbitron',
                fill: '#4CAF50'
            }).setInteractive({ useHandCursor: true }).setOrigin(1, 0)
                .on('pointerdown', () => this.purchaseUpgrade(upgrade.name, upgrade.cost, upgrade.icon));
            this.buyButtons.push({ button: buyButton, cost: upgrade.cost });

            this.scrollableContainer.add([itemBg, icon, nameText, descText, costText, buyButton]);

            if (upgrade.name === "Penknife") {
                this.penknifeBulkBuyButton = this.add.text(startX + itemWidth - 150, itemY + itemHeight - 50, 'BULK BUY', {
                    font: '20px Orbitron',
                    fill: '#0000ff'
                }).setInteractive({ useHandCursor: true }).setOrigin(1, 0)
                    .on('pointerdown', () => this.bulkPurchasePenknife(upgrade.cost));

                this.scrollableContainer.add(this.penknifeBulkBuyButton);
            }

            if (this.purchaseCounts.hasOwnProperty(upgrade.name)) {
                // Create purchase count text for special items
                const purchaseCountText = this.add.text(startX + itemWidth - 20, itemY + 10, `(${this.purchaseCounts[upgrade.name] || 0}/${this.itemPurchaseLimit})`, {
                    font: '16px Orbitron',
                    fill: '#FFD700'
                }).setOrigin(1, 0);

                this.scrollableContainer.add(purchaseCountText);

                this.buyButtons.push({
                    button: buyButton,
                    cost: upgrade.cost,
                    upgradeName: upgrade.name,
                    purchaseCountText: purchaseCountText
                });
            } else if (this.legendaryPurchaseCount.hasOwnProperty(upgrade.name)) {
                // Create purchase count text for special items
                const purchaseCountText = this.add.text(startX + itemWidth - 20, itemY + 10, `(${this.legendaryPurchaseCount[upgrade.name] || 0}/${this.legendaryPurchaseLimit})`, {
                    font: '16px Orbitron',
                    fill: '#FFD700'
                }).setOrigin(1, 0);

                this.scrollableContainer.add(purchaseCountText);

                this.buyButtons.push({
                    button: buyButton,
                    cost: upgrade.cost,
                    upgradeName: upgrade.name,
                    purchaseCountText: purchaseCountText
                });
            } 
            else { // non special items
                this.buyButtons.push({
                    button: buyButton,
                    cost: upgrade.cost,
                    upgradeName: upgrade.name,
                });
            }


        });
    }

    bulkPurchasePenknife(cost) {
        const maxPurchases = Math.floor(this.gold / cost);
        if (maxPurchases > 0) {
            this.gold -= maxPurchases * cost;
            this.updateGoldDisplay();
            this.scene.get('GameScene').player.damage += maxPurchases;
            this.showPurchaseFeedback(`Bought ${maxPurchases} Penknives! +${maxPurchases} Damage`, '#00ff00');
        }
    }


    toggleShopModal(visible) {
        if (visible === false) {
            this.buyButtons = [];
        }
        this.shopModalContainer.setVisible(visible); // include all children
    }

    purchaseUpgrade(upgradeName, cost, upgradeIcon) {
        // if player is dead, don't allow purchase
        if (this.scene.get('GameScene').player.currentHealth <= 0) {
            this.showPurchaseFeedback("You are dead! You cannot purchase upgrades", '#ff0000');
            return;
        }
        if (this.gold >= cost) {

            if (this.purchaseCounts.hasOwnProperty(upgradeName)) {
                if (this.purchaseCounts[upgradeName] < this.itemPurchaseLimit) {
                    this.purchaseCounts[upgradeName]++;
                    const item = this.buyButtons.find(item => item.upgradeName === upgradeName);
                    if (item && item.purchaseCountText) {
                        item.purchaseCountText.setText(`(${this.purchaseCounts[upgradeName]}/${this.itemPurchaseLimit})`);
                    }
                } else {
                    this.showPurchaseFeedback(`Limit reached for ${upgradeName}`, '#ff0000');
                    return;
                }
            }

            if (this.legendaryPurchaseCount.hasOwnProperty(upgradeName) && upgradeName !== "Cash") {
                if (this.legendaryPurchaseCount[upgradeName] < this.legendaryPurchaseLimit) {
                    this.legendaryPurchaseCount[upgradeName]++;
                    const item = this.buyButtons.find(item => item.upgradeName === upgradeName);
                    if (item && item.purchaseCountText) {
                        item.purchaseCountText.setText(`(${this.legendaryPurchaseCount[upgradeName]}/${this.legendaryPurchaseLimit})`);
                    }
                } else {
                    this.showPurchaseFeedback(`Limit reached for ${upgradeName}`, '#ff0000');
                    return;
                }
            }

            this.gold -= cost;
            console.log(`Purchased Upgrade: ${upgradeName}`);
            this.updateGoldDisplay();
            this.showPurchaseFeedback(`${upgradeName} Purchased! \n -${cost} Gold`, '#00ff00');
            if (upgradeName === "Penknife") {
                this.scene.get('GameScene').player.damage += 1;
            }
            if (upgradeName === "Hunter's Blade") {
                this.scene.get('GameScene').player.damage = Math.round(this.scene.get('GameScene').player.damage * 1.02);
            }
            if (upgradeName === "Heaven's Rain") {
                this.scene.get('GameScene').player.maxHealth = Math.round(this.scene.get('GameScene').player.maxHealth * 1.05);
            }
            if (upgradeName === "Health Potion") {
                const healPercentage = 0.5;
                let healAmount = Math.round(this.scene.get('GameScene').player.maxHealth * healPercentage);
                healAmount = Math.min(healAmount, this.scene.get('GameScene').player.maxHealth - this.scene.get('GameScene').player.currentHealth);
                this.scene.get('GameScene').player.currentHealth += healAmount;
                this.scene.get('GameScene').player.createHealingText(healAmount);
            }
            if (upgradeName === "Energy Gun") {
                this.scene.get('GameScene').player.attackSpeed = Math.round(this.scene.get('GameScene').player.attackSpeed * 1.06 * 100) / 100;
            }
            if (upgradeName === "Quickblade") {
                this.scene.get('GameScene').player.attackSpeed = Math.round(this.scene.get('GameScene').player.attackSpeed * 1.12 * 100) / 100;
            }
            if (upgradeName === "Lightning Core") {
                this.scene.get('GameScene').player.speed = Math.round(this.scene.get('GameScene').player.speed * 1.06);
            }
            if (upgradeName === "Mecha Sneakers") {
                this.scene.get('GameScene').player.speed = Math.round(this.scene.get('GameScene').player.speed * 1.12);
            }
            if (upgradeName === "Cash") {
                this.cash++;
                this.updateCashDisplay();
            }
            if (upgradeName === "Thunderlord Seal") {
                this.scene.get('GameScene').player.isImmuneToStorms = true;
            }
            if (upgradeName === "Elixir of Life") {
                this.scene.get('GameScene').player.healPercentage *= 3;
            }
            if (upgradeName === "Winter Frost") {
                this.scene.get('GameScene').enemies.forEach(enemy => {
                    enemy.isWinterFrosted = true;
                });
            }
            if (upgradeName === "Treasure Hunter") {
                this.scene.get('GameScene').enemies.forEach(enemy => {
                    enemy.goldValue *= 2;
                });
                this.scene.get('GameScene').base.goldValue *= 2;
            }
            if (upgradeName === "Thunderlord Seal" || upgradeName === "Elixir of Life" || upgradeName === "Winter Frost" || upgradeName === "Treasure Hunter" || upgradeName === "Forbidden Excalibur" || upgradeName === "Soul of the Phoenix" || upgradeName === "Cosmic Scimitar") {
                if (!this.legendaryIcons.some(icon => icon.name === upgradeName)) {
                    const iconX = this.playerSpeedBonusText.x - 180 + (this.legendaryIcons.length * 50);
                    const iconY = this.playerSpeedBonusText.y + 60;
                    const icon = this.add.image(iconX, iconY, upgradeIcon).setScale(0.5).setInteractive({ useHandCursor: true });
        
                    icon.on('pointerover', () => {
                        this.showUpgradeTooltip(upgradeName, iconX, iconY - 30);
                    }).on('pointerout', () => {
                        this.hideUpgradeTooltip();
                    });
        
                    // Save icon and its upgrade name for future reference
                    this.legendaryIcons.push({ name: upgradeName, icon: icon });
                }
            }

        } else {
            this.showPurchaseFeedback(`You need ${cost - this.gold} more gold`, '#ff0000');
        }
    }

    showUpgradeTooltip(upgradeName, x, y) {
        this.hideUpgradeTooltip(); // Hide existing tooltip if any
        this.upgradeTooltip = this.add.text(x, y, upgradeName, {
            font: '18px Orbitron',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: {
                left: 5,
                right: 5,
                top: 2,
                bottom: 2
            }
        }).setOrigin(0.5, 1).setDepth(20);
    }

    hideUpgradeTooltip() {
        if (this.upgradeTooltip) {
            this.upgradeTooltip.destroy();
            this.upgradeTooltip = null;
        }
    }

    showPurchaseFeedback(message, color = '#ffffff') {
        if (this.currentFeedbackText) {
            this.currentFeedbackText.destroy();
            this.currentFeedbackText = null;
        }
        this.currentFeedbackText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 375, message, {
            font: '22px Orbitron',
            fill: color,
            padding: {
                left: 10,
                right: 10,
                top: 5,
                bottom: 5
            }
        }).setOrigin(0.5).setScrollFactor(0).setDepth(20);

        this.tweens.add({
            targets: this.currentFeedbackText,
            alpha: { from: 1, to: 0 },
            ease: 'Linear',
            duration: 2000,
        });
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
        if (isStormLaunching) {
            const stormDamage = this.scene.get('GameScene').catastrophe.damage;
            this.approachingText.setText(`Storm launching!\nIncoming Damage: ${stormDamage}`);
        } else {
            this.approachingText.setText("Catastrophe approaches");
        }
    }

    updateScore(amount) {
        if (this.scene.get('GameScene').player.isDead) return;
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
        if (!this.timerStarted) return;
        this.updateMultiplierFill();
        this.displayPlayerStats(this.scale.width - 350, 500);
        if (this.strengthenedSquareText) {
            if (this.scene.get('GameScene').enemies.length > 0) {
                let currentStrengthLevel = this.scene.get('GameScene').enemies[0].strengthenLevel;
                if (this.strengthenedSquareText.text !== `${currentStrengthLevel}`) {
                    this.strengthenedSquareText.setText(`${currentStrengthLevel}`);
                }
            }
        }
        if (this.penknifeBulkBuyButton) {
            const canAffordBulkBuy = this.gold >= 55;
            this.penknifeBulkBuyButton.setText(canAffordBulkBuy ? 'BULK BUY' : '');
        }
        this.buyButtons.forEach((item) => {
            if (item.cost === 9999) return;
            if (this.purchaseCounts.hasOwnProperty(item.upgradeName) && this.purchaseCounts[item.upgradeName] >= this.itemPurchaseLimit) {
                item.button.setText('Limit reached').setStyle({ fill: '#FF0000' });
                return;
            }
            if (this.legendaryPurchaseCount.hasOwnProperty(item.upgradeName) && this.legendaryPurchaseCount[item.upgradeName] >= this.legendaryPurchaseLimit) {
                item.button.setText('Limit reached').setStyle({ fill: '#FF0000' });
                return;
            }
            if (this.gold >= item.cost) {
                item.button.setText('BUY').setStyle({ fill: '#4CAF50' });
            } else {
                item.button.setText('Not enough gold').setStyle({ fill: '#FF0000' });
            }
        });
    }

    updateMultiplierFill() {
        if (!this.timerStarted || this.isMultiplierPaused) return;
        if (this.multiplier === this.multiplierMin) {
            this.multiplierBarFill.width = 300; // Keep the bar full
            return; // Stop further processing
        }
        const currentTime = this.scene.get('GameScene').activeGameTime;
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
                this.multiplierText.setText(`Score Multiplier: x${this.multiplier}`);
                this.lastMultiplierUpdate = currentTime;
            }

            // If the multiplier is at its minimum, reset the fill width to full
            if (this.multiplier === this.multiplierMin) {
                this.multiplierBarFill.width = 300;
            }
        }
    }

    resetMultiplier() {
        this.multiplier = 5;
        this.multiplierText.setText(`Score Multiplier: x${this.multiplier}`);
        this.isMultiplierPaused = false;

        this.multiplierBarFill.width = 300;

        this.lastMultiplierUpdate = this.scene.get('GameScene').activeGameTime;
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

    createGameOverScreen() {
        this.inputBlocker = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.75)
            .setOrigin(0, 0)
            .setInteractive();

        this.gameOverContainer = this.add.container(0, 0);

        this.gameOverContainer.add(this.inputBlocker);

        let gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 200, 'GAME OVER', {
            font: '64px Orbitron',
            fill: '#FF6347', // tomato red
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        this.scene.get('GameScene').isGameOver = true;

        let retryButton = this.createStyledButton(this.scale.width / 2, this.scale.height / 2, 'Retry', '#ff0000', () => this.restartGameScene());

        let mainMenuButton = this.createStyledButton(this.scale.width / 2, this.scale.height / 2 + 100, 'Main Menu', '#007bff', () => this.exitToMainMenu());

        this.gameOverContainer.add([gameOverText, retryButton, mainMenuButton]);

        this.gameOverContainer.setDepth(100);

        if (!this.gameDataSaved) {
            this.saveGameData().then(() => {
                this.gameDataSaved = true; // Ensure we don't save again if the player exits to the main menu
            }).catch(error => console.error('Error saving game data:', error));
        }
    }

    createStyledButton(x, y, text, backgroundColor, callback) {
        let button = this.add.text(x, y, text, {
            font: '28px Orbitron',
            fill: '#ffffff',
            padding: { x: 20, y: 10 },
            backgroundColor: backgroundColor
        })
            .setOrigin(0.5)
            .setInteractive()
            .on('pointerdown', callback);

        button.setStroke('#000000', 4);
        button.setShadow(2, 2, 'rgba(0,0,0,0.5)', 2, true, true);

        return button;
    }

    restartGameScene() {
        this.resetState();
        let gameScene = this.scene.get('GameScene');
        gameScene.isGamePaused = false;
        gameScene.isGameOver = false;

        gameScene.scene.restart();
        gameScene.allowInput = false;
        this.gameDataSaved = false;
    }

    exitToMainMenu() {
        this.scene.get('GameScene').scene.stop();
        this.scene.stop();
        document.getElementById('battle-scene').style.display = 'none';
        document.querySelector('.new-highscore-icon').style.display = 'none';
        document.getElementById('main-menu').style.display = 'flex';
        if (!this.gameDataSaved) {
            this.saveGameData().then(() => {
                if (window.fetchHighestScore) {
                    window.fetchHighestScore();
                }
            }).catch(error => console.error('Error saving game data:', error));
        } else {
            if (window.fetchHighestScore) {
                window.fetchHighestScore();
            }
            this.gameDataSaved = false;
        }
    }

    pauseGame() {
        console.log('pausing game');
        this.createPauseScreen();
        this.scene.pause('GameScene');
        this.scene.get('GameScene').isGamePaused = true;
    }

    createPauseScreen() {
        this.inputBlocker = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x000000, 0.75)
            .setOrigin(0, 0)
            .setInteractive();

        this.pauseContainer = this.add.container(0, 0);
        this.pauseContainer.add(this.inputBlocker);

        let pauseText = this.add.text(this.scale.width / 2, this.scale.height / 2 - 200, 'Game Paused', {
            font: '64px Orbitron',
            fill: '#007bff',
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);

        let resumeButton = this.createStyledButton(this.scale.width / 2, this.scale.height / 2, 'Resume', '#4CAF50', () => this.resumeGame());
        let retryButton = this.createStyledButton(this.scale.width / 2, this.scale.height / 2 + 100, 'Retry', '#ff0000', () => this.restartGameScene());
        let mainMenuButton = this.createStyledButton(this.scale.width / 2, this.scale.height / 2 + 200, 'Main Menu', '#007bff', () => this.exitToMainMenu());
        this.pauseContainer.add([pauseText, resumeButton, retryButton, mainMenuButton]);
        this.pauseContainer.setDepth(100);
    }

    resumeGame() {
        this.pauseContainer.setVisible(false);
        this.scene.resume('GameScene');
        this.scene.get('GameScene').isGamePaused = false;
    }

    async saveGameData() { // got await, so i use async
        const gameData = {
            incomingCash: this.cash,
            score: this.score,
            latestBaseLevel: this.scene.get('GameScene').base.baseLevel
        };
        try {
            const response = await fetch('/save-game', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(gameData),
            });
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            return console.log('Success:', data);
        } catch (error) {
            return console.error('Error:', error);
        }
    }


}

export default BattleUI;

