/* ─── DELIVERY TRIPS ─── */
function TripForm({trip,orders,employees,shifts,customers,products,currentUser,onSave,onClose}){
  const drivers=employees.filter(e=>e.role==='driver'||e.dept==='Lái xe');
  const[f,sf]=useState(trip?{driverWork:0,weightRate:0,tripAllowance:0,attendanceStatus:'pending',...trip}:{driverName:'',driverId:'',shiftId:'',shiftName:'',deliveryDate:fmtDate(),deliveryTime:'07:00',orderIds:[],note:'',status:'planning',driverWork:0,weightRate:0,tripAllowance:0,attendanceStatus:'pending'});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  // Bộ lọc đơn hàng
  const[fArea,setFArea]=useState('');
  const[fDate,setFDate]=useState('');
  const[fCust,setFCust]=useState('');
  const[fTimeFrom,setFTimeFrom]=useState('');
  const[fTimeTo,setFTimeTo]=useState('');
  // Lấy khu vực của đơn
  const getOArea=o=>{
    const c=customers?.find(x=>x.id===o.customerId);
    const pt=(c?.points||[]).find(p=>p.id===o.pointId||p.name===o.pointName);
    return o.area||pt?.area||'';
  };
  const availOrders=orders.filter(o=>o.status==='pending'||(trip&&(trip.orderIds||[]).includes(o.id)));
  // Áp dụng bộ lọc
  const filteredOrders=availOrders.filter(o=>{
    if(fDate&&o.deliveryDate!==fDate.split('-').reverse().join('/'))return false;
    if(fArea&&getOArea(o)!==fArea)return false;
    if(fCust&&o.customerId!==fCust)return false;
    if(fTimeFrom&&o.deliveryTime&&o.deliveryTime<fTimeFrom)return false;
    if(fTimeTo&&o.deliveryTime&&o.deliveryTime>fTimeTo)return false;
    return true;
  });
  const toggle=id=>sf(p=>({...p,orderIds:(p.orderIds||[]).includes(id)?p.orderIds.filter(x=>x!==id):[...p.orderIds,id]}));
  const toggleAll=()=>{
    const ids=filteredOrders.map(o=>o.id);
    const allChecked=ids.every(id=>(f.orderIds||[]).includes(id));
    sf(p=>({...p,orderIds:allChecked?p.orderIds.filter(id=>!ids.includes(id)):[...new Set([...p.orderIds,...ids])]}));
  };
  const lineQty=l=>numFmt(l.qtyInvoice)||numFmt(l.qtyProd)||numFmt(l.qty)||numFmt(l.quantity)||0;
  const lineWeight=l=>{const prod=products?.find(p=>p.id===l.productId);const unit=String(l.unit||prod?.unit||'').trim().toLowerCase().replace(/[^a-z]/g,'');const qty=lineQty(l);if(unit==='kg'||unit==='kgs'||unit==='kilogram'||unit==='kilograms')return qty;const wpu=prod?.weightPerUnit||numFmt(l.weightPerUnit)||0;return wpu*qty;};
  const orderWeight=o=>(o.lines||[]).reduce((s,l)=>s+lineWeight(l),0);
  const totalW=(f.orderIds||[]).reduce((sum,oid)=>{const o=orders.find(x=>x.id===oid);return sum+(o?orderWeight(o):0);},0);
  const submit=()=>{
    if(f.status!=='planning'&&!f.driverName){window.showToast('Vui lòng chọn hoặc nhập tên lái xe trước khi giao chuyến!','warn');return;}
    if(f.orderIds.length===0){window.showToast('Vui lòng chọn ít nhất 1 đơn hàng!','warn');return;}
    onSave({...f,totalWeight:totalW,updatedBy:currentUser.name,updatedAt:fmtDT()});
  };
  // Danh sách khu vực và KH để lọc
  const allAreas=[...new Set(availOrders.map(o=>getOArea(o)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const allCusts=[...new Set(availOrders.map(o=>o.customerId).filter(Boolean))].map(id=>customers?.find(c=>c.id===id)).filter(Boolean);
  const allFilteredChecked=filteredOrders.length>0&&filteredOrders.every(o=>(f.orderIds||[]).includes(o.id));
  const someFilteredChecked=filteredOrders.some(o=>(f.orderIds||[]).includes(o.id))&&!allFilteredChecked;
  const isStarted=!!trip?.driverDispatchedAt||['active','completion_pending','completed'].includes(f.status);

  return h(Modal,{title:trip?'Sửa chuyến '+trip.id:'Tạo chuyến giao hàng',onClose,lg:true},
    h('div',{className:'g2'},
      h(F,{label:'Lái xe'},h('select',{value:f.driverId,disabled:isStarted,onChange:e=>{const emp=employees.find(x=>x.id===e.target.value);sf(p=>({...p,driverId:e.target.value,driverName:emp?emp.name:'',driverAssignMode:'manual'}));},style:{marginBottom:0}},
        h('option',{value:''},'— Chọn từ danh sách —'),drivers.map(e=>h('option',{key:e.id,value:e.id},e.name))
      )),
      h(F,{label:'Hoặc nhập tên lái xe'},h('input',{value:f.driverName,disabled:isStarted,onChange:e=>sf(p=>({...p,driverId:'',driverName:e.target.value,driverAssignMode:'manual'})),placeholder:'Có thể để trống khi lập kế hoạch'})),
    ),
    h('div',{className:'g3'},
      h(F,{label:'Ngày giao'},h('input',{value:f.deliveryDate,onChange:e=>s('deliveryDate',e.target.value),placeholder:'DD/MM/YYYY'})),
      h(F,{label:'Ca giao'},h('select',{value:f.shiftId,onChange:e=>{const sh=(shifts||[]).find(x=>x.id===e.target.value);sf(p=>({...p,shiftId:e.target.value,shiftName:sh?sh.name:'',deliveryTime:sh&&(sh.timeStart||sh.startTime)?(sh.timeStart||sh.startTime):p.deliveryTime,...(!p.driverId&&!p.driverName&&sh?.defaultDriverId?{driverId:sh.defaultDriverId,driverName:sh.defaultDriverName||drivers.find(d=>String(d.id)===String(sh.defaultDriverId))?.name||'',driverAssignMode:'auto'}:{})}));}},
        h('option',{value:''},'— Chọn ca —'),
        (shifts||[]).map(sh=>h('option',{key:sh.id,value:sh.id},sh.name||sh.id))
      )),
      h(F,{label:'Công lái xe'},h('input',{type:'number',step:'0.5',min:'0',value:f.driverWork,onChange:e=>s('driverWork',parseFloat(e.target.value)||0),placeholder:'0'})),
      h(F,{label:'Đơn giá/kg'},h('input',{type:'number',min:'0',value:f.weightRate||0,onChange:e=>s('weightRate',parseFloat(e.target.value)||0),placeholder:'0'})),
      h(F,{label:'Phụ cấp chuyến'},h('input',{type:'number',min:'0',value:f.tripAllowance||0,onChange:e=>s('tripAllowance',parseFloat(e.target.value)||0),placeholder:'0'})),
      h(F,{label:'Trạng thái'},h('div',{style:{minHeight:40,display:'flex',alignItems:'center',padding:'6px 10px',border:'1px solid var(--bd)',borderRadius:'var(--r)',background:'var(--bg2)'}},h(StatusBadge,{s:f.status}))),
    ),
    h(F,{label:'Ghi chú'},h('textarea',{value:f.note,onChange:e=>s('note',e.target.value),rows:2})),
    h('div',{className:'divider'}),
    // ── PHẦN 1: ĐÃ TRONG CHUYẾN (luôn hiện trên cùng) ──
    (()=>{
      const inTripAll=availOrders.filter(o=>(f.orderIds||[]).includes(o.id));
      if(inTripAll.length===0)return null;
      return h('div',{style:{marginBottom:8}},
        h('div',{style:{padding:'5px 10px',background:'#2d6a4f',color:'#fff',fontSize:12,fontWeight:700,
          borderRadius:'var(--r) var(--r) 0 0',display:'flex',justifyContent:'space-between',alignItems:'center'}},
          h('span',null,'✓ ĐÃ TRONG CHUYẾN ('+inTripAll.length+' đơn · '+totalW.toFixed(1)+' kg)'),
          !isStarted&&h('button',{onClick:()=>sf(p=>({...p,orderIds:[]})),
            style:{fontSize:11,padding:'1px 8px',background:'rgba(255,255,255,.2)',border:'1px solid rgba(255,255,255,.4)',color:'#fff',borderRadius:4,cursor:'pointer'}
          },'Bỏ tất cả')
        ),
        h('div',{style:{maxHeight:180,overflowY:'auto',border:'1px solid #2d6a4f',borderTop:'none',
          borderRadius:'0 0 var(--r) var(--r)',padding:4,background:'#f5fbf5'}},
          inTripAll.map(o=>{
            const w=orderWeight(o);
            const oCust=customers?.find(c=>c.id===o.customerId)||null;
            const oPt=oCust?(oCust.points||[]).find(p=>p.id===o.pointId||p.name===o.pointName):null;
            const oArea=o.area||oPt?.area||'';
            return h('label',{key:o.id,style:{display:'flex',alignItems:'center',gap:10,padding:'6px 8px',
              borderRadius:'var(--r)',cursor:'pointer',marginBottom:2,
              background:'#f0faf0',border:'1px solid var(--pri)'}},
              h('input',{type:'checkbox',checked:true,disabled:isStarted,onChange:()=>toggle(o.id),
                style:{width:'auto',flexShrink:0,accentColor:'var(--pri)'}}),
              h('div',{style:{flex:1,minWidth:0}},
                h('div',{style:{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}},
                  h('span',{style:{fontWeight:600,fontSize:13,color:'var(--pri)'}},o.pointName||o.customer||o.id),
                  oArea&&h('span',{style:{fontSize:11,background:'#e8f5e9',color:'#2d6a4f',padding:'1px 7px',borderRadius:10,fontWeight:600}},oArea),
                  o.deliveryTime&&h('span',{style:{fontSize:12,background:'var(--bg2)',padding:'1px 6px',borderRadius:8,color:'var(--tx2)'}},
                    h('i',{className:'ti ti-clock',style:{fontSize:10,marginRight:2}}),o.deliveryTime)
                ),
                h('div',{style:{fontSize:11,color:'var(--tx2)',marginTop:2,display:'flex',gap:8}},
                  h('span',null,o.id),
                  o.customer&&o.customer!==o.pointName&&h('span',null,'KH: '+o.customer),
                  w>0&&h('span',{style:{color:'#2d6a4f',fontWeight:500}},w.toFixed(1)+' kg'),
                  (o.lines||[]).length>0&&h('span',null,(o.lines||[]).length+' SP')
                )
              )
            );
          })
        )
      );
    })(),
    // ── PHẦN 2: BỘ LỌC + THÊM ĐƠN ──
    !isStarted&&h('div',{style:{marginBottom:6}},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}},
        h('div',{style:{fontWeight:600,fontSize:13,color:'var(--tx2)'}},'+ Thêm đơn hàng vào chuyến'),
        filteredOrders.filter(o=>!(f.orderIds||[]).includes(o.id)).length>0&&h('button',{
          onClick:()=>sf(p=>({...p,orderIds:[...new Set([...p.orderIds,...filteredOrders.map(o=>o.id)])]})),
          style:{fontSize:12,padding:'3px 10px',border:'1px solid var(--pri)',color:'var(--pri)',background:'transparent',borderRadius:'var(--r)',cursor:'pointer'}
        },'Chọn tất cả ('+filteredOrders.filter(o=>!(f.orderIds||[]).includes(o.id)).length+')')
      ),
      h('div',{style:{display:'flex',gap:6,flexWrap:'wrap',marginBottom:6}},
        h('input',{type:'date',value:fDate,onChange:e=>setFDate(e.target.value),
          style:{padding:'4px 8px',fontSize:12,border:'1px solid var(--bd)',borderRadius:'var(--r)'}
        }),
        h('select',{value:fArea,onChange:e=>setFArea(e.target.value),
          style:{padding:'4px 8px',fontSize:12,border:'1px solid var(--bd)',borderRadius:'var(--r)',flex:'1 1 90px'}
        },h('option',{value:''},'Tất cả khu vực'),allAreas.map(a=>h('option',{key:a,value:a},a))),
        h('select',{value:fCust,onChange:e=>setFCust(e.target.value),
          style:{padding:'4px 8px',fontSize:12,border:'1px solid var(--bd)',borderRadius:'var(--r)',flex:'1 1 110px'}
        },h('option',{value:''},'Tất cả KH'),allCusts.map(c=>h('option',{key:c.id,value:c.id},c.name))),
        h('div',{style:{display:'flex',alignItems:'center',gap:4}},
          h('input',{type:'time',value:fTimeFrom,onChange:e=>setFTimeFrom(e.target.value),
            title:'Giờ từ',style:{padding:'4px 6px',fontSize:12,border:'1px solid var(--bd)',borderRadius:'var(--r)',width:90}
          }),
          h('span',{style:{fontSize:12,color:'var(--tx2)'}},'→'),
          h('input',{type:'time',value:fTimeTo,onChange:e=>setFTimeTo(e.target.value),
            title:'Giờ đến',style:{padding:'4px 6px',fontSize:12,border:'1px solid var(--bd)',borderRadius:'var(--r)',width:90}
          })
        ),
        (fDate||fArea||fCust||fTimeFrom||fTimeTo)&&h('button',{'data-scf-action':'view',
          onClick:()=>{setFDate('');setFArea('');setFCust('');setFTimeFrom('');setFTimeTo('');},
          style:{padding:'4px 8px',fontSize:12,color:'#A32D2D',border:'1px solid #f0a0a0',borderRadius:'var(--r)',background:'transparent',cursor:'pointer'}
        },'✕ Xóa lọc')
      )
    ),
    !isStarted&&(()=>{
      // Render 1 order item
      const renderOrder=(o,checked,highlight)=>{
        const w=orderWeight(o);
        const oCust=customers?.find(c=>c.id===o.customerId)||null;
        const oPt=oCust?(oCust.points||[]).find(p=>p.id===o.pointId||p.name===o.pointName):null;
        const oArea=o.area||oPt?.area||'';
        return h('label',{key:o.id,style:{display:'flex',alignItems:'center',gap:10,padding:'7px 8px',
          borderRadius:'var(--r)',cursor:'pointer',marginBottom:2,
          background:highlight?'#f0faf0':checked?'#EEF5FF':'#fff',
          border:'1px solid '+(highlight?'var(--pri)':checked?'#93c5fd':'var(--bd)')}},
          h('input',{type:'checkbox',checked,onChange:()=>toggle(o.id),style:{width:'auto',flexShrink:0,accentColor:'var(--pri)'}}),
          h('div',{style:{flex:1,minWidth:0}},
            h('div',{style:{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}},
              h('span',{style:{fontWeight:600,fontSize:13,color:'var(--pri)'}},o.pointName||o.customer||o.id),
              oArea&&h('span',{style:{fontSize:11,background:'#e8f5e9',color:'#2d6a4f',padding:'1px 7px',borderRadius:10,fontWeight:600}},oArea),
              o.deliveryTime&&h('span',{style:{fontSize:12,background:'var(--bg2)',padding:'1px 6px',borderRadius:8,color:'var(--tx2)'}},
                h('i',{className:'ti ti-clock',style:{fontSize:10,marginRight:2}}),o.deliveryTime
              )
            ),
            h('div',{style:{fontSize:11,color:'var(--tx2)',marginTop:2,display:'flex',gap:8}},
              h('span',null,o.id),
              o.customer&&o.customer!==o.pointName&&h('span',null,'KH: '+o.customer),
              w>0&&h('span',{style:{color:'#2d6a4f',fontWeight:500}},w.toFixed(1)+' kg'),
              (o.lines||[]).length>0&&h('span',null,(o.lines||[]).length+' SP')
            )
          )
        );
      };
      // Đã trong chuyến: lấy từ TẤT CẢ đơn (không qua filter) để luôn hiện đủ
      // Có thể thêm: qua filter, chưa trong chuyến
      const notInTrip=filteredOrders.filter(o=>!(f.orderIds||[]).includes(o.id));
      return h('div',{style:{border:'.5px solid var(--bd)',borderRadius:'var(--r)',overflow:'hidden'}},
        // Phần ĐÃ CÓ trong chuyến
        // Phần CÓ THỂ THÊM
        h('div',null,
          h('div',{style:{padding:'5px 10px',background:'var(--bg2)',fontSize:11,fontWeight:700,color:'var(--tx2)',letterSpacing:.5,borderTop:'none',display:'flex',justifyContent:'space-between',alignItems:'center'}},
            h('span',null,notInTrip.length>0?'+ CÓ THỂ THÊM ('+notInTrip.length+' đơn)':'Không có đơn hàng nào thêm'),
            notInTrip.length>0&&h('button',{onClick:()=>sf(p=>({...p,orderIds:[...new Set([...p.orderIds,...notInTrip.map(o=>o.id)])]})),
              style:{fontSize:11,padding:'1px 8px',border:'1px solid var(--pri)',color:'var(--pri)',background:'transparent',borderRadius:4,cursor:'pointer'}
            },'Thêm tất cả')
          ),
          notInTrip.length>0&&h('div',{style:{maxHeight:220,overflowY:'auto',padding:6}},
            notInTrip.map(o=>renderOrder(o,false,false))
          ),
          notInTrip.length===0&&h('div',{style:{textAlign:'center',padding:'1rem',color:'var(--tx2)',fontSize:13}},
            fDate||fArea||fCust?'Không có đơn hàng khớp bộ lọc.':'Không có đơn hàng chờ giao.'
          )
        )
      );
    })(),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu chuyến'))
  );
}
function BulkTripModal({orders,employees,shifts,prodShifts,customers,products,trips,currentUser,initialDate,initialShift,onSave,onClose}){
  const today=new Date().toISOString().slice(0,10);
  const [date,setDate]=useState(initialDate||today);
  const [selShifts,setSelShifts]=useState(initialShift?[initialShift]:[]); // shift ids
  const [driver,setDriver]=useState('');
  const [driverName,setDriverName]=useState('');
  const drivers=employees.filter(e=>e.role==='driver'||e.dept==='Lái xe');

  // Lấy khu vực của đơn
  const getOArea=o=>{
    const c=customers?.find(x=>x.id===o.customerId);
    const pt=(c?.points||[]).find(p=>p.id===o.pointId||p.name===o.pointName);
    return o.area||pt?.area||'';
  };
  const fmtDate2=s=>{if(!s)return'';const[y,m,d]=s.split('-');return d+'/'+m+'/'+y;};
  const dateVN=fmtDate2(date);

  // Đơn hàng chờ theo ngày
  const pendingOrders=orders.filter(o=>{
    if(o.tripId||o.status==='done'||o.status==='cancelled')return false;
    return !dateVN||o.deliveryDate===dateVN;
  });
  const allShifts=shifts||[];

  const toggleShift=id=>setSelShifts(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const lineQty=l=>numFmt(l.qtyInvoice)||numFmt(l.qtyProd)||numFmt(l.qty)||numFmt(l.quantity)||0;
  const lineWeight=l=>{const prod=products?.find(p=>p.id===l.productId);const unit=String(l.unit||prod?.unit||'').trim().toLowerCase().replace(/[^a-z]/g,'');const qty=lineQty(l);if(unit==='kg'||unit==='kgs'||unit==='kilogram'||unit==='kilograms')return qty;const wpu=prod?.weightPerUnit||numFmt(l.weightPerUnit)||0;return wpu*qty;};
  const orderWeight=o=>(o.lines||[]).reduce((s,l)=>s+lineWeight(l),0);
  const ordersWeight=rows=>(rows||[]).reduce((s,o)=>s+orderWeight(o),0);

  const normShift=v=>String(v||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/\s+/g,' ');
  const orderMatchesDeliveryShift=(order,shift)=>{
    const desiredId=String(getOrderTripShiftId(order,prodShifts||[])||'').trim();
    const desiredName=normShift(getOrderTripShiftName(order,prodShifts||[]));
    return (!!desiredId&&desiredId===String(shift?.id||''))|| (!!desiredName&&desiredName===normShift(shift?.name));
  };

  // Mỗi ca giao hàng được chọn chỉ tạo đúng một chuyến trong ngày.
  // Ca chưa có đơn vẫn phải tạo chuyến trống để nhận các đơn phát sinh sau.
  // Chỉ bỏ qua ca đã có chuyến cùng ngày và phải báo rõ trên màn hình.
  const sameDateShift=(trip,shift)=>{
    if(trip?.deliveryDate!==dateVN)return false;
    const sameId=shift?.id&&String(trip?.shiftId||'')===String(shift.id);
    const sameName=shift?.name&&normShift(trip?.shiftName)===normShift(shift.name);
    return !!(sameId||sameName);
  };
  const selectedShiftRows=React.useMemo(()=>{
    const useShifts=selShifts.length>0?allShifts.filter(s=>selShifts.includes(s.id)):[];
    return useShifts.map(sh=>{
      const matchOrders=pendingOrders.filter(o=>orderMatchesDeliveryShift(o,sh));
      const areas=[...new Set(matchOrders.map(getOArea).filter(Boolean))];
      return {
        shiftId:sh.id,
        shiftName:sh.name||sh.id,
        area:matchOrders.length===0?'':(areas.length===1?areas[0]:'Nhiều khu vực'),
        orders:matchOrders,
        alreadyExists:(trips||[]).some(t=>sameDateShift(t,sh))
      };
    });
  },[selShifts.join(','),date,orders,trips,shifts,prodShifts,customers]);
  const preview=selectedShiftRows.filter(combo=>!combo.alreadyExists);
  const existingRows=selectedShiftRows.filter(combo=>combo.alreadyExists);
  const emptyRows=preview.filter(combo=>combo.orders.length===0);

  const submit=()=>{
    if(!selShifts.length){window.showToast('Vui lòng chọn ít nhất một ca giao hàng cần tạo chuyến!','warn');return;}
    if(preview.length===0){window.showToast('Các ca đã chọn đều đã có chuyến trong ngày '+dateVN+'.','warn');return;}
    const manuallySelectedDriverName=driverName||(drivers.find(d=>d.id===driver)?.name||'');
    // Tạo ID trước để check trùng trong batch
    const usedIds=new Set(trips.map(t=>t.id));
    const newTrips=[];

    preview.forEach(combo=>{
      const comboShift=(shifts||[]).find(sh=>String(sh.id)===String(combo.shiftId));
      const comboDriverId=driver||comboShift?.defaultDriverId||'';
      const comboDriverName=manuallySelectedDriverName||comboShift?.defaultDriverName||drivers.find(d=>String(d.id)===String(comboDriverId))?.name||'';
      const [dd,mm,yy]=(dateVN||fmtDate()).split('/');
      const datePart=(dd||'')+(mm||'')+(yy||'').slice(-2);
      const shiftAbbr=(combo.shiftName||'').toUpperCase()
        .replace(/CA\s*/,'')
        .replace(/SÁNG|SANG/,'S').replace(/TRƯA|TRUA/,'T')
        .replace(/CHIỀU|CHIEU/,'C').replace(/ĐÊM|DEM/,'D')
        .replace(/[^A-Z0-9]/g,'').slice(0,3)||(combo.area||'XX').replace(/[^A-Z0-9]/gi,'').slice(0,2).toUpperCase();
      const driverAbbr=comboDriverName.trim().split(/\s+/).map(w=>w[0]).join('').toUpperCase().slice(0,3);
      const areaCode=(combo.area||'').replace(/[^A-Z0-9]/gi,'').slice(0,3).toUpperCase()||'XX';
      let baseId='CH'+datePart+shiftAbbr+'_'+areaCode+'_'+(driverAbbr||'XX');
      let id=baseId; let seq=2;
      while(usedIds.has(id)){id=baseId+'_'+seq;seq++;}
      usedIds.add(id);
      const w=ordersWeight(combo.orders);
      newTrips.push({
        id,driverName:comboDriverName,driverId:comboDriverId,driverAssignMode:driver||driverName?'manual':(comboDriverId?'auto':''),
        shiftId:combo.shiftId,shiftName:combo.shiftName,
        deliveryDate:dateVN,deliveryTime:'',
        orderIds:combo.orders.map(o=>o.id),
        status:comboDriverName?'assigned':'planning',note:'',driverWork:0,weightRate:0,tripAllowance:0,attendanceStatus:'pending',totalWeight:w,
        createdAt:fmtDate(),updatedBy:currentUser.name,updatedAt:fmtDT()
      });
    });
    onSave(newTrips);
  };

  return h(Modal,{title:'Tạo nhiều chuyến cùng lúc',onClose,lg:true},
    h('div',{className:'g2',style:{marginBottom:12}},
      h(F,{label:'Ngày giao'},h('input',{type:'date',value:date,onChange:e=>setDate(e.target.value)})),
      h('div',{style:{display:'flex',flexDirection:'column',gap:6}},
        h(F,{label:'Lái xe'},h('select',{value:driver,onChange:e=>{setDriver(e.target.value);const emp=drivers.find(x=>x.id===e.target.value);if(emp)setDriverName(emp.name);}},
          h('option',{value:''},'— Chọn từ danh sách —'),
          drivers.map(e=>h('option',{key:e.id,value:e.id},e.name))
        )),
        h(F,{label:'Hoặc nhập tên'},h('input',{value:driverName,onChange:e=>setDriverName(e.target.value),placeholder:'Tên lái xe...'}))
      )
    ),
    // Chọn ca
    allShifts.length>0&&h('div',{style:{marginBottom:12}},
      h('div',{style:{fontSize:12,fontWeight:600,color:'var(--tx2)',marginBottom:6}},
        'Chọn ca giao hàng cần tạo (mỗi ca = 1 chuyến)'
      ),
      h('div',{style:{display:'flex',gap:8,flexWrap:'wrap'}},
        allShifts.map(sh=>h('label',{key:sh.id,
          style:{display:'flex',alignItems:'center',gap:6,padding:'5px 12px',
            borderRadius:'var(--r)',border:'1px solid '+(selShifts.includes(sh.id)?'var(--pri)':'var(--bd)'),
            cursor:'pointer',background:selShifts.includes(sh.id)?'#f0faf0':'#fff',fontSize:13}
        },
          h('input',{type:'checkbox',checked:selShifts.includes(sh.id),onChange:()=>toggleShift(sh.id),style:{cursor:'pointer'}}),
          sh.name||sh.id
        ))
      )
    ),
    // Preview chuyến sẽ tạo
    preview.length>0&&h('div',{style:{marginBottom:12}},
      h('div',{style:{fontWeight:600,fontSize:13,color:'var(--pri3)',marginBottom:8}},
        '📋 Đã chọn '+selShifts.length+' ca · Sẽ tạo '+preview.length+' chuyến:'
      ),
      emptyRows.length>0&&h('div',{style:{fontSize:12,color:'#8A5A00',background:'#FFF7E6',border:'1px solid #F2C66D',borderRadius:'var(--r)',padding:'7px 10px',marginBottom:8}},
        emptyRows.length+' ca chưa có đơn; hệ thống vẫn tạo chuyến trống để nhận đơn phát sinh sau: '+emptyRows.map(c=>c.shiftName).join(', ')+'.'
      ),
      existingRows.length>0&&h('div',{style:{fontSize:12,color:'#1F5E8C',background:'#EEF6FC',border:'1px solid #9CC7E6',borderRadius:'var(--r)',padding:'7px 10px',marginBottom:8}},
        existingRows.length+' ca đã có chuyến trong ngày nên được bỏ qua: '+existingRows.map(c=>c.shiftName).join(', ')+'.'
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:8}},
        preview.map((combo,i)=>h('div',{key:i,style:{border:'1px solid var(--bd)',borderRadius:'var(--r)',
          padding:'8px 10px',background:combo.orders.length?'#f5fbf5':'#fffaf0'}},
          h('div',{style:{fontWeight:600,fontSize:13,color:'var(--pri)'}},combo.shiftName),
          h('div',{style:{fontSize:12,color:'var(--tx2)'}},combo.area||'Chuyến trống — chưa có đơn'),
          h('div',{style:{fontSize:12,marginTop:4}},combo.orders.length+' đơn · '+
            ordersWeight(combo.orders).toFixed(1)+' kg'
          )
        ))
      )
    ),
    preview.length===0&&date&&h('div',{style:{textAlign:'center',padding:'1rem',color:'var(--tx2)',fontSize:13}},
      selShifts.length?'Các ca đã chọn đều đã có chuyến trong ngày '+fmtDate2(date)+'.':'Chọn ca giao hàng cần tạo chuyến.'
    ),
    h(Row,null,
      h('button',{onClick:onClose},'Hủy'),
      h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'},disabled:preview.length===0},
        h('i',{className:'ti ti-stack-2',style:{fontSize:14}}),
        ' Tạo '+preview.length+' chuyến'
      )
    )
  );
}

function DriverTripWorkReportTab({trips,orders,products,customers,currentUser}){
  const[month,setMonth]=useState(isoDate().slice(0,7));
  const[driverFilter,setDriverFilter]=useState('');
  const[areaFilter,setAreaFilter]=useState('');
  const isDriver=currentUser?.role==='driver';
  const cleanName=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,' ');
  const isOwnTrip=trip=>trip?.driverId
    ?String(trip.driverId)===String(currentUser?.id||'')
    :cleanName(trip?.driverName)===cleanName(currentUser?.name);
  const scopedTrips=(trips||[]).filter(trip=>!isDriver||isOwnTrip(trip));
  const monthOf=value=>{
    const match=String(value||'').match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    return match?match[3]+'-'+match[2].padStart(2,'0'):'';
  };
  const dateKey=value=>{
    const match=String(value||'').match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    return match?match[3]+match[2].padStart(2,'0')+match[1].padStart(2,'0'):'';
  };
  const tripOrders=trip=>(orders||[]).filter(order=>(trip?.orderIds||[]).includes(order.id));
  const lineQty=line=>numFmt(line.qtyInvoice)||numFmt(line.qtyProd)||numFmt(line.qty)||numFmt(line.quantity)||0;
  const lineWeight=line=>{
    const product=(products||[]).find(item=>item.id===line.productId);
    const unit=String(line.unit||product?.unit||'').trim().toLowerCase().replace(/[^a-z]/g,'');
    const qty=lineQty(line);
    if(['kg','kgs','kilogram','kilograms'].includes(unit))return qty;
    return qty*(numFmt(product?.weightPerUnit)||numFmt(line.weightPerUnit)||0);
  };
  const orderWeight=order=>(order.lines||[]).reduce((sum,line)=>sum+lineWeight(line),0);
  const orderArea=order=>{
    if(order?.area)return order.area;
    const customer=(customers||[]).find(item=>item.id===order?.customerId);
    const point=(customer?.points||[]).find(item=>item.id===order?.pointId||item.name===order?.pointName);
    return point?.area||'';
  };
  const tripArea=trip=>trip?.area||[...new Set(tripOrders(trip).map(orderArea).filter(Boolean))].join(', ');
  const allRows=scopedTrips.filter(trip=>trip.driverName&&(!month||monthOf(trip.deliveryDate)===month)).map(trip=>{
    const tripOrderRows=tripOrders(trip);
    const weight=tripOrderRows.reduce((sum,order)=>sum+orderWeight(order),0)||numFmt(trip.totalWeight);
    const driverCompleted=!!trip.driverConfirmedAt||['completion_pending','completed'].includes(trip.status);
    const work=driverCompleted?numFmt(trip.driverWork):0;
    const kgPay=driverCompleted?weight*numFmt(trip.weightRate):0;
    const allowance=driverCompleted?numFmt(trip.tripAllowance):0;
    return{...trip,area:tripArea(trip),tripOrders:tripOrderRows,weight,driverCompleted,work,totalPay:kgPay+allowance};
  });
  const driverNames=[...new Set(allRows.map(row=>row.driverName).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const areaNames=[...new Set(allRows.map(row=>row.area).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const rows=allRows.filter(row=>(!driverFilter||row.driverName===driverFilter)&&(!areaFilter||row.area===areaFilter)).sort((a,b)=>dateKey(b.deliveryDate).localeCompare(dateKey(a.deliveryDate))||String(a.id||'').localeCompare(String(b.id||''),'vi'));
  const total=rows.reduce((sum,row)=>({
    trips:sum.trips+1,
    orders:sum.orders+row.tripOrders.length,
    weight:sum.weight+row.weight,
    work:sum.work+row.work,
    pay:sum.pay+row.totalPay,
    completed:sum.completed+(row.driverCompleted?1:0),
    incomplete:sum.incomplete+(row.driverCompleted?0:1)
  }),{trips:0,orders:0,weight:0,work:0,pay:0,completed:0,incomplete:0});
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-steering-wheel',style:{fontSize:20}}),'Công lái xe'),
    h('div',{className:'card',style:{marginBottom:'1rem'}},
      h('div',{style:{display:'grid',gridTemplateColumns:isDriver?'minmax(220px,360px)':'repeat(auto-fit,minmax(180px,1fr))',gap:10,alignItems:'end'}},
        h('label',null,h('span',null,'Tháng'),h('input',{type:'month',value:month,onChange:event=>setMonth(event.target.value||isoDate().slice(0,7))})),
        !isDriver&&h('label',null,h('span',null,'Lái xe'),h('select',{value:driverFilter,onChange:event=>setDriverFilter(event.target.value)},h('option',{value:''},'Tất cả lái xe'),driverNames.map(name=>h('option',{key:name,value:name},name)))),
        !isDriver&&h('label',null,h('span',null,'Khu vực'),h('select',{value:areaFilter,onChange:event=>setAreaFilter(event.target.value)},h('option',{value:''},'Tất cả khu vực'),areaNames.map(area=>h('option',{key:area,value:area},area))))
      ),
      null
    ),
    h('div',{className:'card'},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,marginBottom:10,flexWrap:'wrap'}},
        h('div',{style:{fontWeight:600,color:'var(--pri3)'}},h('i',{className:'ti ti-clipboard-check',style:{fontSize:16,marginRight:6}}),'Báo công lái xe theo chuyến'),
        h('div',{style:{display:'flex',gap:12,fontSize:12,color:'var(--tx2)',flexWrap:'wrap'}},
          h('span',null,'Chuyến: ',h('b',null,total.trips)),h('span',null,'Đơn: ',h('b',null,total.orders)),h('span',null,'Kg: ',h('b',null,total.weight.toFixed(1))),h('span',null,'Đã hoàn thành: ',h('b',null,total.completed)),h('span',null,'Chưa hoàn thành: ',h('b',null,total.incomplete)),h('span',null,'Công: ',h('b',null,total.work)),h('span',null,'Tổng tiền: ',h('b',null,total.pay.toLocaleString('vi-VN')))
        )
      ),
      rows.length?h('div',{className:'desktop-only tw'},h('table',null,
        h('thead',null,h('tr',null,...['Ngày','Lái xe','Khu vực','Khối lượng','Đã hoàn thành','Chưa hoàn thành','Công','Tiền công'].map(column=>h('th',{key:column},column)))),
        h('tbody',null,rows.map(row=>h('tr',{key:row.id},
          h('td',null,row.deliveryDate),h('td',null,row.driverName||'—'),h('td',null,row.area||'—'),h('td',null,row.weight.toFixed(2)+' kg'),h('td',null,row.driverCompleted?h('span',{style:{color:'#0F6E56',fontWeight:700}},'✓'):'—'),h('td',null,!row.driverCompleted?h('span',{style:{color:'#A32D2D',fontWeight:700}},'✓'):'—'),h('td',null,row.work),h('td',null,h('b',null,row.totalPay?row.totalPay.toLocaleString('vi-VN'):'—'))
        )))
      )):h('div',{style:{fontSize:13,color:'var(--tx2)',padding:'12px 0'}},'Chưa có chuyến theo bộ lọc hiện tại.'),
      rows.length>0&&h('div',{className:'mobile-only trip-attendance-list'},rows.map(row=>h('div',{key:'mobile-'+row.id,className:'mobile-data-card trip-attendance-card'},
        h('div',{className:'mobile-data-head'},h('div',null,h('div',{className:'mobile-data-title'},row.driverName||'—'),h('div',{className:'mobile-data-sub'},row.deliveryDate)),row.driverCompleted?h('span',{className:'badge',style:{background:'#E1F5EE',color:'#0F6E56'}},'Đã hoàn thành'):h('span',{className:'badge',style:{background:'#FCEBEB',color:'#A32D2D'}},'Chưa hoàn thành')),
        h('div',{className:'mobile-data-grid'},h('div',{className:'mobile-data-item'},h('b',null,'Khu vực'),h('span',null,row.area||'—')),h('div',{className:'mobile-data-item'},h('b',null,'Khối lượng'),h('span',null,row.weight.toFixed(2)+' kg')),h('div',{className:'mobile-data-item'},h('b',null,'Công'),h('span',null,row.work)),h('div',{className:'mobile-data-item'},h('b',null,'Tổng tiền'),h('span',null,row.totalPay?row.totalPay.toLocaleString('vi-VN')+' đ':'—')))
      )))
    )
  );
}

function AdditionalTripOrderForm({trip,customers,products,onSave,onClose}){
  const[customerId,setCustomerId]=useState('');
  const[pointId,setPointId]=useState('');
  const[lines,setLines]=useState([{id:uid(),productId:'',qty:''}]);
  const customer=(customers||[]).find(c=>String(c.id)===String(customerId));
  const points=customer?.points||[];
  const updateLine=(id,data)=>setLines(prev=>prev.map(l=>l.id===id?{...l,...data}:l));
  const submit=()=>{
    const point=points.find(p=>String(p.id)===String(pointId));
    const validLines=lines.filter(l=>l.productId&&numFmt(l.qty)>0).map(l=>{const product=(products||[]).find(p=>String(p.id)===String(l.productId))||{};return{id:l.id,productId:product.id||l.productId,productName:product.name||'',qtyProd:numFmt(l.qty),qtyInvoice:numFmt(l.qty),qtyDelivered:'',unit:product.unit||'',weightPerUnit:numFmt(product.weightPerUnit)};});
    if(!customerId||!pointId){window.showToast('Hãy chọn khách hàng và địa điểm giao.','warn');return;}
    if(!validLines.length){window.showToast('Hãy chọn sản phẩm và nhập số lượng lớn hơn 0.','warn');return;}
    onSave({customer,point,lines:validLines});
  };
  return h(Modal,{title:'Tạo đơn phát sinh trong chuyến',onClose,lg:true},
    h('div',{className:'additional-order-note'},h('i',{className:'ti ti-info-circle'}),' Mỗi chuyến chỉ được tạo 1 đơn phát sinh. Đơn cần kế toán duyệt trước khi hoàn thành chuyến.'),
    h('div',{className:'g2'},
      h(F,{label:'Khách hàng *'},h('select',{value:customerId,onChange:e=>{setCustomerId(e.target.value);setPointId('');}},h('option',{value:''},'— Chọn khách hàng —'),(customers||[]).map(c=>h('option',{key:c.id,value:c.id},c.name)))),
      h(F,{label:'Địa điểm giao *'},h('select',{value:pointId,disabled:!customerId,onChange:e=>setPointId(e.target.value)},h('option',{value:''},'— Chọn địa điểm —'),points.map(p=>h('option',{key:p.id,value:p.id},p.name))))
    ),
    h('div',{className:'additional-order-lines'},
      lines.map((line,index)=>h('div',{key:line.id,className:'additional-order-line'},
        h(F,{label:'Sản phẩm '+(index+1)+' *'},h('select',{value:line.productId,onChange:e=>updateLine(line.id,{productId:e.target.value})},h('option',{value:''},'— Chọn sản phẩm —'),(products||[]).filter(p=>p.active!==false).map(p=>h('option',{key:p.id,value:p.id},(p.code?p.code+' - ':'')+p.name)))),
        h(F,{label:'Số lượng *'},h('input',{type:'number',min:0,step:'0.01',inputMode:'decimal',value:line.qty,onChange:e=>updateLine(line.id,{qty:e.target.value}),placeholder:'Nhập số lượng'})),
        lines.length>1&&h('button',{className:'bi additional-order-remove',title:'Xóa sản phẩm',onClick:()=>setLines(prev=>prev.filter(l=>l.id!==line.id))},h('i',{className:'ti ti-trash'}))
      )),
      h('button',{className:'additional-order-add',onClick:()=>setLines(prev=>[...prev,{id:uid(),productId:'',qty:''}])},h('i',{className:'ti ti-plus'}),' Thêm sản phẩm')
    ),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit},h('i',{className:'ti ti-send'}),' Gửi kế toán duyệt'))
  );
}

function TripsTab({trips,setTrips,orders,setOrders,employees,shifts,prodShifts,customers,products,quotes,financeDebts,setFinanceDebts,currentUser,notify}){
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[open,so]=useState(null);const[additionalTrip,setAdditionalTrip]=useState(null);
  const _td1=fmtDate();const _ti1=_td1.split('/').reverse().join('-');const[fPeriod,sfPeriod]=useState('day');const[fDate,sfDate]=useState(_ti1);const[fMonth,sfMonth]=useState(_ti1.slice(0,7));const[fShift,sfShift]=useState('');const[fDriver,sfDriver]=useState('');
  const isDriver=currentUser?.role==='driver';
  const canManageTrips=currentUser?.role==='admin'||currentUser?.role==='manager';
  const deptKey=String(currentUser?.dept||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const isAccounting=deptKey.includes('ke toan');
  const canReviewTrips=currentUser?.role==='admin'||isAccounting;
  const canEditDeliveryOrder=canManageTrips||isAccounting;
  const cleanName=s=>String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
  const driverRecipient=trip=>{
    const byId=(employees||[]).find(e=>String(e.id||'')===String(trip?.driverId||''));
    const nameKey=cleanName(trip?.driverName);
    if(byId&&(!nameKey||cleanName(byId.name)===nameKey))return byId;
    const byName=nameKey?(employees||[]).find(e=>cleanName(e.name)===nameKey):null;
    return byName||null;
  };
  const driverRecipientId=trip=>driverRecipient(trip)?.id||'';
  const notifyTrip=(trip,title,message,icon='ti-truck-delivery')=>{
    const recipientId=driverRecipientId(trip);
    if(!recipientId)return false;
    notify?.({recipientId,title,message,icon,sourceType:'trip',sourceId:trip.id,targetPage:'trips'});
    return true;
  };
  const accountingRecipientIds=(employees||[]).filter(e=>e.role==='admin'||String(e.dept||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes('ke toan')).map(e=>e.id).filter(Boolean);
  const additionalOrderForTrip=trip=>(orders||[]).find(o=>o.additionalSourceTripId===trip.id||((trip.orderIds||[]).includes(o.id)&&o.isAdditionalTripOrder));
  const openAdditionalOrder=trip=>{
    if(!isDriver||!isOwnTrip(trip)||trip.status!=='active'){window.showToast('Chỉ tạo được đơn phát sinh trong chuyến của bạn đang giao.','warn');return;}
    if(additionalOrderForTrip(trip)){window.showToast('Chuyến này đã có 1 đơn phát sinh, không thể tạo thêm.','warn');return;}
    setAdditionalTrip(trip);sm('additional');
  };
  const createAdditionalOrder=({customer,point,lines})=>{
    const trip=additionalTrip;
    if(!trip||additionalOrderForTrip(trip)){window.showToast('Chuyến này đã có đơn phát sinh.','warn');sm(null);setAdditionalTrip(null);return;}
    const id='PS'+new Date().toISOString().replace(/\D/g,'').slice(2,14)+String(Math.floor(Math.random()*90)+10);
    const stamp=fmtDT();
    const order={id,deliveryDate:trip.deliveryDate||fmtDate(),deliveryTime:trip.deliveryTime||'',customerId:customer.id||'',customer:customer.name||'',pointId:point.id||'',pointName:point.name||'',address:point.address||'',area:point.area||'',lines,tripId:trip.id,status:'delivering',tripAssignMode:'driver_additional',isAdditionalTripOrder:true,additionalSourceTripId:trip.id,additionalApprovalStatus:'pending',additionalRequestedAt:stamp,additionalRequestedBy:currentUser?.name||'',additionalRequestedById:currentUser?.id||'',note:'Đơn phát sinh do lái xe tạo - chờ kế toán duyệt',createdAt:stamp,createdBy:currentUser?.name||'',updatedAt:stamp,orderHistory:[{id:'LS'+uid(),action:'Lái xe tạo đơn phát sinh',changes:['Chuyến: '+(trip.shiftName||trip.id)+' - '+trip.deliveryDate,'Địa điểm: '+(point.name||customer.name),'Hàng hóa: '+lines.map(l=>l.productName+': '+numFmt(l.qtyInvoice)+(l.unit?' '+l.unit:'')).join('; '),'Trạng thái: Chờ kế toán duyệt'],at:stamp,atIso:new Date().toISOString(),by:currentUser?.name||'',byId:currentUser?.id||''}]};
    setOrders(prev=>[...prev,order]);
    setTrips(prev=>prev.map(t=>t.id===trip.id?{...t,orderIds:[...(t.orderIds||[]),id],updatedAt:stamp}:t));
    notify?.({recipientIds:accountingRecipientIds,title:'Có đơn phát sinh cần duyệt',message:(trip.shiftName||trip.id)+' - '+trip.deliveryDate+' - '+(point.name||customer.name),icon:'ti-file-alert',sourceType:'order',sourceId:id,targetPage:'trips'});
    window.showToast('Đã thêm đơn phát sinh vào chuyến và gửi kế toán duyệt.','success');
    sm(null);setAdditionalTrip(null);
  };
  const approveAdditionalOrder=(trip,order)=>{
    if(!canReviewTrips||order?.additionalApprovalStatus!=='pending')return;
    const stamp=fmtDT();
    setOrders(prev=>prev.map(o=>o.id===order.id?{...o,additionalApprovalStatus:'approved',additionalApprovedAt:stamp,additionalApprovedBy:currentUser?.name||'',status:trip.status==='active'?'delivering':'assigned',updatedAt:stamp,updatedBy:currentUser?.name||'',orderHistory:[...(o.orderHistory||[]),{id:'LS'+uid(),action:'Kế toán duyệt đơn phát sinh',changes:['Trạng thái: Chờ kế toán duyệt → Đã duyệt'],at:stamp,atIso:new Date().toISOString(),by:currentUser?.name||'',byId:currentUser?.id||''}]}:o));
    notifyTrip(trip,'Đơn phát sinh đã được kế toán duyệt',(order.pointName||order.customer||order.id)+' - '+(order.lines||[]).length+' sản phẩm','ti-circle-check');
    window.showToast('Đã duyệt đơn phát sinh '+order.id+'.','success');
  };
  const isOwnTrip=t=>!isDriver||t.driverId===currentUser.id||cleanName(t.driverName)===cleanName(currentUser.name);
  const isDispatchedToDriver=trip=>!!trip?.driverDispatchedAt||['active','completion_pending','completed'].includes(trip?.status);
  const visibleTrips=trips.filter(t=>isOwnTrip(t)&&(!isDriver||isDispatchedToDriver(t)));
  useEffect(()=>{
    let target=null;
    try{target=JSON.parse(sessionStorage.getItem('scf_notification_target')||'null');}catch{}
    if(!target?.sourceId)return;
    let targetTrip=target.sourceType==='trip'?(trips||[]).find(t=>String(t.id)===String(target.sourceId)):null;
    if(!targetTrip&&target.sourceType==='order'){
      const targetOrder=(orders||[]).find(o=>String(o.id)===String(target.sourceId));
      targetTrip=(trips||[]).find(t=>String(t.id)===String(targetOrder?.tripId)||(t.orderIds||[]).includes(targetOrder?.id));
    }
    if(!targetTrip||!isOwnTrip(targetTrip))return;
    try{sessionStorage.removeItem('scf_notification_target');}catch{}
    const parts=String(targetTrip.deliveryDate||'').split('/');
    const isoDate=parts.length===3?parts[2]+'-'+parts[1].padStart(2,'0')+'-'+parts[0].padStart(2,'0'):'';
    sfPeriod('day');sfDate(isoDate);sfMonth('');sfShift('');sfDriver('');so(targetTrip.id);
    setTimeout(()=>document.getElementById('trip-card-'+targetTrip.id)?.scrollIntoView({behavior:'smooth',block:'start'}),250);
  },[trips.length,orders.length]);
  let tSeq=trips.length+1;
  const orderStatusForTrip=s=>s==='planning'?'pending':s==='assigned'?'assigned':s==='active'?'delivering':['completion_pending','completed'].includes(s)?'done':'pending';
  const save=d=>{
    if(edit){
      const old=trips.find(t=>t.id===edit.id);
      const tripId=edit.id;
      if(old){setOrders(p=>p.map(o=>{
        if((old.orderIds||[]).includes(o.id)&&!(d.orderIds||[]).includes(o.id))return {...o,tripId:null,status:'pending'};
        if((d.orderIds||[]).includes(o.id))return {...o,tripId,status:orderStatusForTrip(d.status)};
        return o;
      }));}
      setTrips(p=>p.map(t=>t.id===edit.id?{...edit,...d,id:tripId}:t));
      const updated={...edit,...d,id:tripId};
      const added=(updated.orderIds||[]).filter(id=>!(old?.orderIds||[]).includes(id)).length;
      const removed=(old?.orderIds||[]).filter(id=>!(updated.orderIds||[]).includes(id)).length;
      const oldDriverId=driverRecipientId(old),newDriverId=driverRecipientId(updated);
      if(updated.driverDispatchedAt&&newDriverId&&(newDriverId!==oldDriverId||added||removed))notifyTrip(updated,newDriverId!==oldDriverId?'Bạn được giao một chuyến':'Đơn hàng trong chuyến đã thay đổi',(updated.shiftName||updated.id)+' - '+updated.deliveryDate+(added||removed?' (thêm '+added+', bỏ '+removed+' đơn)':''));
      if(old?.driverDispatchedAt&&oldDriverId&&oldDriverId!==newDriverId)notify?.({recipientId:oldDriverId,title:'Chuyến đã chuyển cho lái xe khác',message:(old?.shiftName||old?.id)+' - '+(old?.deliveryDate||''),icon:'ti-user-share',sourceType:'trip',sourceId:tripId,targetPage:'trips'});
    } else {
      const [dd2,mm2,yy2]=(d.deliveryDate||fmtDate()).split('/');
      const datePart=(dd2||'00')+(mm2||'00')+(yy2||'0000').slice(-2);
      // Ca: lấy chữ viết tắt (CA SANG→S, CA TRUA→T, CA CHIEU→C, CA DEM→D)
      const shiftAbbr=(d.shiftName||'').toUpperCase()
        .replace(/CA\s*/,'')
        .replace(/SÁNG|SANG/,'S').replace(/TRƯA|TRUA/,'T')
        .replace(/CHIỀU|CHIEU/,'C').replace(/ĐÊM|DEM/,'D')
        .replace(/[^A-Z0-9]/g,'').slice(0,3)||'CA';
      // Lái xe: 2-3 chữ cái đầu họ tên
      const driverAbbr=d.driverName?(d.driverName.trim().split(/\s+/).map(w=>w[0]).join('').toUpperCase().slice(0,3)):'';
      const baseId='CH'+datePart+shiftAbbr+(driverAbbr?'_'+driverAbbr:'');
      // Tránh trùng: thêm số thứ tự nếu cần
      let id=baseId;
      let seq=2;
      while(trips.find(t=>t.id===id)){id=baseId+'_'+seq;seq++;}
      setTrips(p=>[...p,{...d,id,createdAt:fmtDate()}]);
      setOrders(p=>p.map(o=>(d.orderIds||[]).includes(o.id)?{...o,tripId:id,status:orderStatusForTrip(d.status)}:o));
    }
    sm(null);se(null);
  };
  const del=async id=>{
    const t=trips.find(x=>x.id===id);
    if(!t)return;
    if(['active','completion_pending','completed'].includes(t.status)){
      window.showToast('Chuyến đã bắt đầu nên không thể xóa.','warn');return;
    }
    if(!await window.scfConfirm('Bạn có chắc muốn xóa chuyến giao này?','Xóa chuyến giao',true))return;
    setOrders(p=>p.map(o=>(t.orderIds||[]).includes(o.id)?{...o,tripId:null,status:'pending'}:o));
    setTrips(p=>p.filter(x=>x.id!==id));
  };
  const updStatus=(id,status)=>{
    const t=trips.find(x=>x.id===id);
    if(!t)return;
    if(status==='assigned'&&!t.driverName){window.showToast('Hãy chọn lái xe trước khi giao chuyến.','warn');return;}
    const stamp=fmtDT();
    setTrips(p=>p.map(x=>x.id===id?{
      ...x,
      status,
      ...(status==='assigned'?{assignedAt:x.assignedAt||stamp}:{}),
      ...(status==='active'?{startTime:x.startTime||stamp}:{}),
      ...(status==='completion_pending'?{endTime:x.endTime||stamp,driverConfirmedAt:x.driverConfirmedAt||stamp}:{}),
      ...(status==='completed'?{completedAt:x.completedAt||stamp,attendanceStatus:x.attendanceStatus||'confirmed'}:{})
    }:x));
    if(t){
      if(status==='assigned')setOrders(p=>p.map(o=>(t.orderIds||[]).includes(o.id)?{...o,status:'assigned'}:o));
      if(status==='active')setOrders(p=>p.map(o=>(t.orderIds||[]).includes(o.id)?{...o,status:'delivering'}:o));
      if(status==='completion_pending'||status==='completed')setOrders(p=>p.map(o=>(t.orderIds||[]).includes(o.id)?{...o,status:'done'}:o));
    }
  };
  const dispatchTripToDriver=trip=>{
    if(!canReviewTrips)return;
    if(!trip?.driverName&&!trip?.driverId){window.showToast('Hãy chọn lái xe trước khi giao chuyến.','warn');return;}
    if(!['planning','assigned'].includes(trip.status)){window.showToast('Chuyến này không còn ở trạng thái có thể giao cho lái xe.','warn');return;}
    const recipient=driverRecipient(trip);
    if(!recipient){window.showToast('Không tìm thấy tài khoản lái xe “'+(trip.driverName||trip.driverId)+'”. Hãy mở Sửa chuyến và chọn lại lái xe từ danh sách.','error',7000);return;}
    const stamp=fmtDT();
    setTrips(prev=>prev.map(t=>t.id===trip.id?{
      ...t,
      driverId:recipient.id,
      driverName:recipient.name,
      status:'assigned',
      assignedAt:t.assignedAt||stamp,
      driverDispatchedAt:stamp,
      driverDispatchedBy:currentUser?.name||'',
      driverNotificationSentAt:stamp,
      driverNotificationRecipientId:recipient.id
    }:t));
    setOrders(prev=>prev.map(o=>(trip.orderIds||[]).includes(o.id)?{...o,status:'assigned'}:o));
    notifyTrip({...trip,driverId:recipient.id,driverName:recipient.name},'Chuyến đã sẵn sàng giao',(trip.shiftName||trip.id)+' - '+trip.deliveryDate+' - '+(trip.orderIds||[]).length+' đơn','ti-bell-ringing');
    window.showToast('Đã giao chuyến và gửi thông báo cho '+recipient.name+'.','success');
  };
  const resendTripNotification=trip=>{
    if(!canReviewTrips)return;
    const recipient=driverRecipient(trip);
    if(!recipient){window.showToast('Không tìm thấy tài khoản tương ứng với lái xe '+(trip.driverName||'')+'.','error');return;}
    const stamp=fmtDT();
    notifyTrip({...trip,driverId:recipient.id,driverName:recipient.name},'Nhắc lại: bạn có chuyến cần giao',(trip.shiftName||trip.id)+' - '+trip.deliveryDate+' - '+(trip.orderIds||[]).length+' đơn','ti-bell-ringing');
    setTrips(prev=>prev.map(t=>t.id===trip.id?{...t,driverId:recipient.id,driverName:recipient.name,driverNotificationSentAt:stamp,driverNotificationRecipientId:recipient.id}:t));
    window.showToast('Đã gửi lại thông báo cho '+recipient.name+'.','success');
  };
  const cancelDispatchToDriver=trip=>{
    if(!canReviewTrips)return;
    if(trip?.status!=='assigned'||!trip?.driverDispatchedAt){
      window.showToast('Chỉ hủy được khi chuyến đã giao cho lái xe nhưng chưa bắt đầu giao.','warn');return;
    }
    if(!window.confirm('Hủy giao chuyến này cho '+(trip.driverName||'lái xe')+'? Lái xe sẽ không còn nhìn thấy chuyến.'))return;
    const stamp=fmtDT();
    setTrips(prev=>prev.map(t=>t.id===trip.id?{
      ...t,
      driverDispatchedAt:'',
      driverDispatchedBy:'',
      driverDispatchCancelledAt:stamp,
      driverDispatchCancelledBy:currentUser?.name||'',
      driverAcknowledgedAt:'',
      startTime:''
    }:t));
    setOrders(prev=>prev.map(o=>(trip.orderIds||[]).includes(o.id)?{...o,status:'assigned'}:o));
    window.showToast('Đã hủy giao lái xe. Chuyến vẫn được giữ ở danh sách đã xếp.','success');
  };
  const lineQty=l=>numFmt(l.qtyInvoice)||numFmt(l.qtyProd)||numFmt(l.qty)||numFmt(l.quantity)||0;
  const lineWeight=l=>{const prod=products?.find(p=>p.id===l.productId);const unit=String(l.unit||prod?.unit||'').trim().toLowerCase().replace(/[^a-z]/g,'');const qty=lineQty(l);if(unit==='kg'||unit==='kgs'||unit==='kilogram'||unit==='kilograms')return qty;const wpu=prod?.weightPerUnit||numFmt(l.weightPerUnit)||0;return wpu*qty;};
  const orderWeight=o=>(o.lines||[]).reduce((s,l)=>s+lineWeight(l),0);
  const tripMatchKey=v=>String(v||'').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'');
  const sameTripRoute=(a,b)=>{
    const ak=tripMatchKey(a),bk=tripMatchKey(b);
    return !!ak&&!!bk&&(ak===bk||ak.includes(bk)||bk.includes(ak));
  };
  const orderArea=o=>{
    const resolved=findOrderPointMatch(o,customers||[]);
    return String(o?.area||resolved?.point?.area||'').trim();
  };
  const orderMatchesNewAutomaticTrip=(o,trip)=>{
    if(o?.tripAssignMode==='manual'||!['pending','assigned'].includes(String(o?.status||'pending')))return false;
    if(o?.tripId&&(trips||[]).some(t=>String(t.id||'')===String(o.tripId)))return false;
    if(String(getOrderTripDate(o,prodShifts||[])||'')!==String(trip?.deliveryDate||''))return false;
    const desiredId=String(getOrderTripShiftId(o,prodShifts||[])||'').trim();
    const desiredName=getOrderTripShiftName(o,prodShifts||[]);
    if(desiredId&&desiredId===String(trip?.shiftId||''))return true;
    if(desiredName&&sameTripRoute(desiredName,trip?.shiftName))return true;
    const area=orderArea(o);
    return !!area&&(sameTripRoute(area,trip?.area)||sameTripRoute(area,trip?.shiftName));
  };
  const deliveryOrderValue=o=>numFmt(o.deliveryOrder??o.deliverySeq??o.deliveryIndex);
  const sortedTripOrders=trip=>orders.filter(o=>(trip.orderIds||[]).includes(o.id)).sort((a,b)=>{
    const av=deliveryOrderValue(a),bv=deliveryOrderValue(b);
    const ao=av>0?av:999999,bo=bv>0?bv:999999;
    return ao-bo||(a.deliveryTime||'').localeCompare(b.deliveryTime||'')||(a.pointName||a.customer||'').localeCompare(b.pointName||b.customer||'','vi');
  });
  const updateDeliveryOrder=(orderId,value)=>{
    const v=numFmt(value);
    setOrders(prev=>prev.map(o=>o.id===orderId?{...o,deliveryOrder:v||'',deliverySeq:v||'',updatedBy:currentUser?.name||'',updatedAt:fmtDT()}:o));
  };
  const calcTripWeight=t=>{
    const tripOrders=sortedTripOrders(t);
    return tripOrders.reduce((s,o)=>s+orderWeight(o),0)||numFmt(t.totalWeight);
  };
  const tripDateObject=value=>{
    const m=String(value||'').match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if(!m)return null;
    return new Date(Number(m[3]),Number(m[2])-1,Number(m[1]));
  };
  const tripAgeDays=trip=>{
    const d=tripDateObject(trip?.deliveryDate);if(!d)return 0;
    const now=new Date(),today=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    return Math.floor((today-d)/86400000);
  };
  const isDriverCompletionLocked=trip=>isDriver&&!trip?.driverConfirmedAt&&tripAgeDays(trip)>=2;
  const canEditQtyForTrip=trip=>{
    if(currentUser?.role==='admin'||isAccounting)return true;
    if(currentUser?.role==='manager')return tripAgeDays(trip)<2&&!['completion_pending','completed'].includes(trip.status);
    return isDriver&&isOwnTrip(trip)&&!!trip?.driverDispatchedAt&&['assigned','active'].includes(trip.status)&&!isDriverCompletionLocked(trip);
  };
  const canUploadProofForTrip=trip=>{
    if(currentUser?.role==='admin'||isAccounting)return true;
    if(canManageTrips)return !['completion_pending','completed'].includes(trip.status);
    return isDriver&&isOwnTrip(trip)&&trip.status==='active'&&!isDriverCompletionLocked(trip);
  };
  const canManageOrderInvoice=canManageTrips||isAccounting||currentUser?.role==='admin';
  const canUploadDriverInvoice=(trip,order)=>{
    if(currentUser?.role==='admin'||isAccounting)return !['completed'].includes(trip.status);
    if(!isDriver||!isOwnTrip(trip)||isDriverCompletionLocked(trip))return false;
    if(trip.status==='active')return true;
    return trip.status==='completion_pending'&&order?.driverInvoiceReviewStatus==='rejected';
  };
  const canUploadSummaryInvoice=trip=>{
    if(currentUser?.role==='admin'||isAccounting)return trip.status!=='completed';
    if(!isDriver||!isOwnTrip(trip)||isDriverCompletionLocked(trip))return false;
    return trip.status==='active'||(trip.status==='completion_pending'&&trip.summaryInvoiceReviewStatus==='rejected');
  };
  const completionIssues=(trip,sourceOrders=orders)=>{
    const tripOrders=(sourceOrders||[]).filter(o=>(trip.orderIds||[]).includes(o.id));
    const missingInvoice=tripOrders.filter(o=>!o.driverInvoiceImage);
    const missingQty=[];
    tripOrders.forEach(o=>(o.lines||[]).forEach(l=>{if(l.qtyDelivered===undefined||l.qtyDelivered==='')missingQty.push((o.pointName||o.id)+' / '+(l.productName||'Sản phẩm'));}));
    const issues=[];
    if(!tripOrders.length)issues.push('chuyến chưa có đơn hàng');
    if(!trip.summaryInvoiceImage)issues.push('chưa có hóa đơn tổng');
    if(missingInvoice.length)issues.push(missingInvoice.length+' đơn chưa có hóa đơn giao hàng');
    if(missingQty.length)issues.push(missingQty.length+' dòng chưa nhập số lượng đã giao');
    const pendingAdditional=tripOrders.filter(o=>o.isAdditionalTripOrder&&o.additionalApprovalStatus!=='approved');
    if(pendingAdditional.length)issues.push(pendingAdditional.length+' đơn phát sinh đang chờ kế toán duyệt');
    return{issues,missingInvoice,missingQty,pendingAdditional};
  };
  const approvalIssues=(trip,sourceOrders=orders)=>{
    const base=completionIssues(trip,sourceOrders);
    const tripOrders=(sourceOrders||[]).filter(o=>(trip.orderIds||[]).includes(o.id));
    const unapprovedInvoices=tripOrders.filter(o=>o.driverInvoiceReviewStatus!=='approved');
    const issues=[...base.issues];
    if(unapprovedInvoices.length)issues.push(unapprovedInvoices.length+' HĐ LX chưa được duyệt');
    if(trip.summaryInvoiceReviewStatus!=='approved')issues.push('hóa đơn tổng chưa được duyệt');
    return{...base,issues,unapprovedInvoices};
  };
  const syncTripReceivables=(trip,sourceOrders,notify=false)=>{
    if(typeof setFinanceDebts!=='function'||typeof financeTripReceivableDrafts!=='function')return{rows:[],missingPrice:0};
    const draft=financeTripReceivableDrafts(trip,sourceOrders,products,quotes,customers,currentUser);
    setFinanceDebts(prev=>{
      const old=(prev||[]).filter(x=>x.sourceTripId===trip.id);
      const generated=draft.rows.map(row=>{
        const existed=old.find(x=>x.partnerId===row.partnerId||(!x.partnerId&&x.partnerName===row.partnerName));
        if(!existed)return row;
        const paid=numFmt(existed.paidAmount);
        return{...row,id:existed.id,paidAmount:paid,dueDate:existed.dueDate||row.dueDate,createdBy:existed.createdBy||row.createdBy,createdAt:existed.createdAt||row.createdAt,status:paid>=row.amount?'paid':paid>0?'partial':'unpaid'};
      });
      return[...(prev||[]).filter(x=>x.sourceTripId!==trip.id),...generated];
    });
    if(notify&&draft.missingPrice)window.showToast('Đã chuyển công nợ nhưng còn '+draft.missingPrice+' dòng thiếu đơn giá. Kế toán cần kiểm tra.','warn');
    return draft;
  };
  const acknowledgeTrip=trip=>{
    if(!isDriver||!isOwnTrip(trip)){window.showToast('Bạn không phải lái xe của chuyến này.','warn');return;}
    if(!['assigned','active'].includes(trip.status)){window.showToast('Chuyến chưa ở trạng thái có thể xác nhận.','warn');return;}
    const assignedOrders=(orders||[]).filter(o=>(trip.orderIds||[]).includes(o.id));
    if(!assignedOrders.length){window.showToast('Chuyến chưa có đơn hàng nên chưa thể bắt đầu.','warn');return;}
    if(isDriverCompletionLocked(trip)){window.showToast('Chuyến đã quá 2 ngày và bị khóa. Hãy liên hệ kế toán.','warn');return;}
    const stamp=fmtDT();
    setTrips(prev=>prev.map(t=>t.id===trip.id?{...t,status:'active',driverAcknowledgedAt:t.driverAcknowledgedAt||stamp,startTime:t.startTime||stamp}:t));
    setOrders(prev=>prev.map(o=>(trip.orderIds||[]).includes(o.id)?{...o,status:'delivering'}:o));
    window.showToast('Đã nhận chuyến và bắt đầu giao. Hãy nhập đủ số lượng giao và tải hóa đơn để hoàn thành.','success');
  };
  const driverCompleteTrip=trip=>{
    if(!isDriver||!isOwnTrip(trip)){window.showToast('Bạn không phải lái xe của chuyến này.','warn');return;}
    if(trip.status!=='active'){window.showToast('Bạn cần bấm Bắt đầu giao trước.','warn');return;}
    if(isDriverCompletionLocked(trip)){window.showToast('Đã quá 2 ngày nên phần xác nhận hoàn thành đã khóa. Hãy liên hệ kế toán.','warn');return;}
    const check=completionIssues(trip);
    if(check.issues.length){window.showToast('Chưa thể hoàn thành: '+check.issues.join('; ')+'.','warn');return;}
    const stamp=fmtDT();
    const nextOrders=orders.map(o=>(trip.orderIds||[]).includes(o.id)?{...o,status:'done',driverCompletedAt:stamp}:o);
    const revenueDraft=typeof financeTripReceivableDrafts==='function'?financeTripReceivableDrafts(trip,nextOrders,products,quotes,customers,currentUser):{actualRevenue:0,invoiceRevenue:0};
    const completedTrip={...trip,status:'completion_pending',driverConfirmedAt:stamp,endTime:stamp,attendanceStatus:'pending',actualRevenueAmount:revenueDraft.actualRevenue||0,invoiceDebtAmount:revenueDraft.invoiceRevenue||0,revenueCalculatedAt:stamp};
    setTrips(prev=>prev.map(t=>t.id===trip.id?completedTrip:t));
    setOrders(nextOrders);
    syncTripReceivables(completedTrip,nextOrders,true);
    window.showToast('Đã tạo doanh thu theo SL thực giao, công nợ theo SL HĐ và gửi chuyến sang kế toán duyệt.','success');
  };
  const approveTripCompletion=trip=>{
    if(!canReviewTrips)return;
    if(trip.status!=='completion_pending'){window.showToast('Chuyến chưa chờ kế toán duyệt.','warn');return;}
    const check=approvalIssues(trip);
    if(check.issues.length){window.showToast('Chưa thể duyệt: '+check.issues.join('; ')+'.','warn');return;}
    const stamp=fmtDT();
    const approved={...trip,status:'completed',completedAt:stamp,accountingConfirmedAt:stamp,accountingConfirmedBy:currentUser?.name||'',attendanceStatus:'confirmed'};
    const nextOrders=orders.map(o=>(trip.orderIds||[]).includes(o.id)?{...o,status:'done',accountingConfirmedAt:stamp}:o);
    setTrips(prev=>prev.map(t=>t.id===trip.id?approved:t));
    setOrders(nextOrders);
    syncTripReceivables(approved,nextOrders,true);
    window.showToast('Đã duyệt hoàn thành chuyến '+trip.id+'.','success');
  };
  const filteredTrips=visibleTrips.filter(t=>{
    const dateParts=String(t.deliveryDate||'').split('/');
    const tripMonth=dateParts.length===3?dateParts[2]+'-'+dateParts[1]:'';
    const dateMatched=fPeriod==='month'?(!fMonth||tripMonth===fMonth):(!fDate||t.deliveryDate===fDate.split('-').reverse().join('/'));
    return dateMatched&&(!fShift||t.shiftId===fShift)&&(!fDriver||t.driverName===fDriver);
  });
  const tripAreaText=trip=>{
    if(trip?.area)return trip.area;
    const areas=[...new Set(sortedTripOrders(trip).map(order=>{
      const customer=(customers||[]).find(c=>c.id===order.customerId);
      const point=(customer?.points||[]).find(p=>p.id===order.pointId||p.name===order.pointName);
      return order.area||point?.area||'';
    }).filter(Boolean))];
    return areas.join(', ');
  };
  const saveOrderInvoiceImage=async(order,file)=>{
    if(!file)return;
    try{
      const url=await uploadPhoto(file,'order-invoices/'+(order.id||'order'));
      setOrders(prev=>prev.map(x=>x.id===order.id?{...x,invoiceImage:url,invoiceImageName:file.name||'hoa-don.jpg',invoiceUploadedAt:fmtDT(),invoiceUploadedBy:currentUser?.name||''}:x));
    }catch(e){window.showToast('Không đọc được ảnh hóa đơn: '+(e.message||e),'error');}
  };
  const saveDriverInvoiceImage=async(order,file)=>{
    if(!file)return;
    try{
      const url=await uploadPhoto(file,'driver-invoices/'+(order.id||'order'));
      setOrders(prev=>prev.map(x=>x.id===order.id?{
        ...x,driverInvoiceImage:url,driverInvoiceImageName:file.name||'hoa-don-lai-xe.jpg',
        driverInvoiceUploadedAt:fmtDT(),driverInvoiceUploadedBy:currentUser?.name||'',
        driverInvoiceReviewStatus:'pending',driverInvoiceReviewReason:'',driverInvoiceReviewedAt:'',driverInvoiceReviewedBy:''
      }:x));
      window.showToast('Đã tải HĐ LX. Kế toán sẽ kiểm tra và duyệt.','success');
    }catch(e){window.showToast('Không tải được HĐ LX: '+(e.message||e),'error');}
  };
  const pickDriverInvoiceImage=(trip,order)=>{
    if(!canUploadDriverInvoice(trip,order)){window.showToast('HĐ LX hiện không ở trạng thái được tải hoặc thay lại.','warn');return;}
    const inp=document.createElement('input');inp.type='file';inp.accept='image/*';inp.capture='environment';
    inp.onchange=e=>saveDriverInvoiceImage(order,e.target.files&&e.target.files[0]);inp.click();
  };
  const reviewDriverInvoice=(trip,order,approved)=>{
    if(!canReviewTrips||trip.status!=='completion_pending'){window.showToast('Chuyến chưa ở bước kế toán duyệt.','warn');return;}
    if(!order?.driverInvoiceImage){window.showToast('Đơn này chưa có HĐ LX.','warn');return;}
    const reason=approved?'':String(window.prompt('Nhập lý do chưa duyệt (ví dụ: hóa đơn sai, ảnh chụp mờ):',order.driverInvoiceReviewReason||'')||'').trim();
    if(!approved&&!reason){window.showToast('Cần nhập lý do để lái xe biết và tải lại hóa đơn.','warn');return;}
    const stamp=fmtDT();
    setOrders(prev=>prev.map(x=>x.id===order.id?{...x,driverInvoiceReviewStatus:approved?'approved':'rejected',driverInvoiceReviewReason:reason,driverInvoiceReviewedAt:stamp,driverInvoiceReviewedBy:currentUser?.name||''}:x));
    window.showToast(approved?'Đã duyệt HĐ LX.':'Đã trả lại HĐ LX cho lái xe tải lại.','success');
  };
  const pickOrderInvoiceImage=order=>{
    const inp=document.createElement('input');
    inp.type='file';inp.accept='image/*';inp.capture='environment';
    inp.onchange=e=>saveOrderInvoiceImage(order,e.target.files&&e.target.files[0]);
    inp.click();
  };
  const removeOrderInvoiceImage=async order=>{
    if(!order?.invoiceImage)return;
    if(!await window.scfConfirm('Xóa ảnh hóa đơn của đơn '+(order.id||'')+'?\nĐơn hàng vẫn được giữ nguyên.','Xóa ảnh hóa đơn',true))return;
    setOrders(prev=>prev.map(x=>x.id===order.id?{
      ...x,
      invoiceImage:'',
      invoiceImageName:'',
      invoiceUploadedAt:'',
      invoiceUploadedBy:'',
      invoiceImageRemovedAt:fmtDT(),
      invoiceImageRemovedBy:currentUser?.name||''
    }:x));
    window.showToast('Đã xóa ảnh hóa đơn của đơn '+(order.id||'')+'.','success');
  };
  const saveTripSummaryInvoice=async(trip,file)=>{
    if(!file)return;
    try{
      const url=await uploadPhoto(file,'trip-summary-invoices/'+(trip.id||'trip'));
      setTrips(prev=>prev.map(t=>t.id===trip.id?{...t,summaryInvoiceImage:url,summaryInvoiceImageName:file.name||'hoa-don-tong.jpg',summaryInvoiceUploadedAt:fmtDT(),summaryInvoiceUploadedBy:currentUser?.name||'',summaryInvoiceReviewStatus:'pending',summaryInvoiceReviewReason:'',summaryInvoiceReviewedAt:'',summaryInvoiceReviewedBy:''}:t));
    }catch(e){window.showToast('Không đọc được hóa đơn tổng: '+(e.message||e),'error');}
  };
  const pickTripSummaryInvoice=trip=>{
    if(!canUploadSummaryInvoice(trip)){window.showToast('Hóa đơn tổng hiện không ở trạng thái được tải hoặc thay lại.','warn');return;}
    const inp=document.createElement('input');
    inp.type='file';inp.accept='image/*';inp.capture='environment';
    inp.onchange=e=>saveTripSummaryInvoice(trip,e.target.files&&e.target.files[0]);
    inp.click();
  };
  const reviewTripSummaryInvoice=(trip,approved)=>{
    if(!canReviewTrips||trip.status!=='completion_pending'){window.showToast('Chuyến chưa ở bước kế toán duyệt.','warn');return;}
    if(!trip?.summaryInvoiceImage){window.showToast('Chuyến chưa có hóa đơn tổng.','warn');return;}
    const reason=approved?'':String(window.prompt('Nhập lý do chưa duyệt hóa đơn tổng:',trip.summaryInvoiceReviewReason||'')||'').trim();
    if(!approved&&!reason){window.showToast('Cần nhập lý do để lái xe biết và tải lại hóa đơn.','warn');return;}
    const stamp=fmtDT();
    setTrips(prev=>prev.map(t=>t.id===trip.id?{...t,summaryInvoiceReviewStatus:approved?'approved':'rejected',summaryInvoiceReviewReason:reason,summaryInvoiceReviewedAt:stamp,summaryInvoiceReviewedBy:currentUser?.name||''}:t));
    window.showToast(approved?'Đã duyệt hóa đơn tổng.':'Đã trả lại hóa đơn tổng cho lái xe tải lại.','success');
  };
  const removeTripSummaryInvoice=async trip=>{
    if(!trip?.summaryInvoiceImage)return;
    if(!await window.scfConfirm('Xóa hóa đơn tổng của chuyến '+trip.id+'?','Xóa hóa đơn tổng',true))return;
    setTrips(prev=>prev.map(t=>t.id===trip.id?{...t,summaryInvoiceImage:'',summaryInvoiceImageName:'',summaryInvoiceUploadedAt:'',summaryInvoiceUploadedBy:'',summaryInvoiceReviewStatus:'',summaryInvoiceReviewReason:'',summaryInvoiceReviewedAt:'',summaryInvoiceReviewedBy:'',summaryInvoiceRemovedAt:fmtDT()}:t));
  };
  const updateDeliveredQty=(trip,orderId,lineId,value)=>{
    if(!canEditQtyForTrip(trip))return;
    const qty=numFmt(value);
    const nextOrders=orders.map(o=>o.id===orderId?{...o,lines:(o.lines||[]).map(l=>l.id===lineId?{...l,qtyDelivered:qty,deliveredAt:fmtDT(),deliveredBy:currentUser?.name||''}:l)}:o);
    setOrders(nextOrders);
    if(['completion_pending','completed'].includes(trip.status)){
      const draft=syncTripReceivables(trip,nextOrders,false);
      setTrips(prev=>prev.map(t=>t.id===trip.id?{...t,actualRevenueAmount:draft.actualRevenue||0,invoiceDebtAmount:draft.invoiceRevenue||0,revenueCalculatedAt:fmtDT()}:t));
    }
  };
  const createTripForSelection=()=>{
    if(!canManageTrips)return;
    if(!fDate){window.showToast('Vui lòng chọn ngày giao trước khi tạo chuyến!','warn');return;}
    if(!fShift){window.showToast('Vui lòng chọn ca giao hàng!','warn');return;}
    const sh=(shifts||[]).find(x=>x.id===fShift);
    if(!sh){window.showToast('Ca giao hàng không hợp lệ!','error');return;}
    const dateVN=fDate.split('-').reverse().join('/');
    const existed=trips.find(t=>t.deliveryDate===dateVN&&t.shiftId===sh.id);
    if(existed){window.showToast('Ngày '+dateVN+' đã có chuyến của ca này rồi: '+existed.id+'. Không tạo thêm.','warn');return;}
    const [dd2,mm2,yy2]=dateVN.split('/');
    const datePart=(dd2||'00')+(mm2||'00')+(yy2||'0000').slice(-2);
    const shiftAbbr=(sh.name||sh.id||'').toUpperCase()
      .replace(/CA\s*/,'')
      .replace(/SÁNG|SANG/,'S').replace(/TRƯA|TRUA/,'T')
      .replace(/CHIỀU|CHIEU/,'C').replace(/ĐÊM|DEM/,'D')
      .replace(/[^A-Z0-9]/g,'').slice(0,3)||'CA';
    const baseId='CH'+datePart+shiftAbbr;
    let id=baseId;let seq=2;
    while(trips.find(t=>t.id===id)){id=baseId+'_'+seq;seq++;}
    const stamp=fmtDT();
    const draftTrip={
      id,deliveryDate:dateVN,deliveryTime:sh.timeStart||sh.startTime||'',
      shiftId:sh.id,shiftName:sh.name||sh.id,area:sh.area||'',
      driverName:sh.defaultDriverName||'',driverId:sh.defaultDriverId||'',driverAssignMode:sh.defaultDriverId||sh.defaultDriverName?'auto':'',
      status:sh.defaultDriverId||sh.defaultDriverName?'assigned':'planning',note:'',driverWork:0,weightRate:0,tripAllowance:0,
      attendanceStatus:'pending',createdAt:stamp,updatedBy:currentUser.name,updatedAt:stamp
    };
    const matchedOrders=(orders||[]).filter(o=>orderMatchesNewAutomaticTrip(o,draftTrip));
    const matchedIds=matchedOrders.map(o=>o.id);
    const newTrip={...draftTrip,orderIds:matchedIds,totalWeight:matchedOrders.reduce((sum,o)=>sum+orderWeight(o),0)};
    setTrips(p=>[...p,newTrip]);
    if(matchedIds.length)setOrders(p=>p.map(o=>matchedIds.includes(o.id)?{...o,tripId:id,tripAssignMode:'auto',status:'assigned',updatedAt:stamp,updatedBy:currentUser.name}:o));
    window.showToast('Đã tạo chuyến '+id+(matchedIds.length?' và tự xếp '+matchedIds.length+' đơn phù hợp.':'. Chưa có đơn tự động phù hợp.'),matchedIds.length?'success':'info',6000);
    so(id);
  };
  const printTrip=trip=>{
    const tripOrders=sortedTripOrders(trip);
    const totalW=calcTripWeight(trip);
    const rows=tripOrders.map(o=>{
      const ow=orderWeight(o);
      const items=(o.lines||[]).reduce((s,l)=>s+(l.productName?'• '+l.productName+' '+lineQty(l)+(l.unit?' '+l.unit:'')+'<br>':''),'');
      return '<tr><td style="text-align:center">'+(deliveryOrderValue(o)||'')+'</td><td>'+(o.pointName||o.customer||'')+'</td><td>'+(o.deliveryTime||'')+'</td><td>'+items+'</td><td style="font-weight:700">'+ow.toFixed(2)+'</td></tr>';
    }).join('');
    const printHtml='<html><head><meta charset="UTF-8"><title>Chuyến '+trip.id+'</title><style>body{font-family:Arial;padding:16px;font-size:13px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #333;padding:5px 8px}th{background:#d9e8d9}h2{color:#2d6a4f}.total{font-weight:700;text-align:right;padding:8px;background:#f5fbf5}@media print{@page{size:A4;margin:8mm}body{padding:0}}<\/style><\/head><body><h2>Chuyến giao hàng</h2><p>Ngày: <b>'+trip.deliveryDate+'</b> &nbsp;|&nbsp; Ca: <b>'+(trip.shiftName||'—')+'</b> &nbsp;|&nbsp; Lái xe: <b>'+(trip.driverName||'—')+'</b> &nbsp;|&nbsp; Tổng KL: <b>'+totalW.toFixed(2)+' kg</b></p><table><thead><tr><th>STT</th><th>Địa điểm</th><th>Giờ</th><th>Hàng hóa</th><th>KL (kg)</th></tr></thead><tbody>'+rows+'<\/tbody><\/table><div class="total">Tổng: '+tripOrders.length+' đơn — '+totalW.toFixed(2)+' kg</div><br><div style="display:flex;justify-content:space-between;margin-top:24px"><div style="text-align:center;width:40%"><div>Lái xe</div><div style="height:50px"></div><small>(Ký tên)</small></div><div style="text-align:center;width:40%"><div>Người nhận</div><div style="height:50px"></div><small>(Ký tên)</small></div></div><\/body><\/html>';
    if(window.scfShouldUsePrintAgent?.()){
      window.scfQueueA4Print(printHtml,{title:'Đơn tổng chuyến · '+trip.deliveryDate+' · '+(trip.shiftName||'')})
        .then(()=>window.showToast('Đã gửi đơn tổng chuyến tới Canon 2900.','success'))
        .catch(error=>window.showToast(error?.message||'Chưa gửi được đơn tổng chuyến tới Canon 2900.','error'));
      return;
    }
    const w=window.open('','_blank','width=900,height=700');
    if(!w){window.showToast('Trình duyệt đang chặn popup in. Hãy cho phép popup.','warn');return;}
    w.document.write(printHtml);
    w.document.close();setTimeout(()=>w.print(),400);
  };
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-steering-wheel',style:{fontSize:20}}),'Chuyến giao hàng'),
    h('div',{className:'trip-toolbar-actions',style:{display:'flex',justifyContent:'flex-end',gap:8,marginBottom:'1rem'}},
      canManageTrips&&h('button',{
        onClick:()=>sm('bulk'),
        style:{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',fontSize:13,
          border:'1px solid var(--pri)',color:'var(--pri)',background:'transparent',
          borderRadius:'var(--r)',cursor:'pointer',fontWeight:500}
      },h('i',{className:'ti ti-stack-2',style:{fontSize:15}}),'Tạo nhiều chuyến'),
      canManageTrips&&h(AddBtn,{onClick:createTripForSelection,label:'Tạo chuyến mới'})
    ),
    h('div',{className:'trip-filter-row',style:{display:'flex',gap:8,marginBottom:'1rem',flexWrap:'wrap'}},
      h('select',{value:fPeriod,onChange:e=>sfPeriod(e.target.value),style:{padding:'6px 10px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:13}},
        h('option',{value:'day'},'Theo ngày'),
        h('option',{value:'month'},'Theo tháng')
      ),
      fPeriod==='month'
        ?h('input',{type:'month',value:fMonth,onChange:e=>sfMonth(e.target.value),style:{padding:'6px 10px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:13}})
        :h('input',{type:'date',value:fDate,onChange:e=>sfDate(e.target.value),style:{padding:'6px 10px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:13}}),
      h('select',{value:fShift,onChange:e=>sfShift(e.target.value),style:{padding:'6px 10px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:13}},
        h('option',{value:''},'Tất cả ca'),
        (shifts||[]).map(sh=>h('option',{key:sh.id,value:sh.id},sh.name||sh.id))
      ),
      !isDriver&&h('select',{value:fDriver,onChange:e=>sfDriver(e.target.value),style:{padding:'6px 10px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:13}},
        h('option',{value:''},'Tất cả lái xe'),
        [...new Set(visibleTrips.map(t=>t.driverName).filter(Boolean))].map(d=>h('option',{key:d,value:d},d))
      ),
      ((fPeriod==='month'?fMonth:fDate)||fShift||fDriver)&&h('button',{'data-scf-action':'view',onClick:()=>{sfDate('');sfMonth('');sfShift('');sfDriver('');},style:{padding:'6px 10px',fontSize:12,borderRadius:'var(--r)',border:'1px solid var(--bd)',cursor:'pointer',color:'var(--tx2)'}},'✕ Xóa lọc')
    ),
    filteredTrips.length?h('div',{style:{display:'flex',flexDirection:'column',gap:'1rem'}},
      filteredTrips.map(trip=>{
        const tripOrders=sortedTripOrders(trip);
        const isOpen=open===trip.id;
        const totalW=calcTripWeight(trip);
        const completionLocked=isDriverCompletionLocked(trip);
        const canEditTripQty=canEditQtyForTrip(trip);
        const canUploadTripProof=canUploadProofForTrip(trip);
        return h('div',{key:trip.id,id:'trip-card-'+trip.id,className:'card notification-trip-target',style:{padding:0,overflow:'hidden',scrollMarginTop:120}},
          h('div',{className:'trip-card-head',style:{display:'flex',alignItems:'center',gap:12,padding:'1rem 1.25rem',cursor:'pointer'},onClick:()=>so(isOpen?null:trip.id)},
            h('i',{className:'ti ti-chevron-'+(isOpen?'up':'down'),style:{fontSize:16,color:'var(--tx2)',flexShrink:0}}),
            h('div',{className:'trip-card-main',style:{flex:1}},
              h('div',{style:{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4}},
                h('span',{style:{fontWeight:500}},trip.deliveryDate&&trip.shiftName?trip.deliveryDate+' — '+trip.shiftName:trip.id),
                h('span',{style:{color:'var(--tx2)'}},trip.driverName||'—'),
                h(StatusBadge,{s:trip.status}),
                trip.driverDispatchedAt&&trip.status==='assigned'&&h('span',{className:'badge',style:{background:'#E1F5EE',color:'#0F6E56'}},'Đã giao LX')
              ),
              h('div',{style:{display:'flex',gap:16,fontSize:12,color:'var(--tx2)',flexWrap:'wrap'}},
                trip.driverWork?h('span',null,h('i',{className:'ti ti-tools',style:{fontSize:12,marginRight:3}}),'Công: '+trip.driverWork):null,
                h('span',null,h('i',{className:'ti ti-package',style:{fontSize:12,marginRight:3}}),tripOrders.length+' đơn'),
                totalW>0&&h('span',{style:{color:'var(--pri)',fontWeight:500}},h('i',{className:'ti ti-weight',style:{fontSize:12,marginRight:3}}),totalW.toFixed(2)+' kg')
              )
            ),
            h('div',{className:'trip-card-actions',style:{display:'flex',gap:4},onClick:e=>e.stopPropagation()},
              canReviewTrips&&['planning','assigned'].includes(trip.status)&&!trip.driverDispatchedAt&&h('button',{onClick:()=>dispatchTripToDriver(trip),style:{fontSize:11,padding:'4px 10px',background:'#E6F1FB',color:'#185FA5',border:'none',borderRadius:4}},'Giao lái xe'),
              canReviewTrips&&trip.status==='assigned'&&trip.driverDispatchedAt&&h('button',{onClick:()=>resendTripNotification(trip),title:trip.driverNotificationSentAt?'Đã gửi gần nhất: '+trip.driverNotificationSentAt:'Gửi lại thông báo cho lái xe',style:{fontSize:11,padding:'4px 10px',background:'#E6F1FB',color:'#185FA5',border:'none',borderRadius:4}},h('i',{className:'ti ti-bell-ringing'}),' Gửi lại TB'),
              canReviewTrips&&trip.status==='assigned'&&trip.driverDispatchedAt&&h('button',{'data-scf-action':'write',onClick:()=>cancelDispatchToDriver(trip),style:{fontSize:11,padding:'4px 10px',background:'#FCEBEB',color:'#A32D2D',border:'none',borderRadius:4}},'Hủy giao LX'),
              isDriver&&isOwnTrip(trip)&&trip.status==='assigned'&&!completionLocked&&h('button',{onClick:()=>acknowledgeTrip(trip),style:{fontSize:11,padding:'4px 10px',background:'#EAF3DE',color:'#3B6D11',border:'none',borderRadius:4}},'Bắt đầu giao'),
              isDriver&&isOwnTrip(trip)&&trip.status==='active'&&!completionLocked&&h('button',{onClick:()=>openAdditionalOrder(trip),disabled:!!additionalOrderForTrip(trip),style:{fontSize:11,padding:'4px 10px',background:additionalOrderForTrip(trip)?'#E5E7EB':'#FFF3CD',color:additionalOrderForTrip(trip)?'#64748B':'#8A5A00',border:'none',borderRadius:4}},additionalOrderForTrip(trip)?'Đã có đơn PS':'+ Đơn phát sinh'),
              isDriver&&isOwnTrip(trip)&&trip.status==='active'&&!completionLocked&&h('button',{onClick:()=>driverCompleteTrip(trip),style:{fontSize:11,padding:'4px 10px',background:'#E1F5EE',color:'#0F6E56',border:'none',borderRadius:4}},'Giao hoàn thành'),
              canReviewTrips&&trip.status==='completion_pending'&&h('button',{onClick:()=>approveTripCompletion(trip),style:{fontSize:11,padding:'4px 10px',background:'#E1F5EE',color:'#0F6E56',border:'none',borderRadius:4}},'Kế toán duyệt'),
              h('button',{className:'bi',title:'In chuyến',onClick:()=>printTrip(trip)},h('i',{className:'ti ti-printer',style:{fontSize:15}})),
              canManageTrips&&h('button',{className:'bi',onClick:()=>{se(trip);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
              canManageTrips&&['planning','assigned'].includes(trip.status)&&h('button',{className:'bi',onClick:()=>del(trip.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
            )
          ),
          isOpen&&h('div',{className:'trip-card-detail',style:{borderTop:'.5px solid var(--bd)',padding:'1rem 1.25rem'}},
            // Tổng KL chuyến
            h('div',{style:{display:'flex',gap:16,marginBottom:10,flexWrap:'wrap',alignItems:'center'}},
              h('span',{style:{fontSize:13,fontWeight:600,color:'var(--pri)'}},
                h('i',{className:'ti ti-weight',style:{marginRight:4}}),
                'Tổng KL: '+(totalW>0?totalW.toFixed(2)+' kg':'—')
              ),
              h('span',{style:{fontSize:13,color:'var(--tx2)'}},tripOrders.length+' đơn hàng'),
              // Nút in
              h('button',{
                onClick:()=>printTrip(trip),
                style:{padding:'4px 12px',fontSize:12,display:'flex',alignItems:'center',gap:4,
                  border:'1px solid var(--pri)',color:'var(--pri)',background:'transparent',
                  borderRadius:'var(--r)',cursor:'pointer'}
              },h('i',{className:'ti ti-printer',style:{fontSize:13}}),'In chuyến')
            ),
            trip.note&&h('div',{style:{fontSize:13,color:'var(--tx2)',marginBottom:8,padding:'6px 10px',background:'var(--bg2)',borderRadius:'var(--r)'}},
              h('i',{className:'ti ti-notes',style:{marginRight:4}}),'Ghi chú: '+trip.note
            ),
            canEditTripQty&&h('div',{className:'trip-actual-qty-note'},h('i',{className:'ti ti-info-circle'}),' Nhập số thực giao cho từng dòng; số này có thể thấp hơn hoặc khác SL đặt/SL HĐ.'),
            // Bảng đơn hàng
            h('div',{style:{fontWeight:500,fontSize:12,color:'var(--tx2)',marginBottom:6}},'Chi tiết đơn hàng:'),
            tripOrders.length?h('div',{className:'desktop-only tw'},
              h('table',null,
                h('thead',null,h('tr',null,...['STT','Địa điểm','Giờ','Hàng hóa','SL đã giao','Ảnh HĐ','HĐ LX','Trạng thái'].map(c=>h('th',{key:c},c)))),
                h('tbody',null,tripOrders.map(o=>{
                  return h('tr',{key:o.id},
                    h('td',null,canEditDeliveryOrder
                      ?h('input',{type:'number',min:1,step:1,value:deliveryOrderValue(o)||'',placeholder:'...',onChange:e=>updateDeliveryOrder(o.id,e.target.value),style:{fontSize:12,padding:'4px 6px',width:64,textAlign:'center'}})
                      :h('span',{style:{fontWeight:600,color:'var(--pri)'}},deliveryOrderValue(o)||'—')
                    ),
                    h('td',null,h('span',{style:{fontWeight:600}},o.pointName||o.customer||'—'),o.isAdditionalTripOrder&&h('div',{className:'additional-order-status '+(o.additionalApprovalStatus||'pending')},o.additionalApprovalStatus==='approved'?'Đơn PS · Đã duyệt':'Đơn PS · Chờ KT duyệt'),canReviewTrips&&o.isAdditionalTripOrder&&o.additionalApprovalStatus==='pending'&&h('button',{className:'bi additional-order-approve',onClick:()=>approveAdditionalOrder(trip,o)},h('i',{className:'ti ti-check'}),' Duyệt đơn')),
                    h('td',null,o.deliveryTime||'—'),
                    h('td',null,h('div',{style:{fontSize:11}},(o.lines||[]).map((l,i)=>h('div',{key:i,style:{minHeight:30,display:'flex',alignItems:'center'}},l.productName+' · '+lineQty(l)+(l.unit?' '+l.unit:''))))),
                    h('td',null,h('div',{style:{display:'grid',gap:4,minWidth:92}},(o.lines||[]).map(l=>canEditTripQty
                      ?h('input',{key:l.id,type:'number',min:0,step:'0.01',value:l.qtyDelivered??'',placeholder:String(lineQty(l)||0),onChange:e=>updateDeliveredQty(trip,o.id,l.id,e.target.value),style:{fontSize:12,padding:'4px 6px',width:86,borderColor:(l.qtyDelivered!==undefined&&numFmt(l.qtyDelivered)!==lineQty(l))?'#E0A800':'var(--bd)' }})
                      :h('span',{key:l.id,style:{minHeight:30,display:'flex',alignItems:'center',fontWeight:600}},l.qtyDelivered!==undefined&&l.qtyDelivered!==''?numFmt(l.qtyDelivered):'—')
                    ))),
                    h('td',null,
                      o.invoiceImage
                        ?h('div',{style:{display:'flex',gap:4}},
                          h('button',{className:'bi',title:'Xem ảnh hóa đơn',onClick:()=>window.open(o.invoiceImage,'_blank')},h('i',{className:'ti ti-photo-check',style:{fontSize:15,color:'var(--pri)'}})),
                          canManageOrderInvoice&&h('button',{className:'bi',title:'Chụp lại hóa đơn',onClick:()=>pickOrderInvoiceImage(o)},h('i',{className:'ti ti-camera-up',style:{fontSize:15}})),
                          canManageOrderInvoice&&h('button',{className:'bi',title:'Xóa ảnh hóa đơn',onClick:()=>removeOrderInvoiceImage(o),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
                        )
                        :canManageOrderInvoice?h('button',{className:'bi',title:'Chụp hóa đơn đơn hàng',onClick:()=>pickOrderInvoiceImage(o)},h('i',{className:'ti ti-camera-plus',style:{fontSize:15}})):'—'
                    ),
                    h('td',null,
                      h('div',{style:{display:'grid',gap:4,minWidth:120}},
                        o.driverInvoiceImage?h('button',{className:'bi',title:'Xem HĐ LX',onClick:()=>window.open(o.driverInvoiceImage,'_blank')},h('i',{className:'ti ti-photo-check',style:{fontSize:15,color:'var(--pri)'}}),' Xem HĐ LX'):null,
                        o.driverInvoiceReviewStatus==='approved'&&h('span',{className:'badge',style:{background:'#E1F5EE',color:'#0F6E56'}},'Đã duyệt'),
                        o.driverInvoiceImage&&(!o.driverInvoiceReviewStatus||o.driverInvoiceReviewStatus==='pending')&&h('span',{className:'badge',style:{background:'#FFF3CD',color:'#8A5A00'}},'Chờ duyệt'),
                        o.driverInvoiceReviewStatus==='rejected'&&h('span',{className:'badge',style:{background:'#FCEBEB',color:'#A32D2D'}},'Cần tải lại'),
                        o.driverInvoiceReviewStatus==='rejected'&&h('small',{style:{color:'#A32D2D'}},o.driverInvoiceReviewReason||'Hóa đơn chưa đạt'),
                        canUploadDriverInvoice(trip,o)&&h('button',{className:'bi',onClick:()=>pickDriverInvoiceImage(trip,o)},h('i',{className:o.driverInvoiceImage?'ti ti-camera-up':'ti ti-camera-plus'}),' ',o.driverInvoiceImage?'Tải lại':'Tải HĐ LX'),
                        canReviewTrips&&trip.status==='completion_pending'&&o.driverInvoiceImage&&h('div',{style:{display:'flex',gap:4}},
                          h('button',{className:'bi',onClick:()=>reviewDriverInvoice(trip,o,true),style:{color:'#0F6E56'}},'Duyệt'),
                          h('button',{className:'bi',onClick:()=>reviewDriverInvoice(trip,o,false),style:{color:'#A32D2D'}},'Chưa duyệt')
                        )
                      )
                    ),
                    h('td',null,h(StatusBadge,{s:o.status}))
                  );
                }))
              )
            ):h('p',{style:{fontSize:13,color:'var(--tx2)'}},'Chưa có đơn hàng.'),
            tripOrders.length&&isDriver&&h('div',{className:'mobile-only trip-driver-order-list'},
              h('div',{className:'trip-driver-order-head'},
                h('span',null,'Ngày'),
                h('span',null,'Địa điểm'),
                h('span',null,'Sản phẩm'),
                h('span',null,'SL Đặt'),
                h('span',null,'SL HĐ'),
                h('span',null,'SL Giao'),
                h('span',null,'Giờ')
              ),
              tripOrders.map(o=>h('div',{key:'driver-trip-order-'+o.id,className:'trip-driver-order'},
                o.isAdditionalTripOrder&&h('div',{className:'additional-order-mobile-banner '+(o.additionalApprovalStatus||'pending')},o.additionalApprovalStatus==='approved'?'✓ Đơn phát sinh đã được duyệt':'⏳ Đơn phát sinh đang chờ kế toán duyệt'),
                h('div',{className:'trip-driver-order-main'},
                  h('div',{className:'trip-driver-cell trip-driver-date'},h('span',null,o.deliveryDate||trip.deliveryDate||'—')),
                  h('div',{className:'trip-driver-cell trip-driver-point'},h('span',null,o.pointName||o.customer||'—')),
                  h('div',{className:'trip-driver-cell trip-driver-products'},h('div',null,(o.lines||[]).map((l,i)=>h('span',{key:l.id||i},l.productName||'Sản phẩm')))),
                  h('div',{className:'trip-driver-cell trip-driver-qty'},h('div',null,(o.lines||[]).map((l,i)=>h('span',{key:l.id||i},numFmt(l.qtyProd||0))))),
                  h('div',{className:'trip-driver-cell trip-driver-qty'},h('div',null,(o.lines||[]).map((l,i)=>h('span',{key:l.id||i},numFmt(l.qtyInvoice||0))))),
                  h('div',{className:'trip-driver-cell trip-driver-delivered'},h('div',null,(o.lines||[]).map((l,i)=>canEditTripQty
                    ?h('input',{key:l.id||i,type:'number',min:0,step:'0.01',value:l.qtyDelivered??'',placeholder:String(numFmt(l.qtyInvoice||l.qtyProd||0)),onChange:e=>updateDeliveredQty(trip,o.id,l.id,e.target.value)})
                    :h('span',{key:l.id||i},l.qtyDelivered!==undefined&&l.qtyDelivered!==''?numFmt(l.qtyDelivered):'—')))),
                  h('div',{className:'trip-driver-cell trip-driver-time'},h('span',null,o.deliveryTime||'—'))
                ),
                h('div',{className:'trip-driver-order-review'},
                  h('div',{className:'trip-driver-invoice'},
                    h('b',null,'Ảnh HĐ'),
                    o.driverInvoiceImage&&h('button',{className:'bi',onClick:()=>window.open(o.driverInvoiceImage,'_blank')},h('i',{className:'ti ti-photo-check'}),' Xem'),
                    canUploadDriverInvoice(trip,o)&&h('button',{className:'bi',onClick:()=>pickDriverInvoiceImage(trip,o)},h('i',{className:o.driverInvoiceImage?'ti ti-camera-up':'ti ti-camera-plus'}),' ',o.driverInvoiceImage?'Tải lại':'Tải ảnh')
                  ),
                  h('div',{className:'trip-driver-accounting'},
                    h('b',null,'KT xác nhận'),
                    o.driverInvoiceReviewStatus==='approved'
                      ?h('span',{className:'trip-driver-review approved'},'Đã duyệt')
                      :o.driverInvoiceReviewStatus==='rejected'
                        ?h('span',{className:'trip-driver-review rejected'},'Chưa duyệt: '+(o.driverInvoiceReviewReason||'Cần tải lại ảnh'))
                        :h('span',{className:'trip-driver-review pending'},o.driverInvoiceImage?'Chờ duyệt':'Chưa có ảnh')
                  )
                )
              ))
            ),
            tripOrders.length&&!isDriver&&h('div',{className:'mobile-only trip-mobile-orders'},
              tripOrders.map(o=>{
                const w=orderWeight(o);
                return h('div',{key:'mtriporder'+o.id,className:'mobile-data-card trip-order-card'},
                  o.isAdditionalTripOrder&&h('div',{className:'additional-order-mobile-banner '+(o.additionalApprovalStatus||'pending')},o.additionalApprovalStatus==='approved'?'✓ Đơn phát sinh đã được duyệt':'⏳ Đơn phát sinh chờ kế toán duyệt',canReviewTrips&&o.additionalApprovalStatus==='pending'&&h('button',{className:'bi',onClick:()=>approveAdditionalOrder(trip,o)},'Duyệt')),
                  h('div',{className:'mobile-data-head'},
                    h('div',{style:{minWidth:0}},
                      h('div',{className:'mobile-data-title'},o.pointName||o.customer||'—'),
                      h('div',{className:'mobile-data-sub'},(o.deliveryTime||'—')+' · '+(o.id||''))
                    ),
                    h(StatusBadge,{s:o.status})
                  ),
                  h('div',{className:'trip-order-sequence'},
                    h('b',null,'STT'),
                    canEditDeliveryOrder
                      ?h('input',{type:'number',min:1,step:1,value:deliveryOrderValue(o)||'',placeholder:'...',onChange:e=>updateDeliveryOrder(o.id,e.target.value)})
                      :h('span',null,deliveryOrderValue(o)||'—')
                  ),
                  h('div',{className:'trip-order-lines'},(o.lines||[]).map((l,i)=>
                    h('div',{key:l.id||i,className:'trip-order-line'},
                      h('div',{className:'trip-order-product'},
                        h('b',null,(i+1)+'. '+(l.productName||'Sản phẩm')),
                        h('span',null,'SL đơn: '+lineQty(l)+(l.unit?' '+l.unit:''))
                      ),
                      h('label',null,
                        h('span',null,'Đã giao'),
                        canEditTripQty
                          ?h('input',{type:'number',min:0,step:'0.01',value:l.qtyDelivered??'',placeholder:String(lineQty(l)||0),onChange:e=>updateDeliveredQty(trip,o.id,l.id,e.target.value),style:{borderColor:(l.qtyDelivered!==undefined&&numFmt(l.qtyDelivered)!==lineQty(l))?'#E0A800':'var(--bd)'}})
                          :h('b',{style:{minHeight:34,display:'flex',alignItems:'center'}},l.qtyDelivered!==undefined&&l.qtyDelivered!==''?numFmt(l.qtyDelivered):'—')
                      )
                    )
                  )),
                  h('div',{className:'trip-order-footer'},
                    h('span',null,h('i',{className:'ti ti-weight'}),' ',w>0?w.toFixed(2)+' kg':'—'),
                    h('div',{className:'mobile-data-actions'},
                      o.invoiceImage&&h('button',{className:'bi',title:'Xem ảnh hóa đơn',onClick:()=>window.open(o.invoiceImage,'_blank')},h('i',{className:'ti ti-photo-check',style:{fontSize:16,color:'var(--pri)'}})),
                      canManageOrderInvoice&&h('button',{className:'bi',title:o.invoiceImage?'Chụp lại hóa đơn':'Chụp hóa đơn',onClick:()=>pickOrderInvoiceImage(o)},h('i',{className:o.invoiceImage?'ti ti-camera-up':'ti ti-camera-plus',style:{fontSize:16}})),
                      canManageOrderInvoice&&o.invoiceImage&&h('button',{className:'bi',title:'Xóa ảnh hóa đơn',onClick:()=>removeOrderInvoiceImage(o),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:16}}))
                    )
                  ),
                  h('div',{style:{marginTop:8,padding:'8px 10px',border:'1px solid var(--bd)',borderRadius:'var(--r)',background:'var(--bg2)'}},
                    h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,flexWrap:'wrap'}},
                      h('b',null,'HĐ LX'),
                      h('div',{className:'mobile-data-actions'},
                        o.driverInvoiceImage&&h('button',{className:'bi',onClick:()=>window.open(o.driverInvoiceImage,'_blank')},'Xem'),
                        canUploadDriverInvoice(trip,o)&&h('button',{className:'bi',onClick:()=>pickDriverInvoiceImage(trip,o)},o.driverInvoiceImage?'Tải lại':'Tải HĐ LX')
                      )
                    ),
                    o.driverInvoiceReviewStatus==='approved'&&h('div',{style:{color:'#0F6E56',fontSize:12,marginTop:5}},'✓ Đã được kế toán duyệt'),
                    o.driverInvoiceImage&&(!o.driverInvoiceReviewStatus||o.driverInvoiceReviewStatus==='pending')&&h('div',{style:{color:'#8A5A00',fontSize:12,marginTop:5}},'Đang chờ kế toán duyệt'),
                    o.driverInvoiceReviewStatus==='rejected'&&h('div',{style:{color:'#A32D2D',fontSize:12,marginTop:5}},'Chưa duyệt: '+(o.driverInvoiceReviewReason||'Cần tải lại hóa đơn')),
                    canReviewTrips&&trip.status==='completion_pending'&&o.driverInvoiceImage&&h('div',{style:{display:'flex',gap:6,marginTop:6}},h('button',{className:'bi',onClick:()=>reviewDriverInvoice(trip,o,true)},'Duyệt'),h('button',{className:'bi',onClick:()=>reviewDriverInvoice(trip,o,false),style:{color:'#A32D2D'}},'Chưa duyệt'))
                  )
                );
              })
            ),
            h('div',{className:'trip-summary-invoice'},
              h('div',{className:'trip-summary-invoice-head'},
                h('div',null,
                  h('b',null,h('i',{className:'ti ti-receipt',style:{marginRight:5}}),'Hóa đơn tổng chuyến'),
                  h('div',{className:'trip-summary-invoice-note'},'Bắt buộc trước khi lái xe xác nhận hoàn thành chuyến.')
                ),
                h('div',{className:'trip-summary-invoice-actions'},
                  trip.summaryInvoiceImage&&h('button',{className:'bi',title:'Xem hóa đơn tổng',onClick:()=>window.open(trip.summaryInvoiceImage,'_blank')},h('i',{className:'ti ti-photo-check'}),' Xem'),
                  canUploadSummaryInvoice(trip)&&h('button',{className:'bi',title:trip.summaryInvoiceImage?'Chụp/tải lại hóa đơn tổng':'Chụp/tải hóa đơn tổng',onClick:()=>pickTripSummaryInvoice(trip)},h('i',{className:trip.summaryInvoiceImage?'ti ti-camera-up':'ti ti-camera-plus'}),' ',trip.summaryInvoiceImage?'Thay ảnh':'Tải ảnh'),
                  canUploadSummaryInvoice(trip)&&trip.summaryInvoiceImage&&h('button',{className:'bi',title:'Xóa hóa đơn tổng',onClick:()=>removeTripSummaryInvoice(trip),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash'})),
                  canReviewTrips&&trip.status==='completion_pending'&&trip.summaryInvoiceImage&&h('button',{className:'bi',onClick:()=>reviewTripSummaryInvoice(trip,true),style:{color:'#0F6E56'}},'Duyệt'),
                  canReviewTrips&&trip.status==='completion_pending'&&trip.summaryInvoiceImage&&h('button',{className:'bi',onClick:()=>reviewTripSummaryInvoice(trip,false),style:{color:'#A32D2D'}},'Chưa duyệt')
                )
              ),
              trip.summaryInvoiceImage
                ?h('div',{className:'trip-summary-invoice-file'},h('i',{className:'ti ti-circle-check'}),' ',trip.summaryInvoiceImageName||'Đã có hóa đơn tổng')
                :h('div',{className:'trip-summary-invoice-missing'},h('i',{className:'ti ti-alert-triangle'}),' Chưa có hóa đơn tổng chuyến')
              ,trip.summaryInvoiceReviewStatus==='approved'&&h('div',{style:{fontSize:12,color:'#0F6E56',marginTop:5}},'✓ Kế toán đã duyệt hóa đơn tổng')
              ,trip.summaryInvoiceReviewStatus==='rejected'&&h('div',{style:{fontSize:12,color:'#A32D2D',marginTop:5}},'Chưa duyệt: '+(trip.summaryInvoiceReviewReason||'Cần tải lại hóa đơn tổng'))
              ,trip.summaryInvoiceImage&&(!trip.summaryInvoiceReviewStatus||trip.summaryInvoiceReviewStatus==='pending')&&h('div',{style:{fontSize:12,color:'#8A5A00',marginTop:5}},'Hóa đơn tổng đang chờ duyệt')
            ),
            isDriver&&isOwnTrip(trip)&&trip.status==='active'&&!completionLocked&&(()=>{
              const check=completionIssues(trip);
              return h('div',{className:check.issues.length?'trip-completion-check incomplete':'trip-completion-check complete'},
                h('b',null,check.issues.length?'Chưa thể hoàn thành:':'Đã đủ điều kiện hoàn thành'),
                check.issues.length?h('span',null,' '+check.issues.join('; ')+'.'):h('span',null,' Có thể bấm “Giao hoàn thành”.')
              );
            })(),
            // Phần chụp ảnh sau giao
            h('div',{style:{marginTop:12,padding:'10px 12px',background:'#f8f9fa',border:'1px solid var(--bd)',borderRadius:'var(--r)'}},
              h('div',{style:{fontWeight:600,fontSize:12,color:'var(--tx2)',marginBottom:8,display:'flex',alignItems:'center',gap:6}},
                h('i',{className:'ti ti-camera',style:{fontSize:14}}),'Ảnh xác nhận giao hàng'
              ),
              // Hiện ảnh đã upload
              (trip.photos||[]).length>0&&h('div',{style:{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}},
                (trip.photos||[]).map((ph,i)=>h('div',{key:i,style:{position:'relative'}},
                  h('img',{src:ph,alt:'Ảnh '+i,
                    style:{width:100,height:100,objectFit:'cover',borderRadius:'var(--r)',border:'1px solid var(--bd)',cursor:'pointer'},
                    onClick:()=>window.open(ph,'_blank')
                  }),
                  canManageTrips&&h('button',{
                    onClick:()=>{if(!confirm('Xóa ảnh xác nhận giao hàng này?'))return;setTrips(prev=>prev.map(t=>t.id===trip.id?{...t,photos:(t.photos||[]).filter((_,j)=>j!==i)}:t));},
                    style:{position:'absolute',top:2,right:2,background:'rgba(163,45,45,.8)',color:'#fff',
                      border:'none',borderRadius:'50%',width:18,height:18,fontSize:11,cursor:'pointer',
                      display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}
                  },'×')
                ))
              ),
              // Nút upload ảnh
              canUploadTripProof&&h('label',{style:{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',
                border:'1px dashed var(--pri)',color:'var(--pri)',borderRadius:'var(--r)',
                cursor:'pointer',fontSize:12,fontWeight:500}},
                h('i',{className:'ti ti-upload',style:{fontSize:14}}),
                (trip.photos||[]).length>0?'Thêm ảnh':'Chụp / tải ảnh lên',
                h('input',{type:'file',accept:'image/*',capture:'environment',multiple:true,
                  style:{display:'none'},
                  onChange:async e=>{
                    const files=Array.from(e.target.files);
                    for(const file of files){
                      try{
                        const url=await uploadPhoto(file,'trip-proofs/'+(trip.id||'trip'));
                        setTrips(prev=>prev.map(t=>t.id===trip.id?{...t,photos:[...(t.photos||[]),url]}:t));
                      }catch(err){window.showToast('Không đọc được ảnh: '+(err.message||err),'error');}
                    }
                    e.target.value='';
                  }
                })
              ),
              (trip.photos||[]).length>0&&h('span',{style:{fontSize:11,color:'var(--tx2)',marginLeft:8}},
                (trip.photos||[]).length+' ảnh'
              )
            )
          )
        );
      })
    ):h('div',{style:{textAlign:'center',padding:'3rem',color:'var(--tx2)',background:'#fff',borderRadius:'var(--rl)',border:'.5px solid var(--bd)'}},
      h('i',{className:'ti ti-steering-wheel',style:{fontSize:56,display:'block',marginBottom:'1rem',color:'var(--pri2)'}}),
      'Chưa có chuyến giao hàng nào.'
    ),
    canManageTrips&&modal==='f'&&h(TripForm,{trip:edit,orders,employees,shifts,customers,products,currentUser,onSave:save,onClose:()=>{sm(null);se(null);}}),
    isDriver&&modal==='additional'&&additionalTrip&&h(AdditionalTripOrderForm,{trip:additionalTrip,customers,products,onSave:createAdditionalOrder,onClose:()=>{sm(null);setAdditionalTrip(null);}}),
    canManageTrips&&modal==='bulk'&&h(BulkTripModal,{orders,employees,shifts,prodShifts,customers,products,trips,currentUser,initialDate:fDate,initialShift:fShift,
      onSave:(newTrips)=>{
        setTrips(p=>[...p,...newTrips]);
        // Cập nhật tripId cho đơn hàng
        newTrips.forEach(t=>{
          setOrders(p=>p.map(o=>(t.orderIds||[]).includes(o.id)?{...o,tripId:t.id,status:t.status==='assigned'?'assigned':'pending'}:o));
        });
        sm(null);
      },
      onClose:()=>sm(null)
    })
  );
}

/* ═══════════ GIAI ĐOẠN 4: SẢN XUẤT ═══════════ */
