/* Giao kế hoạch theo xưởng và ca làm việc. Dữ liệu lưu chung với đơn SX cũ để giữ tương thích. */
const SCF_WORKSHOPS=[['bun','Xưởng bún'],['banh','Xưởng bánh'],['botgao','Xưởng bột gạo']];
const scfWorkshopName=id=>SCF_WORKSHOPS.find(([key])=>key===id)?.[1]||'Chưa phân xưởng';
function scfWorkshopProductionEmployees(employees){
  return (employees||[]).filter(employee=>employee.id!=null&&employee.active!==false&&employeeDepartmentIncludes(employee,'Sản xuất'))
    .sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'vi'));
}
function scfWorkshopForProduct(product){
  if(product?.workshop)return product.workshop;
  const name=String(product?.name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase();
  if(name.startsWith('BUN '))return 'bun';
  if(name.startsWith('BANH '))return 'banh';
  return '';
}
function scfBuildWorkshopPlan(orders,products,prodShifts,prodShiftRules,date,workshop,shiftGroup){
  const productById=new Map((products||[]).map(p=>[String(p.id),p]));
  const grouped=new Map();
  (orders||[]).filter(order=>order.status!=='cancelled').forEach(order=>{
    const plans=prodShiftPlansForOrder(order,prodShifts||[],prodShiftRules||[]);
    (order.lines||[]).forEach((line,index)=>{
      const product=productById.get(String(line.productId||''));
      if(!product||scfWorkshopForProduct(product)!==workshop)return;
      const plan=plans[index]||prodShiftPlan(order,prodShifts||[],prodShiftRules||[]);
      const prodDate=line.shiftOverride?(line.prodDate||plan?.prodDate||order.deliveryDate):(plan?.prodDate||order.deliveryDate);
      const prodTime=line.shiftOverride?(line.prodTime||plan?.prodTime||''):(plan?.prodTime||'');
      const rule=getProdWorkShiftRule(prodTime,prodShiftRules||[]);
      if(prodDate!==date||rule?.group!==shiftGroup)return;
      const qty=numFmt(line.qtyProd);
      if(qty<=0)return;
      const key=String(product.id);
      if(!grouped.has(key))grouped.set(key,{id:uid(),productId:product.id,productName:product.name,unit:product.unit||line.unit||'',qtyRequired:0,qtyProduced:'',qtyBad:'',qtyReceived:'',orderIds:[]});
      const row=grouped.get(key);
      row.qtyRequired+=qty;
      if(order.id&&!row.orderIds.includes(order.id))row.orderIds.push(order.id);
    });
  });
  return [...grouped.values()].sort((a,b)=>(products||[]).findIndex(p=>p.id===a.productId)-(products||[]).findIndex(p=>p.id===b.productId));
}
function WorkshopAssignmentsTab({prodOrders,setProdOrders,orders,products,employees,prodShifts,prodShiftRules,currentUser}){
  const canManage=['admin','manager'].includes(currentUser?.role);
  const canConfirm=canManage||String(currentUser?.dept||'').toLowerCase().includes('kho');
  const shiftGroups=[...new Set((prodShiftRules&&prodShiftRules.length?prodShiftRules:DEF_PROD_SHIFT_RULES).filter(rule=>rule.active!==false).map(rule=>rule.group).filter(Boolean))];
  const[date,setDate]=useState(fmtDate());
  const[workshop,setWorkshop]=useState('bun');
  const[shiftGroup,setShiftGroup]=useState(shiftGroups[0]||'Ca sáng');
  const[leaderId,setLeaderId]=useState('');
  const[memberIds,setMemberIds]=useState([]);
  const[lines,setLines]=useState([]);
  const[note,setNote]=useState('');
  const[resultDrafts,setResultDrafts]=useState({});
  const productionEmployees=scfWorkshopProductionEmployees(employees);
  const participants=productionEmployees.filter(employee=>String(employee.id)!==String(leaderId));
  const selectedMemberIds=participants.filter(employee=>memberIds.some(id=>String(id)===String(employee.id))).map(employee=>String(employee.id));
  const assignments=(prodOrders||[]).filter(item=>item.kind==='workshop_assignment');
  const visible=assignments.filter(item=>item.date===date&&(canManage||canConfirm||String(item.leaderId)===String(currentUser?.id)||(item.memberIds||[]).some(id=>String(id)===String(currentUser?.id)))).sort((a,b)=>SCF_WORKSHOPS.findIndex(([key])=>key===a.workshop)-SCF_WORKSHOPS.findIndex(([key])=>key===b.workshop)||shiftGroups.indexOf(a.shiftGroup)-shiftGroups.indexOf(b.shiftGroup));
  const availableProducts=(products||[]).filter(product=>scfWorkshopForProduct(product)===workshop);
  const chooseProduct=(index,productId)=>{
    const product=(products||[]).find(p=>String(p.id)===String(productId));
    setLines(previous=>previous.map((line,i)=>i===index?{...line,productId:product?.id||'',productName:product?.name||'',unit:product?.unit||'',orderIds:[]}:line));
  };
  const changeLine=(index,field,value)=>setLines(previous=>previous.map((line,i)=>i===index?{...line,[field]:value}:line));
  const loadPlan=()=>{
    const planned=scfBuildWorkshopPlan(orders,products,prodShifts,prodShiftRules,date,workshop,shiftGroup);
    setLines(planned);
    window.showToast(planned.length?'Đã lấy kế hoạch từ đơn hàng. Kiểm tra trước khi giao.':'Chưa có sản phẩm được phân xưởng trong ca này. Có thể nhập thủ công.',planned.length?'success':'warn');
  };
  const saveNew=()=>{
    if(!date||!shiftGroup||!workshop||!leaderId){window.showToast('Chọn đủ ngày, ca, xưởng và trưởng ca.','warn');return;}
    if(assignments.some(item=>item.date===date&&item.shiftGroup===shiftGroup&&item.workshop===workshop&&item.status!=='cancelled')){window.showToast('Xưởng này đã có phiếu giao cho ca đã chọn.','warn');return;}
    if(!lines.length||lines.some(line=>!line.productId||!Number.isFinite(Number(line.qtyRequired))||Number(line.qtyRequired)<=0||scfWorkshopForProduct((products||[]).find(p=>p.id===line.productId))!==workshop)){
      window.showToast('Chọn sản phẩm đúng xưởng và nhập chỉ tiêu lớn hơn 0.','warn');return;
    }
    const leader=productionEmployees.find(employee=>String(employee.id)===String(leaderId));
    if(!leader){window.showToast('Chọn trưởng ca đang làm việc thuộc bộ phận sản xuất.','warn');return;}
    const now=fmtDT();
    const next={id:'SXW'+uid(),kind:'workshop_assignment',date,shiftGroup,workshop,leaderId,leaderName:leader.name,memberIds:selectedMemberIds,lines:lines.map(line=>({...line,id:line.id||uid(),qtyRequired:numFmt(line.qtyRequired),qtyProduced:'',qtyBad:'',qtyReceived:''})),note:note.trim(),status:'assigned',assignedBy:currentUser.name,assignedAt:now,updatedBy:currentUser.name,updatedAt:now};
    setProdOrders(previous=>[...(previous||[]),next]);
    setLines([]);setNote('');setMemberIds([]);
    window.showToast('Đã giao kế hoạch cho trưởng ca.','success');
  };
  const changeStatus=(item,nextStatus,extra={})=>{
    const now=fmtDT();
    setProdOrders(previous=>(previous||[]).map(row=>row.id===item.id?{...row,...extra,status:nextStatus,updatedBy:currentUser.name,updatedAt:now,[nextStatus+'By']:currentUser.name,[nextStatus+'At']:now}:row));
  };
  const updateResult=(item,lineId,field,value)=>{
    const numeric=value===''?'':Number(String(value).replace(',','.'));
    if(numeric!==''&&(!Number.isFinite(numeric)||numeric<0))return;
    setResultDrafts(previous=>({...previous,[item.id]:{...(previous[item.id]||{}),[lineId]:{...(previous[item.id]?.[lineId]||{}),[field]:numeric}}}));
  };
  const draftValue=(item,line,field)=>resultDrafts[item.id]?.[line.id]?.[field]??line[field];
  const completedLines=item=>(item.lines||[]).map(line=>({...line,...(resultDrafts[item.id]?.[line.id]||{})}));
  const report=item=>{
    const finalLines=completedLines(item);
    if(finalLines.some(line=>line.qtyProduced===''||line.qtyProduced===undefined||line.qtyBad===''||line.qtyBad===undefined)){
      window.showToast('Nhập đủ SL đạt và hàng lỗi của từng sản phẩm.','warn');return;
    }
    changeStatus(item,'reported',{lines:finalLines});
    setResultDrafts(previous=>{const next={...previous};delete next[item.id];return next;});
  };
  const confirm=item=>{
    const finalLines=completedLines(item);
    if(finalLines.some(line=>line.qtyReceived===''||line.qtyReceived===undefined||numFmt(line.qtyReceived)>numFmt(line.qtyProduced))){
      window.showToast('Nhập SL kho nhận của từng sản phẩm; không lớn hơn SL đạt.','warn');return;
    }
    changeStatus(item,'confirmed',{lines:finalLines});
    setResultDrafts(previous=>{const next={...previous};delete next[item.id];return next;});
  };
  const statusName={assigned:'Đã giao',accepted:'Đã nhận',reported:'Chờ kho xác nhận',confirmed:'Kho đã xác nhận',cancelled:'Đã hủy'};
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-clipboard-check',style:{fontSize:20}}),'Giao kế hoạch sản xuất theo xưởng'),
    h('div',{className:'card',style:{marginBottom:16}},
      h('div',{className:'g3'},
        h(F,{label:'Ngày sản xuất'},h('input',{type:'date',value:toIsoDate(date),onChange:e=>{setDate(vnDateFromISO(e.target.value)||'');setLines([]);}})),
        canManage&&h(F,{label:'Xưởng'},h('select',{value:workshop,onChange:e=>{setWorkshop(e.target.value);setLines([]);}},SCF_WORKSHOPS.map(([key,name])=>h('option',{key,value:key},name)))),
        canManage&&h(F,{label:'Ca làm việc'},h('select',{value:shiftGroup,onChange:e=>{setShiftGroup(e.target.value);setLines([]);}},shiftGroups.map(group=>h('option',{key:group,value:group},group))))
      )
    ),
    canManage&&h('div',{className:'card',style:{marginBottom:16}},
      h('div',{style:{fontWeight:700,marginBottom:10}},'Giao kế hoạch mới'),
      h('div',{className:'g2'},
        h(F,{label:'Trưởng ca *'},h('select',{value:leaderId,onChange:e=>{setLeaderId(e.target.value);setMemberIds(previous=>previous.filter(id=>String(id)!==String(e.target.value)));}},h('option',{value:''},'— Chọn trưởng ca —'),productionEmployees.map(employee=>h('option',{key:employee.id,value:employee.id},employee.name+' · '+employeeDepartmentLabel(employee))))),
        h(F,{label:'Nhân viên tham gia (không bắt buộc)'},
          h('div',{className:'workshop-roster'},
            h('div',{className:'workshop-roster-toolbar'},
              h('span',{'aria-live':'polite'},'Đã chọn '+selectedMemberIds.length+' / '+participants.length+' người'),
              h('button',{type:'button',disabled:!participants.length,onClick:()=>setMemberIds(participants.map(employee=>String(employee.id)))},'Chọn tất cả'),
              h('button',{type:'button',disabled:!selectedMemberIds.length,onClick:()=>setMemberIds([])},'Bỏ chọn')
            ),
            h('div',{className:'workshop-roster-help'},'Tích nhân viên sản xuất đi làm trong ca này. Trưởng ca được tính riêng.'),
            h('div',{className:'workshop-roster-list'},participants.length?participants.map(employee=>{
              const id=String(employee.id),checked=selectedMemberIds.includes(id);
              return h('label',{key:id,className:'workshop-roster-person'+(checked?' selected':'')},
                h('input',{type:'checkbox',checked,onChange:e=>{const selected=e.target.checked;setMemberIds(previous=>selected?[...new Set([...previous.map(String),id])]:previous.filter(value=>String(value)!==id));}}),
                h('span',null,h('strong',null,employee.name),h('small',null,employeeDepartmentLabel(employee)))
              );
            }):h('div',{className:'workshop-roster-empty'},'Chưa có nhân viên sản xuất để chọn.'))
          )
        )
      ),
      h('div',{style:{display:'flex',gap:8,flexWrap:'wrap',margin:'10px 0'}},
        workshop!=='botgao'&&h('button',{type:'button',onClick:loadPlan},'Lấy kế hoạch từ đơn hàng'),
        h('button',{type:'button',onClick:()=>setLines(previous=>[...previous,{id:uid(),productId:'',productName:'',unit:'',qtyRequired:'',orderIds:[]}])},'+ Thêm sản phẩm'),
        h('span',{style:{fontSize:12,color:'var(--tx2)',alignSelf:'center'}},workshop==='botgao'?'Nhập chỉ tiêu bột gạo thủ công; đánh dấu sản phẩm thuộc xưởng bột gạo trong Danh mục sản phẩm.':availableProducts.length+' sản phẩm thuộc xưởng này')
      ),
      lines.length>0&&h('div',{className:'tw'},h('table',null,
        h('thead',null,h('tr',null,...['Sản phẩm','ĐVT','Chỉ tiêu','Nguồn đơn',''].map(label=>h('th',{key:label},label)))),
        h('tbody',null,lines.map((line,index)=>h('tr',{key:line.id},
          h('td',null,h('select',{value:line.productId||'',onChange:e=>chooseProduct(index,e.target.value)},h('option',{value:''},'— Chọn sản phẩm —'),availableProducts.map(product=>h('option',{key:product.id,value:product.id},product.name)))),
          h('td',null,line.unit||'—'),
          h('td',null,h('input',{type:'number',min:0,step:'0.01',value:line.qtyRequired??'',onChange:e=>changeLine(index,'qtyRequired',e.target.value),style:{width:100}})),
          h('td',null,(line.orderIds||[]).length+' đơn'),
          h('td',null,h('button',{type:'button',className:'bi',title:'Bỏ dòng',onClick:()=>setLines(previous=>previous.filter((_,i)=>i!==index))},'×'))
        )))
      )),
      h(F,{label:'Ghi chú giao việc'},h('input',{value:note,onChange:e=>setNote(e.target.value),placeholder:'Nguyên liệu, thiết bị, thời hạn...'})),
      h('button',{type:'button',className:'bp',onClick:saveNew},'Giao cho trưởng ca')
    ),
    h('div',{style:{fontWeight:700,margin:'12px 0'}},'Phiếu sản xuất ngày '+date+' ('+visible.length+')'),
    visible.length?visible.map(item=>{
      const isLeader=String(item.leaderId)===String(currentUser?.id);
      const canReport=canManage||isLeader;
      return h('div',{key:item.id,className:'card',style:{marginBottom:12}},
        h('div',{style:{display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap',marginBottom:8}},
          h('strong',null,scfWorkshopName(item.workshop)+' · '+item.shiftGroup+' · '+item.leaderName),
          h('span',{className:'badge'},statusName[item.status]||item.status)
        ),
        h('div',{style:{fontSize:12,color:'var(--tx2)',marginBottom:8}},'Chỉ tiêu giao bởi '+(item.assignedBy||'—')+' · '+(item.lines||[]).length+' sản phẩm'+(item.note?' · '+item.note:'')),
        h('div',{className:'tw'},h('table',null,
          h('thead',null,h('tr',null,...['Sản phẩm','Chỉ tiêu','SL SX ĐẠT','Hàng lỗi','Kho nhận'].map(label=>h('th',{key:label},label)))),
          h('tbody',null,(item.lines||[]).map(line=>h('tr',{key:line.id},
            h('td',null,line.productName+' ('+line.unit+')'),
            h('td',null,numFmt(line.qtyRequired).toLocaleString('vi-VN')),
            h('td',null,item.status==='accepted'&&canReport?h('input',{type:'number',min:0,step:'0.01',value:draftValue(item,line,'qtyProduced')??'',onChange:e=>updateResult(item,line.id,'qtyProduced',e.target.value),style:{width:96}}):line.qtyProduced===''?'—':numFmt(line.qtyProduced).toLocaleString('vi-VN')),
            h('td',null,item.status==='accepted'&&canReport?h('input',{type:'number',min:0,step:'0.01',value:draftValue(item,line,'qtyBad')??'',onChange:e=>updateResult(item,line.id,'qtyBad',e.target.value),style:{width:96}}):line.qtyBad===''?'—':numFmt(line.qtyBad).toLocaleString('vi-VN')),
            h('td',null,item.status==='reported'&&canConfirm?h('input',{type:'number',min:0,max:numFmt(line.qtyProduced),step:'0.01',value:draftValue(item,line,'qtyReceived')??'',onChange:e=>updateResult(item,line.id,'qtyReceived',e.target.value),style:{width:96}}):line.qtyReceived===''?'—':numFmt(line.qtyReceived).toLocaleString('vi-VN'))
          )))
        )),
        h('div',{style:{display:'flex',gap:8,marginTop:10,flexWrap:'wrap'}},
          item.status==='assigned'&&(isLeader||canManage)&&h('button',{type:'button',className:'bp',onClick:()=>changeStatus(item,'accepted')},'Trưởng ca nhận việc'),
          item.status==='accepted'&&canReport&&h('button',{type:'button',className:'bp',onClick:()=>report(item)},'Báo kết quả ca'),
          item.status==='reported'&&canConfirm&&h('button',{type:'button',className:'bp',onClick:()=>confirm(item)},'Kho xác nhận'),
          item.status==='assigned'&&canManage&&h('button',{type:'button',onClick:async()=>{if(await window.scfConfirm('Hủy phiếu giao này?','Hủy phiếu',true))changeStatus(item,'cancelled');}},'Hủy phiếu')
        )
      );
    }):h('div',{className:'card',style:{color:'var(--tx2)'}},'Chưa có phiếu giao sản xuất cho ngày này.')
  );
}
