/**
 * compress_images.cjs
 * Script nén ảnh hàng loạt dùng sharp.
 * - Scan toàn bộ src/assets/ (đệ quy)
 * - Nén PNG (pngquant-style qua sharp) và JPG/JPEG
 * - Xuất sang compressed_images/ (giữ cấu trúc thư mục, không ghi đè gốc)
 * - In báo cáo: kích thước trước/sau, % tiết kiệm
 *
 * Cách dùng: node compress_images.cjs
 * Tuỳ chọn:  node compress_images.cjs --quality 80 --overwrite
 */

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// ── Cấu hình mặc định ──────────────────────────────────────────────────────
const CONFIG = {
  // Thư mục nguồn chứa ảnh gốc
  inputDir: path.join(__dirname, 'src', 'assets'),
  // Thư mục đích (xuất ảnh đã nén)
  outputDir: path.join(__dirname, 'compressed_images'),
  // Chất lượng JPG (1-100)
  jpegQuality: 80,
  // Chất lượng PNG (1-100, thấp hơn = nén mạnh hơn)
  pngQuality: 80,
  // Level nén PNG (0-9)
  pngCompressionLevel: 9,
  // Chuyển PNG sang WebP thay vì giữ PNG (tiết kiệm hơn nhiều)
  convertPngToWebp: false,
  // Chất lượng WebP (1-100)
  webpQuality: 80,
  // Kích thước tối thiểu để nén (bytes) – bỏ qua ảnh < ngưỡng này
  minSizeToCompress: 50 * 1024, // 50 KB
  // Extensions được xử lý
  extensions: ['.png', '.jpg', '.jpeg', '.webp'],
};

// Đọc tham số dòng lệnh
const args = process.argv.slice(2);
const qualityArg = args.indexOf('--quality');
if (qualityArg !== -1 && args[qualityArg + 1]) {
  const q = parseInt(args[qualityArg + 1], 10);
  CONFIG.jpegQuality = q;
  CONFIG.pngQuality = q;
  CONFIG.webpQuality = q;
}
if (args.includes('--webp')) CONFIG.convertPngToWebp = true;

// ── Helpers ────────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getAllFiles(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (CONFIG.extensions.includes(ext)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// ── Nén một file ──────────────────────────────────────────────────────────
async function compressImage(inputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  const relativePath = path.relative(CONFIG.inputDir, inputPath);

  // Tính đường dẫn output
  let outputRelative = relativePath;
  if (CONFIG.convertPngToWebp && ext === '.png') {
    outputRelative = relativePath.replace(/\.png$/i, '.webp');
  }
  const outputPath = path.join(CONFIG.outputDir, outputRelative);

  ensureDir(path.dirname(outputPath));

  const inputSize = fs.statSync(inputPath).size;

  if (inputSize < CONFIG.minSizeToCompress) {
    // Copy nguyên nếu ảnh quá nhỏ
    fs.copyFileSync(inputPath, outputPath);
    return { file: relativePath, inputSize, outputSize: inputSize, skipped: true };
  }

  try {
    const image = sharp(inputPath);

    if (CONFIG.convertPngToWebp && ext === '.png') {
      await image.webp({ quality: CONFIG.webpQuality }).toFile(outputPath);
    } else if (ext === '.jpg' || ext === '.jpeg') {
      await image.jpeg({ quality: CONFIG.jpegQuality, mozjpeg: true }).toFile(outputPath);
    } else if (ext === '.png') {
      await image
        .png({
          quality: CONFIG.pngQuality,
          compressionLevel: CONFIG.pngCompressionLevel,
          adaptiveFiltering: true,
        })
        .toFile(outputPath);
    } else if (ext === '.webp') {
      await image.webp({ quality: CONFIG.webpQuality }).toFile(outputPath);
    }

    const outputSize = fs.statSync(outputPath).size;
    return { file: relativePath, inputSize, outputSize, skipped: false };
  } catch (err) {
    return { file: relativePath, inputSize, outputSize: 0, error: err.message, skipped: false };
  }
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🖼️  Image Compressor – bible project');
  console.log('═'.repeat(60));
  console.log(`📂 Input : ${CONFIG.inputDir}`);
  console.log(`📂 Output: ${CONFIG.outputDir}`);
  console.log(`🎯 JPEG quality : ${CONFIG.jpegQuality}`);
  console.log(`🎯 PNG  quality : ${CONFIG.pngQuality}  (compression level ${CONFIG.pngCompressionLevel})`);
  if (CONFIG.convertPngToWebp) console.log(`✨ PNG → WebP conversion: ON`);
  console.log('═'.repeat(60));

  const files = getAllFiles(CONFIG.inputDir);
  console.log(`\nTìm thấy ${files.length} ảnh cần xử lý...\n`);

  let totalInputSize = 0;
  let totalOutputSize = 0;
  let compressedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const file of files) {
    const result = await compressImage(file);

    totalInputSize += result.inputSize;
    totalOutputSize += result.outputSize || result.inputSize;

    if (result.error) {
      console.log(`  ❌ ${result.file}`);
      console.log(`     Error: ${result.error}`);
      errorCount++;
    } else if (result.skipped) {
      console.log(`  ⏩ ${result.file} (${formatBytes(result.inputSize)} – bỏ qua, quá nhỏ)`);
      skippedCount++;
    } else {
      const saved = result.inputSize - result.outputSize;
      const pct = ((saved / result.inputSize) * 100).toFixed(1);
      const emoji = saved > 0 ? '✅' : '⚠️ ';
      console.log(
        `  ${emoji} ${result.file}\n` +
        `      ${formatBytes(result.inputSize)} → ${formatBytes(result.outputSize)} (tiết kiệm ${pct}%)`
      );
      compressedCount++;
    }
  }

  // Báo cáo tổng kết
  const totalSaved = totalInputSize - totalOutputSize;
  const totalPct = ((totalSaved / totalInputSize) * 100).toFixed(1);

  console.log('\n' + '═'.repeat(60));
  console.log('📊 KẾT QUẢ');
  console.log('═'.repeat(60));
  console.log(`  Đã nén   : ${compressedCount} file`);
  console.log(`  Bỏ qua   : ${skippedCount} file (< ${formatBytes(CONFIG.minSizeToCompress)})`);
  console.log(`  Lỗi      : ${errorCount} file`);
  console.log(`  Tổng gốc : ${formatBytes(totalInputSize)}`);
  console.log(`  Tổng sau : ${formatBytes(totalOutputSize)}`);
  console.log(`  Tiết kiệm: ${formatBytes(totalSaved)} (${totalPct}%)`);
  console.log('═'.repeat(60));
  console.log(`\n✅ Ảnh đã nén được lưu tại: ${CONFIG.outputDir}\n`);
  console.log('💡 Tip: Thêm --webp để chuyển tất cả PNG sang WebP (nhỏ hơn nhiều)');
  console.log('💡 Tip: Thêm --quality 70 để nén mạnh hơn\n');
}

main().catch(console.error);
