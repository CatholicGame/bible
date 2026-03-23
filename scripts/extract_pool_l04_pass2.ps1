$dataDir = "e:\ManC\bible\src\data"

# 15 questions to move to pool (still too hard for L4)
$toRemove = @(
  'L04_073', # Magnificat trong Giờ Kinh Chiều (Vespers) - liturgical schedule detail
  'L04_075', # "Ite missa est" - Latin liturgy
  'L04_077', # Legion of Mary 1921 Ireland - too specific
  'L04_079', # Công chính hóa (Justification) - theological term  
  'L04_080', # Lạc giáo Nestoriô - heresy L6
  'L04_082', # "Nguồn mạch đỉnh cao" từ Sacrosanctum Concilium - Latin doc name
  'L04_083', # Phục Sinh vs làm sống lại khác gì - theological nuance
  'L04_084', # Ambrôsiô ảnh hưởng Augustinô - patristics detail
  'L04_085', # Đại Ly Giáo năm 1054 - year
  'L04_087', # Công đồng Trentô phản ứng với - council name + year
  'L04_096', # Via Dolorosa dẫn từ đâu đến đâu - too specific geography
  'L04_097', # 4 Thánh Sử biểu tượng (guide says L6)
  'L04_098', # Opus Dei chú trọng gì - specific movement  
  'L04_099', # Khó nghèo nghĩa thực tế - vow theology
  'L04_100'  # Taizé do Roger Schutz sáng lập - too specific
)

$suggestedLevel = @{
  'L04_073'=5; 'L04_075'=5; 'L04_077'=5; 'L04_079'=6; 'L04_080'=7;
  'L04_082'=6; 'L04_083'=5; 'L04_084'=5; 'L04_085'=5; 'L04_087'=5;
  'L04_096'=5; 'L04_097'=6; 'L04_098'=5; 'L04_099'=5; 'L04_100'=5
}

$all = Get-Content "$dataDir\level_04.json" -Encoding UTF8 | ConvertFrom-Json
$pool = Get-Content "$dataDir\higher_level_pool.json" -Encoding UTF8 | ConvertFrom-Json

$kept = @($all | Where-Object { $toRemove -notcontains $_.id })
$toPool = @($all | Where-Object { $toRemove -contains $_.id } | ForEach-Object {
  $q = $_ | Select-Object *
  $q | Add-Member -NotePropertyName 'original_level' -NotePropertyValue 4 -Force
  $q | Add-Member -NotePropertyName 'suggested_level' -NotePropertyValue $suggestedLevel[$_.id] -Force
  $q
})

$existingIds = @($pool | Select-Object -ExpandProperty id)
$newEntries = @($toPool | Where-Object { $existingIds -notcontains $_.id })
$finalPool = @($pool) + @($newEntries)

$kept | ConvertTo-Json -Depth 5 | Set-Content "$dataDir\level_04_pass2_filtered.json" -Encoding UTF8
$finalPool | ConvertTo-Json -Depth 5 | Set-Content "$dataDir\higher_level_pool.json" -Encoding UTF8

Write-Host "Kept: $($kept.Count) | Moved to pool: $($toPool.Count) | Pool total: $($finalPool.Count)"
