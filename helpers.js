/* ─── Helpers ─── */
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,5);
const fmtDate=()=>{const d=new Date();return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear()};
const fmtDT=()=>{const d=new Date();return fmtDate()+' '+String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')};
const numFmt=n=>{if(n===null||n===undefined||n==='')return 0;if(typeof n==='number')return Number.isFinite(n)?n:0;const s=String(n).trim().replace(/\s+/g,'').replace(',','.');const m=s.match(/-?\d+(\.\d+)?/);return m?Number(m[0])||0:0;};
const moneyFmt=n=>n?Number(n).toLocaleString('vi-VN')+'đ':'—';
const pad2=n=>String(parseInt(n,10)||0).padStart(2,'0');
const isoDate=()=>{const d=new Date();return d.getFullYear()+'-'+pad2(d.getMonth()+1)+'-'+pad2(d.getDate())};
const toIsoDate=v=>{
  const s=String(v||'').trim();
  if(!s) return '';
  if(/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m=s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(m) return `${m[3]}-${pad2(m[2])}-${pad2(m[1])}`;
  const d=new Date(s);
  if(!Number.isNaN(d.getTime())) return d.toISOString().slice(0,10);
  return '';
};
const parseAnyDate=s=>{
  if(!s) return null;
  const v=String(s).trim();
  if(!v) return null;
  let m=v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(m){
    const d=new Date(Number(m[1]),Number(m[2])-1,Number(m[3]));
    return Number.isNaN(d.getTime())?null:d;
  }
  m=v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if(m){
    const a=Number(m[1]), b=Number(m[2]), y=m[3].length===2?Number('20'+m[3]):Number(m[3]);
    const day=a>12?a:b;
    const month=a>12?b:a;
    const d=new Date(y,month-1,day);
    return Number.isNaN(d.getTime())?null:d;
  }
  const d=new Date(v);
  return Number.isNaN(d.getTime())?null:d;
};
const fmtAnyDate=s=>{
  const d=parseAnyDate(s);
  if(!d) return '—';
  return pad2(d.getDate())+'/'+pad2(d.getMonth()+1)+'/'+d.getFullYear();
};
const normalizePlainText=s=>String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const normalizeGenderValue=(gender,femaleFallback)=>{
  if(gender===true||gender===false) return gender?'female':'male';
  const raw=normalizePlainText(gender);
  if(['female','nu','nữ','nu gioi','nữ giới','f','woman','girl'].includes(raw)) return 'female';
  if(['male','nam','m','man','boy'].includes(raw)) return 'male';
  if(femaleFallback===true||femaleFallback===false) return femaleFallback?'female':'male';
  return 'male';
};
const isFemaleGender=(gender,femaleFallback)=>normalizeGenderValue(gender,femaleFallback)==='female';
const genderLabel=(gender,femaleFallback)=>isFemaleGender(gender,femaleFallback)?'Nữ':'Nam';
const timeNow=()=>{const d=new Date();return pad2(d.getHours())+':'+pad2(d.getMinutes())+':'+pad2(d.getSeconds())};
const shortTime=s=>(s||'').slice(0,5)||'—';
const vnDateFromISO=s=>{if(!s)return'—';const p=String(s).split('-');return p.length===3?p[2]+'/'+p[1]+'/'+p[0]:s;};
function haversine(a,b,c,d){const R=6371000,rad=x=>x*Math.PI/180;const x=rad(c-a),y=rad(d-b);const q=Math.sin(x/2)**2+Math.cos(rad(a))*Math.cos(rad(c))*Math.sin(y/2)**2;return Math.round(R*2*Math.atan2(Math.sqrt(q),Math.sqrt(1-q)));}
function gpsStatus(pos,settings){if(!pos)return {ok:false,label:'Chưa có GPS',distance:null};const dist=haversine(settings.lat,settings.lon,pos.lat,pos.lon);return {ok:dist<=settings.radius,label:dist<=settings.radius?'Trong khu vực':'Ngoài khu vực',distance:dist};}
function faceScore(a,b){if(!a||!b||!a.length||!b.length)return 0;let diff=0;for(let i=0;i<Math.min(a.length,b.length);i++)diff+=Math.abs(a[i]-b[i]);return Math.max(0,Math.round(100-(diff/Math.min(a.length,b.length))*1.8));}
function faceMatchResult(capture,template){
  const current=capture&&capture.faceDescriptor;
  const saved=template&&template.descriptor;
  if(current&&saved&&current.length>=128&&saved.length>=128){
    let sum=0;const len=Math.min(current.length,saved.length);
    for(let i=0;i<len;i++){const d=Number(current[i]||0)-Number(saved[i]||0);sum+=d*d;}
    const distance=Math.sqrt(sum);
    return {score:Math.max(0,Math.min(100,Math.round(100-distance*60))),ok:distance<=0.58,distance,method:'ai'};
  }
  const score=faceScore(capture&&capture.faceHash,template&&template.hash);
  return {score,ok:score>=65,distance:null,method:'legacy'};
}
const initials=n=>n.split(' ').map(w=>w[0]).filter(Boolean).slice(-2).join('').toUpperCase();
function isBirthday(bd){if(!bd)return false;const t=new Date();const p=bd.split('/');if(p.length<2)return false;return parseInt(p[0])===t.getDate()&&parseInt(p[1])===(t.getMonth()+1);}
function greeting(){const h2=new Date().getHours();if(h2>=5&&h2<11)return'Chào buổi sáng';if(h2>=11&&h2<14)return'Chào buổi trưa';if(h2>=14&&h2<18)return'Chào buổi chiều';if(h2>=18&&h2<23)return'Chào buổi tối';return'Chào đêm khuya';}
const WC={0:['ti-sun','Trời quang','#f8c30f'],1:['ti-cloud','Ít mây','#93c5fd'],2:['ti-cloud','Có mây','#94a3b8'],3:['ti-cloud','Nhiều mây','#64748b'],45:['ti-mist','Sương mù','#94a3b8'],51:['ti-cloud-rain','Mưa phùn','#60a5fa'],61:['ti-cloud-rain','Mưa nhẹ','#60a5fa'],63:['ti-cloud-rain','Mưa','#3b82f6'],65:['ti-cloud-rain','Mưa to','#1d4ed8'],80:['ti-cloud-rain','Mưa rào','#3b82f6'],95:['ti-cloud-storm','Dông','#6d28d9']};
function wInfo(c){return WC[c]||WC[Math.floor(c/10)*10]||WC[0];}
