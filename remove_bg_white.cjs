const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

async function processImage(inputPath, outputPath) {
    if (!fs.existsSync(inputPath)) {
        console.error(`Not found: ${inputPath}`);
        return;
    }
    const idx = await Jimp.read(inputPath);

    // Sample the top-left pixel to find the background color
    const bgR = idx.bitmap.data[0];
    const bgG = idx.bitmap.data[1];
    const bgB = idx.bitmap.data[2];

    // Check if background is light or dark
    const isDarkBg = (Math.max(bgR, bgG, bgB) < 50);
    const isLightBg = (Math.min(bgR, bgG, bgB) > 200);

    idx.scan(0, 0, idx.bitmap.width, idx.bitmap.height, function (x, y, offset) {
        let r = this.bitmap.data[offset + 0];
        let g = this.bitmap.data[offset + 1];
        let b = this.bitmap.data[offset + 2];

        let a = this.bitmap.data[offset + 3];

        if (isLightBg) {
            // White background: lower values mean more opacity (since it subtracts from white)
            // if pixel is very close to white, make transparent
            if (r > 235 && g > 235 && b > 235) {
                this.bitmap.data[offset + 3] = 0;
            } else {
                // Calculate pseudo-alpha based on darkness
                let darkness = 255 - Math.max(r, g, b);

                // Un-multiply from white (pseudo)
                let newA = Math.min(255, (darkness * 1.5));
                if (newA < 15) newA = 0;

                this.bitmap.data[offset + 3] = newA;
            }
        } else if (isDarkBg) {
            // Dark background (original logic)
            let maxC = Math.max(r, g, b);
            if (maxC <= 8) {
                this.bitmap.data[offset + 3] = 0;
            } else {
                this.bitmap.data[offset + 0] = Math.min(255, (r * 255) / maxC);
                this.bitmap.data[offset + 1] = Math.min(255, (g * 255) / maxC);
                this.bitmap.data[offset + 2] = Math.min(255, (b * 255) / maxC);
                let finalAlpha = Math.min(255, (maxC / 255) ** 0.85 * 255);
                this.bitmap.data[offset + 3] = finalAlpha;
            }
        }
    });

    idx.autocrop();
    await idx.writeAsync(outputPath);
    console.log(`Successfully processed: ${outputPath} (detected ${isLightBg ? 'light' : 'dark'} bg)`);
}

async function main() {
    // Only re-process true_false since we just want to fix the white one
    const p = path.join(__dirname, 'src/assets/games/true_false.png');
    await processImage(p, p);
}
main();
