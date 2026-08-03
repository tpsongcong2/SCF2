/* --- HUONG DAN SU DUNG SCFOOD --- */
const SCF_GUIDES={
  accounting:{label:'Kế toán',icon:'ti-calculator',intro:'Quản lý đơn hàng, chuyến giao, hóa đơn, công nợ và các yêu cầu cần duyệt.',sections:[
    {title:'Kiểm tra và cập nhật đơn hàng',steps:['Vào Bán hàng → Đơn giao hàng. Chọn đúng ngày hoặc tháng cần làm việc.','Kiểm tra khách hàng, địa điểm, sản phẩm, số lượng hóa đơn và giờ giao.','Dùng nút Sửa để cập nhật; mọi thay đổi đều được lưu tại nút Lịch sử.','Bấm Cập nhật SX + chuyến khi cần tính lại ca sản xuất và chuyến giao tự động.'],note:'Không sửa trực tiếp đơn đã giao hoàn thành nếu chưa kiểm tra hóa đơn và công nợ liên quan.'},
    {title:'Xếp chuyến và giao chuyến cho lái xe',steps:['Vào Bán hàng → Chuyến giao hàng và chọn ngày giao.','Tạo chuyến từ đúng Ca giao hàng; kiểm tra danh sách đơn trong chuyến.','Chọn lái xe, sau đó bấm Giao lái xe. Chỉ lúc này lái xe mới nhìn thấy chuyến.','Khi thêm hoặc bỏ đơn khỏi chuyến đã giao, lái xe sẽ nhận thông báo tự động.'],note:'Nếu đổi lái xe, kiểm tra lại tên người nhận chuyến trước khi lưu.'},
    {title:'Duyệt đơn phát sinh của lái xe',steps:['Khi lái xe tạo đơn phát sinh, kế toán nhận thông báo Có đơn phát sinh cần duyệt.','Mở Thông báo hoặc Chuyến giao hàng, mở chi tiết chuyến tương ứng.','Kiểm tra khách hàng, địa điểm, sản phẩm và số lượng.','Bấm Duyệt đơn. Lái xe sẽ nhận thông báo xác nhận.'],note:'Chuyến không thể hoàn thành khi đơn phát sinh còn ở trạng thái chờ duyệt.'},
    {title:'Duyệt hoàn thành chuyến và hóa đơn',steps:['Mở chuyến ở trạng thái Chờ kế toán duyệt.','Kiểm tra số thực giao, ảnh hóa đơn từng đơn và hóa đơn tổng chuyến.','Duyệt hoặc trả lại từng hóa đơn kèm lý do rõ ràng.','Khi đầy đủ, bấm Kế toán duyệt để hoàn thành chuyến và ghi nhận công nợ.'],note:'Số thực giao dùng tính doanh thu; số hóa đơn dùng tính công nợ theo thiết lập hiện tại.'},
    {title:'Theo dõi lịch sử và thông báo',steps:['Bấm biểu tượng chuông để xem các việc mới phát sinh.','Bấm Lịch sử tại mỗi đơn để xem ai tạo, ai sửa, thời gian và nội dung cũ → mới.','Đánh dấu đã đọc sau khi xử lý xong.','Có thể bật thông báo trên thiết bị để nhận cảnh báo khi webapp đang mở hoặc chạy nền.']}
  ]},
  attendance:{label:'Nhân viên chấm công',icon:'ti-fingerprint',intro:'Chấm công, gửi đơn nghỉ phép và theo dõi các thông tin cá nhân.',sections:[
    {title:'Chấm công vào và ra',steps:['Đăng nhập đúng tài khoản cá nhân, vào Quản lý nhân sự → Chấm công.','Bấm Chấm công vào khi bắt đầu làm việc.','Cuối ca bấm Chấm công ra và kiểm tra thời gian hiển thị.','Nếu hệ thống yêu cầu vị trí hoặc ảnh xác nhận, cấp quyền và thực hiện theo hướng dẫn trên màn hình.'],note:'Không chấm công hộ. Mỗi tài khoản chỉ ghi nhận cho chính nhân viên đang đăng nhập.'},
    {title:'Kiểm tra bảng công',steps:['Vào Báo công → Báo cáo chấm công.','Chọn tháng cần kiểm tra.','Đối chiếu ngày làm, giờ vào, giờ ra, đi muộn hoặc về sớm.','Nếu có sai sót, báo quản lý và nêu rõ ngày, ca làm việc cần điều chỉnh.']},
    {title:'Gửi yêu cầu nghỉ phép',steps:['Vào Quản lý nhân sự → Xin nghỉ.','Chọn ngày bắt đầu, ngày kết thúc và loại nghỉ.','Nhập lý do đầy đủ rồi gửi yêu cầu.','Theo dõi trạng thái Chờ duyệt, Đã duyệt hoặc Từ chối.'],note:'Nên gửi yêu cầu trước ngày nghỉ, trừ trường hợp đột xuất.'},
    {title:'Nhận và báo cáo công việc',steps:['Vào Giao việc hoặc mở thông báo mới.','Đọc nội dung, thời hạn và yêu cầu chất lượng.','Cập nhật tiến độ theo đúng trạng thái thực tế.','Khi hoàn thành, gửi báo cáo và minh chứng nếu công việc yêu cầu.']}
  ]},
  driver:{label:'Lái xe',icon:'ti-steering-wheel',intro:'Nhận chuyến, giao hàng, cập nhật số thực giao, hóa đơn và đơn phát sinh.',sections:[
    {title:'Nhận và bắt đầu chuyến',steps:['Mở Thông báo hoặc Bán hàng → Chuyến giao hàng.','Bạn chỉ nhìn thấy chuyến đã được giao đúng cho tài khoản của mình.','Mở chi tiết, kiểm tra ngày, ca giao, danh sách điểm và thứ tự giao.','Bấm Bắt đầu giao trước khi nhập kết quả giao hàng.'],note:'Nếu chuyến, địa điểm hoặc hàng hóa không đúng, báo kế toán trước khi xuất phát.'},
    {title:'Giao hàng và nhập số thực giao',steps:['Mở từng đơn trong chi tiết chuyến.','Nhập SL Giao đúng với số khách hàng thực nhận.','Chụp hoặc tải ảnh hóa đơn của từng đơn.','Theo dõi trạng thái kế toán duyệt; nếu bị trả lại, đọc lý do và tải ảnh mới.']},
    {title:'Tạo đơn phát sinh',steps:['Chỉ trong chuyến đang giao, bấm + Đơn phát sinh.','Chọn khách hàng, địa điểm, sản phẩm và nhập số lượng. Có thể thêm nhiều sản phẩm vào một đơn.','Bấm Gửi kế toán duyệt. Đơn được đưa ngay vào chuyến với nhãn Chờ kế toán duyệt.','Chờ thông báo kế toán đã duyệt rồi tiếp tục giao và nhập số thực giao.'],note:'Mỗi chuyến chỉ được tạo tối đa 1 đơn phát sinh và không thể hoàn thành chuyến khi đơn chưa được duyệt.'},
    {title:'Hoàn thành chuyến',steps:['Kiểm tra tất cả dòng hàng đã có số thực giao.','Đảm bảo mỗi đơn có ảnh hóa đơn và chuyến có hóa đơn tổng.','Bấm Giao hoàn thành.','Chuyến được chuyển sang kế toán duyệt; theo dõi thông báo nếu có nội dung bị trả lại.']},
    {title:'Xử lý sự cố',steps:['Mất mạng: tiếp tục giữ webapp, chờ trạng thái đồng bộ trở lại rồi kiểm tra dữ liệu.','Không thấy chuyến: kiểm tra đúng tài khoản hoặc liên hệ kế toán bấm Giao lái xe.','Không tạo được đơn phát sinh: chuyến chưa bắt đầu hoặc đã có một đơn phát sinh.','Không hoàn thành được: đọc danh sách điều kiện còn thiếu hiển thị cuối chi tiết chuyến.']}
  ]}
};

function UserGuideTab({currentUser}){
  const dept=String(currentUser?.dept||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const defaultRole=currentUser?.role==='driver'?'driver':dept.includes('ke toan')?'accounting':'attendance';
  const[role,setRole]=useState(defaultRole);const[q,setQ]=useState('');
  const guide=SCF_GUIDES[role];const query=String(q||'').trim().toLowerCase();
  const sections=guide.sections.filter(s=>!query||[s.title,s.note,...s.steps].some(v=>String(v||'').toLowerCase().includes(query)));
  return h('div',{className:'guide-page'},
    h('div',{className:'guide-hero'},h('div',null,h('div',{className:'ptitle'},h('i',{className:'ti ti-book-2'}),'HDSD SCFOOD'),h('p',null,'Hướng dẫn thao tác theo từng vị trí công việc trong hệ thống.')),h('div',{className:'guide-search'},h('i',{className:'ti ti-search'}),h('input',{value:q,onChange:e=>setQ(e.target.value),placeholder:'Tìm nội dung hướng dẫn...'}))),
    h('div',{className:'guide-role-tabs'},Object.entries(SCF_GUIDES).map(([key,item])=>h('button',{key,className:role===key?'on':'',onClick:()=>{setRole(key);setQ('');}},h('i',{className:'ti '+item.icon}),item.label))),
    h('div',{className:'guide-intro'},h('i',{className:'ti '+guide.icon}),h('div',null,h('b',null,'Hướng dẫn dành cho '+guide.label),h('span',null,guide.intro))),
    h('div',{className:'guide-sections'},sections.length?sections.map((section,index)=>h('details',{key:section.title,className:'guide-section',open:index===0},h('summary',null,h('span',{className:'guide-number'},index+1),h('b',null,section.title),h('i',{className:'ti ti-chevron-down'})),h('div',{className:'guide-section-body'},h('ol',null,section.steps.map((step,i)=>h('li',{key:i},step))),section.note&&h('div',{className:'guide-note'},h('i',{className:'ti ti-alert-circle'}),h('span',null,h('b',null,'Lưu ý: '),section.note))))):h('div',{className:'empty-st',style:{padding:45}},'Không tìm thấy nội dung hướng dẫn phù hợp.'))
  );
}
