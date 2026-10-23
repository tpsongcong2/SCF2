/* Tài liệu ATTP: tải danh sách giới hạn, chỉ tải nội dung khi mở bản ghi. */
function scfATTPDate(value){const parts=String(value||'').split('-');return parts.length===3?parts.reverse().join('/'):value||'';}
function scfATTPToday(){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
function scfATTPMonthRange(today=scfATTPToday()){
  const [year,month]=today.split('-').map(Number);
  return {from:today.slice(0,7)+'-01',to:today.slice(0,7)+'-'+String(new Date(Date.UTC(year,month,0)).getUTCDate()).padStart(2,'0')};
}
async function scfATTPRequest(pageKey,operation,params={}){
  if(!sb||!serverAuthEnabled())throw new Error('Cần kết nối máy chủ để tải và lưu tài liệu ATTP.');
  const {data,error}=await invokeScfAuth({body:{action:'attp_documents',pageKey,operation,...params}});
  if(error||!data?.ok)throw new Error(await serverFunctionErrorMessage(error,data,'Không xử lý được tài liệu ATTP. Kiểm tra kết nối và phiên bản scf-auth trên máy chủ.'));
  return data;
}
function ATTPDocumentsTab({page,title,icon,currentUser}){
  const isClaim=page==='attp_claims';
  const isDaily=page==='attp_daily'||isClaim;
  const [query,setQuery]=useState('');
  const [range,setRange]=useState(()=>isDaily?scfATTPMonthRange():{from:'',to:''});
  const [pageNumber,setPageNumber]=useState(1);
  const [result,setResult]=useState({items:[],total:0,page:1,pages:1});
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [reload,setReload]=useState(0);
  const [selected,setSelected]=useState(null);
  const [editing,setEditing]=useState(false);
  const [detailBusy,setDetailBusy]=useState(false);
  const [deleting,setDeleting]=useState(false);
  const alive=React.useRef(true),detailSequence=React.useRef(0);
  React.useEffect(()=>{alive.current=true;return()=>{alive.current=false;detailSequence.current++;};},[]);
  const canEdit=canWrite(currentUser?.role,page,currentUser?.permLevels);
  const canDelete=canDel(currentUser?.role,page,currentUser?.permLevels);
  const validRange=!(range.from&&range.to&&range.from>range.to);
  React.useEffect(()=>{
    let cancelled=false;
    setLoading(true);setError('');setResult({items:[],total:0,page:1,pages:1});
    if(!validRange){setError('Ngày kết thúc phải từ ngày bắt đầu trở đi.');setLoading(false);return;}
    const timer=setTimeout(async()=>{
      try{
        const data=await scfATTPRequest(page,'list',{query,from:range.from,to:range.to,page:pageNumber});
        if(!cancelled)setResult(data);
      }catch(err){if(!cancelled)setError(err.message||'Không tải được tài liệu.');}
      finally{if(!cancelled)setLoading(false);}
    },query?350:0);
    return()=>{cancelled=true;clearTimeout(timer);};
  },[page,query,range.from,range.to,pageNumber,reload]);
  const openRecord=async(item,edit=false)=>{
    if(detailBusy||deleting)return;
    const sequence=++detailSequence.current;setDetailBusy(true);
    try{
      const data=await scfATTPRequest(page,'detail',{id:item.id});
      if(alive.current&&sequence===detailSequence.current){setSelected({...data.record,recordVersion:data.recordVersion});setEditing(edit);}
    }catch(err){if(alive.current)window.showToast(err.message,'error');}
    finally{if(alive.current&&sequence===detailSequence.current)setDetailBusy(false);}
  };
  const remove=async()=>{
    if(!selected||!canDelete||deleting)return;
    const record=selected;
    const ok=await window.scfConfirm('Xóa “'+record.title+'”?','Xóa tài liệu ATTP',true);
    if(!ok||!alive.current)return;
    setDeleting(true);
    try{
      await scfATTPRequest(page,'delete',{id:record.id,expectedVersion:record.recordVersion});
      if(alive.current){setSelected(null);setReload(x=>x+1);window.showToast('Đã xóa tài liệu.','success');}
    }catch(err){if(alive.current)window.showToast(err.message,'error');}
    finally{if(alive.current)setDeleting(false);}
  };
  const changeRange=(field,value)=>{setRange(prev=>({...prev,[field]:value}));setPageNumber(1);};
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti '+icon}),title),
    h('div',{className:'card',style:{padding:16,marginBottom:14}},h('strong',null,title),h('p',{style:{margin:'6px 0 0'}},isClaim?'Ghi nhận claim theo ngày, địa điểm; tải tệp giải trình và theo dõi người xử lý.':isDaily?'Ghi nhận kiểm tra theo ngày, ca; theo dõi kết quả, sai lệch và khắc phục. Mặc định hiển thị tháng hiện tại.':'Quản lý tài liệu theo mã, phiên bản, người phụ trách và thời hạn. Mở tài liệu để xem nội dung, hình ảnh.')),
    h('div',{className:'attp-toolbar'},
      h(SearchBar,{value:query,onChange:value=>{setQuery(value);setPageNumber(1);},placeholder:'Tìm mã, tiêu đề, nội dung, người phụ trách...'}),
      h('label',null,'Từ ngày',h('input',{type:'date',value:range.from,onChange:e=>changeRange('from',e.target.value)})),
      h('label',null,'Đến ngày',h('input',{type:'date',value:range.to,onChange:e=>changeRange('to',e.target.value)})),
      isDaily&&h('button',{type:'button',onClick:()=>{setRange(scfATTPMonthRange());setPageNumber(1);}},'Tháng hiện tại'),
      h('button',{type:'button',onClick:()=>{setRange({from:'',to:''});setPageNumber(1);}},'Tất cả ngày'),
      h('button',{type:'button',disabled:loading,onClick:()=>setReload(x=>x+1)},'Tải lại'),
      canEdit&&h('button',{type:'button',className:'bp','data-scf-action':'write',disabled:detailBusy||deleting,onClick:()=>{setSelected({id:'',category:page,publishDate:scfATTPToday(),images:[]});setEditing(true);}},isClaim?'+ Ghi claim':isDaily?'+ Ghi nhật ký':'+ Thêm tài liệu')
    ),
    loading?h('div',{role:'status',className:'empty'},'Đang tải tài liệu…'):error?h('div',{role:'alert',className:'card',style:{padding:16}},error,h('button',{type:'button',onClick:()=>setReload(x=>x+1),style:{marginLeft:12}},'Thử lại')):
    h(React.Fragment,null,
      h('div',{className:'attp-pagination'},h('span',null,result.total+' bản ghi · Trang '+result.page+'/'+result.pages),h('button',{type:'button',disabled:result.page<=1,onClick:()=>setPageNumber(result.page-1)},'Trước'),h('button',{type:'button',disabled:result.page>=result.pages,onClick:()=>setPageNumber(result.page+1)},'Sau')),
      isClaim?h(QualityClaimList,{items:result.items,canEdit,busy:detailBusy||deleting,onOpen:openRecord}):result.items.length?h('div',{className:'delivery-rule-list'},result.items.map(item=>h('article',{key:item.id,className:'card delivery-rule-card'},
        h('h3',{style:{margin:'0 0 8px'}},item.title),
        h('div',{className:'attp-meta'},[item.documentCode&&'Mã: '+item.documentCode,item.revision&&'Phiên bản: '+item.revision,item.publishDate&&'Ngày: '+scfATTPDate(item.publishDate),item.responsible&&'Phụ trách: '+item.responsible,item.shift&&'Ca: '+item.shift,item.imageCount>0&&item.imageCount+' ảnh'].filter(Boolean).join(' · ')),
        h('p',{style:{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}},item.excerpt+(item.excerpt?.length===180?'…':'')),
        h('div',{className:'attp-toolbar'},h('button',{type:'button',disabled:detailBusy||deleting,onClick:()=>openRecord(item)},'Xem tài liệu'),canEdit&&h('button',{type:'button','data-scf-action':'write',disabled:detailBusy||deleting,onClick:()=>openRecord(item,true)},'Sửa'))
      ))):h('div',{className:'empty'},'Không có tài liệu trong khoảng ngày hoặc nội dung tìm kiếm này.')
    ),
    detailBusy&&h('div',{role:'status'},'Đang mở tài liệu…'),
    selected&&editing&&h(isClaim?QualityClaimEditor:ATTPRecordEditor,{key:selected.id||'new',page,record:selected,isDaily,currentUser,onClose:()=>{setSelected(null);setEditing(false);},onSaved:()=>{setSelected(null);setEditing(false);setReload(x=>x+1);}}),
    selected&&!editing&&h(Modal,{title:selected.title,lg:true,onClose:()=>{if(!deleting)setSelected(null);}},
      h('div',{className:'attp-meta'},[['Mã',selected.documentCode],['Phiên bản',selected.revision],['Ngày',selected.publishDate&&scfATTPDate(selected.publishDate)],['Địa điểm',selected.location],[isClaim?'Người xử lý':'Phụ trách',selected.responsible],['Ca',selected.shift],['Hiệu lực',selected.effectiveDate&&scfATTPDate(selected.effectiveDate)],['Hết hạn / rà soát',selected.expiryDate&&scfATTPDate(selected.expiryDate)],['Người đăng',selected.authorName]].filter(([,v])=>v).map(([label,value])=>h('div',{key:label},label+': '+value))),
      h('div',{className:'delivery-rule-content',style:{whiteSpace:'pre-wrap',overflowWrap:'anywhere',marginTop:16}},selected.content),
      isClaim&&h('div',null,h('b',null,'Tệp giải trình'),...(selected.attachments||[]).map((file,i)=>h('p',{key:i},file.url?h('a',{href:file.url,target:'_blank',rel:'noopener noreferrer',download:file.name},'Tải '+file.name):file.name+' · Chưa mở được tệp; thử mở lại claim.'))),
      !!selected.images?.length&&h('div',{className:'attp-detail-images'},selected.images.map((src,index)=>h('a',{key:index,href:src,target:'_blank',rel:'noopener noreferrer'},h('img',{src,loading:'lazy',decoding:'async',alt:'Ảnh tài liệu '+(index+1)})))),
      h('div',{className:'modal-actions'},canEdit&&h('button',{type:'button','data-scf-action':'write',disabled:deleting,onClick:()=>setEditing(true)},'Sửa'),canDelete&&h('button',{type:'button','data-scf-action':'delete',disabled:deleting,onClick:remove},deleting?'Đang xóa…':'Xóa'),h('button',{type:'button',disabled:deleting,onClick:()=>setSelected(null)},'Đóng'))
    )
  );
}
function QualityClaimList({items,canEdit,busy,onOpen}){
 if(!items.length)return h('p',null,'Chưa có claim trong khoảng ngày đang chọn.');
 return h('div',{className:'tw'},h('table',{className:'quality-claim-table'},h('thead',null,h('tr',null,['Ngày','Địa điểm','Thông tin claim','Giải trình','Người xử lý',''].map(t=>h('th',{key:t},t)))),h('tbody',null,items.map(item=>h('tr',{key:item.id},
  h('td',{'data-label':'Ngày'},scfATTPDate(item.publishDate)),h('td',{'data-label':'Địa điểm'},item.location),h('td',{'data-label':'Thông tin claim'},h('div',{style:{whiteSpace:'pre-wrap'}},item.excerpt)),
  h('td',{'data-label':'Giải trình'},h('button',{disabled:busy,onClick:()=>onOpen(item)},item.attachmentCount?'Xem / tải '+item.attachmentCount+' tệp':'Chưa có giải trình')),
  h('td',{'data-label':'Người xử lý'},item.responsible),h('td',null,canEdit&&h('button',{disabled:busy,'data-scf-action':'write',onClick:()=>onOpen(item,true)},'Sửa'))
 )))));
}
function QualityClaimEditor({page,record,currentUser,onClose,onSaved}){
 const[form,setForm]=useState(()=>({...record,id:record.id||'CLAIM'+uid(),responsible:record.responsible||currentUser?.name||'',attachments:[...(record.attachments||[])]}));
 const[busy,setBusy]=useState(false),[error,setError]=useState('');
 const alive=React.useRef(true);useEffect(()=>()=>{alive.current=false;},[]);
 const field=(key,label,type='text')=>h(F,{label},h('input',{'aria-label':label,type,value:form[key]||'',disabled:busy,onChange:e=>setForm(f=>({...f,[key]:e.target.value}))}));
 const upload=async files=>{
  const picked=Array.from(files||[]);if(!picked.length||busy)return;
  if(form.attachments.length+picked.length>10){setError('Tối đa 10 tệp giải trình.');return;}
  setBusy(true);setError('');
  try{for(const file of picked){
   if(file.size>5*1024*1024)throw Error('Mỗi tệp tối đa 5 MB.');
   const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('Không đọc được tệp.'));reader.readAsDataURL(file);});
   const result=await scfATTPRequest(page,'upload',{id:form.id,file:{name:file.name,base64}});
   if(alive.current)setForm(f=>({...f,attachments:[...f.attachments,result.file]}));
  }}catch(e){if(alive.current)setError(e.message);}finally{if(alive.current)setBusy(false);}
 };
 const save=async()=>{
  if(busy)return;
  if(!form.publishDate||![form.location,form.content,form.responsible].every(v=>String(v||'').trim())){setError('Nhập ngày, địa điểm, thông tin claim và người xử lý.');return;}
  setBusy(true);setError('');
  try{await scfATTPRequest(page,'save',{record:{...form,title:'Claim · '+form.location+' · '+form.publishDate,images:[]},expectedVersion:record.recordVersion||''});if(alive.current)onSaved();}
  catch(e){if(alive.current)setError(e.message);}finally{if(alive.current)setBusy(false);}
 };
 return h(Modal,{title:record.id?'Sửa claim chất lượng':'Ghi claim chất lượng',lg:true,onClose:()=>{if(!busy)onClose();}},
  h('div',{className:'g2'},field('publishDate','Ngày *','date'),field('location','Địa điểm *'),field('responsible','Người xử lý *')),
  h(F,{label:'Thông tin claim *'},h('textarea',{'aria-label':'Thông tin claim *',value:form.content||'',rows:6,disabled:busy,onChange:e=>setForm(f=>({...f,content:e.target.value}))})),
  h(F,{label:'Tải giải trình (PDF, DOCX, XLSX, ảnh; tối đa 5 MB/tệp)'},h('input',{'aria-label':'Tải giải trình',type:'file',accept:'.pdf,.docx,.xlsx,.jpg,.jpeg,.png,.webp',multiple:true,disabled:busy,onChange:e=>{upload(e.target.files);e.target.value='';}})),
  form.attachments.map((file,i)=>h('div',{key:file.path,style:{display:'flex',gap:10,alignItems:'center',marginBottom:8}},h('span',null,file.name),h('button',{disabled:busy,onClick:()=>setForm(f=>({...f,attachments:f.attachments.filter((_,index)=>index!==i)}))},'Bỏ tệp'))),
  error&&h('p',{role:'alert',className:'goods-inventory-error'},error),busy&&h('p',{role:'status'},'Đang lưu / tải tệp…'),
  h(Row,null,h('button',{disabled:busy,onClick:onClose},'Đóng'),h('button',{className:'bp','data-scf-action':'write',disabled:busy,onClick:save},'Lưu claim'))
 );
}
function ATTPRecordEditor({page,record,isDaily,onClose,onSaved}){
  const [form,setForm]=useState(()=>({...record,id:record.id||'ATTP'+uid(),images:[...(record.images||[])]}));
  const [saving,setSaving]=useState(false),[uploading,setUploading]=useState(false),[error,setError]=useState('');
  const alive=React.useRef(true);
  React.useEffect(()=>()=>{alive.current=false;},[]);
  const busy=saving||uploading;
  const field=(name,label,type='text')=>h(F,{key:name,label},h('input',{type,disabled:busy,value:form[name]||'',onChange:e=>setForm(prev=>({...prev,[name]:e.target.value}))}));
  const addImages=async files=>{
    const picked=Array.from(files||[]);if(!picked.length||busy)return;
    if(form.images.length+picked.length>20){setError('Mỗi tài liệu tối đa 20 ảnh.');return;}
    setUploading(true);setError('');
    try{
      for(const file of picked){
        const src=await uploadPhoto(file,'attp-documents',{max:1400,quality:.76,requireRemote:true});
        if(alive.current)setForm(prev=>({...prev,images:[...prev.images,src]}));
      }
    }catch(err){if(alive.current)setError(err.message||'Không tải được ảnh.');}
    finally{if(alive.current)setUploading(false);}
  };
  const save=async()=>{
    if(busy)return;
    if(!String(form.title||'').trim()||!String(form.content||'').trim()||!form.publishDate){setError('Vui lòng nhập ngày, tiêu đề và nội dung.');return;}
    if(form.effectiveDate&&form.expiryDate&&form.expiryDate<form.effectiveDate){setError('Ngày hết hạn phải từ ngày hiệu lực trở đi.');return;}
    setSaving(true);setError('');
    try{
      await scfATTPRequest(page,'save',{record:{...form,id:form.id||'ATTP'+uid()},expectedVersion:record.recordVersion||''});
      if(alive.current){window.showToast('Đã lưu tài liệu trên máy chủ.','success');onSaved();}
    }catch(err){if(alive.current)setError(err.message||'Không lưu được tài liệu.');}
    finally{if(alive.current)setSaving(false);}
  };
  return h(Modal,{title:(record.id?'Sửa ':'Thêm ')+(isDaily?'nhật ký ATTP':'tài liệu ATTP'),lg:true,onClose:()=>{if(!busy)onClose();}},
    h('div',{className:'form-grid'},
      field('publishDate',isDaily?'Ngày ghi nhận *':'Ngày đăng *','date'),field('documentCode','Mã tài liệu / biểu mẫu'),
      isDaily?field('shift','Ca sản xuất'):[field('revision','Phiên bản'),field('effectiveDate','Ngày hiệu lực','date'),field('expiryDate','Ngày hết hạn / rà soát','date')],
      field('responsible','Người phụ trách'),
      h(F,{label:'Tiêu đề *',full:true},h('input',{value:form.title||'',disabled:busy,onChange:e=>setForm(prev=>({...prev,title:e.target.value}))})),
      h(F,{label:isDaily?'Kết quả kiểm tra, sai lệch và khắc phục *':'Nội dung tài liệu *',full:true},h('textarea',{rows:12,value:form.content||'',disabled:busy,onChange:e=>setForm(prev=>({...prev,content:e.target.value}))})),
      h(F,{label:'Hình ảnh minh họa (tối đa 20 ảnh)',full:true},
        h('input',{type:'file',accept:'image/*',multiple:true,disabled:busy,onChange:e=>{addImages(e.target.files);e.target.value='';}}),
        uploading&&h('div',{role:'status'},'Đang tải ảnh…'),
        h('div',{className:'attp-edit-images'},form.images.map((src,index)=>h('div',{key:index},h('img',{src,loading:'lazy',decoding:'async',alt:'Ảnh '+(index+1)}),h('button',{type:'button',disabled:busy,onClick:()=>setForm(prev=>({...prev,images:prev.images.filter((_,i)=>i!==index)}))},'Bỏ ảnh'))))
      )
    ),
    error&&h('div',{role:'alert',style:{color:'var(--danger)',marginTop:12}},error),
    h('div',{className:'modal-actions'},h('button',{type:'button',disabled:busy,onClick:onClose},'Hủy'),h('button',{type:'button',className:'bp','data-scf-action':'write',disabled:busy,onClick:save},saving?'Đang lưu…':'Lưu'))
  );
}
