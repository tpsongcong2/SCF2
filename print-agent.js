/* SCF Print Agent bridge: render label SVGs, upload them and enqueue a Windows print job. */
const SCF_PRINT_QUEUE_KEY='scf_print_jobs';
const SCF_PRINT_SETTINGS_KEY='scf_print_agent_settings';

function scfPrintAgentSettings(){
  try{
    return JSON.parse(localStorage.getItem(SCF_PRINT_SETTINGS_KEY)||'{}')||{};
  }catch{return {};}
}

function scfSavePrintAgentSettings(value){
  const next={...scfPrintAgentSettings(),...(value||{})};
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

async function scfQueueLabelPrint({agentId,printerRole='x350',label,title,paperWidthMm,paperHeightMm,svgs,rotate180=false,beforeEnqueue}){
  beforeEnqueue?.();
  const target=String(agentId||'SCF-PC-01').trim().toUpperCase();
  if(!target)throw new Error('Chưa nhập mã SCF Print Agent.');
  if(!Array.isArray(svgs)||!svgs.length)throw new Error('Chưa có tem để gửi in.');
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
  const current=await dbGet(SCF_PRINT_QUEUE_KEY,[]);
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
    status:'pending',
    createdAt:new Date().toISOString(),
    attempts:0
  };
  beforeEnqueue?.();
  await dbSet(SCF_PRINT_QUEUE_KEY,[...queue.filter(Boolean),job]);
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

async function scfQueueA4Print(html,{agentId,title='Đơn hàng SCF'}={}){
  const settings=scfPrintAgentSettings();
  const target=String(agentId||settings.agentId||'SCF-PC-01').trim().toUpperCase();
  const current=await dbGet(SCF_PRINT_QUEUE_KEY,[]);
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
  await dbSet(SCF_PRINT_QUEUE_KEY,[...queue.filter(Boolean),job]);
  scfSavePrintAgentSettings({agentId:target});
  return job;
}

window.scfShouldUsePrintAgent=scfShouldUsePrintAgent;
window.scfQueueA4Print=scfQueueA4Print;
