/* ─── Tổng hợp sản xuất ─── */
function ProductionSummaryTab({orders,products,prodShifts,prodShiftRules,prodActuals,setProdActuals,currentUser}){
  const[date,setDate]=useState(fmtDate());
  const[shift,setShift]=useState('all');
  const rules=(prodShiftRules&&prodShiftRules.length?prodShiftRules:DEF_PROD_SHIFT_RULES);
  const actualKey=(prodDate,shiftId,productId)=>[prodDate||'',shiftId||'',productId||''].join('|');
  const readActualQty=(prodDate,shiftId,productId)=>{
    const rec=(prodActuals||{})[actualKey(prodDate,shiftId,productId)];
    return rec&&rec.qty!==undefined&&rec.qty!==null?numFmt(rec.qty):'';
  };
  const readBadQty=(prodDate,shiftId,productId)=>{
    const rec=(prodActuals||{})[actualKey(prodDate,shiftId,productId)];
    return rec&&rec.badQty!==undefined&&rec.badQty!==null?numFmt(rec.badQty):'';
  };
  const saveActuals=(prodDate,shiftId,productId,productName,data)=>{
    const key=actualKey(prodDate,shiftId,productId);
    const nextQty=data&&data.qty!==undefined?(data.qty===''?'':numFmt(data.qty)):undefined;
    const nextBadQty=data&&data.badQty!==undefined?(data.badQty===''?'':numFmt(data.badQty)):undefined;
    setProdActuals(prev=>{
      const base=prev||{};
      const next={...base};
      const current=next[key]||{};
      const merged={
        ...current,
        ...(nextQty!==undefined?{qty:nextQty}:{}),
        ...(nextBadQty!==undefined?{badQty:nextBadQty}:{})
      };
      const emptyQty=merged.qty===''||merged.qty===undefined||merged.qty===null;
      const emptyBadQty=merged.badQty===''||merged.badQty===undefined||merged.badQty===null;
      if(emptyQty&&emptyBadQty){
        delete next[key];
      }else{
        next[key]={...merged,date:prodDate,shiftId,productId,productName,updatedAt:fmtDT(),updatedBy:currentUser?.name||''};
      }
      return next;
    });
  };

  // Aggregate from delivery orders
  const dayOrders=orders.filter(o=>o.status!=='cancelled');
  const aggMap={};
  dayOrders.forEach(o=>{
    const plans=prodShiftPlansForOrder(o,prodShifts||[]);
    (o.lines||[]).forEach((l,idx)=>{
      if(!l.productId)return;
      const plan=plans[idx]||prodShiftPlan(o,prodShifts||[]);
      const prodTime=l.shiftOverride?(l.prodTime||plan?.prodTime||''):(plan?.prodTime||'');
      const prodDate=l.shiftOverride?(l.prodDate||plan?.prodDate||o.deliveryDate):(plan?.prodDate||o.deliveryDate);
      if(prodDate!==date)return;
      const rule=getProdWorkShiftRule(prodTime,rules)||{id:'unknown',name:'Chưa xác định',group:'Chưa xác định',color:'#F1EFE8',textColor:'#5F5E5A'};
      const key=l.productId+'_'+rule.id;
      if(!aggMap[key])aggMap[key]={productId:l.productId,productName:l.productName,unit:l.unit,shift:rule.id,shiftName:rule.name,shiftGroup:rule.group,rule,qtyProd:0,orders:[],prodDate:date};
      aggMap[key].qtyProd+=numFmt(l.qtyProd);
      aggMap[key].orders.push(o.id);
    });
  });
  // Sort theo thứ tự sản phẩm trong bảng sản phẩm (products array)
  const prodOrder=Object.fromEntries(products.map((p,i)=>[p.id,i]));
  const sortByProdOrder=(a,b)=>{
    const ai=prodOrder[a.productId]??9999;
    const bi=prodOrder[b.productId]??9999;
    return ai-bi;
  };
  const rows=Object.values(aggMap).filter(r=>shift==='all'||r.shift===shift);
  const unknownRule={id:'unknown',name:'Chưa xác định',group:'Chưa xác định',start:'',end:'',color:'#F1EFE8',textColor:'#5F5E5A'};
  const shiftGroups=[...rules,unknownRule].map(rule=>({rule,rows:rows.filter(r=>r.shift===rule.id).sort(sortByProdOrder)})).filter(g=>g.rows.length);
  const sumActualRows=list=>list.reduce((sum,r)=>sum+numFmt(readActualQty(r.prodDate,r.shift,r.productId)),0);
  const sumBadRows=list=>list.reduce((sum,r)=>sum+numFmt(readBadQty(r.prodDate,r.shift,r.productId)),0);
  const readGoodQty=(prodDate,shiftId,productId)=>numFmt(readActualQty(prodDate,shiftId,productId))-numFmt(readBadQty(prodDate,shiftId,productId));
  const isInvalidActualRow=(prodDate,shiftId,productId)=>numFmt(readBadQty(prodDate,shiftId,productId))>numFmt(readActualQty(prodDate,shiftId,productId));
  const calcBadRate=(actualQty,badQty)=>numFmt(actualQty)>0?(numFmt(badQty)/numFmt(actualQty))*100:0;
  const fmtRate=rate=>((Math.round(numFmt(rate)*10)/10).toLocaleString('vi-VN'))+'%';
  const sumGoodRows=list=>list.reduce((sum,r)=>sum+readGoodQty(r.prodDate,r.shift,r.productId),0);
  const hasInvalidRows=list=>list.some(r=>isInvalidActualRow(r.prodDate,r.shift,r.productId));
  const majorGroupMap={};
  const majorGroupOrder=[];
  shiftGroups.forEach(g=>{
    const gName=g.rule.group||'Chưa xác định';
    const qtyProd=g.rows.reduce((sum,r)=>sum+numFmt(r.qtyProd),0);
    const qtyActual=sumActualRows(g.rows);
    const qtyBad=sumBadRows(g.rows);
    const qtyGood=sumGoodRows(g.rows);
    const badRate=calcBadRate(qtyActual,qtyBad);
    const hasInvalid=hasInvalidRows(g.rows);
    if(!majorGroupMap[gName]){
      majorGroupMap[gName]={
        name:gName,
        shifts:[],
        qtyProd:0,
        qtyActual:0,
        qtyBad:0,
        qtyGood:0,
        badRate:0,
        hasInvalid:false,
        rowCount:0,
        color:g.rule.color||'#EAF3DE',
        textColor:g.rule.textColor||'var(--pri3)'
      };
      majorGroupOrder.push(gName);
    }
    majorGroupMap[gName].shifts.push({...g,qtyProd,qtyActual,qtyBad,qtyGood,badRate,hasInvalid});
    majorGroupMap[gName].qtyProd+=qtyProd;
    majorGroupMap[gName].qtyActual+=qtyActual;
    majorGroupMap[gName].qtyBad+=qtyBad;
    majorGroupMap[gName].qtyGood+=qtyGood;
    majorGroupMap[gName].badRate=calcBadRate(majorGroupMap[gName].qtyActual,majorGroupMap[gName].qtyBad);
    majorGroupMap[gName].hasInvalid=majorGroupMap[gName].hasInvalid||hasInvalid;
    majorGroupMap[gName].rowCount+=g.rows.length;
  });
  const majorGroups=majorGroupOrder.map(name=>majorGroupMap[name]).filter(Boolean);

  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-clipboard-list',style:{fontSize:20}}),'Tổng hợp sản xuất'),
    h('div',{className:'card',style:{marginBottom:'1.25rem'}},
      h('div',{className:'g3'},
        h(F,{label:'Ngày sản xuất'},h('input',{type:'date',value:toIsoDate(date),onChange:e=>setDate(vnDateFromISO(e.target.value)||''),placeholder:'DD/MM/YYYY'})),
        h(F,{label:'Ca sản xuất'},h('select',{value:shift,onChange:e=>setShift(e.target.value)},
          h('option',{value:'all'},'Tất cả ca'),
          rules.map(r=>h('option',{key:r.id,value:r.id},r.name))
        )),
        h('div',{style:{display:'flex',flexDirection:'column',justifyContent:'flex-end'}},
          h('div',{style:{fontSize:13,color:'var(--tx2)',marginBottom:4}},'Số dòng sản xuất ngày này'),
          h('div',{style:{fontSize:20,fontWeight:600,color:'var(--pri)'}},rows.length+' dòng')
        )
      )
    ),
    rows.length===0?h('div',{style:{textAlign:'center',padding:'3rem',color:'var(--tx2)',background:'#fff',borderRadius:'var(--rl)',border:'.5px solid var(--bd)'}},
      h('i',{className:'ti ti-clipboard-x',style:{fontSize:56,display:'block',marginBottom:'1rem',color:'var(--pri2)'}}),
      'Không có dữ liệu sản xuất cho ngày '+date
    ):h('div',null,
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'1rem',marginBottom:'1.25rem'}},
        majorGroups.map(g=>h('div',{key:'sum_'+g.name,className:'card',style:{padding:'1rem',border:`1px solid ${g.hasInvalid?'#FCA5A5':g.color}`,boxShadow:'none',background:'linear-gradient(180deg,#fff,rgba(255,255,255,.96))'}},
          h('div',{style:{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start'}},
            h('div',null,
              h('div',{style:{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',color:g.textColor}},g.name),
              h('div',{style:{fontSize:12,color:g.hasInvalid?'#B91C1C':'var(--tx2)',marginTop:4}},g.hasInvalid?'Có dòng nhập lỗi cần kiểm tra':g.shifts.length+' ca nhỏ · '+g.rowCount+' dòng')
            ),
            h('div',{style:{padding:'4px 10px',borderRadius:999,background:g.color,color:g.textColor,fontSize:12,fontWeight:600}},g.shifts.map(s=>s.rule.name.replace((g.name||'')+' ','')).join(' • '))
          ),
          h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,marginTop:'1rem'}},
            h('div',{style:{padding:'10px 12px',borderRadius:'var(--r)',background:'var(--bg)'}},
              h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng SL đặt'),
              h('div',{style:{fontSize:24,fontWeight:700,color:'var(--pri3)'}},g.qtyProd.toLocaleString())
            ),
            h('div',{style:{padding:'10px 12px',borderRadius:'var(--r)',background:'#F8FBF9'}},
              h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng SL SX'),
              h('div',{style:{fontSize:24,fontWeight:700,color:'var(--pri)'}},g.qtyActual.toLocaleString())
            ),
            h('div',{style:{padding:'10px 12px',borderRadius:'var(--r)',background:'#FFF7ED'}},
              h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng hàng lỗi'),
              h('div',{style:{fontSize:24,fontWeight:700,color:'#C2410C'}},g.qtyBad.toLocaleString())
            ),
            h('div',{style:{padding:'10px 12px',borderRadius:'var(--r)',background:g.hasInvalid?'#FEF2F2':'#F0FDF4'}},
              h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng SL đạt'),
              h('div',{style:{fontSize:24,fontWeight:700,color:g.hasInvalid?'#B91C1C':'#15803D'}},g.qtyGood.toLocaleString())
            ),
            h('div',{style:{padding:'10px 12px',borderRadius:'var(--r)',background:'#EFF6FF'}},
              h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tỷ lệ lỗi'),
              h('div',{style:{fontSize:24,fontWeight:700,color:g.hasInvalid?'#B91C1C':'#1D4ED8'}},fmtRate(g.badRate))
            )
          )
        ))
      ),
      h('div',{style:{display:'grid',gap:'1.25rem'}},
        majorGroups.map(g=>h('div',{key:g.name,className:'card',style:{padding:'1rem',overflow:'hidden'}},
          h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:'1rem'}},
            h('div',{style:{display:'flex',alignItems:'center',gap:10}},
              h('div',{style:{width:14,height:14,borderRadius:'50%',background:g.textColor}}),
              h('div',null,
                h('div',{style:{fontSize:22,fontWeight:700,color:'var(--pri3)',lineHeight:1.1}},g.name),
                h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:4}},'Gồm '+g.shifts.length+' ca nhỏ')
              )
            ),
            h('div',{style:{display:'flex',gap:8,flexWrap:'wrap'}},
              h('div',{style:{padding:'8px 12px',borderRadius:'var(--r)',background:'var(--bg)',minWidth:120}},
                h('div',{style:{fontSize:11,color:'var(--tx2)'}},'SL đặt ca lớn'),
                h('div',{style:{fontSize:18,fontWeight:700,color:'var(--pri3)'}},g.qtyProd.toLocaleString())
              ),
              h('div',{style:{padding:'8px 12px',borderRadius:'var(--r)',background:'#F8FBF9',minWidth:120}},
                h('div',{style:{fontSize:11,color:'var(--tx2)'}},'SL SX ca lớn'),
                h('div',{style:{fontSize:18,fontWeight:700,color:'var(--pri)'}},g.qtyActual.toLocaleString())
              ),
              h('div',{style:{padding:'8px 12px',borderRadius:'var(--r)',background:'#FFF7ED',minWidth:120}},
                h('div',{style:{fontSize:11,color:'var(--tx2)'}},'Hàng lỗi ca lớn'),
                h('div',{style:{fontSize:18,fontWeight:700,color:'#C2410C'}},g.qtyBad.toLocaleString())
              ),
              h('div',{style:{padding:'8px 12px',borderRadius:'var(--r)',background:g.hasInvalid?'#FEF2F2':'#F0FDF4',minWidth:120}},
                h('div',{style:{fontSize:11,color:'var(--tx2)'}},'SL đạt ca lớn'),
                h('div',{style:{fontSize:18,fontWeight:700,color:g.hasInvalid?'#B91C1C':'#15803D'}},g.qtyGood.toLocaleString())
              ),
              h('div',{style:{padding:'8px 12px',borderRadius:'var(--r)',background:'#EFF6FF',minWidth:120}},
                h('div',{style:{fontSize:11,color:'var(--tx2)'}},'Tỷ lệ lỗi ca lớn'),
                h('div',{style:{fontSize:18,fontWeight:700,color:g.hasInvalid?'#B91C1C':'#1D4ED8'}},fmtRate(g.badRate))
              )
            )
          ),
          h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'1rem'}},
            g.shifts.map(({rule,rows:groupRows,qtyProd,qtyActual,qtyBad,qtyGood,badRate,hasInvalid})=>h('div',{key:rule.id,style:{border:`1px solid ${hasInvalid?'#FCA5A5':(rule.color||'var(--bd)')}`,borderRadius:'var(--rl)',overflow:'hidden',background:'#fff'}},
              h('div',{style:{padding:'12px 14px',background:rule.color||'#F8FBF9',borderBottom:'.5px solid var(--bd)'}},
                h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,flexWrap:'wrap'}},
                  h('div',null,
                    h('div',{style:{fontSize:20,fontWeight:700,color:rule.textColor||'var(--pri3)',lineHeight:1.1}},rule.name),
                    h('div',{style:{fontSize:12,color:hasInvalid?'#B91C1C':'var(--tx2)',marginTop:4}},hasInvalid?'SL lỗi đang lớn hơn SL SX ở một số dòng':((rule.start&&rule.end?rule.start+' - '+rule.end+' · ':'')+groupRows.length+' sản phẩm'))
                  ),
                  h('div',{style:{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'flex-end',marginLeft:'auto'}},
                    h('div',{style:{minWidth:80,padding:'6px 8px',borderRadius:'var(--r)',background:'rgba(255,255,255,.75)',textAlign:'center'}},
                      h('div',{style:{fontSize:11,color:'var(--tx2)'}},'SL đặt'),
                      h('div',{style:{fontSize:18,fontWeight:700,color:'var(--pri3)'}},qtyProd.toLocaleString())
                    ),
                    h('div',{style:{minWidth:80,padding:'6px 8px',borderRadius:'var(--r)',background:'rgba(255,255,255,.75)',textAlign:'center'}},
                      h('div',{style:{fontSize:11,color:'var(--tx2)'}},'SL SX'),
                      h('div',{style:{fontSize:18,fontWeight:700,color:'var(--pri)'}},qtyActual.toLocaleString())
                    ),
                    h('div',{style:{minWidth:80,padding:'6px 8px',borderRadius:'var(--r)',background:'#FFF7ED',textAlign:'center'}},
                      h('div',{style:{fontSize:11,color:'var(--tx2)'}},'Hàng lỗi'),
                      h('div',{style:{fontSize:18,fontWeight:700,color:'#C2410C'}},qtyBad.toLocaleString())
                    ),
                    h('div',{style:{minWidth:80,padding:'6px 8px',borderRadius:'var(--r)',background:hasInvalid?'#FEF2F2':'#F0FDF4',textAlign:'center'}},
                      h('div',{style:{fontSize:11,color:'var(--tx2)'}},'SL đạt'),
                      h('div',{style:{fontSize:18,fontWeight:700,color:hasInvalid?'#B91C1C':'#15803D'}},qtyGood.toLocaleString())
                    ),
                    h('div',{style:{minWidth:80,padding:'6px 8px',borderRadius:'var(--r)',background:'#EFF6FF',textAlign:'center'}},
                      h('div',{style:{fontSize:11,color:'var(--tx2)'}},'Tỷ lệ lỗi'),
                      h('div',{style:{fontSize:18,fontWeight:700,color:hasInvalid?'#B91C1C':'#1D4ED8'}},fmtRate(badRate))
                    )
                  )
                )
              ),
              h('div',{className:'tw'},
                h('table',null,
                  h('thead',null,h('tr',null,...['Sản phẩm','ĐVT','SL Đặt','SL SX','SL hàng lỗi','SL đạt','Tỷ lệ lỗi','Đơn hàng'].map(c=>h('th',{key:c},c)))),
                  h('tbody',null,groupRows.map((r,i)=>{
                    const rowInvalid=isInvalidActualRow(r.prodDate,r.shift,r.productId);
                    const rowActualQty=numFmt(readActualQty(r.prodDate,r.shift,r.productId));
                    const rowBadQty=numFmt(readBadQty(r.prodDate,r.shift,r.productId));
                    const rowGoodQty=readGoodQty(r.prodDate,r.shift,r.productId);
                    const rowBadRate=calcBadRate(rowActualQty,rowBadQty);
                    return h('tr',{key:i,style:rowInvalid?{background:'#FEF2F2'}:null},
                    h('td',null,h('div',{style:{fontWeight:500}},r.productName)),
                    h('td',null,h('span',{className:'badge',style:{background:rule.color||'#EAF3DE',color:rule.textColor||'#3B6D11'}},r.unit)),
                    h('td',null,h('span',{style:{fontSize:16,fontWeight:600,color:'var(--pri)'}},r.qtyProd.toLocaleString())),
                    h('td',null,h('input',{
                      type:'number',
                      min:0,
                      step:'0.01',
                      value:readActualQty(r.prodDate,r.shift,r.productId),
                      onChange:e=>saveActuals(r.prodDate,r.shift,r.productId,r.productName,{qty:e.target.value}),
                      placeholder:'Nhập SL SX',
                      style:{width:110,fontSize:13,padding:'5px 8px',borderRadius:'var(--r)',border:'1px solid var(--bd)',textAlign:'right'}
                    })),
                    h('td',null,h('input',{
                      type:'number',
                      min:0,
                      step:'0.01',
                      value:readBadQty(r.prodDate,r.shift,r.productId),
                      onChange:e=>saveActuals(r.prodDate,r.shift,r.productId,r.productName,{badQty:e.target.value}),
                      placeholder:'Nhập SL lỗi',
                      style:{width:110,fontSize:13,padding:'5px 8px',borderRadius:'var(--r)',border:rowInvalid?'1px solid #DC2626':'1px solid #FDBA74',textAlign:'right',background:rowInvalid?'#FEF2F2':'#FFF7ED',color:rowInvalid?'#B91C1C':'inherit'}
                    })),
                    h('td',null,h('div',null,
                      h('div',{style:{fontSize:16,fontWeight:700,color:rowInvalid?'#B91C1C':'#15803D'}},rowGoodQty.toLocaleString()),
                      rowInvalid&&h('div',{style:{fontSize:11,color:'#B91C1C',marginTop:4}},'Hàng lỗi vượt SL SX')
                    )),
                    h('td',null,h('div',{style:{fontSize:16,fontWeight:700,color:rowInvalid?'#B91C1C':'#1D4ED8'}},fmtRate(rowBadRate))),
                    h('td',null,h('span',{style:{fontSize:11,color:'var(--tx2)'}},r.orders.join(', ')))
                  )}))
                )
              )
            ))
          )
        ))
      )
    )
  );
}

/* ─── Đơn sản xuất ─── */
function ProdOrderForm({po,products,currentUser,onSave,onClose}){
  const[f,sf]=useState(po?{...po}:{shift:'day',date:fmtDate(),status:'planning',note:'',lines:[]});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const addLine=()=>sf(p=>({...p,lines:[...p.lines,{id:uid(),productId:'',productName:'',unit:'',qtyRequired:0,qtyProduced:0,note:''}]}));
  const updLine=(id,data)=>sf(p=>({...p,lines:p.lines.map(l=>l.id===id?data:l)}));
  const delLine=id=>sf(p=>({...p,lines:p.lines.filter(l=>l.id!==id)}));
  const submit=()=>{
    if(f.lines.length===0){window.showToast('Thêm ít nhất 1 sản phẩm cần sản xuất!','warn');return;}
    onSave({...f,updatedBy:currentUser.name,updatedAt:fmtDT()});
  };
  return h(Modal,{title:po?'Sửa đơn sản xuất':'Tạo đơn sản xuất',onClose},
    h('div',{className:'g3'},
      h(F,{label:'Ngày sản xuất'},h('input',{value:f.date,onChange:e=>s('date',e.target.value),placeholder:'DD/MM/YYYY'})),
      h(F,{label:'Ca sản xuất'},h('select',{value:f.shift,onChange:e=>s('shift',e.target.value)},
        h('option',{value:'day'},'☀️ Ca sáng'),
        h('option',{value:'night'},'🌙 Ca đêm')
      )),
      h(F,{label:'Trạng thái'},h('select',{value:f.status,onChange:e=>s('status',e.target.value)},
        [['planning','Lên kế hoạch'],['in_progress','Đang sản xuất'],['done','Hoàn thành'],['cancelled','Hủy']].map(([v,l])=>h('option',{key:v,value:v},l))
      )),
    ),
    h(F,{label:'Ghi chú'},h('textarea',{value:f.note,onChange:e=>s('note',e.target.value),rows:2})),
    h('div',{className:'divider'}),
    h('div',{style:{fontWeight:500,fontSize:13,color:'var(--pri3)',marginBottom:8}},'Danh sách sản phẩm cần sản xuất'),
    h('div',{style:{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr auto',gap:6,marginBottom:4}},
      ['Sản phẩm','ĐVT','SL cần SX','SL đã SX',''].map(c=>h('span',{key:c,style:{fontSize:11,color:'var(--tx2)',fontWeight:500}},c))
    ),
    f.lines.map(l=>h('div',{key:l.id,style:{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr auto',gap:6,marginBottom:6,alignItems:'center'}},
      h('select',{value:l.productId,onChange:e=>{const p=products.find(x=>x.id===e.target.value)||{};updLine(l.id,{...l,productId:e.target.value,productName:p.name||'',unit:p.unit||''});},style:{fontSize:13}},
        h('option',{value:''},'— Chọn SP —'),products.map(p=>h('option',{key:p.id,value:p.id},p.name))
      ),
      h('input',{value:l.unit,readOnly:true,style:{fontSize:13,background:'var(--bg2)',cursor:'default'}}),
      h('input',{type:'number',min:0,value:l.qtyRequired,onChange:e=>updLine(l.id,{...l,qtyRequired:numFmt(e.target.value)}),style:{fontSize:13}}),
      h('input',{type:'number',min:0,value:l.qtyProduced,onChange:e=>updLine(l.id,{...l,qtyProduced:numFmt(e.target.value)}),style:{fontSize:13,borderColor:numFmt(l.qtyProduced)>=numFmt(l.qtyRequired)&&numFmt(l.qtyRequired)>0?'#52b788':''}}),
      h('button',{className:'bi',onClick:()=>delLine(l.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:14}}))
    )),
    h('button',{onClick:addLine,style:{fontSize:12,padding:'5px 12px',marginBottom:8}},h('i',{className:'ti ti-plus',style:{fontSize:13,marginRight:4}}),'Thêm sản phẩm'),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu đơn SX'))
  );
}
function ProdOrdersTab({prodOrders,setProdOrders,products,currentUser}){
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[filter,sf]=useState('all');const[q,sq]=useState('');
  let pSeq=prodOrders.length+1;
  const save=d=>{if(edit)setProdOrders(p=>p.map(x=>x.id===edit.id?d:x));else{const id='SX'+String(pSeq++).toString().padStart(4,'0');setProdOrders(p=>[...p,{...d,id,createdBy:currentUser.name,createdAt:fmtDT()}]);}sm(null);se(null);};
  const del=id=>window.scfConfirm('Bạn có chắc muốn xóa đơn sản xuất này?','Xóa đơn sản xuất',true).then(ok=>ok&&setProdOrders(p=>p.filter(x=>x.id!==id)));
  const sts=[['all','Tất cả'],['planning','Kế hoạch'],['in_progress','Đang SX'],['done','Hoàn thành']];
  const list=prodOrders.filter(x=>(filter==='all'||x.status===filter)&&(!q||x.id.toLowerCase().includes(q.toLowerCase())||x.date.includes(q)));
  const statusMap={planning:['#E6F1FB','#185FA5','Kế hoạch'],in_progress:['#FAEEDA','#854F0B','Đang SX'],done:['#EAF3DE','#3B6D11','Hoàn thành'],cancelled:['#FCEBEB','#A32D2D','Hủy']};
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-building-factory',style:{fontSize:20}}),'Đơn sản xuất'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h('div',{style:{display:'flex',gap:5,flexWrap:'wrap'}},sts.map(([v,l])=>h('button',{key:v,className:'pill'+(filter===v?' on':''),onClick:()=>sf(v)},l+' ('+(v==='all'?prodOrders.length:prodOrders.filter(x=>x.status===v).length)+')'))),
      h('div',{style:{display:'flex',gap:6}},
        h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm đơn SX...'}),
        h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Tạo đơn SX'})
      )
    ),
    list.length?h('div',{style:{display:'flex',flexDirection:'column',gap:'1rem'}},
      list.map(po=>{
        const [bg,tx,label]=statusMap[po.status]||['#F1EFE8','#5F5E5A',po.status];
        const done=po.lines?po.lines.filter(l=>numFmt(l.qtyProduced)>=numFmt(l.qtyRequired)&&numFmt(l.qtyRequired)>0).length:0;
        const total=po.lines?po.lines.length:0;
        return h('div',{key:po.id,className:'card'},
          h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1rem'}},
            h('div',null,
              h('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:4}},
                h('span',{style:{fontWeight:600,fontSize:15,color:'var(--pri3)'}},po.id),
                h('span',{className:'badge',style:{background:po.shift==='day'?'#FFF9C4':'#EDE9FE',color:po.shift==='day'?'#854F0B':'#5B21B6'}},(po.shift==='day'?'☀️ Ca sáng':'🌙 Ca đêm')),
                h('span',{className:'badge',style:{background:bg,color:tx}},label)
              ),
              h('div',{style:{fontSize:12,color:'var(--tx2)',display:'flex',gap:12}},
                h('span',null,h('i',{className:'ti ti-calendar',style:{fontSize:12,marginRight:3}}),po.date),
                h('span',null,h('i',{className:'ti ti-list-check',style:{fontSize:12,marginRight:3}}),done+'/'+total+' SP hoàn thành'),
                po.updatedBy&&h('span',null,h('i',{className:'ti ti-user',style:{fontSize:12,marginRight:3}}),po.updatedBy)
              )
            ),
            h('div',{style:{display:'flex',gap:4}},
              h('button',{className:'bi',onClick:()=>{se(po);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
              h('button',{className:'bi',onClick:()=>del(po.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
            )
          ),
          po.lines&&po.lines.length>0&&h('div',{className:'tw'},
            h('table',null,
              h('thead',null,h('tr',null,...['Sản phẩm','Đơn vị','SL cần SX','SL đã SX','Tiến độ'].map(c=>h('th',{key:c},c)))),
              h('tbody',null,po.lines.map(l=>{
                const pct=numFmt(l.qtyRequired)>0?Math.min(100,Math.round(numFmt(l.qtyProduced)/numFmt(l.qtyRequired)*100)):0;
                const done2=numFmt(l.qtyProduced)>=numFmt(l.qtyRequired)&&numFmt(l.qtyRequired)>0;
                return h('tr',{key:l.id,style:{background:done2?'rgba(82,183,136,.05)':''}},
                  h('td',null,h('div',{style:{fontWeight:500}},l.productName||'—')),
                  h('td',null,h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--tx)'}},l.unit||'—')),
                  h('td',null,h('span',{style:{fontWeight:500}},numFmt(l.qtyRequired).toLocaleString())),
                  h('td',null,h('span',{style:{fontWeight:600,color:done2?'var(--pri)':'var(--tx)'}},numFmt(l.qtyProduced).toLocaleString())),
                  h('td',null,
                    h('div',{style:{display:'flex',alignItems:'center',gap:8}},
                      h('div',{style:{flex:1,height:6,background:'var(--bg2)',borderRadius:3,overflow:'hidden'}},
                        h('div',{style:{height:'100%',width:pct+'%',background:done2?'var(--pri)':'#f8c30f',borderRadius:3,transition:'width .3s'}})
                      ),
                      h('span',{style:{fontSize:12,fontWeight:500,color:done2?'var(--pri)':'var(--tx2)',minWidth:35}},pct+'%')
                    )
                  )
                );
              }))
            )
          ),
          po.note&&h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:'1rem',padding:'6px 10px',background:'var(--bg2)',borderRadius:4}},'📝 '+po.note)
        );
      })
    ):h('div',{style:{textAlign:'center',padding:'3rem',color:'var(--tx2)',background:'#fff',borderRadius:'var(--rl)',border:'.5px solid var(--bd)'}},
      h('i',{className:'ti ti-building-factory',style:{fontSize:56,display:'block',marginBottom:'1rem',color:'var(--pri2)'}}),
      'Chưa có đơn sản xuất nào.'
    ),
    modal==='f'&&h(ProdOrderForm,{po:edit,products,currentUser,onSave:save,onClose:()=>{sm(null);se(null);}})
  );
}

/* ─── Tồn kho ─── */
function StockForm({entry,onSave,onClose}){
    const[f,sf]=useState(entry?{...entry}:{stockMorning:0,stockEvening:0,note:''});
    const submit=()=>{onSave({...entry,...f,updatedBy:currentUser.name,updatedAt:fmtDT()});};
    return h(Modal,{title:'Cập nhật tồn kho — '+entry.productName,onClose},
      h('div',{style:{background:'var(--bg2)',padding:'10px 14px',borderRadius:'var(--r)',marginBottom:'1rem',fontSize:13}},
        h('div',{style:{fontWeight:500}},entry.productName),
        h('div',{style:{color:'var(--tx2)',fontSize:12}},entry.unit)
      ),
      h('div',{className:'g2'},
        h(F,{label:'Tồn kho 9h sáng'},h('input',{type:'number',min:0,value:f.stockMorning,onChange:e=>sf(p=>({...p,stockMorning:numFmt(e.target.value)}))})),
        h(F,{label:'Tồn kho 1h đêm'},h('input',{type:'number',min:0,value:f.stockEvening,onChange:e=>sf(p=>({...p,stockEvening:numFmt(e.target.value)}))})),
      ),
      h(F,{label:'Ghi chú'},h('input',{value:f.note||'',onChange:e=>sf(p=>({...p,note:e.target.value}))})),
      h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'}},'Cập nhật tồn kho'))
    );
  }
function StockTab({stock,setStock,products,currentUser}){
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[q,sq]=useState('');

  // Ensure all products have a stock entry
  const stockMap={};(stock||[]).forEach(s=>{stockMap[s.productId]=s;});



  const saveStock=d=>{
    setStock(p=>{const idx=p.findIndex(x=>x.productId===d.productId);if(idx>=0){const n=[...p];n[idx]=d;return n;}return[...p,d];});
    sm(null);se(null);
  };

  const exportCols=[['productId','Mã SP'],['productName','Tên SP'],['unit','ĐVT'],['stockMorning','Tồn 9h sáng'],['stockEvening','Tồn 1h đêm'],['updatedBy','Người cập nhật'],['updatedAt','Thời gian']];
  const allStockRows=products.map(p=>stockMap[p.id]||{productId:p.id,productName:p.name,unit:p.unit,stockMorning:0,stockEvening:0,updatedBy:'',updatedAt:''});
  const filtered=allStockRows.filter(x=>!q||x.productName.toLowerCase().includes(q.toLowerCase()));

  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-package',style:{fontSize:20}}),'Quản lý tồn kho'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm sản phẩm...'}),
      h('div',{style:{display:'flex',gap:6}},
        h(ExportBtn,{onClick:()=>xlsxExport(allStockRows,exportCols,'Ton_kho')}),
        h(ImportBtn,{onFile:rows=>{
          const updated=rows.map(r=>({productId:r['Mã SP']||'',productName:r['Tên SP']||'',unit:r['ĐVT']||'',stockMorning:numFmt(r['Tồn 9h sáng']),stockEvening:numFmt(r['Tồn 1h đêm']),updatedBy:currentUser.name,updatedAt:fmtDT()})).filter(r=>r.productId);
          setStock(p=>{const map={};p.forEach(x=>{map[x.productId]=x;});updated.forEach(x=>{map[x.productId]=x;});return Object.values(map);});
          window.showToast('Đã cập nhật '+updated.length+' sản phẩm','success');
        }})
      )
    ),
    h('div',{style:{background:'#E6F1FB',border:'.5px solid #93c5fd',borderRadius:'var(--r)',padding:'10px 14px',marginBottom:'1rem',fontSize:12,color:'#185FA5'}},
      h('i',{className:'ti ti-info-circle',style:{fontSize:13,marginRight:6}}),
      'Tồn kho được cập nhật 2 lần/ngày: lúc ',h('b',null,'9:00 sáng'),' và ',h('b',null,'1:00 đêm'),'. Nhấn vào biểu tượng chỉnh sửa để cập nhật thủ công.'
    ),
    h('div',{className:'tw'},
      h('table',null,
        h('thead',null,h('tr',null,...['Sản phẩm','Đơn vị','Tồn 9h sáng','Tồn 1h đêm','Cập nhật lúc','Người cập nhật',''].map(c=>h('th',{key:c},c)))),
        h('tbody',null,filtered.length?filtered.map(row=>{
          const s=stockMap[row.productId];
          const morning=s?s.stockMorning:0;
          const evening=s?s.stockEvening:0;
          const low=morning<50||evening<50;
          return h('tr',{key:row.productId,style:{background:low&&(morning>0||evening>0)?'rgba(252,235,235,.3)':''}},
            h('td',null,h('div',{style:{fontWeight:500}},row.productName),(low&&(morning>0||evening>0))&&h('span',{className:'badge',style:{background:'#FCEBEB',color:'#A32D2D',marginLeft:6,fontSize:10}},'Sắp hết')),
            h('td',null,h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--tx)'}},row.unit)),
            h('td',null,h('span',{style:{fontSize:16,fontWeight:600,color:morning<50&&morning>0?'#A32D2D':'var(--pri)'}},morning.toLocaleString())),
            h('td',null,h('span',{style:{fontSize:16,fontWeight:600,color:evening<50&&evening>0?'#A32D2D':'var(--tx)'}},evening.toLocaleString())),
            h('td',null,h('span',{style:{fontSize:11,color:'var(--tx2)'}},s?.updatedAt||'Chưa cập nhật')),
            h('td',null,h('span',{style:{fontSize:12}},s?.updatedBy||'—')),
            h('td',null,h('button',{className:'bi',onClick:()=>{se({...row,stockMorning:morning,stockEvening:evening,...(s||{})});sm('f');}},h('i',{className:'ti ti-edit',style:{fontSize:15}})))
          );
        }):h('tr',null,h('td',{colSpan:7,className:'empty-st'},'Chưa có sản phẩm nào trong danh mục.')))
      )
    ),
    modal==='f'&&edit&&h(StockForm,{entry:edit,onSave:saveStock,onClose:()=>{sm(null);se(null);}})
  );
}


/* === ERROR BOUNDARY === */
class ErrorBoundary extends React.Component {
  constructor(props){super(props);this.state={error:null};}
  static getDerivedStateFromError(e){return{error:e};}
  componentDidCatch(e,i){console.error(e,i);}
  render(){
    if(this.state.error){
      const e=this.state.error;
      return h('div',{style:{padding:'2rem',fontFamily:'monospace',background:'#fff',minHeight:'100vh'}},
        h('h2',{style:{color:'#A32D2D',marginBottom:'1rem'}},'LỖI RENDER: '+e.message),
        h('pre',{style:{fontSize:11,background:'#f5f5f5',padding:'1rem',borderRadius:4,overflow:'auto',whiteSpace:'pre-wrap'}},e.stack),
        h('p',{style:{marginTop:'1rem',fontSize:13,color:'#666'}},'Chup man hinh nay gui lai de fix!')
      );
    }
    return this.props.children;
  }
}
