function printTemplateFieldLabel(key){return PRINT_TEMPLATE_FIELD_MAP[key]?.label||key||'';}
function normalizeTemplateScopeItems(tpl){
  const fromItems=Array.isArray(tpl?.scopeItems)?tpl.scopeItems:[];
  const idsRaw=Array.isArray(tpl?.scopeIds)?tpl.scopeIds:(tpl?.scopeId?[tpl.scopeId]:[]);
  const namesRaw=Array.isArray(tpl?.scopeNames)?tpl.scopeNames:(tpl?.scopeName?[tpl.scopeName]:[]);
  const map=new Map();
  fromItems.forEach(item=>{
    const id=String(item?.id||'').trim();
    const name=String(item?.name||'').trim();
    if(id||name)map.set(id||name,{id,name:name||id});
  });
  idsRaw.forEach((rawId,idx)=>{
    const id=String(rawId||'').trim();
    const name=String(namesRaw[idx]||'').trim()||id;
    if(id||name)map.set(id||name,{id,name});
  });
  namesRaw.forEach(rawName=>{
    const name=String(rawName||'').trim();
    if(name&&!map.has(name))map.set(name,{id:'',name});
  });
  return [...map.values()].filter(item=>item.id||item.name);
}
function templateScopeList(tpl){
  return normalizeTemplateScopeItems(tpl);
}
function templateScopeLabel(tpl){
  const items=templateScopeList(tpl);
  if(!items.length)return tpl?.scopeName||'';
  if(items.length<=3)return items.map(item=>item.name||item.id).filter(Boolean).join(', ');
  const first=items.slice(0,2).map(item=>item.name||item.id).filter(Boolean).join(', ');
  return first+' +'+(items.length-2)+' mục';
}
function templateScopeCount(tpl){
  return templateScopeList(tpl).length||0;
}
function normalizePrintTemplateSettings(raw){
  const src=raw&&typeof raw==='object'?raw:{};
  const normalizeList=(arr,type)=>Array.isArray(arr)?arr.map((tpl,i)=>{
    const vars=Array.isArray(tpl?.variables)?tpl.variables:[];
    const mappings=Array.isArray(tpl?.mappings)?tpl.mappings:[];
    const scopeItems=normalizeTemplateScopeItems(tpl);
    const scopeIds=scopeItems.map(item=>String(item.id||'').trim()).filter(Boolean);
    const scopeNames=scopeItems.map(item=>String(item.name||item.id||'').trim()).filter(Boolean);
    return {
      id:String(tpl?.id||('TPL'+type+i)),
      type:type,
      scopeId:String(scopeIds[0]||tpl?.scopeId||''),
      scopeName:String(scopeNames[0]||tpl?.scopeName||''),
      scopeIds:scopeIds,
      scopeNames:scopeNames,
      scopeItems:scopeItems,
      fileName:String(tpl?.fileName||''),
      fileSize:Number(tpl?.fileSize||0),
      mimeType:String(tpl?.mimeType||''),
      uploadedAt:String(tpl?.uploadedAt||''),
      fileDataUrl:String(tpl?.fileDataUrl||''),
      sheets:Array.isArray(tpl?.sheets)?tpl.sheets.filter(Boolean).map(String):[],
      variables:vars.map(v=>typeof v==='string'?{name:v,sheets:[],count:1}:{name:String(v?.name||''),sheets:Array.isArray(v?.sheets)?v.sheets.filter(Boolean).map(String):[],count:Math.max(1,Number(v?.count||1))}).filter(v=>v.name),
      mappings:mappings.map(m=>({name:String(m?.name||''),sourceKey:String(m?.sourceKey||''),sourceLabel:String(m?.sourceLabel||printTemplateFieldLabel(m?.sourceKey||'')),note:String(m?.note||'')})).filter(m=>m.name)
    };
  }).filter(tpl=>tpl.scopeIds.length&&tpl.fileName):[];
  return {labelTemplates:normalizeList(src.labelTemplates,'label'),orderTemplates:normalizeList(src.orderTemplates,'order')};
}
function readFileAsDataUrl(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=e=>resolve(String(e.target?.result||''));
    reader.onerror=()=>reject(reader.error||new Error('Không đọc được file.'));
    reader.readAsDataURL(file);
  });
}
function extractTemplateVariablesFromWorkbook(wb){
  const found=new Map();
  const rg=/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g;
  (wb?.SheetNames||[]).forEach(sheetName=>{
    const ws=wb.Sheets[sheetName];
    if(!ws||!ws['!ref'])return;
    const range=XLSX.utils.decode_range(ws['!ref']);
    for(let r=range.s.r;r<=range.e.r;r++){
      for(let c=range.s.c;c<=range.e.c;c++){
        const cell=ws[XLSX.utils.encode_cell({r,c})];
        if(!cell)continue;
        const raw=String(cell.w??cell.v??'');
        if(!raw)continue;
        rg.lastIndex=0;
        let match;
        while((match=rg.exec(raw))){
          const name=String(match[1]||'').trim();
          if(!name)continue;
          const prev=found.get(name)||{name,sheets:new Set(),count:0};
          prev.sheets.add(sheetName);
          prev.count+=1;
          found.set(name,prev);
        }
      }
    }
  });
  return [...found.values()].map(v=>({name:v.name,sheets:[...v.sheets],count:v.count})).sort((a,b)=>a.name.localeCompare(b.name,'vi'));
}
function mergeTemplateVariableMappings(variables,prevMappings){
  const oldMap=new Map((prevMappings||[]).map(item=>[item.name,item]));
  return (variables||[]).map(v=>{
    const old=oldMap.get(v.name)||{};
    return {name:v.name,sourceKey:String(old.sourceKey||''),sourceLabel:String(old.sourceLabel||printTemplateFieldLabel(old.sourceKey||'')),note:String(old.note||'')};
  });
}
function guessPrintTemplateFieldKey(variableName){
  const key=String(variableName||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  if(!key)return'';
  if(PRINT_TEMPLATE_FIELD_MAP[variableName])return variableName;
  return PRINT_TEMPLATE_FIELD_ALIASES[key]||'';
}
function templateBookType(fileName){
  const ext=String(fileName||'').split('.').pop().toLowerCase();
  if(ext==='xlsm')return'xlsm';
  if(ext==='xls')return'xls';
  return'xlsx';
}
function templateOutputExt(fileName){
  const ext=String(fileName||'').split('.').pop().toLowerCase();
  return ['xlsx','xlsm','xls'].includes(ext)?ext:'xlsx';
}
function cloneTemplateSheet(ws){
  const out={};
  Object.keys(ws||{}).forEach(k=>{
    const val=ws[k];
    if(val&&typeof val==='object'){
      try{out[k]=JSON.parse(JSON.stringify(val));}
      catch{out[k]=Array.isArray(val)?val.slice():{...val};}
    }else out[k]=val;
  });
  return out;
}
function uniqueTemplateSheetName(existingNames,baseName){
  const clean=String(baseName||'Sheet').replace(/[\\\/\?\*\[\]:]/g,' ').replace(/\s+/g,' ').trim()||'Sheet';
  let name=clean.slice(0,31);
  let i=1;
  while(existingNames.includes(name)){
    const suffix='_'+i++;
    name=(clean.slice(0,Math.max(1,31-suffix.length))+suffix).slice(0,31);
  }
  return name;
}
function normalizeTemplateScalar(value){
  if(value===null||value===undefined)return'';
  if(typeof value==='number'){
    if(!Number.isFinite(value))return'';
    return Number.isInteger(value)?String(value):String(Number(value.toFixed(3)));
  }
  if(typeof value==='boolean')return value?'TRUE':'FALSE';
  return String(value);
}
function templateFieldKeyForVariable(template,varName){
  const mapped=(template?.mappings||[]).find(m=>m.name===varName&&m.sourceKey);
  return mapped?.sourceKey||guessPrintTemplateFieldKey(varName)||String(varName||'');
}
function templateUsesMappedPrefix(template,prefix){
  const p=String(prefix||'');
  const names=(template?.variables||[]).map(v=>typeof v==='string'?v:v?.name).filter(Boolean);
  return names.some(name=>String(templateFieldKeyForVariable(template,name)||'').startsWith(p));
}
function readWorkbookFromTemplateDataUrl(dataUrl){
  const base64=String(dataUrl||'').split(',')[1]||'';
  if(!base64)throw new Error('Template data missing');
  return XLSX.read(base64,{type:'base64',cellDates:true,cellStyles:true,cellNF:true,bookVBA:true});
}
function templateDataUrlToUint8Array(dataUrl){
  const base64=String(dataUrl||'').split(',')[1]||'';
  if(!base64)throw new Error('Template data missing');
  const binary=atob(base64);
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return bytes;
}
function downloadBlobFile(blob,fileName,options){
  const url=URL.createObjectURL(blob);
  const mode=options?.mode||'download';
  if(mode==='open'){
    const a=document.createElement('a');
    a.href=url;
    a.download=fileName||'template.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    return url;
  }
  const a=document.createElement('a');
  a.href=url;
  a.download=fileName||'template.xlsx';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
  return url;
}
function templateFieldIsDate(fieldKey){
  return ['order.deliveryDate','plan.prodDate','plan.tripDate','plan.labelDate'].includes(String(fieldKey||''));
}
function templateFieldIsTime(fieldKey){
  return ['order.deliveryTime','plan.prodTime','plan.labelTime'].includes(String(fieldKey||''));
}
function excelDateSerialFromText(value){
  const text=String(value||'').trim();
  const m=text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(!m)return null;
  const day=Number(m[1]), month=Number(m[2]), year=Number(m[3]);
  const dt=new Date(year,month-1,day);
  if(dt.getFullYear()!==year||dt.getMonth()!==month-1||dt.getDate()!==day)return null;
  return 25569+(dt.getTime()-dt.getTimezoneOffset()*60000)/86400000;
}
function excelTimeSerialFromText(value){
  const text=String(value||'').trim();
  const m=text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if(!m)return null;
  const hh=Number(m[1]), mm=Number(m[2]), ss=Number(m[3]||0);
  if(hh>23||mm>59||ss>59)return null;
  return (hh*3600+mm*60+ss)/86400;
}
function escapeXmlText(value){
  return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function readSharedStringsFromXml(xmlText){
  if(!xmlText)return [];
  const doc=new DOMParser().parseFromString(xmlText,'application/xml');
  return Array.from(doc.getElementsByTagName('si')).map(si=>
    Array.from(si.childNodes||[]).map(node=>{
      if(node.nodeName==='t')return node.textContent||'';
      if(node.nodeName==='r')return Array.from(node.getElementsByTagName('t')).map(t=>t.textContent||'').join('');
      return '';
    }).join('')
  );
}
function getTemplateCellDisplayText(cellNode,sharedStrings){
  if(!cellNode)return'';
  const type=cellNode.getAttribute('t')||'';
  if(type==='s'){
    const idx=parseInt(cellNode.getElementsByTagName('v')[0]?.textContent||'',10);
    return Number.isFinite(idx)&&idx>=0?String(sharedStrings[idx]||''):'';
  }
  if(type==='inlineStr'){
    return Array.from(cellNode.getElementsByTagName('t')).map(t=>t.textContent||'').join('');
  }
  if(type==='str')return cellNode.getElementsByTagName('v')[0]?.textContent||'';
  const formula=cellNode.getElementsByTagName('f')[0];
  if(formula)return '';
  const v=cellNode.getElementsByTagName('v')[0];
  return v?v.textContent||'':'';
}
function clearTemplateCellChildren(cellNode){
  while(cellNode.firstChild)cellNode.removeChild(cellNode.firstChild);
}
function writeTemplateCellInlineString(cellNode,text){
  const doc=cellNode.ownerDocument;
  const ns=cellNode.namespaceURI||cellNode.ownerDocument.documentElement?.namespaceURI||null;
  clearTemplateCellChildren(cellNode);
  cellNode.setAttribute('t','inlineStr');
  const isNode=ns?doc.createElementNS(ns,'is'):doc.createElement('is');
  const tNode=ns?doc.createElementNS(ns,'t'):doc.createElement('t');
  const value=String(text??'');
  if(/^\s|\s$|\n/.test(value))tNode.setAttributeNS('http://www.w3.org/XML/1998/namespace','xml:space','preserve');
  tNode.textContent=value;
  isNode.appendChild(tNode);
  cellNode.appendChild(isNode);
}
function writeTemplateCellNumber(cellNode,value){
  const doc=cellNode.ownerDocument;
  const ns=cellNode.namespaceURI||cellNode.ownerDocument.documentElement?.namespaceURI||null;
  clearTemplateCellChildren(cellNode);
  cellNode.removeAttribute('t');
  const vNode=ns?doc.createElementNS(ns,'v'):doc.createElement('v');
  vNode.textContent=String(value);
  cellNode.appendChild(vNode);
}
function writeTemplateCellBoolean(cellNode,value){
  const doc=cellNode.ownerDocument;
  const ns=cellNode.namespaceURI||cellNode.ownerDocument.documentElement?.namespaceURI||null;
  clearTemplateCellChildren(cellNode);
  cellNode.setAttribute('t','b');
  const vNode=ns?doc.createElementNS(ns,'v'):doc.createElement('v');
  vNode.textContent=value?'1':'0';
  cellNode.appendChild(vNode);
}
function patchWorkbookCalcProps(xmlText){
  const doc=new DOMParser().parseFromString(xmlText,'application/xml');
  const workbook=doc.getElementsByTagName('workbook')[0];
  if(!workbook)return xmlText;
  let calcPr=doc.getElementsByTagName('calcPr')[0];
  if(!calcPr){
    calcPr=workbook.namespaceURI?doc.createElementNS(workbook.namespaceURI,'calcPr'):doc.createElement('calcPr');
    workbook.appendChild(calcPr);
  }
  calcPr.setAttribute('calcMode','auto');
  calcPr.setAttribute('fullCalcOnLoad','1');
  calcPr.setAttribute('forceFullCalc','1');
  return new XMLSerializer().serializeToString(doc);
}
function templateResolveVarValue(template,vars,bag,varName){
  const fieldKey=templateFieldKeyForVariable(template,varName);
  if(Object.prototype.hasOwnProperty.call(bag||{},fieldKey))return {fieldKey,value:bag[fieldKey]};
  if(Object.prototype.hasOwnProperty.call(bag||{},varName))return {fieldKey,value:bag[varName]};
  if((vars||[]).some(v=>(typeof v==='string'?v:v?.name)===varName))return {fieldKey,value:''};
  return {fieldKey,value:''};
}
function templateTextHasRepeatPlaceholder(template,vars,text){
  const rg=/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g;
  rg.lastIndex=0;
  let match;
  while((match=rg.exec(String(text||'')))){
    const resolved=templateResolveVarValue(template,vars,{},match[1]);
    if(String(resolved.fieldKey||'').startsWith('line.')||String(resolved.fieldKey||'').startsWith('label.'))return true;
  }
  return false;
}
function templateRowHasTotalMarker(texts){
  return (texts||[]).some(text=>{
    const v=String(text||'').trim().toLowerCase();
    return v==='tổng'||v==='tong'||v==='total'||v==='sum'||v==='cộng'||v==='cong';
  });
}
function templateShiftCellRefRow(ref,rowShift){
  const m=String(ref||'').match(/^([A-Z]+)(\d+)$/i);
  if(!m)return String(ref||'');
  return String(m[1]).toUpperCase()+String(Math.max(1,Number(m[2]||1)+rowShift));
}
function templateShiftFormulaRows(formula,rowShift,rowFrom=1){
  return String(formula||'').replace(/(\$?[A-Z]{1,3}\$?)(\d+)/g,(all,col,rowText)=>{
    const row=Number(rowText||0);
    if(!(row>=rowFrom))return all;
    const numMatch=String(all).match(/^(.*?)(\d+)$/);
    if(!numMatch)return all;
    return numMatch[1]+String(Math.max(1,row+rowShift));
  });
}
function templateUpdateRowNode(rowNode,newRowIndex,rowShift){
  rowNode.setAttribute('r',String(newRowIndex));
  Array.from(rowNode.getElementsByTagName('c')).forEach(cellNode=>{
    const ref=cellNode.getAttribute('r');
    if(ref)cellNode.setAttribute('r',templateShiftCellRefRow(ref,rowShift));
    const formulaNode=cellNode.getElementsByTagName('f')[0];
    if(formulaNode&&formulaNode.textContent)formulaNode.textContent=templateShiftFormulaRows(formulaNode.textContent,rowShift,1);
  });
}
function templateFindRepeatBlocks(sheetDoc,sharedStrings,template,vars){
  const sheetData=sheetDoc.getElementsByTagName('sheetData')[0];
  if(!sheetData)return [];
  const rows=Array.from(sheetData.getElementsByTagName('row'));
  const marked=rows.map(rowNode=>{
    const texts=Array.from(rowNode.getElementsByTagName('c')).map(cell=>getTemplateCellDisplayText(cell,sharedStrings)).filter(Boolean);
    const hasRepeat=texts.some(text=>templateTextHasRepeatPlaceholder(template,vars,text));
    const isTotalRow=templateRowHasTotalMarker(texts);
    return {rowNode,rowIndex:Number(rowNode.getAttribute('r')||0),hasRepeat:hasRepeat&&!isTotalRow,isTotalRow};
  }).filter(item=>item.rowIndex>0);
  const blocks=[];
  let current=null;
  marked.forEach(item=>{
    if(item.hasRepeat){
      if(!current||item.rowIndex!==current.endRow+1){
        current={startRow:item.rowIndex,endRow:item.rowIndex,rows:[item.rowNode]};
        blocks.push(current);
      }else{
        current.endRow=item.rowIndex;
        current.rows.push(item.rowNode);
      }
    }else current=null;
  });
  return blocks;
}
function templateRefreshSheetDimension(sheetDoc){
  const dimNode=sheetDoc.getElementsByTagName('dimension')[0];
  if(!dimNode)return;
  const cells=Array.from(sheetDoc.getElementsByTagName('c')).map(cell=>cell.getAttribute('r')).filter(Boolean);
  if(!cells.length)return;
  const decoded=cells.map(ref=>XLSX.utils.decode_cell(ref));
  const minC=Math.min(...decoded.map(x=>x.c));
  const minR=Math.min(...decoded.map(x=>x.r));
  const maxC=Math.max(...decoded.map(x=>x.c));
  const maxR=Math.max(...decoded.map(x=>x.r));
  dimNode.setAttribute('ref',XLSX.utils.encode_range({s:{c:minC,r:minR},e:{c:maxC,r:maxR}}));
}
function templateExpandRepeatBlock(sheetDoc,block,records){
  if(!(records&&records.length>1))return;
  const sheetData=sheetDoc.getElementsByTagName('sheetData')[0];
  if(!sheetData)return;
  const blockSize=block.rows.length;
  const delta=blockSize*(records.length-1);
  const firstRowNode=block.rows[0];
  const fragment=sheetDoc.createDocumentFragment();
  records.forEach((bag,recordIdx)=>{
    block.rows.forEach((srcRow,rowOffset)=>{
      const clone=srcRow.cloneNode(true);
      const newRowIndex=block.startRow+(recordIdx*blockSize)+rowOffset;
      const rowShift=newRowIndex-Number(srcRow.getAttribute('r')||newRowIndex);
      templateUpdateRowNode(clone,newRowIndex,rowShift);
      clone.__scfBag=bag;
      clone.__scfGenerated=true;
      fragment.appendChild(clone);
    });
  });
  sheetData.insertBefore(fragment,firstRowNode);
  block.rows.forEach(row=>row.remove());
  Array.from(sheetData.getElementsByTagName('row')).forEach(rowNode=>{
    if(rowNode.__scfGenerated)return;
    const rowIndex=Number(rowNode.getAttribute('r')||0);
    if(rowIndex>block.endRow){
      templateUpdateRowNode(rowNode,rowIndex+delta,delta);
    }
  });
  const mergeCellsNode=sheetDoc.getElementsByTagName('mergeCells')[0];
  if(mergeCellsNode){
    const merges=Array.from(mergeCellsNode.getElementsByTagName('mergeCell'));
    const nextRefs=[];
    merges.forEach(node=>{
      const ref=node.getAttribute('ref')||'';
      if(!ref)return;
      const range=XLSX.utils.decode_range(ref);
      if(range.s.r+1>=block.startRow&&range.e.r+1<=block.endRow){
        records.forEach((_,recordIdx)=>{
          const shift=recordIdx*blockSize;
          nextRefs.push(XLSX.utils.encode_range({
            s:{c:range.s.c,r:range.s.r+shift},
            e:{c:range.e.c,r:range.e.r+shift}
          }));
        });
      }else if(range.s.r+1>block.endRow){
        nextRefs.push(XLSX.utils.encode_range({
          s:{c:range.s.c,r:range.s.r+delta},
          e:{c:range.e.c,r:range.e.r+delta}
        }));
      }else if(range.e.r+1>=block.startRow&&range.e.r+1>block.endRow){
        nextRefs.push(XLSX.utils.encode_range({
          s:{c:range.s.c,r:range.s.r},
          e:{c:range.e.c,r:range.e.r+delta}
        }));
      }else{
        nextRefs.push(ref);
      }
    });
    while(mergeCellsNode.firstChild)mergeCellsNode.removeChild(mergeCellsNode.firstChild);
    nextRefs.forEach(ref=>{
      const mergeNode=mergeCellsNode.namespaceURI?sheetDoc.createElementNS(mergeCellsNode.namespaceURI,'mergeCell'):sheetDoc.createElement('mergeCell');
      mergeNode.setAttribute('ref',ref);
      mergeCellsNode.appendChild(mergeNode);
    });
    mergeCellsNode.setAttribute('count',String(nextRefs.length));
  }
  templateRefreshSheetDimension(sheetDoc);
}
async function exportWorkbookFromTemplatePreserveOriginal({template,records,filenameBase,openMode}){
  if(typeof JSZip==='undefined')throw new Error('Thiếu JSZip để giữ nguyên định dạng Excel.');
  const ext=templateOutputExt(template?.fileName||'template.xlsx');
  if(!['xlsx','xlsm'].includes(ext))throw new Error('Định dạng này chưa hỗ trợ giữ nguyên format.');
  const zip=await JSZip.loadAsync(templateDataUrlToUint8Array(template?.fileDataUrl||''));
  const sharedPath='xl/sharedStrings.xml';
  const sharedStrings=zip.file(sharedPath)?readSharedStringsFromXml(await zip.file(sharedPath).async('string')):[];
  const sheetFiles=Object.keys(zip.files).filter(name=>/^xl\/worksheets\/sheet\d+\.xml$/i.test(name)).sort((a,b)=>a.localeCompare(b,'en'));
  const vars=(template?.variables&&template.variables.length)?template.variables:[];
  const defaultBag=(records&&records.length?records[0]:{})||{};
  const placeholderRg=/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g;
  let expandedRepeatRows=false;
  for(const filePath of sheetFiles){
    const xmlText=await zip.file(filePath).async('string');
    const doc=new DOMParser().parseFromString(xmlText,'application/xml');
    const repeatBlocks=template?.type==='order'&&records?.length>1?templateFindRepeatBlocks(doc,sharedStrings,template,vars):[];
    if(repeatBlocks.length)expandedRepeatRows=true;
    repeatBlocks.slice().sort((a,b)=>b.startRow-a.startRow).forEach(block=>templateExpandRepeatBlock(doc,block,records));
    const cells=Array.from(doc.getElementsByTagName('c'));
    cells.forEach(cellNode=>{
      const rowNode=cellNode.parentNode;
      const bag=rowNode?.__scfBag||defaultBag;
      const rawText=getTemplateCellDisplayText(cellNode,sharedStrings);
      placeholderRg.lastIndex=0;
      if(!rawText||!placeholderRg.test(rawText))return;
      placeholderRg.lastIndex=0;
      const exact=String(rawText).trim().match(/^\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}$/);
      const resolveVar=varName=>templateResolveVarValue(template,vars,bag,varName);
      if(exact){
        const resolved=resolveVar(exact[1]);
        const value=resolved.value;
        if(value===null||value===undefined||value===''){writeTemplateCellInlineString(cellNode,'');return;}
        if(templateFieldIsDate(resolved.fieldKey)){
          const serial=excelDateSerialFromText(value);
          if(serial!=null){writeTemplateCellNumber(cellNode,serial);return;}
        }
        if(templateFieldIsTime(resolved.fieldKey)){
          const serial=excelTimeSerialFromText(value);
          if(serial!=null){writeTemplateCellNumber(cellNode,serial);return;}
        }
        if(typeof value==='number'&&Number.isFinite(value)){writeTemplateCellNumber(cellNode,value);return;}
        if(typeof value==='boolean'){writeTemplateCellBoolean(cellNode,value);return;}
        writeTemplateCellInlineString(cellNode,String(value));
        return;
      }
      placeholderRg.lastIndex=0;
      const replaced=String(rawText).replace(placeholderRg,(_,varName)=>normalizeTemplateScalar(resolveVar(varName).value));
      writeTemplateCellInlineString(cellNode,replaced);
    });
    zip.file(filePath,new XMLSerializer().serializeToString(doc));
  }
  if(template?.type==='order'&&records?.length>1&&!expandedRepeatRows){
    throw new Error('Không tìm thấy dòng mẫu có biến line.* trong file Excel để lặp theo số sản phẩm.');
  }
  const workbookPath='xl/workbook.xml';
  if(zip.file(workbookPath)){
    const workbookXml=await zip.file(workbookPath).async('string');
    zip.file(workbookPath,patchWorkbookCalcProps(workbookXml));
  }
  const finalName=(String(filenameBase||'template_output').replace(/[\\\/:\*\?"<>\|]+/g,'_'))+'.'+ext;
  const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE'});
  downloadBlobFile(blob,finalName,{mode:openMode||'download'});
  return finalName;
}
function replaceTemplatePlaceholdersInSheet(ws,resolveValue){
  const rg=/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g;
  Object.keys(ws||{}).forEach(addr=>{
    if(addr[0]==='!')return;
    const cell=ws[addr];
    if(!cell||cell.f)return;
    const raw=cell.v;
    const text=typeof raw==='string'?raw:String(cell.w??raw??'');
    rg.lastIndex=0;
    if(!text||!rg.test(text))return;
    rg.lastIndex=0;
    const exact=String(text).trim().match(/^\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}$/);
    if(exact){
      const value=resolveValue(exact[1]);
      if(value===null||value===undefined||value===''){
        cell.v='';cell.t='s';delete cell.w;return;
      }
      if(typeof value==='number'&&Number.isFinite(value)){
        cell.v=value;cell.t='n';delete cell.w;return;
      }
      if(typeof value==='boolean'){
        cell.v=value;cell.t='b';delete cell.w;return;
      }
      cell.v=String(value);cell.t='s';delete cell.w;return;
    }
    rg.lastIndex=0;
    cell.v=String(text).replace(rg,(_,varName)=>normalizeTemplateScalar(resolveValue(varName)));
    cell.t='s';
    delete cell.w;
  });
}
function orderLineQtyForTemplate(line){
  return numFmt(line?.qtyProd)||numFmt(line?.qty)||numFmt(line?.quantity)||0;
}
function orderLineWeightForTemplate(line,products){
  const p=(products||[]).find(x=>String(x.id||'')===String(line?.productId||''));
  const unit=String(line?.unit||p?.unit||'').trim().toLowerCase().replace(/[^a-z]/g,'');
  const qty=numFmt(line?.qtyInvoice)||orderLineQtyForTemplate(line);
  if(unit==='kg'||unit==='kgs'||unit==='kilogram'||unit==='kilograms')return qty;
  const wpu=numFmt(p?.weightPerUnit)||numFmt(line?.weightPerUnit)||0;
  return Number((wpu*qty).toFixed(3));
}
function calcOrderWeightForTemplate(order,products){
  return Number(((order?.lines||[]).reduce((sum,line)=>sum+orderLineWeightForTemplate(line,products),0)).toFixed(3));
}
function findCustomerForOrderTemplate(order,customers){
  const byId=String(order?.customerId||order?.custId||'').trim();
  const byName=normalizeLookupText(order?.customer||'');
  return (customers||[]).find(c=>byId&&String(c.id||'').trim()===byId)
    ||(customers||[]).find(c=>byName&&normalizeLookupText(c.name||'')===byName)
    ||null;
}
function findPointForOrderTemplate(order,customers){
  const cust=findCustomerForOrderTemplate(order,customers);
  const pointId=String(order?.pointId||order?.ptId||'').trim();
  const pointName=normalizeLookupText(order?.pointName||'');
  const fromCust=(cust?.points||[]).find(p=>pointId&&String(p.id||'').trim()===pointId)
    ||(cust?.points||[]).find(p=>pointName&&normalizeLookupText(p.name||'')===pointName);
  if(fromCust)return fromCust;
  let found=null;
  (customers||[]).forEach(c=>(c.points||[]).forEach(p=>{
    if(found)return;
    if((pointId&&String(p.id||'').trim()===pointId)||(pointName&&normalizeLookupText(p.name||'')===pointName))found={...p,customerId:c.id,customerName:c.name};
  }));
  return found;
}
function findTripForOrderTemplate(order,trips){
  const tripId=String(order?.tripId||'').trim();
  return (trips||[]).find(t=>tripId&&String(t.id||'').trim()===tripId)||null;
}
function findOrderTemplateForOrder(order,orderTemplates,customers){
  const customer=findCustomerForOrderTemplate(order,customers);
  const custId=String(order?.customerId||customer?.id||'').trim();
  const custName=normalizeLookupText(order?.customer||customer?.name||'');
  const matches=(orderTemplates||[]).filter(t=>{
    const scopes=templateScopeList(t);
    return scopes.some(scope=>(custId&&String(scope.id||'').trim()===custId)||(custName&&normalizeLookupText(scope.name||'')===custName));
  });
  return matches.sort((a,b)=>templateScopeCount(a)-templateScopeCount(b))[0]||null;
}
function findLabelTemplateForLine(line,labelTemplates,products){
  const product=(products||[]).find(p=>String(p.id||'')===String(line?.productId||''))||null;
  const prodId=String(line?.productId||product?.id||'').trim();
  const prodName=normalizeLookupText(line?.productName||product?.name||'');
  const matches=(labelTemplates||[]).filter(t=>{
    const scopes=templateScopeList(t);
    return scopes.some(scope=>(prodId&&String(scope.id||'').trim()===prodId)||(prodName&&normalizeLookupText(scope.name||'')===prodName));
  });
  return matches.sort((a,b)=>templateScopeCount(a)-templateScopeCount(b))[0]||null;
}
function buildTemplateValueBag({company,order,line,lineIndex,plan,products,customers,trips,labelMeta}){
  const co=company||{};
  const customer=findCustomerForOrderTemplate(order,customers);
  const point=findPointForOrderTemplate(order,customers);
  const trip=findTripForOrderTemplate(order,trips);
  const product=line?(products||[]).find(p=>String(p.id||'')===String(line.productId||'')):null;
  const orderLines=(order?.lines||[]).filter(l=>l&&(l.productId||l.productName||numFmt(l.qtyProd)||numFmt(l.qtyInvoice)));
  const qtyOrder=line?orderLineQtyForTemplate(line):0;
  const qtyInvoice=line?numFmt(line.qtyInvoice):0;
  const qtyDelivered=line?numFmt(line.qtyDelivered):0;
  const lineWeight=labelMeta?.weight!=null?numFmt(labelMeta.weight):orderLineWeightForTemplate(line,products);
  const tripDate=plan?.tripDate||getOrderTripDate(order,window.__SCF_PROD_SHIFTS||[]);
  const tripShiftName=plan?.tripShiftName||trip?.shiftName||getOrderTripShiftName(order,window.__SCF_PROD_SHIFTS||[]);
  return {
    'company.name':co.name||'',
    'company.phone':co.phone||'',
    'company.email':co.email||'',
    'company.address':co.address||'',
    'company.website':co.website||'',
    'company.intro':co.intro||'',
    'order.id':order?.id||order?.orderId||'',
    'order.customer':order?.customer||customer?.name||'',
    'order.customerCode':customer?.code||order?.customerCode||order?.customerId||'',
    'order.pointName':order?.pointName||point?.name||'',
    'order.address':order?.address||point?.address||'',
    'order.area':order?.area||point?.area||'',
    'order.deliveryDate':order?.deliveryDate||'',
    'order.deliveryTime':normalizeTimeInput(order?.deliveryTime||''),
    'order.status':order?.status||'',
    'order.note':order?.note||'',
    'order.workOut':numFmt(order?.workOut),
    'order.workReturn':numFmt(order?.workReturn),
    'order.itemCount':orderLines.length,
    'order.totalWeight':calcOrderWeightForTemplate(order,products),
    'plan.shiftName':plan?.shift?.name||'',
    'plan.prodDate':plan?.prodDate||'',
    'plan.prodTime':plan?.prodTime||'',
    'plan.tripDate':tripDate||'',
    'plan.tripShiftName':tripShiftName||'',
    'plan.labelDate':plan?.labelDate||'',
    'plan.labelTime':plan?.labelTime||'',
    'label.index':numFmt(labelMeta?.index),
    'label.count':numFmt(labelMeta?.count),
    'label.weight':numFmt(labelMeta?.weight),
    'line.index':Number(lineIndex||0)+1,
    'line.productCode':line?.productId||product?.code||'',
    'line.productName':line?.productName||product?.name||'',
    'line.customerProductCode':line?.customerProductCode||line?.customerCode||'',
    'line.customerProductName':line?.customerProductName||'',
    'line.unit':line?.unit||product?.unit||'',
    'line.qtyOrder':qtyOrder,
    'line.qtyInvoice':qtyInvoice,
    'line.qtyDelivered':qtyDelivered,
    'line.weightPerUnit':numFmt(line?.weightPerUnit)||numFmt(product?.weightPerUnit),
    'line.totalWeight':lineWeight,
    'line.purchasePrice':numFmt(line?.price)||numFmt(line?.salePrice)||numFmt(product?.price),
    'line.note':line?.note||'',
    'driver.name':trip?.driverName||order?.driverName||'',
    'driver.code':trip?.driverId||order?.driverId||'',
    'trip.id':trip?.id||order?.tripId||'',
    'trip.note':trip?.note||order?.tripNote||''
  };
}
async function exportWorkbookFromTemplate({template,records,filenameBase,openMode}){
  const items=(records&&records.length)?records:[{}];
  const ext=templateOutputExt(template?.fileName||'template.xlsx');
  const canPreserveMultiLine=template?.type==='order'&&items.length>1&&(templateUsesMappedPrefix(template,'line.')||templateUsesMappedPrefix(template,'label.'));
  if(template?.fileDataUrl&&(items.length===1||canPreserveMultiLine)&&['xlsx','xlsm'].includes(ext)){
    try{
      return await exportWorkbookFromTemplatePreserveOriginal({template,records:items,filenameBase,openMode});
    }catch(err){
      console.warn('Preserve original Excel formatting failed, fallback to rebuild workbook.',err);
    }
  }
  const src=readWorkbookFromTemplateDataUrl(template?.fileDataUrl||'');
  const out=XLSX.utils.book_new();
  if(src.Props)out.Props=JSON.parse(JSON.stringify(src.Props));
  if(src.Custprops)out.Custprops=JSON.parse(JSON.stringify(src.Custprops));
  if(src.Workbook){
    out.Workbook={};
    if(src.Workbook.WBProps)out.Workbook.WBProps=JSON.parse(JSON.stringify(src.Workbook.WBProps));
    if(src.Workbook.Views)out.Workbook.Views=JSON.parse(JSON.stringify(src.Workbook.Views));
    if(src.Workbook.CalcPr)out.Workbook.CalcPr=JSON.parse(JSON.stringify(src.Workbook.CalcPr));
  }
  if(src.vbaraw)out.vbaraw=src.vbaraw;
  const vars=(template?.variables&&template.variables.length)?template.variables:extractTemplateVariablesFromWorkbook(src);
  const sheetNames=src.SheetNames||[];
  items.forEach((bag,idx)=>{
    sheetNames.forEach(sheetName=>{
      const ws=cloneTemplateSheet(src.Sheets[sheetName]);
      replaceTemplatePlaceholdersInSheet(ws,varName=>{
        const fieldKey=templateFieldKeyForVariable(template,varName);
        if(Object.prototype.hasOwnProperty.call(bag,fieldKey))return bag[fieldKey];
        if(Object.prototype.hasOwnProperty.call(bag,varName))return bag[varName];
        if(vars.some(v=>(typeof v==='string'?v:v?.name)===varName))return '';
        return '';
      });
      const targetName=items.length===1
        ?uniqueTemplateSheetName(out.SheetNames||[],sheetName)
        :uniqueTemplateSheetName(out.SheetNames||[],String(idx+1).padStart(2,'0')+'_'+sheetName);
      XLSX.utils.book_append_sheet(out,ws,targetName);
    });
  });
  const finalName=(String(filenameBase||'template_output').replace(/[\\\/:\*\?"<>\|]+/g,'_'))+'.'+ext;
  const wbArray=XLSX.write(out,{bookType:templateBookType(template?.fileName||finalName),type:'array',compression:true});
  const blob=new Blob([wbArray],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  downloadBlobFile(blob,finalName,{mode:openMode||'download'});
  return finalName;
}
function fontModeMeta(mode){return UI_FONT_MODE_OPTIONS.find(x=>x.value===mode)||UI_FONT_MODE_OPTIONS[0];}
function fontFamilyLabel(value){return(UI_FONT_FAMILY_OPTIONS.find(x=>x.value===value)||UI_FONT_FAMILY_OPTIONS[0]).label;}
function inferLabelPackRuleByName(name){
  const n=String(name||'').toUpperCase();
  if(n.includes('PHỞ')||n.includes('PHO'))return {pack:5,mergeSmallRemainder:false};
  if(n.includes('BÚN')||n.includes('BUN')||n.includes('BÁNH CUỐN')||n.includes('BANH CUON'))return {pack:10,mergeSmallRemainder:false};
  return {pack:10,mergeSmallRemainder:true};
}
function resolveProductLabelPackRule(product,name){
  const fallback=inferLabelPackRuleByName(name||product?.name||'');
  const explicitPack=numFmt(product?.labelPackSize);
  const hasExplicitMerge=Object.prototype.hasOwnProperty.call(product||{},'labelMergeSmallRemainder');
  const hasExplicitNeedsLabel=Object.prototype.hasOwnProperty.call(product||{},'needsLabel');
  return {
    enabled:hasExplicitNeedsLabel?!!product?.needsLabel:true,
    pack:explicitPack>0?explicitPack:fallback.pack,
    mergeSmallRemainder:hasExplicitMerge?!!product?.labelMergeSmallRemainder:fallback.mergeSmallRemainder
  };
}
function normalizeUiSettings(raw){
  const src=raw||{};
  const birthdayEffects=['fireworks','balloons','cake','none'];
  const next={
    fontFamily:src.fontFamily||DEF_UI_SETTINGS.fontFamily,
    birthdayEffect:birthdayEffects.includes(src.birthdayEffect)?src.birthdayEffect:(DEF_UI_SETTINGS.birthdayEffect||'fireworks'),
    scopes:{}
  };
  if(!UI_FONT_FAMILY_OPTIONS.some(x=>x.value===next.fontFamily)) next.fontFamily=DEF_UI_SETTINGS.fontFamily;
  UI_FONT_SCOPE_OPTIONS.forEach(scope=>{
    const base=DEF_UI_SETTINGS.scopes[scope.key]||{size:14,mode:'normal'};
    const cur=(src.scopes&&src.scopes[scope.key])||{};
    const size=Math.max(10,Math.min(28,Number(cur.size)||base.size));
    const mode=UI_FONT_MODE_OPTIONS.some(x=>x.value===cur.mode)?cur.mode:base.mode;
    const requestedFamily=cur.fontFamily||cur.family||base.fontFamily||next.fontFamily;
    const fontFamily=UI_FONT_FAMILY_OPTIONS.some(x=>x.value===requestedFamily)?requestedFamily:next.fontFamily;
    next.scopes[scope.key]={size,mode,fontFamily};
  });
  return next;
}
function uiSettingsToCssVars(raw){
  const ui=normalizeUiSettings(raw);
  const vars={'--ui-font-family':ui.fontFamily};
  UI_FONT_SCOPE_OPTIONS.forEach(scope=>{
    const cur=ui.scopes[scope.key];
    const meta=fontModeMeta(cur.mode);
    vars['--ui-'+scope.key+'-size']=cur.size+'px';
    vars['--ui-'+scope.key+'-weight']=meta.weight;
    vars['--ui-'+scope.key+'-style']=meta.style;
    vars['--ui-'+scope.key+'-family']=cur.fontFamily||ui.fontFamily;
  });
  return vars;
}
