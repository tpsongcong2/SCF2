/* ─── APP ROOT ─── */
const SCF_BUILD_VERSION='V248';
const PTITLES = {
  garages:'Gara ô tô',
  welcome:'Thời tiết', company:'Giới thiệu công ty', appearance:'Cài đặt giao diện', printtemplates:'Mẫu in Excel & mapping biến', employees:'Nhân viên', permission_settings:'Cài đặt phân quyền', attendance:'Chấm công', attendance_settings:'Cài đặt chấm công', attendance_report:'Báo cáo chấm công', advances:'Ứng lương', rewards:'Thưởng phạt', employee_errors:'Ghi lỗi nhân viên', employee_uniforms:'Cấp đồng phục nhân viên', leaves:'Xin phép nghỉ', prodshifts:'Cài đặt ca SX + ca GH tự động', deliveryrules:'Quy định giao hàng',
  backup:'Backup dữ liệu', materials:'Nguyên vật liệu', assets:'Danh mục tài sản', products:'Sản phẩm', depts:'Bộ phận',
  customers:'Khách hàng', workcats:'Danh mục công việc', tasks:'Giao việc', notifications:'Thông báo', userguide:'HDSD SCFOOD', shifts:'Ca giao hàng',
  workreport_vp:'Công kế toán', workreport_sx:'Công sản xuất', workreport_lx:'Công lái xe', workreport_total:'Tổng công',
  process_accounting:'QUY TRÌNH KẾ TOÁN', process_bun:'QT SẢN XUẤT BÚN', process_pho:'QT SX PHỞ', process_banhcuon:'QT SX BÁNH CUỐN',
  quotes:'Báo giá', delivery:'Đơn giao hàng', intem:'Intem', orderdetail:'Chi tiết đơn hàng', trips:'Chuyến giao hàng',
  salesreport:'Báo cáo bán hàng', cashflowreport:'Báo cáo dòng tiền', fuelreport:'Báo cáo mua xăng dầu', marketsales:'Bán hàng chợ', powdersales:'Bán bột bún',
  nccs:'Nhà CC NVL', nccgoods:'Nhà CC Hàng hóa', purchaseorders:'Đơn mua hàng NVL', purchasegoods:'Đơn mua hàng hàng hóa', fuelpurchases:'Đơn mua xăng dầu', utilityexpenses:'Chi phí điện nước', purchasereport:'Báo cáo mua hàng', maintreport:'Báo cáo sửa chữa', materialusage:'Báo cáo NVL tồn và tiêu dùng', powderdebtreport:'Báo cáo công nợ', syncreport:'Đồng bộ dữ liệu', dbusage:'Dung lượng Supabase',
  maint_vehicle:'Bảo dưỡng xe', maint_machine:'Bảo dưỡng máy',
  prodsummary:'Tổng hợp sản xuất', prodorders:'Đơn sản xuất', stock:'Tồn kho',
};

const PROCESS_POST_KEYS={process_accounting:'scf_process_posts_accounting',process_bun:'scf_process_posts_bun',process_pho:'scf_process_posts_pho',process_banhcuon:'scf_process_posts_banhcuon'};

const PICONS = {
  garages:'ti-building-store',
  purchase:'ti-shopping-cart', tasks:'ti-clipboard-check', notifications:'ti-bell', userguide:'ti-book-2', prodsummary:'ti-clipboard-list',
  prodorders:'ti-building-factory', stock:'ti-package', attendance:'ti-face-id', attendance_settings:'ti-settings', attendance_report:'ti-report-analytics', advances:'ti-cash-banknote', rewards:'ti-scale', employee_errors:'ti-alert-triangle', employee_uniforms:'ti-shirt', permission_settings:'ti-shield-lock', leaves:'ti-calendar-minus', assets:'ti-building-warehouse', appearance:'ti-typography', printtemplates:'ti-file-spreadsheet',
  workreport_vp:'ti-building', workreport_sx:'ti-building-factory', workreport_lx:'ti-steering-wheel', workreport_total:'ti-report-analytics',
  process_accounting:'ti-file-invoice', process_bun:'ti-tools-kitchen-2', process_pho:'ti-bowl', process_banhcuon:'ti-cookie',
  marketsales:'ti-building-store', powdersales:'ti-bowl', intem:'ti-printer',
  cashflowreport:'ti-cash-banknote', powderdebtreport:'ti-report-money', syncreport:'ti-cloud-data-connection', dbusage:'ti-database', purchasegoods:'ti-packages', fuelpurchases:'ti-gas-station', utilityexpenses:'ti-bolt', fuelreport:'ti-gas-station', maintreport:'ti-tool', materialusage:'ti-chart-histogram',
  maint_vehicle:'ti-car', maint_machine:'ti-settings'
};

function SyncStatus(){
  const[state,setState]=useState(()=>window.scfGetSyncState?window.scfGetSyncState():{status:navigator.onLine?'idle':'offline',pending:0});
  useEffect(()=>{
    const update=e=>setState(e.detail||window.scfGetSyncState());
    window.addEventListener('scf-sync-state',update);
    return()=>window.removeEventListener('scf-sync-state',update);
  },[]);
  const map={
    idle:['Đã kết nối','ti-cloud-check'],synced:['Đã đồng bộ','ti-cloud-check'],syncing:['Đang đồng bộ','ti-refresh'],
    offline:['Ngoại tuyến','ti-cloud-off'],error:['Chờ đồng bộ','ti-alert-triangle']
  };
  const item=map[state?.status]||map.idle;
  const label=state?.pending?item[0]+' ('+state.pending+')':item[0];
  const retry=()=>{if(state?.pending&&state?.status!=='syncing')window.scfFlushPendingWrites?.();};
  return h('span',{className:'sync-status sync-'+(state?.status||'idle'),title:state?.pending?'Bấm để đồng bộ lại':(state?.detail||label),'aria-live':'polite',role:state?.pending?'button':undefined,tabIndex:state?.pending?0:undefined,onClick:retry,onKeyDown:event=>{if(state?.pending&&(event.key==='Enter'||event.key===' ')){event.preventDefault();retry();}},style:state?.pending?{cursor:'pointer'}:null},
    h('i',{className:'ti '+item[1]+(state?.status==='syncing'?' spin':'')}),label
  );
}

function App(){
  const isFaceMask=window.SCF_APP_VARIANT==='face-mask';
  const homePage=isFaceMask?'workreport_total':'welcome';
  const[session,setSession]=useLS('scf_session',null);
  const[menuHidden,setMenuHidden]=useLS('scf_topnav_hidden',false);
  const[employees,_se]=useState(DEF_EMPS);
  const[company,_sc]=useState(DEF_COMPANY);
  const[materials,_sm]=useState(DEF_MATERIALS);
  const[assets,_sas]=useState([]);
  const[garages,_sg]=useState([]);
  const[prodCats,_spc]=useState(DEF_PRODCATS);
  const[products,_sp]=useState(DEF_PRODUCTS);
  const[prodShifts,_sps]=useState(DEF_PROD_SHIFTS);
  const[prodShiftRules,_spr]=useState(DEF_PROD_SHIFT_RULES);
  const[areas,_sar]=useState(DEF_AREAS);
  const[customers,_scu]=useState(DEF_CUSTOMERS);
  const[workcats,_swc]=useState(DEF_WORKCATS);
  const[depts,_sdp]=useState(DEF_DEPTS);
  const[permissionProfiles,_spermissionProfiles]=useState(DEFAULT_PERMISSION_PROFILES);
  const[tasks,_stasks]=useState([]);
  const[nccs,_sncc]=useState([]);
  const[nccGoods,_snccg]=useState([]);
  const[purchases,_spu]=useState([]);
  const[goodsPurchases,_spg]=useState([]);
  const[fuelPurchases,_sfp]=useState([]);
  const[materialMonthOpenings,_smo]=useState([]);
  const[shifts,_ssh]=useState(D_SHIFTS);
  const[quotes,_sq]=useState([]);
  const[orders,_so]=useState([]);
  const[trips,_st]=useState([]);
  const[prodOrders,_spo]=useState([]);
  const[prodActuals,_spa]=useState({});
  const[stock,_sstk]=useState([]);
  const[attendance,_sa]=useState([]);
  const[advances,_sadv]=useState([]);
  const[rewards,_srw]=useState([]);
  const[employeeErrors,_see]=useState([]);
  const[employeeUniforms,_seu]=useState([]);
  const[leaves,_slv]=useState([]);
  const[uiSettings,_sui]=useState(DEF_UI_SETTINGS);
  const[printTemplateSettings,_spt]=useState(DEF_PRINT_TEMPLATE_SETTINGS);
  const[financeEntries,_sfe]=useState([]);
  const[financeDebts,_sfd]=useState([]);
  const[financeOpenings,_sfo]=useState([]);
  const[companyNews,_snews]=useState([]);
  const[internalMessages,_sim]=useState([]);
  const[notifications,_snotifications]=useState([]);
  const[deliveryRules,_sdr]=useState([]);
  const[processPosts,_spp]=useState({});
  window.__SCF_CUSTOMERS=customers||[];
  window.__SCF_PROD_SHIFTS=prodShifts||[];
  window.__SCF_SHIFTS=shifts||[];
  const setEmployees=mkSet('scf_employees',_se);
  const setCompany=mkSet('scf_company',_sc);
  const setMaterials=mkSet('scf_materials',_sm);
  const setAssets=mkSet('scf_assets',_sas);
  const setGarages=mkSet('scf_garages',_sg);
  const setProdCats=mkSet('scf_prodcats',_spc);
  const setProducts=mkSet('scf_products',_sp);
  const setProdShifts=mkSet('scf_prod_shifts',_sps);
  const setProdShiftRules=mkSet('scf_prod_shift_rules',_spr);
  const setAreas=mkSet('scf_areas',_sar);
  const setCustomers=mkSet('scf_customers',_scu);
  const setWorkcats=mkSet('scf_workcats',_swc);
  const setDepts=mkSet('scf_depts',_sdp);
  const setPermissionProfiles=mkSet('scf_permission_profiles',_spermissionProfiles);
  const setTasks=mkSet('scf_tasks',_stasks);
  const setNCCs=mkSet('scf_nccs',_sncc);
  const setNccGoods=mkSet('scf_ncc_goods',_snccg);
  const setPurchases=mkSet('scf_purchases',_spu);
  const setGoodsPurchases=mkSet('scf_goods_purchases',_spg);
  const setFuelPurchases=mkSet('scf_fuelpurchases',_sfp);
  const setMaterialMonthOpenings=mkSet('scf_material_month_openings',_smo);
  const setShifts=mkSet('scf_shifts',_ssh);
  const setQuotes=mkSet('scf_quotes',_sq);
  const setOrders=mkSet('scf_orders',_so);
  const setTrips=mkSet('scf_trips',_st);
  const setProdOrders=mkSet('scf_prodorders',_spo);
  const setProdActuals=mkSet('scf_prod_actuals',_spa);
  const setStock=mkSet('scf_stock',_sstk);
  const setAttendance=mkSet('scf_attendance',_sa);
  const setAdvances=mkSet('scf_advances',_sadv);
  const setRewards=mkSet('scf_rewards',_srw);
  const setEmployeeErrors=mkSet('scf_employee_errors',_see);
  const setEmployeeUniforms=mkSet('scf_employee_uniforms',_seu);
  const setLeaves=mkSet('scf_leaves',_slv);
  const setUiSettings=mkSet('scf_ui_settings',_sui);
  const setPrintTemplateSettings=mkSet('scf_print_template_settings',_spt);
  const setFinanceEntries=mkSet('scf_finance_entries',_sfe);
  const setFinanceDebts=mkSet('scf_finance_debts',_sfd);
  const setFinanceOpenings=mkSet('scf_finance_openings',_sfo);
  const mkCommunitySet=(key,setter)=>valOrFn=>setter(prev=>{
    const next=typeof valOrFn==='function'?valOrFn(prev):valOrFn;
    dbSet(key,next);
    return next;
  });
  const setCompanyNews=mkCommunitySet('scf_company_news',_snews);
  const setInternalMessages=mkCommunitySet('scf_internal_messages',_sim);
  const setNotifications=mkCommunitySet('scf_notifications',_snotifications);
  const setDeliveryRules=mkCommunitySet('scf_delivery_rules',_sdr);
  const setProcessPosts=processPage=>valOrFn=>_spp(prev=>{
    const current=prev?.[processPage]||[];
    const next=typeof valOrFn==='function'?valOrFn(current):valOrFn;
    dbSet(PROCESS_POST_KEYS[processPage],next);
    return {...(prev||{}),[processPage]:next};
  });
  const refreshCommunityData=React.useCallback(async()=>{
    const[newsData,messageData,notificationData]=await Promise.all([
      dbGet('scf_company_news',[]),
      dbGet('scf_internal_messages',[]),
      dbGet('scf_notifications',[])
    ]);
    _snews(newsData||[]);
    _sim(messageData||[]);
    _snotifications(notificationData||[]);
  },[]);
  const[loading,setLoading]=useState(true);
  const[col,setCol]=useState(false);
  const[page,setPage]=useLS(isFaceMask?'facemask_last_page':'scf_last_page',homePage);
  const browserNavReadyRef=React.useRef(false);
  const browserPopRef=React.useRef(false);
  const[serverAuthReady,setServerAuthReady]=useState(!SCF_SERVER_AUTH_ENABLED);
  useEffect(()=>{
    const onPopState=e=>{
      browserPopRef.current=true;
      setPage(e.state?.scfPage||homePage);
    };
    window.addEventListener('popstate',onPopState);
    return()=>window.removeEventListener('popstate',onPopState);
  },[]);
  useEffect(()=>{
    if(!browserNavReadyRef.current){
      history.replaceState({...history.state,scfPage:homePage},'');
      if(page!==homePage)history.pushState({...history.state,scfPage:page},'');
      browserNavReadyRef.current=true;
      return;
    }
    if(browserPopRef.current){
      browserPopRef.current=false;
      return;
    }
    history.pushState({...history.state,scfPage:page},'');
  },[page]);
  const goBackPage=()=>{
    if(page===homePage)return;
    if(history.state?.scfPage===page)history.back();
    else setPage(homePage);
  };
  useEffect(()=>{
    if(!SCF_SERVER_AUTH_ENABLED)return;
    getServerAuthSession().then(serverSession=>{
      const employeeId=serverSession?.user?.app_metadata?.employee_id;
      setSession(employeeId?{id:employeeId}:null);
    }).catch(()=>setSession(null)).finally(()=>setServerAuthReady(true));
  },[]);
  useEffect(()=>{
    if(!serverAuthReady)return;
    const loadingGuard=setTimeout(()=>setLoading(false),8000);
    (async()=>{
      try{
        const[e,c,m,assetData,garageData,pc,p,cu,ar,wc,tk,ncc,nccg,pu,pg,q,fp,mo,o,t,a,adv,rw,employeeErrorData,employeeUniformData,lv,dp,permissionProfileData,ui,pts,pa,shData,psData,psrData,fe,fd,fo,newsData,messageData,notificationData,deliveryRulesData,processAccountingPosts,processBunPosts,processPhoPosts,processBanhCuonPosts]=await Promise.all([
          dbGet('scf_employees',DEF_EMPS),dbGet('scf_company',DEF_COMPANY),
          dbGet('scf_materials',DEF_MATERIALS),dbGet('scf_assets',[]),dbGet('scf_garages',[]),dbGet('scf_prodcats',DEF_PRODCATS),
          dbGet('scf_products',DEF_PRODUCTS),dbGet('scf_customers',DEF_CUSTOMERS),
          dbGet('scf_areas',DEF_AREAS),
          dbGet('scf_workcats',DEF_WORKCATS),dbGet('scf_tasks',[]),dbGet('scf_nccs',[]),dbGet('scf_ncc_goods',[]),dbGet('scf_purchases',[]),dbGet('scf_goods_purchases',[]),dbGet('scf_quotes',[]),
          dbGet('scf_fuelpurchases',[]),
          dbGet('scf_material_month_openings',[]),
          dbGet('scf_orders',[]),dbGet('scf_trips',[]),dbGet('scf_attendance',[]),
          dbGet('scf_advances',[]),dbGet('scf_rewards',[]),dbGet('scf_employee_errors',[]),dbGet('scf_employee_uniforms',[]),dbGet('scf_leaves',[]),dbGet('scf_depts',DEF_DEPTS),dbGet('scf_permission_profiles',DEFAULT_PERMISSION_PROFILES),dbGet('scf_ui_settings',DEF_UI_SETTINGS),dbGet('scf_print_template_settings',DEF_PRINT_TEMPLATE_SETTINGS),dbGet('scf_prod_actuals',{}),
          dbGet('scf_shifts',D_SHIFTS),dbGet('scf_prod_shifts',DEF_PROD_SHIFTS),dbGet('scf_prod_shift_rules',DEF_PROD_SHIFT_RULES),
          dbGet('scf_finance_entries',[]),dbGet('scf_finance_debts',[]),dbGet('scf_finance_openings',[]),
          dbGet('scf_company_news',[]),dbGet('scf_internal_messages',[]),dbGet('scf_notifications',[]),dbGet('scf_delivery_rules',[]),
          dbGet(PROCESS_POST_KEYS.process_accounting,[]),dbGet(PROCESS_POST_KEYS.process_bun,[]),dbGet(PROCESS_POST_KEYS.process_pho,[]),dbGet(PROCESS_POST_KEYS.process_banhcuon,[]),
        ]);
        const normalizedOrders=normalizeOrdersForStorage(o||[]);
        const normalizedProducts=(p||[]).map(normalizeProductWeight);
        _se(e||DEF_EMPS);_sc({...DEF_COMPANY,...(c||{})});_sm(m);_sas(assetData);_sg(garageData||[]);_spc(pc);_sp(normalizedProducts);_scu(cu);_sar(ar);_swc(wc);_stasks(tk);_sncc(ncc);_snccg(nccg);_spu(pu);_spg(pg);_sfp(fp);_smo(mo);_ssh(shData);_sq(q);_so(normalizedOrders);_st(t);_sa(a);_sadv(adv);_srw(rw);_see(employeeErrorData||[]);_seu(employeeUniformData||[]);_slv(lv);_sdp(dp);_spermissionProfiles(normalizePermissionProfiles(permissionProfileData));_sui(normalizeUiSettings(ui));_spt(normalizePrintTemplateSettings(pts));_spa(pa||{});_sps(psData);_spr(psrData);_sfe(fe||[]);_sfd(fd||[]);_sfo(fo||[]);_snews(newsData||[]);_sim(messageData||[]);_snotifications(notificationData||[]);_sdr(deliveryRulesData||[]);_spp({process_accounting:processAccountingPosts||[],process_bun:processBunPosts||[],process_pho:processPhoPosts||[],process_banhcuon:processBanhCuonPosts||[]});
        if(ordersNeedTimeNormalization(o||[]))dbSet('scf_orders',normalizedOrders);
        if((p||[]).some((item,index)=>Number(item?.weightPerUnit||0)!==Number(normalizedProducts[index]?.weightPerUnit||0)))dbSet('scf_products',normalizedProducts);
      }catch(err){console.warn(err);}finally{clearTimeout(loadingGuard);setLoading(false);}
    })();
    return()=>clearTimeout(loadingGuard);
  },[serverAuthReady]);
  useEffect(()=>{
    const vars=uiSettingsToCssVars(uiSettings);
    Object.entries(vars).forEach(([key,val])=>document.documentElement.style.setProperty(key,val));
  },[uiSettings]);
  useEffect(()=>{
    const onShortcut=e=>{
      if(!(e.ctrlKey&&e.shiftKey)) return;
      if(String(e.key||'').toLowerCase()!=='a') return;
      e.preventDefault();
      setMenuHidden(v=>!v);
    };
    document.addEventListener('keydown',onShortcut,true);
    return()=>document.removeEventListener('keydown',onShortcut,true);
  },[]);

  useEffect(()=>{
    if(loading||!sb)return;
    const refresh=async()=>{
      try{
        const[o,t,n]=await Promise.all([dbGet('scf_orders',orders),dbGet('scf_trips',trips),dbGet('scf_notifications',notifications)]);
        _so(normalizeOrdersForStorage(o||[]));_st(t||[]);_snotifications(n||[]);
      }catch(e){console.warn('Auto sync:',e.message||e);}
    };
    const tm=setInterval(refresh,5000);
    window.scfSyncNow=refresh;
    return()=>clearInterval(tm);
  },[loading]);

  /* ── TỰ TÌM/TẠO CHUYẾN CHỈ KHI CÓ ĐƠN CHƯA XẾP ── */
  useEffect(()=>{
    const automationUser=session?(employees.find(e=>String(e.id)===String(session.id))||null):null;
    if(loading||isFaceMask||!automationUser||!canAccess(automationUser.role,'delivery',automationUser.permissions,automationUser.dept)||!canWrite(automationUser.role,'delivery',automationUser.permLevels)||!shifts?.length||!prodShifts?.length)return;
    const norm=v=>normalizeLookupText(v||'');
    const sameDate=(a,b)=>String(a||'').trim()===String(b||'').trim();
    const usableTrip=t=>!['active','completion_pending','completed','cancelled'].includes(String(t?.status||''));
    const linkedTripIds=new Set((orders||[]).filter(o=>!['cancelled','done','failed'].includes(String(o?.status||''))).map(o=>String(o?.tripId||'')).filter(Boolean));
    const keptTrips=(trips||[]).filter(t=>!(t?.autoCreated&&usableTrip(t)&&!(t.orderIds||[]).length&&!linkedTripIds.has(String(t.id||''))));
    const workingTrips=keptTrips.map(t=>({...t,orderIds:[...(t.orderIds||[])]}));
    const tripById=new Map(workingTrips.map(t=>[String(t.id||''),t]));
    let tripsChanged=keptTrips.length!==(trips||[]).length,ordersChanged=false;
    const nextOrders=(orders||[]).map(order=>{
      if(order?.tripAssignMode==='manual'||!['','pending','assigned'].includes(String(order?.status||'')))return order;
      const linked=tripById.get(String(order?.tripId||''));
      if(linked){
        if(!(linked.orderIds||[]).includes(order.id)){linked.orderIds=[...(linked.orderIds||[]),order.id];tripsChanged=true;}
        return order;
      }
      const plannedShift=order?.prodShiftAssignMode==='manual'&&order?.prodShiftId
        ?(prodShifts||[]).find(s=>String(s?.id||'')===String(order.prodShiftId))
        :getProdShiftForOrder(order,prodShifts||[],customers||[]);
      if(!plannedShift)return order;
      const tripDate=addDaysVN(order.deliveryDate,Number(plannedShift.tripDateOffset??0));
      // Chỉ dùng ca giao đã được khai báo trực tiếp trong cấu hình ca SX.
      // Không suy đoán ca giao theo khu vực, tên điểm hoặc các chuyến cùng ngày.
      const wantedShiftId=String(plannedShift.tripShiftId||'').trim();
      const wantedShiftName=String(plannedShift.tripShiftName||'').trim();
      if(!tripDate||(!wantedShiftId&&!wantedShiftName))return order;
      const deliveryShift=(shifts||[]).find(s=>wantedShiftId&&String(s.id||'')===wantedShiftId)
        ||(shifts||[]).find(s=>wantedShiftName&&norm(s.name)===norm(wantedShiftName));
      if(!deliveryShift)return order;
      const shiftId=String(deliveryShift.id||'').trim();
      const shiftName=String(deliveryShift.name||'').trim();
      let trip=workingTrips.find(t=>usableTrip(t)&&sameDate(t.deliveryDate,tripDate)&&(
        (shiftId&&String(t.shiftId||'')===shiftId)||(shiftName&&norm(t.shiftName)===norm(shiftName))
      ));
      if(!trip){
        const driverId=String(deliveryShift?.defaultDriverId||'').trim();
        const driverName=String(deliveryShift?.defaultDriverName||'').trim();
        trip={
          id:'CH'+uid(),deliveryDate:tripDate,deliveryTime:deliveryShift?.timeStart||deliveryShift?.startTime||order.deliveryTime||'',
          shiftId,shiftName:shiftName||deliveryShift?.area||'Chuyến tự động',area:deliveryShift?.area||order.area||'',
          driverName,driverId,driverAssignMode:driverId||driverName?'auto':'',orderIds:[],totalWeight:0,
          status:driverId||driverName?'assigned':'planning',
          note:'Tự động tạo khi có đơn phù hợp'+(shiftName?': '+shiftName:''),
          createdAt:fmtDT(),updatedAt:fmtDT(),updatedBy:automationUser.name||'Hệ thống',autoCreated:true
        };
        workingTrips.push(trip);tripById.set(String(trip.id),trip);tripsChanged=true;
      }
      if(!trip.orderIds.includes(order.id)){trip.orderIds.push(order.id);tripsChanged=true;}
      if(String(order.tripId||'')===String(trip.id)&&order.status==='assigned'&&order.tripAssignMode==='auto')return order;
      ordersChanged=true;
      return {...order,tripId:trip.id,tripAssignMode:'auto',status:'assigned',updatedAt:fmtDT(),updatedBy:automationUser.name||'Hệ thống'};
    });
    if(tripsChanged)setTrips(workingTrips);
    if(ordersChanged)setOrders(nextOrders);
  },[loading,isFaceMask,session,employees,orders,trips,shifts,prodShifts,customers]);

  const cu=session?(employees.find(e=>e.id===session.id)||(String(window.__SCF_CURRENT_EMPLOYEE?.id||'')===String(session.id)?window.__SCF_CURRENT_EMPLOYEE:null)):null;
  const addNotification=React.useCallback(data=>{
    const recipientIds=[...new Set((data?.recipientIds||[data?.recipientId]).filter(Boolean).map(String))];
    if(!recipientIds.length)return;
    const nowIso=new Date().toISOString(),stamp=fmtDT();
    const rows=recipientIds.map(recipientId=>({
      id:'TB'+uid(),recipientId,title:data.title||'Thông báo',message:data.message||'',
      type:data.type||'info',icon:data.icon||'ti-bell',sourceType:data.sourceType||'',sourceId:data.sourceId||'',
      targetPage:data.targetPage||'notifications',createdAt:stamp,createdAtIso:nowIso,createdBy:cu?.name||'Hệ thống',readAt:''
    }));
    setNotifications(prev=>[...rows,...(prev||[])].slice(0,2000));
    setTimeout(()=>window.scfFlushPendingWrites&&window.scfFlushPendingWrites(),900);
    return rows.length;
  },[cu?.id,cu?.name]);
  const notificationReadyRef=React.useRef(false);
  useEffect(()=>{
    if(loading||!cu)return;
    const mine=(notifications||[]).filter(n=>String(n.recipientId||'')===String(cu.id)&&!n.readAt);
    if(!notificationReadyRef.current){notificationReadyRef.current=true;return;}
    if(!('Notification' in window)||Notification.permission!=='granted')return;
    mine.slice(0,5).forEach(n=>{
      const key='scf_notification_shown_'+n.id;
      if(sessionStorage.getItem(key))return;
      sessionStorage.setItem(key,'1');
      try{new Notification(n.title||'SCF - Thông báo',{body:n.message||'',icon:'./icon-192.png',tag:n.id});}catch{}
    });
  },[notifications,cu?.id,loading]);
  const unreadNotificationCount=cu?(notifications||[]).filter(n=>String(n.recipientId||'')===String(cu.id)&&!n.readAt).length:0;
  useEffect(()=>{
    if(cu&&cu.mustChangePw&&!sessionStorage.getItem('scf_pw_warned_'+cu.id)){
      sessionStorage.setItem('scf_pw_warned_'+cu.id,'1');
      setTimeout(()=>window.showToast&&window.showToast('Vui lòng đổi mật khẩu mặc định ngay để bảo mật tài khoản!','warn',7000),1500);
    }
  },[cu?.id,cu?.mustChangePw]);
  useEffect(()=>{
    if(cu&&!canAccess(cu.role,page,cu.permissions,cu.dept))setPage(homePage);
  },[cu?.id,cu?.role,cu?.dept,page]);
  if(loading)return h('div',{className:'load-screen'},
    isFaceMask?h('div',{className:'face-mask-load-icon'},h('i',{className:'ti ti-mask'})):h('div',{className:'load-logo-shell'},
      h('img',{src:'icon-192.png',className:'load-logo',alt:'Logo Thực Phẩm Sông Công'})
    ),
    h('div',{style:{fontSize:17,fontWeight:600,color:'var(--pri3)',marginBottom:4}},isFaceMask?'FACE MASK':'Thực Phẩm Sông Công'),
    h('div',{style:{fontSize:13,color:'var(--pri2)',display:'flex',alignItems:'center',gap:6}},h('i',{className:'ti ti-loader-2 spin',style:{fontSize:16}}),'Đang tải dữ liệu...')
  );
  const hasConfiguredAdmin=employees.some(employee=>employee.role==='admin'&&String(employee.username||'').trim()&&String(employee.password||'').length>0);
  if(!SCF_SERVER_AUTH_ENABLED&&!hasConfiguredAdmin)return h(InitialAdminSetup,{onSetup:async({username,password})=>{
    if(employees.some(employee=>employee.role!=='admin'&&String(employee.username||'').toLowerCase()===username.toLowerCase())){
      throw new Error('Tên đăng nhập này đang được nhân viên khác sử dụng.');
    }
    const passwordHash=await hashPassword(password);
    let found=false;
    const next=employees.map(employee=>{
      if(employee.role!=='admin'||found)return employee;
      found=true;
      return {...employee,username,password:passwordHash,mustChangePw:false,updatedBy:'Thiết lập ban đầu',updatedAt:fmtDT()};
    });
    if(!found)next.push({...DEF_EMPS[0],username,password:passwordHash,updatedBy:'Thiết lập ban đầu',updatedAt:fmtDT()});
    _se(next);
    await dbSet('scf_employees',next);
    window.showToast&&window.showToast('Đã tạo tài khoản Admin. Hãy đăng nhập để tiếp tục.','success');
  }});
  if(!cu)return h(LoginPage,{employees,onLogin:u=>{setSession({id:u.id});if(SCF_SERVER_AUTH_ENABLED)setTimeout(()=>location.reload(),50);}});
  if(isFaceMask&&!['admin','administrator'].includes(String(cu.role||'').toLowerCase()))return h('div',{className:'login-bg'},
    h('div',{className:'login-card',style:{textAlign:'center'}},
      h('div',{className:'face-mask-login-icon',style:{margin:'0 auto 12px'}},h('i',{className:'ti ti-shield-lock'})),
      h('h1',{style:{fontSize:21,color:'var(--pri3)',marginBottom:8}},'Không có quyền truy cập'),
      h('p',{style:{fontSize:13,color:'var(--tx2)',lineHeight:1.6,marginBottom:18}},'FACE MASK chỉ dành cho tài khoản Admin.'),
      h('button',{className:'bp',style:{width:'100%',justifyContent:'center'},onClick:async()=>{await serverLogout();window.scfClearSensitiveLocalData&&window.scfClearSensitiveLocalData();setSession(null);}},h('i',{className:'ti ti-logout'}),'Đăng xuất')
    )
  );
  const isAccounting=String(cu.dept||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').includes('ke toan');
  const activeLevel=getLvl(cu.role,page,cu.permLevels);
  const readOnly=activeLevel==='r';
  window.__SCF_ACCESS_CONTEXT={role:cu.role,page,level:activeLevel,readOnly};
  const wips=['purchase','workreport_vp','workreport_sx','marketsales'];
  const logout=async()=>{await serverLogout();window.scfClearSensitiveLocalData&&window.scfClearSensitiveLocalData();setSession(null);if(SCF_SERVER_AUTH_ENABLED)location.reload();};
  return h('div',{className:'layout'},
    h('div',{className:'main'},
      !menuHidden&&h('div',{className:'topbar'+(page!=='welcome'?' mobile-subpage-topbar':'')},
        h('div',{className:'topbar-main'},
          h('div',{className:'topbar-brand'},
            isFaceMask?h('span',{className:'face-mask-brand-icon'},h('i',{className:'ti ti-mask'})):h('img',{src:LOGO_SRC,className:'topbar-logo'}),
            h('div',{className:'topbar-title'},
              h('div',{className:'topbar-company'},isFaceMask?'FACE MASK':(company?.name||'SCF')),
              h('div',{className:'topbar-meta'},
                h('span',null,'Menu'),
                h('span',{title:'Phiên bản ứng dụng đang chạy',style:{display:'inline-flex',alignItems:'center',padding:'1px 6px',borderRadius:999,background:'rgba(255,255,255,.16)',color:'#fff',fontSize:10,fontWeight:700,letterSpacing:'.3px'}},SCF_BUILD_VERSION),
                sb&&h(SyncStatus)
              )
            )
          ),
          h('div',{className:'topbar-actions'},
            !isFaceMask&&h('button',{className:'topbar-notification',onClick:()=>setPage('notifications'),title:'Thông báo','aria-label':'Thông báo'},
              h('i',{className:'ti ti-bell'}),unreadNotificationCount>0&&h('span',{className:'notification-count'},unreadNotificationCount>99?'99+':unreadNotificationCount)
            ),
            h('div',{className:'topbar-user'},
              h('div',{className:'topbar-user-name'},cu.name)
            ),
            h('button',{className:'topbar-logout',onClick:logout,style:{fontSize:12,padding:'5px 10px',color:'#A32D2D',borderColor:'#F7C1C1'},title:'Đăng xuất','aria-label':'Đăng xuất'},h('i',{className:'ti ti-logout',style:{fontSize:14}}),h('span',{className:'topbar-logout-label'},'Đăng xuất'))
          )
        ),
        h(TopNav,{page,setPage,role:cu.role,perms:cu.permissions,dept:cu.dept})
      ),
      page!=='welcome'&&h('div',{className:'mobile-page-backbar'},
        h('button',{className:'mobile-page-back',onClick:goBackPage,'aria-label':'Quay lại trang trước'},
          h('i',{className:'ti ti-arrow-left'}),h('span',null,'Quay lại')
        ),
        h('div',{className:'mobile-page-title'},PTITLES[page]||(isFaceMask?'FACE MASK':'SCF'))
      ),
      h('div',{
        className:'content'+(menuHidden?' compact-top':'')+(page!=='welcome'?' mobile-subpage-content':'')+(readOnly?' scf-readonly':'')+(activeLevel!=='rwd'?' scf-no-delete':''),
        onClickCapture:e=>guardPermissionAction(e,cu.role,page,cu.permLevels)
      },
        canAccess(cu.role,page)&&page==='welcome'&&h(WelcomePage,{emp:cu,employees,company,uiSettings,news:companyNews,setNews:setCompanyNews,messages:internalMessages,setMessages:setInternalMessages,onRefresh:refreshCommunityData}),
        canAccess(cu.role,'company',cu.permissions,cu.dept)&&page==='company'&&h(CompanySettings,{company,setCompany,canEdit:canWrite(cu.role,'company',cu.permLevels)}),
        canAccess(cu.role,'appearance',cu.permissions)&&page==='appearance'&&h(AppearanceSettingsTab,{uiSettings,setUiSettings}),
        canAccess(cu.role,'printtemplates',cu.permissions)&&page==='printtemplates'&&h(PrintTemplateSettingsTab,{templateSettings:printTemplateSettings,setTemplateSettings:setPrintTemplateSettings,products,customers}),
        canAccess(cu.role,'employees',cu.permissions)&&page==='employees'&&h(EmployeeTab,{employees,setEmployees,cu,depts,permissionProfiles}),
        canAccess(cu.role,'permission_settings',cu.permissions)&&page==='permission_settings'&&h(PermissionSettingsTab,{profiles:permissionProfiles,setProfiles:setPermissionProfiles,employees,setEmployees,currentUser:cu}),
        canAccess(cu.role,'attendance',cu.permissions)&&page==='attendance'&&h(AttendanceTab,{section:'punch',attendance,setAttendance,employees,setEmployees,currentUser:cu,company}),
        canAccess(cu.role,'attendance_settings',cu.permissions)&&page==='attendance_settings'&&h(AttendanceTab,{section:'settings',attendance,setAttendance,employees,setEmployees,currentUser:cu,company}),
        canAccess(cu.role,'attendance_report',cu.permissions)&&page==='attendance_report'&&h(AttendanceTab,{section:'report',attendance,setAttendance,employees,setEmployees,currentUser:cu,company}),
        canAccess(cu.role,'workreport_total',cu.permissions,cu.dept)&&page==='workreport_total'&&h(AttendanceTab,{section:'report',attendance,setAttendance,employees,setEmployees,currentUser:cu,company,reportTitle:'Tổng công'}),
        canAccess(cu.role,'advances',cu.permissions)&&page==='advances'&&h(MoneyTab,{mode:'advance',records:advances,setRecords:setAdvances,employees,currentUser:cu}),
        canAccess(cu.role,'rewards',cu.permissions)&&page==='rewards'&&h(MoneyTab,{mode:'reward',records:rewards,setRecords:setRewards,employees,currentUser:cu}),
        canAccess(cu.role,'employee_errors',cu.permissions)&&page==='employee_errors'&&h(EmployeeErrorsTab,{records:employeeErrors,setRecords:setEmployeeErrors,employees,currentUser:cu}),
        canAccess(cu.role,'employee_uniforms',cu.permissions)&&page==='employee_uniforms'&&h(EmployeeUniformsTab,{records:employeeUniforms,setRecords:setEmployeeUniforms,employees,currentUser:cu,canEdit:canWrite(cu.role,'employee_uniforms',cu.permLevels),canDelete:canDel(cu.role,'employee_uniforms',cu.permLevels)}),
        canAccess(cu.role,'leaves',cu.permissions)&&page==='leaves'&&h(LeaveTab,{leaves,setLeaves,employees,currentUser:cu}),
        canAccess(cu.role,'backup',cu.permissions)&&page==='backup'&&h(BackupTab,{employees,materials,assets,garages,prodCats,products,customers,workcats,tasks,advances,rewards,employeeErrors,employeeUniforms,leaves,nccs,nccGoods,purchases,goodsPurchases,depts,prodShiftRules,uiSettings,printTemplateSettings,financeEntries,financeDebts,financeOpenings}),
        canAccess(cu.role,'materials',cu.permissions)&&page==='materials'&&h(MaterialsTab,{materials,setMaterials,purchases}),
        canAccess(cu.role,'assets',cu.permissions)&&page==='assets'&&h(AssetsTab,{assets,setAssets}),
        canAccess(cu.role,'garages',cu.permissions)&&page==='garages'&&h(GaragesTab,{garages,setGarages}),
        canAccess(cu.role,'depts',cu.permissions)&&page==='depts'&&h(DeptsTab,{depts,setDepts,employees,workcats}),
        canAccess(cu.role,'products',cu.permissions)&&page==='products'&&h(ProductsTab,{products,setProducts,prodCats,setProdCats}),
        canAccess(cu.role,'customers',cu.permissions)&&page==='customers'&&h(CustomersTab,{customers,setCustomers,shifts,orders,areas,cu}),
        canAccess(cu.role,'areas',cu.permissions)&&page==='areas'&&h(AreasTab,{areas,setAreas,customers,setCustomers,orders}),
        canAccess(cu.role,'prodshifts',cu.permissions)&&page==='prodshifts'&&h(ProdShiftsTab,{prodShifts,setProdShifts,prodShiftRules,setProdShiftRules,orders,customers,shifts}),
        canAccess(cu.role,'deliveryrules',cu.permissions)&&page==='deliveryrules'&&h(DeliveryRulesTab,{items:deliveryRules,setItems:setDeliveryRules,currentUser:cu}),
        canAccess(cu.role,'workcats',cu.permissions)&&page==='workcats'&&h(WorkCatsTab,{workcats,setWorkcats,depts}),
        canAccess(cu.role,'tasks',cu.permissions)&&page==='tasks'&&h(TasksTab,{tasks,setTasks,workcats,employees,currentUser:cu,notify:addNotification}),
        canAccess(cu.role,'notifications',cu.permissions)&&page==='notifications'&&h(NotificationsTab,{notifications,setNotifications,currentUser:cu,setPage}),
        canAccess(cu.role,'userguide',cu.permissions)&&page==='userguide'&&h(UserGuideTab,{currentUser:cu}),
        canAccess(cu.role,'nccs',cu.permissions)&&page==='nccs'&&h(NCCTab,{nccs,setNCCs,purchases,setPurchases,title:'Nhà CC NVL',fileName:'Nha_CC_NVL'}),
        canAccess(cu.role,'nccgoods',cu.permissions,cu.dept)&&page==='nccgoods'&&h(NCCTab,{nccs:nccGoods,setNCCs:setNccGoods,purchases:goodsPurchases,setPurchases:setGoodsPurchases,title:'Nhà CC Hàng hóa',fileName:'Nha_CC_Hang_hoa',readOnly:cu.role!=='admin'&&!isAccounting}),
        canAccess(cu.role,'purchaseorders',cu.permissions)&&page==='purchaseorders'&&h(PurchaseTab,{purchases,setPurchases,nccs,setNCCs,materials,products,cu,setPage,mode:'material'}),
        canAccess(cu.role,'purchasegoods',cu.permissions,cu.dept)&&page==='purchasegoods'&&h(PurchaseTab,{purchases:goodsPurchases,setPurchases:setGoodsPurchases,nccs:nccGoods,setNCCs:setNccGoods,materials,products,cu,setPage,mode:'goods'}),
        canAccess(cu.role,'fuelpurchases',cu.permissions)&&page==='fuelpurchases'&&h(FuelPurchaseTab,{rows:fuelPurchases,setRows:setFuelPurchases,employees,assets,currentUser:cu}),
        canAccess(cu.role,'utilityexpenses',cu.permissions)&&page==='utilityexpenses'&&h(UtilityExpenseTab,{entries:financeEntries,setEntries:setFinanceEntries,currentUser:cu}),
        canAccess(cu.role,'fuelreport',cu.permissions)&&page==='fuelreport'&&h(FuelPurchaseReportTab,{rows:fuelPurchases}),
        canAccess(cu.role,'purchasereport',cu.permissions)&&page==='purchasereport'&&h(PurchaseReportTab,{purchases,goodsPurchases,nccs:[...(nccs||[]),...(nccGoods||[])]}),
        canAccess(cu.role,'maintreport',cu.permissions)&&page==='maintreport'&&h(MaintenanceReportTab),
        canAccess(cu.role,'materialusage',cu.permissions)&&page==='materialusage'&&h(MaterialUsageReportTab,{materials,purchases,monthOpenings:materialMonthOpenings,setMonthOpenings:setMaterialMonthOpenings}),
        canAccess(cu.role,'powderdebtreport',cu.permissions)&&page==='powderdebtreport'&&h(PowderDebtReportTab,{customers}),
        canAccess(cu.role,'maint_vehicle',cu.permissions)&&page==='maint_vehicle'&&h(MaintenanceTab,{title:'Bảo dưỡng xe',icon:'ti-car',assets,employees,garages,setPage}),
        canAccess(cu.role,'maint_machine',cu.permissions)&&page==='maint_machine'&&h(MaintenanceTab,{title:'Bảo dưỡng máy',icon:'ti-settings',assets,employees}),
        canAccess(cu.role,'shifts',cu.permissions)&&page==='shifts'&&h(ShiftsTab,{shifts,setShifts,employees,trips,setTrips}),
        canAccess(cu.role,'quotes',cu.permissions)&&page==='quotes'&&h(QuotesTab,{quotes,setQuotes,customers,products,currentUser:cu}),
        canAccess(cu.role,'delivery',cu.permissions)&&page==='delivery'&&h(DeliveryOrdersTab,{orders,setOrders,customers,setCustomers,products,prodCats,quotes,employees,currentUser:cu,trips,setTrips,company,prodShifts,prodShiftRules,shifts,menuHidden,setMenuHidden,printTemplateSettings,notify:addNotification}),
        canAccess(cu.role,'intem',cu.permissions)&&page==='intem'&&h(IntemTab,{products,company}),
        canAccess(cu.role,'trips',cu.permissions,cu.dept)&&page==='trips'&&h(TripsTab,{trips,setTrips,orders,setOrders,employees,shifts,prodShifts,customers,products,quotes,financeDebts,setFinanceDebts,currentUser:cu,notify:addNotification}),
        canAccess(cu.role,'workreport_lx',cu.permissions,cu.dept)&&page==='workreport_lx'&&h(DriverTripWorkReportTab,{trips,orders,products,customers,currentUser:cu}),
        canAccess(cu.role,'orderdetail',cu.permissions)&&page==='orderdetail'&&h(OrderDetailListTab,{orders,setOrders,products,customers,shifts,trips,currentUser:cu,prodShifts,quotes,financeDebts,setFinanceDebts,menuHidden,setMenuHidden}),
        canAccess(cu.role,'salesreport',cu.permissions)&&page==='salesreport'&&h(SalesReportTab,{orders,customers,products,shifts:prodShifts,quotes}),
canAccess(cu.role,'cashflowreport',cu.permissions)&&page==='cashflowreport'&&h(FinanceReportTab,{entries:financeEntries,setEntries:setFinanceEntries,debts:financeDebts,setDebts:setFinanceDebts,openings:financeOpenings,setOpenings:setFinanceOpenings,customers,nccs,currentUser:cu,orders,products,quotes,purchases,goodsPurchases}),
        canAccess(cu.role,'powdersales',cu.permissions)&&page==='powdersales'&&h(PowderSalesTab,{customers,trips,employees,setPage}),
        canAccess(cu.role,'prodsummary',cu.permissions)&&page==='prodsummary'&&h(ProductionSummaryTab,{orders,products,prodShifts,prodShiftRules,prodActuals,setProdActuals,currentUser:cu}),
        canAccess(cu.role,'prodorders',cu.permissions)&&page==='prodorders'&&h(ProdOrdersTab,{prodOrders,setProdOrders,products,currentUser:cu}),
        canAccess(cu.role,'stock',cu.permissions)&&page==='stock'&&h(StockTab,{stock,setStock,products,currentUser:cu}),
        canAccess(cu.role,'syncreport',cu.permissions)&&page==='syncreport'&&h(SyncDataReportTab),
        canAccess(cu.role,'dbusage',cu.permissions)&&page==='dbusage'&&h(SupabaseUsageReportTab,{employees,materials,assets,prodCats,products,customers,areas,workcats,tasks,nccs,purchases,goodsPurchases,quotes,orders,trips,attendance,advances,rewards,employeeErrors,employeeUniforms,leaves,depts,shifts,prodShifts,prodShiftRules,prodOrders,stock,company}),
        ['process_accounting','process_bun','process_pho','process_banhcuon'].includes(page)&&h(ProcessPostsTab,{page,title:PTITLES[page],icon:PICONS[page],items:processPosts[page]||[],setItems:setProcessPosts(page),currentUser:cu}),
        wips.includes(page)&&h(PlaceholderTab,{title:PTITLES[page],icon:PICONS[page]||'ti-clock'})
      ),
      (page==='welcome'||isFaceMask)&&h(MobileNav,{page,setPage,role:cu.role,perms:cu.permissions,dept:cu.dept,onLogout:logout})
    ),
    cu.mustChangePw&&h(CpwModal,{
      emp:cu,cu,forced:true,onClose:()=>{},
      onSave:(password)=>{
        const update=list=>list.map(employee=>employee.id===cu.id
          ?{...employee,password,mustChangePw:false,updatedBy:cu.name,updatedAt:fmtDT()}
          :employee);
        return SCF_SERVER_AUTH_ENABLED?_se(update):setEmployees(update);
      }
    })
  );
}

try {
  try {
    
    const appEl = document.getElementById('app');
    
    ReactDOM.createRoot(appEl).render(
      h(ErrorBoundary, null, h(App))
    );
    
  } catch(e) {
    console.error('React mount error:', e);
    const el = document.getElementById('app');
    const target=el||document.body;target.replaceChildren();
    const wrap=document.createElement('div');wrap.style.cssText='padding:2rem;font-family:sans-serif;background:#fff;min-height:100vh;color:#A32D2D';
    const heading=document.createElement('h2');heading.textContent='Không thể hiển thị ứng dụng';
    const detail=document.createElement('p');detail.textContent=String(e?.message||'Đã xảy ra lỗi không xác định.');
    wrap.append(heading,detail);target.appendChild(wrap);
  }
} catch(e) {
  const target=document.getElementById('app')||document.body;target.replaceChildren();
  const wrap=document.createElement('div');wrap.style.cssText='padding:2rem;color:#A32D2D;font-family:sans-serif;background:#fff;min-height:100vh';
  const heading=document.createElement('h2');heading.textContent='Lỗi hiển thị SCF App';
  const detail=document.createElement('p');detail.style.marginTop='1rem';detail.textContent=String(e?.message||'Đã xảy ra lỗi không xác định.');
  wrap.append(heading,detail);target.appendChild(wrap);
}
