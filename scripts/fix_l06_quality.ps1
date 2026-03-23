$dataDir = "e:\ManC\bible\src\data"
$all = Get-Content "$dataDir\level_06.json" -Encoding UTF8 | ConvertFrom-Json

# Thay câu số liệu vô nghĩa bằng câu ý nghĩa hơn

# L06_044: Camino km → Camino là gì / ý nghĩa
foreach ($q in $all) {
  if ($q.question -match "Camino de Santiago d.*i kho") {
    $q.question = "Đường hành hương Camino de Santiago nổi tiếng xuyên suốt lịch sử vì lý do gì?"
    $q.opt_a = "Đường ngắn nhất châu Âu"
    $q.opt_b = "Hành trình đức tin đến mộ Thánh Giacôbê, hàng triệu người đi bộ hành hương mỗi năm"
    $q.opt_c = "Con đường thương mại cổ đại"
    $q.opt_d = "Đường chinh phạt của Napoleon"
    $q.correct_ans = 1
    $q.explanation = "Camino de Santiago là **hành trình đức tin** đến mộ Thánh Giacôbê ở Tây Ban Nha. Hàng triệu người đi bộ mỗi năm — vừa hành hương, vừa suy tư thiêng liêng."
    Write-Host "Fixed: Camino Santiago"
  }

  # L06_072: Đaminh Savio mấy tuổi → ngài đặc biệt vì điều gì
  if ($q.question -match "Đaminh Savio.*qua đời lúc bao nhiêu") {
    $q.question = "Thánh Đaminh Savio đặc biệt vì điều gì trong lịch sử các thánh?"
    $q.opt_a = "Vị thánh đầu tiên ở châu Á"
    $q.opt_b = "Học sinh của Don Bosco, sống thánh thiện ngay từ nhỏ — một trong những thánh trẻ nhất được GH công nhận"
    $q.opt_c = "Vị thánh duy nhất không qua đời vì bệnh"
    $q.opt_d = "Người sáng lập Dòng tu thiếu nhi"
    $q.correct_ans = 1
    $q.explanation = "Đaminh Savio: học sinh của **Don Bosco**, sống đời thánh thiện bình thường — qua đời năm 14 tuổi (1857) nhưng được phong thánh vì **đức tin phi thường** của một học sinh bình thường."
    Write-Host "Fixed: Đaminh Savio"
  }

  # L06_068: 37 Tiến sĩ HT → Tiến sĩ HT là danh hiệu gì
  if ($q.question -match "bao nhiêu Tiến s") {
    $q.question = "Danh hiệu 'Tiến sĩ Hội Thánh' (Doctor of the Church) do Giáo hội trao cho ai?"
    $q.opt_a = "Mọi giám mục khi qua đời"
    $q.opt_b = "Người có học thuyết xuất sắc, rao giảng đức tin đặc biệt, và được phong thánh"
    $q.opt_c = "Người có bằng tiến sĩ thần học"
    $q.opt_d = "Vị Giáo Hoàng đặc biệt"
    $q.correct_ans = 1
    $q.explanation = "**Tiến sĩ Hội Thánh** là danh hiệu GH trao cho những thánh nhân có **học thuyết đức tin xuất sắc**. Ví dụ: Augustinô, Tôma Aquinô, Têrêsa Lisieux, Hildegard Bingen."
    Write-Host "Fixed: Tiến sĩ HT"
  }

  # L06_034: Jeanne d'Arc 19 tuổi → Tại sao bị xử tử / ý nghĩa
  if ($q.question -match "Jeanne.*bị thiêu sống năm bao nhiêu tuổi") {
    $q.question = "Thánh Jeanne d'Arc bị xử tử vì tội gì, và phán quyết đó sau này ra sao?"
    $q.opt_a = "Phản quốc — chưa được xét lại"
    $q.opt_b = "Lạc giáo — nhưng sau đó được GH tuyên bố vô tội và phong thánh"
    $q.opt_c = "Giết người — được ân xá"
    $q.opt_d = "Phù thủy — vẫn còn tranh cãi"
    $q.correct_ans = 1
    $q.explanation = "Jeanne d'Arc bị kết tội **lạc giáo** (1431) và thiêu sống lúc 19 tuổi. Năm 1456, GH **tuyên bố vô tội**. Năm 1920, được **phong thánh** — minh chứng đức tin trước bất công."
    Write-Host "Fixed: Jeanne d'Arc"
  }
}

$all | ConvertTo-Json -Depth 5 | Set-Content "$dataDir\level_06.json" -Encoding UTF8
Write-Host "Done! level_06.json updated"
