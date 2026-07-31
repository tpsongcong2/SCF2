/* ─── MATERIALS ─── */
function MaterialForm({mat,onSave,onClose}){
  const[f,sf]=useState(mat||{code:'',name:'',group:'',unit:UNITS[0],price:'',note:''});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const submit=()=>{if(!f.name){window.showToast('Nhập tên nguyên vật liệu!','warn');return;}onSave({...f,id:mat?.id||'VT'+uid(),price:numFmt(f.price)});};
  return h(Modal,{title:mat?'Sửa nguyên vật liệu':'Thêm nguyên vật liệu',onClose},
    h('div',{className:'g2'},
      h(F,{label:'Mã NVL'},h('input',{value:f.code,onChange:e=>s('code',e.target.value),placeholder:'NVL001'})),
      h(F,{label:'Đơn vị tính'},h('select',{value:f.unit,onChange:e=>s('unit',e.target.value)},UNITS.map(u=>h('option',{key:u,value:u},u)))),
    ),
    h('div',{className:'g2'},
      h(F,{label:'Tên nguyên vật liệu *'},h('input',{value:f.name,onChange:e=>s('name',e.target.value),placeholder:'Tên nguyên vật liệu...'})),
      h(F,{label:'Nhóm NVL'},h('input',{value:f.group||'',onChange:e=>s('group',e.target.value),placeholder:'Ví dụ: Bột, gạo, bao bì...'})),
    ),
    h('div',{className:'g2'},
      h(F,{label:'Đơn giá (đ)'},h(NumInput,{value:f.price,onChange:v=>s('price',v)})),
      h(F,{label:'Ghi chú'},h('input',{value:f.note,onChange:e=>s('note',e.target.value)})),
    ),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu'))
  );
}
function MaterialsTab({materials,setMaterials,purchases}){
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[q,sq]=useState('');
  const save=d=>{if(edit)setMaterials(p=>p.map(x=>x.id===edit.id?d:x));else setMaterials(p=>[...p,d]);sm(null);se(null);};
  const del=id=>{window.scfConfirm('Bạn có chắc muốn xóa nguyên vật liệu này?','Xóa nguyên vật liệu',true).then(ok=>{if(ok){setMaterials(p=>p.filter(x=>x.id!==id));window.showToast('Đã xóa nguyên vật liệu','success');}});};
  const COLS=[['code','Mã NVL'],['name','Tên nguyên vật liệu'],['group','Nhóm NVL'],['unit','ĐVT'],['price','Đơn giá'],['note','Ghi chú']];
  const syncNamesFromPurchases=()=>{
    const names=[...new Set((purchases||[]).flatMap(p=>(p.lines||[]).map(l=>String(l.name||'').trim()).filter(Boolean)))];
    if(!names.length){window.showToast('Không có tên nguyên vật liệu từ đơn mua.','warn');return;}
    setMaterials(prev=>{
      const next=[...prev];
      names.forEach((name,idx)=>{
        const pName=name.toLowerCase();
        const found=next.findIndex(x=>String(x.name||'').toLowerCase()===pName||String(x.code||'').toLowerCase()===pName);
        if(found>=0){
          next[found]={...next[found],name};
        }else{
          next.push({id:'VT'+uid(),code:'',name,group:'',unit:'Kg',price:0,note:''});
        }
      });
      return next;
    });
    window.showToast('Đã cập nhật tên từ đơn mua','success');
  };
  const list=materials.filter(x=>!q||String(x.name||'').toLowerCase().includes(q.toLowerCase())||String(x.code||'').toLowerCase().includes(q.toLowerCase())||String(x.group||'').toLowerCase().includes(q.toLowerCase()));
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-tools',style:{fontSize:20}}),'Danh mục nguyên vật liệu'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm nguyên vật liệu...'}),
      h('div',{style:{display:'flex',gap:6}},
        h(ExportBtn,{onClick:()=>xlsxExport(list,COLS,'Nguyen_vat_lieu')}),
        h('button',{onClick:syncNamesFromPurchases,style:{fontSize:12,padding:'6px 12px'}},h('i',{className:'ti ti-refresh',style:{fontSize:14}}),'Cập nhật tên từ đơn mua'),
        h(ImportBtn,{onFile:rows=>{const added=rows.map(r=>({id:'VT'+uid(),code:r['Mã NVL']||r['Mã VT']||'',name:r['Tên nguyên vật liệu']||r['Tên vật tư']||'',group:r['Nhóm NVL']||r['Nhóm']||'',unit:r['ĐVT']||'Cái',price:numFmt(r['Đơn giá']),note:r['Ghi chú']||''})).filter(r=>r.name);setMaterials(p=>[...p,...added]);window.showToast('Đã nhập '+added.length+' nguyên vật liệu','success');}}),
        h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Thêm NVL'})
      )
    ),
    h(TableWrap,{cols:['Mã NVL','Tên nguyên vật liệu','Nhóm NVL','Đơn vị','Đơn giá','Ghi chú',''],empty:'Chưa có nguyên vật liệu nào.',
      rows:list.map(x=>h('tr',{key:x.id},
        h('td',null,h('span',{style:{color:'var(--pri)',fontWeight:500}},x.code||x.id)),
        h('td',null,h('div',{style:{fontWeight:500}},x.name)),
        h('td',null,x.group||'—'),
        h('td',null,h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--tx2)'}},x.unit)),
        h('td',null,moneyFmt(x.price)),
        h('td',null,x.note||'—'),
        h('td',null,h('div',{style:{display:'flex',gap:2}},
          h('button',{className:'bi',onClick:()=>{se(x);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
          h('button',{className:'bi',onClick:()=>del(x.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
        ))
      ))
    }),
    modal==='f'&&h(MaterialForm,{mat:edit,onSave:save,onClose:()=>{sm(null);se(null);}})
  );
}

/* ─── ASSETS ─── */
function AssetForm({asset,onSave,onClose}){
  const[f,sf]=useState(asset||{name:'',purchaseValue:0,currentValue:0,replacementMaterial:''});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const submit=()=>{
    if(!f.name){window.showToast('Nhập tên tài sản!','warn');return;}
    onSave({...f,id:asset?.id||'TS'+uid(),purchaseValue:numFmt(f.purchaseValue),currentValue:numFmt(f.currentValue)});
  };
  return h(Modal,{title:asset?'Sửa tài sản':'Thêm tài sản',onClose},
    h(F,{label:'Tên tài sản *'},h('input',{value:f.name,onChange:e=>s('name',e.target.value),placeholder:'Tên tài sản...'})),
    h('div',{className:'g2'},
      h(F,{label:'Giá trị mua'},h(NumInput,{value:f.purchaseValue,onChange:v=>s('purchaseValue',v)})),
      h(F,{label:'Giá trị hiện tại'},h(NumInput,{value:f.currentValue,onChange:v=>s('currentValue',v)}))
    ),
    h(F,{label:'Vật tư thay thế'},h('input',{value:f.replacementMaterial||'',onChange:e=>s('replacementMaterial',e.target.value),placeholder:'Tên vật tư thay thế...'})),
    h(Row,null,
      h('button',{type:'button',onClick:onClose},'Hủy'),
      h('button',{type:'button',className:'bp',onClick:submit,style:{padding:'8px 20px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu tài sản')
    )
  );
}
function AssetsTab({assets,setAssets}){
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[q,sq]=useState('');
  const save=d=>{if(edit)setAssets(p=>p.map(x=>x.id===edit.id?d:x));else setAssets(p=>[...p,d]);sm(null);se(null);};
  const del=id=>{window.scfConfirm('Bạn có chắc muốn xóa tài sản này?','Xóa tài sản',true).then(ok=>{if(ok){setAssets(p=>p.filter(x=>x.id!==id));window.showToast('Đã xóa tài sản','success');}});};
  const cols=[['stt','Số TT'],['name','Tên tài sản'],['purchaseValue','Giá trị mua'],['currentValue','Giá trị hiện tại'],['replacementMaterial','Vật tư thay thế']];
  const list=(assets||[]).filter(x=>!q||String(x.name||'').toLowerCase().includes(q.toLowerCase())||String(x.replacementMaterial||'').toLowerCase().includes(q.toLowerCase()));
  const exportRows=list.map((x,i)=>({...x,stt:i+1}));
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-building-warehouse',style:{fontSize:20}}),'Danh mục tài sản'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm tài sản...'}),
      h('div',{style:{display:'flex',gap:6}},
        h(ExportBtn,{onClick:()=>xlsxExport(exportRows,cols,'Danh_muc_tai_san')}),
        h(ImportBtn,{onFile:rows=>{
          const added=rows.map(r=>({id:'TS'+uid(),name:r['Tên tài sản']||'',purchaseValue:numFmt(r['Giá trị mua']),currentValue:numFmt(r['Giá trị hiện tại']),replacementMaterial:r['Vật tư thay thế']||''})).filter(r=>r.name);
          setAssets(p=>[...p,...added]);
          window.showToast('Đã nhập '+added.length+' tài sản','success');
        }}),
        h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Thêm tài sản'})
      )
    ),
    h(TableWrap,{cols:['Số TT','Tên tài sản','Giá trị mua','Giá trị hiện tại','Vật tư thay thế',''],empty:'Chưa có tài sản nào.',
      rows:list.map((x,i)=>h('tr',{key:x.id},
        h('td',null,i+1),
        h('td',null,h('div',{style:{fontWeight:500}},x.name)),
        h('td',null,moneyFmt(x.purchaseValue)),
        h('td',null,moneyFmt(x.currentValue)),
        h('td',null,x.replacementMaterial||'—'),
        h('td',null,h('div',{style:{display:'flex',gap:2}},
          h('button',{className:'bi',onClick:()=>{se(x);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
          h('button',{className:'bi',onClick:()=>del(x.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
        ))
      ))
    }),
    modal==='f'&&h(AssetForm,{asset:edit,onSave:save,onClose:()=>{sm(null);se(null);}})
  );
}

/* ─── PRODUCT CATEGORIES ─── */
function ProdCatForm({cat,onSave,onClose}){
  const[f,sf]=useState(cat||{name:'',desc:''});
  const submit=()=>{if(!f.name){window.showToast('Nhập tên danh mục!','warn');return;}onSave({...f,id:cat?.id||'DM'+uid()});};
  return h(Modal,{title:cat?'Sửa nhóm sản phẩm':'Thêm nhóm sản phẩm',onClose},
    h(F,{label:'Tên nhóm *'},h('input',{value:f.name,onChange:e=>sf(p=>({...p,name:e.target.value})),placeholder:'Nhóm sản phẩm A...'})),
    h(F,{label:'Mô tả'},h('textarea',{value:f.desc,onChange:e=>sf(p=>({...p,desc:e.target.value})),rows:2})),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'}},'Lưu nhóm sản phẩm'))
  );
}

/* ─── PRODUCTS ─── */
function inferProductWeightPerUnit(prod){
  const stored=numFmt(prod?.weightPerUnit);
  if(stored>0)return stored;
  const unit=String(prod?.unit||'').trim().toLowerCase();
  if(['kg','tấn','tan','lít','lit'].includes(unit))return 0;
  const name=String(prod?.name||'').toUpperCase().replace(/,/g,'.');
  const kg=name.match(/(?:^|[^A-Z0-9])(\d+(?:\.\d+)?)\s*KG(?:\b|\/)/);
  if(kg)return Number(kg[1])||0;
  const gram=name.match(/(?:^|[^A-Z0-9])(\d+(?:\.\d+)?)\s*(?:GRAM|GR|G)(?:\b|\/)/);
  if(gram)return (Number(gram[1])||0)/1000;
  return 0;
}
function normalizeProductWeight(prod){
  if(!prod)return prod;
  const inferred=inferProductWeightPerUnit(prod);
  return inferred>0&&!(numFmt(prod.weightPerUnit)>0)?{...prod,weightPerUnit:inferred}:prod;
}
function ProductForm({prod,prodCats,onSave,onClose}){
  const normalizedProd=normalizeProductWeight(prod);
  const baseRule=resolveProductLabelPackRule(normalizedProd,normalizedProd?.name);
  const[f,sf]=useState({...{code:'',name:'',catId:prodCats[0]?.id||'',goodsGroup:'',unit:'Cái',weightPerUnit:'',note:'',custCode:'',custName:'',needsLabel:baseRule.enabled,labelPackSize:baseRule.pack,labelMergeSmallRemainder:baseRule.mergeSmallRemainder},...(normalizedProd||{})});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const needWeight=!['Kg','Tấn','Lít'].includes(f.unit);
  const submit=()=>{
    if(!f.name){window.showToast('Nhập tên sản phẩm!','warn');return;}
    onSave(normalizeProductWeight({
      ...f,
      id:prod?.id||'SP'+uid(),
      weightPerUnit:f.weightPerUnit?numFmt(f.weightPerUnit):0,
      needsLabel:!!f.needsLabel,
      labelPackSize:f.needsLabel&&f.labelPackSize?numFmt(f.labelPackSize):0,
      labelMergeSmallRemainder:!!f.labelMergeSmallRemainder
    }));
  };
  return h(Modal,{title:prod?'Sửa sản phẩm':'Thêm sản phẩm',onClose},
    h('div',{className:'g2'},
      h(F,{label:'Mã sản phẩm'},h('input',{value:f.code,onChange:e=>s('code',e.target.value),placeholder:'SP001'})),
      h(F,{label:'Danh mục'},h('select',{value:f.catId,onChange:e=>s('catId',e.target.value)},
        h('option',{value:''},'— Chọn danh mục —'),
        prodCats.map(c=>h('option',{key:c.id,value:c.id},c.name))
      )),
    ),
    h(F,{label:'Tên sản phẩm *'},h('input',{value:f.name,onChange:e=>s('name',e.target.value),placeholder:'Tên sản phẩm...'})),
    h(F,{label:'Nhóm HH'},h('input',{value:f.goodsGroup||'',onChange:e=>s('goodsGroup',e.target.value),placeholder:'Ví dụ: Bánh, đồ uống, thuốc, vật tư...'})),
    h('div',{className:needWeight?'g2':''},
      h(F,{label:'Đơn vị tính (ĐVT)'},h('select',{value:f.unit,onChange:e=>s('unit',e.target.value)},UNITS.map(u=>h('option',{key:u,value:u},u)))),
      needWeight&&h(F,{label:'KL/'+f.unit+' (kg)'},h('input',{type:'number',min:0,step:.001,value:f.weightPerUnit,onChange:e=>s('weightPerUnit',e.target.value),placeholder:'0.000'}))
    ),
    h(F,{label:'Màu highlight'},h('div',{style:{display:'flex',gap:6,padding:'4px 0'}},h('span',{title:'Không màu',onClick:()=>s('color',''),style:{display:'inline-block',width:26,height:26,borderRadius:4,background:'#ffffff',border:'3px solid '+(f.color===''?'var(--pri)':'#ddd'),cursor:'pointer',boxSizing:'border-box'}}),h('span',{title:'Vàng',onClick:()=>s('color','#FFF9C4'),style:{display:'inline-block',width:26,height:26,borderRadius:4,background:'#FFF9C4',border:'3px solid '+(f.color==='#FFF9C4'?'var(--pri)':'#ddd'),cursor:'pointer',boxSizing:'border-box'}}),h('span',{title:'Xanh lá',onClick:()=>s('color','#EAF3DE'),style:{display:'inline-block',width:26,height:26,borderRadius:4,background:'#EAF3DE',border:'3px solid '+(f.color==='#EAF3DE'?'var(--pri)':'#ddd'),cursor:'pointer',boxSizing:'border-box'}}),h('span',{title:'Xanh dương',onClick:()=>s('color','#E6F1FB'),style:{display:'inline-block',width:26,height:26,borderRadius:4,background:'#E6F1FB',border:'3px solid '+(f.color==='#E6F1FB'?'var(--pri)':'#ddd'),cursor:'pointer',boxSizing:'border-box'}}),h('span',{title:'Đỏ',onClick:()=>s('color','#FCEBEB'),style:{display:'inline-block',width:26,height:26,borderRadius:4,background:'#FCEBEB',border:'3px solid '+(f.color==='#FCEBEB'?'var(--pri)':'#ddd'),cursor:'pointer',boxSizing:'border-box'}}),h('span',{title:'Tím',onClick:()=>s('color','#F3E8FF'),style:{display:'inline-block',width:26,height:26,borderRadius:4,background:'#F3E8FF',border:'3px solid '+(f.color==='#F3E8FF'?'var(--pri)':'#ddd'),cursor:'pointer',boxSizing:'border-box'}}),h('span',{title:'Cam',onClick:()=>s('color','#FEE2E2'),style:{display:'inline-block',width:26,height:26,borderRadius:4,background:'#FEE2E2',border:'3px solid '+(f.color==='#FEE2E2'?'var(--pri)':'#ddd'),cursor:'pointer',boxSizing:'border-box'}}))),
    h(F,{label:'Ghi chú'},h('textarea',{value:f.note,onChange:e=>s('note',e.target.value),rows:2})),
    h('div',{className:'divider'}),
    h('div',{style:{fontSize:12,color:'var(--tx2)',fontWeight:600,marginBottom:6}},
      h('i',{className:'ti ti-tag',style:{marginRight:4}}),'Quy tắc tách tem cho sản phẩm này'
    ),
    h(F,{label:'Sản phẩm này có cần in tem không?'},h('div',{style:{display:'flex',gap:8,flexWrap:'wrap'}},
      h('button',{type:'button',onClick:()=>s('needsLabel',true),style:{padding:'7px 14px',background:f.needsLabel?'var(--pri)':'#fff',color:f.needsLabel?'#fff':'var(--tx)',border:'1px solid '+(f.needsLabel?'var(--pri)':'var(--bd)'),fontWeight:600}},'Có'),
      h('button',{type:'button',onClick:()=>s('needsLabel',false),style:{padding:'7px 14px',background:!f.needsLabel?'#A32D2D':'#fff',color:!f.needsLabel?'#fff':'var(--tx)',border:'1px solid '+(!f.needsLabel?'#A32D2D':'var(--bd)'),fontWeight:600}},'Không')
    )),
    f.needsLabel
      ?h(React.Fragment,null,
        h('div',{className:'g2'},
          h(F,{label:'Kg mỗi tem chuẩn'},h('input',{type:'number',min:0,step:.01,value:f.labelPackSize,onChange:e=>s('labelPackSize',e.target.value),placeholder:'Ví dụ: 10 hoặc 5'})),
          h(F,{label:'Cho gộp phần lẻ nhỏ vào tem cuối'},h('label',{style:{display:'flex',alignItems:'center',gap:8,height:38,padding:'0 4px'}},
            h('input',{type:'checkbox',checked:!!f.labelMergeSmallRemainder,onChange:e=>s('labelMergeSmallRemainder',e.target.checked),style:{width:16,height:16}}),
            h('span',{style:{fontSize:13,color:'var(--tx)'}},'Bật nếu muốn gộp phần lẻ rất nhỏ vào tem cuối')
          ))
        ),
        h('div',{style:{background:'var(--bg2)',padding:'8px 12px',borderRadius:'var(--r)',fontSize:12,color:'var(--tx2)',marginBottom:'.85rem'}},
          'Ví dụ: Bún tươi 57kg, nếu đặt 10kg/tem thì hệ thống sẽ in 5 tem 10kg và 1 tem 7kg.'
        )
      )
      :h('div',{style:{background:'#fff7ed',padding:'8px 12px',borderRadius:'var(--r)',fontSize:12,color:'#9A3412',marginBottom:'.85rem'}},
        'Sản phẩm này được đánh dấu không in tem, nên hệ thống sẽ không cho nhập quy tắc tem và sẽ tự bỏ qua khi bấm in tem.'
      ),
    h('div',{className:'divider'}),
    h('div',{style:{fontSize:12,color:'var(--tx2)',fontWeight:600,marginBottom:6}},h('i',{className:'ti ti-id-badge',style:{marginRight:4}}),'Mã & tên theo khách hàng (dùng khi in đơn)'),
    h('div',{className:'g2'},
      h(F,{label:'Mã SP của KH'},h('input',{value:f.custCode||'',onChange:e=>s('custCode',e.target.value),placeholder:'Mã theo khách hàng...'})),
      h(F,{label:'Tên SP của KH'},h('input',{value:f.custName||'',onChange:e=>s('custName',e.target.value),placeholder:'Tên theo khách hàng...'})),
    ),
    needWeight&&h('div',{style:{background:'var(--bg2)',padding:'8px 12px',borderRadius:'var(--r)',fontSize:12,color:'var(--tx2)',marginBottom:'.85rem'}},
      h('i',{className:'ti ti-info-circle',style:{marginRight:5}}),
      'Nhập khối lượng để tính tổng KL chuyến giao (bỏ trống nếu không cần)'
    ),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu sản phẩm'))
  );
}
function isGoodsProduct(prod,prodCats){
  const cat=prodCats?.find(c=>c.id===prod?.catId);
  const text=((prod?.type||prod?.kind||prod?.code||'')+' '+(cat?.name||'')+' '+(cat?.desc||'')).toLowerCase();
  const plain=text.normalize?text.normalize('NFD').replace(/[\u0300-\u036f]/g,''):text;
  const normalize=s=>String(s||'').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const explicitType=normalize(prod?.type||prod?.kind);
  const categoryName=normalize(cat?.name);
  const code=String(prod?.code||'').trim().toUpperCase();
  if(explicitType==='TP'||explicitType.includes('THANH PHAM')||categoryName==='TP'||categoryName.includes('THANH PHAM')||code.startsWith('TP'))return false;
  return explicitType==='HH'||explicitType.includes('HANG HOA')||categoryName==='HH'||categoryName.includes('HANG HOA')||plain.includes('hang hoa')||plain.includes('hanghoa')||code.startsWith('HH')||code.startsWith('H-');
}
function productCategoryId(prod,prodCats){
  const normalize=s=>String(s||'').trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const code=normalize(prod?.code);
  const current=prodCats?.find(c=>c.id===prod?.catId);
  const currentName=normalize(current?.name);
  const goodsCat=prodCats?.find(c=>normalize(c.name)==='HH'||normalize(c.name).includes('HANG HOA'));
  const finishedCat=prodCats?.find(c=>normalize(c.name)==='TP'||normalize(c.name).includes('THANH PHAM'));
  if((code.startsWith('HH')||code.startsWith('H-'))&&goodsCat)return goodsCat.id;
  if(code.startsWith('TP')&&finishedCat)return finishedCat.id;
  if(currentName==='HH'||currentName.includes('HANG HOA'))return goodsCat?.id||prod?.catId;
  if(currentName==='TP'||currentName.includes('THANH PHAM'))return finishedCat?.id||prod?.catId;
  return prod?.catId||'';
}
function ProductMergePicker({label:fieldLabel,products,value,onChange,excludeId}){
  const selected=products.find(product=>String(product.id)===String(value));
  const[text,setText]=useState(selected?[selected.code,selected.name].filter(Boolean).join(' - '):'');
  const[open,setOpen]=useState(false);
  useEffect(()=>{setText(selected?[selected.code,selected.name].filter(Boolean).join(' - '):'');},[value,selected?.id]);
  const normalize=s=>String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
  const query=normalize(text);
  const matches=open?products
    .filter(product=>String(product.id)!==String(excludeId||''))
    .map(product=>{
      const label=[product.code,product.name].filter(Boolean).join(' - ');
      const haystack=normalize(label);
      const score=!query?1:(haystack===query?100:haystack.startsWith(query)?90:haystack.includes(query)?80:query.split(/\s+/).filter(Boolean).reduce((sum,token)=>sum+(haystack.includes(token)?10:0),0));
      return{product,label,score};
    })
    .filter(item=>!query||item.score>0)
    .sort((a,b)=>b.score-a.score||a.label.localeCompare(b.label,'vi',{numeric:true}))
    .slice(0,25):[];
  return h(F,{label:fieldLabel},
    h('div',{style:{position:'relative'}},
      h('input',{
        value:text,
        onFocus:()=>setOpen(true),
        onChange:e=>{setText(e.target.value);if(value)onChange('');setOpen(true);},
        onBlur:()=>setTimeout(()=>setOpen(false),150),
        placeholder:'Gõ tên hoặc mã sản phẩm...',
        autoComplete:'off'
      }),
      open&&h('div',{style:{position:'absolute',left:0,right:0,top:'calc(100% + 3px)',zIndex:90,maxHeight:230,overflowY:'auto',background:'#fff',border:'1px solid var(--bd)',borderRadius:'var(--r)',boxShadow:'0 8px 24px rgba(0,0,0,.18)'}},
        matches.length?matches.map((item,index)=>h('button',{
          key:String(item.product.id)+'-'+index,type:'button',
          onMouseDown:e=>{e.preventDefault();setText(item.label);onChange(item.product.id);setOpen(false);},
          style:{display:'block',width:'100%',padding:'8px 10px',textAlign:'left',background:String(item.product.id)===String(value)?'#EAF3DE':'#fff',border:'none',borderBottom:'1px solid #eee',cursor:'pointer'}
        },item.label)):h('div',{style:{padding:10,fontSize:12,color:'var(--tx2)'}},'Không tìm thấy sản phẩm')
      )
    )
  );
}
function ProductMergeModal({products,prodCats,onMerge,onClose}){
  const goods=products.filter(product=>isGoodsProduct(product,prodCats));
  const[keepId,setKeepId]=useState('');
  const[removeId,setRemoveId]=useState('');
  const submit=()=>{
    if(!keepId||!removeId){window.showToast('Hãy chọn đủ hai sản phẩm HH cần gộp.','warn');return;}
    if(String(keepId)===String(removeId)){window.showToast('Hai sản phẩm phải khác nhau.','warn');return;}
    const keep=goods.find(product=>String(product.id)===String(keepId));
    const remove=goods.find(product=>String(product.id)===String(removeId));
    window.scfConfirm(
      'Giữ lại “'+(keep?.name||'')+'” và gộp “'+(remove?.name||'')+'”? Dòng sản phẩm trùng sẽ được xóa khỏi danh mục.',
      'Gộp hai sản phẩm HH'
    ).then(ok=>{if(ok)onMerge(keepId,removeId);});
  };
  return h(Modal,{title:'Gộp hai sản phẩm HH',onClose},
    h('div',{style:{fontSize:12,color:'var(--tx2)',background:'var(--bg2)',padding:'9px 12px',borderRadius:'var(--r)',marginBottom:12}},
      'Thông tin của sản phẩm giữ lại được ưu tiên. Các trường còn trống sẽ lấy từ sản phẩm bị gộp.'
    ),
    h(ProductMergePicker,{label:'Sản phẩm giữ lại *',products:goods,value:keepId,onChange:setKeepId,excludeId:removeId}),
    h(ProductMergePicker,{label:'Sản phẩm trùng cần gộp *',products:goods,value:removeId,onChange:setRemoveId,excludeId:keepId}),
    h(Row,null,
      h('button',{onClick:onClose},'Hủy'),
      h('button',{className:'bp',onClick:submit},h('i',{className:'ti ti-arrows-join',style:{fontSize:14}}),'Gộp sản phẩm')
    )
  );
}
function ProductsTab({products,setProducts,prodCats,setProdCats}){
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[catModal,scm]=useState(null);const[editCat,sec]=useState(null);const[q,sq]=useState('');const[filterCat,sfc]=useState('all');
  const saveProd=d=>{if(edit)setProducts(p=>p.map(x=>x.id===edit.id?d:x));else setProducts(p=>[...p,d]);sm(null);se(null);};
  const saveCat=d=>{if(editCat)setProdCats(p=>p.map(x=>x.id===editCat.id?d:x));else setProdCats(p=>[...p,d]);scm('manage');sec(null);window.showToast(editCat?'Đã cập nhật nhóm sản phẩm':'Đã thêm nhóm sản phẩm','success');};
  const delProd=id=>{window.scfConfirm('Bạn có chắc muốn xóa sản phẩm này?','Xóa sản phẩm',true).then(ok=>{if(ok){setProducts(p=>p.filter(x=>x.id!==id));window.showToast('Đã xóa sản phẩm','success');}});};
  const delCat=id=>{if(products.some(p=>p.catId===id)){window.showToast('Nhóm này đang có sản phẩm. Hãy chuyển sản phẩm sang nhóm khác trước khi xóa.','error',5500);return;}window.scfConfirm('Bạn có chắc muốn xóa nhóm sản phẩm này?','Xóa nhóm sản phẩm',true).then(ok=>{if(ok){setProdCats(p=>p.filter(x=>x.id!==id));window.showToast('Đã xóa nhóm sản phẩm','success');}});};
  const mergeProducts=(keepId,removeId)=>{
    setProducts(items=>{
      const keep=items.find(item=>String(item.id)===String(keepId));
      const remove=items.find(item=>String(item.id)===String(removeId));
      if(!keep||!remove)return items;
      const merged={...keep};
      ['code','name','catId','goodsGroup','unit','weightPerUnit','note','custCode','custName','color','labelPackSize'].forEach(key=>{
        if((merged[key]===undefined||merged[key]===null||merged[key]==='')&&remove[key]!==undefined)merged[key]=remove[key];
      });
      if(merged.needsLabel===undefined)merged.needsLabel=remove.needsLabel;
      if(merged.labelMergeSmallRemainder===undefined)merged.labelMergeSmallRemainder=remove.labelMergeSmallRemainder;
      return items.filter(item=>String(item.id)!==String(removeId)).map(item=>String(item.id)===String(keepId)?merged:item);
    });
    sm(null);
    window.showToast('Đã gộp hai sản phẩm HH và xóa dòng trùng.','success');
  };
  const COLS=[['code','Mã SP'],['name','Tên SP'],['catName','Danh mục'],['goodsGroup','Nhóm HH'],['unit','ĐVT'],['weightPerUnit','KL/đơn vị (kg)'],['labelRuleText','Quy tắc tem'],['note','Ghi chú']];
  const[sortProd,setSortProd]=useState('code'); // 'code' | 'name'
  // Hàm sort tự nhiên: TP01 < TP02 < TP10 < HH01 < HH02
  const naturalSort=(a,b)=>{
    const sa=a||'',sb=b||'';
    return sa.localeCompare(sb,'vi',{numeric:true,sensitivity:'base'});
  };
  useEffect(()=>{
    const ids=new Set();
    const hasDuplicateIds=products.some(x=>{
      const id=String(x?.id||'');
      if(!id||ids.has(id))return true;
      ids.add(id);
      return false;
    });
    const needsCategoryFix=products.some(x=>productCategoryId(x,prodCats)!==x.catId);
    if(needsCategoryFix||hasDuplicateIds)setProducts(items=>{
      const usedIds=new Set();
      return items.map(x=>{
        let id=String(x?.id||'');
        if(!id||usedIds.has(id))id='SP'+uid();
        usedIds.add(id);
      const catId=productCategoryId(x,prodCats);
        return {...x,id,catId:catId||x.catId};
      });
    });
  },[products,prodCats]);
  const list=products
    .filter(x=>(filterCat==='all'||productCategoryId(x,prodCats)===filterCat)&&(!q||x.name.toLowerCase().includes(q.toLowerCase())||x.code.toLowerCase().includes(q.toLowerCase())))
    .sort((a,b)=>sortProd==='code'?naturalSort(a.code,b.code):naturalSort(a.name,b.name));
  const exportRows=list.map(x=>{
    const rule=resolveProductLabelPackRule(x,x.name);
    return {...normalizeProductWeight(x),catName:prodCats.find(c=>c.id===x.catId)?.name||'',labelRuleText:rule.enabled?(rule.pack+'kg/tem'+(rule.mergeSmallRemainder?' · gộp lẻ nhỏ':' · tách riêng phần lẻ')):'Không in tem'};
  });
  return h('div',null,
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}},
      h('div',{className:'ptitle',style:{margin:0}},h('i',{className:'ti ti-box',style:{fontSize:20}}),'Sản phẩm'),
      h('button',{className:'bp',style:{fontSize:12,padding:'6px 12px'},onClick:()=>{sec(null);scm('manage')}},h('i',{className:'ti ti-tags',style:{fontSize:14}}),'Quản lý nhóm sản phẩm')
    ),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},
        h('button',{className:'pill'+(filterCat==='all'?' on':''),onClick:()=>sfc('all')},'Tất cả ('+products.length+')'),
        prodCats.map(c=>h('button',{key:c.id,className:'pill'+(filterCat===c.id?' on':''),onClick:()=>sfc(c.id)},c.name+' ('+products.filter(p=>productCategoryId(p,prodCats)===c.id).length+')'))
      ),
      h('div',{style:{display:'flex',gap:6}},
        h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm sản phẩm...'}),
        h('div',{style:{display:'flex',border:'1px solid var(--bd)',borderRadius:'var(--r)',overflow:'hidden',fontSize:12}},
          h('button',{onClick:()=>setSortProd('name'),style:{padding:'5px 10px',background:sortProd==='name'?'var(--pri)':'var(--bg2)',color:sortProd==='name'?'#fff':'var(--tx)',border:'none',cursor:'pointer',fontWeight:sortProd==='name'?600:400}},'Theo tên'),
          h('button',{onClick:()=>setSortProd('code'),style:{padding:'5px 10px',background:sortProd==='code'?'var(--pri)':'var(--bg2)',color:sortProd==='code'?'#fff':'var(--tx)',border:'none',cursor:'pointer',fontWeight:sortProd==='code'?600:400}},'Theo mã')
        ),
        h(ExportBtn,{onClick:()=>xlsxExport(exportRows,COLS,'San_pham')}),
        h(ImportBtn,{onFile:rows=>{
          const added=rows.map(r=>normalizeProductWeight({id:'SP'+uid(),code:r['Mã SP']||'',name:r['Tên SP']||r['Tên sản phẩm']||'',catId:prodCats.find(c=>c.name===r['Danh mục'])?.id||'',goodsGroup:r['Nhóm HH']||r['Nhóm hàng hóa']||'',unit:r['ĐVT']||r['Đơn vị']||'Cái',weightPerUnit:numFmt(r['KL/đơn vị (kg)']||r['Khối lượng/đv']||r['Khối lượng kg/cái']),needsLabel:!/^(0|false|khong|không|no)$/i.test(String(r['Có in tem không']||r['In tem']||'')),labelPackSize:numFmt(r['Kg mỗi tem chuẩn']||r['Kg/tem']||r['Quy tắc tem (kg)']),labelMergeSmallRemainder:/^(1|true|co|có|yes|x)$/i.test(String(r['Gộp lẻ nhỏ']||'')),note:r['Ghi chú']||''})).filter(r=>r.name);
          setProducts(p=>[...p,...added]);window.showToast('Đã nhập '+added.length+' sản phẩm','success');
        }}),
        h('button',{onClick:()=>sm('smart'),style:{padding:'6px 12px',fontSize:12,display:'flex',alignItems:'center',gap:5}},
            h('i',{className:'ti ti-wand',style:{fontSize:14}}),'Nhập từ danh sách'),
        h('button',{onClick:()=>sm('merge'),style:{padding:'6px 12px',fontSize:12,display:'flex',alignItems:'center',gap:5}},
          h('i',{className:'ti ti-arrows-join',style:{fontSize:14}}),'Gộp sản phẩm'),
        h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Thêm sản phẩm'})
      )
    ),
    modal==='smart'&&h(SmartImportModal,{prodCats,onImport:rows=>{
      const added=rows.map(r=>normalizeProductWeight({id:'SP'+uid(),code:'',name:r.name,catId:'',unit:r.unit,weightPerUnit:0,color:'',needsLabel:true,labelPackSize:0,labelMergeSmallRemainder:false,note:''}));
      setProducts(p=>{
        const names=new Set(p.map(x=>x.name.toLowerCase()+x.unit.toLowerCase()));
        const newOnes=added.filter(x=>!names.has(x.name.toLowerCase()+x.unit.toLowerCase()));
        window.showToast('Đã thêm '+newOnes.length+' sản phẩm mới'+(added.length-newOnes.length>0?' (bỏ qua '+(added.length-newOnes.length)+' trùng)':''),'success');
        return [...p,...newOnes];
      });
    },onClose:()=>sm(null)}),
    modal==='merge'&&h(ProductMergeModal,{products,prodCats,onMerge:mergeProducts,onClose:()=>sm(null)}),
    h(TableWrap,{cols:['Mã SP','Tên sản phẩm','Danh mục','Nhóm HH','Đơn vị','Khối lượng/đv','Quy tắc tem','Ghi chú','Mã KH','Tên SP KH',''],empty:'Chưa có sản phẩm nào.',
      rows:list.map((x,rowIndex)=>{
        const cat=prodCats.find(c=>c.id===x.catId);
        const needW=x.unit==='Cái'||x.unit==='Gói';
        const effectiveWeight=inferProductWeightPerUnit(x);
        const labelRule=resolveProductLabelPackRule(x,x.name);
        return h('tr',{key:String(x.id||x.code||'SP')+'-'+rowIndex},
          h('td',null,h('span',{style:{color:'var(--pri)',fontWeight:500}},x.code||x.id)),
          h('td',null,h('div',{style:{fontWeight:500}},x.name),x.note&&h('div',{style:{fontSize:11,color:'var(--tx2)'}},x.note)),
          h('td',null,cat?h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--tx)'}},cat.name):'—'),
          h('td',null,x.goodsGroup?h('span',{className:'badge',style:{background:'#FFF3CD',color:'#856404'}},x.goodsGroup):'—'),
          h('td',null,h('span',{className:'badge',style:{background:'#E6F1FB',color:'#185FA5'}},x.unit)),
          h('td',null,needW&&effectiveWeight?effectiveWeight.toLocaleString('vi-VN',{maximumFractionDigits:3})+' kg/'+x.unit:'—'),
          h('td',null,
            labelRule.enabled
              ?h(React.Fragment,null,
                h('div',{style:{fontSize:12,fontWeight:600,color:'var(--pri3)'}},labelRule.pack+'kg/tem'),
                h('div',{style:{fontSize:11,color:'var(--tx2)'}},labelRule.mergeSmallRemainder?'Gộp lẻ nhỏ':'Tách riêng phần lẻ')
              )
              :h('span',{className:'badge',style:{background:'#fef2f2',color:'#b91c1c'}},'Không in tem')
          ),
          h('td',null,x.note||'—'),
          h('td',null,h('span',{style:{color:'var(--pri)',fontWeight:500,fontSize:12}},x.custCode||'—')),
          h('td',null,h('span',{style:{fontSize:12}},x.custName||'—')),
          h('td',null,h('div',{style:{display:'flex',gap:2}},
            h('button',{className:'bi',onClick:()=>{se(x);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
            h('button',{className:'bi',onClick:()=>delProd(x.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
          ))
        );
      })
    }),
    modal==='f'&&h(ProductForm,{prod:edit,prodCats,onSave:saveProd,onClose:()=>{sm(null);se(null);}}),
    catModal==='manage'&&h(Modal,{title:'Quản lý nhóm sản phẩm',onClose:()=>{scm(null);sec(null);},lg:true},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,marginBottom:'1rem'}},
        h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Có '+prodCats.length+' nhóm sản phẩm'),
        h(AddBtn,{onClick:()=>{sec(null);scm('form');},label:'Thêm nhóm sản phẩm'})
      ),
      h('div',{className:'card',style:{padding:0,overflow:'hidden'}},
        prodCats.length?prodCats.map(c=>{const used=products.filter(p=>p.catId===c.id).length;return h('div',{key:c.id,style:{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderBottom:'.5px solid var(--bd)'}},
          h('i',{className:'ti ti-tag',style:{fontSize:18,color:'var(--pri)'}}),
          h('div',{style:{flex:1,minWidth:0}},h('div',{style:{fontWeight:600}},c.name),c.desc&&h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:2}},c.desc)),
          h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--tx2)'}},used+' sản phẩm'),
          h('button',{className:'bi',title:'Sửa nhóm',onClick:()=>{sec(c);scm('form');}},h('i',{className:'ti ti-edit',style:{fontSize:16}})),
          h('button',{className:'bi bdel',title:used?'Không thể xóa khi nhóm còn sản phẩm':'Xóa nhóm',onClick:()=>delCat(c.id),style:{color:used?'#999':'#A32D2D',opacity:used?.55:1}},h('i',{className:'ti ti-trash',style:{fontSize:16}}))
        );}):h('div',{className:'empty-st',style:{padding:30}},'Chưa có nhóm sản phẩm nào.')
      )
    ),
    catModal==='form'&&h(ProdCatForm,{cat:editCat||undefined,onSave:saveCat,onClose:()=>{sec(null);scm('manage');}})
  );
}

/* ─── POINT ROW ─── */
function PointRow({pt,allAreas,onAreaChange,onNameChange,onDelete}){
  const[showNew,setShowNew]=useState(false);
  const[newAreaTxt,setNewAreaTxt]=useState('');
  const normalizeAreaValue=v=>{
    const raw=String(v??'').trim();
    return /^_+custom_+$/i.test(raw)?'':raw;
  };
  // Select uncontrolled - defaultValue set 1 lần khi mount
  // key={pt.id} ở cha giữ nguyên → DOM không bị tạo lại khi list re-render
  const selRef=React.useRef(null);
  // Khi pt.area thay đổi từ bên ngoài (vd sau khi lưu), cập nhật DOM trực tiếp
  React.useEffect(()=>{
    const nextArea=normalizeAreaValue(pt.area);
    if(selRef.current && selRef.current.value!==nextArea){
      selRef.current.value=nextArea||'';
    }
  },[pt.area]);
  const commitNew=()=>{
    const v=newAreaTxt.trim();if(!v)return;
    onAreaChange(pt.id,v);
    if(selRef.current)selRef.current.value=v;
    setShowNew(false);setNewAreaTxt('');
  };
  const cancelNew=()=>{
    onAreaChange(pt.id,curArea);
    if(selRef.current)selRef.current.value=curArea||'';
    setShowNew(false);
    setNewAreaTxt('');
  };
  const curArea=normalizeAreaValue(pt.area);
  const isKnown=allAreas.includes(curArea)||curArea==='';
  return h('div',{className:'ptrow',style:{flexDirection:'column',alignItems:'stretch',gap:4}},
    h('div',{style:{display:'flex',alignItems:'center',gap:8}},
      h('i',{className:'ti ti-map-pin',style:{fontSize:14,color:'var(--pri)',flexShrink:0}}),
      h('input',{value:pt.name,onChange:e=>onNameChange(pt.id,e.target.value),
        style:{flex:1,fontWeight:500,padding:'3px 6px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:13}}),
      showNew
        ? h('div',{style:{display:'flex',gap:4,width:200}},
            h('input',{value:newAreaTxt,autoFocus:true,placeholder:'Tên khu vực mới...',
              onChange:e=>{
                const next=e.target.value;
                setNewAreaTxt(next);
                onAreaChange(pt.id,next.trim());
              },
              onKeyDown:e=>{if(e.key==='Enter')commitNew();if(e.key==='Escape'){setShowNew(false);setNewAreaTxt('');}},
              style:{flex:1,padding:'3px 6px',borderRadius:'var(--r)',border:'1px solid var(--pri)',fontSize:12}}),
            h('button',{className:'bp',onClick:commitNew,style:{padding:'2px 8px',fontSize:12}},
              h('i',{className:'ti ti-check',style:{fontSize:13}})),
            h('button',{onClick:cancelNew,style:{padding:'2px 6px',fontSize:12}},
              h('i',{className:'ti ti-x',style:{fontSize:13}}))
          )
        : h('select',{
            ref:selRef,
            defaultValue:curArea||'',
            onChange:e=>{
              const v=e.target.value;
              if(v==='__new__'){
                setNewAreaTxt(isKnown?'':curArea);
                if(!isKnown&&curArea) onAreaChange(pt.id,curArea);
                setShowNew(true);
                if(selRef.current)selRef.current.value=curArea||'';
                return;
              }
              // Gọi onAreaChange để cập nhật pendingAreas ref ở cha (không re-render)
              onAreaChange(pt.id,v);
            },
            style:{width:130,padding:'3px 6px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12,color:'var(--tx2)'}
          },
            h('option',{value:''},'— Khu vực —'),
            allAreas.map(a=>h('option',{key:a,value:a},a)),
            !isKnown&&curArea&&h('option',{value:curArea},curArea),
            h('option',{value:'__new__',style:{color:'var(--pri)',fontStyle:'italic'}},'+ Thêm khu vực mới...')
          ),
      h('button',{className:'bi',onClick:()=>onDelete(pt.id,pt),style:{color:'#A32D2D',flexShrink:0}},
        h('i',{className:'ti ti-trash',style:{fontSize:14}}))
    ),
    pt.address&&h('div',{style:{fontSize:11,color:'var(--tx2)',paddingLeft:22}},
      pt.address+(pt.contact?' • '+pt.contact+' '+pt.phone:''))
  );
}
function CustomerForm({cust,shifts,customers,orders,areas,onSave,onClose}){
  const normalize=s=>(s||'').trim().toUpperCase().replace(/\s+/g,' ').replace(/[^A-Z0-9\u00C0-\u024F\u1E00-\u1EFF ]/g,'');
  const normalizeAreaValue=v=>{
    const raw=String(v??'').trim();
    return /^_+custom_+$/i.test(raw)?'':raw;
  };
  const dedup=pts=>{
    const map=new Map();
    (pts||[]).forEach(p=>{
      const k=normalize(p.name);
      if(!k)return; // bỏ qua bản không có tên
      if(!map.has(k)){map.set(k,p);}
      else {
        const existing=map.get(k);
        const score=x=>(x.area?3:0)+(x.contact?1:0)+(x.address?1:0)+(x.phone?1:0);
        if(score(p)>score(existing))map.set(k,p);
      }
    });
    return [...map.values()];
  };
  // Dữ liệu cũ có thể có nhiều địa điểm dùng chung một ID. Màn sửa khu vực
  // lưu tạm theo ID nên các dòng trùng ID sẽ bị đổi theo nhau. Giữ ID đầu tiên
  // và cấp ID riêng cho các dòng còn lại ngay khi mở hồ sơ.
  const ensureUniquePointIds=pts=>{
    const seen=new Set();
    return (pts||[]).map(pt=>{
      let id=String(pt.id||'').trim();
      if(!id||seen.has(id)){
        do{id='PT'+uid();}while(seen.has(id));
      }
      seen.add(id);
      return {...pt,id};
    });
  };
  // Dedup theo tên khi load - dọn sạch dữ liệu trùng từ lần trước
  const initPoints=dedup(ensureUniquePointIds((cust?.points||[]).map(pt=>({...pt,area:normalizeAreaValue(pt.area)}))))
    .sort((a,b)=>{const ac=(a.area||'zzz').localeCompare(b.area||'zzz','vi');return ac!==0?ac:(a.name||'').localeCompare(b.name||'','vi');});
  const[f,sf]=useState(cust?{...cust,points:initPoints}:{id:'',code:'',name:'',group:'',taxCode:'',address:'',note:'',points:[]});
  const[np,snp]=useState({name:'',address:'',contact:'',phone:'',area:'',newAreaText:''});
  const[saved,setSaved]=useState(false);
  // pendingAreas: lưu thay đổi khu vực mà KHÔNG trigger re-render
  const pendingAreas=React.useRef(Object.fromEntries(initPoints.map(p=>[p.id,normalizeAreaValue(p.area)||''])));
  const set=(k,v)=>sf(p=>({...p,[k]:v}));
  const addPt=()=>{
    if(!np.name){window.showToast('Nhập tên địa điểm!','warn');return;}
    // Kiểm tra trùng tên
    const norm=s=>(s||'').trim().toLowerCase().replace(/\s+/g,' ');
    const isDupPt=f.points.some(pt=>norm(pt.name)===norm(np.name));
    if(isDupPt){
      window.showToast('⚠ Địa điểm "'+np.name+'" đã có trong danh sách!\nVui lòng kiểm tra lại hoặc dùng tên khác.','info');
      return;
    }
    const newId='PT'+uid();
    const areaVal=normalizeAreaValue(np.area==='__new__'?(np.newAreaText||'').trim():(np.area||''));
    pendingAreas.current[newId]=areaVal;
    sf(p=>({...p,points:[...p.points,{...np,id:newId,area:areaVal}]}));
    snp({name:'',address:'',contact:'',phone:'',area:'',newAreaText:''});
  };
  // onAreaChange: chỉ cập nhật ref, KHÔNG re-render
  const onAreaChange=(id,v)=>{pendingAreas.current[id]=normalizeAreaValue(v);};
  const doSave=(close)=>{
    if(!f.name){window.showToast('Nhập tên khách hàng!','warn');return;}
    const code=(f.code||'').trim().toUpperCase()||'KH'+String(Date.now()).slice(-6);
    const isDup=customers&&customers.some(c=>c.id===code&&c.id!==(cust?.id||''));
    if(isDup){window.showToast('Mã KH "'+code+'" đã tồn tại! Vui lòng dùng mã khác.','error');return;}
    // Merge pendingAreas + dedup + sort theo khu vực → tên
    const seen=new Set();
    const finalPoints=f.points
      .map(pt=>({...pt,area:normalizeAreaValue(pendingAreas.current[pt.id]!==undefined?pendingAreas.current[pt.id]:pt.area)}))
      .filter(pt=>{const k=pt.id+'|'+(pt.name||'').trim().toUpperCase();if(seen.has(k))return false;seen.add(k);return true;})
      .sort((a,b)=>{const ac=(a.area||'zzz').localeCompare(b.area||'zzz','vi');return ac!==0?ac:(a.name||'').localeCompare(b.name||'','vi');});
    // Cập nhật state để UI hiện đúng (khi giữ mở)
    sf(p=>({...p,points:finalPoints}));
    // Cập nhật pendingAreas theo thứ tự mới
    finalPoints.forEach(pt=>{pendingAreas.current[pt.id]=pt.area||'';});
    onSave({...f,id:code,code,points:finalPoints},close);
    if(!close){setSaved(true);setTimeout(()=>setSaved(false),2000);}
  };
  const submit=()=>doSave(true);
  // Shared buttons row
  const BtnRow=()=>h(Row,null,
    h('button',{onClick:onClose},'Hủy'),
    h('button',{
      onClick:()=>doSave(false),
      style:{padding:'8px 16px',display:'flex',alignItems:'center',gap:4,background:saved?'#2d6a4f':'var(--bg2)',color:saved?'#fff':'var(--tx)',border:'1px solid var(--bd)',borderRadius:'var(--r)',cursor:'pointer',fontSize:13,transition:'all .3s'}
    },h('i',{className:'ti ti-'+(saved?'check':'device-floppy'),style:{fontSize:14}}),saved?'Đã lưu!':'Lưu (giữ mở)'),
    h('button',{className:'bp',onClick:()=>doSave(true),style:{padding:'8px 20px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu & Đóng')
  );
  // Add-point form
  const allAreas=(areas&&areas.length>0)?areas.map(a=>a.code).filter(Boolean).sort((a,b)=>a.localeCompare(b,'vi')):[...new Set([...(shifts||[]).map(s=>s.area),...f.points.map(p=>p.area)].filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const AddPtForm=()=>h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:10,marginTop:4}},
    h('div',{style:{fontSize:12,color:'var(--tx2)',fontWeight:500,marginBottom:6}},'Thêm địa điểm mới'),
    h('div',{className:'g2'},
      h(F,{label:'Tên địa điểm *'},h('input',{value:np.name,onChange:e=>snp(p=>({...p,name:e.target.value})),placeholder:'Kho, Văn phòng, Cửa hàng...'})),
      h(F,{label:'Khu vực'},np.area==='__new__'
        ?h('div',{style:{display:'flex',gap:4}},
            h('input',{autoFocus:true,placeholder:'Nhập khu vực mới...',
              onKeyDown:e=>{if(e.key==='Escape')snp(p=>({...p,area:''}));},
              onChange:e=>snp(p=>({...p,newAreaText:e.target.value})),
              value:np.newAreaText||'',
              style:{flex:1,padding:'8px 10px',border:'.5px solid var(--pri)',borderRadius:'var(--r)',fontSize:14}
            }),
            h('button',{onClick:()=>snp(p=>({...p,area:'',newAreaText:''})),style:{padding:'6px 10px'}},h('i',{className:'ti ti-x',style:{fontSize:14}}))
          )
        :h('select',{value:np.area||'',onChange:e=>{if(e.target.value==='__new__')snp(p=>({...p,area:'__new__'}));else snp(p=>({...p,area:e.target.value}));}},
            h('option',{value:''},'— Chọn khu vực —'),
            allAreas.map(a=>h('option',{key:a,value:a},a)),
            h('option',{value:'__new__',style:{color:'var(--pri)',fontStyle:'italic'}},'+ Thêm khu vực mới...')
          )
      ),
      h(F,{label:'Địa chỉ'},h('input',{value:np.address,onChange:e=>snp(p=>({...p,address:e.target.value})),placeholder:'Số nhà, đường...'})),
      h(F,{label:'Người liên hệ'},h('input',{value:np.contact,onChange:e=>snp(p=>({...p,contact:e.target.value})),placeholder:'Tên người nhận'})),
      h(F,{label:'Điện thoại'},h('input',{value:np.phone,onChange:e=>snp(p=>({...p,phone:e.target.value})),placeholder:'090...'})),
    ),
    h('button',{onClick:addPt,style:{fontSize:12,padding:'5px 14px'}},h('i',{className:'ti ti-plus',style:{fontSize:13,marginRight:4}}),'Thêm địa điểm')
  );
  return h(Modal,{title:cust?'Sửa khách hàng':'Thêm khách hàng',onClose,lg:'xl'},
    h('div',{style:{display:'grid',gridTemplateColumns:'340px 1fr',gap:24,alignItems:'start'}},
      // ── Cột trái: thông tin KH + form thêm địa điểm + nút lưu ──
      h('div',{style:{display:'flex',flexDirection:'column',gap:12}},
        h('div',{className:'g3'},
          h(F,{label:'Mã KH (để trống = tự tạo)'},h('input',{value:f.code||f.id||'',onChange:e=>set('code',e.target.value.toUpperCase()),placeholder:'KH001, WELSTORY...',style:{}})),
          h(F,{label:'Tên khách hàng *'},h('input',{value:f.name,onChange:e=>set('name',e.target.value),placeholder:'Tên công ty / cá nhân'})),
          h(F,{label:'Nhóm khách hàng'},h('input',{value:f.group||'',onChange:e=>set('group',e.target.value),placeholder:'Nhóm A, Siêu thị, Đại lý...'})),
          h(F,{label:'Mã số thuế'},h('input',{value:f.taxCode,onChange:e=>set('taxCode',e.target.value),placeholder:'0312345678'}))
        ),
        h(F,{label:'Địa chỉ chính'},h('input',{value:f.address,onChange:e=>set('address',e.target.value),placeholder:'Địa chỉ...'})),
        h(F,{label:'Ghi chú'},h('textarea',{value:f.note,onChange:e=>set('note',e.target.value),rows:2})),
        h('hr',{className:'divider',style:{margin:'4px 0'}}),
        AddPtForm(),
        h('hr',{className:'divider',style:{margin:'4px 0'}}),
        BtnRow()
      ),
      // ── Cột phải: danh sách địa điểm ──
      h('div',null,
        h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8,flexWrap:'wrap',gap:6}},
          h('div',{style:{fontWeight:500,fontSize:13,color:'var(--pri3)'}},h('i',{className:'ti ti-map-pin',style:{marginRight:5}}),'Địa điểm giao hàng (',f.points.length,')'),
          h('div',{style:{display:'flex',gap:6}},
            // Nút gộp địa điểm gần giống
            h('button',{
              onClick:()=>{
                // Tìm các nhóm địa điểm có tên gần giống (sau khi trim + normalize)
                const normalize=s=>(s||'').trim().toLowerCase().replace(/\s+/g,' ');
                const groups={};
                f.points.forEach(pt=>{
                  const key=norm2(pt.name);
                  if(!groups[key])groups[key]=[];
                  groups[key].push(pt);
                });
                const dupGroups=Object.values(groups).filter(g=>g.length>1);
                if(dupGroups.length===0){window.showToast('Không tìm thấy địa điểm trùng hoặc gần giống!','error');return;}
                // Hiện confirm với danh sách
                const lines=dupGroups.map(g=>g.map(p=>'  • "'+p.name+'" ('+( p.area||'chưa có khu vực')+')').join('\n')).join('\n---\n');
                const msg='Tìm thấy '+dupGroups.length+' nhóm trùng:\n\n'+lines+'\n\nGộp lại? (giữ địa điểm đầu tiên mỗi nhóm, xóa các địa điểm trùng)';
                if(!confirm(msg))return;
                // Gộp: giữ pt đầu tiên mỗi nhóm
                const keepIds=new Set();
                const mergeMap={}; // id cũ → id giữ lại
                dupGroups.forEach(g=>{
                  const keep=g[0];
                  keepIds.add(keep.id);
                  g.slice(1).forEach(dup=>{mergeMap[dup.id]=keep.id;});
                });
                // Giữ tất cả điểm không trùng + điểm đầu tiên mỗi nhóm
                const newPoints=f.points.filter(pt=>{
                  const key=normalize(pt.name);
                  const grp=groups[key];
                  if(grp.length===1)return true; // không trùng
                  return pt.id===grp[0].id; // chỉ giữ cái đầu
                });
                sf(p=>({...p,points:newPoints}));
                window.showToast('Đã gộp '+dupGroups.reduce((s,g)=>s+g.length-1,0)+' địa điểm trùng!','success');
              },
              style:{fontSize:11,padding:'3px 10px',display:'flex',alignItems:'center',gap:4,border:'1px solid #E06060',color:'#A32D2D',background:'transparent',borderRadius:'var(--r)',cursor:'pointer'}
            },h('i',{className:'ti ti-git-merge',style:{fontSize:13}}),'Gộp địa điểm trùng'),
            // Nút dọn trùng tên chính xác
            h('button',{
              onClick:()=>{
                // Debug: log tất cả điểm ra console
                
                
                f.points.forEach((p,i)=>{
                  const k=normalize(p.name);
                  
                });
                // Tìm trùng bằng normalize mạnh
                const seen=new Map();
                const dups=[];
                const dupPairs=[];
                f.points.forEach(p=>{
                  const k=normalize(p.name);
                  if(seen.has(k)){
                    dups.push(p.name+' ('+p.area+')');
                    dupPairs.push({keep:seen.get(k),remove:p});
                  } else seen.set(k,p);
                });
                if(dups.length===0){
                  // Thử tìm bằng exact string match
                  const exactSeen=new Map();
                  const exactDups=[];
                  f.points.forEach(p=>{
                    const k=p.name;
                    if(exactSeen.has(k))exactDups.push(k);
                    else exactSeen.set(k,p);
                  });
                  if(exactDups.length>0){
                    window.showToast('Tìm thấy '+exactDups.length+' trùng exact:\n'+exactDups.join('\n')+'\n\nNhưng normalize không bắt được - có thể có ký tự ẩn. Xem console để debug.','error');
                    return;
                  }
                  window.showToast('Không tìm thấy địa điểm trùng!\nĐã kiểm tra '+f.points.length+' địa điểm.\nXem Console (F12) để debug chi tiết.','error');
                  return;
                }
                const msg='Tìm thấy '+dups.length+' địa điểm trùng:\n• '+dups.slice(0,10).join('\n• ')+(dups.length>10?'\n...':'')+'\n\nGiữ bản có thông tin đầy đủ hơn. Tiếp tục?';
                if(confirm(msg)){
                  const cleaned=dedup(f.points).sort((a,b)=>{const ac=(a.area||'zzz').localeCompare(b.area||'zzz','vi');return ac!==0?ac:(a.name||'').localeCompare(b.name||'','vi');});
                  sf(p=>({...p,points:cleaned}));
                  cleaned.forEach(pt=>{pendingAreas.current[pt.id]=pt.area||'';});
                  window.showToast('Đã xóa '+dups.length+' địa điểm trùng! Còn lại '+cleaned.length+' địa điểm.','success');
                }
              },
              style:{fontSize:11,padding:'3px 10px',display:'flex',alignItems:'center',gap:4,border:'1px solid #856404',color:'#856404',background:'transparent',borderRadius:'var(--r)',cursor:'pointer'}
            },h('i',{className:'ti ti-eraser',style:{fontSize:13}}),'Dọn trùng tên'),
            // Nút sắp xếp
            h('button',{
              onClick:()=>sf(p=>({...p,points:[...p.points].sort((a,b)=>{const ac=(a.area||'').localeCompare(b.area||'','vi');return ac!==0?ac:(a.name||'').localeCompare(b.name||'','vi');})})),
              style:{fontSize:11,padding:'3px 10px',display:'flex',alignItems:'center',gap:4,border:'1px solid var(--pri)',color:'var(--pri)',background:'transparent',borderRadius:'var(--r)',cursor:'pointer'}
            },h('i',{className:'ti ti-arrows-sort',style:{fontSize:13}}),'Sắp xếp theo khu vực')
          )
        ),
        (()=>{
          const rows=[];
          let lastArea=null;
          // Sort points theo khu vực rồi tên
          const sorted=[...f.points].sort((a,b)=>{
            const ac=(a.area||'zzz').localeCompare(b.area||'zzz','vi');
            return ac!==0?ac:(a.name||'').localeCompare(b.name||'','vi');
          });
          sorted.forEach(pt=>{
            const area=pt.area||'';
            if(area!==lastArea){
              lastArea=area;
              // Dòng phân cách khu vực
              rows.push(h('div',{key:'sep-'+area,style:{
                display:'flex',alignItems:'center',gap:8,
                margin:'6px 0 4px',padding:'3px 8px',
                background:'#f0f7f0',borderRadius:'var(--r)',
                borderLeft:'3px solid var(--pri)'
              }},
                h('span',{style:{fontSize:11,fontWeight:700,color:'var(--pri)',letterSpacing:.5,textTransform:'uppercase'}},
                  area||'Chưa phân khu vực'
                ),
                h('span',{style:{fontSize:11,color:'var(--tx2)'}},
                  '('+sorted.filter(p=>(p.area||'')===area).length+' địa điểm)'
                )
              ));
            }
            rows.push(h(PointRow,{
              key:pt.id,pt,allAreas,
              onNameChange:(id,v)=>sf(p=>({...p,points:p.points.map(x=>x.id===id?{...x,name:v}:x)})),
              onAreaChange:onAreaChange,
              onDelete:(delId,delPt)=>{
                const delName=(delPt?.name||'').trim().toUpperCase();
                const hasOrders=(orders||[]).some(o=>
                  (o.pointId===delId)||(o.pointName||'').trim().toUpperCase()===delName
                );
                if(hasOrders){
                  const cnt=(orders||[]).filter(o=>(o.pointId===delId)||(o.pointName||'').trim().toUpperCase()===delName).length;
                  if(!confirm('⚠ Địa điểm "'+delPt?.name+'" có '+cnt+' đơn hàng liên quan!\n\nNếu xóa, các đơn hàng này vẫn còn nhưng sẽ mất thông tin địa điểm.\n\nBạn có chắc muốn xóa?'))return;
                } else {
                  if(!confirm('Địa điểm "'+delPt?.name+'" không có đơn hàng nào.\nXóa địa điểm này?'))return;
                }
                delete pendingAreas.current[delId];
                sf(p=>({...p,points:p.points.filter(x=>x.id!==delId)}));
              }
            }));
          });
          return rows;
        })()
      )
    )
  );
}
