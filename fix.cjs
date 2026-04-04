const fs = require('fs');
const file = 'e:/Projects/bible/src/components/games/crossword/CrosswordGame.jsx';
let code = fs.readFileSync(file, 'utf8');

const missingBlock = `  }, [puzzle.gridSize, isLandscape, gameState]);

  /* ── keep scroll helper in a ref so it can be called from anywhere ── */
  scrollToCellRef.current = (row, col) => {
    const container = gridContainerRef.current;
    if (!container) return;
    const cellX = col * (cellSize + 2);
    const cellY = row * (cellSize + 2);
    const containerW = container.clientWidth;
    const containerH = container.clientHeight;
    container.scrollTo({
      left: Math.max(0, cellX - containerW / 2 + cellSize / 2),
      top: Math.max(0, cellY - containerH / 2 + cellSize / 2),
      behavior: 'smooth',
    });
  };

  /* ═══════════════════════════════════════
     RENDER
     ═══════════════════════════════════════ */

`;

// 1. Restore missing block
code = code.replace(
  "return () => { clearTimeout(t); ro.disconnect(); window.removeEventListener('resize', measure); };\n  if (!puzzle) return null;",
  "return () => { clearTimeout(t); ro.disconnect(); window.removeEventListener('resize', measure); };\n" + missingBlock + "  if (!puzzle) return null;"
);

// 2. Fix syntax error 515
code = code.replace(
  "{canAffordRematch ? '⚔️ Chơi Tiếp' : `Cần ${20} <img src={iconCoin} alt='C' style={{ width:'1em', height:'1em', display:'inline-block', verticalAlign:'text-bottom', margin:'0 2px' }} /> để chơi tiếp`}",
  "{canAffordRematch ? '⚔️ Chơi Tiếp' : <>Cần 20 <img src={iconCoin} alt='C' style={{ width:'1em', height:'1em', display:'inline-block', verticalAlign:'text-bottom', margin:'0 2px' }} /> để chơi tiếp</>}"
);

code = code.replace(
  /\{canAffordRematch \? '.*?Chơi Tiếp' : .*?để chơi tiếp[`'"]?\}/,
  "{canAffordRematch ? '⚔️ Chơi Tiếp' : <>Cần 20 <img src={iconCoin} alt='C' style={{ width:'1em', height:'1em', display:'inline-block', verticalAlign:'text-bottom', margin:'0 2px' }} /> để chơi tiếp</>}"
);

// 3. Fix syntax error at 1583
code = code.replace(
  /\{ icon: '💡', text: 'Hint: 20-50 <img src=\{iconCoin\}.*?\} \/>' \},/,
  "{ icon: '💡', text: <>Hint: 20-50 <img src={iconCoin} alt='C' style={{ width:'1em', height:'1em', display:'inline-block', verticalAlign:'text-bottom', margin:'0 2px' }} /></> },"
);

// map(({ icon, text }) which throws key errors if not indexed
code = code.replace(
  /\.map\(\(\{ icon, text \}\) => \(/,
  ".map(({ icon, text }, i) => ("
);
code = code.replace(
  /<span key=\{text\}/g,
  "<span key={i}"
);

fs.writeFileSync(file, code);
console.log('Fixed errors!');
