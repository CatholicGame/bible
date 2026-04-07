const fs = require('fs');
const data = require('./src/data/crossword_puzzles.json');

const patches = {
  76: [ // Giáo Hội Việt Nam
    { answer: "TUDAO", clue: "Hàng trăm ngàn người Việt đã kiên trung giữ vững đức tin, trong đó có 117 vị được tôn phong Hiển Thánh.", explanation: "Các Thánh Tử Đạo Việt Nam đã hy sinh mạng sống để làm hạt giống gieo mầm Đức Tin trên đất nước." },
    { answer: "DACLO", clue: "Vị linh mục dòng Tên người Pháp mang tên A-lịch-sơn đã biên soạn cuốn từ điển Việt-Bồ-La, đặt nền móng cho chữ Quốc Ngữ.", explanation: "Công lao của ngài đã giúp tiếng Việt có chữ viết mẫu tự Latinh, tạo điều kiện thuận lợi cho việc rao giảng Lời Chúa." },
    { answer: "THAYGIANG", clue: "Chức sắc đặc biệt ở giáo hội sơ khai Việt Nam, những giáo dân nhiệt thành đi các xứ đạo để dạy giáo lý thay cho linh mục.", explanation: "Họ là những người cộng tác đắc lực trong việc rao truyền Tin Mừng khi số lượng linh mục còn rất hạn chế." },
    { answer: "TRAKIEU", clue: "Giáo xứ nơi Đức Mẹ hiện ra để che chở giáo dân đang chạy trốn trong các cuộc bách hại khốc liệt.", explanation: "Tượng Mẹ đứng vững vàng che chở giáo điểm này thành một phép lạ bảo vệ giáo phận non trẻ." },
    { answer: "GIAMMUC", clue: "Cơ cấu lãnh đạo cao nhất của Giáo Hội Việt Nam, thường xuyên họp bàn để định hướng giáo hội địa phương.", explanation: "Hội Đồng Giám Mục tập hợp những vị chủ chăn để dẫn dắt con thuyền đức tin." },
    { answer: "ANRE", clue: "Chàng trai trẻ tuổi tử đạo đầu tiên của Giáo hội Việt Nam tại giáo xứ Phú Yên.", explanation: "Thầy giảng Anrê Phú Yên dõng dạc xưng hô danh Chúa Giêsu trước khi chịu trảm quyết, để lại gương sáng kiên trung." }
  ],
  77: [ // Sự Can Thiệp Bền Vững
    { answer: "XATAN", clue: "Kẻ thù nguy hiểm số một luôn rình rập và cám dỗ con người xa rời vòng tay Thiên Chúa.", explanation: "Chúa Tể bóng tối luôn gieo rắc sự dối trá để quyến rũ kẻ yếu đuối vấp ngã." },
    { answer: "PHEPLA", clue: "Sự can thiệp linh thánh vượt ra khỏi quy luật tự nhiên, chứng minh quyền năng tối cao của Đấng ngự trên trời.", explanation: "Các dấu lạ nhắm mục đích củng cố niềm tin và dọn đường cho Nước Trời tỏ hiện." },
    { answer: "THIENTHAN", clue: "Loài thụ tạo thiêng liêng, thi hành sứ mạng phụng sự Thiên Chúa và bảo vệ con người.", explanation: "Những vị thiêng liêng vô hình này không ngừng ca tụng Thiên Chúa và được cử đến để che chở các tín hữu." },
    { answer: "THIKIEN", clue: "Trạng thái mầu nhiệm khi Thiên Chúa ban ơn cho một đấng thiêng liêng chiêm ngưỡng những thực tại vô hình.", explanation: "Thị kiến mở ra cái nhìn thiêng liêng để thấu hiểu kỳ công của Thiên Chúa." },
    { answer: "QUYAM", clue: "Tình trạng một người bị tà thần khống chế và dày vò đau khổ.", explanation: "Chúa Giê-su dùng quyền năng của Ngài để xua đuổi ma quỷ và giải thoát những người bị quỉ ám khỏi tay ác thần." },
    { answer: "DAULA", clue: "Bảy sự kiện kỳ diệu trong Tin Mừng thánh Gio-an minh chứng cho quyền năng của Ngôi Lời, như việc hóa bánh ra nhiều.", explanation: "Thánh Gioan gọi những phép lạ là dấu lạ, nhằm chỉ ra thần tính của Ngài và khơi gọi lòng tin." }
  ],
  78: [
    { answer: "NGOAITINH", clue: "Giới răn thứ sáu nghiêm cấm mọi hành vi phản bội lời thề chung thủy trong cuộc sống hôn nhân gia đình.", explanation: "Ngoại tình phá vỡ hạnh phúc gia đình và đi ngược lại với sự thánh thiện của Bí Tích Hôn Phối." },
    { answer: "CHUNGGIAN", clue: "Giới răn thứ tám cấm các hành vi làm chứng gian, vu khống, và làm tổn hại đến danh dự của người khác.", explanation: "Nói dối, vu khống là hành vi nghịch lại với sự công chính và tình yêu thương." },
    { answer: "THOPHUONG", clue: "Điều răn thứ nhất nghiêm cấm việc thờ ngẫu tượng, nhắc nhở con người chỉ tôn thờ một mình Thiên Chúa.", explanation: "Dành trọn vẹn sự thờ phượng vâng phục cho Đấng Tối Cao thay vì chạy theo danh vọng hay lừa phỉnh." },
    { answer: "TENTHANH", clue: "Điều răn thứ hai nhắc nhở mọi người phải tôn kính danh thánh Chúa, không kêu gọi danh Ngài cách vô cớ.", explanation: "Danh Chúa là thánh thiện và đáng được tôn vinh, không được dùng để thề thốt dối gian." },
    { answer: "GIETNGUOI", clue: "Điều răn thứ năm cấm mọi hành động tước đoạt sinh mạng của người khác do Thiên Chúa ban tặng.", explanation: "Sự sống là ân huệ của Thiên Chúa, mọi việc tước bỏ mạng sống bất công đều là lỗi luật Ngài." },
    { answer: "NGAYCHUA", clue: "Kiêng việc xác ngày Chúa Nhật để dành thời gian tham dự Thánh Lễ ngợi khen Thiên Chúa.", explanation: "Ngày thứ Bảy (Chúa Nhật) là ngày linh thánh để nhắc nhở con người nhớ đến công trình Tạo Dựng và làm mới chính mình." }
  ],
  79: [
    { answer: "KYRENE", clue: "Người đàn ông quê ở Kyrênê bị quân lính bắt vác đỡ thập giá cho Chúa Giêsu trên đường lên đồi Sọ.", explanation: "Hành động của ông minh họa cho việc vác thập giá mình hằng ngày để theo Chúa." },
    { answer: "LUOIGIAO", clue: "Mũi vũ khí đâm thâu cạnh sườn Chúa Giêsu khi Ngài đã tắt thở trên thập giá, làm tuôn trào máu và nước.", explanation: "Từ cạnh sườn bị đâm thâu, ơn tha thứ tuôn dạt dào khơi nguồn cho các Bí Tích tuôn chảy." },
    { answer: "PHILATO", clue: "Vị tổng trấn La Mã đã hèn nhát rửa tay và trao nộp Đấng Vô Tội cho dân chúng mang đi đóng đinh.", explanation: "Dù biết rõ sự thật, ông đã đưa ra bản án bất công vì sức ép chính trị." },
    { answer: "THAPGIA", clue: "Hình phạt tử hình nhục nhã của La Mã nhưng đã trở thành biểu tượng cao quý của ơn cứu độ.", explanation: "Chúa Kitô đã biến cây thập tự thành Thánh Giá vinh quang, mở đường cứu vãn đưa con người lên Thiên Quốc." },
    { answer: "VERONICA", clue: "Người phụ nữ dũng cảm chen qua đám đông để lau khuôn mặt đẫm máu gươm của Chúa Giêsu.", explanation: "Hành động yêu thương đó đã để lại chân dung Chúa in dấu trên tấm khăn." },
    { answer: "CANVE", clue: "Ngọn đồi hình sọ người, nơi Chúa Giêsu chịu đóng đinh hiến tế mạng sống chuộc tội thế gian.", explanation: "Canvê là nơi đau thương nhưng cũng là trung tâm của tình yêu cứu chuộc ngập tràn hy vọng." }
  ],
  80: [
    { answer: "HIENRA", clue: "Hành động uy linh của Đấng Phục Sinh tỏ mình ra với các môn đệ để ban bình an cho họ.", explanation: "Việc Chúa phục sinh xuất hiện đã xua tan sợ hãi, thổi hơi trao ban Thánh Thần cho Giáo Hội chập chững." },
    { answer: "MACDALA", clue: "Người phụ nữ đã đi ra mộ từ mờ sáng và trở thành sứ giả đem Tin Mừng Phục sinh đầu tiên.", explanation: "Maria Mađalêna lột bỏ tội lỗi đã trở thành người chuyển ngọn lửa phục sinh đến với các anh em." },
    { answer: "DIDIMO", clue: "Biệt danh của thánh Tôma, người đã đòi được chạm tay vào vết đinh mới vững vàng xác tín Chúa sống lại.", explanation: "Sự nghi ngờ của thánh Tôma là dịp để Chúa củng cố đức tin, giúp ông tuyên xưng niềm tin trọn vẹn." },
    { answer: "EMAU", clue: "Làng nhỏ trên đường nơi hai lữ khách buồn bã được Chúa Phục Sinh đồng hành và sưởi ấm tâm hồn.", explanation: "Bằng việc bẻ bánh chia sẻ Lời, Chúa đã giúp họ mở mắt ra và bừng lên hy vọng." },
    { answer: "THANGTHIEN", clue: "Biến cố Chúa Giêsu rời khỏi trần thế để trở về ngự bên hữu Đức Chúa Cha vinh hiển tột đỉnh.", explanation: "Sự Thăng Thiên dọn đường để Chúa ban Thánh Thần và hướng các linh hồn về Nước Chúa." },
    { answer: "GALILE", clue: "Vùng đất mà thiên thần bảo các môn đệ lui về để được gặp lại Chúa Giêsu sau khi Ngài phục sinh.", explanation: "Trở về Galilê cũng là trở về nơi khởi đầu ơn gọi để hăng hái ra đi rao giảng Tin Mừng." }
  ],
  81: [
    { answer: "TUVIEN", clue: "Nơi cư ngụ thanh vắng dành riêng cho các tu sĩ sống đời thánh hiến, dâng lời cầu nguyện hằng ngày.", explanation: "Tu viện là môi trường tĩnh tâm, tách biệt khỏi sự ồn ào thế tục để gắn kết trọn vẹn sức lực làm việc tông đồ." },
    { answer: "VANGPHUC", clue: "Lời khấn từ bỏ ý riêng để trung thành vâng theo ý Chúa qua việc tuân phục bề trên.", explanation: "Sự tùng phục này giúp hoàn thiện linh đạo và noi chiếu con đường khiêm hạ của Chúa Kitô." },
    { answer: "KHIETTINH", clue: "Lời khấn dâng hiến trọn vẹn tinh thần và thể xác để dành một tình yêu không chia sẻ cho ơn báo Nước Trời.", explanation: "Đây là một sự hy sinh tự nguyện hướng đến một tình yêu cao đẹp hơn và phục vụ tha nhân nhiều hơn." },
    { answer: "KHONGHEO", clue: "Lời khấn từ bỏ việc sở hữu tài sản riêng, chọn nếp sống đơn sơ phó thác trọn vẹn vào Lời Chúa.", explanation: "Tu sĩ khước từ giàu sang vật chất để lấy Thiên Chúa làm kho tàng duy nhất bền lâu bền vững." },
    { answer: "TAPVIEN", clue: "Giai đoạn đào tạo quan trọng để các ứng sinh rèn luyện và thích nghi với đời sống tu trì.", explanation: "Thời gian này là cơ hội để trau dồi nhân đức và phân định linh đạo trước khi khấn tạm." },
    { answer: "BETREN", clue: "Người có trách nhiệm hướng dẫn, chăm sóc và điều hành huynh đệ trong một cộng đoàn hay dòng tu.", explanation: "Bề trên mang trọng trách giáo dưỡng và điều phối hoạt động chung trong sự khôn ngoan và yêu thương." }
  ],
  82: [
    { answer: "CHIENLAC", clue: "Dụ ngôn người mục tử để lại đàn chiên lớn để cất công đi tìm cho bằng được một con đi lạc chưa về.", explanation: "Ám chỉ lòng thương xót của Thiên Chúa đối với những hồn lạc bước và niềm vui khi một tội nhân hoán cải." },
    { answer: "SAMARIA", clue: "Người qua đường tốt bụng sẵn sàng cấp cứu người bị cướp đánh trong lúc những tư tế dửng dưng làm ngơ.", explanation: "Dụ ngôn gỡ bỏ ranh giới dân tộc, mời gọi sống bác ái với bất kỳ ai đang gặp hoạn nạn." },
    { answer: "HATCAI", clue: "Hạt giống bé xíu nhưng được gieo xuống sẽ lớn lên tàng cây chim chóc đến nương náu.", explanation: "Nước Thiên Chúa khởi đầu nhỏ bé từ Lời nhưng sẽ lan tỏa sức sống khắp nơi để nuôi dưỡng muôn dân." },
    { answer: "HOANGDANG", clue: "Người con cả bỏ nhà theo đam mê lãng phí nhưng cuối cùng được người cha dịu dàng ăn mừng hoan nghênh đón về.", explanation: "Dụ ngôn nổi tiếng phản ánh tình cha thương xót, không tính lỗi lầm mà phục hồi phẩm giá cho hối nhân." },
    { answer: "PHUHO", clue: "Người được của mù quáng lo gom góp xây kho chứa lúa gạo mà quên rằng mạng sống có thể bị cất đi bất cứ đêm nào.", explanation: "Chúa cảnh báo tác hại của lòng tham tích lũy vật chất mà không lo làm giàu trước mặt Thiên Chúa." },
    { answer: "LUOICA", clue: "Việc thả lưới bắt được đủ loại cá biểu tượng cho việc trong thế gian có cả người lành lẫn người dữ.", explanation: "Ngày phán xét cuối cùng sẽ như cuộc phân loại tách bỏ sự ác nhường chỗ cho công lý thanh sạch." }
  ],
  83: [
    { answer: "EMMANUEL", clue: "Danh xưng mang ý nghĩa 'Thiên Chúa ở cùng chúng ta', chỉ về biến cố Đấng Cứu Thế đến trần gian.", explanation: "Sự hiện diện yêu thương của Hài Nhi làm rút ngắn đi khoảng cách thiêng liêng đến thân thiện gần gũi với con người." },
    { answer: "MARANATHA", clue: "Lời cầu nguyện tha thiết bằng tiếng Aram có nghĩa là 'Lạy Chúa, xin hãy đến' được cộng đoàn sơ khai xướng lên.", explanation: "Sự ngóng trông và khao khát ngày Chúa Giêsu quang lâm hoàn tất lịch sử cứu chuộc." },
    { answer: "AMEN", clue: "Lời xác tín dõng dạc trong phụng vụ để thể hiện sự đính ước và niềm tin vững vàng.", explanation: "Khẩu lệnh mạnh mẽ để bày tỏ sự đồng tâm nhất trí và tin cậy tuyệt đối." },
    { answer: "ABBA", clue: "Tiếng Aram có nghĩa sâu sắc biểu trưng tình cha con, là cách Chúa Giêsu cầu nguyện với tước vị làm Con.", explanation: "Ngài đã mặc khải tình phụ tử thiêng liêng cho môn đệ và cho họ đặc quyền trở thành những dưỡng tử." },
    { answer: "HOSANA", clue: "Tiếng xướng ca hân hoan có ý ca ngợi xin vạn tuế Vua hòa bình đang tiến vào thành đô Giê-ru-sa-lem.", explanation: "Lời hoan ca nghênh đón Vua chiến thắng vinh quang nhưng lại mở đầu cho hành trình hy sinh cứu rỗi." },
    { answer: "RABI", clue: "Tước hiệu Do Thái kính trọng gọi Chúa Giêsu, thừa nhận vai trò người thầy truyền dạy Phúc Âm xuất chúng.", explanation: "Chúa mang chân lý để giảng giải đường lối hoàn thiện cho những người tìm kiếm lề luật ngay thẳng." }
  ],
  84: [
    { answer: "RUOCKIEU", clue: "Sinh hoạt cộng đoàn cung kính bước đi thành đoàn rước Mình Thánh hoặc Thánh Tôn vinh giữa các nẻo đường.", explanation: "Biểu hiện lòng tôn sùng công khai hướng tâm hồn hòa trong không khí thiêng liêng, trang bị hy vọng đức tin." },
    { answer: "CAUBAU", clue: "Lời xin phép ngợi ca của Đức Maria và các thánh nài nỉ Thiên Chúa tuôn đổ ân phúc xuống cõi trần.", explanation: "Hội Thánh được thông hiệp trong kho tàng thiêng liêng và nhờ ơn các Thánh chở che bầu bạn." },
    { answer: "MANCOI", clue: "Chuỗi kinh Mừng nguyện suy gẫm đan xen lạy Cha dâng lên Đức Mẹ xót thương làm ơn trợ lực bền vững.", explanation: "Bó hoa thiêng đánh thức lòng vững vàng chống trả cám dỗ, nhắc nhở nhiệm cục sinh thời và Phục sinh." },
    { answer: "THANHTHE", clue: "Bí Tích yêu thương nhiệm mầu là đỉnh cao đời sống Công Giáo, Chúa hiện diện thực sự trong hình thức Bánh Rượu.", explanation: "Được kính thờ như nguồn mạch ân sủng, thông ban sinh khí cho người tín hữu tiếp đón trọn vẹn tình yêu dâng hiến." },
    { answer: "THANHCA", clue: "Thánh nhạc ngân vang trong phụng vụ thánh hòa nhịp con tim, làm tiếng hát nâng bổng lên tận bệ tòa uy nghi.", explanation: "Giai điệu tạ ơn góp phần kết nối phụng thờ và khơi gợi cõi lòng sốt sắng, bộc bạch lòng kính phục chân thành." },
    { answer: "AODUCBA", clue: "Sợi vải mang tính biểu tượng sự đồng hành và lòng tôn kính gửi gắm Mẹ Maria, thường dùng làm áo giáp thiêng.", explanation: "Cầu mong lòng hiếu thảo sẽ được nương bóng tà áo che chở khỏi sa ngã hướng dẫn đường thánh đức." }
  ],
  85: [
    { answer: "XAYNHA", clue: "Dụ ngôn kẻ khôn biết chọn móng đá kiên cố dựng nhà chống vững bão táp, ngược hoàn toàn kẻ ngây dại làm nền cát.", explanation: "Lời dạy đề cao việc thực hành và thi hành Thánh ý hơn là chỉ gật gù nghe trên môi miệng." },
    { answer: "GIEOHAT", clue: "Hạt giống rơi rải rác mảnh màu mỡ trổ bông đơm hạt xum xuê ngược lại phần rơi rớt đá sỏi khô cạn thì nhanh úa tàn.", explanation: "Biểu trưng về sức sống của Phúc Âm, đòi hỏi nội tâm tín hữu cần trở thành mảnh đất lành chuẩn bị sẵn đón ơn Chúa." },
    { answer: "VUONNHO", clue: "Ông chủ trả công đồng đều hào phóng cho cả người phụ việc sớm lẫn đến trễ trong ngày làm mướn cày nho.", explanation: "Giáo huấn về lòng rộng lượng không đếm đo công trạng mà tuôn ban phần thưởng nước trời cho kẻ tin yêu vào Ngài." },
    { answer: "TRINHNU", clue: "Năm cô gái khôn mang dầu đi dự tiệc hân hoan rước đèn kịp thời gặp Tân Lang, bỏ lại nhóm còn lại thiếu sót đèn tắt.", explanation: "Sự tỉnh thức chờ đợi Chúa trở lại cần liên lỷ trau chuốt chuẩn bị sẵn sàng, sự chuẩn bị nội tâm không thể vay mượn." },
    { answer: "THATHU", clue: "Giáo huấn đòi hỏi ta nếu đã được miễn nợ vạn cân ngàn đô la thì phải biết tha lỗi mọn phiền cho người quen hữu.", explanation: "Khi đón nhận ơn đại xá cứu chuộc, tín hữu được lệnh phải hòa nhịp lan tỏa dung thứ lân tuất đầm ấm cho anh chị em." },
    { answer: "NENBAC", clue: "Người sử dụng số lượng yến bạc làm lời dồi dào được giao phó tài sản, không cất kỹ thoái thác trốn bới chôn lụt lấp.", explanation: "Lời dạy về sự năng nổ sinh lợi bằng tài năng phẩm hạnh do Thượng đế gửi trao thay vì chôn giấu thụ động gàn dở." }
  ],
  86: [
    { answer: "BATU", clue: "Đế quốc cho phép lưu dân Israel trong vòng xiềng xích được hồi hương cất xây lại vùng Đền Thờ sau thời lưu đày cay đắng.", explanation: "Chúa đã sử dụng cả những chế độ mạnh làm công cụ khôi phục giải phóng con dân để tiếp nối sứ mạng của mình." },
    { answer: "HYLAP", clue: "Văn hóa và tiếng nói thịnh vượng giúp hệ thống văn chương Cựu và Tân ước vang dội xa rộng ảnh hưởng các thuộc địa.", explanation: "Sự hợp lưu mở toang tư duy hỗ trợ giao lưu kiến thức truyền đạo mạnh mẽ." },
    { answer: "BABILON", clue: "Xứ đô thống trị đã đưa dân tộc ưu tuyển vào kiếp lao khổ khóc than lưu đày khi phá huỷ đền thờ thánh thiện tại Giêrusalem.", explanation: "Biến cố u sầu nhói lòng báo ứng sự bất tuân nghịch mệnh, rũ bỏ giao ước với Đấng bảo vệ duy nhất." },
    { answer: "ASSURIA", clue: "Đế chế hung hãn phía Đông thâu tóm phá tan vùng miền nam bắc và phân sáp tàn lụi nhà nước I-sra-en trong lịch sử.", explanation: "Đại nạn bị lưu vong khốc liệt dẫn tới phân ly đau đớn là tiếng vang sấm sét tỉnh giấc sửa phạt con tự tôn tự cao." },
    { answer: "SEBA", clue: "Vị thế hùng bá uy tín Nữ hoàng mang đoàn chiên lễ vật bái phục từ nức kinh thành xa thẳm đến diện kiến vua Sa Lô Môn.", explanation: "Sự lẫy lừng khôn ngoan mạc khải của Chúa đã làm rung chuyển thán phục các thế lực ngoại lai." },
    { answer: "ROMA", clue: "Đế quốc La Mã khống chế trọn vẹn và tạo cơ hội phát triển hệ thống giao lộ tạo con đường chuyển thông Lời dễ dàng.", explanation: "Hoàn cảnh bình an mang lưới vươn dài chắp cánh gieo phúc âm bùng xa mãnh liệt bởi thánh Phaolô oai hùng." }
  ]
};

let modified = 0;
data.forEach(p => {
  if (patches[p.id]) {
    p.words.forEach(w => {
      const pWord = patches[p.id].find(pw => pw.answer === w.answer);
      if (pWord) {
        w.clue = pWord.clue;
        w.explanation = pWord.explanation;
        modified++;
      }
    });
  }
});
fs.writeFileSync('./src/data/crossword_puzzles.json', JSON.stringify(data, null, 4));
console.log('Patched words 1:', modified);
