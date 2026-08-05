/* --- THONG BAO NOI BO --- */
function NotificationsTab({notifications,setNotifications,currentUser,setPage}){
  const[filter,setFilter]=useState('unread');
  const userId=String(currentUser?.id||'');
  const mine=(notifications||[])
    .filter(n=>String(n.recipientId||'')===userId)
    .sort((a,b)=>String(b.createdAtIso||b.createdAt||'').localeCompare(String(a.createdAtIso||a.createdAt||'')));
  const unread=mine.filter(n=>!n.readAt);
  const rows=filter==='unread'?unread:mine;
  const markRead=id=>setNotifications(prev=>(prev||[]).map(n=>n.id===id?{...n,readAt:n.readAt||fmtDT()}:n));
  const markAll=()=>setNotifications(prev=>(prev||[]).map(n=>String(n.recipientId||'')===userId&&!n.readAt?{...n,readAt:fmtDT()}:n));
  const openItem=n=>{
    markRead(n.id);
    if(n.targetPage==='trips'&&n.sourceId)try{sessionStorage.setItem('scf_notification_target',JSON.stringify({sourceType:n.sourceType||'',sourceId:n.sourceId,targetPage:n.targetPage||'',notificationId:n.id}));}catch{}
    if(n.targetPage)setPage(n.targetPage);
  };
  const enableDevice=async()=>{
    if(!('Notification' in window)){window.showToast('Trình duyệt này không hỗ trợ thông báo trên thiết bị.','warn');return;}
    const result=await Notification.requestPermission();
    window.showToast(result==='granted'?'Đã bật thông báo trên thiết bị.':'Chưa được cấp quyền thông báo.',result==='granted'?'success':'warn');
  };
  return h('div',{className:'notifications-page'},
    h('div',{className:'notifications-head'},
      h('div',null,h('div',{className:'ptitle'},h('i',{className:'ti ti-bell'}),'Thông báo'),h('div',{className:'notifications-sub'},unread.length+' thông báo chưa đọc')),
      h('div',{className:'notifications-actions'},
        h('button',{onClick:enableDevice},h('i',{className:'ti ti-bell-ringing'}),' Bật thông báo trên thiết bị'),
        h('button',{onClick:markAll,disabled:!unread.length},h('i',{className:'ti ti-checks'}),' Đánh dấu đã đọc')
      )
    ),
    h('div',{className:'notifications-tabs'},
      h('button',{className:filter==='unread'?'on':'',onClick:()=>setFilter('unread')},'Chưa đọc ('+unread.length+')'),
      h('button',{className:filter==='all'?'on':'',onClick:()=>setFilter('all')},'Tất cả ('+mine.length+')')
    ),
    h('div',{className:'notifications-list'},rows.length?rows.map(n=>h('button',{key:n.id,className:'notification-card'+(!n.readAt?' unread':''),onClick:()=>openItem(n)},
      h('span',{className:'notification-icon'},h('i',{className:'ti '+(n.icon||'ti-bell')})),
      h('span',{className:'notification-body'},h('strong',null,n.title||'Thong bao'),h('span',null,n.message||''),h('small',null,n.createdAt||'')),
      !n.readAt&&h('span',{className:'notification-dot','aria-label':'Chưa đọc'})
    )):h('div',{className:'empty',style:{padding:'55px 20px'}},h('i',{className:'ti ti-bell-off',style:{fontSize:42}}),h('div',null,filter==='unread'?'Bạn đã đọc hết thông báo.':'Chưa có thông báo nào.')))
  );
}
