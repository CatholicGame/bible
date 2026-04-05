const fs = require('fs');
const path = require('path');

const dir = 'e:/Projects/bible/src/data';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));

const map = {
  // Places
  "Bethlehem": "Bê-lem",
  "Nazareth": "Na-da-rét",
  "Jerusalem": "Giê-ru-sa-lem",
  "Jericho": "Giê-ri-khô",
  "Damascus": "Đa-mát",
  "Đamát": "Đa-mát",
  "Capharnaum": "Ca-phác-na-um",
  "Caphácnaum": "Ca-phác-na-um",
  "Samaria": "Sa-ma-ri",
  "Galilê": "Ga-li-lê",
  "Giuđêa": "Giu-đê",
  "Giuđê": "Giu-đê",
  "Cana": "Ca-na",
  "Golgotha": "Gôn-gô-tha",
  "Ghếtsêmani": "Gết-sê-ma-ni",
  "Êmmau": "Em-mau",
  "Sinai": "Xi-nai",
  "Canaan": "Ca-na-an",
  "Jordan": "Gio-đan",
  "Giođan": "Gio-đan",
  "Ninivê": "Ni-ni-vê",
  "Roma": "Rô-ma",
  "Antiôkia": "An-ti-ô-khi-a",
  "Êphêsô": "Ê-phê-xô",
  
  // OT
  "Đavít": "Đa-vít",
  "Salômôn": "Sa-lô-môn",
  "Môsê": "Mô-sê",
  "Êlia": "Ê-li-a",
  "Êlisêô": "Ê-li-sê-ô",
  "Ábraham": "Áp-ra-ham",
  "Samuel": "Sa-mu-en",
  "Giôna": "Giô-na",
  "Isaia": "I-sai-a",
  "Giêrêmia": "Giê-rê-mi-a",
  "Batseba": "Bát-sê-ba",
  "Nôê": "Nô-ê",
  "Israel": "Ít-ra-en",
  
  // NT
  "Pilate": "Phi-la-tô",
  "Philatô": "Phi-la-tô",
  "Stephen": "Tê-pha-nô",
  "Têphanô": "Tê-pha-nô",
  "Máccô": "Mác-cô",
  "Mátthêu": "Mát-thêu",
  "Lazarô": "La-da-rô",
  "Giakêu": "Gia-kêu",
  "Mankhô": "Man-khô",
  "Saul": "Sao-lô",
  "Saolô": "Sao-lô",
  "Phaolô": "Phao-lô",
  "Phêrô": "Phê-rô",
  "Tôma": "Tô-ma",
  "Mácta": "Mác-ta",
  "Simêon": "Si-mê-ôn",
  "Nicôđêmô": "Ni-cô-đê-mô",
  "Giuđa Ítcariốt": "Giu-đa Ít-ca-ri-ốt",
  "Giuđa": "Giu-đa",
  "Barnabê": "Ba-na-ba",
  "Timôthêô": "Ti-mô-thê",
  "Pharisêu": "Pha-ri-sêu",
  "Mêsia": "Mê-si-a",
  "Giêsu": "Giê-su",
  "Maria": "Ma-ri-a",
  "Giuse": "Giu-se",
  "Gioan": "Gio-an",
  "Luca": "Lu-ca",
  "Êlisabét": "Ê-li-sa-bét",
  
  // Saints
  "Phanxicô": "Phan-xi-cô",
  "Đaminh": "Đa-minh",
  "Monica": "Mô-ni-ca",
  "Bênêđictô": "Biển Đức",
  "Augustinô": "Âu-tinh",
  "Inhaxiô": "I-nhã",
  "Têrêsa": "Tê-rê-xa",
  "Máctinô": "Mác-ti-nô"
};

const keys = Object.keys(map).sort((a,b) => b.length - a.length);

let totalChangedFiles = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  for (const key of keys) {
    const value = map[key];
    const regex = new RegExp(key, 'g');
    content = content.replace(regex, value);
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalChangedFiles++;
    console.log('Updated: ' + file);
  }
}
console.log('Total files changed: ' + totalChangedFiles);
