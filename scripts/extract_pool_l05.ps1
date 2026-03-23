$dataDir = "e:\ManC\bible\src\data"

$toRemove = @(
  'L05_001', # 4 giao ước cụ thể trong Sáng Thế - L6
  'L05_004', # "Ga chương 15" - cần biết số chương - L6
  'L05_005', # "Ego eimi" / Tôi Hằng Hữu - học thuật L7
  'L05_006', # Phaolô trách Phêrô Gl 2:11 - L7
  'L05_007', # Công đồng Jerusalem Cv 15 - L6
  'L05_008', # Thư Philíppi "niềm vui" vì đang tù - L6
  'L05_012', # Giấc mơ pho tượng Nabucôđônôsor - L6
  'L05_015', # Septuagint LXX - L6
  'L05_022', # Giải vạ tuyệt thông người nguy tử - giáo luật L7
  'L05_023', # 21 Công đồng Chung - L6
  'L05_024', # Giáo Luật 1983 - L6
  'L05_027', # Charlemagne năm 800 - L6
  'L05_028', # GH Avignon 1309-1377 - L6
  'L05_029', # Đại Ly Giáo 3 GH - L6
  'L05_030', # Công đồng Constance - L6
  'L05_032', # Irênê Adversus Haereses - L7
  'L05_033', # Clêmentê thư Côrintô - L7
  'L05_044', # San Clemente 3 tầng - L7
  'L05_045', # Conclave Gregory X Lyon II - L7
  'L05_046', # Imprimatur Nihil Obstat - L7
  'L05_047', # Giờ Kinh nguồn gốc Do Thái - L6
  'L05_049', # Vatican II 16 văn kiện - L6
  'L05_064', # Tà Pao ở Bình Thuận - địa danh quá nhỏ L6
  'L05_065', # Trà Kiệu Văn Thân 1885 - L6
  'L05_066', # Dòng Đồng Công Cha Trần Đình Thủ - L6
  'L05_073', # Quy điển Hippo Carthage - L7
  'L05_074', # Sách Barúc nhóm Ngôn sứ - L6
  'L05_076', # Investiture - L7
  'L05_077', # Thỏa ước Worms - L7
  'L05_082', # ĐCV Penang - L7
  'L05_083', # Nhà thờ Chợ Quán - L6
  'L05_093'  # Phép lạ Lanciano thế kỷ 8 - L6
)

$suggestedLevel = @{
  'L05_001'=6; 'L05_004'=6; 'L05_005'=7; 'L05_006'=7; 'L05_007'=6;
  'L05_008'=6; 'L05_012'=6; 'L05_015'=6; 'L05_022'=7; 'L05_023'=6;
  'L05_024'=6; 'L05_027'=6; 'L05_028'=6; 'L05_029'=6; 'L05_030'=6;
  'L05_032'=7; 'L05_033'=7; 'L05_044'=7; 'L05_045'=7; 'L05_046'=7;
  'L05_047'=6; 'L05_049'=6; 'L05_064'=6; 'L05_065'=6; 'L05_066'=6;
  'L05_073'=7; 'L05_074'=6; 'L05_076'=7; 'L05_077'=7; 'L05_082'=7;
  'L05_083'=6; 'L05_093'=6
}

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

$kept | ConvertTo-Json -Depth 5 | Set-Content "$dataDir\level_05_filtered.json" -Encoding UTF8
$finalPool | ConvertTo-Json -Depth 5 | Set-Content "$dataDir\higher_level_pool.json" -Encoding UTF8

Write-Host "Kept: $($kept.Count) | Moved: $($toPool.Count) | Pool total: $($finalPool.Count)"
