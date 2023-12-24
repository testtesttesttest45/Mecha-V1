export function createGrid(width, height, textures, onProgress) {
    let isLoading = true;
    const overlay = document.getElementById('loading-overlay');
    overlay.style.display = 'block';
    let grid = new Array(height).fill(null).map(() => new Array(width).fill(0));
    const totalCells = width * height;
    let processedCells = 0;
    const rowsPerChunk = 10; // Adjust this number as necessary for performance

    function processChunk(startY) {
        let endY = Math.min(startY + rowsPerChunk, height);
        for (let y = startY; y < endY; y++) {
            for (let x = 0; x < width; x++) {
                let color = textures.getPixel(x, y, 'land');
                grid[y][x] = color.blue > 150 ? 1 : 0;
                if ((x === 32 && y === 113)) {
                    console.log(`Grid[${x},${y}]: ${grid[y][x]} (Color: ${color.blue}), Hex: ${rgbToHex(color.red, color.green, color.blue)}`);
                }
                processedCells++;
            }
        }

        const progress = (processedCells / totalCells) * 100;
        if (onProgress && typeof onProgress === 'function') {
            onProgress(progress);
        }

        if (endY < height) {
            // Move on to the next chunk
            setTimeout(() => processChunk(endY), 0);
        } else {
            console.log('Grid created');
            isLoading = false;
            overlay.style.display = 'none';
        }
    }

    processChunk(0);
    return grid;
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

export function resize(game) {
    const battleScene = document.getElementById('battle-scene');
    const gameWidth = game.config.width;
    const gameHeight = game.config.height;

    // Set the canvas dimensions to be exactly the same as the container dimensions
    game.canvas.style.width = battleScene.offsetWidth + 'px';
    game.canvas.style.height = battleScene.offsetHeight + 'px';

    // Remove the margin settings to ensure the canvas fully covers the container
    game.canvas.style.marginTop = '0px';
    game.canvas.style.marginLeft = '0px';
}