/* ─── UI base ─── */
function F({label,children}){return h('div',{className:'fl'},h('label',null,label),children)}
function Row({children}){return h('div',{className:'form-actions'},children)}
function Modal({title,lg,className='',onClose,children}){
  return h('div',{className:'overlay',onClick:e=>{if(e.target===e.currentTarget)onClose()}},
    h('div',{className:'modal'+(lg==='xl'?' xl':lg?' wide':'')+(className?' '+className:''),style:{},onClick:e=>e.stopPropagation()},
      h('div',{className:'mh'},h('h2',null,title),h('button',{className:'mclose',type:'button',onClick:onClose},h('i',{className:'ti ti-x'}))),
      children
    )
  );
}
function SearchBar({value,onChange,placeholder}){
  return h('div',{className:'search-wrap'},
    h('i',{className:'ti ti-search'}),
    h('input',{value,onChange:e=>onChange(e.target.value),placeholder:placeholder||'Tìm kiếm...'})
  );
}
function AddBtn({onClick,label}){
  return h('button',{className:'bp',onClick,'data-scf-action':'write',style:{padding:'7px 14px'}},h('i',{className:'ti ti-plus',style:{fontSize:14}}),label||'Thêm mới');
}
function TableWrap({cols,rows,empty}){
  return h('div',{className:'tw'},
    h('table',null,
      h('thead',null,h('tr',null,...cols.map(c=>h('th',{key:c},c)))),
      h('tbody',null,rows.length?rows:h('tr',null,h('td',{colSpan:cols.length,className:'empty-st'},empty||'Chưa có dữ liệu.')))
    )
  );
}

/* ─── EXCEL helpers ─── */
function xlsxExport(rows,cols,filename){
  const header=cols.map(([,label])=>label);
  const body=rows.map(r=>cols.map(([key])=>r[key]??''));
  const ws=XLSX.utils.aoa_to_sheet([header,...body]);const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Data');
  XLSX.writeFile(wb,filename+'_'+fmtDate().replace(/\//g,'-')+'.xlsx');
}
function xlsxImport(file,cb){
  const r=new FileReader();
  r.onload=e=>{
    const wb=XLSX.read(e.target.result,{type:'binary',cellDates:true});
    const ws=wb.Sheets[wb.SheetNames[0]];
    cb(XLSX.utils.sheet_to_json(ws,{defval:null,raw:false,cellDates:true}));
  };
  r.readAsBinaryString(file);
}
function ExportBtn({onClick}){return h('button',{onClick,style:{fontSize:12,padding:'6px 12px'}},h('i',{className:'ti ti-file-spreadsheet',style:{fontSize:14}}),'Xuất Excel');}
function ImportBtn({onFile}){
  const ref=useRef();
  return h('span',null,
    h('input',{type:'file',accept:'.xlsx,.xls',ref,style:{display:'none'},onChange:e=>{if(e.target.files[0]){xlsxImport(e.target.files[0],onFile);e.target.value='';}}}),
    h('button',{onClick:()=>ref.current.click(),'data-scf-action':'write',style:{fontSize:12,padding:'6px 12px'}},h('i',{className:'ti ti-upload',style:{fontSize:14}}),'Nhập Excel')
  );
}

function InvoiceImageSizeSelect({value,onChange}){
  return h('label',{className:'invoice-image-size-control'},
    h('span',null,'Cỡ ảnh'),
    h('select',{'aria-label':'Cỡ ảnh hóa đơn','data-scf-action':'view',value,onChange:event=>onChange(event.target.value)},
      h('option',{value:'small'},'Nhỏ'),h('option',{value:'medium'},'Vừa'),h('option',{value:'large'},'Lớn')
    )
  );
}
function InvoiceLandscapeToggle({value,onChange}){
  return h('button',{type:'button',className:'bs invoice-landscape-toggle'+(value?' active':''),'data-scf-action':'view','aria-pressed':!!value,title:'Nhận diện hướng chữ và tự xoay đúng chiều; có thể chỉnh từng ảnh bằng nút xoay',onClick:()=>onChange(!value)},h('i',{className:'ti ti-rotate-2'}),' Tự xoay đúng chiều');
}
function scfInvoiceImageLayout(width,height,angle){
  const w=Number(width)>0?Number(width):3,h=Number(height)>0?Number(height):4;
  const rotation=((Number(angle)||0)%360+360)%360,sideways=rotation===90||rotation===270;
  return{rotation,sideways,ratio:sideways?h/w:w/h,imageWidth:(sideways?w/h:1)*100+'%',imageHeight:(sideways?h/w:1)*100+'%'};
}
function TripInvoicePreview({src,label,size='medium',landscape=false,orderId='',kind='invoice'}){
  const safeSize=['small','medium','large'].includes(size)?size:'medium';
  const[url,setUrl]=useState(src);
  const[phase,setPhase]=useState('ready');
  const[reload,setReload]=useState(0);
  const[natural,setNatural]=useState({width:0,height:0});
  const[manualRotation,setManualRotation]=useState(null);
  const[viewer,setViewer]=useState(false);
  const[recognitionImage,setRecognitionImage]=useState(null);
  const[orientation,setOrientation]=useState(null);
  const[recognitionRetry,setRecognitionRetry]=useState(0);
  const[sharedSave,setSharedSave]=useState(null);
  const shared=!!orderId&&!/^(?:data:|blob:)/i.test(src||'')&&typeof window!=='undefined'&&typeof window.scfResolveSharedInvoiceOrientation==='function';
  const photoSource=shared?scfInvoicePhotoSource(src):'';
  const sharedRef={orderId:String(orderId),kind,photoSource};
  const autoRotation=(landscape||orientation?.sharedState==='saved')&&orientation?.src===src&&orientation.status==='ready'?orientation.angle:0;
  const angle=manualRotation?.src===src&&manualRotation?.landscape===landscape?manualRotation.angle:autoRotation;
  const layout=scfInvoiceImageLayout(natural.width,natural.height,angle);
  const rotate=delta=>setManualRotation({src,landscape,angle:(layout.rotation+delta+360)%360});
  const original=()=>setManualRotation({src,landscape,angle:0});
  const attempt=React.useRef(false),generation=React.useRef(0);
  useEffect(()=>()=>{generation.current++;},[]);
  useEffect(()=>{
    if(!shared||manualRotation?.src!==src||manualRotation?.landscape!==landscape)return;
    let active=true;const value=manualRotation;
    setSharedSave({src,angle:value.angle,status:'saving'});
    const timer=setTimeout(()=>{
      window.scfSaveSharedInvoiceOrientation(sharedRef,value.angle).then(result=>{
        if(active){setOrientation({src,...result});setSharedSave({src,angle:value.angle,status:'saved'});}
      }).catch(error=>{if(active)setSharedSave({src,angle:value.angle,status:'failed',error:error.message});});
    },400);
    return()=>{active=false;clearTimeout(timer);};
  },[shared,src,orderId,kind,photoSource,manualRotation,landscape]);
  useEffect(()=>{
    if((!landscape&&!shared)||!recognitionImage)return;
    if(!shared&&typeof window.scfDetectInvoiceOrientation!=='function'){
      setOrientation({src,status:'unavailable',angle:0});return;
    }
    let active=true,started=false,observer;
    const run=()=>{
      if(started||!active)return;started=true;observer?.disconnect();
      setOrientation({src,status:'working',angle:0,stage:shared?'loading':'recognizing'});
      const request=shared?window.scfResolveSharedInvoiceOrientation(sharedRef,url,{isActive:()=>active,retry:recognitionRetry>0,allowRecognition:landscape,
        onStage:stage=>{if(active)setOrientation({src,status:'working',angle:0,stage});}}):window.scfDetectInvoiceOrientation(url,{isActive:()=>active,retry:recognitionRetry>0});
      request.then(result=>{
        if(active&&result.status!=='cancelled')setOrientation({src,...result});
      }).catch(()=>{if(active)setOrientation({src,status:'failed',angle:0});});
    };
    if(typeof IntersectionObserver==='function'){
      observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting))run();},{threshold:0.01});observer.observe(recognitionImage);
    }else if(recognitionImage.getClientRects?.().length)run();
    return()=>{active=false;observer?.disconnect();};
  },[landscape,recognitionImage,url,src,recognitionRetry,shared,orderId,kind,photoSource]);
  const refresh=async()=>{
    if(attempt.current){setPhase('failed');return;}
    attempt.current=true;
    const path=storagePhotoPathFromUrl(url);
    if(!path){setPhase('failed');return;}
    const version=generation.current;
    let timer;
    setPhase('refreshing');
    try{
      const next=await Promise.race([createPrivatePhotoUrl(path),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Photo timeout')),15000);})]);
      if(version!==generation.current)return;
      if(!next)throw new Error('Photo URL unavailable');
      setUrl(next);setReload(value=>value+1);
    }catch(error){if(version===generation.current)setPhase('failed');}
    finally{clearTimeout(timer);}
  };
  const controls=()=>h('div',{className:'invoice-image-rotation-controls'},
    h('button',{type:'button',className:'bi','data-scf-action':'view','aria-label':'Xoay trái ảnh '+label,title:'Xoay trái 90°',onClick:()=>rotate(-90)},h('i',{className:'ti ti-rotate'})),
    h('button',{type:'button',className:'bi','data-scf-action':'view','aria-label':'Xoay phải ảnh '+label,title:'Xoay phải 90°',onClick:()=>rotate(90)},h('i',{className:'ti ti-rotate-clockwise'})),
    h('button',{type:'button',className:'bs','data-scf-action':'view','aria-label':'Trả về chiều gốc ảnh '+label,title:'Trả về chiều ảnh gốc',onClick:original},'Ảnh gốc'),
    landscape&&((manualRotation?.src===src&&manualRotation?.landscape===landscape)||(shared&&orientation?.mode==='manual'))&&h('button',{type:'button',className:'bs','data-scf-action':'view',onClick:()=>{setManualRotation(null);setSharedSave(null);if(shared||orientation?.status!=='ready')setRecognitionRetry(value=>value+1);}},'Theo chiều chữ')
  );
  const imageStage=full=>h('div',{className:'invoice-photo-stage',style:{'--invoice-ratio':layout.ratio,aspectRatio:String(layout.ratio)}},
    // This component renews expired URLs once; skip the document-wide image retry.
    h('img',{key:reload,src:url,alt:label,loading:full?'eager':'lazy',decoding:'async','data-scf-photo-refreshing':'1',
      style:{width:layout.imageWidth,height:layout.imageHeight,transform:'translate(-50%, -50%) rotate('+layout.rotation+'deg)'},
      onLoad:event=>{const img=event?.currentTarget;if(img?.naturalWidth&&img?.naturalHeight){setNatural({width:img.naturalWidth,height:img.naturalHeight});if(!full)setRecognitionImage(img);}setPhase('ready');},onError:refresh})
  );
  const failure=()=>h('div',{className:'trip-invoice-preview-error',role:'status'},'Chưa tải được ảnh.',
    h('button',{type:'button',className:'bs','data-scf-action':'view',onClick:()=>{attempt.current=false;setPhase('ready');setReload(value=>value+1);}},'Thử lại'));
  const orientationStatus=()=>h('small',{className:'invoice-orientation-status',role:'status'},
    sharedSave?.src===src&&manualRotation?.angle===sharedSave.angle?
      sharedSave.status==='saving'?'Đang lưu chiều bạn chọn lên máy chủ…':sharedSave.status==='saved'?'Đã lưu chiều bạn chọn trên máy chủ.':'Chưa lưu được chiều bạn chọn: '+sharedSave.error:
    orientation?.src===src&&orientation.sharedState==='saved'?'Đã dùng chiều lưu trên máy chủ.':
    orientation?.src===src&&orientation.stage==='loading'?'Đang đọc chiều ảnh đã lưu…':
    !landscape?'Tự xoay đang tắt. Bật “Tự xoay đúng chiều” ở thanh phía trên.':
    manualRotation?.src===src&&manualRotation?.landscape===landscape?'Đang dùng chiều bạn chọn':
    orientation?.src!==src?'Tự xoay đang bật. Chờ ảnh hiển thị để nhận diện.':
    orientation.status==='working'?(orientation.stage==='saving'?'Đang lưu chiều ảnh lên máy chủ…':'Đang nhận diện chiều chữ…'):
    orientation.status==='ready'&&orientation.sharedState==='local'?'Đã xoay trên máy này; chưa lưu chung: '+orientation.saveError:
    orientation.status==='ready'?'Đã nhận diện chiều chữ':
    orientation.status==='unavailable'?'Chưa tải được bộ tự xoay. Tải lại trang để thử lại.':
    orientation.status==='uncertain'?'Chưa rõ chiều chữ. Bạn có thể xoay bằng nút bên trên.':'Chưa nhận diện được. Bạn có thể xoay bằng nút bên trên.',
    sharedSave?.src===src&&sharedSave.status==='failed'&&h('button',{type:'button',className:'bs','data-scf-action':'view',onClick:()=>setManualRotation({...manualRotation})},'Thử lưu chiều ảnh lại'),
    landscape&&orientation?.src===src&&(['uncertain','failed','unavailable'].includes(orientation.status)||orientation.sharedState==='local')&&h('button',{type:'button',className:'bs','data-scf-action':'view',onClick:()=>{setManualRotation(null);setSharedSave(null);setRecognitionRetry(value=>value+1);}},'Thử nhận diện lại')
  );
  return h('figure',{className:'trip-invoice-preview invoice-size-'+safeSize+(layout.sideways?' invoice-rotated-sideways':'')},
    h('figcaption',null,label),
    h('button',{type:'button',className:'trip-invoice-image-button','data-scf-action':'view','aria-label':'Mở ảnh '+label,onClick:()=>setViewer(true),style:phase==='failed'?{display:'none'}:undefined},imageStage(false)),
    phase!=='failed'&&controls(),
    phase!=='failed'&&orientationStatus(),
    phase==='refreshing'&&h('small',{role:'status'},'Đang tải lại ảnh…'),
    phase==='failed'&&failure(),
    viewer&&h(Modal,{title:label,lg:'xl',className:'invoice-photo-viewer',onClose:()=>setViewer(false)},
      controls(),phase==='failed'?failure():imageStage(true),phase!=='failed'&&orientationStatus(),
      phase==='refreshing'&&h('small',{role:'status'},'Đang tải lại ảnh…'),
      h('button',{type:'button',className:'bs','data-scf-action':'view',onClick:()=>window.open(url,'_blank','noopener')},'Mở tệp ảnh gốc')
    )
  );
}
