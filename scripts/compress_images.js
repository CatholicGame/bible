import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const dir = path.join(process.cwd(), 'src', 'assets');

async function processDirectory(currentDir) {
  let count = 0;
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    
    if (entry.isDirectory()) {
      count += await processDirectory(fullPath);
    } else {
      const ext = path.extname(fullPath).toLowerCase();
      if (['.png', '.jpg', '.jpeg'].includes(ext)) {
        const newPath = fullPath.substring(0, fullPath.lastIndexOf('.')) + '.webp';
        try {
          console.log(`Processing: ${path.basename(fullPath)}`);
          await sharp(fullPath)
            .webp({ quality: 80, effort: 5 })
            .toFile(newPath);
            
          fs.unlinkSync(fullPath); // Delete old file
          count++;
        } catch (e) {
          console.error(`Error processing ${fullPath}:`, e);
        }
      }
    }
  }
  return count;
}

processDirectory(dir).then(count => {
  console.log(`\nSuccessfully converted and deleted ${count} files.`);
});
