$dataDir = "e:\ManC\bible\src\data"

# Questions to remove: off-topic (art, architecture, geography trivia) or obscure saints
$toRemove = @(
  'L05_018', # Edith Stein - triết gia Do Thái - quá học thuật, ít liên quan đức tin thực hành
  'L05_020', # Charles de Foucauld - nhân vật ít phổ thông
  'L05_021', # Decapolis - địa lý trivia
  'L05_022', # Caesarea Philippi - địa lý trivia (dù có kết nối, ít người biết)
  'L05_023', # Alexandria học thuật sơ khai - học thuật
  'L05_024', # Romanesque vs Gothic - kiến trúc nghệ thuật
  'L05_025', # Baroque - kiến trúc nghệ thuật
  'L05_026', # Giotto hội họa - nghệ thuật
  'L05_046', # Palestrina polyphony - âm nhạc học thuật
  'L05_060', # Khăn liệm Turin - di vật tranh cãi
  'L05_067', # Cristo Redentor - statue trivia
  'L05_068'  # Nhà thờ lớn nhất thế giới - trivia
)

$suggestedLevel = @{ 'L05_018'=6; 'L05_020'=6; 'L05_021'=6; 'L05_022'=6; 'L05_023'=6;
  'L05_024'=6; 'L05_025'=6; 'L05_026'=6; 'L05_046'=6; 'L05_060'=6;
  'L05_067'=6; 'L05_068'=6 }

$all = Get-Content "$dataDir\level_05.json" -Encoding UTF8 | ConvertFrom-Json
$pool = Get-Content "$dataDir\higher_level_pool.json" -Encoding UTF8 | ConvertFrom-Json

$kept = @($all | Where-Object { $toRemove -notcontains $_.id })
$toPool = @($all | Where-Object { $toRemove -contains $_.id } | ForEach-Object {
  $q = $_ | Select-Object *
  $q | Add-Member -NotePropertyName 'original_level' -NotePropertyValue 5 -Force
  $q | Add-Member -NotePropertyName 'suggested_level' -NotePropertyValue $suggestedLevel[$_.id] -Force
  $q
})

$existingIds = @($pool | Select-Object -ExpandProperty id)
$newEntries = @($toPool | Where-Object { $existingIds -notcontains $_.id })
$finalPool = @($pool) + @($newEntries)

$kept | ConvertTo-Json -Depth 5 | Set-Content "$dataDir\level_05_filtered2.json" -Encoding UTF8
$finalPool | ConvertTo-Json -Depth 5 | Set-Content "$dataDir\higher_level_pool.json" -Encoding UTF8

Write-Host "Kept: $($kept.Count) | Moved: $($toPool.Count) | Pool now: $($finalPool.Count)"
