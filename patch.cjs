const fs = require('fs');
const file = 'e:/Projects/bible/src/components/games/crossword/CrosswordGame.jsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add avatarUrl & hintEffects state
code = code.replace(
  'const [confirmQuit, setConfirmQuit] = useState(false);',
  'const [confirmQuit, setConfirmQuit] = useState(false);\n  const [hintEffects, setHintEffects] = useState([]);'
);
code = code.replace(
  'giaoxu } = usePlayFabStore();',
  'giaoxu, avatarUrl } = usePlayFabStore();'
);

// 2. Replace Check Button with Profile in Header
const headerStr = `{/* Check button */}
        <motion.button whileTap={{ scale: 0.9 }} onClick={handleCheckAll}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-black text-xs text-white"
          style={{ background: 'linear-gradient(180deg, #10b981, #059669)', border: '1.5px solid #047857', boxShadow: '0 2px 0 #047857' }}>
          <Check size={13} /> Kiểm tra
        </motion.button>`;
const profileStr = `{/* User Profile (Avatar + XP + Coins) */}
        <div className="flex items-center gap-2 px-1 py-1 rounded-full bg-slate-900/10 border-[1.5px] border-slate-900/10 backdrop-blur-sm pr-3">
          {/* Avatar */}
          <div className="w-6 h-6 rounded-full overflow-hidden border border-white/40 shadow-sm shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-slate-300 flex items-center justify-center text-xs font-bold text-slate-500">
                {nickname?.[0]?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          
          {/* Value XP */}
          <div className="flex items-center gap-1">
            <Star size={11} className="text-amber-500" />
            <span className="font-black text-xs text-slate-700">{globalScore?.toLocaleString() || 0}</span>
          </div>

          <div className="w-px h-3 bg-slate-900/15 mx-0.5" />

          {/* Value Coin */}
          <div className="flex items-center gap-1">
            <img src={iconCoin} alt="C" className="w-3.5 h-3.5" />
            <span className="font-black text-xs text-slate-700">{userCoins?.toLocaleString() || 0}</span>
          </div>
        </div>`;
code = code.replace(headerStr, profileStr);

// 3. Add event to hint drops
code = code.replace(
  'const handleRevealLetter = useCallback(() => {',
  'const handleRevealLetter = useCallback((e) => {'
);
code = code.replace(
  'addCoins(-20); // deduct coins live',
  'addCoins(-20); // deduct coins live\n    if (e && e.clientX && e.clientY) { setHintEffects(prev => [...prev, { id: Date.now() + Math.random(), amt: 20, x: e.clientX, y: e.clientY }]); }'
);
code = code.replace(
  'const handleRevealWord = useCallback(() => {',
  'const handleRevealWord = useCallback((e) => {'
);
code = code.replace(
  'addCoins(-50); // deduct coins live',
  'addCoins(-50); // deduct coins live\n    if (e && e.clientX && e.clientY) { setHintEffects(prev => [...prev, { id: Date.now() + Math.random(), amt: 50, x: e.clientX, y: e.clientY }]); }'
);

// 4. Add the hitects renderer right before the final closing div!
const renderBlock = `{/* ── Coin Drop Animation ── */}
      <AnimatePresence>
        {hintEffects.map(p => createPortal(
          <motion.div
            key={p.id}
            initial={{ opacity: 1, y: p.y - 10, x: p.x - 20, scale: 0.5 }}
            animate={{ opacity: 0, y: p.y - 90, scale: 1.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            onAnimationComplete={() => setHintEffects(prev => prev.filter(e => e.id !== p.id))}
            className="fixed pointer-events-none z-[10000] flex items-center gap-1 font-black"
            style={{ color: '#ef4444', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}
          >
            -{p.amt}
            <img src={iconCoin} alt="C" className="w-5 h-5" />
          </motion.div>,
          document.body
        ))}
      </AnimatePresence>
    </div>
  );
};
export default CrosswordGame;`;
code = code.replace(
  '    </div>\n  );\n};\n\nexport default CrosswordGame;',
  renderBlock
);

// 5. Replace 💰 with safe elements
// JSX strings -> React nodes
code = code.replace(
  "{canAffordRematch ? '⚔️ Chơi Tiếp' : `Cần ${20} 💰 để chơi tiếp`}",
  "{canAffordRematch ? '⚔️ Chơi Tiếp' : <>Cần 20 <img src={iconCoin} alt='C' style={{ width:'1em', height:'1em', display:'inline-block', verticalAlign:'text-bottom', margin:'0 2px' }} /> để chơi tiếp</>}"
);
code = code.replace(
  "{ icon: '💡', text: 'Hint: 20-50 💰' },",
  "{ icon: '💡', text: <>Hint: 20-50 <img src={iconCoin} alt='C' style={{ width:'1em', height:'1em', display:'inline-block', verticalAlign:'text-bottom', margin:'0 2px' }} /></> },"
);
// General inner-JSX strings
code = code.replaceAll('💰', "<img src={iconCoin} alt='C' style={{ width:'1em', height:'1em', display:'inline-block', verticalAlign:'text-bottom', margin:'0 2px' }} />");
// Tidy up buttons precisely where we had the <img...>
code = code.replaceAll(
  ">20<img src={iconCoin} alt='C' style={{ width:'1em', height:'1em', display:'inline-block', verticalAlign:'text-bottom', margin:'0 2px' }} /></span>",
  "><div className=\"flex items-center gap-0.5 relative z-10 text-amber-300 text-[10px] font-bold ml-auto\">20<img src={iconCoin} alt=\"C\" className=\"w-3.5 h-3.5\" /></div></span>"
);
code = code.replaceAll(
  ">50<img src={iconCoin} alt='C' style={{ width:'1em', height:'1em', display:'inline-block', verticalAlign:'text-bottom', margin:'0 2px' }} /></span>",
  "><div className=\"flex items-center gap-0.5 relative z-10 text-white/80 text-[10px] font-bold ml-auto\">50<img src={iconCoin} alt=\"C\" className=\"w-3.5 h-3.5\" /></div></span>"
);

fs.writeFileSync(file, code);
console.log('Patch complete.');
