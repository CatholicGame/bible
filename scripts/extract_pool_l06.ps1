$dataDir = "e:\ManC\bible\src\data"

$toRemove = @(
  'L06_024', # Mùa Vọng 4 tuần -> L3
  'L06_025', # Màu tím Mùa Vọng -> L2
  'L06_029', # Thứ Sáu không có Thánh Lễ -> L3
  'L06_055', # Trùng L06_032 (Helena tìm Thánh Giá)
  'L06_075', # Chuỗi 150/200 Kính Mừng -> câu mơ hồ
  'L06_076', # MMÁS do GPII -> đã có L05
  'L06_078', # Vô Nhiễm 1854 -> đã có L05
  'L06_079', # HX Lên Trời 1950 -> đã có L05
  'L06_080', # Cristo Redentor -> trivial địa lý
  'L06_086', # Matthia thay Giuđa -> đã có L05
  'L06_087', # Stêphanô tử đạo đầu -> đã có L05
  'L06_092', # Nhà thờ lớn nhất thế giới -> trivial
  'L06_098', # Năm Thánh 25 năm -> đã có L05
  'L06_099'  # Cửa Thánh -> đã có L05
)

$suggestedLevel = @{
  'L06_024'=4; 'L06_025'=3; 'L06_029'=4; 'L06_055'=6; 'L06_075'=6;
  'L06_076'=6; 'L06_078'=6; 'L06_079'=6; 'L06_080'=6;
  'L06_086'=6; 'L06_087'=6; 'L06_092'=6; 'L06_098'=6; 'L06_099'=6
}

$all = Get-Content "$dataDir\level_06.json" -Encoding UTF8 | ConvertFrom-Json
$pool = Get-Content "$dataDir\higher_level_pool.json" -Encoding UTF8 | ConvertFrom-Json

# Chỉ giữ câu không bị lọc
$kept = @($all | Where-Object { $toRemove -notcontains $_.id })

# Các câu bị lọc nhưng chưa có trong pool thì thêm vào
$existingIds = @($pool | Select-Object -ExpandProperty id)
$toPool = @($all | Where-Object { $toRemove -contains $_.id -and $existingIds -notcontains $_.id } | ForEach-Object {
  $q = $_ | Select-Object *
  $q | Add-Member -NotePropertyName 'original_level' -NotePropertyValue 6 -Force
  $sl = if ($suggestedLevel.ContainsKey($_.id)) { $suggestedLevel[$_.id] } else { 6 }
  $q | Add-Member -NotePropertyName 'suggested_level' -NotePropertyValue $sl -Force
  $q
})

$finalPool = @($pool) + @($toPool)
$finalPool | ConvertTo-Json -Depth 5 | Set-Content "$dataDir\higher_level_pool.json" -Encoding UTF8
$kept | ConvertTo-Json -Depth 5 | Set-Content "$dataDir\level_06_filtered.json" -Encoding UTF8

Write-Host "Kept: $($kept.Count) | Removed: $($toRemove.Count) | Pool: $($finalPool.Count)"
