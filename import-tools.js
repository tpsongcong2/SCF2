/* ─── SMART PRODUCT IMPORT ─── */
function SmartImportModal({prodCats,onImport,onClose}) {
  const [txt,stxt] = useState('');
  const [preview,sp] = useState([]);

  const parseStr = s => {
    s = s.trim();
    if (!s) return null;
    const parts = s.split(',');
    // Last part = unit
    const unit = parts[parts.length-1].trim();
    // Remove last part
    let rest = parts.slice(0,-1);
    // Remove known prefixes at start
    const skipPfx = ['VD_QV','VD','SEV'];
    while (rest.length && skipPfx.includes(rest[0].trim())) rest.shift();
    // Remove 'SÔNG CÔNG' anywhere
    rest = rest.filter(p => p.trim() !== 'SÔNG CÔNG' && p.trim() !== 'SONG CONG');
    const name = rest.join(',').trim();
    if (!name) return null;
    return {name, unit: unit || 'Kg'};
  };

  const parse = () => {
    const lines = txt.split(/\n|\s{2,}/).map(l=>l.trim()).filter(Boolean);
    const seen = new Set();
    const rows = [];
    lines.forEach(l => {
      const r = parseStr(l);
      if (r && !seen.has(r.name+'|'+r.unit)) {
        seen.add(r.name+'|'+r.unit);
        rows.push(r);
      }
    });
    sp(rows);
  };

  return h(Modal,{title:'Nhập nhanh sản phẩm từ danh sách',lg:true,onClose},
    h('div',{style:{fontSize:13,color:'var(--tx2)',marginBottom:8}},
      'Dán danh sách vào ô bên dưới. Mỗi sản phẩm 1 dòng. Định dạng hỗ trợ: ',
      h('code',{style:{background:'var(--bg2)',padding:'1px 5px',borderRadius:3,fontSize:12}},'BÁNH PHỞ TƯƠI,3KG/PAC'),
      ' hoặc ',
      h('code',{style:{background:'var(--bg2)',padding:'1px 5px',borderRadius:3,fontSize:12}},'VD,BÚN TƯƠI,SÔNG CÔNG,KG')
    ),
    h('textarea',{value:txt,onChange:e=>{stxt(e.target.value);sp([]);},
      placeholder:'Dán danh sách sản phẩm vào đây...',
      style:{width:'100%',minHeight:150,fontSize:13,fontFamily:'monospace',padding:8,borderRadius:'var(--r)',border:'1px solid var(--bd)',resize:'vertical',boxSizing:'border-box'}
    }),
    h('div',{style:{display:'flex',gap:8,margin:'8px 0'}},
      h('button',{className:'bp',onClick:parse},h('i',{className:'ti ti-wand',style:{fontSize:14,marginRight:4}}),'Phân tích danh sách'),
      preview.length>0&&h('span',{style:{fontSize:13,color:'var(--pri)',alignSelf:'center'}},
        '✓ Tìm thấy '+preview.length+' sản phẩm (đã loại trùng)'
      )
    ),
    preview.length>0&&h('div',null,
      h('div',{className:'tw',style:{maxHeight:300,overflowY:'auto'}},
        h('table',null,
          h('thead',null,h('tr',null,
            h('th',null,'#'),h('th',null,'Tên sản phẩm'),h('th',null,'Đơn vị')
          )),
          h('tbody',null,preview.map((r,i)=>h('tr',{key:i},
            h('td',null,h('span',{style:{color:'var(--tx2)',fontSize:11}},i+1)),
            h('td',null,h('span',{style:{fontWeight:500}},r.name)),
            h('td',null,h('span',{className:'badge sbadge'},r.unit))
          )))
        )
      ),
      h(Row,{style:{marginTop:'1rem'}},
        h('button',{onClick:onClose},'Hủy'),
        h('button',{className:'bp',onClick:()=>{
          onImport(preview);onClose();
        },style:{padding:'8px 20px'}},
          h('i',{className:'ti ti-file-plus',style:{fontSize:14}}),' Nhập '+preview.length+' sản phẩm'
        )
      )
    ),
    preview.length===0&&h(Row,null,h('button',{onClick:onClose},'Hủy'))
  );
}

function parseProductStr(s){
  if(!s) return {name:'',unit:'Kg'};
  const source=s.toString().trim();
  const parts=source.split(',');
  const rawUnit=parts[parts.length-1].trim();
  const rawUnitUP=rawUnit.toUpperCase();
  const compactUnit=rawUnitUP.replace(/\s+/g,'');
  const explicitUnits=['KG','KGS','KILOGRAM','G','GR','GRAM','CÁI','CAI','GÓI','GOI','CHAI','THÙNG','THUNG','TÚI','TUI','HỘP','HOP','PAC','PACK'];
  const hasExplicitUnit=parts.length>1&&explicitUnits.includes(compactUnit);
  let unit,name;
  if(rawUnitUP.includes('PAC')){
    // Đơn vị = Gói, tên SP gồm cả phần xKG/PAC
    // vd: "VD,BÚN TƯƠI,SÔNG CÔNG,5KG/PAC" → name="BÚN TƯƠI,5KG/PAC", unit="Gói"
    unit='Gói';
    let rest=parts.slice(0,-1); // bỏ phần cuối (5KG/PAC đã ở rawUnit)
    const skip=['VD_QV','VD','SEV'];
    while(rest.length&&skip.includes(rest[0].trim())) rest.shift();
    rest=rest.filter(p=>{
      const u=p.trim().toUpperCase().replace(/\s+/g,'');
      return !['SÔNGCÔNG','SONGCONG','SONGCÔNG','SÔNGCONG'].includes(u);
    });
    // Ghép tên + rawUnit vào tên sản phẩm
    name=(rest.join(',').trim()+','+rawUnit).replace(/^,|,$/g,'');
  } else if(hasExplicitUnit) {
    unit=rawUnitUP.includes('KG')?'KG':(rawUnit||'Kg');
    let rest=parts.slice(0,-1);
    const skip=['VD_QV','VD','SEV'];
    while(rest.length&&skip.includes(rest[0].trim())) rest.shift();
    rest=rest.filter(p=>{
      const u=p.trim().toUpperCase().replace(/\s+/g,'');
      return !['SÔNGCÔNG','SONGCONG','SONGCÔNG','SÔNGCONG'].includes(u);
    });
    name=rest.join(',').trim();
  } else {
    // Tên sản phẩm đơn giản (không có cột đơn vị ghép ở cuối).
    // Trước đây "BÚN TƯƠI" bị hiểu nhầm toàn bộ là đơn vị nên tên trả về rỗng.
    name=source;
    unit='Kg';
  }
  return {name, unit};
}


/* ═══════ PRINT TEMPLATES ═══════ */

const PRINT_TEMPLATES = [
  {id:'welstory',       name:'Welstory — Phiếu giao hàng'},
  {id:'foseca',         name:'Foseca — Phiếu giao nhận hàng'},
  {id:'youngsun_dbg',   name:'Youngsun DBG — 送货确认单'},
  {id:'youngsun_trina', name:'Youngsun TRINA — 送货确认单'},
];

function addDays(dateStr, n) {
  if(!dateStr) return '';
  const [d,m,y] = dateStr.split('/');
  const dt = new Date(y, m-1, d);
  dt.setDate(dt.getDate() + n);
  return String(dt.getDate()).padStart(2,'0')+'/'+String(dt.getMonth()+1).padStart(2,'0')+'/'+dt.getFullYear();
}

function buildPrintHTML(template, order, company) {
  const co = company || {};
  const lines = (order.lines || []).filter(l => l.productName);
  const totalQty = lines.reduce((s,l) => s + Number(l.qtyInvoice||l.qtyProd||0), 0);

  if (template === 'welstory') {
    const B = 'border:1px solid #333';
    const BC = B+';text-align:center';
    const emCells = `<td style="${BC}"></td>`.repeat(10);
    const rows = lines.map((l,i) => `<tr style="height:42px">
      <td style="${BC};font-size:16px">${i+1}</td>
      <td style="${B};padding:2px 6px;font-size:16px">${l.productName||''}</td>
      <td style="${BC};font-weight:700;font-size:18px">${Number(l.qtyInvoice||l.qtyProd||0)||''}</td>
      <td style="${BC}"></td>
      <td style="${BC};font-size:16px">${l.unit||''}</td>
      ${emCells}
    </tr>`).join('');
    const gd = order.deliveryDate||'';
    const ngDat = addDays(gd,-1);
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Phieu giao hang</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:13px;padding:8mm 8mm 5mm 8mm}
.hdr{display:flex;align-items:center;margin-bottom:10px}
.hdr img{height:64px;width:auto;margin-right:12px}
.co-name{font-size:15px;font-weight:700}
.co-addr{font-size:12px;color:#444;margin-top:2px}
.title{text-align:center;font-size:22px;font-weight:700;letter-spacing:2px;padding:6px 0;margin-bottom:10px}
.info{display:grid;grid-template-columns:auto 1fr auto 1fr;gap:3px 8px;margin-bottom:8px;font-size:13px}
.lbl{white-space:nowrap;font-style:italic}
.val{font-weight:700}
table{width:100%;border-collapse:collapse}
th{background:#e8e8e8;font-weight:700;text-align:center;font-size:11px;padding:4px 3px;border:1px solid #333}
td{border:1px solid #333;padding:2px 3px;font-size:11px}
.tfoot-row td{font-weight:700;background:#f5f5f5;font-size:16px;height:42px}
.signs{display:flex;justify-content:space-between;margin-top:24px;text-align:center}
.sign-box{width:45%;font-size:13px;font-weight:700}
.sign-sub{font-size:11px;font-weight:400;color:#666;margin-top:3px}
.sign-line{height:50px}
@media print{
  @page{size:A4 landscape;margin:30mm 20mm 8mm 20mm}
  body{padding:0}
}
<\/style><\/head><body>
<div class="hdr">
  <img src="${'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAH4AAAB5CAIAAABwRAJnAAAAAXNSR0IArs4c6QAAAAlwSFlzAAAOwwAADsQBiC4+owAAV6VJREFUeF7tvWewZdl1HnZyPjffl1/n7umePBjMACACAQaQKjAAFIvJssqmLLssk7TLtF1Fl4xQLlW5ymVLtuXSD9pUFSm7ZFoUKQEgCYIUSYAIM+AMJvd07pffu/nek7O/tfd9r8ME9AADYljmxUVPv9c3nLP22it861tri1VVCX/z+F5IQPpefOnffCdJ4G9E/z3Tg78R/d+I/nsmge/ZF4tlWX7Pvvz/31/8bRgcURDwPHocBUj893jiN1jOuwKnvyZxVFWJlcCfdz3YL+lf367HWxc9vpu+nku5FERIGU+RfsmepYjn4eWLlUjPsqrwrPCv4h3L9nbdxXf0OeLhA5/CQm12a+yX+JPfCW5CwPO1GvUdfPNbF/0dX8Yu6M4HiVqQSMi4YqYoZYlvwZOtEy3VO/tRFUJVQkuwCiXTpFsP8TsU1x03/nZ91q19yFRFwhOrQhuUHqTyfy1yN7KVuFqhKKsC4ud6RRrP/qQH1OltenyHoj+y73fYfzKI0BpcOz1Jfw438tt01d/NjymqIq8Qe+RYAGZL59I/WoO368vfuuhfY2DmRp/ZE5h16PlcXcqiKrF5Sem5wrxdF/1d/RxSFbI0zLTD+AgFv+657r993/1tBJd3SBByhUwl2PajwAaXStdO4kbkynyrJEqKJIl4HbuJty9KePsEcfRJRZXjpsiJiVWe55Ikq4omCDKPbsjevE3X/9a1/ugamQAhTlwis+YwjkVZJkIVV0JaJDNRSGWZjCd5W4n+/44XO92RLCkUupW5UGSygGdalTGetKHZFn67lvs70HoehvGrhHylgiIxISvjADovSYrnB4pum1atwE+SykXP7M47WutxdUWRVWVSFXGeBqqqSIoiSKqsWlVFkZsoqG+L9L8NrZ8H9sx0MHfK/mCevyzypKqisgj6/e0knmkKrrRAuMOj5L8uD1mSZUHI49CbjCJ/WuWxWKVCGYpihnt5Tbb4bd7WtyH6O74JApXJilNileZR4E/K3J9ND7BD682aosIYwVyy1OTtuuRv807v9W08j5JkxTSNRt1JwnE4GxTJNAxGeebN88e53t3rZ77u696qwYED4uYCa0aWA9F7lnqynArFLAoHeTispjuy4jqL50qjW0qOrBhk6wWoi0pxMt5NPvkd+hBhyotMkNUURr2M9GqUjC/7B9dqbr3U26W5orvrkuzSbTAPR4EPbo/nuoJMf1Iyc093921oPWJGHvlS0FtWuSyVshj5/Sv+wSvhwYv+7vOuFkhikWdVLmiFqDD7yK6S5bjv7EcpSDl8UyYpqahESWDosS31+te/EvZenfVuZNG0yKKyTAUEQkJ2iFYxZXqLGvVWRc+DKwiegnVmvmFPsioaeYMNo5iIcU+RIticYNIrslSRZMpsSR0ISJgrxztZ9rRDZegWM6RVmoT+sF/lSR5P1Gpa+Bvj/YtCMRWFBPE+279QLJWeItwaflHcO8D2VkUPCyPLogL7DolCmpKUl/Fwsn85HF6rqb5dDvN0OBxuBt5ARZgmKBJeQnJn6n7Pm/F7tzowjWQQcbkqpC+WoT8d93ccPXe0sKFPZwcv5smBWHowtMzCyIjmkEwypIHwqntX/rcseoSRciWqLDsqqyQOR6G3P9x9tfS2qtGVcrYVhoMkDdyarRkGZbgc/mAJViUW73D4jIUviBoowlFE0TR0BJdZEY9HO0HvSjZ4JRtfGe69Gnu7ZTqTqkIiZ8cML+G1h+HevSnOWxf9fGkLoYylChHNVjzdDkYbWjHNJrtyGZi25bTapluj7IQepO2HKAJBgfd2Yd+zV3HUg/ZpVSmq4dTajdaCrEhV7ufejhDteoOr4XiziAYCYn8ubVIroTj64d6u/a2LniPBVSpWfhX3g+GNPNwT86lrSbouK5qm2i2ztiQojiAplIxzBzSPi47W4N6u7q/8VRSczJWXy99QrY6oN0y3jZSw6VqGGJXeTjLemvU3hHSCtIth+1z6QBjewg2+ZdHTlkSoLqRS5YeDa/lsq+lWnaah6WpSikGmKfa6ZKwISrMUDXiiQ9/PlR37+C1/41+l/Odi5PFhhQzcEqwFvXasUNthDkOrtFyrYQiGkgajzSoZYt/LSOMZtgPjI1bKvaOEb10QPIQtwtLvxaObctoz9AyGPYiSUVgK1pLROCfbxyqtXUgGaiRMjzj6yiGpd3Z4eai3VNSpZEG0Bbmt1U+YrdOF2hp7pSIqiw1TV/PUPwi9vTIfCUIgCQXTKWSWvCh0T497fd1tHyYiYsxjb7BzJRhvlUE/3LtZ5HEhq3p9sb5yTrOPSdpSKdURIZPKk6khkIf99Z0td24b54aeq4pZCXald8zmcbOxLupNUVCEYFZNepHXH+xfD2aQ/rSqYryWpP5W7u+NRE+I42G+MLdfDIZHlAI5ZpE/3t28OhvuIuAd9bbzNDGsuqjV/VQvZbeSTYp5D8EDhu9wb8t+Nw/vKUOgDTHfEyyiO1qbWykAx0yOntxp44W4Ev7EVfFcbX7f7K3zYIB93lG2yV/A/7zrA/nbueVgucgcqoGocTuNQnRKCd7MUlQt9mb+8CCa9fe3L/d3r5TJBCEoMiyW8dx7bPn6u4M+RKQSAYPe2afBfWdVVgiJKMyEYjAebBSpV2VRkQaGJtqWKUv6ZJKXhQ1vC9BYEkKlShQE/iQJnT3xSRluidLvefiLz8cHRoKY0ubgwcJRNZoLiYSLPIU/KY07DFbx95xg6tt0ZF6RZJ9F/4q3cFEwRWI2hON92H742AxPvhNvE7xEIDeLE5Ez0esLVZIaslL3/SSKAq1mVDpg5UxIppbgh/3r2XRXFGPEe5AlyeueFf+1Ws+lPS/Bkzax20Wsi2IHgRRVmE73Zv3tTsOq20bNMV3XCaNw5oVOrdNcOK5ILbECymGIpUqSJ11g25FcEKxnISBblHNBwm1DNPhs/J7nupANvEJKQplXdmmHMXtF1SKuqqThgKgrmblEpqEwbUysjPwgSQV+RCqKeBAYB5DTW0Jn4uQSZaIljcoPtw6WFt8FJcjZk/Ap3H2BuEWUzVqruwj0xvYmM7HKTFur1fTFjmOphT/aJ7mXgPWpMnHvjzcyOLfpATcMJDbcLTnY1DsIRjt1U27WDE2WfN+Pk0zTnUZ3RTLqstQUK0eotKqSoZPzUhtzscj92F0FgohyChQTgJpZlXjSi7nusV1RlCJ0lmI1vAZ5JfIbWjmIm4wL35EZ/pQqrC35cubO2R4SYXYztlVkgquxJJC1lApyIsgRW0XSa7qSCrUnVn6iLcG3Iv7EG5haSHh9WkqFpCKHxKpIVm2x3jqRZkoY+cCl2p1au+3kWTDsbVbhBKsN6I1lA/cq/DcWPVdVLozDj6vKNBnuBv2bVTxMpr0i9lQFmR+KCYbpNmWjLsgI53Xa4hAbbopuG3IsSgn3w56k1/g4/JtaIgsvyYgwg80FiLxcLysNIiBZFIqAJwldERFc0K1x6wDNhW2dLwApBNUw8OHQ2VCQYMFIhvN9QnKfCdKU/atM9oT2DRYA5hBPGRIDXYUuptIKfDttTYSK5NWwD3IBC4D0XReshmovGG5bd4wkDYsiAr6TRoM0Gg52rwuZz+hG35HBYbc29/OH8C53uqgR5+lg92owvN4wi9g/iP2RIleqpkmaqdmtAqGYagsKhBtXYkQKKMeCEMGaM7wJd45/wucDHYGRYc6OCZznjmRMYEpgPSg8RsQG/Z1vuLnVYzaFjDZtKUsQTEE0KfrGypHs9KJyK6EmVDazbIdhXgWf36zwrNwS+wz3RObp8DaZVtGas6SD2Vl8OHNOtNtkFhQDHdPyQipUWzQcIFiGqUhCNjy4KWRTTYq3b74STw6EArfJS0b39HiN1nMzyHhMVJNnxXlW6yBbIwK5GGxpld+pqYhtYOqqMg+jOK/kkQ+fqwmaTZKjG5sbYoCAQNzI2ZZCFHglfFul4F0SFoMsj1eJ01KciOKMnkKIr02TUZBckaoDWjDyinjZpBJ9QZoVwjQV6c0Zyr9CEBeDQgwq4IVQYknIRTGtFMDtlZwJ6qRU+oLiQUMn46QoVLLiYlKJ41IclsJMlDNYEuYhp4IwKYphlo7LIoWClbSj5KrA3cEkajkWQNQFxQrSchamcZrHWWyasH6xXEXdhhZND4ajHUHOxYpcA3mHeyjL3S16MrD0YOwZTurgT2DvRVIknliEdUduNgykUboh+4E/HM/GXpLkimK2BMkVKkMSDbhZWHCpMmXBzFMZNhaaebB1o7+1LeRqkYpFRpaaHF2Z4S4Jm8iQJmOdRDiu7Y1ny3JS5ZkEgBqBDCkEOWq8AXwBkAawZll2sLX1bJJtQ5RwHngRIjCKMaQSC5NXMDueII698NL1za8kWU8UE5Ttc9RdixwvKuAR8N8CwopkKT/YudrbvgoDVzCLSGJgYRg8eSVoomQqlqsYVlIIk1nSH6AuFDYcY7HtNGzZUrMsGAtZwEK4O4z9mxC/XqP1pN3s7ogDxMkEfPtA9HEWzVD5K/JQVqtazcFt4nWqYZlOo7N8wmoulYJBND9cOqSAcibMeyXJkLTsx/6VcPLN0L8iVJEqK3CDQmWVhSNWDXrmdam0xVQVwtzvXROzHamcwMlVGertbpE6WWJXuS1WdXKeRa4IaRztTQdX8mhXFgKxSMq4JO9Id54LpSHkC2K5jNgjCp+rhK9WxTfx0WphSkILxkco7SpTwDeQZNgOKQ8O4ulWGe6LWV9WfFnJ4JwZWEWCV8gUqYJk2M2O2+yadlNRrShOEGO0XEMqAqmM8nBcRTPsWEZG4pw7hDxz2t3rku9eK3oW4VUZMd+gXHOgkRwTWYIIuoY4EsXiWZonSZYpqm7XGq3uklNvwgRniAkYOAl/pgACgQEox7K2I0gXp5PPufWvW7WvheEfC+oVWRvA+qsCqv3A9HFvlQAPp/tJ+GoWP73Y3fRmXxPVEWIJSUohbJldKbaFLYsGflPNZsPLLdsLRq9UWR/uBAi1pQhqiqVS1VxWcoDtSubvZbNvrnW2heQZMd1EPC7D72PxBBGXR8i8OBLkvch/SpNfNrSX0vQpWb4pSLuVfCAqAakgtiV8NuDhSlXUWrO10l085tbaqqwVaYrcMgkmVRZkkQdlJdGB9cXd2J2P15r/u2uzMHIQMYQOqQvQTUGH4QQwLQCx8/e3rj3Tu/JvGnKvVXPLJNJ0WUQZU6+b3QetlfeW+oVSbpH1ROkK9jFPZ7OtNN6wjD3b3Rz1v2QYvVLSRP0+wzzvzRaj4ESj8ZCuNKJwsrf1XJrv6LqvZ3um85y7srG/rxf+x4v0wUxKm0trnfbDilKbBhtStmGbvVK4Ph2/YBpIKDK3ft6qPRpN25W4ZDnH81KeDG9K1UarjXT/60H0kuVgn9Rc99EsW+tH64J2pmkvDQ96+zsvKMp1w7lZZpdWFi1VFg56Uii+N8vaeagdW31scfld2Mcs+0CANRXSXjl6Me1/M/F25WIi5ygWpoXkbo2VWD1535Mfd1ceEuR6RVXoW1rP7f4cPb/NC7Pw8TAFZ4vFAkNUv2lReODH6xt5Gnv9nc0sLMtMRditYP+7tmbaSa6GqVZRWInYI6oEv6pCQUgkpbRsHWu2u//iePS8U++b9qYsvahUz8/6L432tsGwUJUE2103dN0y8vRAVy+73Wdaq9ercqPRnGnmFVW/aRqFY1oqXWlYlKO9/ed7g6fC6MtO4y9V/cuN9jdF8enhwZf2+t/0wo1KjmDgyqofJC/t9f5VZf5Ro7spiLuadTNOv9jb+0oUDjVorCybwAUMeNqRoe2vrPmq+oKqfaPb3ZCqTanyFhc6QOoJhqKMBnYHGg1osl7IbS+i+N9xXEXB+zU/yUGB8Ud7k4MtsrAEQrAoBwkjgmlKHmG6ockUfFCefPggwIchF/NHWRRElUS8DWGXWV7Bx7EIuUzLxA/HB3qph6PUlFRLl8oknEzDWaCWUkdSENXBfqeKoMmIMiu7EhxDX1pafmBl7aGyrCWxUqSarTSFiV4cLK0tfGxl8ftEwS3wemXpxMkfPH/hI6qu5OWmJAa6siblXUNTV1fXT5/8cN16QizacNqd2uljax+SxbXhAKsLixyjQl2WyAMWltc+2Fn+SCWsSHJ9YeGJlfaPF9lpyphFpB5NqM9wkrjGx4+tfLxuna2qTrv50IMP/PDJ9SeUsqkLNV00NOSMWVI39LWl48eOPWK5J7NShd8uBcRFYQHzJDckezWVrOlkEkxGYZpJTjOplNCb6mWUBuMygw9nkTD5SGTB2IEpwq2CfAB5AQp+DhX9dltPhHKWdBPGS1UyIvVhbbB9KL0p8sjQKsfRfG8ax+ADCcN+D5GNZTea7SWYQknSFEkXKzwNFm4jaUK62LCd00m6EIfH0vy876/i76W4YLqrOTYm7lZW8VFFWpruogygKl8O/OXZtJvnK5qxrDsLAoFxDA2CApSS7S67jVNBaGdxN8+Wq+JkGi/WaqdMaznJcfW4TvD0LFk+02p+MPKOx9GqHzSCuKFop6zaw6q2rIo63ABYFaJi1drHrdpxz3OjeDlLTxTZqiDU292z5MgrGWVopqXzoIVSQcOqLSyLqul5XhTHiqIGoS+U2UK7LkO+EDwifqbzPEBEeFaWhUyeipAJiHNe1joCl9nryCUzXCUNgmkS4ROR4CBVwVYhFhnYZFE0rDeMtfXFAvEv4nPdNOxae2FJMxx8PhwD6KEIhEG5IeINAT+GIDijkTwad6ezM5H/aBg9mJVnRHUdpApVcSpZzRDqs2vN/UwSull2/3h8IUkfyIvTk6kbeNASItpRqAzOLOJrwfA9UVPPFfmDk+HZ0fBk4B+bzmpIshS4PrhQ0YETLcp8fyfMkwtV+sEs/Eg4eyJKTsUFjH4Oe0SRB+XLShLLU8+J8xNxct7zLhTZw5qyjlvAs6AwnZtjIlUQRUGUYBI0q9FZOa7ZNWholqeGoRxfXzZUMQ5msMmwOZybif8DXEAKkIQRXEJeIPxNwR2/ZXDYXXOHDKFTVJMXQRwRiUwVECUwy0/RlZAmfll4YTBstGxFFzVDd+tNzXR04AeIfKGbogaQjQE1bMcx4LESjOFQKctTne5HO4s/tbD285r7pJe0glQv4LokgEAyhCGrapQq04mhqE8uLv97Sys/Y7sf8KOF/X5GImAGEDkwQmy8azxRVOWBqnqys/QLneWfLsr7r1yJB2OEinoJ4IzCcDnNZjN8h/auev3nltd/qd36hSg9td3bAyFXAvaBHa0AxpAO+kl/aCnaI63FH2ss/Yxufz/i9f6ep+h1qCrX+bncOZwmq7JZV62abjpuvY5ATtckx1TBEczioEwBE/GEtgA6ISNETKMqSbBhRYp/jnAU+lj505/+NHOsJHfCCvIwTQZZOLYhBEVjPBO4SlEuvenexWy2lScjmVCq1DA11axlYiOArayfkM2FsgT/g0Fs3JeQ0SvBkwYq0myutpqnRGW5qhxVX1T1Y6VUUw2DfDgME3QZwWwW6YbR7jyqGuerqqkbq5a9BBOk600JEAqZPo5vCUladDvrjcYpRQVQum7ZZzRtQTUb8JsS0nwylgR5uuDtuccV5aEyaRl223IQCNQdB/E+mVCJjEDhR1G9sbS4cL+sroviCc06KYgGNpAB6hz2MUtqCCMlJ8nKUAKy90HQv6EJgW2RtcniKJp6QZCjMGcvnjNbx2mDIh8BObmK8niKvxg6lJLIhDD/xEpiAiLDjxvKy5RVsMs8G6be9Vl/Z3l5VVIapbyQ6wuI0rVicPWpfymMX6qQwlRerSY5jpUJdj+oG4tPLp//IUFdIVODyyNglhJB4kdQzgVuGpAIuWT+RxITaDmsECheDJtMGYoIl403BYISCUWD0EpCe/GynCwD1T41qDzDNiB8Ct1lSoNhDwGH4X7ABJZysYA5QTBPciUcUyMtq4Ad1YitqMSlPBaqhlSYhK1RRA8GDWIPJA1IlAlNE+ktkDQsLURhkqPie5ewI+TbJK5STKaTVwYv/FsjvNRpCFFMKH409LHG217r2Ht+tnP2A9BiWYiFZCSk0yzxev1+d/2MqLiy2ULmgjCEix6mmaJWEJrwhOYVaRjPDpLJhhRuC9FGmewDxiILpVA8FnrpQmexu9A1DDsIk9HYRw5luU1RgqaQWtwCpSiMQh5CHoC0lTQBSoTKslUKLgIu+m5KvKB75IJYaUmrSrusFJaUAXVH3IL6nIZ0mDv/ecmJrlnNC7ssEUE7lWiUAgAGigjYGpPXIAgeiCSBkRbBzFRnAGCHuAvXQtgZR+tY7Ii320WF7zWoCkBrYJHi09XO425WBuAEOlICy+pio6RpNRpO0iyv1+sI4yzLns1C3QByR4hGlY6T6UYZbqbetWh8VUx6iP3Yd/IPoQdhJPQLtqfwNoSL4Wi7mO36uy96Oy9WyZ5YeczPS/Xa4nQQSaiY1euKoqVIvEQVJQS7DuiG4EOmIMyR03+OhMvMPsPjaE/MQy/mDOhFFC0zhwIdJvSRIU/ze2YQEr6cdyTOK1vsX+l9pNkMNSOYkpVOSPlhHiub1liK4USxAPxOCXPGpgSeKmHTUNYCCJNdsYJSAe8Y4UVJZmOxTlghhKYUj8+tJ+GbpP+q6jSai7ZVhykt8kIDkNJZmHmxZrqGWS+BkWPt81kwuTE+eN7vw05sxZPtIpoRKEtfN090oSx8EdjNA4+PA0vM2lY1610e7b6YBttFPiEEs5IMvVVk2vb2wWQyRgotgkNsu/VGRzVdSslZfZQVJyEnoiHiVglnp2QYooOIEIYDEmS9MiQ0xDNwoLxCh3uHucCuhshoCTh+wvc4f/ByK55sFeflXqhziToGyhoiDAtVR/F1YC6R6ZvD7oS8I76m8hXCX9ocvMrFYHvSkbknZS9DkQ9wN2kPK5nhA1G3YsDAPLwkFQSeoxnwIy3bdFQF4VYQjCY7uweO2yoImKJGIDiRJNwdgSUY3ew0yzzqFwk6PvhtzB9zJ072nuDAEm4ayFTLVaVsJhZeHo+rwi8qgO9qGGNzLY4H095eH7Jw3boB8FrWEeuyayU1526QF/JYJYjicdqCZNdgeVOW10H6MPEoM7G4hYl+/iYSBiVKiAeOXDWL7ZiVZ2WVuWrOV4aMdYnyAIoBBIHgc1BcxC9hbiyhsKk2IHqieCDKYyol5nWh1BlTYg6O873PcHZUiYFOh0dxNxP6rTryLenDdikmJTGyWnPsNE42rm8gnEGCD1yTWlCKKIsnWYJCSk8VvWZDLfMA/hRfQpjpIbLJiyFkyGgPg0tVBWN/b+L3NEU0oTlRLIcRQF7Yr0Qoh2kiS5ZVairUoYoPhsMZygOyDblzveetytxe8P3LrAwsAgP/BJXVSyFuxKCwUTD9pMaMRQHACHknYe0E6JOM2WZhtVXUczl9Cl/EwESKo5ilwQbGvQJoQpZEHzgPHth/qAZDEsbmcwjLnFsO2vfsE0CspMuikjEZHVTBbCTMZHtpL+AfNbgfdv1Hd8T3KzS31h9J45GHaN5CAl5qqdCZBBJ4YFWF9YuKeKilfgeUzawa7BzglQhvaBtR7Xi+kZkxoD1C6o/OFQRMcRru9Q7smosEPJpNkVtXSNjEUnfsGFGt4ix1VhB4Xr95/aA/1ayuIDokDgpXmKEg2R+pFV8ALiV+m7wQSDU/JkRWF2L5F9s4+BjoAZWHDvWRp+W0NjAXdNv8Xew78GJYeAmKTGkzMb8QyOIFFDtRzZG9Cql1WafSFdtirGYzXz/6ZO7gmdEn74rK1/zBL4NfJF3WnL3Ni7havVSa/YHX372JelG9veTlWq27quuI4H2x9PNwKiahq+hyKQ/2UQjSVcsm1h5FH7fcLN9ytKdZqyWss4lolTynIuZ5UORTqrZWZXNxrdE9kSAALCsvKlV78djJhxut49D6UlRg3pDnf0vqFcwPBYb4k1Wy+UbBE7fHySdH+BK3KMwPHvb9HwYHRwvLNxaZNPaB5HVZE8UR9Zf+ibw5b0A7LIkfklGOvhTWjT1ZyWYumcMluOu/8FcIk2178fSZ+uJqIhoBgmerLhnW8onjsAgUK+QRuuDSNEZlBt48yUvDcnIUb6h2y+Ir9pjbel4GkiU1jgpEMp3uSoRaQBaoRp6lI1TOAJ+h6n36whOp4mxPg1hyJGOx1jknumsIgRESsMECLO8+NIqve+2UfDNeANNZ9mQ8Dm74jsIMUgb+r695sgBw/jzaXzz6ubXX2N/ndvrQ9M0N4Gvee/TKeQj1BjLnv8ZrWK+PpNUW6itn5drqvlfd2J80Ftfax04gayoB7ca+hrIA0qosk1Wt212CXw7DGAwl6jA+NPZzqhpjNqN6oCMX15XaseP36ZalGmjXzUJ/fzbYAAOqyMrlMw+deviJfiwMIrW+eL6++jDAJkRTFFZTwHdPHG4SOqcQHNGXWBJ2GAceBb5sNx46pdvXAN7i1pPvG15aP3QAzLqRHefm/jBYmq8xmaSj5+FbXoOev9EKoLsQoKwpGN366v2VfWycupW1cvqh9xpuh0p7mT8dbEfeyFAJyLJrraX1k8gwEI5XOaqP80IKaf38G3gELckAB4Z9L88AdIqKDggp8Ge7ihgQxUVC5Kcfe+DxEw+/z1k421h7WHaOVYXBCencFR1Wtd5Qc+a+kYflhEazuit7kO4DQ+KJBuNMs43AV+rwwf7hyIOTH2A1BeZ/yQWLeQESAfKxCuEvws45NepQ+kfpAVsPWjPQsejtWEswQ1hAeng9b3APMChKCZaD2jWXHnGWHzXa99//+Ee7Jx8pcw2oOaxpOuuFk74JGFdWkHn1+9MgymFzKLGhnon5g5fdCGUjPw+yhGKANHP52s2pH2GRNLlUykBKUaDxEIkTkc7prp5/snv8Eb11Cj/wRInFiywcfI2lPKoE8L9QoMPuk4g23JZzjZ1vQ7pxFBUhunnShRVAxWy+vFSl5DaN5yV8yXiKIuQgTLAIM8cmIpyTfn9Y3ufvmBvDee7E4zAylGxYDAE0FXg3h3E3ffQ86bm1Cuxe6SKK3BTkRaf7wPH7PtBefQB8AJR5CYFMZ6aUyEUMjwpF2t3vb+8NNYvAVARxty8nlbDZ5dN1AEeEQGCYer3R1IvQU4FORiWPNNA5o1ERw1MDerEKrVNqKC6jNgLOEJc2cfNYh+Y8vLulpnfVKBlFFV+K64dbyxT06pHjB02PER3BwyCiHQkAHhLSpKUlNgnnmOAveDECW6IVUKgMjaXfo5pAryGnTCEPPgft3fhmuEQewTAiJSI7KlfAQLKVp/3CUg6kkkiyKOgDnvKmropui/MUCaeprLQwC9SI8ARMmcbkYOOpCooDBhYAfpOU8dRHnkhUOoqwWaZ+pPV8Q5PmEoiE6ryS5El3ZTkCTgD2WxjJWSKnfhkMqmwqSkgalEIE87ZRIWhDn9o8CkZqCvoAS7/v3LBUKbjtQZMUwMcoi0gqplIxlgpPkkZiPiyJPQvYN2Gz2DI0reZgjbHwEIJB/SPP8S4IfSbkMxlrpsSKFMrCFIi4LEfgqFQ5UBKQMYCOh1maoX6hSoUmIVNKwJjBU0JmWIUg4koC8JAYTCAa4yDkxI4Q0wJ4DCg8LNi97XGX2SGCDsPSITFsLuRvWGRadZboALopIjwnYAGDyZLluQ68tNYKwlTRiPB7e/Q0t/XsV6QedrMuK3Kz3T556kwcpip4ZYqceuNZfzeLJqCVEVtVdNNSh1FlIz/wRgR1oBaz4SXfwlDSt0D1UM9IJTkQpYFQXMnGO0WQSGohaUgGYQ77Pr4IOqAQqwliB3kGNof4tjL5Y1GdCHmvintFgNy8VPVQKIneJgoDf4Y/sSqVrqfM8+Nq2fQGQifw4ZxNSc/DX1KrpoidBFIEKFHAORk5mVuw13vg41G/ZP3kxFUGViqpVEEBklGV02EfjPseGCymgQSxBC9vZWVNVVHUcFGMu+tjAZ0Qdkb2jgxeKiQHvVf+eH/nG2fWjWi4gTKaLmmzTPGlhda572+ceF8utrMCX7JXtxzTaFOeqSBxhx+G17LFAngvQ5nufBxm5/RN0OqxlL/Q23j60ss3d7e8wINMVxYXTq6uXTh17mA8eO7rT/2dD//E2c46ZI5iCt6SwR3LmickV/pbT21euba7Odrvw50udLtrq2unTp080Vl/6tmvXr386r//Ez97yl7eOth+8crFqmYGrBBAxgTuFGAaWOowVFQrYR2QCAFV4CbpomY/cfL+uuEAiSaaFZP7kZe641ZA1K0iSazR6BZpNva38NK2uyrmUhns3Lz078TpKw1pZqmY0uEpZj23ljdG8tnHP6bXz4pKm9hUPD1m6R19DfNAZCzEJEh2v3n14v8j51eakmKL9SyPhtmu2GwtnP5xd/EnBLUDrs2wB7TIMUx4D1w+ERN5tIb/MFcyFz0lTfPMk30LGSTQ7NLP33j2N//kc5Efvv/sQ4umE4n5i6Mbz/dvqB13LKetQfF//th/8Z7FC9Q5jEpPkYC58Eyx99kXv/xn3/jazWiky+qy2T62gOpuuTUZjPOgtdQYTw6qNPrMj//yz7WefPGlF//5Z3/7z5SDq8sZ/Be0UvGEk2nzvL3uuK5oKv1hrz/tX4uHM0d0FP3cQPzff/Y/f3j9AswUK968oegTEVapsgoFqJ1QTSfjG4JZd911VLyq0TeH1z8/3XtJyYNu047CIJPMPhiCiw8fe+CHtPrZkrwjIIL5Uh75XJZUUznKjHPJqdUn+yliTBCuUFWEndH1WC5nAghWcp3hvEh0+SwWSBwXyoAQlhQT/n+bnsw5dHyBybXKT+9d+Y0v/G4/if6Tn/w7P3Hy8a6ghUK2IXhfuP70v/zK5/aynm53MjhJuETKXgpRl18MN/7ZM5/9/ItPqaJSN8wfeOg9P/X4j6xr3VTIrgcHX3jlq7/z5c9KqOhZ0gT1hko4f/a+X/5Pf2nwwu++tP8XFFGFniVaH/ngBz9+4sNdqwG40/OHk2D0xc3n/sWlr/SkdNeRb4jhCaLtiSZgf5ABD7X+NduX/YIDGQTHIh7XyVETfjB1tYjCkjiOIxEVlJTKXDVJNcnXI7whQgmXDUnjMK7n34DfwH4YZm/srZ083+iikoc5MJWmyTBoeTRK/V3ga2SuVQnUM5YUU2zIwjRePn3DB4vzhImQ/unV59H2e/7Cgx8++T5H0LQwa2bymar1H5z60f/4kZ9cKuqGqKeIZABpUQVVGpThP3/687/3ylfDrpHK1RNLZ375yZ/+Pm3tVC4/kOo/rB37b97907/43o85IVwBMEWqDBswso3Fh0/dB2FqUWnk6gmt8eGVhx6zumuZuJSWjzhLP7j4wK8+8ZO/+v6fWs0sOIapAjI4DDSvKN8Ritx+S4AlNYJdIUXMzAFvlE/6CYt4Pw+2q3ysKYWuSm7Nhfq2O0vthZVK1qiGnpdUDb7NhdwpeuhsUdiLS05nfTDJmt1Vs9VwUeB0TBO06wm6wl8uoiFCaKS9OUgJvMR1eGlHGfvdmsLYh4RnlIhPohvotjXFbb//sn8N96nrKmZYoNjYFIRP3P+hT1z4YHADNbUh7h5xDgK0L229+MWbz0cttQBl0jJ++LH3r8qukaVWIuuR7PrFcdH++Ls/eqJ7goFoxJUqMmzVHHmIBqZkDvsg1WAosSL4uiwHa+X6tPfK5pWuYP38yQ98bPnhhQAhs2ShNYDmKc15wtzW33UvDAKkfgryQGAFSgCl8Qgjb3PSv4LBKIZaNergmpeNlTVRc/b6U7e5JBsNQNuMns66a9njLq2H60Cdx1o7/dAsFHcOpkmaoVkH348auJhOwvG1IhlUZaSiVwdBM30Q7DxXfHKIjG36Rg9aKUgERL7cLC9NNn/r67/3x/vP3Sx93xBzVhZdUPSPn3/fj519sq6YVASTxb108oWLT8McCRZ6VMPT7aX7gZwQZITbZ5QuTY/KdElbeO/5x4txAn4i67GXDIT3jByB5AAP/JFC8ajMoYWK/JtP/8lvfO2PZlm6VOl/98GPHPO1agCe8Ny1vvEtQNHQMMSGryBeKqkRgwqcRRhOtoLhFkqZtusUSZxGEFy+tTPUnE5r8QQqmmDI0jwLmh00/3hCc47WgRYZu7YQ7NpKs3N2MEqHI7A4hSzJ8zgFmi9Xkyzal6RQU8AyS7OUCgvzT2AwLWVFdz4IDmUP/AefjzqFnEbodEut9BvDS5/5w1//rz7/v/6TZ//Nn06vbBcx2JpPdE7+lz/2C48dO4tSPSD8Vwebz/Svo5SNCN9IhNVMX5BsgLklQk9XF1w1Rz0KUImgvGf5/JO1k4so2LGeHAJ8RVBCMkFTSkPJTBl5AKgaiSL2qvCpwfUdpBCqhsjnXGftFz7xs0srqwhVEWUe6TwZ4NdoElGMCkToyPKUhNIAXRVlKfWUbCpkIWjkcRRLmpYW4s2bB2munzj7LsXsoBouAvon0fPclWfbdz7YGDkwL2qdhftkrY0kGPwy125iBkwWx44GIvWoCvbFCty8IkW98SgInqfpd8N/PEymb6LSu9gSzAv1JTNBupqPxOCqOPyD3gv/+Nl/9Wuf+98++YV/+n+/+ocDv3/cXADRBxRqgALb0XAnmcCEwGQ3Y/m03emKGjB1zMcgvgcCf6GEY4Sx+kD7zKc/9osfXDkPVBcKwGpmrOVHEn1kOKow06mH4Wrl/fbVL7/i7wm2hngGmoBi65MPv+9k94SJbZYSge1NH0iFedUhz5LIwE2BKxYMbCWCqYl8ND1gQ2pBXI29otY+YdXWBcFF1zksM7HJbhvefbfoaZ6LZIhyw7ZXS6ovW9s7g+3tgSSY6MlD2i8kg9HGy0U4JNGHaKcDqZgp+xskVPMVpgwJqTKYC9LfeuCD7146p45TJc513H9NGtnZZXH4R3vP/eM/+hf/6Pd+/Ys3vxFCaBXgi3iUelMQ6lCaAX0+LnVNN9H+AIIEhwBAEJBlRI9GWnYL9fH2ySURhomXH+ZFGxhmre5OwuB3//Rz/+xzv/Xff+7/+PVv/H6vQkUCmSAPqWEnwFYo7BjEXQYEvUm0wGAq5LBJOi3SqSbn+WwvPng1D3Y1TUS1GtJ79comuAqCWlfNrmS0BdklAIRBdZzPxs3A3aJnuwwWsqa6awudU5bV7C6sp4nkz7J2GyG4EU73h9uvZtMdFaX9nPYCg6BYdPR6V3zkqXh1Bs72wfp9f+8jP/fR0+9ZmMq1UWYnxLvIDclzqn5D+P3xpf/hz377L4dXoX64jhA2jVoXZSSdgSxMTAXUQvoyhnhRVRzyjxFqM3AP5YjbIi1WmaBpg4AzyzgpGftuf7jXm/VYfx1GOSFQIY4A4m2HJcpE92fb5c0eaIKR4igdyqKnlpNg/9VZ/6JYDSyQSHS9Pw0Nu2XXu7XmSmv5jKDUKxGNxBxiYZH2IUpBtp5JZy42/AeRS5nLgtpYOn4BLZmA3E6cOJel4mSMrglUdoMiHlXhWJaAkYA8gqyav5ep/Wukz5gg89+CxKxXmiOoDzfu/+Uf+Lu/9KGffX/93HKomBEmjSAmKWZ6NTxufa3a/3+f/RMfroVKCKwhDfmyJIeOsWfJ6G+DtADLwGaR5gMgIMisyixlqgu+glaUefTABIgtUqUzf6HW+Pkf/tu/+pN//1M/9R/+vUe+fylBnxFNz8Ur1Dy3qgJOGc4/MjP4zjeRO1XKqQsxTPMhGseFfAjOUupvSwCTqmDizyynvnbsdFbIbmPJWTwO6gwHT/m1zBlVZHiwG4lkibkSEU3cZmkVUl2wDSFFub24fN8j/VB+8dpBWCq5qI5H4yQdG9YgzW8CdpKkTpogEPFEyQeWQF8A7tft4eZhejUfUStJf3Hlhd/40u+HaXRBXfyPHvnY//SJX/knP/Erv/rwJ36o8eBiUjNCWUsKlGie3Xj5StLHUnfQBg3WVF4V6A5G5J3gi2iFgcuoKMwSM0lB+AAABVRKTvNFMgDSDV4Fqq2SFzqZKVsrNbiKtiC8p3b2Hzz+ie9T151hrgsaCtVgC+PKqZMGmCi6UXgpYb6XGQx927PADkKjFua6pZVp6kXUU9AXl8+yCFFNAhKgPwmuX92rpNbK+fcKRod1+PAQEMk+iD1o10HshrYxkDKrtKj8UgiLCl1eZDrme0BXBQwIXTxrgx3vriaKgwEURPAUY0nZj5LLVRhr4gLYDYWALrJJUQUEStCPvINwXvyjLc+2Mg1qE6RnJtf/x6/+X//64hdTIW4I4nG5/dGlx//bx3/mn/7Ir/yjH/z7P7r6aHtaOUEWV+GNcpoIkNDyqlhHX1BUxoqcaeMBpTPY2ZAYobEgbZHKVBIqxvn1wcZ4MsI2AI8lQWdLmWrgYAoKmg2xNWoVmJvY9/Kqtvy+5vlupCMQQpGBqIdEcJNRjLYYIZL1MRFbkLFx5saNB3AliCoYPQO4DwVTBNdw18KEWtNF29E6turoMmoYze76I2LjVIl2UZnIkPShEoh6Oco3kDPAOoK1afvCUcLK5IgdUTelDUUQML5ctpXWye76Q5LSdp2lxfaybdp13bQlQyvz8d4LeXGQp9M8QoiJZURoRNjZ3Q8yN9ziUIXf6NR7ev7nGy9cz0c+sZYglQI8/EVB/5HVd/2DD//0ibVjEBy6MQB0oTX2tNt5oL5qIYsFaVcSr2MKXO77YjES04i4dKAoU7EQqO2lweb//Nnf+uKlZ8FphDnCwIgQwAqa+wy5MKQIEQ5o5Agu2RyJj7z3Qz/4ge8HbHe7peWGilNYDh/zRmraS2wyPAOq0EUyU8sw3Mc4qG2pQMeEqeo1tbHq1I97paMvnW6cuiAYNST9NC6ACmvILkpoADFNQUJl07GIb0vVc28m5RFmJhbFLJeIL5dLciZZpdLpnnri1Pn37/fSy5d2hwez3KtqYlNNiq3rf1r4Lyr5NJzMSGckjUpyd4EJ+JHF9KxKTEMSkExXjv7q7safvPK1Gaks/g0ONbPLolVlj2srZ0+eT3QQp822aNUEaV10fvqxH1gXXQPxmW5uR8Hzm5eh62j+1ND1mZDzTMRsIGRfeOXrzw833JUO1EDNMwTIlGimOe4OX4uMDVV7FgrgQopzx0498eC7aM7EYbMyqxGyquFh+ZGtCqONAPEidhBJHyASdStGY03yhrsXDzZetgG0yMZ0mG3f9F++6nny8on3/qi2cAbM41IBN5SFfxjVhTwFaV1C7FjkdyzCYV4gTyIA/Oh9FrN9Id+RhRFm3uArM7y/anbPve/E+Q/2J8qrl4cHe6EcW2hVS8KreXjR1LLMRzsnShFI7UhtuMrcHiNgnekmWBKBfiHZ0HJN+oOn/vwL1746EDMfC052UNaJAB0nXoyfH1g7d8ztou3BTKQPHH/4h86+257kRqoO/eBfv/wV7BhLsZHbQKKRIW4ryec3nvqzF77+6P3nH14/idtBpI8kE9U+pFpg/otRkvuwqNRDgf1PJoBtQVbmoilC3DySIyTnxKvGeBBD6e6bAb/Jn6DbEx49C3akfKqqkjdLr21Or2yEhXH8wnt/Um/dl8HUUA5VqDKwzlGV9DCrUS6msT/gZR+KIz/5D38Ne6JI/NQf62iKFCZltIn5vTIhZmh9Z9xPWUd1MYuz/mim5sJCC2gjbMUQ/P96534w9xEM68YCkQD5NCr+P3Yz+AOBDRIqTgN+Ybr5+VefVjV1Mhxfvnk10Su73RYVB51RgzL6ypUX/u1TXwYb+he/78fe1zgFl4uIHhj68srxaTwbbO8HcXwxGfUKr92sA9sIlOpSMf2dq3/xm3/wO6u15n/9t37+mFZHpwoqaq+GW3945S+f3r+aI0ayjGjiN03bxiCTSnJlHTxV3DzwBir3UI3+yMJwF8tt5G2ETP4C+jObDW4C0FJSsOyvtRxFlfT+pOj7Rqmtn3vso51T785FC7aX6lnlTC6G+WyjCIlaAOM8nY2d2oKqYIaNLH/yk/+QuOUASKa90OsZ4jAbvpx6Iw0TrME1A5+SkbM1yzXc5nCWhiOU5NJKk2QnU7SW3XwwqVyQZAESEUubWN0QMWPPsasnk8P+y/sEtqLJly89f3xl7ZH7H8AOfOHSK8/euPjyePOb/euf/caX/vAvv9owa7/w/h/50ZOPtUtiCbLBLlJDdS6cOLNo1IIovqbGF29ceu6Vly7vbHxt85XfefbfPXP11YdOn/vPfvBvv792CuWonij/8fW//F9+5ze+0bse2DL8AQtTpP2t3aeffbaWiA+tnlYAioITS92phwHZPP7jARpd/jxUoxtg24K1z4KiMRts1uoaJv4lsz40auZX24MiU1eOP/j9K+ffI6pNmHKyUIIvJbvV+NJs93mlGmFO13TWwyBEzVgAXR5hFWxmUqUBZmYms43Nmy/qyZVatRMXhr30gN66oDXOivoieX7GxI9mo/4LX9p95WupsO90R6vrDy6f/ZkkbQ4GN9vrJwxnpQTcfTh64kiROPkETTT48/n+zT949esPPfzYan11GI9u9DauXLu6N+iDIQSQ9dyps+859cAFZwmjLsBWrBQZrp/nVhCGV0U349Gf71++vnUT/TsAIOGjG83Wo+cefPfSfcdEE+ko+K2xKm2Mdl+6cTFy5bih+hgOhiw6l1zwxLz8/tbagyfPwyAxa0uwyZ0JFFsmRrTHVmWBLCN4wkQUGLYrjPc3ZpONY6db+ejK9ee+PB1iMoiCuXSnHvxQ+8KTxAYrANeAVTEUst18emmy80I82wapyS91tbGyeOa9lXafKNfRP4owtQA8VqbI2G8M+68a0WXde3UyjSR3yWidri1e0FsnBWu5ENCSYFGDYDzyDq5MJjcG/RdqDjz5j4ra2u7NlysjWj35LqHqMhW5tYGh+xwxxm4gXw+CTJ6iXIniAtEL4ICE3EMDJg3F1DRBp743pDk08qBKDQkRK2SDiTkUIaJfCH4uQYE4CZQsUgrYUUcEx1xTwWCh7wWSBeMHpA2NmCQ2GpZAywah8TlKxFbn3hZbHpaQFSBvD8p4IE+kHi56eEQVskcZHwWULLxx6ZVa0+yutyY3n7tx6SXTqDU6Jzor9ymYL8kKdkIS0WSiaC8eXgS53u9dVsXMbi7NhJa5fD9IO7p7FgOpMcdG/rX/7tOaSjMLkqiPYTeOmdRUBGDIaEFb8yt0TSt8uBHshQq4v1BMrd5qLq81midk2ZVyTTEXIaWpf63WbIolRH+Xlz0scnJPizsBNR9lgzyjpjSQiUS1jnxHQlcAOED0XhQsiKcN/gGBFUSOxbgRciKwAVhYDwRPxRKVmqS0RN3JRQUTa6jVTY6KMkF4QDQQVLkpuCL/zQwdXD26m9gwFglejrw9tbHh1m4Riedmhi6BrCWRgOmvWHvw0TNcAWa9ZcCZjx3DnALUidpLp5eOP1pbe1TSu9AL2hfgLJUYu3vgDy8Otp+p4i1bCVHCri2eKpTVTD1hte7DZAPUhgk4+uRnPs04QAV+U5TecO+6P9iHtFDByFJ4BrSUFHEY4FrRrQJdyUQMljPQh4CaIwrtmLNRZbLp6nFyM09L2zzN1Y1fPxvtwmBLFt0T2MPwBzSlIrgFgIXKBAwjUYypREH6CTSOen2hufhimjFG8C9WiJoCiMQBVrUUY/gE8cEpjCHxIUakgQyg3tDkLRB1yKFzzj/h+shuOUWZEiT8DRpHGwGJDb13zmZh5pxdNUejDkXPKnqYVp4hAhz1djRTd2rN6XRqunW3daySacwO4lhcXVp4cbaPClA6vuKPrifepib5JtxrkI+mCvDj1vr3GQAymRvEV8if+uSnSC7wOoKqGk30smLEyhRTZNLUhi8tIjkPkwhEfd9EEwOq+mgclcHqx+sJ7sBuHAYDBUwsQRhu79frDZIznavCpj/heyhL4Sf3MMovIwaTcFhSgV3PQzu6GiZ6YBhkGSBVRmnitHz6DCKeUHMPxAcDwGY9M3YTHCZ+pg5ruikIFZEZzW3nYSIxQuasTBrfxtafeFAs46ZvYHH+YX2NaQctN7lJ/j7i9lPfWzAZbPmz4cJydxaHwHAdF919aHBAz2KGqURivKmlGwkqb5vPyN6uGI91pBG5NJ5WQdU2uw93T79XqR/LRUaEZciC/JlPfZIpKbhJKLJjfrKtARUjPSwx78VAmlFEKEvEcYC+WRXJO3wDEklQJkCRp+FbBgwERhvXrHo4mUA1nPYCzWSiZZ1H+mxaBYvYiHdCyRXPG/mNM7HNgyH6V55MMh3Ea9gRJ6wCxqwefgMwgCaWzTPPOyt47OOQcNKHs43Gqkm0/w7dD7nW+UrP1Zz/5+gHVmdhyR+tAodVshkq63vb123b0Cw7TIt6Y0GVLeoVykIhGeaTq0q2FfdfDvYvqvHIRSNekhi6I+udpKq31h/rHH+X5KxWgNJQO+YGAOL59Gc+wzJOJisiaIIDEINVh0qFbWtFFqdpgnZWMKl8NGmDkkSz6Q9A1lNNBwFmVWiG4oBBUuZJrWbu7W9bbkMFtROrKaN+i6QYt4/AA7fPZc4DfpLjbY/DH+/69Z0vusef+Gfchgaw1aWF5igWu4Zbz7t+pGCTGq/nRSTUqj3k6YODDYw6W11e8f3cra3AeqPjAw2xUj72B9cwQF7Oe8H4ejTdg4WhPa2ho22hAk/JaBuN41ptRdLbkupgSx/CKoI8b1kmi0wVG7xL1TF8Qhvs7/YPdpLYxwB3GAlsBcDeZRaUGchhKL3HpmqJJWjgFiwI1qbMYIezJAun42mr28EaMi0ld8X5T9T4ypPdt0O+b7wMR7p6uHfo+5jFYs/Dr+dg011yp3+F+efXzaYAYogd0rjh9asX2802aNi6VjfNBsakCGg0m6E18Hp/65uZf5PaibMxBplj6vp4Gk7Dcpqq41izF861jj0kWcuC5CCR4CaQP+RPfepT/G9s0xN6DxIzRq24jo0V7x/sYbWzNALl2NQEG70xyWA2wkyfEtY28T06vInIbxWQXrxS1ZRgisFZhd1os3AcVpcsO6ehzskLt0R/R1h3B7fhHjX89V7GMzguZGblmDUjbT76Bn4F82T18DN4EA+d5xgaFAZtnsiyg81rLwOibze6GGhv1uoQOuZFBaMrmY+e2EvB8NUq3K0ZBfwiZOJ56dgvvUwV7KXFM++urzxY6Uuo+iEEYg1JtzTvSPQcwkBMi4ooQQhQWyx9EoWqorTbTatml7EXB1MFcHMawChpapWm08HgeiVFIJ/AhamaLoGJWYTjft+tdWWD2rTZ5qVWA6JQM17/nfXgeT8I+A1sf/BWo+9sX3Au123Spb8fGjkaEHv08fO/zFEC9tMc8SYZFbEoReP96+ODTfASHRezA+pCPi3DK73tZ0Z7zynlbhZsFHEPUKkOEmxaGGZDr68q5kIs152lc+1jjwoG5sk30XzFSuK3ffWR1rPdSHuBdwlQvIBR9E5NV/XAD2YzDxk0ggf8HXBgzXGyDL2/ETqEwnhvNtnSEfzAt6LBG6BjhUnLB/7Uby6g1V9ngmSH4LFizdyssYotbTKKNymLocyOSjclWSrO2GcVZD486d4fxOc+XDn+zkNzx1SZjRXjoS6vHPHYnfVLMByRKkdskg2dTpFl073Ny9+09arTcJCUlVEMWfd2vzQbXmxYsSnN0mBfEzEpyYliWAtk00Y/wNwut7N2fvnMEwrq21KD4WiHhBkWd/ELvGVw2HVQ2zKFmuBEQGGBmtU7IFvix2DmhxHQXHCQkCLYCC8rkIUVcD9DIM7w9HmcjAcD9ETbeoo5AJMRNUebjSYr5DEfy6JtvptJIvOiGTfNFHOymWlwgpy/Pn8cFRfvUfpHFXoudpZK0KgzihPpjDXUiXhHP/885BW865E2HJ9JSsAWhcKxkE22Lj5dhAfH1pti7h1sXk28kZBvh/7LSjltIMDJMO4ud+yWqreizJhGRizUldqJxdOPdU89JhsLBAFg+CG7cXqSzFnR/bWiJ/0kjg9TFVoCGickqTaSKVROMOEIB9vVm00AIDM/AvSMq6REHL26kgIHlMVTlA60cmg3bZiYnZ1disYccGjoDtn3MTz8tsfRnSPtyeG78M8AgjlTaL4z7lHm85cxwJd71MMvZLU/mFJkiIzzCR4JpVRc0HN0gzdyE/8caw8AHCzQSf/q8/7w2lpXNbVgsHs5Dg4sHRnxoIgHUpbAieGgPDRAY4iHYixWxlKmtAVrsX3iXY3V+0UdfVXo7jOJms6yE9ZGzvtX5pd2h9az9cCC07xtXB9ugzHAdRHTtgyjUBREL7tb10JwQATkunRAnFKhQoPMGJ+XaApaKUZCMcFQQKjObIaxYLldB5+ORjcybiw+ErgV5bvs5tlmJ2CF+GFBgGm1yO9BMKID3ljt/o4zju9lEbjo6fPpyec+gqGflKCExaghF3REGYme4UkMLKCBNDTuEk/seQw1BS90Gk/2Ny49YytBzQwxWjCN9mo1IENo+0CbMhIWJQtQdpKTUAoipT+p+r5UgNB54XF35cECI9KoOoxpG7TrKNqk/Xc0Efuwr5qZVG7vmO2j7giICZmxDioRCQjIFlWfwIvzs/HWZOPrk/1L4WwG0K0IfcxR73YdqyajHm+4qImDdiGoelurHRtGeiLY7dVjmISJ+pmhNhDYClIDxx+Q7jOPMv9qzHYsgum0p6qVpVOfkKw5rFuMqnJECKNLpyLR/DJvuUee93PrQvuJbpHJlfI3KnSiPBRgahuVUWeBZtYMZxmVXTYqgVkbapcDeRTVnoAGNeVeEe1J8JheNOltO1pa02aht1HkaH4ByI+eeaiv6XvRaDBDuFOhlUdvm5315fsec5ZPCiqGntSRmWJNGTDHPT4T4mHDDaPBM+Xg3uy2B2vnoiunZkq8k/p68BPqzACgwLJLeul4o3/zWn/jiph6LVu09SxNh2AquHUd5NoswLRLXWu09e4C8n0M8hoj3Cykhr1kWt3SXE7qxyvZKgrMOqpRWZWl+kLZj/1Xk2jboGzPNZrnKnU5rXSg7cjscbGqYEDXKEw6jICYv+JjDLhVZ9Ayj2CQYqCbTwqkqi8ENwWcIxgD76y5nfOKu4DZvqj+EJgG6LNAT8pMEEZJsJVE+1ncy8NdW8M8P8xkrAFjn+5frrKBixGaWTHaH2GYluG2ZL0+9BBBGlp9ffUMLMwZ2e6g2RyehM7toi5rrg18ezOoYj6G41aUc6fBOXz9PAtiQTGTO+sxJisArYbuttxGB2mXjBJSmfdHwyBO4QWc5hLgUC9G5D8D2wubF1yHKMLU6b3ZcCP3D1RMiYln1IuPRi+i2ZBTpWN8ylRSkzw62L75UjhGvHwAPAwaCrI/ADY0UrN5BlRRZjjP3E1xzZmbFtKsw/wIYxWI6AlWqFeFm/7uS7PeTcS7st6stdcEGSwFGlOCnsgqHIpkXnpZ71I4uBj2LyE1zaOJJmqYm5UF+XQ0ORgM/DhVjBrmQuVVzYulQYCuZF2vr3dOPrxw4pHGylnJaNE4GZrPR87iVvDKihysPZV7rqM5LMzAvEbrOTOVLwIpFgAulFMAmdI8YHTYgKhPDKlQVmLB289HmyB/o0sXMwDROxanQVaOQI3XDVc3zawIwNjDQQfRdIRVqhsAQGy9cRZtvKXi5lIdSbYgos3DBD7lDW+ORtek6QuJ17dA1jj+QbXzaFW1QCwlpaG+A9AMcMk1Hp2x3Un1YA7RsUkP8z2B4TKiFIvxTrD/7N61p1D+bHRRdTjVWHsMGxMnGlVpmPnjKoaUcRLClt+/VmVDHH0BMo1goLFnaTSB16nDAvjx1A9B9xAabluRqOiLRqZ6a9ldOCHWVgS5BsY7AUsAL2n4GDu3gAmaWe/DSQ+sRseX5Ba5+LWi5zktJwezPYO2mRREAnT2IPJA4TGlSVfTKjnQCuBzgZiHGdr6Q4zaVFBjHvYvYtQyrtDFpGVTcWqg+kZB72bqDV0c5hMKYaK2FpfQaDOOpcbiOYumLFCLA2rrB9sX5ckzQribiI3awiONkx8RlLNoSGchAm5qSt1eIOJTTZuNDmHelBtGbvPJ+tD0XMyrHmfDi8MbX42BbcEKWMvO4sP24v3U1JnOotnAw+ztZGwrSTLbq6IJhhNjI2IkudI+JTmLHnUmKkGcjfwxmopanXa9jnE3It5ddwwQ51M0TGBYttrAZBZJsSRZB+ldVIkoRs14LHolEJZ82hyZ4OvxJqKnJSOx056dn9kBmhBClNl0gJqKZtfp7opBOEIafQNnM6EBHa0nQPIMHGBjgAUMblkSZ3BlJuiMVTbGWOMU85q9galKtq7NJiNRk1TXHoe5ai3UWic1vaPgYxV1erA9ufk1tRyUmIlvLnaPv09xHxXVc4JkIh+sZBB+0HOJ8So0/JEN+OBt+Id8AhI9nGegFH412w72npvsPKtUYwyHq3VOdU6+RzRX0FKMiSneZH86Rqk6NPDSUQ9obdOtZWGcgkVcX1etpqqj50+nCcOYpa5juqWJ1tLAw1g0NH7FCbWk27qDQt66SpM4bVQPQ5wqjXAPOTzxoDkcO1+D2zOVI7f6OufNHomeVgitE2WORgYAGqNRbzzq112t5oJ3NJHT/uTg4mjvCi7FkHVFdoiNjJJT05XsJuZ1BSNqFsUw6MlwoyjpiA84DdfCFOYgAZkC1Hih8kI4E0xUWrPMRhyjjQfVQsyq3i/kEA5WsRed9rtqSx+qlHUMPMqBqlYJbz+lQxcRArEMjU0q4uAkoArwD8f5ZCfZvxzsvyinO5oUYZt2jt0XCxiUW9PyWZUOJrMeZgBjXCqY2uhqBlQuCmaMGEdQ0Ubq1uq2i6GjmJAnoqWG4tLZOIlmQGcrBEKJn0PF6qut5QuSu1po7VJ0BjiKMcqWltZMp40iBi9HfBuiP+LDEv0NI4yp/gzAho3LDEc4c3VXLWYCJtLlvTLqB6MDZIcuDkcSjTCI3LppIcHTuhjThQ3cXEKyB5Ig2p0pVU7jzLasBC1ypWc62hB9Q6lkqDhwxkX8nSUJsA+E3XFxkJTYFWhRWF0+9cOK/UAlL6MaBnti0KwtZHgAxWkaAkRPREuwhmkkOhZhUsY7w41Xst41LTswZc/G6WmaNpkmQaxrSk0rp2U8gE+vNRzVMgBLKjoCWQzINEyzFccZeqOgagEmMqEIYVuGoqReADqALmWOKeG4S2C5kl436sdEey3XFhOpncqNeme9tbAGg4T2erDBWDsBZH/EbnsdOOR1IhyW1/EIjnoFUcOkdm30zGPCrW44KABUSRp5w4OtGFUbDI7EIAYhdy1UziwMtIiTXhgNYaMU/D0eRMGeIOKoECgjyMTJaDjNc9lGCTjBEXKCa5o5jpgBYpKiOxyHSOMUBgWxU4zxX/gEoCbBDEtG9ArdkpEWgLbJKG4UNyOGI8wDjgDEb4wIwz7xC28jnV719y/LUa+Bc9jLMIOvUpX+AaaPJbYCsiaG1YSui7Wu5SlGTNI84PEkjBNMtcZxBzTNJgoGk8mOqWe2LnnjQeLP6ggOaqYmUTu0ZoPS0c5LbW8Y5oLdWj7ZWjqGQwox4RgZqKYYuIG51pN35TnIPBO5PYp/XdHPX0C+ghBXmmdBZ8GgoIz+GFQ/YAXhRMGKchtOe1lT9SxJJzi3KU8QuSEVBc09zyscVuVYsBF+6PUJZMZNwcOWCkoAKPfaGO+VEuaE9KlBLNp85vUwRdJw0CeFafBTVAcaQIwg6TSaTAbwGqaD/kxMs8Pl0XAmFrFRooUOedDWMMqv8A6Gm8+lk0tKOnQUJD/w/YEHMjTdACptvikVTh1n24GxL1NnFViyojY86IN8Z6uAXKcqWOveCEMDLLNsuHoSR6DlIayr1dBtLIzG4xRLZS/Zaxdkd002lrrrD2rucoUjryWcFmZD7ui0IJD8KASeC/1eRX8Uh3KEjzkMHpZSk4GWl2rkpxG4v1E5nUXxLJh6oY+rRC6OJlF70bCWQElDYxJNaUQ3H2C9GOclYEqYJmLkM1DPLIBCYVnCKb3P9zzUugpYEjV3mmg/yWhgqF/IOUqfqN9mnj9OE6yWIdFZKJj3RVWk+d3Roa9I96gDxe/dmBy8KiY7KNGhM242HULEar0h40xQbJTQdxTqgh7AZAQ4ooSqujTmJ/DlLGrgs4UAhy+kAVpzJMeS0CmGMbKW1XGc5SAS9voTlL0nuQrSKTit08QsAdroXTQS60ZLUVGYA7GKwDKm5KQRvF3w0ITcrvH09zfS+sOUkSVfvBWC0iv03eLzNZyz6WCsoyQbGEaXoKgr6+ixyURMUzctd1U362i88r0ZKLm242KD0vlOiqGaZpoEvj+ifEfFIAM2mBKnxfgYHw/PpRRFokm6JligVCJRxcHSrO9LNHQDLXhYaqyWaLQwgZvGhzJNYrhcXvm76cHF1NtUsgE8C2brA0vFREi73tAV8GLBrPAsXIGujsIpKkzYkZZh4lUIWnCd6IqyUHbFOH7cnFbDNcPF9YcjnGdiWi2rvZIJuoddhJPdtcXKBBTRNqy1euesVVtDy5+sN9ClxrADBk/xgGs+JIXH+K+j9a8T4dy9Onf+DKwYgSY7ixDEYpRNPEw5FnOwGFBNHOtKaaOHHcc1DDemY9Bm0a0hI+Aysd/zGPEOwq8hBpUEE9OWHcfBoEzATJPRFIOBG22rIPIPZvdhBjDGJsHwQvSYaAIvgc1WQzaXinVn7UPqwgOV2kUgiHVR4WDDDX/76/HoFUUc4Xg+HaaRgGLyCMiAotADOgZvBaeUJPE0mDpoBrabdNTFFPYEfQp5s163LQ1VNqoaKM2AYiIEsjkOiq53llUXnMZ6EGMCiKvXWjizRNeBViKKQ3OaBWyRHTxNjB0GJH3LYUZzgb6O1r+56BkWActDoxEJCqUZgCAJYGg5MLxsMJgd7CAGHc9CpCNJgJPL/MQybNutJWmMxl5A0mCwmDaonJQy6waSESMK0J8LShpiUbDlEUonXjBE04wOtyfGuoUwFPHJTDVFP5zSoRE4i0SjBhAZDjy5mY1f9PvPAUlHtpFmI0BJMlJnESY+hv+IUjTZYNWwi+IgxulMkqkCywPCRaAmeqcsk8prQQjT6WM+t2Q0xxPf8ynYQQfDYIYTF7NJIOKYAM3u6G4bGI6ig/HmCNiaNJGPRkYyAgOHl27DEd5UlG9Z64mwx/I0SuNJenTSNRINTCUpQfcOJsDUwuneQe9KEhy4hrzYaVmWKUbBpL85m+whQUZ5E9yFCgy5KMCAGwVQGtxymqhK5WAAgmsBYRn0D+LQq9ds5iDRhipgXTUDc4zBGexozmKm1lvH78MpPf7+dQXDPKebCgYACynWGicZUEab4kAHdEPPWu2WUwNVK51508CLtKJhqQ36dzAHNQlHeoBkM8IgypkPBWl21lT3eFnqnhcORz6sm9Nccdureg023VJMV6VmNag/JsbzMy2Jfc+BDTqgkjNcbmNDvInwvw3R0xfx48x5wZOSXzrpC1y9DBA+8Bp0NY4G1/t7lxN/jFMgZdjsCLPEPU1OcZRVa3HBdfTpeD8MPF2FzW2grIvPwnl+Ol4N6gU6u3AMhze1TB1nS4KNtYvjWxRrZe1Yjv4w8IBKFOE0EGwDaCdOQ1QLvYjRO4zUB2uOPdZoQrhCGKKCltZqLg7QoooOZnogB5VbEsKEcOLHI4x/cFuY5a6jM3s6QYO3GKGfylzUzFaaSnGqtjonFlfPuZ0VqdZAmQFpBHpQ2RQx7Hh6ci4s84OEviKXxqjS17Xsr12Dtyp6yH1O+6eCF29G5F6ElViJ+UhQXVCkSEoP/Ml+icA8ifJkDNHbVunA6qsAa73Qw6jYIAGfKJNiP4J1RySqgn4rWgiZQTpHjxGMNkwTHN+N69cwROzCgw9jjF46HftJZrYWoLGoVgTjnhh7NewWu7a92x9PJqfOnDZwtAyi2iDA+TPEGUaoC2YT/EiWe4MpXLbTAuEF5y9gHrOt2KALWHEgxbEcAaMzYL4RRHR1Y9FyllRnEToOLA1BM0MvOLJIJoZqPgi2GLuDwHU2fZRxXl7HqX7noseXIm/Ed8zpdEcoCvto2gWMF4Y1QN8SgMYUNkDASaH97cHgho8ToTFxNgslCQ0eqEuAMoezDGN/5rXq7uoS8pQoLtAoXm+3ETMIGDdIdVJgUnG4u7+HUv1St1sl/tbefmt13WrUwVLZ27wuF9na4iqauJHNQ9ZLS21MjKTgFwhBrR4F0Wg4RBCPMAnTTPZ39xBPWq6uICRA3IpmJ62BZrG8cDE3tLtyzGpbZr2NCp9AZEqMtcCfyObns09hXnlgxc06T5YYgMflTqzS75LW4ztocDNberJx81OsWTjFfsmGDJD0wRFGkZNwG2zEIsNka/CztlKvL0RjtIFlyTT0J+F0hrMjT6ytNdpu5g0Hg63RbIKxHufuO+M0m9NN4nyZpubWcTwEzo2Y2sBC4U/3D3QXx93W8zQKxgNEjc1GO44rTEGjAe84hXc8BpO1BtJSrdnb3tndw1wHHPazBi50LhiD8WzvYD8uikZ70a4vSRqgjq6i4Ji1RbPWJFGDYYED3UswSdH9jWLZrZmzhyUxXoBki3ALOGWVkaNSzrcIV14Hr/9WAc68cn/4Lby6evtlgFBD14XchXr1SrChCdsCAgBXHGOIhhD7EE4SDvZ2ru9ubNB4fxxUEozCoIfktd1Gh0/DgtpiFPbuzs72xvJSd2VtOYwC6uylww1isOrAdkY3Hg0LzBKV1ZphqSvFsm07nI42t3agHThYCUcmYQ0Gg3F/NAY8B5cIDh5OOwAgZdba68fPtRaOS8DctaagNeBI2WEG1ELOj0HFSBdWomMiZvAjadgtc8L/erQc85X4rmk9B5K5fTtad3YN8yoYNiddJh+yKwF6QD5M/e9EfqUqIxIcmmdUoM13HHmTYDwmUA1Tx+NhWQbogscxjigAjAcHCGAaNQTRsoWyvKWOJoPJdLzUbtVbXRhlnD1KY/9zTOPwR+MhNqPbWVRkHakq+oenHk4mQ0KE9ou2BUQapHw0hqk4Vqsp6g2n3mrUFwEO45RWUbJp4oWiYzIz7gnjp8hjsjGOrL2EkTQ5hY3XIlmtmNN7uJk94rfxTXCPj7fqZkmbOZdkrgl8DfjP5GznV8P8AVE/5vQa/BNQLnR9U+mA6l4SOsHQ9ks5a4aAG6epRuFgPNqBG8QIayqN0LnCOEJ9HHgTOjewxJGHGNpStlwL8w50s3nu/seS8Xjj8isYl436GA4NQdYrqxiYDXetubWG7TaAumFzyKoOuKne6pi1BnoBqCsULUootSEFxaE+uCakgaztn+gt1EFPGk4nfhAbCTRpOtGAloBz41CGInwAdzqffMoUj9MFKfe/V9G/duTLt3jnoVGfy/o2yd/5RpZL09XwOuM802BtI5x9yskR7ORkdvoo3RKQyRQz9NHJjlE+IQ49GwwOEuBBkujU7HrNjZB++gEIHe3uUn1pBWB0f2tzOhmij6/Z7aCAud8fRFmuaRoh161Oo9FSbAtJGikGhvvRYE6NjftGhALWBbsQ3r3ABoRRDx63Iuya2QwfzoeYk8/ZPzGNn+vc7Yo+97rfNdHf4we/wcv4WIzb/vHQcHJ1oUSZTo+c7yCsBykgBMSDZepyYk9e82QzWqlHihtjPkKPDpnhxWXGMaNOZf5pjGQISfKonKsMe9+d6eddP35nt/tm754PW/zufcFrP/lb7DN+0ioXJhMK63hm/+MNDvz9ZB7Ych0eAU0DNJkd4CxDUk42MvdO1ibT4LsZcLf85l+lHN5xomc4NeOdMhvFY2e2EIyWQD/NB7CywIldP1sV1pNGf+FLwwHX16gwQ47ufPyVqfnd3/uWbf13WTGoMZgwIi5pZiaYVz9iHDOB0kXMdwNfmfm+OPQt/AQKtgBvlav8Xb6/Wx//PdD6N783nr/wWInHEbebYm6wbycZ3f1pcx/+VybAb/+L3nGi54PNbwtUuSE+MhN3W+q7d/Hr8i6+ffl8F9/5ThM98X6/lejvGMB/l2wO6fvfRZG9XR/9/wHjMXw37cW1bQAAAABJRU5ErkJggg=='}"/>
  <div>
    <div class="co-name">${co.name||'CÔNG TY TNHH THỰC PHẨM SÔNG CÔNG'}</div>
    <div class="co-addr">${co.address||'Tổ 1, P.Mỏ Chè, Tp Sông Công, Thái Nguyên'}${co.phone?' — ĐT: '+co.phone:''}</div>
  </div>
</div>
<div class="title">PHIẾU GIAO HÀNG</div>
<table style="width:100%;border:none;margin-bottom:8px;border-collapse:collapse">
  <tr>
    <td style="border:none;padding:3px 0;width:210px;font-size:15px;white-space:nowrap">Tên khách hàng</td>
    <td style="border:none;padding:3px 0;width:12px;text-align:center;font-size:15px">:</td>
    <td style="border:none;padding:3px 0 3px 6px;font-size:16px;font-weight:700">${order.customer||''}</td>
    <td style="border:none;padding:3px 0;width:160px;font-size:15px;white-space:nowrap"></td>
    <td style="border:none;padding:3px 0;width:12px"></td>
    <td style="border:none;padding:3px 0 3px 6px"></td>
  </tr>
  <tr>
    <td style="border:none;padding:3px 0;font-size:15px;white-space:nowrap">Địa điểm giao hàng</td>
    <td style="border:none;padding:3px 0;text-align:center;font-size:15px">:</td>
    <td colspan="4" style="border:none;padding:3px 0 3px 6px;font-size:16px;font-weight:700">${order.pointName||order.address||''}</td>
  </tr>
  <tr>
    <td style="border:none;padding:3px 0;font-size:15px;white-space:nowrap">Ngày giao hàng</td>
    <td style="border:none;padding:3px 0;text-align:center;font-size:15px">:</td>
    <td style="border:none;padding:3px 0 3px 6px;font-size:16px;font-weight:700">${gd}</td>
    <td style="border:none;padding:3px 0;font-size:15px;white-space:nowrap">Ngày đặt hàng</td>
    <td style="border:none;padding:3px 0;text-align:center;font-size:15px">:</td>
    <td style="border:none;padding:3px 0 3px 6px;font-size:16px;font-weight:700">${ngDat}</td>
  </tr>
  <tr>
    <td style="border:none;padding:3px 0;font-size:15px;white-space:nowrap">Giờ giao</td>
    <td style="border:none;padding:3px 0;text-align:center;font-size:15px">:</td>
    <td style="border:none;padding:3px 0 3px 6px;font-size:16px;font-weight:700">${order.deliveryTime||''}</td>
    <td style="border:none"></td><td style="border:none"></td><td style="border:none"></td>
  </tr>
</table>
<table>
<thead>
<tr>
  <th class="th1" rowspan="2" style="width:3%">STT</th>
  <th class="th1" rowspan="2" style="width:28%">Tên hàng</th>
  <th rowspan="2" style="width:6%" class="th1">Số lượng</th>
  <th rowspan="2" style="width:6%" class="th1">Thực nhận</th>
  <th rowspan="2" style="width:3.5%" class="th1">ĐVT</th>
  <th colspan="2" class="th1">Kiểm tra</th>
  <th colspan="4" class="th1">Xuất đi</th>
  <th colspan="4" class="th1">Thu về</th>
</tr>
<tr>
  <th style="width:3.5%" class="th2">Đạt</th>
  <th style="width:5%" class="th2">Không đạt</th>
  <th style="width:5%" class="th2">T.trắng</th><th style="width:5%" class="th2">T.xanh</th>
  <th style="width:3.5%" class="th2">Rổ</th><th style="width:4%" class="th2">INOX</th>
  <th style="width:5%" class="th2">T.trắng</th><th style="width:5%" class="th2">T.xanh</th>
  <th style="width:3.5%" class="th2">Rổ</th><th style="width:4%" class="th2">INOX</th>
</tr>
</thead>
<tbody>${rows}</tbody>
<tfoot>
<tr class="tfoot-row">
  <td colspan="2" class="tfoot-row" style="text-align:right;border:1px solid #333;padding:4px 6px;font-size:16px;font-weight:700">Tổng</td>
  <td style="text-align:center;border:1px solid #333;padding:4px;font-size:18px;font-weight:700">${totalQty.toLocaleString('vi-VN')}</td>
  <td style="border:1px solid #333"></td>
  <td colspan="11" style="border:1px solid #333"></td>
</tr>
</tfoot>
</table>
<div class="signs">
  <div class="sign-box">Người giao<div class="sign-sub">(Ký, họ tên)</div><div class="sign-line"></div></div>
  <div class="sign-box">Người nhận<div class="sign-sub">(Ký, họ tên)</div><div class="sign-line"></div></div>
</div>
<\/body><\/html>`;
  }

  if (template === 'foseca') {
    const rows = lines.map((l,i) => `
      <tr>
        <td style="text-align:center">${i+1}</td>
        <td style="text-align:center">${l.productId||''}</td>
        <td>${l.productName||''}</td>
        <td style="text-align:center">${l.unit||'KG'}</td>
        <td style="text-align:center">${Number(l.qtyInvoice||l.qtyProd||0).toLocaleString('vi-VN',{minimumFractionDigits:2})}</td>
        <td></td>
        <td style="text-align:center">${order.deliveryTime||''}</td>
      </tr>`).join('');
    return `<!DOCTYPE html><html><head><meta charset="UTF-8">
    <title>Phiếu giao nhận hàng</title>
    <style>
      body{font-family:Arial,sans-serif;font-size:12px;margin:20px}
      h2{text-align:center;font-size:15px;margin:10px 0}
      .header-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px}
      .header-left,.header-right{font-size:11px}
      .meta-row{display:flex;gap:20px;margin:4px 0;font-size:11px}
      table{width:100%;border-collapse:collapse;margin-top:10px}
      th,td{border:1px solid #000;padding:4px 6px;font-size:11px}
      th{background:#f0f0f0;text-align:center}
      .total-row td{font-weight:bold}
      .sign-row{display:flex;justify-content:space-between;margin-top:40px;text-align:center}
      @media print{body{margin:5mm}}
    <\/style><\/head><body>
    <h2>PHIẾU GIAO NHẬN HÀNG</h2>
    <div class="header-grid">
      <div class="header-left">
        <div><b>Bên giao :</b> ${co.name||'CÔNG TY TNHH THỰC PHẨM SÔNG CÔNG'}</div>
        <div><b>Địa chỉ &nbsp;:</b> ${co.address||'Tổ 1 - Phường Mỏ Chè - Thành phố Sông Công - Thái Nguyên'}</div>
        <div><b>Điện thoại:</b> ${co.phone||''}</div>
      </div>
      <div class="header-right">
        <div><b>Bên nhận :</b> ${order.customer||'Công ty TNHH Foseca Việt Nam'}</div>
        <div><b>Trụ sở &nbsp;&nbsp;:</b> ${order.address||''}</div>
        <div><b>Ngày &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</b> <b>${order.deliveryDate||''}</b></div>
      </div>
    </div>
    <div class="meta-row">
      <span><b>Số PO:</b> ${order.invoiceNo||''}</span>
      <span><b>Giao tại Bếp:</b> ${order.pointName||''}</span>
      <span><b>CODE:</b> TPSONGCONG</span>
    </div>
    <table>
      <thead>
        <tr>
          <th style="width:35px">Stt</th>
          <th style="width:80px">Mã hàng</th>
          <th>Tên hàng</th>
          <th style="width:45px">Đvt</th>
          <th style="width:80px">Số lượng</th>
          <th style="width:90px">Số lượng thực nhận</th>
          <th style="width:70px">Ghi chú</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
        <tr class="total-row">
          <td colspan="4" style="text-align:right">Tổng:</td>
          <td style="text-align:center">${totalQty.toLocaleString('vi-VN',{minimumFractionDigits:2})}</td>
          <td></td><td></td>
        </tr>
      </tbody>
    </table>
    <div class="sign-row">
      <div style="width:180px"><div>Người nhận hàng</div><div style="font-size:10px;color:#555">(Ký, ghi rõ họ tên)</div></div>
      <div style="width:180px"><div>Người lập</div><div style="font-size:10px;color:#555">(Ký, ghi rõ họ tên)</div></div>
      <div style="width:180px"><div>Người giao hàng</div><div style="font-size:10px;color:#555">(Ký, ghi rõ họ tên)</div></div>
    </div>
    <\/body><\/html>`;
  }
  if (template === 'youngsun_dbg' || template === 'youngsun_trina') {
    const isDBG = template === 'youngsun_dbg';
    const bep     = isDBG ? 'DBG'        : 'TRINA SOLAR';
    const bepCode = isDBG ? 'DBG'        : 'TS';
    const caDefault = isDBG ? 'CA CHIỀU' : 'CA SÁNG';

    // Bảng tra mã Youngsun từ tên sản phẩm SCF
    // key: chuỗi viết tắt trong Sheet1 → {code, name, unit}
    const YS_MAP = {
      'BC':  {code:'B001', name:'BÁNH CUỐN',        unit:'KG'},
      'B':   {code:'B002', name:'BÚN TƯƠI',          unit:'KG'},
      'T':   {code:'B005', name:'BÚN TƯƠI SỢI TO',   unit:'KG'},
      'L':   {code:'B006', name:'BÚN LÁ',            unit:'KG'},
      'P':   {code:'B003', name:'BÁNH PHỞ TƯƠI',     unit:'KG'},
      'Q':   {code:'K0039',name:'QUẨY ĐÔI',          unit:'CÁI'},
      'C':   {code:'K0041',name:'BÁNH CHƯNG NHỎ',    unit:'CÁI'},
    };
    // Tra mã Youngsun từ tên sản phẩm SCF
    function findYS(productName) {
      const n = (productName||'').toUpperCase();
      if(n.includes('BÁNH CUỐN')||n.includes('BANH CUON'))  return YS_MAP['BC'];
      if(n.includes('SỢI TO')||n.includes('SOI TO'))         return YS_MAP['T'];
      if(n.includes('BÚN TƯƠI')||n.includes('BUN TUOI'))    return YS_MAP['B'];
      if(n.includes('BÚN LÁ')||n.includes('BUN LA'))        return YS_MAP['L'];
      if(n.includes('BÁNH PHỞ')||n.includes('BANH PHO'))    return YS_MAP['P'];
      if(n.includes('QUẨY')||n.includes('QUAY'))            return YS_MAP['Q'];
      if(n.includes('BÁNH CHƯNG')||n.includes('BANH CHUNG'))return YS_MAP['C'];
      return null;
    }

    const co = company || {};
    const coName  = co.name  || 'CÔNG TY TNHH THỰC PHẨM SÔNG CÔNG - A0031';
    const coAddr  = co.address|| 'Tổ 1, phường Bá Xuyên, tỉnh Thái Nguyên';
    const coPhone = co.phone  || '0917856968';

    // Ngày giao & MVĐ
    const ngayGiao = order.deliveryDate || fmtDate();
    // MVĐ: YS + ddmmyy + DBG/TS  (theo công thức Excel B28&B29&B30)
    const [dd,mm,yyyy] = ngayGiao.split('/');
    const ddmmyy = (dd||'00')+(mm||'00')+(yyyy||'0000').slice(-2);
    const mvd = 'YS' + ddmmyy + bepCode;

    // Ca
    const caDisplay = order.shiftLabel || caDefault;

    const B  = 'border:1px solid #333';
    const BC = B+';text-align:center;padding:4px 6px';
    const BL = B+';text-align:left;padding:4px 8px';

    // Build rows — dùng mã Youngsun, không dùng mã SCF
    const rows = lines.map((l,i) => {
      const ys = findYS(l.productName);
      const yscode = ys ? ys.code : (l.productId||'');
      const ysname = ys ? ys.name : (l.productName||'');
      const ysunit = ys ? ys.unit : (l.unit||'KG');
      const qty    = Number(l.qtyInvoice||l.qtyProd||0);
      return `<tr style="height:36px">
        <td style="${BC};font-size:14px">${i+1}</td>
        <td style="${BC};font-size:13px;font-weight:600">${yscode}</td>
        <td style="${BL};font-size:13px;font-weight:600">${ysname}</td>
        <td style="${BC};font-size:13px">${ysunit}</td>
        <td style="${BC};font-size:15px;font-weight:700">${qty||''}</td>
        <td style="${BC}"></td>
        <td style="${BC};font-size:12px">${l.note||''}</td>
      </tr>`;
    }).join('');
    const totalQ = lines.reduce((s,l)=>s+Number(l.qtyInvoice||l.qtyProd||0),0);

    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>送货确认单 - ${bep}</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;padding:14px 18px;font-family:'Arial',sans-serif;font-size:13px;color:#111}
  table{border-collapse:collapse;width:100%}
  .legal{font-size:10px;color:#666;line-height:1.6}
  .coinfo{font-size:11.5px;color:#333;margin:1px 0}
  .title-wrap{text-align:center;margin:6px 0 2px}
  .title-cn{font-size:20px;font-weight:700}
  .title-vn{font-size:12px;color:#444;margin-bottom:8px}
  .meta-row{display:flex;align-items:center;gap:0;border:1px solid #333;margin-bottom:0}
  .meta-cell{padding:4px 10px;font-size:13px;border-right:1px solid #333;white-space:nowrap}
  .meta-cell:last-child{border-right:none;flex:1}
  .meta-label{font-size:11px;color:#666}
  .meta-val{font-weight:700;font-size:14px}
  thead tr th{background:#c6e0b4;border:1px solid #333;padding:5px 4px;font-size:11px;text-align:center;line-height:1.4;white-space:pre-line}
  tbody tr td{vertical-align:middle}
  .tong-row td{background:#e2efda;font-weight:700}
  .foot{margin-top:20px;display:flex;justify-content:space-between;padding:0 20px}
  .foot-col{text-align:center;width:40%}
  .foot-col .sign-space{height:44px}
  .foot-col .sub{font-size:11px;color:#555}
  @media print{body{padding:6px 10px}@page{size:A4;margin:8mm 10mm}}
<\/style><\/head><body>
  <div class="legal">Chứng từ này được tạo bằng bản in điện tử, có giá trị pháp lý tương đương với bản gốc</div>
  <div class="legal">本单据为电子打印生成，与原件具有同等效力</div>
  <div class="coinfo">CÔNG TY: ${coName}</div>
  <div class="coinfo">ĐỊA CHỈ: ${coAddr}</div>
  <div class="coinfo">LIÊN HỆ: ${coPhone}</div>

  <div class="title-wrap">
    <div class="title-cn">送货确认单</div>
    <div class="title-vn">Bảng xác nhận số lượng giao hàng</div>
  </div>

  <div class="meta-row">
    <div class="meta-cell"><span class="meta-label">Ngày giao&nbsp;</span><span class="meta-val">${ngayGiao}</span></div>
    <div class="meta-cell"><span class="meta-label">MVĐ:&nbsp;</span><span class="meta-val">${mvd}</span></div>
    <div class="meta-cell"><span class="meta-val">${caDisplay}</span></div>
    <div class="meta-cell"><span class="meta-label">Bếp:&nbsp;</span><span class="meta-val">${bep}</span></div>
  </div>

  <table>
    <thead><tr>
      <th style="width:38px">STT<br>序号</th>
      <th style="width:68px">原材料代码&#10;Mã nguyên&#10;vật liệu</th>
      <th>原材料名称&#10;Tên nguyên vật liệu</th>
      <th style="width:52px">单位&#10;Đơn vị</th>
      <th style="width:80px">送货数量&#10;Số lượng&#10;đơn đặt hàng</th>
      <th style="width:80px">实收数量&#10;Số lượng&#10;nhận thực tế</th>
      <th style="width:88px">备注&#10;Ghi chú</th>
    </tr></thead>
    <tbody>
      ${rows}
      <tr class="tong-row">
        <td colspan="4" style="${BC};text-align:right;font-size:13px">TỔNG</td>
        <td style="${BC};font-size:17px">${totalQ}</td>
        <td style="${BC}"></td>
        <td style="${BC}"></td>
      </tr>
    </tbody>
  </table>

  <div class="foot">
    <div class="foot-col">
      <div>Người giao hàng</div>
      <div class="sign-space"></div>
      <div class="sub">(Ký và ghi rõ họ tên)</div>
    </div>
    <div class="foot-col">
      <div>Người nhận hàng</div>
      <div class="sign-space"></div>
      <div class="sub">(Ký và ghi rõ họ tên)</div>
    </div>
  </div>
<\/body><\/html>`;
  }
  return '';
}

function PrintTemplateModal({order, company, onClose}) {
  const [tpl, setTpl] = useState('welstory');
  const doPrint = () => {
    const html = buildPrintHTML(tpl, order, company);
    const w = window.open('','_blank','width='+Math.round(screen.availWidth*0.9)+',height='+Math.round(screen.availHeight*0.9)+',left='+Math.round(screen.availWidth*0.05)+',top='+Math.round(screen.availHeight*0.05)+',resizable=yes,scrollbars=yes');
    w.document.write(html);
    w.document.close();
    setTimeout(() => { w.print(); }, 500);
  };
  return h(Modal,{title:'In phiếu giao hàng',onClose},
    h(F,{label:'Chọn mẫu in'},
      h('div',{style:{display:'flex',flexDirection:'column',gap:8}},
        PRINT_TEMPLATES.map(t=>h('label',{key:t.id,style:{display:'flex',alignItems:'center',gap:8,padding:'8px 12px',borderRadius:'var(--r)',border:'1.5px solid '+(tpl===t.id?'var(--pri)':'var(--bd)'),cursor:'pointer',background:tpl===t.id?'var(--bg2)':''},onClick:()=>setTpl(t.id)},
          h('input',{type:'radio',checked:tpl===t.id,readOnly:true,style:{width:'auto'}}),
          h('span',{style:{fontWeight:tpl===t.id?600:400}},t.name)
        ))
      )
    ),
    h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'10px 14px',fontSize:13,margin:'8px 0'}},
      h('div',{style:{fontWeight:500,marginBottom:4}},'Thông tin đơn:'),
      h('div',null,'📍 ',order.pointName||'—', ' | 📅 ',order.deliveryDate||'—',' | ⏰ ',order.deliveryTime||'—'),
      h('div',null,'📦 ',(order.lines||[]).length,' mặt hàng — KH: ',order.customer||'—')
    ),
    h(Row,null,
      h('button',{onClick:onClose},'Hủy'),
      h('button',{className:'bp',onClick:doPrint,style:{padding:'8px 20px'}},
        h('i',{className:'ti ti-printer',style:{fontSize:14}}),' In phiếu giao hàng'
      )
    )
  );
}


const NAV=[
  {key:'welcome',icon:'ti-cloud-sun',label:'Thời tiết'},
  {sec:'Cài đặt'},
  {key:'company',icon:'ti-building',label:'Thông tin công ty'},
  {key:'appearance',icon:'ti-typography',label:'Cài đặt giao diện'},
  {key:'printtemplates',icon:'ti-file-spreadsheet',label:'Mẫu in Excel & mapping'},
  {key:'employees',icon:'ti-id-badge',label:'Nhân viên'},
  {key:'backup',icon:'ti-database-export',label:'Backup dữ liệu'},
  {key:'prodshifts',icon:'ti-clock-play',label:'Cài đặt ca SX + ca GH tự động'},
  {sec:'Quản lý nhân sự'},
  {key:'attendance',icon:'ti-face-id',label:'Chấm công'},
  {key:'attendance_settings',icon:'ti-settings',label:'Cài đặt chấm công'},
  {key:'advances',icon:'ti-cash-banknote',label:'Ứng lương'},
  {key:'rewards',icon:'ti-scale',label:'Thưởng phạt'},
  {key:'leaves',icon:'ti-calendar-minus',label:'Xin nghỉ'},
  {key:'tasks',icon:'ti-clipboard-check',label:'Giao việc'},
  {sec:'Báo công'},
  {key:'attendance_report',icon:'ti-report-analytics',label:'Báo cáo chấm công'},
  {key:'workreport_vp',icon:'ti-building',label:'Công kế toán'},
  {key:'workreport_sx',icon:'ti-building-factory',label:'Công sản xuất'},
  {key:'workreport_lx',icon:'ti-steering-wheel',label:'Công lái xe'},
  {key:'workreport_total',icon:'ti-report-analytics',label:'Tổng công'},
  {sec:'Các quy trình'},
  {key:'process_accounting',icon:'ti-file-invoice',label:'Quy trình kế toán'},
  {key:'process_bun',icon:'ti-tools-kitchen-2',label:'QT sản xuất Bún'},
  {key:'process_pho',icon:'ti-bowl',label:'QT SX Phở'},
  {key:'process_banhcuon',icon:'ti-cookie',label:'QT SX Bánh cuốn'},
  {sec:'Danh mục'},
  {key:'depts',icon:'ti-sitemap',label:'Bộ phận'},
  {key:'materials',icon:'ti-tools',label:'Nguyên vật liệu'},
  {key:'assets',icon:'ti-building-warehouse',label:'Danh mục tài sản'},
  {key:'products',icon:'ti-box',label:'Sản phẩm'},
  {key:'customers',icon:'ti-users',label:'Khách hàng'},
  {key:'workcats',icon:'ti-checklist',label:'Danh mục công việc'},
  {key:'shifts',icon:'ti-clock',label:'Ca giao hàng'},
  {sec:'Bán hàng'},
  {key:'deliveryrules',icon:'ti-clipboard-text',label:'Quy định giao hàng'},
  {key:'quotes',icon:'ti-file-invoice',label:'Báo giá'},
  {key:'delivery',icon:'ti-truck-delivery',label:'Đơn giao hàng'},
  {key:'intem',icon:'ti-printer',label:'Intem'},
  {key:'orderdetail',icon:'ti-list-details',label:'Chi tiết đơn hàng'},
  {key:'trips',icon:'ti-steering-wheel',label:'Chuyến giao hàng'},
  {key:'marketsales',icon:'ti-building-store',label:'Bán hàng chợ'},
  {key:'powdersales',icon:'ti-bowl',label:'Bán bột bún'},
  {sec:'Mua hàng'},
  {key:'nccs',icon:'ti-building-store',label:'Nhà CC NVL'},
  {key:'nccgoods',icon:'ti-building-store',label:'Nhà CC Hàng hóa'},
  {key:'purchaseorders',icon:'ti-shopping-cart',label:'Đơn mua hàng NVL'},
  {key:'purchasegoods',icon:'ti-packages',label:'Đơn mua hàng hàng hóa'},
  {key:'fuelpurchases',icon:'ti-gas-station',label:'Đơn mua xăng dầu'},
  {sec:'Báo cáo'},
  {key:'cashflowreport',icon:'ti-cash-banknote',label:'Báo cáo dòng tiền'},
  {key:'salesreport',icon:'ti-chart-line',label:'Báo cáo BH'},
  {key:'fuelreport',icon:'ti-gas-station',label:'Báo cáo xăng dầu'},
  {key:'purchasereport',icon:'ti-chart-bar',label:'Báo cáo MH'},
  {key:'maintreport',icon:'ti-tool',label:'Báo cáo sửa chữa'},
  {key:'materialusage',icon:'ti-chart-histogram',label:'Báo cáo NVL tồn và tiêu dùng'},
  {key:'syncreport',icon:'ti-cloud-data-connection',label:'Đồng bộ dữ liệu'},
  {key:'dbusage',icon:'ti-database',label:'Dung lượng Supabase'},
  {sec:'Bảo dưỡng'},
  {key:'maint_vehicle',icon:'ti-car',label:'Bảo dưỡng xe'},
  {key:'maint_machine',icon:'ti-settings',label:'Bảo dưỡng máy'},
  {sec:'Sản xuất'},
  {key:'prodsummary',icon:'ti-clipboard-list',label:'Tổng hợp SX'},
  {key:'prodorders',icon:'ti-building-factory',label:'Đơn sản xuất'},
  {key:'stock',icon:'ti-package',label:'Tồn kho'},
];
function Sidebar({page,setPage,col,setCol,company,role,perms}){
  const [collapsed,setCollapsed]=useState({});
  const toggleSec=sec=>setCollapsed(p=>({...p,[sec]:!p[sec]}));
  return h('nav',{className:'sb'+(col?' col':'')},
    h('div',{className:'sb-head'},
      h('img',{src:LOGO_SRC,className:'sb-logo'}),
      !col&&h('span',{className:'sb-ttl'},company&&company.name||'SCF'),
      h('button',{className:'sb-tog',onClick:()=>setCol(c=>!c)},h('i',{className:'ti '+(col?'ti-layout-sidebar-right':'ti-layout-sidebar'),style:{fontSize:18}}))
    ),
    h('div',{className:'sb-nav'},
      (()=>{
        const els=[]; let curSec=null;
        NAV.forEach((item,i)=>{
          if(item.sec){
            const nextItems=NAV.slice(i+1).filter((x,j)=>{const ni=NAV.slice(i+1);const si=ni.findIndex(y=>y.sec);return si<0||j<si;});
            if(!nextItems.some(x=>canAccess(role,x.key,perms)))return;
            curSec=item.sec;
            const isCol=collapsed[curSec];
            els.push(h('div',{key:'sec'+i,className:'sb-sec',style:{cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between',paddingRight:col?0:12},onClick:()=>!col&&toggleSec(curSec)},
              h('span',null,item.sec),
              !col&&h('i',{className:'ti ti-chevron-'+(isCol?'right':'down'),style:{fontSize:11,opacity:.6}})
            ));
            return;
          }
          if(!canAccess(role,item.key,perms))return;
          if(curSec&&collapsed[curSec]&&!col)return; // hidden when section collapsed
          els.push(h('button',{key:item.key,className:'sb-btn'+(page===item.key?' on':''),onClick:()=>setPage(item.key),title:col?item.label:undefined},
            h('i',{className:'ti '+item.icon,style:{fontSize:17}}),
            h('span',null,item.label,null)
          ));
        });
        return els;
      })()
    )
  );
}
function TopNav({page,setPage,role,perms,dept}){
  const[open,setOpen]=useState(null);
  const groups=[]; let cur=null;
  NAV.forEach(item=>{
    if(item.sec){cur={sec:item.sec,pages:[]};groups.push(cur);return;}
    if(!canAccess(role,item.key,perms,dept))return;
    if(cur)cur.pages.push(item);
    else groups.push({sec:item.label,pages:[item],single:true,icon:item.icon});
  });
  const visible=groups.filter(g=>g.pages.length);
  const activeGroup=visible.find(g=>g.pages.some(p=>p.key===page));
  const go=k=>{setPage(k);setOpen(null);};
  return h('div',{className:'topnav'},
    visible.map(g=>g.single
      ?h('div',{key:g.sec,className:'topnav-item'},
        h('button',{className:'topnav-btn'+(page===g.pages[0].key?' on':''),onClick:()=>go(g.pages[0].key)},
          h('i',{className:'ti '+(g.icon||g.pages[0].icon),style:{fontSize:16}}),g.sec
        )
      )
      :h('div',{key:g.sec,className:'topnav-item'+(open===g.sec?' open':'')},
        h('button',{className:'topnav-btn'+(activeGroup?.sec===g.sec?' on':''),onClick:()=>setOpen(o=>o===g.sec?null:g.sec)},
          g.sec,h('i',{className:'ti ti-chevron-down',style:{fontSize:12}})
        ),
        h('div',{className:'topnav-menu'},
          g.pages.map(p=>h('button',{key:p.key,className:'topnav-link'+(page===p.key?' on':''),onClick:()=>go(p.key)},
            h('i',{className:'ti '+p.icon}),p.label
          ))
        )
      )
    )
  );
}

function MobileNav({page,setPage,role,perms,dept,onLogout}){
  const[open,setOpen]=useState(false);
  const groups=[]; let cur=null;
  NAV.forEach(item=>{
    if(item.sec){cur={sec:item.sec,pages:[]};groups.push(cur);return;}
    if(!canAccess(role,item.key,perms,dept))return;
    if(cur)cur.pages.push(item);
    else groups.push({sec:item.label,pages:[item],single:true});
  });
  const visible=groups.filter(g=>g.pages.length);
  const preferred=['welcome','delivery','trips','attendance'];
  const quick=preferred.map(key=>NAV.find(item=>item.key===key))
    .filter(item=>item&&canAccess(role,item.key,perms,dept));
  const currentIsQuick=quick.some(item=>item.key===page);
  const go=key=>{setPage(key);setOpen(false);};
  const items=[...quick,{key:'more',icon:'ti-grid-dots',label:'Thêm'}];

  return h(React.Fragment,null,
    open&&h('div',{className:'mobile-nav-backdrop',onClick:()=>setOpen(false),role:'presentation'}),
    open&&h('section',{className:'mobile-nav-sheet','aria-label':'Danh sách chức năng'},
      h('div',{className:'mobile-nav-sheet-head'},
        h('div',null,h('b',null,'Tất cả chức năng'),h('span',null,'Chọn mục bạn muốn mở')),
        h('button',{className:'mobile-nav-close',onClick:()=>setOpen(false),'aria-label':'Đóng menu',title:'Đóng menu'},
          h('i',{className:'ti ti-x'})
        )
      ),
      h('div',{className:'mobile-nav-sheet-body'},
        visible.map(group=>h('div',{className:'mobile-nav-section',key:group.sec},
          !group.single&&h('div',{className:'mobile-nav-section-title'},group.sec),
          h('div',{className:'mobile-nav-grid'},
            group.pages.map(item=>h('button',{key:item.key,className:'mobile-nav-link'+(page===item.key?' on':''),onClick:()=>go(item.key)},
              h('i',{className:'ti '+item.icon}),
              h('span',null,item.label)
            ))
          )
        )),
        h('div',{className:'mobile-nav-section'},
          h('div',{className:'mobile-nav-section-title'},'Tài khoản'),
          h('div',{className:'mobile-nav-grid'},
            h('button',{className:'mobile-nav-link mobile-nav-logout',onClick:()=>onLogout&&onLogout()},
              h('i',{className:'ti ti-logout'}),
              h('span',null,'Đăng xuất')
            )
          )
        )
      )
    ),
    h('nav',{className:'mobile-nav','aria-label':'Điều hướng nhanh',style:{gridTemplateColumns:'repeat('+items.length+',1fr)'}},
      items.map(item=>item.key==='more'
        ?h('button',{key:item.key,className:'mobile-nav-btn'+(open||!currentIsQuick?' on':''),onClick:()=>setOpen(v=>!v),'aria-label':'Mở tất cả chức năng',title:'Thêm'},
          h('i',{className:'ti '+(open?'ti-x':item.icon)})
        )
        :h('button',{key:item.key,className:'mobile-nav-btn'+(page===item.key?' on':''),onClick:()=>go(item.key),'aria-label':item.label,title:item.label},
          h('i',{className:'ti '+item.icon})
        )
      )
    )
  );
}
