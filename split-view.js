// V904: Chia màn hình 2×2 cho Admin/Kế toán trên máy tính.
// Mỗi ô hiện một trang (Đơn hàng, Tổng hợp SX, Báo cáo hóa đơn, Báo cáo công nợ).
// Nút "Liên kết ngày": bật thì đổi ngày ở một ô, các ô khác nhảy theo; tắt thì mỗi ô độc lập.
// Ngày liên kết luôn là NGÀY GIAO. Ô Tổng hợp SX đổi sang NGÀY SX theo lịch sản xuất thật của đơn.
const SCF_SPLIT_PAGES=['delivery','prodsummary','invoicereport','marketsales'];
const SCF_SPLIT_LABELS={delivery:'Đơn hàng',prodsummary:'Tổng hợp SX',invoicereport:'Báo cáo hóa đơn',marketsales:'Báo cáo công nợ'};
const SCF_SPLIT_ICONS={delivery:'ti-truck-delivery',prodsummary:'ti-building-factory-2',invoicereport:'ti-file-invoice',marketsales:'ti-report-money'};
const ScfPaneContext=React.createContext(null);

function scfSplitIso(value){
  const text=String(value||'').trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(text))return text;
  const m=text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m?m[3]+'-'+m[2].padStart(2,'0')+'-'+m[1].padStart(2,'0'):'';
}
function scfSplitAddDays(iso,days){
  const m=String(iso||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return '';
  const d=new Date(Date.UTC(+m[1],+m[2]-1,+m[3]+Number(days||0)));
  return d.toISOString().slice(0,10);
}
function scfSplitShort(iso){const m=String(iso||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m?m[3]+'/'+m[2]+'/'+m[1]:'—';}
function scfSplitToday(now=Date.now()){
  try{return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);}
  catch{return new Date(now).toISOString().slice(0,10);}
}
// Chỉ số ngày giao ↔ ngày SX dựng từ chính các dòng đơn (cách B).
function scfSplitDateIndex(orders){
  const deliveryToProd=new Map(),prodToDelivery=new Map();
  const bump=(map,a,b)=>{if(!a||!b)return;let inner=map.get(a);if(!inner)map.set(a,inner=new Map());inner.set(b,(inner.get(b)||0)+1);};
  for(const order of orders||[]){
    if(!order||['cancelled','failed'].includes(String(order.status||'')))continue;
    const delivery=scfSplitIso(order.deliveryDate);if(!delivery)continue;
    const lines=(order.lines||[]).length?order.lines:[{}];
    for(const line of lines){const prod=scfSplitIso(line?.prodDate||order.prodDate);bump(deliveryToProd,delivery,prod);bump(prodToDelivery,prod,delivery);}
  }
  return{deliveryToProd,prodToDelivery};
}
function scfSplitPick(counts){
  if(!counts||!counts.size)return '';
  return [...counts.entries()].sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0]))[0][0];
}
// Ngày giao → ngày SX: ngày SX có nhiều dòng nhất; chưa có đơn thì lấy ngày trước.
function scfSplitProdDateFor(index,deliveryIso){return scfSplitPick(index?.deliveryToProd?.get(deliveryIso))||scfSplitAddDays(deliveryIso,-1);}
// Ngày SX → ngày giao: ngày giao có nhiều dòng nhất; chưa có đơn thì lấy ngày sau.
function scfSplitDeliveryDateFor(index,prodIso){return scfSplitPick(index?.prodToDelivery?.get(prodIso))||scfSplitAddDays(prodIso,1);}
function scfSplitPaneDate(kind,deliveryIso,index){return kind==='prod'?scfSplitProdDateFor(index,deliveryIso):deliveryIso;}

// Dùng trong từng trang. Ngoài chế độ chia màn hình hook không làm gì.
// kind: 'delivery' | 'prod' | 'invoice' | 'debt'; currentIso: ngày đang lọc (YYYY-MM-DD) hoặc '' khi không lọc một ngày.
function useScfSplitDate(kind,currentIso,apply){
  const ctx=React.useContext(ScfPaneContext);
  const applied=React.useRef(currentIso);
  const applyRef=React.useRef(apply);applyRef.current=apply;
  const currentRef=React.useRef(currentIso);currentRef.current=currentIso;
  // Ngày đang hướng tới: gồm cả lần đổi đã gửi nhưng trang chưa vẽ lại (bấm « » nhanh liên tiếp).
  const expected=React.useRef(currentIso),lastSeen=React.useRef(currentIso);
  if(currentIso!==lastSeen.current){lastSeen.current=currentIso;expected.current=currentIso;}
  const linkSeq=ctx&&ctx.linked&&ctx.link?ctx.link.seq:0;
  // Nút « » trên đầu ô: cộng dồn số ngày, bấm nhanh nhiều lần không bị mất lần nào.
  const commandTotal=ctx&&ctx.command?ctx.command.total:0;
  const consumed=React.useRef(commandTotal);
  const mounted=React.useRef(false);
  React.useEffect(()=>{
    if(!ctx||!ctx.linked||!ctx.link||ctx.link.origin===ctx.paneId)return;
    const target=ctx.toPane(kind,ctx.link.date);
    if(target&&target!==expected.current){applied.current=target;expected.current=target;applyRef.current(target);}
  },[linkSeq]);
  React.useEffect(()=>{
    const diff=commandTotal-consumed.current;consumed.current=commandTotal;
    if(!ctx||!diff)return;
    const base=expected.current||ctx.toPane(kind,ctx.link?.date||scfSplitToday());
    const target=scfSplitAddDays(base,diff);
    if(target){expected.current=target;applyRef.current(target);}
  },[commandTotal]);
  React.useEffect(()=>{
    if(!ctx)return;
    ctx.report(ctx.paneId,kind,currentIso);
    // Lần vẽ đầu chỉ báo ngày, không phát: ngày mặc định của trang không được kéo các ô khác.
    if(!mounted.current){mounted.current=true;return;}
    if(!currentIso||currentIso===applied.current)return;
    applied.current=currentIso;
    ctx.publish(ctx.paneId,kind,currentIso);
  },[currentIso,!!ctx]);
}

function scfSplitStorageKey(user){return 'scf_split_view_'+String(user?.id||'');}
function scfSplitReadLayout(user,allowed){
  let saved=null;try{saved=JSON.parse(localStorage.getItem(scfSplitStorageKey(user))||'null');}catch{}
  const fallback=SCF_SPLIT_PAGES.filter(p=>allowed.includes(p));
  const panes=[0,1,2,3].map(i=>{const p=saved?.panes?.[i];return allowed.includes(p)?p:(fallback[i]||fallback[0]||'');});
  return{panes,linked:saved?.linked!==false};
}

function ScfSplitView({currentUser,orders,renderPage,paneClassName,onPaneClickCapture,onExit,onPanesChange}){
  const allowed=SCF_SPLIT_PAGES.filter(p=>canAccess(currentUser?.role,p,currentUser?.permissions,employeeDepartments(currentUser)));
  const initial=React.useMemo(()=>scfSplitReadLayout(currentUser,allowed),[currentUser?.id]);
  const[panes,setPanes]=React.useState(initial.panes);
  const[linked,setLinked]=React.useState(initial.linked);
  const[link,setLink]=React.useState(()=>({date:scfSplitToday(),origin:'init',seq:1}));
  const[commands,setCommands]=React.useState({});
  const[reports,setReports]=React.useState({});
  const[maximized,setMaximized]=React.useState(-1);
  const[saved,setSaved]=React.useState('');
  const index=React.useMemo(()=>scfSplitDateIndex(orders),[orders]);
  const indexRef=React.useRef(index);indexRef.current=index;
  const lastActive=React.useRef({pane:'init',date:link.date});
  const linkedRef=React.useRef(linked);linkedRef.current=linked;
  React.useEffect(()=>{onPanesChange?.(panes);},[panes.join('|')]);
  const toDelivery=(kind,iso)=>kind==='prod'?scfSplitDeliveryDateFor(indexRef.current,iso):iso;
  const publish=(paneId,kind,iso)=>{
    const date=toDelivery(kind,iso);if(!date)return;
    lastActive.current={pane:paneId,date};
    if(linkedRef.current)setLink(previous=>({date,origin:paneId,seq:previous.seq+1}));
  };
  const report=(paneId,kind,iso)=>setReports(previous=>previous[paneId]?.kind===kind&&previous[paneId]?.iso===iso?previous:{...previous,[paneId]:{kind,iso}});
  const toggleLinked=()=>{
    const next=!linked;setLinked(next);
    if(next){const{pane,date}=lastActive.current;setLink(previous=>({date:date||previous.date,origin:pane,seq:previous.seq+1}));}
  };
  const shift=(paneId,delta)=>setCommands(previous=>({...previous,[paneId]:{total:(previous[paneId]?.total||0)+delta}}));
  const choose=(i,value)=>setPanes(previous=>previous.map((p,k)=>k===i?value:p));
  const save=()=>{try{localStorage.setItem(scfSplitStorageKey(currentUser),JSON.stringify({panes,linked}));setSaved('Đã lưu bố cục');setTimeout(()=>setSaved(''),2500);}catch{window.showToast('Không lưu được bố cục trên máy này.','warn');}};
  const dateLabel=(page,paneId)=>{
    const r=reports[paneId];
    if(!r||!r.iso)return page==='prodsummary'?'Ngày SX —':'Chưa lọc 1 ngày';
    return(r.kind==='prod'?'Ngày SX ':r.kind==='debt'?'Đến ':'Ngày giao ')+scfSplitShort(r.iso);
  };
  const visible=maximized>=0?[maximized]:[0,1,2,3];
  return h('div',{className:'scf-split'+(maximized>=0?' scf-split-max':'')},
    h('div',{className:'scf-split-bar'},
      h('i',{className:'ti ti-layout-grid','aria-hidden':true}),h('b',null,'Chia màn hình 2×2'),
      h('button',{type:'button',role:'switch','aria-checked':linked,className:'scf-split-link'+(linked?' on':''),onClick:toggleLinked,title:linked?'Đang liên kết: đổi ngày một ô, các ô khác nhảy theo':'Đang độc lập: mỗi ô giữ ngày riêng'},
        h('i',{className:'ti '+(linked?'ti-link':'ti-unlink'),'aria-hidden':true}),'Liên kết ngày: '+(linked?'bật':'tắt')),
      linked&&h('span',{className:'scf-split-hint'},'Ngày giao '+scfSplitShort(link.date)+' · Tổng hợp SX theo lịch sản xuất'),
      h('span',{style:{flex:1}}),
      saved&&h('span',{className:'scf-split-hint',role:'status'},saved),
      h('button',{type:'button',className:'scf-split-btn',onClick:save},h('i',{className:'ti ti-device-floppy','aria-hidden':true}),'Lưu bố cục'),
      h('button',{type:'button',className:'scf-split-btn',onClick:onExit},h('i',{className:'ti ti-x','aria-hidden':true}),'Thoát chia')
    ),
    h('div',{className:'scf-split-grid'},
      panes.map((page,i)=>{
        const paneId='p'+i;
        if(!visible.includes(i))return null;
        const context={paneId,page,linked,link,command:commands[paneId],toPane:(kind,date)=>scfSplitPaneDate(kind,date,indexRef.current),publish,report};
        return h('section',{key:paneId,className:'scf-split-pane','aria-label':'Ô '+(i+1)+': '+(SCF_SPLIT_LABELS[page]||'')},
          h('div',{className:'scf-split-head'},
            h('i',{className:'ti '+(SCF_SPLIT_ICONS[page]||'ti-layout'),'aria-hidden':true}),
            h('select',{'aria-label':'Chọn trang cho ô '+(i+1),value:page,onChange:e=>choose(i,e.target.value)},allowed.map(p=>h('option',{key:p,value:p},SCF_SPLIT_LABELS[p]))),
            linked&&h('i',{className:'ti ti-link scf-split-chain',title:'Ô này đang liên kết ngày'}),
            h('span',{className:'scf-split-date'},
              h('button',{type:'button','aria-label':'Ngày trước',onClick:()=>shift(paneId,-1)},'«'),
              h('span',null,dateLabel(page,paneId)),
              h('button',{type:'button','aria-label':'Ngày sau',onClick:()=>shift(paneId,1)},'»')),
            h('button',{type:'button',className:'scf-split-icon',title:maximized===i?'Thu nhỏ về 2×2':'Phóng to ô này','aria-label':maximized===i?'Thu nhỏ':'Phóng to',onClick:()=>setMaximized(maximized===i?-1:i)},h('i',{className:'ti '+(maximized===i?'ti-arrows-minimize':'ti-arrows-maximize')}))
          ),
          h('div',{className:'scf-split-body '+(paneClassName?.(page)||''),onClickCapture:event=>onPaneClickCapture?.(event,page)},
            h(ScfPaneContext.Provider,{value:context},renderPage(page,paneId)))
        );
      })
    )
  );
}
