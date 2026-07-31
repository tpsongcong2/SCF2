/* ─── UI base ─── */
function F({label,children}){return h('div',{className:'fl'},h('label',null,label),children)}
function Row({children}){return h('div',{className:'form-actions'},children)}
function Modal({title,lg,onClose,children}){
  return h('div',{className:'overlay',onClick:e=>{if(e.target===e.currentTarget)onClose()}},
    h('div',{className:'modal'+(lg==='xl'?' xl':lg?' wide':''),style:{},onClick:e=>e.stopPropagation()},
      h('div',{className:'mh'},h('h2',null,title),h('button',{className:'mclose',type:'button',onClick:onClose},h('i',{className:'ti ti-x'}))),
      children
    )
  );
}
function SearchBar({value,onChange,placeholder}){
  return h('div',{className:'search-wrap'},
    h('i',{className:'ti ti-search'}),
    h('input',{value,onChange:e=>onChange(e.target.value),placeholder:placeholder||'Tìm kiếm...'})
  );
}
function AddBtn({onClick,label}){
  return h('button',{className:'bp',onClick,'data-scf-action':'write',style:{padding:'7px 14px'}},h('i',{className:'ti ti-plus',style:{fontSize:14}}),label||'Thêm mới');
}
function TableWrap({cols,rows,empty}){
  return h('div',{className:'tw'},
    h('table',null,
      h('thead',null,h('tr',null,...cols.map(c=>h('th',{key:c},c)))),
      h('tbody',null,rows.length?rows:h('tr',null,h('td',{colSpan:cols.length,className:'empty-st'},empty||'Chưa có dữ liệu.')))
    )
  );
}

/* ─── EXCEL helpers ─── */
function xlsxExport(rows,cols,filename){
  const header=cols.map(([,label])=>label);
  const body=rows.map(r=>cols.map(([key])=>r[key]??''));
  const ws=XLSX.utils.aoa_to_sheet([header,...body]);const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Data');
  XLSX.writeFile(wb,filename+'_'+fmtDate().replace(/\//g,'-')+'.xlsx');
}
function xlsxImport(file,cb){
  const r=new FileReader();
  r.onload=e=>{
    const wb=XLSX.read(e.target.result,{type:'binary',cellDates:true});
    const ws=wb.Sheets[wb.SheetNames[0]];
    cb(XLSX.utils.sheet_to_json(ws,{defval:null,raw:false,cellDates:true}));
  };
  r.readAsBinaryString(file);
}
function ExportBtn({onClick}){return h('button',{onClick,style:{fontSize:12,padding:'6px 12px'}},h('i',{className:'ti ti-file-spreadsheet',style:{fontSize:14}}),'Xuất Excel');}
function ImportBtn({onFile}){
  const ref=useRef();
  return h('span',null,
    h('input',{type:'file',accept:'.xlsx,.xls',ref,style:{display:'none'},onChange:e=>{if(e.target.files[0]){xlsxImport(e.target.files[0],onFile);e.target.value='';}}}),
    h('button',{onClick:()=>ref.current.click(),'data-scf-action':'write',style:{fontSize:12,padding:'6px 12px'}},h('i',{className:'ti ti-upload',style:{fontSize:14}}),'Nhập Excel')
  );
}

