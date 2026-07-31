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

function scfSvgToJpegFile(svg,index,rotate180=false){
  return new Promise((resolve,reject)=>{
    const source=new Blob([svg],{type:'image/svg+xml;charset=utf-8'});
    const url=URL.createObjectURL(source);
    const image=new Image();
    image.onload=()=>{
      try{
        const canvas=document.createElement('canvas');
        canvas.width=image.naturalWidth||image.width||1000;
        canvas.height=image.naturalHeight||image.height||1000;
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
          resolve(new File([blob],'scf-label-'+String(index+1).padStart(3,'0')+'.jpg',{type:'image/jpeg'}));
        },'image/jpeg',0.98);
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

async function scfQueueLabelPrint({agentId,printerRole='x350',label,title,paperWidthMm,paperHeightMm,svgs,rotate180=false}){
  const target=String(agentId||'SCF-PC-01').trim().toUpperCase();
  if(!target)throw new Error('Chưa nhập mã SCF Print Agent.');
  if(!Array.isArray(svgs)||!svgs.length)throw new Error('Chưa có tem để gửi in.');
  const imageUrls=[];
  for(let index=0;index<svgs.length;index++){
    const file=await scfSvgToJpegFile(svgs[index],index,rotate180);
    const url=await uploadPhoto(file,'print-agent/'+target,{max:1800,quality:.98});
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
    status:'pending',
    createdAt:new Date().toISOString(),
    attempts:0
  };
  await dbSet(SCF_PRINT_QUEUE_KEY,[...queue.filter(item=>item&&item.status!=='done').slice(-99),job]);
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
  await dbSet(SCF_PRINT_QUEUE_KEY,[...queue.filter(item=>item&&item.status!=='done').slice(-99),job]);
  return job;
}

window.scfShouldUsePrintAgent=scfShouldUsePrintAgent;
window.scfQueueA4Print=scfQueueA4Print;
