/* Customer AUDIT records use the paged ATTP API and record-version conflict checks. */
function CustomerAuditList({items,canEdit,busy,onOpen}){
 if(!items.length)return h('p',null,'Chưa có lần AUDIT trong khoảng ngày đang chọn.');
 return h('div',{className:'tw'},h('table',null,h('thead',null,h('tr',null,['Ngày','Khách hàng','Hình ảnh trước cải tiến','Hình ảnh kiểm tra','Hạng mục cải tiến','Người upload',''].map(t=>h('th',{key:t},t)))),h('tbody',null,items.map(item=>h('tr',{key:item.id},
  h('td',null,scfATTPDate(item.publishDate)||'Chưa có ngày'),h('td',null,item.location||'Chưa bổ sung'),
  h('td',null,h('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},(item.beforeImages||[]).map((src,i)=>h('button',{key:i,type:'button',disabled:busy,onClick:()=>onOpen(item),'aria-label':'Xem ảnh trước cải tiến '+(i+1)},h('img',{src,loading:'lazy',alt:'Ảnh trước cải tiến '+(i+1),style:{width:64,height:64,objectFit:'cover'}})))),h('button',{type:'button',disabled:busy,onClick:()=>onOpen(item)},item.beforeImageCount?'Xem '+item.beforeImageCount+' ảnh':'Xem chi tiết')),
  h('td',null,h('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},(item.images||[]).map((src,i)=>h('button',{key:i,type:'button',disabled:busy,onClick:()=>onOpen(item),'aria-label':'Xem ảnh AUDIT '+(i+1)},h('img',{src,loading:'lazy',alt:'Ảnh kiểm tra '+(i+1),style:{width:64,height:64,objectFit:'cover'}})))),h('button',{type:'button',disabled:busy,onClick:()=>onOpen(item)},item.imageCount?'Xem '+item.imageCount+' ảnh':'Xem chi tiết')),
  h('td',{style:{whiteSpace:'pre-wrap',minWidth:180}},item.excerpt||'Chưa bổ sung'),h('td',null,item.responsible||'Chưa bổ sung'),h('td',null,canEdit&&h('button',{type:'button',disabled:busy,'data-scf-action':'write',onClick:()=>onOpen(item,true)},'Sửa'))
 )))));
}
function CustomerAuditEditor({page,record,currentUser,onClose,onSaved}){
 const [form,setForm]=useState(()=>({...record,id:record.id||'AUDIT'+uid(),responsible:record.responsible??'',beforeImages:[...(record.beforeImages||[])],images:[...(record.images||[])]}));
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[dragging,setDragging]=useState(false);
 const lock=React.useRef(false),alive=React.useRef(true);useEffect(()=>()=>{alive.current=false;},[]);
 const set=(key,value)=>setForm(f=>({...f,[key]:value}));
 const field=(key,label,type='text')=>h(F,{label},h('input',{'aria-label':label,type,value:form[key]||'',disabled:busy,onChange:e=>set(key,e.target.value)}));
 const upload=async(files,key='images')=>{
  const picked=Array.from(files||[]);if(!picked.length||lock.current)return;
  if(form[key].length+picked.length>20){setError('Mỗi nhóm ảnh AUDIT tối đa 20 ảnh.');return;}
  if(picked.some(file=>!/^image\/(jpeg|png|webp)$/i.test(file.type))){setError('Chọn ảnh JPG, PNG hoặc WebP.');return;}
  if(picked.some(file=>file.size>20*1024*1024)){setError('Mỗi ảnh tối đa 20 MB.');return;}
  lock.current=true;setBusy(true);setError('');
  try{for(const file of picked){const src=await uploadPhoto(file,'attp-documents',{max:1400,quality:.76,requireRemote:true});if(alive.current)setForm(f=>({...f,[key]:[...f[key],src]}));}}
  catch(e){if(alive.current)setError(e.message||'Không tải được ảnh.');}finally{lock.current=false;if(alive.current)setBusy(false);}
 };
 const save=async()=>{
  if(lock.current)return;
  lock.current=true;setBusy(true);setError('');
  try{await scfATTPRequest(page,'save',{record:{...form,title:'AUDIT · '+(String(form.location||'').trim()||'Chưa bổ sung khách hàng')+' · '+(form.publishDate||'Chưa có ngày')},expectedVersion:record.recordVersion||''});if(alive.current){window.showToast('Đã lưu lần AUDIT.','success');onSaved();}}
  catch(e){if(alive.current)setError(e.message);}finally{lock.current=false;if(alive.current)setBusy(false);}
 };
 return h(Modal,{title:record.id?'Sửa lần AUDIT khách hàng':'Thêm lần AUDIT khách hàng',lg:true,onClose:()=>{if(!lock.current)onClose();}},
  h('p',{className:'attp-meta'},'Có thể lưu trước, bổ sung ngày, khách hàng, hình ảnh và nội dung sau.'),
  h('div',{className:'g2'},field('publishDate','Ngày','date'),field('location','Khách hàng'),field('responsible','Người upload')),
  h(F,{label:'Hạng mục cải tiến'},h('textarea',{'aria-label':'Hạng mục cải tiến',rows:6,value:form.content||'',disabled:busy,onChange:e=>set('content',e.target.value)})),
  h('div',{className:'claim-file-dropzone'+(dragging?' is-dragging':''),role:'group','aria-label':'Hình ảnh trước cải tiến AUDIT',onDragOver:e=>{e.preventDefault();if(!busy)setDragging(true);},onDragLeave:()=>setDragging(false),onDrop:e=>{e.preventDefault();setDragging(false);upload(e.dataTransfer.files,'beforeImages');}},
   h('b',null,'Kéo thả nhiều hình ảnh trước cải tiến vào đây'),h('p',null,'JPG, PNG, WebP · tối đa 20 ảnh mỗi lần AUDIT.'),h('input',{'aria-label':'Chọn hình ảnh trước cải tiến',type:'file',accept:'image/jpeg,image/png,image/webp',multiple:true,disabled:busy,onChange:e=>{upload(e.target.files,'beforeImages');e.target.value='';}})),
  h('div',{className:'attp-edit-images'},form.beforeImages.map((src,i)=>h('div',{key:i},h('img',{src,alt:'Ảnh trước cải tiến '+(i+1),loading:'lazy'}),h('button',{type:'button',disabled:busy,onClick:()=>setForm(f=>({...f,beforeImages:f.beforeImages.filter((_,j)=>j!==i)}))},'Bỏ ảnh')))),
  h('div',{className:'claim-file-dropzone'+(dragging?' is-dragging':''),role:'group','aria-label':'Hình ảnh kiểm tra AUDIT',onDragOver:e=>{e.preventDefault();if(!busy)setDragging(true);},onDragLeave:()=>setDragging(false),onDrop:e=>{e.preventDefault();setDragging(false);upload(e.dataTransfer.files);}},
   h('b',null,'Kéo thả nhiều hình ảnh kiểm tra vào đây'),h('p',null,'JPG, PNG, WebP · tối đa 20 ảnh mỗi lần AUDIT.'),h('input',{'aria-label':'Chọn hình ảnh kiểm tra',type:'file',accept:'image/jpeg,image/png,image/webp',multiple:true,disabled:busy,onChange:e=>{upload(e.target.files);e.target.value='';}})),
  h('div',{className:'attp-edit-images'},form.images.map((src,i)=>h('div',{key:i},h('img',{src,alt:'Ảnh kiểm tra '+(i+1),loading:'lazy'}),h('button',{type:'button',disabled:busy,onClick:()=>setForm(f=>({...f,images:f.images.filter((_,j)=>j!==i)}))},'Bỏ ảnh')))),
  busy&&h('p',{role:'status'},'Đang tải ảnh / lưu AUDIT…'),error&&h('p',{role:'alert'},error),h(Row,null,h('button',{type:'button',disabled:busy,onClick:onClose},'Hủy'),h('button',{type:'button',className:'bp','data-scf-action':'write',disabled:busy,onClick:save},'Lưu AUDIT'))
 );
}
