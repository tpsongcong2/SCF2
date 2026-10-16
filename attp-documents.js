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
  const isDaily=page==='attp_daily';
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
    h('div',{className:'card',style:{padding:16,marginBottom:14}},h('strong',null,title),h('p',{style:{margin:'6px 0 0'}},isDaily?'Ghi nhận kiểm tra theo ngày, ca; theo dõi kết quả, sai lệch và khắc phục. Mặc định hiển thị tháng hiện tại.':'Quản lý tài liệu theo mã, phiên bản, người phụ trách và thời hạn. Mở tài liệu để xem nội dung, hình ảnh.')),
    h('div',{className:'attp-toolbar'},
      h(SearchBar,{value:query,onChange:value=>{setQuery(value);setPageNumber(1);},placeholder:'Tìm mã, tiêu đề, nội dung, người phụ trách...'}),
      h('label',null,'Từ ngày',h('input',{type:'date',value:range.from,onChange:e=>changeRange('from',e.target.value)})),
      h('label',null,'Đến ngày',h('input',{type:'date',value:range.to,onChange:e=>changeRange('to',e.target.value)})),
      isDaily&&h('button',{type:'button',onClick:()=>{setRange(scfATTPMonthRange());setPageNumber(1);}},'Tháng hiện tại'),
      h('button',{type:'button',onClick:()=>{setRange({from:'',to:''});setPageNumber(1);}},'Tất cả ngày'),
      h('button',{type:'button',disabled:loading,onClick:()=>setReload(x=>x+1)},'Tải lại'),
      canEdit&&h('button',{type:'button',className:'bp','data-scf-action':'write',disabled:detailBusy||deleting,onClick:()=>{setSelected({id:'',category:page,publishDate:scfATTPToday(),images:[]});setEditing(true);}},isDaily?'+ Ghi nhật ký':'+ Thêm tài liệu')
    ),
    loading?h('div',{role:'status',className:'empty'},'Đang tải tài liệu…'):error?h('div',{role:'alert',className:'card',style:{padding:16}},error,h('button',{type:'button',onClick:()=>setReload(x=>x+1),style:{marginLeft:12}},'Thử lại')):
    h(React.Fragment,null,
      h('div',{className:'attp-pagination'},h('span',null,result.total+' bản ghi · Trang '+result.page+'/'+result.pages),h('button',{type:'button',disabled:result.page<=1,onClick:()=>setPageNumber(result.page-1)},'Trước'),h('button',{type:'button',disabled:result.page>=result.pages,onClick:()=>setPageNumber(result.page+1)},'Sau')),
      result.items.length?h('div',{className:'delivery-rule-list'},result.items.map(item=>h('article',{key:item.id,className:'card delivery-rule-card'},
        h('h3',{style:{margin:'0 0 8px'}},item.title),
        h('div',{className:'attp-meta'},[item.documentCode&&'Mã: '+item.documentCode,item.revision&&'Phiên bản: '+item.revision,item.publishDate&&'Ngày: '+scfATTPDate(item.publishDate),item.responsible&&'Phụ trách: '+item.responsible,item.shift&&'Ca: '+item.shift,item.imageCount>0&&item.imageCount+' ảnh'].filter(Boolean).join(' · ')),
        h('p',{style:{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}},item.excerpt+(item.excerpt?.length===180?'…':'')),
        h('div',{className:'attp-toolbar'},h('button',{type:'button',disabled:detailBusy||deleting,onClick:()=>openRecord(item)},'Xem tài liệu'),canEdit&&h('button',{type:'button','data-scf-action':'write',disabled:detailBusy||deleting,onClick:()=>openRecord(item,true)},'Sửa'))
      ))):h('div',{className:'empty'},'Không có tài liệu trong khoảng ngày hoặc nội dung tìm kiếm này.')
    ),
    detailBusy&&h('div',{role:'status'},'Đang mở tài liệu…'),
    selected&&editing&&h(ATTPRecordEditor,{key:selected.id||'new',page,record:selected,isDaily,onClose:()=>{setSelected(null);setEditing(false);},onSaved:()=>{setSelected(null);setEditing(false);setReload(x=>x+1);}}),
    selected&&!editing&&h(Modal,{title:selected.title,lg:true,onClose:()=>{if(!deleting)setSelected(null);}},
      h('div',{className:'attp-meta'},[['Mã',selected.documentCode],['Phiên bản',selected.revision],['Ngày',selected.publishDate&&scfATTPDate(selected.publishDate)],['Phụ trách',selected.responsible],['Ca',selected.shift],['Hiệu lực',selected.effectiveDate&&scfATTPDate(selected.effectiveDate)],['Hết hạn / rà soát',selected.expiryDate&&scfATTPDate(selected.expiryDate)],['Người đăng',selected.authorName]].filter(([,v])=>v).map(([label,value])=>h('div',{key:label},label+': '+value))),
      h('div',{className:'delivery-rule-content',style:{whiteSpace:'pre-wrap',overflowWrap:'anywhere',marginTop:16}},selected.content),
      !!selected.images?.length&&h('div',{className:'attp-detail-images'},selected.images.map((src,index)=>h('a',{key:index,href:src,target:'_blank',rel:'noopener noreferrer'},h('img',{src,loading:'lazy',decoding:'async',alt:'Ảnh tài liệu '+(index+1)})))),
      h('div',{className:'modal-actions'},canEdit&&h('button',{type:'button','data-scf-action':'write',disabled:deleting,onClick:()=>setEditing(true)},'Sửa'),canDelete&&h('button',{type:'button','data-scf-action':'delete',disabled:deleting,onClick:remove},deleting?'Đang xóa…':'Xóa'),h('button',{type:'button',disabled:deleting,onClick:()=>setSelected(null)},'Đóng'))
    )
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
