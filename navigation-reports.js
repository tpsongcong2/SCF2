/* ─── SIDEBAR ─── */
/* ═══════ COLLAPSIBLE SIDEBAR + MUA HÀNG + BÁO CÁO ═══════ */

/* --- NCC (Nhà cung cấp) --- */
function NCCForm({ncc,onSave,onClose}) {
    const [f,sf]=useState(ncc||{code:'',name:'',taxCode:'',address:'',phone:'',email:'',contact:'',note:''});
    const s=(k,v)=>sf(p=>({...p,[k]:v}));
    return h(Modal,{title:ncc?'Sửa NCC':'Thêm nhà cung cấp',onClose},
      h('div',{className:'g2'},h(F,{label:'Mã NCC'},h('input',{value:f.code,onChange:e=>s('code',e.target.value),placeholder:'NCC001'})),h(F,{label:'Tên NCC *'},h('input',{value:f.name,onChange:e=>s('name',e.target.value)}))),
      h('div',{className:'g2'},h(F,{label:'Mã số thuế'},h('input',{value:f.taxCode,onChange:e=>s('taxCode',e.target.value)})),h(F,{label:'Người liên hệ'},h('input',{value:f.contact,onChange:e=>s('contact',e.target.value)}))),
      h('div',{className:'g2'},h(F,{label:'Điện thoại'},h('input',{value:f.phone,onChange:e=>s('phone',e.target.value)})),h(F,{label:'Email'},h('input',{value:f.email,onChange:e=>s('email',e.target.value)}))),
      h(F,{label:'Địa chỉ'},h('input',{value:f.address,onChange:e=>s('address',e.target.value)})),
      h(F,{label:'Ghi chú'},h('textarea',{value:f.note,onChange:e=>s('note',e.target.value),rows:2})),
      h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:()=>{if(!f.name){window.showToast('Nhập tên NCC!','warn');return;}onSave({...f,id:ncc?.id||'NCC'+uid()});},style:{padding:'8px 20px'}},'Lưu NCC'))
    );
}
function NCCTab({nccs,setNCCs,purchases,setPurchases,title='Nhà cung cấp',fileName='Nha_cung_cap',readOnly=false}) {
  const [modal,sm]=useState(null); const [edit,se]=useState(null); const [q,sq]=useState('');
  const [mergeOpen,setMergeOpen]=useState(false); const [keepId,setKeepId]=useState(''); const [mergeId,setMergeId]=useState('');
  const norm=s=>String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const save=d=>{if(edit)setNCCs(p=>p.map(x=>x.id===edit.id?d:x));else setNCCs(p=>[...p,d]);sm(null);se(null);};
  const del=id=>{
    const target=(nccs||[]).find(x=>x.id===id);
    const linked=(purchases||[]).filter(p=>{
      const byId=String(p.nccId||'')===String(id);
      const byName=target && norm(p.nccName)===norm(target.name);
      const byCode=target?.code && norm(p.nccName)===norm(target.code);
      return byId||byName||byCode;
    });
    const msg=linked.length
      ? `NCC này đang có ${linked.length} đơn mua liên quan. Nếu xóa, các đơn cũ sẽ mất liên kết NCC. Bạn vẫn muốn xóa chứ?`
      : 'Bạn có chắc muốn xóa nhà cung cấp này?';
    const title=linked.length?'Cảnh báo NCC đang có đơn':'Xóa NCC';
    window.scfConfirm(msg,title,true).then(ok=>{
      if(ok){
        setNCCs(p=>p.filter(x=>x.id!==id));
        window.showToast('Đã xóa NCC','success');
      }
    });
  };
  const openMerge=()=>{
    const first=(nccs||[])[0]?.id||'';
    const second=(nccs||[]).find(x=>x.id!==first)?.id||'';
    setKeepId(first);setMergeId(second);setMergeOpen(true);
  };
  const mergeSuppliers=()=>{
    if(!keepId||!mergeId||keepId===mergeId){window.showToast('Chọn 2 NCC khác nhau để gộp.','warn');return;}
    const keep=(nccs||[]).find(x=>x.id===keepId),old=(nccs||[]).find(x=>x.id===mergeId);
    if(!keep||!old)return;
    const isOld=p=>String(p.nccId||'')===String(old.id)||norm(p.nccName)===norm(old.name)||(old.code&&norm(p.nccName)===norm(old.code));
    const affected=(purchases||[]).filter(isOld).length;
    window.scfConfirm('Gộp "'+(old.name||old.code)+'" vào "'+(keep.name||keep.code)+'"? '+affected+' đơn mua liên quan sẽ tự chuyển sang NCC giữ lại.','Gộp nhà cung cấp',true).then(ok=>{
      if(!ok)return;
      setPurchases&&setPurchases(prev=>(prev||[]).map(p=>isOld(p)?{...p,nccId:keep.id,nccName:keep.name}:p));
      setNCCs(prev=>(prev||[]).filter(x=>x.id!==old.id));
      setMergeOpen(false);
      window.showToast('Đã gộp NCC và chuyển '+affected+' đơn mua.','success');
    });
  };
  const importNcc=rows=>{
    const mapped=rows.map(r=>({
      id:'NCC'+uid(),
      code:r['Mã NCC']||r['Mã']||r.code||'',
      name:r['Tên NCC']||r['Tên nhà cung cấp']||r['Tên']||r.name||'',
      taxCode:r['MST']||r['Mã số thuế']||r.taxCode||'',
      phone:r['Điện thoại']||r['SĐT']||r.phone||'',
      email:r.Email||r.email||'',
      contact:r['Người LH']||r['Người liên hệ']||r.contact||'',
      address:r['Địa chỉ']||r.address||'',
      note:r['Ghi chú']||r.note||''
    })).filter(x=>x.name);
    if(!mapped.length){window.showToast('File chưa có dòng NCC hợp lệ.','warn');return;}
    setNCCs(prev=>{const next=[...prev];mapped.forEach(n=>{const i=next.findIndex(x=>(n.code&&x.code===n.code)||x.name.toLowerCase()===n.name.toLowerCase());if(i>=0)next[i]={...next[i],...n,id:next[i].id};else next.push(n);});return next;});
  };
  const list=nccs.filter(x=>!q||String(x.name||'').toLowerCase().includes(q.toLowerCase())||String(x.code||'').toLowerCase().includes(q.toLowerCase())||String(x.phone||'').includes(q)).slice().sort((a,b)=>{
    const codeNo=x=>{const m=String(x.code||'').trim().match(/^NCC0*(\d+)$/i);return m?Number(m[1]):Number.POSITIVE_INFINITY;};
    const na=codeNo(a),nb=codeNo(b);
    if(na!==nb)return na-nb;
    const byCode=String(a.code||'').localeCompare(String(b.code||''),'vi',{numeric:true});
    return byCode||String(a.name||'').localeCompare(String(b.name||''),'vi');
  });
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-building-store',style:{fontSize:20}}),title),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm NCC...'}),
      h('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},
        h(ExportBtn,{onClick:()=>xlsxExport(nccs,[['code','Mã NCC'],['name','Tên NCC'],['taxCode','MST'],['phone','Điện thoại'],['email','Email'],['contact','Người LH'],['address','Địa chỉ'],['note','Ghi chú']],fileName)}),
        !readOnly&&h(ImportBtn,{onFile:importNcc}),
        !readOnly&&h('button',{onClick:openMerge,disabled:(nccs||[]).length<2,style:{fontSize:12,padding:'6px 12px'}},h('i',{className:'ti ti-git-merge',style:{fontSize:14}}),'Gộp NCC'),
        !readOnly&&h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Thêm NCC'})
      )
    ),
    h('div',{className:'mobile-only report-mobile-section'},
      list.length?list.map(x=>h('div',{key:'mncc_'+x.id,className:'mobile-data-card'},
        h('div',{className:'mobile-data-head'},
          h('div',null,
            h('div',{className:'mobile-data-title'},x.name||'—'),
            h('div',{className:'mobile-data-sub'},x.code||x.id||'—')
          ),
          h('div',{className:'mobile-data-sub'},x.phone||'—')
        ),
        h('div',{className:'mobile-data-grid'},
          h('div',{className:'mobile-data-item'},h('b',null,'MST'),h('span',null,x.taxCode||'—')),
          h('div',{className:'mobile-data-item'},h('b',null,'Người LH'),h('span',null,x.contact||'—'))
        ),
        (x.address||x.email)&&h('div',{style:{marginTop:8,fontSize:12,color:'var(--tx2)'}},
          [x.address,x.email].filter(Boolean).join(' • ')
        ),
        !readOnly&&h('div',{className:'fuel-mobile-actions',style:{marginTop:8}},
          h('button',{className:'bi',onClick:()=>{se(x);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
          h('button',{className:'bi',onClick:()=>del(x.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
        )
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có nhà cung cấp nào.')
    ),
    h('div',{className:'tw desktop-only'},h('table',null,
      h('thead',null,h('tr',null,...['Mã NCC','Tên NCC','MST','Điện thoại','Người LH','Địa chỉ',''].map(c=>h('th',{key:c},c)))),
      h('tbody',null,list.length?list.map(x=>h('tr',{key:x.id},
        h('td',null,h('span',{style:{color:'var(--pri)',fontWeight:500}},x.code||x.id)),
        h('td',null,h('div',{style:{fontWeight:500}},x.name),x.email&&h('div',{style:{fontSize:11,color:'var(--tx2)'}},x.email)),
        h('td',null,x.taxCode||'—'),h('td',null,x.phone||'—'),h('td',null,x.contact||'—'),
        h('td',null,h('span',{style:{color:'var(--tx2)',fontSize:12,display:'block',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},x.address||'—')),
        h('td',null,!readOnly&&h('div',{style:{display:'flex',gap:2}},
          h('button',{className:'bi',onClick:()=>{se(x);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
          h('button',{className:'bi',onClick:()=>del(x.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
        ))
      )):h('tr',null,h('td',{colSpan:7,className:'empty-st'},'Chưa có nhà cung cấp nào.')))
    )),
    modal==='f'&&h(NCCForm,{ncc:edit,onSave:save,onClose:()=>{sm(null);se(null);}}),
    mergeOpen&&h(Modal,{title:'Gộp nhà cung cấp',onClose:()=>setMergeOpen(false)},
      h('div',{style:{fontSize:13,color:'var(--tx2)',marginBottom:12}},'Đơn mua của NCC bị gộp sẽ tự đổi sang NCC được giữ lại.'),
      h(F,{label:'NCC giữ lại *'},h('select',{value:keepId,onChange:e=>setKeepId(e.target.value)},h('option',{value:''},'— Chọn NCC giữ lại —'),(nccs||[]).map(x=>h('option',{key:x.id,value:x.id},(x.code?x.code+' · ':'')+x.name)))),
      h(F,{label:'NCC gộp vào / xóa *'},h('select',{value:mergeId,onChange:e=>setMergeId(e.target.value)},h('option',{value:''},'— Chọn NCC cần gộp —'),(nccs||[]).filter(x=>x.id!==keepId).map(x=>h('option',{key:x.id,value:x.id},(x.code?x.code+' · ':'')+x.name)))),
      h(Row,null,h('button',{onClick:()=>setMergeOpen(false)},'Hủy'),h('button',{className:'bp',onClick:mergeSuppliers,style:{padding:'8px 20px'}},h('i',{className:'ti ti-git-merge',style:{fontSize:14}}),'Gộp NCC'))
    )
  );
}

/* --- Đơn mua hàng --- */
function PurchaseTab({purchases,setPurchases,nccs,setNCCs,materials,products,cu,setPage,mode='material'}) {
  const [modal,sm]=useState(null); const [edit,se]=useState(null); const [q,sq]=useState('');
  const [filterDay,setFilterDay]=useState(''); const [filterMonth,setFilterMonth]=useState(''); const [filterNcc,setFilterNcc]=useState('');
  const isGoods=mode==='goods';
  const itemLabel=isGoods?'Hàng hóa':'Nguyên vật liệu';
  const itemLabelLower=isGoods?'hàng hóa':'nguyên vật liệu';
  const orderTitle=isGoods?'Đơn mua hàng hàng hóa':'Đơn mua hàng NVL';
  const itemPrefix=isGoods?'P_':'M_';
  const itemCatalog=isGoods?(products||[]):(materials||[]);
  let seq=purchases.length+1;
  const numMoney=v=>Number(String(v??'').replace(/[^\d-]/g,''))||0;
  const formatQty=v=>{
    const n=Number(v);
    return Number.isFinite(n)?n.toLocaleString('vi-VN',{maximumFractionDigits:6}):'';
  };
  const parseQty=v=>{
    const raw=String(v??'').trim().replace(/\s/g,'').replace(/\./g,'').replace(',','.');
    const n=Number(raw);
    return Number.isFinite(n)?n:0;
  };
  const fmtPurchaseDate=s=>fmtAnyDate(s);
  const emptyLine=()=>({id:uid(),itemId:'',name:'',unit:'',qty:0,price:0,note:''});
  const findPurchaseItem=l=>{
    const rawId=String(l?.itemId||'').trim();
    const name=String(l?.name||'').trim().toLowerCase();
    const rawCode=rawId.replace(/^[MP]_/,'').toLowerCase();
    return itemCatalog.find(m=>{
      const id=String(m.id||'').trim().toLowerCase();
      const code=String(m.code||'').trim().toLowerCase();
      const matName=String(m.name||'').trim().toLowerCase();
      return rawId===(itemPrefix+m.id) || rawCode===id || rawCode===code || (name && (matName===name || code===name));
    })||null;
  };
  const resolveLine=l=>{
    const found=findPurchaseItem(l);
    const name=String(l?.name||'').trim();
    return {...emptyLine(),...l,itemId:found?(itemPrefix+found.id):'',name:found?found.name:name,unit:found?.unit||l?.unit||'',qty:numFmt(l?.qty||0),price:numFmt(l?.price||0)};
  };
  const buildForm=po=>po?{...po,nccId:po.nccId||'',nccName:po.nccName||'',orderDate:toIsoDate(po.orderDate)||isoDate(),lines:(po.lines||[]).length?(po.lines||[]).map(resolveLine):[emptyLine()]}:{nccId:'',nccName:'',orderDate:isoDate(),lines:[emptyLine()]};
  const [form,sf2]=useState(buildForm(null));
  const s2=(k,v)=>sf2(p=>({...p,[k]:v}));
  const setNcc=id=>{const n=nccs.find(x=>x.id===id);sf2(p=>({...p,nccId:id,nccName:n?n.name:''}));};
  const allItems=itemCatalog.map(m=>({id:itemPrefix+m.id,name:m.name||'',unit:m.unit,price:numFmt(m.purchasePrice||m.price||0)})).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'vi'));
  const upd=(id,data)=>sf2(p=>({...p,lines:p.lines.map(l=>l.id===id?data:l)}));
  const addLine=()=>sf2(p=>({...p,lines:[...(p.lines||[]),emptyLine()]}));
  const delLine=id=>sf2(p=>{
    const next=(p.lines||[]).filter(l=>l.id!==id);
    return {...p,lines:next.length?next:[emptyLine()]};
  });
  const openAdd=()=>{se(null);sf2(buildForm(null));sm('f');};
  const openEdit=o=>{se(o);sf2(buildForm(o));sm('f');};
  const syncNccFromPurchases=()=>{
    const seen=new Set();
    const mapped=(purchases||[]).map(p=>({
      id:p.nccId||('NCC'+uid()),
      code:p.nccCode||p.nccId||'',
      name:p.nccName||'',
      taxCode:p.nccTaxCode||'',
      phone:p.nccPhone||'',
      email:p.nccEmail||'',
      contact:p.nccContact||'',
      address:p.nccAddress||'',
      note:p.nccNote||''
    })).filter(x=>x.name&&!seen.has((x.code||x.name).toLowerCase())&&(seen.add((x.code||x.name).toLowerCase()),true));
    if(!mapped.length){window.showToast('Không có NCC mới để cập nhật.','warn');return;}
    setNCCs(prev=>{
      const next=[...prev];
      mapped.forEach(n=>{
        const i=next.findIndex(x=>(n.code&&x.code===n.code)||String(x.name||'').toLowerCase()===String(n.name||'').toLowerCase());
        if(i>=0) next[i]={...next[i],...n,id:next[i].id};
        else next.push({...n,id:n.id||('NCC'+uid())});
      });
      return next;
    });
    window.showToast('Đã cập nhật NCC từ đơn mua','success');
  };
  const importRows=rows=>{
    const mapped=(rows||[]).map(r=>{
      const nccName=r['NCC']||r['Nhà cung cấp']||r['nccName']||r['ncc']||'';
      const itemName=r['Vật tư']||r['Hàng hóa']||r['Sản phẩm']||r['Mặt hàng']||r['itemName']||r['item']||'';
      const itemMatch=itemCatalog.find(m=>String(m.name||'').trim().toLowerCase()===String(itemName||'').trim().toLowerCase()||String(m.code||'').trim().toLowerCase()===String(itemName||'').trim().toLowerCase());
      const qty=numFmt(r['Số lượng']||r['itemQty']||r['qty']||0);
      const price=numMoney(r['Đơn giá']||r['itemPrice']||r['price']||0);
      const total=numMoney(r['Thành tiền']||r['itemTotal']||r['total']||qty*price);
      const orderDate=r['Ngày nhập']||r['Ngày đặt']||r['orderDate']||r['date']||'';
      const statusRaw=String(r['Trạng thái']||r['status']||'').toLowerCase();
      const payRaw=String(r['Thanh toán']||r['paymentStatus']||'').toLowerCase();
      return {
        id:(isGoods?'DMHH':'DM')+uid(),
        status:statusRaw.includes('đã nhận')?'received':statusRaw.includes('đã đặt')?'ordered':statusRaw.includes('hủy')?'cancelled':'draft',
        paymentStatus:payRaw.includes('đã')||payRaw.includes('paid')?'paid':payRaw.includes('một phần')?'partial':'unpaid',
        nccId:(nccs||[]).find(n=>String(n.name||'').toLowerCase()===String(nccName).toLowerCase())?.id||'',
        nccName,
        orderDate,
        deliveryDate:r['Hạn giao']||r['deliveryDate']||'',
        receivedDate:r['Ngày nhận']||r['receivedDate']||'',
        invoiceNo:r['Số hóa đơn']||r['invoiceNo']||'',
        note:r['Ghi chú đơn']||r['note']||'',
        lines:[{id:uid(),itemId:itemMatch?(itemPrefix+itemMatch.id):'',name:itemMatch?itemMatch.name:itemName,unit:r['ĐVT']||r['itemUnit']||itemMatch?.unit||'',qty,price,note:r['Ghi chú dòng']||r['lineNote']||''}],
        createdAt:fmtDT(),
        createdBy:cu.name,
        updatedAt:fmtDT(),
        updatedBy:cu.name
      };
    }).filter(x=>x.nccName||x.lines[0].name||x.orderDate);
    if(!mapped.length){window.showToast('File chưa có dòng đơn mua hợp lệ.','warn');return;}
    setPurchases(prev=>[...mapped,...prev]);
    window.showToast('Đã nhập '+mapped.length+' đơn mua','success');
  };
  const total=(form.lines||[]).reduce((sum,l)=>sum+(numFmt(l.qty)||0)*(numFmt(l.price)||0),0);
  const saveForm=()=>{
    if(!form.nccId){window.showToast('Chọn NCC!','warn');return;}
    const cleanLines=(form.lines||[]).map(l=>({...l,qty:numFmt(l.qty||0),price:numFmt(l.price||0)})).filter(l=>l.itemId&&l.name&&l.qty>0);
    if(!cleanLines.length){window.showToast('Nhập ít nhất 1 dòng '+itemLabelLower+' hợp lệ.','warn');return;}
    const data={...form,orderDate:toIsoDate(form.orderDate)||isoDate(),lines:cleanLines,updatedBy:cu.name,updatedAt:fmtDT()};
    if(edit)setPurchases(p=>p.map(x=>x.id===edit.id?{...x,...data}:x));
    else{
      const id=(isGoods?'DMHH':'DM')+String(seq++).toString().padStart(4,'0');
      setPurchases(p=>[...p,{...data,status:data.status||'draft',id,createdAt:fmtDate(),createdBy:cu.name}]);
    }
    sm(null);se(null);
  };
  const del=id=>{window.scfConfirm('Bạn có chắc muốn xóa đơn mua này?','Xóa đơn mua',true).then(ok=>{if(ok){setPurchases(p=>p.filter(x=>x.id!==id));window.showToast('Đã xóa đơn mua','success');}});};
  const normalizeFilterText=value=>String(value||'').trim().toLowerCase();
  const nccOptions=[...new Set([...(nccs||[]).map(n=>n.name),...(purchases||[]).map(p=>p.nccName)].filter(Boolean))].sort((a,b)=>String(a).localeCompare(String(b),'vi'));
  const list=purchases
    .filter(x=>{
      if(q&&!(String(x.nccName||'').toLowerCase().includes(q.toLowerCase())||String(x.id||'').toLowerCase().includes(q.toLowerCase())||String(x.invoiceNo||'').toLowerCase().includes(q.toLowerCase()))) return false;
      const dateIso=toIsoDate(x.orderDate||x.createdAt||x.updatedAt)||'';
      if(filterDay&&dateIso!==filterDay)return false;
      if(filterMonth&&!dateIso.startsWith(filterMonth))return false;
      if(filterNcc&&normalizeFilterText(x.nccName)!==normalizeFilterText(filterNcc))return false;
      return true;
    })
    .slice()
    .sort((a,b)=>{
      const da=parseAnyDate(a.orderDate||a.createdAt||a.updatedAt);
      const db=parseAnyDate(b.orderDate||b.createdAt||b.updatedAt);
      const ta=da?da.getTime():0;
      const tb=db?db.getTime():0;
      if(tb!==ta) return tb-ta;
      return String(b.id||'').localeCompare(String(a.id||''),'vi',{numeric:true});
    });
  const exportRows=list.flatMap(p=>(p.lines||[]).map(l=>({...p,itemName:l.name,itemUnit:l.unit,itemQty:l.qty,itemPrice:l.price,itemTotal:(l.qty||0)*(l.price||0)})));
  const tableRows=list.flatMap(o=>(o.lines&&o.lines.length?o.lines:[emptyLine()]).map((line,idx)=>({
    rowKey:o.id+'_'+(line.id||idx),
    id:o.id,
    orderDate:o.orderDate,
    nccName:o.nccName,
    lineName:line.name||'—',
    lineQty:line.qty??0,
    linePrice:line.price||0,
    lineTotal:(Number(line.qty)||0)*(Number(line.price)||0),
    isFirst:idx===0,
    rowCount:(o.lines||[]).length||1,
    source:o
  })));
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti '+(isGoods?'ti-packages':'ti-shopping-cart'),style:{fontSize:20}}),orderTitle),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Hiển thị đơn mới lên trên, có thể xem nhanh trên điện thoại theo từng thẻ.'),
      h('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},
        h('button',{onClick:()=>setPage(isGoods?'nccgoods':'nccs'),style:{fontSize:12,padding:'6px 12px'}},h('i',{className:'ti ti-building-store',style:{fontSize:14}}),isGoods?'Nhà CC Hàng hóa':'Nhà CC NVL'),
        h('button',{onClick:syncNccFromPurchases,style:{fontSize:12,padding:'6px 12px'}},h('i',{className:'ti ti-refresh',style:{fontSize:14}}),'Cập nhật NCC'),
        h(ImportBtn,{onFile:importRows}),
        h(ExportBtn,{onClick:()=>xlsxExport(exportRows,[['orderDate','Ngày nhập'],['nccName','NCC'],['itemName',itemLabel],['itemQty','Số lượng'],['itemPrice','Đơn giá'],['itemTotal','Thành tiền']],isGoods?'Don_mua_hang_hang_hoa':'Don_mua_hang_NVL')}),
        h(AddBtn,{onClick:openAdd,label:'Tạo đơn mua'})
      ),
      h('div',{style:{fontSize:12,color:'var(--tx2)',fontWeight:500}},'Hiển thị: '+list.length+' đơn')
    ),
    h('div',{className:'card',style:{marginBottom:'1rem',padding:'12px 14px'}},
      h('div',{className:'responsive-filter-grid',style:{gridTemplateColumns:'1.35fr repeat(3,minmax(150px,1fr)) auto'}},
        h(F,{label:'Tìm nhanh'},h(SearchBar,{value:q,onChange:sq,placeholder:'Mã đơn, NCC, hóa đơn...'})),
        h(F,{label:'Theo ngày'},h('input',{type:'date',value:filterDay,onChange:e=>{setFilterDay(e.target.value);if(e.target.value)setFilterMonth('');}})),
        h(F,{label:'Theo tháng'},h('input',{type:'month',value:filterMonth,onChange:e=>{setFilterMonth(e.target.value);if(e.target.value)setFilterDay('');}})),
        h(F,{label:'Nhà cung cấp'},h('select',{value:filterNcc,onChange:e=>setFilterNcc(e.target.value)},h('option',{value:''},'Tất cả NCC'),nccOptions.map(name=>h('option',{key:name,value:name},name)))),
        h('button',{type:'button',onClick:()=>{sq('');setFilterDay('');setFilterMonth('');setFilterNcc('');},style:{height:38,alignSelf:'end'}},h('i',{className:'ti ti-filter-off',style:{fontSize:14}}),'Xóa lọc')
      )
    ),
    h('div',{className:'mobile-only mobile-card-list'},
      list.length?list.map(o=>{
        const lines=(o.lines&&o.lines.length?o.lines:[emptyLine()]);
        const totalAmount=lines.reduce((s,l)=>s+((Number(l.qty)||0)*(Number(l.price)||0)),0);
        return h('div',{key:'m_'+o.id,className:'mobile-data-card'},
          h('div',{className:'mobile-data-head'},
            h('div',null,
              h('div',{className:'mobile-data-title'},o.nccName||'—'),
              h('div',{className:'mobile-data-sub'},o.id||'—')
            ),
            h('div',{className:'mobile-data-sub'},fmtPurchaseDate(o.orderDate))
          ),
          h('div',{className:'mobile-data-grid'},
            h('div',{className:'mobile-data-item'},h('b',null,'Số dòng '+(isGoods?'hàng hóa':'NVL')),h('span',null,String(lines.length))),
            h('div',{className:'mobile-data-item'},h('b',null,'Tổng tiền'),h('span',null,totalAmount.toLocaleString('vi-VN')+'đ'))
          ),
          h('div',{style:{display:'grid',gap:6}},
            lines.map((line,idx)=>h('div',{key:o.id+'_'+(line.id||idx),style:{padding:'8px 10px',border:'1px solid var(--bd)',borderRadius:10,background:'#fff'}},
              h('div',{style:{fontWeight:600,fontSize:13}},line.name||'—'),
              h('div',{className:'mobile-data-sub'},'SL: '+((Number(line.qty)||0).toLocaleString('vi-VN'))+' | Đơn giá: '+((Number(line.price)||0).toLocaleString('vi-VN'))+'đ')
            ))
          ),
          h('div',{className:'mobile-data-actions'},
            h('button',{className:'bi',onClick:()=>openEdit(o)},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
            h('button',{className:'bi',onClick:()=>del(o.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
          )
        );
      }):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có đơn mua hàng nào.')
    ),
    h('div',{className:'tw desktop-only',style:{maxHeight:'calc(100vh - 250px)',overflow:'auto'}},h('table',null,
      h('thead',null,h('tr',null,...['Ngày nhập','NCC',itemLabel,'Số lượng','Đơn giá','Thành tiền',''].map(c=>h('th',{key:c,style:{position:'sticky',top:0,zIndex:3,background:'var(--bg2)',boxShadow:'0 1px 0 var(--bd)'}},c)))),
      h('tbody',null,tableRows.length?tableRows.map(r=>h('tr',{key:r.rowKey},
        r.isFirst&&h('td',{rowSpan:r.rowCount},fmtPurchaseDate(r.orderDate)),
        r.isFirst&&h('td',{rowSpan:r.rowCount},h('div',{style:{fontWeight:500}},r.nccName||'—')),
        h('td',null,r.lineName),
        h('td',null,(Number(r.lineQty)||0).toLocaleString('vi-VN')),
        h('td',null,(Number(r.linePrice)||0).toLocaleString('vi-VN')+'đ'),
        h('td',null,h('span',{style:{fontWeight:500,color:'var(--pri)'}},r.lineTotal.toLocaleString('vi-VN')+'đ')),
        r.isFirst&&h('td',{rowSpan:r.rowCount},h('div',{style:{display:'flex',gap:2}},
          h('button',{className:'bi',onClick:()=>openEdit(r.source)},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
          h('button',{className:'bi',onClick:()=>del(r.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
        ))
      )):h('tr',null,h('td',{colSpan:7,className:'empty-st'},'Chưa có đơn mua hàng nào.')))
    )),
    modal==='f'&&h(Modal,{title:edit?'Sửa '+orderTitle:'Tạo '+orderTitle.toLowerCase(),lg:true,onClose:()=>{sm(null);se(null);}},
      h('div',{className:'g2'},
        h(F,{label:'Nhà cung cấp *'},h('select',{value:form.nccId,onChange:e=>setNcc(e.target.value)},h('option',{value:''},'— Chọn NCC —'),nccs.map(n=>h('option',{key:n.id,value:n.id},n.name)))),
        h(F,{label:'Ngày nhập'},h('input',{type:'date',value:toIsoDate(form.orderDate),onChange:e=>s2('orderDate',e.target.value)}))
      ),
      h('hr',{className:'divider'}),
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}},
        h('div',{style:{fontWeight:500,fontSize:13,color:'var(--pri3)'}},'Chi tiết '+itemLabelLower),
        total>0&&h('div',{style:{fontWeight:600,color:'var(--pri)',fontSize:14}},'Tổng: '+total.toLocaleString('vi-VN')+'đ')
      ),
      h('div',{className:'po-line-head'},[itemLabel,'Số lượng','Đơn giá','Thành tiền',''].map(c=>h('span',{key:c,style:{fontSize:11,color:'var(--tx2)',fontWeight:500}},c))),
      h('div',null,(form.lines||[]).map((line,idx)=>{
        const lineTotal=(numFmt(line.qty)||0)*(numFmt(line.price)||0);
        return h('div',{key:line.id,className:'po-line-row'},
          h('select',{value:line.itemId,onChange:e=>{const it=allItems.find(x=>x.id===e.target.value)||{};upd(line.id,{...line,itemId:e.target.value,name:it.name||'',unit:it.unit||'',price:it.price||0});},style:{fontSize:13},title:itemLabel},h('option',{value:''},'— Chọn '+itemLabelLower+' —'),allItems.map(it=>h('option',{key:it.id,value:it.id},it.name))),
          h('input',{type:'text',inputMode:'decimal',value:formatQty(line.qty),onChange:e=>upd(line.id,{...line,qty:parseQty(e.target.value)}),style:{fontSize:13},placeholder:'Số lượng',title:'Số lượng'}),
          h(NumInput,{value:line.price,onChange:v=>upd(line.id,{...line,price:v}),style:{fontSize:13},placeholder:'Đơn giá',title:'Đơn giá'}),
          h('input',{value:lineTotal.toLocaleString('vi-VN'),readOnly:true,style:{fontSize:13,background:'var(--bg2)',cursor:'default',fontWeight:600},placeholder:'Thành tiền',title:'Thành tiền'}),
          h('div',{style:{display:'flex',justifyContent:'center'}},
            h('button',{className:idx===0?'bp':'bdel',type:'button',onClick:()=>idx===0?addLine():delLine(line.id),style:idx===0?{padding:'7px 10px'}:{}},
              h('i',{className:'ti '+(idx===0?'ti-plus':'ti-trash'),style:{fontSize:14}}),
              idx===0?'Thêm':''
            )
          )
        );
      })),
      h('div',{style:{fontSize:12,color:'var(--tx2)',marginBottom:8}},'Một đơn có thể có nhiều dòng '+itemLabelLower+'.'),
      h(Row,null,h('button',{onClick:()=>{sm(null);se(null);}},'Hủy'),h('button',{className:'bp',onClick:saveForm,style:{padding:'8px 20px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu đơn mua'))
    )
  );
}

/* --- Đơn mua xăng dầu --- */
function FuelPurchaseTab({rows,setRows,employees,assets,currentUser}) {
  const [modal,setModal]=useState(false);
  const [edit,setEdit]=useState(null);
  const [q,sq]=useState('');
  const [df,sdf]=useState('');
  const [dt,sdt]=useState('');
  const [buyerFilter,setBuyerFilter]=useState('');
  const [vehicleFilter,setVehicleFilter]=useState('');
  const [uploading,setUploading]=useState('');
  const [quickCaptureStep,setQuickCaptureStep]=useState('meter');
  const normalizeText=s=>String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const normalizeVehicleKey=s=>String(s||'').toUpperCase().replace(/[^0-9A-Z]/g,'');
  const deptKey=normalizeText(currentUser?.dept);
  const isAccounting=deptKey==='ke toan';
  const canManage=currentUser?.role==='admin'||currentUser?.role==='manager'||isAccounting;
  const isDriver=currentUser?.role==='driver';
  const selfOption=currentUser?{id:currentUser.id,name:currentUser.name||currentUser.id,label:(currentUser.name||currentUser.id)+(currentUser.id?' - '+currentUser.id:'')}:null;
  const driverOptions=(employees||[])
    .filter(e=>e.role==='driver'||normalizeText(e.dept)==='lai xe')
    .map(e=>({id:e.id,name:e.name||e.id,label:(e.name||e.id)+(e.id?' - '+e.id:'')}))
    .sort((a,b)=>a.label.localeCompare(b.label,'vi'));
  const buyerOptions=(selfOption?[selfOption,...driverOptions.filter(d=>d.id!==selfOption.id)]:driverOptions);
  const vehicleOptions=[...new Set([
    ...(assets||[])
      .map(a=>String(a.name||a.code||a.id||'').trim())
      .filter(Boolean)
      .filter(name=>{
        const t=normalizeText(name);
        const looksLikeVehicle=/^\d{4,6}$/.test(name)||t.includes('xe')||/\b\d{2}[a-z]-?\d{3,5}\b/i.test(name);
        const looksLikeMachine=t.startsWith('may ')||t.includes('máy')||t.includes('may')||t.includes('bom')||t.includes('bơm')||t.includes('inox');
        return looksLikeVehicle&&!looksLikeMachine;
      }),
    ...((rows||[]).map(r=>String(r.vehicle||'').trim()).filter(Boolean))
  ])].sort((a,b)=>a.localeCompare(b,'vi'));
  const blankForm=buyerId=>{
    const d=buyerOptions.find(x=>x.id===buyerId);
    return {
      buyerId:buyerId||'',
      buyerName:d?.name||'',
      date:isoDate(),
      vehicle:'',
      liters:0,
      price:0,
      amount:0,
      plateImage:'',
      plateImageName:'',
      meterImage:'',
      meterImageName:'',
      image:'',
      imageName:'',
      note:''
    };
  };
  const defaultBuyerId=(isDriver&&currentUser?.id)||selfOption?.id||'';
  const [form,setForm]=useState(blankForm(defaultBuyerId));
  const setF=(k,v)=>setForm(p=>{
    const next={...p,[k]:v};
    next.amount=numFmt(next.liters||0)*numFmt(next.price||0);
    return next;
  });
  const openAdd=()=>{
    setEdit(null);
    setForm(blankForm(defaultBuyerId));
    setQuickCaptureStep('meter');
    setModal(true);
  };
  const openEdit=row=>{
    setEdit(row);
    setQuickCaptureStep(!row.meterImage?'meter':!row.plateImage?'plate':'meter');
    setForm({
      buyerId:row.buyerId||'',
      buyerName:row.buyerName||'',
      date:toIsoDate(row.date)||isoDate(),
      vehicle:row.vehicle||'',
      liters:numFmt(row.liters||0),
      price:numFmt(row.price||0),
      amount:numFmt(row.amount||0),
      plateImage:row.plateImage||'',
      plateImageName:row.plateImageName||'',
      meterImage:row.meterImage||row.image||'',
      meterImageName:row.meterImageName||row.imageName||'',
      image:row.image||'',
      imageName:row.imageName||'',
      note:row.note||''
    });
    setModal(true);
  };
  const isOwn=row=>!isDriver||row.buyerId===currentUser.id||String(row.buyerName||'').trim().toLowerCase()===String(currentUser.name||'').trim().toLowerCase();
  const canEditRow=row=>canManage||(isDriver&&isOwn(row));
  const canDeleteRow=row=>canManage;
  const busyPlate=uploading==='plate';
  const busyMeter=uploading==='meter';
  const countImages=row=>((row.plateImage?1:0)+(row.meterImage?1:0)+((!row.plateImage&&!row.meterImage&&row.image)?1:0));
  const renderImageActions=row=>{
    const items=[];
    if(row.plateImage)items.push(h('button',{key:'plate',className:'bi',title:'Xem ảnh biển số',onClick:()=>window.open(row.plateImage,'_blank')},h('i',{className:'ti ti-id',style:{fontSize:15,color:'var(--pri)'}})));
    if(row.meterImage)items.push(h('button',{key:'meter',className:'bi',title:'Xem ảnh cây xăng',onClick:()=>window.open(row.meterImage,'_blank')},h('i',{className:'ti ti-gas-station',style:{fontSize:15,color:'var(--pri)'}})));
    if(!items.length&&row.image)items.push(h('button',{key:'legacy',className:'bi',title:'Xem ảnh',onClick:()=>window.open(row.image,'_blank')},h('i',{className:'ti ti-photo',style:{fontSize:15,color:'var(--pri)'}})));
    return items.length?h('div',{style:{display:'flex',gap:4,flexWrap:'wrap'}},items):'—';
  };
  const formatPlateCandidate=raw=>{
    const clean=normalizeVehicleKey(raw);
    const m1=clean.match(/^(\d{2})([A-Z]{1,2})(\d{3})(\d{2,3})$/);
    if(m1)return `${m1[1]}${m1[2]}-${m1[3]}.${m1[4]}`;
    const m2=clean.match(/^(\d{2})([A-Z]{1,2})(\d{4,5})$/);
    if(m2)return `${m2[1]}${m2[2]}-${m2[3]}`;
    return clean;
  };
  const extractPlateFromText=text=>{
    const source=String(text||'').toUpperCase().replace(/[–—]/g,'-');
    const compact=normalizeVehicleKey(source);
    const exactVehicle=[...vehicleOptions]
      .sort((a,b)=>normalizeVehicleKey(b).length-normalizeVehicleKey(a).length)
      .find(v=>compact.includes(normalizeVehicleKey(v)));
    if(exactVehicle)return exactVehicle;
    const rawCandidates=[
      ...(source.match(/\d{2}[A-Z]{1,2}-?\d{3}\.?\d{2,3}/g)||[]),
      ...(source.match(/\d{2}[A-Z]{1,2}-?\d{4,5}/g)||[]),
      ...(compact.match(/\d{2}[A-Z]{1,2}\d{4,6}/g)||[])
    ].map(formatPlateCandidate).filter(Boolean);
    return [...new Set(rawCandidates)].sort((a,b)=>normalizeVehicleKey(b).length-normalizeVehicleKey(a).length)[0]||'';
  };
  const parseOcrVolume=token=>{
    const cleaned=String(token||'').replace(/[^\d.,]/g,'');
    if(!cleaned)return 0;
    const lastSep=Math.max(cleaned.lastIndexOf('.'),cleaned.lastIndexOf(','));
    if(lastSep>=0){
      const before=cleaned.slice(0,lastSep).replace(/[.,]/g,'');
      const after=cleaned.slice(lastSep+1).replace(/[.,]/g,'');
      if(after.length>0&&after.length<=3&&before.length<=3)return Number(`${before}.${after}`)||0;
    }
    return Number(cleaned.replace(/[.,]/g,''))||0;
  };
  const parseOcrMoney=token=>Number(String(token||'').replace(/\D/g,''))||0;
  const extractFuelDataFromText=text=>{
    const lines=String(text||'').split(/\n+/).map(raw=>({raw:String(raw||'').trim(),norm:normalizeText(raw)})).filter(x=>x.raw);
    let liters=0, price=0, amount=0;
    lines.forEach(line=>{
      const tokens=line.raw.match(/\d[\d.,]*/g)||[];
      if(!tokens.length)return;
      const volumeVals=tokens.map(parseOcrVolume).filter(v=>v>0&&v<300);
      const moneyVals=tokens.map(parseOcrMoney).filter(v=>v>=1000);
      if(!liters&&/(so lit|so l|lit|litre|xang)/.test(line.norm)&&volumeVals.length)liters=volumeVals.find(v=>/[.,]/.test(tokens[volumeVals.indexOf(v)]))||volumeVals[0];
      if(!price&&/(don gia|dg|gia\/l|vnd\/l|gia tien|price)/.test(line.norm)&&moneyVals.length)price=moneyVals.sort((a,b)=>a-b)[0];
      if(!amount&&/(thanh tien|tong tien|so tien|phai tra|amount|total)/.test(line.norm)&&moneyVals.length)amount=moneyVals.sort((a,b)=>b-a)[0];
    });
    const allTokens=String(text||'').match(/\d[\d.,]*/g)||[];
    const fallbackVolumes=allTokens.map(token=>({raw:token,val:parseOcrVolume(token)})).filter(x=>x.val>0&&x.val<300).sort((a,b)=>a.val-b.val);
    const fallbackMoney=allTokens.map(parseOcrMoney).filter(v=>v>=1000).sort((a,b)=>a-b);
    if(!liters&&fallbackVolumes.length)liters=(fallbackVolumes.find(x=>/[.,]/.test(x.raw))||fallbackVolumes[0]).val;
    if(!price&&fallbackMoney.length)price=fallbackMoney[0];
    if(!amount&&fallbackMoney.length>1)amount=fallbackMoney[fallbackMoney.length-1];
    if(liters&&amount&&!price)price=Math.round(amount/liters);
    if(price&&amount&&!liters)liters=Math.round((amount/price)*100)/100;
    if(liters&&price&&!amount)amount=Math.round(liters*price);
    return {
      liters:liters?Math.round(liters*100)/100:0,
      price:price||0,
      amount:amount||0
    };
  };
  const recognizeTextFromImage=async file=>{
    if(!window.Tesseract)await window.scfLoadExternalScript('tesseract');
    const img=await resizeImageFile(file,1800,.9);
    const res=await Tesseract.recognize(img.dataUrl,'vie+eng');
    return String(res?.data?.text||'');
  };
  const inRange=dateValue=>{
    const d=parseAnyDate(dateValue);
    if(!d) return !df&&!dt;
    const from=df?parseAnyDate(df):null;
    const to=dt?parseAnyDate(dt):null;
    if(from&&d<from) return false;
    if(to&&d>to) return false;
    return true;
  };
  const visible=(rows||[])
    .filter(r=>(canManage||isOwn(r))
      && inRange(r.date||r.createdAt||r.updatedAt)
      && (!buyerFilter||String(r.buyerId||'')===String(buyerFilter))
      && (!vehicleFilter||String(r.vehicle||'')===String(vehicleFilter))
      && (!q||[r.date,r.vehicle,r.buyerName,r.note,r.imageName,r.plateImageName,r.meterImageName].join(' ').toLowerCase().includes(q.toLowerCase())))
    .slice()
    .sort((a,b)=>{
      const da=parseAnyDate(a.date||a.createdAt||a.updatedAt);
      const db=parseAnyDate(b.date||b.createdAt||b.updatedAt);
      const ta=da?da.getTime():0;
      const tb=db?db.getTime():0;
      if(tb!==ta) return tb-ta;
      return String(b.id||'').localeCompare(String(a.id||''),'vi',{numeric:true});
    });
  const save=()=>{
    if(!form.date||!form.vehicle||numFmt(form.liters)<=0||numFmt(form.price)<=0){
      window.showToast('Nhập ngày mua, xe, số lít và giá tiền.','warn');
      return;
    }
    const buyerId=edit?.buyerId||currentUser.id||form.buyerId||'';
    const buyerName=edit?.buyerName||currentUser.name||form.buyerName||'';
    const data={
      ...form,
      buyerId,
      buyerName,
      date:toIsoDate(form.date)||isoDate(),
      liters:numFmt(form.liters||0),
      price:numFmt(form.price||0),
      amount:numFmt(form.liters||0)*numFmt(form.price||0),
      image:form.meterImage||form.plateImage||form.image||'',
      imageName:form.meterImageName||form.plateImageName||form.imageName||'',
      updatedAt:fmtDT(),
      updatedBy:currentUser.name
    };
    if(edit){
      setRows(prev=>prev.map(x=>x.id===edit.id?{...x,...data}:x));
      window.showToast('Đã cập nhật đơn mua xăng dầu','success');
    }else{
      setRows(prev=>[{
        ...data,
        id:'XD'+uid(),
        createdAt:fmtDT(),
        createdBy:currentUser.name
      },...prev]);
      window.showToast('Đã thêm đơn mua xăng dầu','success');
    }
    setModal(false);
    setEdit(null);
  };
  const del=id=>{
    window.scfConfirm('Bạn có chắc muốn xóa đơn mua xăng dầu này?','Xóa đơn',true).then(ok=>{
      if(ok){
        setRows(prev=>prev.filter(x=>x.id!==id));
        window.showToast('Đã xóa đơn mua xăng dầu','success');
      }
    });
  };
  const pickPlateImage=async file=>{
    if(!file)return;
    try{
      setUploading('plate');
      const url=await uploadPhoto(file,'fuel-purchases/plates/'+(edit?.id||'new'));
      setForm(p=>({...p,plateImage:url,plateImageName:file.name||'anh-bien-so.jpg'}));
      try{
        const text=await recognizeTextFromImage(file);
        const vehicle=extractPlateFromText(text);
        if(vehicle){
          setForm(p=>({...p,plateImage:url,plateImageName:file.name||'anh-bien-so.jpg',vehicle}));
          window.showToast('Đã nhận diện biển số xe: '+vehicle,'success');
        }else{
          window.showToast('Đã lưu ảnh biển số nhưng chưa đọc rõ biển số. Có thể nhập tay nếu cần.','warn');
        }
      }catch(e){
        window.showToast(e.message||'Đã lưu ảnh biển số nhưng chưa đọc được chữ trong ảnh.','warn');
      }
      return true;
    }catch(e){
      window.showToast('Chưa tải được ảnh biển số.','error');
      return false;
    }finally{
      setUploading('');
    }
  };
  const pickMeterImage=async file=>{
    if(!file)return;
    try{
      setUploading('meter');
      const url=await uploadPhoto(file,'fuel-purchases/meters/'+(edit?.id||'new'));
      setForm(p=>({...p,meterImage:url,meterImageName:file.name||'anh-cay-xang.jpg',image:url,imageName:file.name||'anh-cay-xang.jpg'}));
      try{
        const text=await recognizeTextFromImage(file);
        const parsed=extractFuelDataFromText(text);
        const filled=[];
        setForm(p=>{
          const next={...p,meterImage:url,meterImageName:file.name||'anh-cay-xang.jpg',image:url,imageName:file.name||'anh-cay-xang.jpg'};
          let liters=parsed.liters||numFmt(next.liters||0);
          let price=parsed.price||numFmt(next.price||0);
          let amount=parsed.amount||numFmt(next.amount||0);
          if(liters&&amount&&!price)price=Math.round(amount/liters);
          if(price&&amount&&!liters)liters=Math.round((amount/price)*100)/100;
          if(liters){next.liters=liters;filled.push('số lít');}
          if(price){next.price=price;filled.push('giá tiền');}
          next.amount=amount||Math.round((numFmt(next.liters||0)||0)*(numFmt(next.price||0)||0));
          if(next.amount)filled.push('thành tiền');
          return next;
        });
        if(filled.length)window.showToast('Đã đọc ảnh cây xăng và điền '+[...new Set(filled)].join(', ')+'.','success');
        else window.showToast('Đã lưu ảnh cây xăng nhưng chưa đọc rõ số liệu. Có thể nhập tay nếu cần.','warn');
      }catch(e){
        window.showToast(e.message||'Đã lưu ảnh cây xăng nhưng chưa OCR được số liệu.','warn');
      }
      return true;
    }catch(e){
      window.showToast('Chưa tải được ảnh cây xăng.','error');
      return false;
    }finally{
      setUploading('');
    }
  };
  const captureBothFuelImages=()=>{
    if(uploading)return;
    const step=quickCaptureStep;
    const input=document.createElement('input');
    input.type='file';
    input.accept='image/*';
    input.setAttribute('capture','environment');
    input.style.display='none';
    document.body.appendChild(input);
    const cleanup=()=>setTimeout(()=>input.remove(),0);
    input.addEventListener('change',async()=>{
      const file=input.files?.[0]||null;
      cleanup();
      if(!file)return;
      if(step==='meter'){
        const ok=await pickMeterImage(file);
        if(ok){
          setQuickCaptureStep('plate');
          window.showToast('Đã lưu ảnh cây xăng. Bấm “Chụp biển số” để chụp tiếp.','success');
        }
      }else{
        const ok=await pickPlateImage(file);
        if(ok){
          setQuickCaptureStep('meter');
          window.showToast('Đã chụp đủ 2 ảnh cho đơn xăng dầu.','success');
        }
      }
    },{once:true});
    input.addEventListener('cancel',cleanup,{once:true});
    input.click();
  };
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-gas-station',style:{fontSize:20}}),'Đơn mua xăng dầu'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Lọc theo ngày, người đổ và xe để xem nhanh trên điện thoại.'),
      h('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},
        h(ExportBtn,{onClick:()=>xlsxExport(visible.map(r=>({...r,image:r.meterImage||r.plateImage||r.image||''})),[['date','Ngày mua'],['buyerName','Người đổ'],['vehicle','Xe'],['liters','Số lít'],['price','Giá tiền'],['amount','Thành tiền'],['note','Chú ý'],['plateImage','Ảnh biển số'],['meterImage','Ảnh cây xăng'],['image','Ảnh chính']],'Don_mua_xang_dau')}),
        h(AddBtn,{onClick:openAdd,label:'Thêm đơn mua xăng dầu'})
      )
    ),
    h('div',{className:'card',style:{marginBottom:'1rem',padding:'12px 14px'}},
      h('div',{className:'responsive-filter-grid'},
        h(F,{label:'Tìm nhanh'},
          h(SearchBar,{value:q,onChange:sq,placeholder:'Tên, xe, ghi chú...'})
        ),
        h(F,{label:'Từ ngày'},
          h('input',{type:'date',value:df,onChange:e=>sdf(e.target.value)})
        ),
        h(F,{label:'Đến ngày'},
          h('input',{type:'date',value:dt,onChange:e=>sdt(e.target.value)})
        ),
        h(F,{label:'Người đổ'},
          h('select',{value:buyerFilter,onChange:e=>setBuyerFilter(e.target.value)},
            h('option',{value:''},'Tất cả'),
            ...buyerOptions.map(b=>h('option',{key:b.id,value:b.id},b.name||b.label))
          )
        ),
        h(F,{label:'Xe'},
          h('select',{value:vehicleFilter,onChange:e=>setVehicleFilter(e.target.value)},
            h('option',{value:''},'Tất cả'),
            ...vehicleOptions.map(v=>h('option',{key:v,value:v},v))
          )
        ),
        h('div',{style:{display:'flex',alignItems:'flex-end'}},
          h('button',{'data-scf-action':'view',
            type:'button',
            onClick:()=>{sq('');sdf('');sdt('');setBuyerFilter('');setVehicleFilter('');}
          },h('i',{className:'ti ti-filter-off',style:{fontSize:14}}),'Xóa lọc')
        )
      )
    ),
    h('div',{className:'mobile-only fuel-mobile-list'},
      visible.length?visible.map(r=>h('div',{key:'m_'+r.id,className:'fuel-mobile-card'},
        h('div',{className:'fuel-mobile-card-head'},
          h('div',null,
            h('div',{className:'fuel-mobile-card-title'},r.vehicle||'—'),
            h('div',{style:{fontSize:13,fontWeight:600,color:'var(--pri)'}},r.buyerName||'—')
          ),
          h('div',{className:'fuel-mobile-card-date'},fmtAnyDate(r.date)||'—')
        ),
        h('div',{className:'fuel-mobile-meta'},
          h('div',{className:'fuel-mobile-meta-item'},h('b',null,'Số lít'),h('span',null,numFmt(r.liters||0)||'—')),
          h('div',{className:'fuel-mobile-meta-item'},h('b',null,'Giá tiền'),h('span',null,numFmt(r.price||0)?Number(r.price).toLocaleString('vi-VN'):'—')),
          h('div',{className:'fuel-mobile-meta-item'},h('b',null,'Thành tiền'),h('span',null,numFmt(r.amount||0)?Number(r.amount).toLocaleString('vi-VN'):'—')),
          h('div',{className:'fuel-mobile-meta-item'},h('b',null,'Ảnh'),h('span',null,countImages(r)?(countImages(r)+' ảnh'):'Chưa có ảnh'))
        ),
        r.note&&h('div',{className:'fuel-mobile-note'},r.note),
        h('div',{className:'fuel-mobile-actions'},
          (()=>{const imgs=renderImageActions(r);return imgs==='—'?null:imgs;})(),
          canEditRow(r)&&h('button',{className:'bi',onClick:()=>openEdit(r)},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
          canDeleteRow(r)&&h('button',{className:'bi',onClick:()=>del(r.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
        )
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có đơn mua xăng dầu nào.')
    ),
    h('div',{className:'tw desktop-only'},h('table',null,
      h('thead',null,h('tr',null,...['Ngày mua','Người đổ','Xe','Số lít','Giá tiền','Thành tiền','Ảnh','Chú ý',''].map(c=>h('th',{key:c},c)))),
      h('tbody',null,visible.length?visible.map(r=>h('tr',{key:r.id},
        h('td',null,fmtAnyDate(r.date)||'—'),
        h('td',null,h('div',{style:{fontWeight:600}},r.buyerName||'—')),
        h('td',null,r.vehicle||'—'),
        h('td',null,numFmt(r.liters||0)||'—'),
        h('td',null,numFmt(r.price||0)?Number(r.price).toLocaleString('vi-VN'):'—'),
        h('td',null,h('span',{style:{fontWeight:600,color:'var(--pri)'}},numFmt(r.amount||0)?Number(r.amount).toLocaleString('vi-VN'):'—')),
        h('td',null,renderImageActions(r)),
        h('td',null,r.note?h('span',{className:'badge',style:{background:'#FFF3CD',color:'#8A5A00',maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},r.note):'—'),
        h('td',null,h('div',{style:{display:'flex',gap:2}},
          canEditRow(r)&&h('button',{className:'bi',onClick:()=>openEdit(r)},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
          canDeleteRow(r)&&h('button',{className:'bi',onClick:()=>del(r.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
        ))
      )):h('tr',null,h('td',{colSpan:9,className:'empty-st'},'Chưa có đơn mua xăng dầu nào.')))
    )),
    modal&&h(Modal,{title:edit?'Sửa đơn mua xăng dầu':'Thêm đơn mua xăng dầu',onClose:()=>{setModal(false);setEdit(null);}},
      h('div',{className:'g2'},
        h(F,{label:'Người đổ *'},h('input',{value:edit?(form.buyerName||currentUser.name||''):(currentUser.name||''),readOnly:true,style:{background:'var(--bg2)'}})),
        h(F,{label:'Ngày mua *'},h('input',{type:'date',value:toIsoDate(form.date),onChange:e=>setF('date',e.target.value)}))
      ),
      h('div',{className:'g2'},
        h(F,{label:'Xe / biển số *'},
          h('div',null,
            h('input',{value:form.vehicle,onChange:e=>setF('vehicle',e.target.value.toUpperCase()),list:'fuel-vehicle-options',placeholder:'Nhập hoặc OCR biển số xe...',style:{fontSize:13}}),
            h('datalist',{id:'fuel-vehicle-options'},vehicleOptions.map(v=>h('option',{key:v,value:v},v)))
          )
        ),
        h(F,{label:'Ảnh biển số'},
          h('div',{style:{display:'grid',gap:8}},
            h('div',{style:{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}},
              form.plateImage&&h('button',{type:'button',onClick:()=>window.open(form.plateImage,'_blank'),style:{fontSize:12,padding:'6px 12px'}},h('i',{className:'ti ti-photo',style:{fontSize:14}}),'Xem ảnh'),
              h('button',{type:'button',disabled:!!uploading,onClick:captureBothFuelImages,style:{fontSize:12,padding:'6px 12px',background:quickCaptureStep==='plate'?'#EAF3DE':'#fff',color:quickCaptureStep==='plate'?'#27500A':'inherit'}},
                h('i',{className:'ti '+(uploading?'ti-loader-2 spin':quickCaptureStep==='meter'?'ti-gas-station':'ti-id'),style:{fontSize:14}}),
                uploading?'Đang xử lý ảnh...':quickCaptureStep==='meter'?'Chụp Cây Xăng':'Chụp biển số'
              ),
              h('label',{style:{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',border:'1px solid var(--bd)',borderRadius:'var(--r)',cursor:busyPlate?'wait':'pointer',background:'#fff'}},
                h('i',{className:'ti '+(busyPlate?'ti-loader-2 spin':'ti-id'),style:{fontSize:14}}),
                busyPlate?'Đang đọc biển số...':'Chụp biển số',
                h('input',{type:'file',accept:'image/*',capture:'environment',style:{display:'none'},disabled:!!uploading,onChange:e=>pickPlateImage(e.target.files?.[0])})
              )
            ),
            form.plateImageName&&h('span',{style:{fontSize:12,color:'var(--tx2)'}},form.plateImageName)
          )
        )
      ),
      h(F,{label:'Ảnh cây xăng'},
        h('div',{style:{display:'grid',gap:8}},
          h('div',{style:{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}},
            (form.meterImage||form.image)&&h('button',{type:'button',onClick:()=>window.open(form.meterImage||form.image,'_blank'),style:{fontSize:12,padding:'6px 12px'}},h('i',{className:'ti ti-photo',style:{fontSize:14}}),'Xem ảnh'),
            h('label',{style:{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',border:'1px solid var(--bd)',borderRadius:'var(--r)',cursor:busyMeter?'wait':'pointer',background:'#fff'}},
              h('i',{className:'ti '+(busyMeter?'ti-loader-2 spin':'ti-gas-station'),style:{fontSize:14}}),
              busyMeter?'Đang đọc cây xăng...':'Chụp cây xăng',
              h('input',{type:'file',accept:'image/*',capture:'environment',style:{display:'none'},disabled:!!uploading,onChange:e=>pickMeterImage(e.target.files?.[0])})
            ),
            h('label',{style:{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',border:'1px solid var(--bd)',borderRadius:'var(--r)',cursor:busyMeter?'wait':'pointer',background:'#fff'}},
              h('i',{className:'ti '+(busyMeter?'ti-loader-2 spin':'ti-camera-plus'),style:{fontSize:14}}),
              busyMeter?'Đang tải ảnh...':'Chọn ảnh cũ',
              h('input',{type:'file',accept:'image/*',style:{display:'none'},disabled:!!uploading,onChange:e=>pickMeterImage(e.target.files?.[0])})
            )
          ),
          (form.meterImageName||form.imageName)&&h('span',{style:{fontSize:12,color:'var(--tx2)'}},form.meterImageName||form.imageName),
          h('div',{style:{fontSize:12,color:'var(--tx2)'}},'App sẽ cố gắng tự đọc số lít, giá tiền và thành tiền từ ảnh cây xăng.')
        )
      ),
      h('div',{className:'g2'},
        h(F,{label:'Số lít *'},h('input',{type:'number',min:0,step:'0.1',value:form.liters,onChange:e=>setF('liters',e.target.value),placeholder:'0'})),
        h(F,{label:'Giá tiền *'},h(NumInput,{value:form.price,onChange:v=>setF('price',v),placeholder:'0'}))
      ),
      h('div',{className:'g2'},
        h(F,{label:'Thành tiền'},h('input',{value:numFmt(form.amount||0)?Number(form.amount).toLocaleString('vi-VN'):'0',readOnly:true,style:{background:'var(--bg2)',fontWeight:600}}))
      ),
      h(F,{label:'Chú ý'},h('textarea',{value:form.note,onChange:e=>setF('note',e.target.value),rows:3,placeholder:'Đơn lỗi hoặc cần sửa thì ghi chú ở đây...'})),
      h(Row,null,
        h('button',{onClick:()=>{setModal(false);setEdit(null);}},'Hủy'),
        h('button',{className:'bp',onClick:save,style:{padding:'8px 20px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu đơn')
      )
    )
  );
}

function reportMonthDateRange(value){
  const [year,month]=String(value||'').split('-').map(Number);
  if(!year||!month)return{from:'',to:''};
  const pad=n=>String(n).padStart(2,'0');
  return{from:year+'-'+pad(month)+'-01',to:year+'-'+pad(month)+'-'+pad(new Date(year,month,0).getDate())};
}

function FuelPurchaseReportTab({rows}){
  const todayText=fmtDate();
  const todayIso=todayText.split('/').reverse().join('-');
  const [df,sdf]=useState(todayIso);
  const [dt,sdt]=useState(todayIso);
  const [monthFilter,setMonthFilter]=useState(todayIso.slice(0,7));
  const [buyerFilter,setBuyerFilter]=useState('');
  const [vehicleFilter,setVehicleFilter]=useState('');
  const pad2=n=>String(n).padStart(2,'0');
  useEffect(()=>{
    if(!monthFilter) return;
    const parts=String(monthFilter).split('-');
    if(parts.length!==2) return;
    const y=Number(parts[0]);
    const m=Number(parts[1]);
    if(!y||!m) return;
    const lastDay=new Date(y,m,0).getDate();
    sdf(`${y}-${pad2(m)}-01`);
    sdt(`${y}-${pad2(m)}-${pad2(lastDay)}`);
  },[monthFilter]);
  const monthKey=v=>{
    const d=parseAnyDate(v);
    return d?(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')):'';
  };
  const monthLabel=ym=>{
    if(!ym) return 'Chưa rõ tháng';
    const [y,m]=String(ym).split('-');
    return 'Tháng '+Number(m)+'/'+y;
  };
  const inRange=v=>{
    const d=parseAnyDate(v);
    if(!d) return false;
    const from=df?parseAnyDate(df):null;
    const to=dt?parseAnyDate(dt):null;
    if(from&&d<from) return false;
    if(to&&d>to) return false;
    return true;
  };
  const buyerOptions=[...new Map((rows||[]).filter(r=>r.buyerId||r.buyerName).map(r=>[
    String(r.buyerId||r.buyerName||''),
    {id:String(r.buyerId||r.buyerName||''),name:r.buyerName||r.buyerId||'Chưa rõ'}
  ])).values()].sort((a,b)=>a.name.localeCompare(b.name,'vi'));
  const vehicleOptions=[...new Set((rows||[]).map(r=>String(r.vehicle||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const filtered=(rows||[]).filter(r=>
    inRange(r.date||r.createdAt||r.updatedAt)
    && (!buyerFilter||String(r.buyerId||r.buyerName||'')===String(buyerFilter))
    && (!vehicleFilter||String(r.vehicle||'')===String(vehicleFilter))
  );
  const totalLiters=filtered.reduce((s,r)=>s+(numFmt(r.liters)||0),0);
  const totalAmount=filtered.reduce((s,r)=>s+(numFmt(r.amount)||0),0);
  const totalCount=filtered.length;
  const addGroup=(map,key,seed)=>{
    if(!map[key]) map[key]=seed;
    return map[key];
  };
  const byMonth={};
  const byVehicle={};
  const byBuyer={};
  filtered.forEach(r=>{
    const liters=numFmt(r.liters)||0;
    const amount=numFmt(r.amount)||0;
    const mk=monthKey(r.date||r.createdAt||r.updatedAt)||'unknown';
    const monthItem=addGroup(byMonth,mk,{key:mk,label:monthLabel(mk),count:0,liters:0,amount:0});
    monthItem.count++; monthItem.liters+=liters; monthItem.amount+=amount;
    const vk=String(r.vehicle||'Chưa rõ xe');
    const vehicleItem=addGroup(byVehicle,vk,{key:vk,label:vk,count:0,liters:0,amount:0});
    vehicleItem.count++; vehicleItem.liters+=liters; vehicleItem.amount+=amount;
    const bk=String(r.buyerName||r.buyerId||'Chưa rõ người đổ');
    const buyerItem=addGroup(byBuyer,bk,{key:bk,label:bk,count:0,liters:0,amount:0});
    buyerItem.count++; buyerItem.liters+=liters; buyerItem.amount+=amount;
  });
  const sortGroups=list=>list.sort((a,b)=>{
    if(b.amount!==a.amount) return b.amount-a.amount;
    return String(a.label||'').localeCompare(String(b.label||''),'vi');
  });
  const monthRows=sortGroups(Object.values(byMonth));
  const vehicleRows=sortGroups(Object.values(byVehicle));
  const buyerRows=sortGroups(Object.values(byBuyer));
  const exportRows=filtered.map(r=>({
    date:fmtAnyDate(r.date)||'',
    buyerName:r.buyerName||'',
    vehicle:r.vehicle||'',
    liters:numFmt(r.liters)||0,
    price:numFmt(r.price)||0,
    amount:numFmt(r.amount)||0,
    note:r.note||''
  }));
  const renderGroupTable=(title,items,cols,emptyText)=>h('div',{className:'tw'},
    h('table',null,
      h('thead',null,h('tr',null,cols.map(c=>h('th',{key:c.key||c.label},c.label)))),
      h('tbody',null,
        items.length?items.map(row=>h('tr',{key:row.key},
          cols.map(c=>h('td',{key:c.key||c.label},
            c.render?c.render(row):row[c.key]
          ))
        )):h('tr',null,h('td',{colSpan:cols.length,className:'empty-st'},emptyText||('Chưa có dữ liệu '+title.toLowerCase()+'.')))
      )
    )
  );
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-gas-station',style:{fontSize:20}}),'Báo cáo mua xăng dầu'),
    h('div',{className:'card',style:{marginBottom:'1rem'}},
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'0 1rem'}},
        h(F,{label:'Tháng nhanh'},
          h('div',{style:{display:'flex',gap:8,alignItems:'center'}},
            h('input',{type:'month',value:monthFilter,onChange:e=>setMonthFilter(e.target.value)}),
            h('button',{type:'button',onClick:()=>setMonthFilter(''),style:{whiteSpace:'nowrap',padding:'8px 12px'}},'Bỏ tháng')
          )
        ),
        h(F,{label:'Từ ngày'},h('input',{type:'date',value:df,onChange:e=>{setMonthFilter('');sdf(e.target.value);}})),
        h(F,{label:'Đến ngày'},h('input',{type:'date',value:dt,onChange:e=>{setMonthFilter('');sdt(e.target.value);}})),
        h(F,{label:'Người đổ'},
          h('select',{value:buyerFilter,onChange:e=>setBuyerFilter(e.target.value)},
            h('option',{value:''},'Tất cả'),
            buyerOptions.map(x=>h('option',{key:x.id,value:x.id},x.name))
          )
        ),
        h(F,{label:'Xe'},
          h('select',{value:vehicleFilter,onChange:e=>setVehicleFilter(e.target.value)},
            h('option',{value:''},'Tất cả'),
            vehicleOptions.map(x=>h('option',{key:x,value:x},x))
          )
        )
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:'1rem',marginTop:4}},
        h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Số lần đổ'),h('div',{style:{fontSize:24,fontWeight:700,color:'var(--pri)'}},totalCount)),
        h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng số lít'),h('div',{style:{fontSize:24,fontWeight:700,color:'var(--pri)'}},totalLiters.toLocaleString('vi-VN'))),
        h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng tiền'),h('div',{style:{fontSize:24,fontWeight:700,color:'var(--pri)'}},totalAmount.toLocaleString('vi-VN')+'đ'))
      ),
      h('div',{style:{display:'flex',justifyContent:'flex-end',marginTop:10}},
        h(ExportBtn,{onClick:()=>xlsxExport(exportRows,[['date','Ngày mua'],['buyerName','Người đổ'],['vehicle','Xe'],['liters','Số lít'],['price','Đơn giá'],['amount','Thành tiền'],['note','Ghi chú']],'Bao_cao_xang_dau')})
      )
    ),
    h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:'1rem',marginBottom:'1rem'}},
      h('div',null,
        h('div',{style:{fontWeight:700,color:'var(--pri3)',margin:'0 0 8px 2px'}},'Theo tháng'),
        renderGroupTable('Theo tháng',monthRows,[
          {key:'label',label:'Tháng'},
          {key:'count',label:'Số lần'},
          {key:'liters',label:'Số lít',render:r=>r.liters.toLocaleString('vi-VN')},
          {key:'amount',label:'Tiền',render:r=>r.amount.toLocaleString('vi-VN')+'đ'}
        ],'Chưa có dữ liệu theo tháng.')
      ),
      h('div',null,
        h('div',{style:{fontWeight:700,color:'var(--pri3)',margin:'0 0 8px 2px'}},'Theo xe'),
        renderGroupTable('Theo xe',vehicleRows,[
          {key:'label',label:'Xe'},
          {key:'count',label:'Số lần'},
          {key:'liters',label:'Số lít',render:r=>r.liters.toLocaleString('vi-VN')},
          {key:'amount',label:'Tiền',render:r=>r.amount.toLocaleString('vi-VN')+'đ'}
        ],'Chưa có dữ liệu theo xe.')
      ),
      h('div',null,
        h('div',{style:{fontWeight:700,color:'var(--pri3)',margin:'0 0 8px 2px'}},'Theo người đổ'),
        renderGroupTable('Theo người đổ',buyerRows,[
          {key:'label',label:'Người đổ'},
          {key:'count',label:'Số lần'},
          {key:'liters',label:'Số lít',render:r=>r.liters.toLocaleString('vi-VN')},
          {key:'amount',label:'Tiền',render:r=>r.amount.toLocaleString('vi-VN')+'đ'}
        ],'Chưa có dữ liệu theo người đổ.')
      )
    ),
    h('div',{className:'tw'},h('table',null,
      h('thead',null,h('tr',null,...['Ngày mua','Người đổ','Xe','Số lít','Thành tiền','Ghi chú'].map(c=>h('th',{key:c},c)))),
      h('tbody',null,
        filtered.length?filtered.map(r=>h('tr',{key:r.id},
          h('td',null,fmtAnyDate(r.date)||'—'),
          h('td',null,r.buyerName||'—'),
          h('td',null,r.vehicle||'—'),
          h('td',null,(numFmt(r.liters)||0).toLocaleString('vi-VN')),
          h('td',null,(numFmt(r.amount)||0).toLocaleString('vi-VN')+'đ'),
          h('td',null,r.note||'—')
        )):h('tr',null,h('td',{colSpan:6,className:'empty-st'},'Chưa có dữ liệu mua xăng dầu theo bộ lọc.'))
      )
    ))
  );
}

function MaintenanceReportTab(){
  const todayText=fmtDate();
  const todayIso=todayText.split('/').reverse().join('-');
  const currentMonth=todayIso.slice(0,7);
  const initialRange=reportMonthDateRange(currentMonth);
  const [monthFilter,setMonthFilter]=useState(currentMonth);
  const [df,sdf]=useState(initialRange.from);
  const [dt,sdt]=useState(initialRange.to);
  const [vehicleRows,setVehicleRows]=useState([]);
  const [machineRows,setMachineRows]=useState([]);
  useEffect(()=>{
    if(!monthFilter)return;
    const range=reportMonthDateRange(monthFilter);
    sdf(range.from);sdt(range.to);
  },[monthFilter]);
  useEffect(()=>{
    let off=false;
    (async()=>{
      try{
        const [vehicles,machines]=await Promise.all([
          dbGet('scf_maint_vehicle',[]),
          dbGet('scf_maint_machine',[])
        ]);
        if(off) return;
        setVehicleRows(Array.isArray(vehicles)?vehicles:[]);
        setMachineRows(Array.isArray(machines)?machines:[]);
      }catch(e){
        if(off) return;
        try{
          const vehicles=JSON.parse(localStorage.getItem('scf_maint_vehicle')||'[]');
          const machines=JSON.parse(localStorage.getItem('scf_maint_machine')||'[]');
          setVehicleRows(Array.isArray(vehicles)?vehicles:[]);
          setMachineRows(Array.isArray(machines)?machines:[]);
        }catch(_e){}
      }
    })();
    return ()=>{off=true;};
  },[]);
  const monthKey=v=>{
    const d=parseAnyDate(v);
    return d?(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')):'';
  };
  const monthLabel=ym=>{
    if(!ym) return 'Chưa rõ tháng';
    const [y,m]=String(ym).split('-');
    return 'Tháng '+Number(m)+'/'+y;
  };
  const inRange=v=>{
    const d=parseAnyDate(v);
    if(!d) return false;
    const from=df?parseAnyDate(df):null;
    const to=dt?parseAnyDate(dt):null;
    if(from&&d<from) return false;
    if(to&&d>to) return false;
    return true;
  };
  const getRepairerNames=r=>{
    const direct=Array.isArray(r?.repairerNames)?r.repairerNames.map(x=>String(x||'').trim()).filter(Boolean):[];
    if(direct.length) return [...new Set(direct)];
    return String(r?.repairerText||'').split(',').map(x=>x.trim()).filter(Boolean);
  };
  const filteredVehicle=(vehicleRows||[]).filter(r=>inRange(r.date||r.createdAt||r.updatedAt));
  const filteredMachine=(machineRows||[]).filter(r=>inRange(r.date||r.createdAt||r.updatedAt));
  const totalVehicleAmount=filteredVehicle.reduce((s,r)=>s+(numFmt(r.amount)||0),0);
  const totalMachineAmount=filteredMachine.reduce((s,r)=>s+(numFmt(r.amount)||0),0);
  const groupList=(source,keyGetter,labelGetter,amountGetter,countIncrement=1)=>{
    const map={};
    source.forEach(item=>{
      const key=keyGetter(item)||'unknown';
      if(!map[key]) map[key]={key,label:labelGetter(item,key),count:0,amount:0};
      map[key].count+=countIncrement;
      map[key].amount+=amountGetter(item)||0;
    });
    return Object.values(map).sort((a,b)=>{
      if(b.amount!==a.amount) return b.amount-a.amount;
      return String(a.label||'').localeCompare(String(b.label||''),'vi');
    });
  };
  const vehicleByMonth=groupList(filteredVehicle,r=>monthKey(r.date||r.createdAt||r.updatedAt),(_,k)=>monthLabel(k),r=>numFmt(r.amount)||0);
  const vehicleByAsset=groupList(filteredVehicle,r=>String(r.vehicle||'Chưa rõ xe'),r=>String(r.vehicle||'Chưa rõ xe'),r=>numFmt(r.amount)||0);
  const vehicleByGarage=groupList(filteredVehicle,r=>String(r.garage||'Chưa rõ gara'),r=>String(r.garage||'Chưa rõ gara'),r=>numFmt(r.amount)||0);
  const machineByMonth=groupList(filteredMachine,r=>monthKey(r.date||r.createdAt||r.updatedAt),(_,k)=>monthLabel(k),r=>numFmt(r.amount)||0);
  const machineByAsset=groupList(filteredMachine,r=>String(r.vehicle||'Chưa rõ máy'),r=>String(r.vehicle||'Chưa rõ máy'),r=>numFmt(r.amount)||0);
  const machineRepairerEntries=filteredMachine.flatMap(r=>{
    const repairers=getRepairerNames(r);
    const amount=numFmt(r.amount)||0;
    return (repairers.length?repairers:['Chưa rõ người sửa']).map(name=>({name,amount,date:r.date||r.createdAt||r.updatedAt}));
  });
  const machineByRepairer=groupList(machineRepairerEntries,r=>String(r.name||'Chưa rõ người sửa'),r=>String(r.name||'Chưa rõ người sửa'),r=>numFmt(r.amount)||0);
  const exportVehicleRows=filteredVehicle.map(r=>({
    type:'Sửa xe',
    month:monthLabel(monthKey(r.date||r.createdAt||r.updatedAt)),
    date:fmtAnyDate(r.date)||'',
    asset:r.vehicle||'',
    service:r.service||'',
    km:r.km||'',
    garage:r.garage||'',
    repairer:'',
    amount:numFmt(r.amount)||0,
    invoice:r.invoice||''
  }));
  const exportMachineRows=filteredMachine.map(r=>({
    type:'Sửa máy',
    month:monthLabel(monthKey(r.date||r.createdAt||r.updatedAt)),
    date:fmtAnyDate(r.date)||'',
    asset:r.vehicle||'',
    service:r.service||'',
    km:'',
    garage:'',
    repairer:getRepairerNames(r).join(', '),
    amount:numFmt(r.amount)||0,
    invoice:r.invoice||''
  }));
  const detailVehicleRows=filteredVehicle
    .slice()
    .sort((a,b)=>{
      const da=parseAnyDate(a.date||a.createdAt||a.updatedAt);
      const db=parseAnyDate(b.date||b.createdAt||b.updatedAt);
      return (db?db.getTime():0)-(da?da.getTime():0);
    });
  const detailMachineRows=filteredMachine
    .slice()
    .sort((a,b)=>{
      const da=parseAnyDate(a.date||a.createdAt||a.updatedAt);
      const db=parseAnyDate(b.date||b.createdAt||b.updatedAt);
      return (db?db.getTime():0)-(da?da.getTime():0);
    });
  const renderGroupTable=(title,rows,cols,empty)=>h('div',null,
    h('div',{style:{fontWeight:700,color:'var(--pri3)',margin:'0 0 8px 2px'}},title),
    h('div',{className:'tw'},
      h('table',null,
        h('thead',null,h('tr',null,cols.map(c=>h('th',{key:c.key||c.label},c.label)))),
        h('tbody',null,
          rows.length?rows.map(r=>h('tr',{key:r.key},
            cols.map(c=>h('td',{key:c.key||c.label},c.render?c.render(r):r[c.key]))
          )):h('tr',null,h('td',{colSpan:cols.length,className:'empty-st'},empty))
        )
      )
    )
  );
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-tool',style:{fontSize:20}}),'Báo cáo sửa chữa'),
    h('div',{className:'card',style:{marginBottom:'1rem'}},
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'0 1rem'}},
        h(F,{label:'Tháng'},h('input',{type:'month',value:monthFilter,onChange:e=>setMonthFilter(e.target.value)})),
        h(F,{label:'Từ ngày'},h('input',{type:'date',value:df,onChange:e=>{setMonthFilter('');sdf(e.target.value);}})),
        h(F,{label:'Đến ngày'},h('input',{type:'date',value:dt,onChange:e=>{setMonthFilter('');sdt(e.target.value);}}))
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:'1rem',marginTop:4}},
        h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tiền sửa xe'),h('div',{style:{fontSize:24,fontWeight:700,color:'var(--pri)'}},totalVehicleAmount.toLocaleString('vi-VN')+'đ')),
        h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tiền sửa máy'),h('div',{style:{fontSize:24,fontWeight:700,color:'var(--pri)'}},totalMachineAmount.toLocaleString('vi-VN')+'đ')),
        h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng chi sửa chữa'),h('div',{style:{fontSize:24,fontWeight:700,color:'var(--pri)'}},(totalVehicleAmount+totalMachineAmount).toLocaleString('vi-VN')+'đ'))
      ),
      h('div',{style:{display:'flex',justifyContent:'flex-end',marginTop:10}},
        h(ExportBtn,{onClick:()=>xlsxExport([...exportVehicleRows,...exportMachineRows],[['type','Loại'],['month','Tháng'],['date','Ngày'],['asset','Xe / máy'],['service','Dịch vụ'],['km','Tại KM'],['garage','Gara sửa'],['repairer','Người sửa'],['amount','Thành tiền'],['invoice','Hóa đơn']],'Bao_cao_sua_chua')})
      )
    ),
    h('div',{className:'card',style:{marginBottom:'1rem'}},
      h('div',{style:{fontWeight:800,fontSize:16,color:'var(--pri3)',marginBottom:12}},'Sửa xe'),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:'1rem'}},
        renderGroupTable('Theo tháng',vehicleByMonth,[
          {key:'label',label:'Tháng'},
          {key:'count',label:'Lượt'},
          {key:'amount',label:'Tiền',render:r=>r.amount.toLocaleString('vi-VN')+'đ'}
        ],'Chưa có dữ liệu sửa xe theo tháng.'),
        renderGroupTable('Theo xe',vehicleByAsset,[
          {key:'label',label:'Xe'},
          {key:'count',label:'Lượt'},
          {key:'amount',label:'Tiền',render:r=>r.amount.toLocaleString('vi-VN')+'đ'}
        ],'Chưa có dữ liệu sửa xe theo xe.'),
        renderGroupTable('Theo gara sửa',vehicleByGarage,[
          {key:'label',label:'Gara sửa'},
          {key:'count',label:'Lượt'},
          {key:'amount',label:'Tiền',render:r=>r.amount.toLocaleString('vi-VN')+'đ'}
        ],'Chưa có dữ liệu theo gara sửa.')
      ),
      h('div',{className:'tw',style:{marginTop:14}},h('table',null,
        h('thead',null,h('tr',null,...['Ngày','Xe','Dịch vụ','Tại KM','Gara sửa','Tiền','Hóa đơn'].map(c=>h('th',{key:c},c)))),
        h('tbody',null,
          detailVehicleRows.length?detailVehicleRows.map(r=>h('tr',{key:r.id||[r.date,r.vehicle,r.service].join('_')},
            h('td',null,fmtAnyDate(r.date)||'—'),
            h('td',null,r.vehicle||'—'),
            h('td',null,r.service||'—'),
            h('td',null,r.km||'—'),
            h('td',null,r.garage||'—'),
            h('td',null,(numFmt(r.amount)||0).toLocaleString('vi-VN')+'đ'),
            h('td',null,r.invoice||'—')
          )):h('tr',null,h('td',{colSpan:7,className:'empty-st'},'Chưa có chi tiết sửa xe.'))
        )
      ))
    ),
    h('div',{className:'card'},
      h('div',{style:{fontWeight:800,fontSize:16,color:'var(--pri3)',marginBottom:12}},'Sửa máy'),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:'1rem'}},
        renderGroupTable('Theo tháng',machineByMonth,[
          {key:'label',label:'Tháng'},
          {key:'count',label:'Lượt'},
          {key:'amount',label:'Tiền',render:r=>r.amount.toLocaleString('vi-VN')+'đ'}
        ],'Chưa có dữ liệu sửa máy theo tháng.'),
        renderGroupTable('Theo máy',machineByAsset,[
          {key:'label',label:'Máy'},
          {key:'count',label:'Lượt'},
          {key:'amount',label:'Tiền',render:r=>r.amount.toLocaleString('vi-VN')+'đ'}
        ],'Chưa có dữ liệu sửa máy theo máy.'),
        renderGroupTable('Theo người sửa',machineByRepairer,[
          {key:'label',label:'Người sửa'},
          {key:'count',label:'Lượt'},
          {key:'amount',label:'Tiền',render:r=>r.amount.toLocaleString('vi-VN')+'đ'}
        ],'Chưa có dữ liệu theo người sửa.')
      ),
      h('div',{className:'tw',style:{marginTop:14}},h('table',null,
        h('thead',null,h('tr',null,...['Ngày','Máy','Dịch vụ','Người sửa','Tiền','Hóa đơn'].map(c=>h('th',{key:c},c)))),
        h('tbody',null,
          detailMachineRows.length?detailMachineRows.map(r=>h('tr',{key:r.id||[r.date,r.vehicle,r.service].join('_')},
            h('td',null,fmtAnyDate(r.date)||'—'),
            h('td',null,r.vehicle||'—'),
            h('td',null,r.service||'—'),
            h('td',null,getRepairerNames(r).join(', ')||'—'),
            h('td',null,(numFmt(r.amount)||0).toLocaleString('vi-VN')+'đ'),
            h('td',null,r.invoice||'—')
          )):h('tr',null,h('td',{colSpan:6,className:'empty-st'},'Chưa có chi tiết sửa máy.'))
        )
      ))
    )
  );
}

/* --- Báo cáo mua hàng --- */
function PurchaseReportTab({purchases,goodsPurchases,nccs}) {
  const _td5=fmtDate();const _ti5=_td5.split('/').reverse().join('-');const _mr5=reportMonthDateRange(_ti5.slice(0,7));const [df,sdf]=useState(_mr5.from); const [dt,sdt]=useState(_mr5.to); const [periodMode,setPeriodMode]=useState('month'); const [month,setMonth]=useState(_ti5.slice(0,7)); const [purchaseType,setPurchaseType]=useState('all'); const [ncc,sn]=useState(''); const [status,ss]=useState('all');
  const fmtPurchaseDate=s=>fmtAnyDate(s);
  const parseDate=s=>parseAnyDate(s);
  const allPurchases=[...(purchases||[]).map(p=>({...p,purchaseType:'material'})),...(goodsPurchases||[]).map(p=>({...p,purchaseType:'goods'}))];
  const inRange=d=>{const dt2=parseDate(d);if(!dt2)return false;if(periodMode==='month')return !month||(dt2.getFullYear()===Number(month.slice(0,4))&&dt2.getMonth()+1===Number(month.slice(5,7)));const f2=df?parseDate(df):null;const t=dt?parseDate(dt):null;if(f2&&dt2<f2)return false;if(t&&dt2>t)return false;return true;};
  const filtered=allPurchases.filter(p=>inRange(p.orderDate||p.createdAt||p.updatedAt)&&(purchaseType==='all'||p.purchaseType===purchaseType)&&(!ncc||p.nccId===ncc)&&(status==='all'||p.status===status));
  const active=filtered.filter(p=>p.status!=='cancelled');
  const totalAmt=active.reduce((s,p)=>s+(p.lines||[]).reduce((s2,l)=>s2+(Number(l.qty)||0)*(Number(l.price)||0),0),0);
  const totalItems=active.reduce((s,p)=>s+(p.lines||[]).reduce((s2,l)=>s2+(Number(l.qty)||0),0),0);
  const detailRows=active.flatMap(p=>(p.lines||[]).map(l=>({id:p.id,purchaseType:p.purchaseType,purchaseTypeLabel:p.purchaseType==='goods'?'Hàng hóa':'NVL',nccName:p.nccName,orderDate:p.orderDate,deliveryDate:p.deliveryDate,receivedDate:p.receivedDate||'',invoiceNo:p.invoiceNo||'',status:p.status,itemName:l.name||'',unit:l.unit||'',qty:Number(l.qty)||0,price:Number(l.price)||0,total:(Number(l.qty)||0)*(Number(l.price)||0)})));
  const byNcc={};active.forEach(p=>{if(!byNcc[p.nccId])byNcc[p.nccId]={name:p.nccName||'Chưa rõ NCC',orders:0,qty:0,total:0};byNcc[p.nccId].orders++;(p.lines||[]).forEach(l=>{byNcc[p.nccId].qty+=Number(l.qty)||0;byNcc[p.nccId].total+=(Number(l.qty)||0)*(Number(l.price)||0);});});
  const byItem={};detailRows.forEach(r=>{const k=r.itemName||'Chưa rõ mặt hàng';if(!byItem[k])byItem[k]={name:k,unit:r.unit,qty:0,total:0};byItem[k].qty+=r.qty;byItem[k].total+=r.total;});
  const allYears=[...new Set(allPurchases.map(p=>parseDate(p.orderDate||p.createdAt||p.updatedAt)).filter(Boolean).map(d=>String(d.getFullYear())))].sort();
  const itemOptions=[...new Set(detailRows.map(r=>r.itemName).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const defaultYear=(parseDate(dt)||new Date()).getFullYear();
  const [chartItem, setChartItem] = useState('');
  const [chartYear, setChartYear] = useState(String(defaultYear));
  const chartMonths=Array.from({length:12},(_,i)=>({month:i+1,label:'T'+String(i+1),qty:0,total:0,unit:''}));
  detailRows.forEach(r=>{
    const d=parseDate(r.orderDate);
    if(!d) return;
    if(chartItem && r.itemName!==chartItem) return;
    if(String(d.getFullYear())!==String(chartYear)) return;
    const idx=d.getMonth();
    chartMonths[idx].qty+=Number(r.qty)||0;
    chartMonths[idx].total+=Number(r.total)||0;
    chartMonths[idx].unit=chartMonths[idx].unit||r.unit||'';
  });
  const chartMax=Math.max(...chartMonths.map(m=>m.total),0);
  const statusMap={all:'Tất cả',draft:'Nháp',ordered:'Đã đặt',received:'Đã nhận',cancelled:'Hủy'};
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-chart-bar',style:{fontSize:20}}),'Báo cáo mua hàng'),
    h('div',{className:'card',style:{marginBottom:'1.25rem'}},
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'0 1rem'}},
        h(F,{label:'Lọc thời gian'},h('select',{value:periodMode,onChange:e=>setPeriodMode(e.target.value)},h('option',{value:'range'},'Từ ngày đến ngày'),h('option',{value:'month'},'Theo tháng'))),
        periodMode==='month'
          ?h(F,{label:'Tháng'},h('input',{type:'month',value:month,onChange:e=>setMonth(e.target.value)}))
          :h(React.Fragment,null,h(F,{label:'Từ ngày'},h('input',{type:'date',value:df,onChange:e=>sdf(e.target.value)})),h(F,{label:'Đến ngày'},h('input',{type:'date',value:dt,onChange:e=>sdt(e.target.value)}))),
        h(F,{label:'Loại đơn mua'},h('select',{value:purchaseType,onChange:e=>setPurchaseType(e.target.value)},h('option',{value:'all'},'Tất cả'),h('option',{value:'material'},'Đơn mua hàng NVL'),h('option',{value:'goods'},'Đơn mua hàng hàng hóa'))),
        h(F,{label:'Nhà cung cấp'},h('select',{value:ncc,onChange:e=>sn(e.target.value)},h('option',{value:''},'Tất cả NCC'),(nccs||[]).map(n=>h('option',{key:n.id,value:n.id},n.name)))),
        h(F,{label:'Trạng thái'},h('select',{value:status,onChange:e=>ss(e.target.value)},Object.entries(statusMap).map(([v,l])=>h('option',{key:v,value:v},l))))
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:'1rem',marginTop:4}},
        h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Số đơn mua'),h('div',{style:{fontSize:24,fontWeight:600,color:'var(--pri)'}},filtered.length)),
        h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng số lượng'),h('div',{style:{fontSize:24,fontWeight:600,color:'var(--pri)'}},totalItems.toLocaleString())),
        h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng tiền mua'),h('div',{style:{fontSize:22,fontWeight:600,color:'var(--pri)'}},totalAmt.toLocaleString('vi-VN')+'đ'))
      ),
      h('div',{style:{display:'flex',justifyContent:'flex-end',marginTop:10}},
        h(ExportBtn,{onClick:()=>xlsxExport(detailRows,[['id','Mã đơn'],['purchaseTypeLabel','Loại đơn'],['nccName','Nhà cung cấp'],['orderDate','Ngày đặt'],['deliveryDate','Hạn giao'],['receivedDate','Ngày nhận'],['invoiceNo','Số hóa đơn'],['status','Trạng thái'],['itemName','Mặt hàng'],['unit','ĐVT'],['qty','Số lượng'],['price','Đơn giá'],['total','Thành tiền']],'Bao_cao_mua_hang')})
      )
    ),
    h('div',{className:'card',style:{marginBottom:'1.25rem'}},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:10}},
        h('div',{style:{fontWeight:600,color:'var(--pri3)'}},'Biểu đồ mua hàng theo tháng'),
        h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'0 1rem',flex:'1 1 420px'}},
          h(F,{label:'Mặt hàng'},h('select',{value:chartItem,onChange:e=>setChartItem(e.target.value)},h('option',{value:''},'Tất cả mặt hàng'),itemOptions.map(x=>h('option',{key:x,value:x},x)))),
          h(F,{label:'Năm'},h('select',{value:chartYear,onChange:e=>setChartYear(e.target.value)},(allYears.length?allYears:[String(defaultYear)]).map(y=>h('option',{key:y,value:y},y))))
        )
      ),
      h('div',{className:'chart-scroll'},
        h('div',{className:'chart-bars-12'},
          chartMonths.map(m=>h('div',{key:m.month,style:{display:'flex',flexDirection:'column',alignItems:'center',gap:6}},
            h('div',{style:{fontSize:11,color:'var(--tx2)',minHeight:30,textAlign:'center'}},m.total?m.total.toLocaleString('vi-VN')+'đ':'0'),
            h('div',{style:{height:160,width:'100%',display:'flex',alignItems:'flex-end',justifyContent:'center',background:'linear-gradient(180deg,#f8fbf9,transparent)',borderRadius:8}},
              h('div',{style:{width:'78%',height:(chartMax?Math.max(10,Math.round((m.total/chartMax)*150)):4),background:'linear-gradient(180deg,var(--pri2),var(--pri))',borderRadius:'8px 8px 2px 2px',transition:'height .2s ease'}})
            ),
            h('div',{style:{fontSize:12,fontWeight:600,color:'var(--pri3)'}},m.label),
            h('div',{style:{fontSize:11,color:'var(--tx2)',textAlign:'center'}},(m.qty||0).toLocaleString('vi-VN')+(m.unit?' '+m.unit:''))
          ))
        )
      ),
      h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:10}},'Biểu đồ hiển thị đủ 12 tháng của năm đã chọn, kể cả tháng chưa phát sinh mua.')
    ),
    h('div',{className:'mobile-only report-mobile-section'},
      Object.entries(byNcc).length?Object.entries(byNcc).map(([id,v])=>h('div',{key:'mncc_'+id,className:'mobile-data-card'},
        h('div',{className:'mobile-data-head'},
          h('div',{className:'mobile-data-title'},v.name),
          h('div',{className:'mobile-data-sub'},v.orders+' đơn')
        ),
        h('div',{className:'mobile-data-grid'},
          h('div',{className:'mobile-data-item'},h('b',null,'Số lượng'),h('span',null,v.qty.toLocaleString())),
          h('div',{className:'mobile-data-item'},h('b',null,'Tổng tiền'),h('span',null,v.total.toLocaleString('vi-VN')+'đ'))
        )
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có dữ liệu theo nhà cung cấp.')
    ),
    h('div',{className:'mobile-only report-mobile-section'},
      Object.entries(byItem).length?Object.entries(byItem).map(([id,v])=>h('div',{key:'mitem_'+id,className:'mobile-data-card'},
        h('div',{className:'mobile-data-head'},
          h('div',{className:'mobile-data-title'},v.name),
          h('div',{className:'mobile-data-sub'},v.unit||'—')
        ),
        h('div',{className:'mobile-data-grid'},
          h('div',{className:'mobile-data-item'},h('b',null,'Số lượng'),h('span',null,v.qty.toLocaleString())),
          h('div',{className:'mobile-data-item'},h('b',null,'Tổng tiền'),h('span',null,v.total.toLocaleString('vi-VN')+'đ'))
        )
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có dữ liệu mặt hàng.')
    ),
    h('div',{className:'report-grid-2 desktop-only'},
      h('div',{className:'tw'},h('table',null,
        h('thead',null,h('tr',null,...['Nhà cung cấp','Số đơn','Số lượng','Tổng tiền'].map(c=>h('th',{key:c},c)))),
        h('tbody',null,Object.entries(byNcc).length?Object.entries(byNcc).map(([id,v])=>h('tr',{key:id},h('td',null,h('div',{style:{fontWeight:500}},v.name)),h('td',null,v.orders+' đơn'),h('td',null,v.qty.toLocaleString()),h('td',null,h('span',{style:{fontWeight:500,color:'var(--pri)'}},v.total.toLocaleString('vi-VN')+'đ')))):h('tr',null,h('td',{colSpan:4,className:'empty-st'},'Chưa có dữ liệu theo bộ lọc.')))
      )),
      h('div',{className:'tw'},h('table',null,
        h('thead',null,h('tr',null,...['Mặt hàng','ĐVT','Số lượng','Tổng tiền'].map(c=>h('th',{key:c},c)))),
        h('tbody',null,Object.entries(byItem).length?Object.entries(byItem).map(([id,v])=>h('tr',{key:id},h('td',null,h('div',{style:{fontWeight:500}},v.name)),h('td',null,v.unit||'—'),h('td',null,v.qty.toLocaleString()),h('td',null,h('span',{style:{fontWeight:500,color:'var(--pri)'}},v.total.toLocaleString('vi-VN')+'đ')))):h('tr',null,h('td',{colSpan:4,className:'empty-st'},'Chưa có dữ liệu mặt hàng.')))
      ))
    ),
    h('div',{className:'mobile-only report-mobile-section'},
      detailRows.length?detailRows.map((r,i)=>h('div',{key:'mdetail_'+r.id+'_'+i,className:'mobile-data-card'},
        h('div',{className:'mobile-data-head'},
          h('div',null,
            h('div',{className:'mobile-data-title'},r.itemName||'—'),
            h('div',{className:'mobile-data-sub'},r.nccName||'—')
          ),
          h('div',{className:'mobile-data-sub'},fmtPurchaseDate(r.orderDate))
        ),
        h('div',{className:'mobile-data-grid'},
          h('div',{className:'mobile-data-item'},h('b',null,'Số lượng'),h('span',null,r.qty.toLocaleString()+' '+(r.unit||''))),
          h('div',{className:'mobile-data-item'},h('b',null,'Đơn giá'),h('span',null,r.price?r.price.toLocaleString('vi-VN')+'đ':'—')),
          h('div',{className:'mobile-data-item'},h('b',null,'Thành tiền'),h('span',null,r.total.toLocaleString('vi-VN')+'đ')),
          h('div',{className:'mobile-data-item'},h('b',null,'Hóa đơn'),h('span',null,r.invoiceNo||'—'))
        )
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có chi tiết mua hàng.')
    ),
    h('div',{className:'tw desktop-only'},h('table',null,
      h('thead',null,h('tr',null,...['Mã đơn','Loại đơn','Ngày đặt','NCC','Mặt hàng','SL','Đơn giá','Thành tiền'].map(c=>h('th',{key:c},c)))),
      h('tbody',null,detailRows.length?detailRows.map((r,i)=>h('tr',{key:r.id+'_'+i},h('td',null,r.id),h('td',null,r.purchaseTypeLabel),h('td',null,fmtPurchaseDate(r.orderDate)),h('td',null,r.nccName),h('td',null,r.itemName),h('td',null,r.qty.toLocaleString()+' '+(r.unit||'')),h('td',null,r.price?r.price.toLocaleString('vi-VN')+'đ':'—'),h('td',null,h('span',{style:{fontWeight:500,color:'var(--pri)'}},r.total.toLocaleString('vi-VN')+'đ')))):h('tr',null,h('td',{colSpan:8,className:'empty-st'},'Chưa có chi tiết mua hàng.')))
    ))
  );
}

function MaterialOpeningForm({record,materials,month,onSave,onClose}){
  const build=(rec)=>rec?{...rec,qty:numFmt(rec.qty||0)}:{month:month||isoDate().slice(0,7),materialId:'',qty:0,note:''};
  const [f,sf]=useState(build(record));
  const setF=(k,v)=>sf(p=>({...p,[k]:v}));
  const save=()=>{
    const mat=(materials||[]).find(m=>m.id===f.materialId);
    if(!f.month){window.showToast('Chọn tháng.','warn');return;}
    if(!mat){window.showToast('Chọn nguyên vật liệu.','warn');return;}
    if(numFmt(f.qty)<0){window.showToast('Tồn đầu tháng không được âm.','warn');return;}
    onSave({
      ...f,
      month:f.month,
      materialId:mat.id,
      materialCode:mat.code||mat.id||'',
      materialName:mat.name||'',
      group:mat.group||'',
      unit:mat.unit||'',
      qty:numFmt(f.qty||0),
      note:f.note||''
    });
  };
  return h(Modal,{title:record?'Sửa tồn đầu tháng':'Thêm tồn đầu tháng',onClose},
    h('div',{className:'g2'},
      h(F,{label:'Tháng *'},h('input',{type:'month',value:f.month,onChange:e=>setF('month',e.target.value)})),
      h(F,{label:'Nguyên vật liệu *'},
        h('select',{value:f.materialId,onChange:e=>setF('materialId',e.target.value)},
          h('option',{value:''},'— Chọn nguyên vật liệu —'),
          (materials||[]).slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'vi')).map(m=>h('option',{key:m.id,value:m.id},(m.code||m.id||'')+' - '+(m.name||'')))
        )
      )
    ),
    h('div',{className:'g2'},
      h(F,{label:'Tồn đầu tháng *'},h(NumInput,{value:f.qty,onChange:v=>setF('qty',v)})),
      h(F,{label:'Đơn vị'},h('input',{value:(materials||[]).find(m=>m.id===f.materialId)?.unit||record?.unit||'',readOnly:true,style:{background:'var(--bg2)'}}))
    ),
    h(F,{label:'Ghi chú'},h('textarea',{value:f.note||'',onChange:e=>setF('note',e.target.value),rows:2,placeholder:'Ghi chú nếu cần...'})),
    h(Row,null,
      h('button',{onClick:onClose},'Hủy'),
      h('button',{className:'bp',onClick:save},'Lưu')
    )
  );
}

/* --- Báo cáo NVL tồn và tiêu dùng --- */
function MaterialUsageReportTab({materials,purchases,monthOpenings,setMonthOpenings}){
  const currentMonth=isoDate().slice(0,7);
  const [month,setMonth]=useState(currentMonth);
  const [q,sq]=useState('');
  const [draftClosing,setDraftClosing]=useState({});
  const normalize=s=>String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const monthLabel=ym=>{
    if(!ym) return '';
    const [y,m]=String(ym).split('-');
    return 'Tháng '+Number(m)+'/'+y;
  };
  const shiftMonth=(ym,delta)=>{
    const [y,m]=String(ym||currentMonth).split('-').map(Number);
    const d=new Date(y||new Date().getFullYear(),(m||1)-1,1);
    d.setMonth(d.getMonth()+delta);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  };
  const prevMonth=shiftMonth(month,-1);
  const parseMonthDate=ym=>{
    if(!ym||!/^\d{4}-\d{2}$/.test(String(ym))) return null;
    const [y,m]=String(ym).split('-').map(Number);
    return new Date(y,m-1,1);
  };
  const matchMaterial=line=>{
    const rawId=String(line?.itemId||'').trim().replace(/^M_/,'');
    const nameKey=normalize(line?.name);
    return (materials||[]).find(m=>{
      const id=normalize(m.id);
      const code=normalize(m.code);
      const name=normalize(m.name);
      return (rawId && (rawId===id||rawId===code)) || (nameKey && (nameKey===name || nameKey===code));
    })||null;
  };
  const importClosings=rows=>{
    const targetMonth=month||currentMonth;
    const mapped=(rows||[]).map(r=>{
      const code=String(r['Mã NVL']||r['Mã vật tư']||r['code']||'').trim();
      const name=String(r['Tên nguyên vật liệu']||r['Tên NVL']||r['Tên vật tư']||r['name']||'').trim();
      const found=(materials||[]).find(m=>{
        return (code && normalize(m.code||m.id)===normalize(code)) || (name && normalize(m.name)===normalize(name));
      });
      if(!found) return null;
      return {
        id:'TCK'+uid(),
        month:String(r['Tháng']||r['month']||targetMonth).trim()||targetMonth,
        materialId:found.id,
        materialCode:found.code||found.id||'',
        materialName:found.name||'',
        group:found.group||'',
        unit:found.unit||'',
        qty:numFmt(r['Tồn cuối tháng']||r['Tồn cuối']||r['Số lượng']||r['qty']||0),
        note:r['Ghi chú']||r['note']||'',
        createdAt:fmtDT(),
        updatedAt:fmtDT()
      };
    }).filter(Boolean);
    if(!mapped.length){window.showToast('File chưa có dòng tồn cuối tháng hợp lệ.','warn');return;}
    setMonthOpenings(prev=>{
      const next=[...(prev||[])];
      mapped.forEach(rec=>{
        const idx=next.findIndex(x=>x.month===rec.month&&x.materialId===rec.materialId);
        if(idx>=0) next[idx]={...next[idx],...rec,id:next[idx].id};
        else next.unshift(rec);
      });
      return next;
    });
    window.showToast('Đã nhập '+mapped.length+' dòng tồn cuối tháng','success');
  };
  const previousClosingMap=new Map((monthOpenings||[]).filter(x=>x.month===prevMonth).map(x=>[x.materialId,Number(x.qty)||0]));
  const currentClosingMap=new Map((monthOpenings||[]).filter(x=>x.month===month).map(x=>[x.materialId,Number(x.qty)||0]));
  const purchaseRows=(purchases||[]).filter(p=>p.status!=='cancelled').flatMap(p=>(p.lines||[]).map(l=>{
    const dt=parseAnyDate(p.orderDate||p.createdAt||p.updatedAt);
    if(!dt) return null;
    const ym=dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0');
    if(ym!==month) return null;
    const found=matchMaterial(l);
    return {
      materialId:found?.id||'EXT_'+normalize(l.name||l.itemId||uid()),
      materialCode:found?.code||'',
      materialName:found?.name||l.name||'',
      group:found?.group||'',
      unit:found?.unit||l.unit||'',
      qty:Number(l.qty)||0
    };
  })).filter(Boolean);
  const purchaseMap=new Map();
  purchaseRows.forEach(r=>{
    const cur=purchaseMap.get(r.materialId)||{qty:0,unit:r.unit||'',materialName:r.materialName||'',materialCode:r.materialCode||'',group:r.group||''};
    cur.qty+=r.qty;
    purchaseMap.set(r.materialId,cur);
  });
  const materialBase=(materials||[]).map(m=>({id:m.id,code:m.code||m.id||'',name:m.name||'',group:m.group||'',unit:m.unit||''}));
  const extraMaterials=[...new Set([
    ...purchaseRows.map(x=>x.materialId),
    ...(monthOpenings||[]).filter(x=>x.month===prevMonth).map(x=>x.materialId),
    ...(monthOpenings||[]).filter(x=>x.month===month).map(x=>x.materialId)
  ])].filter(id=>!materialBase.some(m=>m.id===id)).map(id=>{
    const found=materialBase.find(m=>m.id===id);
    if(found) return found;
    const pr=purchaseRows.find(x=>x.materialId===id);
    return {id,code:pr?.materialCode||'',name:pr?.materialName||'',group:pr?.group||'',unit:pr?.unit||''};
  });
  const activeMaterials=[...materialBase,...extraMaterials];
  const reportRows=activeMaterials
    .map(m=>{
      const opening=Number(previousClosingMap.get(m.id)||0);
      const incoming=Number(purchaseMap.get(m.id)?.qty||0);
      const ending=currentClosingMap.has(m.id)?Number(currentClosingMap.get(m.id)||0):null;
      const consumed=ending===null?null:(opening+incoming-ending);
      const flags=[];
      if(ending!==null&&consumed!==null&&consumed<0) flags.push('Tiêu dùng âm');
      if(ending!==null&&ending>(opening+incoming)) flags.push('Tồn cuối lớn hơn số có thể có');
      return {
        id:m.id,
        code:m.code||m.id||'',
        name:m.name||'',
        group:m.group||'',
        unit:m.unit||purchaseMap.get(m.id)?.unit||'',
        opening,
        incoming,
        ending,
        consumed,
        flags,
        note:ending===null?'Chưa nhập tồn cuối '+monthLabel(month):flags.join(' • ')
      };
    })
    .filter(r=>!q||[r.code,r.name,r.group].some(v=>normalize(v).includes(normalize(q))))
    .sort((a,b)=>{
      const af=a.flags?.length?1:0;
      const bf=b.flags?.length?1:0;
      if(bf!==af) return bf-af;
      const ai=Number(a.incoming)||0;
      const bi=Number(b.incoming)||0;
      if(bi!==ai) return bi-ai;
      return String(a.name||'').localeCompare(String(b.name||''),'vi');
    });
  useEffect(()=>{
    const next={};
    reportRows.forEach(r=>{ next[r.id]=r.ending===null?'':String(r.ending); });
    setDraftClosing(next);
  },[month,reportRows.map(r=>r.id+':'+(r.ending===null?'':r.ending)).join('|')]);
  const setClosing=(id,v)=>setDraftClosing(prev=>({...prev,[id]:v}));
  const saveClosings=()=>{
    if(!reportRows.length){window.showToast('Tháng này chưa có nguyên vật liệu phát sinh để nhập tồn cuối.','warn');return;}
    const now=fmtDT();
    setMonthOpenings(prev=>{
      const next=[...(prev||[])];
      reportRows.forEach(r=>{
        const raw=draftClosing[r.id];
        if(raw===''||raw===null||typeof raw==='undefined') return;
        const qty=Math.max(0,numFmt(raw||0));
        const idx=next.findIndex(x=>x.month===month&&x.materialId===r.id);
        const payload={
          month,
          materialId:r.id,
          materialCode:r.code||r.id||'',
          materialName:r.name||'',
          group:r.group||'',
          unit:r.unit||'',
          qty,
          note:'',
          updatedAt:now
        };
        if(idx>=0) next[idx]={...next[idx],...payload};
        else next.unshift({...payload,id:'TCK'+uid(),createdAt:now});
      });
      return next;
    });
    window.showToast('Đã lưu tồn cuối tháng','success');
  };
  const summary={
    opening:reportRows.reduce((s,r)=>s+r.opening,0),
    incoming:reportRows.reduce((s,r)=>s+r.incoming,0),
    ending:reportRows.reduce((s,r)=>s+(r.ending===null?0:r.ending),0),
    consumed:reportRows.reduce((s,r)=>s+(r.consumed===null?0:r.consumed),0),
    missing:reportRows.filter(r=>r.ending===null).length
  };
  const chartMaterialOptions=materialBase.filter(m=>m.name).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'vi'));
  const availableYears=[...new Set([
    ...(monthOpenings||[]).map(x=>String(x.month||'').slice(0,4)).filter(Boolean),
    ...(purchases||[]).map(p=>{const d=parseAnyDate(p.orderDate||p.createdAt||p.updatedAt);return d?String(d.getFullYear()):'';}).filter(Boolean)
  ])].sort();
  const [chartMaterial,setChartMaterial]=useState('');
  const [chartYear,setChartYear]=useState(String((parseMonthDate(month)||new Date()).getFullYear()));
  const chartMonths=Array.from({length:12},(_,i)=>{
    const ym=chartYear+'-'+String(i+1).padStart(2,'0');
    const pm=shiftMonth(ym,-1);
    const matFilter=chartMaterial||'';
    const opening=(monthOpenings||[]).filter(x=>x.month===pm&&(!matFilter||x.materialId===matFilter)).reduce((s,x)=>s+(Number(x.qty)||0),0);
    const ending=(monthOpenings||[]).filter(x=>x.month===ym&&(!matFilter||x.materialId===matFilter)).reduce((s,x)=>s+(Number(x.qty)||0),0);
    const endingExists=(monthOpenings||[]).some(x=>x.month===ym&&(!matFilter||x.materialId===matFilter));
    const incoming=(purchases||[]).filter(p=>p.status!=='cancelled').flatMap(p=>(p.lines||[]).map(l=>({p,l}))).reduce((sum,item)=>{
      const d=parseAnyDate(item.p.orderDate||item.p.createdAt||item.p.updatedAt);
      if(!d) return sum;
      const ym2=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
      if(ym2!==ym) return sum;
      const found=matchMaterial(item.l);
      if(matFilter && found?.id!==matFilter) return sum;
      if(matFilter && !found && matFilter) return sum;
      return sum+(Number(item.l.qty)||0);
    },0);
    const consumed=endingExists?(opening+incoming-ending):0;
    const unit=matFilter?(chartMaterialOptions.find(m=>m.id===matFilter)?.unit||''):'';
    return {month:i+1,label:'T'+String(i+1),opening,incoming,ending:endingExists?ending:null,consumed,unit};
  });
  const chartMax=Math.max(...chartMonths.map(m=>m.consumed||0),0);
  const exportRows=reportRows.map(r=>({
    month:monthLabel(month),
    previousMonth:monthLabel(prevMonth),
    code:r.code,
    name:r.name,
    group:r.group,
    unit:r.unit,
    opening:r.opening,
    incoming:r.incoming,
    ending:r.ending===null?'':r.ending,
    consumed:r.consumed===null?'':r.consumed,
    note:r.note||''
  }));
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-chart-histogram',style:{fontSize:20}}),'Báo cáo NVL tồn và tiêu dùng'),
    h('div',{className:'card',style:{marginBottom:'1rem'}},
      h('div',{style:{display:'grid',gridTemplateColumns:'1.2fr 1fr 1fr auto',gap:'0.75rem 1rem',alignItems:'end'}},
        h(F,{label:'Tìm nguyên vật liệu'},h('input',{value:q,onChange:e=>sq(e.target.value),placeholder:'Tên, mã, nhóm NVL...'})),
        h(F,{label:'Tháng báo cáo'},h('input',{type:'month',value:month,onChange:e=>setMonth(e.target.value||currentMonth)})),
        h('div',{style:{fontSize:12,color:'var(--tx2)',paddingBottom:8}},'Tiêu dùng tháng = Tồn cuối '+monthLabel(prevMonth)+' + Nhập tháng - Tồn cuối '+monthLabel(month)),
        h('div',{style:{display:'flex',gap:6,justifyContent:'flex-end',flexWrap:'wrap'}},
          h(ExportBtn,{onClick:()=>xlsxExport(exportRows,[['month','Tháng báo cáo'],['previousMonth','Tháng lấy tồn đầu'],['code','Mã NVL'],['name','Tên nguyên vật liệu'],['group','Nhóm NVL'],['unit','ĐVT'],['opening','Tồn đầu tháng'],['incoming','Nhập trong tháng'],['ending','Tồn cuối tháng'],['consumed','Tiêu dùng tháng'],['note','Ghi chú']],'Bao_cao_NVL_ton_va_tieu_dung')}),
          h(ImportBtn,{onFile:importClosings}),
          h('button',{className:'bp',onClick:saveClosings},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu tồn cuối tháng')
        )
      )
    ),
    h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'1rem',marginBottom:'1rem'}},
      h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng tồn đầu tháng'),h('div',{style:{fontSize:24,fontWeight:600,color:'var(--pri)'}},summary.opening.toLocaleString('vi-VN'))),
      h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng nhập trong tháng'),h('div',{style:{fontSize:24,fontWeight:600,color:'var(--pri)'}},summary.incoming.toLocaleString('vi-VN'))),
      h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng tiêu dùng tháng'),h('div',{style:{fontSize:24,fontWeight:600,color:'var(--pri)'}},summary.consumed.toLocaleString('vi-VN'))),
      h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Dòng chưa nhập tồn cuối'),h('div',{style:{fontSize:24,fontWeight:600,color:summary.missing?'#C77D00':'var(--pri)'}},summary.missing))
    ),
    h('div',{className:'mobile-only report-mobile-section'},
      reportRows.length?reportRows.map(r=>h('div',{key:'mclosing_'+r.id,className:'mobile-data-card',style:r.flags?.length?{borderColor:'#C77D00',background:'#FFF8E7'}:{}} ,
        h('div',{className:'mobile-data-head'},
          h('div',null,
            h('div',{className:'mobile-data-title'},(r.code||r.id)+' - '+(r.name||'—')),
            h('div',{className:'mobile-data-sub'},(r.group||'Không nhóm')+(r.unit?' • '+r.unit:''))
          ),
          !!r.flags?.length&&h('div',{className:'mobile-data-sub',style:{color:'#8A5A00',fontWeight:600}},r.flags.join(' • '))
        ),
        h('div',{className:'mobile-data-grid'},
          h('div',{className:'mobile-data-item'},h('b',null,'Tồn đầu'),h('span',null,r.opening.toLocaleString('vi-VN'))),
          h('div',{className:'mobile-data-item'},h('b',null,'Nhập tháng'),h('span',null,r.incoming.toLocaleString('vi-VN')))
        ),
        h('div',{style:{marginTop:10}},
          h(F,{label:'Tồn cuối tháng'},h('input',{type:'number',min:0,step:'0.01',value:draftClosing[r.id]??'',onChange:e=>setClosing(r.id,e.target.value),placeholder:'Nhập tồn cuối...',style:{borderColor:r.flags?.length?'#C77D00':''}}))
        )
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Tháng này chưa có nguyên vật liệu phát sinh hoặc tồn chuyển sang.')
    ),
    h('div',{className:'report-grid-2 desktop-only',style:{marginBottom:'1rem'}},
      h('div',{className:'tw'},h('table',null,
        h('thead',null,h('tr',null,...['Mã NVL','Tên nguyên vật liệu','Tồn đầu tháng','Nhập trong tháng','Tồn cuối tháng','ĐVT'].map(c=>h('th',{key:c},c)))),
        h('tbody',null,reportRows.length?reportRows.map(r=>h('tr',{key:r.id,style:r.flags?.length?{background:'#FFF8E7'}:{}},
          h('td',null,h('span',{style:{fontWeight:500,color:'var(--pri)'}},r.code||r.id)),
          h('td',null,
            h('div',{style:{fontWeight:500}},r.name||'—'),
            !!r.flags?.length&&h('div',{style:{display:'flex',gap:4,flexWrap:'wrap',marginTop:4}},r.flags.map(flag=>h('span',{key:flag,className:'badge',style:{background:'#FFF3CD',color:'#8A5A00'}},flag)))
          ),
          h('td',null,r.opening.toLocaleString('vi-VN')),
          h('td',null,r.incoming.toLocaleString('vi-VN')),
          h('td',null,h('input',{type:'number',min:0,step:'0.01',value:draftClosing[r.id]??'',onChange:e=>setClosing(r.id,e.target.value),placeholder:'Nhập tồn cuối...',style:{maxWidth:140,borderColor:r.flags?.length?'#C77D00':''}})),
          h('td',null,r.unit||'—')
        )):h('tr',null,h('td',{colSpan:6,className:'empty-st'},'Tháng này chưa có nguyên vật liệu phát sinh hoặc tồn chuyển sang.')))
      )),
      h('div',{className:'card'},
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:10}},
          h('div',{style:{fontWeight:600,color:'var(--pri3)'}},'Đồ thị tiêu dùng NVL theo tháng'),
          h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'0 1rem',flex:'1 1 420px'}},
            h(F,{label:'Nguyên vật liệu'},h('select',{value:chartMaterial,onChange:e=>setChartMaterial(e.target.value)},h('option',{value:''},'Tất cả nguyên vật liệu'),chartMaterialOptions.map(x=>h('option',{key:x.id,value:x.id},x.name)))),
            h(F,{label:'Năm'},h('select',{value:chartYear,onChange:e=>setChartYear(e.target.value)},(availableYears.length?availableYears:[String(new Date().getFullYear())]).map(y=>h('option',{key:y,value:y},y))))
          )
        ),
        h('div',{className:'chart-scroll'},
          h('div',{className:'chart-bars-12'},
            chartMonths.map(m=>h('div',{key:m.month,style:{display:'flex',flexDirection:'column',alignItems:'center',gap:6}},
              h('div',{style:{fontSize:11,color:'var(--tx2)',minHeight:30,textAlign:'center'}},(m.consumed||0).toLocaleString('vi-VN')),
              h('div',{style:{height:160,width:'100%',display:'flex',alignItems:'flex-end',justifyContent:'center',background:'linear-gradient(180deg,#f8fbf9,transparent)',borderRadius:8}},
                h('div',{style:{width:'78%',height:(chartMax?Math.max(10,Math.round((m.consumed/chartMax)*150)):4),background:'linear-gradient(180deg,#8fcf6d,#2d6a4f)',borderRadius:'8px 8px 2px 2px',transition:'height .2s ease'}})
              ),
              h('div',{style:{fontSize:12,fontWeight:600,color:'var(--pri3)'}},m.label),
              h('div',{style:{fontSize:11,color:'var(--tx2)',textAlign:'center'}},(m.unit||''))
            ))
          )
        ),
        h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:10}},'Bảng bên trái hiện sẵn các nguyên vật liệu phát sinh trong tháng để nhập tồn cuối trực tiếp.')
      )
    ),
    h('div',{className:'mobile-only report-mobile-section'},
      reportRows.length?reportRows.map(r=>h('div',{key:'mreport_'+r.id,className:'mobile-data-card',style:r.flags?.length?{borderColor:'#C77D00',background:'#FFF8E7'}:{}} ,
        h('div',{className:'mobile-data-head'},
          h('div',null,
            h('div',{className:'mobile-data-title'},r.name||'—'),
            h('div',{className:'mobile-data-sub'},(r.code||r.id)+(r.group?' • '+r.group:''))
          ),
          h('div',{className:'mobile-data-sub'},r.unit||'—')
        ),
        h('div',{className:'mobile-data-grid'},
          h('div',{className:'mobile-data-item'},h('b',null,'Tồn đầu'),h('span',null,r.opening.toLocaleString('vi-VN'))),
          h('div',{className:'mobile-data-item'},h('b',null,'Nhập tháng'),h('span',null,r.incoming.toLocaleString('vi-VN'))),
          h('div',{className:'mobile-data-item'},h('b',null,'Tồn cuối'),h('span',null,r.ending===null?'—':r.ending.toLocaleString('vi-VN'))),
          h('div',{className:'mobile-data-item'},h('b',null,'Tiêu dùng'),h('span',null,r.consumed===null?'Chưa nhập tồn cuối':r.consumed.toLocaleString('vi-VN')))
        ),
        h('div',{style:{marginTop:8,fontSize:12,color:r.flags?.length?'#8A5A00':'var(--tx2)'}},r.note||'—')
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có dữ liệu NVL theo tháng đã chọn.')
    ),
    h('div',{className:'tw desktop-only'},h('table',null,
      h('thead',null,h('tr',null,...['Mã NVL','Tên nguyên vật liệu','Nhóm NVL','ĐVT','Tồn đầu tháng','Nhập trong tháng','Tồn cuối tháng','Tiêu dùng tháng','Ghi chú'].map(c=>h('th',{key:c},c)))),
      h('tbody',null,reportRows.length?reportRows.map(r=>h('tr',{key:r.id,style:r.flags?.length?{background:'#FFF8E7'}:{}},
        h('td',null,h('span',{style:{fontWeight:500,color:'var(--pri)'}},r.code||r.id)),
        h('td',null,
          h('div',{style:{fontWeight:500}},r.name||'—'),
          !!r.flags?.length&&h('div',{style:{display:'flex',gap:4,flexWrap:'wrap',marginTop:4}},r.flags.map(flag=>h('span',{key:flag,className:'badge',style:{background:'#FFF3CD',color:'#8A5A00'}},flag)))
        ),
        h('td',null,r.group||'—'),
        h('td',null,r.unit||'—'),
        h('td',null,r.opening.toLocaleString('vi-VN')),
        h('td',null,r.incoming.toLocaleString('vi-VN')),
        h('td',null,r.ending===null?'—':r.ending.toLocaleString('vi-VN')),
        h('td',null,h('span',{style:{fontWeight:600,color:r.consumed===null?'#C77D00':'var(--pri)'}},r.consumed===null?'Chưa nhập tồn cuối':r.consumed.toLocaleString('vi-VN'))),
        h('td',null,r.note||'—')
      )):h('tr',null,h('td',{colSpan:9,className:'empty-st'},'Chưa có dữ liệu NVL theo tháng đã chọn.')))
    ))
  );
}

function PowderDebtReportTab({customers}){
  const storageKey='scf_powdersales';
  const [rows]=useLS(storageKey,[]);
  const today=fmtDate().split('/').reverse().join('-');
  const currentMonth=today.slice(0,7);
  const initialRange=reportMonthDateRange(currentMonth);
  const [monthFilter,setMonthFilter]=useState(currentMonth);
  const [df,sdf]=useState(initialRange.from);
  const [dt,sdt]=useState(initialRange.to);
  const [customer,scustomer]=useState('');
  useEffect(()=>{
    if(!monthFilter)return;
    const range=reportMonthDateRange(monthFilter);
    sdf(range.from);sdt(range.to);
  },[monthFilter]);
  const customerOptions=[...new Set((customers||[]).map(c=>c.name).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const numMoney=v=>Number(String(v??'').replace(/[^\d-]/g,''))||0;
  const parseDate=s=>{if(!s)return null;const v=String(s).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(v)){const[y,m,d]=v.split('-');return new Date(Number(y),Number(m)-1,Number(d));}const[d,m,y]=v.split('/');return new Date(Number(y),Number(m)-1,Number(d));};
  const inRange=d=>{const dt2=parseDate(d);if(!dt2||Number.isNaN(dt2.getTime()))return false;const f2=df?parseDate(df):null;const t=dt?parseDate(dt):null;if(f2&&dt2<f2)return false;if(t&&dt2>t)return false;return true;};
  const list=(rows||[]).filter(r=>inRange(r.date)&&(!customer||r.customer===customer)).slice().sort((a,b)=>parseVNDateKey(a.date)-parseVNDateKey(b.date));
  const total=list.reduce((s,r)=>s+numMoney(r.amount),0);
  const fmtMoney=n=>numMoney(n).toLocaleString('vi-VN');
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-report-money',style:{fontSize:20}}),'Báo cáo công nợ'),
    h('div',{className:'card',style:{marginBottom:'1rem'}} ,
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:'0.75rem 1rem'}} ,
        h(F,{label:'Tháng'},h('input',{type:'month',value:monthFilter,onChange:e=>setMonthFilter(e.target.value)})),
        h(F,{label:'Từ ngày'},h('input',{type:'date',value:df,onChange:e=>{setMonthFilter('');sdf(e.target.value);}})),
        h(F,{label:'Đến ngày'},h('input',{type:'date',value:dt,onChange:e=>{setMonthFilter('');sdt(e.target.value);}})),
        h(F,{label:'Khách hàng'},h('select',{value:customer,onChange:e=>scustomer(e.target.value)},h('option',{value:''},'Tất cả khách hàng'),customerOptions.map(c=>h('option',{key:c,value:c},c))))
      ),
      h('div',{style:{display:'flex',justifyContent:'flex-end',marginTop:10}},
        h(ExportBtn,{onClick:()=>xlsxExport(list,[['date','Ngày'],['qtyQua','SL'],['weight','Khối lượng'],['price','Đơn giá'],['amount','Thành tiền'],['status','Tình trạng'],['customer','Khách hàng'],['driverName','Lái xe']],'Bao_cao_cong_no')})
      )
    ),
    h('div',{className:'mobile-only report-mobile-section'},
      list.length?list.map(r=>h('div',{key:'debt_'+r.id,className:'mobile-data-card'},
        h('div',{className:'mobile-data-head'},
          h('div',{className:'mobile-data-title'},r.customer||'—'),
          h('div',{className:'mobile-data-sub'},r.date||'—')
        ),
        h('div',{className:'mobile-data-grid'},
          h('div',{className:'mobile-data-item'},h('b',null,'SL'),h('span',null,Number(r.weight)||0)),
          h('div',{className:'mobile-data-item'},h('b',null,'Đơn vị'),h('span',null,'kg')),
          h('div',{className:'mobile-data-item'},h('b',null,'Đơn giá'),h('span',null,fmtMoney(r.price))),
          h('div',{className:'mobile-data-item'},h('b',null,'Thành tiền'),h('span',null,fmtMoney(r.amount)))
        )
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có dữ liệu công nợ.')
    ),
    h('div',{className:'tw desktop-only',style:{overflowX:'auto'}},
      h('table',null,
        h('thead',null,h('tr',null,...['Ngày','SL','Đơn vị','Đơn giá','Thành tiền'].map(c=>h('th',{key:c},c)))),
        h('tbody',null,list.length?list.map(r=>h('tr',{key:r.id},
          h('td',null,r.date||'—'),
          h('td',null,Number(r.weight)||0),
          h('td',null,'kg'),
          h('td',null,fmtMoney(r.price)),
          h('td',null,h('span',{style:{fontWeight:500,color:'var(--pri)'}},fmtMoney(r.amount)))
        )):h('tr',null,h('td',{colSpan:5,className:'empty-st'},'Chưa có dữ liệu công nợ.'))),
        h('tfoot',null,h('tr',null,
          h('td',{style:{fontWeight:700,background:'#fff200'}},'TỔNG'),
          h('td',{style:{background:'#fff200'}},''),
          h('td',{style:{background:'#fff200'}},''),
          h('td',{style:{background:'#fff200'}},''),
          h('td',{style:{fontWeight:700,background:'#fff200'}},fmtMoney(total))
        ))
      )
    )
  );
}

function SyncDataReportTab(){
  const readReport=()=>window.scfGetSyncReport?window.scfGetSyncReport():{status:navigator.onLine?'idle':'offline',pending:0,online:navigator.onLine,serverReady:false,items:[]};
  const[report,setReport]=useState(readReport);
  const[busy,setBusy]=useState(false);
  useEffect(()=>{
    const update=()=>setReport(readReport());
    window.addEventListener('scf-sync-state',update);
    window.addEventListener('online',update);
    window.addEventListener('offline',update);
    return()=>{window.removeEventListener('scf-sync-state',update);window.removeEventListener('online',update);window.removeEventListener('offline',update);};
  },[]);
  const retry=async()=>{
    if(busy)return;
    setBusy(true);
    try{await window.scfFlushPendingWrites?.();}
    finally{setBusy(false);setReport(readReport());}
  };
  const pending=Number(report.pending)||0;
  const healthy=report.online&&report.serverReady&&!pending&&report.status!=='error';
  const statusLabel=!report.online?'Ngoại tuyến':pending?'Chờ đồng bộ ('+pending+')':report.status==='syncing'?'Đang đồng bộ':'Đã đồng bộ';
  const statusColor=healthy?'#0F6E56':report.status==='syncing'?'#185FA5':'#8A5A00';
  const formatTime=value=>{
    if(!value)return '—';
    const date=new Date(value);
    return Number.isNaN(date.getTime())?'—':date.toLocaleString('vi-VN');
  };
  const formatBytes=value=>{
    const bytes=Number(value)||0;
    if(bytes>=1024*1024)return (bytes/1024/1024).toFixed(2)+' MB';
    if(bytes>=1024)return (bytes/1024).toFixed(1)+' KB';
    return bytes+' B';
  };
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-cloud-data-connection',style:{fontSize:20}}),'Đồng bộ dữ liệu'),
    h('div',{className:'g3',style:{marginBottom:'1rem'}},
      h('div',{className:'sc'},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:5}},'TRẠNG THÁI'),h('div',{style:{fontSize:18,fontWeight:700,color:statusColor}},statusLabel)),
      h('div',{className:'sc'},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:5}},'KẾT NỐI MẠNG'),h('div',{style:{fontSize:18,fontWeight:700,color:report.online?'#0F6E56':'#A32D2D'}},report.online?'Đang trực tuyến':'Mất kết nối')),
      h('div',{className:'sc'},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:5}},'MÁY CHỦ DỮ LIỆU'),h('div',{style:{fontSize:18,fontWeight:700,color:report.serverReady?'#0F6E56':'#A32D2D'}},report.serverReady?'Sẵn sàng':'Chưa kết nối'))
    ),
    h('div',{className:'card'},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:12}},
        h('div',null,
          h('div',{style:{fontWeight:700,color:'var(--pri3)'}},pending?'Dữ liệu đang chờ gửi':'Không có dữ liệu chờ'),
          h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:3}},pending?'Mỗi dòng là một nhóm dữ liệu, không phải số bản ghi.':'Các thay đổi trên máy này đã được gửi lên máy chủ.')
        ),
        h('button',{className:'bp',type:'button',onClick:retry,disabled:busy||!report.online||!report.serverReady},
          h('i',{className:'ti '+(busy?'ti-refresh spin':'ti-cloud-upload')}),busy?'Đang thử lại...':'Đồng bộ lại'
        )
      ),
      pending?h('div',{className:'tw'},h('table',null,
        h('thead',null,h('tr',null,h('th',null,'Nhóm dữ liệu'),h('th',null,'Dung lượng gửi'),h('th',null,'Số lần thử lại'),h('th',null,'Thời điểm đưa vào hàng chờ'),h('th',null,'Tình trạng'))),
        h('tbody',null,(report.items||[]).map(item=>h('tr',{key:item.key},
          h('td',null,h('b',null,item.label)),
          h('td',null,formatBytes(item.bytes)),
          h('td',null,item.attempts||0),
          h('td',null,formatTime(item.updatedAt)),
          h('td',null,h('span',{className:'badge',style:{background:'#FFF3CD',color:'#8A5A00'}},'Chờ đồng bộ'))
        )))
      )):h('div',{className:'empty-st',style:{padding:'2rem 1rem'}},h('i',{className:'ti ti-circle-check',style:{fontSize:28,color:'#0F6E56',display:'block',marginBottom:7}}),'Dữ liệu đã được đồng bộ đầy đủ.'),
      report.detail&&h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:10}},'Thông tin gần nhất: '+report.detail)
    )
  );
}

function SupabaseUsageReportTab({employees,materials,assets,prodCats,products,customers,areas,workcats,tasks,nccs,purchases,goodsPurchases,quotes,orders,trips,attendance,advances,rewards,leaves,depts,shifts,prodShifts,prodShiftRules,prodOrders,stock,company}) {
  const [maintenanceVehicle,setMaintenanceVehicle]=useState([]);
  const [maintenanceMachine,setMaintenanceMachine]=useState([]);
  useEffect(()=>{
    let active=true;
    Promise.all([dbGet('scf_maint_vehicle',[]),dbGet('scf_maint_machine',[])]).then(([vehicle,machine])=>{
      if(active){setMaintenanceVehicle(vehicle||[]);setMaintenanceMachine(machine||[]);}
    }).catch(()=>{});
    return()=>{active=false;};
  },[]);
  const sizeOf=v=>new Blob([JSON.stringify(v??null)]).size;
  const rows=[
    ['employees','Nhân viên',employees],
    ['company','Thông tin công ty',company],
    ['materials','Nguyên vật liệu',materials],
    ['assets','Danh mục tài sản',assets],
    ['prodCats','Danh mục SP',prodCats],
    ['products','Sản phẩm',products],
    ['customers','Khách hàng',customers],
    ['areas','Khu vực',areas],
    ['workcats','Công việc',workcats],
    ['tasks','Giao việc',tasks],
    ['nccs','Nhà cung cấp',nccs],
    ['purchases','Đơn mua hàng NVL',purchases],
    ['goodsPurchases','Đơn mua hàng hàng hóa',goodsPurchases],
    ['maintenanceVehicle','Bảo dưỡng xe',maintenanceVehicle],
    ['maintenanceMachine','Bảo dưỡng máy',maintenanceMachine],
    ['quotes','Báo giá',quotes],
    ['orders','Đơn giao hàng',orders],
    ['trips','Chuyến giao hàng',trips],
    ['attendance','Chấm công',attendance],
    ['advances','Ứng lương',advances],
    ['rewards','Thưởng phạt',rewards],
    ['leaves','Xin nghỉ',leaves],
    ['depts','Bộ phận',depts],
    ['shifts','Ca giao hàng',shifts],
    ['prodShifts','Ca sản xuất',prodShifts],
    ['prodShiftRules','Quy tắc ca SX',prodShiftRules],
    ['prodOrders','Đơn sản xuất',prodOrders],
    ['stock','Tồn kho',stock],
  ].map(([key,label,val])=>({key,label,count:Array.isArray(val)?val.length:(val?1:0),bytes:sizeOf(val)})).sort((a,b)=>b.bytes-a.bytes);
  const totalBytes=rows.reduce((s,r)=>s+r.bytes,0);
  const fmtBytes=n=>{
    const abs=Math.abs(n);
    if(abs>=1024*1024*1024) return (n/1024/1024/1024).toFixed(2)+' GB';
    if(abs>=1024*1024) return (n/1024/1024).toFixed(2)+' MB';
    if(abs>=1024) return (n/1024).toFixed(1)+' KB';
    return n+' B';
  };
  const top5=rows.slice(0,5);
  const maxBytes=Math.max(...rows.map(r=>r.bytes),1);
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-database',style:{fontSize:20}}),'Báo cáo dung lượng Supabase'),
    h('div',{className:'card',style:{marginBottom:'1rem',background:'linear-gradient(135deg,#f7fbf9,#eef6f1)'}},
      h('div',{style:{fontSize:12,color:'var(--tx2)',marginBottom:4}},'Dung lượng ước tính'),
      h('div',{style:{fontSize:28,fontWeight:700,color:'var(--pri)'}},fmtBytes(totalBytes)),
      h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:6}},'Tính từ dữ liệu hiện có trong app và các bảng đang đồng bộ lên Supabase qua `kv_store`. Số liệu là ước tính theo JSON.')
    ),
    h('div',{className:'report-grid-2'},
      h('div',{className:'tw'},h('table',null,
        h('thead',null,h('tr',null,...['Bảng dữ liệu','Số bản ghi','Dung lượng'].map(c=>h('th',{key:c},c)))),
        h('tbody',null,rows.length?rows.map(r=>h('tr',{key:r.key},
          h('td',null,h('div',{style:{fontWeight:500}},r.label)),
          h('td',null,r.count.toLocaleString()),
          h('td',null,fmtBytes(r.bytes))
        )):h('tr',null,h('td',{colSpan:3,className:'empty-st'},'Chưa có dữ liệu.')))
      )),
      h('div',{className:'tw'},h('table',null,
        h('thead',null,h('tr',null,...['Top dữ liệu nặng','Số bản ghi','Dung lượng'].map(c=>h('th',{key:c},c)))),
        h('tbody',null,top5.length?top5.map(r=>h('tr',{key:r.key},
          h('td',null,h('div',{style:{fontWeight:500}},r.label)),
          h('td',null,r.count.toLocaleString()),
          h('td',null,fmtBytes(r.bytes))
        )):h('tr',null,h('td',{colSpan:3,className:'empty-st'},'Chưa có dữ liệu.')))
      )),
      h('div',{className:'tw',style:{padding:'10px 12px'}},
        h('div',{style:{fontSize:12,fontWeight:600,color:'var(--tx2)',marginBottom:10}},'Biểu đồ theo bảng'),
        h('div',{style:{display:'flex',flexDirection:'column',gap:10}},
          rows.length?rows.map(r=>h('div',{key:r.key},
            h('div',{style:{display:'flex',justifyContent:'space-between',gap:10,marginBottom:4,fontSize:12}},
              h('span',{style:{fontWeight:500}},r.label),
              h('span',{style:{color:'var(--tx2)'}},fmtBytes(r.bytes))
            ),
            h('div',{style:{height:10,background:'var(--bg2)',borderRadius:999,overflow:'hidden'}},
              h('div',{style:{height:'100%',width:Math.max(3,(r.bytes/maxBytes)*100)+'%',background:'linear-gradient(90deg,var(--pri),var(--pri2))',borderRadius:999}})
            )
          )):h('div',{className:'empty-st',style:{padding:'1rem 0'}},'Chưa có dữ liệu.')
        )
      )
    )
  );
}

/* --- Báo cáo bán hàng --- */
function SalesReportTab({orders,customers,products,shifts,quotes}) {
  const _td2=fmtDate();const _ti2=_td2.split('/').reverse().join('-');const _mr2=reportMonthDateRange(_ti2.slice(0,7));const [df,sdf]=useState(_mr2.from); const [dt,sdt]=useState(_mr2.to);
  const [period,setPeriod]=useState('month'); const [monthVal,setMonthVal]=useState(_ti2.slice(0,7)); const [weekVal,setWeekVal]=useState('');
  const [cust,sCust]=useState(''); const [pt,sPt]=useState(''); const [prod,sProd]=useState(''); const [status,ss]=useState('all'); const [area,sa]=useState('all'); const [shift,ssh]=useState('all'); const [quoteStatus,setQuoteStatus]=useState('all');
  const parseDate=s=>{if(!s)return null;const v=String(s).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(v)){const[y,m,d]=v.split('-');return new Date(Number(y),Number(m)-1,Number(d));}const[d,m,y]=v.split('/');return new Date(Number(y),Number(m)-1,Number(d));};
  const isoOf=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const setMonthRange=v=>{setMonthVal(v);if(!v)return;const[y,m]=v.split('-').map(Number);const a=new Date(y,m-1,1);const b=new Date(y,m,0);sdf(isoOf(a));sdt(isoOf(b));};
  const setWeekRange=v=>{setWeekVal(v);if(!v)return;const[y,w]=v.split('-W').map(Number);const jan4=new Date(y,0,4);const monday=new Date(jan4);monday.setDate(jan4.getDate()-((jan4.getDay()+6)%7)+(w-1)*7);const sunday=new Date(monday);sunday.setDate(monday.getDate()+6);sdf(isoOf(monday));sdt(isoOf(sunday));};
  const inRange=d=>{const dt2=parseDate(d);if(!dt2||Number.isNaN(dt2.getTime()))return false;const f2=df?parseDate(df):null;const t=dt?parseDate(dt):null;if(f2&&dt2<f2)return false;if(t&&dt2>t)return false;return true;};
  const getPoint=o=>{
    const targetName=String(o.pointName||'').trim();
    if(targetName)for(const c of (customers||[]))for(const p of (c.points||[]))if(String(p.name||'').trim()===targetName)return{...p,customerName:c.name,customerId:c.id};
    for(const c of (customers||[]))for(const p of (c.points||[]))if(p.id===o.pointId||p.id===o.ptId)return{...p,customerName:c.name,customerId:c.id};
    return{};
  };
  const orderArea=o=>o.area||getPoint(o).area||((shifts||[]).find(s=>s.id===o.shiftId||s.id===o.prodShiftId)||{}).area||'';
  const orderShift=o=>o.prodShiftId||o.shiftId||((shifts||[]).find(s=>s.timeStart===o.deliveryTime)||{}).id||'';
  const statusLabel={pending:'Chờ xếp',scheduled:'Đã xếp',assigned:'Đã xếp',delivering:'Đang giao',done:'Đã giao',cancelled:'Hủy'};
  const dateKey=s=>{const d=parseDate(s);return d&&Number.isFinite(d.getTime())?d.getTime():0;};
  const quotePrice=(o,l)=>{
    const pInfo=getPoint(o);
    const od=dateKey(o.deliveryDate);
    const usable=(quotes||[]).filter(q=>{
      if(['cancelled','expired'].includes(q.status))return false;
      if(q.customerId&&q.customerId!==(o.customerId||o.custId||pInfo.customerId))return false;
      if(q.customer&&o.customer&&q.customer!==o.customer)return false;
      const pts=q.pointIds||(q.pointId?[q.pointId]:[]);
      const pointNames=q.pointNames||[];
      const qAreas=q.areaNames||[];
      if(!pts.length&&!pointNames.length&&!qAreas.length)return false;
      const orderPointName=String(o.pointName||pInfo.name||'').trim();
      const pointOk=pointNames.length?pointNames.some(name=>String(name||'').trim()===orderPointName):(pts.length&&pts.includes(o.pointId||o.ptId||pInfo.id));
      const areaOk=qAreas.length&&qAreas.includes(orderArea(o));
      if(!pointOk&&!areaOk)return false;
      if(q.dateFrom&&od<dateKey(q.dateFrom))return false;
      if(q.dateTo&&od>dateKey(q.dateTo))return false;
      return (q.lines||[]).some(ql=>ql.productId===l.productId||(ql.productName&&ql.productName===l.productName));
    }).sort((a,b)=>dateKey(b.dateFrom)-dateKey(a.dateFrom));
    const q=usable[0];
    const ql=q&&(q.lines||[]).find(x=>x.productId===l.productId||(x.productName&&x.productName===l.productName));
    return ql?numFmt(ql.price):0;
  };
  const salePrice=(o,l,p2)=>{
    const fromLine=numFmt(l.salePrice||l.sellPrice||l.unitPrice);
    if(fromLine)return fromLine;
    const fromQuote=quotePrice(o,l);
    if(fromQuote)return fromQuote;
    const fromProduct=numFmt(p2.salePrice||p2.sellPrice||p2.priceSale||p2.price||0);
    if(fromProduct)return fromProduct;
    return l.purchasePrice?0:numFmt(l.price||0);
  };
  const filtered=(orders||[]).filter(o=>{
    if(!inRange(o.deliveryDate))return false;
    if(cust&&o.custId!==cust&&o.customerId!==cust)return false;
    if(pt&&o.ptId!==pt&&o.pointId!==pt)return false;
    if(status!=='all'&&o.status!==status)return false;
    if(area!=='all'&&orderArea(o)!==area)return false;
    if(shift!=='all'&&orderShift(o)!==shift)return false;
    const relevantLines=(o.lines||[]).filter(l=>!prod||l.productId===prod);
    if(prod&&!relevantLines.length)return false;
    if(quoteStatus!=='all'){
      const quotedCount=relevantLines.filter(l=>quotePrice(o,l)>0).length;
      const hasAny=quotedCount>0;
      const hasMissing=relevantLines.length===0||quotedCount<relevantLines.length;
      if(quoteStatus==='complete'&&hasMissing)return false;
      if(quoteStatus==='missing'&&!hasMissing)return false;
      if(quoteStatus==='none'&&hasAny)return false;
    }
    return true;
  });
  const active=filtered.filter(o=>o.status!=='cancelled');
  const filtLines=active.flatMap(o=>(o.lines||[]).filter(l=>!prod||l.productId===prod).map(l=>{
    const p2=products.find(x=>x.id===l.productId)||{};
    const qtyProd=numFmt(l.qtyProd)||numFmt(l.qty)||numFmt(l.quantity)||0;
    const qtyInv=numFmt(l.qtyInvoice)||qtyProd;
    const qtyDelivered=l.qtyDelivered!==undefined&&l.qtyDelivered!==''?numFmt(l.qtyDelivered):'';
    const price=salePrice(o,l,p2);
    const unit=String(l.unit||p2.unit||'');
    const qtyForWeight=qtyInv||qtyProd;
    const unitKey=unit.trim().toLowerCase().replace(/[^a-z]/g,'');
    const weight=(unitKey==='kg'||unitKey==='kgs'||unitKey==='kilogram'||unitKey==='kilograms')?qtyForWeight:(numFmt(p2.weightPerUnit)||numFmt(l.weightPerUnit)||0)*qtyForWeight;
    return {...l,orderId:o.id,date:o.deliveryDate,time:o.deliveryTime||'',customer:o.customer||getPoint(o).customerName||'',point:o.pointName||getPoint(o).name||'',area:orderArea(o),status:o.status,invoiceNo:o.invoiceNo||'',productName:l.productName||p2.name||'',unit,qtyProd,qtyInv,qtyDelivered,price,amount:qtyInv*price,weight};
  }));
  const totalQtyProd=filtLines.reduce((s,l)=>s+l.qtyProd,0);
  const totalQtyInv=filtLines.reduce((s,l)=>s+l.qtyInv,0);
  const totalDelivered=filtLines.reduce((s,l)=>s+(l.qtyDelivered===''?0:l.qtyDelivered),0);
  const totalWeight=filtLines.reduce((s,l)=>s+l.weight,0);
  const totalAmount=filtLines.reduce((s,l)=>s+l.amount,0);
  const missingPrice=filtLines.filter(l=>!l.price).length;
  const byProd={};filtLines.forEach(l=>{const k=l.productId||l.productName;if(!byProd[k])byProd[k]={name:l.productName,unit:l.unit,qtyProd:0,qtyInv:0,qtyDelivered:0,weight:0,amount:0};byProd[k].qtyProd+=l.qtyProd;byProd[k].qtyInv+=l.qtyInv;byProd[k].qtyDelivered+=l.qtyDelivered===''?0:l.qtyDelivered;byProd[k].weight+=l.weight;byProd[k].amount+=l.amount;});
  const sxName=name=>String(name||'').replace(/\s+/g,' ').replace(/\s*,\s*\d+(?:[.,]\d+)?\s*KG\s*\/\s*PAC\b/ig,'').replace(/\s+\d+(?:[.,]\d+)?\s*KG\s*\/\s*PAC\b/ig,'').replace(/\s*,\s*PAC\b/ig,'').trim().toUpperCase();
  const byProdKg={};filtLines.forEach(l=>{const k=sxName(l.productName);if(!k)return;if(!byProdKg[k])byProdKg[k]={name:k,qtyInv:0,qtyDelivered:0,weight:0};byProdKg[k].qtyInv+=l.qtyInv;byProdKg[k].qtyDelivered+=l.qtyDelivered===''?0:l.qtyDelivered;byProdKg[k].weight+=l.weight;});
  const byCust={};active.forEach(o=>{const name=o.customer||getPoint(o).customerName||'Chưa rõ KH';if(!byCust[name])byCust[name]={orders:0,lines:0,qty:0,weight:0,amount:0};byCust[name].orders++;(o.lines||[]).forEach(l=>{if(prod&&l.productId!==prod)return;const p2=products.find(x=>x.id===l.productId)||{};const q=numFmt(l.qtyInvoice)||numFmt(l.qtyProd)||numFmt(l.qty)||0;byCust[name].lines++;byCust[name].qty+=q;byCust[name].weight+=(String(l.unit||p2.unit||'').toLowerCase().includes('kg')?q:(numFmt(p2.weightPerUnit)||0)*q);byCust[name].amount+=q*numFmt(l.price||l.salePrice||p2.price||0);});});
  const byArea={};filtLines.forEach(l=>{const k=l.area||'Chưa có KV';if(!byArea[k])byArea[k]={orders:new Set(),qty:0,weight:0,amount:0};byArea[k].orders.add(l.orderId);byArea[k].qty+=l.qtyInv;byArea[k].weight+=l.weight;byArea[k].amount+=l.amount;});
  const detailRows=filtLines.map(l=>({date:l.date,time:l.time,orderId:l.orderId,customer:l.customer,point:l.point,area:l.area,productName:l.productName,unit:l.unit,qtyProd:l.qtyProd,qtyInvoice:l.qtyInv,qtyDelivered:l.qtyDelivered,weight:l.weight,price:l.price,amount:l.amount,status:statusLabel[l.status]||l.status,invoiceNo:l.invoiceNo}));
  const selCust=customers.find(c=>c.id===cust);
  const areas=[...new Set((customers||[]).flatMap(c=>(c.points||[]).map(p=>p.area).filter(Boolean)).concat((orders||[]).map(o=>orderArea(o)).filter(Boolean)))].sort();
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-chart-line',style:{fontSize:20}}),'Báo cáo bán hàng'),
    h('div',{className:'card',style:{marginBottom:'1.25rem'}},
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'0 1rem'}},
        h(F,{label:'Kiểu lọc'},h('select',{value:period,onChange:e=>setPeriod(e.target.value)},
          h('option',{value:'day'},'Theo ngày'),
          h('option',{value:'week'},'Theo tuần'),
          h('option',{value:'month'},'Theo tháng'),
          h('option',{value:'custom'},'Tùy chọn')
        )),
        period==='month'&&h(F,{label:'Chọn tháng'},h('input',{type:'month',value:monthVal,onChange:e=>setMonthRange(e.target.value)})),
        period==='week'&&h(F,{label:'Chọn tuần'},h('input',{type:'week',value:weekVal,onChange:e=>setWeekRange(e.target.value)})),
        h(F,{label:'Từ ngày'},h('input',{type:'date',value:df,onChange:e=>sdf(e.target.value)})),
        h(F,{label:'Đến ngày'},h('input',{type:'date',value:dt,onChange:e=>sdt(e.target.value)})),
        h(F,{label:'Khách hàng'},h('select',{value:cust,onChange:e=>{sCust(e.target.value);sPt('');}},h('option',{value:''},'Tất cả KH'),customers.map(c=>h('option',{key:c.id,value:c.id},c.name)))),
        h(F,{label:'Địa điểm giao'},h('select',{value:pt,onChange:e=>sPt(e.target.value),disabled:!selCust},h('option',{value:''},'Tất cả địa điểm'),(selCust?.points||[]).map(p2=>h('option',{key:p2.id,value:p2.id},p2.name)))),
        h(F,{label:'Khu vực'},h('select',{value:area,onChange:e=>sa(e.target.value)},h('option',{value:'all'},'Tất cả khu vực'),areas.map(a=>h('option',{key:a,value:a},a)))),
        h(F,{label:'Ca / giờ'},h('select',{value:shift,onChange:e=>ssh(e.target.value)},h('option',{value:'all'},'Tất cả ca'),(shifts||[]).map(s=>h('option',{key:s.id,value:s.id},(s.timeStart?s.timeStart+' - ':'')+s.name+(s.area?' - '+s.area:''))))),
        h(F,{label:'Sản phẩm'},h('select',{value:prod,onChange:e=>sProd(e.target.value)},h('option',{value:''},'Tất cả SP'),products.map(p2=>h('option',{key:p2.id,value:p2.id},p2.name)))),
        h(F,{label:'Trạng thái'},h('select',{value:status,onChange:e=>ss(e.target.value)},h('option',{value:'all'},'Tất cả trạng thái'),Object.entries(statusLabel).map(([v,l])=>h('option',{key:v,value:v},l)))),
        h(F,{label:'Tình trạng báo giá'},h('select',{value:quoteStatus,onChange:e=>setQuoteStatus(e.target.value)},
          h('option',{value:'all'},'Tất cả đơn'),
          h('option',{value:'complete'},'Đủ báo giá'),
          h('option',{value:'missing'},'Thiếu báo giá'),
          h('option',{value:'none'},'Không có báo giá')
        ))
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'1rem',marginTop:4}},
        [['Số đơn hàng',filtered.length+' đơn','ti-file-invoice'],['SL Đặt',totalQtyProd.toLocaleString(),'ti-building-factory'],['SL hóa đơn',totalQtyInv.toLocaleString(),'ti-receipt'],['SL đã giao',totalDelivered.toLocaleString(),'ti-truck-delivery'],['Tổng khối lượng',totalWeight.toFixed(2)+' kg','ti-weight'],['Doanh thu',totalAmount?totalAmount.toLocaleString('vi-VN')+'đ':'—','ti-cash'],['Thiếu giá bán',missingPrice+' dòng','ti-alert-circle']].map(([l,v,ic])=>
          h('div',{key:l,style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},
            h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4,display:'flex',alignItems:'center',gap:5}},h('i',{className:'ti '+ic,style:{fontSize:12}}),l),
            h('div',{style:{fontSize:20,fontWeight:600,color:'var(--pri)'}},v)
          )
        )
      ),
      h('div',{style:{display:'flex',justifyContent:'flex-end',marginTop:10}},
        h(ExportBtn,{onClick:()=>xlsxExport(detailRows,[['date','Ngày giao'],['time','Giờ'],['orderId','Mã đơn'],['customer','Khách hàng'],['point','Địa điểm'],['area','Khu vực'],['productName','Sản phẩm'],['unit','ĐVT'],['qtyProd','SL Đặt'],['qtyInvoice','SL HĐ'],['qtyDelivered','SL đã giao'],['weight','Kg'],['price','Đơn giá'],['amount','Thành tiền'],['status','Trạng thái'],['invoiceNo','Hóa đơn']],'Bao_cao_ban_hang')})
      )
    ),
    h('div',{className:'mobile-only report-mobile-section'},
      Object.keys(byProd).length?Object.entries(byProd).map(([id,v])=>h('div',{key:'mprod_'+id,className:'mobile-data-card'},
        h('div',{className:'mobile-data-head'},
          h('div',null,
            h('div',{className:'mobile-data-title'},v.name),
            h('div',{className:'mobile-data-sub'},v.unit||'—')
          ),
          h('div',{className:'mobile-data-sub'},v.amount?v.amount.toLocaleString('vi-VN')+'đ':'—')
        ),
        h('div',{className:'mobile-data-grid'},
          h('div',{className:'mobile-data-item'},h('b',null,'SL Đặt'),h('span',null,v.qtyProd.toLocaleString())),
          h('div',{className:'mobile-data-item'},h('b',null,'SL HĐ'),h('span',null,v.qtyInv.toLocaleString())),
          h('div',{className:'mobile-data-item'},h('b',null,'SL giao'),h('span',null,v.qtyDelivered.toLocaleString())),
          h('div',{className:'mobile-data-item'},h('b',null,'Kg'),h('span',null,v.weight.toFixed(2)))
        )
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có dữ liệu sản phẩm.')
    ),
    h('div',{className:'mobile-only report-mobile-section'},
      Object.keys(byCust).length?Object.entries(byCust).map(([name,v])=>h('div',{key:'mcust_'+name,className:'mobile-data-card'},
        h('div',{className:'mobile-data-head'},
          h('div',{className:'mobile-data-title'},name),
          h('div',{className:'mobile-data-sub'},v.orders+' đơn')
        ),
        h('div',{className:'mobile-data-grid'},
          h('div',{className:'mobile-data-item'},h('b',null,'Mặt hàng'),h('span',null,v.lines)),
          h('div',{className:'mobile-data-item'},h('b',null,'SL HĐ'),h('span',null,v.qty.toLocaleString())),
          h('div',{className:'mobile-data-item'},h('b',null,'Kg'),h('span',null,v.weight.toFixed(2))),
          h('div',{className:'mobile-data-item'},h('b',null,'Doanh thu'),h('span',null,v.amount?v.amount.toLocaleString('vi-VN')+'đ':'—'))
        )
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có dữ liệu khách hàng.')
    ),
    h('div',{className:'report-grid-2 desktop-only'},
      h('div',null,
        h('div',{style:{fontWeight:600,color:'var(--pri3)',margin:'0 0 6px 4px'}},'Thống kê sản phẩm'),
        h('div',{className:'tw'},h('table',null,
          h('thead',null,h('tr',null,...['Sản phẩm','ĐVT','SL Đặt','SL HĐ','SL giao','Kg','Doanh thu'].map(c=>h('th',{key:c},c)))),
          h('tbody',null,Object.keys(byProd).length?Object.entries(byProd).map(([id,v])=>h('tr',{key:id},
            h('td',null,h('div',{style:{fontWeight:500}},v.name)),h('td',null,h('span',{className:'badge sbadge'},v.unit||'—')),
            h('td',null,h('span',{style:{fontWeight:600,color:'var(--pri)'}},v.qtyProd.toLocaleString())),
            h('td',null,h('span',{style:{fontWeight:600}},v.qtyInv.toLocaleString())),
            h('td',null,v.qtyDelivered.toLocaleString()),h('td',null,v.weight.toFixed(2)),
            h('td',null,v.amount?v.amount.toLocaleString('vi-VN')+'đ':'—')
          )):h('tr',null,h('td',{colSpan:7,className:'empty-st'},'Chưa có dữ liệu sản phẩm.')))
        ))
      ),
      h('div',{className:'tw'},h('table',null,
        h('thead',null,h('tr',null,...['Khách hàng','Số đơn','Số mặt hàng','SL HĐ','Kg','Doanh thu'].map(c=>h('th',{key:c},c)))),
        h('tbody',null,Object.keys(byCust).length?Object.entries(byCust).map(([name,v])=>h('tr',{key:name},h('td',null,h('div',{style:{fontWeight:500}},name)),h('td',null,v.orders+' đơn'),h('td',null,v.lines+' mặt hàng'),h('td',null,v.qty.toLocaleString()),h('td',null,v.weight.toFixed(2)),h('td',null,v.amount?v.amount.toLocaleString('vi-VN')+'đ':'—'))):h('tr',null,h('td',{colSpan:6,className:'empty-st'},'Chưa có dữ liệu khách hàng.')))
      ))
    ),
    h('div',{className:'mobile-only report-mobile-section'},
      Object.keys(byProdKg).length?Object.entries(byProdKg).map(([id,v])=>h('div',{key:'mkg_'+id,className:'mobile-data-card'},
        h('div',{className:'mobile-data-head'},
          h('div',{className:'mobile-data-title'},v.name),
          h('div',{className:'mobile-data-sub'},v.weight.toFixed(2)+' kg')
        ),
        h('div',{className:'mobile-data-grid'},
          h('div',{className:'mobile-data-item'},h('b',null,'SL HĐ'),h('span',null,v.qtyInv.toLocaleString())),
          h('div',{className:'mobile-data-item'},h('b',null,'SL giao'),h('span',null,v.qtyDelivered.toLocaleString()))
        )
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có dữ liệu quy đổi kg.')
    ),
    h('div',{className:'desktop-only'},
      h('div',{style:{fontWeight:600,color:'var(--pri3)',margin:'0 0 6px 4px'}},'Thống kê sản phẩm quy đổi kg'),
      h('div',{className:'tw',style:{marginBottom:'1rem'}},h('table',null,
        h('thead',null,h('tr',null,...['Sản phẩm SX','SL hóa đơn','SL đã giao','Kg'].map(c=>h('th',{key:c},c)))),
        h('tbody',null,Object.keys(byProdKg).length?Object.entries(byProdKg).map(([id,v])=>h('tr',{key:'kg_'+id},
          h('td',null,h('div',{style:{fontWeight:500}},v.name)),
          h('td',null,h('span',{style:{fontWeight:600}},v.qtyInv.toLocaleString())),
          h('td',null,v.qtyDelivered.toLocaleString()),
          h('td',null,h('span',{style:{fontWeight:650,color:'var(--pri)'}},v.weight.toFixed(2)+' kg'))
        )):h('tr',null,h('td',{colSpan:4,className:'empty-st'},'Chưa có dữ liệu quy đổi kg.')))
      ))
    ),
    h('div',{className:'mobile-only report-mobile-section'},
      Object.keys(byArea).length?Object.entries(byArea).map(([name,v])=>h('div',{key:'marea_'+name,className:'mobile-data-card'},
        h('div',{className:'mobile-data-head'},
          h('div',{className:'mobile-data-title'},name),
          h('div',{className:'mobile-data-sub'},v.orders.size+' đơn')
        ),
        h('div',{className:'mobile-data-grid'},
          h('div',{className:'mobile-data-item'},h('b',null,'SL HĐ'),h('span',null,v.qty.toLocaleString())),
          h('div',{className:'mobile-data-item'},h('b',null,'Kg'),h('span',null,v.weight.toFixed(2))),
          h('div',{className:'mobile-data-item'},h('b',null,'Doanh thu'),h('span',null,v.amount?v.amount.toLocaleString('vi-VN')+'đ':'—'))
        )
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có dữ liệu khu vực.')
    ),
    h('div',{className:'tw desktop-only',style:{marginBottom:'1rem'}},h('table',null,
      h('thead',null,h('tr',null,...['Khu vực','Số đơn','SL HĐ','Kg','Doanh thu'].map(c=>h('th',{key:c},c)))),
      h('tbody',null,Object.keys(byArea).length?Object.entries(byArea).map(([name,v])=>h('tr',{key:name},h('td',null,h('b',null,name)),h('td',null,v.orders.size+' đơn'),h('td',null,v.qty.toLocaleString()),h('td',null,v.weight.toFixed(2)),h('td',null,v.amount?v.amount.toLocaleString('vi-VN')+'đ':'—'))):h('tr',null,h('td',{colSpan:5,className:'empty-st'},'Chưa có dữ liệu khu vực.')))
    )),
    h('div',{className:'mobile-only report-mobile-section'},
      detailRows.length?detailRows.map((r,i)=>h('div',{key:'msale_'+r.orderId+'_'+i,className:'mobile-data-card'},
        h('div',{className:'mobile-data-head'},
          h('div',null,
            h('div',{className:'mobile-data-title'},r.productName),
            h('div',{className:'mobile-data-sub'},r.customer+' • '+(r.point||'—'))
          ),
          h('div',{className:'mobile-data-sub'},r.date+' '+(r.time||''))
        ),
        h('div',{className:'mobile-data-grid'},
          h('div',{className:'mobile-data-item'},h('b',null,'SL HĐ'),h('span',null,r.qtyInvoice.toLocaleString())),
          h('div',{className:'mobile-data-item'},h('b',null,'SL giao'),h('span',null,r.qtyDelivered===''?'—':r.qtyDelivered.toLocaleString())),
          h('div',{className:'mobile-data-item'},h('b',null,'Kg'),h('span',null,r.weight.toFixed(2))),
          h('div',{className:'mobile-data-item'},h('b',null,'Doanh thu'),h('span',null,r.amount?r.amount.toLocaleString('vi-VN')+'đ':'—'))
        ),
        h('div',{className:'mobile-data-sub'},'KV: '+(r.area||'—')+' • Trạng thái: '+r.status)
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có chi tiết bán hàng.')
    ),
    h('div',{className:'tw desktop-only'},h('table',null,
      h('thead',null,h('tr',null,...['Ngày','Giờ','Mã đơn','Khách hàng','Địa điểm','KV','Sản phẩm','SL Đặt','SL HĐ','SL giao','Kg','Đơn giá','Doanh thu','Trạng thái'].map(c=>h('th',{key:c},c)))),
      h('tbody',null,detailRows.length?detailRows.map((r,i)=>h('tr',{key:r.orderId+'_'+i},h('td',null,r.date),h('td',null,r.time||'—'),h('td',null,r.orderId),h('td',null,r.customer),h('td',null,r.point),h('td',null,h('span',{className:'badge sbadge'},r.area||'—')),h('td',null,r.productName),h('td',null,r.qtyProd.toLocaleString()),h('td',null,r.qtyInvoice.toLocaleString()),h('td',null,r.qtyDelivered===''?'—':r.qtyDelivered.toLocaleString()),h('td',null,r.weight.toFixed(2)),h('td',null,r.price?r.price.toLocaleString('vi-VN')+'đ':h('span',{style:{color:'#A32D2D'}},'Thiếu giá')),h('td',null,r.amount?r.amount.toLocaleString('vi-VN')+'đ':'—'),h('td',null,r.status))):h('tr',null,h('td',{colSpan:14,className:'empty-st'},'Chưa có chi tiết bán hàng.')))
    ))
  );
}
