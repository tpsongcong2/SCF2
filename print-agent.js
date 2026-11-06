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

function scfIsAppleMobilePrint(){return typeof navigator!=='undefined'&&(/iPhone|iPad|iPod/i.test(navigator.userAgent||'')||/Macintosh/i.test(navigator.userAgent||'')&&navigator.maxTouchPoints>1);}
function scfSupportsX420App(){return typeof navigator!=='undefined'&&(/Android/i.test(navigator.userAgent||'')||scfIsAppleMobilePrint());}
function scfIsPhonePrint(){return scfSupportsX420App()||/Mobile/i.test(typeof navigator==='undefined'?'':navigator.userAgent||'');}
async function scfChooseMobilePrintRoute(settings,{labels=true}={}){
  if(!scfIsPhonePrint())return '';
  return new Promise((resolve,reject)=>{
    const overlay=document.createElement('div');overlay.className='overlay';overlay.style.zIndex='2000';
    const panel=document.createElement('section');panel.className='modal';panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','Chọn cách in');panel.style.cssText='max-width:440px;width:calc(100% - 24px);padding:20px';
    const title=document.createElement('h3');title.textContent=labels?'Chọn cách in tem':'Chọn cách in đơn';panel.append(title);
    const finish=value=>{document.removeEventListener('keydown',escape);overlay.remove();if(value)resolve(value);else reject(Error('Đã hủy chọn cách in.'));};
    const escape=e=>{if(e.key==='Escape')finish('');};document.addEventListener('keydown',escape);
    for(const [value,label] of [...(labels?[['android','Wi-Fi trực tiếp XP420']]:[]),['lan','In qua Wi-Fi SCF10'],['cloud','In từ xa SCF10'],['','Hủy']]){
      const button=document.createElement('button');button.type='button';button.textContent=label;button.style.cssText='display:block;width:100%;min-height:48px;margin-top:12px';button.disabled=value==='android'&&!(settings.sharedManaged&&settings.androidEnabled&&scfSupportsX420App())||value==='lan'&&!(settings.sharedManaged&&settings.lanEnabled);button.onclick=()=>finish(value);panel.append(button);
    }
    overlay.append(panel);document.body.append(overlay);panel.querySelector('button:not(:disabled)').focus();
  });
}
function scfChooseMobileLabelRoute(settings){return scfChooseMobilePrintRoute(settings);}
function scfDefaultLabelRoute(){const settings=scfPrintAgentSettings({trip:true});return scfSupportsX420App()&&settings.sharedManaged&&settings.androidEnabled?'android':'cloud';}
function ScfPrintRouteChoices({value,onChange,disabled=false,labels=true}){
  const name=React.useId(),settings=scfPrintAgentSettings({trip:true});
  const available=id=>id==='android'?scfSupportsX420App()&&settings.sharedManaged&&settings.androidEnabled===true:id==='lan'?settings.sharedManaged&&settings.lanEnabled===true:true;
  const options=[...(labels?[['android','Wi-Fi trực tiếp XP420']]:[]),['lan','In qua Wi-Fi SCF10'],['cloud','In từ xa SCF10']];
  return h('fieldset',{className:'scf-print-route-choices',disabled},h('legend',null,'Cách in'),h('div',{className:'scf-print-route-options'},options.map(([id,label])=>h('label',{key:id,'data-selected':value===id,'data-unavailable':!available(id)},h('input',{type:'radio',name,value:id,checked:value===id,disabled:disabled||!available(id),onChange:()=>onChange(id)}),label))),h('small',null,value==='android'?'Mở app XP420. Điện thoại và máy in phải cùng mạng.':value==='lan'?'Gửi trực tiếp tới Agent SCF10 trong cùng mạng. Không tự chuyển sang in từ xa khi lỗi.':'Gửi qua Internet tới máy tính SCF10. Không cần cùng Wi-Fi.'));
}
function ScfLabelRouteChoices(props){return h(ScfPrintRouteChoices,{...props,labels:true});}
function ScfA4RouteChoices(props){return scfIsPhonePrint()?h(ScfPrintRouteChoices,{...props,labels:false}):null;}
async function scfExplicitLanRoute(settings,role,tripContext){
 if(!settings.sharedManaged||!settings.lanEnabled||!tripContext)throw Error('Admin cần bật Wi-Fi Agent và cấu hình SCF10 trong Cài đặt chuyến giao hàng.');
 const target=role==='canon'?settings.a4AgentId:settings.agentId;
 if(String(target||'').toUpperCase()!=='SCF10')throw Error('Đường in Wi-Fi cần chọn máy tính SCF10.');
 return scfSelectPrintRoute(settings,role,true);
}
async function scfQueueLabelPrint({agentId,printerRole='x350',label,title,paperWidthMm,paperHeightMm,svgs,labelDetails,rotate180=false,beforeEnqueue,tripContext,simulate=false,mobilePrintRoute,deferNativeOpen=false}){
  beforeEnqueue?.();
  if(simulate){window.showToast('Trải nghiệm: đã mô phỏng gửi '+svgs.length+' tem; không gửi máy in thật.','success');return {id:'PREVIEW'};}
  const sharedSettings=scfPrintAgentSettings({trip:!!tripContext});
  if(sharedSettings.sharedManaged){agentId=sharedSettings.agentId;printerRole=sharedSettings.printerRole;}
  const target=String(agentId||'SCF-PC-01').trim().toUpperCase();
  if(!target)throw new Error('Chưa nhập mã SCF Print Agent.');
  if(!Array.isArray(svgs)||!svgs.length)throw new Error('Chưa có tem để gửi in.');
  const phone=scfIsPhonePrint();
  const choice=mobilePrintRoute||(phone?await scfChooseMobileLabelRoute(sharedSettings):'');
  beforeEnqueue?.();
  if(choice&&!['android','lan','cloud'].includes(choice)||phone&&!choice)throw Error('Chọn cách in tem trước khi gửi.');
  if(choice==='cloud'&&target!=='SCF10')throw Error('Admin cần chọn mã máy in tem SCF10 trong Cài đặt chuyến giao hàng.');
  if(choice==='android'&&!(sharedSettings.sharedManaged&&sharedSettings.androidEnabled&&tripContext&&scfSupportsX420App()))throw Error('Chưa bật in tem qua app XPRINTER 420 cho đơn này.');
  const android=choice==='android';
  const route=choice==='lan'?await scfExplicitLanRoute(sharedSettings,printerRole,tripContext):!choice&&!phone&&!android&&sharedSettings.sharedManaged&&sharedSettings.lanEnabled&&tripContext?await scfSelectPrintRoute(sharedSettings,printerRole):{route:'cloud'};
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
  if(scoped){const {data,error}=await invokeScfAuth({body:{action:'driver_print',transport:android?'android':undefined,job,tripContext}});if(error||!data?.ok)throw new Error(await serverFunctionErrorMessage(error,data,'Chưa gửi được lệnh in cho chuyến.'));if(android){if(!data.androidAccess)throw Error('Máy chủ chưa hỗ trợ app XPRINTER 420.');job.transport='android';job.androidAccess=data.androidAccess;window.scfQueueAndroidHandoff(data.androidAccess,job.title,svgs.length,{deferOpen:deferNativeOpen});}}
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

async function scfQueueA4Print(html,{agentId,title='Đơn hàng SCF',tripContext,simulate=false,beforeEnqueue,mobilePrintRoute}={}){
  beforeEnqueue?.();
  if(simulate){window.showToast('Trải nghiệm: đã mô phỏng in phiếu; không gửi máy in thật.','success');return {id:'PREVIEW'};}
  const settings=scfPrintAgentSettings({trip:!!tripContext});
  const target=String(settings.sharedManaged?settings.a4AgentId:agentId||settings.a4AgentId||settings.agentId||'SCF-PC-01').trim().toUpperCase();
  const phone=scfIsPhonePrint();
  if(phone&&target!=='SCF10')throw Error('Admin cần chọn mã máy in A4 SCF10 trong Cài đặt chuyến giao hàng.');
  const choice=mobilePrintRoute||(phone?await scfChooseMobilePrintRoute(settings,{labels:false}):'');
  if(choice&&!['lan','cloud'].includes(choice))throw Error('In đơn chỉ hỗ trợ Wi-Fi SCF10 hoặc in từ xa SCF10.');
  beforeEnqueue?.();
  const route=choice==='lan'?await scfExplicitLanRoute(settings,'canon',tripContext):!choice&&!phone&&settings.sharedManaged&&settings.lanEnabled&&tripContext?await scfSelectPrintRoute(settings,'canon'):{route:'cloud'};
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
