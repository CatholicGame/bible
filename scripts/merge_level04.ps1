$dataDir = "e:\ManC\bible\src\data"

$filtered = Get-Content "$dataDir\level_04_filtered.json" -Encoding UTF8 | ConvertFrom-Json
$newQ = Get-Content "$dataDir\new_questions_l04.json" -Encoding UTF8 | ConvertFrom-Json

$merged = @($filtered) + @($newQ)

$i = 1
foreach ($q in $merged) {
  $q.id = "L04_" + $i.ToString("000")
  $i++
}

$merged | ConvertTo-Json -Depth 5 | Set-Content "$dataDir\level_04.json" -Encoding UTF8

Write-Host "Done! level_04.json now has $($merged.Count) questions"

# Cleanup
Remove-Item "$dataDir\level_04_filtered.json" -ErrorAction SilentlyContinue
Remove-Item "$dataDir\new_questions_l04.json" -ErrorAction SilentlyContinue
Write-Host "Cleaned up temp files"
