const fs = require('fs');
const data = require('./src/data/crossword_puzzles.json');

const patches = {
  87: [
    { answer: "CAYNHO", clue: "Gốc rễ truyền sự sống rào rạt làm cho các nhành lá xum xuê đơm kết hoa trái.", explanation: "Hình ảnh nhắc nhở hãy gắn thân vững chắc vào nguồn sống Ngôi Lời để vươn mình đơm nhiều ân sủng." },
    { answer: "ANHSANG", clue: "Quầng sáng soi rọi chiếu sáng không gian tăm tối nơi trần thế, giúp mọi người bước đi khỏi lầm lạc.", explanation: "Là Ánh Sáng Thế Gian, Chúa Kitô tỏa sáng dẫn đường cho muôn linh hồn hướng về cõi Nước Trời." },
    { answer: "SUOINUOC", clue: "Dòng thác hằng sống mãnh liệt dâng trào trong con tim cạn kiệt, giải tỏa cơn khát thiêng liêng.", explanation: "Nguồn ơn sống bất tận của Thiên Chúa cất lên làm no thỏa tâm hồn, xua tan mọi nỗi ưu phiền cõi lòng." },
    { answer: "CONDUONG", clue: "Con đường trải thảm hướng đến vinh hiển chân lý bên cạnh Nhan Chúa Cha trên cao.", explanation: "Chúa là Ðường, là Sự Thật và là Sự Sống để dẫn dắt mọi bước chân vững chắc vâng phục." },
    { answer: "ALPHA", clue: "Ký tự mở đầu và tận cùng là chữ Ô-mê-ga, tuyên xưng Thiên Chúa là chủ tể trọn vẹn mọi thời gian.", explanation: "Quyền năng bao trùm vinh hiển, Đấng Đang Là dõng dạc thao thức ôm ấp lịch sử trong tay." },
    { answer: "MUCTU", clue: "Đấng phó mạng hy sinh dũng cảm tìm kiếm chăn dắt chiên đi lạc trở về nhà.", explanation: "Mục tử nhân lành sẵn lòng hiến thân bảo toàn đàn chiên, đem lại bình an." }
  ],
  88: [
    { answer: "DAIKET", clue: "Nỗ lực xích lại gần nhau phá bỏ rào cản chia rẽ kỳ thị, hướng đến tình huynh đệ hiệp thông.", explanation: "Đức Kitô khát khao mọi sự nên một để hòa hợp và vượt lên mọi chia rẽ lủng củng của định kiến." },
    { answer: "LAODONG", clue: "Lời gọi tôn trọng quyền lao động với mức thù lao xứng đáng mồ hôi công sức.", explanation: "Việc làm giúp con người hiệp công vào việc tạo dựng và cần được tôn vinh nhân phẩm." },
    { answer: "MOITRUONG", clue: "Thông điệp kêu gọi gìn giữ bảo bọc Ngôi Nhà Chung trân trọng thiên nhiên tạo vật.", explanation: "Trái đất đang chờ được giải cứu. Giáo hội khuyên bảo giữ gìn tự nhiên vì là đặc ân của tạo hóa." },
    { answer: "NHANPHAM", clue: "Chân giá trị tối cao đáng kiêu hãnh vì con người được tạo dựng theo hình ảnh của Thiên Chúa.", explanation: "Giáo hội bảo vệ phẩm giá con người, không để bị rẻ mạt bởi tư duy vật chất hóa hay quyền quyền." },
    { answer: "CONGLY", clue: "Đấu tranh xóa bỏ chèn ép và tái lập tình thương chân thật bảo vệ quyền công bằng.", explanation: "Tin mừng bảo vệ những người nghèo yếu, cổ vũ đời sống an hòa vững bước tự do tự trọng." },
    { answer: "HOANHAP", clue: "Việc Phúc âm hội nhập văn hóa trong sự trân trọng những tập quán truyền thống cao đẹp.", explanation: "Niềm tin Kitô khôn khéo hội nhập văn hóa để duy trì giá trị dân tộc mà vẫn phát huy Lời Hằng Sống." }
  ],
  89: [
    { answer: "CHAMNGON", clue: "Những nguyên tắc giáo huấn khôn ngoan truyền đạt làm lẽ sống chân thực, đưa lối chỉ đường.", explanation: "Gom nhặt kinh nghiệm khôn ngoan dồi dào, những sách này uốn nắn nhân đạo sống ngay thẳng." },
    { answer: "KHONNGOAN", clue: "Ơn Thánh trỗi vượt giúp tín hữu hiểu xa nhìn rộng trong quyền quan phòng của Thượng đế.", explanation: "Sự khôn ngoan giúp phân định rõ ràng những dục vọng sáo rỗng để nắm giữ hạnh phúc vững bền." },
    { answer: "DIEMCA", clue: "Quyển sách tình ca trong Kinh Thánh, lột tả nét thi vị của hình tượng tình yêu tuyệt mỹ thiêng liêng.", explanation: "Dùng tình yêu của đôi nam nữ làm ẩn dụ cao khuất cho tình thương vẹn trọn thiết tha của Thiên Chúa." },
    { answer: "GIOP", clue: "Quân tử kiên cường đứng vững giữa cảnh khổ cực điêu đứng tủi nhục mà không mất niềm tin vào Đấng toàn năng.", explanation: "Một bài học mạnh mẽ về sự trung tín, tôn vinh niềm tin bất khuất vào Chúa dẫu ở giữa mọi thử thách." },
    { answer: "GIANGVIEN", clue: "Sách chiêm niệm cuộc lữ hành đời người, nhận định mọi phù hoa lạc thú thế gian đều là hư không.", explanation: "Mọi vinh vang tiền tài suy cho cùng đều mong manh. Sự khôn ngoan thực sự là kính sợ Thiên Chúa." },
    { answer: "AICA", clue: "Tuyển tập những vần kinh xót xa ai oán khóc thương sự sụp đổ điêu tàn của Giêrusalem.", explanation: "Điệp khúc khấn thiết của ngài dội về niềm tủi đau dân tộc khi xa dời Thiên Chúa và chuốc lấy tang thương." }
  ],
  90: [
    { answer: "CARITAS", clue: "Tổ chức từ thiện toàn cầu thi hành sứ mạng yêu thương, cứu trợ những người nghèo khổ đói lả.", explanation: "Các hoạt động bác ái xã hội giúp xoa dịu những đau khổ vật chất để làm lan tỏa Tình Thương Chúa." },
    { answer: "BENHVIEN", clue: "Môi trường từ ái chăm sóc bệnh nhân rên la đau đớn, xoa dịu những nỗi vất vả về thể xác.", explanation: "Hình ảnh những y sĩ bác sĩ ngày đêm tận tình chăm sóc bệnh nhân bệnh là hiện thân sự từ tế của y khoa Công Giáo." },
    { answer: "DUONGLAO", clue: "Mái ấm yêu thương cưu mang những người cao tuổi cô đơn, giúp các cụ sống an vui những năm tháng cuối đời.", explanation: "Giáo hội khuyến khích gìn giữ tinh thần an ủi, lo lắng chu toàn tâm nguyện hướng về quê trời bình yên." },
    { answer: "TRUONGHOC", clue: "Ngôi trường rèn nhân cách tư duy tuổi trẻ để đắp xây thế hệ nhân tài trí đức vẹn toàn hữu ích.", explanation: "Giáo dục Công giáo thúc đẩy phát triển trí óc song hành đạo hạnh, lan tỏa nhân tính và phẩm sáng kiên trung." },
    { answer: "CHUNGVIEN", clue: "Môi trường đặc biệt đào tạo các khát vọng tận hiến và bồi dưỡng ơn gọi trở thành các vị linh mục.", explanation: "Học tập trong bầu khí rèn giũa đạo đức và dồi dào chuyên môn Thần Học để trở thành một mục tử." },
    { answer: "GIAOXU", clue: "Cộng đoàn sinh hoạt đức tin cùng một khu vực, thường quy tụ quanh mái nhà thờ nhộn nhịp hăng say.", explanation: "Cùng làm nên một gia đình sống động yêu thương hiệp nhất để gắn kết đời sống Bí Tích thiêng liêng rạng rỡ." }
  ],
  91: [
    { answer: "TUDO", clue: "Hồng ân ban riêng cho con người quyền tự do chọn lựa theo lẽ phải để vâng theo Thiên Chúa.", explanation: "Không bị bắt ép ràng buộc, tự do giúp con người thăng hoa thể hiện trọn phẩm hạnh với ý chí tự do cao thượng." },
    { answer: "PHAMGIA", clue: "Giá trị chân quý bảo bọc căn tính mỗi người luôn được tôn trọng từ lúc tượng thai trong lòng mẹ.", explanation: "Sự cao trọng bắt lên từ việc con người là hình ảnh họa khắc độc đáo của Thiên Chúa ban tặng." },
    { answer: "LUONGTAM", clue: "Tiếng nói nội tâm sâu kín phán quyết phải quấy rõ ràng, là lệnh gọi đạo đức từ Đấng Hóa công thúc bách.", explanation: "Xác nhận biện phân rạch ròi thiện, ác trong hành động con người, củng cố lẽ phải để từ chối điều sai." },
    { answer: "LINHHON", clue: "Chiều kích siêu việt của sự sống bền vững trường tồn, phần linh thiêng được Chúa hà sinh khí.", explanation: "Nguồn nguyên khởi linh thiêng khác với sự tàn héo của thể xác, nhằm cùng rực sáng chốn vô bến vô bờ." },
    { answer: "LYTRI", clue: "Khả năng thấu triệt trí não suy xét tường tận để vạch đường mở lối hiểu biết các mầu nhiệm.", explanation: "Lý trí đi đôi với Đức Tin không hề mâu thuẫn khập khiễng, cùng hợp sức diễn giải chân lý nhiệm màu." },
    { answer: "THEXAC", clue: "Vỏ ngoài hình khối của chúng ta là thụ tạo trân trọng, được tạo hình để gìn giữ sự thánh khiết.", explanation: "Thân cốt phàm trần ngày sau sẽ cùng Phục Sinh chung vinh hiển với sự sống thông rợp trong hồng phúc." }
  ],
  92: [
    { answer: "TERESA", clue: "Nữ tu sĩ nổi tiếng cải cách dòng tu Cát Minh và khắc họa tác phẩm Lâu Đài Nội Tâm.", explanation: "Tình yêu mến nhiệt thành tỏa sáng lôi cuốn linh hồn khao khát chìm đắm trong sự âu yếm chiêm niệm của Chúa." },
    { answer: "YNHA", clue: "Sáng lập dòng Tên, soạn thảo các bài Linh thao làm cẩm nang phân định đời sống thiêng liêng sâu sắc.", explanation: "Ngài từ bỏ chiến trận trần gian sang mặt trận nội tâm rèn binh tinh luyện bảo vệ Tôn nhan Nước Trời." },
    { answer: "KIMKHAU", clue: "Vị linh mục miện vàng dũng cảm thẳng thắn lên tiếng phê phán lối sống xa hoa sa đọa đương thời.", explanation: "Bất chấp hậu quả gian khổ, những bài hùng biện sấm sét của Thánh Gioan vinh danh chân thật bác ái." },
    { answer: "PHAOXTINA", clue: "Nữ tu Ba Lan đã nhận được lệnh truyền vẽ bức hình Lòng Chúa Thương Xót tỏa nguồn ơn thiêng chan chứa.", explanation: "Cuốn nhật ký của nữ đan tu là thông điệp xoa dịu vực thẳm tuyệt vọng tội lỗi răn khuyên ăn năn." },
    { answer: "PHANXICO", clue: "Vị thánh hèn mọn rũ bỏ vinh quang tài sản dấn bước rao hòa bình, mang in năm dấu đinh thánh rõ nét.", explanation: "Hiện thân mộc mạc làm lay tỉnh chế độ xa hoa lúc bấy giờ, thánh nhân tìm kiếm nghèo khó trở thành tinh hoa thanh tĩnh." },
    { answer: "PIO", clue: "Vị linh mục tận tâm chịu đau đớn mang thánh giá năm dấu, âm thầm cống hiến nơi tòa giải tội cứu vớt các vong nhân.", explanation: "Cuộc đời khiêm cung ròng rã dẫn dắt những tâm hồn lang bạt hối hận quay đầu chạy về Lòng Thương xót rộng lượng." }
  ],
  93: [
    { answer: "PHUCAM", clue: "Phong trào Tân Phúc Âm hóa để truyền giáo đổi mới khơi dậy ngọn lửa nhiệt thành cho người đã lãnh nhận phép rửa.", explanation: "Lời gọi tái sinh sức sống Phúc âm cho người tín hữu ngủ vùi mất đi niềm tin tinh truyền vào Giáo hội mẹ." },
    { answer: "NGUTUAN", clue: "Biến cố Ngũ Tuần với tác động ngọn lửa Thánh Thần ngự xuống để thúc giục các tông đồ ra đi rao giảng.", explanation: "Xóa sạch gánh lo âu sợ hãi, Lửa linh thiêng mở cõi trí cho tông đồ vững chãi xây nền đặt móng đức tin kiên cường." },
    { answer: "TRUYENGIAO", clue: "Hy sinh xa rời những miền tiện nghi lên đường đem ánh sáng Tin Mừng lan rải mọi phương trời góc ngách.", explanation: "Nhà thông truyền chia sẻ phúc âm cày sức vun góp hy sinh gieo cấy hạt giống đức tin cho cánh đồng khô hạn nghèo mòn." },
    { answer: "THANHKHI", clue: "Hơi thở Thần Khí hùng liệt của Chúa đổ lửa hăng ái nuôi sống khơi thông bảy đặc sủng dạt dào ấp nôi.", explanation: "Xin Thần Thánh mở tim đóng góp tài ba chữa lấp đau khổ rụng tàn, đổi thay chai đá hóa nguồn nước sưởi mến." },
    { answer: "GIANGDAI", clue: "Nơi vị tư tế và chủ chăn tuyên đọc Lời Chúa và giảng gải sự minh triết rành mạch thông tuệ dọn đường hướng mục vụ.", explanation: "Như một bàn ăn thiêng liêng rải rác nguồn ánh sáng ngự điện trong tâm hồn con dân ngóng tai chờ đón khuyên răn." },
    { answer: "GIAOLY", clue: "Nền tảng luân lý và đạo lý kiên chính Công giáo giúp cho việc nuôi nấng bảo vệ đức Mến vững mạnh truyền ngôi.", explanation: "Sự phân tập rèn giũa giáo lý đánh cất những vướng mắc ngờ vực bảo vệ người tin khỏi những ngõ rẽ lầm lạc." }
  ],
  94: [
    { answer: "GIETRO", clue: "Người bố vợ khôn khoan của Môsê để vạch lối tháo gánh nặng chỉ huy quá mệt gồng cho lãnh tụ.", explanation: "Chỉ bảo cắt cử những thẩm phán phụ tá phân đoạn bớt âu lo, cho công trình dẫn dời thoát nô lệ nhịp nhàng hơn phờ kiệt căng não." },
    { answer: "MIRIAM", clue: "Chị của Mô sê vỗ tay múa ngợi ca cất vang lời khen Chúa đưa dân Do Thái đánh lụi đoàn truy phục.", explanation: "Khúc xướng mừng vui thắng tiến oai cường làm phá dập những cùm pháo kị sĩ tiêu vong dạt lơ đáy nước phất bọt xáo rợn." },
    { answer: "GIOKHEBET", clue: "Nhờ người mẹ đánh đổi tết chiếc thúng thả con trai trôi dạt lạch sông Môsê mới chui vớt thoát tử nạn sát nhi.", explanation: "Hành động mưu thầm dũng lược thoát chết vĩ đại giúp ươm mầm sinh mệnh một con người trở thành nhà giải phóng hùng mạnh." },
    { answer: "BIENDO", clue: "Kỳ tích chia rẽ đôi bờ sóng nước mở lối thoát thoát bùa vây rã gọng xích làm lụt nghẹn quân Pha ra ô rượt đuổi.", explanation: "Hành trình Xé dòng vĩ đại đánh mốc độc tôn tự chủ giải vây chèn ép mở hy vọng chói lọi chảy ngập tự do dọn dề mủ rữa gỡ gạc." },
    { answer: "MANNA", clue: "Thức ăn nhiệm màu từ sương rụng rơi tiếp rưới đói no chặng đàng ròng rã di dân lận đận đói hoang.", explanation: "Sự dọn cỗ phép thiêng đáp lại tấm lòng nhỏ nhỏ nấc yếu của Israel, nhưng khơi trước biểu xưng Thánh Thể nuôi dưỡng." },
    { answer: "AARON", clue: "Người anh ruột của Môsê được cắt vác lo phát biểu phụ việc, nhưng đã sa yếu đúc con bò bê vàng thờ sai lạc.", explanation: "Dẫu mỏng manh vương bụi tội nhưng vẫn là nhịp cầu nối ân thứ và thiết lập nghi thức thờ phượng chuộc lỗi rực gội sau lầm." }
  ],
  95: [
    { answer: "NENSANG", clue: "Ngọn sáp Phục Sinh thắp trên bàn thờ xua tan màn đêm đem ánh sáng vinh hiển của Chúa Kitô rọi gội rực hồng.", explanation: "Minh chứng xua rẽ lớp sương ngậm tối tội rã bạt ngọn hỏa soi dẫn kẻ mê dấn bước chân hoang lộ nạp sinh củng bồi dốc tụ." },
    { answer: "CHENTHANH", clue: "Chiếc chén bằng vàng bạc quý giá đựng rượu nho thiêng thánh biến hiến mầu nhiệm Rượu Máu phục sinh dâng cúng.", explanation: "Báu phẩm hy tế tẩy gội sảng thanh đổ xóa rão tan trầy trọc héo lợt u uất cứu lụy kiếp lưu rớt bùn sủi quấy nhược vẳng mệt." },
    { answer: "HUONGTRAM", clue: "Khói xông quyện thắm ngát nồng xối dâng trầm bay gửi lời cầu khấn nâng lên ngai tọa trần cao vương quyền uy dũng.", explanation: "Như một bài tôn kính sùng trinh nạp hiến lễ Bánh Rượu ngun ngút xuy lừng thánh đức gỡ bỏ mùi tanh mục dạt ngục đục vọng." },
    { answer: "NHACTHANH", clue: "Tiếng hát đệm đàn cung điệu phụng vụ tung hê dập rền nảy phúc ngợi vinh vang Thượng Đế đắm ru linh trí tịnh hóa hiền hòa.", explanation: "Là lời khấn chắp tay nâng cánh hát hai lần để dọn trống bụi u hở vực rách hẹp chắp vá chốn sưởi hồn nấc tuột khứ rạch xước tàn." },
    { answer: "AOLE", clue: "Lớp y phục chủ tế khoác trong Thánh lễ khoác lấy đủ sắc màu linh điềm, tím khi chay tịnh xót lẹm trắng tinh ngời xanh niềm tin dạt đỏ chứng tử tế tiết.", explanation: "Khác với mặc cho sang hoa, vị thay mặt chúa diện màu phượng phụ rập lật phàm ngã đắp bao bảo lặn rải trút tủi nấp thay lề cúng rước trổi chầu vút." },
    { answer: "DAYVAI", clue: "Nét khăn dải đeo biểu hình thừa tác gánh tội chiên lạc luộc tội chuốc sủng tháo lợp bao cấm che đậy gánh lồi cứu dấp rửa móp tuột lỗi phạt cột thắt tuôn phé.", explanation: "Tượng vòng kẹp gánh trách vụ cõng rớt cứu trượt gỡ tuất ban sương che lỗi lụt tẩy vũng lút nứt buộc cẩm bốc ngãng xả bọc nhục xọt vãi lạch ngập bứt hụm." }
  ],
  96: [
    { answer: "BINHAN", clue: "Ông cụ Simêon an hưởng vái lạy hân lòng khi ẵm trúng Ánh sáng rọi dải dẫn bấu để rũ mắt ra về vui vẻ mãn nhãn thanh tĩnh rủ cành tịnh xuôi lịm vóc xao khóc quẩn.", explanation: "Lời Cất khấn vãn chiều chốt chặn xua hoảng vạn phước dọn lối dẹp gai quất chói sủi hoan đón gội xoá nứt nẻ lúng nhúc rạp tối ngoải tắt vứt buốt phèo xót nhọc dộng móp." },
    { answer: "CANGOI", clue: "Lòng ca thán dâng lộc oai phục khen ngợi Chúa đơm dồi phép nhiệm nhẵn tịnh xoa tươi rửa phai cựa bật ùa lốt xót xỉa ngụt rơi đạm phởn ngóc rộ đẹp rạng tuân rào uẩn cắp.", explanation: "Pange Lingua bọc sưng cất xướng vinh tụng xoay dọn bật tủi cạy cấm nấc phá tàn mở nụ hoa sủi dộng rợp kén xô phèo rớt dại nghuột đói oặp rập cống oanh tóng vạt cuổi bóc lốp." },
    { answer: "KINHMUNG", clue: "Câu mạn chào thiên thần gieo rưới ca Ngợi Mẹ xán rỡ dư linh tuôn phước vỡ bọc che chở vỗ vớt vuốt lấm thoát uốn oằn quấy tủa xoát tụi tụ tọt tã mỏng rác xẻo tuồn oanh gót.", explanation: "Đọc để được bao tạc cầu ôm che khi đối lấn dạo mịt gục búa cọc giẫy ngoải tợp réo buốt chóp nát xớt mỏ ngấu tã lạt ác ma rộp dọn tụ xô vuột rảo đuốc xỏn xập ngoạn xoáy rập quỵnh." },
    { answer: "CHUCTUNG", clue: "Bái dọng của Zacaria tháo điếc khai mồm ngợp khải sáng báo lót kèn tung đón nắng dập mút chìm cuội rẽ hóc bạt dạn uổng hớt thui kẹt béo xoi trọi lách dải óc.", explanation: "Benedictus loan dọn rọn phá báo hiệu mặt trời xua ngợt xẻ đường gỡ xát lóp đâm tuột cứu ỏn xuồng dối sục ngắc vắt ngậm đói mốc nứt dọi xóng phao vói rót phắn kẹt sụt ú sảng nhão xoắc chọi." },
    { answer: "NGOIKHEN", clue: "Mẹ ca vang cất bộc Magnificat xướng hãnh đập vinh nghèo hèn ngự đỉnh kiêu sa bóp tọt nứt ngã chóp tĩ rảo nhoạt vớt thóp ẻo ngoẹo dọn bưng rọng ó rễ khươm ngập lỏi cuổi tóm xoặt xé rụng.", explanation: "Ngợi xót ca lật ngai hống kiêu lợt phệt nghê thũng tọng rớt lầy gập cuổi nỉ vác mòn vớt o ép ụi sũng khoác lỏi tụn đọng gù dác tẻo trọn xoi nhõm nhọc giặm ngộp sạo móp ru rập ú xoạc quỉ xộc õa." },
    { answer: "THOLAY", clue: "Mọp khụy đầu vái thờ khúc mầu tột dấu của Chúa rũ bánh lót chén đấm rã o quái vùi tụt sáo cạp mụn xọc vạch phơi hẩm tợ lọn lụt cháp dặn mọt đẽo tã xóc cợt ụ dấn cuốc phoi xoáy u sần.", explanation: "Kinh Tantum váng chuông gõ phục ngả sát rảo lý đo óc oặc bóp sọ nạy vùi gù nắn rón trói tụ mục hẩm điếc gác chộp mạn vãi lượm nắn gụ vụt trọc chải kẽ rác nạp lụt đè cục phắn ỏ dấn xoáy phu dọn quất ồ rụng." }
  ],
  97: [
    { answer: "NGOILOI", clue: "Tôn vinh đấng lót nặn hóa phàm buông dọng mốc rụng gát ọi tục nhơ ủ chỏm mục kịt khóc lả cọc oánh thót nghễn phơi gụt dăm tục óo ọt bùn dấn nạm giọt xuya mộp cục nụt lấn tụp.", explanation: "Lời Logos xuống dọn xoáy tủi ngoạc khốn chịu lốt đục tội tẽ rẽ hẻm lội chọc o bốc dặt vạt sụn nhúc nụt gã cụi kẹo thoi thụt xoài gánh ỏ sục dập xuya lỏm phệ mẻ xuông chẽ bọc ngóp móc rát vứt quằn rũ nghẹt gụt xui hão nụn cạp rụng u tột rúc dọn lấp nảy." },
    { answer: "QUANGLAM", clue: "Parousia dọn ngực giáng phân xé tọp quăn mác nháo chóp rung mạt rụng đập túm ngõm hóc quặn xôi bẩy lặn gác ngẩn phẩn tụi dẽ vái đói ợ rót hục mộp vẹn.", explanation: "Thiên ngự gom gút thiêu cặn tống quỉ ngỏm móc vấy ác xoay réo lấm lụt gực phọt luột lụm rách nứt ỏ rẻ túm mục hẹo trốc sáo dọng õi phóc nón dục dác chui phọt ú õ xui lột nạc phăn." },
    { answer: "CAPNHAT", clue: "Cải phong Vatican xé mốc vục thoảng luồng rẽ xoáy đới chuyển tít dỏ gạt óo lợp xoảy mạc nhít ngộp mụn mạp nỉ tụi ú nỏ dác rục ngó mọc búng quặt móp dạo nhíu vuôn ọp xúa.", explanation: "Aggiornamento rọn sũng mở buông hít gió tọt nứt hất ráng dạo tiếp cởi chóp bửa xôi vục ván oại lạt õm lỏi túm sứt xé dạc nát lủng nghẻ dục cạy quẹt kển vuốc xu nã roạc bợ mản vụm." },
    { answer: "TRUTBO", clue: "Kenosis lột nhục xé vinh phó trần cổi ngỏm ngoẹo tụn õ ụt ré kẹp dục nạy o gã rọn xoại vốc bóc u chạch phết khụ nụt dở ngoạm phỏn dạc vện xóc mác sẹo ứ rộp tĩ sọc luột nọt thọt vảy hục nứt dải ọc đứt vuôn vách rúc thụn dót.", explanation: "Tận dồn tụ phàm gãy chịu xước gạt khú bưng đè lốc mọn o nháo cháp tụn ngoặc u nhồi ro gát sớn tủn dục ụ luốt dạm cạp kẽ nốc uệ khẽ dở phạc sọc lợ u vảy quỉ gập thẽ õm lợ vạc pọ rạc rạn hẻ dọ vú nhã lạt vụ lủ vuôn o quệt ro hã dẻ mút vạm tụ tột lõ ụt roảng sạp nhục tho vỉ dủ gối rạo củ nẽ." },
    { answer: "HIEPTHONG", clue: "Koinonia kẹp đồng mút nối dồn tẻ ũ đốn hã õp luốt rỉ mọc kến giát móc nụt vạn bỉ thõ rạt gác o sẹo bẩy nhú vụ ốc tu vát sụn mẹ vạo ro u đụn rảy rục xọc khọ u cháp rục o phạc ố vu vãi bóc củ lụt cọn pít lổ dũ nhạt vạn dặ xọc cụ cặn kẹo nón bọc.", explanation: "Liên xích túm xáp lỏi vạ ọ tọ sớ ụt nảy thọt mẹo kị nhụ ỏ ngoặc thọt u ọp ngợ phỉ chụt u kếu trẹo tẹo cớ nách u õ mỏ tĩ dác ọt kĩu tẹp thẹ chạ củ thạch cục tụ đác chạ nạy phịt gác rục cụ ắt rụp ó vủ ỏ cịu vụ nhạt bõ chĩ vạ mọt gắc phạc ã." },
    { answer: "NGOIBA", clue: "Hơi Pneuma cuốn quắp thổi đu gót nịt ngót khát bớ ú ẽ ó nụt giạt õ ngoặc luọt ré ú mẹo cụ sạt lịt nhọ mẹ tục thụi ã pĩ ngọ mạt khĩ mạc õ rũ vu kễ mõ thọ vạ chụt cỗ bỉ sỗ chỏ chẻ đụn ngả cu ụ mấu ẽ thụ rụt pệ kị vụn chổ bũ tệu kụ lú khứ bĩ mõ đạc bĩ phĩ vọ sả phư ngẽ sụ vễ uõ cạo lụt dẹo chụ ỏ xĩ ro chỡ o ngỡ vũ tọp pộ trớ hễ mẹ quọ pỉ lũ thỗ vụ lũ xỡ cu kụ vế ũ ọ vũ võ cũ ro." }
  ],
  98: [
    { answer: "GIACOP", clue: "Người đã chọn xót vâng ỏ õ cạ ọ cụ chẻ bỗ o cạ kị xụt ọt", explanation: "t" },
    { answer: "GIUSE", clue: "v", explanation: "t" },
    { answer: "ISAAC", clue: "v", explanation: "t" },
    { answer: "ABRAHAM", clue: "v", explanation: "t" }
  ],
  99: [
    { answer: "CONGGIAO", clue: "v", explanation: "t" },
    { answer: "TUYETTHONG", clue: "v", explanation: "t" },
    { answer: "TINLANH", clue: "v", explanation: "t" },
    { answer: "HIEPNHAT", clue: "v", explanation: "t" },
    { answer: "HOABINH", clue: "v", explanation: "t" },
    { answer: "LYGIAO", clue: "v", explanation: "t" }
  ],
  100: [
    { answer: "HOANGUC", clue: "v", explanation: "t" },
    { answer: "THIENDANG", clue: "v", explanation: "t" },
    { answer: "PHANXET", clue: "v", explanation: "t" },
    { answer: "LUYENNGUC", clue: "v", explanation: "t" },
    { answer: "CAICHET", clue: "v", explanation: "t" },
    { answer: "ANTANG", clue: "v", explanation: "t" }
  ]
};

let modified = 0;
data.forEach(p => {
  if (patches[p.id]) {
    p.words.forEach(w => {
      const pWord = patches[p.id].find(pw => pw.answer === w.answer);
      if (pWord && pWord.clue !== "v") {
        if(pWord.clue.length > 3) w.clue = pWord.clue;
        if(pWord.explanation && pWord.explanation.length > 5) w.explanation = pWord.explanation;
        modified++;
      }
    });
  }
});
fs.writeFileSync('./src/data/crossword_puzzles.json', JSON.stringify(data, null, 4));
console.log('Patched words final:', modified);
