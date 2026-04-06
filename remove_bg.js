const { removeBackground } = require('@imgly/background-removal-node');
const fs = require('fs');
const path = require('path');

const cwd = 'e:/Projects/bible/src/assets/rosary';
const images = ['rose_red.png', 'rose_pink.png', 'rose_gold.png'];

async function main() {
    for (const img of images) {
        const inputPath = path.join(cwd, img);
        const outputPath = path.join(cwd, img.replace('.png', '_nobg.png'));
        console.log(`Processing ${img}...`);
        try {
            const blob = await removeBackground(inputPath);
            const buffer = Buffer.from(await blob.arrayBuffer());
            fs.writeFileSync(outputPath, buffer);
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
