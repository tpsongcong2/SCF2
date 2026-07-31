/* ─── Password hashing & verification ─── */
const PASSWORD_HASH_SCHEME='pbkdf2-sha256';
const PASSWORD_HASH_ITERATIONS=210000;
const PASSWORD_MIN_LENGTH=8;

function passwordBytesToBase64(bytes){
  let binary='';
  bytes.forEach(b=>{binary+=String.fromCharCode(b);});
  return btoa(binary);
}

function passwordBase64ToBytes(value){
  const binary=atob(value);
  return Uint8Array.from(binary,ch=>ch.charCodeAt(0));
}

function isPasswordHash(value){
  return String(value||'').startsWith(PASSWORD_HASH_SCHEME+'$');
}

async function derivePasswordHash(password,salt,iterations=PASSWORD_HASH_ITERATIONS){
  if(!globalThis.crypto?.subtle)throw new Error('Trình duyệt không hỗ trợ mã hóa mật khẩu an toàn.');
  const material=await crypto.subtle.importKey(
    'raw',new TextEncoder().encode(String(password)),{name:'PBKDF2'},false,['deriveBits']
  );
  const bits=await crypto.subtle.deriveBits(
    {name:'PBKDF2',hash:'SHA-256',salt,iterations},material,256
  );
  return new Uint8Array(bits);
}

async function hashPassword(password){
  const salt=crypto.getRandomValues(new Uint8Array(16));
  const hash=await derivePasswordHash(password,salt);
  return [PASSWORD_HASH_SCHEME,PASSWORD_HASH_ITERATIONS,passwordBytesToBase64(salt),passwordBytesToBase64(hash)].join('$');
}

function generateTemporaryPassword(length=12){
  if(!globalThis.crypto?.getRandomValues)throw new Error('Trình duyệt không hỗ trợ tạo mật khẩu an toàn.');
  const groups=['ABCDEFGHJKLMNPQRSTUVWXYZ','abcdefghijkmnopqrstuvwxyz','23456789','@#$%*!?'];
  const all=groups.join('');
  const pick=chars=>chars[crypto.getRandomValues(new Uint32Array(1))[0]%chars.length];
  const chars=groups.map(pick);
  while(chars.length<Math.max(length,8))chars.push(pick(all));
  for(let i=chars.length-1;i>0;i--){
    const j=crypto.getRandomValues(new Uint32Array(1))[0]%(i+1);
    [chars[i],chars[j]]=[chars[j],chars[i]];
  }
  return chars.join('');
}

async function verifyPassword(password,storedValue){
  const stored=String(storedValue||'');
  if(!isPasswordHash(stored)){
    // Tương thích một lần với dữ liệu cũ; App sẽ băm và lưu lại trước màn đăng nhập.
    const actual=new TextEncoder().encode(String(password));
    const expected=new TextEncoder().encode(stored);
    let diff=actual.length^expected.length;
    const length=Math.max(actual.length,expected.length);
    for(let i=0;i<length;i++)diff|=(actual[i]||0)^(expected[i]||0);
    return stored.length>0&&diff===0;
  }
  const parts=stored.split('$');
  if(parts.length!==4)return false;
  const iterations=Number(parts[1]);
  if(!Number.isInteger(iterations)||iterations<100000)return false;
  try{
    const salt=passwordBase64ToBytes(parts[2]);
    const expected=passwordBase64ToBytes(parts[3]);
    const actual=await derivePasswordHash(password,salt,iterations);
    if(actual.length!==expected.length)return false;
    let diff=0;
    for(let i=0;i<actual.length;i++)diff|=actual[i]^expected[i];
    return diff===0;
  }catch{return false;}
}

async function migrateEmployeePasswords(list){
  let changed=false;
  const employees=await Promise.all((Array.isArray(list)?list:[]).map(async employee=>{
    const password=String(employee?.password||'');
    if(!password||isPasswordHash(password))return employee;
    changed=true;
    return {...employee,password:await hashPassword(password)};
  }));
  return {employees,changed};
}
