/* Định mức: mọi lượng đầu vào tính cho đúng 1 kg sản phẩm đầu ra. */
function scfValidateProductionRecipes(recipes){
  if(!Array.isArray(recipes)||recipes.length>2000)return 'Danh sách định mức không hợp lệ.';
  const byId=new Map(),products=new Set(),names=new Set();
  for(const recipe of recipes){
    if(!recipe||typeof recipe.id!=='string'||!recipe.id.trim()||byId.has(recipe.id))return 'Mã định mức bị trùng hoặc trống.';
    byId.set(String(recipe.id),recipe);
    if(!['finished','intermediate'].includes(recipe.type)||!String(recipe.productName||'').trim())return 'Chọn sản phẩm hoặc nhập tên sản phẩm trung gian.';
    if(recipe.baseQty!==1||recipe.baseUnit!=='kg')return 'Định mức phải tính cho 1 kg sản phẩm.';
    if(recipe.type==='finished'){
      const ids=recipe.productIds===undefined?[recipe.productId]:recipe.productIds;
      if(!Array.isArray(ids)||!ids.length||ids.length>2000||ids.some(id=>typeof id!=='string'||!id.trim())||ids[0]!==recipe.productId)return 'Chọn ít nhất một thành phẩm hợp lệ cho công thức.';
      for(const id of ids){
        if(products.has(id))return 'Mỗi thành phẩm chỉ có một định mức. Hãy mở bản đã có để sửa.';
        products.add(id);
      }
    }else{
      const name=String(recipe.productName).trim().toLocaleLowerCase('vi');
      if(names.has(name))return 'Tên sản phẩm trung gian bị trùng.';names.add(name);
    }
    if(!Array.isArray(recipe.ingredients)||!recipe.ingredients.length||recipe.ingredients.length>100)return 'Mỗi sản phẩm cần từ 1 đến 100 dòng nguyên liệu.';
    const seen=new Set();
    for(const line of recipe.ingredients){
      if(!line||!['material','intermediate'].includes(line.kind)||!String(line.name||'').trim()||!String(line.unit||'').trim())return 'Điền tên, loại và đơn vị cho từng nguyên liệu.';
      if(typeof line.quantity!=='number'||!Number.isFinite(line.quantity)||line.quantity<=0)return 'Lượng nguyên liệu phải là số lớn hơn 0.';
      const key=line.kind+'|'+(line.refId||String(line.name).trim().toLocaleLowerCase('vi'));
      if(seen.has(key))return 'Nguyên liệu bị lặp trong cùng định mức. Hãy cộng lượng vào một dòng.';seen.add(key);
      if(line.kind==='intermediate'&&(!line.refId||line.unit!=='kg'))return 'Chọn sản phẩm trung gian, lượng dùng tính bằng kg.';
    }
  }
  const visited=new Set(),visiting=new Set();
  function visit(id){
    if(visiting.has(id))return 'Định mức bị vòng lặp giữa các sản phẩm trung gian.';
    if(visited.has(id))return '';
    visiting.add(id);
    for(const line of byId.get(id).ingredients){
      if(line.kind!=='intermediate')continue;
      const child=byId.get(String(line.refId));
      if(!child||child.type!=='intermediate')return 'Sản phẩm trung gian đang dùng không còn tồn tại. Hãy sửa các dòng tham chiếu trước.';
      const error=visit(String(child.id));if(error)return error;
    }
    visiting.delete(id);visited.add(id);return '';
  }
  for(const id of byId.keys()){const error=visit(id);if(error)return error;}
  return '';
}
function ProductionRecipesTab({recipes=[],setRecipes,products=[],prodCats=[],materials=[],currentUser}){
  const[editing,setEditing]=useState(null),[error,setError]=useState(''),[query,setQuery]=useState('');
  const[productQuery,setProductQuery]=useState('');
  const recipeIds=recipe=>recipe.type==='finished'?(recipe.productIds||[recipe.productId]).map(String):[];
  const recipeName=recipe=>recipe.type==='finished'?recipeIds(recipe).map(id=>products.find(product=>String(product.id)===id)?.name||recipe.productName).join(' · '):recipe.productName;
  const finishedProducts=products.filter(product=>!isGoodsProduct(product,prodCats));
  const canEdit=canWrite(currentUser?.role,'prodbom',currentUser?.permLevels),canDelete=canDel(currentUser?.role,'prodbom',currentUser?.permLevels);
  const line=()=>({id:'BML'+uid(),kind:'material',refId:'',name:'',unit:'kg',quantity:''});
  const start=(recipe,product)=>{setError('');setProductQuery('');setEditing(recipe?{...recipe,productIds:recipeIds(recipe),ingredients:recipe.ingredients.map(item=>({...item}))}:{id:'BOM'+uid(),type:'finished',productId:product?String(product.id):'',productIds:product?[String(product.id)]:[],productName:product?.name||'',baseQty:1,baseUnit:'kg',ingredients:[line()],note:''});};
  const change=(key,value)=>setEditing(previous=>({...previous,[key]:value}));
  const updateLine=(id,changes)=>setEditing(previous=>({...previous,ingredients:previous.ingredients.map(item=>item.id===id?{...item,...changes}:item)}));
  const save=()=>{
    if(!canEdit||!editing)return;
    const parsed={...editing,productName:String(editing.productName||'').trim(),baseQty:1,baseUnit:'kg',ingredients:editing.ingredients.map(item=>({...item,name:String(item.name||'').trim(),unit:String(item.unit||'').trim(),quantity:Number(String(item.quantity).trim().replace(',','.'))})),updatedAt:new Date().toISOString(),updatedBy:currentUser?.name||'',updatedById:currentUser?.id||''};
    if(parsed.type==='finished'){
      parsed.productIds=recipeIds(parsed);parsed.productId=parsed.productIds[0]||'';
      if(!parsed.productIds.length||parsed.productIds.some(id=>!products.some(product=>String(product.id)===id))){setError('Chọn ít nhất một thành phẩm còn trong danh mục.');return;}
      parsed.productName=recipeName(parsed);
    }else{delete parsed.productIds;parsed.productId='';}
    const next=recipes.some(item=>item.id===parsed.id)?recipes.map(item=>item.id===parsed.id?parsed:item):[...recipes,parsed];
    if(parsed.type==='finished'&&!products.some(product=>String(product.id)===String(parsed.productId))){setError('Sản phẩm đã chọn không còn trong danh mục.');return;}
    const invalid=scfValidateProductionRecipes(next);if(invalid){setError(invalid);return;}
    setRecipes(previous=>previous.some(item=>item.id===parsed.id)?previous.map(item=>item.id===parsed.id?parsed:item):[...previous,parsed]);
    setEditing(null);window.showToast('Đã cập nhật trên máy. Theo dõi trạng thái đồng bộ để xác nhận đã lưu.','success');
  };
  const remove=recipe=>{
    if(!canDelete)return;
    const used=recipes.find(item=>item.id!==recipe.id&&item.ingredients.some(ingredient=>ingredient.kind==='intermediate'&&ingredient.refId===recipe.id));
    if(used){window.showToast('Đang được dùng trong định mức '+used.productName+'. Hãy sửa tham chiếu trước.','warn');return;}
    window.scfConfirm('Xóa định mức của '+recipe.productName+'?','Xóa định mức',true).then(ok=>{if(ok)setRecipes(previous=>previous.filter(item=>item.id!==recipe.id));});
  };
  const intermediate=recipes.filter(recipe=>recipe.type==='intermediate'&&recipe.id!==editing?.id);
  const matches=value=>!query||normalizeLookupText(value).includes(normalizeLookupText(query.trim()));
  const list=recipes.filter(recipe=>matches(recipeName(recipe)+' '+recipeIds(recipe).map(id=>products.find(product=>String(product.id)===id)?.code||'').join(' ')));
  const assigned=new Set(recipes.flatMap(recipeIds));
  const pending=finishedProducts.filter(product=>!assigned.has(String(product.id))&&matches((product.name||'')+' '+(product.code||'')));
  const chosen=new Set(editing?.productIds||[]);
  const usedElsewhere=new Set(recipes.filter(recipe=>recipe.id!==editing?.id).flatMap(recipeIds));
  const choices=products.filter(product=>(!isGoodsProduct(product,prodCats)||chosen.has(String(product.id)))&&(!productQuery||normalizeLookupText((product.name||'')+' '+(product.code||'')).includes(normalizeLookupText(productQuery.trim()))));
  return h('div',{className:'production-recipes-page'},
    h('div',{className:'production-recipes-head'},h('h2',null,'Cài đặt định mức sản xuất'),canEdit&&h('button',{type:'button',className:'bp','data-scf-action':'write',onClick:()=>start(null)},h('i',{className:'ti ti-plus'}),' Thêm định mức')),
    h('p',{className:'production-recipes-help'},'Khai báo danh sách nguyên liệu cần cho 1 kg thành phẩm hoặc sản phẩm trung gian. Mỗi nguyên liệu giữ đơn vị riêng, ví dụ kg gạo, kg bột, lít dầu.'),
    h('input',{type:'search','aria-label':'Tìm định mức',placeholder:'Tìm tên sản phẩm…',value:query,onChange:event=>setQuery(event.target.value)}),
    !list.length&&!pending.length&&h('div',{className:'card',style:{marginTop:12}},'Không tìm thấy thành phẩm hoặc định mức phù hợp.'),
    pending.map(product=>h('div',{key:product.id,className:'card production-recipe-pending'},h('div',null,h('b',null,product.name),h('small',null,[product.code,'Chưa có định mức'].filter(Boolean).join(' · '))),canEdit&&h('button',{type:'button',className:'bp','data-scf-action':'write',onClick:()=>start(null,product)},'Tạo định mức'))),
    list.map(recipe=>h('details',{key:recipe.id,className:'card production-recipe-card'},
      h('summary',null,h('b',null,recipeName(recipe)),h('span',null,recipe.type==='intermediate'?'Sản phẩm trung gian · 1 kg':recipeIds(recipe).length+' thành phẩm · 1 kg mỗi SP')),
      h('div',{className:'production-recipe-content'},recipe.ingredients.map((item,index)=>h('div',{key:item.id||index,className:'production-recipe-preview-line'},h('span',null,item.kind==='intermediate'?(recipes.find(child=>child.id===item.refId)?.productName||item.name):item.name,item.kind==='intermediate'?' · Trung gian':''),h('b',null,Number(item.quantity).toLocaleString('vi-VN',{maximumFractionDigits:6})+' '+item.unit))),recipe.note&&h('p',null,recipe.note),
        h('small',null,recipe.updatedBy?'Cập nhật: '+recipe.updatedBy:''),
        h('div',{className:'form-actions'},canEdit&&h('button',{type:'button','data-scf-action':'write',onClick:()=>start(recipe)},'Sửa định mức'),canDelete&&h('button',{type:'button',className:'bdel','data-scf-action':'delete',onClick:()=>remove(recipe)},'Xóa định mức'))
      )
    )),
    editing&&h(Modal,{title:'Định mức cho 1 kg sản phẩm',lg:true,onClose:()=>setEditing(null)},
      h('div',{className:'g2'},h(F,{label:'Loại sản phẩm đầu ra'},h('select',{value:editing.type,onChange:event=>setEditing(previous=>({...previous,type:event.target.value,productId:'',productIds:[],productName:''}))},h('option',{value:'finished'},'Thành phẩm'),h('option',{value:'intermediate'},'Sản phẩm trung gian'))),
        editing.type==='intermediate'&&h(F,{label:'Tên sản phẩm trung gian'},h('input',{value:editing.productName,placeholder:'Ví dụ: Bột bún đã pha',onChange:event=>change('productName',event.target.value)}))
      ),
      editing.type==='finished'&&h('div',{className:'production-recipe-products'},h('b',null,'Thành phẩm dùng chung công thức ('+chosen.size+' đã chọn)'),h('input',{type:'search','aria-label':'Tìm thành phẩm để chọn',placeholder:'Gõ tên hoặc mã thành phẩm…',value:productQuery,onChange:event=>setProductQuery(event.target.value)}),h('div',{className:'production-recipe-product-options'},choices.map(product=>{
        const id=String(product.id),unavailable=usedElsewhere.has(id);
        return h('label',{key:id,className:'production-recipe-product-choice'},h('input',{type:'checkbox',checked:chosen.has(id),disabled:unavailable,'aria-label':'Chọn '+product.name,onChange:event=>{const ids=event.target.checked?[...chosen,id]:[...chosen].filter(value=>value!==id);change('productIds',ids);}}),h('span',null,product.name,unavailable&&h('small',null,'Đã thuộc công thức khác')));
      })),!choices.length&&h('small',null,'Không tìm thấy thành phẩm phù hợp.'),h('small',null,'Một công thức dùng chung cho tất cả sản phẩm đã tích chọn. Sửa công thức sẽ áp dụng cho toàn bộ nhóm.')),
      h('p',{className:'production-recipes-help'},'Lượng bên dưới tính cho 1 kg của mỗi sản phẩm đã chọn, không phải tổng 1 kg của cả nhóm.'),
      editing.ingredients.map((item,index)=>h('div',{key:item.id,className:'production-recipe-input-line'},
        h('div',{className:'production-recipe-line-title'},h('b',null,'Nguyên liệu '+(index+1)),h('button',{type:'button',className:'bdel','aria-label':'Xóa dòng nguyên liệu '+(index+1),onClick:()=>change('ingredients',editing.ingredients.filter(row=>row.id!==item.id))},h('i',{className:'ti ti-trash'}))),
        h('div',{className:'production-recipe-input-grid'},
          h(F,{label:'Loại đầu vào'},h('select',{value:item.kind,onChange:event=>updateLine(item.id,{kind:event.target.value,refId:'',name:'',unit:'kg'})},h('option',{value:'material'},'Nguyên vật liệu'),h('option',{value:'intermediate'},'Sản phẩm trung gian'))),
          h(F,{label:'Tên nguyên liệu / trung gian'},h('select',{value:item.refId,onChange:event=>{const options=item.kind==='intermediate'?intermediate:materials;const selected=options.find(option=>String(option.id)===event.target.value);updateLine(item.id,{refId:event.target.value,name:selected?.productName||selected?.name||'',unit:item.kind==='intermediate'?'kg':selected?.unit||'kg'});}},h('option',{value:''},item.kind==='intermediate'?'— Chọn trung gian —':'— Chọn NVL hoặc nhập tên bên dưới —'),(item.kind==='intermediate'?intermediate:materials).map(option=>h('option',{key:option.id,value:option.id},option.productName||option.name)))),
          h(F,{label:'Lượng cho 1 kg SP'},h('input',{type:'text',inputMode:'decimal',value:item.quantity,placeholder:'Chưa nhập',onChange:event=>updateLine(item.id,{quantity:event.target.value})})),
          h(F,{label:'Đơn vị nguyên liệu'},h('input',{value:item.unit,readOnly:item.kind==='intermediate',placeholder:'kg, lít…',onChange:event=>updateLine(item.id,{unit:event.target.value})}))
        ),
        item.kind==='material'&&!item.refId&&h(F,{label:'Tên nguyên liệu khác'},h('input',{value:item.name,placeholder:'Ví dụ: Gạo sóc, dầu ăn…',onChange:event=>updateLine(item.id,{name:event.target.value})}))
      )),
      h('button',{type:'button',onClick:()=>change('ingredients',[...editing.ingredients,line()])},h('i',{className:'ti ti-plus'}),' Thêm dòng nguyên liệu / trung gian'),
      h(F,{label:'Ghi chú'},h('textarea',{value:editing.note||'',onChange:event=>change('note',event.target.value)})),
      error&&h('p',{role:'alert',className:'production-mobile-error'},error),
      h('div',{className:'form-actions'},h('button',{type:'button',onClick:()=>setEditing(null)},'Đóng'),h('button',{type:'button',className:'bp','data-scf-action':'write',onClick:save},'Lưu định mức'))
    )
  );
}
