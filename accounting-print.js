/* Scoped A4 printing for accounting on a phone: no queue read/edit permission required. */
const scfAccountingA4Requests=new Map();
async function scfAccountingPrintA4({selectedOrders,trips,currentUser,getLatest,htmlForOrders,templateForOrder}){
 const actor=String(currentUser?.id||'');
 const validate=()=>{
  const live=getLatest(),access=window.__SCF_ACCESS_CONTEXT;
  if(String(live.user?.id)!==actor||access?.readOnly||access?.employeeId&&String(access.employeeId)!==actor||!scfCanAccountingPrintLabels(live.user))throw Error('Bạn chưa được cấp quyền in đơn trên điện thoại.');
  if(selectedOrders.some(old=>!live.orders.some(order=>String(order.id)===String(old.id)&&order.status!=='cancelled'&&JSON.stringify(order)===JSON.stringify(old))))throw Error('Đơn đã thay đổi. Hãy chọn lại trước khi in.');
 };
 validate();const groups=new Map();
 for(const order of selectedOrders){
  const trip=order.tripId?(trips||[]).find(t=>String(t.id)===String(order.tripId)):order.tripAssignMode==='manual'?null:(trips||[]).find(t=>(t.orderIds||[]).map(String).includes(String(order.id)));
  if(order.tripId&&!trip)throw Error('Chưa tải đủ chuyến. Tải lại danh sách trước khi in.');
  const tripId=trip?.id||'__accounting_unassigned__',id=templateForOrder?JSON.stringify([tripId,templateForOrder(order)]):tripId;if(!groups.has(id))groups.set(id,{tripId,orders:[]});groups.get(id).orders.push(order);
 }
 const tasks=[...groups.values()].map(({tripId,orders})=>({tripId,ids:orders.map(o=>String(o.id)),html:htmlForOrders(orders)}));
 if(!tasks.length)throw Error('Chọn ít nhất một đơn để in.');
 const fingerprint=JSON.stringify(tasks),prior=scfAccountingA4Requests.get(actor);
 if(prior&&prior.fingerprint!==fingerprint&&prior.sent.size)throw Error('Lần trước đã gửi một phần đơn. Chọn lại đúng danh sách để gửi tiếp.');
 const request=prior?.fingerprint===fingerprint?prior:{fingerprint,sent:new Set()};scfAccountingA4Requests.set(actor,request);
 try{for(let i=0;i<tasks.length;i++){if(request.sent.has(i))continue;validate();const task=tasks[i];await scfQueueA4Print(task.html,{title:'Kế toán · Phiếu giao hàng · '+task.ids.length+' đơn',beforeEnqueue:validate,tripContext:{tripId:task.tripId,orderIds:task.ids,mode:'delivery',accountingPrint:true}});request.sent.add(i);}scfAccountingA4Requests.delete(actor);}
 catch(error){throw Error((request.sent.size?'Đã gửi '+request.sent.size+' nhóm đơn. Bấm in lại để gửi tiếp phần còn lại. ':'')+error.message);}
}
