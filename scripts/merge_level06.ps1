$dataDir = "e:\ManC\bible\src\data"

$filtered = Get-Content "$dataDir\level_06_filtered.json" -Encoding UTF8 | ConvertFrom-Json
$newQ = Get-Content "$dataDir\new_questions_l06.json" -Encoding UTF8 | ConvertFrom-Json

$merged = @($filtered) + @($newQ)

$i = 1
foreach ($q in $merged) {
  $q.id = "L06_" + $i.ToString("000")
  $i++
}

$merged | ConvertTo-Json -Depth 5 | Set-Content "$dataDir\level_06.json" -Encoding UTF8

Remove-Item "$dataDir\level_06_filtered.json" -ErrorAction SilentlyContinue
Remove-Item "$dataDir\new_questions_l06.json" -ErrorAction SilentlyContinue

Write-Host "Done! level_06.json now has $($merged.Count) questions"
