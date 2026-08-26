/* ─── Default data ─── */
const DEF_COMPANY={name:'Công ty SCF',intro:'',goals:'',mission:'',vision:'',phone:'',email:'',address:'',website:''};
const DEF_EMPS=[{id:'NV001',name:'Administrator',birthday:'',gender:'male',female:false,dept:'Ban Giám Đốc',role:'admin',username:'admin',password:'',phone:'',email:'',note:'',updatedBy:'system',updatedAt:'',mustChangePw:false}];
const DEF_MATERIALS=[
  {id:'VT001',code:'VT001',name:'Thùng carton',group:'',unit:'Cái',price:0,note:''},
  {id:'VT002',code:'VT002',name:'Màng PE bọc',group:'',unit:'Cuộn',price:0,note:''},
  {id:'VT003',code:'VT003',name:'Dây đai nhựa',group:'',unit:'Cuộn',price:0,note:''},
];
const DEF_PRODCATS=[
  {id:'DM001',name:'Nhóm sản phẩm A',desc:''},
  {id:'DM002',name:'Nhóm sản phẩm B',desc:''},
];
const DEF_PRODUCTS=[
  {id:'SP001',code:'SP001',name:'Sản phẩm mẫu',catId:'DM001',unit:'Cái',weightPerUnit:0.5,note:'',needsLabel:true,labelPackSize:10,labelMergeSmallRemainder:true},
];
const DEF_CUSTOMERS=[
  {id:'KH001',name:'Khách hàng mẫu',group:'Nhóm khách hàng A',taxCode:'',address:'Hà Nội',note:'',points:[{id:'PT001',name:'Kho chính',address:'123 Đường A, Hà Nội',contact:'Anh Tuấn',phone:'0901234567'}]},
];
// Bảng khu vực độc lập — dùng chung cho nhiều KH/địa điểm
const DEF_AREAS=[
  {id:'AREA_KV',code:'KV',name:'Khu vực KV',note:''},
  {id:'AREA_VP',code:'VP',name:'Khu vực VP',note:''},
  {id:'AREA_BN',code:'BN',name:'Bắc Ninh',note:''},
  {id:'AREA_QV',code:'QV',name:'Quang Vinh',note:''},
  {id:'AREA_ĐT',code:'ĐT',name:'Điềm Thụy',note:''},
  {id:'AREA_SSTN',code:'SS TN',name:'Samsung Thái Nguyên',note:''},
  {id:'AREA_YP',code:'YP',name:'Yên Phong',note:''},
];
const DEF_PROD_SHIFTS=[
  {id:'PSH01',name:'Ca sáng',location:'',orderTime:'07:00',actualProdTime:'06:00',prodDateOffset:0,tripDateOffset:0,tripShiftId:'',tripShiftName:'',labelPrintTime:'05:30',labelPrintDateOffset:0,startTime:'07:00',endTime:'11:00',color:'#FFF8E1',textColor:'#E65100',active:true},
  {id:'PSH02',name:'Ca chiều',location:'',orderTime:'12:00',actualProdTime:'11:00',prodDateOffset:0,tripDateOffset:0,tripShiftId:'',tripShiftName:'',labelPrintTime:'10:30',labelPrintDateOffset:0,startTime:'12:00',endTime:'17:00',color:'#FEF3C7',textColor:'#92400E',active:true},
  {id:'PSH03',name:'Ca đêm',location:'',orderTime:'00:00',actualProdTime:'22:00',prodDateOffset:-1,tripDateOffset:-1,tripShiftId:'',tripShiftName:'',labelPrintTime:'21:30',labelPrintDateOffset:-1,startTime:'00:00',endTime:'06:00',color:'#EDE7F6',textColor:'#4527A0',active:true},
];
const DEF_PROD_SHIFT_RULES=[
  {id:'N_EARLY',group:'Ca đêm',name:'Ca đêm sớm',start:'23:00',end:'02:30',color:'#EDE7F6',textColor:'#4527A0',active:true},
  {id:'N_LATE',group:'Ca đêm',name:'Ca đêm muộn',start:'02:30',end:'06:00',color:'#EDE7F6',textColor:'#4527A0',active:true},
  {id:'M_EARLY',group:'Ca sáng',name:'Ca sáng sớm',start:'06:00',end:'09:00',color:'#FFF8E1',textColor:'#E65100',active:true},
  {id:'M_LATE',group:'Ca sáng',name:'Ca sáng muộn',start:'09:00',end:'12:00',color:'#FFF8E1',textColor:'#E65100',active:true},
  {id:'A_EARLY',group:'Ca chiều',name:'Ca chiều sớm',start:'12:00',end:'14:30',color:'#FEF3C7',textColor:'#92400E',active:true},
  {id:'A_LATE',group:'Ca chiều',name:'Ca chiều muộn',start:'14:30',end:'17:00',color:'#FEF3C7',textColor:'#92400E',active:true},
];
const DEF_WORKCATS=[
  {id:'CV001',code:'CV001',name:'Bốc xếp kho',dept:'Kho vận',unit:'Tấn',rate:0,desc:'',duration:'',qualityReq:'',note:''},
  {id:'CV002',code:'CV002',name:'Vận chuyển nội thành',dept:'Lái xe',unit:'Chuyến',rate:0,desc:'',duration:'',qualityReq:'',note:''},
];
const ROLES={admin:'Admin',manager:'Quản lý',staff:'Nhân viên',driver:'Lái xe'};
const RCLS={admin:'chip-admin',manager:'chip-manager',staff:'chip-staff',driver:'chip-driver'};
const DEPTS=['Ban Giám Đốc','Kế toán','Kho vận','Sản xuất','Bán hàng','Mua hàng','Lái xe','Khác'];
const deptCode=(i)=>'BP'+String(i+1).padStart(3,'0');
const DEF_DEPTS=DEPTS.map((d,i)=>({id:'BP'+String(i+1).padStart(3,'0'),code:deptCode(i),name:d,note:''}));
const UNITS=['Cái','Gói','Thùng','Kg','Tấn','Lít','m3','KW','Cuộn','Bộ','Túi','Hộp','Chai','Lọ','Bao'];
const UI_FONT_FAMILY_OPTIONS=[
  {value:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",label:'Segoe UI'},
  {value:"Calibri,'Segoe UI',sans-serif",label:'Calibri'},
  {value:"Arial,sans-serif",label:'Arial'},
  {value:"Tahoma,sans-serif",label:'Tahoma'},
  {value:"Verdana,sans-serif",label:'Verdana'},
  {value:"'Trebuchet MS',sans-serif",label:'Trebuchet MS'},
  {value:"Georgia,serif",label:'Georgia'},
  {value:"'Times New Roman',serif",label:'Times New Roman'},
];
const UI_FONT_MODE_OPTIONS=[
  {value:'normal',label:'Bình thường',weight:'400',style:'normal'},
  {value:'bold',label:'Đậm',weight:'700',style:'normal'},
  {value:'italic',label:'In nghiêng',weight:'400',style:'italic'},
  {value:'boldItalic',label:'Đậm nghiêng',weight:'700',style:'italic'},
];
const UI_FONT_SCOPE_OPTIONS=[
  {key:'base',label:'Nội dung chung',note:'Chữ mô tả, thông tin và số liệu chung trên các trang.',sample:'Nội dung hiển thị chung trên màn hình'},
  {key:'form',label:'Ô nhập liệu',note:'Bộ lọc, ô nhập, chọn ngày, chọn danh sách và vùng ghi chú.',sample:'Ô nhập liệu / Bộ lọc / Ghi chú'},
  {key:'menu',label:'Menu điều hướng',note:'Menu trên cùng, thông tin đầu trang và các mục điều hướng.',sample:'Menu / Bán hàng / Cài đặt'},
  {key:'button',label:'Nút chức năng',note:'Nút tạo mới, lưu, cập nhật, xuất hoặc nhập dữ liệu.',sample:'Lưu cài đặt'},
  {key:'table',label:'Nội dung bảng',note:'Dữ liệu trong danh sách đơn hàng, báo cáo và bảng chi tiết.',sample:'LOTTE-HOTEL / 127 / 08:00'},
  {key:'orderqty',label:'Cột SL Đặt',note:'Số lượng đặt trong bảng đơn hàng trên máy tính và điện thoại.',sample:'SL Đặt: 120'},
  {key:'invoiceqty',label:'Cột SL HĐ',note:'Số lượng hóa đơn trong bảng đơn hàng trên máy tính và điện thoại.',sample:'SL HĐ: 115'},
  {key:'header',label:'Tiêu đề bảng',note:'Tên cột của bảng và các tiêu đề hàng dữ liệu.',sample:'Địa điểm giao / Ngày / Giờ'},
  {key:'badge',label:'Nhãn trạng thái',note:'Badge, số lượng, trạng thái và chip phân quyền.',sample:'Đang hoạt động / Admin'},
];
const DEF_UI_SETTINGS={
  fontFamily:UI_FONT_FAMILY_OPTIONS[0].value,
  birthdayEffect:'fireworks',
  scopes:{
    base:{size:14,mode:'normal',fontFamily:UI_FONT_FAMILY_OPTIONS[0].value},
    form:{size:14,mode:'normal',fontFamily:UI_FONT_FAMILY_OPTIONS[0].value},
    menu:{size:12,mode:'bold',fontFamily:UI_FONT_FAMILY_OPTIONS[0].value},
    button:{size:13,mode:'bold',fontFamily:UI_FONT_FAMILY_OPTIONS[0].value},
    table:{size:13,mode:'normal',fontFamily:UI_FONT_FAMILY_OPTIONS[0].value},
    orderqty:{size:13,mode:'bold',fontFamily:UI_FONT_FAMILY_OPTIONS[0].value},
    invoiceqty:{size:13,mode:'bold',fontFamily:UI_FONT_FAMILY_OPTIONS[0].value},
    header:{size:12,mode:'bold',fontFamily:UI_FONT_FAMILY_OPTIONS[0].value},
    badge:{size:11,mode:'bold',fontFamily:UI_FONT_FAMILY_OPTIONS[0].value}
  }
};
const DEF_PRINT_TEMPLATE_SETTINGS={labelTemplates:[],orderTemplates:[]};
const PRINT_TEMPLATE_FIELD_GROUPS=[
  {label:'Thông tin công ty',options:[
    {key:'company.name',label:'Tên công ty'},
    {key:'company.phone',label:'Số điện thoại công ty'},
    {key:'company.email',label:'Email công ty'},
    {key:'company.address',label:'Địa chỉ công ty'},
    {key:'company.website',label:'Website công ty'},
    {key:'company.intro',label:'Giới thiệu công ty'},
    {key:'company.goals',label:'Mục tiêu công ty'},
    {key:'company.mission',label:'Sứ mệnh công ty'},
    {key:'company.vision',label:'Tầm nhìn công ty'}
  ]},
  {label:'Thông tin đơn hàng',options:[
    {key:'order.id',label:'Mã đơn hàng'},
    {key:'order.customer',label:'Tên khách hàng'},
    {key:'order.customerCode',label:'Mã khách hàng'},
    {key:'order.pointName',label:'Địa điểm giao'},
    {key:'order.address',label:'Địa chỉ giao'},
    {key:'order.area',label:'Khu vực giao'},
    {key:'order.deliveryDate',label:'Ngày giao'},
    {key:'order.deliveryTime',label:'Giờ giao'},
    {key:'order.status',label:'Trạng thái đơn'},
    {key:'order.note',label:'Ghi chú đơn hàng'},
    {key:'order.workOut',label:'Công đi'},
    {key:'order.workReturn',label:'Công về'},
    {key:'order.itemCount',label:'Số dòng sản phẩm'},
    {key:'order.totalWeight',label:'Tổng khối lượng đơn'}
  ]},
  {label:'Thông tin sản xuất / tem / chuyến',options:[
    {key:'plan.shiftName',label:'Tên ca sản xuất'},
    {key:'plan.prodDate',label:'Ngày sản xuất'},
    {key:'plan.prodTime',label:'Giờ sản xuất'},
    {key:'plan.tripDate',label:'Ngày chuyến giao'},
    {key:'plan.tripShiftName',label:'Ca giao hàng'},
    {key:'plan.labelDate',label:'Ngày in tem'},
    {key:'plan.labelTime',label:'Giờ in tem'}
  ]},
  {label:'Thông tin từng tem',options:[
    {key:'label.index',label:'STT tem'},
    {key:'label.count',label:'Tổng số tem'},
    {key:'label.weight',label:'Khối lượng của tem'}
  ]},
  {label:'Thông tin từng dòng sản phẩm',options:[
    {key:'line.index',label:'STT dòng sản phẩm'},
    {key:'line.productCode',label:'Mã sản phẩm'},
    {key:'line.productName',label:'Tên sản phẩm'},
    {key:'line.customerProductCode',label:'Mã SP của khách hàng'},
    {key:'line.customerProductName',label:'Tên SP của khách hàng'},
    {key:'line.unit',label:'Đơn vị tính'},
    {key:'line.qtyOrder',label:'SL đặt'},
    {key:'line.qtyInvoice',label:'SL hóa đơn'},
    {key:'line.qtyDelivered',label:'SL đã giao'},
    {key:'line.weightPerUnit',label:'Khối lượng / đơn vị'},
    {key:'line.totalWeight',label:'Tổng khối lượng dòng'},
    {key:'line.purchasePrice',label:'Giá mua / đơn giá'},
    {key:'line.note',label:'Ghi chú dòng sản phẩm'}
  ]},
  {label:'Thông tin chuyến / lái xe',options:[
    {key:'driver.name',label:'Tên lái xe'},
    {key:'driver.code',label:'Mã lái xe'},
    {key:'trip.id',label:'Mã chuyến'},
    {key:'trip.note',label:'Ghi chú chuyến'}
  ]}
];
const PRINT_TEMPLATE_FIELD_OPTIONS=PRINT_TEMPLATE_FIELD_GROUPS.flatMap(g=>g.options);
const PRINT_TEMPLATE_FIELD_MAP=Object.fromEntries(PRINT_TEMPLATE_FIELD_OPTIONS.map(opt=>[opt.key,opt]));
const PRINT_TEMPLATE_FIELD_ALIASES={
  company:'company.name',companyname:'company.name',congty:'company.name',companyphone:'company.phone',phone:'company.phone',address:'company.address',companyaddress:'company.address',
  orderid:'order.id',madon:'order.id',customer:'order.customer',customername:'order.customer',tenkhachhang:'order.customer',customercode:'order.customerCode',makhachhang:'order.customerCode',
  point:'order.pointName',pointname:'order.pointName',diadiemgiao:'order.pointName',deliverydate:'order.deliveryDate',ngaygiao:'order.deliveryDate',deliverytime:'order.deliveryTime',giogiao:'order.deliveryTime',
  area:'order.area',khuvuc:'order.area',note:'order.note',ghichu:'order.note',status:'order.status',trangthai:'order.status',workout:'order.workOut',workreturn:'order.workReturn',
  shift:'plan.shiftName',cashx:'plan.shiftName',proddate:'plan.prodDate',ngaysx:'plan.prodDate',prodtime:'plan.prodTime',giosx:'plan.prodTime',tripdate:'plan.tripDate',ngaychuyen:'plan.tripDate',
  tripshift:'plan.tripShiftName',cagiaohang:'plan.tripShiftName',labeldate:'plan.labelDate',ngayintem:'plan.labelDate',labeltime:'plan.labelTime',giointem:'plan.labelTime',
  labelindex:'label.index',stttem:'label.index',labelcount:'label.count',tongtem:'label.count',labelweight:'label.weight',temkg:'label.weight',khoiluongtem:'label.weight',
  product:'line.productName',productname:'line.productName',tensp:'line.productName',productcode:'line.productCode',masp:'line.productCode',unit:'line.unit',dvt:'line.unit',
  qty:'line.qtyOrder',qtyorder:'line.qtyOrder',sldat:'line.qtyOrder',qtyinvoice:'line.qtyInvoice',slhoadon:'line.qtyInvoice',qtydelivered:'line.qtyDelivered',sldagiao:'line.qtyDelivered',
  weight:'line.totalWeight',totalkg:'line.totalWeight',kg:'line.totalWeight',lineweight:'line.totalWeight',purchaseprice:'line.purchasePrice',dongia:'line.purchasePrice',
  linenote:'line.note',ghichudong:'line.note',driver:'driver.name',drivername:'driver.name',laixe:'driver.name',tripid:'trip.id',machuyen:'trip.id'
};
