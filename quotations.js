/* ─── Status badges ─── */
function StatusBadge({s}){
  const map={pending:['#FAEEDA','#854F0B','Chờ xếp'],assigned:['#E6F1FB','#185FA5','Đã xếp'],delivering:['#EAF3DE','#3B6D11','Đang giao'],done:['#E1F5EE','#0F6E56','Đã giao'],failed:['#FCEBEB','#A32D2D','Giao lỗi'],cancelled:['#FCEBEB','#A32D2D','Hủy'],planning:['#E6F1FB','#185FA5','Lên kế hoạch'],active:['#EAF3DE','#3B6D11','Đang giao'],completion_pending:['#FFF3CD','#8A5A00','Chờ kế toán duyệt'],completed:['#E1F5EE','#0F6E56','Hoàn thành'],draft:['#F1EFE8','#5F5E5A','Nháp'],sent:['#E6F1FB','#185FA5','Đã gửi'],approved:['#EAF3DE','#3B6D11','Đã duyệt'],expired:['#F1EFE8','#6b6b67','Hết hạn']};
  const[bg,tx,label]=map[s]||['#F1EFE8','#5F5E5A',s];
  return h('span',{className:'badge',style:{background:bg,color:tx}},label);
}

/* ─── QUOTATIONS ─── */

function quoteMonthKey(value){
  const s=String(value||'').trim();
  let y='',m='';
  let match=s.match(/^(\d{4})[-\/]([01]?\d)/);
  if(match){y=match[1];m=match[2];}
  else{match=s.match(/^[0-3]?\d[-\/]([01]?\d)[-\/](\d{4})/);if(match){m=match[1];y=match[2];}}
  if(!y||!m){const now=new Date();y=String(now.getFullYear());m=String(now.getMonth()+1);}
  return y+String(Number(m)||1).padStart(2,'0');
}
function quoteCustomerKey(customer){
  customer={...(customer||{}),code:customer?.name||customer?.code||customer?.id||'KH'};
  const raw=String(customer?.code||customer?.id||customer?.name||'KH').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'D').toUpperCase().replace(/[^A-Z0-9]+/g,'').slice(0,16);
  return raw||'KH';
}
function nextQuoteId(existingQuotes,customer,dateValue,excludeId){
  const base='BG-'+quoteCustomerKey(customer)+'-'+quoteMonthKey(dateValue);
  let max=0;
  (existingQuotes||[]).forEach(q=>{
    if(q.id===excludeId)return;
    const match=String(q.id||'').match(new RegExp('^'+base+'-(\\d+)$'));
    if(match)max=Math.max(max,Number(match[1])||0);
  });
  return base+'-'+String(max+1).padStart(2,'0');
}

// Input số có định dạng dấu phẩy hàng nghìn (8,700 / 50,000)
function NumInput({value, onChange, style, placeholder}) {
  const fmt = v => (v || v===0) ? Number(v).toLocaleString('en-US') : '';
  const [disp, setDisp] = useState(fmt(value));
  useEffect(function(){ setDisp(fmt(value)); }, [value]);
  return h('input', {
    type:'text', inputMode:'numeric',
    value: disp,
    placeholder: placeholder||'0',
    style: style||{},
    onChange: function(e) {
      var raw = e.target.value.replace(/[^0-9]/g,'');
      setDisp(raw ? Number(raw).toLocaleString('en-US') : '');
      onChange(raw ? Number(raw) : 0);
    }
  });
}

function QuoteProductPicker({line,products,onChange}){
  const selected=products.find(p=>p.id===line.productId)||null;
  const[query,setQuery]=useState(selected?.name||line.productName||'');
  const[open,setOpen]=useState(false);
  const norm=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/Đ/g,'D').toLowerCase().trim();
  const search=norm(query);
  const matches=(search?products.filter(p=>norm((p.code||p.id||'')+' '+(p.name||'')).includes(search)):products).slice(0,50);
  const choose=p=>{
    setQuery(p.name||'');
    setOpen(false);
    onChange({...line,productId:p.id,productName:p.name||'',unit:p.unit||''});
  };
  return h('div',{style:{position:'relative'}},
    h('div',{style:{position:'relative'}},
      h('i',{className:'ti ti-search',style:{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontSize:14,color:'var(--tx2)',pointerEvents:'none'}}),
      h('input',{
        value:query,
        placeholder:'Gõ tên hoặc mã sản phẩm...',
        autoComplete:'off',
        role:'combobox',
        'aria-expanded':open,
        onFocus:()=>setOpen(true),
        onBlur:()=>setTimeout(()=>setOpen(false),120),
        onChange:e=>{
          setQuery(e.target.value);
          setOpen(true);
          if(line.productId)onChange({...line,productId:'',productName:'',unit:''});
        },
        onKeyDown:e=>{
          if(e.key==='Enter'&&matches.length){e.preventDefault();choose(matches[0]);}
          if(e.key==='Escape')setOpen(false);
        },
        style:{fontSize:13,paddingLeft:32}
      })
    ),
    open&&h('div',{style:{position:'absolute',zIndex:260,left:0,right:0,top:'calc(100% + 2px)',maxHeight:240,overflowY:'auto',background:'#fff',border:'1px solid var(--pri)',borderRadius:'var(--r)',boxShadow:'0 6px 18px rgba(0,0,0,.16)'}},
      matches.length?matches.map(p=>h('div',{
        key:p.id,
        onMouseDown:e=>e.preventDefault(),
        onClick:()=>choose(p),
        style:{padding:'8px 10px',cursor:'pointer',borderBottom:'1px solid var(--bd)',fontSize:13}
      },
        h('div',{style:{fontWeight:600}},p.name),
        h('div',{style:{fontSize:11,color:'var(--tx2)',marginTop:2}},(p.code||p.id||'')+(p.unit?' · '+p.unit:''))
      )):h('div',{style:{padding:'10px',fontSize:12,color:'var(--tx2)',textAlign:'center'}},'Không tìm thấy sản phẩm')
    )
  );
}

function QuoteLineRow({line,products,onChange,onRemove}){
  return h('div',{style:{display:'grid',gridTemplateColumns:'64px 2fr 1fr 1fr auto',gap:6,marginBottom:6,alignItems:'center'}},
    h('input',{type:'number',min:1,step:1,value:line.sortOrder||'',onChange:e=>onChange({...line,sortOrder:e.target.value}),title:'Thứ tự hiển thị',style:{fontSize:13,textAlign:'center'}}),
    h(QuoteProductPicker,{line,products,onChange}),
    h('input',{value:line.unit,readOnly:true,style:{fontSize:13,background:'var(--bg2)',cursor:'default'}}),
    h(NumInput,{value:line.price,onChange:v=>onChange({...line,price:v}),placeholder:'Đơn giá',style:{fontSize:13}}),
    h('button',{className:'bi',onClick:onRemove,style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:14}}))
  );
}
function quotePointSelectionKey(point){
  const clean=value=>String(value||'').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').replace(/\s+/g,' ').toUpperCase();
  return clean(point?.id)+'\u001f'+clean(point?.name);
}
function PointMultiSelect({custPoints,pointKeys,areaNames,togglePoint,toggleArea,toggleAll,clearAll}){
  const[open,setOpen]=useState(false);
  const areaList=[...new Set(custPoints.map(p=>p.area).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const selectedByArea=custPoints.filter(p=>p.area&&areaNames.includes(p.area)).map(quotePointSelectionKey);
  const effectivePointKeys=[...new Set([...(pointKeys||[]),...selectedByArea])];
  const allChecked=custPoints.length>0&&effectivePointKeys.length===custPoints.length;
  const someChecked=effectivePointKeys.length>0&&effectivePointKeys.length<custPoints.length;
  const label=effectivePointKeys.length===0?'— Chọn khu vực / địa điểm áp dụng —':
    allChecked?'Tất cả '+custPoints.length+' địa điểm':
    (areaNames.length?areaNames.length+' khu vực, ':'')+effectivePointKeys.length+' địa điểm áp dụng';
  if(custPoints.length===0) return h(F,{label:'Địa điểm áp dụng *'},
    h('div',{style:{padding:'8px 10px',fontSize:12,color:'#A32D2D',background:'#FFF0F0',borderRadius:'var(--r)',border:'1px solid #f0a0a0'}},
      '⚠ Khách hàng này chưa có địa điểm giao hàng.'
    )
  );
  return h(F,{label:'Khu vực / địa điểm áp dụng *'+(effectivePointKeys.length?' ('+effectivePointKeys.length+')':'')},
    h('div',{style:{position:'relative'}},
      // Dropdown trigger
      h('div',{
        onClick:()=>setOpen(o=>!o),
        style:{display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'8px 10px',border:'1px solid '+(open?'var(--pri)':'var(--bd)'),
          borderRadius:open?'var(--r) var(--r) 0 0':'var(--r)',
          background:'#fff',cursor:'pointer',fontSize:13,userSelect:'none',
          boxShadow:open?'0 0 0 2px rgba(45,106,79,.15)':'none',transition:'all .15s'}
      },
h('span',{style:{color:effectivePointKeys.length?'var(--tx)':'var(--tx2)',flex:1}},label),
        h('i',{className:'ti ti-chevron-'+(open?'up':'down'),style:{fontSize:14,color:'var(--tx2)'}})
      ),
      // Dropdown panel
      open&&h('div',{style:{position:'absolute',zIndex:200,left:0,right:0,
        border:'1px solid var(--pri)',borderTop:'none',borderRadius:'0 0 var(--r) var(--r)',
        background:'#fff',boxShadow:'0 4px 12px rgba(0,0,0,.1)',overflow:'hidden'}},
        // Chọn tất cả
        h('div',{
          style:{display:'flex',alignItems:'center',gap:10,padding:'7px 12px',
            background:'var(--bg2)',borderBottom:'1px solid var(--bd)',cursor:'pointer'},
          onClick:toggleAll
        },
          h('input',{type:'checkbox',checked:allChecked,
            ref:el=>{if(el)el.indeterminate=someChecked;},
            onChange:toggleAll,
            style:{cursor:'pointer',accentColor:'var(--pri)',width:15,height:15}
          }),
          h('span',{style:{fontSize:12,fontWeight:600,color:'var(--pri)'}},
            allChecked?'Bỏ chọn tất cả':'Chọn tất cả ('+custPoints.length+')'),
          effectivePointKeys.length>0&&h('button',{
            type:'button',
            onClick:e=>{e.stopPropagation();clearAll();},
            style:{marginLeft:'auto',padding:'2px 9px',fontSize:11,color:'#A32D2D',background:'#fff',border:'1px solid #E06060',borderRadius:12,cursor:'pointer'}
          },'Bỏ chọn')
        ),
        // List địa điểm nhóm theo khu vực
        h('div',{style:{maxHeight:240,overflowY:'auto'}},
          (()=>{
            const rows=[];
            let lastArea=null;
            custPoints.forEach(pt=>{
              if((pt.area||'')!==lastArea){
                lastArea=pt.area||'';
                if(lastArea){
                  const areaName=lastArea;
                  const areaPts=custPoints.filter(x=>x.area===areaName);
                  const areaChecked=areaNames.includes(areaName);
                  rows.push(h('div',{key:'a'+areaName,onClick:()=>toggleArea(areaName),
                    style:{display:'grid',gridTemplateColumns:'auto 1fr auto',alignItems:'center',gap:10,
                      padding:'7px 12px',fontSize:12,fontWeight:700,
                      color:'var(--pri3)',background:areaChecked?'#EAF3DE':'#f5fbf5',
                      borderBottom:'1px solid var(--bd)',letterSpacing:.3,cursor:'pointer'}
                  },
                    h('input',{type:'checkbox',checked:areaChecked,onClick:e=>e.stopPropagation(),onChange:e=>{e.stopPropagation();toggleArea(areaName);},
                      style:{cursor:'pointer',accentColor:'var(--pri)',width:15,height:15}
                    }),
                    h('span',null,(areaChecked?'✓ ':'')+'Khu vực '+areaName),
                    h('span',{style:{fontSize:11,color:'var(--tx2)',fontWeight:500}},areaPts.length+' điểm')
                  ));
                }
              }
              const checked=effectivePointKeys.includes(quotePointSelectionKey(pt));
              const inheritedFromArea=pt.area&&areaNames.includes(pt.area);
              rows.push(h('div',{key:quotePointSelectionKey(pt),onClick:()=>togglePoint(pt),
                style:{display:'grid',gridTemplateColumns:'auto 1fr auto',
                  alignItems:'center',gap:10,
                  padding:'7px 12px 7px '+(lastArea?'22px':'12px'),
                  background:checked?'#f0faf0':'#fff',
                  borderBottom:'1px solid var(--bd)',
                  transition:'background .12s',cursor:'pointer'}
              },
                h('input',{type:'checkbox',checked,onClick:e=>e.stopPropagation(),onChange:e=>{e.stopPropagation();togglePoint(pt);},
                  title:inheritedFromArea?'Bấm để chuyển từ chọn cả khu vực sang chỉ chọn địa điểm này':'Chọn địa điểm này',
                  style:{cursor:'pointer',accentColor:'var(--pri)',width:15,height:15,flexShrink:0}
                }),
                h('span',{style:{fontSize:13,color:'var(--tx)'}},(checked?'✓ ':'')+pt.name),
                pt.area&&h('span',{style:{fontSize:11,color:'var(--tx2)',background:'var(--bg2)',
                  padding:'1px 7px',borderRadius:10,whiteSpace:'nowrap'}},pt.area)
              ));
            });
            return rows;
          })()
        ),
        // Footer đóng
        h('div',{style:{padding:'6px 12px',background:'var(--bg2)',borderTop:'1px solid var(--bd)',
          display:'flex',justifyContent:'space-between',alignItems:'center'}},
          h('span',{style:{fontSize:12,color:'var(--tx2)'}},
            effectivePointKeys.length?effectivePointKeys.length+'/'+custPoints.length+' điểm áp dụng':'Chưa chọn khu vực / địa điểm nào'
          ),
          h('button',{onClick:()=>setOpen(false),
            style:{fontSize:12,padding:'3px 12px',background:'var(--pri)',color:'#fff',
              border:'none',borderRadius:'var(--r)',cursor:'pointer'}
          },'Xong')
        )
      )
    )
  );
}

function QuoteForm({quote,quotes,customers,products,currentUser,onSave,onClose,preselectedCustomerId}){
  const today=new Date().toISOString().slice(0,10);
  const toInput=s=>{if(!s)return'';const[d,m,y]=s.split('/');return y+'-'+m+'-'+d;};
  const fromInput=s=>{if(!s)return'';const[y,m,d]=s.split('-');return d+'/'+m+'/'+y;};
  const normalizeLineOrders=lines=>(lines||[]).map((line,index)=>({...line,sortOrder:Math.max(1,Number(line.sortOrder)||index+1)}));
  const sortLines=lines=>normalizeLineOrders(lines).sort((a,b)=>Number(a.sortOrder)-Number(b.sortOrder));
  const preselectedCustomer=customers.find(customer=>customer.id===preselectedCustomerId);
  // pointIds: mảng id các địa điểm được chọn, areaNames: khu vực áp dụng tự động cho điểm mới
  const initPointIds=quote?(quote.pointIds||(quote.pointId?[quote.pointId]:[])):[];
  const initialCustomer=customers.find(customer=>customer.id===(quote?.customerId||preselectedCustomerId));
  const initialPoints=initialCustomer?.points||[];
  const initPointKeys=quote?.pointKeys?.length?[...quote.pointKeys]:
    (quote?.areaNames||[]).length?[]:
    quote?.pointNames?.length?initialPoints.filter(point=>quote.pointNames.some(name=>String(name||'').trim().toUpperCase()===String(point.name||'').trim().toUpperCase())).map(quotePointSelectionKey):
    initialPoints.filter(point=>initPointIds.includes(point.id)).map(quotePointSelectionKey);
  const initAreaNames=quote?(quote.areaNames||[]):[];
  const[f,sf]=useState(quote?{...quote,lines:normalizeLineOrders(quote.lines),dateFromI:toInput(quote.dateFrom),dateToI:toInput(quote.dateTo),pointIds:initPointIds,pointKeys:initPointKeys,areaNames:initAreaNames}:{customerId:preselectedCustomerId||'',customer:preselectedCustomer?.name||'',dateFromI:today,dateToI:'',status:'draft',note:'',lines:[],pointIds:[],pointKeys:[],areaNames:[]});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const setCust=cid=>{const c=customers.find(x=>x.id===cid);sf(p=>({...p,customerId:cid,customer:c?c.name:'',pointIds:[],pointKeys:[],areaNames:[]}));};
  const selCust=customers.find(x=>x.id===f.customerId);
  const previewId=quote?.id||(selCust?nextQuoteId(quotes,selCust,fromInput(f.dateFromI)): 'BG-MÃ_KH-YYYYMM-01');
  const custPoints=(selCust?.points||[]).sort((a,b)=>(a.area||'').localeCompare(b.area||'','vi')||(a.name||'').localeCompare(b.name||'','vi'));
  const sampleQuotes=(quotes||[]).filter(q=>!quote||q.id!==quote.id);
  const applySample=id=>{
    const q=(quotes||[]).find(x=>x.id===id);
    if(!q)return;
    sf(p=>{
      const hasCustomer=!!p.customerId;
      const sampleCustomer=customers.find(customer=>customer.id===(q.customerId||''));
      const samplePoints=sampleCustomer?.points||[];
      const samplePointKeys=q.pointKeys?.length?[...q.pointKeys]:
        (q.areaNames||[]).length?[]:
        q.pointNames?.length?samplePoints.filter(point=>q.pointNames.some(name=>String(name||'').trim().toUpperCase()===String(point.name||'').trim().toUpperCase())).map(quotePointSelectionKey):
        samplePoints.filter(point=>(q.pointIds||(q.pointId?[q.pointId]:[])).includes(point.id)).map(quotePointSelectionKey);
      return {...p,
        customerId:hasCustomer?p.customerId:(q.customerId||''),
        customer:hasCustomer?p.customer:(q.customer||''),
        pointIds:hasCustomer?p.pointIds:[...(q.pointIds||(q.pointId?[q.pointId]:[]))],
        pointKeys:hasCustomer?(p.pointKeys||[]):samplePointKeys,
        areaNames:hasCustomer?(p.areaNames||[]):[...(q.areaNames||[])],
        note:q.note||p.note||'',
        lines:normalizeLineOrders(q.lines).map(l=>({...l,id:uid()}))
      };
    });
  };
  const togglePoint=point=>sf(p=>{
    const key=quotePointSelectionKey(point);
    if(!key)return p;
    const selectedAreas=p.areaNames||[];
    if(point.area&&selectedAreas.includes(point.area)){
      const outsideAreaKeys=(p.pointKeys||[]).filter(pointKey=>{
        const selectedPoint=custPoints.find(item=>quotePointSelectionKey(item)===pointKey);
        return !selectedPoint||selectedPoint.area!==point.area;
      });
      return {...p,areaNames:selectedAreas.filter(area=>area!==point.area),pointKeys:[...new Set([...outsideAreaKeys,key])]};
    }
    return {...p,pointKeys:(p.pointKeys||[]).includes(key)?(p.pointKeys||[]).filter(x=>x!==key):[...(p.pointKeys||[]),key]};
  });
  const toggleArea=area=>sf(p=>({...p,areaNames:(p.areaNames||[]).includes(area)?(p.areaNames||[]).filter(x=>x!==area):[...(p.areaNames||[]),area]}));
  const clearPointSelection=()=>sf(p=>({...p,pointIds:[],pointKeys:[],areaNames:[]}));
  const effectivePointKeys=()=>[...new Set([...(f.pointKeys||[]),...custPoints.filter(p=>p.area&&(f.areaNames||[]).includes(p.area)).map(quotePointSelectionKey)])];
  const toggleAll=()=>sf(p=>({...p,pointKeys:effectivePointKeys().length===custPoints.length?[]:custPoints.map(quotePointSelectionKey),pointIds:[],areaNames:effectivePointKeys().length===custPoints.length?[]:(p.areaNames||[])}));
  const addLine=()=>sf(p=>({...p,lines:[...p.lines,{id:uid(),sortOrder:Math.max(0,...p.lines.map(line=>Number(line.sortOrder)||0))+1,productId:'',productName:'',unit:'',price:0}]}));
  const updLine=(id,data)=>sf(p=>({...p,lines:p.lines.map(l=>l.id===id?data:l)}));
  const delLine=id=>sf(p=>({...p,lines:p.lines.filter(l=>l.id!==id)}));
  const submit=()=>{
    if(!f.customerId){window.showToast('Vui lòng chọn khách hàng!','warn');return;}
    if(effectivePointKeys().length===0){window.showToast('Chọn ít nhất 1 khu vực hoặc địa điểm áp dụng!','warn');return;}
    if(f.lines.length===0){window.showToast('Vui lòng thêm ít nhất 1 sản phẩm!','warn');return;}
    if(f.lines.some(line=>!line.productId)){window.showToast('Vui lòng chọn sản phẩm từ danh sách tìm kiếm!','warn');return;}
    // Tương thích ngược: lưu cả pointId (điểm đầu tiên) lẫn pointIds
    const effKeys=effectivePointKeys();
    const selectedPoints=custPoints.filter(point=>effKeys.includes(quotePointSelectionKey(point)));
    const explicitPoints=custPoints.filter(point=>(f.pointKeys||[]).includes(quotePointSelectionKey(point)));
    const firstPt=selectedPoints[0];
    onSave({...f,
      pointId:firstPt?.id||'',pointName:firstPt?.name||'',
      pointIds:[...new Set(explicitPoints.map(point=>point.id).filter(Boolean))],
      pointKeys:f.pointKeys||[],
      areaNames:f.areaNames||[],
      pointNames:selectedPoints.map(point=>point.name),
      lines:sortLines(f.lines),
      dateFrom:fromInput(f.dateFromI),dateTo:fromInput(f.dateToI),
      createdBy:quote?quote.createdBy:currentUser.name,
      createdAt:quote?quote.createdAt:fmtDate(),
      updatedBy:currentUser.name,updatedAt:fmtDT()
    });
  };
  return h(Modal,{title:quote?'Sửa báo giá '+quote.id:'Tạo báo giá mới',onClose,lg:true},
    sampleQuotes.length>0&&h(F,{label:'Chọn báo giá mẫu'},h('select',{value:'',onChange:e=>applySample(e.target.value)},
      h('option',{value:''},'— Chọn báo giá cũ để lấy mẫu —'),
      sampleQuotes.map(q=>h('option',{key:q.id,value:q.id},q.id+' - '+(q.customer||'')+' - '+(q.dateFrom||'')+(q.dateTo?' đến '+q.dateTo:'')))
    )),
    h('div',{className:'g2'},
      h(F,{label:'Khách hàng *'},h('select',{value:f.customerId,onChange:e=>setCust(e.target.value)},
        h('option',{value:''},'— Chọn khách hàng —'),customers.map(c=>h('option',{key:c.id,value:c.id},c.name))
      )),
      h(F,{label:'Trạng thái'},h('select',{value:f.status,onChange:e=>s('status',e.target.value)},
        [['draft','Nháp'],['sent','Đã gửi'],['approved','Đã duyệt'],['expired','Hết hạn'],['cancelled','Hủy']].map(([v,l])=>h('option',{key:v,value:v},l))
      )),
    ),
    h(F,{label:quote?'Mã báo giá':'Mã báo giá dự kiến'},h('input',{value:previewId,readOnly:true,style:{background:'var(--bg2)',fontWeight:600,color:'var(--pri3)'}})),
    f.customerId&&h(PointMultiSelect,{custPoints,pointKeys:f.pointKeys||[],areaNames:f.areaNames||[],togglePoint,toggleArea,toggleAll,clearAll:clearPointSelection}),
    h('div',{className:'g2'},
      h(F,{label:'Ngày bắt đầu'},h('input',{type:'date',value:f.dateFromI,onChange:e=>s('dateFromI',e.target.value)})),
      h(F,{label:'Ngày kết thúc'},h('input',{type:'date',value:f.dateToI,onChange:e=>s('dateToI',e.target.value)})),
    ),
    h('div',{className:'divider'}),
    h('div',{style:{fontWeight:500,fontSize:13,marginBottom:8,color:'var(--pri3)'}},'Bảng giá sản phẩm'),
    h('div',{style:{display:'grid',gridTemplateColumns:'64px 2fr 1fr 1fr auto',gap:6,marginBottom:4}},
      h('span',{style:{fontSize:11,color:'var(--tx2)',fontWeight:500,textAlign:'center'}},'STT'),
      h('span',{style:{fontSize:11,color:'var(--tx2)',fontWeight:500}},'Sản phẩm'),
      h('span',{style:{fontSize:11,color:'var(--tx2)',fontWeight:500}},'Đơn vị'),
      h('span',{style:{fontSize:11,color:'var(--tx2)',fontWeight:500}},'Đơn giá (đ)'),
      h('span',null,'')
    ),
    sortLines(f.lines).map(l=>h(QuoteLineRow,{key:l.id,line:l,products,onChange:data=>updLine(l.id,data),onRemove:()=>delLine(l.id)})),
    h('button',{onClick:addLine,style:{fontSize:12,padding:'5px 12px',marginBottom:8}},h('i',{className:'ti ti-plus',style:{fontSize:13,marginRight:4}}),'Thêm sản phẩm'),
    h(F,{label:'Ghi chú'},h('textarea',{value:f.note,onChange:e=>s('note',e.target.value),rows:2})),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu báo giá'))
  );
}
function QuotesTab({quotes,setQuotes,customers,products,currentUser}){
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[q,sq]=useState('');const[filter,sf]=useState('all');const[preselectedCustomerId,setPreselectedCustomerId]=useState('');
  const[filterMonth,setFilterMonth]=useState('');const[filterCustomer,setFilterCustomer]=useState('');
  const save=d=>{
    if(edit)setQuotes(p=>p.map(x=>x.id===edit.id?{...d,id:edit.id}:x));
    else setQuotes(prev=>{const customer=customers.find(c=>c.id===d.customerId)||{id:d.customerId,name:d.customer};const id=nextQuoteId(prev,customer,d.dateFrom);return[...prev,{...d,id}];});
    sm(null);se(null);setPreselectedCustomerId('');
  };
  const del=id=>window.scfConfirm('Bạn có chắc muốn xóa báo giá này?','Xóa báo giá',true).then(ok=>ok&&setQuotes(p=>p.filter(x=>x.id!==id)));
  const sts=[['all','Tất cả'],['draft','Nháp'],['sent','Đã gửi'],['approved','Đã duyệt'],['expired','Hết hạn']];
  const toIsoDate=value=>{
    const s=String(value||'').trim();
    const iso=s.match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    if(iso)return iso[1]+'-'+iso[2].padStart(2,'0')+'-'+iso[3].padStart(2,'0');
    const vn=s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
    return vn?vn[3]+'-'+vn[2].padStart(2,'0')+'-'+vn[1].padStart(2,'0'):'';
  };
  const isInMonth=(quote,month)=>{
    if(!month)return true;
    const [year,mon]=month.split('-').map(Number);
    if(!year||!mon)return true;
    const start=toIsoDate(quote.dateFrom);
    const end=toIsoDate(quote.dateTo)||'9999-12-31';
    const monthStart=month+'-01';
    const monthEnd=year+'-'+String(mon).padStart(2,'0')+'-'+String(new Date(year,mon,0).getDate()).padStart(2,'0');
    return !!start&&start<=monthEnd&&end>=monthStart;
  };
  const selectedCustomer=customers.find(c=>c.id===filterCustomer);
  const scopedQuotes=quotes.filter(x=>isInMonth(x,filterMonth)&&(!filterCustomer||x.customerId===filterCustomer||x.customer===selectedCustomer?.name));
  const missingMonth=filterMonth||new Date().toISOString().slice(0,7);
  const customersWithoutQuote=customers.filter(customer=>!quotes.some(quote=>isInMonth(quote,missingMonth)&&(quote.customerId===customer.id||quote.customer===customer.name))).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'vi'));
  const list=scopedQuotes.filter(x=>(filter==='all'||x.status===filter)&&(!q||String(x.customer||'').toLowerCase().includes(q.toLowerCase())||String(x.id||'').toLowerCase().includes(q.toLowerCase())));
  const statusLabels={draft:'Nháp',sent:'Đã gửi',approved:'Đã duyệt',expired:'Hết hạn',cancelled:'Hủy'};
  const quoteExportRows=list.flatMap(quote=>{
    const rows=quote.lines&&quote.lines.length?quote.lines:[{}];
    const customer=customers.find(c=>c.id===quote.customerId);
    const pointNames=(quote.pointNames&&quote.pointNames.length?quote.pointNames:(customer?.points||[]).filter(p=>(quote.pointIds||[]).includes(p.id)).map(p=>p.name)).join(' | ');
    return rows.map(line=>({
      quoteId:quote.id,customerId:quote.customerId||'',customer:quote.customer||'',pointNames,areaNames:(quote.areaNames||[]).join(' | '),
      dateFrom:quote.dateFrom||'',dateTo:quote.dateTo||'',status:statusLabels[quote.status]||quote.status||'',productId:line.productId||'',productName:line.productName||'',unit:line.unit||'',price:numFmt(line.price),note:quote.note||'',createdBy:quote.createdBy||'',createdAt:quote.createdAt||''
    }));
  });
  const exportCols=[['quoteId','Mã BG'],['customerId','Mã KH'],['customer','Khách hàng'],['pointNames','Địa điểm áp dụng'],['areaNames','Khu vực áp dụng'],['dateFrom','Ngày bắt đầu'],['dateTo','Ngày kết thúc'],['status','Trạng thái'],['productId','Mã SP'],['productName','Sản phẩm'],['unit','ĐVT'],['price','Đơn giá'],['note','Ghi chú'],['createdBy','Người tạo'],['createdAt','Ngày tạo']];
  const importQuotes=async rows=>{
    const text=v=>String(v??'').trim();
    const norm=v=>text(v).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/\s+/g,' ');
    const money=v=>typeof v==='number'?(Number.isFinite(v)?v:0):(Number(text(v).replace(/[^0-9-]/g,''))||0);
    const val=(r,names)=>{for(const name of names){if(r[name]!==undefined&&r[name]!==null&&text(r[name])!=='')return r[name];}return'';};
    const dateText=v=>{
      if(v instanceof Date&&!isNaN(v))return String(v.getDate()).padStart(2,'0')+'/'+String(v.getMonth()+1).padStart(2,'0')+'/'+v.getFullYear();
      const s=text(v);if(!s)return'';
      const iso=s.match(/^(\d{4})[-\/]([01]?\d)[-\/]([0-3]?\d)/);if(iso)return iso[3].padStart(2,'0')+'/'+iso[2].padStart(2,'0')+'/'+iso[1];
      const vn=s.match(/^([0-3]?\d)[-\/]([01]?\d)[-\/](\d{4})/);if(vn)return vn[1].padStart(2,'0')+'/'+vn[2].padStart(2,'0')+'/'+vn[3];
      return s;
    };
    const statusValue=v=>{
      const n=norm(v);if(!n)return'draft';
      if(n.includes('da duyet')||n==='approved')return'approved';
      if(n.includes('da gui')||n==='sent')return'sent';
      if(n.includes('het han')||n==='expired')return'expired';
      if(n.includes('huy')||n==='cancelled')return'cancelled';
      return'draft';
    };
    const groups=new Map();
    (rows||[]).forEach((row,index)=>{
      const code=text(val(row,['Mã BG','Mã báo giá','Ma BG','quoteId','id']));
      const customerKey=text(val(row,['Mã KH','Ma KH','customerId','Khách hàng','Tên khách hàng','customer']));
      const dateKey=dateText(val(row,['Ngày bắt đầu','Từ ngày','dateFrom']))||fmtDate();
      const key=code||'__AUTO_'+norm(customerKey)+'_'+quoteMonthKey(dateKey);
      if(!groups.has(key))groups.set(key,{code,rows:[]});
      groups.get(key).rows.push(row);
    });
    const imported=[];const issues=[];
    for(const group of groups.values()){
      const first=group.rows[0]||{};
      const customerRef=text(val(first,['Mã KH','Ma KH','customerId']));
      const customerName=text(val(first,['Khách hàng','Tên khách hàng','customer']));
      const customer=customers.find(c=>norm(c.id)===norm(customerRef)||norm(c.code)===norm(customerRef))||customers.find(c=>norm(c.name)===norm(customerName||customerRef));
      if(!customer){issues.push((group.code||'Dòng mới')+': không tìm thấy khách hàng '+(customerName||customerRef||'trống'));continue;}
      const lines=[];
      group.rows.forEach((row,rowIndex)=>{
        const productRef=text(val(row,['Mã SP','Mã sản phẩm','Ma SP','productId']));
        const productName=text(val(row,['Sản phẩm','Tên sản phẩm','productName']));
        const product=products.find(p=>norm(p.id)===norm(productRef)||norm(p.code)===norm(productRef))||products.find(p=>norm(p.name)===norm(productName||productRef));
        if(!product){issues.push((group.code||'Dòng mới')+' dòng '+(rowIndex+1)+': không tìm thấy sản phẩm '+(productName||productRef||'trống'));return;}
        lines.push({id:uid(),productId:product.id,productName:product.name,unit:product.unit||text(val(row,['ĐVT','Đơn vị','unit'])),price:money(val(row,['Đơn giá','Giá','price']))});
      });
      if(!lines.length){issues.push((group.code||'Dòng mới')+': không có sản phẩm hợp lệ');continue;}
      const splitList=v=>text(v).split(/[|;,]+/).map(x=>x.trim()).filter(Boolean);
      const requestedPoints=splitList(val(first,['Địa điểm áp dụng','Địa điểm','pointNames']));
      const requestedAreas=splitList(val(first,['Khu vực áp dụng','Khu vực','areaNames']));
      const customerPoints=customer.points||[];
      const pointIds=requestedPoints.length?customerPoints.filter(p=>requestedPoints.some(name=>norm(name)===norm(p.name)||norm(name)===norm(p.id))).map(p=>p.id):customerPoints.map(p=>p.id);
      const areaNames=requestedAreas.length?requestedAreas:[];
      const dateFrom=dateText(val(first,['Ngày bắt đầu','Từ ngày','dateFrom']))||fmtDate();
      const id=group.code||nextQuoteId([...quotes,...imported],customer,dateFrom);
      const existing=quotes.find(x=>x.id===id);
      imported.push({
        ...(existing||{}),id,customerId:customer.id,customer:customer.name,pointIds,pointId:pointIds[0]||'',pointNames:customerPoints.filter(p=>pointIds.includes(p.id)).map(p=>p.name),areaNames,
        dateFrom,dateTo:dateText(val(first,['Ngày kết thúc','Đến ngày','dateTo'])),status:statusValue(val(first,['Trạng thái','status'])),note:text(val(first,['Ghi chú','note'])),lines,
        createdBy:existing?.createdBy||text(val(first,['Người tạo','createdBy']))||currentUser.name,createdAt:existing?.createdAt||dateText(val(first,['Ngày tạo','createdAt']))||fmtDate(),updatedBy:currentUser.name,updatedAt:fmtDT()
      });
    }
    if(!imported.length){window.showToast('Không có báo giá hợp lệ để nhập.'+(issues.length?' Kiểm tra khách hàng và sản phẩm.':''),'error',6000);return;}
    if(issues.length){
      const ok=await window.scfConfirm('Có '+issues.length+' lỗi dữ liệu sẽ bị bỏ qua. Vẫn nhập '+imported.length+' báo giá hợp lệ?\n\n'+issues.slice(0,8).join('\n'),'Kiểm tra dữ liệu nhập');
      if(!ok)return;
    }
    setQuotes(prev=>{
      const next=[...prev];
      imported.forEach(quote=>{const index=next.findIndex(x=>x.id===quote.id);if(index>=0)next[index]=quote;else next.push(quote);});
      return next;
    });
    window.showToast('Đã nhập '+imported.length+' báo giá'+(issues.length?' • bỏ qua '+issues.length+' lỗi':''),'success',6000);
  };
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-file-invoice',style:{fontSize:20}}),'Báo giá'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,marginBottom:'1rem',flexWrap:'nowrap'}},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,flex:'1 1 auto',minWidth:0}},
      h('div',{style:{display:'flex',gap:5,flexWrap:'nowrap',whiteSpace:'nowrap'}},sts.map(([v,l])=>h('button',{key:v,className:'pill'+(filter===v?' on':''),onClick:()=>sf(v)},l+' ('+( v==='all'?scopedQuotes.length:scopedQuotes.filter(x=>x.status===v).length)+')'))),
      h('div',{style:{display:'flex',gap:6,flexWrap:'nowrap',alignItems:'center'}},
        h('div',{style:{width:210,flex:'0 0 210px'}},h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm báo giá...'})),
        h('input',{type:'month',value:filterMonth,onChange:e=>setFilterMonth(e.target.value),title:'Lọc theo tháng áp dụng',style:{width:130,flex:'0 0 130px',fontSize:13},'aria-label':'Lọc theo tháng'}),
        h('select',{value:filterCustomer,onChange:e=>setFilterCustomer(e.target.value),title:'Lọc theo khách hàng',style:{width:225,flex:'0 0 225px',fontSize:13},'aria-label':'Lọc theo khách hàng'},
          h('option',{value:''},'Tất cả khách hàng'),
          customers.slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'vi')).map(c=>h('option',{key:c.id,value:c.id},c.name))
        ),
        (filterMonth||filterCustomer)&&h('button',{onClick:()=>{setFilterMonth('');setFilterCustomer('');},title:'Xóa bộ lọc',style:{padding:'6px 9px'}},h('i',{className:'ti ti-x',style:{fontSize:15}})),
      ),
      ),
      h('div',{style:{display:'flex',gap:6,justifyContent:'flex-end',flexWrap:'nowrap',whiteSpace:'nowrap',flex:'0 0 auto'}},
        h('button',{onClick:()=>sm('missing'),title:'Khách hàng chưa có báo giá trong tháng',style:{padding:'7px 10px',fontSize:12}},h('i',{className:'ti ti-users',style:{fontSize:14}}),' KH thiếu BG ('+customersWithoutQuote.length+')'),
        h(ExportBtn,{onClick:()=>xlsxExport(quoteExportRows,exportCols,'Bao_gia')}),
        h(ImportBtn,{onFile:importQuotes}),
        h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Tạo báo giá'})
      )
    ),
    h(TableWrap,{cols:['Mã BG','Khách hàng','Bắt đầu','Kết thúc','Số SP','Ghi chú','Người tạo','Trạng thái',''],empty:'Chưa có báo giá nào.',
      rows:list.map(x=>h('tr',{key:x.id},
        h('td',null,h('span',{style:{color:'var(--pri)',fontWeight:500}},x.id)),
        h('td',null,h('div',{style:{fontWeight:500}},x.customer)),
        h('td',null,x.dateFrom||'—'),h('td',null,x.dateTo||'—'),
        h('td',null,x.lines?x.lines.length:0),
        h('td',null,x.note||'—'),
        h('td',null,h('div',null,x.createdBy),h('div',{style:{fontSize:11,color:'var(--tx2)'}},x.createdAt)),
        h('td',null,h(StatusBadge,{s:x.status})),
        h('td',null,h('div',{style:{display:'flex',gap:2}},
          h('button',{className:'bi',onClick:()=>{se(x);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
          h('button',{className:'bi',onClick:()=>del(x.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
        ))
      ))
    }),
    modal==='missing'&&h(Modal,{title:'Khách hàng chưa có báo giá tháng '+missingMonth,onClose:()=>sm(null)},
      h('div',{style:{fontSize:12,color:'var(--tx2)',marginBottom:10}},customersWithoutQuote.length?'Chọn khách hàng để tạo báo giá mới.':'Tất cả khách hàng đã có báo giá trong tháng này.'),
      customersWithoutQuote.length&&h('div',{style:{maxHeight:360,overflowY:'auto',border:'1px solid var(--bd)',borderRadius:'var(--r)'}},
        customersWithoutQuote.map(customer=>h('div',{key:customer.id,style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,padding:'9px 10px',borderBottom:'1px solid var(--bd)'}},
          h('div',null,h('div',{style:{fontWeight:600,fontSize:13}},customer.name),h('div',{style:{fontSize:11,color:'var(--tx2)'}},customer.code||customer.id||'')),
          h('button',{className:'bp',onClick:()=>{setPreselectedCustomerId(customer.id);se(null);sm('f');},style:{padding:'5px 10px',fontSize:12}},h('i',{className:'ti ti-plus',style:{fontSize:13}}),' Tạo báo giá')
        ))
      ),
      h(Row,null,h('button',{onClick:()=>sm(null)},'Đóng'))
    ),
    modal==='f'&&h(QuoteForm,{quote:edit,quotes,customers,products,currentUser,preselectedCustomerId,onSave:save,onClose:()=>{sm(null);se(null);setPreselectedCustomerId('');}})
  );
}
