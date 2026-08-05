/* ─── PHASE 1 COMPONENTS (reused) ─── */
function SunsetScene(){
  return h('div',{className:'scene'},
    h('svg',{viewBox:'0 0 400 260',xmlns:'http://www.w3.org/2000/svg',style:{display:'block',width:'100%'}},
      h('defs',null,
        h('linearGradient',{id:'sky',x1:'0',y1:'0',x2:'0',y2:'1'},
          h('stop',{offset:'0%',stopColor:'#0f3460'}),h('stop',{offset:'40%',stopColor:'#533483'}),
          h('stop',{offset:'70%',stopColor:'#e94560'}),h('stop',{offset:'100%',stopColor:'#ff6b35'})
        ),
        h('linearGradient',{id:'rv',x1:'0',y1:'0',x2:'0',y2:'1'},
          h('stop',{offset:'0%',stopColor:'#ff6b35',stopOpacity:'.6'}),h('stop',{offset:'100%',stopColor:'#533483',stopOpacity:'.4'})
        ),
        h('radialGradient',{id:'sun',cx:'50%',cy:'50%',r:'50%'},
          h('stop',{offset:'0%',stopColor:'#fff9c4'}),h('stop',{offset:'40%',stopColor:'#ffcc02'}),h('stop',{offset:'100%',stopColor:'#ff6b35',stopOpacity:'0'})
        )
      ),
      h('rect',{x:0,y:0,width:400,height:260,fill:'url(#sky)'}),
      h('circle',{cx:200,cy:178,r:40,fill:'url(#sun)'}),
      h('path',{d:'M0 200 Q50 188 100 196 Q150 205 200 192 Q250 178 300 190 Q350 200 400 186 L400 260 L0 260Z',fill:'#1a2e22'}),
      h('path',{d:'M0 218 Q80 202 160 212 Q240 222 320 207 Q360 200 400 210 L400 260 L0 260Z',fill:'#0f1f15'}),
      h('rect',{x:0,y:226,width:400,height:34,fill:'url(#rv)'}),
      h('path',{d:'M150 200 L154 162 L157 200Z',fill:'#0d1f13'}),h('ellipse',{cx:154,cy:160,rx:11,ry:17,fill:'#1a3a1a'}),
      h('path',{d:'M222 200 L226 172 L229 200Z',fill:'#0d1f13'}),h('ellipse',{cx:226,cy:170,rx:9,ry:13,fill:'#1a3a1a'}),
      h('path',{d:'M312 200 L316 176 L319 200Z',fill:'#0d1f13'}),h('ellipse',{cx:316,cy:174,rx:8,ry:11,fill:'#1a3a1a'}),
      h('circle',{cx:80,cy:42,r:1.5,fill:'white',opacity:.7}),h('circle',{cx:320,cy:36,r:1.8,fill:'white',opacity:.8}),
      h('text',{x:200,y:246,textAnchor:'middle',fill:'rgba(255,200,100,.55)',fontSize:9,fontStyle:'italic'},W_CITY)
    ),
    h('div',{style:{padding:'9px 16px',borderTop:'.5px solid var(--bd)',fontSize:12,color:'var(--tx2)',textAlign:'center'}},'🌅 Chúc bạn một ngày làm việc hiệu quả!')
  );
}
function BirthdayScene({name}){
  const ref=useRef(null);
  useEffect(()=>{
    const c=ref.current;if(!c)return;
    const ctx=c.getContext('2d');c.width=c.offsetWidth;c.height=260;
    const W=c.width,H=c.height;const pts=[];
    const colors=['#f8c30f','#ff6b35','#e94560','#52b788','#93c5fd','#fff','#f472b6'];
    function mkFw(x,y){for(let i=0;i<55;i++){const a=(i/55)*Math.PI*2,sp=2+Math.random()*4;pts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,life:1,color:colors[i%colors.length],sz:1.5+Math.random()*2});}}
    const lps=[{x:W*.25,y:H*.3},{x:W*.5,y:H*.18},{x:W*.75,y:H*.32},{x:W*.4,y:H*.22},{x:W*.6,y:H*.12}];
    let li=0,fr=0;
    const loop=()=>{fr++;ctx.fillStyle='rgba(10,20,15,.13)';ctx.fillRect(0,0,W,H);
      if(fr%30===0&&li<lps.length){mkFw(lps[li].x,lps[li].y);li++;}
      if(li>=lps.length&&fr%55===0){li=0;pts.length=0;}
      for(let i=pts.length-1;i>=0;i--){const p=pts[i];p.x+=p.vx;p.y+=p.vy;p.vy+=.05;p.life-=.018;if(p.life<=0){pts.splice(i,1);continue;}ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.sz,0,Math.PI*2);ctx.fill();}
      ctx.globalAlpha=1;ctx.fillStyle='rgba(248,195,15,.92)';ctx.font='bold 17px sans-serif';ctx.textAlign='center';
      ctx.fillText('🎂 Chúc mừng sinh nhật '+name+'! 🎉',W/2,H-18);requestAnimationFrame(loop);};
    const t=setInterval(()=>{if(li<lps.length){mkFw(lps[li].x,lps[li].y);li++;}},500);
    loop();return()=>clearInterval(t);
  },[]);
  return h('div',{className:'scene'},h('canvas',{ref,style:{display:'block',width:'100%',height:260,background:'#0a140f'}}));
}
function BirthdayVisual({name,effect='fireworks'}){
  if(effect==='fireworks')return h(BirthdayScene,{name});
  if(effect==='none')return null;
  return h('div',{className:'scene birthday-visual '+effect},
    effect==='balloons'&&h('div',{className:'birthday-balloons','aria-hidden':'true'},
      ['🎈','🎈','🎉','🎊','🎈','✨','🎈'].map((icon,index)=>h('span',{key:index,style:{'--i':index}},icon))
    ),
    effect==='cake'&&h('div',{className:'birthday-cake','aria-hidden':'true'},
      h('div',{className:'birthday-candle'},'🕯️'),
      h('div',{className:'birthday-cake-icon'},'🎂')
    ),
    h('div',{className:'birthday-visual-text'},'Chúc mừng sinh nhật ',name,'!')
  );
}
function WeatherWidget(){
  const[w,sw]=useState(null);const[fc,sf]=useState([]);const[ld,sl]=useState(true);
  useEffect(()=>{
    fetch('https://api.open-meteo.com/v1/forecast?latitude='+W_LAT+'&longitude='+W_LON+'&current=temperature_2m,weather_code,relative_humidity_2m,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=3&timezone=Asia%2FBangkok')
      .then(r=>r.json()).then(d=>{
        sw(d.current||null);
        const days=((d.daily&&d.daily.time)||[]).slice(1,3).map((dt,i)=>({
          date:dt,
          code:(d.daily.weather_code||[])[i+1],
          max:(d.daily.temperature_2m_max||[])[i+1],
          min:(d.daily.temperature_2m_min||[])[i+1]
        }));
        sf(days);
      }).catch(()=>{sw(null);sf([]);}).finally(()=>sl(false));
  },[]);
  const WC2={0:['ti-sun','Trời quang','#f8c30f'],1:['ti-cloud','Ít mây','#93c5fd'],2:['ti-cloud','Có mây','#94a3b8'],3:['ti-cloud','Nhiều mây','#64748b'],45:['ti-mist','Sương mù','#94a3b8'],51:['ti-cloud-rain','Mưa phùn','#60a5fa'],61:['ti-cloud-rain','Mưa nhẹ','#60a5fa'],63:['ti-cloud-rain','Mưa','#3b82f6'],65:['ti-cloud-rain','Mưa to','#1d4ed8'],80:['ti-cloud-rain','Mưa rào','#3b82f6'],95:['ti-cloud-storm','Dông','#6d28d9']};
  const inf=w?(WC2[w.weather_code]||WC2[Math.floor(w.weather_code/10)*10]||WC2[0]):null;
  return h('div',{className:'weather-card'},
    h('div',{className:'weather-current-card',style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap'}},
      h('div',{style:{minWidth:220,flex:1}},
        h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},h('i',{className:'ti ti-map-pin',style:{fontSize:11,marginRight:3}}),W_CITY),
        h('div',{style:{fontSize:12,color:'var(--tx2)',marginBottom:6}},'Hôm nay'),
        ld?h('div',{style:{fontSize:26,color:'var(--tx2)'}},'...')
        :w?h('div',{style:{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}},
          h('span',{style:{fontSize:40,fontWeight:300,color:'var(--pri)'}},w.temperature_2m+'°'),
          h('i',{className:'ti '+(inf?inf[0]:'ti-sun'),style:{fontSize:34,color:inf?inf[2]:'#f8c30f'}}),
          h('div',null,
            h('div',{style:{fontSize:14,fontWeight:600,color:'var(--pri3)'}},inf?inf[1]:''),
            h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:2}},h('i',{className:'ti ti-droplet',style:{fontSize:12,marginRight:3}}),w.relative_humidity_2m+'% · ',h('i',{className:'ti ti-wind',style:{fontSize:12,marginRight:3,marginLeft:6}}),w.wind_speed_10m+' km/h')
          )
        ):h('span',{style:{color:'var(--tx2)',fontSize:13}},'Không có dữ liệu')
      )
    ),
    fc.length?h('div',{className:'weather-three-wrap',style:{marginTop:10,display:'grid',gridTemplateColumns:'1fr',gap:10}},
      fc.map((d,i)=>{
        const f=WC2[d.code]||WC2[Math.floor((d.code||0)/10)*10]||WC2[0];
        const dt=new Date(d.date+'T00:00:00');
        const dayLabel=dt.toLocaleDateString('vi-VN',{weekday:'long'});
        return h('div',{key:i,style:{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'11px 12px',border:'1px solid var(--bd)',borderRadius:12,background:'linear-gradient(135deg,#fbfdfb,#f2f8f4)'}},
          h('div',{style:{display:'flex',alignItems:'center',gap:10}},
            h('i',{className:'ti '+f[0],style:{fontSize:28,color:f[2],minWidth:28,textAlign:'center'}}),
            h('div',null,
              h('div',{style:{fontSize:12,color:'var(--tx2)'}},dayLabel),
              h('div',{style:{fontSize:13,fontWeight:600,color:'var(--pri3)'}},f[1])
            )
          ),
          h('div',{style:{textAlign:'right'}},
            h('div',{style:{fontSize:18,fontWeight:600,color:'var(--pri)'}},Math.round(d.max)+'°'),
            h('div',{style:{fontSize:11,color:'var(--tx2)'}},Math.round(d.min)+'°')
          )
        );
      })
    ):null
  );
}
function CalendarWidget(){
  const[cur,sc]=useState(()=>new Date());const today=new Date();
  const y=cur.getFullYear(),m=cur.getMonth();
  const first=(new Date(y,m,1).getDay()+6)%7;const days=new Date(y,m+1,0).getDate();
  const mnVN=['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6','Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  const cells=[];for(let i=0;i<first;i++)cells.push(null);for(let d=1;d<=days;d++)cells.push(d);
  return h('div',{className:'cal-card'},
    h('div',{className:'cal-hd'},
      h('button',{className:'bi',onClick:()=>sc(new Date(y,m-1,1))},h('i',{className:'ti ti-chevron-left',style:{fontSize:14}})),
      h('span',{style:{fontWeight:500,fontSize:13}},mnVN[m]+' '+y),
      h('button',{className:'bi',onClick:()=>sc(new Date(y,m+1,1))},h('i',{className:'ti ti-chevron-right',style:{fontSize:14}}))
    ),
    h('div',{className:'cal-grid'},
      ['T2','T3','T4','T5','T6','T7','CN'].map(d=>h('div',{key:d,className:'cal-dhd'},d)),
      cells.map((d,i)=>{const isT=d&&d===today.getDate()&&m===today.getMonth()&&y===today.getFullYear();return h('div',{key:i,className:'cal-d'+(isT?' today':'')+(d===null?' dim':'')},d||'');})
    )
  );
}
function CommunityPanel({emp,news=[],setNews,messages=[],setMessages,onRefresh}){
  const[tab,setTab]=useState('news');
  const[text,setText]=useState('');
  const[showEmoji,setShowEmoji]=useState(false);
  const emojiOptions=['😀','😄','😁','😂','😊','😍','🥰','😎','🤔','😮','😢','😭','😡','👍','👎','👏','🙏','👌','✅','❤️','🎉','🎂','💪','📌','📣','🚚','📦','☕'];
  const deptKey=String(emp?.dept||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const canPostNews=['admin','manager'].includes(emp?.role)||deptKey.includes('ke toan');
  const canDeleteMessages=emp?.role==='admin';
  const canDeleteNews=emp?.role==='admin';
  useEffect(()=>{
    if(!onRefresh)return;
    const timer=setInterval(()=>onRefresh().catch(()=>{}),7000);
    return()=>clearInterval(timer);
  },[onRefresh]);
  const formatTime=value=>{
    const date=new Date(value);
    if(Number.isNaN(date.getTime()))return '';
    return date.toLocaleString('vi-VN',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'});
  };
  const send=()=>{
    const content=String(text||'').trim();
    if(!content)return;
    const item={id:'COM'+uid(),content,authorId:emp?.id||'',authorName:emp?.name||'Nhân viên',createdAt:new Date().toISOString()};
    if(tab==='news'){
      if(!canPostNews)return;
      setNews(prev=>[item,...(prev||[])].slice(0,100));
    }else{
      setMessages(prev=>[...(prev||[]),item].slice(-300));
    }
    setText('');
    setShowEmoji(false);
  };
  const removeMessage=async item=>{
    if(!canDeleteMessages||!item)return;
    const message='Bạn có chắc muốn xóa tin nhắn này?';
    const ok=window.scfConfirm
      ?await window.scfConfirm(message,'Xóa tin nhắn',true)
      :window.confirm(message);
    if(!ok)return;
    setMessages(prev=>(prev||[]).filter(row=>String(row.id)!==String(item.id)));
  };
  const removeNews=async item=>{
    if(!canDeleteNews||!item)return;
    const message='Bạn có chắc muốn xóa tin tức này?';
    const ok=window.scfConfirm
      ?await window.scfConfirm(message,'Xóa tin tức',true)
      :window.confirm(message);
    if(!ok)return;
    setNews(prev=>(prev||[]).filter(row=>String(row.id)!==String(item.id)));
  };
  const rows=tab==='news'?[...(news||[])].sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||''))):
    [...(messages||[])].sort((a,b)=>String(a.createdAt||'').localeCompare(String(b.createdAt||''))).slice(-80);
  return h('div',{className:'card',style:{padding:0,overflow:'hidden',marginTop:18}},
    h('div',{style:{display:'flex',alignItems:'center',gap:6,padding:'10px 12px',borderBottom:'1px solid var(--bd)',background:'var(--bg2)'}},
      h('button',{type:'button',className:tab==='news'?'bp':'',onClick:()=>{setTab('news');setText('');setShowEmoji(false);},style:{padding:'7px 12px'}},
        h('i',{className:'ti ti-news',style:{fontSize:15}}),'Tin tức'
      ),
      h('button',{type:'button',className:tab==='chat'?'bp':'',onClick:()=>{setTab('chat');setText('');setShowEmoji(false);},style:{padding:'7px 12px'}},
        h('i',{className:'ti ti-messages',style:{fontSize:15}}),'Tin nhắn nội bộ'
      ),
      h('button',{type:'button',onClick:()=>onRefresh&&onRefresh(),title:'Làm mới',style:{marginLeft:'auto',padding:'6px 9px'}},
        h('i',{className:'ti ti-refresh',style:{fontSize:14}})
      )
    ),
    h('div',{style:{maxHeight:360,overflowY:'auto',padding:'10px 12px',background:'#fff'}},
      rows.length?rows.map(item=>h('div',{key:item.id,style:{padding:'9px 10px',marginBottom:7,border:'1px solid var(--bd)',borderRadius:'var(--r)',background:tab==='news'?'#FFFDF2':(String(item.authorId)===String(emp?.id)?'#EAF3DE':'#F8FAF9')}},
        h('div',{style:{display:'flex',justifyContent:'space-between',gap:10,marginBottom:4}},
          h('strong',{style:{fontSize:12,color:'var(--pri3)'}},item.authorName||'Nhân viên'),
          h('div',{style:{display:'flex',alignItems:'center',gap:7}},
            h('span',{style:{fontSize:10,color:'var(--tx2)',whiteSpace:'nowrap'}},formatTime(item.createdAt)),
            ((tab==='chat'&&canDeleteMessages)||(tab==='news'&&canDeleteNews))&&h('button',{
              type:'button',
              className:'bi',
              title:tab==='news'?'Xóa tin tức':'Xóa tin nhắn',
              onClick:()=>tab==='news'?removeNews(item):removeMessage(item),
              style:{padding:3,color:'var(--danger)'}
            },h('i',{className:'ti ti-trash',style:{fontSize:14}}))
          )
        ),
        h('div',{style:{fontSize:13,whiteSpace:'pre-wrap',overflowWrap:'anywhere'}},item.content)
      )):h('div',{style:{padding:'24px 10px',textAlign:'center',color:'var(--tx2)',fontSize:13}},
        tab==='news'?'Chưa có tin tức nội bộ.':'Chưa có tin nhắn. Hãy bắt đầu trao đổi công việc.'
      )
    ),
    (tab==='chat'||canPostNews)&&h('div',{style:{display:'flex',gap:8,padding:'10px 12px',borderTop:'1px solid var(--bd)',background:'var(--card)',position:'relative'}},
      tab==='chat'&&h('button',{
        type:'button',
        onClick:()=>setShowEmoji(value=>!value),
        title:'Chọn biểu tượng cảm xúc',
        style:{alignSelf:'stretch',padding:'8px 11px',fontSize:21}
      },'😊'),
      tab==='chat'&&showEmoji&&h('div',{className:'internal-emoji-picker'},
        emojiOptions.map(emoji=>h('button',{
          key:emoji,
          type:'button',
          onClick:()=>{setText(value=>value+emoji);setShowEmoji(false);},
          title:'Thêm '+emoji
        },emoji))
      ),
      h('textarea',{value:text,onChange:e=>setText(e.target.value),onKeyDown:e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send();}},rows:2,placeholder:tab==='news'?'Nhập nội dung tin tức...':'Nhập tin nhắn công việc...',style:{flex:1,minHeight:42,resize:'vertical'}}),
      h('button',{type:'button',className:'bp',onClick:send,disabled:!String(text||'').trim(),style:{alignSelf:'stretch',padding:'8px 16px'}},
        h('i',{className:'ti ti-send',style:{fontSize:15}}),tab==='news'?'Đăng tin':'Gửi'
      )
    )
  );
}
function ProcessPostsTab({page,title,icon,items=[],setItems,currentUser}){
  const empty=()=>({id:'',category:page,title:'',publishDate:new Date().toISOString().slice(0,10),content:'',images:[]});
  const[form,setForm]=useState(empty);
  const[open,setOpen]=useState(false);
  const[viewImage,setViewImage]=useState('');
  const[uploading,setUploading]=useState(false);
  const[query,setQuery]=useState('');
  const role=String(currentUser?.role||'').toLowerCase();
  const explicitLevel=currentUser?.permLevels?.[page]||'r';
  const canManage=['admin','administrator','manager'].includes(role)||['rw','rwd'].includes(explicitLevel);
  const canRemove=['admin','administrator'].includes(role)&&canDel(currentUser?.role,page,currentUser?.permLevels);
  const rows=[...(items||[])].filter(item=>item.category===page).filter(item=>{
    const q=String(query||'').trim().toLowerCase();
    return !q||(String(item.title||'')+' '+String(item.content||'')+' '+String(item.authorName||'')).toLowerCase().includes(q);
  }).sort((a,b)=>String(b.publishDate||b.createdAt||'').localeCompare(String(a.publishDate||a.createdAt||'')));
  const openCreate=()=>{setForm(empty());setOpen(true);};
  const openEdit=item=>{setForm({...item,images:[...(item.images||[])]});setOpen(true);};
  const addImages=async files=>{
    const picked=[...(files||[])].filter(Boolean);
    if(!picked.length)return;
    setUploading(true);
    try{
      const next=[];
      for(const file of picked)next.push(await uploadPhoto(file,'process-posts',{max:1400,quality:.76}));
      setForm(prev=>({...prev,images:[...(prev.images||[]),...next]}));
    }catch(err){window.showToast('Không đọc được ảnh. Vui lòng chọn lại.','warn');}
    finally{setUploading(false);}
  };
  const save=()=>{
    const postTitle=String(form.title||'').trim();
    const postContent=String(form.content||'').trim();
    if(!form.publishDate||!postTitle||!postContent){window.showToast('Vui lòng nhập ngày đăng, tiêu đề và nội dung quy trình.','warn');return;}
    const now=new Date().toISOString();
    if(form.id){
      setItems(prev=>(prev||[]).map(row=>row.id===form.id?{...row,...form,category:page,title:postTitle,content:postContent,updatedAt:now,updatedBy:currentUser?.name||''}:row));
    }else{
      setItems(prev=>[{...form,id:'PP'+uid(),category:page,title:postTitle,content:postContent,authorId:currentUser?.id||'',authorName:currentUser?.name||'Người đăng',createdAt:now,updatedAt:now},...(prev||[])]);
    }
    setOpen(false);
    window.showToast(form.id?'Đã cập nhật bài đăng quy trình.':'Đã đăng bài quy trình.','success');
  };
  const remove=async item=>{
    const ok=window.scfConfirm?await window.scfConfirm('Bạn có chắc muốn xóa bài đăng “'+item.title+'”?','Xóa bài đăng',true):window.confirm('Bạn có chắc muốn xóa bài đăng này?');
    if(!ok)return;
    setItems(prev=>(prev||[]).filter(row=>row.id!==item.id));
    window.showToast('Đã xóa bài đăng quy trình.','success');
  };
  const dateLabel=value=>{
    const parts=String(value||'').split('-');
    return parts.length===3?[parts[2],parts[1],parts[0]].join('/'):value||'';
  };
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti '+(icon||'ti-news'),style:{fontSize:20}}),title),
    h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,marginBottom:14,flexWrap:'wrap'}},
      h(SearchBar,{value:query,onChange:setQuery,placeholder:'Tìm bài đăng quy trình...'}),
      canManage&&h('button',{type:'button',className:'bp','data-scf-action':'write',onClick:openCreate},h('i',{className:'ti ti-plus'}),' Đăng bài')
    ),
    rows.length?h('div',{className:'delivery-rule-list'},rows.map(item=>h('article',{key:item.id,className:'card delivery-rule-card'},
      h('div',{className:'delivery-rule-head'},
        h('div',null,
          h('h3',{style:{fontSize:17,color:'var(--pri3)',margin:'0 0 7px'}},item.title),
          h('div',{className:'delivery-rule-date'},h('i',{className:'ti ti-calendar'}),' Ngày đăng: ',dateLabel(item.publishDate)),
          h('div',{className:'delivery-rule-author'},'Người đăng: '+(item.authorName||'—')+(item.updatedAt&&item.updatedAt!==item.createdAt?' · Đã cập nhật':''))
        ),
        canManage&&h('div',{style:{display:'flex',gap:6}},
          h('button',{type:'button',className:'bi','data-scf-action':'write',title:'Sửa bài đăng',onClick:()=>openEdit(item)},h('i',{className:'ti ti-edit'})),
          canRemove&&h('button',{type:'button',className:'bi','data-scf-action':'delete',title:'Xóa bài đăng',onClick:()=>remove(item),style:{color:'var(--danger)'}},h('i',{className:'ti ti-trash'}))
        )
      ),
      h('div',{className:'delivery-rule-content',style:{whiteSpace:'pre-wrap'}},item.content),
      !!(item.images||[]).length&&h('div',{className:'delivery-rule-images'},(item.images||[]).map((src,index)=>h('button',{type:'button',key:index,className:'delivery-rule-image',onClick:()=>setViewImage(src)},h('img',{src,alt:'Ảnh bài đăng '+(index+1)}))))
    ))):h('div',{className:'empty'},h('i',{className:'ti ti-news'}),h('div',null,query?'Không tìm thấy bài đăng phù hợp.':'Chưa có bài đăng quy trình nào.')),
    open&&h(Modal,{title:form.id?'Sửa bài đăng quy trình':'Đăng bài quy trình',lg:true,onClose:()=>setOpen(false)},
      h('div',{className:'form-grid'},
        h(F,{label:'Ngày đăng *'},h('input',{type:'date',value:form.publishDate||'',onChange:e=>setForm(prev=>({...prev,publishDate:e.target.value}))})),
        h(F,{label:'Tiêu đề *',full:true},h('input',{value:form.title||'',placeholder:'Nhập tiêu đề bài đăng...',onChange:e=>setForm(prev=>({...prev,title:e.target.value}))})),
        h(F,{label:'Nội dung quy trình *',full:true},h('textarea',{rows:12,value:form.content||'',placeholder:'Nhập nội dung, các bước thực hiện, lưu ý...',onChange:e=>setForm(prev=>({...prev,content:e.target.value}))})),
        h(F,{label:'Hình ảnh minh họa',full:true},
          h('div',null,
            h('label',{className:'btn',style:{display:'inline-flex',cursor:'pointer'}},h('i',{className:'ti ti-photo-plus'}),uploading?' Đang xử lý ảnh...':' Chọn ảnh',h('input',{type:'file',accept:'image/*',multiple:true,disabled:uploading,onChange:e=>addImages(e.target.files),style:{display:'none'}})),
            !!(form.images||[]).length&&h('div',{className:'delivery-rule-images edit'},(form.images||[]).map((src,index)=>h('div',{key:index,className:'delivery-rule-image-wrap'},h('img',{src,alt:'Ảnh '+(index+1)}),h('button',{type:'button',className:'bi',title:'Bỏ ảnh',onClick:()=>setForm(prev=>({...prev,images:prev.images.filter((_,i)=>i!==index)}))},h('i',{className:'ti ti-x'})))))
          )
        )
      ),
      h('div',{className:'modal-actions'},h('button',{type:'button',onClick:()=>setOpen(false)},'Hủy'),h('button',{type:'button',className:'bp','data-scf-action':'write',disabled:uploading,onClick:save},h('i',{className:'ti ti-send'}),form.id?' Cập nhật':' Đăng bài'))
    ),
    viewImage&&h('div',{className:'delivery-rule-lightbox',onClick:()=>setViewImage('')},h('button',{type:'button',className:'delivery-rule-lightbox-close',onClick:()=>setViewImage('')},'×'),h('img',{src:viewImage,alt:'Xem ảnh bài đăng',onClick:e=>e.stopPropagation()}))
  );
}
function DeliveryRulesTab({items=[],setItems,currentUser}){
  const empty=()=>({id:'',publishDate:new Date().toISOString().slice(0,10),content:'',images:[]});
  const[form,setForm]=useState(empty);
  const[open,setOpen]=useState(false);
  const[viewImage,setViewImage]=useState('');
  const[uploading,setUploading]=useState(false);
  const deptKey=String(currentUser?.dept||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const canManage=currentUser?.role==='admin'||deptKey.includes('ke toan');
  const isAdmin=currentUser?.role==='admin';
  const sorted=[...(items||[])].sort((a,b)=>String(b.publishDate||b.createdAt||'').localeCompare(String(a.publishDate||a.createdAt||'')));
  const openCreate=()=>{setForm(empty());setOpen(true);};
  const openEdit=item=>{setForm({...item,images:[...(item.images||[])]});setOpen(true);};
  const addImages=async files=>{
    const picked=[...(files||[])].filter(Boolean);
    if(!picked.length)return;
    setUploading(true);
    try{
      const next=[];
      for(const file of picked)next.push(await uploadPhoto(file,'delivery-rules',{max:1100,quality:.7}));
      setForm(prev=>({...prev,images:[...(prev.images||[]),...next]}));
    }catch(err){window.showToast('Không đọc được ảnh. Vui lòng chọn lại.','warn');}
    finally{setUploading(false);}
  };
  const save=()=>{
    const content=String(form.content||'').trim();
    if(!form.publishDate||!content){window.showToast('Vui lòng nhập ngày đăng và nội dung quy định.','warn');return;}
    const now=new Date().toISOString();
    if(form.id){
      setItems(prev=>(prev||[]).map(row=>row.id===form.id?{...row,...form,content,updatedAt:now}:row));
    }else{
      setItems(prev=>[{...form,id:'DR'+uid(),content,authorId:currentUser?.id||'',authorName:currentUser?.name||'Quản trị',createdAt:now,updatedAt:now},...(prev||[])]);
    }
    setOpen(false);
  };
  const remove=async item=>{
    const ok=window.scfConfirm?await window.scfConfirm('Bạn có chắc muốn xóa quy định này?','Xóa quy định',true):window.confirm('Bạn có chắc muốn xóa quy định này?');
    if(ok)setItems(prev=>(prev||[]).filter(row=>row.id!==item.id));
  };
  const dateLabel=value=>{
    const parts=String(value||'').split('-');
    return parts.length===3?parts.reverse().join('/'):value||'';
  };
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-clipboard-text',style:{fontSize:20}}),'Quy định giao hàng'),
    h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:14,flexWrap:'wrap'}},
      h('div',{style:{color:'var(--tx2)',fontSize:13}},'Thông báo các quy định giao hàng mới nhất đến nhân viên.'),
      canManage&&h('button',{type:'button',className:'bp',onClick:openCreate},h('i',{className:'ti ti-plus'}),' Đăng quy định')
    ),
    sorted.length?h('div',{className:'delivery-rule-list'},sorted.map(item=>h('article',{key:item.id,className:'card delivery-rule-card'},
      h('div',{className:'delivery-rule-head'},
        h('div',null,
          h('div',{className:'delivery-rule-date'},h('i',{className:'ti ti-calendar'}),' Ngày đăng: ',dateLabel(item.publishDate)),
          item.authorName&&h('div',{className:'delivery-rule-author'},'Người đăng: '+item.authorName)
        ),
        canManage&&h('div',{style:{display:'flex',gap:6}},
          h('button',{type:'button',className:'bi',title:'Sửa',onClick:()=>openEdit(item)},h('i',{className:'ti ti-edit'})),
          isAdmin&&h('button',{type:'button',className:'bi',title:'Xóa',onClick:()=>remove(item),style:{color:'var(--danger)'}},h('i',{className:'ti ti-trash'}))
        )
      ),
      h('div',{className:'delivery-rule-content'},item.content),
      !!(item.images||[]).length&&h('div',{className:'delivery-rule-images'},(item.images||[]).map((src,index)=>h('button',{type:'button',key:index,className:'delivery-rule-image',onClick:()=>setViewImage(src)},h('img',{src,alt:'Ảnh quy định '+(index+1)}))))
    ))):h('div',{className:'empty'},h('i',{className:'ti ti-clipboard-text'}),h('div',null,'Chưa có quy định giao hàng nào.')),
    open&&h(Modal,{title:form.id?'Sửa quy định giao hàng':'Đăng quy định giao hàng',lg:true,onClose:()=>setOpen(false)},
      h('div',{className:'form-grid'},
        h(F,{label:'Ngày đăng *'},h('input',{type:'date',value:form.publishDate||'',onChange:e=>setForm(prev=>({...prev,publishDate:e.target.value}))})),
        h(F,{label:'Nội dung *',full:true},h('textarea',{rows:7,value:form.content||'',placeholder:'Nhập nội dung quy định giao hàng...',onChange:e=>setForm(prev=>({...prev,content:e.target.value}))})),
        h(F,{label:'Hình ảnh',full:true},
          h('div',null,
            h('label',{className:'btn',style:{display:'inline-flex',cursor:'pointer'}},h('i',{className:'ti ti-photo-plus'}),uploading?' Đang xử lý ảnh...':' Chọn ảnh',h('input',{type:'file',accept:'image/*',multiple:true,disabled:uploading,onChange:e=>addImages(e.target.files),style:{display:'none'}})),
            !!(form.images||[]).length&&h('div',{className:'delivery-rule-images edit'},
              (form.images||[]).map((src,index)=>h('div',{key:index,className:'delivery-rule-image-wrap'},
                h('img',{src,alt:'Ảnh '+(index+1)}),
                h('button',{type:'button',className:'bi',title:'Bỏ ảnh',onClick:()=>setForm(prev=>({...prev,images:prev.images.filter((_,i)=>i!==index)}))},h('i',{className:'ti ti-x'}))
              ))
            )
          )
        )
      ),
      h('div',{className:'modal-actions'},h('button',{type:'button',onClick:()=>setOpen(false)},'Hủy'),h('button',{type:'button',className:'bp',disabled:uploading,onClick:save},h('i',{className:'ti ti-device-floppy'}),' Lưu quy định'))
    ),
    viewImage&&h('div',{className:'delivery-rule-lightbox',onClick:()=>setViewImage('')},h('button',{type:'button',className:'delivery-rule-lightbox-close',onClick:()=>setViewImage('')},'×'),h('img',{src:viewImage,alt:'Xem ảnh quy định',onClick:e=>e.stopPropagation()}))
  );
}

function WelcomePage({emp,employees=[],company,uiSettings,news,setNews,messages,setMessages,onRefresh}){
  const birthdayEmployees=(employees||[]).filter(person=>person&&person.name&&isBirthday(person.birthday));
  const birthdayNames=birthdayEmployees.map(person=>person.name).join(', ');
  const hasBirthday=birthdayEmployees.length>0;
  const bd=isBirthday(emp&&emp.birthday);
  const now=new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
  const gr=greeting();
  const dayNames=['Chủ nhật','Thứ hai','Thứ ba','Thứ tư','Thứ năm','Thứ sáu','Thứ bảy'];
  const dayStr=dayNames[new Date().getDay()]+', '+fmtDate();
  const firstName=(emp&&emp.name||'bạn').split(' ').pop();
  return h('div',null,
    h('div',{className:'greet'},
      h('div',{style:{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:8}},
        h('div',null,
          h('div',{style:{fontSize:20,fontWeight:600,marginBottom:6}},gr+', '+firstName+'! '+(bd?'🎂':'👋')),
          h('div',{style:{fontSize:13,opacity:.85}},
            bd?'Hôm nay là sinh nhật của bạn! Chúc mừng sinh nhật thật vui vẻ! 🎉':'Chúc bạn một ngày làm việc thật hiệu quả!')
        ),
        h('div',{style:{textAlign:'right',fontSize:12,opacity:.8}},
          h('div',null,h('i',{className:'ti ti-calendar',style:{fontSize:12,marginRight:4}}),dayStr),
          h('div',{style:{marginTop:3}},h('i',{className:'ti ti-clock',style:{fontSize:12,marginRight:4}}),now)
        )
      ),
      hasBirthday&&h('div',{className:'birthday-announcement'},
        h('span',{className:'birthday-party-icon'},'🎉'),
        h('div',null,
          h('div',{style:{fontWeight:700,fontSize:16}},'🎂 Chúc mừng sinh nhật '+birthdayNames+'!'),
          h('div',{style:{fontSize:12,opacity:.9,marginTop:2}},'Chúc bạn tuổi mới nhiều sức khỏe, niềm vui và thành công!')
        ),
        h('span',{className:'birthday-party-icon'},'🎊')
      )
    ),
    h('div',{className:'welcome-grid'+(hasBirthday?'':' weather-only')},
      h('div',null,h(WeatherWidget,null)),
      hasBirthday&&h(BirthdayVisual,{name:birthdayNames,effect:normalizeUiSettings(uiSettings).birthdayEffect})
    ),
    h(CommunityPanel,{emp,news,setNews,messages,setMessages,onRefresh})
  );
}
function CompanySettings({company,setCompany}){
  const[f,sf]=useState({...company});
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-building',style:{fontSize:20}}),'Thông tin công ty'),
    h('div',{className:'card',style:{maxWidth:620}},
      h('div',{style:{display:'flex',alignItems:'center',gap:16,marginBottom:'1.5rem',padding:'1rem',background:'var(--bg2)',borderRadius:'var(--r)'}},
        h('img',{src:LOGO_SRC,style:{width:56,height:56,objectFit:'contain'}}),
        h('div',null,h('div',{style:{fontWeight:600,fontSize:15}},f.name||'Tên công ty'),h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:2}},'Logo công ty SCF'))
      ),
      h(F,{label:'Tên công ty'},h('input',{value:f.name,onChange:e=>sf(p=>({...p,name:e.target.value}))})),
      h(F,{label:'Giới thiệu'},h('textarea',{value:f.intro,onChange:e=>sf(p=>({...p,intro:e.target.value})),rows:3})),
      h('div',{className:'g2'},
        h(F,{label:'Điện thoại'},h('input',{value:f.phone,onChange:e=>sf(p=>({...p,phone:e.target.value}))})),
        h(F,{label:'Email'},h('input',{value:f.email,onChange:e=>sf(p=>({...p,email:e.target.value}))})),
      ),
      h(F,{label:'Địa chỉ'},h('input',{value:f.address,onChange:e=>sf(p=>({...p,address:e.target.value}))})),
      h(F,{label:'Website'},h('input',{value:f.website,onChange:e=>sf(p=>({...p,website:e.target.value}))})),
      h(Row,null,h('button',{className:'bp',onClick:()=>{setCompany({...f});window.showToast&&window.showToast('Đã lưu thông tin công ty!','success');},style:{padding:'8px 20px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu thông tin'))
    )
  );
}
function AppearanceSettingsTab({uiSettings,setUiSettings}){
  const[f,sf]=useState(()=>normalizeUiSettings(uiSettings));
  useEffect(()=>{sf(normalizeUiSettings(uiSettings));},[uiSettings]);
  const sizeOptions=Array.from({length:19},(_,i)=>10+i);
  const setScope=(key,patch)=>sf(prev=>({...(prev||{}),scopes:{...(prev?.scopes||{}),[key]:{...((prev?.scopes||{})[key]||{}),...patch}}}));
  const previewStyle=key=>{
    const safe=normalizeUiSettings(f);
    const cur=safe.scopes[key];
    const meta=fontModeMeta(cur.mode);
    return {fontFamily:cur.fontFamily||safe.fontFamily,fontSize:cur.size,fontWeight:meta.weight,fontStyle:meta.style};
  };
  const save=()=>{
    setUiSettings(normalizeUiSettings(f));
    window.showToast('Đã lưu cài đặt giao diện!','success');
  };
  const resetDraft=()=>sf(normalizeUiSettings(uiSettings));
  const restoreDefault=()=>sf(normalizeUiSettings(DEF_UI_SETTINGS));
  return h('div',null,
    h('div',{className:'card',style:{marginBottom:'1rem'}},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap',marginBottom:14}},
        h('div',null,
          h('div',{style:{fontSize:16,fontWeight:700,color:'var(--pri3)',marginBottom:4}},'Cài đặt giao diện'),
          h('div',{style:{fontSize:12,color:'var(--tx2)',maxWidth:720}},
            'Quy định loại chữ, cỡ chữ và kiểu chữ dùng chung cho các vùng hiển thị trong app. Khi lưu, toàn bộ các trang sẽ dùng theo cấu hình này.',
            h('span',{style:{display:'block',marginTop:4}},'Lưu ý: các mẫu in giữ font riêng để không lệch khổ giấy.')
          )
        ),
        h('div',{style:{display:'flex',gap:8,flexWrap:'wrap'}},
          h('button',{onClick:resetDraft,style:{padding:'6px 12px'}},h('i',{className:'ti ti-rotate',style:{fontSize:14}}),'Hoàn tác'),
          h('button',{onClick:restoreDefault,style:{padding:'6px 12px'}},h('i',{className:'ti ti-refresh',style:{fontSize:14}}),'Mặc định'),
          h('button',{className:'bp',onClick:save,style:{padding:'7px 16px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu cài đặt')
        )
      ),
      h('div',{className:'g2',style:{alignItems:'start'}},
        h(F,{label:'Loại chữ dùng chung'},
          h('select',{value:f.fontFamily,onChange:e=>{
            const fontFamily=e.target.value;
            sf(prev=>({
              ...prev,
              fontFamily,
              scopes:Object.fromEntries(Object.entries(prev.scopes||{}).map(([key,value])=>[key,{...value,fontFamily}]))
            }));
          }},
            UI_FONT_FAMILY_OPTIONS.map(opt=>h('option',{key:opt.value,value:opt.value},opt.label))
          )
        ),
        h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 14px'}} ,
          h('div',{style:{fontSize:12,color:'var(--tx2)',marginBottom:6}},'Xem nhanh'),
          h('div',{style:{...previewStyle('base'),marginBottom:5}},'Mẫu nội dung với font ',fontFamilyLabel(f.fontFamily)),
          h('div',{style:{...previewStyle('menu'),marginBottom:5}},'Menu / Cài đặt / Cài đặt giao diện'),
          h('div',{style:{...previewStyle('badge'),display:'inline-flex',padding:'4px 10px',background:'#fff',borderRadius:999,border:'1px solid var(--bd)'}},'Đang hoạt động')
        )
      )
    ),
    h('div',{className:'card',style:{marginBottom:'1rem'}},
      h('div',{style:{fontWeight:600,color:'var(--pri3)',marginBottom:10}},'Hiệu ứng chúc mừng sinh nhật'),
      h('div',{className:'g2',style:{alignItems:'end'}},
        h(F,{label:'Hình thức hoạt náo'},
          h('select',{value:f.birthdayEffect||'fireworks',onChange:e=>sf(prev=>({...prev,birthdayEffect:e.target.value}))},
            h('option',{value:'fireworks'},'Bắn pháo hoa'),
            h('option',{value:'balloons'},'Bóng bay và confetti'),
            h('option',{value:'cake'},'Bánh sinh nhật và nến'),
            h('option',{value:'none'},'Không dùng hiệu ứng')
          )
        ),
        h('div',{style:{padding:'10px 12px',background:'var(--bg2)',borderRadius:'var(--r)',fontSize:12,color:'var(--tx2)'}},
          'Hiệu ứng chỉ chạy trên trang Thời tiết trong đúng ngày sinh nhật nên không làm nặng đáng kể webapp.'
        )
      )
    ),
    h('div',{className:'card',style:{marginBottom:'1rem'}},
      h('div',{style:{fontWeight:600,color:'var(--pri3)',marginBottom:10}},'Danh sách vùng chữ có thể thay đổi'),
      h('div',{className:'tw'},
        h('table',null,
          h('thead',null,h('tr',null,
            h('th',{style:{width:200}},'Font chữ'),
            h('th',null,'Vùng hiển thị'),
            h('th',{style:{width:110}},'Cỡ chữ'),
            h('th',{style:{width:170}},'Kiểu chữ'),
            h('th',null,'Xem nhanh')
          )),
          h('tbody',null,
            UI_FONT_SCOPE_OPTIONS.map(scope=>h('tr',{key:scope.key},
              h('td',null,
                h('select',{value:f.scopes[scope.key].fontFamily||f.fontFamily,onChange:e=>setScope(scope.key,{fontFamily:e.target.value})},
                  UI_FONT_FAMILY_OPTIONS.map(opt=>h('option',{key:opt.value,value:opt.value},opt.label))
                )
              ),
              h('td',null,
                h('div',{style:{fontWeight:600}},scope.label),
                h('div',{style:{fontSize:11,color:'var(--tx2)',marginTop:3}},scope.note)
              ),
              h('td',null,
                h('select',{value:f.scopes[scope.key].size,onChange:e=>setScope(scope.key,{size:Number(e.target.value)})},
                  sizeOptions.map(sz=>h('option',{key:sz,value:sz},sz+' px'))
                )
              ),
              h('td',null,
                h('select',{value:f.scopes[scope.key].mode,onChange:e=>setScope(scope.key,{mode:e.target.value})},
                  UI_FONT_MODE_OPTIONS.map(opt=>h('option',{key:opt.value,value:opt.value},opt.label))
                )
              ),
              h('td',null,
                h('div',{style:{...previewStyle(scope.key),padding:'6px 0'}},scope.sample)
              )
            ))
          )
        )
      )
    ),
    h('div',{className:'card'},
      h('div',{style:{fontWeight:600,color:'var(--pri3)',marginBottom:10}},'Mô phỏng sau khi lưu'),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16}},
        h('div',{style:{border:'1px solid var(--bd)',borderRadius:'var(--r)',overflow:'hidden',background:'#fff'}},
          h('div',{style:{padding:'10px 12px',background:'var(--pri3)',color:'#fff',display:'flex',justifyContent:'space-between',alignItems:'center'}},
            h('span',{style:previewStyle('menu')},'Cài đặt'),
            h('span',{style:previewStyle('badge')},'Admin')
          ),
          h('div',{style:{padding:12}},
            h('div',{style:{...previewStyle('button'),display:'inline-flex',padding:'7px 14px',background:'var(--pri)',color:'#fff',borderRadius:'var(--r)',marginBottom:12}},'Lưu cài đặt'),
            h('div',{className:'tw'},
              h('table',null,
                h('thead',null,h('tr',null,
                  h('th',{style:previewStyle('header')},'Địa điểm'),
                  h('th',{style:previewStyle('header')},'Giờ'),
                  h('th',{style:previewStyle('header')},'Ca giao')
                )),
                h('tbody',null,h('tr',null,
                  h('td',{style:previewStyle('table')},'LOTTE-HOTEL'),
                  h('td',{style:previewStyle('table')},'16:00'),
                  h('td',{style:previewStyle('table')},'KV')
                ))
              )
            )
          )
        ),
        h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 14px'}},
          h('div',{style:{...previewStyle('base'),marginBottom:8}},'Nội dung chung của trang sẽ hiển thị theo cấu hình bạn chọn.'),
          h('div',{style:{...previewStyle('form'),marginBottom:8}},'Ô nhập liệu, bộ lọc và ghi chú cũng dùng theo thiết lập mới.'),
          h('div',{style:{...previewStyle('badge'),display:'inline-flex',padding:'4px 10px',background:'#fff',borderRadius:999,border:'1px solid var(--bd)',marginBottom:8}},'Tự động'),
          h('div',{style:{fontSize:11,color:'var(--tx2)'}},'Bạn có thể chỉnh từng vùng rồi nhấn Lưu cài đặt để áp dụng cho toàn app.')
        )
      )
    )
  );
}
function PrintTemplateMappingModal({template,onSave,onClose}){
  const [rows,setRows]=useState(()=>{
    const mappingMap=new Map((template?.mappings||[]).map(item=>[item.name,item]));
    return (template?.variables||[]).map(v=>{
      const old=mappingMap.get(v.name)||{};
      return {
        name:v.name,
        sheets:Array.isArray(v.sheets)?v.sheets:[],
        count:Number(v.count||1),
        sourceKey:String(old.sourceKey||''),
        sourceLabel:String(old.sourceLabel||printTemplateFieldLabel(old.sourceKey||'')),
        note:String(old.note||'')
      };
    });
  });
  const mappedCount=rows.filter(r=>r.sourceKey).length;
  const updateRow=(name,patch)=>setRows(prev=>prev.map(r=>r.name===name?{...r,...patch}:r));
  const save=()=>onSave(rows.map(r=>({name:r.name,sourceKey:r.sourceKey,sourceLabel:r.sourceLabel||printTemplateFieldLabel(r.sourceKey),note:r.note||''})));
  const autoGuess=()=>setRows(prev=>prev.map(r=>{
    if(r.sourceKey)return r;
    const guessed=guessPrintTemplateFieldKey(r.name);
    return guessed?{...r,sourceKey:guessed,sourceLabel:printTemplateFieldLabel(guessed)}:r;
  }));
  return h(Modal,{title:'Mapping biến - '+(templateScopeLabel(template)||template?.fileName||'Mẫu Excel'),lg:'xl',onClose},
    h('div',{style:{display:'grid',gap:12}},
      h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'10px 14px',fontSize:13}},
        h('div',{style:{fontWeight:600,color:'var(--pri3)',marginBottom:4}},template?.fileName||'Mẫu Excel'),
        h('div',{style:{color:'var(--tx2)',marginBottom:3}},'Áp dụng cho: '+(templateScopeLabel(template)||'—')),
        h('div',{style:{color:'var(--tx2)',marginBottom:3}},'Sheet: '+((template?.sheets||[]).join(', ')||'—')),
        h('div',{style:{color:'var(--tx2)'}},'Đã tìm thấy '+rows.length+' biến, đã mapping '+mappedCount+' biến.')
      ),
      h('div',{style:{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap',alignItems:'center'}},
        h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Mẫu cần dùng cú pháp biến như ',h('b',null,'{{ten_bien}}'),' trong file Excel.'),
        h('button',{onClick:autoGuess,style:{padding:'6px 12px'}},h('i',{className:'ti ti-wand',style:{fontSize:14}}),'Gợi ý tự động')
      ),
      h('div',{className:'tw',style:{maxHeight:'62vh'}},
        h('table',null,
          h('thead',null,h('tr',null,
            h('th',{style:{width:220}},'Biến trong file mẫu'),
            h('th',{style:{width:140}},'Sheet / số lần'),
            h('th',{style:{width:280}},'Lấy dữ liệu từ'),
            h('th',null,'Ghi chú')
          )),
          h('tbody',null,
            rows.map(r=>h('tr',{key:r.name},
              h('td',null,
                h('div',{style:{fontWeight:700,color:'var(--pri3)'}},'{{'+r.name+'}}')
              ),
              h('td',null,
                h('div',null,(r.sheets||[]).join(', ')||'—'),
                h('div',{style:{fontSize:11,color:'var(--tx2)',marginTop:3}},'Lặp '+r.count+' lần')
              ),
              h('td',null,
                h('select',{value:r.sourceKey,onChange:e=>updateRow(r.name,{sourceKey:e.target.value,sourceLabel:printTemplateFieldLabel(e.target.value)})},
                  h('option',{value:''},'— Chưa gán —'),
                  PRINT_TEMPLATE_FIELD_GROUPS.map(group=>h('optgroup',{key:group.label,label:group.label},
                    group.options.map(opt=>h('option',{key:opt.key,value:opt.key},opt.label))
                  ))
                )
              ),
              h('td',null,
                h('input',{value:r.note,onChange:e=>updateRow(r.name,{note:e.target.value}),placeholder:'Ghi chú thêm nếu cần...'})
              )
            ))
          )
        )
      ),
      h(Row,null,
        h('button',{onClick:onClose},'Hủy'),
        h('button',{className:'bp',onClick:save,style:{padding:'8px 20px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu mapping')
      )
    )
  );
}
function PrintTemplateScopeModal({type,template,options,onSave,onClose}){
  const scopeLabel=type==='label'?'sản phẩm':'khách hàng';
  const [selectedIds,setSelectedIds]=useState(()=>templateScopeList(template).map(item=>String(item.id||'')).filter(Boolean));
  const toggle=id=>setSelectedIds(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  const sortedOptions=(options||[]).slice().sort((a,b)=>(a.name||'').localeCompare(b.name||'','vi'));
  const save=()=>onSave(selectedIds);
  return h(Modal,{title:(type==='label'?'Chọn sản phẩm áp dụng':'Chọn khách hàng áp dụng')+' cho mẫu',lg:true,onClose},
    h('div',{style:{display:'grid',gap:12}},
      h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'10px 14px',fontSize:13}},
        h('div',{style:{fontWeight:700,color:'var(--pri3)',marginBottom:4}},template?.fileName||'Mẫu Excel'),
        h('div',{style:{color:'var(--tx2)'}},'Đã chọn '+selectedIds.length+' '+scopeLabel+'.')
      ),
      h('div',{style:{display:'flex',gap:8,flexWrap:'wrap'}},
        h('button',{onClick:()=>setSelectedIds(sortedOptions.map(item=>String(item.id||'')).filter(Boolean)),style:{padding:'6px 12px'}},'Chọn tất cả'),
        h('button',{onClick:()=>setSelectedIds([]),style:{padding:'6px 12px'}},'Bỏ chọn tất cả')
      ),
      h('div',{style:{maxHeight:'58vh',overflow:'auto',border:'1px solid var(--bd)',borderRadius:'var(--r)',padding:10,display:'grid',gap:8}},
        sortedOptions.map(item=>{
          const id=String(item.id||'');
          const checked=selectedIds.includes(id);
          const label=[item.code||item.id,item.name].filter(Boolean).join(' - ');
          return h('label',{key:id,style:{display:'flex',alignItems:'flex-start',gap:10,padding:'8px 10px',border:'1px solid '+(checked?'#9fd3b3':'var(--bd)'),borderRadius:'var(--r)',background:checked?'#f1faf4':'#fff',cursor:'pointer'}},
            h('input',{type:'checkbox',checked,onChange:()=>toggle(id),style:{width:16,height:16,marginTop:2}}),
            h('span',null,label)
          );
        })
      ),
      h(Row,null,
        h('button',{onClick:onClose},'Hủy'),
        h('button',{className:'bp',onClick:save,style:{padding:'8px 18px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu áp dụng')
      )
    )
  );
}
function PrintTemplateSettingsTab({templateSettings,setTemplateSettings,products,customers}){
  const safe=normalizePrintTemplateSettings(templateSettings);
  const [labelProdIds,setLabelProdIds]=useState([]);
  const [orderCustIds,setOrderCustIds]=useState([]);
  const [mappingTarget,setMappingTarget]=useState(null);
  const [scopeTarget,setScopeTarget]=useState(null);
  const labelRef=useRef(null);
  const orderRef=useRef(null);
  const labelTemplates=(safe.labelTemplates||[]).slice().sort((a,b)=>templateScopeLabel(a).localeCompare(templateScopeLabel(b),'vi'));
  const orderTemplates=(safe.orderTemplates||[]).slice().sort((a,b)=>templateScopeLabel(a).localeCompare(templateScopeLabel(b),'vi'));
  const toggleMulti=(setter,id)=>setter(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id]);
  const scopeOptionsForType=type=>type==='label'?(products||[]):(customers||[]);
  const selectedScopeIdsForType=type=>type==='label'?labelProdIds:orderCustIds;
  const selectedScopeSetterForType=type=>type==='label'?setLabelProdIds:setOrderCustIds;
  const renderScopeChecklist=(type,selectedIds,setSelectedIds)=>{
    const items=scopeOptionsForType(type).slice().sort((a,b)=>(a.name||'').localeCompare(b.name||'','vi'));
    const title=type==='label'?'Sản phẩm áp dụng':'Khách hàng áp dụng';
    return h('div',null,
      h('div',{style:{display:'flex',justifyContent:'space-between',gap:8,flexWrap:'wrap',alignItems:'center',marginBottom:8}},
        h('div',{style:{fontWeight:600,color:'var(--pri3)'}},title),
        h('div',{style:{display:'flex',gap:8,flexWrap:'wrap'}},
          h('button',{onClick:()=>setSelectedIds(items.map(item=>String(item.id||'')).filter(Boolean)),style:{padding:'5px 10px'}},'Chọn tất cả'),
          h('button',{onClick:()=>setSelectedIds([]),style:{padding:'5px 10px'}},'Bỏ chọn')
        )
      ),
      h('div',{style:{maxHeight:210,overflow:'auto',border:'1px solid var(--bd)',borderRadius:'var(--r)',padding:10,display:'grid',gap:8}},
        items.map(item=>{
          const id=String(item.id||'');
          const checked=selectedIds.includes(id);
          const label=[item.code||item.id,item.name].filter(Boolean).join(' - ');
          return h('label',{key:id,style:{display:'flex',alignItems:'flex-start',gap:10,padding:'8px 10px',border:'1px solid '+(checked?'#9fd3b3':'var(--bd)'),borderRadius:'var(--r)',background:checked?'#f1faf4':'#fff',cursor:'pointer'}},
            h('input',{type:'checkbox',checked,onChange:()=>toggleMulti(setSelectedIds,id),style:{width:16,height:16,marginTop:2}}),
            h('span',null,label)
          );
        })
      ),
      h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:8}},'Đã chọn ',h('b',{style:{color:'var(--pri3)'}},selectedIds.length),' mục')
    );
  };
  const variableCatalogRows=PRINT_TEMPLATE_FIELD_GROUPS.flatMap(group=>group.options.map(opt=>({
    groupLabel:group.label,
    key:opt.key,
    label:opt.label,
    sample:'{{'+opt.key+'}}'
  })));
  const copyVariableSample=async text=>{
    const value=String(text||'').trim();
    if(!value)return;
    try{
      if(navigator?.clipboard?.writeText){
        await navigator.clipboard.writeText(value);
      }else{
        const ta=document.createElement('textarea');
        ta.value=value;
        ta.setAttribute('readonly','readonly');
        ta.style.position='fixed';
        ta.style.left='-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
      }
      window.showToast('Đã sao chép biến: '+value,'success');
    }catch(err){
      console.warn(err);
      window.showToast('Chưa sao chép được biến này trên trình duyệt hiện tại.','warn');
    }
  };
  const templateSummary=tpl=>{
    const mapped=(tpl.mappings||[]).filter(x=>x.sourceKey).length;
    return mapped+'/'+(tpl.variables||[]).length+' biến';
  };
  const uploadTemplate=async(type,file)=>{
    try{
      const selectedIds=selectedScopeIdsForType(type);
      const scopeOptions=scopeOptionsForType(type);
      const selectedScopes=scopeOptions.filter(item=>selectedIds.includes(String(item.id||'')));
      if(!selectedScopes.length){window.showToast(type==='label'?'Chọn ít nhất 1 sản phẩm trước khi upload.':'Chọn ít nhất 1 khách hàng trước khi upload.','warn');return;}
      if(!file){window.showToast('Chưa chọn file Excel mẫu.','warn');return;}
      const dataUrl=await readFileAsDataUrl(file);
      const wb=XLSX.read((dataUrl.split(',')[1]||''),{type:'base64',cellDates:true});
      const variables=extractTemplateVariablesFromWorkbook(wb);
      if(!variables.length){window.showToast('Không tìm thấy biến nào trong file mẫu. Dùng cú pháp {{ten_bien}} trong Excel nhé.','warn');}
      setTemplateSettings(prev=>{
        const next=normalizePrintTemplateSettings(prev);
        const key=type==='label'?'labelTemplates':'orderTemplates';
        const list=[...(next[key]||[])];
        const mergedMappings=mergeTemplateVariableMappings(variables,[]);
        const tpl={
          id:'TPL'+uid(),
          type,
          scopeId:String(selectedScopes[0]?.id||''),
          scopeName:String(selectedScopes[0]?.name||selectedScopes[0]?.code||selectedScopes[0]?.id||''),
          scopeIds:selectedScopes.map(item=>String(item.id||'')).filter(Boolean),
          scopeNames:selectedScopes.map(item=>String(item.name||item.code||item.id||'')).filter(Boolean),
          scopeItems:selectedScopes.map(item=>({id:String(item.id||''),name:String(item.name||item.code||item.id||'')})),
          fileName:file.name,
          fileSize:Number(file.size||0),
          mimeType:file.type||'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          uploadedAt:fmtDT(),
          fileDataUrl:dataUrl,
          sheets:wb.SheetNames||[],
          variables,
          mappings:mergedMappings
        };
        list.push(tpl);
        return {...next,[key]:list};
      });
      selectedScopeSetterForType(type)([]);
      window.showToast((type==='label'?'Đã lưu mẫu tem Excel cho ':'Đã lưu mẫu in đơn Excel cho ')+selectedScopes.length+' đối tượng áp dụng.','success');
    }catch(err){
      console.warn(err);
      window.showToast('Không đọc được file mẫu Excel. Kiểm tra lại định dạng file.','error');
    }
  };
  const removeTemplate=(type,id)=>{
    const title=type==='label'?'Xóa mẫu tem Excel':'Xóa mẫu in đơn Excel';
    const msg='Bạn có chắc muốn xóa file mẫu này?';
    const run=ok=>{if(ok)setTemplateSettings(prev=>{
      const next=normalizePrintTemplateSettings(prev);
      const key=type==='label'?'labelTemplates':'orderTemplates';
      return {...next,[key]:(next[key]||[]).filter(item=>item.id!==id)};
    });};
    if(window.scfConfirm)window.scfConfirm(msg,title,true).then(run);
    else run(confirm(msg));
  };
  const saveMappings=(type,id,mappings)=>{
    setTemplateSettings(prev=>{
      const next=normalizePrintTemplateSettings(prev);
      const key=type==='label'?'labelTemplates':'orderTemplates';
      return {...next,[key]:(next[key]||[]).map(item=>item.id===id?{...item,mappings}:item)};
    });
    setMappingTarget(null);
    window.showToast('Đã lưu mapping biến cho file mẫu.','success');
  };
  const saveTemplateScopes=(type,id,scopeIds)=>{
    const options=scopeOptionsForType(type);
    const selected=options.filter(item=>scopeIds.includes(String(item.id||'')));
    if(!selected.length){window.showToast(type==='label'?'Mẫu tem cần ít nhất 1 sản phẩm áp dụng.':'Mẫu in đơn cần ít nhất 1 khách hàng áp dụng.','warn');return;}
    setTemplateSettings(prev=>{
      const next=normalizePrintTemplateSettings(prev);
      const key=type==='label'?'labelTemplates':'orderTemplates';
      return {...next,[key]:(next[key]||[]).map(item=>item.id===id?{
        ...item,
        scopeId:String(selected[0]?.id||''),
        scopeName:String(selected[0]?.name||selected[0]?.code||selected[0]?.id||''),
        scopeIds:selected.map(opt=>String(opt.id||'')).filter(Boolean),
        scopeNames:selected.map(opt=>String(opt.name||opt.code||opt.id||'')).filter(Boolean),
        scopeItems:selected.map(opt=>({id:String(opt.id||''),name:String(opt.name||opt.code||opt.id||'')}))
      }:item)};
    });
    setScopeTarget(null);
    window.showToast('Đã cập nhật đối tượng áp dụng cho file mẫu.','success');
  };
  const downloadTemplate=tpl=>{
    if(!tpl?.fileDataUrl){window.showToast('File mẫu này chưa có dữ liệu để tải.','warn');return;}
    const a=document.createElement('a');
    a.href=tpl.fileDataUrl;
    a.download=tpl.fileName||'template.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  const templateTable=(items,type)=>TableWrap({
    cols:[type==='label'?'Sản phẩm áp dụng':'Khách hàng áp dụng','File mẫu Excel','Biến tìm thấy','Đã mapping','Cập nhật',''],
    empty:type==='label'?'Chưa có mẫu tem Excel nào.':'Chưa có mẫu in đơn Excel nào.',
    rows:items.map(tpl=>h('tr',{key:tpl.id},
      h('td',null,
        h('div',{style:{fontWeight:600,color:'var(--pri3)',marginBottom:6}},templateScopeLabel(tpl)||'—'),
        h('div',{style:{display:'flex',flexWrap:'wrap',gap:6,marginBottom:6}},
          templateScopeList(tpl).map(scope=>h('span',{key:(scope.id||scope.name),className:'badge',style:{background:'var(--bg2)',color:'var(--pri3)'}},scope.name||scope.id))
        ),
        h('button',{onClick:()=>setScopeTarget({type,id:tpl.id,template:tpl}),style:{padding:'5px 10px'}},
          h('i',{className:'ti '+(type==='label'?'ti-package':'ti-users'),style:{fontSize:14}}),
          type==='label'?'Chọn sản phẩm':'Chọn khách hàng'
        )
      ),
      h('td',null,
        h('div',{style:{fontWeight:500}},tpl.fileName||'—'),
        h('div',{style:{fontSize:11,color:'var(--tx2)',marginTop:3}},(tpl.sheets||[]).join(', ')||'Không rõ sheet')
      ),
      h('td',null,
        h('div',{style:{fontWeight:600}},String((tpl.variables||[]).length)),
        h('div',{style:{fontSize:11,color:'var(--tx2)',marginTop:3}},(tpl.variables||[]).slice(0,3).map(v=>'{{'+v.name+'}}').join(', ')||'Chưa có biến')
      ),
      h('td',null,h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--pri3)'}},templateSummary(tpl))),
      h('td',null,tpl.uploadedAt||'—'),
      h('td',null,
        h('div',{style:{display:'flex',gap:4,justifyContent:'flex-end',flexWrap:'wrap'}},
          h('button',{onClick:()=>setMappingTarget({type,id:tpl.id,template:tpl}),style:{padding:'5px 10px'}},h('i',{className:'ti ti-variable',style:{fontSize:14}}),'Mapping'),
          h('button',{onClick:()=>downloadTemplate(tpl),style:{padding:'5px 10px'}},h('i',{className:'ti ti-download',style:{fontSize:14}}),'Tải file'),
          h('button',{onClick:()=>removeTemplate(type,tpl.id),style:{padding:'5px 10px',color:'#A32D2D',borderColor:'#F7C1C1'}},h('i',{className:'ti ti-trash',style:{fontSize:14}}),'Xóa')
        )
      )
    ))
  });
  return h('div',null,
    h('div',{className:'card',style:{marginBottom:'1rem'}},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap',marginBottom:14}},
        h('div',null,
          h('div',{style:{fontSize:16,fontWeight:700,color:'var(--pri3)',marginBottom:4}},'Mẫu in Excel & mapping biến'),
          h('div',{style:{fontSize:12,color:'var(--tx2)',maxWidth:820}},
            'Upload file Excel mẫu đã có biến như ',h('b',null,'{{ten_bien}}'),'. Hệ thống sẽ quét các biến trong file và cho bạn gán dữ liệu từ đơn hàng vào từng biến đó.'
          )
        ),
        h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'10px 12px',fontSize:12,color:'var(--tx2)'}},
          h('div',null,'Mẫu tem theo sản phẩm: ',h('b',{style:{color:'var(--pri3)'}},labelTemplates.length)),
          h('div',null,'Mẫu in đơn theo khách hàng: ',h('b',{style:{color:'var(--pri3)'}},orderTemplates.length))
        )
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:12}},
        h('div',{style:{background:'#fff',border:'1px solid var(--bd)',borderRadius:'var(--r)',padding:'12px 14px'}},
          h('div',{style:{fontWeight:700,color:'var(--pri3)',marginBottom:4}},'1. Mẫu tem Excel theo sản phẩm'),
          h('div',{style:{fontSize:12,color:'var(--tx2)',marginBottom:10}},'Một file tem có thể dùng cho nhiều sản phẩm. Chọn các sản phẩm áp dụng rồi upload file mẫu.'),
          renderScopeChecklist('label',labelProdIds,setLabelProdIds),
          h('input',{type:'file',accept:'.xlsx,.xls,.xlsm',ref:labelRef,style:{display:'none'},onChange:e=>{if(e.target.files?.[0])uploadTemplate('label',e.target.files[0]);e.target.value='';}}),
          h('div',{style:{display:'flex',gap:8,flexWrap:'wrap'}},
            h('button',{className:'bp',onClick:()=>labelRef.current?.click(),style:{padding:'7px 14px'}},h('i',{className:'ti ti-upload',style:{fontSize:14}}),'Upload mẫu tem'),
            h('button',{onClick:()=>setLabelProdIds([]),style:{padding:'7px 14px'}},'Bỏ chọn')
          )
        ),
        h('div',{style:{background:'#fff',border:'1px solid var(--bd)',borderRadius:'var(--r)',padding:'12px 14px'}},
          h('div',{style:{fontWeight:700,color:'var(--pri3)',marginBottom:4}},'2. Mẫu in đơn hàng Excel theo khách hàng'),
          h('div',{style:{fontSize:12,color:'var(--tx2)',marginBottom:10}},'Một file in đơn có thể dùng cho nhiều khách hàng. Chọn các khách hàng áp dụng rồi upload file mẫu.'),
          h('div',{style:{fontSize:12,color:'#8A5A00',background:'#FFF8E1',border:'1px solid #F5DE9D',borderRadius:'var(--r)',padding:'8px 10px',marginBottom:10}},
            'Nếu đơn có nhiều sản phẩm, chỉ cần tạo 1 dòng mẫu có biến như ',
            h('b',null,'{{line.productName}}'),
            ', ',
            h('b',null,'{{line.totalWeight}}'),
            ', ',
            h('b',null,'{{line.qtyInvoice}}'),
            '. Khi xuất Excel, hệ thống sẽ tự nhân dòng đó theo số sản phẩm của đơn.'
          ),
          renderScopeChecklist('order',orderCustIds,setOrderCustIds),
          h('input',{type:'file',accept:'.xlsx,.xls,.xlsm',ref:orderRef,style:{display:'none'},onChange:e=>{if(e.target.files?.[0])uploadTemplate('order',e.target.files[0]);e.target.value='';}}),
          h('div',{style:{display:'flex',gap:8,flexWrap:'wrap'}},
            h('button',{className:'bp',onClick:()=>orderRef.current?.click(),style:{padding:'7px 14px'}},h('i',{className:'ti ti-upload',style:{fontSize:14}}),'Upload mẫu in đơn'),
            h('button',{onClick:()=>setOrderCustIds([]),style:{padding:'7px 14px'}},'Bỏ chọn')
          )
        )
      )
    ),
    h('div',{className:'card',style:{marginBottom:'1rem'}},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap',marginBottom:10}},
        h('div',null,
          h('div',{style:{fontWeight:700,color:'var(--pri3)',marginBottom:4}},'Danh sách biến dữ liệu có sẵn từ đơn hàng'),
          h('div',{style:{fontSize:12,color:'var(--tx2)',maxWidth:920}},
            'Bạn có thể đặt đúng tên biến như ',h('b',null,'{{order.id}}'),', ',h('b',null,'{{order.customer}}'),', ',h('b',null,'{{line.productName}}'),' trong file Excel mẫu để hệ thống tự gợi ý mapping nhanh hơn. Nếu bạn dùng tên khác thì vẫn map tay được bình thường.'
          )
        ),
        h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'8px 12px',fontSize:12,color:'var(--tx2)'}},
          'Tổng biến dữ liệu: ',
          h('b',{style:{color:'var(--pri3)'}},variableCatalogRows.length)
        )
      ),
      TableWrap({
        cols:['Nhóm dữ liệu','Biến dữ liệu','Ý nghĩa','Gợi ý đặt trong file mẫu',''],
        empty:'Chưa có danh sách biến dữ liệu.',
        rows:variableCatalogRows.map(row=>h('tr',{key:row.key},
          h('td',null,h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--pri3)'}},row.groupLabel)),
          h('td',null,
            h('div',{style:{fontWeight:700,color:'var(--pri3)'}},row.key)
          ),
          h('td',null,row.label),
          h('td',null,
            h('code',{style:{fontSize:12,padding:'4px 6px',background:'#F6F7F4',borderRadius:6,color:'#27543F'}},row.sample)
          ),
          h('td',null,
            h('button',{onClick:()=>copyVariableSample(row.sample),style:{padding:'5px 10px',whiteSpace:'nowrap'}},
              h('i',{className:'ti ti-copy',style:{fontSize:14}}),
              'Sao chép'
            )
          )
        ))
      })
    ),
    h('div',{className:'card',style:{marginBottom:'1rem'}},
      h('div',{style:{fontWeight:700,color:'var(--pri3)',marginBottom:10}},'Danh sách mẫu tem Excel của sản phẩm'),
      templateTable(labelTemplates,'label')
    ),
    h('div',{className:'card'},
      h('div',{style:{fontWeight:700,color:'var(--pri3)',marginBottom:10}},'Danh sách mẫu in đơn Excel của khách hàng'),
      templateTable(orderTemplates,'order')
    ),
    mappingTarget&&h(PrintTemplateMappingModal,{
      template:mappingTarget.template,
      onSave:mappings=>saveMappings(mappingTarget.type,mappingTarget.id,mappings),
      onClose:()=>setMappingTarget(null)
    }),
    scopeTarget&&h(PrintTemplateScopeModal,{
      type:scopeTarget.type,
      template:scopeTarget.template,
      options:scopeOptionsForType(scopeTarget.type),
      onSave:ids=>saveTemplateScopes(scopeTarget.type,scopeTarget.id,ids),
      onClose:()=>setScopeTarget(null)
    })
  );
}
function PasswordField({value,onChange,placeholder}){
  const[show,setShow]=useState(false);
  return h('div',{style:{position:'relative'}},
    h('input',{type:show?'text':'password',value:value||'',onChange,placeholder:placeholder||'',autoComplete:'new-password',style:{paddingRight:38}}),
    value&&h('button',{type:'button',className:'bi',onClick:()=>setShow(v=>!v),title:show?'Ẩn mật khẩu':'Hiện mật khẩu',
      style:{position:'absolute',right:6,top:'50%',transform:'translateY(-50%)',width:28,height:28,padding:0,border:'none',background:'transparent',color:'var(--tx2)'}},
      h('i',{className:'ti '+(show?'ti-eye-off':'ti-eye'),style:{fontSize:17}})
    )
  );
}
const FACEMASK_ONLY_PERMISSION_PAGES=new Set(['materials','workreport_total','nccs','purchaseorders','cashflowreport','salesreport','fuelreport','purchasereport','maintreport','materialusage','syncreport','dbusage']);
function normalizeEmployeeDept(value){return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase().replace(/\s+/g,' ');}
function isPrivilegedEmployeeRecord(employee){
  const role=String(employee?.role||'').trim().toLowerCase();
  return ['admin','administrator'].includes(role)||normalizeEmployeeDept(employee?.dept)==='ban giam doc';
}function EmpForm({emp,employees,depts,cu,cu2,onSave,onClose}){
  const deptNames=(depts&&depts.length?depts.map(d=>d.name):DEPTS);
  const isFaceMask=window.SCF_APP_VARIANT==='face-mask';
  const scopedDeptNames=isFaceMask?[...new Set([...deptNames.filter(d=>normalizeEmployeeDept(d)==='ban giam doc'),'Ban Giám Đốc'])]:deptNames.filter(d=>normalizeEmployeeDept(d)!=='ban giam doc');
  const roleOptions=Object.entries(ROLES).filter(([role])=>isFaceMask||!['admin','administrator'].includes(role));
  const[busy,setBusy]=useState(false);
  const[f,sf]=useState(emp
    ?{...emp,password:isPasswordHash(emp.password)?'':String(emp.password||''),gender:normalizeGenderValue(emp?.gender,emp?.female),female:isFemaleGender(emp?.gender,emp?.female)}
    :{id:'NV'+String(Date.now()).slice(-4),name:'',birthday:'',gender:'male',female:false,dept:scopedDeptNames[0]||(isFaceMask?'Ban Giám Đốc':''),role:isFaceMask?'manager':'staff',username:'',password:'',phone:'',email:'',note:'',startDate:'',bhxh:false}
  );
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const submit=async()=>{
    if(!f.name||!f.username){window.showToast('Nhập tên và tên đăng nhập!','warn');return;}
    if(isPrivilegedEmployeeRecord(f)!==isFaceMask){window.showToast(isFaceMask?'FACE MASK chỉ lưu Admin hoặc người thuộc Ban Giám Đốc.':'Tài khoản Admin/Ban Giám Đốc phải được quản lý trên FACE MASK.','error');return;}
    if(!emp&&employees.some(e=>e.username===f.username)){window.showToast('Tên đăng nhập đã tồn tại!','error');return;}
    if(!emp&&!f.password){window.showToast('Nhập mật khẩu!','warn');return;}
    if(f.password&&f.password.length<PASSWORD_MIN_LENGTH){window.showToast('Mật khẩu phải có ít nhất '+PASSWORD_MIN_LENGTH+' ký tự!','warn');return;}
    setBusy(true);
    const gender=normalizeGenderValue(f.gender,f.female);
    try{
      const password=f.password?await hashPassword(f.password):'';
      const permissions=(f.permissions||[]).filter(page=>!FACEMASK_ONLY_PERMISSION_PAGES.has(page));
      const permLevels=Object.fromEntries(Object.entries(f.permLevels||{}).filter(([page])=>!FACEMASK_ONLY_PERMISSION_PAGES.has(page)));
      onSave({...f,permissions,permLevels,password,gender,female:gender==='female',updatedBy:cu.name,updatedAt:fmtDT()});
    }catch(e){window.showToast(e.message||'Không thể lưu mật khẩu.','error');}
    finally{setBusy(false);}
  };
  return h(Modal,{title:emp?'Sửa nhân viên':'Thêm nhân viên',onClose,lg:true},
    h('div',{className:'g3'},
      h(F,{label:'Mã nhân viên *'},h('input',{value:f.id,onChange:e=>s('id',e.target.value.toUpperCase()),placeholder:'NV001'})),
      h(F,{label:'Họ và tên *'},h('input',{value:f.name,onChange:e=>s('name',e.target.value)})),
      h(F,{label:'Ngày sinh (DD/MM/YYYY)'},h('input',{value:f.birthday,onChange:e=>s('birthday',e.target.value),placeholder:'15/03/1990'})),
    ),
    h('div',{className:'g3'},
      h(F,{label:'Bộ phận'},h('select',{value:f.dept,onChange:e=>s('dept',e.target.value)},scopedDeptNames.map(d=>h('option',{key:d,value:d},d)))),
      h(F,{label:'Phân quyền'},h('select',{value:f.role,onChange:e=>s('role',e.target.value)},roleOptions.map(([v,l])=>h('option',{key:v,value:v},l)))),
      h(F,{label:'Ngày vào làm (DD/MM/YYYY)'},h('input',{value:f.startDate||'',onChange:e=>s('startDate',e.target.value),placeholder:'01/01/2024'})),
    ),
    h('div',{style:{display:'flex',alignItems:'flex-end',gap:16,marginBottom:8,flexWrap:'wrap'}},
      h(F,{label:'Giới tính'},
        h('select',{
          value:normalizeGenderValue(f.gender,f.female),
          onChange:e=>{
            const nextGender=e.target.value==='female'?'female':'male';
            sf(p=>({...p,gender:nextGender,female:nextGender==='female'}));
          },
          style:{minWidth:146}
        },
          h('option',{value:'male'},'Nam'),
          h('option',{value:'female'},'Nữ')
        )
      ),
      h('label',{style:{display:'flex',alignItems:'center',gap:8,cursor:'pointer',padding:'8px 14px',border:'1px solid '+(f.bhxh?'var(--pri)':'var(--bd)'),borderRadius:'var(--r)',background:f.bhxh?'#f0faf0':'#fff',transition:'all .15s'}},
        h('input',{type:'checkbox',checked:!!f.bhxh,onChange:e=>s('bhxh',e.target.checked),style:{cursor:'pointer',accentColor:'var(--pri)',width:15,height:15}}),
        h('span',{style:{fontSize:13,fontWeight:500,color:f.bhxh?'var(--pri)':'var(--tx2)'}},'Đóng BHXH'),
        f.bhxh&&h('i',{className:'ti ti-shield-check',style:{fontSize:14,color:'var(--pri)'}})
      )
    ),
    h('hr',{className:'divider'}),
    h('div',{className:'g2'},
      h(F,{label:'Tên đăng nhập *'},h('input',{value:f.username,onChange:e=>s('username',e.target.value)})),
      h(F,{label:emp?'Mật khẩu (bỏ trống = giữ nguyên)':'Mật khẩu *'},h(PasswordField,{value:f.password,onChange:e=>s('password',e.target.value),placeholder:emp&&isPasswordHash(emp.password)?'Mật khẩu cũ đã mã hóa — hãy đặt lại':'Tối thiểu 8 ký tự'})),
    ),
    h('div',{className:'g2'},
      h(F,{label:'Điện thoại'},h('input',{value:f.phone,onChange:e=>s('phone',e.target.value)})),
      h(F,{label:'Email'},h('input',{value:f.email,onChange:e=>s('email',e.target.value)})),
    ),
    h(F,{label:'Ghi chú'},h('textarea',{value:f.note,onChange:e=>s('note',e.target.value),rows:2})),

    cu2&&cu2.role==='admin'&&h('div',null,
      h('hr',{className:'divider'}),
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}},
        h('div',{style:{fontWeight:500,fontSize:13,color:'var(--pri3)'}},'Phan quyen chi tiet (bo trong = mac dinh theo cap bac)'),
        h('button',{type:'button',onClick:()=>sf(p=>({...p,permissions:[],permLevels:{}})),style:{fontSize:11,padding:'3px 10px',color:'#A32D2D',borderColor:'#F7C1C1'}},'Xoa tuy chinh')
      ),
      h('div',{style:{fontSize:12,color:'var(--tx2)',marginBottom:8,background:'var(--bg2)',padding:'6px 10px',borderRadius:'var(--r)'}},'Không truy cập = ẩn menu | Chỉ xem = không có nút Thêm/Sửa/Xóa | Xem+Sửa = có nút Thêm/Sửa | Đầy đủ = có tất cả'),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'0 2rem'}},
        [
          {sec:'Cai dat', pages:[{k:'company',l:'Thong tin cong ty'},{k:'appearance',l:'Cai dat giao dien'},{k:'printtemplates',l:'Mau in Excel va mapping'},{k:'employees',l:'Nhan vien'},{k:'backup',l:'Backup'}]},
          {sec:'Nhan su', pages:[{k:'attendance',l:'Cham cong'},{k:'attendance_settings',l:'Cai dat cham cong'},{k:'advances',l:'Ung luong'},{k:'rewards',l:'Thuong phat'},{k:'leaves',l:'Xin nghi'}]},
          {sec:'Bao cong', pages:[{k:'attendance_report',l:'Bao cao cham cong'},{k:'workreport_vp',l:'Cong ke toan'},{k:'workreport_sx',l:'Cong san xuat'},{k:'workreport_lx',l:'Cong lai xe'},{k:'workreport_total',l:'Tong cong'}]},
          {sec:'Danh muc', pages:[{k:'materials',l:'Vat tu'},{k:'depts',l:'Bo phan'},{k:'products',l:'San pham'},{k:'customers',l:'Khach hang'},{k:'areas',l:'Khu vuc'},{k:'prodshifts',l:'Ca san xuat'},{k:'workcats',l:'DM Cong viec'},{k:'shifts',l:'Ca giao hang'}]},
          {sec:'Ban hang', pages:[{k:'quotes',l:'Bao gia'},{k:'delivery',l:'Don giao hang'},{k:'intem',l:'Intem'},{k:'orderdetail',l:'Chi tiet don hang'},{k:'trips',l:'Chuyen giao hang'},{k:'salesreport',l:'Bao cao BH'},{k:'marketsales',l:'Ban hang cho'},{k:'powdersales',l:'Ban bot bun'}]},
          {sec:'Mua hang', pages:[{k:'nccs',l:'Nha CC NVL'},{k:'nccgoods',l:'Nha CC Hang hoa'},{k:'purchaseorders',l:'Don mua hang NVL'},{k:'purchasegoods',l:'Don mua hang hang hoa'},{k:'fuelpurchases',l:'Don mua xang dau'},{k:'purchasereport',l:'Bao cao MH'},{k:'materialusage',l:'Bao cao NVL ton va tieu dung'},{k:'purchase',l:'Mua hang'}]},
          {sec:'Bao cao', pages:[{k:'cashflowreport',l:'Bao cao dong tien'},{k:'fuelreport',l:'Bao cao xang dau'},{k:'maintreport',l:'Bao cao sua chua'}]},
          {sec:'San xuat', pages:[{k:'prodsummary',l:'Tong hop SX'},{k:'prodorders',l:'Don san xuat'},{k:'stock',l:'Ton kho'}]},
        ].map(sec=>h('div',{key:sec.sec,style:{marginBottom:10}},
          h('div',{style:{fontSize:11,fontWeight:600,color:'var(--tx2)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:5}},sec.sec),
          sec.pages.filter(pg=>!FACEMASK_ONLY_PERMISSION_PAGES.has(pg.k)).map(pg=>{
            const active = f.permissions&&f.permissions.length>0
              ? f.permissions.includes(pg.k)
              : canAccess(f.role, pg.k);
            const curLvl = (f.permLevels&&f.permLevels[pg.k]) || (active?getLvl(f.role,pg.k,null):'');
            return h('div',{key:pg.k,style:{display:'grid',gridTemplateColumns:'1fr auto',alignItems:'center',padding:'4px 6px',borderRadius:4,background:active?'var(--bg2)':'',marginBottom:2}},
              h('span',{style:{fontSize:13,color:active?'var(--tx)':'var(--tx2)'}},pg.l),
              h('select',{value:active?(curLvl||'rw'):'none',style:{fontSize:11,padding:'2px 4px',width:110},
                onChange:e=>{
                  const v=e.target.value;
                  const base=f.permissions&&f.permissions.length>0?[...f.permissions]:roleDefaults(f.role);
                  const newPerms=v==='none'?base.filter(x=>x!==pg.k):[...new Set([...base,pg.k])];
                  const newLvls={...(f.permLevels||{})};
                  if(v==='none')delete newLvls[pg.k];
                  else newLvls[pg.k]=v;
                  sf(p=>({...p,permissions:newPerms,permLevels:newLvls}));
                }
              },
                h('option',{value:'none'},'Không truy cập'),
                h('option',{value:'r'},'Chỉ xem'),
                h('option',{value:'rw'},'Xem + Sửa'),
                h('option',{value:'rwd'},'Đầy đủ (Xóa)')
              )
            );
          })
        ))
      )
    ),
    h(Row,null,
      h('button',{onClick:onClose},'Hủy'),
      h('button',{className:'bp',onClick:submit,disabled:busy,style:{padding:'8px 20px'}},
        h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),
        busy?'Đang mã hóa...':'Lưu nhân viên'
      )
    )
  );
}
function CpwModal({emp,cu,onSave,onClose,forced=false}){
  const isAdminReset=cu.role==='admin'&&emp.id!==cu.id;
  const initialPassword=isAdminReset?generateTemporaryPassword():'';
  const[op,sop]=useState('');const[np,snp]=useState(initialPassword);const[cp,scp]=useState(initialPassword);const[busy,setBusy]=useState(false);
  const regenerate=()=>{const value=generateTemporaryPassword();snp(value);scp(value);};
  const copyTemporaryPassword=async()=>{
    try{
      if(navigator?.clipboard?.writeText)await navigator.clipboard.writeText(np);
      else prompt('Sao chép mật khẩu tạm này:',np);
      window.showToast('Đã sao chép mật khẩu tạm.','success');
    }catch{prompt('Sao chép mật khẩu tạm này:',np);}
  };
  const submit=async()=>{
    if(busy)return;
    if(!SCF_SERVER_AUTH_ENABLED&&cu.role!=='admin'&&!(await verifyPassword(op,emp.password))){window.showToast('Mật khẩu cũ không đúng!','error');return;}
    if(np.length<PASSWORD_MIN_LENGTH){window.showToast('Mật khẩu phải có ít nhất '+PASSWORD_MIN_LENGTH+' ký tự!','warn');return;}
    if(np!==cp){window.showToast('Mật khẩu xác nhận không khớp!','error');return;}
    setBusy(true);
    try{
      if(SCF_SERVER_AUTH_ENABLED){
        await serverChangePassword(emp.id,op,np,isAdminReset);
        await onSave('',{mustChangePw:isAdminReset});
      }else{
        await onSave(await hashPassword(np),{mustChangePw:isAdminReset});
      }
      window.showToast(isAdminReset?'Đã đặt mật khẩu tạm. Nhân viên phải đổi mật khẩu khi đăng nhập.':'Đã đổi mật khẩu.','success');
    }
    catch(e){window.showToast(e.message||'Không thể mã hóa mật khẩu.','error');}
    finally{setBusy(false);}
  };
  return h(Modal,{title:(isAdminReset?'Đặt lại mật khẩu — ':'Đổi mật khẩu — ')+emp.name,onClose:forced?()=>{}:onClose},
    forced&&h('div',{style:{padding:'9px 12px',borderRadius:6,background:'#FFF7D6',color:'#755900',fontSize:13,marginBottom:12}},'Bạn đang dùng mật khẩu tạm. Hãy đổi mật khẩu mới để tiếp tục sử dụng hệ thống.'),
    isAdminReset
      ?h('div',null,
        h('div',{style:{fontSize:12,color:'var(--tx2)',marginBottom:7}},'Mật khẩu tạm chỉ hiển thị trong cửa sổ này. Hãy sao chép và gửi riêng cho nhân viên.'),
        h('div',{style:{display:'flex',gap:6,alignItems:'center',marginBottom:12}},
          h('input',{value:np,readOnly:true,style:{fontFamily:'monospace',fontWeight:700,letterSpacing:1}}),
          h('button',{type:'button',onClick:copyTemporaryPassword,title:'Sao chép'},h('i',{className:'ti ti-copy'})),
          h('button',{type:'button',onClick:regenerate,title:'Tạo mật khẩu khác'},h('i',{className:'ti ti-refresh'}))
        )
      )
      :h('div',null,
        cu.role!=='admin'&&h(F,{label:'Mật khẩu cũ'},h(PasswordField,{value:op,onChange:e=>sop(e.target.value)})),
        h(F,{label:'Mật khẩu mới'},h(PasswordField,{value:np,onChange:e=>snp(e.target.value)})),
        h(F,{label:'Xác nhận'},h(PasswordField,{value:cp,onChange:e=>scp(e.target.value)}))
      ),
    h(Row,null,!forced&&h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit,disabled:busy,style:{padding:'8px 20px'}},busy?'Đang mã hóa...':isAdminReset?'Đặt mật khẩu tạm':'Đổi mật khẩu'))
  );
}
function EmployeeTab({employees,setEmployees,cu,depts}){
  const isFaceMask=window.SCF_APP_VARIANT==='face-mask';
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[cpw,scp]=useState(null);const[q,sq]=useState('');
  const[sortBy,setSortBy]=useState('id'); // id | role | dept
  const[fRole,setFRole]=useState('');
  const[fDept,setFDept]=useState('');
  // Hồ sơ nhân viên, vai trò và mật khẩu chỉ được thay đổi bởi Admin.
  // Manager vẫn có thể xem danh sách theo PAGE_ACCESS nhưng không ghi trực tiếp.
  const canEdit=cu.role==='admin';
  const ROLE_ORDER={admin:0,manager:1,staff:2,driver:3};
  const fmtGender=v=>genderLabel(v?.gender,v?.female);
  const parseGenderValue=v=>{
    const legacyFemale=String(v??'').trim().toLowerCase();
    const femaleFlag=['1','true','yes','y','co','có','nu','nữ','female','x'].includes(legacyFemale);
    return normalizeGenderValue(v,femaleFlag);
  };
  const save=d=>{if(isPrivilegedEmployeeRecord(d)!==isFaceMask){window.showToast(isFaceMask?'Chỉ lưu Admin/Ban Giám Đốc trên FACE MASK.':'Admin/Ban Giám Đốc phải quản lý trên FACE MASK.','error');return;}if(edit)setEmployees(p=>p.map(e=>e.id===edit.id?{...e,...d,...(!d.password?{password:edit.password}:{})}:e));else setEmployees(p=>[...p,d]);sm(null);se(null);};
  const del=id=>{if(id===cu.id){window.showToast('Không thể xóa tài khoản đang đăng nhập!','error');return;}window.scfConfirm('Bạn có chắc muốn xóa nhân viên này?','Xóa nhân viên',true).then(ok=>{if(ok){setEmployees(p=>p.filter(e=>e.id!==id));window.showToast('Đã xóa nhân viên','success');}});};
  const savePw=(id,pw,options={})=>{setEmployees(p=>p.map(e=>e.id===id?{...e,password:pw,mustChangePw:!!options.mustChangePw,updatedBy:cu.name,updatedAt:fmtDT()}:e));scp(null);};
  const list=employees
    .filter(e=>{
      if(q&&!e.name.toLowerCase().includes(q.toLowerCase())&&!e.username.toLowerCase().includes(q.toLowerCase())&&!(e.id||'').toLowerCase().includes(q.toLowerCase()))return false;
      if(fRole&&e.role!==fRole)return false;
      if(fDept&&e.dept!==fDept)return false;
      return true;
    })
    .sort((a,b)=>{
      if(sortBy==='role') return (ROLE_ORDER[a.role]??9)-(ROLE_ORDER[b.role]??9);
      if(sortBy==='dept') return (a.dept||'').localeCompare(b.dept||'','vi');
      return (a.id||'').localeCompare(b.id||'','vi',{numeric:true});
    });
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-users',style:{fontSize:20}}),isFaceMask?'Tài khoản Admin & Ban Giám Đốc':'Danh sách nhân viên SCFOOD'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h('div',{style:{display:'flex',gap:6,flexWrap:'wrap',flex:1}},
        h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm nhân viên...'}),
        h('select',{value:fRole,onChange:e=>setFRole(e.target.value),style:{padding:'6px 10px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12}},
          h('option',{value:''},'Tất cả quyền'),
          Object.entries(ROLES).map(([v,l])=>h('option',{key:v,value:v},l))
        ),
        h('select',{value:fDept,onChange:e=>setFDept(e.target.value),style:{padding:'6px 10px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12}},
          h('option',{value:''},'Tất cả bộ phận'),
          (depts&&depts.length?depts.map(d=>d.name):DEPTS).map(d=>h('option',{key:d,value:d},d))
        ),
        h('div',{style:{display:'flex',border:'1px solid var(--bd)',borderRadius:'var(--r)',overflow:'hidden',fontSize:12}},
          [['id','Mã'],['role','Quyền'],['dept','Bộ phận']].map(([k,l])=>h('button',{key:k,
            onClick:()=>setSortBy(k),
            style:{padding:'5px 9px',background:sortBy===k?'var(--pri)':'var(--bg2)',color:sortBy===k?'#fff':'var(--tx)',border:'none',cursor:'pointer',fontSize:11,fontWeight:sortBy===k?600:400}
          },l))
        )
      ),
      h('div',{style:{display:'flex',gap:6}},
        h(ExportBtn,{onClick:()=>{
          const cols=[['id','Mã NV'],['name','Họ tên'],['birthday','Ngày sinh'],['gender','Giới tính'],['dept','Bộ phận'],['role','Phân quyền'],['username','Đăng nhập'],['phone','SĐT'],['email','Email'],['note','Ghi chú']];
          const data=employees.map(e=>Object.fromEntries(cols.map(([k,l])=>[l,k==='gender'?fmtGender(e):(e[k]||'')])));
          const ws=XLSX.utils.json_to_sheet(data);const wb=XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb,ws,'Nhan vien');
          XLSX.writeFile(wb,'Nhan_vien_'+fmtDate().split('/').join('-')+'.xlsx');
        }}),
        canEdit&&h(ImportBtn,{onFile:async rows=>{
          const ROLE_MAP={'Admin':'admin','Quản lý':'manager','Nhân viên':'staff','Lái xe':'driver','admin':'admin','manager':'manager','staff':'staff','driver':'driver'};
          const imported=rows.map(r=>({
            id:(r['Mã NV']||'NV'+uid()).toString().trim(),
            name:r['Họ tên']||'',
            birthday:r['Ngày sinh']||'',
            gender:parseGenderValue(r['Giới tính']||r['Nữ giới']),
            female:isFemaleGender(parseGenderValue(r['Giới tính']||r['Nữ giới'])),
            dept:r['Bộ phận']||(depts&&depts.length?depts[0].name:DEPTS[0]),
            role:ROLE_MAP[r['Phân quyền']]||'staff',
            username:(r['Đăng nhập']||'').toString().trim(),
            password:String(r['Mật khẩu']||generateTemporaryPassword()),mustChangePw:true,
            phone:(r['SĐT']||'').toString(),
            email:r['Email']||'',
            note:r['Ghi chú']||'',
            updatedBy:cu.name,updatedAt:fmtDT()
          })).filter(r=>r.name&&r.username);
          const added=imported.filter(r=>isPrivilegedEmployeeRecord(r)===isFaceMask);
          const rejected=imported.length-added.length;
          setEmployees(p=>{
            const map={};p.forEach(x=>{map[x.id]=x;});
            added.forEach(x=>{map[x.id]=map[x.id]?{...map[x.id],...x,password:map[x.id].password}:x;});
            return Object.values(map);
          });
          window.showToast('Đã nhập/cập nhật '+added.length+' nhân viên.'+(rejected?' Bỏ qua '+rejected+' dòng không thuộc đúng vùng dữ liệu.':'')+' Dòng không có mật khẩu đã được tạo mật khẩu tạm ngẫu nhiên; Admin có thể xem trong hồ sơ nhân viên.','success',7000);
        }}),
        canEdit&&h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Thêm nhân viên'})
      )
    ),
    h('div',{className:'tw'},
      h('table',null,
        h('thead',null,h('tr',null,...['Mã NV','Nhân viên','Ngày sinh','Giới tính','Ngày vào làm','Bộ phận','Phân quyền','BHXH','Đăng nhập','Cập nhật',''].map(c=>h('th',{key:c},c)))),
        h('tbody',null,list.length?list.map(e=>{
          const bd=isBirthday(e.birthday);
          const isFemale=isFemaleGender(e?.gender,e?.female);
          const genderStyle=isFemale
            ?{background:'#FCE7F3',color:'#9D174D'}
            :{background:'#E6F1FB',color:'#185FA5'};
          return h('tr',{key:e.id,style:{background:bd?'rgba(248,195,15,.05)':''}},
            h('td',null,h('span',{style:{color:'var(--pri)',fontWeight:500}},e.id)),
            h('td',null,
              h('div',{style:{display:'flex',alignItems:'center',gap:8}},
                h('div',{style:{width:30,height:30,borderRadius:'50%',background:'var(--bg2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,color:'var(--pri)',flexShrink:0}},initials(e.name)),
                h('div',null,
                  h('div',{style:{fontWeight:500}},e.name+(bd?' 🎂':'')),
                  h('div',{style:{fontSize:11,color:'var(--tx2)'}},e.phone||e.email||'')
                )
              )
            ),
            h('td',null,e.birthday||'—'),
            h('td',null,h('span',{className:'badge',style:genderStyle},isFemale?'Nữ':'Nam')),
            h('td',null,e.startDate||'—'),
            h('td',null,e.dept),
            h('td',null,h('span',{className:'badge '+(RCLS[e.role]||'chip-staff')},ROLES[e.role]||e.role)),
            h('td',null,e.bhxh
              ?h('span',{style:{color:'#2d6a4f',fontWeight:600,fontSize:12,display:'flex',alignItems:'center',gap:4}},h('i',{className:'ti ti-shield-check',style:{fontSize:13}}),'Có')
              :h('span',{style:{color:'var(--tx2)',fontSize:12}},'—')
            ),
            h('td',null,h('span',{style:{fontFamily:'monospace',fontSize:12}},e.username)),
            h('td',null,
              h('div',{style:{fontSize:11,color:'var(--tx2)'}},e.updatedBy||''),
              h('div',{style:{fontSize:11,color:'var(--tx2)'}},e.updatedAt||'')
            ),
            h('td',null,
              h('div',{style:{display:'flex',gap:2}},
                (canEdit||e.id===cu.id)&&h('button',{className:'bi',onClick:()=>scp(e),title:'Đổi MK'},h('i',{className:'ti ti-key',style:{fontSize:14}})),
                canEdit&&h('button',{className:'bi',onClick:()=>{se(e);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
                canEdit&&e.id!==cu.id&&h('button',{className:'bi',onClick:()=>del(e.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
              )
            )
          );
        }):h('tr',null,h('td',{colSpan:11,className:'empty-st'},'Chưa có nhân viên nào.')))
      )
    ),
    modal==='f'&&h(EmpForm,{emp:edit,employees,depts,cu,cu2:cu,onSave:save,onClose:()=>{sm(null);se(null);}}),
    cpw&&h(CpwModal,{emp:cpw,cu,onSave:(pw,options)=>savePw(cpw.id,pw,options),onClose:()=>scp(null)})
  );
}
function BackupTab({employees,materials,assets,garages,prodCats,products,customers,workcats,tasks,advances,rewards,leaves,nccs,purchases,goodsPurchases,depts,prodShiftRules,uiSettings,printTemplateSettings,financeEntries,financeDebts,financeOpenings}){
  function exp(rows,cols,name){const data=rows.map(r=>Object.fromEntries(cols.map(([k,l])=>[l,r[k]??''])));const ws=XLSX.utils.json_to_sheet(data);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,name);XLSX.writeFile(wb,name+'_'+fmtDate().replace(/\//g,'-')+'.xlsx');}
  const purchaseRows=(purchases||[]).flatMap(p=>(p.lines&&p.lines.length?p.lines:[{}]).map(l=>({...p,itemName:l.name||'',itemUnit:l.unit||'',itemQty:l.qty||0,itemPrice:l.price||0,itemTotal:(l.qty||0)*(l.price||0),lineNote:l.note||''})));
  const goodsPurchaseRows=(goodsPurchases||[]).flatMap(p=>(p.lines&&p.lines.length?p.lines:[{}]).map(l=>({...p,itemName:l.name||'',itemUnit:l.unit||'',itemQty:l.qty||0,itemPrice:l.price||0,itemTotal:(l.qty||0)*(l.price||0),lineNote:l.note||''})));
  const safeUi=normalizeUiSettings(uiSettings);
  const safeTemplateSettings=normalizePrintTemplateSettings(printTemplateSettings);
  const uiBackupRows=[{
    fontFamily:fontFamilyLabel(safeUi.fontFamily),
    base:safeUi.scopes.base.size+'px - '+fontModeMeta(safeUi.scopes.base.mode).label,
    form:safeUi.scopes.form.size+'px - '+fontModeMeta(safeUi.scopes.form.mode).label,
    menu:safeUi.scopes.menu.size+'px - '+fontModeMeta(safeUi.scopes.menu.mode).label,
    button:safeUi.scopes.button.size+'px - '+fontModeMeta(safeUi.scopes.button.mode).label,
    table:safeUi.scopes.table.size+'px - '+fontModeMeta(safeUi.scopes.table.mode).label,
    orderqty:safeUi.scopes.orderqty.size+'px - '+fontModeMeta(safeUi.scopes.orderqty.mode).label,
    invoiceqty:safeUi.scopes.invoiceqty.size+'px - '+fontModeMeta(safeUi.scopes.invoiceqty.mode).label,
    header:safeUi.scopes.header.size+'px - '+fontModeMeta(safeUi.scopes.header.mode).label,
    badge:safeUi.scopes.badge.size+'px - '+fontModeMeta(safeUi.scopes.badge.mode).label
  }];
  const printTemplateRows=[...(safeTemplateSettings.labelTemplates||[]).map(t=>({
    type:'Mẫu tem sản phẩm',
    scopeName:templateScopeLabel(t)||'',
    fileName:t.fileName||'',
    sheetNames:(t.sheets||[]).join(', '),
    variableCount:(t.variables||[]).length,
    mappedCount:(t.mappings||[]).filter(x=>x.sourceKey).length,
    uploadedAt:t.uploadedAt||''
  })),...(safeTemplateSettings.orderTemplates||[]).map(t=>({
    type:'Mẫu in đơn khách hàng',
    scopeName:templateScopeLabel(t)||'',
    fileName:t.fileName||'',
    sheetNames:(t.sheets||[]).join(', '),
    variableCount:(t.variables||[]).length,
    mappedCount:(t.mappings||[]).filter(x=>x.sourceKey).length,
    uploadedAt:t.uploadedAt||''
  }))];
  const tables=[
    {name:'Nhân viên',rows:(employees||[]).map(e=>({...e,gender:genderLabel(e?.gender,e?.female)})),cols:[['id','Mã NV'],['name','Tên'],['birthday','Ngày sinh'],['gender','Giới tính'],['dept','Bộ phận'],['role','Quyền'],['username','Đăng nhập'],['phone','SĐT'],['email','Email']]},
    {name:'Bộ phận',rows:(depts||[]).map((d,i)=>({...d,code:d.code||deptCode(i)})),cols:[['code','Mã BP'],['name','Tên bộ phận'],['note','Ghi chú']]},
    {name:'Nguyên vật liệu',rows:materials,cols:[['code','Mã NVL'],['name','Tên nguyên vật liệu'],['group','Nhóm NVL'],['unit','ĐVT'],['price','Đơn giá'],['note','Ghi chú']]},
    {name:'Tài sản',rows:(assets||[]).map((a,i)=>({...a,stt:i+1})),cols:[['stt','Số TT'],['name','Tên tài sản'],['purchaseValue','Giá trị mua'],['currentValue','Giá trị hiện tại'],['replacementMaterial','Vật tư thay thế']]},
    {name:'Gara ô tô',rows:(garages||[]).map(g=>({...g,statusText:g.active===false?'Ngừng sử dụng':'Đang sử dụng'})),cols:[['code','Mã gara'],['name','Tên gara'],['contact','Người liên hệ'],['phone','Số điện thoại'],['address','Địa chỉ'],['taxCode','Mã số thuế'],['statusText','Trạng thái'],['note','Ghi chú']]},
    {name:'Sản phẩm',rows:products.map(p=>({...p,catName:prodCats.find(c=>c.id===p.catId)?.name||''})),cols:[['code','Mã SP'],['name','Tên SP'],['catName','Danh mục'],['unit','ĐVT'],['weightPerUnit','KL/đv (kg)'],['note','Ghi chú']]},
    {name:'Khách hàng',rows:customers,cols:[['id','Mã KH'],['name','Tên KH'],['taxCode','MST'],['address','Địa chỉ'],['note','Ghi chú']]},
    {name:'Công việc',rows:workcats,cols:[['code','Mã CV'],['name','Tên CV'],['dept','Bộ phận'],['desc','Mô tả công việc'],['duration','Thời gian'],['qualityReq','Yêu cầu chất lượng'],['unit','ĐV KL'],['rate','Đơn giá'],['note','Ghi chú']]},
    {name:'Giao việc',rows:tasks||[],cols:[['id','Mã phiếu'],['date','Ngày'],['empName','Nhân viên'],['dept','Bộ phận'],['workCatName','Công việc'],['workDesc','Mô tả công việc'],['workDuration','Thời gian'],['qualityReq','Yêu cầu chất lượng'],['qtyAssign','KL giao'],['qtyReport','KL báo cáo'],['qtyApproved','KL duyệt'],['unit','ĐVT'],['rate','Đơn giá'],['status','Trạng thái'],['location','Địa điểm'],['note','Ghi chú giao'],['reportNote','Ghi chú báo cáo'],['reviewNote','Nhận xét quản lý']]},
    {name:'Ứng lương',rows:advances||[],cols:[['id','Mã phiếu'],['date','Ngày'],['empId','Mã NV'],['empName','Nhân viên'],['dept','Bộ phận'],['amount','Số tiền đề nghị'],['approvedAmount','Số tiền duyệt'],['reason','Lý do'],['note','Ghi chú phiếu'],['status','Trạng thái'],['reviewNote','Ghi chú duyệt'],['approvedBy','Người duyệt']]},
    {name:'Thưởng phạt',rows:rewards||[],cols:[['id','Mã phiếu'],['date','Ngày'],['empId','Mã NV'],['empName','Nhân viên'],['dept','Bộ phận'],['kind','Loại'],['amount','Số tiền đề nghị'],['approvedAmount','Số tiền duyệt'],['reason','Nội dung'],['note','Ghi chú phiếu'],['status','Trạng thái'],['reviewNote','Ghi chú duyệt'],['approvedBy','Người duyệt']]},
    {name:'Xin nghỉ',rows:leaves||[],cols:[['id','Mã đơn'],['fromDate','Từ ngày'],['toDate','Đến ngày'],['empId','Mã NV'],['empName','Nhân viên'],['dept','Bộ phận'],['type','Hình thức'],['days','Số ngày đề nghị'],['approvedDays','Số ngày duyệt'],['reason','Lý do'],['note','Ghi chú đơn'],['status','Trạng thái'],['reviewNote','Ghi chú duyệt'],['approvedBy','Người duyệt']]},
    {name:'Giao diện',rows:uiBackupRows,cols:[['fontFamily','Loại chữ'],['base','Nội dung chung'],['form','Ô nhập liệu'],['menu','Menu điều hướng'],['button','Nút chức năng'],['table','Nội dung bảng'],['header','Tiêu đề bảng'],['badge','Nhãn trạng thái']]},
    {name:'Mẫu in Excel',rows:printTemplateRows,cols:[['type','Loại mẫu'],['scopeName','Đối tượng áp dụng'],['fileName','Tên file'],['sheetNames','Sheet'],['variableCount','Số biến'],['mappedCount','Đã mapping'],['uploadedAt','Cập nhật']]},
    {name:'Ca SX nhỏ',rows:prodShiftRules||[],cols:[['name','Tên ca'],['group','Ca lớn'],['start','Từ giờ'],['end','Đến giờ'],['active','Hoạt động']]},
    {name:'Nhà cung cấp',rows:nccs||[],cols:[['code','Mã NCC'],['name','Tên NCC'],['taxCode','MST'],['phone','Điện thoại'],['email','Email'],['contact','Người LH'],['address','Địa chỉ'],['note','Ghi chú']]},
    {name:'Đơn mua NVL',rows:purchaseRows,cols:[['id','Mã đơn'],['nccName','Nhà cung cấp'],['orderDate','Ngày đặt'],['deliveryDate','Hạn giao'],['receivedDate','Ngày nhận'],['invoiceNo','Số hóa đơn'],['status','Trạng thái'],['paymentStatus','Thanh toán'],['itemName','Mặt hàng'],['itemUnit','ĐVT'],['itemQty','Số lượng'],['itemPrice','Đơn giá'],['itemTotal','Thành tiền'],['note','Ghi chú đơn'],['lineNote','Ghi chú dòng']]},
    {name:'Đơn mua hàng hóa',rows:goodsPurchaseRows,cols:[['id','Mã đơn'],['nccName','Nhà cung cấp'],['orderDate','Ngày đặt'],['deliveryDate','Hạn giao'],['receivedDate','Ngày nhận'],['invoiceNo','Số hóa đơn'],['status','Trạng thái'],['paymentStatus','Thanh toán'],['itemName','Mặt hàng'],['itemUnit','ĐVT'],['itemQty','Số lượng'],['itemPrice','Đơn giá'],['itemTotal','Thành tiền'],['note','Ghi chú đơn'],['lineNote','Ghi chú dòng']]},
    {name:'Sổ thu chi',rows:financeEntries||[],cols:[['id','Mã'],['date','Ngày'],['direction','Tiền vào/ra'],['category','Nhóm thu chi'],['partnerName','Đối tượng'],['method','Phương thức'],['amount','Số tiền'],['pnlType','Phân loại KQKD'],['reference','Chứng từ'],['note','Ghi chú']]},
    {name:'Công nợ',rows:financeDebts||[],cols:[['id','Mã'],['kind','Loại'],['partnerName','Đối tượng'],['date','Ngày ghi nhận'],['dueDate','Hạn thanh toán'],['invoiceNo','Chứng từ'],['amount','Giá trị'],['paidAmount','Đã thanh toán'],['status','Trạng thái'],['note','Ghi chú']]},
    {name:'Số dư đầu tháng',rows:financeOpenings||[],cols:[['month','Tháng'],['cash','Tiền mặt'],['bank','Ngân hàng'],['updatedBy','Người cập nhật'],['updatedAt','Cập nhật lúc']]},
  ];
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-database-export',style:{fontSize:20}}),'Backup & Xuất dữ liệu'),
    h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:'1rem'}},
      tables.map(t=>h('div',{key:t.name,className:'card'},
        h('div',{style:{display:'flex',alignItems:'center',gap:10,marginBottom:12}},
          h('div',{style:{width:38,height:38,background:'var(--bg2)',borderRadius:'var(--r)',display:'flex',alignItems:'center',justifyContent:'center'}},h('i',{className:'ti ti-table',style:{fontSize:18,color:'var(--pri)'}})),
          h('div',null,h('div',{style:{fontWeight:500}},t.name),h('div',{style:{fontSize:12,color:'var(--tx2)'}},t.rows.length+' bản ghi'))
        ),
        h('button',{className:'bp',onClick:()=>exp(t.rows,t.cols,t.name),style:{width:'100%'}},h('i',{className:'ti ti-download',style:{fontSize:14}}),'Xuất Excel')
      )),
      h('div',{className:'card'},
        h('div',{style:{display:'flex',alignItems:'center',gap:10,marginBottom:12}},
          h('div',{style:{width:38,height:38,background:'var(--bg2)',borderRadius:'var(--r)',display:'flex',alignItems:'center',justifyContent:'center'}},h('i',{className:'ti ti-file-zip',style:{fontSize:18,color:'var(--pri)'}})),
          h('div',null,h('div',{style:{fontWeight:500}},'Tất cả dữ liệu'),h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Xuất tất cả vào 1 file'))
        ),
        h('button',{className:'bp',onClick:()=>{const wb=XLSX.utils.book_new();tables.forEach(t=>{const data=t.rows.map(r=>Object.fromEntries(t.cols.map(([k,l])=>[l,r[k]??''])));XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(data),t.name);});XLSX.writeFile(wb,'SCF_Backup_'+fmtDate().replace(/\//g,'-')+'.xlsx');},style:{width:'100%'}},h('i',{className:'ti ti-download',style:{fontSize:14}}),'Xuất tất cả')
      )
    )
  );
}
function PlaceholderTab({title,icon}){
  const descMap={
    'CÔNG KẾ TOÁN':'Báo công của công kế toán.',
    'CÔNG SẢN XUẤT':'Báo công của nhân viên sản xuất.',
    'CÔNG LÁI XE':'Báo công của lái xe.',
    'TỔNG CÔNG':'Tổng hợp báo công. Nhân viên chỉ xem được công của mình; quản lý xem được toàn bộ.',
    'QUY TRÌNH KẾ TOÁN':'Quy trình từ nhận đơn, đối chiếu giao hàng đến thu hồi và kiểm tra hóa đơn.',
    'QT SẢN XUẤT BÚN':'Quy trình sản xuất bún theo ca, sản lượng và yêu cầu chất lượng.',
    'QT SX PHỞ':'Quy trình sản xuất phở theo đơn hàng, ca sản xuất và tiêu chuẩn thành phẩm.',
    'QT SX BÁNH CUỐN':'Quy trình sản xuất bánh cuốn theo kế hoạch, đóng gói và bàn giao.',
    'BÁO CÁO BÁN HÀNG':'Tổng hợp báo cáo bán hàng.',
    'BÁO CÁO MUA HÀNG':'Tổng hợp báo cáo mua hàng.',
    'BẢO DƯỠNG XE':'Quản lý lịch và nội dung bảo dưỡng xe.',
    'BẢO DƯỠNG MÁY':'Quản lý lịch và nội dung bảo dưỡng máy.'
  };
  const tagMap={
    'CÔNG KẾ TOÁN':'Báo công kế toán',
    'CÔNG SẢN XUẤT':'Báo công sản xuất',
    'CÔNG LÁI XE':'Báo công lái xe',
    'TỔNG CÔNG':'Tổng hợp công',
    'QUY TRÌNH KẾ TOÁN':'Quy trình',
    'QT SẢN XUẤT BÚN':'Quy trình',
    'QT SX PHỞ':'Quy trình',
    'QT SX BÁNH CUỐN':'Quy trình',
    'BÁO CÁO BÁN HÀNG':'Báo cáo',
    'BÁO CÁO MUA HÀNG':'Báo cáo',
    'BẢO DƯỠNG XE':'Bảo dưỡng',
    'BẢO DƯỠNG MÁY':'Bảo dưỡng'
  };
  const desc=descMap[title]||'Module này đang được phát triển và sẽ ra mắt trong thời gian tới.';
  const tag=tagMap[title]||'Đang phát triển';
  return h('div',{style:{textAlign:'center',padding:'4rem 2rem',color:'var(--tx2)'}},
    h('div',{style:{width:80,height:80,borderRadius:'50%',background:'var(--bg2)',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 1.25rem'}},
      h('i',{className:'ti '+icon,style:{fontSize:36,color:'var(--pri2)'}})
    ),
    h('h2',{style:{fontSize:18,fontWeight:500,marginBottom:8,color:'var(--tx)'}},title),
    h('p',{style:{fontSize:14,maxWidth:360,margin:'0 auto'}},desc),
    h('div',{style:{marginTop:'1.5rem',display:'inline-flex',alignItems:'center',gap:6,fontSize:12,background:'var(--bg2)',borderRadius:20,padding:'6px 14px',color:'var(--tx2)'}},
      h('i',{className:'ti '+(tagMap[title]?'ti-clipboard-check':'ti-clock'),style:{fontSize:13}}),tag
    )
  );
}

function MaintenanceTab({title,icon,assets,employees,garages=[],setPage}){
  const storageKey='scf_'+(title==='Bảo dưỡng xe'?'maint_vehicle':'maint_machine');
  const isVehicle=title==='Bảo dưỡng xe';
  const normalizeText=s=>normalizePlainText(s);
  const makeEmptyForm=()=>({month:'',date:'',vehicle:'',service:'',km:'',garageId:'',garage:'',repairerIds:[],repairerNames:[],repairerText:'',amount:'',invoice:'',invoiceImage:'',invoiceImageName:'',repairImage:'',repairImageName:'',repairImages:[]});
  const toIsoDate=v=>{
    const s=String(v||'').trim();
    if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    const m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if(m) return `${m[3]}-${String(m[2]).padStart(2,'0')}-${String(m[1]).padStart(2,'0')}`;
    const d=new Date(s);
    if(!Number.isNaN(d.getTime())) return d.toISOString().slice(0,10);
    return '';
  };
  const fmtDateText=v=>{
    const s=String(v||'').trim();
    const m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if(m) return `${m[3]}/${m[2]}/${m[1]}`;
    return s;
  };
  const defaultItems=isVehicle
    ?[
        {id:'BD001',month:'2025-11',date:'2025-11-04',vehicle:'21748',service:'thay bơm nước rửa kính, mua nước kính 50k',km:'194.000',garage:'HẢI THẮNG LỢI',amount:'500.000',invoice:''},
        {id:'BD002',month:'2025-11',date:'2025-11-24',vehicle:'21748',service:'bảo dưỡng định kỳ',km:'194.000',garage:'HẢI THẮNG LỢI',amount:'1.320.000',invoice:''},
      ]
    :[
        {id:'BD001',month:'2025-11',date:'2025-11-04',vehicle:'Máy đóng gói 01',service:'bảo dưỡng định kỳ, tra dầu, vệ sinh cụm dao cắt',repairerIds:[],repairerNames:['Tổ cơ điện'],repairerText:'Tổ cơ điện',amount:'500.000',invoice:''},
        {id:'BD002',month:'2025-11',date:'2025-11-24',vehicle:'Máy ép khuôn 02',service:'thay bạc đạn, cân chỉnh lại cụm truyền động',repairerIds:[],repairerNames:['Nguyễn Văn A','Trần Văn B'],repairerText:'Nguyễn Văn A, Trần Văn B',amount:'1.320.000',invoice:''},
      ];
  const [items,_setItems]=useState(()=>{try{const s=localStorage.getItem(storageKey);return s?JSON.parse(s):[
    ...defaultItems
  ]}catch{return[
    ...defaultItems
  ]}});
  const setItems=mkSet(storageKey,_setItems);
  const [modal,sm]=useState(null);
  const [edit,se]=useState(null);
  const [imageView,setImageView]=useState(null);
  const [q,sq]=useState('');
  const [df,sdf]=useState('');
  const [dt,sdt]=useState('');
  const [form,setForm]=useState(makeEmptyForm());
  const [uploading,setUploading]=useState('');
  const assetOptions=(assets||[]).map(a=>a.name||a.code||a.id).filter(Boolean).sort((a,b)=>a.localeCompare(b,'vi'));
  const garageOptions=(garages||[]).filter(g=>g&&g.name&&(g.active!==false||String(g.id||'')===String(form.garageId||''))).slice().sort((a,b)=>String(a.name).localeCompare(String(b.name),'vi'));
  const matchedFormGarage=garageOptions.find(g=>String(g.id||'')===String(form.garageId||'')||normalizeText(g.name)===normalizeText(form.garage));
  const garageSelectValue=matchedFormGarage?String(matchedFormGarage.id||''):(form.garage?'__legacy__':'');
  const repairerOptions=(employees||[])
    .filter(emp=>{
      if(isVehicle) return true;
      const role=String(emp?.role||'').trim().toLowerCase();
      const dept=normalizeText(emp?.dept);
      return role==='staff' && dept.includes('san xuat') && !isFemaleGender(emp?.gender,emp?.female);
    })
    .map(emp=>{
      const id=String(emp?.id||emp?.code||emp?.username||emp?.name||'').trim();
      const name=String(emp?.name||emp?.fullName||emp?.id||'').trim();
      if(!id&&!name) return null;
      return {id:id||name,name:name||id,label:[emp?.id||emp?.code||'',emp?.name||emp?.fullName||''].filter(Boolean).join(' - ')||id||name};
    })
    .filter(Boolean)
    .sort((a,b)=>a.label.localeCompare(b.label,'vi'));
  useEffect(()=>{
    let off=false;
    dbGet(storageKey,items).then(data=>{if(!off&&data)_setItems(data);});
    return ()=>{off=true;};
  },[storageKey]);
  const normalizeExcelDate=v=>{
    if(v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0,10);
    if(typeof v==='number'&&Number.isFinite(v)){
      const ms=Math.round((v-25569)*86400*1000);
      const d=new Date(ms);
      if(!Number.isNaN(d.getTime())) return d.toISOString().slice(0,10);
    }
    return toIsoDate(v);
  };

  const getRepairImages=r=>{
    const list=Array.isArray(r?.repairImages)?r.repairImages.filter(x=>x&&x.url):[];
    if(list.length) return list;
    if(r?.repairImage) return [{url:r.repairImage,name:r.repairImageName||'anh-sua-chua.jpg'}];
    return [];
  };
  const getRepairerIds=r=>Array.isArray(r?.repairerIds)?r.repairerIds.map(x=>String(x||'').trim()).filter(Boolean):[];
  const getRepairerNames=r=>{
    const direct=Array.isArray(r?.repairerNames)?r.repairerNames.map(x=>String(x||'').trim()).filter(Boolean):[];
    if(direct.length) return [...new Set(direct)];
    const legacy=Array.isArray(r?.repairers)?r.repairers.map(x=>String(x||'').trim()).filter(Boolean):[];
    if(legacy.length) return [...new Set(legacy)];
    const fallback=String(r?.repairerText||(!isVehicle?(r?.garage||''):'')).split(',').map(x=>x.trim()).filter(Boolean);
    return [...new Set(fallback)];
  };
  const getRepairerText=r=>getRepairerNames(r).join(', ');
  const normalizeMaintenanceItem=item=>{
    const repairImages=getRepairImages(item);
    const linkedGarage=(garages||[]).find(g=>String(g.id||'')===String(item?.garageId||'')||(!item?.garageId&&normalizeText(g.name)===normalizeText(item?.garage)));
    return {
      ...makeEmptyForm(),
      ...item,
      repairerIds:getRepairerIds(item),
      repairerNames:getRepairerNames(item),
      repairerText:getRepairerText(item),
      garageId:item?.garageId||linkedGarage?.id||'',
      repairImages,
      repairImage:repairImages[0]?.url||'',
      repairImageName:repairImages[0]?.name||''
    };
  };
  const openAdd=()=>{se(null);setForm({...makeEmptyForm(),date:isoDate(),month:isVehicle?'':isoDate().slice(0,7)});sm('f');};
  const openEdit=item=>{se(item);setForm({...normalizeMaintenanceItem(item),date:toIsoDate(item.date)});sm('f');};
  const save=()=>{if(!form.date||!form.vehicle||!form.service){window.showToast('Nhập ngày, xe/máy và dịch vụ.','warn');return;}
    const repairImages=getRepairImages(form);
    const repairerIds=isVehicle?[]:getRepairerIds(form);
    const repairerNames=isVehicle?[]:getRepairerNames(form);
    const row={
      ...form,
      date:toIsoDate(form.date)||form.date,
      id:edit?.id||('BD'+uid()),
      repairerIds,
      repairerNames,
      repairerText:repairerNames.join(', '),
      km:isVehicle?form.km:'',
      garageId:isVehicle?(form.garageId||''):'',
      garage:isVehicle?form.garage:'',
      repairImages,
      repairImage:repairImages[0]?.url||'',
      repairImageName:repairImages[0]?.name||''
    };
    setItems(prev=>edit?prev.map(x=>x.id===edit.id?row:x):[row,...prev]);
    sm(null);se(null);window.showToast('Đã lưu bảo dưỡng','success');
  };
  const del=id=>window.scfConfirm('Bạn có chắc muốn xóa dòng bảo dưỡng này?','Xóa bảo dưỡng',true).then(ok=>{if(ok){setItems(p=>p.filter(x=>x.id!==id));window.showToast('Đã xóa dòng bảo dưỡng','success');}});
  const filtered=(items||[])
    .map(normalizeMaintenanceItem)
    .filter(x=>{
      const searchText=(isVehicle
        ? [x.month,x.date,x.vehicle,x.service,x.km,x.garage,x.amount,x.invoice,x.invoiceImageName,x.repairImageName,...getRepairImages(x).map(img=>img.name||'')]
        : [x.month,x.date,x.vehicle,x.service,getRepairerText(x),x.amount,x.invoice,x.invoiceImageName,x.repairImageName,...getRepairImages(x).map(img=>img.name||'')]
      ).join(' ').toLowerCase();
      if(q && !searchText.includes(q.toLowerCase())) return false;
      const d=parseAnyDate(x.date);
      if(df){
        const fd=parseAnyDate(df);
        if(fd&&d&&d<fd) return false;
      }
      if(dt){
        const td=parseAnyDate(dt);
        if(td&&d&&d>td) return false;
      }
      return true;
    })
    .slice()
    .sort((a,b)=>{
      const da=parseAnyDate(a.date);
      const db=parseAnyDate(b.date);
      return (db?db.getTime():0)-(da?da.getTime():0);
    });
  const exportCols=(isVehicle
    ?[['date','NGÀY BẢO DƯỠNG'],['vehicle','TÊN XE/MÁY'],['service','DỊCH VỤ'],['km','TẠI KM'],['garage','GARA'],['amount','THÀNH TIỀN'],['invoice','HÓA ĐƠN']]
    :[['month','THÁNG'],['date','NGÀY BẢO DƯỠNG'],['vehicle','TÊN XE/MÁY'],['service','DỊCH VỤ'],['repairerText','NGƯỜI SỬA'],['amount','THÀNH TIỀN'],['invoice','HÓA ĐƠN']]);
  const maintenanceInvoiceLabel=r=>{
    const repairCount=getRepairImages(r).length;
    if(r.invoiceImage&&repairCount) return repairCount>1?('Ảnh hóa đơn + '+repairCount+' ảnh sửa chữa'):'Ảnh hóa đơn + ảnh sửa chữa';
    if(r.invoiceImage) return 'Ảnh hóa đơn';
    if(repairCount) return repairCount>1?(repairCount+' ảnh sửa chữa'):'Ảnh sửa chữa';
    return r.invoice||'—';
  };
  const openImageViewer=(title,images,startIndex=0,kind='')=>{
    const list=(images||[]).filter(x=>x&&x.url);
    if(!list.length)return;
    setImageView({title,images:list,index:Math.max(0,Math.min(startIndex,list.length-1)),kind});
  };
  const pickMaintenanceImage=async(kind,files)=>{
    const picked=Array.from(files||[]).filter(Boolean);
    if(!picked.length)return;
    try{
      setUploading(kind);
      const folderBase=kind==='invoice'
        ?'maintenance/invoices/'+(edit?.id||'new')
        :'maintenance/repairs/'+(edit?.id||'new');
      if(kind==='invoice'){
        const file=picked[0];
        const url=await uploadPhoto(file,folderBase,{max:1000,quality:.65});
        const next={...form,invoiceImage:url,invoiceImageName:file.name||'hoa-don-bao-duong.jpg'};
        setForm(next);
        if(edit)setItems(prev=>prev.map(x=>x.id===edit.id?{...x,invoiceImage:next.invoiceImage,invoiceImageName:next.invoiceImageName}:x));
      }else{
        const uploaded=[];
        for(const file of picked){
          const url=await uploadPhoto(file,folderBase,{max:1000,quality:.65});
          uploaded.push({url,name:file.name||'anh-sua-chua.jpg'});
        }
        const prevImages=getRepairImages(form);
        const repairImages=[...prevImages,...uploaded];
        const next={...form,repairImages,repairImage:repairImages[0]?.url||'',repairImageName:repairImages[0]?.name||''};
        setForm(next);
        if(edit)setItems(prev=>prev.map(x=>x.id===edit.id?{...x,repairImages:next.repairImages,repairImage:next.repairImage,repairImageName:next.repairImageName}:x));
      }
      window.showToast(kind==='invoice'?'Đã lưu ảnh hóa đơn':('Đã lưu '+picked.length+' ảnh sửa chữa'),'success');
    }catch(e){
      window.showToast(kind==='invoice'?'Chưa tải được ảnh hóa đơn.':'Chưa tải được ảnh sửa chữa.','error');
    }finally{
      setUploading('');
    }
  };
  const clearMaintenanceImage=(kind,index=null)=>{
    if(kind==='invoice'){
      const next={...form,invoiceImage:'',invoiceImageName:''};
      setForm(next);
      if(edit)setItems(prev=>prev.map(x=>x.id===edit.id?{...x,invoiceImage:'',invoiceImageName:''}:x));
    }else{
      const repairImages=getRepairImages(form);
      const nextImages=index===null?[]:repairImages.filter((_,i)=>i!==index);
      const next={...form,repairImages:nextImages,repairImage:nextImages[0]?.url||'',repairImageName:nextImages[0]?.name||''};
      setForm(next);
      if(edit)setItems(prev=>prev.map(x=>x.id===edit.id?{...x,repairImages:next.repairImages,repairImage:next.repairImage,repairImageName:next.repairImageName}:x));
    }
  };
  const requestClearMaintenanceImage=(kind,index=null)=>{
    const one=index!==null;
    const message=kind==='invoice'
      ?'Bạn có chắc muốn xóa ảnh hóa đơn này?'
      :(one?'Bạn có chắc muốn xóa ảnh sửa chữa này?':'Bạn có chắc muốn xóa toàn bộ ảnh sửa chữa?');
    window.scfConfirm(message,'Xác nhận xóa ảnh',true).then(ok=>{
      if(!ok)return;
      clearMaintenanceImage(kind,index);
      setImageView(null);
      window.showToast('Đã xóa ảnh','success');
    });
  };
  const deleteViewedImage=()=>{
    if(!imageView?.kind)return;
    requestClearMaintenanceImage(imageView.kind,imageView.kind==='repair'?imageView.index:null);
  };
  const toggleRepairer=option=>setForm(prev=>{
    const selectedIds=getRepairerIds(prev);
    const selectedNames=getRepairerNames(prev);
    const exists=selectedIds.includes(option.id)||selectedNames.includes(option.name);
    if(exists){
      const nextIds=selectedIds.filter(id=>id!==option.id);
      const nextNames=selectedNames.filter(name=>name!==option.name);
      return {...prev,repairerIds:nextIds,repairerNames:nextNames,repairerText:nextNames.join(', ')};
    }
    const nextIds=[...new Set([...selectedIds,option.id])];
    const nextNames=[...new Set([...selectedNames,option.name])];
    return {...prev,repairerIds:nextIds,repairerNames:nextNames,repairerText:nextNames.join(', ')};
  });
  const renderImageField=(kind,label,image,imageName,legacyText='')=>{
    const isRepair=kind==='repair';
    const repairImages=isRepair?getRepairImages(form):[];
    const hasImage=isRepair?repairImages.length:!!image;
    return h(F,{label},
      h('div',{style:{display:'grid',gap:10}},
        h('div',{style:{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}},
          hasImage&&h('button',{type:'button',onClick:()=>openImageViewer(label,isRepair?repairImages:[{url:image,name:imageName||label}],0,isRepair?'repair':'invoice'),style:{fontSize:12,padding:'6px 12px'}},
            h('i',{className:'ti ti-photo',style:{fontSize:14}}),isRepair?('Xem '+repairImages.length+' ảnh'):'Xem ảnh'
          ),
          h('label',{style:{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',border:'1px solid var(--bd)',borderRadius:'var(--r)',cursor:uploading?'wait':'pointer',background:'#fff'}},
            h('i',{className:'ti '+(uploading===kind?'ti-loader-2 spin':'ti-camera-plus'),style:{fontSize:14}}),
            uploading===kind?'Đang tải ảnh...':(isRepair?'Chụp / thêm ảnh':'Chụp / tải ảnh'),
            h('input',{type:'file',accept:'image/*',capture:'environment',multiple:isRepair,style:{display:'none'},disabled:!!uploading,onChange:e=>pickMaintenanceImage(kind,e.target.files)})
          )
        ),
        isRepair
          ?repairImages.length
            ?h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(92px,1fr))',gap:8}},
                repairImages.map((img,idx)=>h('div',{key:(img.url||'')+'_'+idx,style:{border:'1px solid var(--bd)',borderRadius:'var(--r)',padding:6,background:'#fff'}},
                  h('button',{type:'button',onClick:()=>openImageViewer(label,repairImages,idx),style:{padding:0,border:'none',background:'transparent',display:'block',width:'100%'}},
                    h('img',{src:img.url,alt:(img.name||label)+' '+(idx+1),style:{width:'100%',aspectRatio:'1 / 1',objectFit:'cover',borderRadius:'6px',display:'block'}})
                  ),
                  h('div',{style:{fontSize:11,color:'var(--tx2)',marginTop:4,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}},img.name||('Ảnh '+(idx+1))),
                  h('div',{style:{display:'flex',justifyContent:'space-between',marginTop:4}},
                    h('button',{type:'button',className:'bi',title:'Xem ảnh',onClick:()=>openImageViewer(label,repairImages,idx,'repair')},h('i',{className:'ti ti-photo',style:{fontSize:14}}))
                  )
                ))
              )
            :h('div',{style:{fontSize:12,color:'var(--tx2)'}},legacyText||'Có thể chụp nhiều ảnh sửa chữa để lưu cùng một lần bảo dưỡng.')
          :h('div',null,
              imageName&&h('span',{style:{fontSize:12,color:'var(--tx2)'}},imageName),
              image&&h('img',{src:image,alt:label,style:{width:'100%',maxWidth:220,height:'auto',borderRadius:'var(--r)',border:'1px solid var(--bd)',display:'block',marginTop:imageName?8:0}}),
              !image&&h('div',{style:{fontSize:12,color:'var(--tx2)'}},legacyText||'Có thể tải ảnh từ máy hoặc chụp trực tiếp bằng camera.')
            )
      )
    );
  };
  const onImport=rows=>{
    const mapped=rows.map(r=>({
      id:'BD'+uid(),
      month:isVehicle?'':(r['THÁNG']||r['Month']||''),
      date:normalizeExcelDate(r['NGÀY BẢO DƯỠNG']||r['Ngày bảo dưỡng']||r['DATE']||r['Date']||r['date']||''),
      vehicle:r['TÊN XE/MÁY']||r['Tên xe']||r['Tên máy']||'',
      service:r['DỊCH VỤ']||r['Dịch vụ']||r['Nội dung']||'',
      km:isVehicle?(r['TẠI KM']||r['KM']||r['Odometer']||''):'',
      garageId:isVehicle?String((garages||[]).find(g=>normalizeText(g.name)===normalizeText(r['GARA']||r['Gara']||''))?.id||''):'',
      garage:isVehicle?(r['GARA']||r['Gara']||''):'',
      repairerText:isVehicle?'':(r['NGƯỜI SỬA']||r['Người sửa']||''),
      repairerIds:[],
      repairerNames:isVehicle?[]:String(r['NGƯỜI SỬA']||r['Người sửa']||'').split(',').map(x=>x.trim()).filter(Boolean),
      amount:r['THÀNH TIỀN']||r['Thành tiền']||r['Số tiền']||'',
      invoice:r['HÓA ĐƠN']||r['Hóa đơn']||'',
      invoiceImage:'',
      invoiceImageName:'',
      repairImage:'',
      repairImageName:'',
      repairImages:[],
    })).filter(x=>x.date||x.vehicle||x.service);
    if(!mapped.length){window.showToast('Không có dòng hợp lệ để nhập.','warn');return;}
    setItems(prev=>[...mapped,...prev]);
    window.showToast('Đã nhập '+mapped.length+' dòng bảo dưỡng','success');
  };
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti '+icon,style:{fontSize:20}}),title),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}} ,
      h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Lọc theo ngày và từ khóa để xem nhanh trên điện thoại.'),
      h('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},
        isVehicle&&setPage&&h('button',{type:'button',onClick:()=>setPage('garages')},h('i',{className:'ti ti-building-store',style:{fontSize:14}}),'Danh mục Gara'),
        h(ExportBtn,{onClick:()=>xlsxExport(filtered,exportCols,(isVehicle?'Bao_duong_xe':'Bao_duong_may'))}),
        h(ImportBtn,{onFile:onImport}),
        h(AddBtn,{onClick:openAdd,label:'Thêm '+(title==='Bảo dưỡng xe'?'bảo dưỡng xe':'bảo dưỡng máy')})
      )
    ),
    h('div',{className:'card',style:{marginBottom:'1rem',padding:'12px 14px'}},
      h('div',{className:'responsive-filter-grid',style:{gridTemplateColumns:'1.4fr 1fr 1fr auto'}},
        h(F,{label:'Tìm nhanh'},h(SearchBar,{value:q,onChange:sq,placeholder:isVehicle?'Xe, dịch vụ, gara...':'Máy, dịch vụ, người sửa...'})),
        h(F,{label:'Từ ngày'},h('input',{type:'date',value:df,onChange:e=>sdf(e.target.value)})),
        h(F,{label:'Đến ngày'},h('input',{type:'date',value:dt,onChange:e=>sdt(e.target.value)})),
        h('button',{type:'button',onClick:()=>{sq('');sdf('');sdt('');},style:{height:38,alignSelf:'end'}},h('i',{className:'ti ti-filter-off',style:{fontSize:14}}),'Xóa lọc')
      )
    ),
    h('div',{className:'mobile-only mobile-card-list'},
      filtered.length?filtered.map(x=>h('div',{key:'m_'+x.id,className:'mobile-data-card'},
        h('div',{className:'mobile-data-head'},
          h('div',null,
            h('div',{className:'mobile-data-title'},x.vehicle||'—'),
            !isVehicle&&h('div',{className:'mobile-data-sub'},'Tháng: '+(x.month||'—'))
          ),
          h('div',{className:'mobile-data-sub'},fmtDateText(x.date)||'—')
        ),
        h('div',{className:'mobile-data-text'},x.service||'—'),
        h('div',{className:'mobile-data-grid'},
          isVehicle
            ?h('div',{className:'mobile-data-item'},h('b',null,'KM'),h('span',null,x.km||'—'))
            :h('div',{className:'mobile-data-item'},h('b',null,'Người sửa'),h('span',null,getRepairerText(x)||'—')),
          isVehicle&&h('div',{className:'mobile-data-item'},h('b',null,'Gara'),h('span',null,x.garage||'—')),
          h('div',{className:'mobile-data-item'},h('b',null,'Thành tiền'),h('span',null,x.amount||'—')),
          h('div',{className:'mobile-data-item'},h('b',null,'Ảnh chứng từ'),h('span',null,maintenanceInvoiceLabel(x)))
        ),
        h('div',{style:{display:'flex',gap:8,flexWrap:'wrap'}},
          x.invoiceImage&&h('button',{type:'button',className:'bi',title:'Xem ảnh hóa đơn',onClick:()=>openImageViewer('Ảnh hóa đơn',[{url:x.invoiceImage,name:x.invoiceImageName||'hoa-don.jpg'}],0)},h('i',{className:'ti ti-photo',style:{fontSize:15,color:'var(--pri)'}})),
          getRepairImages(x).length>0&&h('button',{type:'button',className:'bi',title:'Xem ảnh sửa chữa',onClick:()=>openImageViewer('Ảnh sửa chữa',getRepairImages(x),0)},h('i',{className:'ti ti-tool',style:{fontSize:15,color:'#C2410C'}}))
        ),
        h('div',{className:'mobile-data-actions'},
          h('button',{className:'bi',onClick:()=>openEdit(x)},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
          h('button',{className:'bi',onClick:()=>del(x.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
        )
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có dữ liệu bảo dưỡng nào.')
    ),
    h('div',{className:'tw desktop-only'},
      h('table',null,
          h('thead',null,h('tr',null,...(isVehicle?['NGÀY BẢO DƯỠNG','TÊN XE/MÁY','DỊCH VỤ','TẠI KM','GARA','THÀNH TIỀN','ẢNH CHỨNG TỪ','']:['THÁNG','NGÀY BẢO DƯỠNG','TÊN XE/MÁY','DỊCH VỤ','NGƯỜI SỬA','THÀNH TIỀN','ẢNH CHỨNG TỪ','']).map(c=>h('th',{key:c},c)))),
        h('tbody',null,filtered.length?filtered.map(x=>isVehicle
          ?h('tr',{key:x.id},
              h('td',null,fmtDateText(x.date)||'—'),
              h('td',null,h('div',{style:{fontWeight:600}},x.vehicle||'—')),
              h('td',null,h('div',{style:{maxWidth:520,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}},x.service||'—')),
              h('td',null,x.km||'—'),
              h('td',null,x.garage||'—'),
              h('td',null,x.amount||'—'),
              h('td',null,h('div',{style:{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}},
                h('span',null,maintenanceInvoiceLabel(x)),
                x.invoiceImage&&h('button',{type:'button',className:'bi',title:'Xem ảnh hóa đơn',onClick:()=>openImageViewer('Ảnh hóa đơn',[{url:x.invoiceImage,name:x.invoiceImageName||'hoa-don.jpg'}],0)},h('i',{className:'ti ti-photo',style:{fontSize:15,color:'var(--pri)'}})),
                getRepairImages(x).length>0&&h('button',{type:'button',className:'bi',title:'Xem ảnh sửa chữa',onClick:()=>openImageViewer('Ảnh sửa chữa',getRepairImages(x),0)},h('i',{className:'ti ti-tool',style:{fontSize:15,color:'#C2410C'}}))
              )),
              h('td',null,h('div',{style:{display:'flex',gap:2}},
                h('button',{className:'bi',onClick:()=>openEdit(x)},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
                h('button',{className:'bi',onClick:()=>del(x.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
              ))
            )
          :h('tr',{key:x.id},
              h('td',null,x.month||'—'),
              h('td',null,fmtDateText(x.date)||'—'),
              h('td',null,h('div',{style:{fontWeight:600}},x.vehicle||'—')),
              h('td',null,h('div',{style:{maxWidth:520,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}},x.service||'—')),
              h('td',null,getRepairerText(x)||'—'),
              h('td',null,x.amount||'—'),
              h('td',null,h('div',{style:{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}},
                h('span',null,maintenanceInvoiceLabel(x)),
                x.invoiceImage&&h('button',{type:'button',className:'bi',title:'Xem ảnh hóa đơn',onClick:()=>openImageViewer('Ảnh hóa đơn',[{url:x.invoiceImage,name:x.invoiceImageName||'hoa-don.jpg'}],0)},h('i',{className:'ti ti-photo',style:{fontSize:15,color:'var(--pri)'}})),
                getRepairImages(x).length>0&&h('button',{type:'button',className:'bi',title:'Xem ảnh sửa chữa',onClick:()=>openImageViewer('Ảnh sửa chữa',getRepairImages(x),0)},h('i',{className:'ti ti-tool',style:{fontSize:15,color:'#C2410C'}}))
              )),
              h('td',null,h('div',{style:{display:'flex',gap:2}},
                h('button',{className:'bi',onClick:()=>openEdit(x)},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
                h('button',{className:'bi',onClick:()=>del(x.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
              ))
            )
        ):h('tr',null,h('td',{colSpan:8,className:'empty-st'},'Chưa có dữ liệu bảo dưỡng nào.')))
      )
    ),
    modal==='f'&&h(Modal,{title:title+(edit?' - Sửa':' - Thêm'),lg:true,onClose:()=>sm(null)},
      !isVehicle&&h('div',{className:'g2'},
        h(F,{label:'Tháng'},h('input',{value:form.month,onChange:e=>setForm(p=>({...p,month:e.target.value})),placeholder:'2025-11'})),
        h(F,{label:'Ngày bảo dưỡng *'},h('input',{type:'date',value:form.date,onChange:e=>setForm(p=>({...p,date:e.target.value}))})),
      ),
      isVehicle&&h(F,{label:'Ngày bảo dưỡng *'},h('input',{type:'date',value:form.date,onChange:e=>setForm(p=>({...p,date:e.target.value}))})),
      isVehicle
        ?h('div',{className:'g2'},
            h(F,{label:'Tên xe/máy *'},h('select',{value:form.vehicle,onChange:e=>setForm(p=>({...p,vehicle:e.target.value}))},
              h('option',{value:''},'— Chọn từ danh mục tài sản —'),
              assetOptions.map(a=>h('option',{key:a,value:a},a))
            )),
            h(F,{label:'Tại KM'},h('input',{value:form.km,onChange:e=>setForm(p=>({...p,km:e.target.value})),placeholder:'194.000'})),
          )
        :h(F,{label:'Tên xe/máy *'},h('select',{value:form.vehicle,onChange:e=>setForm(p=>({...p,vehicle:e.target.value}))},
            h('option',{value:''},'— Chọn từ danh mục tài sản —'),
            assetOptions.map(a=>h('option',{key:a,value:a},a))
          )),
      h(F,{label:'Dịch vụ *'},h('textarea',{value:form.service,onChange:e=>setForm(p=>({...p,service:e.target.value})),rows:3,placeholder:'thay bơm nước, bảo dưỡng định kỳ, thay dầu...'})),
      isVehicle
        ?h('div',{className:'g2'},
            h(F,{label:'Gara'},h('select',{value:garageSelectValue,onChange:e=>{
              const id=e.target.value;
              if(id==='__legacy__')return;
              const selected=(garages||[]).find(g=>String(g.id||'')===id);
              setForm(prev=>({...prev,garageId:selected?.id||'',garage:selected?.name||''}));
            }},
              h('option',{value:''},'— Chọn từ Danh mục Gara ô tô —'),
              form.garage&&!matchedFormGarage&&h('option',{value:'__legacy__'},form.garage+' (dữ liệu cũ)'),
              garageOptions.map(g=>h('option',{key:g.id,value:String(g.id||'')},g.name+(g.phone?' · '+g.phone:'')+(g.active===false?' · Ngừng sử dụng':'')))
            )),
            h(F,{label:'Thành tiền'},h('input',{value:form.amount,onChange:e=>setForm(p=>({...p,amount:e.target.value})),placeholder:'1.320.000'})),
          )
        :h('div',{className:'g2'},
            h(F,{label:'Người sửa'},
              h('div',{style:{display:'grid',gap:8}},
                repairerOptions.length
                  ?h('div',{style:{maxHeight:180,overflow:'auto',border:'1px solid var(--bd)',borderRadius:'var(--r)',padding:10,display:'grid',gap:8,background:'#fff'}},
                      repairerOptions.map(opt=>{
                        const checked=getRepairerIds(form).includes(opt.id)||getRepairerNames(form).includes(opt.name);
                        return h('label',{key:opt.id,style:{display:'flex',alignItems:'flex-start',gap:10,padding:'8px 10px',border:'1px solid '+(checked?'#9fd3b3':'var(--bd)'),borderRadius:'var(--r)',background:checked?'#f1faf4':'#fff',cursor:'pointer'}},
                          h('input',{type:'checkbox',checked,onChange:()=>toggleRepairer(opt),style:{width:16,height:16,marginTop:2}}),
                          h('span',null,opt.label)
                        );
                      })
                    )
                  :h('div',{style:{fontSize:12,color:'var(--tx2)',padding:'10px 12px',border:'1px dashed var(--bd)',borderRadius:'var(--r)',background:'#fff'}},'Chưa có danh sách nhân viên để chọn.'),
                getRepairerNames(form).length>0&&h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Đã chọn: ',h('b',{style:{color:'var(--pri3)'}},getRepairerNames(form).join(', ')))
              )
            ),
            h(F,{label:'Thành tiền'},h('input',{value:form.amount,onChange:e=>setForm(p=>({...p,amount:e.target.value})),placeholder:'1.320.000'})),
          ),
      h('div',{className:'g2'},
        renderImageField('invoice','Ảnh hóa đơn',form.invoiceImage,form.invoiceImageName,form.invoice?'Dữ liệu hóa đơn cũ: '+form.invoice:'Có thể tải ảnh hóa đơn từ máy hoặc chụp trực tiếp bằng camera.'),
        renderImageField('repair','Ảnh sửa chữa',form.repairImage,form.repairImageName,'Có thể chụp lại tình trạng sửa chữa hoặc hóa đơn sửa chữa chi tiết.')
      ),
      h(Row,null,h('button',{onClick:()=>sm(null)},'Hủy'),h('button',{className:'bp',onClick:save,style:{padding:'8px 20px'}},'Lưu'))
    ),
    imageView&&h(Modal,{title:imageView.title,lg:true,onClose:()=>setImageView(null)},
      h('div',{style:{display:'grid',gap:10}},
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap',fontSize:12,color:'var(--tx2)'}},
          h('div',null,'Ảnh '+(imageView.index+1)+' / '+imageView.images.length),
          imageView.images[imageView.index]?.name&&h('div',null,imageView.images[imageView.index].name)
        ),
        h('div',{style:{border:'1px solid var(--bd)',borderRadius:'var(--r)',background:'#f7faf8',padding:10,textAlign:'center',maxHeight:'70vh',overflow:'auto'}},
          h('img',{src:imageView.images[imageView.index]?.url,style:{maxWidth:'100%',height:'auto',borderRadius:'var(--r)'}})
        ),
        imageView.images.length>1&&h('div',{style:{display:'flex',gap:8,overflowX:'auto',paddingBottom:4}},
          imageView.images.map((img,idx)=>h('button',{key:(img.url||'')+'_'+idx,type:'button',onClick:()=>setImageView(v=>v?{...v,index:idx}:v),style:{padding:0,border:idx===imageView.index?'2px solid var(--pri)':'1px solid var(--bd)',borderRadius:'8px',background:'#fff',overflow:'hidden',minWidth:72}},
            h('img',{src:img.url,alt:img.name||('Ảnh '+(idx+1)),style:{width:70,height:70,objectFit:'cover',display:'block'}})
          ))
        ),
        h(Row,null,
          imageView.kind&&h('button',{className:'bdel',onClick:deleteViewedImage},h('i',{className:'ti ti-trash',style:{fontSize:14}}),'Xóa ảnh này'),
          imageView.index>0&&h('button',{onClick:()=>setImageView(v=>v?{...v,index:Math.max(0,v.index-1)}:v)},h('i',{className:'ti ti-arrow-left',style:{fontSize:14}}),'Ảnh trước'),
          imageView.index<imageView.images.length-1&&h('button',{onClick:()=>setImageView(v=>v?{...v,index:Math.min(v.images.length-1,v.index+1)}:v)},'Ảnh sau',h('i',{className:'ti ti-arrow-right',style:{fontSize:14}})),
          h('button',{className:'bp',onClick:()=>setImageView(null)},'Đóng')
        )
      )
    )
  );
}

function parseQtyText(text){
  const nums=String(text||'').match(/\d+(?:[.,]\d+)?/g)||[];
  return nums.map(n=>Number(String(n).replace(/,/g,''))||0);
}

function computeWeightFromText(text,qtyQua){
  const total=parseQtyText(text).reduce((s,n)=>s+n,0);
  return Math.max(0,total-(Number(qtyQua)||0));
}
function parseVNDateKey(v){
  if(!v) return 0;
  const s=String(v).trim();
  let m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(m) return new Date(Number(m[3]),Number(m[2])-1,Number(m[1])).getTime();
  m=s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(m) return new Date(Number(m[1]),Number(m[2])-1,Number(m[3])).getTime();
  const d=new Date(s);
  return Number.isNaN(d.getTime())?0:d.getTime();
}

function PowderSalesTab({customers,trips,employees,setPage}){
  const storageKey='scf_powdersales';
  const makeForm=overrides=>({
    date:fmtDate(),
    customer:'',
    qtyQua:'',
    qtyText:'',
    weight:'',
    price:'',
    amount:'',
    invoice:'',
    invoiceImage:'',
    invoiceImageName:'',
    driverId:'',
    driverName:'',
    status:'unpaid',
    ...(overrides||{})
  });
  const [rows,setRows]=useLS(storageKey,[
    {id:'PB001',date:'01/05/2026',customer:'ANH NAM PY',qtyQua:10,qtyText:'81+75+86+78+88+89+89+90+...',weight:'846',price:'11.000',amount:'9.306.000',invoice:'',invoiceImage:'',invoiceImageName:'',driverId:'',driverName:'ANH NAM PY-2.026-5-0',status:'unpaid'},
  ]);
  const [modal,sm]=useState(null);
  const [edit,se]=useState(null);
  const [q,sq]=useState('');
  const [uploading,setUploading]=useState(false);
  const [form,setForm]=useState(makeForm({date:''}));
  const customerOptions=[...new Set((customers||[]).map(c=>c.name).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const driverOptions=(employees||[]).filter(e=>e.role==='driver'||e.dept==='Lái xe').map(e=>({id:e.id,label:(e.id||'')+' - '+(e.name||'')})).sort((a,b)=>a.label.localeCompare(b.label,'vi'));
  const normalizeMoney=v=>String(v||'').replace(/[^\d]/g,'');
  const isInvoiceImage=v=>/^(data:image\/|blob:|https?:\/\/)/i.test(String(v||'').trim());
  const invoiceExportValue=r=>r.invoiceImage||r.invoice||'';
  const fmtMoney=v=>{
    const n=Number(String(v||'').replace(/[^\d.-]/g,''))||0;
    return n?n.toLocaleString('vi-VN'):'';
  };
  const openAdd=()=>{se(null);setUploading(false);setForm(makeForm());sm('f');};
  const openEdit=r=>{se(r);setUploading(false);setForm(makeForm(r||{}));sm('f');};
  const save=()=>{
    if(!form.date||!form.customer){window.showToast('Nhập ngày và khách hàng.','warn');return;}
    const weight=computeWeightFromText(form.qtyText,form.qtyQua);
    const price=normalizeMoney(form.price);
    const amount=weight&&price?String(weight*Number(price)):normalizeMoney(form.amount);
    const row={...makeForm(),...form,status:form.status||'unpaid',weight:String(weight),price:fmtMoney(price),amount:fmtMoney(amount),id:edit?.id||('PB'+uid())};
    setRows(prev=>edit?prev.map(x=>x.id===edit.id?row:x):[row,...prev]);
    sm(null);se(null);window.showToast('Đã lưu bột bán','success');
  };
  const del=id=>window.scfConfirm('Bạn có chắc muốn xóa dòng bột bán này?','Xóa bột bán',true).then(ok=>{if(ok){setRows(p=>p.filter(x=>x.id!==id));window.showToast('Đã xóa dòng','success');}});
  const pickInvoiceImage=async file=>{
    if(!file)return;
    try{
      setUploading(true);
      const url=await uploadPhoto(file,'powder-sales-invoices/'+(edit?.id||'new'));
      setForm(p=>({...p,invoiceImage:url,invoiceImageName:file.name||'hoa-don.jpg'}));
      window.showToast('Đã tải ảnh hóa đơn lên','success');
    }catch(e){
      window.showToast('Chưa tải được ảnh hóa đơn.','error');
    }finally{
      setUploading(false);
    }
  };
  const clearInvoiceImage=()=>setForm(p=>({...p,invoiceImage:'',invoiceImageName:''}));
  const renderInvoiceInfo=r=>r.invoiceImage
    ? h('div',{style:{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}},
        h('button',{type:'button',className:'bi',title:'Xem ảnh hóa đơn',onClick:()=>window.open(r.invoiceImage,'_blank')},h('i',{className:'ti ti-photo',style:{fontSize:15,color:'var(--pri)'}})),
        h('span',{style:{fontSize:12,color:'var(--tx2)'}},r.invoiceImageName||'Đã có ảnh hóa đơn')
      )
    : (r.invoice
        ? h('span',{className:'badge',style:{background:'#FFF3CD',color:'#8A5A00',maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},r.invoice)
        : '—');
  const filtered=rows
    .filter(r=>!q||[r.date,r.customer,r.qtyText,r.weight,r.price,r.amount,r.invoice,r.invoiceImageName,r.driverName||r.tripId].join(' ').toLowerCase().includes(q.toLowerCase()))
    .slice()
    .sort((a,b)=>parseVNDateKey(b.date)-parseVNDateKey(a.date));
  const importRows=items=>{
    const mapped=items.map(r=>{
      const qtyText=r['Số lượng text']||r['so_luong_text']||r['Số lượng']||'';
      const qtyQua=r['Số quả']||r['so_qua']||'';
      const weight=computeWeightFromText(qtyText,qtyQua);
      const price=r['Đơn giá']||r['gia']||'';
      const amount=r['Thành Tiền']||r['thanh_tien']||'';
      const invoiceRaw=String(r['Hóa đơn']||r['update']||'').trim();
      const importedInvoiceImage=isInvoiceImage(invoiceRaw)?invoiceRaw:'';
      return {
        id:'PB'+uid(),
        date:r['Ngày']||r['ngay_ban']||r['Ngày bán']||'',
        customer:r['Khách hàng']||r['khach_hang_bot']||'',
        qtyQua:qtyQua,
        qtyText:String(qtyText),
        weight:String(weight),
        price:fmtMoney(price),
        amount:fmtMoney(amount),
        invoice:importedInvoiceImage?'':invoiceRaw,
        invoiceImage:importedInvoiceImage,
        invoiceImageName:'',
        driverId:r['Lái xe']||r['driverId']||'',
        driverName:r['Lái xe']||r['driverName']||r['nguoi_gh']||'',
        status:(String(r['Tình trạng']||r['tinh_trang']||'').toLowerCase().includes('đã')||String(r['Tình trạng']||r['tinh_trang']||'').toLowerCase().includes('paid'))?'paid':'unpaid'
      };
    }).filter(x=>x.date||x.customer||x.qtyText);
    if(!mapped.length){window.showToast('Không có dòng hợp lệ để nhập.','warn');return;}
    setRows(prev=>[...mapped,...prev].sort((a,b)=>parseVNDateKey(b.date)-parseVNDateKey(a.date)));
    window.showToast('Đã nhập '+mapped.length+' dòng bột bán','success');
  };
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-bowl-spoon',style:{fontSize:20}}),'Bột bán'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Tìm theo ngày, khách hàng, lái xe hoặc ghi chú để xem nhanh trên điện thoại.'),
      h('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},
        h('button',{onClick:()=>setPage('powderdebtreport'),style:{fontSize:12,padding:'6px 12px'}},h('i',{className:'ti ti-report-money',style:{fontSize:14}}),'Báo cáo công nợ'),
        h(ImportBtn,{onFile:importRows}),
        h(ExportBtn,{onClick:()=>xlsxExport(filtered.map(r=>({...r,invoice:invoiceExportValue(r)})),[['date','Ngày'],['customer','Khách hàng'],['qtyQua','Số quả'],['qtyText','Số lượng text'],['weight','Khối lượng'],['price','Đơn giá'],['amount','Thành Tiền'],['status','Tình trạng'],['invoice','Hóa đơn'],['driverName','Lái xe']],'Bot_ban')}),
        h(AddBtn,{onClick:openAdd,label:'Thêm bột bán'})
      )
    ),
    h('div',{className:'card',style:{marginBottom:'1rem',padding:'12px 14px'}},
      h(F,{label:'Tìm nhanh'},h(SearchBar,{value:q,onChange:sq,placeholder:'Ngày, khách hàng, lái xe...'}))
    ),
    h('div',{className:'card',style:{padding:'12px 14px',marginBottom:'1rem',background:'linear-gradient(135deg,#f7fbf9,#eef6f1)'}},
      h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Công thức khối lượng: tự cộng các số trong cột "Số lượng text". Ví dụ: 81+75+86 => 242.')
    ),
    h('div',{className:'mobile-only mobile-card-list'},
      filtered.length?filtered.map(r=>h('div',{key:'m_'+r.id,className:'mobile-data-card'},
        h('div',{className:'mobile-data-head'},
          h('div',null,
            h('div',{className:'mobile-data-title'},r.customer||'—'),
            h('div',{className:'mobile-data-sub'},r.driverName||'—')
          ),
          h('div',{className:'mobile-data-sub'},r.date||'—')
        ),
        h('div',{className:'mobile-data-text'},'Số lượng text: '+(r.qtyText||'—')),
        h('div',{className:'mobile-data-grid'},
          h('div',{className:'mobile-data-item'},h('b',null,'Số quả'),h('span',null,r.qtyQua||'—')),
          h('div',{className:'mobile-data-item'},h('b',null,'Khối lượng'),h('span',null,r.weight||'—')),
          h('div',{className:'mobile-data-item'},h('b',null,'Đơn giá'),h('span',null,r.price||'—')),
          h('div',{className:'mobile-data-item'},h('b',null,'Thành tiền'),h('span',null,r.amount||'—'))
        ),
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,flexWrap:'wrap'}},
          h('span',{className:'badge',style:{background:r.status==='paid'?'#EAF3DE':'#F1EFE8',color:r.status==='paid'?'#3B6D11':'#5F5E5A'}},r.status==='paid'?'Đã thanh toán':'Chưa thanh toán'),
          h('div',{style:{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}},
            r.invoiceImage&&h('button',{type:'button',className:'bi',title:'Xem ảnh hóa đơn',onClick:()=>window.open(r.invoiceImage,'_blank')},h('i',{className:'ti ti-photo',style:{fontSize:15,color:'var(--pri)'}})),
            h('span',{className:'mobile-data-sub'},r.invoiceImage?(r.invoiceImageName||'Đã có ảnh hóa đơn'):('Hóa đơn: '+(r.invoice||'—')))
          )
        ),
        h('div',{className:'mobile-data-actions'},
          h('button',{className:'bi',onClick:()=>openEdit(r)},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
          h('button',{className:'bi',onClick:()=>del(r.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
        )
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có dữ liệu bột bán nào.')
    ),
    h('div',{className:'tw desktop-only'},
      h('table',null,
        h('thead',null,h('tr',null,...['Ngày','Khách hàng','Số quả','Số lượng text','Khối lượng','Đơn giá','Thành Tiền','Tình trạng','Hóa đơn','Lái xe',''].map(c=>h('th',{key:c},c)))),
        h('tbody',null,filtered.length?filtered.map(r=>h('tr',{key:r.id},
          h('td',null,r.date||'—'),
          h('td',null,h('div',{style:{fontWeight:500}},r.customer||'—')),
          h('td',null,r.qtyQua||'—'),
          h('td',null,h('span',{style:{maxWidth:320,display:'block',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},r.qtyText||'—')),
          h('td',null,r.weight||'—'),
          h('td',null,r.price||'—'),
          h('td',null,r.amount||'—'),
          h('td',null,h('span',{className:'badge',style:{background:r.status==='paid'?'#EAF3DE':'#F1EFE8',color:r.status==='paid'?'#3B6D11':'#5F5E5A'}},r.status==='paid'?'Đã thanh toán':'Chưa thanh toán')),
          h('td',null,renderInvoiceInfo(r)),
          h('td',null,r.driverName||'—'),
          h('td',null,h('div',{style:{display:'flex',gap:2}},
            h('button',{className:'bi',onClick:()=>openEdit(r)},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
            h('button',{className:'bi',onClick:()=>del(r.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
          ))
        )):h('tr',null,h('td',{colSpan:11,className:'empty-st'},'Chưa có dữ liệu bột bán nào.')))
      )
    ),
    modal==='f'&&h(Modal,{title:edit?'Sửa bột bán':'Thêm bột bán',lg:true,onClose:()=>sm(null)},
      h('div',{className:'g2'},
        h(F,{label:'Ngày *'},h('input',{value:form.date,onChange:e=>setForm(p=>({...p,date:e.target.value})),placeholder:'01/05/2026'})),
        h(F,{label:'Khách hàng *'},h('select',{value:form.customer,onChange:e=>setForm(p=>({...p,customer:e.target.value}))},
          h('option',{value:''},'— Chọn khách hàng —'),customerOptions.map(c=>h('option',{key:c,value:c},c))
        ))
      ),
      h('div',{className:'g2'},
        h(F,{label:'Số quả'},h('input',{value:form.qtyQua,onChange:e=>setForm(p=>({...p,qtyQua:e.target.value})),placeholder:'10'})),
        h(F,{label:'Lái xe'},h('select',{value:form.driverId||'',onChange:e=>{const d=driverOptions.find(x=>x.id===e.target.value);setForm(p=>({...p,driverId:e.target.value,driverName:d?d.label:''}));}},
          h('option',{value:''},'— Chọn lái xe —'),driverOptions.map(d=>h('option',{key:d.id,value:d.id},d.label))
        ))
      ),
      h(F,{label:'Số lượng text'},h('textarea',{value:form.qtyText,onChange:e=>setForm(p=>({...p,qtyText:e.target.value})),rows:3,placeholder:'81+75+86+78+88...'})),
      h('div',{className:'g2'},
        h(F,{label:'Khối lượng'},h('input',{value:computeWeightFromText(form.qtyText,form.qtyQua),readOnly:true,tabIndex:-1,style:{background:'var(--bg2)',cursor:'default'},placeholder:'Tự tính từ text - số quả'})),
        h(F,{label:'Đơn giá'},h('input',{value:form.price,onChange:e=>setForm(p=>({...p,price:e.target.value})),placeholder:'11.000'}))
      ),
      h('div',{className:'g2'},
        h(F,{label:'Thành Tiền'},h('input',{value:fmtMoney(computeWeightFromText(form.qtyText,form.qtyQua)*Number(normalizeMoney(form.price)||0)),readOnly:true,tabIndex:-1,style:{background:'var(--bg2)',cursor:'default'},placeholder:'Tự tính từ khối lượng × đơn giá'})),
        h(F,{label:'Hóa đơn'},
          h('div',{style:{display:'grid',gap:10}},
            h('div',{style:{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}},
              form.invoiceImage&&h('button',{type:'button',onClick:()=>window.open(form.invoiceImage,'_blank'),style:{fontSize:12,padding:'6px 12px'}},h('i',{className:'ti ti-photo',style:{fontSize:14}}),'Xem ảnh'),
              h('label',{style:{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',border:'1px solid var(--bd)',borderRadius:'var(--r)',cursor:uploading?'wait':'pointer',background:'#fff'}},
                h('i',{className:'ti '+(uploading?'ti-loader-2 spin':'ti-camera-plus'),style:{fontSize:14}}),
                uploading?'Đang tải ảnh...':'Chụp / tải ảnh',
                h('input',{type:'file',accept:'image/*',capture:'environment',style:{display:'none'},disabled:uploading,onChange:e=>pickInvoiceImage(e.target.files?.[0])})
              ),
              form.invoiceImage&&h('button',{type:'button',onClick:clearInvoiceImage,style:{fontSize:12,padding:'6px 12px',background:'#fff4f4',color:'#A32D2D',border:'1px solid #f0c9c9'}},h('i',{className:'ti ti-trash',style:{fontSize:14}}),'Xóa ảnh')
            ),
            form.invoiceImageName&&h('span',{style:{fontSize:12,color:'var(--tx2)'}},form.invoiceImageName),
            form.invoiceImage&&h('img',{src:form.invoiceImage,alt:'Ảnh hóa đơn',style:{width:'100%',maxWidth:220,height:'auto',borderRadius:'var(--r)',border:'1px solid var(--bd)'}}),
            !form.invoiceImage&&h('div',{style:{fontSize:12,color:'var(--tx2)'}},form.invoice?'Dữ liệu hóa đơn cũ: '+form.invoice:'Có thể tải ảnh từ máy hoặc chụp trực tiếp bằng camera.')
          )
        )
      ),
      h(F,{label:'Tình trạng'},h('select',{value:form.status||'unpaid',onChange:e=>setForm(p=>({...p,status:e.target.value}))},
        h('option',{value:'unpaid'},'Chưa thanh toán'),
        h('option',{value:'paid'},'Đã thanh toán')
      )),
      h(Row,null,h('button',{onClick:()=>sm(null)},'Hủy'),h('button',{className:'bp',onClick:save,style:{padding:'8px 20px'}},'Lưu'))
    )
  );
}
