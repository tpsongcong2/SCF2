/* SCF Print Agent bridge: render label SVGs, upload them and enqueue a Windows print job. */
const SCF_PRINT_QUEUE_KEY='scf_print_jobs';
const SCF_PRINT_SETTINGS_KEY='scf_print_agent_settings';

function scfPrintAgentSettings({trip=false}={}){
  let local={};
  try{
    local=JSON.parse(localStorage.getItem(SCF_PRINT_SETTINGS_KEY)||'{}')||{};
  }catch{}
  const shared=window.__SCF_UI_SETTINGS?.driverPrinters,access=window.__SCF_ACCESS_CONTEXT;
  if(shared?.enabled===true&&(trip||access?.role==='driver'||['trips','driver-preview'].includes(access?.page)))return {...local,agentId:shared.labelAgentId,printerRole:shared.labelPrinterRole,a4AgentId:shared.a4AgentId,lanEnabled:shared.lanEnabled===true,autoRoute:shared.autoRoute===true,labelAutoAddress:shared.labelAutoAddress===true,a4AutoAddress:shared.a4AutoAddress===true,labelLanUrl:shared.labelLanUrl,a4LanUrl:shared.a4LanUrl,androidEnabled:shared.androidEnabled===true,androidShelfLifeHours:shared.androidShelfLifeHours===36?36:24,sharedManaged:true};
  return local;
}

function scfSavePrintAgentSettings(value){
  let previous={};try{previous=JSON.parse(localStorage.getItem(SCF_PRINT_SETTINGS_KEY)||'{}')||{};}catch{}
  const next={...previous,...(value||{})};delete next.sharedManaged;
  localStorage.setItem(SCF_PRINT_SETTINGS_KEY,JSON.stringify(next));
  return next;
}

function scfSvgToPngFile(svg,index,rotate180=false,paperWidthMm=58,paperHeightMm=40){
  const width=Number(paperWidthMm),height=Number(paperHeightMm);
  if(!(width>0&&width<=210&&height>0&&height<=297))return Promise.reject(new Error('Khổ tem không hợp lệ.'));
  // Render directly from SVG at 600 dpi; never enlarge a previously rasterized image.
  return new Promise((resolve,reject)=>{
    const source=new Blob([svg],{type:'image/svg+xml;charset=utf-8'});
    const url=URL.createObjectURL(source);
    const image=new Image();
    image.onload=()=>{
      try{
        const canvas=document.createElement('canvas');
        canvas.width=Math.round(width/25.4*600);
        canvas.height=Math.round(height/25.4*600);
        const ctx=canvas.getContext('2d');
        ctx.fillStyle='#fff';
        ctx.fillRect(0,0,canvas.width,canvas.height);
        if(rotate180){
          ctx.translate(canvas.width,canvas.height);
          ctx.rotate(Math.PI);
        }
        ctx.drawImage(image,0,0,canvas.width,canvas.height);
        canvas.toBlob(blob=>{
          URL.revokeObjectURL(url);
          if(!blob){reject(new Error('Không tạo được ảnh tem.'));return;}
          resolve(new File([blob],'scf-label-'+String(index+1).padStart(3,'0')+'.png',{type:'image/png'}));
          canvas.width=canvas.height=1;
        },'image/png');
      }catch(error){
        URL.revokeObjectURL(url);
        reject(error);
      }
    };
    image.onerror=()=>{
      URL.revokeObjectURL(url);
      reject(new Error('Không đọc được mẫu tem.'));
    };
    image.src=url;
  });
}

// Print artwork must bypass uploadPhoto, which intentionally recompresses photos as JPEG.
async function scfUploadLabelPng(file,target){
  if(file?.type!=='image/png'||!file.size||file.size>5242880)throw new Error('Ảnh tem PNG không hợp lệ hoặc vượt 5 MB.');
  if(!sb)throw new Error('Chưa kết nối kho ảnh tem. Hãy kiểm tra mạng.');
  const folder=String(target).replace(/[^A-Z0-9_-]/g,'_');
  const path='print-agent/'+folder+'/'+new Date().toISOString().slice(0,10)+'/'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)+'-'+file.name;
  const {error}=await withRemoteTimeout(sb.storage.from(SUPA_PHOTO_BUCKET).upload(path,file,{contentType:'image/png',upsert:false}),30000);
  if(error)throw new Error('Không tải được ảnh tem: '+(error.message||error));
  const url=await withRemoteTimeout(createPrivatePhotoUrl(path),15000);
  if(!url)throw new Error('Không tạo được đường dẫn ảnh tem.');
  return url;
}

async function scfQueueLabelPrint({agentId,printerRole='x350',label,title,paperWidthMm,paperHeightMm,svgs,labelDetails,rotate180=false,beforeEnqueue,tripContext,simulate=false}){
  beforeEnqueue?.();
  if(simulate){window.showToast('Trải nghiệm: đã mô phỏng gửi '+svgs.length+' tem; không gửi máy in thật.','success');return {id:'PREVIEW'};}
  const sharedSettings=scfPrintAgentSettings({trip:!!tripContext});
  if(sharedSettings.sharedManaged){agentId=sharedSettings.agentId;printerRole=sharedSettings.printerRole;}
  const target=String(agentId||'SCF-PC-01').trim().toUpperCase();
  if(!target)throw new Error('Chưa nhập mã SCF Print Agent.');
  if(!Array.isArray(svgs)||!svgs.length)throw new Error('Chưa có tem để gửi in.');
  const android=sharedSettings.sharedManaged&&sharedSettings.androidEnabled&&tripContext&&/Android/i.test(navigator.userAgent||'');
  const route=!android&&sharedSettings.sharedManaged&&sharedSettings.lanEnabled&&tripContext?await scfSelectPrintRoute(sharedSettings,printerRole):{route:'cloud'};
  if(route.route==='lan'){
    const images=[];
    for(let index=0;index<svgs.length;index++){
      beforeEnqueue?.();const file=await scfSvgToPngFile(svgs[index],index,rotate180,paperWidthMm,paperHeightMm);
      images.push(await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Không đọc được ảnh tem.'));reader.readAsDataURL(file);}));
    }
    beforeEnqueue?.();
    return window.scfSendLanPrint({agentId:target,printerRole,label:String(label||title||'Tem SCF'),title:String(title||'In tem SCF'),paperWidthMm:Number(paperWidthMm)||58,paperHeightMm:Number(paperHeightMm)||40,images,labelImageVersion:2,labelSourceDpi:600},tripContext,route.endpoint,beforeEnqueue);
  }
  const imageUrls=[];
  for(let index=0;index<svgs.length;index++){
    beforeEnqueue?.();
    const file=await scfSvgToPngFile(svgs[index],index,rotate180,paperWidthMm,paperHeightMm);
    const url=await scfUploadLabelPng(file,target);
    if(!url||String(url).startsWith('data:')){
      throw new Error('Không tải được ảnh tem lên máy chủ. Hãy kiểm tra mạng rồi thử lại.');
    }
    imageUrls.push(url);
  }
  const scoped=tripContext&&typeof serverAuthEnabled==='function'&&serverAuthEnabled();
  const current=scoped?[]:await dbGet(SCF_PRINT_QUEUE_KEY,[]);
  const queue=Array.isArray(current)?current:[];
  const job={
    id:'PJ'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),
    agentId:target,
    printerRole:String(printerRole||'x350').toLowerCase(),
    label:String(label||title||'Tem SCF'),
    title:String(title||'In tem SCF'),
    paperWidthMm:Number(paperWidthMm)||58,
    paperHeightMm:Number(paperHeightMm)||40,
    images:imageUrls,
    labelImageVersion:2,
    labelSourceDpi:600,
    previewRotate180:!!rotate180,
    ...(android?{labelDetails}:{}),
    status:'pending',
    createdAt:new Date().toISOString(),
    attempts:0
  };
  beforeEnqueue?.();
  if(scoped){const {data,error}=await invokeScfAuth({body:{action:'driver_print',transport:android?'android':undefined,job,tripContext}});if(error||!data?.ok)throw new Error(await serverFunctionErrorMessage(error,data,'Chưa gửi được lệnh in cho chuyến.'));if(android){if(!data.androidAccess)throw Error('Máy chủ chưa hỗ trợ app Android.');job.transport='android';window.scfQueueAndroidHandoff(data.androidAccess,job.title,svgs.length);}}
  else await dbSet(SCF_PRINT_QUEUE_KEY,[...queue.filter(Boolean),job]);
  scfSavePrintAgentSettings({agentId:target});
  return job;
}

window.scfPrintAgentSettings=scfPrintAgentSettings;
window.scfSavePrintAgentSettings=scfSavePrintAgentSettings;
window.scfQueueLabelPrint=scfQueueLabelPrint;

function scfShouldUsePrintAgent(){
  return window.matchMedia?.('(max-width: 820px)').matches||
    /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||'');
}

async function scfQueueA4Print(html,{agentId,title='Đơn hàng SCF',tripContext,simulate=false,beforeEnqueue}={}){
  beforeEnqueue?.();
  if(simulate){window.showToast('Trải nghiệm: đã mô phỏng in phiếu; không gửi máy in thật.','success');return {id:'PREVIEW'};}
  const settings=scfPrintAgentSettings({trip:!!tripContext});
  const target=String(settings.sharedManaged?settings.a4AgentId:agentId||settings.a4AgentId||settings.agentId||'SCF-PC-01').trim().toUpperCase();
  const route=settings.sharedManaged&&settings.lanEnabled&&tripContext?await scfSelectPrintRoute(settings,'canon'):{route:'cloud'};
  if(route.route==='lan')return window.scfSendLanPrint({agentId:target,printerRole:'canon',label:String(title),title:String(title),paperWidthMm:210,paperHeightMm:297,html:String(html||'')},tripContext,route.endpoint,beforeEnqueue);
  const scoped=tripContext&&typeof serverAuthEnabled==='function'&&serverAuthEnabled();
  const current=scoped?[]:await dbGet(SCF_PRINT_QUEUE_KEY,[]);
  const queue=Array.isArray(current)?current:[];
  const job={
    id:'PJ'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),
    agentId:target,
    printerRole:'canon',
    label:String(title||'Đơn hàng A4'),
    title:String(title||'Đơn hàng SCF'),
    paperWidthMm:210,
    paperHeightMm:297,
    html:String(html||''),
    status:'pending',
    createdAt:new Date().toISOString(),
    attempts:0
  };
  if(!job.html)throw new Error('Không tạo được nội dung đơn hàng để in.');
  beforeEnqueue?.();
  if(scoped){const {data,error}=await invokeScfAuth({body:{action:'driver_print',job,tripContext}});if(error||!data?.ok)throw new Error(await serverFunctionErrorMessage(error,data,'Chưa gửi được lệnh in cho chuyến.'));}
  else await dbSet(SCF_PRINT_QUEUE_KEY,[...queue.filter(Boolean),job]);
  scfSavePrintAgentSettings({agentId:target});
  return job;
}

window.scfShouldUsePrintAgent=scfShouldUsePrintAgent;
window.scfQueueA4Print=scfQueueA4Print;
