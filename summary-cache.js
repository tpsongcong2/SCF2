/* Prepared summaries are private server artifacts. Never persist them across accounts on this device. */
async function scfReadPreparedSummary(kind,date,options={}){
 if(typeof invokeScfAuth!=='function'||typeof sb==='undefined'||!sb)return null;
 try{
  const {data,error}=await invokeScfAuth({body:{action:'summary_cache',operation:'read',kind,date,...options}},4000);
  if(error||!data?.ok)return null;
  return data;
 }catch{return null;}
}
async function scfDownloadPreparedSummaryPng(svg,filename){
 const src=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));let output='';
 try{
  const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Chưa tải được ảnh để xuất PNG.'));image.src=src;});
  const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;canvas.getContext('2d').drawImage(image,0,0);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('Chưa xuất được ảnh PNG.')),'image/png'));
  output=URL.createObjectURL(blob);const anchor=document.createElement('a');anchor.href=output;anchor.download=filename;anchor.click();
 }finally{URL.revokeObjectURL(src);if(output)setTimeout(()=>URL.revokeObjectURL(output),1000);}
}
function scfSummaryUpdatedLabel(value){const date=new Date(value);return Number.isFinite(date.getTime())?date.toLocaleString('vi-VN',{timeZone:'Asia/Bangkok'}):'';}
