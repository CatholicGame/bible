const fs = require('fs');
const cleanData = require('./src/data/crossword_puzzles.json');
const path = require('path');

const seedFiles = fs.readdirSync('./scripts').filter(f => f.startsWith('seeds_') && f.endsWith('.cjs'));

let totalUpdated = 0;

for (const file of seedFiles) {
    const fullPath = path.join('./scripts', file);
    
    // Read raw text to get comments
    const rawContent = fs.readFileSync(fullPath, 'utf8');
    const commentLines = rawContent.split('\n').filter(line => line.trim().startsWith('//')).join('\n');
    
    // Require the actual module and update it
    const seeds = require('./' + fullPath.replace(/\\/g, '/'));
    let modified = false;

    for (let seed of seeds) {
        const cleanPuzzle = cleanData.find(p => p.id === seed.id);
        if (cleanPuzzle) {
            for(let i = 0; i < seed.words.length; i++) {
                let cleanWord = cleanPuzzle.words.find(w => w.answer === seed.words[i].answer);
                if(cleanWord) {
                    if (seed.words[i].clue !== cleanWord.clue || seed.words[i].explanation !== cleanWord.explanation) {
                        seed.words[i].clue = cleanWord.clue;
                        seed.words[i].explanation = cleanWord.explanation;
                        modified = true;
                        totalUpdated++;
                    }
                }
            }
        }
    }

    if (modified) {
        // Construct the final JS content
        const jsExport = `module.exports = ${JSON.stringify(seeds, null, 2)};\n`;
        const output = (commentLines ? commentLines + '\n' : '') + jsExport;
        fs.writeFileSync(fullPath, output);
        console.log(`Updated ${file}`);
    }
}

console.log('Total words backported to seeds:', totalUpdated);
