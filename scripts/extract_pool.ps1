$dataDir = "e:\ManC\bible\src\data"
$ids = @(
  'L03_007','L03_009','L03_010','L03_012','L03_013',
  'L03_020','L03_025','L03_032','L03_036','L03_037',
  'L03_039','L03_040','L03_046','L03_047',
  'L03_064','L03_066','L03_068','L03_071',
  'L03_073','L03_074','L03_075','L03_099',
  'L03_003','L03_005','L03_006','L03_011','L03_014',
  'L03_015','L03_016','L03_041','L03_042','L03_043',
  'L03_044','L03_045','L03_063','L03_065','L03_067',
  'L03_091','L03_094','L03_096','L03_100'
)

$suggestedLevel = @{
  'L03_007'=10;'L03_009'=6;'L03_010'=6;'L03_012'=4;'L03_013'=4
  'L03_020'=6;'L03_025'=9;'L03_032'=6;'L03_036'=6;'L03_037'=6
  'L03_039'=7;'L03_040'=6;'L03_046'=5;'L03_047'=5
  'L03_064'=6;'L03_066'=6;'L03_068'=6;'L03_071'=6
  'L03_073'=5;'L03_074'=6;'L03_075'=5;'L03_099'=5
  'L03_003'=4;'L03_005'=4;'L03_006'=4;'L03_011'=4;'L03_014'=4
  'L03_015'=6;'L03_016'=4;'L03_041'=5;'L03_042'=4;'L03_043'=8
  'L03_044'=6;'L03_045'=5;'L03_063'=5;'L03_065'=4;'L03_067'=5
  'L03_091'=5;'L03_094'=5;'L03_096'=5;'L03_100'=4
}

$all = Get-Content "$dataDir\level_03.json" -Encoding UTF8 | ConvertFrom-Json

$kept = @($all | Where-Object { $ids -notcontains $_.id })
$pool = @($all | Where-Object { $ids -contains $_.id } | ForEach-Object {
  $q = $_ | Select-Object *
  $q | Add-Member -NotePropertyName 'original_level' -NotePropertyValue 3 -Force
  $q | Add-Member -NotePropertyName 'suggested_level' -NotePropertyValue $suggestedLevel[$_.id] -Force
  $q
})

$kept | ConvertTo-Json -Depth 5 | Set-Content "$dataDir\level_03_filtered.json" -Encoding UTF8
$pool | ConvertTo-Json -Depth 5 | Set-Content "$dataDir\higher_level_pool.json" -Encoding UTF8

Write-Host "Kept: $($kept.Count) | Pool: $($pool.Count)"
