function create() {
    const width = this.sys.game.config.width;
    const height = this.sys.game.config.height;

    const land = this.add.image(width / 2, height / 2, 'land').setInteractive();
    land.setDisplaySize(width, height);

    this.input.on('pointerdown', function (pointer) {
        const x = Math.round(pointer.x - land.x + land.width / 2);
        const y = Math.round(pointer.y - land.y + land.height / 2);

        // Constrain x and y to the dimensions of the texture
        const constrainedX = Math.max(0, Math.min(x, land.width - 1));
        const constrainedY = Math.max(0, Math.min(y, land.height - 1));

        const color = this.textures.getPixel(constrainedX, constrainedY, 'land');

        if (color.alpha !== 0) {
            const hexColor = rgbToHex(color.red, color.green, color.blue);
            console.log('Hex color:', hexColor);
        
            if (color.blue > 130) {
                alert("This area is ocean");
            } else {
                alert("This area is land");
            }
        } else {
            console.log('No color data available');
        }
    }, this);

}
export function rgbToHex(r, g, b) {
    r = r.toString(16);
    g = g.toString(16);
    b = b.toString(16);

    if (r.length == 1)
        r = "0" + r;
    if (g.length == 1)
        g = "0" + g;
    if (b.length == 1)
        b = "0" + b;

    return "#" + r + g + b;
}

