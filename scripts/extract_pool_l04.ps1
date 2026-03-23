$dataDir = "e:\ManC\bible\src\data"

# IDs to move to pool
$groupA = @( # L6-7
  'L04_004','L04_005','L04_014','L04_017','L04_018','L04_020',
  'L04_032','L04_033','L04_034','L04_035','L04_036',
  'L04_039','L04_040','L04_041','L04_044','L04_047',
  'L04_056','L04_057','L04_058','L04_059',
  'L04_072','L04_075','L04_076','L04_077','L04_078','L04_079','L04_080',
  'L04_081','L04_082','L04_086','L04_087','L04_088',
  'L04_090','L04_091','L04_096','L04_097','L04_098'
)
$groupB = @( # L5
  'L04_011','L04_012','L04_013','L04_019','L04_060',
  'L04_099'
)

$suggestedLevel = @{
  'L04_004'=6;'L04_005'=6;'L04_014'=6;'L04_017'=6;'L04_018'=6;'L04_020'=6
  'L04_032'=7;'L04_033'=6;'L04_034'=6;'L04_035'=7;'L04_036'=6
  'L04_039'=6;'L04_040'=6;'L04_041'=6;'L04_044'=7;'L04_047'=6
  'L04_056'=6;'L04_057'=6;'L04_058'=6;'L04_059'=6
  'L04_072'=7;'L04_075'=6;'L04_076'=6;'L04_077'=6;'L04_078'=6;'L04_079'=6;'L04_080'=7
  'L04_081'=6;'L04_082'=6;'L04_086'=6;'L04_087'=6;'L04_088'=7
  'L04_090'=7;'L04_091'=7;'L04_096'=6;'L04_097'=6;'L04_098'=6
  'L04_011'=5;'L04_012'=5;'L04_013'=5;'L04_019'=5;'L04_060'=5;'L04_099'=5
}

$allToRemove = $groupA + $groupB

$all = Get-Content "$dataDir\level_04.json" -Encoding UTF8 | ConvertFrom-Json
$existingPool = Get-Content "$dataDir\higher_level_pool.json" -Encoding UTF8 | ConvertFrom-Json

$kept = @($all | Where-Object { $allToRemove -notcontains $_.id })
$toPool = @($all | Where-Object { $allToRemove -contains $_.id } | ForEach-Object {
  $q = $_ | Select-Object *
  $q | Add-Member -NotePropertyName 'original_level' -NotePropertyValue 4 -Force
  $q | Add-Member -NotePropertyName 'suggested_level' -NotePropertyValue $suggestedLevel[$_.id] -Force
  $q
})

$existingIds = @($existingPool | Select-Object -ExpandProperty id)
$newEntries = @($toPool | Where-Object { $existingIds -notcontains $_.id })
$finalPool = @($existingPool) + @($newEntries)

$kept | ConvertTo-Json -Depth 5 | Set-Content "$dataDir\level_04_filtered.json" -Encoding UTF8
$finalPool | ConvertTo-Json -Depth 5 | Set-Content "$dataDir\higher_level_pool.json" -Encoding UTF8

Write-Host "L04 kept: $($kept.Count) | Moved to pool: $($toPool.Count) | Pool total: $($finalPool.Count)"
