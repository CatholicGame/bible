const { removeBackground } = require('@imgly/background-removal-node');
const fs = require('fs');
const path = require('path');

const cwd = 'e:/Projects/bible/src/assets/rosary';
const images = ['rose_red.png', 'rose_pink.png', 'rose_gold.png'];

async function main() {
    for (const img of images) {
        const inputPath = path.join(cwd, img);
        console.log(`Processing ${img}...`);
        try {
            const bufferInput = fs.readFileSync(inputPath);
            const blobInput = new Blob([bufferInput], { type: 'image/png' });
            const blobOutput = await removeBackground(blobInput);
            const bufferOutput = Buffer.from(await blobOutput.arrayBuffer());
            const outputPath = path.join(cwd, img.replace('.png', '_nobg.png'));
            fs.writeFileSync(outputPath, bufferOutput);
            console.log(`Saved ${outputPath}`);
            
            // replace original
            fs.copyFileSync(outputPath, inputPath);
            console.log(`Overwrote original ${img}`);
        } catch (e) {
            console.error(`Error processing ${img}:`, e);
        }
    }
}

main();
