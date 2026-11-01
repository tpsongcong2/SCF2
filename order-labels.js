/* Shared artwork used by desktop delivery orders and driver phone labels. */
function scfOrderLabelItems(order,products=[],prodShifts=[],prodShiftRules=[]){
 const plans=prodShiftPlansForOrder(order,prodShifts,prodShiftRules),labels=[];
 (order.lines||[]).forEach((line,index)=>{
  const product=products.find(p=>String(p.id)===String(line.productId)),name=line.productName||product?.name||'',rule=resolveProductLabelPackRule(product,name);
  if(!rule.enabled)return;
  const qty=numFmt(line.qtyProd??line.qty??line.quantity??line.qtyInvoice??0),unit=String(line.unit||product?.unit||'').toLowerCase();
  if(!(qty>0))return;
  const isPac=/pac/i.test(unit)||/kg\s*\/\s*pac/i.test(name),match=String(name).match(/(\d+(?:[.,]\d+)?)\s*kg\s*\/\s*pac/i);
  const weight=numFmt(product?.weightPerUnit||line.weightPerUnit||match?.[1]||0);
  const plan=plans.find(p=>p.line===line||p.index===index)||prodShiftPlan({...order,lines:[line]},prodShifts,prodShiftRules);
  let weights;
  if(isPac){if(!Number.isSafeInteger(qty)||!(weight>0))throw Error('Kiểm tra quy cách PAC của '+name+'.');if(qty>1000)throw Error('Tối đa 1.000 tem mỗi lần.');weights=Array.from({length:qty},()=>weight);}
  else{const kg=/^(kg|kgs|kilogram|kilograms)$/.test(unit)?qty:qty*weight;if(!(kg>0))return;weights=scfLabelPackWeights(kg,rule.pack,rule.mergeSmallRemainder);}
  weights.forEach(kg=>labels.push({line:{...line,productName:name},kg,plan,order,isPac}));
  if(labels.length>1000)throw Error('Tối đa 1.000 tem mỗi lần.');
 });return labels;
}
function scfCleanPacProductName(name){return String(name||'').replace(/\s+/g,' ').replace(/\s*,?\s*\d+(?:[.,]\d+)?\s*KG\s*\/\s*PAC\b/ig,'').replace(/\s*,\s*PAC\b/ig,'').trim().toUpperCase();}
function scfBuildClassicOrderLabelSvg(it,o){
 const esc=scfEscapePrintHtml;
    const l=it.line;
    const product=l.productName||'';
    const nsx=it.plan?.labelDate||o.deliveryDate||'';
    const gioSx=(it.plan?.labelTime||'').replace(':','H').replace(/H00$/,'H');
    const kgNum=Number(it.kg).toLocaleString('vi-VN',{maximumFractionDigits:2});
    const pName=product.toUpperCase();
    const directUse=pName.includes('BÚN LÁ')||pName.includes('BUN LA')||pName.includes('BÁNH CUỐN')||pName.includes('BANH CUON')||pName.includes('BÁNH PHỞ CUỐN')||pName.includes('BANH PHO CUON');
    const hdsd=directUse?'Ăn trực tiếp':'Trần qua nước sôi trước khi ăn.';
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="580" height="400" viewBox="0 0 580 400">'+
        '<rect width="580" height="400" fill="white"/>'+
        '<rect x="10" y="10" width="560" height="380" fill="white" stroke="#111" stroke-width="2"/>'+
        '<text x="160" y="68" font-family="Arial,sans-serif" font-size="54" font-weight="700" text-anchor="middle" lengthAdjust="spacingAndGlyphs" textLength="270">'+esc(product)+'</text>'+
        '<text x="425" y="68" font-family="Arial,sans-serif" font-size="52" font-weight="700" text-anchor="middle">'+kgNum+'</text>'+
        '<text x="520" y="68" font-family="Arial,sans-serif" font-size="38" font-weight="700" text-anchor="middle">KG</text>'+
        '<text x="22" y="112" font-family="Arial,sans-serif"><tspan font-size="22">SP CỦA: C.TY TNHH </tspan><tspan font-size="23" font-weight="700">THỰC PHẨM SÔNG CÔNG</tspan></text>'+
        '<text x="22" y="154" font-family="Arial,sans-serif" font-size="23">ĐC: Tổ 1, Phường Bá Xuyên, Tỉnh Thái Nguyên</text>'+
        '<text x="22" y="196" font-family="Arial,sans-serif" font-size="23" font-weight="700">SĐT : 0969709878</text>'+
        '<text x="258" y="196" font-family="Arial,sans-serif" font-size="23">THÀNH PHẦN: Bột gạo, nước</text>'+
        '<text x="22" y="238" font-family="Arial,sans-serif" font-size="23">HDSD: '+esc(hdsd)+'</text>'+
        '<text x="512" y="238" font-family="Arial,sans-serif" font-size="25" text-anchor="end"><tspan font-weight="700">PH</tspan> 5-8</text>'+
        '<text x="22" y="280" font-family="Arial,sans-serif" font-size="23">K.cáo: Không dùng khi biến màu hoặc có mùi lạ</text>'+
        '<text x="22" y="322" font-family="Arial,sans-serif" font-size="26" font-weight="700">NSX:</text>'+
        '<text x="132" y="322" font-family="Arial,sans-serif" font-size="26" font-weight="700">'+esc(nsx)+'</text>'+
        '<text x="342" y="322" font-family="Arial,sans-serif" font-size="26" font-weight="700">GIỜ SX:</text>'+
        '<text x="512" y="322" font-family="Arial,sans-serif" font-size="26" font-weight="700" text-anchor="end">'+esc(gioSx)+'</text>'+
        '<text x="28" y="364" font-family="Arial,sans-serif" font-size="23">HSD: 24H</text>'+
        '<text x="170" y="364" font-family="Arial,sans-serif" font-size="23">FORMOL: 0</text>'+
        '<text x="302" y="364" font-family="Arial,sans-serif" font-size="23">HÀN THE: 0</text>'+
        '<text x="552" y="364" font-family="Arial,sans-serif" font-size="23" text-anchor="end">BQ: 0-10°C</text>'+
      '</svg>'
    );
  };
function scfBuildPacOrderLabelSvg(it,o,customers=[]){
 const esc=scfEscapePrintHtml,cleanPacProductName=scfCleanPacProductName;
    const l=it.line;
    const matchedPoint=(customers||[])
      .flatMap(c=>(c.points||[]))
      .find(p=>p.id===o.pointId||p.id===o.ptId||p.name===o.pointName);
    const pointName=String(matchedPoint?.name||o.pointName||'KHO VẬN').toUpperCase();
    const product=cleanPacProductName(l.productName||'');
    const kgNum=Number(it.kg||0).toLocaleString('vi-VN',{maximumFractionDigits:2});
    const nsx=it.plan?.labelDate||o.deliveryDate||'';
    const gioSx=String(it.plan?.labelTime||'').replace(':','H').replace(/H00$/,'H')||'';
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">'+
        '<rect width="1000" height="1000" fill="white"/>'+
        '<g transform="translate(28 41) scale(0.95)">'+
        '<rect x="0" y="0" width="1000" height="1006" fill="white" stroke="#111" stroke-width="6"/>'+
        '<text x="430" y="143" font-family="Times New Roman,serif" font-size="70" font-weight="700" text-anchor="middle">'+esc(product)+'</text>'+
        '<text x="804" y="143" font-family="Times New Roman,serif" font-size="70" font-weight="700" text-anchor="middle">'+esc(kgNum)+'</text>'+
        '<text x="922" y="143" font-family="Times New Roman,serif" font-size="52" font-weight="700" text-anchor="middle">KG</text>'+
        '<text x="72" y="245" font-family="Times New Roman,serif" font-size="32" font-weight="700">SP CỦA: CÔNG TY TNHH THỰC PHẨM SÔNG CÔNG</text>'+
        '<text x="72" y="329" font-family="Times New Roman,serif" font-size="32" font-weight="700">ĐC: Tổ 1, Phường Bá Xuyên, Tỉnh Thái Nguyên</text>'+
        '<text x="72" y="413" font-family="Times New Roman,serif" font-size="32" font-weight="700">SĐT : 0969709878</text>'+
        '<text x="510" y="413" font-family="Times New Roman,serif" font-size="32" font-weight="700">TP: Bột gạo, nước</text>'+
        '<text x="72" y="497" font-family="Times New Roman,serif" font-size="31" font-weight="700">BQ : 15°C-20°C. Đóng gói hở. HSD 12h trần nước sôi trước khi dùng.</text>'+
        '<text x="72" y="581" font-family="Times New Roman,serif" font-size="31" font-weight="700">BQ : 10°C-15°C. Đóng gói hở. HSD 24h trần nước sôi trước khi dùng.</text>'+
        '<text x="72" y="665" font-family="Times New Roman,serif" font-size="31" font-weight="700">BQ : 5°C-10°C. Đóng gói hở. HSD 36h trần nước sôi trước khi dùng.</text>'+
        '<text x="72" y="749" font-family="Times New Roman,serif" font-size="31" font-weight="700">BQ : 0°C-5°C. Đóng gói kín. HSD 72h trần nước sôi trước khi dùng.</text>'+
        '<text x="72" y="833" font-family="Times New Roman,serif" font-size="31" font-weight="700">K.cáo: Không dùng khi biến màu hoặc có mùi lạ</text>'+
        '<text x="105" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700">Formol:</text>'+
        '<text x="292" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700" text-anchor="middle">0</text>'+
        '<text x="448" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700">PH:</text>'+
        '<text x="560" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700" text-anchor="middle">5-8</text>'+
        '<text x="634" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700">Hàn the:</text>'+
        '<text x="846" y="918" font-family="Times New Roman,serif" font-size="31" font-weight="700" text-anchor="middle">0</text>'+
        '<text x="140" y="997" font-family="Times New Roman,serif" font-size="36" font-weight="700" text-anchor="middle">NSX:</text>'+
        '<text x="335" y="997" font-family="Times New Roman,serif" font-size="36" font-weight="700" text-anchor="middle">'+esc(nsx)+'</text>'+
        '<text x="620" y="997" font-family="Times New Roman,serif" font-size="36" font-weight="700" text-anchor="middle">GIỜ SX:</text>'+
        '<text x="860" y="997" font-family="Times New Roman,serif" font-size="36" font-weight="700" text-anchor="middle">'+esc(gioSx)+'</text>'+
        '</g>'+
      '</svg>'
    );
  };
