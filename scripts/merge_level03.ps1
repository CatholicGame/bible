$dataDir = "e:\ManC\bible\src\data"

$filtered = Get-Content "$dataDir\level_03_filtered.json" -Encoding UTF8 | ConvertFrom-Json
$newQ = Get-Content "$dataDir\new_questions_l03.json" -Encoding UTF8 | ConvertFrom-Json

$merged = @($filtered) + @($newQ)

# Renumber IDs sequentially L03_001 to L03_100
$i = 1
foreach ($q in $merged) {
  $q.id = "L03_" + $i.ToString("000")
  $i++
}

$merged | ConvertTo-Json -Depth 5 | Set-Content "$dataDir\level_03.json" -Encoding UTF8

Write-Host "Done! level_03.json now has $($merged.Count) questions"
