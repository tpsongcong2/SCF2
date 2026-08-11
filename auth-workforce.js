/* ─── FIRST ADMIN SETUP ─── */
function InitialAdminSetup({onSetup}){
  const[username,setUsername]=useState('admin');
  const[password,setPassword]=useState('');
  const[confirmPassword,setConfirmPassword]=useState('');
  const[show,setShow]=useState(false);
  const[error,setError]=useState('');
  const[busy,setBusy]=useState(false);
  const submit=async()=>{
    const cleanUsername=username.trim();
    if(!cleanUsername){setError('Hãy nhập tên đăng nhập Admin.');return;}
    if(password.length<PASSWORD_MIN_LENGTH){setError('Mật khẩu phải có ít nhất '+PASSWORD_MIN_LENGTH+' ký tự.');return;}
    if(password!==confirmPassword){setError('Mật khẩu xác nhận không khớp.');return;}
    setBusy(true);setError('');
    try{await onSetup({username:cleanUsername,password});}
    catch(e){setError(e.message||'Không thể tạo tài khoản Admin.');}
    finally{setBusy(false);}
  };
  return h('div',{className:'login-bg'},
    h('div',{className:'login-card'},
      h('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',marginBottom:'1.25rem'}},
        h('img',{src:LOGO_SRC,style:{width:72,height:72,marginBottom:10}}),
        h('h1',{style:{fontSize:20,fontWeight:700,color:'var(--pri3)',textAlign:'center'}},'Thiết lập Admin lần đầu'),
        h('p',{style:{fontSize:12,color:'var(--tx2)',textAlign:'center',marginTop:6}},'Hệ thống chưa có mật khẩu Admin. Hãy tự tạo thông tin đăng nhập ban đầu.')
      ),
      error&&h('div',{style:{background:'#FCEBEB',color:'#A32D2D',padding:'8px 12px',borderRadius:6,fontSize:13,marginBottom:'1rem',textAlign:'center'}},error),
      h(F,{label:'Tên đăng nhập Admin'},h('input',{value:username,onChange:e=>{setUsername(e.target.value);setError('');},autoComplete:'username'})),
      h(F,{label:'Mật khẩu Admin'},
        h('div',{className:'pw-wrap'},
          h('input',{type:show?'text':'password',value:password,onChange:e=>{setPassword(e.target.value);setError('');},autoComplete:'new-password'}),
          h('button',{type:'button',className:'pw-eye',onClick:()=>setShow(v=>!v),title:show?'Ẩn mật khẩu':'Hiện mật khẩu'},h('i',{className:'ti ti-eye'+(show?'-off':''),style:{fontSize:15}}))
        )
      ),
      h(F,{label:'Xác nhận mật khẩu'},h('input',{type:show?'text':'password',value:confirmPassword,onChange:e=>{setConfirmPassword(e.target.value);setError('');},autoComplete:'new-password',onKeyDown:e=>e.key==='Enter'&&submit()})),
      h('button',{className:'bp',onClick:submit,disabled:busy,style:{width:'100%',padding:'10px',fontSize:14,justifyContent:'center',marginTop:4}},h('i',{className:'ti '+(busy?'ti-loader-2 spin':'ti-shield-check'),style:{fontSize:16}}),busy?'Đang tạo...':'Tạo tài khoản Admin')
    )
  );
}

/* ─── LOGIN ─── */
function LoginPage({employees,onLogin}){
  const isFaceMask=window.SCF_APP_VARIANT==='face-mask';
  const[un,su]=useState('');const[pw,sp]=useState('');const[show,ss]=useState(false);const[err,se]=useState('');const[busy,setBusy]=useState(false);
  const[resetOpen,setResetOpen]=useState(false);
  const submit=async()=>{
    if(busy)return;
    setBusy(true);se('');
    try{
      if(SCF_SERVER_AUTH_ENABLED){
        const user=await serverUsernameLogin(un,pw);
        if(isFaceMask&&!['admin','administrator'].includes(String(user?.role||'').toLowerCase())){
          await serverLogout();
          throw new Error('FACE MASK chỉ cho phép tài khoản Admin đăng nhập.');
        }
        onLogin(user);
        return;
      }
      const u=employees.find(e=>e.username===un);
      if(u&&await verifyPassword(pw,u.password)){
        if(isFaceMask&&!['admin','administrator'].includes(String(u.role||'').toLowerCase()))throw new Error('FACE MASK chỉ cho phép tài khoản Admin đăng nhập.');
        onLogin(u);
      }
      else se('Tên đăng nhập hoặc mật khẩu không đúng!');
    }catch(e){se(e.message||'Không thể kiểm tra mật khẩu.');}
    finally{setBusy(false);}
  };
  return h('div',{className:'login-bg'},
    h('div',{className:'login-card'},
      h('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',marginBottom:'1.5rem'}},
        isFaceMask?h('div',{className:'face-mask-login-icon'},h('i',{className:'ti ti-mask'})):h('img',{src:LOGO_SRC,style:{width:78,height:78,marginBottom:10}}),
        h('h1',{style:{fontSize:22,fontWeight:700,color:'var(--pri3)'}},isFaceMask?'FACE MASK':'Thực Phẩm Sông Công')
      ),
      err&&h('div',{style:{background:'#FCEBEB',color:'#A32D2D',padding:'8px 12px',borderRadius:6,fontSize:13,marginBottom:'1rem',textAlign:'center'}},err),
      h(F,{label:'Tên đăng nhập'},h('input',{value:un,onChange:e=>{su(e.target.value);se('');},onKeyDown:e=>e.key==='Enter'&&submit()})),
      h(F,{label:'Mật khẩu'},
        h('div',{className:'pw-wrap'},
          h('input',{type:show?'text':'password',value:pw,onChange:e=>{sp(e.target.value);se('');},onKeyDown:e=>e.key==='Enter'&&submit()}),
          h('button',{className:'pw-eye',onClick:()=>ss(s=>!s)},h('i',{className:'ti ti-eye'+(show?'-off':''),style:{fontSize:15}}))
        )
      ),
      h('button',{className:'bp',onClick:submit,disabled:busy,style:{width:'100%',padding:'10px',fontSize:15,justifyContent:'center',marginTop:4}},h('i',{className:'ti '+(busy?'ti-loader-2 spin':'ti-login'),style:{fontSize:16}}),busy?'Đang kiểm tra...':'Đăng nhập'),
      h('button',{type:'button',className:'bb',onClick:()=>setResetOpen(true),style:{width:'100%',justifyContent:'center',marginTop:'1rem',border:0,background:'transparent',color:'var(--pri)'}},
        h('i',{className:'ti ti-key'}),'Admin quên mật khẩu?'
      )
    ),
    resetOpen&&h(AdminPasswordReset,{initialUsername:un,onClose:()=>setResetOpen(false)})
  );
}

function AdminPasswordReset({initialUsername,onClose}){
  const[step,setStep]=useState(1);
  const[username,setUsername]=useState(initialUsername||'');
  const[code,setCode]=useState('');
  const[password,setPassword]=useState('');
  const[confirm,setConfirm]=useState('');
  const[busy,setBusy]=useState(false);
  const[message,setMessage]=useState('');
  const[error,setError]=useState('');
  const sendCode=async()=>{
    if(!username.trim()){setError('Hãy nhập tên đăng nhập Admin.');return;}
    setBusy(true);setError('');
    try{
      await requestAdminPasswordReset(username);
      setStep(2);
      setMessage('Nếu tài khoản Admin và email khôi phục hợp lệ, mã 6 số đã được gửi. Mã có hiệu lực 10 phút.');
    }catch(e){setError(e.message||'Không thể gửi mã khôi phục.');}
    finally{setBusy(false);}
  };
  const resetPassword=async()=>{
    if(!/^\d{6}$/.test(code)){setError('Mã xác nhận phải gồm 6 chữ số.');return;}
    if(password.length<PASSWORD_MIN_LENGTH){setError('Mật khẩu mới phải có ít nhất '+PASSWORD_MIN_LENGTH+' ký tự.');return;}
    if(password!==confirm){setError('Mật khẩu xác nhận chưa khớp.');return;}
    setBusy(true);setError('');
    try{
      await confirmAdminPasswordReset(username,code,password);
      setMessage('Đã đổi mật khẩu Admin. App sẽ tải lại để đăng nhập bằng mật khẩu mới.');
      setTimeout(()=>location.reload(),1200);
    }catch(e){setError(e.message||'Không thể đặt lại mật khẩu.');}
    finally{setBusy(false);}
  };
  return h(Modal,{title:'Khôi phục mật khẩu Admin',onClose,big:false},
    h('div',{style:{maxWidth:520}},
      h('div',{style:{padding:'10px 12px',borderRadius:8,background:'#eef7f2',marginBottom:14,fontSize:13}},
        h('b',null,'Bảo mật: '),'Mã chỉ gửi tới email khôi phục đã lưu trong hồ sơ Admin, hết hạn sau 10 phút và chỉ dùng được một lần.'
      ),
      error&&h('div',{style:{background:'#fce8e8',color:'#a32d2d',padding:'9px 12px',borderRadius:7,marginBottom:12}},error),
      message&&h('div',{style:{background:'#e8f3ff',color:'#175a91',padding:'9px 12px',borderRadius:7,marginBottom:12}},message),
      h(F,{label:'Tên đăng nhập Admin *'},
        h('input',{value:username,disabled:step===2,onChange:e=>{setUsername(e.target.value);setError('');},autoComplete:'username'})
      ),
      step===2&&h(Fragment,null,
        h(F,{label:'Mã xác nhận 6 số *'},h('input',{value:code,inputMode:'numeric',maxLength:6,onChange:e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6)),autoComplete:'one-time-code'})),
        h(F,{label:'Mật khẩu mới *'},h('input',{type:'password',value:password,onChange:e=>setPassword(e.target.value),autoComplete:'new-password'})),
        h(F,{label:'Nhập lại mật khẩu mới *'},h('input',{type:'password',value:confirm,onChange:e=>setConfirm(e.target.value),autoComplete:'new-password'}))
      ),
      h('div',{className:'modal-actions'},
        h('button',{className:'bb',onClick:onClose,disabled:busy},'Hủy'),
        step===2&&h('button',{className:'bb',onClick:()=>{setStep(1);setCode('');setError('');setMessage('');},disabled:busy},'Gửi lại mã'),
        h('button',{className:'bp',onClick:step===1?sendCode:resetPassword,disabled:busy},
          h('i',{className:'ti '+(busy?'ti-loader-2 spin':step===1?'ti-mail-forward':'ti-lock-check')}),
          busy?'Đang xử lý...':step===1?'Gửi mã xác nhận':'Đặt mật khẩu mới'
        )
      )
    )
  );
}

const FACE_AI_MODEL_URL='https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@master/weights';
let faceAiModelsPromise=null;
function ensureFaceAiModels(){
  if(faceAiModelsPromise)return faceAiModelsPromise;
  faceAiModelsPromise=(async()=>{
    if(!window.faceapi)await window.scfLoadExternalScript('faceapi');
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(FACE_AI_MODEL_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(FACE_AI_MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(FACE_AI_MODEL_URL)
    ]);
    return true;
  })().catch(error=>{faceAiModelsPromise=null;throw error;});
  return faceAiModelsPromise;
}
function videoFrameCanvas(video,maxEdge=720){
  const width=video.videoWidth||0,height=video.videoHeight||0;
  const scale=Math.min(1,maxEdge/Math.max(width,height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(width*scale));
  canvas.height=Math.max(1,Math.round(height*scale));
  canvas.getContext('2d').drawImage(video,0,0,width,height,0,0,canvas.width,canvas.height);
  return canvas;
}
function legacyFaceHash(canvas){
  const small=document.createElement('canvas');small.width=8;small.height=8;
  const ctx=small.getContext('2d');ctx.drawImage(canvas,0,0,8,8);
  const data=ctx.getImageData(0,0,8,8).data;const hash=[];
  for(let i=0;i<data.length;i+=4)hash.push(Math.round((data[i]+data[i+1]+data[i+2])/3));
  return hash;
}
async function analyzeFaceWithAi(canvas){
  await ensureFaceAiModels();
  const options=new faceapi.TinyFaceDetectorOptions({inputSize:416,scoreThreshold:0.55});
  const faces=await faceapi.detectAllFaces(canvas,options).withFaceLandmarks(true).withFaceDescriptors();
  if(!faces.length)throw new Error('AI chưa tìm thấy khuôn mặt. Hãy nhìn thẳng, đủ sáng và đưa mặt gần camera hơn.');
  if(faces.length>1)throw new Error('Ảnh có nhiều hơn một khuôn mặt. Chỉ để một người trước camera.');
  const face=faces[0];
  const box=face.detection.box;
  if(box.width<canvas.width*.18||box.height<canvas.height*.18)throw new Error('Khuôn mặt đang quá nhỏ. Hãy đưa mặt gần camera hơn.');
  return {descriptor:[...face.descriptor],confidence:Math.round((face.detection.score||0)*100),box:{x:box.x,y:box.y,width:box.width,height:box.height}};
}

function CameraBox({onCapture,preview,setPreview,template,setTemplate,autoOpenSignal,simple=false}) {
  const videoRef=useRef(null);const streamRef=useRef(null);
  const[started,setStarted]=useState(false);const[msg,setMsg]=useState('');const[processing,setProcessing]=useState(false);
  const bindStream=()=>{
    const v=videoRef.current;const st=streamRef.current;
    if(!v||!st)return;
    if(v.srcObject!==st)v.srcObject=st;
    const playPromise=v.play&&v.play();
    if(playPromise&&playPromise.catch)playPromise.catch(()=>{});
  };
  const stop=()=>{
    const v=videoRef.current;
    if(v){
      try{v.pause&&v.pause();}catch{}
      try{v.srcObject=null;}catch{}
    }
    if(streamRef.current){streamRef.current.getTracks().forEach(t=>t.stop());streamRef.current=null;}
    setStarted(false);
  };
  useEffect(()=>()=>stop(),[]);
  useEffect(()=>{if(started)bindStream();},[started]);
  const start=async()=>{
    if(!navigator.mediaDevices?.getUserMedia){
      const warn=!window.isSecureContext
        ? 'Camera có thể bị chặn khi app đang mở ở dạng file cục bộ. Hãy thử mở qua HTTPS/GitHub Pages hoặc kiểm tra lại quyền camera.'
        : 'Thiết bị hoặc trình duyệt này chưa hỗ trợ mở camera.';
      setMsg(warn);
      window.showToast(warn,'warn');
      return;
    }
    try{
      stop();
      const st=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user'},audio:false});
      streamRef.current=st;
      setPreview('');
      setStarted(true);
      setMsg('Camera đã sẵn sàng. Nhìn thẳng và giữ khuôn mặt đủ sáng.');
      void ensureFaceAiModels().then(()=>setMsg('AI khuôn mặt đã sẵn sàng. Nhìn thẳng vào camera.')).catch(e=>setMsg(e.message||'Chưa tải được AI khuôn mặt.'));
    }catch(e){
      const warn='Không mở được camera. Hãy cấp quyền camera cho trình duyệt rồi thử lại.';
      setMsg(warn);
      window.showToast(warn,'error');
    }
  };
  useEffect(()=>{if(autoOpenSignal)void start();},[autoOpenSignal]);
  const snap=async()=>{
    const v=videoRef.current;
    if(processing)return;
    if(!v||!v.videoWidth||!v.videoHeight){setMsg('Camera chưa sẵn sàng.');return;}
    setProcessing(true);setMsg('AI đang dò và căn chỉnh khuôn mặt...');
    try{
      const canvas=videoFrameCanvas(v);
      const ai=await analyzeFaceWithAi(canvas);
      const img=canvas.toDataURL('image/jpeg',.82);
      const fp=legacyFaceHash(canvas);
      setPreview(img);
      onCapture&&onCapture({image:img,faceHash:fp,faceDescriptor:ai.descriptor,faceDetectionScore:ai.confidence,faceBox:ai.box,faceModel:'face-api-128-v1'});
      setMsg('Đã chụp đúng 1 khuôn mặt • AI tin cậy '+ai.confidence+'%.');
      stop();
    }catch(e){
      const warn=e.message||'AI chưa xử lý được khuôn mặt. Hãy thử chụp lại.';
      setMsg(warn);window.showToast(warn,'warn',5000);
    }finally{setProcessing(false);}
  };
  const resetTemplate=()=>{setTemplate&&setTemplate(null);setPreview('');setMsg('Đã xóa mẫu mặt cũ. Hãy chụp lại khuôn mặt mới.');window.showToast('Đã xóa mẫu mặt cũ.','success');};
  return h('div',null,
    h('div',{className:'att-camera'},
      started?h('video',{ref:videoRef,autoPlay:true,playsInline:true,muted:true})
      :preview?h('img',{src:preview})
      :h('div',{style:{textAlign:'center',padding:20}},h('i',{className:'ti ti-camera',style:{fontSize:42,display:'block',marginBottom:8}}),'Camera chấm công')
    ),
    msg&&h('div',{style:{fontSize:12,color:'#A32D2D',marginTop:8}},msg),
    h('div',{style:{display:'flex',gap:6,flexWrap:'wrap',marginTop:10}},
      h('button',{className:'bp',onClick:started?snap:start,disabled:processing},h('i',{className:'ti '+(processing?'ti-loader-2 spin':started?'ti-camera-check':'ti-camera'),style:{fontSize:15}}),processing?'Đang kiểm tra...':started?(simple?'Xác nhận ảnh':'Chụp khuôn mặt'):(simple?'Chụp ảnh':'Mở camera')),
      started&&h('button',{onClick:stop,disabled:processing},h('i',{className:'ti ti-player-stop',style:{fontSize:14}}),'Tắt'),
      template&&!simple&&h('button',{onClick:resetTemplate,disabled:processing},h('i',{className:'ti ti-refresh',style:{fontSize:14}}),'Đăng ký lại')
    )
  );
}

function AttendanceTab({section='punch',attendance,setAttendance,employees,setEmployees,currentUser,company,reportTitle='Báo cáo chấm công'}) {
  const settingsKey='scf_att_settings';
  const defaultWorkShifts=[
    {id:'night',name:'Ca đêm',start:'22:00',end:'03:00',color:'#EDE7F6',textColor:'#4527A0'},
    {id:'morning',name:'Ca sáng',start:'03:00',end:'12:00',color:'#FFF8E1',textColor:'#E65100'},
    {id:'afternoon',name:'Ca chiều',start:'12:00',end:'22:00',color:'#FEF3C7',textColor:'#92400E'}
  ];
  const[settings,setSettings]=useLS(settingsKey,{lat:W_LAT,lon:W_LON,radius:300,start:'08:00',end:'17:00',workShifts:defaultWorkShifts});
  const workShifts=Array.isArray(settings.workShifts)&&settings.workShifts.length===3?settings.workShifts:defaultWorkShifts;
  const[zaloWebhook,setZaloWebhook]=useLS('scf_zalo_webhook','');
  const[cap,setCap]=useState(null);const[preview,setPreview]=useState('');
  const[pos,setPos]=useState(null);const[gpsMsg,setGpsMsg]=useState('');
  const[gpsBusy,setGpsBusy]=useState(false);
  const[punchBusy,setPunchBusy]=useState(false);
  const[punchPending,setPunchPending]=useState(false);
  const[lastPunchShare,setLastPunchShare]=useState(null);
  const[cameraAutoOpenSignal,setCameraAutoOpenSignal]=useState(0);
  const[isCompactMobile,setIsCompactMobile]=useState(()=>window.innerWidth<=768);
  const[quickPunchMode,setQuickPunchMode]=useState(()=>window.innerWidth<=768);
  const[mobileInfoOpen,setMobileInfoOpen]=useState(false);
  const isAdmin=currentUser.role==='admin';
  const isManager=currentUser.role==='manager';
  const canManage=isAdmin||isManager;
  const normalizeDept=s=>String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d');
  const managerEmployees=employees.filter(e=>{
    const dept=normalizeDept(e.dept);
    return e.role!=='admin'&&e.role!=='driver'&&!dept.includes('ban giam doc')&&!dept.includes('giam doc')&&dept!=='lai xe';
  });
  const managerEmployeeIds=new Set(managerEmployees.map(e=>e.id));
  const selfEmpId=employees.some(e=>e.id===currentUser.id)?currentUser.id:'';
  const[empId,setEmpId]=useState(selfEmpId);
  const[q,setQ]=useState('');const[day,setDay]=useState(isoDate());
  const[periodMode,setPeriodMode]=useState('month');
  const[month,setMonth]=useState(isoDate().slice(0,7));
  const selectedEmpId=isAdmin?(empId||selfEmpId):isManager?empId:selfEmpId;
  useEffect(()=>{
    if(isAdmin){
      if(!empId&&selfEmpId)setEmpId(selfEmpId);
      return;
    }
    if(isManager){
      if(empId&&!managerEmployeeIds.has(empId)){setEmpId('');setPreview('');setCap(null);}
      return;
    }
    if(empId!==selfEmpId){
      setEmpId(selfEmpId);
      setPreview('');
      setCap(null);
      setMobileInfoOpen(false);
    }
  },[isAdmin,isManager,empId,selfEmpId,employees]);
  useEffect(()=>{
    const onResize=()=>{
      const mobile=window.innerWidth<=768;
      setIsCompactMobile(mobile);
      if(!mobile){
        setQuickPunchMode(false);
        setMobileInfoOpen(false);
      }
    };
    window.addEventListener('resize',onResize);
    return ()=>window.removeEventListener('resize',onResize);
  },[]);
  const emp=employees.find(e=>e.id===selectedEmpId)||currentUser;
  const scopedAttendance=canManage?attendance:attendance.filter(a=>a.empId===currentUser.id);
  const periodRecords=scopedAttendance.filter(a=>periodMode==='month'?String(a.date||'').startsWith(month):a.date===day);
  const myToday=scopedAttendance.filter(a=>a.date===isoDate()&&a.empId===selectedEmpId).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  const selectedRecords=scopedAttendance.filter(a=>a.empId===selectedEmpId&&a.status==='valid').sort((a,b)=>(String(a.date||'')+'T'+String(a.time||'')).localeCompare(String(b.date||'')+'T'+String(b.time||'')));
  const lastCandidate=selectedRecords[selectedRecords.length-1];
  const lastCandidateMs=lastCandidate?Date.parse(String(lastCandidate.date||'')+'T'+String(lastCandidate.time||'00:00')):0;
  const lastAgeHours=lastCandidateMs?(Date.now()-lastCandidateMs)/3600000:999;
  const last=lastAgeHours>=0&&lastAgeHours<=18?lastCandidate:null;
  const nextType=!last||last.type==='out'?'in':'out';
  const needEmp=()=>canManage&&!empId;
  const gs=gpsStatus(pos,settings);
  const tpl=emp.faceTemplate;
  const faceMatch=faceMatchResult(cap,tpl);
  const score=faceMatch.score;
  const faceOk=!!tpl&&!!cap&&faceMatch.ok;
  const faceState=!tpl?'Chưa có mẫu mặt':!cap?'Chưa chụp mặt':faceOk?'Mặt hợp lệ':'Mặt chưa khớp';
  const faceStateStyle=faceOk
    ? {background:'#EAF3DE',color:'#3B6D11'}
    : (!tpl||!cap)
      ? {background:'#F1EFE8',color:'#6B6B67'}
      : {background:'#FCEBEB',color:'#A32D2D'};
  const gpsState=!pos?'Chưa có GPS':gs.ok?'GPS hợp lệ':'GPS ngoài vùng';
  const gpsStateStyle=pos&&gs.ok
    ? {background:'#EAF3DE',color:'#3B6D11'}
    : !pos
      ? {background:'#F1EFE8',color:'#6B6B67'}
      : {background:'#FCEBEB',color:'#A32D2D'};
  const readyPunch=!needEmp()&&!!tpl&&!!cap&&faceOk&&!!pos&&gs.ok&&!punchBusy;
  const readyReasons=[
    needEmp()?'chưa chọn nhân viên':null,
    !tpl?'chưa có mẫu mặt':null,
    tpl&&!cap?'chưa chụp mặt':null,
    tpl&&cap&&!faceOk?'mặt chưa khớp':null,
    !pos?'chưa có GPS':null,
    pos&&!gs.ok?'GPS ngoài vùng':null
  ].filter(Boolean);
  const readyDetail=readyPunch?'Sẵn sàng lưu giờ vào ca.':'Thiếu: '+readyReasons.join(' • ');
  const readyLabel=readyPunch?'Đủ điều kiện vào ca':'Chưa đủ điều kiện';
  const readyStyle=readyPunch
    ? {background:'#0F6E56',color:'#fff',fontWeight:700,boxShadow:'0 0 0 1px rgba(15,110,86,.15) inset'}
    : {background:'#FAEEDA',color:'#854F0B',fontWeight:700};
  const showQuickPunch=isCompactMobile&&quickPunchMode;
  const timeToMin=t=>{const p=String(t||'').split(':').map(x=>parseInt(x,10)||0);return p[0]*60+p[1];};
  const shiftAtTime=t=>{
    const m=timeToMin(t);
    return workShifts.find(sh=>{
      const start=timeToMin(sh.start),end=timeToMin(sh.end);
      return start<end?(m>=start&&m<end):(m>=start||m<end);
    })||workShifts[0];
  };
  const activeWorkShift=nextType==='out'&&last
    ?(workShifts.find(sh=>sh.id===last.workShiftId)||shiftAtTime(last.time))
    :shiftAtTime(timeNow());
  const updateWorkShift=(id,key,value)=>setSettings(prev=>({...prev,workShifts:workShifts.map(sh=>sh.id===id?{...sh,[key]:value}:sh)}));
  const timeStatus=(type,t,shiftRef)=>{
    const sh=typeof shiftRef==='object'?shiftRef:workShifts.find(x=>x.id===shiftRef);
    if(!sh){
      if(type==='in'&&settings.start&&timeToMin(t)>timeToMin(settings.start))return 'Đi muộn';
      if(type==='out'&&settings.end&&timeToMin(t)<timeToMin(settings.end))return 'Về sớm';
      return 'Đúng giờ';
    }
    const start=timeToMin(sh.start),end=timeToMin(sh.end),actual=timeToMin(t);
    const duration=(end-start+1440)%1440||1440;
    const elapsed=(actual-start+1440)%1440;
    if(type==='in'&&elapsed>0)return 'Đi muộn';
    if(type==='out'&&elapsed<duration)return 'Về sớm';
    return 'Đúng giờ';
  };
  const buildNote=(tStatus,faceMatched,gpsInfo)=>{
    const notes=[];
    if(tStatus&&tStatus!=='Đúng giờ')notes.push(tStatus);
    if(!faceMatched)notes.push('Khuôn mặt chưa khớp');
    if(!gpsInfo||gpsInfo.distance===null)notes.push('Chưa có GPS');
    else if(!gpsInfo.ok)notes.push('Ngoài vùng GPS');
    return notes.join(' • ');
  };
  const recentSame=myToday.find(r=>r.type===nextType&&Math.abs(timeToMin(timeNow())-timeToMin(r.time))<2);
  const requestGps=async(target='attendance',opts={})=>{
    if(!navigator.geolocation){
      const warn=!window.isSecureContext
        ? 'GPS có thể bị chặn vì app đang mở ở dạng file cục bộ. Hãy thử mở qua HTTPS/GitHub Pages hoặc cấp lại quyền vị trí.'
        : 'Thiết bị hoặc trình duyệt này chưa hỗ trợ GPS.';
      setGpsMsg(warn);
      if(!opts.silentError)window.showToast(warn,'warn');
      return null;
    }
    return await new Promise(resolve=>{
      setGpsBusy(true);
      setGpsMsg(target==='settings'?'Đang lấy vị trí để cập nhật vùng chấm công...':'Đang lấy vị trí...');
      navigator.geolocation.getCurrentPosition(
        p=>{
          const nextPos={lat:p.coords.latitude,lon:p.coords.longitude,acc:Math.round(p.coords.accuracy||0)};
          setPos(nextPos);
          setGpsBusy(false);
          setGpsMsg('Đã lấy GPS lúc '+timeNow());
          if(target==='settings'){
            setSettings(prev=>({...prev,lat:+nextPos.lat.toFixed(6),lon:+nextPos.lon.toFixed(6)}));
            window.showToast('Đã cập nhật tọa độ vùng chấm công từ GPS hiện tại.','success');
          }else if(!opts.silentSuccess){
            window.showToast('Đã lấy GPS thành công.','success');
          }
          resolve(nextPos);
        },
        e=>{
          setGpsBusy(false);
          const warn=e&&e.code===1
            ? 'Bạn đã từ chối quyền vị trí. Hãy bật lại quyền GPS cho trình duyệt.'
            : !window.isSecureContext
              ? 'Không lấy được GPS. Khi mở app ở dạng file cục bộ, trình duyệt có thể chặn vị trí.'
              : 'Không lấy được GPS. Hãy cấp quyền vị trí cho trình duyệt rồi thử lại.';
          setGpsMsg(warn);
          if(!opts.silentError)window.showToast(warn,'error');
          resolve(null);
        },
        {enableHighAccuracy:true,timeout:12000,maximumAge:0}
      );
    });
  };
  const getGps=(target='attendance')=>{void requestGps(target);};
  const ensureSelfAttendance=()=>{
    if(canManage)return true;
    if(selectedEmpId===currentUser.id)return true;
    setEmpId(currentUser.id);
    setPreview('');
    setCap(null);
    return false;
  };
  const buildFaceTemplate=()=>cap?{hash:[...(cap.faceHash||[])],descriptor:[...(cap.faceDescriptor||[])],model:cap.faceModel||'',detectionScore:cap.faceDetectionScore||0,image:cap.image||'',updatedAt:fmtDT(),updatedBy:currentUser.name}:null;
  const persistFaceTemplate=template=>{
    if(!template)return;
    setEmployees(list=>list.map(e=>e.id===emp.id?{...e,faceTemplate:template}:e));
  };
  const clearFaceTemplate=()=>{
    if(!ensureSelfAttendance())return;
    if(needEmp()){window.showToast('Hãy chọn nhân viên trước.','warn');return;}
    setEmployees(list=>list.map(e=>e.id===emp.id?{...e,faceTemplate:null}:e));
    setPreview('');
    setCap(null);
  };
  const saveTemplate=()=>{
    if(!ensureSelfAttendance())return;
    if(needEmp()){window.showToast('Hãy chọn nhân viên trước.','warn');return;}
    if(!cap){window.showToast('Hãy chụp khuôn mặt trước.','warn');return;}
    const template=buildFaceTemplate();
    persistFaceTemplate(template);
    window.showToast('Đã lưu khuôn mặt mẫu cho '+emp.name,'success');
  };
  const showPunchInvalidMessage=(faceValid,gpsValid,distance)=>{
    if(!faceValid&&!gpsValid){
      window.showToast('Khuôn mặt và GPS chưa hợp lệ, bạn chưa vào ca được.','error',5000);
      return;
    }
    if(!faceValid){
      window.showToast('Khuôn mặt chưa hợp lệ, bạn chưa vào ca được.','error',5000);
      return;
    }
    if(!gpsValid){
      window.showToast('Bạn chưa ở vị trí chấm công theo quy định, nên chưa chấm công được.','error',6000);
    }
  };
  const punch=async()=>{
    if(punchBusy)return;
    if(!ensureSelfAttendance())return;
    if(needEmp()){window.showToast('Hãy chọn nhân viên cần chấm công.','info');return;}
    if(!emp||!emp.id){window.showToast('Chưa xác định được nhân viên chấm công.','error');return;}
    if(!cap){window.showToast('Hãy chụp khuôn mặt khi chấm công.','warn');return;}
    setPunchBusy(true);
    try{
      if(recentSame){
        if(!isAdmin){window.showToast('Nhân viên vừa chấm công gần đây, hệ thống không lưu trùng.','warn',5000);return;}
        const ok=await window.scfConfirm('Nhân viên vừa có bản ghi '+(nextType==='in'?'vào ca':'ra ca')+' gần đây. Vẫn lưu tiếp?','Bản ghi gần trùng');
        if(!ok)return;
      }
      let workingTemplate=tpl;
      if(!workingTemplate){
        window.showToast('Tài khoản chưa có khuôn mặt mẫu. Hãy liên hệ quản lý để đăng ký.','error',6000);
        return;
      }
      const workingMatch=faceMatchResult(cap,workingTemplate);
      const workingScore=workingMatch.score;
      const workingFaceOk=!!workingTemplate&&!!cap&&workingMatch.ok;
      if(!workingFaceOk){
        window.showToast('Bạn không phải là '+String(emp.name||'nhân viên này').toUpperCase()+'.','error',6500);
        setPreview('');setCap(null);
        return;
      }
      let workingPos=isAdmin?pos:null;
      if(!workingPos){
        workingPos=await requestGps('attendance',{silentSuccess:true});
        if(!workingPos){
          window.showToast('Chưa lấy được GPS nên chưa thể chấm công.','warn');
          return;
        }
      }
      const now=timeNow();
      const g=gpsStatus(workingPos,settings);
      if(!g.ok){
        showPunchInvalidMessage(true,g.ok,g.distance);
        return;
      }
      const tStatus=timeStatus(nextType,now,activeWorkShift);
      const rec={
        id:'CC'+uid(),
        empId:emp.id,
        empName:emp.name,
        dept:emp.dept||'',
        date:isoDate(),
        time:now,
        type:nextType,
        workShiftId:activeWorkShift?.id||'',
        workShiftName:activeWorkShift?.name||'',
        workShiftStart:activeWorkShift?.start||'',
        workShiftEnd:activeWorkShift?.end||'',
        timeStatus:tStatus,
        faceScore:workingScore,
        faceOk:workingFaceOk,
        lat:workingPos.lat,
        lon:workingPos.lon,
        accuracy:workingPos.acc,
        distance:g.distance,
        gpsOk:g.ok,
        photo:cap.image,
        status:'valid',
        note:buildNote(tStatus,workingFaceOk,g),
        createdBy:currentUser.name,
        createdAt:fmtDT()
      };
      setAttendance(p=>[rec,...p]);
      setLastPunchShare(rec);
      setPreview('');
      setCap(null);
      window.showToast((nextType==='in'?'Vào ca':'Ra ca')+' '+(activeWorkShift?.name||'')+' thành công lúc '+shortTime(now)+(tStatus==='Đúng giờ'?'':' - '+tStatus),'success',5500);
    }finally{
      setPunchBusy(false);
      setPunchPending(false);
    }
  };
  const handlePunchClick=()=>{
    if(punchBusy)return;
    if(!ensureSelfAttendance())return;
    if(needEmp()){window.showToast('Hãy chọn nhân viên cần chấm công.','info');return;}
    if(!cap){
      setPunchPending(true);
      setCameraAutoOpenSignal(s=>s+1);
      if(!pos&&!gpsBusy)void requestGps('attendance',{silentSuccess:true,silentError:true});
      window.showToast('Camera đang mở. Chụp khuôn mặt để tiếp tục vào ca.','info',3500);
      return;
    }
    void punch();
  };
  useEffect(()=>{
    if(!punchPending||!cap||punchBusy)return;
    void punch();
  },[punchPending,cap,punchBusy]);
  const handleFaceCapture=capture=>{
    setCap(capture);
    if(section==='punch'||!isAdmin)setPunchPending(true);
  };
  const filtered=periodRecords.filter(r=>!q||[r.empId,r.empName,r.dept,r.status,r.workShiftName,r.type==='in'?'vào ca':'ra ca',r.timeStatus||timeStatus(r.type,r.time,r.workShiftId),r.note,r.createdBy].some(x=>String(x||'').toLowerCase().includes(q.toLowerCase())));
  const stat={in:periodRecords.filter(r=>r.type==='in').length,out:periodRecords.filter(r=>r.type==='out').length,valid:periodRecords.filter(r=>r.status==='valid').length,review:periodRecords.filter(r=>r.status!=='valid').length,late:periodRecords.filter(r=>(r.timeStatus||timeStatus(r.type,r.time,r.workShiftId))==='Đi muộn').length,early:periodRecords.filter(r=>(r.timeStatus||timeStatus(r.type,r.time,r.workShiftId))==='Về sớm').length};
  const exportRows=filtered.map(r=>({date:r.date,time:r.time,empId:r.empId,empName:r.empName,dept:r.dept,workShift:r.workShiftName||'',type:r.type==='in'?'Vào ca':'Ra ca',timeStatus:r.timeStatus||timeStatus(r.type,r.time,r.workShiftId),faceScore:r.faceScore,gps:r.gpsOk?'Hợp lệ':'Ngoài vùng',distance:r.distance,status:r.status,note:r.note||''}));
  const monthlyRecords=scopedAttendance.filter(r=>String(r.date||'').startsWith(month)&&r.status==='valid');
  const calcWorkHours=rows=>{
    const sorted=[...rows].sort((a,b)=>(String(a.date||'')+'T'+String(a.time||'')).localeCompare(String(b.date||'')+'T'+String(b.time||'')));
    let open=null,totalMinutes=0,overtimeMinutes=0;
    sorted.forEach(record=>{
      if(record.type==='in'){open=record;return;}
      if(record.type!=='out'||!open)return;
      const start=Date.parse(String(open.date||'')+'T'+String(open.time||'00:00'));
      let end=Date.parse(String(record.date||'')+'T'+String(record.time||'00:00'));
      if(!Number.isFinite(start)||!Number.isFinite(end)){open=null;return;}
      if(end<=start)end+=86400000;
      const minutes=Math.round((end-start)/60000);
      if(minutes>0&&minutes<=24*60){
        totalMinutes+=minutes;
        const workShift=workShifts.find(shift=>shift.id===open.workShiftId)||workShifts.find(shift=>shift.id===record.workShiftId);
        if(workShift){
          let standard=timeToMin(workShift.end)-timeToMin(workShift.start);
          if(standard<=0)standard+=24*60;
          overtimeMinutes+=Math.max(0,minutes-standard);
        }
      }
      open=null;
    });
    return {hours:Math.round(totalMinutes/60*100)/100,overtime:Math.round(overtimeMinutes/60*100)/100};
  };
  const monthlyEmployeeIds=canManage
    ?Array.from(new Set([...employees.map(e=>e.id),...monthlyRecords.map(r=>r.empId)])).filter(Boolean)
    :[currentUser.id];
  const monthlyRows=monthlyEmployeeIds.map(id=>{
    const employee=employees.find(e=>e.id===id)||{};
    const rows=monthlyRecords.filter(r=>r.empId===id);
    const workDays=new Set(rows.map(r=>r.date).filter(Boolean)).size;
    const workHours=calcWorkHours(rows);
    const hourlyRate=Number(settings.hourlyRates?.[id])||0;
    return {
      id,
      name:employee.name||rows[0]?.empName||id,
      dept:employee.dept||rows[0]?.dept||'',
      workDays,
      inCount:rows.filter(r=>r.type==='in').length,
      outCount:rows.filter(r=>r.type==='out').length,
      hours:workHours.hours,
      overtime:workHours.overtime,
      hourlyRate,
      wage:Math.round(workHours.hours*hourlyRate),
      late:rows.filter(r=>(r.timeStatus||timeStatus(r.type,r.time,r.workShiftId))==='Đi muộn').length,
      early:rows.filter(r=>(r.timeStatus||timeStatus(r.type,r.time,r.workShiftId))==='Về sớm').length
    };
  }).filter(r=>r.workDays||!canManage).sort((a,b)=>a.name.localeCompare(b.name,'vi'));
  const monthlyExportRows=monthlyRows.map(r=>({empId:r.id,empName:r.name,dept:r.dept,month,workDays:r.workDays,inCount:r.inCount,outCount:r.outCount,hours:r.hours,overtime:r.overtime,hourlyRate:r.hourlyRate,wage:r.wage,late:r.late,early:r.early}));
  const zaloText=()=>{
    const periodLabel=periodMode==='month'?'thang '+month:vnDateFromISO(day||isoDate());
    const lines=['SCF - Bao cao cham cong '+periodLabel,'Vao ca: '+stat.in+' | Ra ca: '+stat.out+' | Hop le: '+stat.valid+' | Can duyet: '+stat.review+' | Di muon: '+stat.late+' | Ve som: '+stat.early];
    filtered.slice(0,25).forEach(r=>lines.push((r.type==='in'?'VAO':'RA')+' '+shortTime(r.time)+' - '+r.empName+' ('+r.empId+') - mat '+r.faceScore+'% - GPS '+(r.distance??'--')+'m - '+(r.status==='valid'?'hop le':'can duyet')));
    if(filtered.length>25)lines.push('... va '+(filtered.length-25)+' ban ghi khac.');
    return lines.join('\n');
  };
  const copyZalo=async()=>{const txt=zaloText();try{await navigator.clipboard.writeText(txt);window.showToast('Đã sao chép. Mở Zalo và dán vào nhóm.','success');}catch(e){prompt('Sao chép nội dung này để gửi Zalo:',txt);}};
  const shareZalo=async()=>{const txt=zaloText();if(navigator.share){try{await navigator.share({title:'Báo cáo chấm công SCF',text:txt});}catch(e){}}else copyZalo();};
  const punchShareText=record=>{
    if(!record)return '';
    return 'Tên nhân viên: '+record.empName+'\nNgày '+vnDateFromISO(record.date)+' '+(record.type==='in'?'đi làm lúc ':'ra về lúc ')+shortTime(record.time);
  };
  const sharePunchZalo=async record=>{
    const txt=punchShareText(record);
    if(!txt)return;
    if(navigator.share){
      try{
        await navigator.share({title:'Chấm công - '+record.empName,text:txt});
        return;
      }catch(e){
        if(e&&e.name==='AbortError')return;
      }
    }
    try{
      await navigator.clipboard.writeText(txt);
      window.showToast('Đã sao chép nội dung. Mở Zalo, chọn nhóm và dán để gửi.','success',5500);
    }catch(e){
      prompt('Sao chép nội dung này để gửi Zalo:',txt);
    }
  };
  const punchShareCard=()=>lastPunchShare&&h('div',{className:'card',style:{margin:'12px 0',padding:14,border:'1px solid #B7DFC8',background:'#F2FBF6'}},
    h('div',{style:{fontWeight:700,color:'#17633B',marginBottom:6}},h('i',{className:'ti ti-circle-check'}),' Chấm công thành công'),
    h('div',{style:{whiteSpace:'pre-line',lineHeight:1.55,marginBottom:10}},punchShareText(lastPunchShare)),
    h('button',{className:'bp',onClick:()=>sharePunchZalo(lastPunchShare)},h('i',{className:'ti ti-brand-zalo'}),' Chia sẻ Zalo')
  );
  const sendWebhook=async()=>{if(!zaloWebhook){window.showToast('Chưa nhập webhook Zalo/server trung gian.','warn');return;}try{await fetch(zaloWebhook,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:zaloText(),date:day,records:filtered})});window.showToast('Đã gửi dữ liệu sang webhook.','success');}catch(e){window.showToast('Không gửi được webhook. Kiểm tra đường dẫn hoặc CORS.','error');}};
  const applyGpsToSettings=()=>{
    if(pos){
      setSettings(prev=>({...prev,lat:+pos.lat.toFixed(6),lon:+pos.lon.toFixed(6)}));
      window.showToast('Đã cập nhật tọa độ vùng chấm công từ GPS hiện tại.','success');
      return;
    }
    getGps('settings');
  };
  const resetGpsSettings=()=>{
    setSettings(prev=>({...prev,lat:W_LAT,lon:W_LON,radius:300}));
    window.showToast('Đã đưa vùng chấm công về mặc định Sông Công.','success');
  };
  const approveAttendanceRecord=id=>{
    setAttendance(p=>p.map(x=>x.id===id?{...x,status:'valid',approvedBy:currentUser.name,approvedAt:fmtDT()}:x));
    window.showToast('Đã duyệt bản ghi chấm công.','success');
  };
  const renderAttendanceHistory=allowActions=>h('div',{className:'card attendance-history-card'},
    h('div',{className:'attendance-manager-title'},'Danh sách vào / ra'),
    h('div',{className:'attendance-report-filters'},
      h(SearchBar,{value:q,onChange:setQ,placeholder:'Tìm nhân viên, bộ phận...'}),
      h('select',{value:periodMode,onChange:e=>setPeriodMode(e.target.value)},
        h('option',{value:'day'},'Theo ngày'),
        h('option',{value:'month'},'Theo tháng')
      ),
      periodMode==='month'
        ?h('input',{type:'month',value:month,onChange:e=>setMonth(e.target.value||isoDate().slice(0,7))})
        :h('input',{type:'date',value:day,onChange:e=>setDay(e.target.value)}),
      h(ExportBtn,{onClick:()=>xlsxExport(exportRows,[['date','Ngày'],['time','Giờ'],['empId','Mã NV'],['empName','Nhân viên'],['dept','Bộ phận'],['workShift','Ca làm việc'],['type','Loại'],['timeStatus','Giờ công'],['faceScore','Điểm mặt'],['gps','GPS'],['distance','Khoảng cách'],['status','Trạng thái'],['note','Ghi chú']],'Cham_cong_'+(periodMode==='month'?month:(day||isoDate())))})
    ),
    h('div',{className:'attendance-period-stats'},
      [['Vào ca',stat.in],['Ra ca',stat.out],['Hợp lệ',stat.valid],['Cần duyệt',stat.review],['Đi muộn',stat.late],['Về sớm',stat.early]].map(x=>h('div',{key:x[0]},h('span',null,x[0]),h('b',null,x[1])))
    ),
    h('div',{className:'tw'},
      h('table',null,
        h('thead',null,h('tr',null,...['Ngày','Giờ','Nhân viên','Ca làm việc','Loại','Giờ công','Mặt','GPS','Trạng thái','Ghi chú',''].map(c=>h('th',{key:c},c)))),
        h('tbody',null,filtered.length?filtered.map(r=>h('tr',{key:r.id},
          h('td',null,vnDateFromISO(r.date)),h('td',null,shortTime(r.time)),
          h('td',null,h('div',{style:{fontWeight:500}},r.empName),h('div',{style:{fontSize:11,color:'var(--tx2)'}},r.empId+' • '+r.dept)),
          h('td',null,r.workShiftName||'—'),
          h('td',null,r.type==='in'?'Vào ca':'Ra ca'),
          h('td',null,h('span',{className:'badge',style:{background:(r.timeStatus||timeStatus(r.type,r.time,r.workShiftId))==='Đúng giờ'?'#EAF3DE':'#FAEEDA',color:(r.timeStatus||timeStatus(r.type,r.time,r.workShiftId))==='Đúng giờ'?'#3B6D11':'#854F0B'}},r.timeStatus||timeStatus(r.type,r.time,r.workShiftId))),
          h('td',null,h('span',{style:{color:r.faceOk?'#2d6a4f':'#A32D2D',fontWeight:600}},r.faceScore+'%')),
          h('td',null,h('span',{style:{color:r.gpsOk?'#2d6a4f':'#A32D2D'}},(r.distance??'—')+'m')),
          h('td',null,h('span',{className:'badge',style:{background:r.status==='valid'?'#EAF3DE':'#FAEEDA',color:r.status==='valid'?'#3B6D11':'#854F0B'}},r.status==='valid'?'Hợp lệ':'Cần duyệt')),
          h('td',null,h('div',{style:{fontSize:12,color:r.note?'var(--tx)':'var(--tx2)',maxWidth:240,lineHeight:1.45}},r.note||'—')),
          h('td',null,allowActions&&h('div',{style:{display:'flex',gap:4}},
            r.status!=='valid'&&h('button',{style:{fontSize:11,padding:'4px 8px'},onClick:()=>approveAttendanceRecord(r.id)},'Duyệt'),
            isAdmin&&h('button',{className:'bdel',onClick:()=>window.scfConfirm('Bạn có chắc muốn xóa bản ghi chấm công này?','Xóa bản ghi',true).then(ok=>{if(ok){setAttendance(p=>p.filter(x=>x.id!==r.id));window.showToast('Đã xóa bản ghi','success');}})},'Xóa')
          ))
        )):h('tr',null,h('td',{colSpan:11,className:'empty-st'},'Chưa có bản ghi chấm công trong thời gian đã chọn')))
      )
    )
  );
  const renderMonthlyReport=()=>h('div',{className:'card attendance-monthly-card'},
    h('div',{className:'attendance-report-head'},
      h('div',null,h('div',{className:'attendance-manager-title'},canManage?'Báo công theo tháng':'Báo cáo ngày công của tôi'),h('div',{className:'attendance-report-note'},'Số ngày công được tính theo các ngày có bản ghi chấm công hợp lệ.')),
      h('div',{className:'attendance-month-actions'},
        h('input',{type:'month',value:month,onChange:e=>setMonth(e.target.value||isoDate().slice(0,7))}),
        h(ExportBtn,{onClick:()=>xlsxExport(monthlyExportRows,[['empId','Mã NV'],['empName','Nhân viên'],['dept','Bộ phận'],['month','Tháng'],['workDays','Ngày công'],['inCount','Lượt vào'],['outCount','Lượt ra'],['hours','Tổng giờ'],['overtime','Tăng ca'],['hourlyRate','Lương giờ'],['wage','Tiền công'],['late','Đi muộn'],['early','Về sớm']],'Bao_cong_thang_'+month)})
      )
    ),
    h('div',{className:'tw'},h('table',null,
      h('thead',null,h('tr',null,...['Nhân viên','Bộ phận','Ngày công','Lượt vào','Lượt ra','Tổng giờ','Tăng ca','Lương giờ','Tiền công','Đi muộn','Về sớm'].map(c=>h('th',{key:c},c)))),
      h('tbody',null,monthlyRows.length?monthlyRows.map(r=>h('tr',{key:r.id},
        h('td',null,h('b',null,r.name),h('div',{style:{fontSize:11,color:'var(--tx2)'}},r.id)),
        h('td',null,r.dept||'—'),h('td',null,h('b',null,r.workDays)),h('td',null,r.inCount),h('td',null,r.outCount),h('td',null,h('b',null,r.hours)),h('td',null,r.overtime||'—'),h('td',null,r.hourlyRate?r.hourlyRate.toLocaleString('vi-VN')+'đ':'—'),h('td',null,h('b',null,r.wage?r.wage.toLocaleString('vi-VN')+'đ':'—')),h('td',null,r.late),h('td',null,r.early)
      )):h('tr',null,h('td',{colSpan:11,className:'empty-st'},'Tháng này chưa có dữ liệu chấm công')))
    ))
  );
  if(section==='report'){
    if(!canManage){
      return h('div',{className:'attendance-personal-report'},
        h('div',{className:'ptitle'},h('i',{className:'ti ti-report-analytics'}),reportTitle),
        renderMonthlyReport()
      );
    }
    const pendingRows=attendance.filter(r=>(isAdmin||managerEmployeeIds.has(r.empId))&&r.status!=='valid').sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    return h('div',{className:'attendance-manager-page'},
      h('div',{className:'ptitle'},h('i',{className:'ti ti-report-analytics'}),reportTitle),
      pendingRows.length>0&&h('div',{className:'card'},
        h('div',{className:'attendance-manager-title'},'Bản ghi cần duyệt'),
        h('div',{className:'attendance-manager-approvals'},pendingRows.map(r=>h('div',{className:'attendance-approval-row',key:r.id},
          h('div',null,h('b',null,r.empName||r.empId),h('span',null,vnDateFromISO(r.date)+' • '+shortTime(r.time)+' • '+(r.type==='in'?'Vào ca':'Ra ca'))),
          h('button',{className:'bp',onClick:()=>approveAttendanceRecord(r.id)},h('i',{className:'ti ti-check'}),'Duyệt')
        )))
      ),
      renderAttendanceHistory(true),
      renderMonthlyReport()
    );
  }
  if(section==='settings'){
    if(!isAdmin)return null;
    return h('div',{className:'attendance-settings-page'},
      h('div',{className:'ptitle'},h('i',{className:'ti ti-settings'}),'Cài đặt chấm công'),
      h('div',{className:'att-grid'},
        h('div',{className:'card'},
          h(F,{label:'Nhân viên đăng ký khuôn mặt'},h('select',{value:empId,onChange:e=>{setEmpId(e.target.value);setPreview('');setCap(null);}},
            h('option',{value:''},'— Chọn nhân viên —'),employees.map(e=>h('option',{key:e.id,value:e.id},e.id+' - '+e.name))
          )),
          empId?h(CameraBox,{preview,setPreview,template:tpl,setTemplate:clearFaceTemplate,onCapture:handleFaceCapture,autoOpenSignal:cameraAutoOpenSignal}):h('div',{className:'attendance-manager-placeholder'},'Chọn nhân viên để đăng ký khuôn mặt mẫu.'),
          empId&&h('div',{className:'sc',style:{marginTop:10}},
            h('div',{className:'att-panel-head'},
              h('div',null,h('div',{style:{fontWeight:600}},emp.name),h('div',{style:{fontSize:12,color:'var(--tx2)'}},emp.id+' • '+(emp.dept||''))),
              h('span',{className:'badge',style:{background:tpl?'#EAF3DE':'#FAEEDA',color:tpl?'#3B6D11':'#854F0B'}},tpl?'Đã có mẫu mặt':'Chưa có mẫu')
            ),
            h('button',{className:'bp',onClick:saveTemplate,disabled:!cap,style:{marginTop:10}},h('i',{className:'ti ti-id'}),' Lưu khuôn mặt mẫu')
          )
        ),
        h('div',null,
          h('div',{className:'card',style:{marginBottom:'1rem'}},
            h('div',{className:'attendance-manager-title'},'Thiết lập vùng chấm công'),
            h('div',{className:'g3'},
              h(F,{label:'Vĩ độ'},h('input',{value:settings.lat,onChange:e=>setSettings({...settings,lat:numFmt(e.target.value)})})),
              h(F,{label:'Kinh độ'},h('input',{value:settings.lon,onChange:e=>setSettings({...settings,lon:numFmt(e.target.value)})})),
              h(F,{label:'Bán kính (m)'},h('input',{value:settings.radius,onChange:e=>setSettings({...settings,radius:numFmt(e.target.value)})}))
            ),
            h('div',{className:'attendance-workshift-title'},'Ca làm việc theo 3 ca lớn'),
            h('div',{className:'attendance-workshift-grid'},workShifts.map(sh=>h('div',{className:'attendance-workshift-card',key:sh.id,style:{borderColor:sh.color,background:sh.color}},
              h('div',{className:'attendance-workshift-name',style:{color:sh.textColor}},sh.name),
              h('div',{className:'attendance-workshift-times'},
                h(F,{label:'Giờ vào'},h('input',{type:'time',value:sh.start,onChange:e=>updateWorkShift(sh.id,'start',e.target.value)})),
                h(F,{label:'Giờ ra'},h('input',{type:'time',value:sh.end,onChange:e=>updateWorkShift(sh.id,'end',e.target.value)}))
              ),
              h('div',{className:'attendance-workshift-range'},sh.start+' – '+sh.end+(timeToMin(sh.start)>=timeToMin(sh.end)?' • qua ngày hôm sau':''))
            ))),
            h('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},
              h('button',{onClick:applyGpsToSettings,disabled:gpsBusy},h('i',{className:'ti '+(gpsBusy?'ti-loader-2 spin':'ti-current-location')}),' Dùng GPS hiện tại'),
              h('button',{onClick:resetGpsSettings},'Mặc định Sông Công')
            )
          ),
          h('div',{className:'card',style:{marginBottom:'1rem'}},
            h('div',{className:'attendance-manager-title'},'Lương giờ nhân viên'),
            h('div',{style:{fontSize:12,color:'var(--tx2)',marginBottom:10}},'Nhập lương theo giờ cho từng nhân viên. Dữ liệu tự lưu và dùng để tính tiền công trong Báo cáo chấm công.'),
            h('div',{className:'tw'},h('table',null,
              h('thead',null,h('tr',null,h('th',null,'Mã NV'),h('th',null,'Nhân viên'),h('th',null,'Bộ phận'),h('th',null,'Lương giờ (đ)'))),
              h('tbody',null,employees.slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'vi')).map(employee=>h('tr',{key:employee.id},
                h('td',null,employee.id),h('td',null,h('b',null,employee.name)),h('td',null,employee.dept||'—'),
                h('td',null,h('input',{type:'number',min:0,step:1000,value:settings.hourlyRates?.[employee.id]||'',placeholder:'Ví dụ: 30000',onChange:e=>setSettings(prev=>({...prev,hourlyRates:{...(prev.hourlyRates||{}),[employee.id]:Math.max(0,Number(e.target.value)||0)}})),style:{minWidth:130}}))
              )))
            ))
          ),
          h('div',{className:'card'},
            h('div',{className:'attendance-manager-title'},'Gửi báo cáo Zalo'),
            h(F,{label:'Webhook Zalo/server trung gian'},h('input',{value:zaloWebhook,onChange:e=>setZaloWebhook(e.target.value),placeholder:'https://...'})),
            h('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},
              h('button',{onClick:copyZalo},h('i',{className:'ti ti-copy'}),' Sao chép tin nhắn'),
              h('button',{onClick:shareZalo},h('i',{className:'ti ti-share'}),' Chia sẻ'),
              h('button',{className:'bp',onClick:sendWebhook},h('i',{className:'ti ti-send'}),' Gửi webhook')
            )
          )
        )
      )
    );
  }
  if(!canManage){
    const ownTimes=myToday.filter(r=>r.status==='valid');
    return h('div',{className:'attendance-employee-simple'},
      h('div',{className:'attendance-employee-camera'},
        h(CameraBox,{preview,setPreview,template:tpl,onCapture:handleFaceCapture,autoOpenSignal:cameraAutoOpenSignal,simple:true})
      ),
      punchBusy&&h('div',{className:'attendance-employee-working'},h('i',{className:'ti ti-loader-2 spin'}),' Đang xác nhận khuôn mặt và GPS...'),
      punchShareCard(),
      h('div',{className:'attendance-employee-times'},
        ownTimes.length?ownTimes.map(r=>h('div',{className:'attendance-time-card',key:r.id},
          h('i',{className:'ti '+(r.type==='in'?'ti-login-2':'ti-logout-2')}),
          h('div',null,
            h('b',null,r.type==='in'?'Vào ca':'Ra ca'),
            h('span',null,vnDateFromISO(r.date)+' • '+shortTime(r.time)+(r.workShiftName?' • '+r.workShiftName:''))
          )
        )):h('div',{className:'attendance-no-time'},'Hôm nay chưa có giờ vào ca.')
      )
    );
  }
  const punchEmployees=isAdmin?employees:managerEmployees;
  const selectedTimes=myToday.filter(r=>r.status==='valid');
  return h('div',{className:'attendance-employee-simple attendance-managed-punch'},
    h('div',{className:'ptitle'},h('i',{className:'ti ti-face-id'}),'Chấm công'),
    h('div',{className:'attendance-employee-camera'},
      h(F,{label:'Chọn nhân viên chấm công'},h('select',{value:empId,onChange:e=>{setEmpId(e.target.value);setPreview('');setCap(null);setPunchPending(false);setLastPunchShare(null);}},
        h('option',{value:''},'— Chọn nhân viên —'),
        punchEmployees.map(e=>h('option',{key:e.id,value:e.id},e.id+' - '+e.name))
      )),
      empId
        ?h(CameraBox,{preview,setPreview,template:tpl,onCapture:handleFaceCapture,autoOpenSignal:cameraAutoOpenSignal,simple:true})
        :h('div',{className:'attendance-manager-placeholder'},'Chọn nhân viên để chấm công.')
    ),
    punchBusy&&h('div',{className:'attendance-employee-working'},h('i',{className:'ti ti-loader-2 spin'}),' Đang xác nhận khuôn mặt và GPS...'),
    punchShareCard(),
    empId&&h('div',{className:'attendance-employee-times'},
      selectedTimes.length?selectedTimes.map(r=>h('div',{className:'attendance-time-card',key:r.id},
        h('i',{className:'ti '+(r.type==='in'?'ti-login-2':'ti-logout-2')}),
        h('div',null,h('b',null,(r.type==='in'?'Vào ca':'Ra ca')+' • '+emp.name),h('span',null,vnDateFromISO(r.date)+' • '+shortTime(r.time)+(r.workShiftName?' • '+r.workShiftName:'')))
      )):h('div',{className:'attendance-no-time'},'Hôm nay nhân viên này chưa có giờ vào ca.')
    )
  );
  /* Mã giao diện cũ bên dưới được giữ tạm để tương thích, nhưng không còn được hiển thị. */
  if(isManager){
    const pendingRows=attendance.filter(r=>managerEmployeeIds.has(r.empId)&&r.status!=='valid').sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
    return h('div',{className:'attendance-manager-page'},
      h('div',{className:'attendance-manager-simple'},
        h('div',{className:'card'},
          h(F,{label:'Chọn nhân viên'},h('select',{value:empId,onChange:e=>{setEmpId(e.target.value);setPreview('');setCap(null);setPunchPending(false);}},
            h('option',{value:''},'— Chọn nhân viên —'),
            managerEmployees.map(e=>h('option',{key:e.id,value:e.id},e.id+' - '+e.name))
          )),
          empId
            ?h(CameraBox,{preview,setPreview,template:tpl,onCapture:handleFaceCapture,autoOpenSignal:cameraAutoOpenSignal,simple:true})
            :h('div',{className:'attendance-manager-placeholder'},'Chọn nhân viên để chấm công.')
        ),
        h('div',null,
          punchBusy&&h('div',{className:'attendance-employee-working',style:{marginBottom:12}},h('i',{className:'ti ti-loader-2 spin'}),' Đang xác nhận khuôn mặt và GPS...'),
          h('div',{className:'card'},
            h('div',{className:'attendance-manager-title'},'Bản ghi cần duyệt'),
            pendingRows.length?h('div',{className:'attendance-manager-approvals'},pendingRows.map(r=>h('div',{className:'attendance-approval-row',key:r.id},
              h('div',null,h('b',null,r.empName||r.empId),h('span',null,vnDateFromISO(r.date)+' • '+shortTime(r.time)+' • '+(r.type==='in'?'Vào ca':'Ra ca'))),
              h('button',{className:'bp',onClick:()=>approveAttendanceRecord(r.id)},h('i',{className:'ti ti-check'}),'Duyệt')
            ))):h('div',{className:'attendance-no-time'},'Không có bản ghi nào cần duyệt.')
          )
        )
      ),
      renderAttendanceHistory(true),
      renderMonthlyReport()
    );
  }
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-face-id',style:{fontSize:20}}),'Chấm công khuôn mặt + GPS'),
    h('div',{className:'mobile-only att-mobile-toolbar'},
      h('button',{className:showQuickPunch?'bp':'',onClick:()=>{setQuickPunchMode(v=>!v);setMobileInfoOpen(false);}},
        h('i',{className:'ti '+(showQuickPunch?'ti-layout-dashboard-filled':'ti-layout-dashboard'),style:{fontSize:14}}),
        showQuickPunch?'Đang ở chấm công nhanh':'Bật chấm công nhanh'
      ),
      h('button',{onClick:()=>setMobileInfoOpen(v=>!v)},
        h('i',{className:'ti '+(mobileInfoOpen?'ti-chevron-up':'ti-chevron-down'),style:{fontSize:14}}),
        mobileInfoOpen?'Ẩn chi tiết':'Mở chi tiết'
      )
    ),
    !showQuickPunch&&h('div',{className:'att-stat'},
      [['Vào ca',stat.in,'ti-login-2'],['Ra ca',stat.out,'ti-logout-2'],['Hợp lệ',stat.valid,'ti-circle-check'],['Cần duyệt',stat.review,'ti-alert-triangle'],['Đi muộn',stat.late,'ti-clock-exclamation'],['Về sớm',stat.early,'ti-clock-down']].map(x=>h('div',{className:'sc',key:x[0]},
        h('div',{className:'att-stat-label'},h('i',{className:'ti '+x[2],style:{fontSize:14,marginRight:4}}),x[0]),
        h('div',{className:'att-stat-value'},x[1])
      ))
    ),
    h('div',{className:'att-grid',style:showQuickPunch?{gridTemplateColumns:'1fr'}:null},
      h('div',{className:'card'},
        canManage&&h(F,{label:'Nhân viên chấm công'},h('select',{value:empId,onChange:e=>{setEmpId(e.target.value);setPreview('');setCap(null);setMobileInfoOpen(false);}},h('option',{value:''},'-- Chọn nhân viên --'),employees.map(e=>h('option',{key:e.id,value:e.id},e.id+' - '+e.name)))),
        h(CameraBox,{preview,setPreview,template:tpl,setTemplate:clearFaceTemplate,onCapture:handleFaceCapture,autoOpenSignal:cameraAutoOpenSignal}),
        h('div',{className:'sc',style:{marginTop:10}},
          h('div',{className:'att-panel-head'},
            h('div',null,h('div',{style:{fontWeight:600}},emp.name),h('div',{style:{fontSize:12,color:'var(--tx2)'}},emp.id+' • '+(emp.dept||''))),
            h('span',{className:'badge',style:{background:tpl?'#EAF3DE':'#FAEEDA',color:tpl?'#3B6D11':'#854F0B'}},tpl?'Đã có mẫu mặt':'Chưa có mẫu')
          ),
        h('div',{className:'att-helper-text'},'Điểm khớp '+(faceMatch.method==='ai'?'AI':'mẫu cũ')+': ',h('b',{style:{color:faceOk?'#2d6a4f':'#A32D2D'}},cap&&tpl?score+'%':'—'),' • Lần tiếp theo: ',h('b',null,nextType==='in'?'Vào ca':'Ra ca')),
        tpl&&!tpl.descriptor&&h('div',{className:'att-helper-text',style:{color:'#854F0B'}},'Mẫu mặt này được tạo bằng cách cũ. Nên bấm Đăng ký lại để chuyển sang nhận diện AI.')
        ),
        h('div',{className:'att-status-row'},
          h('span',{className:'badge',style:faceStateStyle},faceState),
          h('span',{className:'badge',style:gpsStateStyle},gpsState),
          h('span',{className:'badge',style:readyStyle},readyLabel)
        ),
        h('div',{className:'att-detail-text',style:{color:readyPunch?'#0F6E56':'#854F0B'}},readyDetail),
        h('div',{className:'att-action-row'},
          h('button',{onClick:()=>getGps('attendance'),disabled:gpsBusy},h('i',{className:'ti '+(gpsBusy?'ti-loader-2 spin':'ti-map-pin'),style:{fontSize:14}}),gpsBusy?'Đang lấy GPS...':'Lấy GPS'),
          h('button',{onClick:saveTemplate,disabled:needEmp()},h('i',{className:'ti ti-id',style:{fontSize:14}}),'Lưu mặt mẫu'),
          h('button',{className:'bp',onClick:handlePunchClick,disabled:needEmp()||punchBusy},
            h('i',{className:'ti '+(punchBusy?'ti-loader-2 spin':(nextType==='in'?'ti-login-2':'ti-logout-2')),style:{fontSize:15}}),
            punchBusy?'Đang chấm công...':(nextType==='in'?'Vào ca':'Ra ca')
          )
        ),
        h('button',{className:'att-mobile-toggle',onClick:()=>setMobileInfoOpen(v=>!v)},
          h('i',{className:'ti '+(mobileInfoOpen?'ti-chevron-up':'ti-chevron-down'),style:{fontSize:14}}),
          mobileInfoOpen?'Ẩn chi tiết GPS và hướng dẫn':'Xem chi tiết GPS và hướng dẫn'
        ),
        h('div',{className:'att-mobile-extra'+(mobileInfoOpen?' open':'')},
          h('div',{className:'att-gps-text'},gpsMsg),
          h('div',{className:'att-helper-text'},'Bấm ',h('b',null,nextType==='in'?'Vào ca':'Ra ca'),' là app tự mở camera. Chụp xong, nếu mặt và GPS hợp lệ thì mới lưu giờ vào ca.'),
          h('div',{className:'sc att-gps-text',style:{marginTop:10}},
            h('div',null,h('span',{className:'att-dot '+(pos?(gs.ok?'ok':'bad'):'warn')}),' GPS: ',pos?(gs.label+' • '+gs.distance+'m • sai số '+pos.acc+'m'):'Chưa lấy vị trí'),
            h('div',null,'Tọa độ công ty: ',settings.lat,', ',settings.lon,' • Bán kính ',settings.radius,'m'),
            h('div',null,'Ca chuẩn: ',settings.start,' - ',settings.end)
          )
        ),
        h('div',{className:'mobile-only att-punch-sticky'},
          h('button',{className:'bp',onClick:handlePunchClick,disabled:needEmp()||punchBusy},
            h('i',{className:'ti '+(punchBusy?'ti-loader-2 spin':(nextType==='in'?'ti-login-2':'ti-logout-2')),style:{fontSize:15}}),
            punchBusy?'Đang chấm công...':(nextType==='in'?'Vào ca ngay':'Ra ca ngay')
          )
        )
      ),
      !showQuickPunch&&h('div',null,
        canManage&&h('div',{className:'card',style:{marginBottom:'1rem'}},
          h('div',{style:{fontWeight:600,marginBottom:10,color:'var(--pri3)'}},'Thiết lập vùng chấm công'),
          h('div',{className:'g4'},
            h(F,{label:'Vĩ độ'},h('input',{value:settings.lat,onChange:e=>setSettings({...settings,lat:numFmt(e.target.value)})})),
            h(F,{label:'Kinh độ'},h('input',{value:settings.lon,onChange:e=>setSettings({...settings,lon:numFmt(e.target.value)})})),
            h(F,{label:'Bán kính (m)'},h('input',{value:settings.radius,onChange:e=>setSettings({...settings,radius:numFmt(e.target.value)})})),
            h(F,{label:'Giờ vào chuẩn'},h('input',{type:'time',value:settings.start||'',onChange:e=>setSettings({...settings,start:e.target.value})}))
          ),
          h('div',{className:'g4'},
            h(F,{label:'Giờ ra chuẩn'},h('input',{type:'time',value:settings.end||'',onChange:e=>setSettings({...settings,end:e.target.value})})),
            h(F,{label:'Ca chuẩn'},h('input',{value:(settings.start||'--:--')+' - '+(settings.end||'--:--'),readOnly:true}))
          ),
          h('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},
            h('button',{onClick:applyGpsToSettings,disabled:gpsBusy},h('i',{className:'ti '+(gpsBusy?'ti-loader-2 spin':'ti-current-location'),style:{fontSize:14}}),'Dùng GPS hiện tại'),
            h('button',{onClick:resetGpsSettings},'Mặc định Sông Công')
          )
        ),
        canManage&&h('div',{className:'card',style:{marginBottom:'1rem'}},
          h('div',{style:{fontWeight:600,marginBottom:10,color:'var(--pri3)'}},'Gửi báo cáo Zalo'),
          h(F,{label:'Webhook Zalo/server trung gian'},h('input',{value:zaloWebhook,onChange:e=>setZaloWebhook(e.target.value),placeholder:'https://...'})),
          h('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},
            h('button',{onClick:copyZalo},h('i',{className:'ti ti-copy',style:{fontSize:14}}),'Sao chép tin nhắn'),
            h('button',{onClick:shareZalo},h('i',{className:'ti ti-share',style:{fontSize:14}}),'Chia sẻ'),
            h('button',{className:'bp',onClick:sendWebhook},h('i',{className:'ti ti-send',style:{fontSize:14}}),'Gửi webhook')
          ),
          h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:8}},'Zalo không cho web tĩnh gửi trực tiếp vào nhóm nếu không có API/token. Dùng sao chép/chia sẻ, hoặc cấu hình webhook qua server riêng.')
        ),
        renderAttendanceHistory(true),
        renderMonthlyReport()
      )
    )
  );
}

function MoneyRequestForm({title,record,employees,currentUser,type,onSave,onClose}) {
  const canManage=currentUser.role==='admin'||currentUser.role==='manager';
  const[f,sf]=useState(record?{...record}:{empId:canManage?'':currentUser.id,date:isoDate(),amount:0,kind:type==='bonus'?'bonus':'advance',reason:'',note:''});
  const emp=employees.find(e=>e.id===f.empId)||currentUser;
  const submit=()=>{if(!f.empId){window.showToast('Chọn nhân viên.','warn');return;}if(!f.date){window.showToast('Chọn ngày phiếu.','warn');return;}if(numFmt(f.amount)<=0){window.showToast('Nhập số tiền.','warn');return;}if(!f.reason){window.showToast('Nhập nội dung phiếu.','warn');return;}onSave({...f,amount:numFmt(f.amount),empName:emp.name,dept:emp.dept||'',status:f.status||'pending',createdBy:record?.createdBy||currentUser.name,createdAt:record?.createdAt||fmtDT(),updatedBy:currentUser.name,updatedAt:fmtDT()});};
  return h(Modal,{title,onClose},
    canManage&&h(F,{label:'Nhân viên'},h('select',{value:f.empId,onChange:e=>sf(p=>({...p,empId:e.target.value}))},h('option',{value:''},'-- Chọn nhân viên --'),employees.map(e=>h('option',{key:e.id,value:e.id},e.id+' - '+e.name)))),
    h('div',{className:'g2'},
      h(F,{label:'Ngày'},h('input',{type:'date',value:f.date,onChange:e=>sf(p=>({...p,date:e.target.value}))})),
      h(F,{label:'Số tiền'},h('input',{value:f.amount,onChange:e=>sf(p=>({...p,amount:e.target.value})),placeholder:'0'}))
    ),
    type==='bonus'&&h(F,{label:'Loại'},h('select',{value:f.kind,onChange:e=>sf(p=>({...p,kind:e.target.value}))},h('option',{value:'bonus'},'Thưởng'),h('option',{value:'penalty'},'Phạt'))),
    h(F,{label:type==='advance'?'Lý do ứng lương':'Nội dung'},h('textarea',{rows:3,value:f.reason,onChange:e=>sf(p=>({...p,reason:e.target.value}))})),
    h(F,{label:'Ghi chú'},h('input',{value:f.note||'',onChange:e=>sf(p=>({...p,note:e.target.value}))})),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit},'Lưu'))
  );
}

function MoneyReviewModal({record,currentUser,isAdvance,onSave,onClose}){
  const[f,sf]=useState({status:record.status==='rejected'?'rejected':'approved',approvedAmount:record.approvedAmount??record.amount??0,reviewNote:record.reviewNote||''});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const submit=()=>{
    if(f.status==='approved'){
      if(numFmt(f.approvedAmount)<=0){window.showToast('Nhập số tiền duyệt.','warn');return;}
      if(numFmt(f.approvedAmount)>numFmt(record.amount||0)&&!confirm('Số tiền duyệt đang lớn hơn số tiền đề nghị. Vẫn tiếp tục?'))return;
    }
    if(f.status==='rejected'&&!f.reviewNote){window.showToast('Nhập lý do từ chối.','warn');return;}
    onSave({...record,status:f.status,approvedAmount:f.status==='approved'?numFmt(f.approvedAmount):0,reviewNote:f.reviewNote||'',approvedBy:currentUser.name,approvedAt:fmtDT(),updatedBy:currentUser.name,updatedAt:fmtDT()});
  };
  return h(Modal,{title:(isAdvance?'Duyệt ứng lương':'Duyệt thưởng phạt')+' - '+(record.empName||''),onClose},
    h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'10px 12px',fontSize:13,marginBottom:10,lineHeight:1.6}},
      h('div',null,h('b',null,record.empName||'—'),' · ',vnDateFromISO(record.date||''),' · ',record.dept||''),
      h('div',{style:{marginTop:4,color:'var(--tx2)'}},'Đề nghị: '+moneyFmt(record.amount||0)+(isAdvance?'':' · '+(record.kind==='penalty'?'Phiếu phạt':'Phiếu thưởng'))),
      h('div',{style:{marginTop:4,color:'var(--tx2)'}},record.reason||'—')
    ),
    h(F,{label:'Kết quả duyệt'},h('select',{value:f.status,onChange:e=>s('status',e.target.value)},
      h('option',{value:'approved'},'Duyệt'),
      h('option',{value:'rejected'},'Từ chối')
    )),
    f.status==='approved'&&h(F,{label:'Số tiền duyệt'},h(NumInput,{value:f.approvedAmount,onChange:v=>s('approvedAmount',v),placeholder:'0'})),
    h(F,{label:f.status==='approved'?'Ghi chú duyệt':'Lý do từ chối'},h('textarea',{rows:3,value:f.reviewNote,onChange:e=>s('reviewNote',e.target.value),placeholder:f.status==='approved'?'Ghi chú nếu duyệt khác số tiền đề nghị...':'Nêu rõ lý do từ chối...'})),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit},'Xác nhận'))
  );
}

function MoneyTab({mode,records,setRecords,employees,currentUser}) {
  const canManage=currentUser.role==='admin'||currentUser.role==='manager';
  const[modal,setModal]=useState(false);const[edit,setEdit]=useState(null);const[review,setReview]=useState(null);const[q,setQ]=useState('');const[month,setMonth]=useState(isoDate().slice(0,7));const[statusFilter,setStatusFilter]=useState('all');const[deptFilter,setDeptFilter]=useState('all');const[empFilter,setEmpFilter]=useState('all');
  const isAdvance=mode==='advance';
  const title=isAdvance?'Ứng lương':'Thưởng phạt';
  const fmtMoneyValue=v=>Number(v||0).toLocaleString('vi-VN')+'đ';
  const baseRows=records.filter(r=>canManage||r.empId===currentUser.id);
  const deptOptions=[...new Set(baseRows.map(r=>r.dept).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const empOptions=[...new Map(baseRows.filter(r=>deptFilter==='all'||r.dept===deptFilter).map(r=>[r.empId,{id:r.empId,name:r.empName||r.empId}])).values()];
  const matchesSearch=r=>!q||[r.empName,r.empId,r.reason,r.status,r.kind,r.reviewNote,r.note].some(x=>(x||'').toLowerCase().includes(q.toLowerCase()));
  const scopedRows=baseRows.filter(r=>(!month||String(r.date||'').startsWith(month))&&(deptFilter==='all'||r.dept===deptFilter)&&(empFilter==='all'||r.empId===empFilter)&&matchesSearch(r));
  const rows=scopedRows.filter(r=>statusFilter==='all'||r.status===statusFilter);
  const save=d=>{if(edit)setRecords(p=>p.map(x=>x.id===edit.id?{...x,...d}:x));else setRecords(p=>[{...d,id:(isAdvance?'UL':'TP')+uid()},...p]);setModal(false);setEdit(null);};
  const reviewSave=d=>{setRecords(p=>p.map(x=>x.id===d.id?{...x,...d}:x));setReview(null);};
  const amountSign=r=>r.kind==='penalty'?-1:1;
  const approvedNet=rows.filter(r=>r.status==='approved').reduce((s,r)=>s+(amountSign(r)*numFmt(r.approvedAmount??r.amount)),0);
  const pendingNet=rows.filter(r=>r.status==='pending').reduce((s,r)=>s+(amountSign(r)*numFmt(r.amount)),0);
  const exportCols=[['date','Ngày'],['empId','Mã NV'],['empName','Nhân viên'],['dept','Bộ phận'],['kind','Loại'],['amount','Số tiền đề nghị'],['approvedAmount','Số tiền duyệt'],['reason','Nội dung'],['status','Trạng thái'],['reviewNote','Ghi chú duyệt'],['approvedBy','Người duyệt']];
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti '+(isAdvance?'ti-cash-banknote':'ti-scale'),style:{fontSize:20}}),title),
    h('div',{className:'att-stat'},
      h('div',{className:'sc'},h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Số phiếu'),h('div',{style:{fontSize:24,fontWeight:650,color:'var(--pri3)'}},rows.length)),
      h('div',{className:'sc'},h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Chờ duyệt'),h('div',{style:{fontSize:24,fontWeight:650,color:'#854F0B'}},rows.filter(r=>r.status==='pending').length)),
      h('div',{className:'sc'},h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Đã duyệt'),h('div',{style:{fontSize:24,fontWeight:650,color:'#2d6a4f'}},rows.filter(r=>r.status==='approved').length)),
      h('div',{className:'sc'},h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Từ chối'),h('div',{style:{fontSize:24,fontWeight:650,color:'#A32D2D'}},rows.filter(r=>r.status==='rejected').length)),
      h('div',{className:'sc'},h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Giá trị duyệt'),h('div',{style:{fontSize:24,fontWeight:650,color:approvedNet<0?'#A32D2D':'var(--pri3)'}},fmtMoneyValue(Math.abs(approvedNet)))),
      h('div',{className:'sc'},h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Đang chờ'),h('div',{style:{fontSize:24,fontWeight:650,color:pendingNet<0?'#A32D2D':'#854F0B'}},fmtMoneyValue(Math.abs(pendingNet)))),
    ),
    h('div',{className:'card'},
      h('div',{style:{display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap',marginBottom:10}},
        h('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},
          h(SearchBar,{value:q,onChange:setQ,placeholder:'Tìm phiếu...'}),
          h('input',{type:'month',value:month,onChange:e=>setMonth(e.target.value),style:{width:145}}),
          canManage&&h('select',{value:statusFilter,onChange:e=>setStatusFilter(e.target.value),style:{minWidth:130}},
            h('option',{value:'all'},'Tất cả trạng thái'),
            h('option',{value:'pending'},'Chờ duyệt'),
            h('option',{value:'approved'},'Đã duyệt'),
            h('option',{value:'rejected'},'Từ chối')
          ),
          canManage&&h('select',{value:deptFilter,onChange:e=>{setDeptFilter(e.target.value);setEmpFilter('all');},style:{minWidth:150}},
            h('option',{value:'all'},'Tất cả bộ phận'),
            deptOptions.map(d=>h('option',{key:d,value:d},d))
          ),
          canManage&&h('select',{value:empFilter,onChange:e=>setEmpFilter(e.target.value),style:{minWidth:170}},
            h('option',{value:'all'},deptFilter==='all'?'Tất cả nhân viên':'Nhân viên trong bộ phận'),
            empOptions.map(e=>h('option',{key:e.id,value:e.id},e.name+' ('+e.id+')'))
          )
        ),
        h('div',{style:{display:'flex',gap:6}},h(ExportBtn,{onClick:()=>xlsxExport(rows,exportCols,title.replace(/\s+/g,'_'))}),h(AddBtn,{onClick:()=>{setEdit(null);setModal(true);},label:isAdvance?'Tạo phiếu ứng':'Tạo thưởng/phạt'}))
      ),
      h('div',{className:'tw'},h('table',null,
        h('thead',null,h('tr',null,...['Ngày','Nhân viên','Loại','Đề nghị','Duyệt','Nội dung','Trạng thái',''].map(c=>h('th',{key:c},c)))),
        h('tbody',null,rows.length?rows.map(r=>h('tr',{key:r.id},
          h('td',null,vnDateFromISO(r.date)),h('td',null,h('div',{style:{fontWeight:500}},r.empName),h('div',{style:{fontSize:11,color:'var(--tx2)'}},r.empId+' • '+(r.dept||''))),
          h('td',null,isAdvance?'Ứng lương':(r.kind==='penalty'?'Phạt':'Thưởng')),
          h('td',null,h('span',{style:{fontWeight:650,color:r.kind==='penalty'?'#A32D2D':'var(--pri3)'}},fmtMoneyValue(r.amount||0)),r.note&&h('div',{style:{fontSize:11,color:'var(--tx2)',maxWidth:220}},r.note)),
          h('td',null,r.status==='approved'?h('span',{style:{fontWeight:650,color:r.kind==='penalty'?'#A32D2D':'var(--pri3)'}},fmtMoneyValue(r.approvedAmount??r.amount)):h('span',{style:{fontSize:12,color:'var(--tx2)'}},'—')),
          h('td',null,h('div',null,r.reason||'—'),r.reviewNote&&h('div',{style:{fontSize:11,color:r.status==='rejected'?'#A32D2D':'#185FA5',maxWidth:220,marginTop:3}},'QL: '+r.reviewNote)),
          h('td',null,h('span',{className:'badge',style:{background:r.status==='approved'?'#EAF3DE':r.status==='rejected'?'#FCEBEB':'#FAEEDA',color:r.status==='approved'?'#3B6D11':r.status==='rejected'?'#A32D2D':'#854F0B'}},r.status==='approved'?'Đã duyệt':r.status==='rejected'?'Từ chối':'Chờ duyệt')),
          h('td',null,h('div',{style:{display:'flex',gap:4}},
            canManage&&r.status==='pending'&&h('button',{style:{fontSize:11,padding:'4px 8px'},onClick:()=>setReview({...r,status:'approved'})},'Duyệt'),
            canManage&&r.status==='pending'&&h('button',{style:{fontSize:11,padding:'4px 8px',color:'#A32D2D',borderColor:'#F7C1C1'},onClick:()=>setReview({...r,status:'rejected'})},'Từ chối'),
            h('button',{className:'bi',onClick:()=>{setEdit(r);setModal(true);}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
            canManage&&h('button',{className:'bdel',onClick:()=>window.scfConfirm('Bạn có chắc muốn xóa phiếu này?','Xóa phiếu',true).then(ok=>{if(ok){setRecords(p=>p.filter(x=>x.id!==r.id));window.showToast('Đã xóa phiếu','success');}})},'Xóa')
          ))
        )):h('tr',null,h('td',{colSpan:7,className:'empty-st'},'Chưa có dữ liệu.')))
      )),
      modal&&h(MoneyRequestForm,{title:(edit?'Sửa ':'Thêm ')+title.toLowerCase(),record:edit,employees,currentUser,type:isAdvance?'advance':'bonus',onSave:save,onClose:()=>{setModal(false);setEdit(null);}}),
      review&&h(MoneyReviewModal,{record:review,currentUser,isAdvance,onSave:reviewSave,onClose:()=>setReview(null)})
    )
  );
}

function calcLeaveDays(fromDate,toDate){
  const from=parseAnyDate(fromDate);
  const to=parseAnyDate(toDate);
  if(!from||!to)return null;
  from.setHours(0,0,0,0);
  to.setHours(0,0,0,0);
  const diff=Math.round((to-from)/86400000)+1;
  return diff>0?diff:0;
}

function LeaveForm({record,employees,currentUser,onSave,onClose}) {
  const canManage=currentUser.role==='admin'||currentUser.role==='manager';
  const[f,sf]=useState(record?{...record}:{empId:canManage?'':currentUser.id,fromDate:isoDate(),toDate:isoDate(),days:1,type:'paid',reason:'',note:''});
  const autoDaysRef=useRef(calcLeaveDays((record&&record.fromDate)||isoDate(),(record&&record.toDate)||isoDate())||1);
  const emp=employees.find(e=>e.id===f.empId)||currentUser;
  useEffect(()=>{
    const autoDays=calcLeaveDays(f.fromDate,f.toDate);
    if(autoDays===null)return;
    const currentDays=numFmt(f.days);
    const prevAuto=autoDaysRef.current;
    if(!record||currentDays===0||currentDays===prevAuto)sf(p=>({...p,days:autoDays}));
    autoDaysRef.current=autoDays;
  },[f.fromDate,f.toDate]);
  const submit=()=>{if(!f.empId){window.showToast('Chọn nhân viên.','warn');return;}if(!f.fromDate||!f.toDate){window.showToast('Chọn thời gian nghỉ.','warn');return;}const leaveDays=calcLeaveDays(f.fromDate,f.toDate);if(leaveDays===0){window.showToast('Ngày đến phải bằng hoặc sau ngày bắt đầu.','warn');return;}if(!f.reason){window.showToast('Vui lòng nhập lý do nghỉ.','warn');return;}if(numFmt(f.days)<=0){window.showToast('Số ngày nghỉ không hợp lệ.','warn');return;}onSave({...f,days:numFmt(f.days)||leaveDays||1,empName:emp.name,dept:emp.dept||'',status:f.status||'pending',createdBy:record?.createdBy||currentUser.name,createdAt:record?.createdAt||fmtDT(),updatedBy:currentUser.name,updatedAt:fmtDT()});};
  return h(Modal,{title:record?'Sửa đơn xin nghỉ':'Tạo đơn xin nghỉ',onClose},
    canManage&&h(F,{label:'Nhân viên'},h('select',{value:f.empId,onChange:e=>sf(p=>({...p,empId:e.target.value}))},h('option',{value:''},'-- Chọn nhân viên --'),employees.map(e=>h('option',{key:e.id,value:e.id},e.id+' - '+e.name)))),
    h('div',{className:'g3'},
      h(F,{label:'Từ ngày'},h('input',{type:'date',value:f.fromDate,onChange:e=>sf(p=>({...p,fromDate:e.target.value}))})),
      h(F,{label:'Đến ngày'},h('input',{type:'date',value:f.toDate,onChange:e=>sf(p=>({...p,toDate:e.target.value}))})),
      h(F,{label:'Số ngày'},h('input',{value:f.days,onChange:e=>sf(p=>({...p,days:e.target.value}))}))
    ),
    h(F,{label:'Hình thức'},h('select',{value:f.type,onChange:e=>sf(p=>({...p,type:e.target.value}))},h('option',{value:'paid'},'Nghỉ phép'),h('option',{value:'unpaid'},'Nghỉ không lương'),h('option',{value:'sick'},'Nghỉ ốm'),h('option',{value:'other'},'Khác'))),
    h(F,{label:'Lý do'},h('textarea',{rows:3,value:f.reason,onChange:e=>sf(p=>({...p,reason:e.target.value}))})),
    h(F,{label:'Ghi chú'},h('input',{value:f.note||'',onChange:e=>sf(p=>({...p,note:e.target.value}))})),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit},'Lưu đơn'))
  );
}

function LeaveReviewModal({record,currentUser,onSave,onClose}){
  const[f,sf]=useState({status:record.status==='rejected'?'rejected':'approved',approvedDays:record.approvedDays??record.days??1,reviewNote:record.reviewNote||''});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const submit=()=>{
    if(f.status==='approved'&&numFmt(f.approvedDays)<=0){window.showToast('Nhập số ngày duyệt.','warn');return;}
    if(f.status==='approved'&&numFmt(f.approvedDays)>numFmt(record.days||0)&&!confirm('Số ngày duyệt đang lớn hơn số ngày đề nghị. Vẫn tiếp tục?'))return;
    if(f.status==='rejected'&&!f.reviewNote){window.showToast('Nhập lý do từ chối.','warn');return;}
    onSave({...record,status:f.status,approvedDays:f.status==='approved'?numFmt(f.approvedDays):0,reviewNote:f.reviewNote||'',approvedBy:currentUser.name,approvedAt:fmtDT(),updatedBy:currentUser.name,updatedAt:fmtDT()});
  };
  return h(Modal,{title:'Duyệt đơn nghỉ - '+(record.empName||''),onClose},
    h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'10px 12px',fontSize:13,marginBottom:10,lineHeight:1.6}},
      h('div',null,h('b',null,record.empName||'—'),' · ',record.dept||''),
      h('div',{style:{marginTop:4,color:'var(--tx2)'}},'Từ '+vnDateFromISO(record.fromDate||'')+' đến '+vnDateFromISO(record.toDate||'')+' · Đề nghị '+numFmt(record.days||0)+' ngày'),
      h('div',{style:{marginTop:4,color:'var(--tx2)'}},record.reason||'—')
    ),
    h(F,{label:'Kết quả duyệt'},h('select',{value:f.status,onChange:e=>s('status',e.target.value)},
      h('option',{value:'approved'},'Duyệt'),
      h('option',{value:'rejected'},'Từ chối')
    )),
    f.status==='approved'&&h(F,{label:'Số ngày duyệt'},h('input',{type:'number',min:0,step:'0.5',value:f.approvedDays,onChange:e=>s('approvedDays',numFmt(e.target.value))})),
    h(F,{label:f.status==='approved'?'Ghi chú duyệt':'Lý do từ chối'},h('textarea',{rows:3,value:f.reviewNote,onChange:e=>s('reviewNote',e.target.value),placeholder:f.status==='approved'?'Ví dụ: duyệt 0.5 ngày, nghỉ không lương...':'Nêu rõ lý do từ chối...'})),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit},'Xác nhận'))
  );
}

function LeaveTab({leaves,setLeaves,employees,currentUser}) {
  const canManage=currentUser.role==='admin'||currentUser.role==='manager';
  const[modal,setModal]=useState(false);const[edit,setEdit]=useState(null);const[review,setReview]=useState(null);const[q,setQ]=useState('');const[month,setMonth]=useState(isoDate().slice(0,7));const[statusFilter,setStatusFilter]=useState('all');const[deptFilter,setDeptFilter]=useState('all');const[empFilter,setEmpFilter]=useState('all');
  const baseRows=leaves.filter(r=>canManage||r.empId===currentUser.id);
  const deptOptions=[...new Set(baseRows.map(r=>r.dept).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const empOptions=[...new Map(baseRows.filter(r=>deptFilter==='all'||r.dept===deptFilter).map(r=>[r.empId,{id:r.empId,name:r.empName||r.empId}])).values()];
  const matchesSearch=r=>!q||[r.empName,r.empId,r.reason,r.status,r.type,r.reviewNote,r.note].some(x=>(x||'').toLowerCase().includes(q.toLowerCase()));
  const scopedRows=baseRows.filter(r=>(!month||String(r.fromDate||'').startsWith(month))&&(deptFilter==='all'||r.dept===deptFilter)&&(empFilter==='all'||r.empId===empFilter)&&matchesSearch(r));
  const rows=scopedRows.filter(r=>statusFilter==='all'||r.status===statusFilter);
  const save=d=>{if(edit)setLeaves(p=>p.map(x=>x.id===edit.id?{...x,...d}:x));else setLeaves(p=>[{...d,id:'NP'+uid()},...p]);setModal(false);setEdit(null);};
  const reviewSave=d=>{setLeaves(p=>p.map(x=>x.id===d.id?{...x,...d}:x));setReview(null);};
  const typeLabel={paid:'Nghỉ phép',unpaid:'Không lương',sick:'Nghỉ ốm',other:'Khác'};
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-calendar-minus',style:{fontSize:20}}),'Xin phép nghỉ'),
    h('div',{className:'att-stat'},
      h('div',{className:'sc'},h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Số đơn'),h('div',{style:{fontSize:24,fontWeight:650,color:'var(--pri3)'}},rows.length)),
      h('div',{className:'sc'},h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Chờ duyệt'),h('div',{style:{fontSize:24,fontWeight:650,color:'#854F0B'}},rows.filter(r=>r.status==='pending').length)),
      h('div',{className:'sc'},h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Đã duyệt'),h('div',{style:{fontSize:24,fontWeight:650,color:'#2d6a4f'}},rows.filter(r=>r.status==='approved').length)),
      h('div',{className:'sc'},h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Từ chối'),h('div',{style:{fontSize:24,fontWeight:650,color:'#A32D2D'}},rows.filter(r=>r.status==='rejected').length)),
      h('div',{className:'sc'},h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Ngày nghỉ duyệt'),h('div',{style:{fontSize:24,fontWeight:650,color:'var(--pri3)'}},rows.filter(r=>r.status==='approved').reduce((s,r)=>s+numFmt((r.approvedDays??r.days)||0),0)))
    ),
    h('div',{className:'card'},
      h('div',{style:{display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap',marginBottom:10}},
        h('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},
          h(SearchBar,{value:q,onChange:setQ,placeholder:'Tìm đơn nghỉ...'}),
          h('input',{type:'month',value:month,onChange:e=>setMonth(e.target.value),style:{width:145}}),
          canManage&&h('select',{value:statusFilter,onChange:e=>setStatusFilter(e.target.value),style:{minWidth:130}},
            h('option',{value:'all'},'Tất cả trạng thái'),
            h('option',{value:'pending'},'Chờ duyệt'),
            h('option',{value:'approved'},'Đã duyệt'),
            h('option',{value:'rejected'},'Từ chối')
          ),
          canManage&&h('select',{value:deptFilter,onChange:e=>{setDeptFilter(e.target.value);setEmpFilter('all');},style:{minWidth:150}},
            h('option',{value:'all'},'Tất cả bộ phận'),
            deptOptions.map(d=>h('option',{key:d,value:d},d))
          ),
          canManage&&h('select',{value:empFilter,onChange:e=>setEmpFilter(e.target.value),style:{minWidth:170}},
            h('option',{value:'all'},deptFilter==='all'?'Tất cả nhân viên':'Nhân viên trong bộ phận'),
            empOptions.map(e=>h('option',{key:e.id,value:e.id},e.name+' ('+e.id+')'))
          )
        ),
        h('div',{style:{display:'flex',gap:6}},h(ExportBtn,{onClick:()=>xlsxExport(rows,[['fromDate','Từ ngày'],['toDate','Đến ngày'],['empId','Mã NV'],['empName','Nhân viên'],['dept','Bộ phận'],['type','Hình thức'],['days','Số ngày đề nghị'],['approvedDays','Số ngày duyệt'],['reason','Lý do'],['status','Trạng thái'],['reviewNote','Ghi chú duyệt'],['approvedBy','Người duyệt']],'Xin_phep_nghi')}),h(AddBtn,{onClick:()=>{setEdit(null);setModal(true);},label:'Tạo đơn nghỉ'}))
      ),
      h('div',{className:'tw'},h('table',null,
        h('thead',null,h('tr',null,...['Thời gian','Nhân viên','Hình thức','Ngày nghỉ','Lý do','Trạng thái',''].map(c=>h('th',{key:c},c)))),
        h('tbody',null,rows.length?rows.map(r=>h('tr',{key:r.id},
          h('td',null,vnDateFromISO(r.fromDate)+' - '+vnDateFromISO(r.toDate)),
          h('td',null,h('div',{style:{fontWeight:500}},r.empName),h('div',{style:{fontSize:11,color:'var(--tx2)'}},r.empId+' • '+(r.dept||''))),
          h('td',null,typeLabel[r.type]||r.type),
          h('td',null,h('div',{style:{fontWeight:600}},numFmt(r.days||0)+' ngày'),r.status==='approved'&&h('div',{style:{fontSize:11,color:'var(--tx2)'}},'Duyệt: '+numFmt((r.approvedDays??r.days)||0)+' ngày')),
          h('td',null,h('div',null,r.reason),r.reviewNote&&h('div',{style:{fontSize:11,color:r.status==='rejected'?'#A32D2D':'#185FA5',maxWidth:220,marginTop:3}},'QL: '+r.reviewNote)),
          h('td',null,h('span',{className:'badge',style:{background:r.status==='approved'?'#EAF3DE':r.status==='rejected'?'#FCEBEB':'#FAEEDA',color:r.status==='approved'?'#3B6D11':r.status==='rejected'?'#A32D2D':'#854F0B'}},r.status==='approved'?'Đã duyệt':r.status==='rejected'?'Từ chối':'Chờ duyệt')),
          h('td',null,h('div',{style:{display:'flex',gap:4}},
            canManage&&r.status==='pending'&&h('button',{style:{fontSize:11,padding:'4px 8px'},onClick:()=>setReview({...r,status:'approved'})},'Duyệt'),
            canManage&&r.status==='pending'&&h('button',{style:{fontSize:11,padding:'4px 8px',color:'#A32D2D',borderColor:'#F7C1C1'},onClick:()=>setReview({...r,status:'rejected'})},'Từ chối'),
            h('button',{className:'bi',onClick:()=>{setEdit(r);setModal(true);}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
            canManage&&h('button',{className:'bdel',onClick:()=>window.scfConfirm('Bạn có chắc muốn xóa đơn nghỉ này?','Xóa đơn nghỉ',true).then(ok=>{if(ok){setLeaves(p=>p.filter(x=>x.id!==r.id));window.showToast('Đã xóa đơn nghỉ','success');}})},'Xóa')
          ))
        )):h('tr',null,h('td',{colSpan:7,className:'empty-st'},'Chưa có đơn xin nghỉ.')))
      )),
      modal&&h(LeaveForm,{record:edit,employees,currentUser,onSave:save,onClose:()=>{setModal(false);setEdit(null);}}),
      review&&h(LeaveReviewModal,{record:review,currentUser,onSave:reviewSave,onClose:()=>setReview(null)})
    )
  );
}

/* ═══════════ GIAI ĐOẠN 3: BÁN HÀNG ═══════════ */
