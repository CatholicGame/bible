/**
 * Unified builder — merges all seed batches and generates crossword_puzzles.json
 * Run: node scripts/build_all_puzzles.cjs
 */
const fs = require('fs'), path = require('path');

function buildCrossword(wordList) {
  const sorted = [...wordList].sort((a,b) => b.answer.length - a.answer.length);
  const placed = [], grid = {};
  const get = (r,c) => grid[`${r},${c}`]||null;
  const set = (r,c,ch) => { grid[`${r},${c}`]=ch; };
  function canPlace(ans,dir,row,col){
    const len=ans.length;
    const br=dir==='down'?row-1:row, bc=dir==='across'?col-1:col;
    const ar=dir==='down'?row+len:row, ac=dir==='across'?col+len:col;
    if(get(br,bc)||get(ar,ac)) return false;
    let hit=false;
    for(let i=0;i<len;i++){
      const r=dir==='down'?row+i:row, c=dir==='across'?col+i:col;
      if(r<-6||c<-6||r>18||c>18) return false;
      const ex=get(r,c);
      if(ex){if(ex!==ans[i]) return false; hit=true;}
      else{
        if(dir==='across'&&(get(r-1,c)||get(r+1,c))) return false;
        if(dir==='down'&&(get(r,c-1)||get(r,c+1))) return false;
      }
    }
    return placed.length===0||hit;
  }
  function doPlace(ans,dir,row,col){
    for(let i=0;i<ans.length;i++){
      const r=dir==='down'?row+i:row, c=dir==='across'?col+i:col;
      set(r,c,ans[i]);
    }
  }
  const first=sorted[0];
  doPlace(first.answer,'across',0,0);
  placed.push({...first,direction:'across',row:0,col:0});
  for(let wi=1;wi<sorted.length;wi++){
    const word=sorted[wi]; let ok=false;
    outer: for(const pw of placed){
      const nd=pw.direction==='across'?'down':'across';
      for(let i=0;i<word.answer.length;i++){
        for(let j=0;j<pw.answer.length;j++){
          if(word.answer[i]!==pw.answer[j]) continue;
          const nr=nd==='down'?pw.row-i:pw.row+j;
          const nc=nd==='across'?pw.col-i:pw.col+j;
          if(canPlace(word.answer,nd,nr,nc)){
            doPlace(word.answer,nd,nr,nc);
            placed.push({...word,direction:nd,row:nr,col:nc});
            ok=true; break outer;
          }
        }
      }
    }
    if(!ok) console.warn(`  ⚠ skip: ${word.answer}`);
  }
  if(!placed.length) return null;
  const allR=[],allC=[];
  placed.forEach(w=>{
    allR.push(w.row); allC.push(w.col);
    if(w.direction==='down') allR.push(w.row+w.answer.length-1);
    else allC.push(w.col+w.answer.length-1);
  });
  const minR=Math.min(...allR),minC=Math.min(...allC);
  const maxR=Math.max(...allR),maxC=Math.max(...allC);
  const norm=placed.map(w=>({...w,row:w.row-minR,col:w.col-minC}));
  norm.sort((a,b)=>a.row!==b.row?a.row-b.row:a.col-b.col);
  norm.forEach((w,i)=>{w.num=i+1;w.id=`${i+1}-${w.direction}`;});
  return {gridSize:{rows:maxR-minR+1,cols:maxC-minC+1},words:norm};
}

// Load seed files in order
const batches = [
  './seeds_A_1_10.cjs',
  './seeds_B_11_15.cjs',
  './seeds_C_16_20.cjs',
  './seeds_D_21_25.cjs',
  './seeds_E_26_30.cjs',
  './seeds_F_31_35.cjs',
  './seeds_G_36_40.cjs',
  './seeds_H_41_45.cjs',
  './seeds_I_46_50.cjs',
  './seeds_J_51_55.cjs',
  './seeds_K_56_60.cjs',
  './seeds_L_61_65.cjs',
  './seeds_M_66_70.cjs',
  './seeds_N_71_75.cjs',
  './seeds_O_76_80.cjs',
  './seeds_P_81_90.cjs',
  './seeds_Q_91_100.cjs',
];
// Add any future batches here

const SEEDS = batches.flatMap(f => {
  try { return require(f); }
  catch(e) { console.warn(`Could not load ${f}: ${e.message}`); return []; }
});

const results = [];
SEEDS.forEach(seed => {
  process.stdout.write(`#${seed.id} ${seed.theme}... `);
  const layout = buildCrossword(seed.words);
  if(layout){
    results.push({id:seed.id, theme:seed.theme, title:seed.theme.replace(/_/g,' '), ...layout});
    console.log(`✓ ${layout.words.length} words, ${layout.gridSize.rows}x${layout.gridSize.cols}`);
  } else {
    console.log('✗ failed');
  }
});

const out = path.resolve(__dirname,'../src/data/crossword_puzzles.json');
fs.writeFileSync(out, JSON.stringify(results,null,2), 'utf8');
console.log(`\n${results.length} puzzles saved to ${out}`);
