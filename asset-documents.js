/* Hồ sơ tài sản: tệp lưu riêng, cảnh báo theo ngày tại Việt Nam. */
const SCF_ASSET_FILE_BUCKET='asset-documents';
const SCF_ASSET_DOCUMENT_TYPES=[
  {key:'registration',label:'Đăng ký xe'},
  {key:'inspection',label:'Đăng kiểm',expiry:'inspectionExpiry'},
  {key:'civilInsurance',label:'Bảo hiểm dân sự',expiry:'civilInsuranceExpiry'},
  {key:'vehicleInsurance',label:'Bảo hiểm vật chất',expiry:'vehicleInsuranceExpiry'}
];
function scfAssetDay(value){
  const text=String(value||'').trim(),match=text.match(/^(\d{4})-(\d{2})-(\d{2})$/)||text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if(!match)return null;
  const iso=text.includes('/')?[match[3],match[2],match[1]].join('-'):text;
  const day=Date.parse(iso+'T00:00:00Z');
  return Number.isFinite(day)&&new Date(day).toISOString().slice(0,10)===iso?day:null;
}
function scfAssetToday(now=new Date()){
  return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Ho_Chi_Minh',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
function scfAssetExpiryItems(asset,today=scfAssetToday()){
  const now=scfAssetDay(today);if(now===null)return [];
  return SCF_ASSET_DOCUMENT_TYPES.filter(type=>type.expiry).flatMap(type=>{
    const expiry=scfAssetDay(asset?.[type.expiry]);if(expiry===null)return [];
    const days=Math.round((expiry-now)/86400000);
    return [{...type,date:new Date(expiry).toISOString().slice(0,10),days,warning:days<=10,text:days<0?'Quá hạn '+(-days)+' ngày':days===0?'Hết hạn hôm nay':'Còn '+days+' ngày'}];
  });
}
function scfAssetExpiryNotifications(assets,user,today=scfAssetToday()){
  if(!user?.id||!canAccess(user.role,'assets',user.permissions,user.dept))return [];
  return (assets||[]).flatMap(asset=>scfAssetExpiryItems(asset,today).filter(item=>item.warning).map(item=>({
    id:'ASSET-EXPIRY-'+encodeURIComponent(JSON.stringify([String(user.id),String(asset.id),item.key,item.date,item.days<0?'overdue':'due'])),
    recipientId:String(user.id),title:item.days<0?'Giấy tờ xe đã hết hạn':'Giấy tờ xe sắp hết hạn',
    message:(asset.name||asset.id)+' · '+item.label+' · '+item.text+' · Hạn: '+item.date.split('-').reverse().join('/'),
    type:'warning',icon:'ti-bell-ringing',sourceType:'asset-expiry',sourceId:String(asset.id),targetPage:'assets',
    expiryDate:item.date,documentKind:item.key,createdAt:fmtDT(),createdAtIso:new Date().toISOString(),createdBy:'Hệ thống',readAt:''
  })));
}
function scfMergeAssetExpiryNotifications(previous,desired,userId){
  const old=previous||[],wanted=new Map(desired.map(item=>[item.id,item]));
  let updated=false;
  const remaining=old.filter(item=>item.sourceType!=='asset-expiry'||String(item.recipientId)!==String(userId)||wanted.has(item.id)).map(item=>{
    const next=wanted.get(item.id);if(!next||next.message===item.message)return item;
    updated=true;return {...item,message:next.message};
  });
  const ids=new Set(remaining.map(item=>item.id)),added=desired.filter(item=>!ids.has(item.id));
  return !added.length&&!updated&&remaining.length===old.length?previous:[...added,...remaining];
}
function scfAssetFileType(file){
  const ext=String(file?.name||'').split('.').pop().toLowerCase();
  const types={jpg:'image/jpeg',jpeg:'image/jpeg',png:'image/png',webp:'image/webp',pdf:'application/pdf',doc:'application/msword',docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',xls:'application/vnd.ms-excel',xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'};
  if(!types[ext])throw new Error('Chọn ảnh JPG/PNG/WebP, PDF, Word hoặc Excel.');
  if(!file.size||file.size>15*1024*1024)throw new Error('Mỗi tệp cần có dữ liệu và không quá 15 MB.');
  if(file.type&&file.type!=='application/octet-stream'&&file.type!==types[ext])throw new Error('Định dạng tệp không khớp phần mở rộng.');
  return types[ext];
}
async function scfUploadAssetFile(file,assetId,kind){
  const mime=scfAssetFileType(file);
  if(!sb)throw new Error('Chưa kết nối kho tài liệu. Hãy kiểm tra mạng rồi thử lại.');
  const safe=String(assetId).replace(/[^a-zA-Z0-9_-]/g,'_');
  const name=String(file.name).replace(/[^a-zA-Z0-9._-]/g,'_');
  const path=safe+'/'+kind+'/'+(crypto.randomUUID?.()||uid())+'-'+name;
  const {error}=await withRemoteTimeout(sb.storage.from(SCF_ASSET_FILE_BUCKET).upload(path,file,{contentType:mime,upsert:false}),30000);
  if(error)throw new Error('Không tải được tệp: '+error.message);
  return {id:uid(),name:file.name,path,mime,size:file.size,uploadedAt:new Date().toISOString()};
}
async function scfAssetFileUrl(file){
  if(!file?.path||!sb)throw new Error('Chưa kết nối kho tài liệu.');
  const {data,error}=await withRemoteTimeout(sb.storage.from(SCF_ASSET_FILE_BUCKET).createSignedUrl(file.path,3600),15000);
  if(error||!data?.signedUrl)throw new Error('Không mở được tài liệu. Kiểm tra quyền truy cập và kết nối mạng.');
  return data.signedUrl;
}
function AssetFileLink({file,onRemove}){
  const [busy,setBusy]=useState(false);
  const open=async()=>{
    // Mở cửa sổ trong lần chạm để trình duyệt điện thoại không chặn popup.
    const popup=window.open('about:blank','_blank');if(popup)popup.opener=null;
    setBusy(true);
    try{const url=await scfAssetFileUrl(file);if(popup)popup.location.replace(url);else window.showToast('Trình duyệt đang chặn cửa sổ xem tài liệu. Hãy cho phép mở cửa sổ rồi thử lại.','warn');}
    catch(error){popup?.close();window.showToast(error.message,'error');}
    finally{setBusy(false);}
  };
  return h('div',{className:'asset-file-row'},h('button',{type:'button',className:'asset-file-link','data-scf-action':'view',onClick:open,disabled:busy},h('i',{className:file.mime?.startsWith('image/')?'ti ti-photo':'ti ti-file-description'}),busy?'Đang mở…':file.name),onRemove&&h('button',{type:'button',className:'bi','aria-label':'Bỏ tệp '+file.name,onClick:onRemove},h('i',{className:'ti ti-x'})));
}
function AssetFilePicker({label,files=[],assetId,kind,onChange,onBusy}){
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const alive=React.useRef(true);useEffect(()=>()=>{alive.current=false;},[]);
  const pick=async event=>{
    const selected=Array.from(event.target.files||[]);event.target.value='';if(!selected.length||busy)return;
    setBusy(true);setError('');onBusy(kind,true);
    const uploaded=[];
    try{selected.forEach(scfAssetFileType);for(const file of selected)uploaded.push(await scfUploadAssetFile(file,assetId,kind));}
    catch(err){if(alive.current)setError(err.message);}
    finally{if(alive.current){if(uploaded.length)onChange([...files,...uploaded]);setBusy(false);onBusy(kind,false);}}
  };
  return h('section',{className:'asset-document-group'},h('strong',null,label),files.map(file=>h(AssetFileLink,{key:file.id||file.path,file,onRemove:busy?null:()=>onChange(files.filter(item=>item!==file))})),
    h('label',{className:'asset-upload-button'},h('i',{className:'ti ti-upload'}),busy?'Đang tải…':'Tải ảnh / tài liệu',h('input',{type:'file',multiple:true,accept:'.jpg,.jpeg,.png,.webp,.pdf,.doc,.docx,.xls,.xlsx',disabled:busy,onChange:pick})),error&&h('div',{role:'alert',className:'asset-upload-error'},error));
}
