const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

async function processImage(inputPath, outputPath) {
    if (!fs.existsSync(inputPath)) {
        console.error(`Not found: ${inputPath}`);
        return;
    }
    const idx = await Jimp.read(inputPath);
    // Assuming black background, we extract color channels
    idx.scan(0, 0, idx.bitmap.width, idx.bitmap.height, function (x, y, offset) {
        let r = this.bitmap.data[offset + 0];
        let g = this.bitmap.data[offset + 1];
        let b = this.bitmap.data[offset + 2];

        let a = Math.max(r, g, b);

        // if pixel is very dark, deem it background
        if (a <= 8) {
            this.bitmap.data[offset + 3] = 0;
            this.bitmap.data[offset + 0] = 0;
            this.bitmap.data[offset + 1] = 0;
            this.bitmap.data[offset + 2] = 0;
        } else {
            // Un-multiply color by its own luminance map
            this.bitmap.data[offset + 0] = Math.min(255, (r * 255) / a);
            this.bitmap.data[offset + 1] = Math.min(255, (g * 255) / a);
            this.bitmap.data[offset + 2] = Math.min(255, (b * 255) / a);

            // Soften alpha edge to retain glow
            let finalAlpha = Math.min(255, (a / 255) ** 0.85 * 255);
            this.bitmap.data[offset + 3] = finalAlpha;
        }
    });

    // Auto-crop the transparent edges
    idx.autocrop();

    await idx.writeAsync(outputPath);
    console.log(`Successfully processed: ${outputPath}`);
}

async function main() {
    const assetsDir = path.join(__dirname, 'src/assets/games');
    const files = ['millionaire.png', 'quiz.png', 'sorting.png', 'true_false.png'];

    for (const file of files) {
        await processImage(path.join(assetsDir, file), path.join(assetsDir, file));
    }
}
main();
