/* Prepared summaries are private server artifacts. Never persist them across accounts on this device. */
async function scfReadPreparedSummary(kind,date,options={}){
 if(typeof invokeScfAuth!=='function'||typeof sb==='undefined'||!sb)return null;
 try{
  const {data,error}=await invokeScfAuth({body:{action:'summary_cache',operation:'read',kind,date,...options}},kind==='trip'&&options.liveFallback?12000:4000);
  if(error||!data?.ok)return null;
  return data;
 }catch{return null;}
}
// V887: ảnh máy chủ (SVG) được vẽ lại thành PNG đúng kích thước gốc trước khi hiện, giống ảnh tạo trên máy trước đây.
// Hiện SVG trực tiếp: điện thoại vẽ chữ và đường kẻ ở cỡ đã thu nhỏ nên mảnh, mờ — bảng trông nhạt hơn.
async function scfPreparedSummaryPngBlob(svg){
 const src=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
 try{
  const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Chưa tải được ảnh đơn tổng.'));image.src=src;});
  const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#ffffff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0);
  return await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('Chưa tạo được ảnh PNG.')),'image/png'));
 }finally{URL.revokeObjectURL(src);}
}
async function scfDownloadPreparedSummaryPng(svg,filename){
 const blob=await scfPreparedSummaryPngBlob(svg),output=URL.createObjectURL(blob);
 try{const anchor=document.createElement('a');anchor.href=output;anchor.download=filename;anchor.click();}
 finally{setTimeout(()=>URL.revokeObjectURL(output),1000);}
}
function scfSummaryUpdatedLabel(value){const date=new Date(value);return Number.isFinite(date.getTime())?date.toLocaleString('vi-VN',{timeZone:'Asia/Bangkok'}):'';}
