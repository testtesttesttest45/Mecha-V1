class Camp {
    constructor(scene, x, y, radius = 150) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.sprite = null;
        this.campRadius = null;
    }

    create() {
        this.sprite = this.scene.add.image(this.x, this.y, 'enemy_camp');
        this.sprite.setOrigin(0.5, 0.5);
        this.campRadius = this.scene.add.circle(this.x, this.y, this.radius);
        this.campRadius.setStrokeStyle(4, 0xffff00, 0.5);
    }

    getRandomPositionInRadius() { // to place enemies in a random position within the camp radius
        let angle = Phaser.Math.FloatBetween(0, 2 * Math.PI);
        let distance = Phaser.Math.FloatBetween(0, this.radius - 35); // 35 to prevent enemies from spawning on the camp border
        return {
            x: this.x + distance * Math.cos(angle),
            y: this.y + distance * Math.sin(angle)
        };
    }
}


export default Camp;