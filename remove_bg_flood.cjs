const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

async function processImage(inputPath, outputPath) {
    if (!fs.existsSync(inputPath)) {
        console.error(`Not found: ${inputPath}`);
        return;
    }
    const idx = await Jimp.read(inputPath);

    // We do a Flood-Fill from the corners to find connected background pixels
    // instead of a global color replacement, which destroys internal colors

    const w = idx.bitmap.width;
    const h = idx.bitmap.height;
    const visited = new Uint8Array(w * h);

    // Check if pixel is "white-ish background"
    function isBg(x, y) {
        if (x < 0 || x >= w || y < 0 || y >= h) return false;
        const offset = (y * w + x) * 4;
        const r = idx.bitmap.data[offset];
        const g = idx.bitmap.data[offset + 1];
        const b = idx.bitmap.data[offset + 2];
        const a = idx.bitmap.data[offset + 3];

        if (a === 0) return true; // already transparent
        // Consider pixels > 240 in all channels as background white
        return r > 240 && g > 240 && b > 240;
    }

    const queue = [];

    // Start flood fill from the 4 corners
    const margins = [
        [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1]
    ];

    for (const [cx, cy] of margins) {
        if (isBg(cx, cy)) {
            queue.push({ x: cx, y: cy });
            visited[cy * w + cx] = 1;
        }
    }

    // Flood fill algorithm
    while (queue.length > 0) {
        const p = queue.shift();
        const offset = (p.y * w + p.x) * 4;

        // Erase pixel
        idx.bitmap.data[offset + 3] = 0;

        // Check neighbors
        const neighbors = [
            { x: p.x + 1, y: p.y },
            { x: p.x - 1, y: p.y },
            { x: p.x, y: p.y + 1 },
            { x: p.x, y: p.y - 1 }
        ];

        for (const n of neighbors) {
            if (n.x >= 0 && n.x < w && n.y >= 0 && n.y < h) {
                const idx1D = n.y * w + n.x;
                if (!visited[idx1D] && isBg(n.x, n.y)) {
                    visited[idx1D] = 1;
                    queue.push(n);
                }
            }
        }
    }

    // Optional: Feather the edges slightly
    // (Skipped for pure pixel hard edges to be safe on gold)

    idx.autocrop();
    await idx.writeAsync(outputPath);
    console.log(`Successfully Flood-Filled & Processed: ${outputPath}`);
}

async function main() {
    const p = path.join(__dirname, 'src/assets/games/true_false.png');
    await processImage(p, p);
}
main();
