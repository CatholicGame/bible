import fs from 'fs';
import path from 'path';

const dirsToScan = [
  path.join(process.cwd(), 'src'),
  path.join(process.cwd(), 'index.html'),
  path.join(process.cwd(), 'app.html')
];

function processPath(targetPath) {
  let count = 0;
  if (!fs.existsSync(targetPath)) return 0;
  
  const stats = fs.statSync(targetPath);
  
  if (stats.isDirectory()) {
    const entries = fs.readdirSync(targetPath, { withFileTypes: true });
    for (const entry of entries) {
      count += processPath(path.join(targetPath, entry.name));
    }
  } else if (stats.isFile()) {
    const ext = path.extname(targetPath).toLowerCase();
    
    // Chỉ xử lý các file cấu trúc web
    if (!['.js', '.jsx', '.ts', '.tsx', '.css', '.html'].includes(ext)) return 0;
    
    let content = fs.readFileSync(targetPath, 'utf8');
    const originalContent = content;
    
    // Thay thế toàn bộ cụm .png, .jpg, .jpeg thành .webp
    content = content.replace(/\.png/gi, '.webp');
    content = content.replace(/\.jpg/gi, '.webp');
    content = content.replace(/\.jpeg/gi, '.webp');
    
    if (content !== originalContent) {
      fs.writeFileSync(targetPath, content, 'utf8');
      console.log(`Relinked file: ${path.basename(targetPath)}`);
      return 1;
    }
  }
  return count;
}

let totalFiles = 0;
for(const d of dirsToScan) {
  totalFiles += processPath(d);
}

console.log(`\nTotal source files relinked: ${totalFiles}`);
