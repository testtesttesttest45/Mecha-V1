class Base {
    constructor(scene, player, camps) {
        this.scene = scene;
        this.player = player;
        this.camps = camps;
        this.sprite = null;
        this.safeDistanceFromPlayer = 300; // not too close to player
        this.minX = 1000; this.maxX = 3000;
        this.minY = 500; this.maxY = 1500;
    }

    create() {
        const baseLocation = this.findSuitableBaseLocation();
        this.sprite = this.scene.add.image(baseLocation.x, baseLocation.y, 'enemy_base');
        this.sprite.setOrigin(0.5, 0.5);
        this.sprite.setScale(2);
        this.setPointerEvents();
        this.setInteractive();
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
}



export default Base;