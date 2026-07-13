// Bat loi JS - hien thi thay vi trang trang

window.onerror = function(msg, src, line) {
  document.getElementById('app').innerHTML = '<div style="padding:2rem;color:#A32D2D;background:#fff;min-height:100vh;font-family:sans-serif"><h2>Loi khoi dong SCF App</h2><p>' + msg + '</p><p style="margin-top:.5rem;color:#666;font-size:13px">Dong: ' + line + '</p></div>';
  return false;
};

// ── TOAST & DIALOG SYSTEM ──
(function(){
  let container=null;
  function getContainer(){
    if(!container){container=document.createElement('div');container.id='scf-toast-container';document.body.appendChild(container);}
    return container;
  }
  window.showToast=function(msg,type='success',duration=3500){
    const icons={success:'ti-circle-check',error:'ti-alert-circle',warn:'ti-alert-triangle',info:'ti-info-circle'};
    const el=document.createElement('div');
    el.className='scf-toast '+type;
    el.innerHTML='<i class="ti '+icons[type]+'"></i><span class="scf-toast-msg">'+msg+'</span><button class="scf-toast-close" onclick="this.parentElement.remove()">×</button>';
    getContainer().appendChild(el);
    const tid=setTimeout(()=>{el.style.animation='toastOut .2s ease forwards';setTimeout(()=>el.remove(),200);},duration);
    el.querySelector('.scf-toast-close').addEventListener('click',()=>clearTimeout(tid));
  };
  // Override native alert & confirm with styled versions
  const _origAlert=window.alert;
  const _origConfirm=window.confirm;
  window.scfAlert=function(msg,type){window.showToast(msg,type||'info',4000);};
  window.scfConfirm=function(msg,title,isDanger){
    return new Promise(resolve=>{
      const ov=document.createElement('div');ov.className='scf-dialog-overlay';
      const dtype=isDanger?'danger':'warn';
      const dicon=isDanger?'ti-alert-triangle':'ti-help-circle';
      const dcolor=isDanger?'#A32D2D':'#854F0B';
      ov.innerHTML='<div class="scf-dialog"><div class="scf-dialog-icon '+dtype+'"><i class="ti '+dicon+'" style="font-size:20px;color:'+dcolor+'"></i></div><h3>'+(title||'Xác nhận')+'</h3><p>'+msg+'</p><div class="scf-dialog-btns"><button id="scf-d-cancel" style="padding:8px 16px">Hủy</button><button id="scf-d-ok" class="bp" style="padding:8px 18px;background:'+(isDanger?'#A32D2D':'var(--pri)')+'!important">'+(isDanger?'Xóa':'Đồng ý')+'</button></div></div>';
      document.body.appendChild(ov);
      ov.querySelector('#scf-d-cancel').onclick=()=>{ov.remove();resolve(false);};
      ov.querySelector('#scf-d-ok').onclick=()=>{ov.remove();resolve(true);};
      ov.addEventListener('click',e=>{if(e.target===ov){ov.remove();resolve(false);}});
    });
  };
})();

const {useState,useEffect,useRef}=React;
const h=React.createElement;
const LOGO_SRC='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAH4AAAB5CAIAAABwRAJnAAAAAXNSR0IArs4c6QAAAAlwSFlzAAAOwwAADsQBiC4+owAAV6VJREFUeF7tvWewZdl1HnZyPjffl1/n7umePBjMACACAQaQKjAAFIvJssqmLLssk7TLtF1Fl4xQLlW5ymVLtuXSD9pUFSm7ZFoUKQEgCYIUSYAIM+AMJvd07pffu/nek7O/tfd9r8ME9AADYljmxUVPv9c3nLP22it861tri1VVCX/z+F5IQPpefOnffCdJ4G9E/z3Tg78R/d+I/nsmge/ZF4tlWX7Pvvz/31/8bRgcURDwPHocBUj893jiN1jOuwKnvyZxVFWJlcCfdz3YL+lf367HWxc9vpu+nku5FERIGU+RfsmepYjn4eWLlUjPsqrwrPCv4h3L9nbdxXf0OeLhA5/CQm12a+yX+JPfCW5CwPO1GvUdfPNbF/0dX8Yu6M4HiVqQSMi4YqYoZYlvwZOtEy3VO/tRFUJVQkuwCiXTpFsP8TsU1x03/nZ91q19yFRFwhOrQhuUHqTyfy1yN7KVuFqhKKsC4ud6RRrP/qQH1OltenyHoj+y73fYfzKI0BpcOz1Jfw438tt01d/NjymqIq8Qe+RYAGZL59I/WoO368vfuuhfY2DmRp/ZE5h16PlcXcqiKrF5Sem5wrxdF/1d/RxSFbI0zLTD+AgFv+657r993/1tBJd3SBByhUwl2PajwAaXStdO4kbkynyrJEqKJIl4HbuJty9KePsEcfRJRZXjpsiJiVWe55Ikq4omCDKPbsjevE3X/9a1/ugamQAhTlwis+YwjkVZJkIVV0JaJDNRSGWZjCd5W4n+/44XO92RLCkUupW5UGSygGdalTGetKHZFn67lvs70HoehvGrhHylgiIxISvjADovSYrnB4pum1atwE+SykXP7M47WutxdUWRVWVSFXGeBqqqSIoiSKqsWlVFkZsoqG+L9L8NrZ8H9sx0MHfK/mCevyzypKqisgj6/e0knmkKrrRAuMOj5L8uD1mSZUHI49CbjCJ/WuWxWKVCGYpihnt5Tbb4bd7WtyH6O74JApXJilNileZR4E/K3J9ND7BD682aosIYwVyy1OTtuuRv807v9W08j5JkxTSNRt1JwnE4GxTJNAxGeebN88e53t3rZ77u696qwYED4uYCa0aWA9F7lnqynArFLAoHeTispjuy4jqL50qjW0qOrBhk6wWoi0pxMt5NPvkd+hBhyotMkNUURr2M9GqUjC/7B9dqbr3U26W5orvrkuzSbTAPR4EPbo/nuoJMf1Iyc093921oPWJGHvlS0FtWuSyVshj5/Sv+wSvhwYv+7vOuFkhikWdVLmiFqDD7yK6S5bjv7EcpSDl8UyYpqahESWDosS31+te/EvZenfVuZNG0yKKyTAUEQkJ2iFYxZXqLGvVWRc+DKwiegnVmvmFPsioaeYMNo5iIcU+RIticYNIrslSRZMpsSR0ISJgrxztZ9rRDZegWM6RVmoT+sF/lSR5P1Gpa+Bvj/YtCMRWFBPE+279QLJWeItwaflHcO8D2VkUPCyPLogL7DolCmpKUl/Fwsn85HF6rqb5dDvN0OBxuBt5ARZgmKBJeQnJn6n7Pm/F7tzowjWQQcbkqpC+WoT8d93ccPXe0sKFPZwcv5smBWHowtMzCyIjmkEwypIHwqntX/rcseoSRciWqLDsqqyQOR6G3P9x9tfS2qtGVcrYVhoMkDdyarRkGZbgc/mAJViUW73D4jIUviBoowlFE0TR0BJdZEY9HO0HvSjZ4JRtfGe69Gnu7ZTqTqkIiZ8cML+G1h+HevSnOWxf9fGkLoYylChHNVjzdDkYbWjHNJrtyGZi25bTapluj7IQepO2HKAJBgfd2Yd+zV3HUg/ZpVSmq4dTajdaCrEhV7ufejhDteoOr4XiziAYCYn8ubVIroTj64d6u/a2LniPBVSpWfhX3g+GNPNwT86lrSbouK5qm2i2ztiQojiAplIxzBzSPi47W4N6u7q/8VRSczJWXy99QrY6oN0y3jZSw6VqGGJXeTjLemvU3hHSCtIth+1z6QBjewg2+ZdHTlkSoLqRS5YeDa/lsq+lWnaah6WpSikGmKfa6ZKwISrMUDXiiQ9/PlR37+C1/41+l/Odi5PFhhQzcEqwFvXasUNthDkOrtFyrYQiGkgajzSoZYt/LSOMZtgPjI1bKvaOEb10QPIQtwtLvxaObctoz9AyGPYiSUVgK1pLROCfbxyqtXUgGaiRMjzj6yiGpd3Z4eai3VNSpZEG0Bbmt1U+YrdOF2hp7pSIqiw1TV/PUPwi9vTIfCUIgCQXTKWSWvCh0T497fd1tHyYiYsxjb7BzJRhvlUE/3LtZ5HEhq3p9sb5yTrOPSdpSKdURIZPKk6khkIf99Z0td24b54aeq4pZCXald8zmcbOxLupNUVCEYFZNepHXH+xfD2aQ/rSqYryWpP5W7u+NRE+I42G+MLdfDIZHlAI5ZpE/3t28OhvuIuAd9bbzNDGsuqjV/VQvZbeSTYp5D8EDhu9wb8t+Nw/vKUOgDTHfEyyiO1qbWykAx0yOntxp44W4Ev7EVfFcbX7f7K3zYIB93lG2yV/A/7zrA/nbueVgucgcqoGocTuNQnRKCd7MUlQt9mb+8CCa9fe3L/d3r5TJBCEoMiyW8dx7bPn6u4M+RKQSAYPe2afBfWdVVgiJKMyEYjAebBSpV2VRkQaGJtqWKUv6ZJKXhQ1vC9BYEkKlShQE/iQJnT3xSRluidLvefiLz8cHRoKY0ubgwcJRNZoLiYSLPIU/KY07DFbx95xg6tt0ZF6RZJ9F/4q3cFEwRWI2hON92H742AxPvhNvE7xEIDeLE5Ez0esLVZIaslL3/SSKAq1mVDpg5UxIppbgh/3r2XRXFGPEe5AlyeueFf+1Ws+lPS/Bkzax20Wsi2IHgRRVmE73Zv3tTsOq20bNMV3XCaNw5oVOrdNcOK5ILbECymGIpUqSJ11g25FcEKxnISBblHNBwm1DNPhs/J7nupANvEJKQplXdmmHMXtF1SKuqqThgKgrmblEpqEwbUysjPwgSQV+RCqKeBAYB5DTW0Jn4uQSZaIljcoPtw6WFt8FJcjZk/Ap3H2BuEWUzVqruwj0xvYmM7HKTFur1fTFjmOphT/aJ7mXgPWpMnHvjzcyOLfpATcMJDbcLTnY1DsIRjt1U27WDE2WfN+Pk0zTnUZ3RTLqstQUK0eotKqSoZPzUhtzscj92F0FgohyChQTgJpZlXjSi7nusV1RlCJ0lmI1vAZ5JfIbWjmIm4wL35EZ/pQqrC35cubO2R4SYXYztlVkgquxJJC1lApyIsgRW0XSa7qSCrUnVn6iLcG3Iv7EG5haSHh9WkqFpCKHxKpIVm2x3jqRZkoY+cCl2p1au+3kWTDsbVbhBKsN6I1lA/cq/DcWPVdVLozDj6vKNBnuBv2bVTxMpr0i9lQFmR+KCYbpNmWjLsgI53Xa4hAbbopuG3IsSgn3w56k1/g4/JtaIgsvyYgwg80FiLxcLysNIiBZFIqAJwldERFc0K1x6wDNhW2dLwApBNUw8OHQ2VCQYMFIhvN9QnKfCdKU/atM9oT2DRYA5hBPGRIDXYUuptIKfDttTYSK5NWwD3IBC4D0XReshmovGG5bd4wkDYsiAr6TRoM0Gg52rwuZz+hG35HBYbc29/OH8C53uqgR5+lg92owvN4wi9g/iP2RIleqpkmaqdmtAqGYagsKhBtXYkQKKMeCEMGaM7wJd45/wucDHYGRYc6OCZznjmRMYEpgPSg8RsQG/Z1vuLnVYzaFjDZtKUsQTEE0KfrGypHs9KJyK6EmVDazbIdhXgWf36zwrNwS+wz3RObp8DaZVtGas6SD2Vl8OHNOtNtkFhQDHdPyQipUWzQcIFiGqUhCNjy4KWRTTYq3b74STw6EArfJS0b39HiN1nMzyHhMVJNnxXlW6yBbIwK5GGxpld+pqYhtYOqqMg+jOK/kkQ+fqwmaTZKjG5sbYoCAQNzI2ZZCFHglfFul4F0SFoMsj1eJ01KciOKMnkKIr02TUZBckaoDWjDyinjZpBJ9QZoVwjQV6c0Zyr9CEBeDQgwq4IVQYknIRTGtFMDtlZwJ6qRU+oLiQUMn46QoVLLiYlKJ41IclsJMlDNYEuYhp4IwKYphlo7LIoWClbSj5KrA3cEkajkWQNQFxQrSchamcZrHWWyasH6xXEXdhhZND4ajHUHOxYpcA3mHeyjL3S16MrD0YOwZTurgT2DvRVIknliEdUduNgykUboh+4E/HM/GXpLkimK2BMkVKkMSDbhZWHCpMmXBzFMZNhaaebB1o7+1LeRqkYpFRpaaHF2Z4S4Jm8iQJmOdRDiu7Y1ny3JS5ZkEgBqBDCkEOWq8AXwBkAawZll2sLX1bJJtQ5RwHngRIjCKMaQSC5NXMDueII698NL1za8kWU8UE5Ttc9RdixwvKuAR8N8CwopkKT/YudrbvgoDVzCLSGJgYRg8eSVoomQqlqsYVlIIk1nSH6AuFDYcY7HtNGzZUrMsGAtZwEK4O4z9mxC/XqP1pN3s7ogDxMkEfPtA9HEWzVD5K/JQVqtazcFt4nWqYZlOo7N8wmoulYJBND9cOqSAcibMeyXJkLTsx/6VcPLN0L8iVJEqK3CDQmWVhSNWDXrmdam0xVQVwtzvXROzHamcwMlVGertbpE6WWJXuS1WdXKeRa4IaRztTQdX8mhXFgKxSMq4JO9Id54LpSHkC2K5jNgjCp+rhK9WxTfx0WphSkILxkco7SpTwDeQZNgOKQ8O4ulWGe6LWV9WfFnJ4JwZWEWCV8gUqYJk2M2O2+yadlNRrShOEGO0XEMqAqmM8nBcRTPsWEZG4pw7hDxz2t3rku9eK3oW4VUZMd+gXHOgkRwTWYIIuoY4EsXiWZonSZYpqm7XGq3uklNvwgRniAkYOAl/pgACgQEox7K2I0gXp5PPufWvW7WvheEfC+oVWRvA+qsCqv3A9HFvlQAPp/tJ+GoWP73Y3fRmXxPVEWIJSUohbJldKbaFLYsGflPNZsPLLdsLRq9UWR/uBAi1pQhqiqVS1VxWcoDtSubvZbNvrnW2heQZMd1EPC7D72PxBBGXR8i8OBLkvch/SpNfNrSX0vQpWb4pSLuVfCAqAakgtiV8NuDhSlXUWrO10l085tbaqqwVaYrcMgkmVRZkkQdlJdGB9cXd2J2P15r/u2uzMHIQMYQOqQvQTUGH4QQwLQCx8/e3rj3Tu/JvGnKvVXPLJNJ0WUQZU6+b3QetlfeW+oVSbpH1ROkK9jFPZ7OtNN6wjD3b3Rz1v2QYvVLSRP0+wzzvzRaj4ESj8ZCuNKJwsrf1XJrv6LqvZ3um85y7srG/rxf+x4v0wUxKm0trnfbDilKbBhtStmGbvVK4Ph2/YBpIKDK3ft6qPRpN25W4ZDnH81KeDG9K1UarjXT/60H0kuVgn9Rc99EsW+tH64J2pmkvDQ96+zsvKMp1w7lZZpdWFi1VFg56Uii+N8vaeagdW31scfld2Mcs+0CANRXSXjl6Me1/M/F25WIi5ygWpoXkbo2VWD1535Mfd1ceEuR6RVXoW1rP7f4cPb/NC7Pw8TAFZ4vFAkNUv2lReODH6xt5Gnv9nc0sLMtMRditYP+7tmbaSa6GqVZRWInYI6oEv6pCQUgkpbRsHWu2u//iePS8U++b9qYsvahUz8/6L432tsGwUJUE2103dN0y8vRAVy+73Wdaq9ercqPRnGnmFVW/aRqFY1oqXWlYlKO9/ed7g6fC6MtO4y9V/cuN9jdF8enhwZf2+t/0wo1KjmDgyqofJC/t9f5VZf5Ro7spiLuadTNOv9jb+0oUDjVorCybwAUMeNqRoe2vrPmq+oKqfaPb3ZCqTanyFhc6QOoJhqKMBnYHGg1osl7IbS+i+N9xXEXB+zU/yUGB8Ud7k4MtsrAEQrAoBwkjgmlKHmG6ockUfFCefPggwIchF/NHWRRElUS8DWGXWV7Bx7EIuUzLxA/HB3qph6PUlFRLl8oknEzDWaCWUkdSENXBfqeKoMmIMiu7EhxDX1pafmBl7aGyrCWxUqSarTSFiV4cLK0tfGxl8ftEwS3wemXpxMkfPH/hI6qu5OWmJAa6siblXUNTV1fXT5/8cN16QizacNqd2uljax+SxbXhAKsLixyjQl2WyAMWltc+2Fn+SCWsSHJ9YeGJlfaPF9lpyphFpB5NqM9wkrjGx4+tfLxuna2qTrv50IMP/PDJ9SeUsqkLNV00NOSMWVI39LWl48eOPWK5J7NShd8uBcRFYQHzJDckezWVrOlkEkxGYZpJTjOplNCb6mWUBuMygw9nkTD5SGTB2IEpwq2CfAB5AQp+DhX9dltPhHKWdBPGS1UyIvVhbbB9KL0p8sjQKsfRfG8ax+ADCcN+D5GNZTea7SWYQknSFEkXKzwNFm4jaUK62LCd00m6EIfH0vy876/i76W4YLqrOTYm7lZW8VFFWpruogygKl8O/OXZtJvnK5qxrDsLAoFxDA2CApSS7S67jVNBaGdxN8+Wq+JkGi/WaqdMaznJcfW4TvD0LFk+02p+MPKOx9GqHzSCuKFop6zaw6q2rIo63ABYFaJi1drHrdpxz3OjeDlLTxTZqiDU292z5MgrGWVopqXzoIVSQcOqLSyLqul5XhTHiqIGoS+U2UK7LkO+EDwifqbzPEBEeFaWhUyeipAJiHNe1joCl9nryCUzXCUNgmkS4ROR4CBVwVYhFhnYZFE0rDeMtfXFAvEv4nPdNOxae2FJMxx8PhwD6KEIhEG5IeINAT+GIDijkTwad6ezM5H/aBg9mJVnRHUdpApVcSpZzRDqs2vN/UwSull2/3h8IUkfyIvTk6kbeNASItpRqAzOLOJrwfA9UVPPFfmDk+HZ0fBk4B+bzmpIshS4PrhQ0YETLcp8fyfMkwtV+sEs/Eg4eyJKTsUFjH4Oe0SRB+XLShLLU8+J8xNxct7zLhTZw5qyjlvAs6AwnZtjIlUQRUGUYBI0q9FZOa7ZNWholqeGoRxfXzZUMQ5msMmwOZybif8DXEAKkIQRXEJeIPxNwR2/ZXDYXXOHDKFTVJMXQRwRiUwVECUwy0/RlZAmfll4YTBstGxFFzVDd+tNzXR04AeIfKGbogaQjQE1bMcx4LESjOFQKctTne5HO4s/tbD285r7pJe0glQv4LokgEAyhCGrapQq04mhqE8uLv97Sys/Y7sf8KOF/X5GImAGEDkwQmy8azxRVOWBqnqys/QLneWfLsr7r1yJB2OEinoJ4IzCcDnNZjN8h/auev3nltd/qd36hSg9td3bAyFXAvaBHa0AxpAO+kl/aCnaI63FH2ss/Yxufz/i9f6ep+h1qCrX+bncOZwmq7JZV62abjpuvY5ATtckx1TBEczioEwBE/GEtgA6ISNETKMqSbBhRYp/jnAU+lj505/+NHOsJHfCCvIwTQZZOLYhBEVjPBO4SlEuvenexWy2lScjmVCq1DA11axlYiOArayfkM2FsgT/g0Fs3JeQ0SvBkwYq0myutpqnRGW5qhxVX1T1Y6VUUw2DfDgME3QZwWwW6YbR7jyqGuerqqkbq5a9BBOk600JEAqZPo5vCUladDvrjcYpRQVQum7ZZzRtQTUb8JsS0nwylgR5uuDtuccV5aEyaRl223IQCNQdB/E+mVCJjEDhR1G9sbS4cL+sroviCc06KYgGNpAB6hz2MUtqCCMlJ8nKUAKy90HQv6EJgW2RtcniKJp6QZCjMGcvnjNbx2mDIh8BObmK8niKvxg6lJLIhDD/xEpiAiLDjxvKy5RVsMs8G6be9Vl/Z3l5VVIapbyQ6wuI0rVicPWpfymMX6qQwlRerSY5jpUJdj+oG4tPLp//IUFdIVODyyNglhJB4kdQzgVuGpAIuWT+RxITaDmsECheDJtMGYoIl403BYISCUWD0EpCe/GynCwD1T41qDzDNiB8Ct1lSoNhDwGH4X7ABJZysYA5QTBPciUcUyMtq4Ad1YitqMSlPBaqhlSYhK1RRA8GDWIPJA1IlAlNE+ktkDQsLURhkqPie5ewI+TbJK5STKaTVwYv/FsjvNRpCFFMKH409LHG217r2Ht+tnP2A9BiWYiFZCSk0yzxev1+d/2MqLiy2ULmgjCEix6mmaJWEJrwhOYVaRjPDpLJhhRuC9FGmewDxiILpVA8FnrpQmexu9A1DDsIk9HYRw5luU1RgqaQWtwCpSiMQh5CHoC0lTQBSoTKslUKLgIu+m5KvKB75IJYaUmrSrusFJaUAXVH3IL6nIZ0mDv/ecmJrlnNC7ssEUE7lWiUAgAGigjYGpPXIAgeiCSBkRbBzFRnAGCHuAvXQtgZR+tY7Ii320WF7zWoCkBrYJHi09XO425WBuAEOlICy+pio6RpNRpO0iyv1+sI4yzLns1C3QByR4hGlY6T6UYZbqbetWh8VUx6iP3Yd/IPoQdhJPQLtqfwNoSL4Wi7mO36uy96Oy9WyZ5YeczPS/Xa4nQQSaiY1euKoqVIvEQVJQS7DuiG4EOmIMyR03+OhMvMPsPjaE/MQy/mDOhFFC0zhwIdJvSRIU/ze2YQEr6cdyTOK1vsX+l9pNkMNSOYkpVOSPlhHiub1liK4USxAPxOCXPGpgSeKmHTUNYCCJNdsYJSAe8Y4UVJZmOxTlghhKYUj8+tJ+GbpP+q6jSai7ZVhykt8kIDkNJZmHmxZrqGWS+BkWPt81kwuTE+eN7vw05sxZPtIpoRKEtfN090oSx8EdjNA4+PA0vM2lY1610e7b6YBttFPiEEs5IMvVVk2vb2wWQyRgotgkNsu/VGRzVdSslZfZQVJyEnoiHiVglnp2QYooOIEIYDEmS9MiQ0xDNwoLxCh3uHucCuhshoCTh+wvc4f/ByK55sFeflXqhziToGyhoiDAtVR/F1YC6R6ZvD7oS8I76m8hXCX9ocvMrFYHvSkbknZS9DkQ9wN2kPK5nhA1G3YsDAPLwkFQSeoxnwIy3bdFQF4VYQjCY7uweO2yoImKJGIDiRJNwdgSUY3ew0yzzqFwk6PvhtzB9zJ072nuDAEm4ayFTLVaVsJhZeHo+rwi8qgO9qGGNzLY4H095eH7Jw3boB8FrWEeuyayU1526QF/JYJYjicdqCZNdgeVOW10H6MPEoM7G4hYl+/iYSBiVKiAeOXDWL7ZiVZ2WVuWrOV4aMdYnyAIoBBIHgc1BcxC9hbiyhsKk2IHqieCDKYyol5nWh1BlTYg6O873PcHZUiYFOh0dxNxP6rTryLenDdikmJTGyWnPsNE42rm8gnEGCD1yTWlCKKIsnWYJCSk8VvWZDLfMA/hRfQpjpIbLJiyFkyGgPg0tVBWN/b+L3NEU0oTlRLIcRQF7Yr0Qoh2kiS5ZVairUoYoPhsMZygOyDblzveetytxe8P3LrAwsAgP/BJXVSyFuxKCwUTD9pMaMRQHACHknYe0E6JOM2WZhtVXUczl9Cl/EwESKo5ilwQbGvQJoQpZEHzgPHth/qAZDEsbmcwjLnFsO2vfsE0CspMuikjEZHVTBbCTMZHtpL+AfNbgfdv1Hd8T3KzS31h9J45GHaN5CAl5qqdCZBBJ4YFWF9YuKeKilfgeUzawa7BzglQhvaBtR7Xi+kZkxoD1C6o/OFQRMcRru9Q7smosEPJpNkVtXSNjEUnfsGFGt4ix1VhB4Xr95/aA/1ayuIDokDgpXmKEg2R+pFV8ALiV+m7wQSDU/JkRWF2L5F9s4+BjoAZWHDvWRp+W0NjAXdNv8Xew78GJYeAmKTGkzMb8QyOIFFDtRzZG9Cql1WafSFdtirGYzXz/6ZO7gmdEn74rK1/zBL4NfJF3WnL3Ni7havVSa/YHX372JelG9veTlWq27quuI4H2x9PNwKiahq+hyKQ/2UQjSVcsm1h5FH7fcLN9ytKdZqyWss4lolTynIuZ5UORTqrZWZXNxrdE9kSAALCsvKlV78djJhxut49D6UlRg3pDnf0vqFcwPBYb4k1Wy+UbBE7fHySdH+BK3KMwPHvb9HwYHRwvLNxaZNPaB5HVZE8UR9Zf+ibw5b0A7LIkfklGOvhTWjT1ZyWYumcMluOu/8FcIk2178fSZ+uJqIhoBgmerLhnW8onjsAgUK+QRuuDSNEZlBt48yUvDcnIUb6h2y+Ir9pjbel4GkiU1jgpEMp3uSoRaQBaoRp6lI1TOAJ+h6n36whOp4mxPg1hyJGOx1jknumsIgRESsMECLO8+NIqve+2UfDNeANNZ9mQ8Dm74jsIMUgb+r695sgBw/jzaXzz6ubXX2N/ndvrQ9M0N4Gvee/TKeQj1BjLnv8ZrWK+PpNUW6itn5drqvlfd2J80Ftfax04gayoB7ca+hrIA0qosk1Wt212CXw7DGAwl6jA+NPZzqhpjNqN6oCMX15XaseP36ZalGmjXzUJ/fzbYAAOqyMrlMw+deviJfiwMIrW+eL6++jDAJkRTFFZTwHdPHG4SOqcQHNGXWBJ2GAceBb5sNx46pdvXAN7i1pPvG15aP3QAzLqRHefm/jBYmq8xmaSj5+FbXoOev9EKoLsQoKwpGN366v2VfWycupW1cvqh9xpuh0p7mT8dbEfeyFAJyLJrraX1k8gwEI5XOaqP80IKaf38G3gELckAB4Z9L88AdIqKDggp8Ge7ihgQxUVC5Kcfe+DxEw+/z1k421h7WHaOVYXBCencFR1Wtd5Qc+a+kYflhEazuit7kO4DQ+KJBuNMs43AV+rwwf7hyIOTH2A1BeZ/yQWLeQESAfKxCuEvws45NepQ+kfpAVsPWjPQsejtWEswQ1hAeng9b3APMChKCZaD2jWXHnGWHzXa99//+Ee7Jx8pcw2oOaxpOuuFk74JGFdWkHn1+9MgymFzKLGhnon5g5fdCGUjPw+yhGKANHP52s2pH2GRNLlUykBKUaDxEIkTkc7prp5/snv8Eb11Cj/wRInFiywcfI2lPKoE8L9QoMPuk4g23JZzjZ1vQ7pxFBUhunnShRVAxWy+vFSl5DaN5yV8yXiKIuQgTLAIM8cmIpyTfn9Y3ufvmBvDee7E4zAylGxYDAE0FXg3h3E3ffQ86bm1Cuxe6SKK3BTkRaf7wPH7PtBefQB8AJR5CYFMZ6aUyEUMjwpF2t3vb+8NNYvAVARxty8nlbDZ5dN1AEeEQGCYer3R1IvQU4FORiWPNNA5o1ERw1MDerEKrVNqKC6jNgLOEJc2cfNYh+Y8vLulpnfVKBlFFV+K64dbyxT06pHjB02PER3BwyCiHQkAHhLSpKUlNgnnmOAveDECW6IVUKgMjaXfo5pAryGnTCEPPgft3fhmuEQewTAiJSI7KlfAQLKVp/3CUg6kkkiyKOgDnvKmropui/MUCaeprLQwC9SI8ARMmcbkYOOpCooDBhYAfpOU8dRHnkhUOoqwWaZ+pPV8Q5PmEoiE6ryS5El3ZTkCTgD2WxjJWSKnfhkMqmwqSkgalEIE87ZRIWhDn9o8CkZqCvoAS7/v3LBUKbjtQZMUwMcoi0gqplIxlgpPkkZiPiyJPQvYN2Gz2DI0reZgjbHwEIJB/SPP8S4IfSbkMxlrpsSKFMrCFIi4LEfgqFQ5UBKQMYCOh1maoX6hSoUmIVNKwJjBU0JmWIUg4koC8JAYTCAa4yDkxI4Q0wJ4DCg8LNi97XGX2SGCDsPSITFsLuRvWGRadZboALopIjwnYAGDyZLluQ68tNYKwlTRiPB7e/Q0t/XsV6QedrMuK3Kz3T556kwcpip4ZYqceuNZfzeLJqCVEVtVdNNSh1FlIz/wRgR1oBaz4SXfwlDSt0D1UM9IJTkQpYFQXMnGO0WQSGohaUgGYQ77Pr4IOqAQqwliB3kGNof4tjL5Y1GdCHmvintFgNy8VPVQKIneJgoDf4Y/sSqVrqfM8+Nq2fQGQifw4ZxNSc/DX1KrpoidBFIEKFHAORk5mVuw13vg41G/ZP3kxFUGViqpVEEBklGV02EfjPseGCymgQSxBC9vZWVNVVHUcFGMu+tjAZ0Qdkb2jgxeKiQHvVf+eH/nG2fWjWi4gTKaLmmzTPGlhda572+ceF8utrMCX7JXtxzTaFOeqSBxhx+G17LFAngvQ5nufBxm5/RN0OqxlL/Q23j60ss3d7e8wINMVxYXTq6uXTh17mA8eO7rT/2dD//E2c46ZI5iCt6SwR3LmickV/pbT21euba7Odrvw50udLtrq2unTp080Vl/6tmvXr386r//Ez97yl7eOth+8crFqmYGrBBAxgTuFGAaWOowVFQrYR2QCAFV4CbpomY/cfL+uuEAiSaaFZP7kZe641ZA1K0iSazR6BZpNva38NK2uyrmUhns3Lz078TpKw1pZqmY0uEpZj23ljdG8tnHP6bXz4pKm9hUPD1m6R19DfNAZCzEJEh2v3n14v8j51eakmKL9SyPhtmu2GwtnP5xd/EnBLUDrs2wB7TIMUx4D1w+ERN5tIb/MFcyFz0lTfPMk30LGSTQ7NLP33j2N//kc5Efvv/sQ4umE4n5i6Mbz/dvqB13LKetQfF//th/8Z7FC9Q5jEpPkYC58Eyx99kXv/xn3/jazWiky+qy2T62gOpuuTUZjPOgtdQYTw6qNPrMj//yz7WefPGlF//5Z3/7z5SDq8sZ/Be0UvGEk2nzvL3uuK5oKv1hrz/tX4uHM0d0FP3cQPzff/Y/f3j9AswUK968oegTEVapsgoFqJ1QTSfjG4JZd911VLyq0TeH1z8/3XtJyYNu047CIJPMPhiCiw8fe+CHtPrZkrwjIIL5Uh75XJZUUznKjHPJqdUn+yliTBCuUFWEndH1WC5nAghWcp3hvEh0+SwWSBwXyoAQlhQT/n+bnsw5dHyBybXKT+9d+Y0v/G4/if6Tn/w7P3Hy8a6ghUK2IXhfuP70v/zK5/aynm53MjhJuETKXgpRl18MN/7ZM5/9/ItPqaJSN8wfeOg9P/X4j6xr3VTIrgcHX3jlq7/z5c9KqOhZ0gT1hko4f/a+X/5Pf2nwwu++tP8XFFGFniVaH/ngBz9+4sNdqwG40/OHk2D0xc3n/sWlr/SkdNeRb4jhCaLtiSZgf5ABD7X+NduX/YIDGQTHIh7XyVETfjB1tYjCkjiOIxEVlJTKXDVJNcnXI7whQgmXDUnjMK7n34DfwH4YZm/srZ083+iikoc5MJWmyTBoeTRK/V3ga2SuVQnUM5YUU2zIwjRePn3DB4vzhImQ/unV59H2e/7Cgx8++T5H0LQwa2bymar1H5z60f/4kZ9cKuqGqKeIZABpUQVVGpThP3/687/3ylfDrpHK1RNLZ375yZ/+Pm3tVC4/kOo/rB37b97907/43o85IVwBMEWqDBswso3Fh0/dB2FqUWnk6gmt8eGVhx6zumuZuJSWjzhLP7j4wK8+8ZO/+v6fWs0sOIapAjI4DDSvKN8Ritx+S4AlNYJdIUXMzAFvlE/6CYt4Pw+2q3ysKYWuSm7Nhfq2O0vthZVK1qiGnpdUDb7NhdwpeuhsUdiLS05nfTDJmt1Vs9VwUeB0TBO06wm6wl8uoiFCaKS9OUgJvMR1eGlHGfvdmsLYh4RnlIhPohvotjXFbb//sn8N96nrKmZYoNjYFIRP3P+hT1z4YHADNbUh7h5xDgK0L229+MWbz0cttQBl0jJ++LH3r8qukaVWIuuR7PrFcdH++Ls/eqJ7goFoxJUqMmzVHHmIBqZkDvsg1WAosSL4uiwHa+X6tPfK5pWuYP38yQ98bPnhhQAhs2ShNYDmKc15wtzW33UvDAKkfgryQGAFSgCl8Qgjb3PSv4LBKIZaNergmpeNlTVRc/b6U7e5JBsNQNuMns66a9njLq2H60Cdx1o7/dAsFHcOpkmaoVkH348auJhOwvG1IhlUZaSiVwdBM30Q7DxXfHKIjG36Rg9aKUgERL7cLC9NNn/r67/3x/vP3Sx93xBzVhZdUPSPn3/fj519sq6YVASTxb108oWLT8McCRZ6VMPT7aX7gZwQZITbZ5QuTY/KdElbeO/5x4txAn4i67GXDIT3jByB5AAP/JFC8ajMoYWK/JtP/8lvfO2PZlm6VOl/98GPHPO1agCe8Ny1vvEtQNHQMMSGryBeKqkRgwqcRRhOtoLhFkqZtusUSZxGEFy+tTPUnE5r8QQqmmDI0jwLmh00/3hCc47WgRYZu7YQ7NpKs3N2MEqHI7A4hSzJ8zgFmi9Xkyzal6RQU8AyS7OUCgvzT2AwLWVFdz4IDmUP/AefjzqFnEbodEut9BvDS5/5w1//rz7/v/6TZ//Nn06vbBcx2JpPdE7+lz/2C48dO4tSPSD8Vwebz/Svo5SNCN9IhNVMX5BsgLklQk9XF1w1Rz0KUImgvGf5/JO1k4so2LGeHAJ8RVBCMkFTSkPJTBl5AKgaiSL2qvCpwfUdpBCqhsjnXGftFz7xs0srqwhVEWUe6TwZ4NdoElGMCkToyPKUhNIAXRVlKfWUbCpkIWjkcRRLmpYW4s2bB2munzj7LsXsoBouAvon0fPclWfbdz7YGDkwL2qdhftkrY0kGPwy125iBkwWx44GIvWoCvbFCty8IkW98SgInqfpd8N/PEymb6LSu9gSzAv1JTNBupqPxOCqOPyD3gv/+Nl/9Wuf+98++YV/+n+/+ocDv3/cXADRBxRqgALb0XAnmcCEwGQ3Y/m03emKGjB1zMcgvgcCf6GEY4Sx+kD7zKc/9osfXDkPVBcKwGpmrOVHEn1kOKow06mH4Wrl/fbVL7/i7wm2hngGmoBi65MPv+9k94SJbZYSge1NH0iFedUhz5LIwE2BKxYMbCWCqYl8ND1gQ2pBXI29otY+YdXWBcFF1zksM7HJbhvefbfoaZ6LZIhyw7ZXS6ovW9s7g+3tgSSY6MlD2i8kg9HGy0U4JNGHaKcDqZgp+xskVPMVpgwJqTKYC9LfeuCD7146p45TJc513H9NGtnZZXH4R3vP/eM/+hf/6Pd+/Ys3vxFCaBXgi3iUelMQ6lCaAX0+LnVNN9H+AIIEhwBAEJBlRI9GWnYL9fH2ySURhomXH+ZFGxhmre5OwuB3//Rz/+xzv/Xff+7/+PVv/H6vQkUCmSAPqWEnwFYo7BjEXQYEvUm0wGAq5LBJOi3SqSbn+WwvPng1D3Y1TUS1GtJ79comuAqCWlfNrmS0BdklAIRBdZzPxs3A3aJnuwwWsqa6awudU5bV7C6sp4nkz7J2GyG4EU73h9uvZtMdFaX9nPYCg6BYdPR6V3zkqXh1Bs72wfp9f+8jP/fR0+9ZmMq1UWYnxLvIDclzqn5D+P3xpf/hz377L4dXoX64jhA2jVoXZSSdgSxMTAXUQvoyhnhRVRzyjxFqM3AP5YjbIi1WmaBpg4AzyzgpGftuf7jXm/VYfx1GOSFQIY4A4m2HJcpE92fb5c0eaIKR4igdyqKnlpNg/9VZ/6JYDSyQSHS9Pw0Nu2XXu7XmSmv5jKDUKxGNxBxiYZH2IUpBtp5JZy42/AeRS5nLgtpYOn4BLZmA3E6cOJel4mSMrglUdoMiHlXhWJaAkYA8gqyav5ep/Wukz5gg89+CxKxXmiOoDzfu/+Uf+Lu/9KGffX/93HKomBEmjSAmKWZ6NTxufa3a/3+f/RMfroVKCKwhDfmyJIeOsWfJ6G+DtADLwGaR5gMgIMisyixlqgu+glaUefTABIgtUqUzf6HW+Pkf/tu/+pN//1M/9R/+vUe+fylBnxFNz8Ur1Dy3qgJOGc4/MjP4zjeRO1XKqQsxTPMhGseFfAjOUupvSwCTqmDizyynvnbsdFbIbmPJWTwO6gwHT/m1zBlVZHiwG4lkibkSEU3cZmkVUl2wDSFFub24fN8j/VB+8dpBWCq5qI5H4yQdG9YgzW8CdpKkTpogEPFEyQeWQF8A7tft4eZhejUfUStJf3Hlhd/40u+HaXRBXfyPHvnY//SJX/knP/Erv/rwJ36o8eBiUjNCWUsKlGie3Xj5StLHUnfQBg3WVF4V6A5G5J3gi2iFgcuoKMwSM0lB+AAABVRKTvNFMgDSDV4Fqq2SFzqZKVsrNbiKtiC8p3b2Hzz+ie9T151hrgsaCtVgC+PKqZMGmCi6UXgpYb6XGQx927PADkKjFua6pZVp6kXUU9AXl8+yCFFNAhKgPwmuX92rpNbK+fcKRod1+PAQEMk+iD1o10HshrYxkDKrtKj8UgiLCl1eZDrme0BXBQwIXTxrgx3vriaKgwEURPAUY0nZj5LLVRhr4gLYDYWALrJJUQUEStCPvINwXvyjLc+2Mg1qE6RnJtf/x6/+X//64hdTIW4I4nG5/dGlx//bx3/mn/7Ir/yjH/z7P7r6aHtaOUEWV+GNcpoIkNDyqlhHX1BUxoqcaeMBpTPY2ZAYobEgbZHKVBIqxvn1wcZ4MsI2AI8lQWdLmWrgYAoKmg2xNWoVmJvY9/Kqtvy+5vlupCMQQpGBqIdEcJNRjLYYIZL1MRFbkLFx5saNB3AliCoYPQO4DwVTBNdw18KEWtNF29E6turoMmoYze76I2LjVIl2UZnIkPShEoh6Oco3kDPAOoK1afvCUcLK5IgdUTelDUUQML5ctpXWye76Q5LSdp2lxfaybdp13bQlQyvz8d4LeXGQp9M8QoiJZURoRNjZ3Q8yN9ziUIXf6NR7ev7nGy9cz0c+sZYglQI8/EVB/5HVd/2DD//0ibVjEBy6MQB0oTX2tNt5oL5qIYsFaVcSr2MKXO77YjES04i4dKAoU7EQqO2lweb//Nnf+uKlZ8FphDnCwIgQwAqa+wy5MKQIEQ5o5Agu2RyJj7z3Qz/4ge8HbHe7peWGilNYDh/zRmraS2wyPAOq0EUyU8sw3Mc4qG2pQMeEqeo1tbHq1I97paMvnW6cuiAYNST9NC6ACmvILkpoADFNQUJl07GIb0vVc28m5RFmJhbFLJeIL5dLciZZpdLpnnri1Pn37/fSy5d2hwez3KtqYlNNiq3rf1r4Lyr5NJzMSGckjUpyd4EJ+JHF9KxKTEMSkExXjv7q7safvPK1Gaks/g0ONbPLolVlj2srZ0+eT3QQp822aNUEaV10fvqxH1gXXQPxmW5uR8Hzm5eh62j+1ND1mZDzTMRsIGRfeOXrzw833JUO1EDNMwTIlGimOe4OX4uMDVV7FgrgQopzx0498eC7aM7EYbMyqxGyquFh+ZGtCqONAPEidhBJHyASdStGY03yhrsXDzZetgG0yMZ0mG3f9F++6nny8on3/qi2cAbM41IBN5SFfxjVhTwFaV1C7FjkdyzCYV4gTyIA/Oh9FrN9Id+RhRFm3uArM7y/anbPve/E+Q/2J8qrl4cHe6EcW2hVS8KreXjR1LLMRzsnShFI7UhtuMrcHiNgnekmWBKBfiHZ0HJN+oOn/vwL1746EDMfC052UNaJAB0nXoyfH1g7d8ztou3BTKQPHH/4h86+257kRqoO/eBfv/wV7BhLsZHbQKKRIW4ryec3nvqzF77+6P3nH14/idtBpI8kE9U+pFpg/otRkvuwqNRDgf1PJoBtQVbmoilC3DySIyTnxKvGeBBD6e6bAb/Jn6DbEx49C3akfKqqkjdLr21Or2yEhXH8wnt/Um/dl8HUUA5VqDKwzlGV9DCrUS6msT/gZR+KIz/5D38Ne6JI/NQf62iKFCZltIn5vTIhZmh9Z9xPWUd1MYuz/mim5sJCC2gjbMUQ/P96534w9xEM68YCkQD5NCr+P3Yz+AOBDRIqTgN+Ybr5+VefVjV1Mhxfvnk10Su73RYVB51RgzL6ypUX/u1TXwYb+he/78fe1zgFl4uIHhj68srxaTwbbO8HcXwxGfUKr92sA9sIlOpSMf2dq3/xm3/wO6u15n/9t37+mFZHpwoqaq+GW3945S+f3r+aI0ayjGjiN03bxiCTSnJlHTxV3DzwBir3UI3+yMJwF8tt5G2ETP4C+jObDW4C0FJSsOyvtRxFlfT+pOj7Rqmtn3vso51T785FC7aX6lnlTC6G+WyjCIlaAOM8nY2d2oKqYIaNLH/yk/+QuOUASKa90OsZ4jAbvpx6Iw0TrME1A5+SkbM1yzXc5nCWhiOU5NJKk2QnU7SW3XwwqVyQZAESEUubWN0QMWPPsasnk8P+y/sEtqLJly89f3xl7ZH7H8AOfOHSK8/euPjyePOb/euf/caX/vAvv9owa7/w/h/50ZOPtUtiCbLBLlJDdS6cOLNo1IIovqbGF29ceu6Vly7vbHxt85XfefbfPXP11YdOn/vPfvBvv792CuWonij/8fW//F9+5ze+0bse2DL8AQtTpP2t3aeffbaWiA+tnlYAioITS92phwHZPP7jARpd/jxUoxtg24K1z4KiMRts1uoaJv4lsz40auZX24MiU1eOP/j9K+ffI6pNmHKyUIIvJbvV+NJs93mlGmFO13TWwyBEzVgAXR5hFWxmUqUBZmYms43Nmy/qyZVatRMXhr30gN66oDXOivoieX7GxI9mo/4LX9p95WupsO90R6vrDy6f/ZkkbQ4GN9vrJwxnpQTcfTh64kiROPkETTT48/n+zT949esPPfzYan11GI9u9DauXLu6N+iDIQSQ9dyps+859cAFZwmjLsBWrBQZrp/nVhCGV0U349Gf71++vnUT/TsAIOGjG83Wo+cefPfSfcdEE+ko+K2xKm2Mdl+6cTFy5bih+hgOhiw6l1zwxLz8/tbagyfPwyAxa0uwyZ0JFFsmRrTHVmWBLCN4wkQUGLYrjPc3ZpONY6db+ejK9ee+PB1iMoiCuXSnHvxQ+8KTxAYrANeAVTEUst18emmy80I82wapyS91tbGyeOa9lXafKNfRP4owtQA8VqbI2G8M+68a0WXde3UyjSR3yWidri1e0FsnBWu5ENCSYFGDYDzyDq5MJjcG/RdqDjz5j4ra2u7NlysjWj35LqHqMhW5tYGh+xwxxm4gXw+CTJ6iXIniAtEL4ICE3EMDJg3F1DRBp743pDk08qBKDQkRK2SDiTkUIaJfCH4uQYE4CZQsUgrYUUcEx1xTwWCh7wWSBeMHpA2NmCQ2GpZAywah8TlKxFbn3hZbHpaQFSBvD8p4IE+kHi56eEQVskcZHwWULLxx6ZVa0+yutyY3n7tx6SXTqDU6Jzor9ymYL8kKdkIS0WSiaC8eXgS53u9dVsXMbi7NhJa5fD9IO7p7FgOpMcdG/rX/7tOaSjMLkqiPYTeOmdRUBGDIaEFb8yt0TSt8uBHshQq4v1BMrd5qLq81midk2ZVyTTEXIaWpf63WbIolRH+Xlz0scnJPizsBNR9lgzyjpjSQiUS1jnxHQlcAOED0XhQsiKcN/gGBFUSOxbgRciKwAVhYDwRPxRKVmqS0RN3JRQUTa6jVTY6KMkF4QDQQVLkpuCL/zQwdXD26m9gwFglejrw9tbHh1m4Riedmhi6BrCWRgOmvWHvw0TNcAWa9ZcCZjx3DnALUidpLp5eOP1pbe1TSu9AL2hfgLJUYu3vgDy8Otp+p4i1bCVHCri2eKpTVTD1hte7DZAPUhgk4+uRnPs04QAV+U5TecO+6P9iHtFDByFJ4BrSUFHEY4FrRrQJdyUQMljPQh4CaIwrtmLNRZbLp6nFyM09L2zzN1Y1fPxvtwmBLFt0T2MPwBzSlIrgFgIXKBAwjUYypREH6CTSOen2hufhimjFG8C9WiJoCiMQBVrUUY/gE8cEpjCHxIUakgQyg3tDkLRB1yKFzzj/h+shuOUWZEiT8DRpHGwGJDb13zmZh5pxdNUejDkXPKnqYVp4hAhz1djRTd2rN6XRqunW3daySacwO4lhcXVp4cbaPClA6vuKPrifepib5JtxrkI+mCvDj1vr3GQAymRvEV8if+uSnSC7wOoKqGk30smLEyhRTZNLUhi8tIjkPkwhEfd9EEwOq+mgclcHqx+sJ7sBuHAYDBUwsQRhu79frDZIznavCpj/heyhL4Sf3MMovIwaTcFhSgV3PQzu6GiZ6YBhkGSBVRmnitHz6DCKeUHMPxAcDwGY9M3YTHCZ+pg5ruikIFZEZzW3nYSIxQuasTBrfxtafeFAs46ZvYHH+YX2NaQctN7lJ/j7i9lPfWzAZbPmz4cJydxaHwHAdF919aHBAz2KGqURivKmlGwkqb5vPyN6uGI91pBG5NJ5WQdU2uw93T79XqR/LRUaEZciC/JlPfZIpKbhJKLJjfrKtARUjPSwx78VAmlFEKEvEcYC+WRXJO3wDEklQJkCRp+FbBgwERhvXrHo4mUA1nPYCzWSiZZ1H+mxaBYvYiHdCyRXPG/mNM7HNgyH6V55MMh3Ea9gRJ6wCxqwefgMwgCaWzTPPOyt47OOQcNKHs43Gqkm0/w7dD7nW+UrP1Zz/5+gHVmdhyR+tAodVshkq63vb123b0Cw7TIt6Y0GVLeoVykIhGeaTq0q2FfdfDvYvqvHIRSNekhi6I+udpKq31h/rHH+X5KxWgNJQO+YGAOL59Gc+wzJOJisiaIIDEINVh0qFbWtFFqdpgnZWMKl8NGmDkkSz6Q9A1lNNBwFmVWiG4oBBUuZJrWbu7W9bbkMFtROrKaN+i6QYt4/AA7fPZc4DfpLjbY/DH+/69Z0vusef+Gfchgaw1aWF5igWu4Zbz7t+pGCTGq/nRSTUqj3k6YODDYw6W11e8f3cra3AeqPjAw2xUj72B9cwQF7Oe8H4ejTdg4WhPa2ho22hAk/JaBuN41ptRdLbkupgSx/CKoI8b1kmi0wVG7xL1TF8Qhvs7/YPdpLYxwB3GAlsBcDeZRaUGchhKL3HpmqJJWjgFiwI1qbMYIezJAun42mr28EaMi0ld8X5T9T4ypPdt0O+b7wMR7p6uHfo+5jFYs/Dr+dg011yp3+F+efXzaYAYogd0rjh9asX2802aNi6VjfNBsakCGg0m6E18Hp/65uZf5PaibMxBplj6vp4Gk7Dcpqq41izF861jj0kWcuC5CCR4CaQP+RPfepT/G9s0xN6DxIzRq24jo0V7x/sYbWzNALl2NQEG70xyWA2wkyfEtY28T06vInIbxWQXrxS1ZRgisFZhd1os3AcVpcsO6ehzskLt0R/R1h3B7fhHjX89V7GMzguZGblmDUjbT76Bn4F82T18DN4EA+d5xgaFAZtnsiyg81rLwOibze6GGhv1uoQOuZFBaMrmY+e2EvB8NUq3K0ZBfwiZOJ56dgvvUwV7KXFM++urzxY6Uuo+iEEYg1JtzTvSPQcwkBMi4ooQQhQWyx9EoWqorTbTatml7EXB1MFcHMawChpapWm08HgeiVFIJ/AhamaLoGJWYTjft+tdWWD2rTZ5qVWA6JQM17/nfXgeT8I+A1sf/BWo+9sX3Au123Spb8fGjkaEHv08fO/zFEC9tMc8SYZFbEoReP96+ODTfASHRezA+pCPi3DK73tZ0Z7zynlbhZsFHEPUKkOEmxaGGZDr68q5kIs152lc+1jjwoG5sk30XzFSuK3ffWR1rPdSHuBdwlQvIBR9E5NV/XAD2YzDxk0ggf8HXBgzXGyDL2/ETqEwnhvNtnSEfzAt6LBG6BjhUnLB/7Uby6g1V9ngmSH4LFizdyssYotbTKKNymLocyOSjclWSrO2GcVZD486d4fxOc+XDn+zkNzx1SZjRXjoS6vHPHYnfVLMByRKkdskg2dTpFl073Ny9+09arTcJCUlVEMWfd2vzQbXmxYsSnN0mBfEzEpyYliWAtk00Y/wNwut7N2fvnMEwrq21KD4WiHhBkWd/ELvGVw2HVQ2zKFmuBEQGGBmtU7IFvix2DmhxHQXHCQkCLYCC8rkIUVcD9DIM7w9HmcjAcD9ETbeoo5AJMRNUebjSYr5DEfy6JtvptJIvOiGTfNFHOymWlwgpy/Pn8cFRfvUfpHFXoudpZK0KgzihPpjDXUiXhHP/885BW865E2HJ9JSsAWhcKxkE22Lj5dhAfH1pti7h1sXk28kZBvh/7LSjltIMDJMO4ud+yWqreizJhGRizUldqJxdOPdU89JhsLBAFg+CG7cXqSzFnR/bWiJ/0kjg9TFVoCGickqTaSKVROMOEIB9vVm00AIDM/AvSMq6REHL26kgIHlMVTlA60cmg3bZiYnZ1disYccGjoDtn3MTz8tsfRnSPtyeG78M8AgjlTaL4z7lHm85cxwJd71MMvZLU/mFJkiIzzCR4JpVRc0HN0gzdyE/8caw8AHCzQSf/q8/7w2lpXNbVgsHs5Dg4sHRnxoIgHUpbAieGgPDRAY4iHYixWxlKmtAVrsX3iXY3V+0UdfVXo7jOJms6yE9ZGzvtX5pd2h9az9cCC07xtXB9ugzHAdRHTtgyjUBREL7tb10JwQATkunRAnFKhQoPMGJ+XaApaKUZCMcFQQKjObIaxYLldB5+ORjcybiw+ErgV5bvs5tlmJ2CF+GFBgGm1yO9BMKID3ljt/o4zju9lEbjo6fPpyec+gqGflKCExaghF3REGYme4UkMLKCBNDTuEk/seQw1BS90Gk/2Ny49YytBzQwxWjCN9mo1IENo+0CbMhIWJQtQdpKTUAoipT+p+r5UgNB54XF35cECI9KoOoxpG7TrKNqk/Xc0Efuwr5qZVG7vmO2j7giICZmxDioRCQjIFlWfwIvzs/HWZOPrk/1L4WwG0K0IfcxR73YdqyajHm+4qImDdiGoelurHRtGeiLY7dVjmISJ+pmhNhDYClIDxx+Q7jOPMv9qzHYsgum0p6qVpVOfkKw5rFuMqnJECKNLpyLR/DJvuUee93PrQvuJbpHJlfI3KnSiPBRgahuVUWeBZtYMZxmVXTYqgVkbapcDeRTVnoAGNeVeEe1J8JheNOltO1pa02aht1HkaH4ByI+eeaiv6XvRaDBDuFOhlUdvm5315fsec5ZPCiqGntSRmWJNGTDHPT4T4mHDDaPBM+Xg3uy2B2vnoiunZkq8k/p68BPqzACgwLJLeul4o3/zWn/jiph6LVu09SxNh2AquHUd5NoswLRLXWu09e4C8n0M8hoj3Cykhr1kWt3SXE7qxyvZKgrMOqpRWZWl+kLZj/1Xk2jboGzPNZrnKnU5rXSg7cjscbGqYEDXKEw6jICYv+JjDLhVZ9Ayj2CQYqCbTwqkqi8ENwWcIxgD76y5nfOKu4DZvqj+EJgG6LNAT8pMEEZJsJVE+1ncy8NdW8M8P8xkrAFjn+5frrKBixGaWTHaH2GYluG2ZL0+9BBBGlp9ffUMLMwZ2e6g2RyehM7toi5rrg18ezOoYj6G41aUc6fBOXz9PAtiQTGTO+sxJisArYbuttxGB2mXjBJSmfdHwyBO4QWc5hLgUC9G5D8D2wubF1yHKMLU6b3ZcCP3D1RMiYln1IuPRi+i2ZBTpWN8ylRSkzw62L75UjhGvHwAPAwaCrI/ADY0UrN5BlRRZjjP3E1xzZmbFtKsw/wIYxWI6AlWqFeFm/7uS7PeTcS7st6stdcEGSwFGlOCnsgqHIpkXnpZ71I4uBj2LyE1zaOJJmqYm5UF+XQ0ORgM/DhVjBrmQuVVzYulQYCuZF2vr3dOPrxw4pHGylnJaNE4GZrPR87iVvDKihysPZV7rqM5LMzAvEbrOTOVLwIpFgAulFMAmdI8YHTYgKhPDKlQVmLB289HmyB/o0sXMwDROxanQVaOQI3XDVc3zawIwNjDQQfRdIRVqhsAQGy9cRZtvKXi5lIdSbYgos3DBD7lDW+ORtek6QuJ17dA1jj+QbXzaFW1QCwlpaG+A9AMcMk1Hp2x3Un1YA7RsUkP8z2B4TKiFIvxTrD/7N61p1D+bHRRdTjVWHsMGxMnGlVpmPnjKoaUcRLClt+/VmVDHH0BMo1goLFnaTSB16nDAvjx1A9B9xAabluRqOiLRqZ6a9ldOCHWVgS5BsY7AUsAL2n4GDu3gAmaWe/DSQ+sRseX5Ba5+LWi5zktJwezPYO2mRREAnT2IPJA4TGlSVfTKjnQCuBzgZiHGdr6Q4zaVFBjHvYvYtQyrtDFpGVTcWqg+kZB72bqDV0c5hMKYaK2FpfQaDOOpcbiOYumLFCLA2rrB9sX5ckzQribiI3awiONkx8RlLNoSGchAm5qSt1eIOJTTZuNDmHelBtGbvPJ+tD0XMyrHmfDi8MbX42BbcEKWMvO4sP24v3U1JnOotnAw+ztZGwrSTLbq6IJhhNjI2IkudI+JTmLHnUmKkGcjfwxmopanXa9jnE3It5ddwwQ51M0TGBYttrAZBZJsSRZB+ldVIkoRs14LHolEJZ82hyZ4OvxJqKnJSOx056dn9kBmhBClNl0gJqKZtfp7opBOEIafQNnM6EBHa0nQPIMHGBjgAUMblkSZ3BlJuiMVTbGWOMU85q9galKtq7NJiNRk1TXHoe5ai3UWic1vaPgYxV1erA9ufk1tRyUmIlvLnaPv09xHxXVc4JkIh+sZBB+0HOJ8So0/JEN+OBt+Id8AhI9nGegFH412w72npvsPKtUYwyHq3VOdU6+RzRX0FKMiSneZH86Rqk6NPDSUQ9obdOtZWGcgkVcX1etpqqj50+nCcOYpa5juqWJ1tLAw1g0NH7FCbWk27qDQt66SpM4bVQPQ5wqjXAPOTzxoDkcO1+D2zOVI7f6OufNHomeVgitE2WORgYAGqNRbzzq112t5oJ3NJHT/uTg4mjvCi7FkHVFdoiNjJJT05XsJuZ1BSNqFsUw6MlwoyjpiA84DdfCFOYgAZkC1Hih8kI4E0xUWrPMRhyjjQfVQsyq3i/kEA5WsRed9rtqSx+qlHUMPMqBqlYJbz+lQxcRArEMjU0q4uAkoArwD8f5ZCfZvxzsvyinO5oUYZt2jt0XCxiUW9PyWZUOJrMeZgBjXCqY2uhqBlQuCmaMGEdQ0Ubq1uq2i6GjmJAnoqWG4tLZOIlmQGcrBEKJn0PF6qut5QuSu1po7VJ0BjiKMcqWltZMp40iBi9HfBuiP+LDEv0NI4yp/gzAho3LDEc4c3VXLWYCJtLlvTLqB6MDZIcuDkcSjTCI3LppIcHTuhjThQ3cXEKyB5Ig2p0pVU7jzLasBC1ypWc62hB9Q6lkqDhwxkX8nSUJsA+E3XFxkJTYFWhRWF0+9cOK/UAlL6MaBnti0KwtZHgAxWkaAkRPREuwhmkkOhZhUsY7w41Xst41LTswZc/G6WmaNpkmQaxrSk0rp2U8gE+vNRzVMgBLKjoCWQzINEyzFccZeqOgagEmMqEIYVuGoqReADqALmWOKeG4S2C5kl436sdEey3XFhOpncqNeme9tbAGg4T2erDBWDsBZH/EbnsdOOR1IhyW1/EIjnoFUcOkdm30zGPCrW44KABUSRp5w4OtGFUbDI7EIAYhdy1UziwMtIiTXhgNYaMU/D0eRMGeIOKoECgjyMTJaDjNc9lGCTjBEXKCa5o5jpgBYpKiOxyHSOMUBgWxU4zxX/gEoCbBDEtG9ArdkpEWgLbJKG4UNyOGI8wDjgDEb4wIwz7xC28jnV719y/LUa+Bc9jLMIOvUpX+AaaPJbYCsiaG1YSui7Wu5SlGTNI84PEkjBNMtcZxBzTNJgoGk8mOqWe2LnnjQeLP6ggOaqYmUTu0ZoPS0c5LbW8Y5oLdWj7ZWjqGQwox4RgZqKYYuIG51pN35TnIPBO5PYp/XdHPX0C+ghBXmmdBZ8GgoIz+GFQ/YAXhRMGKchtOe1lT9SxJJzi3KU8QuSEVBc09zyscVuVYsBF+6PUJZMZNwcOWCkoAKPfaGO+VEuaE9KlBLNp85vUwRdJw0CeFafBTVAcaQIwg6TSaTAbwGqaD/kxMs8Pl0XAmFrFRooUOedDWMMqv8A6Gm8+lk0tKOnQUJD/w/YEHMjTdACptvikVTh1n24GxL1NnFViyojY86IN8Z6uAXKcqWOveCEMDLLNsuHoSR6DlIayr1dBtLIzG4xRLZS/Zaxdkd002lrrrD2rucoUjryWcFmZD7ui0IJD8KASeC/1eRX8Uh3KEjzkMHpZSk4GWl2rkpxG4v1E5nUXxLJh6oY+rRC6OJlF70bCWQElDYxJNaUQ3H2C9GOclYEqYJmLkM1DPLIBCYVnCKb3P9zzUugpYEjV3mmg/yWhgqF/IOUqfqN9mnj9OE6yWIdFZKJj3RVWk+d3Roa9I96gDxe/dmBy8KiY7KNGhM242HULEar0h40xQbJTQdxTqgh7AZAQ4ooSqujTmJ/DlLGrgs4UAhy+kAVpzJMeS0CmGMbKW1XGc5SAS9voTlL0nuQrSKTit08QsAdroXTQS60ZLUVGYA7GKwDKm5KQRvF3w0ITcrvH09zfS+sOUkSVfvBWC0iv03eLzNZyz6WCsoyQbGEaXoKgr6+ixyURMUzctd1U362i88r0ZKLm242KD0vlOiqGaZpoEvj+ifEfFIAM2mBKnxfgYHw/PpRRFokm6JligVCJRxcHSrO9LNHQDLXhYaqyWaLQwgZvGhzJNYrhcXvm76cHF1NtUsgE8C2brA0vFREi73tAV8GLBrPAsXIGujsIpKkzYkZZh4lUIWnCd6IqyUHbFOH7cnFbDNcPF9YcjnGdiWi2rvZIJuoddhJPdtcXKBBTRNqy1euesVVtDy5+sN9ClxrADBk/xgGs+JIXH+K+j9a8T4dy9Onf+DKwYgSY7ixDEYpRNPEw5FnOwGFBNHOtKaaOHHcc1DDemY9Bm0a0hI+Aysd/zGPEOwq8hBpUEE9OWHcfBoEzATJPRFIOBG22rIPIPZvdhBjDGJsHwQvSYaAIvgc1WQzaXinVn7UPqwgOV2kUgiHVR4WDDDX/76/HoFUUc4Xg+HaaRgGLyCMiAotADOgZvBaeUJPE0mDpoBrabdNTFFPYEfQp5s163LQ1VNqoaKM2AYiIEsjkOiq53llUXnMZ6EGMCiKvXWjizRNeBViKKQ3OaBWyRHTxNjB0GJH3LYUZzgb6O1r+56BkWActDoxEJCqUZgCAJYGg5MLxsMJgd7CAGHc9CpCNJgJPL/MQybNutJWmMxl5A0mCwmDaonJQy6waSESMK0J8LShpiUbDlEUonXjBE04wOtyfGuoUwFPHJTDVFP5zSoRE4i0SjBhAZDjy5mY1f9PvPAUlHtpFmI0BJMlJnESY+hv+IUjTZYNWwi+IgxulMkqkCywPCRaAmeqcsk8prQQjT6WM+t2Q0xxPf8ynYQQfDYIYTF7NJIOKYAM3u6G4bGI6ig/HmCNiaNJGPRkYyAgOHl27DEd5UlG9Z64mwx/I0SuNJenTSNRINTCUpQfcOJsDUwuneQe9KEhy4hrzYaVmWKUbBpL85m+whQUZ5E9yFCgy5KMCAGwVQGtxymqhK5WAAgmsBYRn0D+LQq9ds5iDRhipgXTUDc4zBGexozmKm1lvH78MpPf7+dQXDPKebCgYACynWGicZUEab4kAHdEPPWu2WUwNVK51508CLtKJhqQ36dzAHNQlHeoBkM8IgypkPBWl21lT3eFnqnhcORz6sm9Nccdureg023VJMV6VmNag/JsbzMy2Jfc+BDTqgkjNcbmNDvInwvw3R0xfx48x5wZOSXzrpC1y9DBA+8Bp0NY4G1/t7lxN/jFMgZdjsCLPEPU1OcZRVa3HBdfTpeD8MPF2FzW2grIvPwnl+Ol4N6gU6u3AMhze1TB1nS4KNtYvjWxRrZe1Yjv4w8IBKFOE0EGwDaCdOQ1QLvYjRO4zUB2uOPdZoQrhCGKKCltZqLg7QoooOZnogB5VbEsKEcOLHI4x/cFuY5a6jM3s6QYO3GKGfylzUzFaaSnGqtjonFlfPuZ0VqdZAmQFpBHpQ2RQx7Hh6ci4s84OEviKXxqjS17Xsr12Dtyp6yH1O+6eCF29G5F6ElViJ+UhQXVCkSEoP/Ml+icA8ifJkDNHbVunA6qsAa73Qw6jYIAGfKJNiP4J1RySqgn4rWgiZQTpHjxGMNkwTHN+N69cwROzCgw9jjF46HftJZrYWoLGoVgTjnhh7NewWu7a92x9PJqfOnDZwtAyi2iDA+TPEGUaoC2YT/EiWe4MpXLbTAuEF5y9gHrOt2KALWHEgxbEcAaMzYL4RRHR1Y9FyllRnEToOLA1BM0MvOLJIJoZqPgi2GLuDwHU2fZRxXl7HqX7noseXIm/Ed8zpdEcoCvto2gWMF4Y1QN8SgMYUNkDASaH97cHgho8ToTFxNgslCQ0eqEuAMoezDGN/5rXq7uoS8pQoLtAoXm+3ETMIGDdIdVJgUnG4u7+HUv1St1sl/tbefmt13WrUwVLZ27wuF9na4iqauJHNQ9ZLS21MjKTgFwhBrR4F0Wg4RBCPMAnTTPZ39xBPWq6uICRA3IpmJ62BZrG8cDE3tLtyzGpbZr2NCp9AZEqMtcCfyObns09hXnlgxc06T5YYgMflTqzS75LW4ztocDNberJx81OsWTjFfsmGDJD0wRFGkZNwG2zEIsNka/CztlKvL0RjtIFlyTT0J+F0hrMjT6ytNdpu5g0Hg63RbIKxHufuO+M0m9NN4nyZpubWcTwEzo2Y2sBC4U/3D3QXx93W8zQKxgNEjc1GO44rTEGjAe84hXc8BpO1BtJSrdnb3tndw1wHHPazBi50LhiD8WzvYD8uikZ70a4vSRqgjq6i4Ji1RbPWJFGDYYED3UswSdH9jWLZrZmzhyUxXoBki3ALOGWVkaNSzrcIV14Hr/9WAc68cn/4Lby6evtlgFBD14XchXr1SrChCdsCAgBXHGOIhhD7EE4SDvZ2ru9ubNB4fxxUEozCoIfktd1Gh0/DgtpiFPbuzs72xvJSd2VtOYwC6uylww1isOrAdkY3Hg0LzBKV1ZphqSvFsm07nI42t3agHThYCUcmYQ0Gg3F/NAY8B5cIDh5OOwAgZdba68fPtRaOS8DctaagNeBI2WEG1ELOj0HFSBdWomMiZvAjadgtc8L/erQc85X4rmk9B5K5fTtad3YN8yoYNiddJh+yKwF6QD5M/e9EfqUqIxIcmmdUoM13HHmTYDwmUA1Tx+NhWQbogscxjigAjAcHCGAaNQTRsoWyvKWOJoPJdLzUbtVbXRhlnD1KY/9zTOPwR+MhNqPbWVRkHakq+oenHk4mQ0KE9ou2BUQapHw0hqk4Vqsp6g2n3mrUFwEO45RWUbJp4oWiYzIz7gnjp8hjsjGOrL2EkTQ5hY3XIlmtmNN7uJk94rfxTXCPj7fqZkmbOZdkrgl8DfjP5GznV8P8AVE/5vQa/BNQLnR9U+mA6l4SOsHQ9ks5a4aAG6epRuFgPNqBG8QIayqN0LnCOEJ9HHgTOjewxJGHGNpStlwL8w50s3nu/seS8Xjj8isYl436GA4NQdYrqxiYDXetubWG7TaAumFzyKoOuKne6pi1BnoBqCsULUootSEFxaE+uCakgaztn+gt1EFPGk4nfhAbCTRpOtGAloBz41CGInwAdzqffMoUj9MFKfe/V9G/duTLt3jnoVGfy/o2yd/5RpZL09XwOuM802BtI5x9yskR7ORkdvoo3RKQyRQz9NHJjlE+IQ49GwwOEuBBkujU7HrNjZB++gEIHe3uUn1pBWB0f2tzOhmij6/Z7aCAud8fRFmuaRoh161Oo9FSbAtJGikGhvvRYE6NjftGhALWBbsQ3r3ABoRRDx63Iuya2QwfzoeYk8/ZPzGNn+vc7Yo+97rfNdHf4we/wcv4WIzb/vHQcHJ1oUSZTo+c7yCsBykgBMSDZepyYk9e82QzWqlHihtjPkKPDpnhxWXGMaNOZf5pjGQISfKonKsMe9+d6eddP35nt/tm754PW/zufcFrP/lb7DN+0ioXJhMK63hm/+MNDvz9ZB7Ych0eAU0DNJkd4CxDUk42MvdO1ibT4LsZcLf85l+lHN5xomc4NeOdMhvFY2e2EIyWQD/NB7CywIldP1sV1pNGf+FLwwHX16gwQ47ufPyVqfnd3/uWbf13WTGoMZgwIi5pZiaYVz9iHDOB0kXMdwNfmfm+OPQt/AQKtgBvlav8Xb6/Wx//PdD6N783nr/wWInHEbebYm6wbycZ3f1pcx/+VybAb/+L3nGi54PNbwtUuSE+MhN3W+q7d/Hr8i6+ffl8F9/5ThM98X6/lejvGMB/l2wO6fvfRZG9XR/9/wHjMXw37cW1bQAAAABJRU5ErkJggg==';
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
const initials=n=>n.split(' ').map(w=>w[0]).filter(Boolean).slice(-2).join('').toUpperCase();
function isBirthday(bd){if(!bd)return false;const t=new Date();const p=bd.split('/');if(p.length<2)return false;return parseInt(p[0])===t.getDate()&&parseInt(p[1])===(t.getMonth()+1);}
function greeting(){const h2=new Date().getHours();if(h2>=5&&h2<11)return'Chào buổi sáng';if(h2>=11&&h2<14)return'Chào buổi trưa';if(h2>=14&&h2<18)return'Chào buổi chiều';if(h2>=18&&h2<23)return'Chào buổi tối';return'Chào đêm khuya';}
const WC={0:['ti-sun','Trời quang','#f8c30f'],1:['ti-cloud','Ít mây','#93c5fd'],2:['ti-cloud','Có mây','#94a3b8'],3:['ti-cloud','Nhiều mây','#64748b'],45:['ti-mist','Sương mù','#94a3b8'],51:['ti-cloud-rain','Mưa phùn','#60a5fa'],61:['ti-cloud-rain','Mưa nhẹ','#60a5fa'],63:['ti-cloud-rain','Mưa','#3b82f6'],65:['ti-cloud-rain','Mưa to','#1d4ed8'],80:['ti-cloud-rain','Mưa rào','#3b82f6'],95:['ti-cloud-storm','Dông','#6d28d9']};
function wInfo(c){return WC[c]||WC[Math.floor(c/10)*10]||WC[0];}

/* ─── Default data ─── */
const DEF_COMPANY={name:'Công ty SCF',intro:'',phone:'',email:'',address:'',website:''};
const DEF_EMPS=[{id:'NV001',name:'Administrator',birthday:'',gender:'male',female:false,dept:'Ban Giám Đốc',role:'admin',username:'admin',password:'@Scf2024!',phone:'',email:'',note:'',updatedBy:'system',updatedAt:'',mustChangePw:true}];
const DEF_MATERIALS=[
  {id:'VT001',code:'VT001',name:'Thùng carton',group:'',unit:'Cái',price:0,note:''},
  {id:'VT002',code:'VT002',name:'Màng PE bọc',group:'',unit:'Cuộn',price:0,note:''},
  {id:'VT003',code:'VT003',name:'Dây đai nhựa',group:'',unit:'Cuộn',price:0,note:''},
];
const DEF_PRODCATS=[
  {id:'DM001',name:'Nhóm sản phẩm A',desc:''},
  {id:'DM002',name:'Nhóm sản phẩm B',desc:''},
];
const DEF_PRODUCTS=[
  {id:'SP001',code:'SP001',name:'Sản phẩm mẫu',catId:'DM001',unit:'Cái',weightPerUnit:0.5,note:'',needsLabel:true,labelPackSize:10,labelMergeSmallRemainder:true},
];
const DEF_CUSTOMERS=[
  {id:'KH001',name:'Khách hàng mẫu',group:'Nhóm khách hàng A',taxCode:'',address:'Hà Nội',note:'',points:[{id:'PT001',name:'Kho chính',address:'123 Đường A, Hà Nội',contact:'Anh Tuấn',phone:'0901234567'}]},
];
// Bảng khu vực độc lập — dùng chung cho nhiều KH/địa điểm
const DEF_AREAS=[
  {id:'AREA_KV',code:'KV',name:'Khu vực KV',note:''},
  {id:'AREA_VP',code:'VP',name:'Khu vực VP',note:''},
  {id:'AREA_BN',code:'BN',name:'Bắc Ninh',note:''},
  {id:'AREA_QV',code:'QV',name:'Quang Vinh',note:''},
  {id:'AREA_ĐT',code:'ĐT',name:'Điềm Thụy',note:''},
  {id:'AREA_SSTN',code:'SS TN',name:'Samsung Thái Nguyên',note:''},
  {id:'AREA_YP',code:'YP',name:'Yên Phong',note:''},
];
const DEF_PROD_SHIFTS=[
  {id:'PSH01',name:'Ca sáng',location:'',orderTime:'07:00',actualProdTime:'06:00',prodDateOffset:0,tripDateOffset:0,tripShiftId:'',tripShiftName:'',labelPrintTime:'05:30',labelPrintDateOffset:0,startTime:'07:00',endTime:'11:00',color:'#FFF8E1',textColor:'#E65100',active:true},
  {id:'PSH02',name:'Ca chiều',location:'',orderTime:'12:00',actualProdTime:'11:00',prodDateOffset:0,tripDateOffset:0,tripShiftId:'',tripShiftName:'',labelPrintTime:'10:30',labelPrintDateOffset:0,startTime:'12:00',endTime:'17:00',color:'#FEF3C7',textColor:'#92400E',active:true},
  {id:'PSH03',name:'Ca đêm',location:'',orderTime:'00:00',actualProdTime:'22:00',prodDateOffset:-1,tripDateOffset:-1,tripShiftId:'',tripShiftName:'',labelPrintTime:'21:30',labelPrintDateOffset:-1,startTime:'00:00',endTime:'06:00',color:'#EDE7F6',textColor:'#4527A0',active:true},
];
const DEF_PROD_SHIFT_RULES=[
  {id:'N_EARLY',group:'Ca đêm',name:'Ca đêm sớm',start:'23:00',end:'02:30',color:'#EDE7F6',textColor:'#4527A0',active:true},
  {id:'N_LATE',group:'Ca đêm',name:'Ca đêm muộn',start:'02:30',end:'06:00',color:'#EDE7F6',textColor:'#4527A0',active:true},
  {id:'M_EARLY',group:'Ca sáng',name:'Ca sáng sớm',start:'06:00',end:'09:00',color:'#FFF8E1',textColor:'#E65100',active:true},
  {id:'M_LATE',group:'Ca sáng',name:'Ca sáng muộn',start:'09:00',end:'12:00',color:'#FFF8E1',textColor:'#E65100',active:true},
  {id:'A_EARLY',group:'Ca chiều',name:'Ca chiều sớm',start:'12:00',end:'14:30',color:'#FEF3C7',textColor:'#92400E',active:true},
  {id:'A_LATE',group:'Ca chiều',name:'Ca chiều muộn',start:'14:30',end:'17:00',color:'#FEF3C7',textColor:'#92400E',active:true},
];
const DEF_WORKCATS=[
  {id:'CV001',code:'CV001',name:'Bốc xếp kho',dept:'Kho vận',unit:'Tấn',rate:0,desc:'',duration:'',qualityReq:'',note:''},
  {id:'CV002',code:'CV002',name:'Vận chuyển nội thành',dept:'Lái xe',unit:'Chuyến',rate:0,desc:'',duration:'',qualityReq:'',note:''},
];
const ROLES={admin:'Admin',manager:'Quản lý',staff:'Nhân viên',driver:'Lái xe'};
const RCLS={admin:'chip-admin',manager:'chip-manager',staff:'chip-staff',driver:'chip-driver'};
const DEPTS=['Ban Giám Đốc','Kế toán','Kho vận','Sản xuất','Bán hàng','Mua hàng','Lái xe','Khác'];
const deptCode=(i)=>'BP'+String(i+1).padStart(3,'0');
const DEF_DEPTS=DEPTS.map((d,i)=>({id:'BP'+String(i+1).padStart(3,'0'),code:deptCode(i),name:d,note:''}));
const UNITS=['Cái','Gói','Thùng','Kg','Tấn','Lít','m3','KW','Cuộn','Bộ','Túi','Hộp','Chai','Lọ','Bao'];
const UI_FONT_FAMILY_OPTIONS=[
  {value:"-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",label:'Segoe UI'},
  {value:"Calibri,'Segoe UI',sans-serif",label:'Calibri'},
  {value:"Arial,sans-serif",label:'Arial'},
  {value:"Tahoma,sans-serif",label:'Tahoma'},
  {value:"Verdana,sans-serif",label:'Verdana'},
  {value:"'Trebuchet MS',sans-serif",label:'Trebuchet MS'},
  {value:"Georgia,serif",label:'Georgia'},
  {value:"'Times New Roman',serif",label:'Times New Roman'},
];
const UI_FONT_MODE_OPTIONS=[
  {value:'normal',label:'Bình thường',weight:'400',style:'normal'},
  {value:'bold',label:'Đậm',weight:'700',style:'normal'},
  {value:'italic',label:'In nghiêng',weight:'400',style:'italic'},
  {value:'boldItalic',label:'Đậm nghiêng',weight:'700',style:'italic'},
];
const UI_FONT_SCOPE_OPTIONS=[
  {key:'base',label:'Nội dung chung',note:'Chữ mô tả, thông tin và số liệu chung trên các trang.',sample:'Nội dung hiển thị chung trên màn hình'},
  {key:'form',label:'Ô nhập liệu',note:'Bộ lọc, ô nhập, chọn ngày, chọn danh sách và vùng ghi chú.',sample:'Ô nhập liệu / Bộ lọc / Ghi chú'},
  {key:'menu',label:'Menu điều hướng',note:'Menu trên cùng, thông tin đầu trang và các mục điều hướng.',sample:'Menu / Bán hàng / Cài đặt'},
  {key:'button',label:'Nút chức năng',note:'Nút tạo mới, lưu, cập nhật, xuất hoặc nhập dữ liệu.',sample:'Lưu cài đặt'},
  {key:'table',label:'Nội dung bảng',note:'Dữ liệu trong danh sách đơn hàng, báo cáo và bảng chi tiết.',sample:'LOTTE-HOTEL / 127 / 08:00'},
  {key:'header',label:'Tiêu đề bảng',note:'Tên cột của bảng và các tiêu đề hàng dữ liệu.',sample:'Địa điểm giao / Ngày / Giờ'},
  {key:'badge',label:'Nhãn trạng thái',note:'Badge, số lượng, trạng thái và chip phân quyền.',sample:'Đang hoạt động / Admin'},
];
const DEF_UI_SETTINGS={
  fontFamily:UI_FONT_FAMILY_OPTIONS[0].value,
  scopes:{
    base:{size:14,mode:'normal'},
    form:{size:14,mode:'normal'},
    menu:{size:12,mode:'bold'},
    button:{size:13,mode:'bold'},
    table:{size:13,mode:'normal'},
    header:{size:12,mode:'bold'},
    badge:{size:11,mode:'bold'}
  }
};
const DEF_PRINT_TEMPLATE_SETTINGS={labelTemplates:[],orderTemplates:[]};
const PRINT_TEMPLATE_FIELD_GROUPS=[
  {label:'Thông tin công ty',options:[
    {key:'company.name',label:'Tên công ty'},
    {key:'company.phone',label:'Số điện thoại công ty'},
    {key:'company.email',label:'Email công ty'},
    {key:'company.address',label:'Địa chỉ công ty'},
    {key:'company.website',label:'Website công ty'},
    {key:'company.intro',label:'Giới thiệu công ty'}
  ]},
  {label:'Thông tin đơn hàng',options:[
    {key:'order.id',label:'Mã đơn hàng'},
    {key:'order.customer',label:'Tên khách hàng'},
    {key:'order.customerCode',label:'Mã khách hàng'},
    {key:'order.pointName',label:'Địa điểm giao'},
    {key:'order.address',label:'Địa chỉ giao'},
    {key:'order.area',label:'Khu vực giao'},
    {key:'order.deliveryDate',label:'Ngày giao'},
    {key:'order.deliveryTime',label:'Giờ giao'},
    {key:'order.status',label:'Trạng thái đơn'},
    {key:'order.note',label:'Ghi chú đơn hàng'},
    {key:'order.workOut',label:'Công đi'},
    {key:'order.workReturn',label:'Công về'},
    {key:'order.itemCount',label:'Số dòng sản phẩm'},
    {key:'order.totalWeight',label:'Tổng khối lượng đơn'}
  ]},
  {label:'Thông tin sản xuất / tem / chuyến',options:[
    {key:'plan.shiftName',label:'Tên ca sản xuất'},
    {key:'plan.prodDate',label:'Ngày sản xuất'},
    {key:'plan.prodTime',label:'Giờ sản xuất'},
    {key:'plan.tripDate',label:'Ngày chuyến giao'},
    {key:'plan.tripShiftName',label:'Ca giao hàng'},
    {key:'plan.labelDate',label:'Ngày in tem'},
    {key:'plan.labelTime',label:'Giờ in tem'}
  ]},
  {label:'Thông tin từng tem',options:[
    {key:'label.index',label:'STT tem'},
    {key:'label.count',label:'Tổng số tem'},
    {key:'label.weight',label:'Khối lượng của tem'}
  ]},
  {label:'Thông tin từng dòng sản phẩm',options:[
    {key:'line.index',label:'STT dòng sản phẩm'},
    {key:'line.productCode',label:'Mã sản phẩm'},
    {key:'line.productName',label:'Tên sản phẩm'},
    {key:'line.customerProductCode',label:'Mã SP của khách hàng'},
    {key:'line.customerProductName',label:'Tên SP của khách hàng'},
    {key:'line.unit',label:'Đơn vị tính'},
    {key:'line.qtyOrder',label:'SL đặt'},
    {key:'line.qtyInvoice',label:'SL hóa đơn'},
    {key:'line.qtyDelivered',label:'SL đã giao'},
    {key:'line.weightPerUnit',label:'Khối lượng / đơn vị'},
    {key:'line.totalWeight',label:'Tổng khối lượng dòng'},
    {key:'line.purchasePrice',label:'Giá mua / đơn giá'},
    {key:'line.note',label:'Ghi chú dòng sản phẩm'}
  ]},
  {label:'Thông tin chuyến / lái xe',options:[
    {key:'driver.name',label:'Tên lái xe'},
    {key:'driver.code',label:'Mã lái xe'},
    {key:'trip.id',label:'Mã chuyến'},
    {key:'trip.note',label:'Ghi chú chuyến'}
  ]}
];
const PRINT_TEMPLATE_FIELD_OPTIONS=PRINT_TEMPLATE_FIELD_GROUPS.flatMap(g=>g.options);
const PRINT_TEMPLATE_FIELD_MAP=Object.fromEntries(PRINT_TEMPLATE_FIELD_OPTIONS.map(opt=>[opt.key,opt]));
const PRINT_TEMPLATE_FIELD_ALIASES={
  company:'company.name',companyname:'company.name',congty:'company.name',companyphone:'company.phone',phone:'company.phone',address:'company.address',companyaddress:'company.address',
  orderid:'order.id',madon:'order.id',customer:'order.customer',customername:'order.customer',tenkhachhang:'order.customer',customercode:'order.customerCode',makhachhang:'order.customerCode',
  point:'order.pointName',pointname:'order.pointName',diadiemgiao:'order.pointName',deliverydate:'order.deliveryDate',ngaygiao:'order.deliveryDate',deliverytime:'order.deliveryTime',giogiao:'order.deliveryTime',
  area:'order.area',khuvuc:'order.area',note:'order.note',ghichu:'order.note',status:'order.status',trangthai:'order.status',workout:'order.workOut',workreturn:'order.workReturn',
  shift:'plan.shiftName',cashx:'plan.shiftName',proddate:'plan.prodDate',ngaysx:'plan.prodDate',prodtime:'plan.prodTime',giosx:'plan.prodTime',tripdate:'plan.tripDate',ngaychuyen:'plan.tripDate',
  tripshift:'plan.tripShiftName',cagiaohang:'plan.tripShiftName',labeldate:'plan.labelDate',ngayintem:'plan.labelDate',labeltime:'plan.labelTime',giointem:'plan.labelTime',
  labelindex:'label.index',stttem:'label.index',labelcount:'label.count',tongtem:'label.count',labelweight:'label.weight',temkg:'label.weight',khoiluongtem:'label.weight',
  product:'line.productName',productname:'line.productName',tensp:'line.productName',productcode:'line.productCode',masp:'line.productCode',unit:'line.unit',dvt:'line.unit',
  qty:'line.qtyOrder',qtyorder:'line.qtyOrder',sldat:'line.qtyOrder',qtyinvoice:'line.qtyInvoice',slhoadon:'line.qtyInvoice',qtydelivered:'line.qtyDelivered',sldagiao:'line.qtyDelivered',
  weight:'line.totalWeight',totalkg:'line.totalWeight',kg:'line.totalWeight',lineweight:'line.totalWeight',purchaseprice:'line.purchasePrice',dongia:'line.purchasePrice',
  linenote:'line.note',ghichudong:'line.note',driver:'driver.name',drivername:'driver.name',laixe:'driver.name',tripid:'trip.id',machuyen:'trip.id'
};
function printTemplateFieldLabel(key){return PRINT_TEMPLATE_FIELD_MAP[key]?.label||key||'';}
function normalizeTemplateScopeItems(tpl){
  const fromItems=Array.isArray(tpl?.scopeItems)?tpl.scopeItems:[];
  const idsRaw=Array.isArray(tpl?.scopeIds)?tpl.scopeIds:(tpl?.scopeId?[tpl.scopeId]:[]);
  const namesRaw=Array.isArray(tpl?.scopeNames)?tpl.scopeNames:(tpl?.scopeName?[tpl.scopeName]:[]);
  const map=new Map();
  fromItems.forEach(item=>{
    const id=String(item?.id||'').trim();
    const name=String(item?.name||'').trim();
    if(id||name)map.set(id||name,{id,name:name||id});
  });
  idsRaw.forEach((rawId,idx)=>{
    const id=String(rawId||'').trim();
    const name=String(namesRaw[idx]||'').trim()||id;
    if(id||name)map.set(id||name,{id,name});
  });
  namesRaw.forEach(rawName=>{
    const name=String(rawName||'').trim();
    if(name&&!map.has(name))map.set(name,{id:'',name});
  });
  return [...map.values()].filter(item=>item.id||item.name);
}
function templateScopeList(tpl){
  return normalizeTemplateScopeItems(tpl);
}
function templateScopeLabel(tpl){
  const items=templateScopeList(tpl);
  if(!items.length)return tpl?.scopeName||'';
  if(items.length<=3)return items.map(item=>item.name||item.id).filter(Boolean).join(', ');
  const first=items.slice(0,2).map(item=>item.name||item.id).filter(Boolean).join(', ');
  return first+' +'+(items.length-2)+' mục';
}
function templateScopeCount(tpl){
  return templateScopeList(tpl).length||0;
}
function normalizePrintTemplateSettings(raw){
  const src=raw&&typeof raw==='object'?raw:{};
  const normalizeList=(arr,type)=>Array.isArray(arr)?arr.map((tpl,i)=>{
    const vars=Array.isArray(tpl?.variables)?tpl.variables:[];
    const mappings=Array.isArray(tpl?.mappings)?tpl.mappings:[];
    const scopeItems=normalizeTemplateScopeItems(tpl);
    const scopeIds=scopeItems.map(item=>String(item.id||'').trim()).filter(Boolean);
    const scopeNames=scopeItems.map(item=>String(item.name||item.id||'').trim()).filter(Boolean);
    return {
      id:String(tpl?.id||('TPL'+type+i)),
      type:type,
      scopeId:String(scopeIds[0]||tpl?.scopeId||''),
      scopeName:String(scopeNames[0]||tpl?.scopeName||''),
      scopeIds:scopeIds,
      scopeNames:scopeNames,
      scopeItems:scopeItems,
      fileName:String(tpl?.fileName||''),
      fileSize:Number(tpl?.fileSize||0),
      mimeType:String(tpl?.mimeType||''),
      uploadedAt:String(tpl?.uploadedAt||''),
      fileDataUrl:String(tpl?.fileDataUrl||''),
      sheets:Array.isArray(tpl?.sheets)?tpl.sheets.filter(Boolean).map(String):[],
      variables:vars.map(v=>typeof v==='string'?{name:v,sheets:[],count:1}:{name:String(v?.name||''),sheets:Array.isArray(v?.sheets)?v.sheets.filter(Boolean).map(String):[],count:Math.max(1,Number(v?.count||1))}).filter(v=>v.name),
      mappings:mappings.map(m=>({name:String(m?.name||''),sourceKey:String(m?.sourceKey||''),sourceLabel:String(m?.sourceLabel||printTemplateFieldLabel(m?.sourceKey||'')),note:String(m?.note||'')})).filter(m=>m.name)
    };
  }).filter(tpl=>tpl.scopeIds.length&&tpl.fileName):[];
  return {labelTemplates:normalizeList(src.labelTemplates,'label'),orderTemplates:normalizeList(src.orderTemplates,'order')};
}
function readFileAsDataUrl(file){
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=e=>resolve(String(e.target?.result||''));
    reader.onerror=()=>reject(reader.error||new Error('Không đọc được file.'));
    reader.readAsDataURL(file);
  });
}
function extractTemplateVariablesFromWorkbook(wb){
  const found=new Map();
  const rg=/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g;
  (wb?.SheetNames||[]).forEach(sheetName=>{
    const ws=wb.Sheets[sheetName];
    if(!ws||!ws['!ref'])return;
    const range=XLSX.utils.decode_range(ws['!ref']);
    for(let r=range.s.r;r<=range.e.r;r++){
      for(let c=range.s.c;c<=range.e.c;c++){
        const cell=ws[XLSX.utils.encode_cell({r,c})];
        if(!cell)continue;
        const raw=String(cell.w??cell.v??'');
        if(!raw)continue;
        rg.lastIndex=0;
        let match;
        while((match=rg.exec(raw))){
          const name=String(match[1]||'').trim();
          if(!name)continue;
          const prev=found.get(name)||{name,sheets:new Set(),count:0};
          prev.sheets.add(sheetName);
          prev.count+=1;
          found.set(name,prev);
        }
      }
    }
  });
  return [...found.values()].map(v=>({name:v.name,sheets:[...v.sheets],count:v.count})).sort((a,b)=>a.name.localeCompare(b.name,'vi'));
}
function mergeTemplateVariableMappings(variables,prevMappings){
  const oldMap=new Map((prevMappings||[]).map(item=>[item.name,item]));
  return (variables||[]).map(v=>{
    const old=oldMap.get(v.name)||{};
    return {name:v.name,sourceKey:String(old.sourceKey||''),sourceLabel:String(old.sourceLabel||printTemplateFieldLabel(old.sourceKey||'')),note:String(old.note||'')};
  });
}
function guessPrintTemplateFieldKey(variableName){
  const key=String(variableName||'').toLowerCase().replace(/[^a-z0-9]/g,'');
  if(!key)return'';
  if(PRINT_TEMPLATE_FIELD_MAP[variableName])return variableName;
  return PRINT_TEMPLATE_FIELD_ALIASES[key]||'';
}
function templateBookType(fileName){
  const ext=String(fileName||'').split('.').pop().toLowerCase();
  if(ext==='xlsm')return'xlsm';
  if(ext==='xls')return'xls';
  return'xlsx';
}
function templateOutputExt(fileName){
  const ext=String(fileName||'').split('.').pop().toLowerCase();
  return ['xlsx','xlsm','xls'].includes(ext)?ext:'xlsx';
}
function cloneTemplateSheet(ws){
  const out={};
  Object.keys(ws||{}).forEach(k=>{
    const val=ws[k];
    if(val&&typeof val==='object'){
      try{out[k]=JSON.parse(JSON.stringify(val));}
      catch{out[k]=Array.isArray(val)?val.slice():{...val};}
    }else out[k]=val;
  });
  return out;
}
function uniqueTemplateSheetName(existingNames,baseName){
  const clean=String(baseName||'Sheet').replace(/[\\\/\?\*\[\]:]/g,' ').replace(/\s+/g,' ').trim()||'Sheet';
  let name=clean.slice(0,31);
  let i=1;
  while(existingNames.includes(name)){
    const suffix='_'+i++;
    name=(clean.slice(0,Math.max(1,31-suffix.length))+suffix).slice(0,31);
  }
  return name;
}
function normalizeTemplateScalar(value){
  if(value===null||value===undefined)return'';
  if(typeof value==='number'){
    if(!Number.isFinite(value))return'';
    return Number.isInteger(value)?String(value):String(Number(value.toFixed(3)));
  }
  if(typeof value==='boolean')return value?'TRUE':'FALSE';
  return String(value);
}
function templateFieldKeyForVariable(template,varName){
  const mapped=(template?.mappings||[]).find(m=>m.name===varName&&m.sourceKey);
  return mapped?.sourceKey||guessPrintTemplateFieldKey(varName)||String(varName||'');
}
function templateUsesMappedPrefix(template,prefix){
  const p=String(prefix||'');
  const names=(template?.variables||[]).map(v=>typeof v==='string'?v:v?.name).filter(Boolean);
  return names.some(name=>String(templateFieldKeyForVariable(template,name)||'').startsWith(p));
}
function readWorkbookFromTemplateDataUrl(dataUrl){
  const base64=String(dataUrl||'').split(',')[1]||'';
  if(!base64)throw new Error('Template data missing');
  return XLSX.read(base64,{type:'base64',cellDates:true,cellStyles:true,cellNF:true,bookVBA:true});
}
function templateDataUrlToUint8Array(dataUrl){
  const base64=String(dataUrl||'').split(',')[1]||'';
  if(!base64)throw new Error('Template data missing');
  const binary=atob(base64);
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return bytes;
}
function downloadBlobFile(blob,fileName,options){
  const url=URL.createObjectURL(blob);
  const mode=options?.mode||'download';
  if(mode==='open'){
    const a=document.createElement('a');
    a.href=url;
    a.download=fileName||'template.xlsx';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1500);
    return url;
  }
  const a=document.createElement('a');
  a.href=url;
  a.download=fileName||'template.xlsx';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1500);
  return url;
}
function templateFieldIsDate(fieldKey){
  return ['order.deliveryDate','plan.prodDate','plan.tripDate','plan.labelDate'].includes(String(fieldKey||''));
}
function templateFieldIsTime(fieldKey){
  return ['order.deliveryTime','plan.prodTime','plan.labelTime'].includes(String(fieldKey||''));
}
function excelDateSerialFromText(value){
  const text=String(value||'').trim();
  const m=text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if(!m)return null;
  const day=Number(m[1]), month=Number(m[2]), year=Number(m[3]);
  const dt=new Date(year,month-1,day);
  if(dt.getFullYear()!==year||dt.getMonth()!==month-1||dt.getDate()!==day)return null;
  return 25569+(dt.getTime()-dt.getTimezoneOffset()*60000)/86400000;
}
function excelTimeSerialFromText(value){
  const text=String(value||'').trim();
  const m=text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if(!m)return null;
  const hh=Number(m[1]), mm=Number(m[2]), ss=Number(m[3]||0);
  if(hh>23||mm>59||ss>59)return null;
  return (hh*3600+mm*60+ss)/86400;
}
function escapeXmlText(value){
  return String(value??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function readSharedStringsFromXml(xmlText){
  if(!xmlText)return [];
  const doc=new DOMParser().parseFromString(xmlText,'application/xml');
  return Array.from(doc.getElementsByTagName('si')).map(si=>
    Array.from(si.childNodes||[]).map(node=>{
      if(node.nodeName==='t')return node.textContent||'';
      if(node.nodeName==='r')return Array.from(node.getElementsByTagName('t')).map(t=>t.textContent||'').join('');
      return '';
    }).join('')
  );
}
function getTemplateCellDisplayText(cellNode,sharedStrings){
  if(!cellNode)return'';
  const type=cellNode.getAttribute('t')||'';
  if(type==='s'){
    const idx=parseInt(cellNode.getElementsByTagName('v')[0]?.textContent||'',10);
    return Number.isFinite(idx)&&idx>=0?String(sharedStrings[idx]||''):'';
  }
  if(type==='inlineStr'){
    return Array.from(cellNode.getElementsByTagName('t')).map(t=>t.textContent||'').join('');
  }
  if(type==='str')return cellNode.getElementsByTagName('v')[0]?.textContent||'';
  const formula=cellNode.getElementsByTagName('f')[0];
  if(formula)return '';
  const v=cellNode.getElementsByTagName('v')[0];
  return v?v.textContent||'':'';
}
function clearTemplateCellChildren(cellNode){
  while(cellNode.firstChild)cellNode.removeChild(cellNode.firstChild);
}
function writeTemplateCellInlineString(cellNode,text){
  const doc=cellNode.ownerDocument;
  const ns=cellNode.namespaceURI||cellNode.ownerDocument.documentElement?.namespaceURI||null;
  clearTemplateCellChildren(cellNode);
  cellNode.setAttribute('t','inlineStr');
  const isNode=ns?doc.createElementNS(ns,'is'):doc.createElement('is');
  const tNode=ns?doc.createElementNS(ns,'t'):doc.createElement('t');
  const value=String(text??'');
  if(/^\s|\s$|\n/.test(value))tNode.setAttributeNS('http://www.w3.org/XML/1998/namespace','xml:space','preserve');
  tNode.textContent=value;
  isNode.appendChild(tNode);
  cellNode.appendChild(isNode);
}
function writeTemplateCellNumber(cellNode,value){
  const doc=cellNode.ownerDocument;
  const ns=cellNode.namespaceURI||cellNode.ownerDocument.documentElement?.namespaceURI||null;
  clearTemplateCellChildren(cellNode);
  cellNode.removeAttribute('t');
  const vNode=ns?doc.createElementNS(ns,'v'):doc.createElement('v');
  vNode.textContent=String(value);
  cellNode.appendChild(vNode);
}
function writeTemplateCellBoolean(cellNode,value){
  const doc=cellNode.ownerDocument;
  const ns=cellNode.namespaceURI||cellNode.ownerDocument.documentElement?.namespaceURI||null;
  clearTemplateCellChildren(cellNode);
  cellNode.setAttribute('t','b');
  const vNode=ns?doc.createElementNS(ns,'v'):doc.createElement('v');
  vNode.textContent=value?'1':'0';
  cellNode.appendChild(vNode);
}
function patchWorkbookCalcProps(xmlText){
  const doc=new DOMParser().parseFromString(xmlText,'application/xml');
  const workbook=doc.getElementsByTagName('workbook')[0];
  if(!workbook)return xmlText;
  let calcPr=doc.getElementsByTagName('calcPr')[0];
  if(!calcPr){
    calcPr=workbook.namespaceURI?doc.createElementNS(workbook.namespaceURI,'calcPr'):doc.createElement('calcPr');
    workbook.appendChild(calcPr);
  }
  calcPr.setAttribute('calcMode','auto');
  calcPr.setAttribute('fullCalcOnLoad','1');
  calcPr.setAttribute('forceFullCalc','1');
  return new XMLSerializer().serializeToString(doc);
}
function templateResolveVarValue(template,vars,bag,varName){
  const fieldKey=templateFieldKeyForVariable(template,varName);
  if(Object.prototype.hasOwnProperty.call(bag||{},fieldKey))return {fieldKey,value:bag[fieldKey]};
  if(Object.prototype.hasOwnProperty.call(bag||{},varName))return {fieldKey,value:bag[varName]};
  if((vars||[]).some(v=>(typeof v==='string'?v:v?.name)===varName))return {fieldKey,value:''};
  return {fieldKey,value:''};
}
function templateTextHasRepeatPlaceholder(template,vars,text){
  const rg=/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g;
  rg.lastIndex=0;
  let match;
  while((match=rg.exec(String(text||'')))){
    const resolved=templateResolveVarValue(template,vars,{},match[1]);
    if(String(resolved.fieldKey||'').startsWith('line.')||String(resolved.fieldKey||'').startsWith('label.'))return true;
  }
  return false;
}
function templateRowHasTotalMarker(texts){
  return (texts||[]).some(text=>{
    const v=String(text||'').trim().toLowerCase();
    return v==='tổng'||v==='tong'||v==='total'||v==='sum'||v==='cộng'||v==='cong';
  });
}
function templateShiftCellRefRow(ref,rowShift){
  const m=String(ref||'').match(/^([A-Z]+)(\d+)$/i);
  if(!m)return String(ref||'');
  return String(m[1]).toUpperCase()+String(Math.max(1,Number(m[2]||1)+rowShift));
}
function templateShiftFormulaRows(formula,rowShift,rowFrom=1){
  return String(formula||'').replace(/(\$?[A-Z]{1,3}\$?)(\d+)/g,(all,col,rowText)=>{
    const row=Number(rowText||0);
    if(!(row>=rowFrom))return all;
    const numMatch=String(all).match(/^(.*?)(\d+)$/);
    if(!numMatch)return all;
    return numMatch[1]+String(Math.max(1,row+rowShift));
  });
}
function templateUpdateRowNode(rowNode,newRowIndex,rowShift){
  rowNode.setAttribute('r',String(newRowIndex));
  Array.from(rowNode.getElementsByTagName('c')).forEach(cellNode=>{
    const ref=cellNode.getAttribute('r');
    if(ref)cellNode.setAttribute('r',templateShiftCellRefRow(ref,rowShift));
    const formulaNode=cellNode.getElementsByTagName('f')[0];
    if(formulaNode&&formulaNode.textContent)formulaNode.textContent=templateShiftFormulaRows(formulaNode.textContent,rowShift,1);
  });
}
function templateFindRepeatBlocks(sheetDoc,sharedStrings,template,vars){
  const sheetData=sheetDoc.getElementsByTagName('sheetData')[0];
  if(!sheetData)return [];
  const rows=Array.from(sheetData.getElementsByTagName('row'));
  const marked=rows.map(rowNode=>{
    const texts=Array.from(rowNode.getElementsByTagName('c')).map(cell=>getTemplateCellDisplayText(cell,sharedStrings)).filter(Boolean);
    const hasRepeat=texts.some(text=>templateTextHasRepeatPlaceholder(template,vars,text));
    const isTotalRow=templateRowHasTotalMarker(texts);
    return {rowNode,rowIndex:Number(rowNode.getAttribute('r')||0),hasRepeat:hasRepeat&&!isTotalRow,isTotalRow};
  }).filter(item=>item.rowIndex>0);
  const blocks=[];
  let current=null;
  marked.forEach(item=>{
    if(item.hasRepeat){
      if(!current||item.rowIndex!==current.endRow+1){
        current={startRow:item.rowIndex,endRow:item.rowIndex,rows:[item.rowNode]};
        blocks.push(current);
      }else{
        current.endRow=item.rowIndex;
        current.rows.push(item.rowNode);
      }
    }else current=null;
  });
  return blocks;
}
function templateRefreshSheetDimension(sheetDoc){
  const dimNode=sheetDoc.getElementsByTagName('dimension')[0];
  if(!dimNode)return;
  const cells=Array.from(sheetDoc.getElementsByTagName('c')).map(cell=>cell.getAttribute('r')).filter(Boolean);
  if(!cells.length)return;
  const decoded=cells.map(ref=>XLSX.utils.decode_cell(ref));
  const minC=Math.min(...decoded.map(x=>x.c));
  const minR=Math.min(...decoded.map(x=>x.r));
  const maxC=Math.max(...decoded.map(x=>x.c));
  const maxR=Math.max(...decoded.map(x=>x.r));
  dimNode.setAttribute('ref',XLSX.utils.encode_range({s:{c:minC,r:minR},e:{c:maxC,r:maxR}}));
}
function templateExpandRepeatBlock(sheetDoc,block,records){
  if(!(records&&records.length>1))return;
  const sheetData=sheetDoc.getElementsByTagName('sheetData')[0];
  if(!sheetData)return;
  const blockSize=block.rows.length;
  const delta=blockSize*(records.length-1);
  const firstRowNode=block.rows[0];
  const fragment=sheetDoc.createDocumentFragment();
  records.forEach((bag,recordIdx)=>{
    block.rows.forEach((srcRow,rowOffset)=>{
      const clone=srcRow.cloneNode(true);
      const newRowIndex=block.startRow+(recordIdx*blockSize)+rowOffset;
      const rowShift=newRowIndex-Number(srcRow.getAttribute('r')||newRowIndex);
      templateUpdateRowNode(clone,newRowIndex,rowShift);
      clone.__scfBag=bag;
      clone.__scfGenerated=true;
      fragment.appendChild(clone);
    });
  });
  sheetData.insertBefore(fragment,firstRowNode);
  block.rows.forEach(row=>row.remove());
  Array.from(sheetData.getElementsByTagName('row')).forEach(rowNode=>{
    if(rowNode.__scfGenerated)return;
    const rowIndex=Number(rowNode.getAttribute('r')||0);
    if(rowIndex>block.endRow){
      templateUpdateRowNode(rowNode,rowIndex+delta,delta);
    }
  });
  const mergeCellsNode=sheetDoc.getElementsByTagName('mergeCells')[0];
  if(mergeCellsNode){
    const merges=Array.from(mergeCellsNode.getElementsByTagName('mergeCell'));
    const nextRefs=[];
    merges.forEach(node=>{
      const ref=node.getAttribute('ref')||'';
      if(!ref)return;
      const range=XLSX.utils.decode_range(ref);
      if(range.s.r+1>=block.startRow&&range.e.r+1<=block.endRow){
        records.forEach((_,recordIdx)=>{
          const shift=recordIdx*blockSize;
          nextRefs.push(XLSX.utils.encode_range({
            s:{c:range.s.c,r:range.s.r+shift},
            e:{c:range.e.c,r:range.e.r+shift}
          }));
        });
      }else if(range.s.r+1>block.endRow){
        nextRefs.push(XLSX.utils.encode_range({
          s:{c:range.s.c,r:range.s.r+delta},
          e:{c:range.e.c,r:range.e.r+delta}
        }));
      }else if(range.e.r+1>=block.startRow&&range.e.r+1>block.endRow){
        nextRefs.push(XLSX.utils.encode_range({
          s:{c:range.s.c,r:range.s.r},
          e:{c:range.e.c,r:range.e.r+delta}
        }));
      }else{
        nextRefs.push(ref);
      }
    });
    while(mergeCellsNode.firstChild)mergeCellsNode.removeChild(mergeCellsNode.firstChild);
    nextRefs.forEach(ref=>{
      const mergeNode=mergeCellsNode.namespaceURI?sheetDoc.createElementNS(mergeCellsNode.namespaceURI,'mergeCell'):sheetDoc.createElement('mergeCell');
      mergeNode.setAttribute('ref',ref);
      mergeCellsNode.appendChild(mergeNode);
    });
    mergeCellsNode.setAttribute('count',String(nextRefs.length));
  }
  templateRefreshSheetDimension(sheetDoc);
}
async function exportWorkbookFromTemplatePreserveOriginal({template,records,filenameBase,openMode}){
  if(typeof JSZip==='undefined')throw new Error('Thiếu JSZip để giữ nguyên định dạng Excel.');
  const ext=templateOutputExt(template?.fileName||'template.xlsx');
  if(!['xlsx','xlsm'].includes(ext))throw new Error('Định dạng này chưa hỗ trợ giữ nguyên format.');
  const zip=await JSZip.loadAsync(templateDataUrlToUint8Array(template?.fileDataUrl||''));
  const sharedPath='xl/sharedStrings.xml';
  const sharedStrings=zip.file(sharedPath)?readSharedStringsFromXml(await zip.file(sharedPath).async('string')):[];
  const sheetFiles=Object.keys(zip.files).filter(name=>/^xl\/worksheets\/sheet\d+\.xml$/i.test(name)).sort((a,b)=>a.localeCompare(b,'en'));
  const vars=(template?.variables&&template.variables.length)?template.variables:[];
  const defaultBag=(records&&records.length?records[0]:{})||{};
  const placeholderRg=/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g;
  let expandedRepeatRows=false;
  for(const filePath of sheetFiles){
    const xmlText=await zip.file(filePath).async('string');
    const doc=new DOMParser().parseFromString(xmlText,'application/xml');
    const repeatBlocks=template?.type==='order'&&records?.length>1?templateFindRepeatBlocks(doc,sharedStrings,template,vars):[];
    if(repeatBlocks.length)expandedRepeatRows=true;
    repeatBlocks.slice().sort((a,b)=>b.startRow-a.startRow).forEach(block=>templateExpandRepeatBlock(doc,block,records));
    const cells=Array.from(doc.getElementsByTagName('c'));
    cells.forEach(cellNode=>{
      const rowNode=cellNode.parentNode;
      const bag=rowNode?.__scfBag||defaultBag;
      const rawText=getTemplateCellDisplayText(cellNode,sharedStrings);
      placeholderRg.lastIndex=0;
      if(!rawText||!placeholderRg.test(rawText))return;
      placeholderRg.lastIndex=0;
      const exact=String(rawText).trim().match(/^\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}$/);
      const resolveVar=varName=>templateResolveVarValue(template,vars,bag,varName);
      if(exact){
        const resolved=resolveVar(exact[1]);
        const value=resolved.value;
        if(value===null||value===undefined||value===''){writeTemplateCellInlineString(cellNode,'');return;}
        if(templateFieldIsDate(resolved.fieldKey)){
          const serial=excelDateSerialFromText(value);
          if(serial!=null){writeTemplateCellNumber(cellNode,serial);return;}
        }
        if(templateFieldIsTime(resolved.fieldKey)){
          const serial=excelTimeSerialFromText(value);
          if(serial!=null){writeTemplateCellNumber(cellNode,serial);return;}
        }
        if(typeof value==='number'&&Number.isFinite(value)){writeTemplateCellNumber(cellNode,value);return;}
        if(typeof value==='boolean'){writeTemplateCellBoolean(cellNode,value);return;}
        writeTemplateCellInlineString(cellNode,String(value));
        return;
      }
      placeholderRg.lastIndex=0;
      const replaced=String(rawText).replace(placeholderRg,(_,varName)=>normalizeTemplateScalar(resolveVar(varName).value));
      writeTemplateCellInlineString(cellNode,replaced);
    });
    zip.file(filePath,new XMLSerializer().serializeToString(doc));
  }
  if(template?.type==='order'&&records?.length>1&&!expandedRepeatRows){
    throw new Error('Không tìm thấy dòng mẫu có biến line.* trong file Excel để lặp theo số sản phẩm.');
  }
  const workbookPath='xl/workbook.xml';
  if(zip.file(workbookPath)){
    const workbookXml=await zip.file(workbookPath).async('string');
    zip.file(workbookPath,patchWorkbookCalcProps(workbookXml));
  }
  const finalName=(String(filenameBase||'template_output').replace(/[\\\/:\*\?"<>\|]+/g,'_'))+'.'+ext;
  const blob=await zip.generateAsync({type:'blob',compression:'DEFLATE'});
  downloadBlobFile(blob,finalName,{mode:openMode||'download'});
  return finalName;
}
function replaceTemplatePlaceholdersInSheet(ws,resolveValue){
  const rg=/\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}/g;
  Object.keys(ws||{}).forEach(addr=>{
    if(addr[0]==='!')return;
    const cell=ws[addr];
    if(!cell||cell.f)return;
    const raw=cell.v;
    const text=typeof raw==='string'?raw:String(cell.w??raw??'');
    rg.lastIndex=0;
    if(!text||!rg.test(text))return;
    rg.lastIndex=0;
    const exact=String(text).trim().match(/^\{\{\s*([A-Za-z0-9_.-]+)\s*\}\}$/);
    if(exact){
      const value=resolveValue(exact[1]);
      if(value===null||value===undefined||value===''){
        cell.v='';cell.t='s';delete cell.w;return;
      }
      if(typeof value==='number'&&Number.isFinite(value)){
        cell.v=value;cell.t='n';delete cell.w;return;
      }
      if(typeof value==='boolean'){
        cell.v=value;cell.t='b';delete cell.w;return;
      }
      cell.v=String(value);cell.t='s';delete cell.w;return;
    }
    rg.lastIndex=0;
    cell.v=String(text).replace(rg,(_,varName)=>normalizeTemplateScalar(resolveValue(varName)));
    cell.t='s';
    delete cell.w;
  });
}
function orderLineQtyForTemplate(line){
  return numFmt(line?.qtyProd)||numFmt(line?.qty)||numFmt(line?.quantity)||0;
}
function orderLineWeightForTemplate(line,products){
  const p=(products||[]).find(x=>String(x.id||'')===String(line?.productId||''));
  const unit=String(line?.unit||p?.unit||'').trim().toLowerCase().replace(/[^a-z]/g,'');
  const qty=numFmt(line?.qtyInvoice)||orderLineQtyForTemplate(line);
  if(unit==='kg'||unit==='kgs'||unit==='kilogram'||unit==='kilograms')return qty;
  const wpu=numFmt(p?.weightPerUnit)||numFmt(line?.weightPerUnit)||0;
  return Number((wpu*qty).toFixed(3));
}
function calcOrderWeightForTemplate(order,products){
  return Number(((order?.lines||[]).reduce((sum,line)=>sum+orderLineWeightForTemplate(line,products),0)).toFixed(3));
}
function findCustomerForOrderTemplate(order,customers){
  const byId=String(order?.customerId||order?.custId||'').trim();
  const byName=normalizeLookupText(order?.customer||'');
  return (customers||[]).find(c=>byId&&String(c.id||'').trim()===byId)
    ||(customers||[]).find(c=>byName&&normalizeLookupText(c.name||'')===byName)
    ||null;
}
function findPointForOrderTemplate(order,customers){
  const cust=findCustomerForOrderTemplate(order,customers);
  const pointId=String(order?.pointId||order?.ptId||'').trim();
  const pointName=normalizeLookupText(order?.pointName||'');
  const fromCust=(cust?.points||[]).find(p=>pointId&&String(p.id||'').trim()===pointId)
    ||(cust?.points||[]).find(p=>pointName&&normalizeLookupText(p.name||'')===pointName);
  if(fromCust)return fromCust;
  let found=null;
  (customers||[]).forEach(c=>(c.points||[]).forEach(p=>{
    if(found)return;
    if((pointId&&String(p.id||'').trim()===pointId)||(pointName&&normalizeLookupText(p.name||'')===pointName))found={...p,customerId:c.id,customerName:c.name};
  }));
  return found;
}
function findTripForOrderTemplate(order,trips){
  const tripId=String(order?.tripId||'').trim();
  return (trips||[]).find(t=>tripId&&String(t.id||'').trim()===tripId)||null;
}
function findOrderTemplateForOrder(order,orderTemplates,customers){
  const customer=findCustomerForOrderTemplate(order,customers);
  const custId=String(order?.customerId||customer?.id||'').trim();
  const custName=normalizeLookupText(order?.customer||customer?.name||'');
  const matches=(orderTemplates||[]).filter(t=>{
    const scopes=templateScopeList(t);
    return scopes.some(scope=>(custId&&String(scope.id||'').trim()===custId)||(custName&&normalizeLookupText(scope.name||'')===custName));
  });
  return matches.sort((a,b)=>templateScopeCount(a)-templateScopeCount(b))[0]||null;
}
function findLabelTemplateForLine(line,labelTemplates,products){
  const product=(products||[]).find(p=>String(p.id||'')===String(line?.productId||''))||null;
  const prodId=String(line?.productId||product?.id||'').trim();
  const prodName=normalizeLookupText(line?.productName||product?.name||'');
  const matches=(labelTemplates||[]).filter(t=>{
    const scopes=templateScopeList(t);
    return scopes.some(scope=>(prodId&&String(scope.id||'').trim()===prodId)||(prodName&&normalizeLookupText(scope.name||'')===prodName));
  });
  return matches.sort((a,b)=>templateScopeCount(a)-templateScopeCount(b))[0]||null;
}
function buildTemplateValueBag({company,order,line,lineIndex,plan,products,customers,trips,labelMeta}){
  const co=company||{};
  const customer=findCustomerForOrderTemplate(order,customers);
  const point=findPointForOrderTemplate(order,customers);
  const trip=findTripForOrderTemplate(order,trips);
  const product=line?(products||[]).find(p=>String(p.id||'')===String(line.productId||'')):null;
  const orderLines=(order?.lines||[]).filter(l=>l&&(l.productId||l.productName||numFmt(l.qtyProd)||numFmt(l.qtyInvoice)));
  const qtyOrder=line?orderLineQtyForTemplate(line):0;
  const qtyInvoice=line?numFmt(line.qtyInvoice):0;
  const qtyDelivered=line?numFmt(line.qtyDelivered):0;
  const lineWeight=labelMeta?.weight!=null?numFmt(labelMeta.weight):orderLineWeightForTemplate(line,products);
  const tripDate=plan?.tripDate||getOrderTripDate(order,window.__SCF_PROD_SHIFTS||[]);
  const tripShiftName=plan?.tripShiftName||trip?.shiftName||getOrderTripShiftName(order,window.__SCF_PROD_SHIFTS||[]);
  return {
    'company.name':co.name||'',
    'company.phone':co.phone||'',
    'company.email':co.email||'',
    'company.address':co.address||'',
    'company.website':co.website||'',
    'company.intro':co.intro||'',
    'order.id':order?.id||order?.orderId||'',
    'order.customer':order?.customer||customer?.name||'',
    'order.customerCode':customer?.code||order?.customerCode||order?.customerId||'',
    'order.pointName':order?.pointName||point?.name||'',
    'order.address':order?.address||point?.address||'',
    'order.area':order?.area||point?.area||'',
    'order.deliveryDate':order?.deliveryDate||'',
    'order.deliveryTime':normalizeTimeInput(order?.deliveryTime||''),
    'order.status':order?.status||'',
    'order.note':order?.note||'',
    'order.workOut':numFmt(order?.workOut),
    'order.workReturn':numFmt(order?.workReturn),
    'order.itemCount':orderLines.length,
    'order.totalWeight':calcOrderWeightForTemplate(order,products),
    'plan.shiftName':plan?.shift?.name||'',
    'plan.prodDate':plan?.prodDate||'',
    'plan.prodTime':plan?.prodTime||'',
    'plan.tripDate':tripDate||'',
    'plan.tripShiftName':tripShiftName||'',
    'plan.labelDate':plan?.labelDate||'',
    'plan.labelTime':plan?.labelTime||'',
    'label.index':numFmt(labelMeta?.index),
    'label.count':numFmt(labelMeta?.count),
    'label.weight':numFmt(labelMeta?.weight),
    'line.index':Number(lineIndex||0)+1,
    'line.productCode':line?.productId||product?.code||'',
    'line.productName':line?.productName||product?.name||'',
    'line.customerProductCode':line?.customerProductCode||line?.customerCode||'',
    'line.customerProductName':line?.customerProductName||'',
    'line.unit':line?.unit||product?.unit||'',
    'line.qtyOrder':qtyOrder,
    'line.qtyInvoice':qtyInvoice,
    'line.qtyDelivered':qtyDelivered,
    'line.weightPerUnit':numFmt(line?.weightPerUnit)||numFmt(product?.weightPerUnit),
    'line.totalWeight':lineWeight,
    'line.purchasePrice':numFmt(line?.price)||numFmt(line?.salePrice)||numFmt(product?.price),
    'line.note':line?.note||'',
    'driver.name':trip?.driverName||order?.driverName||'',
    'driver.code':trip?.driverId||order?.driverId||'',
    'trip.id':trip?.id||order?.tripId||'',
    'trip.note':trip?.note||order?.tripNote||''
  };
}
async function exportWorkbookFromTemplate({template,records,filenameBase,openMode}){
  const items=(records&&records.length)?records:[{}];
  const ext=templateOutputExt(template?.fileName||'template.xlsx');
  const canPreserveMultiLine=template?.type==='order'&&items.length>1&&(templateUsesMappedPrefix(template,'line.')||templateUsesMappedPrefix(template,'label.'));
  if(template?.fileDataUrl&&(items.length===1||canPreserveMultiLine)&&['xlsx','xlsm'].includes(ext)){
    try{
      return await exportWorkbookFromTemplatePreserveOriginal({template,records:items,filenameBase,openMode});
    }catch(err){
      console.warn('Preserve original Excel formatting failed, fallback to rebuild workbook.',err);
    }
  }
  const src=readWorkbookFromTemplateDataUrl(template?.fileDataUrl||'');
  const out=XLSX.utils.book_new();
  if(src.Props)out.Props=JSON.parse(JSON.stringify(src.Props));
  if(src.Custprops)out.Custprops=JSON.parse(JSON.stringify(src.Custprops));
  if(src.Workbook){
    out.Workbook={};
    if(src.Workbook.WBProps)out.Workbook.WBProps=JSON.parse(JSON.stringify(src.Workbook.WBProps));
    if(src.Workbook.Views)out.Workbook.Views=JSON.parse(JSON.stringify(src.Workbook.Views));
    if(src.Workbook.CalcPr)out.Workbook.CalcPr=JSON.parse(JSON.stringify(src.Workbook.CalcPr));
  }
  if(src.vbaraw)out.vbaraw=src.vbaraw;
  const vars=(template?.variables&&template.variables.length)?template.variables:extractTemplateVariablesFromWorkbook(src);
  const sheetNames=src.SheetNames||[];
  items.forEach((bag,idx)=>{
    sheetNames.forEach(sheetName=>{
      const ws=cloneTemplateSheet(src.Sheets[sheetName]);
      replaceTemplatePlaceholdersInSheet(ws,varName=>{
        const fieldKey=templateFieldKeyForVariable(template,varName);
        if(Object.prototype.hasOwnProperty.call(bag,fieldKey))return bag[fieldKey];
        if(Object.prototype.hasOwnProperty.call(bag,varName))return bag[varName];
        if(vars.some(v=>(typeof v==='string'?v:v?.name)===varName))return '';
        return '';
      });
      const targetName=items.length===1
        ?uniqueTemplateSheetName(out.SheetNames||[],sheetName)
        :uniqueTemplateSheetName(out.SheetNames||[],String(idx+1).padStart(2,'0')+'_'+sheetName);
      XLSX.utils.book_append_sheet(out,ws,targetName);
    });
  });
  const finalName=(String(filenameBase||'template_output').replace(/[\\\/:\*\?"<>\|]+/g,'_'))+'.'+ext;
  const wbArray=XLSX.write(out,{bookType:templateBookType(template?.fileName||finalName),type:'array',compression:true});
  const blob=new Blob([wbArray],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  downloadBlobFile(blob,finalName,{mode:openMode||'download'});
  return finalName;
}
function fontModeMeta(mode){return UI_FONT_MODE_OPTIONS.find(x=>x.value===mode)||UI_FONT_MODE_OPTIONS[0];}
function fontFamilyLabel(value){return(UI_FONT_FAMILY_OPTIONS.find(x=>x.value===value)||UI_FONT_FAMILY_OPTIONS[0]).label;}
function inferLabelPackRuleByName(name){
  const n=String(name||'').toUpperCase();
  if(n.includes('PHỞ')||n.includes('PHO'))return {pack:5,mergeSmallRemainder:false};
  if(n.includes('BÚN')||n.includes('BUN')||n.includes('BÁNH CUỐN')||n.includes('BANH CUON'))return {pack:10,mergeSmallRemainder:false};
  return {pack:10,mergeSmallRemainder:true};
}
function resolveProductLabelPackRule(product,name){
  const fallback=inferLabelPackRuleByName(name||product?.name||'');
  const explicitPack=numFmt(product?.labelPackSize);
  const hasExplicitMerge=Object.prototype.hasOwnProperty.call(product||{},'labelMergeSmallRemainder');
  const hasExplicitNeedsLabel=Object.prototype.hasOwnProperty.call(product||{},'needsLabel');
  return {
    enabled:hasExplicitNeedsLabel?!!product?.needsLabel:true,
    pack:explicitPack>0?explicitPack:fallback.pack,
    mergeSmallRemainder:hasExplicitMerge?!!product?.labelMergeSmallRemainder:fallback.mergeSmallRemainder
  };
}
function normalizeUiSettings(raw){
  const src=raw||{};
  const next={fontFamily:src.fontFamily||DEF_UI_SETTINGS.fontFamily,scopes:{}};
  if(!UI_FONT_FAMILY_OPTIONS.some(x=>x.value===next.fontFamily)) next.fontFamily=DEF_UI_SETTINGS.fontFamily;
  UI_FONT_SCOPE_OPTIONS.forEach(scope=>{
    const base=DEF_UI_SETTINGS.scopes[scope.key]||{size:14,mode:'normal'};
    const cur=(src.scopes&&src.scopes[scope.key])||{};
    const size=Math.max(10,Math.min(28,Number(cur.size)||base.size));
    const mode=UI_FONT_MODE_OPTIONS.some(x=>x.value===cur.mode)?cur.mode:base.mode;
    next.scopes[scope.key]={size,mode};
  });
  return next;
}
function uiSettingsToCssVars(raw){
  const ui=normalizeUiSettings(raw);
  const vars={'--ui-font-family':ui.fontFamily};
  UI_FONT_SCOPE_OPTIONS.forEach(scope=>{
    const cur=ui.scopes[scope.key];
    const meta=fontModeMeta(cur.mode);
    vars['--ui-'+scope.key+'-size']=cur.size+'px';
    vars['--ui-'+scope.key+'-weight']=meta.weight;
    vars['--ui-'+scope.key+'-style']=meta.style;
  });
  return vars;
}

/* ─── UI base ─── */
function F({label,children}){return h('div',{className:'fl'},h('label',null,label),children)}
function Row({children}){return h('div',{className:'form-actions'},children)}
function Modal({title,lg,onClose,children}){
  return h('div',{className:'overlay',onClick:e=>{if(e.target===e.currentTarget)onClose()}},
    h('div',{className:'modal'+(lg==='xl'?' xl':lg?' wide':''),style:{},onClick:e=>e.stopPropagation()},
      h('div',{className:'mh'},h('h2',null,title),h('button',{className:'mclose',type:'button',onClick:onClose},h('i',{className:'ti ti-x'}))),
      children
    )
  );
}
function SearchBar({value,onChange,placeholder}){
  return h('div',{className:'search-wrap'},
    h('i',{className:'ti ti-search'}),
    h('input',{value,onChange:e=>onChange(e.target.value),placeholder:placeholder||'Tìm kiếm...'})
  );
}
function AddBtn({onClick,label}){
  return h('button',{className:'bp',onClick,'data-scf-action':'write',style:{padding:'7px 14px'}},h('i',{className:'ti ti-plus',style:{fontSize:14}}),label||'Thêm mới');
}
function TableWrap({cols,rows,empty}){
  return h('div',{className:'tw'},
    h('table',null,
      h('thead',null,h('tr',null,...cols.map(c=>h('th',{key:c},c)))),
      h('tbody',null,rows.length?rows:h('tr',null,h('td',{colSpan:cols.length,className:'empty-st'},empty||'Chưa có dữ liệu.')))
    )
  );
}

/* ─── EXCEL helpers ─── */
function xlsxExport(rows,cols,filename){
  const header=cols.map(([,label])=>label);
  const body=rows.map(r=>cols.map(([key])=>r[key]??''));
  const ws=XLSX.utils.aoa_to_sheet([header,...body]);const wb=XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb,ws,'Data');
  XLSX.writeFile(wb,filename+'_'+fmtDate().replace(/\//g,'-')+'.xlsx');
}
function xlsxImport(file,cb){
  const r=new FileReader();
  r.onload=e=>{
    const wb=XLSX.read(e.target.result,{type:'binary',cellDates:true});
    const ws=wb.Sheets[wb.SheetNames[0]];
    cb(XLSX.utils.sheet_to_json(ws,{defval:null,raw:false,cellDates:true}));
  };
  r.readAsBinaryString(file);
}
function ExportBtn({onClick}){return h('button',{onClick,style:{fontSize:12,padding:'6px 12px'}},h('i',{className:'ti ti-file-spreadsheet',style:{fontSize:14}}),'Xuất Excel');}
function ImportBtn({onFile}){
  const ref=useRef();
  return h('span',null,
    h('input',{type:'file',accept:'.xlsx,.xls',ref,style:{display:'none'},onChange:e=>{if(e.target.files[0]){xlsxImport(e.target.files[0],onFile);e.target.value='';}}}),
    h('button',{onClick:()=>ref.current.click(),'data-scf-action':'write',style:{fontSize:12,padding:'6px 12px'}},h('i',{className:'ti ti-upload',style:{fontSize:14}}),'Nhập Excel')
  );
}

/* ─── MATERIALS ─── */
function MaterialForm({mat,onSave,onClose}){
  const[f,sf]=useState(mat||{code:'',name:'',group:'',unit:UNITS[0],price:'',note:''});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const submit=()=>{if(!f.name){window.showToast('Nhập tên nguyên vật liệu!','warn');return;}onSave({...f,id:mat?.id||'VT'+uid(),price:numFmt(f.price)});};
  return h(Modal,{title:mat?'Sửa nguyên vật liệu':'Thêm nguyên vật liệu',onClose},
    h('div',{className:'g2'},
      h(F,{label:'Mã NVL'},h('input',{value:f.code,onChange:e=>s('code',e.target.value),placeholder:'NVL001'})),
      h(F,{label:'Đơn vị tính'},h('select',{value:f.unit,onChange:e=>s('unit',e.target.value)},UNITS.map(u=>h('option',{key:u,value:u},u)))),
    ),
    h('div',{className:'g2'},
      h(F,{label:'Tên nguyên vật liệu *'},h('input',{value:f.name,onChange:e=>s('name',e.target.value),placeholder:'Tên nguyên vật liệu...'})),
      h(F,{label:'Nhóm NVL'},h('input',{value:f.group||'',onChange:e=>s('group',e.target.value),placeholder:'Ví dụ: Bột, gạo, bao bì...'})),
    ),
    h('div',{className:'g2'},
      h(F,{label:'Đơn giá (đ)'},h(NumInput,{value:f.price,onChange:v=>s('price',v)})),
      h(F,{label:'Ghi chú'},h('input',{value:f.note,onChange:e=>s('note',e.target.value)})),
    ),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu'))
  );
}
function MaterialsTab({materials,setMaterials,purchases}){
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[q,sq]=useState('');
  const save=d=>{if(edit)setMaterials(p=>p.map(x=>x.id===edit.id?d:x));else setMaterials(p=>[...p,d]);sm(null);se(null);};
  const del=id=>{window.scfConfirm('Bạn có chắc muốn xóa nguyên vật liệu này?','Xóa nguyên vật liệu',true).then(ok=>{if(ok){setMaterials(p=>p.filter(x=>x.id!==id));window.showToast('Đã xóa nguyên vật liệu','success');}});};
  const COLS=[['code','Mã NVL'],['name','Tên nguyên vật liệu'],['group','Nhóm NVL'],['unit','ĐVT'],['price','Đơn giá'],['note','Ghi chú']];
  const syncNamesFromPurchases=()=>{
    const names=[...new Set((purchases||[]).flatMap(p=>(p.lines||[]).map(l=>String(l.name||'').trim()).filter(Boolean)))];
    if(!names.length){window.showToast('Không có tên nguyên vật liệu từ đơn mua.','warn');return;}
    setMaterials(prev=>{
      const next=[...prev];
      names.forEach((name,idx)=>{
        const pName=name.toLowerCase();
        const found=next.findIndex(x=>String(x.name||'').toLowerCase()===pName||String(x.code||'').toLowerCase()===pName);
        if(found>=0){
          next[found]={...next[found],name};
        }else{
          next.push({id:'VT'+uid(),code:'',name,group:'',unit:'Kg',price:0,note:''});
        }
      });
      return next;
    });
    window.showToast('Đã cập nhật tên từ đơn mua','success');
  };
  const list=materials.filter(x=>!q||String(x.name||'').toLowerCase().includes(q.toLowerCase())||String(x.code||'').toLowerCase().includes(q.toLowerCase())||String(x.group||'').toLowerCase().includes(q.toLowerCase()));
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-tools',style:{fontSize:20}}),'Danh mục nguyên vật liệu'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm nguyên vật liệu...'}),
      h('div',{style:{display:'flex',gap:6}},
        h(ExportBtn,{onClick:()=>xlsxExport(list,COLS,'Nguyen_vat_lieu')}),
        h('button',{onClick:syncNamesFromPurchases,style:{fontSize:12,padding:'6px 12px'}},h('i',{className:'ti ti-refresh',style:{fontSize:14}}),'Cập nhật tên từ đơn mua'),
        h(ImportBtn,{onFile:rows=>{const added=rows.map(r=>({id:'VT'+uid(),code:r['Mã NVL']||r['Mã VT']||'',name:r['Tên nguyên vật liệu']||r['Tên vật tư']||'',group:r['Nhóm NVL']||r['Nhóm']||'',unit:r['ĐVT']||'Cái',price:numFmt(r['Đơn giá']),note:r['Ghi chú']||''})).filter(r=>r.name);setMaterials(p=>[...p,...added]);window.showToast('Đã nhập '+added.length+' nguyên vật liệu','success');}}),
        h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Thêm NVL'})
      )
    ),
    h(TableWrap,{cols:['Mã NVL','Tên nguyên vật liệu','Nhóm NVL','Đơn vị','Đơn giá','Ghi chú',''],empty:'Chưa có nguyên vật liệu nào.',
      rows:list.map(x=>h('tr',{key:x.id},
        h('td',null,h('span',{style:{color:'var(--pri)',fontWeight:500}},x.code||x.id)),
        h('td',null,h('div',{style:{fontWeight:500}},x.name)),
        h('td',null,x.group||'—'),
        h('td',null,h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--tx2)'}},x.unit)),
        h('td',null,moneyFmt(x.price)),
        h('td',null,x.note||'—'),
        h('td',null,h('div',{style:{display:'flex',gap:2}},
          h('button',{className:'bi',onClick:()=>{se(x);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
          h('button',{className:'bi',onClick:()=>del(x.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
        ))
      ))
    }),
    modal==='f'&&h(MaterialForm,{mat:edit,onSave:save,onClose:()=>{sm(null);se(null);}})
  );
}

/* ─── ASSETS ─── */
function AssetForm({asset,onSave,onClose}){
  const[f,sf]=useState(asset||{name:'',purchaseValue:0,currentValue:0,replacementMaterial:''});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const submit=()=>{
    if(!f.name){window.showToast('Nhập tên tài sản!','warn');return;}
    onSave({...f,id:asset?.id||'TS'+uid(),purchaseValue:numFmt(f.purchaseValue),currentValue:numFmt(f.currentValue)});
  };
  return h(Modal,{title:asset?'Sửa tài sản':'Thêm tài sản',onClose},
    h(F,{label:'Tên tài sản *'},h('input',{value:f.name,onChange:e=>s('name',e.target.value),placeholder:'Tên tài sản...'})),
    h('div',{className:'g2'},
      h(F,{label:'Giá trị mua'},h(NumInput,{value:f.purchaseValue,onChange:v=>s('purchaseValue',v)})),
      h(F,{label:'Giá trị hiện tại'},h(NumInput,{value:f.currentValue,onChange:v=>s('currentValue',v)}))
    ),
    h(F,{label:'Vật tư thay thế'},h('input',{value:f.replacementMaterial||'',onChange:e=>s('replacementMaterial',e.target.value),placeholder:'Tên vật tư thay thế...'})),
    h(Row,null,
      h('button',{type:'button',onClick:onClose},'Hủy'),
      h('button',{type:'button',className:'bp',onClick:submit,style:{padding:'8px 20px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu tài sản')
    )
  );
}
function AssetsTab({assets,setAssets}){
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[q,sq]=useState('');
  const save=d=>{if(edit)setAssets(p=>p.map(x=>x.id===edit.id?d:x));else setAssets(p=>[...p,d]);sm(null);se(null);};
  const del=id=>{window.scfConfirm('Bạn có chắc muốn xóa tài sản này?','Xóa tài sản',true).then(ok=>{if(ok){setAssets(p=>p.filter(x=>x.id!==id));window.showToast('Đã xóa tài sản','success');}});};
  const cols=[['stt','Số TT'],['name','Tên tài sản'],['purchaseValue','Giá trị mua'],['currentValue','Giá trị hiện tại'],['replacementMaterial','Vật tư thay thế']];
  const list=(assets||[]).filter(x=>!q||String(x.name||'').toLowerCase().includes(q.toLowerCase())||String(x.replacementMaterial||'').toLowerCase().includes(q.toLowerCase()));
  const exportRows=list.map((x,i)=>({...x,stt:i+1}));
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-building-warehouse',style:{fontSize:20}}),'Danh mục tài sản'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm tài sản...'}),
      h('div',{style:{display:'flex',gap:6}},
        h(ExportBtn,{onClick:()=>xlsxExport(exportRows,cols,'Danh_muc_tai_san')}),
        h(ImportBtn,{onFile:rows=>{
          const added=rows.map(r=>({id:'TS'+uid(),name:r['Tên tài sản']||'',purchaseValue:numFmt(r['Giá trị mua']),currentValue:numFmt(r['Giá trị hiện tại']),replacementMaterial:r['Vật tư thay thế']||''})).filter(r=>r.name);
          setAssets(p=>[...p,...added]);
          window.showToast('Đã nhập '+added.length+' tài sản','success');
        }}),
        h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Thêm tài sản'})
      )
    ),
    h(TableWrap,{cols:['Số TT','Tên tài sản','Giá trị mua','Giá trị hiện tại','Vật tư thay thế',''],empty:'Chưa có tài sản nào.',
      rows:list.map((x,i)=>h('tr',{key:x.id},
        h('td',null,i+1),
        h('td',null,h('div',{style:{fontWeight:500}},x.name)),
        h('td',null,moneyFmt(x.purchaseValue)),
        h('td',null,moneyFmt(x.currentValue)),
        h('td',null,x.replacementMaterial||'—'),
        h('td',null,h('div',{style:{display:'flex',gap:2}},
          h('button',{className:'bi',onClick:()=>{se(x);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
          h('button',{className:'bi',onClick:()=>del(x.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
        ))
      ))
    }),
    modal==='f'&&h(AssetForm,{asset:edit,onSave:save,onClose:()=>{sm(null);se(null);}})
  );
}

/* ─── PRODUCT CATEGORIES ─── */
function ProdCatForm({cat,onSave,onClose}){
  const[f,sf]=useState(cat||{name:'',desc:''});
  const submit=()=>{if(!f.name){window.showToast('Nhập tên danh mục!','warn');return;}onSave({...f,id:cat?.id||'DM'+uid()});};
  return h(Modal,{title:cat?'Sửa danh mục':'Thêm danh mục sản phẩm',onClose},
    h(F,{label:'Tên danh mục *'},h('input',{value:f.name,onChange:e=>sf(p=>({...p,name:e.target.value})),placeholder:'Nhóm sản phẩm A...'})),
    h(F,{label:'Mô tả'},h('textarea',{value:f.desc,onChange:e=>sf(p=>({...p,desc:e.target.value})),rows:2})),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'}},'Lưu danh mục'))
  );
}

/* ─── PRODUCTS ─── */
function ProductForm({prod,prodCats,onSave,onClose}){
  const baseRule=resolveProductLabelPackRule(prod,prod?.name);
  const[f,sf]=useState({...{code:'',name:'',catId:prodCats[0]?.id||'',unit:'Cái',weightPerUnit:'',note:'',custCode:'',custName:'',needsLabel:baseRule.enabled,labelPackSize:baseRule.pack,labelMergeSmallRemainder:baseRule.mergeSmallRemainder},...(prod||{})});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const needWeight=!['Kg','Tấn','Lít'].includes(f.unit);
  const submit=()=>{
    if(!f.name){window.showToast('Nhập tên sản phẩm!','warn');return;}
    onSave({
      ...f,
      id:prod?.id||'SP'+uid(),
      weightPerUnit:f.weightPerUnit?numFmt(f.weightPerUnit):0,
      needsLabel:!!f.needsLabel,
      labelPackSize:f.needsLabel&&f.labelPackSize?numFmt(f.labelPackSize):0,
      labelMergeSmallRemainder:!!f.labelMergeSmallRemainder
    });
  };
  return h(Modal,{title:prod?'Sửa sản phẩm':'Thêm sản phẩm',onClose},
    h('div',{className:'g2'},
      h(F,{label:'Mã sản phẩm'},h('input',{value:f.code,onChange:e=>s('code',e.target.value),placeholder:'SP001'})),
      h(F,{label:'Danh mục'},h('select',{value:f.catId,onChange:e=>s('catId',e.target.value)},
        h('option',{value:''},'— Chọn danh mục —'),
        prodCats.map(c=>h('option',{key:c.id,value:c.id},c.name))
      )),
    ),
    h(F,{label:'Tên sản phẩm *'},h('input',{value:f.name,onChange:e=>s('name',e.target.value),placeholder:'Tên sản phẩm...'})),
    h('div',{className:needWeight?'g2':''},
      h(F,{label:'Đơn vị tính (ĐVT)'},h('select',{value:f.unit,onChange:e=>s('unit',e.target.value)},UNITS.map(u=>h('option',{key:u,value:u},u)))),
      needWeight&&h(F,{label:'KL/'+f.unit+' (kg)'},h('input',{type:'number',min:0,step:.001,value:f.weightPerUnit,onChange:e=>s('weightPerUnit',e.target.value),placeholder:'0.000'}))
    ),
    h(F,{label:'Màu highlight'},h('div',{style:{display:'flex',gap:6,padding:'4px 0'}},h('span',{title:'Không màu',onClick:()=>s('color',''),style:{display:'inline-block',width:26,height:26,borderRadius:4,background:'#ffffff',border:'3px solid '+(f.color===''?'var(--pri)':'#ddd'),cursor:'pointer',boxSizing:'border-box'}}),h('span',{title:'Vàng',onClick:()=>s('color','#FFF9C4'),style:{display:'inline-block',width:26,height:26,borderRadius:4,background:'#FFF9C4',border:'3px solid '+(f.color==='#FFF9C4'?'var(--pri)':'#ddd'),cursor:'pointer',boxSizing:'border-box'}}),h('span',{title:'Xanh lá',onClick:()=>s('color','#EAF3DE'),style:{display:'inline-block',width:26,height:26,borderRadius:4,background:'#EAF3DE',border:'3px solid '+(f.color==='#EAF3DE'?'var(--pri)':'#ddd'),cursor:'pointer',boxSizing:'border-box'}}),h('span',{title:'Xanh dương',onClick:()=>s('color','#E6F1FB'),style:{display:'inline-block',width:26,height:26,borderRadius:4,background:'#E6F1FB',border:'3px solid '+(f.color==='#E6F1FB'?'var(--pri)':'#ddd'),cursor:'pointer',boxSizing:'border-box'}}),h('span',{title:'Đỏ',onClick:()=>s('color','#FCEBEB'),style:{display:'inline-block',width:26,height:26,borderRadius:4,background:'#FCEBEB',border:'3px solid '+(f.color==='#FCEBEB'?'var(--pri)':'#ddd'),cursor:'pointer',boxSizing:'border-box'}}),h('span',{title:'Tím',onClick:()=>s('color','#F3E8FF'),style:{display:'inline-block',width:26,height:26,borderRadius:4,background:'#F3E8FF',border:'3px solid '+(f.color==='#F3E8FF'?'var(--pri)':'#ddd'),cursor:'pointer',boxSizing:'border-box'}}),h('span',{title:'Cam',onClick:()=>s('color','#FEE2E2'),style:{display:'inline-block',width:26,height:26,borderRadius:4,background:'#FEE2E2',border:'3px solid '+(f.color==='#FEE2E2'?'var(--pri)':'#ddd'),cursor:'pointer',boxSizing:'border-box'}}))),
    h(F,{label:'Ghi chú'},h('textarea',{value:f.note,onChange:e=>s('note',e.target.value),rows:2})),
    h('div',{className:'divider'}),
    h('div',{style:{fontSize:12,color:'var(--tx2)',fontWeight:600,marginBottom:6}},
      h('i',{className:'ti ti-tag',style:{marginRight:4}}),'Quy tắc tách tem cho sản phẩm này'
    ),
    h(F,{label:'Sản phẩm này có cần in tem không?'},h('div',{style:{display:'flex',gap:8,flexWrap:'wrap'}},
      h('button',{type:'button',onClick:()=>s('needsLabel',true),style:{padding:'7px 14px',background:f.needsLabel?'var(--pri)':'#fff',color:f.needsLabel?'#fff':'var(--tx)',border:'1px solid '+(f.needsLabel?'var(--pri)':'var(--bd)'),fontWeight:600}},'Có'),
      h('button',{type:'button',onClick:()=>s('needsLabel',false),style:{padding:'7px 14px',background:!f.needsLabel?'#A32D2D':'#fff',color:!f.needsLabel?'#fff':'var(--tx)',border:'1px solid '+(!f.needsLabel?'#A32D2D':'var(--bd)'),fontWeight:600}},'Không')
    )),
    f.needsLabel
      ?h(React.Fragment,null,
        h('div',{className:'g2'},
          h(F,{label:'Kg mỗi tem chuẩn'},h('input',{type:'number',min:0,step:.01,value:f.labelPackSize,onChange:e=>s('labelPackSize',e.target.value),placeholder:'Ví dụ: 10 hoặc 5'})),
          h(F,{label:'Cho gộp phần lẻ nhỏ vào tem cuối'},h('label',{style:{display:'flex',alignItems:'center',gap:8,height:38,padding:'0 4px'}},
            h('input',{type:'checkbox',checked:!!f.labelMergeSmallRemainder,onChange:e=>s('labelMergeSmallRemainder',e.target.checked),style:{width:16,height:16}}),
            h('span',{style:{fontSize:13,color:'var(--tx)'}},'Bật nếu muốn gộp phần lẻ rất nhỏ vào tem cuối')
          ))
        ),
        h('div',{style:{background:'var(--bg2)',padding:'8px 12px',borderRadius:'var(--r)',fontSize:12,color:'var(--tx2)',marginBottom:'.85rem'}},
          'Ví dụ: Bún tươi 57kg, nếu đặt 10kg/tem thì hệ thống sẽ in 5 tem 10kg và 1 tem 7kg.'
        )
      )
      :h('div',{style:{background:'#fff7ed',padding:'8px 12px',borderRadius:'var(--r)',fontSize:12,color:'#9A3412',marginBottom:'.85rem'}},
        'Sản phẩm này được đánh dấu không in tem, nên hệ thống sẽ không cho nhập quy tắc tem và sẽ tự bỏ qua khi bấm in tem.'
      ),
    h('div',{className:'divider'}),
    h('div',{style:{fontSize:12,color:'var(--tx2)',fontWeight:600,marginBottom:6}},h('i',{className:'ti ti-id-badge',style:{marginRight:4}}),'Mã & tên theo khách hàng (dùng khi in đơn)'),
    h('div',{className:'g2'},
      h(F,{label:'Mã SP của KH'},h('input',{value:f.custCode||'',onChange:e=>s('custCode',e.target.value),placeholder:'Mã theo khách hàng...'})),
      h(F,{label:'Tên SP của KH'},h('input',{value:f.custName||'',onChange:e=>s('custName',e.target.value),placeholder:'Tên theo khách hàng...'})),
    ),
    needWeight&&h('div',{style:{background:'var(--bg2)',padding:'8px 12px',borderRadius:'var(--r)',fontSize:12,color:'var(--tx2)',marginBottom:'.85rem'}},
      h('i',{className:'ti ti-info-circle',style:{marginRight:5}}),
      'Nhập khối lượng để tính tổng KL chuyến giao (bỏ trống nếu không cần)'
    ),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu sản phẩm'))
  );
}
function isGoodsProduct(prod,prodCats){
  const cat=prodCats?.find(c=>c.id===prod?.catId);
  const text=((prod?.type||prod?.kind||prod?.code||'')+' '+(cat?.name||'')+' '+(cat?.desc||'')).toLowerCase();
  const plain=text.normalize?text.normalize('NFD').replace(/[\u0300-\u036f]/g,''):text;
  return plain.includes('hang hoa')||plain.includes('hanghoa')||String(prod?.code||'').trim().toUpperCase().startsWith('HH');
}
function ProductsTab({products,setProducts,prodCats,setProdCats}){
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[catModal,scm]=useState(null);const[editCat,sec]=useState(null);const[q,sq]=useState('');const[filterCat,sfc]=useState('all');
  const saveProd=d=>{if(edit)setProducts(p=>p.map(x=>x.id===edit.id?d:x));else setProducts(p=>[...p,d]);sm(null);se(null);};
  const saveCat=d=>{if(editCat)setProdCats(p=>p.map(x=>x.id===editCat.id?d:x));else setProdCats(p=>[...p,d]);scm(null);sec(null);};
  const delProd=id=>{window.scfConfirm('Bạn có chắc muốn xóa sản phẩm này?','Xóa sản phẩm',true).then(ok=>{if(ok){setProducts(p=>p.filter(x=>x.id!==id));window.showToast('Đã xóa sản phẩm','success');}});};
  const delCat=id=>{if(products.some(p=>p.catId===id)){window.showToast('Danh mục này đang có sản phẩm, không thể xóa!','error');return;}window.scfConfirm('Bạn có chắc muốn xóa danh mục này?','Xóa danh mục',true).then(ok=>{if(ok){setProdCats(p=>p.filter(x=>x.id!==id));window.showToast('Đã xóa danh mục','success');}});};
  const COLS=[['code','Mã SP'],['name','Tên SP'],['catName','Danh mục'],['unit','ĐVT'],['weightPerUnit','KL/đơn vị (kg)'],['labelRuleText','Quy tắc tem'],['note','Ghi chú']];
  const[sortProd,setSortProd]=useState('code'); // 'code' | 'name'
  // Hàm sort tự nhiên: TP01 < TP02 < TP10 < HH01 < HH02
  const naturalSort=(a,b)=>{
    const sa=a||'',sb=b||'';
    return sa.localeCompare(sb,'vi',{numeric:true,sensitivity:'base'});
  };
  const list=products
    .filter(x=>(filterCat==='all'||x.catId===filterCat)&&(!q||x.name.toLowerCase().includes(q.toLowerCase())||x.code.toLowerCase().includes(q.toLowerCase())))
    .sort((a,b)=>sortProd==='code'?naturalSort(a.code,b.code):naturalSort(a.name,b.name));
  const exportRows=list.map(x=>{
    const rule=resolveProductLabelPackRule(x,x.name);
    return {...x,catName:prodCats.find(c=>c.id===x.catId)?.name||'',labelRuleText:rule.enabled?(rule.pack+'kg/tem'+(rule.mergeSmallRemainder?' · gộp lẻ nhỏ':' · tách riêng phần lẻ')):'Không in tem'};
  });
  return h('div',null,
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}},
      h('div',{className:'ptitle',style:{margin:0}},h('i',{className:'ti ti-box',style:{fontSize:20}}),'Sản phẩm'),
      h('button',{style:{fontSize:12,padding:'5px 12px'},onClick:()=>{sec(null);scm('f')}},h('i',{className:'ti ti-tags',style:{fontSize:13}}),'Quản lý danh mục')
    ),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},
        h('button',{className:'pill'+(filterCat==='all'?' on':''),onClick:()=>sfc('all')},'Tất cả ('+products.length+')'),
        prodCats.map(c=>h('button',{key:c.id,className:'pill'+(filterCat===c.id?' on':''),onClick:()=>sfc(c.id)},c.name+' ('+products.filter(p=>p.catId===c.id).length+')'))
      ),
      h('div',{style:{display:'flex',gap:6}},
        h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm sản phẩm...'}),
        h('div',{style:{display:'flex',border:'1px solid var(--bd)',borderRadius:'var(--r)',overflow:'hidden',fontSize:12}},
          h('button',{onClick:()=>setSortProd('name'),style:{padding:'5px 10px',background:sortProd==='name'?'var(--pri)':'var(--bg2)',color:sortProd==='name'?'#fff':'var(--tx)',border:'none',cursor:'pointer',fontWeight:sortProd==='name'?600:400}},'Theo tên'),
          h('button',{onClick:()=>setSortProd('code'),style:{padding:'5px 10px',background:sortProd==='code'?'var(--pri)':'var(--bg2)',color:sortProd==='code'?'#fff':'var(--tx)',border:'none',cursor:'pointer',fontWeight:sortProd==='code'?600:400}},'Theo mã')
        ),
        h(ExportBtn,{onClick:()=>xlsxExport(exportRows,COLS,'San_pham')}),
        h(ImportBtn,{onFile:rows=>{
          const added=rows.map(r=>({id:'SP'+uid(),code:r['Mã SP']||'',name:r['Tên SP']||'',catId:prodCats.find(c=>c.name===r['Danh mục'])?.id||'',unit:r['ĐVT']||'Cái',weightPerUnit:numFmt(r['KL/đơn vị (kg)']),needsLabel:!/^(0|false|khong|không|no)$/i.test(String(r['Có in tem không']||r['In tem']||'')),labelPackSize:numFmt(r['Kg mỗi tem chuẩn']||r['Kg/tem']||r['Quy tắc tem (kg)']),labelMergeSmallRemainder:/^(1|true|co|có|yes|x)$/i.test(String(r['Gộp lẻ nhỏ']||'')),note:r['Ghi chú']||''})).filter(r=>r.name);
          setProducts(p=>[...p,...added]);window.showToast('Đã nhập '+added.length+' sản phẩm','success');
        }}),
        h('button',{onClick:()=>sm('smart'),style:{padding:'6px 12px',fontSize:12,display:'flex',alignItems:'center',gap:5}},
            h('i',{className:'ti ti-wand',style:{fontSize:14}}),'Nhập từ danh sách'),
        h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Thêm sản phẩm'})
      )
    ),
    modal==='smart'&&h(SmartImportModal,{prodCats,onImport:rows=>{
      const added=rows.map(r=>({id:'SP'+uid(),code:'',name:r.name,catId:'',unit:r.unit,weightPerUnit:0,color:'',needsLabel:true,labelPackSize:0,labelMergeSmallRemainder:false,note:''}));
      setProducts(p=>{
        const names=new Set(p.map(x=>x.name.toLowerCase()+x.unit.toLowerCase()));
        const newOnes=added.filter(x=>!names.has(x.name.toLowerCase()+x.unit.toLowerCase()));
        window.showToast('Đã thêm '+newOnes.length+' sản phẩm mới'+(added.length-newOnes.length>0?' (bỏ qua '+(added.length-newOnes.length)+' trùng)':''),'success');
        return [...p,...newOnes];
      });
    },onClose:()=>sm(null)}),
    h(TableWrap,{cols:['Mã SP','Tên sản phẩm','Danh mục','Đơn vị','Khối lượng/đv','Quy tắc tem','Ghi chú','Mã KH','Tên SP KH',''],empty:'Chưa có sản phẩm nào.',
      rows:list.map(x=>{
        const cat=prodCats.find(c=>c.id===x.catId);
        const needW=x.unit==='Cái'||x.unit==='Gói';
        const labelRule=resolveProductLabelPackRule(x,x.name);
        return h('tr',{key:x.id},
          h('td',null,h('span',{style:{color:'var(--pri)',fontWeight:500}},x.code||x.id)),
          h('td',null,h('div',{style:{fontWeight:500}},x.name),x.note&&h('div',{style:{fontSize:11,color:'var(--tx2)'}},x.note)),
          h('td',null,cat?h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--tx)'}},cat.name):'—'),
          h('td',null,h('span',{className:'badge',style:{background:'#E6F1FB',color:'#185FA5'}},x.unit)),
          h('td',null,needW&&x.weightPerUnit?x.weightPerUnit+' kg/'+x.unit:'—'),
          h('td',null,
            labelRule.enabled
              ?h(React.Fragment,null,
                h('div',{style:{fontSize:12,fontWeight:600,color:'var(--pri3)'}},labelRule.pack+'kg/tem'),
                h('div',{style:{fontSize:11,color:'var(--tx2)'}},labelRule.mergeSmallRemainder?'Gộp lẻ nhỏ':'Tách riêng phần lẻ')
              )
              :h('span',{className:'badge',style:{background:'#fef2f2',color:'#b91c1c'}},'Không in tem')
          ),
          h('td',null,x.note||'—'),
          h('td',null,h('span',{style:{color:'var(--pri)',fontWeight:500,fontSize:12}},x.custCode||'—')),
          h('td',null,h('span',{style:{fontSize:12}},x.custName||'—')),
          h('td',null,h('div',{style:{display:'flex',gap:2}},
            h('button',{className:'bi',onClick:()=>{se(x);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
            h('button',{className:'bi',onClick:()=>delProd(x.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
          ))
        );
      })
    }),
    modal==='f'&&h(ProductForm,{prod:edit,prodCats,onSave:saveProd,onClose:()=>{sm(null);se(null);}}),
    catModal==='f'&&h(Modal,{title:'Quản lý danh mục sản phẩm',onClose:()=>{scm(null);sec(null);},lg:true},
      h('div',{style:{display:'flex',justifyContent:'flex-end',marginBottom:'1rem'}},
        h(AddBtn,{onClick:()=>{sec(null);},label:'Thêm danh mục'})
      ),
      editCat===null&&h(ProdCatForm,{cat:undefined,onSave:saveCat,onClose:()=>scm(null)}),
      h('hr',{className:'divider'}),
      prodCats.map(c=>h('div',{key:c.id,style:{display:'flex',alignItems:'center',gap:10,padding:'8px 0',borderBottom:'.5px solid var(--bd)'}},
        h('i',{className:'ti ti-tag',style:{fontSize:16,color:'var(--pri)'}}),
        h('div',{style:{flex:1}},h('div',{style:{fontWeight:500}},c.name),c.desc&&h('div',{style:{fontSize:12,color:'var(--tx2)'}},c.desc)),
        h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--tx2)'}},products.filter(p=>p.catId===c.id).length+' SP'),
        h('button',{className:'bi',onClick:()=>sec(c)},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
        h('button',{className:'bi',onClick:()=>delCat(c.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
      )),
      editCat&&h(ProdCatForm,{cat:editCat,onSave:saveCat,onClose:()=>sec(null)})
    )
  );
}

/* ─── POINT ROW ─── */
function PointRow({pt,allAreas,onAreaChange,onNameChange,onDelete}){
  const[showNew,setShowNew]=useState(false);
  const[newAreaTxt,setNewAreaTxt]=useState('');
  const normalizeAreaValue=v=>{
    const raw=String(v??'').trim();
    return /^_+custom_+$/i.test(raw)?'':raw;
  };
  // Select uncontrolled - defaultValue set 1 lần khi mount
  // key={pt.id} ở cha giữ nguyên → DOM không bị tạo lại khi list re-render
  const selRef=React.useRef(null);
  // Khi pt.area thay đổi từ bên ngoài (vd sau khi lưu), cập nhật DOM trực tiếp
  React.useEffect(()=>{
    const nextArea=normalizeAreaValue(pt.area);
    if(selRef.current && selRef.current.value!==nextArea){
      selRef.current.value=nextArea||'';
    }
  },[pt.area]);
  const commitNew=()=>{
    const v=newAreaTxt.trim();if(!v)return;
    onAreaChange(pt.id,v);
    if(selRef.current)selRef.current.value=v;
    setShowNew(false);setNewAreaTxt('');
  };
  const cancelNew=()=>{
    onAreaChange(pt.id,curArea);
    if(selRef.current)selRef.current.value=curArea||'';
    setShowNew(false);
    setNewAreaTxt('');
  };
  const curArea=normalizeAreaValue(pt.area);
  const isKnown=allAreas.includes(curArea)||curArea==='';
  return h('div',{className:'ptrow',style:{flexDirection:'column',alignItems:'stretch',gap:4}},
    h('div',{style:{display:'flex',alignItems:'center',gap:8}},
      h('i',{className:'ti ti-map-pin',style:{fontSize:14,color:'var(--pri)',flexShrink:0}}),
      h('input',{value:pt.name,onChange:e=>onNameChange(pt.id,e.target.value),
        style:{flex:1,fontWeight:500,padding:'3px 6px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:13}}),
      showNew
        ? h('div',{style:{display:'flex',gap:4,width:200}},
            h('input',{value:newAreaTxt,autoFocus:true,placeholder:'Tên khu vực mới...',
              onChange:e=>{
                const next=e.target.value;
                setNewAreaTxt(next);
                onAreaChange(pt.id,next.trim());
              },
              onKeyDown:e=>{if(e.key==='Enter')commitNew();if(e.key==='Escape'){setShowNew(false);setNewAreaTxt('');}},
              style:{flex:1,padding:'3px 6px',borderRadius:'var(--r)',border:'1px solid var(--pri)',fontSize:12}}),
            h('button',{className:'bp',onClick:commitNew,style:{padding:'2px 8px',fontSize:12}},
              h('i',{className:'ti ti-check',style:{fontSize:13}})),
            h('button',{onClick:cancelNew,style:{padding:'2px 6px',fontSize:12}},
              h('i',{className:'ti ti-x',style:{fontSize:13}}))
          )
        : h('select',{
            ref:selRef,
            defaultValue:curArea||'',
            onChange:e=>{
              const v=e.target.value;
              if(v==='__new__'){
                setNewAreaTxt(isKnown?'':curArea);
                if(!isKnown&&curArea) onAreaChange(pt.id,curArea);
                setShowNew(true);
                if(selRef.current)selRef.current.value=curArea||'';
                return;
              }
              // Gọi onAreaChange để cập nhật pendingAreas ref ở cha (không re-render)
              onAreaChange(pt.id,v);
            },
            style:{width:130,padding:'3px 6px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12,color:'var(--tx2)'}
          },
            h('option',{value:''},'— Khu vực —'),
            allAreas.map(a=>h('option',{key:a,value:a},a)),
            !isKnown&&curArea&&h('option',{value:curArea},curArea),
            h('option',{value:'__new__',style:{color:'var(--pri)',fontStyle:'italic'}},'+ Thêm khu vực mới...')
          ),
      h('button',{className:'bi',onClick:()=>onDelete(pt.id,pt),style:{color:'#A32D2D',flexShrink:0}},
        h('i',{className:'ti ti-trash',style:{fontSize:14}}))
    ),
    pt.address&&h('div',{style:{fontSize:11,color:'var(--tx2)',paddingLeft:22}},
      pt.address+(pt.contact?' • '+pt.contact+' '+pt.phone:''))
  );
}
function CustomerForm({cust,shifts,customers,orders,areas,onSave,onClose}){
  const normalize=s=>(s||'').trim().toUpperCase().replace(/\s+/g,' ').replace(/[^A-Z0-9\u00C0-\u024F\u1E00-\u1EFF ]/g,'');
  const normalizeAreaValue=v=>{
    const raw=String(v??'').trim();
    return /^_+custom_+$/i.test(raw)?'':raw;
  };
  const dedup=pts=>{
    const map=new Map();
    (pts||[]).forEach(p=>{
      const k=normalize(p.name);
      if(!k)return; // bỏ qua bản không có tên
      if(!map.has(k)){map.set(k,p);}
      else {
        const existing=map.get(k);
        const score=x=>(x.area?3:0)+(x.contact?1:0)+(x.address?1:0)+(x.phone?1:0);
        if(score(p)>score(existing))map.set(k,p);
      }
    });
    return [...map.values()];
  };
  // Dedup theo tên khi load - dọn sạch dữ liệu trùng từ lần trước
  const initPoints=dedup((cust?.points||[]).map(pt=>({...pt,area:normalizeAreaValue(pt.area)})))
    .sort((a,b)=>{const ac=(a.area||'zzz').localeCompare(b.area||'zzz','vi');return ac!==0?ac:(a.name||'').localeCompare(b.name||'','vi');});
  const[f,sf]=useState(cust?{...cust,points:initPoints}:{id:'',code:'',name:'',group:'',taxCode:'',address:'',note:'',points:[]});
  const[np,snp]=useState({name:'',address:'',contact:'',phone:'',area:'',newAreaText:''});
  const[saved,setSaved]=useState(false);
  // pendingAreas: lưu thay đổi khu vực mà KHÔNG trigger re-render
  const pendingAreas=React.useRef(Object.fromEntries(initPoints.map(p=>[p.id,normalizeAreaValue(p.area)||''])));
  const set=(k,v)=>sf(p=>({...p,[k]:v}));
  const addPt=()=>{
    if(!np.name){window.showToast('Nhập tên địa điểm!','warn');return;}
    // Kiểm tra trùng tên
    const norm=s=>(s||'').trim().toLowerCase().replace(/\s+/g,' ');
    const isDupPt=f.points.some(pt=>norm(pt.name)===norm(np.name));
    if(isDupPt){
      window.showToast('⚠ Địa điểm "'+np.name+'" đã có trong danh sách!\nVui lòng kiểm tra lại hoặc dùng tên khác.','info');
      return;
    }
    const newId='PT'+uid();
    const areaVal=normalizeAreaValue(np.area==='__new__'?(np.newAreaText||'').trim():(np.area||''));
    pendingAreas.current[newId]=areaVal;
    sf(p=>({...p,points:[...p.points,{...np,id:newId,area:areaVal}]}));
    snp({name:'',address:'',contact:'',phone:'',area:'',newAreaText:''});
  };
  // onAreaChange: chỉ cập nhật ref, KHÔNG re-render
  const onAreaChange=(id,v)=>{pendingAreas.current[id]=normalizeAreaValue(v);};
  const doSave=(close)=>{
    if(!f.name){window.showToast('Nhập tên khách hàng!','warn');return;}
    const code=(f.code||'').trim().toUpperCase()||'KH'+String(Date.now()).slice(-6);
    const isDup=customers&&customers.some(c=>c.id===code&&c.id!==(cust?.id||''));
    if(isDup){window.showToast('Mã KH "'+code+'" đã tồn tại! Vui lòng dùng mã khác.','error');return;}
    // Merge pendingAreas + dedup + sort theo khu vực → tên
    const seen=new Set();
    const finalPoints=f.points
      .map(pt=>({...pt,area:normalizeAreaValue(pendingAreas.current[pt.id]!==undefined?pendingAreas.current[pt.id]:pt.area)}))
      .filter(pt=>{const k=pt.id+'|'+(pt.name||'').trim().toUpperCase();if(seen.has(k))return false;seen.add(k);return true;})
      .sort((a,b)=>{const ac=(a.area||'zzz').localeCompare(b.area||'zzz','vi');return ac!==0?ac:(a.name||'').localeCompare(b.name||'','vi');});
    // Cập nhật state để UI hiện đúng (khi giữ mở)
    sf(p=>({...p,points:finalPoints}));
    // Cập nhật pendingAreas theo thứ tự mới
    finalPoints.forEach(pt=>{pendingAreas.current[pt.id]=pt.area||'';});
    onSave({...f,id:code,code,points:finalPoints},close);
    if(!close){setSaved(true);setTimeout(()=>setSaved(false),2000);}
  };
  const submit=()=>doSave(true);
  // Shared buttons row
  const BtnRow=()=>h(Row,null,
    h('button',{onClick:onClose},'Hủy'),
    h('button',{
      onClick:()=>doSave(false),
      style:{padding:'8px 16px',display:'flex',alignItems:'center',gap:4,background:saved?'#2d6a4f':'var(--bg2)',color:saved?'#fff':'var(--tx)',border:'1px solid var(--bd)',borderRadius:'var(--r)',cursor:'pointer',fontSize:13,transition:'all .3s'}
    },h('i',{className:'ti ti-'+(saved?'check':'device-floppy'),style:{fontSize:14}}),saved?'Đã lưu!':'Lưu (giữ mở)'),
    h('button',{className:'bp',onClick:()=>doSave(true),style:{padding:'8px 20px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu & Đóng')
  );
  // Add-point form
  const allAreas=(areas&&areas.length>0)?areas.map(a=>a.code).filter(Boolean).sort((a,b)=>a.localeCompare(b,'vi')):[...new Set([...(shifts||[]).map(s=>s.area),...f.points.map(p=>p.area)].filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const AddPtForm=()=>h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:10,marginTop:4}},
    h('div',{style:{fontSize:12,color:'var(--tx2)',fontWeight:500,marginBottom:6}},'Thêm địa điểm mới'),
    h('div',{className:'g2'},
      h(F,{label:'Tên địa điểm *'},h('input',{value:np.name,onChange:e=>snp(p=>({...p,name:e.target.value})),placeholder:'Kho, Văn phòng, Cửa hàng...'})),
      h(F,{label:'Khu vực'},np.area==='__new__'
        ?h('div',{style:{display:'flex',gap:4}},
            h('input',{autoFocus:true,placeholder:'Nhập khu vực mới...',
              onKeyDown:e=>{if(e.key==='Escape')snp(p=>({...p,area:''}));},
              onChange:e=>snp(p=>({...p,newAreaText:e.target.value})),
              value:np.newAreaText||'',
              style:{flex:1,padding:'8px 10px',border:'.5px solid var(--pri)',borderRadius:'var(--r)',fontSize:14}
            }),
            h('button',{onClick:()=>snp(p=>({...p,area:'',newAreaText:''})),style:{padding:'6px 10px'}},h('i',{className:'ti ti-x',style:{fontSize:14}}))
          )
        :h('select',{value:np.area||'',onChange:e=>{if(e.target.value==='__new__')snp(p=>({...p,area:'__new__'}));else snp(p=>({...p,area:e.target.value}));}},
            h('option',{value:''},'— Chọn khu vực —'),
            allAreas.map(a=>h('option',{key:a,value:a},a)),
            h('option',{value:'__new__',style:{color:'var(--pri)',fontStyle:'italic'}},'+ Thêm khu vực mới...')
          )
      ),
      h(F,{label:'Địa chỉ'},h('input',{value:np.address,onChange:e=>snp(p=>({...p,address:e.target.value})),placeholder:'Số nhà, đường...'})),
      h(F,{label:'Người liên hệ'},h('input',{value:np.contact,onChange:e=>snp(p=>({...p,contact:e.target.value})),placeholder:'Tên người nhận'})),
      h(F,{label:'Điện thoại'},h('input',{value:np.phone,onChange:e=>snp(p=>({...p,phone:e.target.value})),placeholder:'090...'})),
    ),
    h('button',{onClick:addPt,style:{fontSize:12,padding:'5px 14px'}},h('i',{className:'ti ti-plus',style:{fontSize:13,marginRight:4}}),'Thêm địa điểm')
  );
  return h(Modal,{title:cust?'Sửa khách hàng':'Thêm khách hàng',onClose,lg:'xl'},
    h('div',{style:{display:'grid',gridTemplateColumns:'340px 1fr',gap:24,alignItems:'start'}},
      // ── Cột trái: thông tin KH + form thêm địa điểm + nút lưu ──
      h('div',{style:{display:'flex',flexDirection:'column',gap:12}},
        h('div',{className:'g3'},
          h(F,{label:'Mã KH (để trống = tự tạo)'},h('input',{value:f.code||f.id||'',onChange:e=>set('code',e.target.value.toUpperCase()),placeholder:'KH001, WELSTORY...',style:{}})),
          h(F,{label:'Tên khách hàng *'},h('input',{value:f.name,onChange:e=>set('name',e.target.value),placeholder:'Tên công ty / cá nhân'})),
          h(F,{label:'Nhóm khách hàng'},h('input',{value:f.group||'',onChange:e=>set('group',e.target.value),placeholder:'Nhóm A, Siêu thị, Đại lý...'})),
          h(F,{label:'Mã số thuế'},h('input',{value:f.taxCode,onChange:e=>set('taxCode',e.target.value),placeholder:'0312345678'}))
        ),
        h(F,{label:'Địa chỉ chính'},h('input',{value:f.address,onChange:e=>set('address',e.target.value),placeholder:'Địa chỉ...'})),
        h(F,{label:'Ghi chú'},h('textarea',{value:f.note,onChange:e=>set('note',e.target.value),rows:2})),
        h('hr',{className:'divider',style:{margin:'4px 0'}}),
        AddPtForm(),
        h('hr',{className:'divider',style:{margin:'4px 0'}}),
        BtnRow()
      ),
      // ── Cột phải: danh sách địa điểm ──
      h('div',null,
        h('div',{style:{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8,flexWrap:'wrap',gap:6}},
          h('div',{style:{fontWeight:500,fontSize:13,color:'var(--pri3)'}},h('i',{className:'ti ti-map-pin',style:{marginRight:5}}),'Địa điểm giao hàng (',f.points.length,')'),
          h('div',{style:{display:'flex',gap:6}},
            // Nút gộp địa điểm gần giống
            h('button',{
              onClick:()=>{
                // Tìm các nhóm địa điểm có tên gần giống (sau khi trim + normalize)
                const normalize=s=>(s||'').trim().toLowerCase().replace(/\s+/g,' ');
                const groups={};
                f.points.forEach(pt=>{
                  const key=norm2(pt.name);
                  if(!groups[key])groups[key]=[];
                  groups[key].push(pt);
                });
                const dupGroups=Object.values(groups).filter(g=>g.length>1);
                if(dupGroups.length===0){window.showToast('Không tìm thấy địa điểm trùng hoặc gần giống!','error');return;}
                // Hiện confirm với danh sách
                const lines=dupGroups.map(g=>g.map(p=>'  • "'+p.name+'" ('+( p.area||'chưa có khu vực')+')').join('\n')).join('\n---\n');
                const msg='Tìm thấy '+dupGroups.length+' nhóm trùng:\n\n'+lines+'\n\nGộp lại? (giữ địa điểm đầu tiên mỗi nhóm, xóa các địa điểm trùng)';
                if(!confirm(msg))return;
                // Gộp: giữ pt đầu tiên mỗi nhóm
                const keepIds=new Set();
                const mergeMap={}; // id cũ → id giữ lại
                dupGroups.forEach(g=>{
                  const keep=g[0];
                  keepIds.add(keep.id);
                  g.slice(1).forEach(dup=>{mergeMap[dup.id]=keep.id;});
                });
                // Giữ tất cả điểm không trùng + điểm đầu tiên mỗi nhóm
                const newPoints=f.points.filter(pt=>{
                  const key=normalize(pt.name);
                  const grp=groups[key];
                  if(grp.length===1)return true; // không trùng
                  return pt.id===grp[0].id; // chỉ giữ cái đầu
                });
                sf(p=>({...p,points:newPoints}));
                window.showToast('Đã gộp '+dupGroups.reduce((s,g)=>s+g.length-1,0)+' địa điểm trùng!','success');
              },
              style:{fontSize:11,padding:'3px 10px',display:'flex',alignItems:'center',gap:4,border:'1px solid #E06060',color:'#A32D2D',background:'transparent',borderRadius:'var(--r)',cursor:'pointer'}
            },h('i',{className:'ti ti-git-merge',style:{fontSize:13}}),'Gộp địa điểm trùng'),
            // Nút dọn trùng tên chính xác
            h('button',{
              onClick:()=>{
                // Debug: log tất cả điểm ra console
                
                
                f.points.forEach((p,i)=>{
                  const k=normalize(p.name);
                  
                });
                // Tìm trùng bằng normalize mạnh
                const seen=new Map();
                const dups=[];
                const dupPairs=[];
                f.points.forEach(p=>{
                  const k=normalize(p.name);
                  if(seen.has(k)){
                    dups.push(p.name+' ('+p.area+')');
                    dupPairs.push({keep:seen.get(k),remove:p});
                  } else seen.set(k,p);
                });
                if(dups.length===0){
                  // Thử tìm bằng exact string match
                  const exactSeen=new Map();
                  const exactDups=[];
                  f.points.forEach(p=>{
                    const k=p.name;
                    if(exactSeen.has(k))exactDups.push(k);
                    else exactSeen.set(k,p);
                  });
                  if(exactDups.length>0){
                    window.showToast('Tìm thấy '+exactDups.length+' trùng exact:\n'+exactDups.join('\n')+'\n\nNhưng normalize không bắt được - có thể có ký tự ẩn. Xem console để debug.','error');
                    return;
                  }
                  window.showToast('Không tìm thấy địa điểm trùng!\nĐã kiểm tra '+f.points.length+' địa điểm.\nXem Console (F12) để debug chi tiết.','error');
                  return;
                }
                const msg='Tìm thấy '+dups.length+' địa điểm trùng:\n• '+dups.slice(0,10).join('\n• ')+(dups.length>10?'\n...':'')+'\n\nGiữ bản có thông tin đầy đủ hơn. Tiếp tục?';
                if(confirm(msg)){
                  const cleaned=dedup(f.points).sort((a,b)=>{const ac=(a.area||'zzz').localeCompare(b.area||'zzz','vi');return ac!==0?ac:(a.name||'').localeCompare(b.name||'','vi');});
                  sf(p=>({...p,points:cleaned}));
                  cleaned.forEach(pt=>{pendingAreas.current[pt.id]=pt.area||'';});
                  window.showToast('Đã xóa '+dups.length+' địa điểm trùng! Còn lại '+cleaned.length+' địa điểm.','success');
                }
              },
              style:{fontSize:11,padding:'3px 10px',display:'flex',alignItems:'center',gap:4,border:'1px solid #856404',color:'#856404',background:'transparent',borderRadius:'var(--r)',cursor:'pointer'}
            },h('i',{className:'ti ti-eraser',style:{fontSize:13}}),'Dọn trùng tên'),
            // Nút sắp xếp
            h('button',{
              onClick:()=>sf(p=>({...p,points:[...p.points].sort((a,b)=>{const ac=(a.area||'').localeCompare(b.area||'','vi');return ac!==0?ac:(a.name||'').localeCompare(b.name||'','vi');})})),
              style:{fontSize:11,padding:'3px 10px',display:'flex',alignItems:'center',gap:4,border:'1px solid var(--pri)',color:'var(--pri)',background:'transparent',borderRadius:'var(--r)',cursor:'pointer'}
            },h('i',{className:'ti ti-arrows-sort',style:{fontSize:13}}),'Sắp xếp theo khu vực')
          )
        ),
        (()=>{
          const rows=[];
          let lastArea=null;
          // Sort points theo khu vực rồi tên
          const sorted=[...f.points].sort((a,b)=>{
            const ac=(a.area||'zzz').localeCompare(b.area||'zzz','vi');
            return ac!==0?ac:(a.name||'').localeCompare(b.name||'','vi');
          });
          sorted.forEach(pt=>{
            const area=pt.area||'';
            if(area!==lastArea){
              lastArea=area;
              // Dòng phân cách khu vực
              rows.push(h('div',{key:'sep-'+area,style:{
                display:'flex',alignItems:'center',gap:8,
                margin:'6px 0 4px',padding:'3px 8px',
                background:'#f0f7f0',borderRadius:'var(--r)',
                borderLeft:'3px solid var(--pri)'
              }},
                h('span',{style:{fontSize:11,fontWeight:700,color:'var(--pri)',letterSpacing:.5,textTransform:'uppercase'}},
                  area||'Chưa phân khu vực'
                ),
                h('span',{style:{fontSize:11,color:'var(--tx2)'}},
                  '('+sorted.filter(p=>(p.area||'')===area).length+' địa điểm)'
                )
              ));
            }
            rows.push(h(PointRow,{
              key:pt.id,pt,allAreas,
              onNameChange:(id,v)=>sf(p=>({...p,points:p.points.map(x=>x.id===id?{...x,name:v}:x)})),
              onAreaChange:onAreaChange,
              onDelete:(delId,delPt)=>{
                const delName=(delPt?.name||'').trim().toUpperCase();
                const hasOrders=(orders||[]).some(o=>
                  (o.pointId===delId)||(o.pointName||'').trim().toUpperCase()===delName
                );
                if(hasOrders){
                  const cnt=(orders||[]).filter(o=>(o.pointId===delId)||(o.pointName||'').trim().toUpperCase()===delName).length;
                  if(!confirm('⚠ Địa điểm "'+delPt?.name+'" có '+cnt+' đơn hàng liên quan!\n\nNếu xóa, các đơn hàng này vẫn còn nhưng sẽ mất thông tin địa điểm.\n\nBạn có chắc muốn xóa?'))return;
                } else {
                  if(!confirm('Địa điểm "'+delPt?.name+'" không có đơn hàng nào.\nXóa địa điểm này?'))return;
                }
                delete pendingAreas.current[delId];
                sf(p=>({...p,points:p.points.filter(x=>x.id!==delId)}));
              }
            }));
          });
          return rows;
        })()
      )
    )
  );
}
/* ─── PRODUCTION SHIFTS TAB ─── */
function timeToMin(t){
  const norm=normalizeTimeInput(t);
  if(!/^\d{2}:\d{2}$/.test(norm))return 0;
  const[h,m]=norm.split(':').map(Number);
  return h*60+(m||0);
}
function normalizeTimeInput(t){
  const raw=String(t??'').trim();
  if(!raw)return '';
  if(/^[-+]?\d+(?:[.,]\d+)?$/.test(raw)){
    const num=Number(raw.replace(',','.'));
    if(Number.isFinite(num)&&(/[.,]/.test(raw)||(num>0&&num<1))){
      const frac=((num%1)+1)%1;
      const totalMinutes=Math.round(frac*24*60)%1440;
      const hh=String(Math.floor(totalMinutes/60)).padStart(2,'0');
      const mm=String(totalMinutes%60).padStart(2,'0');
      return hh+':'+mm;
    }
  }
  const m=raw.match(/^(\d{1,2})(?::|h|H|\.)(\d{1,2})(?::\d{1,2})?$/);
  if(!m)return raw;
  return String(Math.min(23,Number(m[1]))).padStart(2,'0')+':'+String(Math.min(59,Number(m[2]))).padStart(2,'0');
}
function normalizeOrderForStorage(order){
  if(!order||typeof order!=='object')return order;
  return {...order,deliveryTime:normalizeTimeInput(order.deliveryTime||'')};
}
function normalizeOrdersForStorage(list){
  return Array.isArray(list)?list.map(normalizeOrderForStorage):list;
}
function ordersNeedTimeNormalization(list){
  return Array.isArray(list)&&list.some(o=>normalizeTimeInput(o?.deliveryTime||'')!==String(o?.deliveryTime||'').trim());
}
function normalizeLookupText(v){
  return String(v||'')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .replace(/Đ/g,'D')
    .replace(/đ/g,'d')
    .replace(/[^a-zA-Z0-9]+/g,' ')
    .replace(/\s+/g,' ')
    .trim()
    .toLowerCase();
}
function findOrderPointMatch(order,customers){
  if(!order||!(customers&&customers.length))return null;
  const pointId=String(order.pointId||order.ptId||'').trim();
  const pointName=normalizeLookupText(order.pointName||'');
  const address=normalizeLookupText(order.address||'');
  const customerId=String(order.customerId||order.custId||'').trim();
  const customerName=normalizeLookupText(order.customer||'');
  let best=null;
  let bestScore=-1;
  (customers||[]).forEach(c=>{
    const cName=normalizeLookupText(c.name||'');
    const customerScore=customerId&&c.id===customerId?1000:(customerName&&cName===customerName?700:(customerName&&(cName.includes(customerName)||customerName.includes(cName))?350:0));
    (c.points||[]).forEach(pt=>{
      const pName=normalizeLookupText(pt.name||'');
      const pAddress=normalizeLookupText(pt.address||'');
      let score=customerScore;
      let hit=false;
      if(pointId&&pt.id===pointId){score+=5000;hit=true;}
      if(pointName&&pName===pointName){score+=800;hit=true;}
      else if(pointName&&pName&&(pName.includes(pointName)||pointName.includes(pName))){score+=500;hit=true;}
      if(address&&pAddress===address){score+=300;hit=true;}
      else if(address&&pAddress&&(pAddress.includes(address)||address.includes(pAddress))){score+=180;hit=true;}
      if(!hit)return;
      if(score>bestScore){bestScore=score;best={customer:c,point:pt,score};}
    });
  });
  return best;
}
function getProdShift(deliveryTime, prodShifts, location){
  if(!deliveryTime||!prodShifts)return null;
  const tMin=timeToMin(deliveryTime);
  const loc=normalizeLookupText(location||'');
  const inRange=(t,start,end)=>{
    const s=timeToMin(start), e=timeToMin(end);
    if(!start||!end)return false;
    if(s<=e)return t>=s&&t<e;
    return t>=s||t<e; // qua nửa đêm
  };
  const matches=(prodShifts||[]).filter(sh=>{
    if(sh.active===false)return false;
    const from=sh.orderTimeFrom||sh.startTime||sh.orderTime;
    const to=sh.orderTimeTo||sh.endTime||sh.orderTime;
    return (from&&to&&from!==to)?inRange(tMin,from,to):(sh.orderTime&&tMin===timeToMin(sh.orderTime));
  });
  if(!matches.length)return null;
  if(loc){
    const exact=matches.find(sh=>normalizeLookupText(sh.location||'')===loc);
    if(exact)return exact;
    const loose=matches.find(sh=>{
      const shLoc=normalizeLookupText(sh.location||'');
      return shLoc&&(shLoc.includes(loc)||loc.includes(shLoc));
    });
    if(loose)return loose;
    return null;
  }
  return matches.find(sh=>!normalizeLookupText(sh.location||''))||matches[0];
}
function resolveOrderPointAliases(order,customers){
  const resolved=findOrderPointMatch(order,customers||[]);
  const pt=resolved?.point||{};
  const aliases=[order?.area,pt.area,order?.pointName,pt.name,order?.address,pt.address,order?.customer,resolved?.customer?.name]
    .map(normalizeLookupText)
    .filter(Boolean);
  return {resolved,pt,aliases:[...new Set(aliases)]};
}
function getProdShiftForOrder(order,prodShifts,customers){
  if(!order||!prodShifts)return null;
  const tMin=timeToMin(order.deliveryTime);
  const {aliases}=resolveOrderPointAliases(order,customers||[]);
  const matches=(prodShifts||[]).filter(sh=>{
    if(sh.active===false)return false;
    const from=sh.orderTimeFrom||sh.startTime||sh.orderTime;
    const to=sh.orderTimeTo||sh.endTime||sh.orderTime;
    return (from&&to&&from!==to)?timeInRange(order.deliveryTime,from,to):(sh.orderTime&&tMin===timeToMin(sh.orderTime));
  });
  if(!matches.length)return null;
  const scored=matches.map(sh=>{
    const shLoc=normalizeLookupText(sh.location||'');
    if(!aliases.length){
      return {sh,score:shLoc?10:1};
    }
    let score=0;
    if(!shLoc)return {sh,score:0};
    aliases.forEach(alias=>{
      if(!alias)return;
      if(shLoc===alias)score+=1000;
      else if(shLoc.includes(alias)||alias.includes(shLoc))score+=600;
    });
    if(score===0)return {sh,score:0};
    return {sh,score};
  }).filter(x=>x.score>0);
  if(aliases.length){
    if(!scored.length)return null;
    return scored.sort((a,b)=>{
      const ad=(Number(a.sh.startTime?timeToMin(a.sh.startTime):timeToMin(a.sh.orderTime))||0);
      const bd=(Number(b.sh.startTime?timeToMin(b.sh.startTime):timeToMin(b.sh.orderTime))||0);
      const byScore=b.score-a.score;
      if(byScore)return byScore;
      return ad-bd||(String(a.sh.id||'').localeCompare(String(b.sh.id||''),'vi'));
    })[0].sh;
  }
  return matches.find(sh=>!normalizeLookupText(sh.location||''))||matches[0];
}
function getProdShiftByProdTime(prodTime, prodShifts){
  if(!prodTime||!prodShifts)return null;
  const exact=(prodShifts||[]).find(sh=>sh.active!==false&&sh.actualProdTime===prodTime);
  return exact||getProdShift(prodTime,prodShifts);
}
function timeInRange(t,start,end){
  if(!t||!start||!end)return false;
  const tm=timeToMin(t), s=timeToMin(start), e=timeToMin(end);
  if(s<=e)return tm>=s&&tm<e;
  return tm>=s||tm<e;
}
function getProdWorkShiftRule(prodTime,rules){
  if(!prodTime)return null;
  const activeRules=(rules&&rules.length)?rules:DEF_PROD_SHIFT_RULES;
  return activeRules.find(r=>r.active!==false&&timeInRange(prodTime,r.start,r.end))||null;
}
function addDaysVN(dateStr,offset){
  if(!dateStr)return '';
  const p=dateStr.split('/').map(Number);
  if(p.length!==3||!p[0]||!p[1]||!p[2])return dateStr;
  const d=new Date(p[2],p[1]-1,p[0]);
  d.setDate(d.getDate()+Number(offset||0));
  return String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();
}
function getOrderTripDateOffset(order,prodShifts){
  const manualShift=order?.prodShiftId?(prodShifts||[]).find(s=>s.id===order.prodShiftId):null;
  const autoShift=getProdShiftForOrder(order,prodShifts||[],window.__SCF_CUSTOMERS||[]);
  const shift=manualShift||autoShift;
  return shift==null?null:Number(shift.tripDateOffset??0);
}
function getOrderTripDate(order,prodShifts){
  if(!order?.deliveryDate)return '';
  const offset=getOrderTripDateOffset(order,prodShifts);
  if(offset===null||offset===undefined||Number.isNaN(offset))return '';
  return addDaysVN(order.deliveryDate,offset);
}
function getOrderTripShiftId(order,prodShifts){
  const manualShift=order?.prodShiftId?(prodShifts||[]).find(s=>s.id===order.prodShiftId):null;
  const autoShift=getProdShiftForOrder(order,prodShifts||[],window.__SCF_CUSTOMERS||[]);
  return String((manualShift||autoShift)?.tripShiftId||'');
}
function getOrderTripShiftName(order,prodShifts){
  const manualShift=order?.prodShiftId?(prodShifts||[]).find(s=>s.id===order.prodShiftId):null;
  const autoShift=getProdShiftForOrder(order,prodShifts||[],window.__SCF_CUSTOMERS||[]);
  return String((manualShift||autoShift)?.tripShiftName||'');
}
function prodShiftDisplay(sh){
  if(!sh)return sh;
  if(String(sh.name||'').toLowerCase().includes('chiều')||String(sh.name||'').toLowerCase().includes('chieu')){
    return {...sh,color:'#FEF3C7',textColor:'#92400E'};
  }
  return sh;
}
function prodShiftSmallDisplay(sh,prodTime,prodShiftRules){
  const rule=getProdWorkShiftRule(prodTime,prodShiftRules||DEF_PROD_SHIFT_RULES);
  if(!rule)return prodShiftDisplay(sh);
  return {...(sh||{}),name:rule.name,color:rule.color,textColor:rule.textColor,smallShiftId:rule.id,group:rule.group};
}
function prodShiftPlan(order,prodShifts,prodShiftRules){
  if(!order||order._hdr||order._sub)return null;
  const manualLine=(order.lines||[]).find(l=>l.shiftOverride&&(l.prodTime||l.prodDate||l.labelTime||l.labelDate));
  if(manualLine){
    const manualShift=getProdShiftByProdTime(manualLine.prodTime,prodShifts||[]);
    return {
      shift:manualShift?prodShiftSmallDisplay(manualShift,manualLine.prodTime,prodShiftRules):{name:'Ca SX tay',color:'#FFF8E1',textColor:'#8A5A00'},
      prodTime:manualLine.prodTime||'',
      prodDate:manualLine.prodDate||(manualShift?addDaysVN(order.deliveryDate,manualShift.prodDateOffset||0):order.deliveryDate)||'',
      labelTime:manualLine.labelTime||manualShift?.labelPrintTime||'',
      labelDate:manualLine.labelDate||(manualShift?addDaysVN(order.deliveryDate,manualShift.labelPrintDateOffset||0):order.deliveryDate)||'',
      manual:true
    };
  }
  const sh=order?.prodShiftId?(prodShifts||[]).find(s=>s.id===order.prodShiftId):getProdShiftForOrder(order,prodShifts||[],window.__SCF_CUSTOMERS||[]);
  if(!sh)return null;
  const prodTime=sh.actualProdTime||sh.endTime||'';
  return {
    shift:prodShiftSmallDisplay(sh,prodTime,prodShiftRules),
    prodTime,
    prodDate:addDaysVN(order.deliveryDate,sh.prodDateOffset||0),
    labelTime:sh.labelPrintTime||'',
    labelDate:addDaysVN(order.deliveryDate,sh.labelPrintDateOffset||0)
  };
}
function prodShiftPlansForOrder(order,prodShifts,prodShiftRules){
  if(!order||order._hdr||order._sub)return [];
  const defaultPlan=prodShiftPlan({...order,lines:(order.lines||[]).filter(l=>!l.shiftOverride)},prodShifts,prodShiftRules);
  return (order.lines||[]).map((l,i)=>{
    if(l.shiftOverride&&(l.prodTime||l.prodDate||l.labelTime||l.labelDate)){
      const manualShift=getProdShiftByProdTime(l.prodTime,prodShifts||[]);
      return {
        line:l,
        index:i,
        productName:l.productName||('Sản phẩm '+(i+1)),
        shift:manualShift?prodShiftSmallDisplay(manualShift,l.prodTime,prodShiftRules):{name:'Ca SX tay',color:'#FFF8E1',textColor:'#8A5A00'},
        prodTime:l.prodTime||'',
        prodDate:l.prodDate||(manualShift?addDaysVN(order.deliveryDate,manualShift.prodDateOffset||0):order.deliveryDate)||'',
        labelTime:l.labelTime||manualShift?.labelPrintTime||'',
        labelDate:l.labelDate||(manualShift?addDaysVN(order.deliveryDate,manualShift.labelPrintDateOffset||0):order.deliveryDate)||'',
        manual:true
      };
    }
    return defaultPlan?{...defaultPlan,line:l,index:i,productName:l.productName||('Sản phẩm '+(i+1))}:null;
  }).filter(Boolean);
}
function ProdShiftsTab({prodShifts,setProdShifts,prodShiftRules,setProdShiftRules,orders,customers,shifts}){
  const[modal,sm]=useState(null);
  const[edit,se]=useState(null);
  const empty={name:'',location:'',orderTime:'',startTime:'',endTime:'',actualProdTime:'',prodDateOffset:0,tripDateOffset:0,tripShiftId:'',tripShiftName:'',labelPrintTime:'',labelPrintDateOffset:0,color:'#FFF8E1',textColor:'#333',active:true};
  const shiftNamePresets=[
    {name:'Ca sáng',orderTime:'03:00',startTime:'03:00',endTime:'12:00',actualProdTime:'03:00',prodDateOffset:0,tripDateOffset:0,tripShiftId:'',tripShiftName:'',labelPrintTime:'04:00',labelPrintDateOffset:0,color:'#FFF8E1',textColor:'#E65100'},
    {name:'Ca chiều',orderTime:'20:00',startTime:'12:00',endTime:'22:00',actualProdTime:'20:00',prodDateOffset:0,tripDateOffset:0,tripShiftId:'',tripShiftName:'',labelPrintTime:'21:00',labelPrintDateOffset:0,color:'#FEF3C7',textColor:'#92400E'},
    {name:'Ca đêm',orderTime:'01:00',startTime:'22:00',endTime:'03:00',actualProdTime:'01:00',prodDateOffset:-1,tripDateOffset:-1,tripShiftId:'',tripShiftName:'',labelPrintTime:'22:00',labelPrintDateOffset:-1,color:'#EDE7F6',textColor:'#4527A0'}
  ];
  const normalize=sh=>{
    const base={...empty,...sh,name:(sh?.name||'').toLowerCase().includes('ngày')?'Ca sáng':(sh?.name||'')};
    const start=sh?.orderTimeFrom||sh?.startTime||sh?.orderTime||'';
    const end=sh?.orderTimeTo||sh?.endTime||sh?.orderTime||start;
    return prodShiftDisplay({...base,orderTime:sh?.orderTime||start,startTime:start,endTime:end,actualProdTime:sh?.actualProdTime||'',prodDateOffset:Number(sh?.prodDateOffset??0),tripDateOffset:Number(sh?.tripDateOffset??0),tripShiftId:String(sh?.tripShiftId||''),tripShiftName:String(sh?.tripShiftName||''),labelPrintTime:sh?.labelPrintTime||'',labelPrintDateOffset:Number(sh?.labelPrintDateOffset??0)});
  };
  const orderTimeText=sh=>{
    const r=normalize(sh);
    return r.startTime&&r.endTime&&r.startTime!==r.endTime ? r.startTime+' - '+r.endTime : (r.orderTime||r.startTime||'—');
  };
  const rules=(prodShiftRules&&prodShiftRules.length?prodShiftRules:DEF_PROD_SHIFT_RULES);
  const updateRule=(id,data)=>setProdShiftRules(p=>(p&&p.length?p:DEF_PROD_SHIFT_RULES).map(r=>r.id===id?{...r,...data}:r));
  const shiftRuleFromProdTime=t=>getProdWorkShiftRule(t,rules);
  const shiftNameFromProdTime=t=>shiftRuleFromProdTime(t)?.name||'';
  const[form,sf]=useState(empty);
  const[sortMode,setSortMode]=useState('area');
  const pointOptions=[...new Set((customers||[]).flatMap(c=>(c.points||[]).map(pt=>pt.name).filter(Boolean)))].sort((a,b)=>a.localeCompare(b));
  const dateOffsetLabel=v=>{
    const n=Number(v||0);
    if(n===-1)return 'Trước ngày ĐH 1 ngày (-1)';
    if(n===1)return 'Sau ngày ĐH 1 ngày (+1)';
    return 'Cùng ngày ĐH (0)';
  };
  const areaOfLocation=loc=>{
    const name=(loc||'').trim().toUpperCase();
    if(!name)return 'Chưa phân khu vực';
    for(const c of customers||[]){
      const pt=(c.points||[]).find(p=>(p.name||'').trim().toUpperCase()===name);
      if(pt)return pt.area||'Chưa phân khu vực';
    }
    return 'Chưa phân khu vực';
  };
  const groupLabelForShift=r=>{
    if(sortMode==='prod'){
      return r.name||'Chưa có ca SX';
    }
    if(sortMode==='trip'){
      return r.tripShiftName||'Chưa có ca GH';
    }
    return areaOfLocation(r.location);
  };
  const groupTitleForShift=group=>{
    if(sortMode==='prod'){
      return group||'Chưa có ca SX';
    }
    if(sortMode==='trip'){
      return group||'Chưa có ca GH';
    }
    return group||'Chưa phân khu vực';
  };
  const groupSortLabel=sortMode==='area'?'Khu vực':(sortMode==='prod'?'Ca sản xuất':'Ca giao hàng');
  const sortPriorityForGroup=group=>{
    if(sortMode==='prod'){
      return group==='Chưa có ca SX'?9999:0;
    }
    if(sortMode==='trip'){
      return group==='Chưa có ca GH'?9999:0;
    }
    return group==='Chưa phân khu vực'?9999:0;
  };
  const groupedShifts=[...prodShifts].map(normalize).sort((a,b)=>{
    const ga=groupLabelForShift(a),gb=groupLabelForShift(b);
    const gp=sortPriorityForGroup(ga)-sortPriorityForGroup(gb);
    if(gp)return gp;
    return ga.localeCompare(gb,'vi')||(a.location||'').localeCompare(b.location||'','vi')||timeToMin(a.startTime||a.orderTime)-timeToMin(b.startTime||b.orderTime)||(a.name||'').localeCompare(b.name||'','vi');
  });
  const groupedShiftRows=[];
  let lastGroup=null;
  groupedShifts.forEach(r=>{
    const group=groupLabelForShift(r);
    if(group!==lastGroup){
      lastGroup=group;
      groupedShiftRows.push({type:'group',key:'group-'+sortMode+'-'+group,label:groupTitleForShift(group)});
    }
    groupedShiftRows.push({type:'row',key:r.id,row:r});
  });
  const open=(sh)=>{sf(sh?normalize(sh):{...empty});se(sh||null);sm('f');};
  const presetForTime=t=>{
    const exact=shiftNamePresets.find(x=>x.orderTime===t);
    if(exact)return exact;
    const m=timeToMin(t);
    if(m<360)return shiftNamePresets.find(x=>x.name==='Ca đêm');
    if(m>=1080)return shiftNamePresets.find(x=>x.name==='Ca chiều');
    if(m>=360&&m<720)return shiftNamePresets.find(x=>x.name==='Ca sáng');
    return shiftNamePresets.find(x=>x.name==='Ca chiều')||shiftNamePresets[0];
  };
  const autoUpdateFromOrders=()=>{
    const map={};
    (orders||[]).forEach(o=>{
      const loc=(o.pointName||o.address||'').trim();
      const time=normalizeTimeInput(o.deliveryTime||'');
      if(!loc||!time)return;
      const key=(loc+'|'+time).toUpperCase();
      if(!map[key])map[key]={location:loc,orderTime:time,orderIds:[],count:0};
      map[key].count+=1;
      if(o.id)map[key].orderIds.push(o.id);
    });
    const pairs=Object.values(map);
    if(!pairs.length){window.showToast('Chưa tìm thấy địa điểm có giờ giao trong danh sách đơn hàng.','warn');return;}
    const sameLoc=(a,b)=>String(a||'').trim().toUpperCase()===String(b||'').trim().toUpperCase();
    const hasLocation=loc=>prodShifts.map(normalize).some(sh=>sameLoc(sh.location,loc));
    const hitShift=(loc,time)=>prodShifts.map(normalize).find(sh=>{
      const r=normalize(sh);
      const startMin=timeToMin(r.startTime||r.orderTime), endMin=timeToMin(r.endTime||r.orderTime), t=timeToMin(time);
      const hit=(r.startTime&&r.endTime&&r.startTime!==r.endTime)?(startMin<=endMin?t>=startMin&&t<endMin:t>=startMin||t<endMin):r.orderTime===time;
      return sameLoc(r.location,loc)&&hit;
    });
    const missing=pairs.filter(p=>!hitShift(p.location,p.orderTime)).map(p=>({...p,reason:hasLocation(p.location)?'Giờ ĐH nằm ngoài khoảng đã cấu hình':'Địa điểm mới chưa có trong bảng'}));
    if(!missing.length){window.showToast('Tất cả địa điểm và giờ giao đã có trong bảng cài đặt ca SX + ca GH tự động.','info');return;}
    const p=missing[0];
    const sameTime=prodShifts.map(normalize).find(s=>s.orderTime===p.orderTime||s.startTime===p.orderTime);
    const preset=sameTime||presetForTime(p.orderTime)||empty;
    window.showToast('Có '+missing.length+' địa điểm/giờ giao cần kiểm tra. Đang mở dòng đầu tiên: '+p.reason+'.','warn',7000);
    sf({
      ...empty,
      ...preset,
      location:p.location,
      orderTime:p.orderTime,
      startTime:p.orderTime,
      endTime:p.orderTime,
      actualProdTime:preset.actualProdTime||p.orderTime,
      labelPrintTime:preset.labelPrintTime||p.orderTime,
      name:shiftNameFromProdTime(preset.actualProdTime||p.orderTime)||preset.name||'',
      active:true,
      _missingCount:missing.length,
      _missingReason:p.reason,
      _missingOrderIds:[...new Set(p.orderIds||[])],
      _missingSummary:missing.slice(0,8).map(x=>x.location+' '+x.orderTime+' ('+x.reason+', đơn: '+[...new Set(x.orderIds||[])].slice(0,5).join(', ')+(x.orderIds?.length>5?', ...':'')+')')
    });
    se(null);
    sm('f');
  };
  const save=()=>{
    if(!(form.startTime||form.orderTime)||!(form.endTime||form.orderTime)||!form.actualProdTime){window.showToast('Nhập đủ khoảng giờ đơn hàng và giờ sản xuất thực tế!','warn');return;}
    const autoRule=shiftRuleFromProdTime(form.actualProdTime);
    const autoName=autoRule?.name||'';
    if(!autoName){window.showToast('Giờ sản xuất chưa nằm trong khung ca SX nhỏ nào. Hãy chỉnh bảng cài đặt ca SX + ca GH tự động.','warn');return;}
    const {_missingCount,_missingReason,_missingOrderIds,_missingSummary,...cleanForm}=form;
    const chosenTripShift=(shifts||[]).find(x=>x.id===form.tripShiftId);
    const data={...cleanForm,name:autoName,color:autoRule?.color||form.color,textColor:autoRule?.textColor||form.textColor,orderTime:form.startTime||form.orderTime,startTime:form.startTime||form.orderTime,endTime:form.endTime||form.orderTime,prodDateOffset:Number(form.prodDateOffset||0),tripDateOffset:Number(form.tripDateOffset||0),tripShiftId:String(form.tripShiftId||''),tripShiftName:chosenTripShift?.name||form.tripShiftName||'',labelPrintDateOffset:Number(form.labelPrintDateOffset||0)};
    if(edit) setProdShifts(p=>p.map(s=>s.id===edit.id?{...s,...data}:s));
    else setProdShifts(p=>[...p,{...data,id:'PSH'+uid()}]);
    sm(null);
  };
  const del=sh=>{if(confirm('Xóa ca "'+sh.name+'"?'))setProdShifts(p=>p.filter(s=>s.id!==sh.id));};
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-clock-play',style:{fontSize:20}}),'Cài đặt ca SX + ca GH tự động'),
    h('div',{style:{marginBottom:'1rem',padding:'12px 16px',background:'#EAF4EF',borderRadius:'var(--r)',fontSize:13}},
      h('div',{style:{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap',marginBottom:8}},
        h('b',null,'Cài đặt khung giờ SX → ca SX + ca GH tự động:'),
        h('span',{style:{fontSize:12,color:'var(--tx2)'}},'Sửa khoảng giờ để hệ thống tự gom đơn vào đúng ca')
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:8}},
        rules.map(r=>h('div',{key:r.id,style:{background:r.color||'#fff',border:'1px solid var(--bd)',borderRadius:'var(--r)',padding:'8px 10px'}},
          h('div',{style:{fontWeight:700,color:r.textColor||'var(--tx)',marginBottom:6}},r.name),
          h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}},
            h(F,{label:'Từ'},h('input',{type:'time',value:r.start||'',onChange:e=>updateRule(r.id,{start:e.target.value}),style:{fontSize:12,padding:'5px 6px'}})),
            h(F,{label:'Đến'},h('input',{type:'time',value:r.end||'',onChange:e=>updateRule(r.id,{end:e.target.value}),style:{fontSize:12,padding:'5px 6px'}}))
          ),
          h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6,marginTop:6}},
            h(F,{label:'Ca lớn'},h('select',{value:r.group||'',onChange:e=>updateRule(r.id,{group:e.target.value}),style:{fontSize:12,padding:'5px 6px'}},
              ['Ca đêm','Ca sáng','Ca chiều'].map(x=>h('option',{key:x,value:x},x))
            )),
            h(F,{label:'Tên ca'},h('input',{value:r.name||'',onChange:e=>updateRule(r.id,{name:e.target.value}),style:{fontSize:12,padding:'5px 6px'}}))
          )
        ))
      )
    ),
    h('div',{style:{display:'flex',justifyContent:'flex-end',marginBottom:'1rem',gap:8,flexWrap:'wrap',alignItems:'center'}},
      h('span',{style:{fontSize:12,color:'var(--tx2)',fontWeight:600}},'Sắp xếp theo'),
      h('select',{value:sortMode,onChange:e=>setSortMode(e.target.value),style:{padding:'7px 10px',border:'1px solid var(--bd)',borderRadius:'var(--r)',fontSize:13}},
        h('option',{value:'area'},'Khu vực'),
        h('option',{value:'prod'},'Ca sản xuất'),
        h('option',{value:'trip'},'Ca giao hàng')
      )
    ),
    h('div',{style:{marginBottom:'1rem',padding:'12px 16px',background:'#f0f7f0',borderRadius:'var(--r)',border:'1px solid #c8e6c9',fontSize:13}},
      h('b',null,'Cách hoạt động: '),
      'Bảng này quy định từ khoảng giờ đơn hàng sang giờ sản xuất thực tế, ngày sản xuất, ngày chuyến giao, ca giao hàng, giờ in tem và ngày in tem. Hệ thống sẽ tự chọn ca sản xuất và chuyến giao theo cấu hình của đơn.',
      h('br'),
      h('span',{style:{color:'var(--tx2)',fontSize:12}},'Ngày -1 là làm/in trước ngày đơn hàng 1 ngày; ngày 0 là cùng ngày với ngày đơn hàng.')
    ),
    h('div',{style:{display:'flex',justifyContent:'flex-end',gap:8,marginBottom:'1rem',flexWrap:'wrap'}},
      h('button',{onClick:autoUpdateFromOrders},h('i',{className:'ti ti-refresh',style:{fontSize:14}}),'Cập nhật từ đơn hàng'),
      h(AddBtn,{onClick:()=>open(null),label:'Thêm dòng'})
    ),
    h('div',{className:'desktop-only',style:{overflowX:'auto',background:'#fff',border:'1px solid var(--bd)',borderRadius:'var(--r)',marginBottom:'1.5rem'}},
        h('table',{style:{width:'100%',borderCollapse:'collapse',minWidth:980}},
        h('thead',null,h('tr',null,
          ['Tên ca','Địa điểm','Giờ ĐH','Ngày sản xuất','Giờ SX','Ngày chuyến','Ca giao hàng','Ngày in tem','Giờ in tem','Trạng thái',''].map((x,i)=>h('th',{key:x,style:{textAlign:'left',padding:'10px 12px',borderBottom:'1px solid var(--bd)',fontSize:12,color:'var(--tx2)',background:'var(--bg2)',whiteSpace:'nowrap',width:i===0?130:(i===2?96:undefined)}},x))
        )),
        h('tbody',null,
          (()=>{let lastGroup=null;const rows=[];groupedShiftRows.forEach(item=>{
            if(item.type==='group'){
              lastGroup=item.label;
              rows.push(h('tr',{key:item.key},
                h('td',{colSpan:11,style:{padding:'8px 12px',background:'#E6F1FB',color:'#185FA5',fontWeight:700,borderTop:'1px solid var(--bd)',borderBottom:'1px solid var(--bd)'}},
                  h('i',{className:'ti ti-category',style:{fontSize:14,marginRight:6}}),
                  groupSortLabel+': '+item.label
                )
              ));
              return;
            }
            const r=item.row;
            const smallRule=shiftRuleFromProdTime(r.actualProdTime);
            const rowName=smallRule?.name||r.name;
            const rowTextColor=smallRule?.textColor||r.textColor||'#333';
            const rowBgColor=smallRule?.color||r.color||'';
            rows.push(h('tr',{key:r.id,style:{borderBottom:'1px solid var(--bd)',background:rowBgColor?rowBgColor+'55':''}},
              h('td',{style:{padding:'10px 12px',fontWeight:700,color:rowTextColor,whiteSpace:'nowrap',minWidth:120}},rowName),
              h('td',{style:{padding:'10px 12px'}},r.location||'—'),
              h('td',{style:{padding:'10px 12px',fontWeight:600,whiteSpace:'nowrap',width:96}},orderTimeText(r)),
              h('td',{style:{padding:'10px 12px'}},dateOffsetLabel(r.prodDateOffset)),
              h('td',{style:{padding:'10px 12px'}},r.actualProdTime||'—'),
              h('td',{style:{padding:'10px 12px'}},dateOffsetLabel(r.tripDateOffset)),
              h('td',{style:{padding:'10px 12px'}},r.tripShiftName||'—'),
              h('td',{style:{padding:'10px 12px'}},dateOffsetLabel(r.labelPrintDateOffset)),
              h('td',{style:{padding:'10px 12px'}},r.labelPrintTime||'—'),
              h('td',{style:{padding:'10px 12px'}},h('span',{className:'badge',style:{background:r.active?'#E8F5E9':'#F1EFE8',color:r.active?'#1B5E20':'#777'}},r.active?'Đang hoạt động':'Tạm tắt')),
              h('td',{style:{padding:'8px 12px',textAlign:'right',whiteSpace:'nowrap'}},
                h('button',{className:'bi',onClick:()=>open(r),title:'Sửa'},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
                h('button',{className:'bi',onClick:()=>del(r),title:'Xóa',style:{color:'#A32D2D',marginLeft:4}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
              )
            ));
          });return rows;})()
        )
      )
    ),
    h('div',{className:'mobile-card-list',style:{marginBottom:'1.5rem'}},
      groupedShiftRows.map(item=>{
        if(item.type==='group'){
          return h('div',{key:item.key,style:{padding:'8px 12px',background:'#E6F1FB',color:'#185FA5',fontWeight:700,borderRadius:10,marginBottom:8}},
            groupSortLabel+': '+item.label
          );
        }
        const r=item.row;
        const smallRule=shiftRuleFromProdTime(r.actualProdTime);
        const rowName=smallRule?.name||r.name;
        const rowTextColor=smallRule?.textColor||r.textColor||'#333';
        return h('div',{key:'m-'+r.id,className:'prodshift-mobile-card'},
          h('div',{className:'prodshift-mobile-head'},
            h('div',null,
              h('div',{className:'prodshift-mobile-name',style:{color:rowTextColor}},rowName),
              h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:2}},r.location||'—')
            ),
            h('span',{className:'badge',style:{background:r.active?'#E8F5E9':'#F1EFE8',color:r.active?'#1B5E20':'#777'}},r.active?'Đang hoạt động':'Tạm tắt')
          ),
          h('div',{className:'prodshift-mobile-grid'},
            h('div',{className:'prodshift-mobile-item'},h('b',null,'Giờ ĐH'),h('span',null,orderTimeText(r))),
            h('div',{className:'prodshift-mobile-item'},h('b',null,'Ngày SX'),h('span',null,dateOffsetLabel(r.prodDateOffset))),
            h('div',{className:'prodshift-mobile-item'},h('b',null,'Giờ SX'),h('span',null,r.actualProdTime||'—')),
            h('div',{className:'prodshift-mobile-item'},h('b',null,'Ngày chuyến'),h('span',null,dateOffsetLabel(r.tripDateOffset))),
            h('div',{className:'prodshift-mobile-item'},h('b',null,'Ca giao hàng'),h('span',null,r.tripShiftName||'—')),
            h('div',{className:'prodshift-mobile-item'},h('b',null,'Ngày in tem'),h('span',null,dateOffsetLabel(r.labelPrintDateOffset))),
            h('div',{className:'prodshift-mobile-item'},h('b',null,'Giờ in tem'),h('span',null,r.labelPrintTime||'—'))
          ),
          h('div',{className:'mobile-data-actions'},
            h('button',{className:'bi',onClick:()=>open(r),title:'Sửa'},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
            h('button',{className:'bi',onClick:()=>del(r),title:'Xóa',style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
          )
        );
      })
    ),
    modal==='f'&&h(Modal,{title:edit?'Sửa ca sản xuất':'Thêm ca sản xuất',onClose:()=>sm(null)},
      h('div',{style:{marginBottom:10,padding:'8px 12px',background:'#EAF4EF',borderRadius:'var(--r)',fontSize:13,color:'var(--pri3)'}},
        h('b',null,'Tên ca tự động: '),
        shiftNameFromProdTime(form.actualProdTime)||'Chưa xác định theo giờ SX'
      ),
      form._missingReason&&h('div',{style:{marginBottom:10,padding:'10px 12px',background:'#FFF8E1',border:'1px solid #F8C30F',borderRadius:'var(--r)',fontSize:12,lineHeight:1.45,color:'#6B4A00'}},
        h('div',{style:{fontWeight:700,marginBottom:4}},form._missingReason),
        h('div',null,'Địa điểm: ',h('b',null,form.location||'—'),' · Giờ ĐH: ',h('b',null,form.orderTime||form.startTime||'—')),
        h('div',null,'Mã đơn liên quan: ',h('b',null,(form._missingOrderIds||[]).join(', ')||'—')),
        (form._missingSummary||[]).length>1&&h('details',{style:{marginTop:6}},
          h('summary',{style:{cursor:'pointer',fontWeight:600}},'Xem thêm các dòng cần kiểm tra ('+(form._missingCount||0)+')'),
          h('div',{style:{marginTop:5,color:'#7A5A00'}},(form._missingSummary||[]).map((s,i)=>h('div',{key:i},'• '+s)))
        )
      ),
      h(F,{label:'Địa điểm'},h('select',{value:form.location||'',onChange:e=>sf(p=>({...p,location:e.target.value}))},
        h('option',{value:''},'— Chọn địa điểm —'),
        pointOptions.map(pt=>h('option',{key:pt,value:pt},pt))
      )),
      h('div',{className:'g3'},
        h(F,{label:'Giờ đơn hàng từ *'},h('input',{type:'time',value:form.startTime||form.orderTime||'',onChange:e=>sf(p=>({...p,startTime:e.target.value,orderTime:e.target.value}))})),
        h(F,{label:'Đến giờ *'},h('input',{type:'time',value:form.endTime||form.orderTime||'',onChange:e=>sf(p=>({...p,endTime:e.target.value}))}))
      ),
      h('div',{className:'prodshift-pair-grid'},
        h(F,{label:'Ngày sản xuất'},h('select',{value:String(form.prodDateOffset??0),onChange:e=>sf(p=>({...p,prodDateOffset:Number(e.target.value)}))},
          h('option',{value:'-1'},'Trước ngày ĐH 1 ngày (-1)'),
          h('option',{value:'0'},'Cùng ngày ĐH (0)')
        )),
        h(F,{label:'Giờ sản xuất thực tế *'},h('input',{type:'time',value:form.actualProdTime,onChange:e=>{const rule=shiftRuleFromProdTime(e.target.value);sf(p=>({...p,actualProdTime:e.target.value,name:rule?.name||p.name,color:rule?.color||p.color,textColor:rule?.textColor||p.textColor}));}}))
      ),
      h('div',{className:'prodshift-pair-grid'},
        h(F,{label:'Ngày chuyến'},h('select',{value:String(form.tripDateOffset??0),onChange:e=>sf(p=>({...p,tripDateOffset:Number(e.target.value)}))},
          h('option',{value:'-1'},'Trước ngày ĐH 1 ngày (-1)'),
          h('option',{value:'0'},'Cùng ngày ĐH (0)'),
          h('option',{value:'1'},'Sau ngày ĐH 1 ngày (+1)')
        )),
        h(F,{label:'Ca giao hàng'},h('select',{value:form.tripShiftId||'',onChange:e=>{
          const sh=(shifts||[]).find(x=>x.id===e.target.value);
          sf(p=>({...p,tripShiftId:e.target.value,tripShiftName:sh?.name||''}));
        }},
          h('option',{value:''},'— Chưa chọn ca giao —'),
          (shifts||[]).map(sh=>h('option',{key:sh.id,value:sh.id},sh.name||sh.id))
        ))
      ),
      h('div',{className:'prodshift-pair-grid'},
        h(F,{label:'Ngày in tem'},h('select',{value:String(form.labelPrintDateOffset??0),onChange:e=>sf(p=>({...p,labelPrintDateOffset:Number(e.target.value)}))},
          h('option',{value:'-1'},'Trước ngày ĐH 1 ngày (-1)'),
          h('option',{value:'0'},'Cùng ngày ĐH (0)')
        )),
        h(F,{label:'Giờ in tem'},h('input',{type:'time',value:form.labelPrintTime,onChange:e=>sf(p=>({...p,labelPrintTime:e.target.value}))}))
      ),
      h('div',{className:'g2'},
        h(F,{label:'Màu nền'},h('input',{type:'color',value:form.color||'#FFF8E1',onChange:e=>sf(p=>({...p,color:e.target.value})),style:{height:36,cursor:'pointer'}})),
        h(F,{label:'Màu chữ'},h('input',{type:'color',value:form.textColor||'#333333',onChange:e=>sf(p=>({...p,textColor:e.target.value})),style:{height:36,cursor:'pointer'}}))
      ),
      h('label',{style:{display:'flex',alignItems:'center',gap:8,cursor:'pointer',marginBottom:12}},
        h('input',{type:'checkbox',checked:!!form.active,onChange:e=>sf(p=>({...p,active:e.target.checked}))}),
        'Đang hoạt động'
      ),
      h(Row,null,
        h('button',{onClick:()=>sm(null)},'Hủy'),
        h('button',{className:'bp',onClick:save,style:{padding:'8px 20px'}},'Lưu ca')
      )
    )
  );
}
/* ─── AREAS TAB ─── */
function AreasTab({areas,setAreas,customers,orders}){
  const[q,sq]=useState('');
  const[modal,sm]=useState(null);
  const[edit,se]=useState(null);
  const[form,sf]=useState({code:'',name:'',note:''});
  const openNew=()=>{sf({code:'',name:'',note:''});se(null);sm('f');};
  const openEdit=a=>{sf({...a});se(a);sm('f');};
  const save=()=>{
    if(!form.code||!form.name){window.showToast('Nhập mã và tên khu vực!','warn');return;}
    if(edit){
      setAreas(p=>p.map(a=>a.id===edit.id?{...a,...form}:a));
      // Cập nhật area string trong tất cả points của customers
      setCustomers(prev=>prev.map(c=>({...c,points:(c.points||[]).map(pt=>
        pt.areaId===edit.id?{...pt,area:form.code}:pt
      )})));
    } else {
      const id='AREA_'+uid();
      setAreas(p=>[...p,{id,code:form.code,name:form.name,note:form.note}]);
    }
    sm(null);
  };
  const del=a=>{
    // Đếm điểm giao dùng khu vực này
    const ptCount=customers.reduce((s,c)=>s+(c.points||[]).filter(p=>p.areaId===a.id||p.area===a.code).length,0);
    const odCount=(orders||[]).filter(o=>o.area===a.code).length;
    if(ptCount>0||odCount>0){
      if(!confirm('Khu vực "'+a.name+'" đang có '+ptCount+' địa điểm và '+odCount+' đơn hàng.\nXóa sẽ mất thông tin khu vực. Tiếp tục?'))return;
    } else {
      if(!confirm('Xóa khu vực "'+a.name+'"?'))return;
    }
    setAreas(p=>p.filter(x=>x.id!==a.id));
  };
  // Migration: tự đồng bộ area string từ customers vào areas list
  const migrate=()=>{
    const existCodes=new Set(areas.map(a=>a.code));
    const newAreas=[...areas];
    let added=0;
    customers.forEach(c=>(c.points||[]).forEach(pt=>{
      const code=(pt.area||'').trim();
      if(code&&!existCodes.has(code)){
        newAreas.push({id:'AREA_'+uid(),code,name:code,note:'Tự tạo từ dữ liệu cũ'});
        existCodes.add(code);added++;
      }
    }));
    if(added>0){setAreas(newAreas);window.showToast('Đã thêm '+added+' khu vực mới từ dữ liệu hiện có!','success');}
    else window.showToast('Dữ liệu đã đồng bộ, không có khu vực mới.','info');
  };
  const list=areas.filter(a=>!q||(a.code+a.name).toLowerCase().includes(q.toLowerCase()));
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-map-2',style:{fontSize:20}}),'Quản lý khu vực'),
    h('div',{style:{display:'flex',gap:8,marginBottom:'1rem',flexWrap:'wrap',alignItems:'center'}},
      h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm khu vực...'}),
      h('button',{onClick:migrate,style:{padding:'6px 12px',fontSize:12,border:'1px solid #856404',color:'#856404',background:'transparent',borderRadius:'var(--r)',cursor:'pointer',display:'flex',alignItems:'center',gap:4}},
        h('i',{className:'ti ti-refresh',style:{fontSize:13}}),'Đồng bộ từ dữ liệu cũ'),
      h(AddBtn,{onClick:openNew,label:'Thêm khu vực'})
    ),
    h('div',{className:'tw'},
      h('table',null,
        h('thead',null,h('tr',null,...['Mã','Tên khu vực','Địa điểm','Đơn hàng','Ghi chú',''].map(c=>h('th',{key:c},c)))),
        h('tbody',null,list.length?list.map(a=>{
          const ptCount=customers.reduce((s,c)=>s+(c.points||[]).filter(p=>p.areaId===a.id||p.area===a.code).length,0);
          const odCount=(orders||[]).filter(o=>o.area===a.code).length;
          // Lấy danh sách KH có địa điểm trong khu vực này
          const custNames=[...new Set(customers.filter(c=>(c.points||[]).some(p=>p.areaId===a.id||p.area===a.code)).map(c=>c.name))];
          return h('tr',{key:a.id},
            h('td',null,h('span',{style:{background:'var(--pri)',color:'#fff',padding:'2px 10px',borderRadius:10,fontSize:12,fontWeight:700}},a.code)),
            h('td',null,h('span',{style:{fontWeight:600}},a.name)),
            h('td',null,
              h('div',{style:{fontSize:12}},
                h('span',{style:{fontWeight:600,color:'var(--pri)'}},ptCount+' điểm'),
                custNames.length>0&&h('div',{style:{fontSize:11,color:'var(--tx2)',marginTop:2}},custNames.slice(0,3).join(', ')+(custNames.length>3?'...':''))
              )
            ),
            h('td',null,h('span',{style:{fontSize:12,color:'var(--tx2)'}},odCount>0?odCount+' đơn':'—')),
            h('td',null,h('span',{style:{fontSize:12,color:'var(--tx2)'}},a.note||'—')),
            h('td',null,h('div',{style:{display:'flex',gap:4}},
              h('button',{className:'bi',onClick:()=>openEdit(a)},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
              h('button',{className:'bi',onClick:()=>del(a),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
            ))
          );
        }):h('tr',null,h('td',{colSpan:6,className:'empty-st'},'Chưa có khu vực nào.')))
      )
    ),
    modal==='f'&&h(Modal,{title:edit?'Sửa khu vực':'Thêm khu vực mới',onClose:()=>sm(null)},
      h('div',{className:'g2'},
        h(F,{label:'Mã khu vực *'},h('input',{value:form.code,onChange:e=>sf(p=>({...p,code:e.target.value.toUpperCase()})),placeholder:'KV, VP, ĐT, BN...'})),
        h(F,{label:'Tên khu vực *'},h('input',{value:form.name,onChange:e=>sf(p=>({...p,name:e.target.value})),placeholder:'Khu vực Kỳ Vọng...'})),
      ),
      h(F,{label:'Ghi chú'},h('input',{value:form.note,onChange:e=>sf(p=>({...p,note:e.target.value})),placeholder:'Mô tả thêm...'})),
      h(Row,null,
        h('button',{onClick:()=>sm(null)},'Hủy'),
        h('button',{className:'bp',onClick:save,style:{padding:'8px 20px'}},'Lưu khu vực')
      )
    )
  );
}

function CustomersTab({customers,setCustomers,shifts,orders,areas,cu}){
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[open,so]=useState(null);const[q,sq]=useState('');
  const save=(d,close)=>{if(edit)setCustomers(p=>p.map(x=>x.id===edit.id?d:x));else setCustomers(p=>[...p,d]);if(close!==false){sm(null);se(null);}};
  const del=id=>{window.scfConfirm('Bạn có chắc muốn xóa khách hàng này?','Xóa khách hàng',true).then(ok=>{if(ok){setCustomers(p=>p.filter(x=>x.id!==id));window.showToast('Đã xóa khách hàng','success');}});};
  const ECOLS=[['code','Mã KH'],['name','Tên KH'],['group','Nhóm khách hàng'],['taxCode','MST'],['address','Địa chỉ'],['note','Ghi chú']];
  const list=customers.filter(x=>!q||x.name.toLowerCase().includes(q.toLowerCase())||(x.group||'').toLowerCase().includes(q.toLowerCase())||x.taxCode.includes(q)).sort((a,b)=>(a.code||a.id||'').localeCompare(b.code||b.id||''));
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-users',style:{fontSize:20}}),'Danh mục khách hàng'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm khách hàng...'}),
      h('div',{style:{display:'flex',gap:6}},
        h(ExportBtn,{onClick:()=>xlsxExport(list,ECOLS,'Khach_hang')}),
        h(ImportBtn,{onFile:rows=>{
          const added=rows.map(r=>({id:'KH'+uid(),name:r['Tên KH']||'',group:r['Nhóm khách hàng']||'',taxCode:r['MST']||'',address:r['Địa chỉ']||'',note:r['Ghi chú']||'',points:[]})).filter(r=>r.name);
          setCustomers(p=>[...p,...added]);window.showToast('Đã nhập '+added.length+' khách hàng','success');
        }}),
        (!cu||canWrite(cu.role,'customers',cu.permLevels))&&h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Thêm khách hàng'})
      )
    ),
    h('div',{className:'tw'},
      h('table',null,
        h('thead',null,h('tr',null,...['Mã KH','Khách hàng','Nhóm khách hàng','Mã số thuế','Địa chỉ','Địa điểm giao',''].map(c=>h('th',{key:c},c)))),
        h('tbody',null,list.length?list.map(c=>h(React.Fragment,{key:c.id},
          h('tr',{style:{cursor:'pointer'},onClick:()=>so(open===c.id?null:c.id)},
            h('td',null,h('span',{style:{color:'var(--pri)',fontWeight:500}},c.code||c.id)),
            h('td',null,
              h('div',{style:{display:'flex',alignItems:'center',gap:8}},
                h('div',{style:{width:30,height:30,borderRadius:'50%',background:'var(--bg2)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,color:'var(--pri)',flexShrink:0}},initials(c.name)),
                h('div',{style:{fontWeight:500}},c.name)
              )
            ),
            h('td',null,h('span',{style:{color:'var(--tx2)'}},c.group||'—')),
            h('td',null,c.taxCode||'—'),
            h('td',null,h('span',{style:{color:'var(--tx2)',display:'block',maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},c.address||'—')),
            h('td',null,h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--tx)'}},c.points.length+' địa điểm')),
            h('td',null,h('div',{style:{display:'flex',gap:2},onClick:e=>e.stopPropagation()},
              h('button',{className:'bi',onClick:()=>{se(c);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
              h('button',{className:'bi',onClick:()=>del(c.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
            ))
          ),
          open===c.id&&h('tr',null,h('td',{colSpan:7,style:{background:'var(--bg2)',padding:'10px 16px'}},
            h('div',{style:{fontWeight:500,fontSize:12,color:'var(--tx2)',marginBottom:8}},'Danh sách địa điểm giao hàng:'),
            c.points.length?h('div',{style:{display:'flex',flexWrap:'wrap',gap:8}},
              c.points.map(pt=>h('div',{key:pt.id,style:{background:'#fff',border:'.5px solid var(--bd)',borderRadius:6,padding:'8px 12px',fontSize:12,minWidth:180}},
                h('div',{style:{fontWeight:500,display:'flex',alignItems:'center',gap:5}},h('i',{className:'ti ti-map-pin',style:{fontSize:12,color:'var(--pri)'}}),pt.name),
                h('div',{style:{color:'var(--tx2)',marginTop:2}},pt.address),
              pt.area&&h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--tx)',marginTop:3,fontSize:10}},h('i',{className:'ti ti-map-pin',style:{fontSize:10,marginRight:3}}),pt.area),
                pt.contact&&h('div',{style:{color:'var(--tx2)',marginTop:1}},pt.contact+' • '+pt.phone)
              ))
            ):h('span',{style:{fontSize:12,color:'var(--tx2)'}},'Chưa có địa điểm giao hàng.')
          ))
        )):h('tr',null,h('td',{colSpan:7,className:'empty-st'},'Chưa có khách hàng nào.')))
      )
    ),
    modal==='f'&&h(CustomerForm,{cust:edit,shifts,customers,orders,areas,onSave:save,onClose:()=>{sm(null);se(null);}})
  );
}

/* ─── WORK CATEGORIES ─── */
function DeptForm({dept,depts,onSave,onClose}){
  const nextDeptCode=()=>{
    const nums=(depts||[]).map(d=>String(d.code||d.id||'').match(/^BP0*(\d+)$/i)).filter(Boolean).map(m=>Number(m[1])||0);
    return 'BP'+String((nums.length?Math.max(...nums):0)+1).padStart(2,'0');
  };
  const[f,sf]=useState(dept?{...dept,code:dept.code||dept.id||''}:{code:nextDeptCode(),name:'',note:''});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const submit=()=>{
    const code=(f.code||'').trim().toUpperCase();
    if(!code){window.showToast('Nhập mã bộ phận!','warn');return;}
    if((depts||[]).some(d=>(d.code||d.id||'').trim().toUpperCase()===code&&d.id!==(dept&&dept.id))){window.showToast('Mã bộ phận này đã tồn tại!','warn');return;}
    if(!f.name||!f.name.trim()){window.showToast('Nhập tên bộ phận!','warn');return;}
    if(!dept&&depts.some(d=>d.name.trim().toLowerCase()===f.name.trim().toLowerCase())){window.showToast('Bộ phận này đã tồn tại!','warn');return;}
    onSave({...f,code,name:f.name.trim(),id:dept?.id||code});
  };
  return h(Modal,{title:dept?'Sửa bộ phận':'Thêm bộ phận',onClose},
    h('div',{className:'g2'},
      h(F,{label:'Mã bộ phận *'},h('input',{value:f.code||'',onChange:e=>s('code',e.target.value.toUpperCase()),placeholder:'BP001',autoFocus:true})),
      h(F,{label:'Tên bộ phận *'},h('input',{value:f.name,onChange:e=>s('name',e.target.value),placeholder:'Ví dụ: Kế toán, Kho vận...'}))
    ),
    h(F,{label:'Ghi chú'},h('input',{value:f.note,onChange:e=>s('note',e.target.value)})),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'}},'Lưu bộ phận'))
  );
}
function DeptsTab({depts,setDepts,employees,workcats}){
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[q,sq]=useState('');
  const withCodes=(depts||[]).map((d,i)=>({...d,code:d.code||deptCode(i)}));
  const save=d=>{if(edit)setDepts(p=>p.map(x=>x.id===edit.id?d:x));else setDepts(p=>[...p,d]);sm(null);se(null);};
  const del=(id,name)=>{
    const empCount=(employees||[]).filter(e=>e.dept===name).length;
    const wcCount=(workcats||[]).filter(w=>w.dept===name).length;
    if(empCount>0||wcCount>0){window.showToast('Bộ phận này đang được dùng cho '+empCount+' nhân viên và '+wcCount+' công việc, không thể xóa!','error');return;}
    window.scfConfirm('Bạn có chắc muốn xóa bộ phận này?','Xóa bộ phận',true).then(ok=>{if(ok){setDepts(p=>p.filter(x=>x.id!==id));window.showToast('Đã xóa bộ phận','success');}});
  };
  const list=withCodes
    .filter(x=>!q||x.name.toLowerCase().includes(q.toLowerCase())||(x.code||'').toLowerCase().includes(q.toLowerCase()))
    .sort((a,b)=>(a.code||'').localeCompare(b.code||'','vi',{numeric:true,sensitivity:'base'}));
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-sitemap',style:{fontSize:20}}),'Danh mục bộ phận'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm bộ phận...'}),
      h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Thêm bộ phận'})
    ),
    h(TableWrap,{cols:['Mã BP','Tên bộ phận','Số nhân viên','Số công việc','Ghi chú',''],empty:'Chưa có bộ phận nào.',
      rows:list.map(x=>h('tr',{key:x.id},
        h('td',null,h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--pri3)',fontWeight:700}},x.code||'—')),
        h('td',null,h('div',{style:{fontWeight:500}},x.name)),
        h('td',null,h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--tx)'}},(employees||[]).filter(e=>e.dept===x.name).length)),
        h('td',null,h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--tx)'}},(workcats||[]).filter(w=>w.dept===x.name).length)),
        h('td',null,x.note||'—'),
        h('td',null,h('div',{style:{display:'flex',gap:2}},
          h('button',{className:'bi',onClick:()=>{se(x);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
          h('button',{className:'bi',onClick:()=>del(x.id,x.name),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
        ))
      ))
    }),
    modal==='f'&&h(DeptForm,{dept:edit,depts:withCodes,onSave:save,onClose:()=>{sm(null);se(null);}})
  );
}
function WorkCatForm({cat,depts,onSave,onClose}){
  const deptNames=(depts&&depts.length?depts.map(d=>d.name):DEPTS);
  const[f,sf]=useState(cat||{code:'',name:'',dept:deptNames[0],unit:'Tấn',rate:'',desc:'',duration:'',qualityReq:'',note:''});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const submit=()=>{if(!f.name){window.showToast('Nhập tên công việc!','warn');return;}onSave({...f,id:cat?.id||'CV'+uid(),rate:numFmt(f.rate)});};
  return h(Modal,{title:cat?'Sửa công việc':'Thêm danh mục công việc',onClose},
    h('div',{className:'g2'},
      h(F,{label:'Mã công việc'},h('input',{value:f.code,onChange:e=>s('code',e.target.value),placeholder:'CV001'})),
      h(F,{label:'Bộ phận'},h('select',{value:f.dept,onChange:e=>s('dept',e.target.value)},deptNames.map(d=>h('option',{key:d,value:d},d)))),
    ),
    h(F,{label:'Tên công việc *'},h('input',{value:f.name,onChange:e=>s('name',e.target.value),placeholder:'Bốc xếp, Vận chuyển...'})),
    h(F,{label:'Mô tả công việc'},h('textarea',{value:f.desc||'',onChange:e=>s('desc',e.target.value),rows:3,placeholder:'Mô tả chi tiết nội dung cần thực hiện...'})),
    h('div',{className:'g2'},
      h(F,{label:'Thời gian'},h('input',{value:f.duration||'',onChange:e=>s('duration',e.target.value),placeholder:'Ví dụ: 30 phút, 1 ca, trước 17:00...'})),
      h(F,{label:'Yêu cầu chất lượng'},h('input',{value:f.qualityReq||'',onChange:e=>s('qualityReq',e.target.value),placeholder:'Ví dụ: đúng số lượng, sạch, không hư hỏng...'}))
    ),
    h('div',{className:'g2'},
      h(F,{label:'Đơn vị tính khối lượng'},h('select',{value:f.unit,onChange:e=>s('unit',e.target.value)},UNITS.map(u=>h('option',{key:u,value:u},u)))),
      h(F,{label:'Đơn giá công (đ/đv)'},h(NumInput,{value:f.rate,onChange:v=>s('rate',v),placeholder:'0'})),
    ),
    h(F,{label:'Ghi chú'},h('input',{value:f.note,onChange:e=>s('note',e.target.value)})),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'}},'Lưu công việc'))
  );
}
function WorkCatsTab({workcats,setWorkcats,depts}){
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[q,sq]=useState('');
  const save=d=>{if(edit)setWorkcats(p=>p.map(x=>x.id===edit.id?d:x));else setWorkcats(p=>[...p,d]);sm(null);se(null);};
  const del=id=>{window.scfConfirm('Bạn có chắc muốn xóa công việc này?','Xóa công việc',true).then(ok=>{if(ok){setWorkcats(p=>p.filter(x=>x.id!==id));window.showToast('Đã xóa công việc','success');}});};
  const list=workcats.filter(x=>!q||[x.code,x.name,x.dept,x.desc,x.duration,x.qualityReq,x.note].some(v=>(v||'').toLowerCase().includes(q.toLowerCase())));
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-checklist',style:{fontSize:20}}),'Danh mục công việc'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm công việc...'}),
      h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Thêm công việc'})
    ),
    h(TableWrap,{cols:['Mã','Tên công việc','Bộ phận','Mô tả','Thời gian','Yêu cầu chất lượng','ĐV khối lượng','Đơn giá công','Ghi chú',''],empty:'Chưa có danh mục công việc nào.',
      rows:list.map(x=>h('tr',{key:x.id},
        h('td',null,h('span',{style:{color:'var(--pri)',fontWeight:500}},x.code||x.id)),
        h('td',null,h('div',{style:{fontWeight:500}},x.name)),
        h('td',null,h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--tx)'}},x.dept)),
        h('td',null,h('span',{style:{fontSize:12,color:'var(--tx2)'}},x.desc||'—')),
        h('td',null,h('span',{style:{fontSize:12}},x.duration||'—')),
        h('td',null,h('span',{style:{fontSize:12,color:'var(--tx2)'}},x.qualityReq||'—')),
        h('td',null,x.unit),
        h('td',null,moneyFmt(x.rate)),
        h('td',null,x.note||'—'),
        h('td',null,h('div',{style:{display:'flex',gap:2}},
          h('button',{className:'bi',onClick:()=>{se(x);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
          h('button',{className:'bi',onClick:()=>del(x.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
        ))
      ))
    }),
    modal==='f'&&h(WorkCatForm,{cat:edit,depts,onSave:save,onClose:()=>{sm(null);se(null);}})
  );
}

function TaskForm({task,workcats,employees,currentUser,onSave,onClose}){
  const canManage=currentUser.role==='admin'||currentUser.role==='manager';
  const staff=employees.filter(e=>e.role!=='admin'||e.id===currentUser.id);
  const deptOptions=[...new Set([...(workcats||[]).map(w=>w.dept).filter(Boolean),...(staff||[]).map(e=>e.dept).filter(Boolean)])].sort((a,b)=>a.localeCompare(b,'vi'));
  const taskEmp=task?employees.find(e=>e.id===task.empId):null;
  const taskWc=task?workcats.find(w=>w.id===task.workCatId||w.code===task.workCatId):null;
  const initialDept=task?(task.dept||taskEmp?.dept||taskWc?.dept||''):(canManage?'':(currentUser.dept||''));
  const[f,sf]=useState(task?{...task,dept:initialDept}:{date:fmtDate(),dept:initialDept,empId:canManage?'':currentUser.id,workCatId:'',qtyAssign:0,dueDate:fmtDate(),shift:'',location:'',note:'',status:'assigned'});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const groupStaff=staff.filter(e=>!f.dept||e.dept===f.dept);
  const groupWorkcats=workcats.filter(w=>!f.dept||w.dept===f.dept);
  const setDept=v=>sf(p=>({...p,dept:v,empId:canManage?'':p.empId,workCatId:''}));
  const emp=employees.find(e=>e.id===f.empId)||{};
  const wc=workcats.find(w=>w.id===f.workCatId||w.code===f.workCatId)||{};
  const submit=()=>{
    if(!f.dept){window.showToast('Chọn nhóm/bộ phận.','warn');return;}
    if(!f.empId){window.showToast('Chọn nhân viên.','warn');return;}
    if(!f.workCatId){window.showToast('Chọn công việc.','warn');return;}
    const taskDate=parseAnyDate(f.date);
    const dueDate=parseAnyDate(f.dueDate);
    if(taskDate&&dueDate&&dueDate<taskDate){window.showToast('Hạn hoàn thành không được nhỏ hơn ngày giao việc.','warn');return;}
    onSave({...f,empName:emp.name||'',dept:f.dept||emp.dept||wc.dept||'',workCatName:wc.name||'',workCatCode:wc.code||wc.id||'',workDesc:wc.desc||'',workDuration:wc.duration||'',qualityReq:wc.qualityReq||'',unit:wc.unit||'',rate:numFmt(wc.rate),status:f.status||'assigned',updatedBy:currentUser.name,updatedAt:fmtDT()});
  };
  return h(Modal,{title:task?'Sửa phiếu giao việc':'Giao việc cho nhân viên',onClose,lg:true},
    h('div',{className:'g3'},
      h(F,{label:'Ngày giao'},h('input',{value:f.date,onChange:e=>s('date',e.target.value),placeholder:'DD/MM/YYYY'})),
      h(F,{label:'Nhóm / Bộ phận *'},h('select',{value:f.dept||'',onChange:e=>setDept(e.target.value),disabled:!canManage},
        h('option',{value:''},'— Chọn nhóm —'),deptOptions.map(d=>h('option',{key:d,value:d},d))
      )),
      h(F,{label:'Hạn hoàn thành'},h('input',{value:f.dueDate,onChange:e=>s('dueDate',e.target.value),placeholder:'DD/MM/YYYY'}))
    ),
    h('div',{className:'g3'},
      h(F,{label:'Nhân viên *'},h('select',{value:f.empId,onChange:e=>s('empId',e.target.value),disabled:!f.dept},
        h('option',{value:''},f.dept?'— Chọn nhân viên trong nhóm —':'— Chọn nhóm trước —'),groupStaff.map(e=>h('option',{key:e.id,value:e.id},e.id+' - '+e.name))
      )),
      h(F,{label:'Công việc *'},h('select',{value:f.workCatId,onChange:e=>s('workCatId',e.target.value),disabled:!f.dept},
        h('option',{value:''},f.dept?'— Chọn việc của nhóm —':'— Chọn nhóm trước —'),groupWorkcats.map(w=>h('option',{key:w.id,value:w.id},(w.code||w.id)+' - '+w.name+' ('+(w.unit||'')+')'))
      )),
      h(F,{label:'Khối lượng giao'},h('input',{type:'number',min:0,step:'0.01',value:f.qtyAssign,onChange:e=>s('qtyAssign',numFmt(e.target.value))})),
    ),
    (wc.desc||wc.duration||wc.qualityReq)&&h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'10px 12px',marginBottom:12,fontSize:12,color:'var(--tx2)',lineHeight:1.5}},
      wc.desc&&h('div',null,h('b',{style:{color:'var(--pri3)'}},'Mô tả: '),wc.desc),
      wc.duration&&h('div',null,h('b',{style:{color:'var(--pri3)'}},'Thời gian: '),wc.duration),
      wc.qualityReq&&h('div',null,h('b',{style:{color:'var(--pri3)'}},'Yêu cầu chất lượng: '),wc.qualityReq)
    ),
    h('div',{className:'g3'},
      h(F,{label:'Ca / thời gian'},h('input',{value:f.shift||'',onChange:e=>s('shift',e.target.value),placeholder:'Ca sáng, 08:00-11:00...'})),
      h(F,{label:'Địa điểm / khu vực'},h('input',{value:f.location||'',onChange:e=>s('location',e.target.value),placeholder:'Kho, xưởng, bếp...'})),
      h(F,{label:'Trạng thái'},h('select',{value:f.status,onChange:e=>s('status',e.target.value)},
        [['assigned','Đã giao'],['doing','Đang làm'],['submitted','Chờ duyệt'],['approved','Đã duyệt'],['returned','Trả lại'],['cancelled','Hủy']].map(([v,l])=>h('option',{key:v,value:v},l))
      ))
    ),
    h(F,{label:'Ghi chú giao việc'},h('textarea',{value:f.note||'',onChange:e=>s('note',e.target.value),rows:2})),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'}},'Lưu phiếu'))
  );
}

function TaskReportModal({task,currentUser,onSave,onClose}){
  const[f,sf]=useState({qtyReport:task.qtyReport||task.qtyAssign||0,reportNote:task.reportNote||'',status:'submitted'});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const submit=()=>{
    if(numFmt(f.qtyReport)<=0&&!confirm('Khối lượng báo cáo đang bằng 0. Vẫn gửi báo cáo?'))return;
    if(numFmt(f.qtyReport)>numFmt(task.qtyAssign||0)&&!confirm('Khối lượng báo cáo đang lớn hơn khối lượng giao. Vẫn gửi báo cáo?'))return;
    onSave({...task,qtyReport:numFmt(f.qtyReport),reportNote:f.reportNote||'',status:'submitted',reportedBy:currentUser.name,reportedAt:fmtDT(),updatedBy:currentUser.name,updatedAt:fmtDT()});
  };
  return h(Modal,{title:'Báo cáo công việc - '+(task.workCatName||''),onClose},
    h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'10px 12px',fontSize:13,marginBottom:10}},
      h('div',null,h('b',null,task.empName),' · ',task.date,' · ',task.location||''),
      h('div',{style:{marginTop:4,color:'var(--tx2)'}},'Giao: '+(task.qtyAssign||0)+' '+(task.unit||''))
    ),
    h(F,{label:'Khối lượng thực tế'},h('input',{type:'number',step:'0.01',min:0,value:f.qtyReport,onChange:e=>s('qtyReport',numFmt(e.target.value))})),
    h(F,{label:'Ghi chú báo cáo'},h('textarea',{value:f.reportNote,onChange:e=>s('reportNote',e.target.value),rows:3,placeholder:'Nội dung đã làm, vấn đề phát sinh...'})),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit},'Gửi báo cáo'))
  );
}

function TaskApproveModal({task,currentUser,onSave,onClose}){
  const[f,sf]=useState({qtyApproved:task.qtyApproved??task.qtyReport??task.qtyAssign??0,reviewNote:task.reviewNote||''});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const submit=()=>{
    if(numFmt(f.qtyApproved)<0){window.showToast('Khối lượng duyệt không hợp lệ.','warn');return;}
    if(numFmt(f.qtyApproved)===0&&!confirm('Khối lượng duyệt đang bằng 0. Vẫn lưu duyệt?'))return;
    if(numFmt(f.qtyApproved)>numFmt(task.qtyReport??task.qtyAssign??0)&&!confirm('Khối lượng duyệt đang lớn hơn khối lượng báo cáo. Vẫn tiếp tục?'))return;
    onSave({...task,qtyApproved:numFmt(f.qtyApproved),reviewNote:f.reviewNote||'',status:'approved',approvedBy:currentUser.name,approvedAt:fmtDT(),updatedBy:currentUser.name,updatedAt:fmtDT()});
  };
  return h(Modal,{title:'Duyệt khối lượng công - '+(task.workCatName||''),onClose},
    h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'10px 12px',fontSize:13,marginBottom:10,lineHeight:1.6}},
      h('div',null,h('b',null,task.empName||'—'),' · ',task.date||'—',' · ',task.location||''),
      h('div',{style:{marginTop:4,color:'var(--tx2)'}},'Giao: '+numFmt(task.qtyAssign||0)+' '+(task.unit||'')+' · Báo cáo: '+numFmt(task.qtyReport||0)+' '+(task.unit||'')),
      task.reportNote&&h('div',{style:{marginTop:4,color:'var(--tx2)'}},'Ghi chú NV: ',task.reportNote)
    ),
    h(F,{label:'Khối lượng duyệt'},h('input',{type:'number',step:'0.01',min:0,value:f.qtyApproved,onChange:e=>s('qtyApproved',numFmt(e.target.value))})),
    h(F,{label:'Nhận xét quản lý'},h('textarea',{value:f.reviewNote,onChange:e=>s('reviewNote',e.target.value),rows:3,placeholder:'Ghi nhận phần duyệt, phần trừ công, lý do...'})),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit},'Xác nhận duyệt'))
  );
}

function TasksTab({tasks,setTasks,workcats,employees,currentUser}){
  const canManage=currentUser.role==='admin'||currentUser.role==='manager';
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[report,sr]=useState(null);const[approveItem,sa]=useState(null);const[q,sq]=useState('');const[status,ss]=useState('all');const[deptFilter,setDeptFilter]=useState('all');const[empFilter,setEmpFilter]=useState('all');
  let seq=tasks.length+1;
  const save=d=>{if(edit)setTasks(p=>p.map(x=>x.id===edit.id?{...x,...d}:x));else{const id='GV'+String(seq++).padStart(4,'0');setTasks(p=>[{...d,id,createdBy:currentUser.name,createdAt:fmtDT()},...p]);}sm(null);se(null);};
  const saveReport=d=>{setTasks(p=>p.map(x=>x.id===d.id?d:x));sr(null);};
  const del=id=>{window.scfConfirm('Bạn có chắc muốn xóa phiếu giao việc này?','Xóa phiếu giao việc',true).then(ok=>{if(ok){setTasks(p=>p.filter(x=>x.id!==id));window.showToast('Đã xóa phiếu giao việc','success');}});};
  const setStatus=(id,data)=>setTasks(p=>p.map(x=>x.id===id?{...x,...data,updatedBy:currentUser.name,updatedAt:fmtDT()}:x));
  const back=t=>{const note=prompt('Lý do trả lại:',t.reviewNote||'');if(note!==null)setStatus(t.id,{status:'returned',reviewNote:note});};
  const baseRows=tasks.filter(t=>canManage||t.empId===currentUser.id);
  const deptOptions=[...new Set(baseRows.map(t=>t.dept).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const empOptions=[...new Map(baseRows.filter(t=>deptFilter==='all'||t.dept===deptFilter).map(t=>[t.empId,{id:t.empId,name:t.empName||t.empId,dept:t.dept||''}])).values()];
  const todayDate=parseAnyDate(isoDate());
  const isOverdue=t=>{
    const due=parseAnyDate(t.dueDate);
    return !!(due&&todayDate&&due<todayDate&&!['approved','cancelled'].includes(t.status));
  };
  const matchesSearch=t=>!q||[t.id,t.empName,t.workCatName,t.workCatCode,t.dept,t.location,t.note,t.reportNote,t.reviewNote].some(x=>String(x||'').toLowerCase().includes(q.toLowerCase()));
  const scopedRows=baseRows.filter(t=>(deptFilter==='all'||t.dept===deptFilter)&&(empFilter==='all'||t.empId===empFilter)&&matchesSearch(t));
  const rows=scopedRows.filter(t=>status==='all'||t.status===status);
  const totalApproved=rows.filter(t=>t.status==='approved').reduce((s,t)=>s+numFmt(t.qtyApproved||t.qtyReport||0)*numFmt(t.rate),0);
  const overdueCount=rows.filter(isOverdue).length;
  const sts=[['all','Tất cả'],['assigned','Đã giao'],['doing','Đang làm'],['submitted','Chờ duyệt'],['approved','Đã duyệt'],['returned','Trả lại'],['cancelled','Hủy']];
  const statusLabel=s=>({assigned:'Đã giao',doing:'Đang làm',submitted:'Chờ duyệt',approved:'Đã duyệt',returned:'Trả lại',cancelled:'Hủy'}[s]||s);
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-clipboard-check',style:{fontSize:20}}),canManage?'Giao việc & báo cáo':'Công việc của tôi'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,marginBottom:'1rem',flexWrap:'wrap'}},
      h('div',{style:{display:'flex',gap:5,flexWrap:'wrap'}},sts.map(([v,l])=>h('button',{key:v,className:'pill'+(status===v?' on':''),onClick:()=>ss(v)},l+' ('+(v==='all'?scopedRows.length:scopedRows.filter(t=>t.status===v).length)+')'))),
      h('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},
        h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm công việc...'}),
        canManage&&h('select',{value:deptFilter,onChange:e=>{setDeptFilter(e.target.value);setEmpFilter('all');},style:{minWidth:150}},
          h('option',{value:'all'},'Tất cả bộ phận'),
          deptOptions.map(d=>h('option',{key:d,value:d},d))
        ),
        canManage&&h('select',{value:empFilter,onChange:e=>setEmpFilter(e.target.value),style:{minWidth:170}},
          h('option',{value:'all'},deptFilter==='all'?'Tất cả nhân viên':'Nhân viên trong bộ phận'),
          empOptions.map(e=>h('option',{key:e.id,value:e.id},e.name+' ('+e.id+')'))
        ),
        canManage&&h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Giao việc'})
      )
    ),
    h('div',{style:{display:'grid',gridTemplateColumns:'repeat(5,minmax(120px,1fr))',gap:8,marginBottom:'1rem'}},
      h('div',{className:'card',style:{padding:'10px 14px'}},h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Phiếu'),h('b',null,rows.length)),
      h('div',{className:'card',style:{padding:'10px 14px'}},h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Chờ duyệt'),h('b',null,rows.filter(t=>t.status==='submitted').length)),
      h('div',{className:'card',style:{padding:'10px 14px'}},h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Đã duyệt'),h('b',null,rows.filter(t=>t.status==='approved').length)),
      h('div',{className:'card',style:{padding:'10px 14px'}},h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Quá hạn'),h('b',{style:{color:overdueCount?'#A32D2D':'var(--pri3)'}},overdueCount)),
      h('div',{className:'card',style:{padding:'10px 14px'}},h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Tiền công duyệt'),h('b',null,moneyFmt(totalApproved)))
    ),
    h('div',{className:'tw'},
      h('table',null,
        h('thead',null,h('tr',null,...['Mã','Ngày','Nhân viên','Công việc','Giao','Báo cáo','Tiền công','Trạng thái',''].map(c=>h('th',{key:c},c)))),
        h('tbody',null,rows.length?rows.map(t=>{
          const approvedAmount=t.status==='approved'?numFmt(t.qtyApproved||0)*numFmt(t.rate):0;
          const provisionalAmount=t.status!=='approved'&&t.qtyReport!==undefined?numFmt(t.qtyReport||0)*numFmt(t.rate):0;
          return h('tr',{key:t.id},
            h('td',null,h('span',{style:{color:'var(--pri)',fontWeight:600}},t.id)),
            h('td',null,h('div',null,t.date||'—'),t.dueDate&&h('div',{style:{fontSize:11,color:isOverdue(t)?'#A32D2D':'var(--tx2)',fontWeight:isOverdue(t)?600:400}},'Hạn: '+t.dueDate)),
            h('td',null,h('div',{style:{fontWeight:500}},t.empName||'—'),h('div',{style:{fontSize:11,color:'var(--tx2)'}},t.dept||'')),
            h('td',null,h('div',{style:{fontWeight:500}},t.workCatName||'—'),h('div',{style:{fontSize:11,color:'var(--tx2)'}},[t.location,t.shift,t.note].filter(Boolean).join(' · '))),
            h('td',null,(t.qtyAssign||0)+' '+(t.unit||'')),
            h('td',null,
              h('div',{style:{fontWeight:600,color:t.status==='submitted'||t.status==='approved'?'var(--pri)':'var(--tx)'}},(t.qtyReport??'—')+(t.qtyReport!==undefined?' '+(t.unit||''):'')),
              t.reportNote&&h('div',{style:{fontSize:11,color:'var(--tx2)',maxWidth:220}},t.reportNote),
              t.reviewNote&&h('div',{style:{fontSize:11,color:t.status==='returned'?'#A32D2D':'#185FA5',maxWidth:220,marginTop:3}},'QL: '+t.reviewNote)
            ),
            h('td',null,
              approvedAmount?h('div',{style:{fontWeight:650,color:'var(--pri3)'}},moneyFmt(approvedAmount))
              :provisionalAmount?h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Tạm tính '+moneyFmt(provisionalAmount))
              :'—',
              t.status==='approved'&&h('div',{style:{fontSize:11,color:'var(--tx2)',marginTop:2}},'Duyệt '+numFmt(t.qtyApproved||0)+' '+(t.unit||'')),
              t.status!=='approved'&&t.rate?h('div',{style:{fontSize:11,color:'var(--tx2)',marginTop:2}},'Đơn giá '+moneyFmt(t.rate)+' / '+(t.unit||'đv')):null
            ),
            h('td',null,h('span',{className:'badge',style:{background:t.status==='approved'?'#E1F5EE':t.status==='submitted'?'#E6F1FB':t.status==='returned'?'#FCEBEB':'var(--bg2)',color:t.status==='approved'?'#0F6E56':t.status==='submitted'?'#185FA5':t.status==='returned'?'#A32D2D':'var(--tx)'}},statusLabel(t.status))),
            h('td',null,h('div',{style:{display:'flex',gap:2}},
              !canManage&&['assigned','returned'].includes(t.status)&&h('button',{className:'bi',title:'Bắt đầu làm',onClick:()=>setStatus(t.id,{status:'doing'})},h('i',{className:'ti ti-player-play',style:{fontSize:15}})),
              !canManage&&['assigned','doing','returned'].includes(t.status)&&h('button',{className:'bi',title:'Báo cáo',onClick:()=>sr(t)},h('i',{className:'ti ti-report',style:{fontSize:15}})),
              canManage&&t.status==='submitted'&&h('button',{className:'bi',title:'Duyệt',onClick:()=>sa(t)},h('i',{className:'ti ti-check',style:{fontSize:15,color:'var(--pri)'}})),
              canManage&&t.status==='submitted'&&h('button',{className:'bi',title:'Trả lại',onClick:()=>back(t)},h('i',{className:'ti ti-arrow-back-up',style:{fontSize:15,color:'#A32D2D'}})),
              canManage&&h('button',{className:'bi',title:'Sửa',onClick:()=>{se(t);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
              canManage&&h('button',{className:'bi',title:'Xóa',onClick:()=>del(t.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
            ))
          );
        }):h('tr',null,h('td',{colSpan:9,className:'empty-st'},'Chưa có công việc nào.')))
      )
    ),
    modal==='f'&&h(TaskForm,{task:edit,workcats,employees,currentUser,onSave:save,onClose:()=>{sm(null);se(null);}}),
    report&&h(TaskReportModal,{task:report,currentUser,onSave:saveReport,onClose:()=>sr(null)}),
    approveItem&&h(TaskApproveModal,{task:approveItem,currentUser,onSave:d=>{setTasks(p=>p.map(x=>x.id===d.id?d:x));sa(null);},onClose:()=>sa(null)})
  );
}

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
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:12,flexWrap:'wrap'}},
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
      ),
      w&&h('div',{style:{display:'flex',gap:8,alignItems:'center',fontSize:12,color:'var(--tx2)',lineHeight:1.8,flexShrink:0}},
        h('div',null,h('i',{className:'ti ti-droplet',style:{fontSize:12,marginRight:3}}),w.relative_humidity_2m+'%'),
        h('div',null,h('i',{className:'ti ti-wind',style:{fontSize:12,marginRight:3}}),w.wind_speed_10m+' km/h')
      )
    ),
    fc.length?h('div',{style:{marginTop:10,display:'grid',gridTemplateColumns:'1fr',gap:10}},
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
function WelcomePage({emp,company}){
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
      
    ),
    h('div',{className:'welcome-grid'},
      h('div',null,h(WeatherWidget,null),h(CalendarWidget,null)),
      bd?h(BirthdayScene,{name:emp&&emp.name||''}):h(SunsetScene,null)
    )
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
    return {fontFamily:safe.fontFamily,fontSize:cur.size,fontWeight:meta.weight,fontStyle:meta.style};
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
          h('select',{value:f.fontFamily,onChange:e=>sf(prev=>({...prev,fontFamily:e.target.value}))},
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
      h('div',{style:{fontWeight:600,color:'var(--pri3)',marginBottom:10}},'Danh sách vùng chữ có thể thay đổi'),
      h('div',{className:'tw'},
        h('table',null,
          h('thead',null,h('tr',null,
            h('th',null,'Vùng hiển thị'),
            h('th',{style:{width:110}},'Cỡ chữ'),
            h('th',{style:{width:170}},'Kiểu chữ'),
            h('th',null,'Xem nhanh')
          )),
          h('tbody',null,
            UI_FONT_SCOPE_OPTIONS.map(scope=>h('tr',{key:scope.key},
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
    h('input',{type:show?'text':'password',value:value||'',onChange,placeholder:placeholder||'',style:{paddingRight:38}}),
    h('button',{type:'button',className:'bi',onClick:()=>setShow(v=>!v),title:show?'Ẩn mật khẩu':'Hiện mật khẩu',
      style:{position:'absolute',right:6,top:'50%',transform:'translateY(-50%)',width:28,height:28,padding:0,border:'none',background:'transparent',color:'var(--tx2)'}},
      h('i',{className:'ti '+(show?'ti-eye-off':'ti-eye'),style:{fontSize:17}})
    )
  );
}
function EmpForm({emp,employees,depts,cu,cu2,onSave,onClose}){
  const deptNames=(depts&&depts.length?depts.map(d=>d.name):DEPTS);
  const[f,sf]=useState(emp
    ?{...emp,gender:normalizeGenderValue(emp?.gender,emp?.female),female:isFemaleGender(emp?.gender,emp?.female)}
    :{id:'NV'+String(Date.now()).slice(-4),name:'',birthday:'',gender:'male',female:false,dept:deptNames[0],role:'staff',username:'',password:'',phone:'',email:'',note:'',startDate:'',bhxh:false}
  );
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const submit=()=>{
    if(!f.name||!f.username){window.showToast('Nhập tên và tên đăng nhập!','warn');return;}
    if(!emp&&employees.some(e=>e.username===f.username)){window.showToast('Tên đăng nhập đã tồn tại!','error');return;}
    if(!emp&&!f.password){window.showToast('Nhập mật khẩu!','warn');return;}
    const gender=normalizeGenderValue(f.gender,f.female);
    onSave({...f,gender,female:gender==='female',updatedBy:cu.name,updatedAt:fmtDT()});
  };
  return h(Modal,{title:emp?'Sửa nhân viên':'Thêm nhân viên',onClose,lg:true},
    h('div',{className:'g3'},
      h(F,{label:'Mã nhân viên *'},h('input',{value:f.id,onChange:e=>s('id',e.target.value.toUpperCase()),placeholder:'NV001'})),
      h(F,{label:'Họ và tên *'},h('input',{value:f.name,onChange:e=>s('name',e.target.value)})),
      h(F,{label:'Ngày sinh (DD/MM/YYYY)'},h('input',{value:f.birthday,onChange:e=>s('birthday',e.target.value),placeholder:'15/03/1990'})),
    ),
    h('div',{className:'g3'},
      h(F,{label:'Bộ phận'},h('select',{value:f.dept,onChange:e=>s('dept',e.target.value)},deptNames.map(d=>h('option',{key:d,value:d},d)))),
      h(F,{label:'Phân quyền'},h('select',{value:f.role,onChange:e=>s('role',e.target.value)},Object.entries(ROLES).map(([v,l])=>h('option',{key:v,value:v},l)))),
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
      h(F,{label:emp?'Mật khẩu mới (bỏ trống = giữ nguyên)':'Mật khẩu *'},h(PasswordField,{value:f.password,onChange:e=>s('password',e.target.value),placeholder:'••••••'})),
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
          {sec:'Cai dat', pages:[{k:'company',l:'Thong tin cong ty'},{k:'appearance',l:'Cai dat giao dien'},{k:'printtemplates',l:'Mau in Excel va mapping'},{k:'employees',l:'Nhan vien'},{k:'attendance',l:'Cham cong'},{k:'advances',l:'Ung luong'},{k:'rewards',l:'Thuong phat'},{k:'leaves',l:'Xin nghi'},{k:'backup',l:'Backup'}]},
          {sec:'Danh muc', pages:[{k:'materials',l:'Vat tu'},{k:'depts',l:'Bo phan'},{k:'products',l:'San pham'},{k:'customers',l:'Khach hang'},{k:'workcats',l:'DM Cong viec'},{k:'shifts',l:'Ca giao hang'}]},
          {sec:'Ban hang', pages:[{k:'quotes',l:'Bao gia'},{k:'delivery',l:'Don giao hang'},{k:'intem',l:'Intem'},{k:'orderdetail',l:'Chi tiet don hang'},{k:'trips',l:'Chuyen giao hang'},{k:'salesreport',l:'Bao cao BH'},{k:'marketsales',l:'Ban hang cho'},{k:'powdersales',l:'Ban bot bun'}]},
          {sec:'Mua hang', pages:[{k:'nccs',l:'Nha cung cap'},{k:'purchaseorders',l:'Don mua hang'},{k:'fuelpurchases',l:'Don mua xang dau'},{k:'purchasereport',l:'Bao cao MH'},{k:'materialusage',l:'Bao cao NVL ton va tieu dung'},{k:'purchase',l:'Mua hang'}]},
          {sec:'Bao cao', pages:[{k:'fuelreport',l:'Bao cao xang dau'},{k:'maintreport',l:'Bao cao sua chua'}]},
          {sec:'San xuat', pages:[{k:'prodsummary',l:'Tong hop SX'},{k:'prodorders',l:'Don san xuat'},{k:'stock',l:'Ton kho'}]},
        ].map(sec=>h('div',{key:sec.sec,style:{marginBottom:10}},
          h('div',{style:{fontSize:11,fontWeight:600,color:'var(--tx2)',textTransform:'uppercase',letterSpacing:'.5px',marginBottom:5}},sec.sec),
          sec.pages.map(pg=>{
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
      h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'}},
        h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),
        'Lưu nhân viên'
      )
    )
  );
}
function CpwModal({emp,cu,onSave,onClose}){
  const[op,sop]=useState('');const[np,snp]=useState('');const[cp,scp]=useState('');
  const submit=()=>{if(cu.role!=='admin'&&op!==emp.password){window.showToast('Mật khẩu cũ không đúng!','error');return;}if(np.length<4){window.showToast('Ít nhất 4 ký tự!','warn');return;}if(np!==cp){window.showToast('Mật khẩu xác nhận không khớp!','error');return;}onSave(np);};
  return h(Modal,{title:'Đổi mật khẩu — '+emp.name,onClose},
    cu.role!=='admin'&&h(F,{label:'Mật khẩu cũ'},h(PasswordField,{value:op,onChange:e=>sop(e.target.value)})),
    h(F,{label:'Mật khẩu mới'},h(PasswordField,{value:np,onChange:e=>snp(e.target.value)})),
    h(F,{label:'Xác nhận'},h(PasswordField,{value:cp,onChange:e=>scp(e.target.value)})),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'}},'Đổi mật khẩu'))
  );
}
function EmployeeTab({employees,setEmployees,cu,depts}){
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[cpw,scp]=useState(null);const[q,sq]=useState('');
  const[sortBy,setSortBy]=useState('id'); // id | role | dept
  const[fRole,setFRole]=useState('');
  const[fDept,setFDept]=useState('');
  const canEdit=cu.role==='admin'||cu.role==='manager';
  const ROLE_ORDER={admin:0,manager:1,staff:2,driver:3};
  const fmtGender=v=>genderLabel(v?.gender,v?.female);
  const parseGenderValue=v=>{
    const legacyFemale=String(v??'').trim().toLowerCase();
    const femaleFlag=['1','true','yes','y','co','có','nu','nữ','female','x'].includes(legacyFemale);
    return normalizeGenderValue(v,femaleFlag);
  };
  const save=d=>{if(edit)setEmployees(p=>p.map(e=>e.id===edit.id?{...e,...d,...(!d.password?{password:edit.password}:{})}:e));else setEmployees(p=>[...p,d]);sm(null);se(null);};
  const del=id=>{if(id===cu.id){window.showToast('Không thể xóa tài khoản đang đăng nhập!','error');return;}window.scfConfirm('Bạn có chắc muốn xóa nhân viên này?','Xóa nhân viên',true).then(ok=>{if(ok){setEmployees(p=>p.filter(e=>e.id!==id));window.showToast('Đã xóa nhân viên','success');}});};
  const savePw=(id,pw)=>{setEmployees(p=>p.map(e=>e.id===id?{...e,password:pw,updatedBy:cu.name,updatedAt:fmtDT()}:e));scp(null);};
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
    h('div',{className:'ptitle'},h('i',{className:'ti ti-users',style:{fontSize:20}}),'Danh sách nhân viên'),
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
        canEdit&&h(ImportBtn,{onFile:rows=>{
          const ROLE_MAP={'Admin':'admin','Quản lý':'manager','Nhân viên':'staff','Lái xe':'driver','admin':'admin','manager':'manager','staff':'staff','driver':'driver'};
          const added=rows.map(r=>({
            id:(r['Mã NV']||'NV'+uid()).toString().trim(),
            name:r['Họ tên']||'',
            birthday:r['Ngày sinh']||'',
            gender:parseGenderValue(r['Giới tính']||r['Nữ giới']),
            female:isFemaleGender(parseGenderValue(r['Giới tính']||r['Nữ giới'])),
            dept:r['Bộ phận']||(depts&&depts.length?depts[0].name:DEPTS[0]),
            role:ROLE_MAP[r['Phân quyền']]||'staff',
            username:(r['Đăng nhập']||'').toString().trim(),
            password:'Scf@123456',mustChangePw:true,
            phone:(r['SĐT']||'').toString(),
            email:r['Email']||'',
            note:r['Ghi chú']||'',
            updatedBy:cu.name,updatedAt:fmtDT()
          })).filter(r=>r.name&&r.username);
          setEmployees(p=>{
            const map={};p.forEach(x=>{map[x.id]=x;});
            added.forEach(x=>{map[x.id]=map[x.id]?{...map[x.id],...x,password:map[x.id].password}:x;});
            return Object.values(map);
          });
          window.showToast('Đã nhập/cập nhật '+added.length+' nhân viên. MK mặc định: Scf@123456','success');
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
    cpw&&h(CpwModal,{emp:cpw,cu,onSave:pw=>savePw(cpw.id,pw),onClose:()=>scp(null)})
  );
}
function BackupTab({employees,materials,assets,prodCats,products,customers,workcats,tasks,advances,rewards,leaves,nccs,purchases,depts,prodShiftRules,uiSettings,printTemplateSettings}){
  function exp(rows,cols,name){const data=rows.map(r=>Object.fromEntries(cols.map(([k,l])=>[l,r[k]??''])));const ws=XLSX.utils.json_to_sheet(data);const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,name);XLSX.writeFile(wb,name+'_'+fmtDate().replace(/\//g,'-')+'.xlsx');}
  const purchaseRows=(purchases||[]).flatMap(p=>(p.lines&&p.lines.length?p.lines:[{}]).map(l=>({...p,itemName:l.name||'',itemUnit:l.unit||'',itemQty:l.qty||0,itemPrice:l.price||0,itemTotal:(l.qty||0)*(l.price||0),lineNote:l.note||''})));
  const safeUi=normalizeUiSettings(uiSettings);
  const safeTemplateSettings=normalizePrintTemplateSettings(printTemplateSettings);
  const uiBackupRows=[{
    fontFamily:fontFamilyLabel(safeUi.fontFamily),
    base:safeUi.scopes.base.size+'px - '+fontModeMeta(safeUi.scopes.base.mode).label,
    form:safeUi.scopes.form.size+'px - '+fontModeMeta(safeUi.scopes.form.mode).label,
    menu:safeUi.scopes.menu.size+'px - '+fontModeMeta(safeUi.scopes.menu.mode).label,
    button:safeUi.scopes.button.size+'px - '+fontModeMeta(safeUi.scopes.button.mode).label,
    table:safeUi.scopes.table.size+'px - '+fontModeMeta(safeUi.scopes.table.mode).label,
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
    {name:'Đơn mua hàng',rows:purchaseRows,cols:[['id','Mã đơn'],['nccName','Nhà cung cấp'],['orderDate','Ngày đặt'],['deliveryDate','Hạn giao'],['receivedDate','Ngày nhận'],['invoiceNo','Số hóa đơn'],['status','Trạng thái'],['paymentStatus','Thanh toán'],['itemName','Mặt hàng'],['itemUnit','ĐVT'],['itemQty','Số lượng'],['itemPrice','Đơn giá'],['itemTotal','Thành tiền'],['note','Ghi chú đơn'],['lineNote','Ghi chú dòng']]},
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

function MaintenanceTab({title,icon,assets,employees}){
  const storageKey='scf_'+(title==='Bảo dưỡng xe'?'maint_vehicle':'maint_machine');
  const isVehicle=title==='Bảo dưỡng xe';
  const normalizeText=s=>normalizePlainText(s);
  const makeEmptyForm=()=>({month:'',date:'',vehicle:'',service:'',km:'',garage:'',repairerIds:[],repairerNames:[],repairerText:'',amount:'',invoice:'',invoiceImage:'',invoiceImageName:'',repairImage:'',repairImageName:'',repairImages:[]});
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
  useEffect(()=>{
    try{
      const hasLocal=!!localStorage.getItem(storageKey);
      if(hasLocal&&items&&items.length) dbSet(storageKey,items);
    }catch{}
  },[]);
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
    return {
      ...makeEmptyForm(),
      ...item,
      repairerIds:getRepairerIds(item),
      repairerNames:getRepairerNames(item),
      repairerText:getRepairerText(item),
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
  const openImageViewer=(title,images,startIndex=0)=>{
    const list=(images||[]).filter(x=>x&&x.url);
    if(!list.length)return;
    setImageView({title,images:list,index:Math.max(0,Math.min(startIndex,list.length-1))});
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
        const url=await uploadPhoto(file,folderBase);
        setForm(p=>({...p,invoiceImage:url,invoiceImageName:file.name||'hoa-don-bao-duong.jpg'}));
      }else{
        const uploaded=[];
        for(const file of picked){
          const url=await uploadPhoto(file,folderBase);
          uploaded.push({url,name:file.name||'anh-sua-chua.jpg'});
        }
        setForm(p=>{
          const prevImages=getRepairImages(p);
          const repairImages=[...prevImages,...uploaded];
          return {...p,repairImages,repairImage:repairImages[0]?.url||'',repairImageName:repairImages[0]?.name||''};
        });
      }
      window.showToast(kind==='invoice'?'Đã lưu ảnh hóa đơn':('Đã lưu '+picked.length+' ảnh sửa chữa'),'success');
    }catch(e){
      window.showToast(kind==='invoice'?'Chưa tải được ảnh hóa đơn.':'Chưa tải được ảnh sửa chữa.','error');
    }finally{
      setUploading('');
    }
  };
  const clearMaintenanceImage=(kind,index=null)=>{
    if(kind==='invoice') setForm(p=>({...p,invoiceImage:'',invoiceImageName:''}));
    else setForm(p=>{
      const repairImages=getRepairImages(p);
      if(index===null){
        return {...p,repairImages:[],repairImage:'',repairImageName:''};
      }
      const nextImages=repairImages.filter((_,i)=>i!==index);
      return {...p,repairImages:nextImages,repairImage:nextImages[0]?.url||'',repairImageName:nextImages[0]?.name||''};
    });
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
          hasImage&&h('button',{type:'button',onClick:()=>openImageViewer(label,isRepair?repairImages:[{url:image,name:imageName||label}],0),style:{fontSize:12,padding:'6px 12px'}},
            h('i',{className:'ti ti-photo',style:{fontSize:14}}),isRepair?('Xem '+repairImages.length+' ảnh'):'Xem ảnh'
          ),
          h('label',{style:{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',border:'1px solid var(--bd)',borderRadius:'var(--r)',cursor:uploading?'wait':'pointer',background:'#fff'}},
            h('i',{className:'ti '+(uploading===kind?'ti-loader-2 spin':'ti-camera-plus'),style:{fontSize:14}}),
            uploading===kind?'Đang tải ảnh...':(isRepair?'Chụp / thêm ảnh':'Chụp / tải ảnh'),
            h('input',{type:'file',accept:'image/*',capture:'environment',multiple:isRepair,style:{display:'none'},disabled:!!uploading,onChange:e=>pickMaintenanceImage(kind,e.target.files)})
          ),
          hasImage&&h('button',{type:'button',onClick:()=>clearMaintenanceImage(kind),style:{fontSize:12,padding:'6px 12px',background:'#fff4f4',color:'#A32D2D',border:'1px solid #f0c9c9'}},
            h('i',{className:'ti ti-trash',style:{fontSize:14}}),isRepair?'Xóa tất cả':'Xóa ảnh'
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
                    h('button',{type:'button',className:'bi',title:'Xem ảnh',onClick:()=>openImageViewer(label,repairImages,idx)},h('i',{className:'ti ti-photo',style:{fontSize:14}})),
                    h('button',{type:'button',className:'bi',title:'Xóa ảnh này',onClick:()=>clearMaintenanceImage(kind,idx),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:14}}))
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
            h(F,{label:'Gara'},h('input',{value:form.garage,onChange:e=>setForm(p=>({...p,garage:e.target.value})),placeholder:'HẢI THẮNG LỢI'})),
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

/* ─── SIDEBAR ─── */
/* ═══════ COLLAPSIBLE SIDEBAR + MUA HÀNG + BÁO CÁO ═══════ */

/* --- NCC (Nhà cung cấp) --- */
function NCCTab({nccs,setNCCs,purchases}) {
  const [modal,sm]=useState(null); const [edit,se]=useState(null); const [q,sq]=useState('');
  const norm=s=>String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  function NCCForm({ncc,onSave,onClose}) {
    const [f,sf]=useState(ncc||{code:'',name:'',taxCode:'',address:'',phone:'',email:'',contact:'',note:''});
    const s=(k,v)=>sf(p=>({...p,[k]:v}));
    return h(Modal,{title:ncc?'Sửa NCC':'Thêm nhà cung cấp',onClose},
      h('div',{className:'g2'},h(F,{label:'Mã NCC'},h('input',{value:f.code,onChange:e=>s('code',e.target.value),placeholder:'NCC001'})),h(F,{label:'Tên NCC *'},h('input',{value:f.name,onChange:e=>s('name',e.target.value)}))),
      h('div',{className:'g2'},h(F,{label:'Mã số thuế'},h('input',{value:f.taxCode,onChange:e=>s('taxCode',e.target.value)})),h(F,{label:'Người liên hệ'},h('input',{value:f.contact,onChange:e=>s('contact',e.target.value)}))),
      h('div',{className:'g2'},h(F,{label:'Điện thoại'},h('input',{value:f.phone,onChange:e=>s('phone',e.target.value)})),h(F,{label:'Email'},h('input',{value:f.email,onChange:e=>s('email',e.target.value)}))),
      h(F,{label:'Địa chỉ'},h('input',{value:f.address,onChange:e=>s('address',e.target.value)})),
      h(F,{label:'Ghi chú'},h('textarea',{value:f.note,onChange:e=>s('note',e.target.value),rows:2})),
      h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:()=>{if(!f.name){window.showToast('Nhập tên NCC!','warn');return;}onSave({...f,id:ncc?.id||'NCC'+uid()});},style:{padding:'8px 20px'}},'Lưu NCC'))
    );
  }
  const save=d=>{if(edit)setNCCs(p=>p.map(x=>x.id===edit.id?d:x));else setNCCs(p=>[...p,d]);sm(null);se(null);};
  const del=id=>{
    const target=(nccs||[]).find(x=>x.id===id);
    const linked=(purchases||[]).filter(p=>{
      const byId=String(p.nccId||'')===String(id);
      const byName=target && norm(p.nccName)===norm(target.name);
      const byCode=target?.code && norm(p.nccName)===norm(target.code);
      return byId||byName||byCode;
    });
    const msg=linked.length
      ? `NCC này đang có ${linked.length} đơn mua liên quan. Nếu xóa, các đơn cũ sẽ mất liên kết NCC. Bạn vẫn muốn xóa chứ?`
      : 'Bạn có chắc muốn xóa nhà cung cấp này?';
    const title=linked.length?'Cảnh báo NCC đang có đơn':'Xóa NCC';
    window.scfConfirm(msg,title,true).then(ok=>{
      if(ok){
        setNCCs(p=>p.filter(x=>x.id!==id));
        window.showToast('Đã xóa NCC','success');
      }
    });
  };
  const importNcc=rows=>{
    const mapped=rows.map(r=>({
      id:'NCC'+uid(),
      code:r['Mã NCC']||r['Mã']||r.code||'',
      name:r['Tên NCC']||r['Tên nhà cung cấp']||r['Tên']||r.name||'',
      taxCode:r['MST']||r['Mã số thuế']||r.taxCode||'',
      phone:r['Điện thoại']||r['SĐT']||r.phone||'',
      email:r.Email||r.email||'',
      contact:r['Người LH']||r['Người liên hệ']||r.contact||'',
      address:r['Địa chỉ']||r.address||'',
      note:r['Ghi chú']||r.note||''
    })).filter(x=>x.name);
    if(!mapped.length){window.showToast('File chưa có dòng NCC hợp lệ.','warn');return;}
    setNCCs(prev=>{const next=[...prev];mapped.forEach(n=>{const i=next.findIndex(x=>(n.code&&x.code===n.code)||x.name.toLowerCase()===n.name.toLowerCase());if(i>=0)next[i]={...next[i],...n,id:next[i].id};else next.push(n);});return next;});
  };
  const list=nccs.filter(x=>!q||String(x.name||'').toLowerCase().includes(q.toLowerCase())||String(x.code||'').toLowerCase().includes(q.toLowerCase())||String(x.phone||'').includes(q));
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-building-store',style:{fontSize:20}}),'Nhà cung cấp'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm NCC...'}),
      h('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},
        h(ExportBtn,{onClick:()=>xlsxExport(nccs,[['code','Mã NCC'],['name','Tên NCC'],['taxCode','MST'],['phone','Điện thoại'],['email','Email'],['contact','Người LH'],['address','Địa chỉ'],['note','Ghi chú']],'Nha_cung_cap')}),
        h(ImportBtn,{onFile:importNcc}),
        h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Thêm NCC'})
      )
    ),
    h('div',{className:'mobile-only report-mobile-section'},
      list.length?list.map(x=>h('div',{key:'mncc_'+x.id,className:'mobile-data-card'},
        h('div',{className:'mobile-data-head'},
          h('div',null,
            h('div',{className:'mobile-data-title'},x.name||'—'),
            h('div',{className:'mobile-data-sub'},x.code||x.id||'—')
          ),
          h('div',{className:'mobile-data-sub'},x.phone||'—')
        ),
        h('div',{className:'mobile-data-grid'},
          h('div',{className:'mobile-data-item'},h('b',null,'MST'),h('span',null,x.taxCode||'—')),
          h('div',{className:'mobile-data-item'},h('b',null,'Người LH'),h('span',null,x.contact||'—'))
        ),
        (x.address||x.email)&&h('div',{style:{marginTop:8,fontSize:12,color:'var(--tx2)'}},
          [x.address,x.email].filter(Boolean).join(' • ')
        ),
        h('div',{className:'fuel-mobile-actions',style:{marginTop:8}},
          h('button',{className:'bi',onClick:()=>{se(x);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
          h('button',{className:'bi',onClick:()=>del(x.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
        )
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có nhà cung cấp nào.')
    ),
    h('div',{className:'tw desktop-only'},h('table',null,
      h('thead',null,h('tr',null,...['Mã NCC','Tên NCC','MST','Điện thoại','Người LH','Địa chỉ',''].map(c=>h('th',{key:c},c)))),
      h('tbody',null,list.length?list.map(x=>h('tr',{key:x.id},
        h('td',null,h('span',{style:{color:'var(--pri)',fontWeight:500}},x.code||x.id)),
        h('td',null,h('div',{style:{fontWeight:500}},x.name),x.email&&h('div',{style:{fontSize:11,color:'var(--tx2)'}},x.email)),
        h('td',null,x.taxCode||'—'),h('td',null,x.phone||'—'),h('td',null,x.contact||'—'),
        h('td',null,h('span',{style:{color:'var(--tx2)',fontSize:12,display:'block',maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},x.address||'—')),
        h('td',null,h('div',{style:{display:'flex',gap:2}},
          h('button',{className:'bi',onClick:()=>{se(x);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
          h('button',{className:'bi',onClick:()=>del(x.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
        ))
      )):h('tr',null,h('td',{colSpan:7,className:'empty-st'},'Chưa có nhà cung cấp nào.')))
    )),
    modal==='f'&&h(NCCForm,{ncc:edit,onSave:save,onClose:()=>{sm(null);se(null);}})
  );
}

/* --- Đơn mua hàng --- */
function PurchaseTab({purchases,setPurchases,nccs,setNCCs,materials,products,cu,setPage}) {
  const [modal,sm]=useState(null); const [edit,se]=useState(null); const [q,sq]=useState(''); const [timeFilter,stf]=useState('all');
  let seq=purchases.length+1;
  const numMoney=v=>Number(String(v??'').replace(/[^\d-]/g,''))||0;
  const fmtPurchaseDate=s=>fmtAnyDate(s);
  const emptyLine=()=>({id:uid(),itemId:'',name:'',unit:'',qty:0,price:0,note:''});
  const findMaterial=l=>{
    const rawId=String(l?.itemId||'').trim();
    const name=String(l?.name||'').trim().toLowerCase();
    const rawCode=rawId.replace(/^M_/,'').toLowerCase();
    return (materials||[]).find(m=>{
      const id=String(m.id||'').trim().toLowerCase();
      const code=String(m.code||'').trim().toLowerCase();
      const matName=String(m.name||'').trim().toLowerCase();
      return rawId===('M_'+m.id) || rawCode===id || rawCode===code || (name && (matName===name || code===name));
    })||null;
  };
  const resolveLine=l=>{
    const found=findMaterial(l);
    const name=String(l?.name||'').trim();
    return {...emptyLine(),...l,itemId:found?('M_'+found.id):'',name:found?found.name:name,unit:found?.unit||l?.unit||'',qty:numFmt(l?.qty||0),price:numFmt(l?.price||0)};
  };
  const buildForm=po=>po?{...po,nccId:po.nccId||'',nccName:po.nccName||'',orderDate:toIsoDate(po.orderDate)||isoDate(),lines:(po.lines||[]).length?(po.lines||[]).map(resolveLine):[emptyLine()]}:{nccId:'',nccName:'',orderDate:isoDate(),lines:[emptyLine()]};
  const [form,sf2]=useState(buildForm(null));
  const s2=(k,v)=>sf2(p=>({...p,[k]:v}));
  const setNcc=id=>{const n=nccs.find(x=>x.id===id);sf2(p=>({...p,nccId:id,nccName:n?n.name:''}));};
  const allItems=(materials||[]).map(m=>({id:'M_'+m.id,name:m.name||'',unit:m.unit,price:numFmt(m.price||0)})).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'vi'));
  const upd=(id,data)=>sf2(p=>({...p,lines:p.lines.map(l=>l.id===id?data:l)}));
  const addLine=()=>sf2(p=>({...p,lines:[...(p.lines||[]),emptyLine()]}));
  const delLine=id=>sf2(p=>{
    const next=(p.lines||[]).filter(l=>l.id!==id);
    return {...p,lines:next.length?next:[emptyLine()]};
  });
  const openAdd=()=>{se(null);sf2(buildForm(null));sm('f');};
  const openEdit=o=>{se(o);sf2(buildForm(o));sm('f');};
  const syncNccFromPurchases=()=>{
    const seen=new Set();
    const mapped=(purchases||[]).map(p=>({
      id:p.nccId||('NCC'+uid()),
      code:p.nccCode||p.nccId||'',
      name:p.nccName||'',
      taxCode:p.nccTaxCode||'',
      phone:p.nccPhone||'',
      email:p.nccEmail||'',
      contact:p.nccContact||'',
      address:p.nccAddress||'',
      note:p.nccNote||''
    })).filter(x=>x.name&&!seen.has((x.code||x.name).toLowerCase())&&(seen.add((x.code||x.name).toLowerCase()),true));
    if(!mapped.length){window.showToast('Không có NCC mới để cập nhật.','warn');return;}
    setNCCs(prev=>{
      const next=[...prev];
      mapped.forEach(n=>{
        const i=next.findIndex(x=>(n.code&&x.code===n.code)||String(x.name||'').toLowerCase()===String(n.name||'').toLowerCase());
        if(i>=0) next[i]={...next[i],...n,id:next[i].id};
        else next.push({...n,id:n.id||('NCC'+uid())});
      });
      return next;
    });
    window.showToast('Đã cập nhật NCC từ đơn mua','success');
  };
  const importRows=rows=>{
    const mapped=(rows||[]).map(r=>{
      const nccName=r['NCC']||r['Nhà cung cấp']||r['nccName']||r['ncc']||'';
      const itemName=r['Vật tư']||r['Mặt hàng']||r['itemName']||r['item']||'';
      const itemMatch=(materials||[]).find(m=>String(m.name||'').trim().toLowerCase()===String(itemName||'').trim().toLowerCase()||String(m.code||'').trim().toLowerCase()===String(itemName||'').trim().toLowerCase());
      const qty=numFmt(r['Số lượng']||r['itemQty']||r['qty']||0);
      const price=numMoney(r['Đơn giá']||r['itemPrice']||r['price']||0);
      const total=numMoney(r['Thành tiền']||r['itemTotal']||r['total']||qty*price);
      const orderDate=r['Ngày nhập']||r['Ngày đặt']||r['orderDate']||r['date']||'';
      const statusRaw=String(r['Trạng thái']||r['status']||'').toLowerCase();
      const payRaw=String(r['Thanh toán']||r['paymentStatus']||'').toLowerCase();
      return {
        id:'DM'+uid(),
        status:statusRaw.includes('đã nhận')?'received':statusRaw.includes('đã đặt')?'ordered':statusRaw.includes('hủy')?'cancelled':'draft',
        paymentStatus:payRaw.includes('đã')||payRaw.includes('paid')?'paid':payRaw.includes('một phần')?'partial':'unpaid',
        nccId:(nccs||[]).find(n=>String(n.name||'').toLowerCase()===String(nccName).toLowerCase())?.id||'',
        nccName,
        orderDate,
        deliveryDate:r['Hạn giao']||r['deliveryDate']||'',
        receivedDate:r['Ngày nhận']||r['receivedDate']||'',
        invoiceNo:r['Số hóa đơn']||r['invoiceNo']||'',
        note:r['Ghi chú đơn']||r['note']||'',
        lines:[{id:uid(),itemId:itemMatch?('M_'+itemMatch.id):'',name:itemMatch?itemMatch.name:itemName,unit:r['ĐVT']||r['itemUnit']||itemMatch?.unit||'',qty,price,note:r['Ghi chú dòng']||r['lineNote']||''}],
        createdAt:fmtDT(),
        createdBy:cu.name,
        updatedAt:fmtDT(),
        updatedBy:cu.name
      };
    }).filter(x=>x.nccName||x.lines[0].name||x.orderDate);
    if(!mapped.length){window.showToast('File chưa có dòng đơn mua hợp lệ.','warn');return;}
    setPurchases(prev=>[...mapped,...prev]);
    window.showToast('Đã nhập '+mapped.length+' đơn mua','success');
  };
  const total=(form.lines||[]).reduce((sum,l)=>sum+(numFmt(l.qty)||0)*(numFmt(l.price)||0),0);
  const saveForm=()=>{
    if(!form.nccId){window.showToast('Chọn NCC!','warn');return;}
    const cleanLines=(form.lines||[]).map(l=>({...l,qty:numFmt(l.qty||0),price:numFmt(l.price||0)})).filter(l=>l.itemId&&l.name&&l.qty>0);
    if(!cleanLines.length){window.showToast('Nhập ít nhất 1 dòng nguyên vật liệu hợp lệ.','warn');return;}
    const data={...form,orderDate:toIsoDate(form.orderDate)||isoDate(),lines:cleanLines,updatedBy:cu.name,updatedAt:fmtDT()};
    if(edit)setPurchases(p=>p.map(x=>x.id===edit.id?{...x,...data}:x));
    else{
      const id='DM'+String(seq++).toString().padStart(4,'0');
      setPurchases(p=>[...p,{...data,status:data.status||'draft',id,createdAt:fmtDate(),createdBy:cu.name}]);
    }
    sm(null);se(null);
  };
  const del=id=>{window.scfConfirm('Bạn có chắc muốn xóa đơn mua này?','Xóa đơn mua',true).then(ok=>{if(ok){setPurchases(p=>p.filter(x=>x.id!==id));window.showToast('Đã xóa đơn mua','success');}});};
  const todayDate=new Date();
  const startOfToday=new Date(todayDate.getFullYear(),todayDate.getMonth(),todayDate.getDate());
  const dayStart=startOfToday.getTime();
  const weekStartDate=new Date(startOfToday);
  const weekDay=(weekStartDate.getDay()+6)%7;
  weekStartDate.setDate(weekStartDate.getDate()-weekDay);
  const weekStart=weekStartDate.getTime();
  const monthStartDate=new Date(todayDate.getFullYear(),todayDate.getMonth(),1);
  const monthStart=monthStartDate.getTime();
  const list=purchases
    .filter(x=>{
      if(q&&!(String(x.nccName||'').toLowerCase().includes(q.toLowerCase())||String(x.id||'').toLowerCase().includes(q.toLowerCase())||String(x.invoiceNo||'').toLowerCase().includes(q.toLowerCase()))) return false;
      if(timeFilter==='all') return true;
      const d=parseAnyDate(x.orderDate||x.createdAt||x.updatedAt);
      if(!d) return false;
      const ts=new Date(d.getFullYear(),d.getMonth(),d.getDate()).getTime();
      if(timeFilter==='day') return ts===dayStart;
      if(timeFilter==='week') return ts>=weekStart;
      if(timeFilter==='month') return ts>=monthStart;
      return true;
    })
    .slice()
    .sort((a,b)=>{
      const da=parseAnyDate(a.orderDate||a.createdAt||a.updatedAt);
      const db=parseAnyDate(b.orderDate||b.createdAt||b.updatedAt);
      const ta=da?da.getTime():0;
      const tb=db?db.getTime():0;
      if(tb!==ta) return tb-ta;
      return String(b.id||'').localeCompare(String(a.id||''),'vi',{numeric:true});
    });
  const exportRows=list.flatMap(p=>(p.lines||[]).map(l=>({...p,itemName:l.name,itemUnit:l.unit,itemQty:l.qty,itemPrice:l.price,itemTotal:(l.qty||0)*(l.price||0)})));
  const tableRows=list.flatMap(o=>(o.lines&&o.lines.length?o.lines:[emptyLine()]).map((line,idx)=>({
    rowKey:o.id+'_'+(line.id||idx),
    id:o.id,
    orderDate:o.orderDate,
    nccName:o.nccName,
    lineName:line.name||'—',
    lineQty:line.qty??0,
    linePrice:line.price||0,
    lineTotal:(Number(line.qty)||0)*(Number(line.price)||0),
    isFirst:idx===0,
    rowCount:(o.lines||[]).length||1,
    source:o
  })));
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-shopping-cart',style:{fontSize:20}}),'Đơn mua hàng'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Hiển thị đơn mới lên trên, có thể xem nhanh trên điện thoại theo từng thẻ.'),
      h('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},
        h('button',{onClick:()=>setPage('nccs'),style:{fontSize:12,padding:'6px 12px'}},h('i',{className:'ti ti-building-store',style:{fontSize:14}}),'Nhà cung cấp'),
        h('button',{onClick:syncNccFromPurchases,style:{fontSize:12,padding:'6px 12px'}},h('i',{className:'ti ti-refresh',style:{fontSize:14}}),'Cập nhật NCC'),
        h(ImportBtn,{onFile:importRows}),
        h(ExportBtn,{onClick:()=>xlsxExport(exportRows,[['orderDate','Ngày nhập'],['nccName','NCC'],['itemName','Nguyên vật liệu'],['itemQty','Số lượng'],['itemPrice','Đơn giá'],['itemTotal','Thành tiền']],'Don_mua_hang')}),
        h(AddBtn,{onClick:openAdd,label:'Tạo đơn mua'})
      ),
      h('div',{style:{fontSize:12,color:'var(--tx2)',fontWeight:500}},'Hiển thị: '+list.length+' đơn')
    ),
    h('div',{className:'card',style:{marginBottom:'1rem',padding:'12px 14px'}},
      h('div',{className:'responsive-filter-grid',style:{gridTemplateColumns:'1.4fr auto auto'}},
        h(F,{label:'Tìm nhanh'},h(SearchBar,{value:q,onChange:sq,placeholder:'Mã đơn, NCC, hóa đơn...'})),
        h(F,{label:'Lọc thời gian'},h('select',{value:timeFilter,onChange:e=>stf(e.target.value)},h('option',{value:'all'},'Tất cả'),h('option',{value:'day'},'Ngày'),h('option',{value:'week'},'Tuần'),h('option',{value:'month'},'Tháng'))),
        h('button',{type:'button',onClick:()=>{sq('');stf('all');},style:{height:38,alignSelf:'end'}},h('i',{className:'ti ti-filter-off',style:{fontSize:14}}),'Xóa lọc')
      )
    ),
    h('div',{className:'mobile-only mobile-card-list'},
      list.length?list.map(o=>{
        const lines=(o.lines&&o.lines.length?o.lines:[emptyLine()]);
        const totalAmount=lines.reduce((s,l)=>s+((Number(l.qty)||0)*(Number(l.price)||0)),0);
        return h('div',{key:'m_'+o.id,className:'mobile-data-card'},
          h('div',{className:'mobile-data-head'},
            h('div',null,
              h('div',{className:'mobile-data-title'},o.nccName||'—'),
              h('div',{className:'mobile-data-sub'},o.id||'—')
            ),
            h('div',{className:'mobile-data-sub'},fmtPurchaseDate(o.orderDate))
          ),
          h('div',{className:'mobile-data-grid'},
            h('div',{className:'mobile-data-item'},h('b',null,'Số dòng NVL'),h('span',null,String(lines.length))),
            h('div',{className:'mobile-data-item'},h('b',null,'Tổng tiền'),h('span',null,totalAmount.toLocaleString('vi-VN')+'đ'))
          ),
          h('div',{style:{display:'grid',gap:6}},
            lines.map((line,idx)=>h('div',{key:o.id+'_'+(line.id||idx),style:{padding:'8px 10px',border:'1px solid var(--bd)',borderRadius:10,background:'#fff'}},
              h('div',{style:{fontWeight:600,fontSize:13}},line.name||'—'),
              h('div',{className:'mobile-data-sub'},'SL: '+(line.qty??0)+' | Đơn giá: '+((Number(line.price)||0).toLocaleString('vi-VN'))+'đ')
            ))
          ),
          h('div',{className:'mobile-data-actions'},
            h('button',{className:'bi',onClick:()=>openEdit(o)},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
            h('button',{className:'bi',onClick:()=>del(o.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
          )
        );
      }):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có đơn mua hàng nào.')
    ),
    h('div',{className:'tw desktop-only',style:{maxHeight:'calc(100vh - 250px)',overflow:'auto'}},h('table',null,
      h('thead',null,h('tr',null,...['Ngày nhập','NCC','Nguyên vật liệu','Số lượng','Đơn giá','Thành tiền',''].map(c=>h('th',{key:c,style:{position:'sticky',top:0,zIndex:3,background:'var(--bg2)',boxShadow:'0 1px 0 var(--bd)'}},c)))),
      h('tbody',null,tableRows.length?tableRows.map(r=>h('tr',{key:r.rowKey},
        r.isFirst&&h('td',{rowSpan:r.rowCount},fmtPurchaseDate(r.orderDate)),
        r.isFirst&&h('td',{rowSpan:r.rowCount},h('div',{style:{fontWeight:500}},r.nccName||'—')),
        h('td',null,r.lineName),
        h('td',null,r.lineQty),
        h('td',null,(Number(r.linePrice)||0).toLocaleString('vi-VN')+'đ'),
        h('td',null,h('span',{style:{fontWeight:500,color:'var(--pri)'}},r.lineTotal.toLocaleString('vi-VN')+'đ')),
        r.isFirst&&h('td',{rowSpan:r.rowCount},h('div',{style:{display:'flex',gap:2}},
          h('button',{className:'bi',onClick:()=>openEdit(r.source)},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
          h('button',{className:'bi',onClick:()=>del(r.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
        ))
      )):h('tr',null,h('td',{colSpan:7,className:'empty-st'},'Chưa có đơn mua hàng nào.')))
    )),
    modal==='f'&&h(Modal,{title:edit?'Sửa đơn mua':'Tạo đơn mua hàng',lg:true,onClose:()=>{sm(null);se(null);}},
      h('div',{className:'g2'},
        h(F,{label:'Nhà cung cấp *'},h('select',{value:form.nccId,onChange:e=>setNcc(e.target.value)},h('option',{value:''},'— Chọn NCC —'),nccs.map(n=>h('option',{key:n.id,value:n.id},n.name)))),
        h(F,{label:'Ngày nhập'},h('input',{type:'date',value:toIsoDate(form.orderDate),onChange:e=>s2('orderDate',e.target.value)}))
      ),
      h('hr',{className:'divider'}),
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}},
        h('div',{style:{fontWeight:500,fontSize:13,color:'var(--pri3)'}},'Chi tiết nguyên vật liệu'),
        total>0&&h('div',{style:{fontWeight:600,color:'var(--pri)',fontSize:14}},'Tổng: '+total.toLocaleString('vi-VN')+'đ')
      ),
      h('div',{className:'po-line-head'},['Nguyên vật liệu','Số lượng','Đơn giá','Thành tiền',''].map(c=>h('span',{key:c,style:{fontSize:11,color:'var(--tx2)',fontWeight:500}},c))),
      h('div',null,(form.lines||[]).map((line,idx)=>{
        const lineTotal=(numFmt(line.qty)||0)*(numFmt(line.price)||0);
        return h('div',{key:line.id,className:'po-line-row'},
          h('select',{value:line.itemId,onChange:e=>{const it=allItems.find(x=>x.id===e.target.value)||{};upd(line.id,{...line,itemId:e.target.value,name:it.name||'',unit:it.unit||'',price:it.price||0});},style:{fontSize:13},title:'Nguyên vật liệu'},h('option',{value:''},'— Chọn nguyên vật liệu —'),allItems.map(it=>h('option',{key:it.id,value:it.id},it.name))),
          h('input',{type:'number',min:0,value:line.qty,onChange:e=>upd(line.id,{...line,qty:numFmt(e.target.value)}),style:{fontSize:13},placeholder:'Số lượng',title:'Số lượng'}),
          h(NumInput,{value:line.price,onChange:v=>upd(line.id,{...line,price:v}),style:{fontSize:13},placeholder:'Đơn giá',title:'Đơn giá'}),
          h('input',{value:lineTotal,readOnly:true,style:{fontSize:13,background:'var(--bg2)',cursor:'default',fontWeight:600},placeholder:'Thành tiền',title:'Thành tiền'}),
          h('div',{style:{display:'flex',justifyContent:'center'}},
            h('button',{className:idx===0?'bp':'bdel',type:'button',onClick:()=>idx===0?addLine():delLine(line.id),style:idx===0?{padding:'7px 10px'}:{}},
              h('i',{className:'ti '+(idx===0?'ti-plus':'ti-trash'),style:{fontSize:14}}),
              idx===0?'Thêm':''
            )
          )
        );
      })),
      h('div',{style:{fontSize:12,color:'var(--tx2)',marginBottom:8}},'Một đơn có thể có nhiều dòng nguyên vật liệu.'),
      h(Row,null,h('button',{onClick:()=>{sm(null);se(null);}},'Hủy'),h('button',{className:'bp',onClick:saveForm,style:{padding:'8px 20px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu đơn mua'))
    )
  );
}

/* --- Đơn mua xăng dầu --- */
function FuelPurchaseTab({rows,setRows,employees,assets,currentUser}) {
  const [modal,setModal]=useState(false);
  const [edit,setEdit]=useState(null);
  const [q,sq]=useState('');
  const [df,sdf]=useState('');
  const [dt,sdt]=useState('');
  const [buyerFilter,setBuyerFilter]=useState('');
  const [vehicleFilter,setVehicleFilter]=useState('');
  const [uploading,setUploading]=useState('');
  const normalizeText=s=>String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const normalizeVehicleKey=s=>String(s||'').toUpperCase().replace(/[^0-9A-Z]/g,'');
  const deptKey=normalizeText(currentUser?.dept);
  const isAccounting=deptKey==='ke toan';
  const canManage=currentUser?.role==='admin'||currentUser?.role==='manager'||isAccounting;
  const isDriver=currentUser?.role==='driver';
  const selfOption=currentUser?{id:currentUser.id,name:currentUser.name||currentUser.id,label:(currentUser.name||currentUser.id)+(currentUser.id?' - '+currentUser.id:'')}:null;
  const driverOptions=(employees||[])
    .filter(e=>e.role==='driver'||normalizeText(e.dept)==='lai xe')
    .map(e=>({id:e.id,name:e.name||e.id,label:(e.name||e.id)+(e.id?' - '+e.id:'')}))
    .sort((a,b)=>a.label.localeCompare(b.label,'vi'));
  const buyerOptions=(selfOption?[selfOption,...driverOptions.filter(d=>d.id!==selfOption.id)]:driverOptions);
  const vehicleOptions=[...new Set([
    ...(assets||[])
      .map(a=>String(a.name||a.code||a.id||'').trim())
      .filter(Boolean)
      .filter(name=>{
        const t=normalizeText(name);
        const looksLikeVehicle=/^\d{4,6}$/.test(name)||t.includes('xe')||/\b\d{2}[a-z]-?\d{3,5}\b/i.test(name);
        const looksLikeMachine=t.startsWith('may ')||t.includes('máy')||t.includes('may')||t.includes('bom')||t.includes('bơm')||t.includes('inox');
        return looksLikeVehicle&&!looksLikeMachine;
      }),
    ...((rows||[]).map(r=>String(r.vehicle||'').trim()).filter(Boolean))
  ])].sort((a,b)=>a.localeCompare(b,'vi'));
  const blankForm=buyerId=>{
    const d=buyerOptions.find(x=>x.id===buyerId);
    return {
      buyerId:buyerId||'',
      buyerName:d?.name||'',
      date:isoDate(),
      vehicle:'',
      liters:0,
      price:0,
      amount:0,
      plateImage:'',
      plateImageName:'',
      meterImage:'',
      meterImageName:'',
      image:'',
      imageName:'',
      note:''
    };
  };
  const defaultBuyerId=(isDriver&&currentUser?.id)||selfOption?.id||'';
  const [form,setForm]=useState(blankForm(defaultBuyerId));
  const setF=(k,v)=>setForm(p=>{
    const next={...p,[k]:v};
    next.amount=numFmt(next.liters||0)*numFmt(next.price||0);
    return next;
  });
  const openAdd=()=>{
    setEdit(null);
    setForm(blankForm(defaultBuyerId));
    setModal(true);
  };
  const openEdit=row=>{
    setEdit(row);
    setForm({
      buyerId:row.buyerId||'',
      buyerName:row.buyerName||'',
      date:toIsoDate(row.date)||isoDate(),
      vehicle:row.vehicle||'',
      liters:numFmt(row.liters||0),
      price:numFmt(row.price||0),
      amount:numFmt(row.amount||0),
      plateImage:row.plateImage||'',
      plateImageName:row.plateImageName||'',
      meterImage:row.meterImage||row.image||'',
      meterImageName:row.meterImageName||row.imageName||'',
      image:row.image||'',
      imageName:row.imageName||'',
      note:row.note||''
    });
    setModal(true);
  };
  const isOwn=row=>!isDriver||row.buyerId===currentUser.id||String(row.buyerName||'').trim().toLowerCase()===String(currentUser.name||'').trim().toLowerCase();
  const canFix=row=>canManage||(isDriver&&isOwn(row)&&String(row.note||'').trim());
  const busyPlate=uploading==='plate';
  const busyMeter=uploading==='meter';
  const countImages=row=>((row.plateImage?1:0)+(row.meterImage?1:0)+((!row.plateImage&&!row.meterImage&&row.image)?1:0));
  const renderImageActions=row=>{
    const items=[];
    if(row.plateImage)items.push(h('button',{key:'plate',className:'bi',title:'Xem ảnh biển số',onClick:()=>window.open(row.plateImage,'_blank')},h('i',{className:'ti ti-id',style:{fontSize:15,color:'var(--pri)'}})));
    if(row.meterImage)items.push(h('button',{key:'meter',className:'bi',title:'Xem ảnh cây xăng',onClick:()=>window.open(row.meterImage,'_blank')},h('i',{className:'ti ti-gas-station',style:{fontSize:15,color:'var(--pri)'}})));
    if(!items.length&&row.image)items.push(h('button',{key:'legacy',className:'bi',title:'Xem ảnh',onClick:()=>window.open(row.image,'_blank')},h('i',{className:'ti ti-photo',style:{fontSize:15,color:'var(--pri)'}})));
    return items.length?h('div',{style:{display:'flex',gap:4,flexWrap:'wrap'}},items):'—';
  };
  const formatPlateCandidate=raw=>{
    const clean=normalizeVehicleKey(raw);
    const m1=clean.match(/^(\d{2})([A-Z]{1,2})(\d{3})(\d{2,3})$/);
    if(m1)return `${m1[1]}${m1[2]}-${m1[3]}.${m1[4]}`;
    const m2=clean.match(/^(\d{2})([A-Z]{1,2})(\d{4,5})$/);
    if(m2)return `${m2[1]}${m2[2]}-${m2[3]}`;
    return clean;
  };
  const extractPlateFromText=text=>{
    const source=String(text||'').toUpperCase().replace(/[–—]/g,'-');
    const compact=normalizeVehicleKey(source);
    const exactVehicle=[...vehicleOptions]
      .sort((a,b)=>normalizeVehicleKey(b).length-normalizeVehicleKey(a).length)
      .find(v=>compact.includes(normalizeVehicleKey(v)));
    if(exactVehicle)return exactVehicle;
    const rawCandidates=[
      ...(source.match(/\d{2}[A-Z]{1,2}-?\d{3}\.?\d{2,3}/g)||[]),
      ...(source.match(/\d{2}[A-Z]{1,2}-?\d{4,5}/g)||[]),
      ...(compact.match(/\d{2}[A-Z]{1,2}\d{4,6}/g)||[])
    ].map(formatPlateCandidate).filter(Boolean);
    return [...new Set(rawCandidates)].sort((a,b)=>normalizeVehicleKey(b).length-normalizeVehicleKey(a).length)[0]||'';
  };
  const parseOcrVolume=token=>{
    const cleaned=String(token||'').replace(/[^\d.,]/g,'');
    if(!cleaned)return 0;
    const lastSep=Math.max(cleaned.lastIndexOf('.'),cleaned.lastIndexOf(','));
    if(lastSep>=0){
      const before=cleaned.slice(0,lastSep).replace(/[.,]/g,'');
      const after=cleaned.slice(lastSep+1).replace(/[.,]/g,'');
      if(after.length>0&&after.length<=3&&before.length<=3)return Number(`${before}.${after}`)||0;
    }
    return Number(cleaned.replace(/[.,]/g,''))||0;
  };
  const parseOcrMoney=token=>Number(String(token||'').replace(/\D/g,''))||0;
  const extractFuelDataFromText=text=>{
    const lines=String(text||'').split(/\n+/).map(raw=>({raw:String(raw||'').trim(),norm:normalizeText(raw)})).filter(x=>x.raw);
    let liters=0, price=0, amount=0;
    lines.forEach(line=>{
      const tokens=line.raw.match(/\d[\d.,]*/g)||[];
      if(!tokens.length)return;
      const volumeVals=tokens.map(parseOcrVolume).filter(v=>v>0&&v<300);
      const moneyVals=tokens.map(parseOcrMoney).filter(v=>v>=1000);
      if(!liters&&/(so lit|so l|lit|litre|xang)/.test(line.norm)&&volumeVals.length)liters=volumeVals.find(v=>/[.,]/.test(tokens[volumeVals.indexOf(v)]))||volumeVals[0];
      if(!price&&/(don gia|dg|gia\/l|vnd\/l|gia tien|price)/.test(line.norm)&&moneyVals.length)price=moneyVals.sort((a,b)=>a-b)[0];
      if(!amount&&/(thanh tien|tong tien|so tien|phai tra|amount|total)/.test(line.norm)&&moneyVals.length)amount=moneyVals.sort((a,b)=>b-a)[0];
    });
    const allTokens=String(text||'').match(/\d[\d.,]*/g)||[];
    const fallbackVolumes=allTokens.map(token=>({raw:token,val:parseOcrVolume(token)})).filter(x=>x.val>0&&x.val<300).sort((a,b)=>a.val-b.val);
    const fallbackMoney=allTokens.map(parseOcrMoney).filter(v=>v>=1000).sort((a,b)=>a-b);
    if(!liters&&fallbackVolumes.length)liters=(fallbackVolumes.find(x=>/[.,]/.test(x.raw))||fallbackVolumes[0]).val;
    if(!price&&fallbackMoney.length)price=fallbackMoney[0];
    if(!amount&&fallbackMoney.length>1)amount=fallbackMoney[fallbackMoney.length-1];
    if(liters&&amount&&!price)price=Math.round(amount/liters);
    if(price&&amount&&!liters)liters=Math.round((amount/price)*100)/100;
    if(liters&&price&&!amount)amount=Math.round(liters*price);
    return {
      liters:liters?Math.round(liters*100)/100:0,
      price:price||0,
      amount:amount||0
    };
  };
  const recognizeTextFromImage=async file=>{
    if(!window.Tesseract)throw new Error('Chưa tải được thư viện OCR. Kiểm tra mạng.');
    const img=await resizeImageFile(file,1800,.9);
    const res=await Tesseract.recognize(img.dataUrl,'vie+eng');
    return String(res?.data?.text||'');
  };
  const inRange=dateValue=>{
    const d=parseAnyDate(dateValue);
    if(!d) return !df&&!dt;
    const from=df?parseAnyDate(df):null;
    const to=dt?parseAnyDate(dt):null;
    if(from&&d<from) return false;
    if(to&&d>to) return false;
    return true;
  };
  const visible=(rows||[])
    .filter(r=>(canManage||isOwn(r))
      && inRange(r.date||r.createdAt||r.updatedAt)
      && (!buyerFilter||String(r.buyerId||'')===String(buyerFilter))
      && (!vehicleFilter||String(r.vehicle||'')===String(vehicleFilter))
      && (!q||[r.date,r.vehicle,r.buyerName,r.note,r.imageName,r.plateImageName,r.meterImageName].join(' ').toLowerCase().includes(q.toLowerCase())))
    .slice()
    .sort((a,b)=>{
      const da=parseAnyDate(a.date||a.createdAt||a.updatedAt);
      const db=parseAnyDate(b.date||b.createdAt||b.updatedAt);
      const ta=da?da.getTime():0;
      const tb=db?db.getTime():0;
      if(tb!==ta) return tb-ta;
      return String(b.id||'').localeCompare(String(a.id||''),'vi',{numeric:true});
    });
  const save=()=>{
    if(!form.date||!form.vehicle||numFmt(form.liters)<=0||numFmt(form.price)<=0){
      window.showToast('Nhập ngày mua, xe, số lít và giá tiền.','warn');
      return;
    }
    const buyerId=edit?.buyerId||currentUser.id||form.buyerId||'';
    const buyerName=edit?.buyerName||currentUser.name||form.buyerName||'';
    const data={
      ...form,
      buyerId,
      buyerName,
      date:toIsoDate(form.date)||isoDate(),
      liters:numFmt(form.liters||0),
      price:numFmt(form.price||0),
      amount:numFmt(form.liters||0)*numFmt(form.price||0),
      image:form.meterImage||form.plateImage||form.image||'',
      imageName:form.meterImageName||form.plateImageName||form.imageName||'',
      updatedAt:fmtDT(),
      updatedBy:currentUser.name
    };
    if(edit){
      setRows(prev=>prev.map(x=>x.id===edit.id?{...x,...data}:x));
      window.showToast('Đã cập nhật đơn mua xăng dầu','success');
    }else{
      setRows(prev=>[{
        ...data,
        id:'XD'+uid(),
        createdAt:fmtDT(),
        createdBy:currentUser.name
      },...prev]);
      window.showToast('Đã thêm đơn mua xăng dầu','success');
    }
    setModal(false);
    setEdit(null);
  };
  const del=id=>{
    window.scfConfirm('Bạn có chắc muốn xóa đơn mua xăng dầu này?','Xóa đơn',true).then(ok=>{
      if(ok){
        setRows(prev=>prev.filter(x=>x.id!==id));
        window.showToast('Đã xóa đơn mua xăng dầu','success');
      }
    });
  };
  const pickPlateImage=async file=>{
    if(!file)return;
    try{
      setUploading('plate');
      const url=await uploadPhoto(file,'fuel-purchases/plates/'+(edit?.id||'new'));
      setForm(p=>({...p,plateImage:url,plateImageName:file.name||'anh-bien-so.jpg'}));
      try{
        const text=await recognizeTextFromImage(file);
        const vehicle=extractPlateFromText(text);
        if(vehicle){
          setForm(p=>({...p,plateImage:url,plateImageName:file.name||'anh-bien-so.jpg',vehicle}));
          window.showToast('Đã nhận diện biển số xe: '+vehicle,'success');
        }else{
          window.showToast('Đã lưu ảnh biển số nhưng chưa đọc rõ biển số. Có thể nhập tay nếu cần.','warn');
        }
      }catch(e){
        window.showToast(e.message||'Đã lưu ảnh biển số nhưng chưa đọc được chữ trong ảnh.','warn');
      }
    }catch(e){
      window.showToast('Chưa tải được ảnh biển số.','error');
    }finally{
      setUploading('');
    }
  };
  const pickMeterImage=async file=>{
    if(!file)return;
    try{
      setUploading('meter');
      const url=await uploadPhoto(file,'fuel-purchases/meters/'+(edit?.id||'new'));
      setForm(p=>({...p,meterImage:url,meterImageName:file.name||'anh-cay-xang.jpg',image:url,imageName:file.name||'anh-cay-xang.jpg'}));
      try{
        const text=await recognizeTextFromImage(file);
        const parsed=extractFuelDataFromText(text);
        const filled=[];
        setForm(p=>{
          const next={...p,meterImage:url,meterImageName:file.name||'anh-cay-xang.jpg',image:url,imageName:file.name||'anh-cay-xang.jpg'};
          let liters=parsed.liters||numFmt(next.liters||0);
          let price=parsed.price||numFmt(next.price||0);
          let amount=parsed.amount||numFmt(next.amount||0);
          if(liters&&amount&&!price)price=Math.round(amount/liters);
          if(price&&amount&&!liters)liters=Math.round((amount/price)*100)/100;
          if(liters){next.liters=liters;filled.push('số lít');}
          if(price){next.price=price;filled.push('giá tiền');}
          next.amount=amount||Math.round((numFmt(next.liters||0)||0)*(numFmt(next.price||0)||0));
          if(next.amount)filled.push('thành tiền');
          return next;
        });
        if(filled.length)window.showToast('Đã đọc ảnh cây xăng và điền '+[...new Set(filled)].join(', ')+'.','success');
        else window.showToast('Đã lưu ảnh cây xăng nhưng chưa đọc rõ số liệu. Có thể nhập tay nếu cần.','warn');
      }catch(e){
        window.showToast(e.message||'Đã lưu ảnh cây xăng nhưng chưa OCR được số liệu.','warn');
      }
    }catch(e){
      window.showToast('Chưa tải được ảnh cây xăng.','error');
    }finally{
      setUploading('');
    }
  };
  const captureBothFuelImages=()=>{
    if(uploading)return;
    const makeInput=()=>{
      const input=document.createElement('input');
      input.type='file';
      input.accept='image/*';
      input.setAttribute('capture','environment');
      input.style.display='none';
      document.body.appendChild(input);
      return input;
    };
    const plateInput=makeInput();
    const meterInput=makeInput();
    let done=false;
    let plateFile=null;
    const cleanup=()=>{
      if(done)return;
      done=true;
      setTimeout(()=>{
        plateInput.remove();
        meterInput.remove();
      },0);
    };
    const processCapturedFiles=async meterFile=>{
      cleanup();
      if(plateFile)await pickPlateImage(plateFile);
      if(meterFile)await pickMeterImage(meterFile);
      else if(plateFile)window.showToast('Đã lưu ảnh biển số. Có thể chụp ảnh cây xăng sau nếu cần.','warn');
    };
    plateInput.addEventListener('change',()=>{
      plateFile=plateInput.files?.[0]||null;
      if(!plateFile){
        cleanup();
        return;
      }
      meterInput.click();
    },{once:true});
    plateInput.addEventListener('cancel',cleanup,{once:true});
    meterInput.addEventListener('change',()=>{processCapturedFiles(meterInput.files?.[0]||null);},{once:true});
    meterInput.addEventListener('cancel',()=>{processCapturedFiles(null);},{once:true});
    plateInput.click();
  };
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-gas-station',style:{fontSize:20}}),'Đơn mua xăng dầu'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Lọc theo ngày, người đổ và xe để xem nhanh trên điện thoại.'),
      h('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},
        h(ExportBtn,{onClick:()=>xlsxExport(visible.map(r=>({...r,image:r.meterImage||r.plateImage||r.image||''})),[['date','Ngày mua'],['buyerName','Người đổ'],['vehicle','Xe'],['liters','Số lít'],['price','Giá tiền'],['amount','Thành tiền'],['note','Chú ý'],['plateImage','Ảnh biển số'],['meterImage','Ảnh cây xăng'],['image','Ảnh chính']],'Don_mua_xang_dau')}),
        h(AddBtn,{onClick:openAdd,label:'Thêm đơn mua xăng dầu'})
      )
    ),
    h('div',{className:'card',style:{marginBottom:'1rem',padding:'12px 14px'}},
      h('div',{className:'responsive-filter-grid'},
        h(F,{label:'Tìm nhanh'},
          h(SearchBar,{value:q,onChange:sq,placeholder:'Tên, xe, ghi chú...'})
        ),
        h(F,{label:'Từ ngày'},
          h('input',{type:'date',value:df,onChange:e=>sdf(e.target.value)})
        ),
        h(F,{label:'Đến ngày'},
          h('input',{type:'date',value:dt,onChange:e=>sdt(e.target.value)})
        ),
        h(F,{label:'Người đổ'},
          h('select',{value:buyerFilter,onChange:e=>setBuyerFilter(e.target.value)},
            h('option',{value:''},'Tất cả'),
            ...buyerOptions.map(b=>h('option',{key:b.id,value:b.id},b.name||b.label))
          )
        ),
        h(F,{label:'Xe'},
          h('select',{value:vehicleFilter,onChange:e=>setVehicleFilter(e.target.value)},
            h('option',{value:''},'Tất cả'),
            ...vehicleOptions.map(v=>h('option',{key:v,value:v},v))
          )
        ),
        h('div',{style:{display:'flex',alignItems:'flex-end'}},
          h('button',{
            type:'button',
            onClick:()=>{sq('');sdf('');sdt('');setBuyerFilter('');setVehicleFilter('');}
          },h('i',{className:'ti ti-filter-off',style:{fontSize:14}}),'Xóa lọc')
        )
      )
    ),
    h('div',{className:'mobile-only fuel-mobile-list'},
      visible.length?visible.map(r=>h('div',{key:'m_'+r.id,className:'fuel-mobile-card'},
        h('div',{className:'fuel-mobile-card-head'},
          h('div',null,
            h('div',{className:'fuel-mobile-card-title'},r.vehicle||'—'),
            h('div',{style:{fontSize:13,fontWeight:600,color:'var(--pri)'}},r.buyerName||'—')
          ),
          h('div',{className:'fuel-mobile-card-date'},fmtAnyDate(r.date)||'—')
        ),
        h('div',{className:'fuel-mobile-meta'},
          h('div',{className:'fuel-mobile-meta-item'},h('b',null,'Số lít'),h('span',null,numFmt(r.liters||0)||'—')),
          h('div',{className:'fuel-mobile-meta-item'},h('b',null,'Giá tiền'),h('span',null,numFmt(r.price||0)?Number(r.price).toLocaleString('vi-VN'):'—')),
          h('div',{className:'fuel-mobile-meta-item'},h('b',null,'Thành tiền'),h('span',null,numFmt(r.amount||0)?Number(r.amount).toLocaleString('vi-VN'):'—')),
          h('div',{className:'fuel-mobile-meta-item'},h('b',null,'Ảnh'),h('span',null,countImages(r)?(countImages(r)+' ảnh'):'Chưa có ảnh'))
        ),
        r.note&&h('div',{className:'fuel-mobile-note'},r.note),
        h('div',{className:'fuel-mobile-actions'},
          (()=>{const imgs=renderImageActions(r);return imgs==='—'?null:imgs;})(),
          canFix(r)&&h('button',{className:'bi',onClick:()=>openEdit(r)},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
          canFix(r)&&h('button',{className:'bi',onClick:()=>del(r.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
        )
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có đơn mua xăng dầu nào.')
    ),
    h('div',{className:'tw desktop-only'},h('table',null,
      h('thead',null,h('tr',null,...['Ngày mua','Người đổ','Xe','Số lít','Giá tiền','Thành tiền','Ảnh','Chú ý',''].map(c=>h('th',{key:c},c)))),
      h('tbody',null,visible.length?visible.map(r=>h('tr',{key:r.id},
        h('td',null,fmtAnyDate(r.date)||'—'),
        h('td',null,h('div',{style:{fontWeight:600}},r.buyerName||'—')),
        h('td',null,r.vehicle||'—'),
        h('td',null,numFmt(r.liters||0)||'—'),
        h('td',null,numFmt(r.price||0)?Number(r.price).toLocaleString('vi-VN'):'—'),
        h('td',null,h('span',{style:{fontWeight:600,color:'var(--pri)'}},numFmt(r.amount||0)?Number(r.amount).toLocaleString('vi-VN'):'—')),
        h('td',null,renderImageActions(r)),
        h('td',null,r.note?h('span',{className:'badge',style:{background:'#FFF3CD',color:'#8A5A00',maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}},r.note):'—'),
        h('td',null,h('div',{style:{display:'flex',gap:2}},
          canFix(r)&&h('button',{className:'bi',onClick:()=>openEdit(r)},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
          canFix(r)&&h('button',{className:'bi',onClick:()=>del(r.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
        ))
      )):h('tr',null,h('td',{colSpan:9,className:'empty-st'},'Chưa có đơn mua xăng dầu nào.')))
    )),
    modal&&h(Modal,{title:edit?'Sửa đơn mua xăng dầu':'Thêm đơn mua xăng dầu',onClose:()=>{setModal(false);setEdit(null);}},
      h('div',{className:'g2'},
        h(F,{label:'Người đổ *'},h('input',{value:edit?(form.buyerName||currentUser.name||''):(currentUser.name||''),readOnly:true,style:{background:'var(--bg2)'}})),
        h(F,{label:'Ngày mua *'},h('input',{type:'date',value:toIsoDate(form.date),onChange:e=>setF('date',e.target.value)}))
      ),
      h('div',{className:'g2'},
        h(F,{label:'Xe / biển số *'},
          h('div',null,
            h('input',{value:form.vehicle,onChange:e=>setF('vehicle',e.target.value.toUpperCase()),list:'fuel-vehicle-options',placeholder:'Nhập hoặc OCR biển số xe...',style:{fontSize:13}}),
            h('datalist',{id:'fuel-vehicle-options'},vehicleOptions.map(v=>h('option',{key:v,value:v},v)))
          )
        ),
        h(F,{label:'Ảnh biển số'},
          h('div',{style:{display:'grid',gap:8}},
            h('div',{style:{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}},
              form.plateImage&&h('button',{type:'button',onClick:()=>window.open(form.plateImage,'_blank'),style:{fontSize:12,padding:'6px 12px'}},h('i',{className:'ti ti-photo',style:{fontSize:14}}),'Xem ảnh'),
              h('button',{type:'button',disabled:!!uploading,onClick:captureBothFuelImages,style:{fontSize:12,padding:'6px 12px'}},
                h('i',{className:'ti '+(uploading?'ti-loader-2 spin':'ti-camera-plus'),style:{fontSize:14}}),
                uploading?'Đang xử lý ảnh...':'Chụp nhanh cả 2 ảnh'
              ),
              h('label',{style:{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',border:'1px solid var(--bd)',borderRadius:'var(--r)',cursor:busyPlate?'wait':'pointer',background:'#fff'}},
                h('i',{className:'ti '+(busyPlate?'ti-loader-2 spin':'ti-id'),style:{fontSize:14}}),
                busyPlate?'Đang đọc biển số...':'Chụp biển số',
                h('input',{type:'file',accept:'image/*',capture:'environment',style:{display:'none'},disabled:!!uploading,onChange:e=>pickPlateImage(e.target.files?.[0])})
              )
            ),
            form.plateImageName&&h('span',{style:{fontSize:12,color:'var(--tx2)'}},form.plateImageName)
          )
        )
      ),
      h(F,{label:'Ảnh cây xăng'},
        h('div',{style:{display:'grid',gap:8}},
          h('div',{style:{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}},
            (form.meterImage||form.image)&&h('button',{type:'button',onClick:()=>window.open(form.meterImage||form.image,'_blank'),style:{fontSize:12,padding:'6px 12px'}},h('i',{className:'ti ti-photo',style:{fontSize:14}}),'Xem ảnh'),
            h('label',{style:{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',border:'1px solid var(--bd)',borderRadius:'var(--r)',cursor:busyMeter?'wait':'pointer',background:'#fff'}},
              h('i',{className:'ti '+(busyMeter?'ti-loader-2 spin':'ti-gas-station'),style:{fontSize:14}}),
              busyMeter?'Đang đọc cây xăng...':'Chụp cây xăng',
              h('input',{type:'file',accept:'image/*',capture:'environment',style:{display:'none'},disabled:!!uploading,onChange:e=>pickMeterImage(e.target.files?.[0])})
            ),
            h('label',{style:{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 14px',border:'1px solid var(--bd)',borderRadius:'var(--r)',cursor:busyMeter?'wait':'pointer',background:'#fff'}},
              h('i',{className:'ti '+(busyMeter?'ti-loader-2 spin':'ti-camera-plus'),style:{fontSize:14}}),
              busyMeter?'Đang tải ảnh...':'Chọn ảnh cũ',
              h('input',{type:'file',accept:'image/*',style:{display:'none'},disabled:!!uploading,onChange:e=>pickMeterImage(e.target.files?.[0])})
            )
          ),
          (form.meterImageName||form.imageName)&&h('span',{style:{fontSize:12,color:'var(--tx2)'}},form.meterImageName||form.imageName),
          h('div',{style:{fontSize:12,color:'var(--tx2)'}},'App sẽ cố gắng tự đọc số lít, giá tiền và thành tiền từ ảnh cây xăng.')
        )
      ),
      h('div',{className:'g2'},
        h(F,{label:'Số lít *'},h('input',{type:'number',min:0,step:'0.1',value:form.liters,onChange:e=>setF('liters',e.target.value),placeholder:'0'})),
        h(F,{label:'Giá tiền *'},h(NumInput,{value:form.price,onChange:v=>setF('price',v),placeholder:'0'}))
      ),
      h('div',{className:'g2'},
        h(F,{label:'Thành tiền'},h('input',{value:numFmt(form.amount||0)?Number(form.amount).toLocaleString('vi-VN'):'0',readOnly:true,style:{background:'var(--bg2)',fontWeight:600}}))
      ),
      h(F,{label:'Chú ý'},h('textarea',{value:form.note,onChange:e=>setF('note',e.target.value),rows:3,placeholder:'Đơn lỗi hoặc cần sửa thì ghi chú ở đây...'})),
      h(Row,null,
        h('button',{onClick:()=>{setModal(false);setEdit(null);}},'Hủy'),
        h('button',{className:'bp',onClick:save,style:{padding:'8px 20px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu đơn')
      )
    )
  );
}

function FuelPurchaseReportTab({rows}){
  const todayText=fmtDate();
  const todayIso=todayText.split('/').reverse().join('-');
  const [df,sdf]=useState(todayIso);
  const [dt,sdt]=useState(todayIso);
  const [monthFilter,setMonthFilter]=useState(todayIso.slice(0,7));
  const [buyerFilter,setBuyerFilter]=useState('');
  const [vehicleFilter,setVehicleFilter]=useState('');
  const pad2=n=>String(n).padStart(2,'0');
  useEffect(()=>{
    if(!monthFilter) return;
    const parts=String(monthFilter).split('-');
    if(parts.length!==2) return;
    const y=Number(parts[0]);
    const m=Number(parts[1]);
    if(!y||!m) return;
    const lastDay=new Date(y,m,0).getDate();
    sdf(`${y}-${pad2(m)}-01`);
    sdt(`${y}-${pad2(m)}-${pad2(lastDay)}`);
  },[monthFilter]);
  const monthKey=v=>{
    const d=parseAnyDate(v);
    return d?(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')):'';
  };
  const monthLabel=ym=>{
    if(!ym) return 'Chưa rõ tháng';
    const [y,m]=String(ym).split('-');
    return 'Tháng '+Number(m)+'/'+y;
  };
  const inRange=v=>{
    const d=parseAnyDate(v);
    if(!d) return false;
    const from=df?parseAnyDate(df):null;
    const to=dt?parseAnyDate(dt):null;
    if(from&&d<from) return false;
    if(to&&d>to) return false;
    return true;
  };
  const buyerOptions=[...new Map((rows||[]).filter(r=>r.buyerId||r.buyerName).map(r=>[
    String(r.buyerId||r.buyerName||''),
    {id:String(r.buyerId||r.buyerName||''),name:r.buyerName||r.buyerId||'Chưa rõ'}
  ])).values()].sort((a,b)=>a.name.localeCompare(b.name,'vi'));
  const vehicleOptions=[...new Set((rows||[]).map(r=>String(r.vehicle||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const filtered=(rows||[]).filter(r=>
    inRange(r.date||r.createdAt||r.updatedAt)
    && (!buyerFilter||String(r.buyerId||r.buyerName||'')===String(buyerFilter))
    && (!vehicleFilter||String(r.vehicle||'')===String(vehicleFilter))
  );
  const totalLiters=filtered.reduce((s,r)=>s+(numFmt(r.liters)||0),0);
  const totalAmount=filtered.reduce((s,r)=>s+(numFmt(r.amount)||0),0);
  const totalCount=filtered.length;
  const addGroup=(map,key,seed)=>{
    if(!map[key]) map[key]=seed;
    return map[key];
  };
  const byMonth={};
  const byVehicle={};
  const byBuyer={};
  filtered.forEach(r=>{
    const liters=numFmt(r.liters)||0;
    const amount=numFmt(r.amount)||0;
    const mk=monthKey(r.date||r.createdAt||r.updatedAt)||'unknown';
    const monthItem=addGroup(byMonth,mk,{key:mk,label:monthLabel(mk),count:0,liters:0,amount:0});
    monthItem.count++; monthItem.liters+=liters; monthItem.amount+=amount;
    const vk=String(r.vehicle||'Chưa rõ xe');
    const vehicleItem=addGroup(byVehicle,vk,{key:vk,label:vk,count:0,liters:0,amount:0});
    vehicleItem.count++; vehicleItem.liters+=liters; vehicleItem.amount+=amount;
    const bk=String(r.buyerName||r.buyerId||'Chưa rõ người đổ');
    const buyerItem=addGroup(byBuyer,bk,{key:bk,label:bk,count:0,liters:0,amount:0});
    buyerItem.count++; buyerItem.liters+=liters; buyerItem.amount+=amount;
  });
  const sortGroups=list=>list.sort((a,b)=>{
    if(b.amount!==a.amount) return b.amount-a.amount;
    return String(a.label||'').localeCompare(String(b.label||''),'vi');
  });
  const monthRows=sortGroups(Object.values(byMonth));
  const vehicleRows=sortGroups(Object.values(byVehicle));
  const buyerRows=sortGroups(Object.values(byBuyer));
  const exportRows=filtered.map(r=>({
    date:fmtAnyDate(r.date)||'',
    buyerName:r.buyerName||'',
    vehicle:r.vehicle||'',
    liters:numFmt(r.liters)||0,
    price:numFmt(r.price)||0,
    amount:numFmt(r.amount)||0,
    note:r.note||''
  }));
  const renderGroupTable=(title,items,cols,emptyText)=>h('div',{className:'tw'},
    h('table',null,
      h('thead',null,h('tr',null,cols.map(c=>h('th',{key:c.key||c.label},c.label)))),
      h('tbody',null,
        items.length?items.map(row=>h('tr',{key:row.key},
          cols.map(c=>h('td',{key:c.key||c.label},
            c.render?c.render(row):row[c.key]
          ))
        )):h('tr',null,h('td',{colSpan:cols.length,className:'empty-st'},emptyText||('Chưa có dữ liệu '+title.toLowerCase()+'.')))
      )
    )
  );
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-gas-station',style:{fontSize:20}}),'Báo cáo mua xăng dầu'),
    h('div',{className:'card',style:{marginBottom:'1rem'}},
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'0 1rem'}},
        h(F,{label:'Tháng nhanh'},
          h('div',{style:{display:'flex',gap:8,alignItems:'center'}},
            h('input',{type:'month',value:monthFilter,onChange:e=>setMonthFilter(e.target.value)}),
            h('button',{type:'button',onClick:()=>setMonthFilter(''),style:{whiteSpace:'nowrap',padding:'8px 12px'}},'Bỏ tháng')
          )
        ),
        h(F,{label:'Từ ngày'},h('input',{type:'date',value:df,onChange:e=>{setMonthFilter('');sdf(e.target.value);}})),
        h(F,{label:'Đến ngày'},h('input',{type:'date',value:dt,onChange:e=>{setMonthFilter('');sdt(e.target.value);}})),
        h(F,{label:'Người đổ'},
          h('select',{value:buyerFilter,onChange:e=>setBuyerFilter(e.target.value)},
            h('option',{value:''},'Tất cả'),
            buyerOptions.map(x=>h('option',{key:x.id,value:x.id},x.name))
          )
        ),
        h(F,{label:'Xe'},
          h('select',{value:vehicleFilter,onChange:e=>setVehicleFilter(e.target.value)},
            h('option',{value:''},'Tất cả'),
            vehicleOptions.map(x=>h('option',{key:x,value:x},x))
          )
        )
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:'1rem',marginTop:4}},
        h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Số lần đổ'),h('div',{style:{fontSize:24,fontWeight:700,color:'var(--pri)'}},totalCount)),
        h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng số lít'),h('div',{style:{fontSize:24,fontWeight:700,color:'var(--pri)'}},totalLiters.toLocaleString('vi-VN'))),
        h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng tiền'),h('div',{style:{fontSize:24,fontWeight:700,color:'var(--pri)'}},totalAmount.toLocaleString('vi-VN')+'đ'))
      ),
      h('div',{style:{display:'flex',justifyContent:'flex-end',marginTop:10}},
        h(ExportBtn,{onClick:()=>xlsxExport(exportRows,[['date','Ngày mua'],['buyerName','Người đổ'],['vehicle','Xe'],['liters','Số lít'],['price','Đơn giá'],['amount','Thành tiền'],['note','Ghi chú']],'Bao_cao_xang_dau')})
      )
    ),
    h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:'1rem',marginBottom:'1rem'}},
      h('div',null,
        h('div',{style:{fontWeight:700,color:'var(--pri3)',margin:'0 0 8px 2px'}},'Theo tháng'),
        renderGroupTable('Theo tháng',monthRows,[
          {key:'label',label:'Tháng'},
          {key:'count',label:'Số lần'},
          {key:'liters',label:'Số lít',render:r=>r.liters.toLocaleString('vi-VN')},
          {key:'amount',label:'Tiền',render:r=>r.amount.toLocaleString('vi-VN')+'đ'}
        ],'Chưa có dữ liệu theo tháng.')
      ),
      h('div',null,
        h('div',{style:{fontWeight:700,color:'var(--pri3)',margin:'0 0 8px 2px'}},'Theo xe'),
        renderGroupTable('Theo xe',vehicleRows,[
          {key:'label',label:'Xe'},
          {key:'count',label:'Số lần'},
          {key:'liters',label:'Số lít',render:r=>r.liters.toLocaleString('vi-VN')},
          {key:'amount',label:'Tiền',render:r=>r.amount.toLocaleString('vi-VN')+'đ'}
        ],'Chưa có dữ liệu theo xe.')
      ),
      h('div',null,
        h('div',{style:{fontWeight:700,color:'var(--pri3)',margin:'0 0 8px 2px'}},'Theo người đổ'),
        renderGroupTable('Theo người đổ',buyerRows,[
          {key:'label',label:'Người đổ'},
          {key:'count',label:'Số lần'},
          {key:'liters',label:'Số lít',render:r=>r.liters.toLocaleString('vi-VN')},
          {key:'amount',label:'Tiền',render:r=>r.amount.toLocaleString('vi-VN')+'đ'}
        ],'Chưa có dữ liệu theo người đổ.')
      )
    ),
    h('div',{className:'tw'},h('table',null,
      h('thead',null,h('tr',null,...['Ngày mua','Người đổ','Xe','Số lít','Thành tiền','Ghi chú'].map(c=>h('th',{key:c},c)))),
      h('tbody',null,
        filtered.length?filtered.map(r=>h('tr',{key:r.id},
          h('td',null,fmtAnyDate(r.date)||'—'),
          h('td',null,r.buyerName||'—'),
          h('td',null,r.vehicle||'—'),
          h('td',null,(numFmt(r.liters)||0).toLocaleString('vi-VN')),
          h('td',null,(numFmt(r.amount)||0).toLocaleString('vi-VN')+'đ'),
          h('td',null,r.note||'—')
        )):h('tr',null,h('td',{colSpan:6,className:'empty-st'},'Chưa có dữ liệu mua xăng dầu theo bộ lọc.'))
      )
    ))
  );
}

function MaintenanceReportTab(){
  const todayText=fmtDate();
  const todayIso=todayText.split('/').reverse().join('-');
  const [df,sdf]=useState(todayIso);
  const [dt,sdt]=useState(todayIso);
  const [vehicleRows,setVehicleRows]=useState([]);
  const [machineRows,setMachineRows]=useState([]);
  useEffect(()=>{
    let off=false;
    (async()=>{
      try{
        const [vehicles,machines]=await Promise.all([
          dbGet('scf_maint_vehicle',[]),
          dbGet('scf_maint_machine',[])
        ]);
        if(off) return;
        setVehicleRows(Array.isArray(vehicles)?vehicles:[]);
        setMachineRows(Array.isArray(machines)?machines:[]);
      }catch(e){
        if(off) return;
        try{
          const vehicles=JSON.parse(localStorage.getItem('scf_maint_vehicle')||'[]');
          const machines=JSON.parse(localStorage.getItem('scf_maint_machine')||'[]');
          setVehicleRows(Array.isArray(vehicles)?vehicles:[]);
          setMachineRows(Array.isArray(machines)?machines:[]);
        }catch(_e){}
      }
    })();
    return ()=>{off=true;};
  },[]);
  const monthKey=v=>{
    const d=parseAnyDate(v);
    return d?(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')):'';
  };
  const monthLabel=ym=>{
    if(!ym) return 'Chưa rõ tháng';
    const [y,m]=String(ym).split('-');
    return 'Tháng '+Number(m)+'/'+y;
  };
  const inRange=v=>{
    const d=parseAnyDate(v);
    if(!d) return false;
    const from=df?parseAnyDate(df):null;
    const to=dt?parseAnyDate(dt):null;
    if(from&&d<from) return false;
    if(to&&d>to) return false;
    return true;
  };
  const getRepairerNames=r=>{
    const direct=Array.isArray(r?.repairerNames)?r.repairerNames.map(x=>String(x||'').trim()).filter(Boolean):[];
    if(direct.length) return [...new Set(direct)];
    return String(r?.repairerText||'').split(',').map(x=>x.trim()).filter(Boolean);
  };
  const filteredVehicle=(vehicleRows||[]).filter(r=>inRange(r.date||r.createdAt||r.updatedAt));
  const filteredMachine=(machineRows||[]).filter(r=>inRange(r.date||r.createdAt||r.updatedAt));
  const totalVehicleAmount=filteredVehicle.reduce((s,r)=>s+(numFmt(r.amount)||0),0);
  const totalMachineAmount=filteredMachine.reduce((s,r)=>s+(numFmt(r.amount)||0),0);
  const groupList=(source,keyGetter,labelGetter,amountGetter,countIncrement=1)=>{
    const map={};
    source.forEach(item=>{
      const key=keyGetter(item)||'unknown';
      if(!map[key]) map[key]={key,label:labelGetter(item,key),count:0,amount:0};
      map[key].count+=countIncrement;
      map[key].amount+=amountGetter(item)||0;
    });
    return Object.values(map).sort((a,b)=>{
      if(b.amount!==a.amount) return b.amount-a.amount;
      return String(a.label||'').localeCompare(String(b.label||''),'vi');
    });
  };
  const vehicleByMonth=groupList(filteredVehicle,r=>monthKey(r.date||r.createdAt||r.updatedAt),(_,k)=>monthLabel(k),r=>numFmt(r.amount)||0);
  const vehicleByAsset=groupList(filteredVehicle,r=>String(r.vehicle||'Chưa rõ xe'),r=>String(r.vehicle||'Chưa rõ xe'),r=>numFmt(r.amount)||0);
  const vehicleByGarage=groupList(filteredVehicle,r=>String(r.garage||'Chưa rõ gara'),r=>String(r.garage||'Chưa rõ gara'),r=>numFmt(r.amount)||0);
  const machineByMonth=groupList(filteredMachine,r=>monthKey(r.date||r.createdAt||r.updatedAt),(_,k)=>monthLabel(k),r=>numFmt(r.amount)||0);
  const machineByAsset=groupList(filteredMachine,r=>String(r.vehicle||'Chưa rõ máy'),r=>String(r.vehicle||'Chưa rõ máy'),r=>numFmt(r.amount)||0);
  const machineRepairerEntries=filteredMachine.flatMap(r=>{
    const repairers=getRepairerNames(r);
    const amount=numFmt(r.amount)||0;
    return (repairers.length?repairers:['Chưa rõ người sửa']).map(name=>({name,amount,date:r.date||r.createdAt||r.updatedAt}));
  });
  const machineByRepairer=groupList(machineRepairerEntries,r=>String(r.name||'Chưa rõ người sửa'),r=>String(r.name||'Chưa rõ người sửa'),r=>numFmt(r.amount)||0);
  const exportVehicleRows=filteredVehicle.map(r=>({
    type:'Sửa xe',
    month:monthLabel(monthKey(r.date||r.createdAt||r.updatedAt)),
    date:fmtAnyDate(r.date)||'',
    asset:r.vehicle||'',
    service:r.service||'',
    km:r.km||'',
    garage:r.garage||'',
    repairer:'',
    amount:numFmt(r.amount)||0,
    invoice:r.invoice||''
  }));
  const exportMachineRows=filteredMachine.map(r=>({
    type:'Sửa máy',
    month:monthLabel(monthKey(r.date||r.createdAt||r.updatedAt)),
    date:fmtAnyDate(r.date)||'',
    asset:r.vehicle||'',
    service:r.service||'',
    km:'',
    garage:'',
    repairer:getRepairerNames(r).join(', '),
    amount:numFmt(r.amount)||0,
    invoice:r.invoice||''
  }));
  const detailVehicleRows=filteredVehicle
    .slice()
    .sort((a,b)=>{
      const da=parseAnyDate(a.date||a.createdAt||a.updatedAt);
      const db=parseAnyDate(b.date||b.createdAt||b.updatedAt);
      return (db?db.getTime():0)-(da?da.getTime():0);
    });
  const detailMachineRows=filteredMachine
    .slice()
    .sort((a,b)=>{
      const da=parseAnyDate(a.date||a.createdAt||a.updatedAt);
      const db=parseAnyDate(b.date||b.createdAt||b.updatedAt);
      return (db?db.getTime():0)-(da?da.getTime():0);
    });
  const renderGroupTable=(title,rows,cols,empty)=>h('div',null,
    h('div',{style:{fontWeight:700,color:'var(--pri3)',margin:'0 0 8px 2px'}},title),
    h('div',{className:'tw'},
      h('table',null,
        h('thead',null,h('tr',null,cols.map(c=>h('th',{key:c.key||c.label},c.label)))),
        h('tbody',null,
          rows.length?rows.map(r=>h('tr',{key:r.key},
            cols.map(c=>h('td',{key:c.key||c.label},c.render?c.render(r):r[c.key]))
          )):h('tr',null,h('td',{colSpan:cols.length,className:'empty-st'},empty))
        )
      )
    )
  );
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-tool',style:{fontSize:20}}),'Báo cáo sửa chữa'),
    h('div',{className:'card',style:{marginBottom:'1rem'}},
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'0 1rem'}},
        h(F,{label:'Từ ngày'},h('input',{type:'date',value:df,onChange:e=>sdf(e.target.value)})),
        h(F,{label:'Đến ngày'},h('input',{type:'date',value:dt,onChange:e=>sdt(e.target.value)}))
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:'1rem',marginTop:4}},
        h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tiền sửa xe'),h('div',{style:{fontSize:24,fontWeight:700,color:'var(--pri)'}},totalVehicleAmount.toLocaleString('vi-VN')+'đ')),
        h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tiền sửa máy'),h('div',{style:{fontSize:24,fontWeight:700,color:'var(--pri)'}},totalMachineAmount.toLocaleString('vi-VN')+'đ')),
        h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng chi sửa chữa'),h('div',{style:{fontSize:24,fontWeight:700,color:'var(--pri)'}},(totalVehicleAmount+totalMachineAmount).toLocaleString('vi-VN')+'đ'))
      ),
      h('div',{style:{display:'flex',justifyContent:'flex-end',marginTop:10}},
        h(ExportBtn,{onClick:()=>xlsxExport([...exportVehicleRows,...exportMachineRows],[['type','Loại'],['month','Tháng'],['date','Ngày'],['asset','Xe / máy'],['service','Dịch vụ'],['km','Tại KM'],['garage','Gara sửa'],['repairer','Người sửa'],['amount','Thành tiền'],['invoice','Hóa đơn']],'Bao_cao_sua_chua')})
      )
    ),
    h('div',{className:'card',style:{marginBottom:'1rem'}},
      h('div',{style:{fontWeight:800,fontSize:16,color:'var(--pri3)',marginBottom:12}},'Sửa xe'),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:'1rem'}},
        renderGroupTable('Theo tháng',vehicleByMonth,[
          {key:'label',label:'Tháng'},
          {key:'count',label:'Lượt'},
          {key:'amount',label:'Tiền',render:r=>r.amount.toLocaleString('vi-VN')+'đ'}
        ],'Chưa có dữ liệu sửa xe theo tháng.'),
        renderGroupTable('Theo xe',vehicleByAsset,[
          {key:'label',label:'Xe'},
          {key:'count',label:'Lượt'},
          {key:'amount',label:'Tiền',render:r=>r.amount.toLocaleString('vi-VN')+'đ'}
        ],'Chưa có dữ liệu sửa xe theo xe.'),
        renderGroupTable('Theo gara sửa',vehicleByGarage,[
          {key:'label',label:'Gara sửa'},
          {key:'count',label:'Lượt'},
          {key:'amount',label:'Tiền',render:r=>r.amount.toLocaleString('vi-VN')+'đ'}
        ],'Chưa có dữ liệu theo gara sửa.')
      ),
      h('div',{className:'tw',style:{marginTop:14}},h('table',null,
        h('thead',null,h('tr',null,...['Ngày','Xe','Dịch vụ','Tại KM','Gara sửa','Tiền','Hóa đơn'].map(c=>h('th',{key:c},c)))),
        h('tbody',null,
          detailVehicleRows.length?detailVehicleRows.map(r=>h('tr',{key:r.id||[r.date,r.vehicle,r.service].join('_')},
            h('td',null,fmtAnyDate(r.date)||'—'),
            h('td',null,r.vehicle||'—'),
            h('td',null,r.service||'—'),
            h('td',null,r.km||'—'),
            h('td',null,r.garage||'—'),
            h('td',null,(numFmt(r.amount)||0).toLocaleString('vi-VN')+'đ'),
            h('td',null,r.invoice||'—')
          )):h('tr',null,h('td',{colSpan:7,className:'empty-st'},'Chưa có chi tiết sửa xe.'))
        )
      ))
    ),
    h('div',{className:'card'},
      h('div',{style:{fontWeight:800,fontSize:16,color:'var(--pri3)',marginBottom:12}},'Sửa máy'),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:'1rem'}},
        renderGroupTable('Theo tháng',machineByMonth,[
          {key:'label',label:'Tháng'},
          {key:'count',label:'Lượt'},
          {key:'amount',label:'Tiền',render:r=>r.amount.toLocaleString('vi-VN')+'đ'}
        ],'Chưa có dữ liệu sửa máy theo tháng.'),
        renderGroupTable('Theo máy',machineByAsset,[
          {key:'label',label:'Máy'},
          {key:'count',label:'Lượt'},
          {key:'amount',label:'Tiền',render:r=>r.amount.toLocaleString('vi-VN')+'đ'}
        ],'Chưa có dữ liệu sửa máy theo máy.'),
        renderGroupTable('Theo người sửa',machineByRepairer,[
          {key:'label',label:'Người sửa'},
          {key:'count',label:'Lượt'},
          {key:'amount',label:'Tiền',render:r=>r.amount.toLocaleString('vi-VN')+'đ'}
        ],'Chưa có dữ liệu theo người sửa.')
      ),
      h('div',{className:'tw',style:{marginTop:14}},h('table',null,
        h('thead',null,h('tr',null,...['Ngày','Máy','Dịch vụ','Người sửa','Tiền','Hóa đơn'].map(c=>h('th',{key:c},c)))),
        h('tbody',null,
          detailMachineRows.length?detailMachineRows.map(r=>h('tr',{key:r.id||[r.date,r.vehicle,r.service].join('_')},
            h('td',null,fmtAnyDate(r.date)||'—'),
            h('td',null,r.vehicle||'—'),
            h('td',null,r.service||'—'),
            h('td',null,getRepairerNames(r).join(', ')||'—'),
            h('td',null,(numFmt(r.amount)||0).toLocaleString('vi-VN')+'đ'),
            h('td',null,r.invoice||'—')
          )):h('tr',null,h('td',{colSpan:6,className:'empty-st'},'Chưa có chi tiết sửa máy.'))
        )
      ))
    )
  );
}

/* --- Báo cáo mua hàng --- */
function PurchaseReportTab({purchases,nccs}) {
  const _td5=fmtDate();const _ti5=_td5.split('/').reverse().join('-');const [df,sdf]=useState(_ti5); const [dt,sdt]=useState(_ti5); const [ncc,sn]=useState(''); const [status,ss]=useState('all');
  const fmtPurchaseDate=s=>fmtAnyDate(s);
  const parseDate=s=>parseAnyDate(s);
  const inRange=d=>{const dt2=parseDate(d);if(!dt2)return false;const f2=df?parseDate(df):null;const t=dt?parseDate(dt):null;if(f2&&dt2<f2)return false;if(t&&dt2>t)return false;return true;};
  const filtered=(purchases||[]).filter(p=>inRange(p.orderDate||p.createdAt||p.updatedAt)&&(!ncc||p.nccId===ncc)&&(status==='all'||p.status===status));
  const active=filtered.filter(p=>p.status!=='cancelled');
  const totalAmt=active.reduce((s,p)=>s+(p.lines||[]).reduce((s2,l)=>s2+(Number(l.qty)||0)*(Number(l.price)||0),0),0);
  const totalItems=active.reduce((s,p)=>s+(p.lines||[]).reduce((s2,l)=>s2+(Number(l.qty)||0),0),0);
  const detailRows=active.flatMap(p=>(p.lines||[]).map(l=>({id:p.id,nccName:p.nccName,orderDate:p.orderDate,deliveryDate:p.deliveryDate,receivedDate:p.receivedDate||'',invoiceNo:p.invoiceNo||'',status:p.status,itemName:l.name||'',unit:l.unit||'',qty:Number(l.qty)||0,price:Number(l.price)||0,total:(Number(l.qty)||0)*(Number(l.price)||0)})));
  const byNcc={};active.forEach(p=>{if(!byNcc[p.nccId])byNcc[p.nccId]={name:p.nccName||'Chưa rõ NCC',orders:0,qty:0,total:0};byNcc[p.nccId].orders++;(p.lines||[]).forEach(l=>{byNcc[p.nccId].qty+=Number(l.qty)||0;byNcc[p.nccId].total+=(Number(l.qty)||0)*(Number(l.price)||0);});});
  const byItem={};detailRows.forEach(r=>{const k=r.itemName||'Chưa rõ mặt hàng';if(!byItem[k])byItem[k]={name:k,unit:r.unit,qty:0,total:0};byItem[k].qty+=r.qty;byItem[k].total+=r.total;});
  const allYears=[...new Set((purchases||[]).map(p=>parseDate(p.orderDate||p.createdAt||p.updatedAt)).filter(Boolean).map(d=>String(d.getFullYear())))].sort();
  const itemOptions=[...new Set(detailRows.map(r=>r.itemName).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const defaultYear=(parseDate(dt)||new Date()).getFullYear();
  const [chartItem, setChartItem] = useState('');
  const [chartYear, setChartYear] = useState(String(defaultYear));
  const chartMonths=Array.from({length:12},(_,i)=>({month:i+1,label:'T'+String(i+1),qty:0,total:0,unit:''}));
  detailRows.forEach(r=>{
    const d=parseDate(r.orderDate);
    if(!d) return;
    if(chartItem && r.itemName!==chartItem) return;
    if(String(d.getFullYear())!==String(chartYear)) return;
    const idx=d.getMonth();
    chartMonths[idx].qty+=Number(r.qty)||0;
    chartMonths[idx].total+=Number(r.total)||0;
    chartMonths[idx].unit=chartMonths[idx].unit||r.unit||'';
  });
  const chartMax=Math.max(...chartMonths.map(m=>m.total),0);
  const statusMap={all:'Tất cả',draft:'Nháp',ordered:'Đã đặt',received:'Đã nhận',cancelled:'Hủy'};
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-chart-bar',style:{fontSize:20}}),'Báo cáo mua hàng'),
    h('div',{className:'card',style:{marginBottom:'1.25rem'}},
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'0 1rem'}},
        h(F,{label:'Từ ngày'},h('input',{type:'date',value:df,onChange:e=>sdf(e.target.value)})),
        h(F,{label:'Đến ngày'},h('input',{type:'date',value:dt,onChange:e=>sdt(e.target.value)})),
        h(F,{label:'Nhà cung cấp'},h('select',{value:ncc,onChange:e=>sn(e.target.value)},h('option',{value:''},'Tất cả NCC'),(nccs||[]).map(n=>h('option',{key:n.id,value:n.id},n.name)))),
        h(F,{label:'Trạng thái'},h('select',{value:status,onChange:e=>ss(e.target.value)},Object.entries(statusMap).map(([v,l])=>h('option',{key:v,value:v},l))))
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:'1rem',marginTop:4}},
        h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Số đơn mua'),h('div',{style:{fontSize:24,fontWeight:600,color:'var(--pri)'}},filtered.length)),
        h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng số lượng'),h('div',{style:{fontSize:24,fontWeight:600,color:'var(--pri)'}},totalItems.toLocaleString())),
        h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng tiền mua'),h('div',{style:{fontSize:22,fontWeight:600,color:'var(--pri)'}},totalAmt.toLocaleString('vi-VN')+'đ'))
      ),
      h('div',{style:{display:'flex',justifyContent:'flex-end',marginTop:10}},
        h(ExportBtn,{onClick:()=>xlsxExport(detailRows,[['id','Mã đơn'],['nccName','Nhà cung cấp'],['orderDate','Ngày đặt'],['deliveryDate','Hạn giao'],['receivedDate','Ngày nhận'],['invoiceNo','Số hóa đơn'],['status','Trạng thái'],['itemName','Mặt hàng'],['unit','ĐVT'],['qty','Số lượng'],['price','Đơn giá'],['total','Thành tiền']],'Bao_cao_mua_hang')})
      )
    ),
    h('div',{className:'card',style:{marginBottom:'1.25rem'}},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:10}},
        h('div',{style:{fontWeight:600,color:'var(--pri3)'}},'Biểu đồ mua nguyên vật liệu theo tháng'),
        h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'0 1rem',flex:'1 1 420px'}},
          h(F,{label:'Nguyên vật liệu'},h('select',{value:chartItem,onChange:e=>setChartItem(e.target.value)},h('option',{value:''},'Tất cả nguyên vật liệu'),itemOptions.map(x=>h('option',{key:x,value:x},x)))),
          h(F,{label:'Năm'},h('select',{value:chartYear,onChange:e=>setChartYear(e.target.value)},(allYears.length?allYears:[String(defaultYear)]).map(y=>h('option',{key:y,value:y},y))))
        )
      ),
      h('div',{className:'chart-scroll'},
        h('div',{className:'chart-bars-12'},
          chartMonths.map(m=>h('div',{key:m.month,style:{display:'flex',flexDirection:'column',alignItems:'center',gap:6}},
            h('div',{style:{fontSize:11,color:'var(--tx2)',minHeight:30,textAlign:'center'}},m.total?m.total.toLocaleString('vi-VN')+'đ':'0'),
            h('div',{style:{height:160,width:'100%',display:'flex',alignItems:'flex-end',justifyContent:'center',background:'linear-gradient(180deg,#f8fbf9,transparent)',borderRadius:8}},
              h('div',{style:{width:'78%',height:(chartMax?Math.max(10,Math.round((m.total/chartMax)*150)):4),background:'linear-gradient(180deg,var(--pri2),var(--pri))',borderRadius:'8px 8px 2px 2px',transition:'height .2s ease'}})
            ),
            h('div',{style:{fontSize:12,fontWeight:600,color:'var(--pri3)'}},m.label),
            h('div',{style:{fontSize:11,color:'var(--tx2)',textAlign:'center'}},(m.qty||0).toLocaleString('vi-VN')+(m.unit?' '+m.unit:''))
          ))
        )
      ),
      h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:10}},'Biểu đồ hiển thị đủ 12 tháng của năm đã chọn, kể cả tháng chưa phát sinh mua.')
    ),
    h('div',{className:'mobile-only report-mobile-section'},
      Object.entries(byNcc).length?Object.entries(byNcc).map(([id,v])=>h('div',{key:'mncc_'+id,className:'mobile-data-card'},
        h('div',{className:'mobile-data-head'},
          h('div',{className:'mobile-data-title'},v.name),
          h('div',{className:'mobile-data-sub'},v.orders+' đơn')
        ),
        h('div',{className:'mobile-data-grid'},
          h('div',{className:'mobile-data-item'},h('b',null,'Số lượng'),h('span',null,v.qty.toLocaleString())),
          h('div',{className:'mobile-data-item'},h('b',null,'Tổng tiền'),h('span',null,v.total.toLocaleString('vi-VN')+'đ'))
        )
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có dữ liệu theo nhà cung cấp.')
    ),
    h('div',{className:'mobile-only report-mobile-section'},
      Object.entries(byItem).length?Object.entries(byItem).map(([id,v])=>h('div',{key:'mitem_'+id,className:'mobile-data-card'},
        h('div',{className:'mobile-data-head'},
          h('div',{className:'mobile-data-title'},v.name),
          h('div',{className:'mobile-data-sub'},v.unit||'—')
        ),
        h('div',{className:'mobile-data-grid'},
          h('div',{className:'mobile-data-item'},h('b',null,'Số lượng'),h('span',null,v.qty.toLocaleString())),
          h('div',{className:'mobile-data-item'},h('b',null,'Tổng tiền'),h('span',null,v.total.toLocaleString('vi-VN')+'đ'))
        )
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có dữ liệu mặt hàng.')
    ),
    h('div',{className:'report-grid-2 desktop-only'},
      h('div',{className:'tw'},h('table',null,
        h('thead',null,h('tr',null,...['Nhà cung cấp','Số đơn','Số lượng','Tổng tiền'].map(c=>h('th',{key:c},c)))),
        h('tbody',null,Object.entries(byNcc).length?Object.entries(byNcc).map(([id,v])=>h('tr',{key:id},h('td',null,h('div',{style:{fontWeight:500}},v.name)),h('td',null,v.orders+' đơn'),h('td',null,v.qty.toLocaleString()),h('td',null,h('span',{style:{fontWeight:500,color:'var(--pri)'}},v.total.toLocaleString('vi-VN')+'đ')))):h('tr',null,h('td',{colSpan:4,className:'empty-st'},'Chưa có dữ liệu theo bộ lọc.')))
      )),
      h('div',{className:'tw'},h('table',null,
        h('thead',null,h('tr',null,...['Mặt hàng','ĐVT','Số lượng','Tổng tiền'].map(c=>h('th',{key:c},c)))),
        h('tbody',null,Object.entries(byItem).length?Object.entries(byItem).map(([id,v])=>h('tr',{key:id},h('td',null,h('div',{style:{fontWeight:500}},v.name)),h('td',null,v.unit||'—'),h('td',null,v.qty.toLocaleString()),h('td',null,h('span',{style:{fontWeight:500,color:'var(--pri)'}},v.total.toLocaleString('vi-VN')+'đ')))):h('tr',null,h('td',{colSpan:4,className:'empty-st'},'Chưa có dữ liệu mặt hàng.')))
      ))
    ),
    h('div',{className:'mobile-only report-mobile-section'},
      detailRows.length?detailRows.map((r,i)=>h('div',{key:'mdetail_'+r.id+'_'+i,className:'mobile-data-card'},
        h('div',{className:'mobile-data-head'},
          h('div',null,
            h('div',{className:'mobile-data-title'},r.itemName||'—'),
            h('div',{className:'mobile-data-sub'},r.nccName||'—')
          ),
          h('div',{className:'mobile-data-sub'},fmtPurchaseDate(r.orderDate))
        ),
        h('div',{className:'mobile-data-grid'},
          h('div',{className:'mobile-data-item'},h('b',null,'Số lượng'),h('span',null,r.qty.toLocaleString()+' '+(r.unit||''))),
          h('div',{className:'mobile-data-item'},h('b',null,'Đơn giá'),h('span',null,r.price?r.price.toLocaleString('vi-VN')+'đ':'—')),
          h('div',{className:'mobile-data-item'},h('b',null,'Thành tiền'),h('span',null,r.total.toLocaleString('vi-VN')+'đ')),
          h('div',{className:'mobile-data-item'},h('b',null,'Hóa đơn'),h('span',null,r.invoiceNo||'—'))
        )
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có chi tiết mua hàng.')
    ),
    h('div',{className:'tw desktop-only'},h('table',null,
      h('thead',null,h('tr',null,...['Mã đơn','Ngày đặt','NCC','Mặt hàng','SL','Đơn giá','Thành tiền'].map(c=>h('th',{key:c},c)))),
      h('tbody',null,detailRows.length?detailRows.map((r,i)=>h('tr',{key:r.id+'_'+i},h('td',null,r.id),h('td',null,fmtPurchaseDate(r.orderDate)),h('td',null,r.nccName),h('td',null,r.itemName),h('td',null,r.qty.toLocaleString()+' '+(r.unit||'')),h('td',null,r.price?r.price.toLocaleString('vi-VN')+'đ':'—'),h('td',null,h('span',{style:{fontWeight:500,color:'var(--pri)'}},r.total.toLocaleString('vi-VN')+'đ')))):h('tr',null,h('td',{colSpan:7,className:'empty-st'},'Chưa có chi tiết mua hàng.')))
    ))
  );
}

function MaterialOpeningForm({record,materials,month,onSave,onClose}){
  const build=(rec)=>rec?{...rec,qty:numFmt(rec.qty||0)}:{month:month||isoDate().slice(0,7),materialId:'',qty:0,note:''};
  const [f,sf]=useState(build(record));
  const setF=(k,v)=>sf(p=>({...p,[k]:v}));
  const save=()=>{
    const mat=(materials||[]).find(m=>m.id===f.materialId);
    if(!f.month){window.showToast('Chọn tháng.','warn');return;}
    if(!mat){window.showToast('Chọn nguyên vật liệu.','warn');return;}
    if(numFmt(f.qty)<0){window.showToast('Tồn đầu tháng không được âm.','warn');return;}
    onSave({
      ...f,
      month:f.month,
      materialId:mat.id,
      materialCode:mat.code||mat.id||'',
      materialName:mat.name||'',
      group:mat.group||'',
      unit:mat.unit||'',
      qty:numFmt(f.qty||0),
      note:f.note||''
    });
  };
  return h(Modal,{title:record?'Sửa tồn đầu tháng':'Thêm tồn đầu tháng',onClose},
    h('div',{className:'g2'},
      h(F,{label:'Tháng *'},h('input',{type:'month',value:f.month,onChange:e=>setF('month',e.target.value)})),
      h(F,{label:'Nguyên vật liệu *'},
        h('select',{value:f.materialId,onChange:e=>setF('materialId',e.target.value)},
          h('option',{value:''},'— Chọn nguyên vật liệu —'),
          (materials||[]).slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'vi')).map(m=>h('option',{key:m.id,value:m.id},(m.code||m.id||'')+' - '+(m.name||'')))
        )
      )
    ),
    h('div',{className:'g2'},
      h(F,{label:'Tồn đầu tháng *'},h(NumInput,{value:f.qty,onChange:v=>setF('qty',v)})),
      h(F,{label:'Đơn vị'},h('input',{value:(materials||[]).find(m=>m.id===f.materialId)?.unit||record?.unit||'',readOnly:true,style:{background:'var(--bg2)'}}))
    ),
    h(F,{label:'Ghi chú'},h('textarea',{value:f.note||'',onChange:e=>setF('note',e.target.value),rows:2,placeholder:'Ghi chú nếu cần...'})),
    h(Row,null,
      h('button',{onClick:onClose},'Hủy'),
      h('button',{className:'bp',onClick:save},'Lưu')
    )
  );
}

/* --- Báo cáo NVL tồn và tiêu dùng --- */
function MaterialUsageReportTab({materials,purchases,monthOpenings,setMonthOpenings}){
  const currentMonth=isoDate().slice(0,7);
  const [month,setMonth]=useState(currentMonth);
  const [q,sq]=useState('');
  const [draftClosing,setDraftClosing]=useState({});
  const normalize=s=>String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const monthLabel=ym=>{
    if(!ym) return '';
    const [y,m]=String(ym).split('-');
    return 'Tháng '+Number(m)+'/'+y;
  };
  const shiftMonth=(ym,delta)=>{
    const [y,m]=String(ym||currentMonth).split('-').map(Number);
    const d=new Date(y||new Date().getFullYear(),(m||1)-1,1);
    d.setMonth(d.getMonth()+delta);
    return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  };
  const prevMonth=shiftMonth(month,-1);
  const parseMonthDate=ym=>{
    if(!ym||!/^\d{4}-\d{2}$/.test(String(ym))) return null;
    const [y,m]=String(ym).split('-').map(Number);
    return new Date(y,m-1,1);
  };
  const matchMaterial=line=>{
    const rawId=String(line?.itemId||'').trim().replace(/^M_/,'');
    const nameKey=normalize(line?.name);
    return (materials||[]).find(m=>{
      const id=normalize(m.id);
      const code=normalize(m.code);
      const name=normalize(m.name);
      return (rawId && (rawId===id||rawId===code)) || (nameKey && (nameKey===name || nameKey===code));
    })||null;
  };
  const importClosings=rows=>{
    const targetMonth=month||currentMonth;
    const mapped=(rows||[]).map(r=>{
      const code=String(r['Mã NVL']||r['Mã vật tư']||r['code']||'').trim();
      const name=String(r['Tên nguyên vật liệu']||r['Tên NVL']||r['Tên vật tư']||r['name']||'').trim();
      const found=(materials||[]).find(m=>{
        return (code && normalize(m.code||m.id)===normalize(code)) || (name && normalize(m.name)===normalize(name));
      });
      if(!found) return null;
      return {
        id:'TCK'+uid(),
        month:String(r['Tháng']||r['month']||targetMonth).trim()||targetMonth,
        materialId:found.id,
        materialCode:found.code||found.id||'',
        materialName:found.name||'',
        group:found.group||'',
        unit:found.unit||'',
        qty:numFmt(r['Tồn cuối tháng']||r['Tồn cuối']||r['Số lượng']||r['qty']||0),
        note:r['Ghi chú']||r['note']||'',
        createdAt:fmtDT(),
        updatedAt:fmtDT()
      };
    }).filter(Boolean);
    if(!mapped.length){window.showToast('File chưa có dòng tồn cuối tháng hợp lệ.','warn');return;}
    setMonthOpenings(prev=>{
      const next=[...(prev||[])];
      mapped.forEach(rec=>{
        const idx=next.findIndex(x=>x.month===rec.month&&x.materialId===rec.materialId);
        if(idx>=0) next[idx]={...next[idx],...rec,id:next[idx].id};
        else next.unshift(rec);
      });
      return next;
    });
    window.showToast('Đã nhập '+mapped.length+' dòng tồn cuối tháng','success');
  };
  const previousClosingMap=new Map((monthOpenings||[]).filter(x=>x.month===prevMonth).map(x=>[x.materialId,Number(x.qty)||0]));
  const currentClosingMap=new Map((monthOpenings||[]).filter(x=>x.month===month).map(x=>[x.materialId,Number(x.qty)||0]));
  const purchaseRows=(purchases||[]).filter(p=>p.status!=='cancelled').flatMap(p=>(p.lines||[]).map(l=>{
    const dt=parseAnyDate(p.orderDate||p.createdAt||p.updatedAt);
    if(!dt) return null;
    const ym=dt.getFullYear()+'-'+String(dt.getMonth()+1).padStart(2,'0');
    if(ym!==month) return null;
    const found=matchMaterial(l);
    return {
      materialId:found?.id||'EXT_'+normalize(l.name||l.itemId||uid()),
      materialCode:found?.code||'',
      materialName:found?.name||l.name||'',
      group:found?.group||'',
      unit:found?.unit||l.unit||'',
      qty:Number(l.qty)||0
    };
  })).filter(Boolean);
  const purchaseMap=new Map();
  purchaseRows.forEach(r=>{
    const cur=purchaseMap.get(r.materialId)||{qty:0,unit:r.unit||'',materialName:r.materialName||'',materialCode:r.materialCode||'',group:r.group||''};
    cur.qty+=r.qty;
    purchaseMap.set(r.materialId,cur);
  });
  const materialBase=(materials||[]).map(m=>({id:m.id,code:m.code||m.id||'',name:m.name||'',group:m.group||'',unit:m.unit||''}));
  const extraMaterials=[...new Set([
    ...purchaseRows.map(x=>x.materialId),
    ...(monthOpenings||[]).filter(x=>x.month===prevMonth).map(x=>x.materialId),
    ...(monthOpenings||[]).filter(x=>x.month===month).map(x=>x.materialId)
  ])].filter(id=>!materialBase.some(m=>m.id===id)).map(id=>{
    const found=materialBase.find(m=>m.id===id);
    if(found) return found;
    const pr=purchaseRows.find(x=>x.materialId===id);
    return {id,code:pr?.materialCode||'',name:pr?.materialName||'',group:pr?.group||'',unit:pr?.unit||''};
  });
  const activeMaterials=[...materialBase,...extraMaterials];
  const reportRows=activeMaterials
    .map(m=>{
      const opening=Number(previousClosingMap.get(m.id)||0);
      const incoming=Number(purchaseMap.get(m.id)?.qty||0);
      const ending=currentClosingMap.has(m.id)?Number(currentClosingMap.get(m.id)||0):null;
      const consumed=ending===null?null:(opening+incoming-ending);
      const flags=[];
      if(ending!==null&&consumed!==null&&consumed<0) flags.push('Tiêu dùng âm');
      if(ending!==null&&ending>(opening+incoming)) flags.push('Tồn cuối lớn hơn số có thể có');
      return {
        id:m.id,
        code:m.code||m.id||'',
        name:m.name||'',
        group:m.group||'',
        unit:m.unit||purchaseMap.get(m.id)?.unit||'',
        opening,
        incoming,
        ending,
        consumed,
        flags,
        note:ending===null?'Chưa nhập tồn cuối '+monthLabel(month):flags.join(' • ')
      };
    })
    .filter(r=>!q||[r.code,r.name,r.group].some(v=>normalize(v).includes(normalize(q))))
    .sort((a,b)=>{
      const af=a.flags?.length?1:0;
      const bf=b.flags?.length?1:0;
      if(bf!==af) return bf-af;
      const ai=Number(a.incoming)||0;
      const bi=Number(b.incoming)||0;
      if(bi!==ai) return bi-ai;
      return String(a.name||'').localeCompare(String(b.name||''),'vi');
    });
  useEffect(()=>{
    const next={};
    reportRows.forEach(r=>{ next[r.id]=r.ending===null?'':String(r.ending); });
    setDraftClosing(next);
  },[month,reportRows.map(r=>r.id+':'+(r.ending===null?'':r.ending)).join('|')]);
  const setClosing=(id,v)=>setDraftClosing(prev=>({...prev,[id]:v}));
  const saveClosings=()=>{
    if(!reportRows.length){window.showToast('Tháng này chưa có nguyên vật liệu phát sinh để nhập tồn cuối.','warn');return;}
    const now=fmtDT();
    setMonthOpenings(prev=>{
      const next=[...(prev||[])];
      reportRows.forEach(r=>{
        const raw=draftClosing[r.id];
        if(raw===''||raw===null||typeof raw==='undefined') return;
        const qty=Math.max(0,numFmt(raw||0));
        const idx=next.findIndex(x=>x.month===month&&x.materialId===r.id);
        const payload={
          month,
          materialId:r.id,
          materialCode:r.code||r.id||'',
          materialName:r.name||'',
          group:r.group||'',
          unit:r.unit||'',
          qty,
          note:'',
          updatedAt:now
        };
        if(idx>=0) next[idx]={...next[idx],...payload};
        else next.unshift({...payload,id:'TCK'+uid(),createdAt:now});
      });
      return next;
    });
    window.showToast('Đã lưu tồn cuối tháng','success');
  };
  const summary={
    opening:reportRows.reduce((s,r)=>s+r.opening,0),
    incoming:reportRows.reduce((s,r)=>s+r.incoming,0),
    ending:reportRows.reduce((s,r)=>s+(r.ending===null?0:r.ending),0),
    consumed:reportRows.reduce((s,r)=>s+(r.consumed===null?0:r.consumed),0),
    missing:reportRows.filter(r=>r.ending===null).length
  };
  const chartMaterialOptions=materialBase.filter(m=>m.name).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'vi'));
  const availableYears=[...new Set([
    ...(monthOpenings||[]).map(x=>String(x.month||'').slice(0,4)).filter(Boolean),
    ...(purchases||[]).map(p=>{const d=parseAnyDate(p.orderDate||p.createdAt||p.updatedAt);return d?String(d.getFullYear()):'';}).filter(Boolean)
  ])].sort();
  const [chartMaterial,setChartMaterial]=useState('');
  const [chartYear,setChartYear]=useState(String((parseMonthDate(month)||new Date()).getFullYear()));
  const chartMonths=Array.from({length:12},(_,i)=>{
    const ym=chartYear+'-'+String(i+1).padStart(2,'0');
    const pm=shiftMonth(ym,-1);
    const matFilter=chartMaterial||'';
    const opening=(monthOpenings||[]).filter(x=>x.month===pm&&(!matFilter||x.materialId===matFilter)).reduce((s,x)=>s+(Number(x.qty)||0),0);
    const ending=(monthOpenings||[]).filter(x=>x.month===ym&&(!matFilter||x.materialId===matFilter)).reduce((s,x)=>s+(Number(x.qty)||0),0);
    const endingExists=(monthOpenings||[]).some(x=>x.month===ym&&(!matFilter||x.materialId===matFilter));
    const incoming=(purchases||[]).filter(p=>p.status!=='cancelled').flatMap(p=>(p.lines||[]).map(l=>({p,l}))).reduce((sum,item)=>{
      const d=parseAnyDate(item.p.orderDate||item.p.createdAt||item.p.updatedAt);
      if(!d) return sum;
      const ym2=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
      if(ym2!==ym) return sum;
      const found=matchMaterial(item.l);
      if(matFilter && found?.id!==matFilter) return sum;
      if(matFilter && !found && matFilter) return sum;
      return sum+(Number(item.l.qty)||0);
    },0);
    const consumed=endingExists?(opening+incoming-ending):0;
    const unit=matFilter?(chartMaterialOptions.find(m=>m.id===matFilter)?.unit||''):'';
    return {month:i+1,label:'T'+String(i+1),opening,incoming,ending:endingExists?ending:null,consumed,unit};
  });
  const chartMax=Math.max(...chartMonths.map(m=>m.consumed||0),0);
  const exportRows=reportRows.map(r=>({
    month:monthLabel(month),
    previousMonth:monthLabel(prevMonth),
    code:r.code,
    name:r.name,
    group:r.group,
    unit:r.unit,
    opening:r.opening,
    incoming:r.incoming,
    ending:r.ending===null?'':r.ending,
    consumed:r.consumed===null?'':r.consumed,
    note:r.note||''
  }));
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-chart-histogram',style:{fontSize:20}}),'Báo cáo NVL tồn và tiêu dùng'),
    h('div',{className:'card',style:{marginBottom:'1rem'}},
      h('div',{style:{display:'grid',gridTemplateColumns:'1.2fr 1fr 1fr auto',gap:'0.75rem 1rem',alignItems:'end'}},
        h(F,{label:'Tìm nguyên vật liệu'},h('input',{value:q,onChange:e=>sq(e.target.value),placeholder:'Tên, mã, nhóm NVL...'})),
        h(F,{label:'Tháng báo cáo'},h('input',{type:'month',value:month,onChange:e=>setMonth(e.target.value||currentMonth)})),
        h('div',{style:{fontSize:12,color:'var(--tx2)',paddingBottom:8}},'Tiêu dùng tháng = Tồn cuối '+monthLabel(prevMonth)+' + Nhập tháng - Tồn cuối '+monthLabel(month)),
        h('div',{style:{display:'flex',gap:6,justifyContent:'flex-end',flexWrap:'wrap'}},
          h(ExportBtn,{onClick:()=>xlsxExport(exportRows,[['month','Tháng báo cáo'],['previousMonth','Tháng lấy tồn đầu'],['code','Mã NVL'],['name','Tên nguyên vật liệu'],['group','Nhóm NVL'],['unit','ĐVT'],['opening','Tồn đầu tháng'],['incoming','Nhập trong tháng'],['ending','Tồn cuối tháng'],['consumed','Tiêu dùng tháng'],['note','Ghi chú']],'Bao_cao_NVL_ton_va_tieu_dung')}),
          h(ImportBtn,{onFile:importClosings}),
          h('button',{className:'bp',onClick:saveClosings},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu tồn cuối tháng')
        )
      )
    ),
    h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'1rem',marginBottom:'1rem'}},
      h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng tồn đầu tháng'),h('div',{style:{fontSize:24,fontWeight:600,color:'var(--pri)'}},summary.opening.toLocaleString('vi-VN'))),
      h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng nhập trong tháng'),h('div',{style:{fontSize:24,fontWeight:600,color:'var(--pri)'}},summary.incoming.toLocaleString('vi-VN'))),
      h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng tiêu dùng tháng'),h('div',{style:{fontSize:24,fontWeight:600,color:'var(--pri)'}},summary.consumed.toLocaleString('vi-VN'))),
      h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Dòng chưa nhập tồn cuối'),h('div',{style:{fontSize:24,fontWeight:600,color:summary.missing?'#C77D00':'var(--pri)'}},summary.missing))
    ),
    h('div',{className:'mobile-only report-mobile-section'},
      reportRows.length?reportRows.map(r=>h('div',{key:'mclosing_'+r.id,className:'mobile-data-card',style:r.flags?.length?{borderColor:'#C77D00',background:'#FFF8E7'}:{}} ,
        h('div',{className:'mobile-data-head'},
          h('div',null,
            h('div',{className:'mobile-data-title'},(r.code||r.id)+' - '+(r.name||'—')),
            h('div',{className:'mobile-data-sub'},(r.group||'Không nhóm')+(r.unit?' • '+r.unit:''))
          ),
          !!r.flags?.length&&h('div',{className:'mobile-data-sub',style:{color:'#8A5A00',fontWeight:600}},r.flags.join(' • '))
        ),
        h('div',{className:'mobile-data-grid'},
          h('div',{className:'mobile-data-item'},h('b',null,'Tồn đầu'),h('span',null,r.opening.toLocaleString('vi-VN'))),
          h('div',{className:'mobile-data-item'},h('b',null,'Nhập tháng'),h('span',null,r.incoming.toLocaleString('vi-VN')))
        ),
        h('div',{style:{marginTop:10}},
          h(F,{label:'Tồn cuối tháng'},h('input',{type:'number',min:0,step:'0.01',value:draftClosing[r.id]??'',onChange:e=>setClosing(r.id,e.target.value),placeholder:'Nhập tồn cuối...',style:{borderColor:r.flags?.length?'#C77D00':''}}))
        )
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Tháng này chưa có nguyên vật liệu phát sinh hoặc tồn chuyển sang.')
    ),
    h('div',{className:'report-grid-2 desktop-only',style:{marginBottom:'1rem'}},
      h('div',{className:'tw'},h('table',null,
        h('thead',null,h('tr',null,...['Mã NVL','Tên nguyên vật liệu','Tồn đầu tháng','Nhập trong tháng','Tồn cuối tháng','ĐVT'].map(c=>h('th',{key:c},c)))),
        h('tbody',null,reportRows.length?reportRows.map(r=>h('tr',{key:r.id,style:r.flags?.length?{background:'#FFF8E7'}:{}},
          h('td',null,h('span',{style:{fontWeight:500,color:'var(--pri)'}},r.code||r.id)),
          h('td',null,
            h('div',{style:{fontWeight:500}},r.name||'—'),
            !!r.flags?.length&&h('div',{style:{display:'flex',gap:4,flexWrap:'wrap',marginTop:4}},r.flags.map(flag=>h('span',{key:flag,className:'badge',style:{background:'#FFF3CD',color:'#8A5A00'}},flag)))
          ),
          h('td',null,r.opening.toLocaleString('vi-VN')),
          h('td',null,r.incoming.toLocaleString('vi-VN')),
          h('td',null,h('input',{type:'number',min:0,step:'0.01',value:draftClosing[r.id]??'',onChange:e=>setClosing(r.id,e.target.value),placeholder:'Nhập tồn cuối...',style:{maxWidth:140,borderColor:r.flags?.length?'#C77D00':''}})),
          h('td',null,r.unit||'—')
        )):h('tr',null,h('td',{colSpan:6,className:'empty-st'},'Tháng này chưa có nguyên vật liệu phát sinh hoặc tồn chuyển sang.')))
      )),
      h('div',{className:'card'},
        h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:10}},
          h('div',{style:{fontWeight:600,color:'var(--pri3)'}},'Đồ thị tiêu dùng NVL theo tháng'),
          h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'0 1rem',flex:'1 1 420px'}},
            h(F,{label:'Nguyên vật liệu'},h('select',{value:chartMaterial,onChange:e=>setChartMaterial(e.target.value)},h('option',{value:''},'Tất cả nguyên vật liệu'),chartMaterialOptions.map(x=>h('option',{key:x.id,value:x.id},x.name)))),
            h(F,{label:'Năm'},h('select',{value:chartYear,onChange:e=>setChartYear(e.target.value)},(availableYears.length?availableYears:[String(new Date().getFullYear())]).map(y=>h('option',{key:y,value:y},y))))
          )
        ),
        h('div',{className:'chart-scroll'},
          h('div',{className:'chart-bars-12'},
            chartMonths.map(m=>h('div',{key:m.month,style:{display:'flex',flexDirection:'column',alignItems:'center',gap:6}},
              h('div',{style:{fontSize:11,color:'var(--tx2)',minHeight:30,textAlign:'center'}},(m.consumed||0).toLocaleString('vi-VN')),
              h('div',{style:{height:160,width:'100%',display:'flex',alignItems:'flex-end',justifyContent:'center',background:'linear-gradient(180deg,#f8fbf9,transparent)',borderRadius:8}},
                h('div',{style:{width:'78%',height:(chartMax?Math.max(10,Math.round((m.consumed/chartMax)*150)):4),background:'linear-gradient(180deg,#8fcf6d,#2d6a4f)',borderRadius:'8px 8px 2px 2px',transition:'height .2s ease'}})
              ),
              h('div',{style:{fontSize:12,fontWeight:600,color:'var(--pri3)'}},m.label),
              h('div',{style:{fontSize:11,color:'var(--tx2)',textAlign:'center'}},(m.unit||''))
            ))
          )
        ),
        h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:10}},'Bảng bên trái hiện sẵn các nguyên vật liệu phát sinh trong tháng để nhập tồn cuối trực tiếp.')
      )
    ),
    h('div',{className:'mobile-only report-mobile-section'},
      reportRows.length?reportRows.map(r=>h('div',{key:'mreport_'+r.id,className:'mobile-data-card',style:r.flags?.length?{borderColor:'#C77D00',background:'#FFF8E7'}:{}} ,
        h('div',{className:'mobile-data-head'},
          h('div',null,
            h('div',{className:'mobile-data-title'},r.name||'—'),
            h('div',{className:'mobile-data-sub'},(r.code||r.id)+(r.group?' • '+r.group:''))
          ),
          h('div',{className:'mobile-data-sub'},r.unit||'—')
        ),
        h('div',{className:'mobile-data-grid'},
          h('div',{className:'mobile-data-item'},h('b',null,'Tồn đầu'),h('span',null,r.opening.toLocaleString('vi-VN'))),
          h('div',{className:'mobile-data-item'},h('b',null,'Nhập tháng'),h('span',null,r.incoming.toLocaleString('vi-VN'))),
          h('div',{className:'mobile-data-item'},h('b',null,'Tồn cuối'),h('span',null,r.ending===null?'—':r.ending.toLocaleString('vi-VN'))),
          h('div',{className:'mobile-data-item'},h('b',null,'Tiêu dùng'),h('span',null,r.consumed===null?'Chưa nhập tồn cuối':r.consumed.toLocaleString('vi-VN')))
        ),
        h('div',{style:{marginTop:8,fontSize:12,color:r.flags?.length?'#8A5A00':'var(--tx2)'}},r.note||'—')
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có dữ liệu NVL theo tháng đã chọn.')
    ),
    h('div',{className:'tw desktop-only'},h('table',null,
      h('thead',null,h('tr',null,...['Mã NVL','Tên nguyên vật liệu','Nhóm NVL','ĐVT','Tồn đầu tháng','Nhập trong tháng','Tồn cuối tháng','Tiêu dùng tháng','Ghi chú'].map(c=>h('th',{key:c},c)))),
      h('tbody',null,reportRows.length?reportRows.map(r=>h('tr',{key:r.id,style:r.flags?.length?{background:'#FFF8E7'}:{}},
        h('td',null,h('span',{style:{fontWeight:500,color:'var(--pri)'}},r.code||r.id)),
        h('td',null,
          h('div',{style:{fontWeight:500}},r.name||'—'),
          !!r.flags?.length&&h('div',{style:{display:'flex',gap:4,flexWrap:'wrap',marginTop:4}},r.flags.map(flag=>h('span',{key:flag,className:'badge',style:{background:'#FFF3CD',color:'#8A5A00'}},flag)))
        ),
        h('td',null,r.group||'—'),
        h('td',null,r.unit||'—'),
        h('td',null,r.opening.toLocaleString('vi-VN')),
        h('td',null,r.incoming.toLocaleString('vi-VN')),
        h('td',null,r.ending===null?'—':r.ending.toLocaleString('vi-VN')),
        h('td',null,h('span',{style:{fontWeight:600,color:r.consumed===null?'#C77D00':'var(--pri)'}},r.consumed===null?'Chưa nhập tồn cuối':r.consumed.toLocaleString('vi-VN'))),
        h('td',null,r.note||'—')
      )):h('tr',null,h('td',{colSpan:9,className:'empty-st'},'Chưa có dữ liệu NVL theo tháng đã chọn.')))
    ))
  );
}

function PowderDebtReportTab({customers}){
  const storageKey='scf_powdersales';
  const [rows]=useLS(storageKey,[]);
  const today=fmtDate().split('/').reverse().join('-');
  const [df,sdf]=useState(today);
  const [dt,sdt]=useState(today);
  const [customer,scustomer]=useState('');
  const customerOptions=[...new Set((customers||[]).map(c=>c.name).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const numMoney=v=>Number(String(v??'').replace(/[^\d-]/g,''))||0;
  const parseDate=s=>{if(!s)return null;const v=String(s).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(v)){const[y,m,d]=v.split('-');return new Date(Number(y),Number(m)-1,Number(d));}const[d,m,y]=v.split('/');return new Date(Number(y),Number(m)-1,Number(d));};
  const inRange=d=>{const dt2=parseDate(d);if(!dt2||Number.isNaN(dt2.getTime()))return false;const f2=df?parseDate(df):null;const t=dt?parseDate(dt):null;if(f2&&dt2<f2)return false;if(t&&dt2>t)return false;return true;};
  const list=(rows||[]).filter(r=>inRange(r.date)&&(!customer||r.customer===customer)).slice().sort((a,b)=>parseVNDateKey(a.date)-parseVNDateKey(b.date));
  const total=list.reduce((s,r)=>s+numMoney(r.amount),0);
  const fmtMoney=n=>numMoney(n).toLocaleString('vi-VN');
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-report-money',style:{fontSize:20}}),'Báo cáo công nợ'),
    h('div',{className:'card',style:{marginBottom:'1rem'}} ,
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:'0.75rem 1rem'}} ,
        h(F,{label:'Từ ngày'},h('input',{type:'date',value:df,onChange:e=>sdf(e.target.value)})),
        h(F,{label:'Đến ngày'},h('input',{type:'date',value:dt,onChange:e=>sdt(e.target.value)})),
        h(F,{label:'Khách hàng'},h('select',{value:customer,onChange:e=>scustomer(e.target.value)},h('option',{value:''},'Tất cả khách hàng'),customerOptions.map(c=>h('option',{key:c,value:c},c))))
      ),
      h('div',{style:{display:'flex',justifyContent:'flex-end',marginTop:10}},
        h(ExportBtn,{onClick:()=>xlsxExport(list,[['date','Ngày'],['qtyQua','SL'],['weight','Khối lượng'],['price','Đơn giá'],['amount','Thành tiền'],['status','Tình trạng'],['customer','Khách hàng'],['driverName','Lái xe']],'Bao_cao_cong_no')})
      )
    ),
    h('div',{className:'mobile-only report-mobile-section'},
      list.length?list.map(r=>h('div',{key:'debt_'+r.id,className:'mobile-data-card'},
        h('div',{className:'mobile-data-head'},
          h('div',{className:'mobile-data-title'},r.customer||'—'),
          h('div',{className:'mobile-data-sub'},r.date||'—')
        ),
        h('div',{className:'mobile-data-grid'},
          h('div',{className:'mobile-data-item'},h('b',null,'SL'),h('span',null,Number(r.weight)||0)),
          h('div',{className:'mobile-data-item'},h('b',null,'Đơn vị'),h('span',null,'kg')),
          h('div',{className:'mobile-data-item'},h('b',null,'Đơn giá'),h('span',null,fmtMoney(r.price))),
          h('div',{className:'mobile-data-item'},h('b',null,'Thành tiền'),h('span',null,fmtMoney(r.amount)))
        )
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có dữ liệu công nợ.')
    ),
    h('div',{className:'tw desktop-only',style:{overflowX:'auto'}},
      h('table',null,
        h('thead',null,h('tr',null,...['Ngày','SL','Đơn vị','Đơn giá','Thành tiền'].map(c=>h('th',{key:c},c)))),
        h('tbody',null,list.length?list.map(r=>h('tr',{key:r.id},
          h('td',null,r.date||'—'),
          h('td',null,Number(r.weight)||0),
          h('td',null,'kg'),
          h('td',null,fmtMoney(r.price)),
          h('td',null,h('span',{style:{fontWeight:500,color:'var(--pri)'}},fmtMoney(r.amount)))
        )):h('tr',null,h('td',{colSpan:5,className:'empty-st'},'Chưa có dữ liệu công nợ.'))),
        h('tfoot',null,h('tr',null,
          h('td',{style:{fontWeight:700,background:'#fff200'}},'TỔNG'),
          h('td',{style:{background:'#fff200'}},''),
          h('td',{style:{background:'#fff200'}},''),
          h('td',{style:{background:'#fff200'}},''),
          h('td',{style:{fontWeight:700,background:'#fff200'}},fmtMoney(total))
        ))
      )
    )
  );
}

function SupabaseUsageReportTab({employees,materials,assets,prodCats,products,customers,areas,workcats,tasks,nccs,purchases,quotes,orders,trips,attendance,advances,rewards,leaves,depts,shifts,prodShifts,prodShiftRules,prodOrders,stock,company}) {
  const sizeOf=v=>new Blob([JSON.stringify(v??null)]).size;
  const rows=[
    ['employees','Nhân viên',employees],
    ['company','Thông tin công ty',company],
    ['materials','Nguyên vật liệu',materials],
    ['assets','Danh mục tài sản',assets],
    ['prodCats','Danh mục SP',prodCats],
    ['products','Sản phẩm',products],
    ['customers','Khách hàng',customers],
    ['areas','Khu vực',areas],
    ['workcats','Công việc',workcats],
    ['tasks','Giao việc',tasks],
    ['nccs','Nhà cung cấp',nccs],
    ['purchases','Đơn mua hàng',purchases],
    ['quotes','Báo giá',quotes],
    ['orders','Đơn giao hàng',orders],
    ['trips','Chuyến giao hàng',trips],
    ['attendance','Chấm công',attendance],
    ['advances','Ứng lương',advances],
    ['rewards','Thưởng phạt',rewards],
    ['leaves','Xin nghỉ',leaves],
    ['depts','Bộ phận',depts],
    ['shifts','Ca giao hàng',shifts],
    ['prodShifts','Ca sản xuất',prodShifts],
    ['prodShiftRules','Quy tắc ca SX',prodShiftRules],
    ['prodOrders','Đơn sản xuất',prodOrders],
    ['stock','Tồn kho',stock],
  ].map(([key,label,val])=>({key,label,count:Array.isArray(val)?val.length:(val?1:0),bytes:sizeOf(val)})).sort((a,b)=>b.bytes-a.bytes);
  const totalBytes=rows.reduce((s,r)=>s+r.bytes,0);
  const fmtBytes=n=>{
    const abs=Math.abs(n);
    if(abs>=1024*1024*1024) return (n/1024/1024/1024).toFixed(2)+' GB';
    if(abs>=1024*1024) return (n/1024/1024).toFixed(2)+' MB';
    if(abs>=1024) return (n/1024).toFixed(1)+' KB';
    return n+' B';
  };
  const top5=rows.slice(0,5);
  const maxBytes=Math.max(...rows.map(r=>r.bytes),1);
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-database',style:{fontSize:20}}),'Báo cáo dung lượng Supabase'),
    h('div',{className:'card',style:{marginBottom:'1rem',background:'linear-gradient(135deg,#f7fbf9,#eef6f1)'}},
      h('div',{style:{fontSize:12,color:'var(--tx2)',marginBottom:4}},'Dung lượng ước tính'),
      h('div',{style:{fontSize:28,fontWeight:700,color:'var(--pri)'}},fmtBytes(totalBytes)),
      h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:6}},'Tính từ dữ liệu hiện có trong app và các bảng đang đồng bộ lên Supabase qua `kv_store`. Số liệu là ước tính theo JSON.')
    ),
    h('div',{className:'report-grid-2'},
      h('div',{className:'tw'},h('table',null,
        h('thead',null,h('tr',null,...['Bảng dữ liệu','Số bản ghi','Dung lượng'].map(c=>h('th',{key:c},c)))),
        h('tbody',null,rows.length?rows.map(r=>h('tr',{key:r.key},
          h('td',null,h('div',{style:{fontWeight:500}},r.label)),
          h('td',null,r.count.toLocaleString()),
          h('td',null,fmtBytes(r.bytes))
        )):h('tr',null,h('td',{colSpan:3,className:'empty-st'},'Chưa có dữ liệu.')))
      )),
      h('div',{className:'tw'},h('table',null,
        h('thead',null,h('tr',null,...['Top dữ liệu nặng','Số bản ghi','Dung lượng'].map(c=>h('th',{key:c},c)))),
        h('tbody',null,top5.length?top5.map(r=>h('tr',{key:r.key},
          h('td',null,h('div',{style:{fontWeight:500}},r.label)),
          h('td',null,r.count.toLocaleString()),
          h('td',null,fmtBytes(r.bytes))
        )):h('tr',null,h('td',{colSpan:3,className:'empty-st'},'Chưa có dữ liệu.')))
      )),
      h('div',{className:'tw',style:{padding:'10px 12px'}},
        h('div',{style:{fontSize:12,fontWeight:600,color:'var(--tx2)',marginBottom:10}},'Biểu đồ theo bảng'),
        h('div',{style:{display:'flex',flexDirection:'column',gap:10}},
          rows.length?rows.map(r=>h('div',{key:r.key},
            h('div',{style:{display:'flex',justifyContent:'space-between',gap:10,marginBottom:4,fontSize:12}},
              h('span',{style:{fontWeight:500}},r.label),
              h('span',{style:{color:'var(--tx2)'}},fmtBytes(r.bytes))
            ),
            h('div',{style:{height:10,background:'var(--bg2)',borderRadius:999,overflow:'hidden'}},
              h('div',{style:{height:'100%',width:Math.max(3,(r.bytes/maxBytes)*100)+'%',background:'linear-gradient(90deg,var(--pri),var(--pri2))',borderRadius:999}})
            )
          )):h('div',{className:'empty-st',style:{padding:'1rem 0'}},'Chưa có dữ liệu.')
        )
      )
    )
  );
}

/* --- Báo cáo bán hàng --- */
function SalesReportTab({orders,customers,products,shifts,quotes}) {
  const _td2=fmtDate();const _ti2=_td2.split('/').reverse().join('-');const [df,sdf]=useState(_ti2); const [dt,sdt]=useState(_ti2);
  const [period,setPeriod]=useState('day'); const [monthVal,setMonthVal]=useState(_ti2.slice(0,7)); const [weekVal,setWeekVal]=useState('');
  const [cust,sCust]=useState(''); const [pt,sPt]=useState(''); const [prod,sProd]=useState(''); const [status,ss]=useState('all'); const [area,sa]=useState('all'); const [shift,ssh]=useState('all');
  const parseDate=s=>{if(!s)return null;const v=String(s).trim();if(/^\d{4}-\d{2}-\d{2}$/.test(v)){const[y,m,d]=v.split('-');return new Date(Number(y),Number(m)-1,Number(d));}const[d,m,y]=v.split('/');return new Date(Number(y),Number(m)-1,Number(d));};
  const isoOf=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  const setMonthRange=v=>{setMonthVal(v);if(!v)return;const[y,m]=v.split('-').map(Number);const a=new Date(y,m-1,1);const b=new Date(y,m,0);sdf(isoOf(a));sdt(isoOf(b));};
  const setWeekRange=v=>{setWeekVal(v);if(!v)return;const[y,w]=v.split('-W').map(Number);const jan4=new Date(y,0,4);const monday=new Date(jan4);monday.setDate(jan4.getDate()-((jan4.getDay()+6)%7)+(w-1)*7);const sunday=new Date(monday);sunday.setDate(monday.getDate()+6);sdf(isoOf(monday));sdt(isoOf(sunday));};
  const inRange=d=>{const dt2=parseDate(d);if(!dt2||Number.isNaN(dt2.getTime()))return false;const f2=df?parseDate(df):null;const t=dt?parseDate(dt):null;if(f2&&dt2<f2)return false;if(t&&dt2>t)return false;return true;};
  const getPoint=o=>{let found=null;(customers||[]).forEach(c=>(c.points||[]).forEach(p=>{if(p.id===o.pointId||p.id===o.ptId||p.name===o.pointName)found={...p,customerName:c.name,customerId:c.id};}));return found||{};};
  const orderArea=o=>o.area||getPoint(o).area||((shifts||[]).find(s=>s.id===o.shiftId||s.id===o.prodShiftId)||{}).area||'';
  const orderShift=o=>o.prodShiftId||o.shiftId||((shifts||[]).find(s=>s.timeStart===o.deliveryTime)||{}).id||'';
  const statusLabel={pending:'Chờ xếp',scheduled:'Đã xếp',assigned:'Đã xếp',delivering:'Đang giao',done:'Đã giao',cancelled:'Hủy'};
  const dateKey=s=>{const d=parseDate(s);return d&&Number.isFinite(d.getTime())?d.getTime():0;};
  const quotePrice=(o,l)=>{
    const pInfo=getPoint(o);
    const od=dateKey(o.deliveryDate);
    const usable=(quotes||[]).filter(q=>{
      if(['cancelled','expired'].includes(q.status))return false;
      if(q.customerId&&q.customerId!==(o.customerId||o.custId||pInfo.customerId))return false;
      if(q.customer&&o.customer&&q.customer!==o.customer)return false;
      const pts=q.pointIds||(q.pointId?[q.pointId]:[]);
      const qAreas=q.areaNames||[];
      if(!pts.length&&!qAreas.length)return false;
      const pointOk=pts.length&&pts.includes(o.pointId||o.ptId||pInfo.id);
      const areaOk=qAreas.length&&qAreas.includes(orderArea(o));
      if(!pointOk&&!areaOk)return false;
      if(q.dateFrom&&od<dateKey(q.dateFrom))return false;
      if(q.dateTo&&od>dateKey(q.dateTo))return false;
      return (q.lines||[]).some(ql=>ql.productId===l.productId||(ql.productName&&ql.productName===l.productName));
    }).sort((a,b)=>dateKey(b.dateFrom)-dateKey(a.dateFrom));
    const q=usable[0];
    const ql=q&&(q.lines||[]).find(x=>x.productId===l.productId||(x.productName&&x.productName===l.productName));
    return ql?numFmt(ql.price):0;
  };
  const salePrice=(o,l,p2)=>{
    const fromLine=numFmt(l.salePrice||l.sellPrice||l.unitPrice);
    if(fromLine)return fromLine;
    const fromQuote=quotePrice(o,l);
    if(fromQuote)return fromQuote;
    const fromProduct=numFmt(p2.salePrice||p2.sellPrice||p2.priceSale||p2.price||0);
    if(fromProduct)return fromProduct;
    return l.purchasePrice?0:numFmt(l.price||0);
  };
  const filtered=(orders||[]).filter(o=>{
    if(!inRange(o.deliveryDate))return false;
    if(cust&&o.custId!==cust&&o.customerId!==cust)return false;
    if(pt&&o.ptId!==pt&&o.pointId!==pt)return false;
    if(status!=='all'&&o.status!==status)return false;
    if(area!=='all'&&orderArea(o)!==area)return false;
    if(shift!=='all'&&orderShift(o)!==shift)return false;
    return true;
  });
  const active=filtered.filter(o=>o.status!=='cancelled');
  const filtLines=active.flatMap(o=>(o.lines||[]).filter(l=>!prod||l.productId===prod).map(l=>{
    const p2=products.find(x=>x.id===l.productId)||{};
    const qtyProd=numFmt(l.qtyProd)||numFmt(l.qty)||numFmt(l.quantity)||0;
    const qtyInv=numFmt(l.qtyInvoice)||qtyProd;
    const qtyDelivered=l.qtyDelivered!==undefined&&l.qtyDelivered!==''?numFmt(l.qtyDelivered):'';
    const price=salePrice(o,l,p2);
    const unit=String(l.unit||p2.unit||'');
    const qtyForWeight=qtyInv||qtyProd;
    const unitKey=unit.trim().toLowerCase().replace(/[^a-z]/g,'');
    const weight=(unitKey==='kg'||unitKey==='kgs'||unitKey==='kilogram'||unitKey==='kilograms')?qtyForWeight:(numFmt(p2.weightPerUnit)||numFmt(l.weightPerUnit)||0)*qtyForWeight;
    return {...l,orderId:o.id,date:o.deliveryDate,time:o.deliveryTime||'',customer:o.customer||getPoint(o).customerName||'',point:o.pointName||getPoint(o).name||'',area:orderArea(o),status:o.status,invoiceNo:o.invoiceNo||'',productName:l.productName||p2.name||'',unit,qtyProd,qtyInv,qtyDelivered,price,amount:qtyInv*price,weight};
  }));
  const totalQtyProd=filtLines.reduce((s,l)=>s+l.qtyProd,0);
  const totalQtyInv=filtLines.reduce((s,l)=>s+l.qtyInv,0);
  const totalDelivered=filtLines.reduce((s,l)=>s+(l.qtyDelivered===''?0:l.qtyDelivered),0);
  const totalWeight=filtLines.reduce((s,l)=>s+l.weight,0);
  const totalAmount=filtLines.reduce((s,l)=>s+l.amount,0);
  const missingPrice=filtLines.filter(l=>!l.price).length;
  const byProd={};filtLines.forEach(l=>{const k=l.productId||l.productName;if(!byProd[k])byProd[k]={name:l.productName,unit:l.unit,qtyProd:0,qtyInv:0,qtyDelivered:0,weight:0,amount:0};byProd[k].qtyProd+=l.qtyProd;byProd[k].qtyInv+=l.qtyInv;byProd[k].qtyDelivered+=l.qtyDelivered===''?0:l.qtyDelivered;byProd[k].weight+=l.weight;byProd[k].amount+=l.amount;});
  const sxName=name=>String(name||'').replace(/\s+/g,' ').replace(/\s*,\s*\d+(?:[.,]\d+)?\s*KG\s*\/\s*PAC\b/ig,'').replace(/\s+\d+(?:[.,]\d+)?\s*KG\s*\/\s*PAC\b/ig,'').replace(/\s*,\s*PAC\b/ig,'').trim().toUpperCase();
  const byProdKg={};filtLines.forEach(l=>{const k=sxName(l.productName);if(!k)return;if(!byProdKg[k])byProdKg[k]={name:k,qtyInv:0,qtyDelivered:0,weight:0};byProdKg[k].qtyInv+=l.qtyInv;byProdKg[k].qtyDelivered+=l.qtyDelivered===''?0:l.qtyDelivered;byProdKg[k].weight+=l.weight;});
  const byCust={};active.forEach(o=>{const name=o.customer||getPoint(o).customerName||'Chưa rõ KH';if(!byCust[name])byCust[name]={orders:0,lines:0,qty:0,weight:0,amount:0};byCust[name].orders++;(o.lines||[]).forEach(l=>{if(prod&&l.productId!==prod)return;const p2=products.find(x=>x.id===l.productId)||{};const q=numFmt(l.qtyInvoice)||numFmt(l.qtyProd)||numFmt(l.qty)||0;byCust[name].lines++;byCust[name].qty+=q;byCust[name].weight+=(String(l.unit||p2.unit||'').toLowerCase().includes('kg')?q:(numFmt(p2.weightPerUnit)||0)*q);byCust[name].amount+=q*numFmt(l.price||l.salePrice||p2.price||0);});});
  const byArea={};filtLines.forEach(l=>{const k=l.area||'Chưa có KV';if(!byArea[k])byArea[k]={orders:new Set(),qty:0,weight:0,amount:0};byArea[k].orders.add(l.orderId);byArea[k].qty+=l.qtyInv;byArea[k].weight+=l.weight;byArea[k].amount+=l.amount;});
  const detailRows=filtLines.map(l=>({date:l.date,time:l.time,orderId:l.orderId,customer:l.customer,point:l.point,area:l.area,productName:l.productName,unit:l.unit,qtyProd:l.qtyProd,qtyInvoice:l.qtyInv,qtyDelivered:l.qtyDelivered,weight:l.weight,price:l.price,amount:l.amount,status:statusLabel[l.status]||l.status,invoiceNo:l.invoiceNo}));
  const selCust=customers.find(c=>c.id===cust);
  const areas=[...new Set((customers||[]).flatMap(c=>(c.points||[]).map(p=>p.area).filter(Boolean)).concat((orders||[]).map(o=>orderArea(o)).filter(Boolean)))].sort();
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-chart-line',style:{fontSize:20}}),'Báo cáo bán hàng'),
    h('div',{className:'card',style:{marginBottom:'1.25rem'}},
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:'0 1rem'}},
        h(F,{label:'Kiểu lọc'},h('select',{value:period,onChange:e=>setPeriod(e.target.value)},
          h('option',{value:'day'},'Theo ngày'),
          h('option',{value:'week'},'Theo tuần'),
          h('option',{value:'month'},'Theo tháng'),
          h('option',{value:'custom'},'Tùy chọn')
        )),
        period==='month'&&h(F,{label:'Chọn tháng'},h('input',{type:'month',value:monthVal,onChange:e=>setMonthRange(e.target.value)})),
        period==='week'&&h(F,{label:'Chọn tuần'},h('input',{type:'week',value:weekVal,onChange:e=>setWeekRange(e.target.value)})),
        h(F,{label:'Từ ngày'},h('input',{type:'date',value:df,onChange:e=>sdf(e.target.value)})),
        h(F,{label:'Đến ngày'},h('input',{type:'date',value:dt,onChange:e=>sdt(e.target.value)})),
        h(F,{label:'Khách hàng'},h('select',{value:cust,onChange:e=>{sCust(e.target.value);sPt('');}},h('option',{value:''},'Tất cả KH'),customers.map(c=>h('option',{key:c.id,value:c.id},c.name)))),
        h(F,{label:'Địa điểm giao'},h('select',{value:pt,onChange:e=>sPt(e.target.value),disabled:!selCust},h('option',{value:''},'Tất cả địa điểm'),(selCust?.points||[]).map(p2=>h('option',{key:p2.id,value:p2.id},p2.name)))),
        h(F,{label:'Khu vực'},h('select',{value:area,onChange:e=>sa(e.target.value)},h('option',{value:'all'},'Tất cả khu vực'),areas.map(a=>h('option',{key:a,value:a},a)))),
        h(F,{label:'Ca / giờ'},h('select',{value:shift,onChange:e=>ssh(e.target.value)},h('option',{value:'all'},'Tất cả ca'),(shifts||[]).map(s=>h('option',{key:s.id,value:s.id},(s.timeStart?s.timeStart+' - ':'')+s.name+(s.area?' - '+s.area:''))))),
        h(F,{label:'Sản phẩm'},h('select',{value:prod,onChange:e=>sProd(e.target.value)},h('option',{value:''},'Tất cả SP'),products.map(p2=>h('option',{key:p2.id,value:p2.id},p2.name)))),
        h(F,{label:'Trạng thái'},h('select',{value:status,onChange:e=>ss(e.target.value)},h('option',{value:'all'},'Tất cả trạng thái'),Object.entries(statusLabel).map(([v,l])=>h('option',{key:v,value:v},l))))
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',gap:'1rem',marginTop:4}},
        [['Số đơn hàng',filtered.length+' đơn','ti-file-invoice'],['SL Đặt',totalQtyProd.toLocaleString(),'ti-building-factory'],['SL hóa đơn',totalQtyInv.toLocaleString(),'ti-receipt'],['SL đã giao',totalDelivered.toLocaleString(),'ti-truck-delivery'],['Tổng khối lượng',totalWeight.toFixed(2)+' kg','ti-weight'],['Doanh thu',totalAmount?totalAmount.toLocaleString('vi-VN')+'đ':'—','ti-cash'],['Thiếu giá bán',missingPrice+' dòng','ti-alert-circle']].map(([l,v,ic])=>
          h('div',{key:l,style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'12px 16px'}},
            h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4,display:'flex',alignItems:'center',gap:5}},h('i',{className:'ti '+ic,style:{fontSize:12}}),l),
            h('div',{style:{fontSize:20,fontWeight:600,color:'var(--pri)'}},v)
          )
        )
      ),
      h('div',{style:{display:'flex',justifyContent:'flex-end',marginTop:10}},
        h(ExportBtn,{onClick:()=>xlsxExport(detailRows,[['date','Ngày giao'],['time','Giờ'],['orderId','Mã đơn'],['customer','Khách hàng'],['point','Địa điểm'],['area','Khu vực'],['productName','Sản phẩm'],['unit','ĐVT'],['qtyProd','SL Đặt'],['qtyInvoice','SL HĐ'],['qtyDelivered','SL đã giao'],['weight','Kg'],['price','Đơn giá'],['amount','Thành tiền'],['status','Trạng thái'],['invoiceNo','Hóa đơn']],'Bao_cao_ban_hang')})
      )
    ),
    h('div',{className:'mobile-only report-mobile-section'},
      Object.keys(byProd).length?Object.entries(byProd).map(([id,v])=>h('div',{key:'mprod_'+id,className:'mobile-data-card'},
        h('div',{className:'mobile-data-head'},
          h('div',null,
            h('div',{className:'mobile-data-title'},v.name),
            h('div',{className:'mobile-data-sub'},v.unit||'—')
          ),
          h('div',{className:'mobile-data-sub'},v.amount?v.amount.toLocaleString('vi-VN')+'đ':'—')
        ),
        h('div',{className:'mobile-data-grid'},
          h('div',{className:'mobile-data-item'},h('b',null,'SL Đặt'),h('span',null,v.qtyProd.toLocaleString())),
          h('div',{className:'mobile-data-item'},h('b',null,'SL HĐ'),h('span',null,v.qtyInv.toLocaleString())),
          h('div',{className:'mobile-data-item'},h('b',null,'SL giao'),h('span',null,v.qtyDelivered.toLocaleString())),
          h('div',{className:'mobile-data-item'},h('b',null,'Kg'),h('span',null,v.weight.toFixed(2)))
        )
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có dữ liệu sản phẩm.')
    ),
    h('div',{className:'mobile-only report-mobile-section'},
      Object.keys(byCust).length?Object.entries(byCust).map(([name,v])=>h('div',{key:'mcust_'+name,className:'mobile-data-card'},
        h('div',{className:'mobile-data-head'},
          h('div',{className:'mobile-data-title'},name),
          h('div',{className:'mobile-data-sub'},v.orders+' đơn')
        ),
        h('div',{className:'mobile-data-grid'},
          h('div',{className:'mobile-data-item'},h('b',null,'Mặt hàng'),h('span',null,v.lines)),
          h('div',{className:'mobile-data-item'},h('b',null,'SL HĐ'),h('span',null,v.qty.toLocaleString())),
          h('div',{className:'mobile-data-item'},h('b',null,'Kg'),h('span',null,v.weight.toFixed(2))),
          h('div',{className:'mobile-data-item'},h('b',null,'Doanh thu'),h('span',null,v.amount?v.amount.toLocaleString('vi-VN')+'đ':'—'))
        )
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có dữ liệu khách hàng.')
    ),
    h('div',{className:'report-grid-2 desktop-only'},
      h('div',null,
        h('div',{style:{fontWeight:600,color:'var(--pri3)',margin:'0 0 6px 4px'}},'Thống kê sản phẩm'),
        h('div',{className:'tw'},h('table',null,
          h('thead',null,h('tr',null,...['Sản phẩm','ĐVT','SL Đặt','SL HĐ','SL giao','Kg','Doanh thu'].map(c=>h('th',{key:c},c)))),
          h('tbody',null,Object.keys(byProd).length?Object.entries(byProd).map(([id,v])=>h('tr',{key:id},
            h('td',null,h('div',{style:{fontWeight:500}},v.name)),h('td',null,h('span',{className:'badge sbadge'},v.unit||'—')),
            h('td',null,h('span',{style:{fontWeight:600,color:'var(--pri)'}},v.qtyProd.toLocaleString())),
            h('td',null,h('span',{style:{fontWeight:600}},v.qtyInv.toLocaleString())),
            h('td',null,v.qtyDelivered.toLocaleString()),h('td',null,v.weight.toFixed(2)),
            h('td',null,v.amount?v.amount.toLocaleString('vi-VN')+'đ':'—')
          )):h('tr',null,h('td',{colSpan:7,className:'empty-st'},'Chưa có dữ liệu sản phẩm.')))
        ))
      ),
      h('div',{className:'tw'},h('table',null,
        h('thead',null,h('tr',null,...['Khách hàng','Số đơn','Số mặt hàng','SL HĐ','Kg','Doanh thu'].map(c=>h('th',{key:c},c)))),
        h('tbody',null,Object.keys(byCust).length?Object.entries(byCust).map(([name,v])=>h('tr',{key:name},h('td',null,h('div',{style:{fontWeight:500}},name)),h('td',null,v.orders+' đơn'),h('td',null,v.lines+' mặt hàng'),h('td',null,v.qty.toLocaleString()),h('td',null,v.weight.toFixed(2)),h('td',null,v.amount?v.amount.toLocaleString('vi-VN')+'đ':'—'))):h('tr',null,h('td',{colSpan:6,className:'empty-st'},'Chưa có dữ liệu khách hàng.')))
      ))
    ),
    h('div',{className:'mobile-only report-mobile-section'},
      Object.keys(byProdKg).length?Object.entries(byProdKg).map(([id,v])=>h('div',{key:'mkg_'+id,className:'mobile-data-card'},
        h('div',{className:'mobile-data-head'},
          h('div',{className:'mobile-data-title'},v.name),
          h('div',{className:'mobile-data-sub'},v.weight.toFixed(2)+' kg')
        ),
        h('div',{className:'mobile-data-grid'},
          h('div',{className:'mobile-data-item'},h('b',null,'SL HĐ'),h('span',null,v.qtyInv.toLocaleString())),
          h('div',{className:'mobile-data-item'},h('b',null,'SL giao'),h('span',null,v.qtyDelivered.toLocaleString()))
        )
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có dữ liệu quy đổi kg.')
    ),
    h('div',{className:'desktop-only'},
      h('div',{style:{fontWeight:600,color:'var(--pri3)',margin:'0 0 6px 4px'}},'Thống kê sản phẩm quy đổi kg'),
      h('div',{className:'tw',style:{marginBottom:'1rem'}},h('table',null,
        h('thead',null,h('tr',null,...['Sản phẩm SX','SL hóa đơn','SL đã giao','Kg'].map(c=>h('th',{key:c},c)))),
        h('tbody',null,Object.keys(byProdKg).length?Object.entries(byProdKg).map(([id,v])=>h('tr',{key:'kg_'+id},
          h('td',null,h('div',{style:{fontWeight:500}},v.name)),
          h('td',null,h('span',{style:{fontWeight:600}},v.qtyInv.toLocaleString())),
          h('td',null,v.qtyDelivered.toLocaleString()),
          h('td',null,h('span',{style:{fontWeight:650,color:'var(--pri)'}},v.weight.toFixed(2)+' kg'))
        )):h('tr',null,h('td',{colSpan:4,className:'empty-st'},'Chưa có dữ liệu quy đổi kg.')))
      ))
    ),
    h('div',{className:'mobile-only report-mobile-section'},
      Object.keys(byArea).length?Object.entries(byArea).map(([name,v])=>h('div',{key:'marea_'+name,className:'mobile-data-card'},
        h('div',{className:'mobile-data-head'},
          h('div',{className:'mobile-data-title'},name),
          h('div',{className:'mobile-data-sub'},v.orders.size+' đơn')
        ),
        h('div',{className:'mobile-data-grid'},
          h('div',{className:'mobile-data-item'},h('b',null,'SL HĐ'),h('span',null,v.qty.toLocaleString())),
          h('div',{className:'mobile-data-item'},h('b',null,'Kg'),h('span',null,v.weight.toFixed(2))),
          h('div',{className:'mobile-data-item'},h('b',null,'Doanh thu'),h('span',null,v.amount?v.amount.toLocaleString('vi-VN')+'đ':'—'))
        )
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có dữ liệu khu vực.')
    ),
    h('div',{className:'tw desktop-only',style:{marginBottom:'1rem'}},h('table',null,
      h('thead',null,h('tr',null,...['Khu vực','Số đơn','SL HĐ','Kg','Doanh thu'].map(c=>h('th',{key:c},c)))),
      h('tbody',null,Object.keys(byArea).length?Object.entries(byArea).map(([name,v])=>h('tr',{key:name},h('td',null,h('b',null,name)),h('td',null,v.orders.size+' đơn'),h('td',null,v.qty.toLocaleString()),h('td',null,v.weight.toFixed(2)),h('td',null,v.amount?v.amount.toLocaleString('vi-VN')+'đ':'—'))):h('tr',null,h('td',{colSpan:5,className:'empty-st'},'Chưa có dữ liệu khu vực.')))
    )),
    h('div',{className:'mobile-only report-mobile-section'},
      detailRows.length?detailRows.map((r,i)=>h('div',{key:'msale_'+r.orderId+'_'+i,className:'mobile-data-card'},
        h('div',{className:'mobile-data-head'},
          h('div',null,
            h('div',{className:'mobile-data-title'},r.productName),
            h('div',{className:'mobile-data-sub'},r.customer+' • '+(r.point||'—'))
          ),
          h('div',{className:'mobile-data-sub'},r.date+' '+(r.time||''))
        ),
        h('div',{className:'mobile-data-grid'},
          h('div',{className:'mobile-data-item'},h('b',null,'SL HĐ'),h('span',null,r.qtyInvoice.toLocaleString())),
          h('div',{className:'mobile-data-item'},h('b',null,'SL giao'),h('span',null,r.qtyDelivered===''?'—':r.qtyDelivered.toLocaleString())),
          h('div',{className:'mobile-data-item'},h('b',null,'Kg'),h('span',null,r.weight.toFixed(2))),
          h('div',{className:'mobile-data-item'},h('b',null,'Doanh thu'),h('span',null,r.amount?r.amount.toLocaleString('vi-VN')+'đ':'—'))
        ),
        h('div',{className:'mobile-data-sub'},'KV: '+(r.area||'—')+' • Trạng thái: '+r.status)
      )):h('div',{className:'card',style:{textAlign:'center',color:'var(--tx2)'}},'Chưa có chi tiết bán hàng.')
    ),
    h('div',{className:'tw desktop-only'},h('table',null,
      h('thead',null,h('tr',null,...['Ngày','Giờ','Mã đơn','Khách hàng','Địa điểm','KV','Sản phẩm','SL Đặt','SL HĐ','SL giao','Kg','Đơn giá','Doanh thu','Trạng thái'].map(c=>h('th',{key:c},c)))),
      h('tbody',null,detailRows.length?detailRows.map((r,i)=>h('tr',{key:r.orderId+'_'+i},h('td',null,r.date),h('td',null,r.time||'—'),h('td',null,r.orderId),h('td',null,r.customer),h('td',null,r.point),h('td',null,h('span',{className:'badge sbadge'},r.area||'—')),h('td',null,r.productName),h('td',null,r.qtyProd.toLocaleString()),h('td',null,r.qtyInvoice.toLocaleString()),h('td',null,r.qtyDelivered===''?'—':r.qtyDelivered.toLocaleString()),h('td',null,r.weight.toFixed(2)),h('td',null,r.price?r.price.toLocaleString('vi-VN')+'đ':h('span',{style:{color:'#A32D2D'}},'Thiếu giá')),h('td',null,r.amount?r.amount.toLocaleString('vi-VN')+'đ':'—'),h('td',null,r.status))):h('tr',null,h('td',{colSpan:14,className:'empty-st'},'Chưa có chi tiết bán hàng.')))
    ))
  );
}

/* ─── ĐƠN HÀNG CHI TIẾT ─── */
function OrderDetailListTab({orders, setOrders, products, customers, shifts, currentUser, prodShifts}) {
  const _td3=fmtDate();const _ti3=_td3.split('/').reverse().join('-');
  const [dateF, sdf] = useState(_ti3);
  const [dateT, sdt] = useState(_ti3);
  const [shiftF, ssf] = useState('all');
  const [areaF, saf] = useState('all');
  const [customerF, scf] = useState('all');

  // Flatten all order lines
  const rows = [];
  const cleanShiftName=name=>{
    const n=String(name||'').trim();
    return n.toLowerCase().includes('ngày')?'Ca sáng':n;
  };
  orders.forEach(o => {
    if (o.status === 'cancelled') return;
    const plan = prodShiftPlan(o,prodShifts||[]);
    const linePlans = prodShiftPlansForOrder(o,prodShifts||[]);
    (o.lines || []).forEach(l => {
      if (!l.productId) return;
      const linePlan=linePlans.find(p=>p.line===l||p.line?.id===l.id)||plan;
      const lineShiftName=cleanShiftName(linePlan?.shift?.name||'');
      rows.push({
        orderId: o.id,
        lineId: l.id,
        date: o.deliveryDate || '',
        point: o.pointName || '',
        customer: o.customer || '',
        product: l.productName || '',
        unit: l.unit || '',
        qtyProd: numFmt(l.qtyProd) || 0,
        qtyInvoice: numFmt(l.qtyInvoice) || 0,
        qtyDelivered: l.qtyDelivered,
        shift: l.shift || (lineShiftName.toLowerCase().includes('đêm')||lineShiftName.toLowerCase().includes('dem')?'night':'day'),
        shiftName: lineShiftName,
        time: o.deliveryTime || '',
        prodDate: linePlan?.prodDate || '',
        labelDate: linePlan?.labelDate || '',
        note: l.note || o.note || '',
        status: o.status,
        prodColor: (products.find(p=>p.id===l.productId)||{}).color||'',
        area: (()=>{
          if(o.area) return o.area;
          // Look up from customer delivery point
          let a='';
          (customers||[]).forEach(c=>(c.points||[]).forEach(pt=>{if(pt.id===o.pointId||pt.name===o.pointName)a=pt.area||'';}) );
          if(a) return a;
          // Look up from shifts
          const sh=(shifts||[]).find(s=>s.id===o.shiftId);
          return sh?sh.area||'':'';
        })(),
      });
    });
  });

  // Filters
  const parseD = s => { if(!s) return null; if(s.includes('-')){const[y,m,d]=s.split('-');return new Date(y,m-1,d);} const[d,m,y]=s.split('/'); return new Date(y,m-1,d); };
  const filtered = rows.filter(r => {
    if (shiftF !== 'all' && r.shiftName !== shiftF) return false;
    if (areaF !== 'all' && r.area !== areaF) return false;
    if (customerF !== 'all' && r.customer !== customerF) return false;
    if (dateF) { const d=parseD(r.date),f=parseD(dateF); if(d&&f&&d<f) return false; }
    if (dateT) { const d=parseD(r.date),t=parseD(dateT); if(d&&t&&d>t) return false; }
    return true;
  });

  const customerOptions = [...new Set(rows.map(r=>r.customer).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const shiftOrder=name=>{
    const n=String(name||'').toLowerCase();
    if(n.includes('sáng')||n.includes('sang'))return 1;
    if(n.includes('chiều')||n.includes('chieu'))return 2;
    if(n.includes('đêm')||n.includes('dem'))return 3;
    return 9;
  };
  const shiftOptions=[
    ...new Set([
      ...(prodShifts||[]).filter(s=>s.active!==false).map(s=>cleanShiftName(s.name)).filter(Boolean),
      ...rows.map(r=>r.shiftName).filter(Boolean)
    ])
  ].sort((a,b)=>shiftOrder(a)-shiftOrder(b)||a.localeCompare(b,'vi'));
  const statusColor = {pending:'#FAEEDA',delivering:'#EAF3DE',done:'#E1F5EE'};
  const canEditDelivered=currentUser&&(currentUser.role==='admin'||currentUser.role==='manager'||currentUser.role==='driver'||currentUser.dept==='Kế toán');
  const updateDeliveredQty=(orderId,lineId,value)=>{
    const qty=numFmt(value);
    setOrders&&setOrders(prev=>prev.map(o=>o.id===orderId?{...o,lines:(o.lines||[]).map(l=>l.id===lineId?{...l,qtyDelivered:qty,deliveredAt:fmtDT(),deliveredBy:currentUser?.name||''}:l)}:o));
  };

  // Sort theo khu vực → địa điểm → giờ
  const sorted=[...filtered].sort((a,b)=>{
    const ac=(a.area||'zzz').localeCompare(b.area||'zzz','vi');
    if(ac!==0)return ac;
    const pc=(a.point||'').localeCompare(b.point||'','vi');
    if(pc!==0)return pc;
    return (a.time||'').localeCompare(b.time||'');
  });
  // Build rows với dòng header khu vực + dòng tổng
  const tableRows=[];
  let curArea=null,areaSX=0,areaHD=0,areaDG=0;
  sorted.forEach((r,i)=>{
    if(r.area!==curArea){
      if(curArea!==null) tableRows.push({_sub:true,area:curArea,sx:areaSX,hd:areaHD,dg:areaDG});
      curArea=r.area;areaSX=0;areaHD=0;areaDG=0;
      tableRows.push({_hdr:true,area:r.area||'Chưa phân khu vực'});
    }
    areaSX+=Number(r.qtyProd||0);areaHD+=Number(r.qtyInvoice||0);
    areaDG+=Number(r.qtyDelivered||0);
    tableRows.push(r);
    if(i===sorted.length-1) tableRows.push({_sub:true,area:curArea,sx:areaSX,hd:areaHD,dg:areaDG});
  });

  return h('div', null,
    h('div', {className:'card detail-filter-card', style:{marginBottom:'1rem'}},
      h('div', {className:'detail-filter-grid'},
        h(F, {label:'Từ ngày'}, h('input',{type:'date',value:dateF,onChange:e=>sdf(e.target.value)})),
        h(F, {label:'Đến ngày'}, h('input',{type:'date',value:dateT,onChange:e=>sdt(e.target.value)})),
        h(F, {label:'Khách hàng'}, h('select',{value:customerF,onChange:e=>scf(e.target.value)},
          h('option',{value:'all'},'Tất cả khách hàng'),
          customerOptions.map(c=>h('option',{key:c,value:c},c))
        )),
        h(F, {label:'Ca SX'}, h('select',{value:shiftF,onChange:e=>ssf(e.target.value)},
          h('option',{value:'all'},'Tất cả ca'),
          shiftOptions.map(name=>h('option',{key:name,value:name},name))
        )),
        h(F, {label:'Khu vực'}, h('select',{value:areaF,onChange:e=>saf(e.target.value)},
          h('option',{value:'all'},'Tất cả khu vực'),
          (()=>{
              const areas=new Set();
              (orders||[]).forEach(o=>{
                if(o.area) areas.add(o.area);
                (customers||[]).forEach(c=>(c.points||[]).forEach(pt=>{if((pt.id===o.pointId||pt.name===o.pointName)&&pt.area)areas.add(pt.area);}));
              });
              (shifts||[]).forEach(s=>s.area&&areas.add(s.area));
              return [...areas].sort().map(a=>h('option',{key:a,value:a},a));
            })()
        )),
        h('span',{className:'detail-count-badge'},filtered.length + ' dòng')
      )
    ),
    filtered.length>0&&h('div',{className:'detail-summary-row'},
      h('div',{style:{background:'#EAF3DE',border:'.5px solid #52b788',borderRadius:'var(--r)',padding:'10px 18px'}},
        h('div',{style:{fontSize:11,color:'#3B6D11',fontWeight:500,marginBottom:3}},'∑ TỔNG SL ĐẶT'),
        h('div',{style:{fontSize:22,fontWeight:700,color:'#2D5A0E'}},filtered.reduce((s,r)=>s+Number(r.qtyProd||0),0).toLocaleString())
      ),
      h('div',{style:{background:'#E6F1FB',border:'.5px solid #5B9BD5',borderRadius:'var(--r)',padding:'10px 18px'}},
        h('div',{style:{fontSize:11,color:'#185FA5',fontWeight:500,marginBottom:3}},'∑ TỔNG SL HĐ'),
        h('div',{style:{fontSize:22,fontWeight:700,color:'#185FA5'}},filtered.reduce((s,r)=>s+Number(r.qtyInvoice||0),0).toLocaleString())
      ),
      h('div',{style:{background:'#FFF7E6',border:'.5px solid #E0A800',borderRadius:'var(--r)',padding:'10px 18px'}},
        h('div',{style:{fontSize:11,color:'#8A5A00',fontWeight:500,marginBottom:3}},'∑ TỔNG SL ĐÃ GIAO'),
        h('div',{style:{fontSize:22,fontWeight:700,color:'#8A5A00'}},filtered.reduce((s,r)=>s+Number(r.qtyDelivered||0),0).toLocaleString())
      ),
      (()=>{const diff=filtered.reduce((s,r)=>s+Number(r.qtyProd||0),0)-filtered.reduce((s,r)=>s+Number(r.qtyInvoice||0),0);return h('div',{style:{background:diff===0?'#EAF3DE':'#FCEBEB',border:'.5px solid '+(diff===0?'#52b788':'#E06060'),borderRadius:'var(--r)',padding:'10px 18px'}},
        h('div',{style:{fontSize:11,color:diff===0?'#3B6D11':'#A32D2D',fontWeight:500,marginBottom:3}},diff===0?'✓ KHỚP':'⚠ CHÊNH LỆCH SX-HĐ'),
        h('div',{style:{fontSize:22,fontWeight:700,color:diff===0?'#2D5A0E':'#A32D2D'}},(diff>0?'+':'')+diff.toLocaleString())
      );})()
    ),
    h('div', {className:'tw detail-orders-wrap'},
      h('table', {style:{minWidth:1080}},
        h('thead', null, h('tr', null,
          ...['Ngày giao','Địa điểm','Sản phẩm','SL ĐẶT','SL HĐ','SL đã giao','Giờ','Ngày SX','Ngày in tem','Chú ý'].map(c=>h('th',{key:c},c))
        )),
        h('tbody', null,
          sorted.length ? tableRows.map((r,i)=>{
            if(r._hdr) return h('tr',{key:'h'+i,className:'area-sticky'},h('td',{colSpan:10,style:{background:'#2d6a4f',color:'#fff',fontWeight:700,fontSize:13,padding:'5px 12px'}},'📍 Khu vực: '+(r.area)));
            if(r._sub) return h('tr',{key:'s'+i},
              h('td',{colSpan:3,style:{background:'#e8f5e9',fontWeight:600,fontSize:12,padding:'4px 12px',color:'#2d6a4f',textAlign:'right'}},'Tổng '+r.area+':'),
              h('td',{style:{background:'#e8f5e9',fontWeight:700,color:'var(--pri)',fontSize:14,padding:'4px 8px'}},r.sx.toLocaleString()),
              h('td',{style:{background:'#e8f5e9',fontWeight:700,fontSize:14,padding:'4px 8px'}},r.hd.toLocaleString()),
              h('td',{style:{background:'#e8f5e9',fontWeight:700,color:'#8A5A00',fontSize:14,padding:'4px 8px'}},r.dg.toLocaleString()),
              h('td',{colSpan:4,style:{background:'#e8f5e9'}})
            );
            const canInput=canEditDelivered&&(r.status==='done'||r.status==='completed');
            return h('tr',{key:i,style:{background:r.prodColor||(r.shift==='night'?'rgba(83,52,131,.04)':'')}},
              h('td',null,h('span',{style:{fontWeight:500}},r.date)),
              h('td',null,h('div',{style:{fontWeight:600}},r.point||'—')),
              h('td',null,h('div',{style:{fontWeight:500}},r.product)),
              h('td',null,h('span',{style:{fontWeight:600,color:'var(--pri)',fontSize:15}},r.qtyProd.toLocaleString())),
              h('td',null,h('span',{style:{fontWeight:600,fontSize:15}},r.qtyInvoice.toLocaleString())),
              h('td',null,canInput
                ?h('input',{type:'number',min:0,step:'0.01',value:r.qtyDelivered??'',placeholder:String(r.qtyInvoice||0),onChange:e=>updateDeliveredQty(r.orderId,r.lineId,e.target.value),style:{fontSize:13,padding:'4px 6px',width:86,borderColor:(r.qtyDelivered!==undefined&&numFmt(r.qtyDelivered)!==numFmt(r.qtyInvoice))?'#E0A800':'var(--bd)'}})
                :h('span',{style:{fontWeight:600,color:r.qtyDelivered!==undefined?'#8A5A00':'var(--tx2)',fontSize:15}},r.qtyDelivered!==undefined?numFmt(r.qtyDelivered).toLocaleString():'—')
              ),
              h('td',null,r.time||'—'),
              h('td',null,h('span',{style:{fontSize:12,fontWeight:600,color:'var(--pri3)',whiteSpace:'nowrap'}},r.prodDate||'—')),
              h('td',null,h('span',{style:{fontSize:12,fontWeight:600,color:'#8A5A00',whiteSpace:'nowrap'}},r.labelDate||'—')),
              h('td',null,h('span',{style:{fontSize:12,color:'var(--tx2)'}},r.note||'—'))
            );
          }) : h('tr',null,h('td',{colSpan:10,className:'empty-st'},'Không có dữ liệu.'))
        )
      )
    )
  );
}

/* ─── CA GIAO HÀNG ─── */
const D_SHIFTS = [
  {id:'CA01',name:'Ca sáng',area:'Khu vực 1',timeStart:'06:00',timeEnd:'12:00',note:''},
  {id:'CA02',name:'Ca chiều',area:'Khu vực 1',timeStart:'12:00',timeEnd:'18:00',note:''},
  {id:'CA03',name:'Ca tối',area:'Khu vực 2',timeStart:'18:00',timeEnd:'22:00',note:''},
];
function ShiftsTab({shifts,setShifts}) {
  const [modal,sm]=useState(null); const [edit,se]=useState(null); const [q,sq]=useState('');
  function ShiftForm({s,allShifts,onSave,onClose}) {
    const [f,sf]=useState(s?{...s}:{id:'',name:'',area:'',timeStart:'',timeEnd:'',note:''});
    const dupId = f.id && allShifts.some(x=>x.id===f.id && x.id!==(s&&s.id));
    return h(Modal,{title:s?'Sửa ca giao hàng':'Thêm ca giao hàng',onClose},
      h('div',{className:'g2'},
        h(F,{label:'Mã ca'+(s?' (có thể sửa)':' (để trống = tự tạo)')},
          h('div',null,
            h('input',{value:f.id||'',onChange:e=>sf(p=>({...p,id:e.target.value.toUpperCase()})),placeholder:'CA01, SS-T1...',style:{borderColor:dupId?'#A32D2D':''}}),
            dupId&&h('div',{style:{fontSize:11,color:'#A32D2D',marginTop:3}},h('i',{className:'ti ti-alert-triangle',style:{marginRight:4}}),'Mã này đã tồn tại!')
          )
        ),
        h(F,{label:'Tên ca *'},h('input',{value:f.name,onChange:e=>sf(p=>({...p,name:e.target.value})),placeholder:'Ca sáng, Ca chiều...'}))
      ),
      h(F,{label:'Khu vực'},h('input',{value:f.area||'',onChange:e=>sf(p=>({...p,area:e.target.value})),placeholder:'Khu vực 1, Nội thành...'})),
      h('div',{className:'g2'},
        h(F,{label:'Giờ bắt đầu'},h('input',{value:f.timeStart,onChange:e=>sf(p=>({...p,timeStart:e.target.value})),placeholder:'06:00'})),
        h(F,{label:'Giờ kết thúc'},h('input',{value:f.timeEnd,onChange:e=>sf(p=>({...p,timeEnd:e.target.value})),placeholder:'12:00'}))
      ),
      h(F,{label:'Ghi chú'},h('input',{value:f.note,onChange:e=>sf(p=>({...p,note:e.target.value}))})),
      h(Row,null,
        h('button',{onClick:onClose},'Hủy'),
        h('button',{className:'bp',onClick:()=>{
          if(!f.name){window.showToast('Nhập tên ca!','warn');return;}
          if(dupId){window.showToast('Mã ca đã tồn tại! Vui lòng dùng mã khác.','error');return;}
          const id=(f.id||'').trim().toUpperCase()||'CA'+uid();
          onSave({...f,id});
        },style:{padding:'8px 20px'}},
          h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu ca')
      )
    );
  }
  const save=d=>{if(edit)setShifts(p=>p.map(x=>x.id===edit.id?{...d}:x));else setShifts(p=>[...p,d]);sm(null);se(null);};
  const del=id=>{if(confirm('Xóa ca giao hàng?'))setShifts(p=>p.filter(x=>x.id!==id));};
  const list=shifts.filter(x=>!q||x.name.toLowerCase().includes(q.toLowerCase()));
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-clock',style:{fontSize:20}}),'Ca giao hàng'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm ca giao hàng...'}),
      h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Thêm ca'})
    ),
    h('div',null,
      (()=>{
        if(!list.length) return h('div',{className:'empty-st'},'Chưa có ca giao hàng nào.');
        const areas=[...new Set(list.map(x=>x.area||'Chưa phân khu vực'))];
        return areas.map(area=>h('div',{key:area,style:{marginBottom:'1.25rem'}},
          h('div',{style:{fontWeight:600,fontSize:13,color:'var(--pri3)',padding:'8px 12px',background:'var(--bg2)',borderRadius:'var(--r) var(--r) 0 0',border:'.5px solid var(--bd)',borderBottom:'none',display:'flex',alignItems:'center',gap:6}},
            h('i',{className:'ti ti-map-pin',style:{fontSize:14,color:'var(--pri)'}}),
            area,
            h('span',{className:'badge',style:{background:'var(--pri)',color:'#fff',marginLeft:4}},list.filter(x=>(x.area||'Chưa phân khu vực')===area).length+' ca')
          ),
          h('div',{className:'tw',style:{borderRadius:'0 0 var(--rl) var(--rl)'}},h('table',null,
            h('thead',null,h('tr',null,...['Mã ca','Tên ca','Giờ bắt đầu','Giờ kết thúc','Ghi chú',''].map(c=>h('th',{key:c},c)))),
            h('tbody',null,list.filter(x=>(x.area||'Chưa phân khu vực')===area).map(x=>h('tr',{key:x.id},
              h('td',null,h('span',{style:{color:'var(--pri)',fontWeight:500}},x.id)),
              h('td',null,h('div',{style:{fontWeight:500}},x.name)),
              h('td',null,x.timeStart?h('span',{className:'badge',style:{background:'#FFF9C4',color:'#854F0B'}},x.timeStart):'—'),
              h('td',null,x.timeEnd?h('span',{className:'badge',style:{background:'#EDE9FE',color:'#5B21B6'}},x.timeEnd):'—'),
              h('td',null,x.note||'—'),
              h('td',null,h('div',{style:{display:'flex',gap:2}},
                h('button',{className:'bi',onClick:()=>{se(x);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
                h('button',{className:'bi',onClick:()=>del(x.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
              ))
            )))
          ))
        ));
      })()
    ),
    modal==='f'&&h(ShiftForm,{s:edit,allShifts:shifts,onSave:save,onClose:()=>{sm(null);se(null);}})
  );
}

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
  const parts=s.toString().split(',');
  const rawUnit=parts[parts.length-1].trim();
  const rawUnitUP=rawUnit.toUpperCase();
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
  } else {
    unit=rawUnitUP.includes('KG')?'KG':(rawUnit||'Kg');
    let rest=parts.slice(0,-1);
    const skip=['VD_QV','VD','SEV'];
    while(rest.length&&skip.includes(rest[0].trim())) rest.shift();
    rest=rest.filter(p=>{
      const u=p.trim().toUpperCase().replace(/\s+/g,'');
      return !['SÔNGCÔNG','SONGCONG','SONGCÔNG','SÔNGCONG'].includes(u);
    });
    name=rest.join(',').trim();
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
  <img src="${'data:image/png;base64,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'}"/>
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
  {key:'welcome',icon:'ti-layout-dashboard',label:'Tổng quan'},
  {sec:'Cài đặt'},
  {key:'company',icon:'ti-building',label:'Thông tin công ty'},
  {key:'appearance',icon:'ti-typography',label:'Cài đặt giao diện'},
  {key:'printtemplates',icon:'ti-file-spreadsheet',label:'Mẫu in Excel & mapping'},
  {key:'employees',icon:'ti-id-badge',label:'Nhân viên'},
  {key:'backup',icon:'ti-database-export',label:'Backup dữ liệu'},
  {key:'prodshifts',icon:'ti-clock-play',label:'Cài đặt ca SX + ca GH tự động'},
  {sec:'Quản lý nhân sự'},
  {key:'attendance',icon:'ti-face-id',label:'Chấm công'},
  {key:'advances',icon:'ti-cash-banknote',label:'Ứng lương'},
  {key:'rewards',icon:'ti-scale',label:'Thưởng phạt'},
  {key:'leaves',icon:'ti-calendar-minus',label:'Xin nghỉ'},
  {key:'tasks',icon:'ti-clipboard-check',label:'Giao việc'},
  {sec:'Báo công'},
  {key:'workreport_vp',icon:'ti-building',label:'CÔNG KẾ TOÁN'},
  {key:'workreport_sx',icon:'ti-building-factory',label:'CÔNG SẢN XUẤT'},
  {key:'workreport_lx',icon:'ti-steering-wheel',label:'CÔNG LÁI XE'},
  {key:'workreport_total',icon:'ti-report-analytics',label:'TỔNG CÔNG'},
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
  {key:'quotes',icon:'ti-file-invoice',label:'Báo giá'},
  {key:'delivery',icon:'ti-truck-delivery',label:'Đơn giao hàng'},
  {key:'intem',icon:'ti-printer',label:'Intem'},
  {key:'orderdetail',icon:'ti-list-details',label:'Chi tiết đơn hàng'},
  {key:'trips',icon:'ti-steering-wheel',label:'Chuyến giao hàng'},
  {key:'marketsales',icon:'ti-building-store',label:'Bán hàng chợ'},
  {key:'powdersales',icon:'ti-bowl',label:'Bán bột bún'},
  {sec:'Mua hàng'},
  {key:'nccs',icon:'ti-building-store',label:'Nhà cung cấp'},
  {key:'purchaseorders',icon:'ti-shopping-cart',label:'Đơn mua hàng'},
  {key:'fuelpurchases',icon:'ti-gas-station',label:'Đơn mua xăng dầu'},
  {sec:'Báo cáo'},
  {key:'salesreport',icon:'ti-chart-line',label:'Báo cáo BH'},
  {key:'fuelreport',icon:'ti-gas-station',label:'Báo cáo xăng dầu'},
  {key:'purchasereport',icon:'ti-chart-bar',label:'Báo cáo MH'},
  {key:'maintreport',icon:'ti-tool',label:'Báo cáo sửa chữa'},
  {key:'materialusage',icon:'ti-chart-histogram',label:'Báo cáo NVL tồn và tiêu dùng'},
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
function TopNav({page,setPage,role,perms}){
  const[open,setOpen]=useState(null);
  const groups=[]; let cur=null;
  NAV.forEach(item=>{
    if(item.sec){cur={sec:item.sec,pages:[]};groups.push(cur);return;}
    if(!canAccess(role,item.key,perms))return;
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

/* ─── LOGIN ─── */
function LoginPage({employees,onLogin}){
  const[un,su]=useState('');const[pw,sp]=useState('');const[show,ss]=useState(false);const[err,se]=useState('');
  const submit=()=>{const u=employees.find(e=>e.username===un&&e.password===pw);if(u)onLogin(u);else se('Tên đăng nhập hoặc mật khẩu không đúng!');};
  return h('div',{className:'login-bg'},
    h('div',{className:'login-card'},
      h('div',{style:{display:'flex',flexDirection:'column',alignItems:'center',marginBottom:'1.5rem'}},
        h('img',{src:LOGO_SRC,style:{width:78,height:78,marginBottom:10}}),
        h('h1',{style:{fontSize:22,fontWeight:700,color:'var(--pri3)'}},'Thực Phẩm Sông Công')
      ),
      err&&h('div',{style:{background:'#FCEBEB',color:'#A32D2D',padding:'8px 12px',borderRadius:6,fontSize:13,marginBottom:'1rem',textAlign:'center'}},err),
      h(F,{label:'Tên đăng nhập'},h('input',{value:un,onChange:e=>{su(e.target.value);se('');},onKeyDown:e=>e.key==='Enter'&&submit()})),
      h(F,{label:'Mật khẩu'},
        h('div',{className:'pw-wrap'},
          h('input',{type:show?'text':'password',value:pw,onChange:e=>{sp(e.target.value);se('');},onKeyDown:e=>e.key==='Enter'&&submit()}),
          h('button',{className:'pw-eye',onClick:()=>ss(s=>!s)},h('i',{className:'ti ti-eye'+(show?'-off':''),style:{fontSize:15}}))
        )
      ),
      h('button',{className:'bp',onClick:submit,style:{width:'100%',padding:'10px',fontSize:15,justifyContent:'center',marginTop:4}},h('i',{className:'ti ti-login',style:{fontSize:16}}),'Đăng nhập'),
      h('p',{style:{textAlign:'center',fontSize:11,color:'var(--tx2)',marginTop:'1.5rem'}},'Quên mật khẩu? Liên hệ quản trị viên')
    )
  );
}

function CameraBox({onCapture,preview,setPreview,template,setTemplate,autoOpenSignal}) {
  const videoRef=useRef(null);const streamRef=useRef(null);
  const[started,setStarted]=useState(false);const[msg,setMsg]=useState('');
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
      setMsg('');
    }catch(e){
      const warn='Không mở được camera. Hãy cấp quyền camera cho trình duyệt rồi thử lại.';
      setMsg(warn);
      window.showToast(warn,'error');
    }
  };
  useEffect(()=>{if(autoOpenSignal)void start();},[autoOpenSignal]);
  const snap=()=>{const v=videoRef.current;if(!v||!v.videoWidth||!v.videoHeight){setMsg('Camera chưa sẵn sàng.');return;}const c=document.createElement('canvas');c.width=320;c.height=240;const ctx=c.getContext('2d');ctx.drawImage(v,0,0,c.width,c.height);const img=c.toDataURL('image/jpeg',.72);const small=document.createElement('canvas');small.width=8;small.height=8;const sctx=small.getContext('2d');sctx.drawImage(v,0,0,8,8);const data=[...sctx.getImageData(0,0,8,8).data];const fp=[];for(let i=0;i<data.length;i+=4)fp.push(Math.round((data[i]+data[i+1]+data[i+2])/3));setPreview(img);onCapture&&onCapture({image:img,faceHash:fp});setMsg('Đã chụp khuôn mặt. Nếu cần chụp lại, bấm Mở camera.');stop();};
  const resetTemplate=()=>{setTemplate&&setTemplate(null);setPreview('');setMsg('Đã xóa mẫu mặt cũ. Hãy chụp lại khuôn mặt mới.');window.showToast('Đã xóa mẫu mặt cũ.','success');};
  return h('div',null,
    h('div',{className:'att-camera'},
      started?h('video',{ref:videoRef,autoPlay:true,playsInline:true,muted:true})
      :preview?h('img',{src:preview})
      :h('div',{style:{textAlign:'center',padding:20}},h('i',{className:'ti ti-camera',style:{fontSize:42,display:'block',marginBottom:8}}),'Camera chấm công')
    ),
    msg&&h('div',{style:{fontSize:12,color:'#A32D2D',marginTop:8}},msg),
    h('div',{style:{display:'flex',gap:6,flexWrap:'wrap',marginTop:10}},
      h('button',{className:'bp',onClick:started?snap:start},h('i',{className:'ti '+(started?'ti-camera-check':'ti-camera'),style:{fontSize:15}}),started?'Chụp khuôn mặt':'Mở camera'),
      started&&h('button',{onClick:stop},h('i',{className:'ti ti-player-stop',style:{fontSize:14}}),'Tắt'),
      template&&h('button',{onClick:resetTemplate},h('i',{className:'ti ti-refresh',style:{fontSize:14}}),'Đăng ký lại')
    )
  );
}

function AttendanceTab({attendance,setAttendance,employees,setEmployees,currentUser,company}) {
  const settingsKey='scf_att_settings';
  const[settings,setSettings]=useLS(settingsKey,{lat:W_LAT,lon:W_LON,radius:300,start:'08:00',end:'17:00'});
  const[zaloWebhook,setZaloWebhook]=useLS('scf_zalo_webhook','');
  const[cap,setCap]=useState(null);const[preview,setPreview]=useState('');
  const[pos,setPos]=useState(null);const[gpsMsg,setGpsMsg]=useState('');
  const[gpsBusy,setGpsBusy]=useState(false);
  const[punchBusy,setPunchBusy]=useState(false);
  const[punchPending,setPunchPending]=useState(false);
  const[cameraAutoOpenSignal,setCameraAutoOpenSignal]=useState(0);
  const[isCompactMobile,setIsCompactMobile]=useState(()=>window.innerWidth<=768);
  const[quickPunchMode,setQuickPunchMode]=useState(()=>window.innerWidth<=768);
  const[mobileInfoOpen,setMobileInfoOpen]=useState(false);
  const canManage=currentUser.role==='admin'||currentUser.role==='manager';
  const selfEmpId=employees.some(e=>e.id===currentUser.id)?currentUser.id:'';
  const[empId,setEmpId]=useState(selfEmpId);
  const[q,setQ]=useState('');const[day,setDay]=useState(isoDate());
  const selectedEmpId=canManage?(empId||selfEmpId):selfEmpId;
  useEffect(()=>{
    if(canManage){
      if(!empId&&selfEmpId)setEmpId(selfEmpId);
      return;
    }
    if(empId!==selfEmpId){
      setEmpId(selfEmpId);
      setPreview('');
      setCap(null);
      setMobileInfoOpen(false);
    }
  },[canManage,empId,selfEmpId]);
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
  const todayRecords=scopedAttendance.filter(a=>a.date===day);
  const myToday=scopedAttendance.filter(a=>a.date===isoDate()&&a.empId===selectedEmpId).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  const last=myToday[myToday.length-1];
  const nextType=!last||last.type==='out'?'in':'out';
  const needEmp=()=>canManage&&!empId;
  const gs=gpsStatus(pos,settings);
  const tpl=emp.faceTemplate;
  const score=faceScore(cap&&cap.faceHash,tpl&&tpl.hash);
  const faceOk=!!tpl&&!!cap&&score>=65;
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
  const timeStatus=(type,t)=>{
    if(type==='in'&&settings.start&&timeToMin(t)>timeToMin(settings.start))return 'Đi muộn';
    if(type==='out'&&settings.end&&timeToMin(t)<timeToMin(settings.end))return 'Về sớm';
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
    window.showToast('Nhân viên chỉ được chấm công cho chính mình.','warn');
    return false;
  };
  const buildFaceTemplate=()=>cap?{hash:[...(cap.faceHash||[])],image:cap.image||'',updatedAt:fmtDT(),updatedBy:currentUser.name}:null;
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
      window.showToast('GPS chưa hợp lệ ('+(distance??'—')+'m), bạn chưa vào ca được.','error',5000);
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
        const ok=await window.scfConfirm('Nhân viên vừa có bản ghi '+(nextType==='in'?'vào ca':'ra ca')+' gần đây. Vẫn lưu tiếp?','Bản ghi gần trùng');
        if(!ok)return;
      }
      let workingTemplate=tpl;
      if(!workingTemplate){
        workingTemplate=buildFaceTemplate();
        persistFaceTemplate(workingTemplate);
        window.showToast('Đã tự lưu mặt mẫu lần đầu cho '+emp.name+'.','success');
      }
      const workingScore=faceScore(cap&&cap.faceHash,workingTemplate&&workingTemplate.hash);
      const workingFaceOk=!!workingTemplate&&!!cap&&workingScore>=65;
      let workingPos=pos;
      if(!workingPos){
        workingPos=await requestGps('attendance',{silentSuccess:true});
        if(!workingPos){
          window.showToast('Chưa lấy được GPS nên chưa thể chấm công.','warn');
          return;
        }
      }
      const now=timeNow();
      const g=gpsStatus(workingPos,settings);
      if(!workingFaceOk||!g.ok){
        showPunchInvalidMessage(workingFaceOk,g.ok,g.distance);
        return;
      }
      const tStatus=timeStatus(nextType,now);
      const rec={
        id:'CC'+uid(),
        empId:emp.id,
        empName:emp.name,
        dept:emp.dept||'',
        date:isoDate(),
        time:now,
        type:nextType,
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
      setPreview('');
      setCap(null);
      window.showToast('Đã lưu giờ '+(nextType==='in'?'vào ca':'ra ca')+' lúc '+shortTime(now)+(tStatus==='Đúng giờ'?'':' - '+tStatus),'success');
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
  const filtered=scopedAttendance.filter(r=>(!day||r.date===day)&&(!q||[r.empId,r.empName,r.dept,r.status,r.type==='in'?'vào ca':'ra ca',r.timeStatus||timeStatus(r.type,r.time),r.note,r.createdBy].some(x=>String(x||'').toLowerCase().includes(q.toLowerCase()))));
  const stat={in:todayRecords.filter(r=>r.type==='in').length,out:todayRecords.filter(r=>r.type==='out').length,valid:todayRecords.filter(r=>r.status==='valid').length,review:todayRecords.filter(r=>r.status!=='valid').length,late:todayRecords.filter(r=>(r.timeStatus||timeStatus(r.type,r.time))==='Đi muộn').length,early:todayRecords.filter(r=>(r.timeStatus||timeStatus(r.type,r.time))==='Về sớm').length};
  const exportRows=filtered.map(r=>({date:r.date,time:r.time,empId:r.empId,empName:r.empName,dept:r.dept,type:r.type==='in'?'Vào ca':'Ra ca',timeStatus:r.timeStatus||timeStatus(r.type,r.time),faceScore:r.faceScore,gps:r.gpsOk?'Hợp lệ':'Ngoài vùng',distance:r.distance,status:r.status,note:r.note||''}));
  const zaloText=()=>{
    const lines=['SCF - Bao cao cham cong '+vnDateFromISO(day||isoDate()),'Vao ca: '+stat.in+' | Ra ca: '+stat.out+' | Hop le: '+stat.valid+' | Can duyet: '+stat.review+' | Di muon: '+stat.late+' | Ve som: '+stat.early];
    filtered.slice(0,25).forEach(r=>lines.push((r.type==='in'?'VAO':'RA')+' '+shortTime(r.time)+' - '+r.empName+' ('+r.empId+') - mat '+r.faceScore+'% - GPS '+(r.distance??'--')+'m - '+(r.status==='valid'?'hop le':'can duyet')));
    if(filtered.length>25)lines.push('... va '+(filtered.length-25)+' ban ghi khac.');
    return lines.join('\n');
  };
  const copyZalo=async()=>{const txt=zaloText();try{await navigator.clipboard.writeText(txt);window.showToast('Đã sao chép. Mở Zalo và dán vào nhóm.','success');}catch(e){prompt('Sao chép nội dung này để gửi Zalo:',txt);}};
  const shareZalo=async()=>{const txt=zaloText();if(navigator.share){try{await navigator.share({title:'Báo cáo chấm công SCF',text:txt});}catch(e){}}else copyZalo();};
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
        h(CameraBox,{preview,setPreview,template:tpl,setTemplate:clearFaceTemplate,onCapture:setCap,autoOpenSignal:cameraAutoOpenSignal}),
        h('div',{className:'sc',style:{marginTop:10}},
          h('div',{className:'att-panel-head'},
            h('div',null,h('div',{style:{fontWeight:600}},emp.name),h('div',{style:{fontSize:12,color:'var(--tx2)'}},emp.id+' • '+(emp.dept||''))),
            h('span',{className:'badge',style:{background:tpl?'#EAF3DE':'#FAEEDA',color:tpl?'#3B6D11':'#854F0B'}},tpl?'Đã có mẫu mặt':'Chưa có mẫu')
          ),
        h('div',{className:'att-helper-text'},'Điểm khớp: ',h('b',{style:{color:faceOk?'#2d6a4f':'#A32D2D'}},cap&&tpl?score+'%':'—'),' • Lần tiếp theo: ',h('b',null,nextType==='in'?'Vào ca':'Ra ca'))
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
        h('div',{className:'card'},
          h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:10}},
            h('div',{style:{display:'flex',gap:6,flexWrap:'wrap'}},
              h(SearchBar,{value:q,onChange:setQ,placeholder:'Tìm bản ghi...'}),
              h('input',{type:'date',value:day,onChange:e=>setDay(e.target.value),style:{width:155}})
            ),
            h(ExportBtn,{onClick:()=>xlsxExport(exportRows,[['date','Ngày'],['time','Giờ'],['empId','Mã NV'],['empName','Nhân viên'],['dept','Bộ phận'],['type','Loại'],['timeStatus','Giờ công'],['faceScore','Điểm mặt'],['gps','GPS'],['distance','Khoảng cách'],['status','Trạng thái'],['note','Ghi chú']],'Cham_cong_'+(day||isoDate()))})
          ),
          h('div',{className:'tw'},
            h('table',null,
              h('thead',null,h('tr',null,...['Ngày','Giờ','Nhân viên','Loại','Giờ công','Mặt','GPS','Trạng thái','Ghi chú',''].map(c=>h('th',{key:c},c)))),
              h('tbody',null,filtered.length?filtered.map(r=>h('tr',{key:r.id},
                h('td',null,r.date),h('td',null,shortTime(r.time)),
                h('td',null,h('div',{style:{fontWeight:500}},r.empName),h('div',{style:{fontSize:11,color:'var(--tx2)'}},r.empId+' • '+r.dept)),
                h('td',null,r.type==='in'?'Vào ca':'Ra ca'),
                h('td',null,h('span',{className:'badge',style:{background:(r.timeStatus||timeStatus(r.type,r.time))==='Đúng giờ'?'#EAF3DE':'#FAEEDA',color:(r.timeStatus||timeStatus(r.type,r.time))==='Đúng giờ'?'#3B6D11':'#854F0B'}},r.timeStatus||timeStatus(r.type,r.time))),
                h('td',null,h('span',{style:{color:r.faceOk?'#2d6a4f':'#A32D2D',fontWeight:600}},r.faceScore+'%')),
                h('td',null,h('span',{style:{color:r.gpsOk?'#2d6a4f':'#A32D2D'}},(r.distance??'—')+'m')),
                h('td',null,h('span',{className:'badge',style:{background:r.status==='valid'?'#EAF3DE':'#FAEEDA',color:r.status==='valid'?'#3B6D11':'#854F0B'}},r.status==='valid'?'Hợp lệ':'Cần duyệt')),
                h('td',null,h('div',{style:{fontSize:12,color:r.note?'var(--tx)':'var(--tx2)',maxWidth:240,lineHeight:1.45}},r.note||'—')),
                h('td',null,canManage&&h('div',{style:{display:'flex',gap:4}},
                  r.status!=='valid'&&h('button',{style:{fontSize:11,padding:'4px 8px'},onClick:()=>approveAttendanceRecord(r.id)},'Duyệt'),
                  h('button',{className:'bdel',onClick:()=>window.scfConfirm('Bạn có chắc muốn xóa bản ghi chấm công này?','Xóa bản ghi',true).then(ok=>{if(ok){setAttendance(p=>p.filter(x=>x.id!==r.id));window.showToast('Đã xóa bản ghi','success');}})},'Xóa')
                ))
              )):h('tr',null,h('td',{colSpan:10,className:'empty-st'},'Chưa có bản ghi chấm công')))
            )
          )
        )
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

/* ─── Status badges ─── */
function StatusBadge({s}){
  const map={pending:['#FAEEDA','#854F0B','Chờ xếp'],assigned:['#E6F1FB','#185FA5','Đã xếp'],delivering:['#EAF3DE','#3B6D11','Đang giao'],done:['#E1F5EE','#0F6E56','Đã giao'],failed:['#FCEBEB','#A32D2D','Giao lỗi'],cancelled:['#FCEBEB','#A32D2D','Hủy'],planning:['#E6F1FB','#185FA5','Lên kế hoạch'],active:['#EAF3DE','#3B6D11','Đang giao'],completed:['#E1F5EE','#0F6E56','Hoàn thành'],draft:['#F1EFE8','#5F5E5A','Nháp'],sent:['#E6F1FB','#185FA5','Đã gửi'],approved:['#EAF3DE','#3B6D11','Đã duyệt'],expired:['#F1EFE8','#6b6b67','Hết hạn']};
  const[bg,tx,label]=map[s]||['#F1EFE8','#5F5E5A',s];
  return h('span',{className:'badge',style:{background:bg,color:tx}},label);
}

/* ─── QUOTATIONS ─── */

// Input số có định dạng dấu phẩy hàng nghìn (8,700 / 50,000)
function NumInput({value, onChange, style, placeholder}) {
  const fmt = v => (v || v===0) ? Number(v).toLocaleString('en-US') : '';
  const [disp, setDisp] = useState(fmt(value));
  useEffect(function(){ setDisp(fmt(value)); }, [value]);
  return h('input', {
    type:'text', inputMode:'numeric',
    value: disp,
    placeholder: placeholder||'0',
    style: style||{},
    onChange: function(e) {
      var raw = e.target.value.replace(/[^0-9]/g,'');
      setDisp(raw ? Number(raw).toLocaleString('en-US') : '');
      onChange(raw ? Number(raw) : 0);
    }
  });
}

function QuoteLineRow({line,products,onChange,onRemove}){
  const prod=products.find(p=>p.id===line.productId)||{};
  return h('div',{style:{display:'grid',gridTemplateColumns:'2fr 1fr 1fr auto',gap:6,marginBottom:6,alignItems:'center'}},
    h('select',{value:line.productId,onChange:e=>{const p=products.find(x=>x.id===e.target.value)||{};onChange({...line,productId:e.target.value,productName:p.name||'',unit:p.unit||''});},style:{fontSize:13}},
      h('option',{value:''},'— Chọn sản phẩm —'),
      products.map(p=>h('option',{key:p.id,value:p.id},p.name))
    ),
    h('input',{value:line.unit,readOnly:true,style:{fontSize:13,background:'var(--bg2)',cursor:'default'}}),
    h(NumInput,{value:line.price,onChange:v=>onChange({...line,price:v}),placeholder:'Đơn giá',style:{fontSize:13}}),
    h('button',{className:'bi',onClick:onRemove,style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:14}}))
  );
}
function PointMultiSelect({custPoints,pointIds,areaNames,togglePoint,toggleArea,toggleAll}){
  const[open,setOpen]=useState(false);
  const areaList=[...new Set(custPoints.map(p=>p.area).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const selectedByArea=custPoints.filter(p=>p.area&&areaNames.includes(p.area)).map(p=>p.id);
  const effectivePointIds=[...new Set([...(pointIds||[]),...selectedByArea])];
  const allChecked=custPoints.length>0&&effectivePointIds.length===custPoints.length;
  const someChecked=effectivePointIds.length>0&&effectivePointIds.length<custPoints.length;
  const label=effectivePointIds.length===0?'— Chọn khu vực / địa điểm áp dụng —':
    allChecked?'Tất cả '+custPoints.length+' địa điểm':
    (areaNames.length?areaNames.length+' khu vực, ':'')+effectivePointIds.length+' địa điểm áp dụng';
  if(custPoints.length===0) return h(F,{label:'Địa điểm áp dụng *'},
    h('div',{style:{padding:'8px 10px',fontSize:12,color:'#A32D2D',background:'#FFF0F0',borderRadius:'var(--r)',border:'1px solid #f0a0a0'}},
      '⚠ Khách hàng này chưa có địa điểm giao hàng.'
    )
  );
  return h(F,{label:'Khu vực / địa điểm áp dụng *'+(effectivePointIds.length?' ('+effectivePointIds.length+')':'')},
    h('div',{style:{position:'relative'}},
      // Dropdown trigger
      h('div',{
        onClick:()=>setOpen(o=>!o),
        style:{display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'8px 10px',border:'1px solid '+(open?'var(--pri)':'var(--bd)'),
          borderRadius:open?'var(--r) var(--r) 0 0':'var(--r)',
          background:'#fff',cursor:'pointer',fontSize:13,userSelect:'none',
          boxShadow:open?'0 0 0 2px rgba(45,106,79,.15)':'none',transition:'all .15s'}
      },
        h('span',{style:{color:effectivePointIds.length?'var(--tx)':'var(--tx2)',flex:1}},label),
        h('i',{className:'ti ti-chevron-'+(open?'up':'down'),style:{fontSize:14,color:'var(--tx2)'}})
      ),
      // Dropdown panel
      open&&h('div',{style:{position:'absolute',zIndex:200,left:0,right:0,
        border:'1px solid var(--pri)',borderTop:'none',borderRadius:'0 0 var(--r) var(--r)',
        background:'#fff',boxShadow:'0 4px 12px rgba(0,0,0,.1)',overflow:'hidden'}},
        // Chọn tất cả
        h('div',{
          style:{display:'flex',alignItems:'center',gap:10,padding:'7px 12px',
            background:'var(--bg2)',borderBottom:'1px solid var(--bd)',cursor:'pointer'},
          onClick:toggleAll
        },
          h('input',{type:'checkbox',checked:allChecked,
            ref:el=>{if(el)el.indeterminate=someChecked;},
            onChange:toggleAll,
            style:{cursor:'pointer',accentColor:'var(--pri)',width:15,height:15}
          }),
          h('span',{style:{fontSize:12,fontWeight:600,color:'var(--pri)'}},
            allChecked?'Bỏ chọn tất cả':'Chọn tất cả ('+custPoints.length+')')
        ),
        // List địa điểm nhóm theo khu vực
        h('div',{style:{maxHeight:240,overflowY:'auto'}},
          (()=>{
            const rows=[];
            let lastArea=null;
            custPoints.forEach(pt=>{
              if((pt.area||'')!==lastArea){
                lastArea=pt.area||'';
                if(lastArea){
                  const areaName=lastArea;
                  const areaPts=custPoints.filter(x=>x.area===areaName);
                  const areaChecked=areaNames.includes(areaName);
                  rows.push(h('div',{key:'a'+areaName,onClick:()=>toggleArea(areaName),
                    style:{display:'grid',gridTemplateColumns:'auto 1fr auto',alignItems:'center',gap:10,
                      padding:'7px 12px',fontSize:12,fontWeight:700,
                      color:'var(--pri3)',background:areaChecked?'#EAF3DE':'#f5fbf5',
                      borderBottom:'1px solid var(--bd)',letterSpacing:.3,cursor:'pointer'}
                  },
                    h('input',{type:'checkbox',checked:areaChecked,onClick:e=>e.stopPropagation(),onChange:e=>{e.stopPropagation();toggleArea(areaName);},
                      style:{cursor:'pointer',accentColor:'var(--pri)',width:15,height:15}
                    }),
                    h('span',null,(areaChecked?'✓ ':'')+'Khu vực '+areaName),
                    h('span',{style:{fontSize:11,color:'var(--tx2)',fontWeight:500}},areaPts.length+' điểm')
                  ));
                }
              }
              const checked=effectivePointIds.includes(pt.id);
              const disabled=pt.area&&areaNames.includes(pt.area);
              rows.push(h('div',{key:pt.id,onClick:disabled?undefined:()=>togglePoint(pt.id),
                style:{display:'grid',gridTemplateColumns:'auto 1fr auto',
                  alignItems:'center',gap:10,
                  padding:'7px 12px 7px '+(lastArea?'22px':'12px'),
                  background:checked?'#f0faf0':'#fff',
                  borderBottom:'1px solid var(--bd)',
                  transition:'background .12s',cursor:disabled?'default':'pointer'}
              },
                h('input',{type:'checkbox',checked,disabled,onClick:e=>e.stopPropagation(),onChange:e=>{e.stopPropagation();togglePoint(pt.id);},
                  style:{cursor:disabled?'not-allowed':'pointer',accentColor:'var(--pri)',width:15,height:15,flexShrink:0}
                }),
                h('span',{style:{fontSize:13,color:'var(--tx)'}},(checked?'✓ ':'')+pt.name),
                pt.area&&h('span',{style:{fontSize:11,color:'var(--tx2)',background:'var(--bg2)',
                  padding:'1px 7px',borderRadius:10,whiteSpace:'nowrap'}},pt.area)
              ));
            });
            return rows;
          })()
        ),
        // Footer đóng
        h('div',{style:{padding:'6px 12px',background:'var(--bg2)',borderTop:'1px solid var(--bd)',
          display:'flex',justifyContent:'space-between',alignItems:'center'}},
          h('span',{style:{fontSize:12,color:'var(--tx2)'}},
            effectivePointIds.length?effectivePointIds.length+'/'+custPoints.length+' điểm áp dụng':'Chưa chọn khu vực / địa điểm nào'
          ),
          h('button',{onClick:()=>setOpen(false),
            style:{fontSize:12,padding:'3px 12px',background:'var(--pri)',color:'#fff',
              border:'none',borderRadius:'var(--r)',cursor:'pointer'}
          },'Xong')
        )
      )
    )
  );
}

function QuoteForm({quote,quotes,customers,products,currentUser,onSave,onClose}){
  const today=new Date().toISOString().slice(0,10);
  const toInput=s=>{if(!s)return'';const[d,m,y]=s.split('/');return y+'-'+m+'-'+d;};
  const fromInput=s=>{if(!s)return'';const[y,m,d]=s.split('-');return d+'/'+m+'/'+y;};
  // pointIds: mảng id các địa điểm được chọn, areaNames: khu vực áp dụng tự động cho điểm mới
  const initPointIds=quote?(quote.pointIds||(quote.pointId?[quote.pointId]:[])):[];
  const[f,sf]=useState(quote?{...quote,dateFromI:toInput(quote.dateFrom),dateToI:toInput(quote.dateTo),pointIds:initPointIds,areaNames:quote.areaNames||[]}:{customerId:'',customer:'',dateFromI:today,dateToI:'',status:'draft',note:'',lines:[],pointIds:[],areaNames:[]});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const setCust=cid=>{const c=customers.find(x=>x.id===cid);sf(p=>({...p,customerId:cid,customer:c?c.name:'',pointIds:[]}));};
  const selCust=customers.find(x=>x.id===f.customerId);
  const custPoints=(selCust?.points||[]).sort((a,b)=>(a.area||'').localeCompare(b.area||'','vi')||(a.name||'').localeCompare(b.name||'','vi'));
  const sampleQuotes=(quotes||[]).filter(q=>!quote||q.id!==quote.id);
  const applySample=id=>{
    const q=(quotes||[]).find(x=>x.id===id);
    if(!q)return;
    sf(p=>{
      const hasCustomer=!!p.customerId;
      return {...p,
        customerId:hasCustomer?p.customerId:(q.customerId||''),
        customer:hasCustomer?p.customer:(q.customer||''),
        pointIds:hasCustomer?p.pointIds:[...(q.pointIds||(q.pointId?[q.pointId]:[]))],
        areaNames:hasCustomer?(p.areaNames||[]):[...(q.areaNames||[])],
        note:q.note||p.note||'',
        lines:(q.lines||[]).map(l=>({...l,id:uid()}))
      };
    });
  };
  const togglePoint=id=>sf(p=>({...p,pointIds:p.pointIds.includes(id)?p.pointIds.filter(x=>x!==id):[...p.pointIds,id]}));
  const toggleArea=area=>sf(p=>({...p,areaNames:(p.areaNames||[]).includes(area)?(p.areaNames||[]).filter(x=>x!==area):[...(p.areaNames||[]),area]}));
  const effectivePointIds=()=>[...new Set([...f.pointIds,...custPoints.filter(p=>p.area&&(f.areaNames||[]).includes(p.area)).map(p=>p.id)])];
  const toggleAll=()=>sf(p=>({...p,pointIds:effectivePointIds().length===custPoints.length?[]:custPoints.map(x=>x.id),areaNames:effectivePointIds().length===custPoints.length?[]:(p.areaNames||[])}));
  const addLine=()=>sf(p=>({...p,lines:[...p.lines,{id:uid(),productId:'',productName:'',unit:'',price:0}]}));
  const updLine=(id,data)=>sf(p=>({...p,lines:p.lines.map(l=>l.id===id?data:l)}));
  const delLine=id=>sf(p=>({...p,lines:p.lines.filter(l=>l.id!==id)}));
  const submit=()=>{
    if(!f.customerId){window.showToast('Vui lòng chọn khách hàng!','warn');return;}
    if(effectivePointIds().length===0){window.showToast('Chọn ít nhất 1 khu vực hoặc địa điểm áp dụng!','warn');return;}
    if(f.lines.length===0){window.showToast('Vui lòng thêm ít nhất 1 sản phẩm!','warn');return;}
    // Tương thích ngược: lưu cả pointId (điểm đầu tiên) lẫn pointIds
    const effIds=effectivePointIds();
    const firstPt=custPoints.find(p=>effIds.includes(p.id));
    onSave({...f,
      pointId:firstPt?.id||'',pointName:firstPt?.name||'',
      pointIds:f.pointIds,
      areaNames:f.areaNames||[],
      pointNames:custPoints.filter(p=>effIds.includes(p.id)).map(p=>p.name),
      dateFrom:fromInput(f.dateFromI),dateTo:fromInput(f.dateToI),
      createdBy:quote?quote.createdBy:currentUser.name,
      createdAt:quote?quote.createdAt:fmtDate(),
      updatedBy:currentUser.name,updatedAt:fmtDT()
    });
  };
  return h(Modal,{title:quote?'Sửa báo giá '+quote.id:'Tạo báo giá mới',onClose,lg:true},
    sampleQuotes.length>0&&h(F,{label:'Chọn báo giá mẫu'},h('select',{value:'',onChange:e=>applySample(e.target.value)},
      h('option',{value:''},'— Chọn báo giá cũ để lấy mẫu —'),
      sampleQuotes.map(q=>h('option',{key:q.id,value:q.id},q.id+' - '+(q.customer||'')+' - '+(q.dateFrom||'')+(q.dateTo?' đến '+q.dateTo:'')))
    )),
    h('div',{className:'g2'},
      h(F,{label:'Khách hàng *'},h('select',{value:f.customerId,onChange:e=>setCust(e.target.value)},
        h('option',{value:''},'— Chọn khách hàng —'),customers.map(c=>h('option',{key:c.id,value:c.id},c.name))
      )),
      h(F,{label:'Trạng thái'},h('select',{value:f.status,onChange:e=>s('status',e.target.value)},
        [['draft','Nháp'],['sent','Đã gửi'],['approved','Đã duyệt'],['expired','Hết hạn'],['cancelled','Hủy']].map(([v,l])=>h('option',{key:v,value:v},l))
      )),
    ),
    f.customerId&&h(PointMultiSelect,{custPoints,pointIds:f.pointIds,areaNames:f.areaNames||[],togglePoint,toggleArea,toggleAll}),
    h('div',{className:'g2'},
      h(F,{label:'Ngày bắt đầu'},h('input',{type:'date',value:f.dateFromI,onChange:e=>s('dateFromI',e.target.value)})),
      h(F,{label:'Ngày kết thúc'},h('input',{type:'date',value:f.dateToI,onChange:e=>s('dateToI',e.target.value)})),
    ),
    h('div',{className:'divider'}),
    h('div',{style:{fontWeight:500,fontSize:13,marginBottom:8,color:'var(--pri3)'}},'Bảng giá sản phẩm'),
    h('div',{style:{display:'grid',gridTemplateColumns:'2fr 1fr 1fr auto',gap:6,marginBottom:4}},
      h('span',{style:{fontSize:11,color:'var(--tx2)',fontWeight:500}},'Sản phẩm'),
      h('span',{style:{fontSize:11,color:'var(--tx2)',fontWeight:500}},'Đơn vị'),
      h('span',{style:{fontSize:11,color:'var(--tx2)',fontWeight:500}},'Đơn giá (đ)'),
      h('span',null,'')
    ),
    f.lines.map(l=>h(QuoteLineRow,{key:l.id,line:l,products,onChange:data=>updLine(l.id,data),onRemove:()=>delLine(l.id)})),
    h('button',{onClick:addLine,style:{fontSize:12,padding:'5px 12px',marginBottom:8}},h('i',{className:'ti ti-plus',style:{fontSize:13,marginRight:4}}),'Thêm sản phẩm'),
    h(F,{label:'Ghi chú'},h('textarea',{value:f.note,onChange:e=>s('note',e.target.value),rows:2})),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu báo giá'))
  );
}
function QuotesTab({quotes,setQuotes,customers,products,currentUser}){
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[q,sq]=useState('');const[filter,sf]=useState('all');
  let qSeq=quotes.length+1;
  const save=d=>{if(edit)setQuotes(p=>p.map(x=>x.id===edit.id?d:x));else{const id='BG'+String(qSeq++).toString().padStart(3,'0');setQuotes(p=>[...p,{...d,id}]);}sm(null);se(null);};
  const del=id=>{if(confirm('Xóa báo giá?'))setQuotes(p=>p.filter(x=>x.id!==id));};
  const sts=[['all','Tất cả'],['draft','Nháp'],['sent','Đã gửi'],['approved','Đã duyệt'],['expired','Hết hạn']];
  const list=quotes.filter(x=>(filter==='all'||x.status===filter)&&(!q||x.customer.toLowerCase().includes(q.toLowerCase())||x.id.toLowerCase().includes(q.toLowerCase())));
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-file-invoice',style:{fontSize:20}}),'Báo giá'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h('div',{style:{display:'flex',gap:5,flexWrap:'wrap'}},sts.map(([v,l])=>h('button',{key:v,className:'pill'+(filter===v?' on':''),onClick:()=>sf(v)},l+' ('+( v==='all'?quotes.length:quotes.filter(x=>x.status===v).length)+')'))),
      h('div',{style:{display:'flex',gap:6}},
        h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm báo giá...'}),
        h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Tạo báo giá'})
      )
    ),
    h(TableWrap,{cols:['Mã BG','Khách hàng','Bắt đầu','Kết thúc','Số SP','Ghi chú','Người tạo','Trạng thái',''],empty:'Chưa có báo giá nào.',
      rows:list.map(x=>h('tr',{key:x.id},
        h('td',null,h('span',{style:{color:'var(--pri)',fontWeight:500}},x.id)),
        h('td',null,h('div',{style:{fontWeight:500}},x.customer)),
        h('td',null,x.dateFrom||'—'),h('td',null,x.dateTo||'—'),
        h('td',null,x.lines?x.lines.length:0),
        h('td',null,x.note||'—'),
        h('td',null,h('div',null,x.createdBy),h('div',{style:{fontSize:11,color:'var(--tx2)'}},x.createdAt)),
        h('td',null,h(StatusBadge,{s:x.status})),
        h('td',null,h('div',{style:{display:'flex',gap:2}},
          h('button',{className:'bi',onClick:()=>{se(x);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
          h('button',{className:'bi',onClick:()=>del(x.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
        ))
      ))
    }),
    modal==='f'&&h(QuoteForm,{quote:edit,quotes,customers,products,currentUser,onSave:save,onClose:()=>{sm(null);se(null);}})
  );
}

/* ─── DELIVERY ORDERS ─── */
function OrderDetailLine({line,products,prodCats,prodShifts,deliveryDate,deliveryTime,pointName,area,onChange,onRemove}){
  const prod=products.find(p=>p.id===line.productId)||{};
  const[productSearch,setProductSearch]=useState(line.productName||prod.name||'');
  const showPurchasePrice=isGoodsProduct(prod,prodCats||[]);
  const productOptions=(products||[]).map(p=>({...p,searchLabel:[p.code||p.id,p.name].filter(Boolean).join(' - ')}));
  const normProduct=s=>String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/\s+/g,' ');
  const pickProduct=p=>{
    setProductSearch(p?.name||'');
    onChange({...line,productId:p?.id||'',productName:p?.name||'',unit:p?.unit||'',weightPerUnit:p?.weightPerUnit||0});
  };
  const setProductText=v=>{
    setProductSearch(v);
    const nv=normProduct(v);
    const exact=productOptions.find(p=>normProduct(p.name)===nv||normProduct(p.code||p.id)===nv||normProduct(p.searchLabel)===nv);
    if(exact) pickProduct(exact);
    else onChange({...line,productId:'',productName:v,unit:'',weightPerUnit:0});
  };
  // Tự động tính ca SX từ giờ giao
  const autoShift=getProdShiftForOrder({deliveryTime,area,pointName,address:pointName,customer:''},prodShifts||[],window.__SCF_CUSTOMERS||[]);
  const dispShift=autoShift?{
    name:autoShift.name||'',
    prodTime:autoShift.actualProdTime||autoShift.endTime||'',
    prodDate:addDaysVN(deliveryDate,autoShift.prodDateOffset||0),
    labelTime:autoShift.labelPrintTime||'',
    labelDate:addDaysVN(deliveryDate,autoShift.labelPrintDateOffset||0),
  }:null;
  // override: nếu line.shiftOverride=true thì dùng giá trị tay
  const isOverride=!!line.shiftOverride;
  const manualShift=isOverride?getProdShiftByProdTime(line.prodTime,prodShifts||[]):null;
  const setManualProdTime=v=>{
    const sh=getProdShiftByProdTime(v,prodShifts||[]);
    onChange({
      ...line,
      prodTime:v,
      prodDate:sh?addDaysVN(deliveryDate,sh.prodDateOffset||0):(line.prodDate||''),
      labelTime:sh?.labelPrintTime||line.labelTime||'',
      labelDate:sh?addDaysVN(deliveryDate,sh.labelPrintDateOffset||0):(line.labelDate||'')
    });
  };
  const toggleOverride=()=>onChange({...line,shiftOverride:!isOverride,
    prodTime:!isOverride?line.prodTime:(dispShift?.prodTime||''),
    prodDate:!isOverride?line.prodDate:(dispShift?.prodDate||''),
    labelTime:!isOverride?line.labelTime:(dispShift?.labelTime||''),
    labelDate:!isOverride?line.labelDate:(dispShift?.labelDate||''),
  });
  return h('div',{style:{display:'grid',gridTemplateColumns:showPurchasePrice?'2fr 80px 80px 90px 60px minmax(360px,1.3fr) 30px':'2fr 80px 80px 60px minmax(360px,1.3fr) 30px',gap:6,alignItems:'end',marginBottom:6,padding:'8px 10px',background:'var(--bg2)',borderRadius:'var(--r)'}},
    // Sản phẩm — thu nhỏ
    h('div',null,
      h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:3}},'Sản phẩm'),
      h('input',{value:productSearch,onChange:e=>setProductText(e.target.value),list:'product-list-'+line.id,placeholder:'Gõ tên/mã SP...',autoComplete:'off',style:{fontSize:12,width:'100%'}}),
      h('datalist',{id:'product-list-'+line.id},
        productOptions.map(p=>h('option',{key:p.id,value:p.searchLabel},p.name))
      ),
      h('div',{style:{fontSize:10,color:'var(--tx2)',margin:'5px 0 3px'}},'Ghi chú dòng'),
      h('input',{value:line.note||'',onChange:e=>onChange({...line,note:e.target.value}),placeholder:'Ghi chú riêng cho sản phẩm này...',style:{fontSize:12,width:'100%'}})
    ),
    // SL Dat
    h('div',null,
      h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:3}},'SL Đặt'),
      h('input',{type:'number',min:0,value:line.qtyProd,onChange:e=>onChange({...line,qtyProd:numFmt(e.target.value)}),style:{fontSize:13}})
    ),
    // SL HĐ
    h('div',null,
      h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:3}},'SL HĐ'),
      h('input',{type:'number',min:0,value:line.qtyInvoice,onChange:e=>onChange({...line,qtyInvoice:numFmt(e.target.value)}),style:{fontSize:13}})
    ),
    // Giá mua
    showPurchasePrice&&h('div',null,
      h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:3}},'Giá mua'),
      h(NumInput,{value:line.purchasePrice||line.price||0,onChange:v=>onChange({...line,purchasePrice:v,price:v}),placeholder:'0',style:{fontSize:13}})
    ),
    // ĐVT
    h('div',null,
      h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:3}},'ĐVT'),
      h('input',{value:prod.unit||line.unit||'',readOnly:true,style:{fontSize:13,background:'var(--card)',cursor:'default',textAlign:'center'}})
    ),
    // Ca SX — hiển thị tự động hoặc cho nhập tay
    h('div',{style:{padding:'6px 8px',background:isOverride?'#FFF8E1':'var(--card)',borderRadius:'var(--r)',border:'1px solid '+(isOverride?'#f8c30f':'var(--bd)')}},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}},
        h('div',{style:{fontSize:11,color:'var(--tx2)',fontWeight:500}},isOverride?'Ca SX (tay)':'Ca SX (tự động)'),
        h('button',{type:'button',onClick:toggleOverride,title:isOverride?'Dùng tự động':'Nhập tay',
          style:{fontSize:10,padding:'1px 6px',borderRadius:10,background:isOverride?'#f8c30f':'var(--bg2)',color:isOverride?'#5a3e00':'var(--tx2)',border:'none',cursor:'pointer',fontWeight:500}
        },isOverride?'↺ Tự động':'✎ Tay')
      ),
      !isOverride&&dispShift?h('div',null,
        h('div',{style:{fontSize:12,fontWeight:600,color:'var(--pri3)',marginBottom:2}},dispShift.name||'—'),
        h('div',{style:{fontSize:11,color:'var(--tx2)'}},
          h('span',{style:{marginRight:6}},'⚙ SX: '+dispShift.prodTime+(dispShift.prodDate?' ('+dispShift.prodDate+')':''))
        ),
        h('div',{style:{fontSize:11,color:'var(--tx2)'}},
          h('span',null,'🏷 Tem: '+dispShift.labelTime+(dispShift.labelDate?' ('+dispShift.labelDate+')':''))
        )
      ):!isOverride?h('div',{style:{fontSize:11,color:'#A32D2D'}},'⚠ Không tìm thấy ca'):null,
      isOverride&&manualShift&&h('div',{style:{fontSize:11,fontWeight:600,color:manualShift.textColor||'var(--pri3)',marginBottom:3}},
        manualShift.name||'—'
      ),
      isOverride&&h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1.1fr 1fr 1.1fr',gap:4,marginTop:2}},
        h('div',null,
          h('div',{style:{fontSize:10,color:'var(--tx2)'}},'⚙ Giờ SX thực tế'),
          h('input',{value:line.prodTime||'',onChange:e=>setManualProdTime(e.target.value),placeholder:'07:00',style:{fontSize:12,padding:'3px 6px'}})
        ),
        h('div',null,
          h('div',{style:{fontSize:10,color:'var(--tx2)'}},'Ngày SX'),
          h('input',{value:line.prodDate||dispShift?.prodDate||'',onChange:e=>onChange({...line,prodDate:e.target.value}),placeholder:'DD/MM/YYYY',style:{fontSize:12,padding:'3px 6px'}})
        ),
        h('div',null,
          h('div',{style:{fontSize:10,color:'var(--tx2)'}},'🏷 Giờ in tem'),
          h('input',{value:line.labelTime||'',onChange:e=>onChange({...line,labelTime:e.target.value}),placeholder:'06:00',style:{fontSize:12,padding:'3px 6px'}})
        ),
        h('div',null,
          h('div',{style:{fontSize:10,color:'var(--tx2)'}},'Ngày in tem'),
          h('input',{value:line.labelDate||dispShift?.labelDate||'',onChange:e=>onChange({...line,labelDate:e.target.value}),placeholder:'DD/MM/YYYY',style:{fontSize:12,padding:'3px 6px'}})
        )
      )
    ),
    // Nút xóa
    h('button',{className:'bi',onClick:onRemove,style:{color:'#A32D2D',alignSelf:'flex-end',marginBottom:2}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
  );
}

function PrintModal({order,company,onClose}){
  return h('div',{className:'overlay',onClick:e=>{if(e.target===e.currentTarget)onClose()}},
    h('div',{style:{background:'#fff',borderRadius:'var(--rl)',width:700,maxWidth:'95vw',maxHeight:'92vh',overflow:'auto',padding:'2rem'}},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1.5rem'}},
        h('div',{style:{display:'flex',alignItems:'center',gap:12}},
          h('img',{src:LOGO_SRC,style:{width:50,height:50}}),
          h('div',null,
            h('div',{style:{fontSize:16,fontWeight:700,color:'var(--pri3)'}},company&&company.name||'Công ty SCF'),
            company&&company.address&&h('div',{style:{fontSize:12,color:'var(--tx2)'}},company.address),
            company&&company.phone&&h('div',{style:{fontSize:12,color:'var(--tx2)'}},'ĐT: '+company.phone)
          )
        ),
        h('div',{style:{textAlign:'right'}},
          h('div',{style:{fontSize:20,fontWeight:700,color:'var(--pri3)'}},'HÓA ĐƠN GIAO HÀNG'),
          h('div',{style:{fontSize:13,color:'var(--tx2)'}},order.id),
          order.invoiceNo&&h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Số HĐ: '+order.invoiceNo)
        )
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,background:'var(--bg2)',padding:'12px 16px',borderRadius:'var(--r)',marginBottom:'1.5rem',fontSize:13}},
        h('div',null,h('b',null,'Khách hàng: '),order.customer),
        h('div',null,h('b',null,'Ngày giao: '),order.deliveryDate+(order.deliveryTime?' lúc '+order.deliveryTime:'')),
        h('div',{style:{gridColumn:'1/-1'}},h('b',null,'Địa chỉ: '),order.address||order.pointName||'—')
      ),
      h('table',{style:{width:'100%',borderCollapse:'collapse',marginBottom:'1rem',fontSize:13}},
        h('thead',null,h('tr',{style:{background:'var(--pri3)',color:'#fff'}},
          ...[['STT','40px'],['Tên sản phẩm',''],['Đơn vị','80px'],['SL Đặt','100px'],['SL hóa đơn','100px'],['Ca SX','80px']].map(([c,w])=>h('th',{key:c,style:{padding:'8px 10px',textAlign:'left',width:w||'auto'}},c))
        )),
        h('tbody',null,(order.lines||[]).map((l,i)=>h('tr',{key:l.id,style:{borderBottom:'.5px solid var(--bd)',background:i%2?'var(--bg2)':'#fff'}},
          h('td',{style:{padding:'7px 10px'}},(i+1)),
          h('td',{style:{padding:'7px 10px',fontWeight:500}},l.productName||'—'),
          h('td',{style:{padding:'7px 10px'}},l.unit||'—'),
          h('td',{style:{padding:'7px 10px',textAlign:'center'}},l.qtyProd||0),
          h('td',{style:{padding:'7px 10px',textAlign:'center'}},l.qtyInvoice||0),
          h('td',{style:{padding:'7px 10px'}},l.shift==='night'?'Ca đêm':'Ca sáng')
        )))
      ),
      order.note&&h('div',{style:{fontSize:13,marginBottom:'1rem'}},h('b',null,'Ghi chú: '),order.note),
      h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:20,marginTop:'2rem',fontSize:12,textAlign:'center'}},
        h('div',null,h('div',{style:{borderTop:'.5px solid #333',paddingTop:8,fontWeight:500}},'Người giao hàng'),h('div',{style:{color:'var(--tx2)'}},'(Ký và ghi rõ họ tên)')),
        h('div',null,h('div',{style:{borderTop:'.5px solid #333',paddingTop:8,fontWeight:500}},'Người nhận hàng'),h('div',{style:{color:'var(--tx2)'}},'(Ký và ghi rõ họ tên)')),
        h('div',null,h('div',{style:{borderTop:'.5px solid #333',paddingTop:8,fontWeight:500}},'Xác nhận công ty'),h('div',{style:{color:'var(--tx2)'}},'(Ký tên và đóng dấu)'))
      ),
      h('div',{style:{display:'flex',gap:8,justifyContent:'flex-end',marginTop:'1.5rem'}},
        h('button',{onClick:function(){var co=company||{};var LOGO='data:image/png;base64,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';var pD=function(d){if(!d)return null;var p=d.split('/');return new Date(p[2],p[1]-1,p[0]);};var fD=function(d){return d?String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear():'';};var gd=pD(order.deliveryDate);var ngDat=gd?fD(new Date(gd.getTime()-86400000)):'';var tot=(order.lines||[]).reduce(function(s,l){return s+(l.qtyInvoice||0);},0);var emCells='<td style="border:1px solid #555;height:40px"></td>'.repeat(10);var rows=(order.lines||[]).map(function(l,i){return '<tr><td style="border:1px solid #555;text-align:center;padding:4px;font-size:13px">'+(i+1)+'</td><td style="border:1px solid #555;padding:4px 8px;font-size:14px;text-align:left">'+(l.productName||'')+'</td><td style="border:1px solid #555;text-align:center;font-weight:bold;font-size:15px">'+(l.qtyInvoice||0)+'</td><td style="border:1px solid #555"></td><td style="border:1px solid #555;text-align:center;font-size:13px">'+(l.unit||'')+'</td>'+emCells+'</tr>';}).join('');var html='<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Phieu giao hang</title><style>body{font-family:Arial,sans-serif;font-size:13px;margin:12px 20px}.hdr{display:flex;align-items:flex-start;margin-bottom:4px}table{width:100%;border-collapse:collapse}.it td{padding:3px 4px;font-size:14px;vertical-align:top}.lbl{font-size:13px;white-space:nowrap;width:200px}.val{font-weight:bold;font-size:15px}.mt th,.mt td{border:1px solid #555;text-align:center;font-size:12px;padding:3px 4px}.mt th{font-weight:bold;background:#f0f0f0}@media print{@page{margin:8mm;size:A4}body{margin:0}}<\/style><\/head><body><div class="hdr"><div style="width:85px;min-width:85px"><img src="'+LOGO+'" style="height:65px;width:auto"/></div><div style="flex:1;padding-left:10px"><div style="font-size:15px;font-weight:bold">'+(co.name||'CÔNG TY TNHH THỰC PHẨM SÔNG CÔNG')+'</div><div style="font-size:12px;color:#333;margin-top:3px">'+(co.address||'Tổ 1, P.Mỏ Chè, Tp Sông Công, Thái Nguyên')+'</div></div></div><div style="text-align:center;font-size:26px;font-weight:bold;letter-spacing:2px;margin:8px 0 10px;border-bottom:2px solid #000;padding-bottom:6px">PHIẾU GIAO HÀNG</div><table class="it" style="margin-bottom:8px"><tr><td class="lbl">Tên khách hàng&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</td><td class="val">'+order.customer+'</td><td style="width:20px"></td><td></td></tr><tr><td class="lbl">Địa điểm giao hàng :</td><td class="val">'+(order.pointName||order.address||'')+'</td></tr><tr><td class="lbl">Ngày giao hàng&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</td><td class="val">'+order.deliveryDate+'</td><td class="lbl" style="padding-left:20px">Ngày đặt hàng :</td><td class="val">'+ngDat+'</td></tr><tr><td class="lbl">Giờ giao&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;:</td><td class="val">'+(order.deliveryTime||'')+'</td></tr></table><table class="mt"><thead><tr><th rowspan="2" style="width:30px">STT</th><th rowspan="2" style="min-width:180px;text-align:left;padding-left:6px">Tên hàng</th><th rowspan="2" style="width:65px">Số lượng</th><th rowspan="2" style="width:65px">Thực nhận</th><th rowspan="2" style="width:40px">ĐVT</th><th colspan="2">Kiểm tra</th><th colspan="4">Xuất đi</th><th colspan="4">Thu về</th></tr><tr><th style="width:32px;font-size:11px" class="th2">Đạt</th><th style="width:40px;font-size:11px" class="th2">Không đạt</th><th style="width:38px;font-size:11px" class="th2">T.trắng</th><th style="width:35px;font-size:11px" class="th2">T.xanh</th><th style="width:28px;font-size:11px" class="th2">Rổ</th><th style="width:32px;font-size:11px" class="th2">INOX</th><th style="width:38px;font-size:11px" class="th2">T.trắng</th><th style="width:35px;font-size:11px" class="th2">T.xanh</th><th style="width:28px;font-size:11px" class="th2">Rổ</th><th style="width:32px;font-size:11px" class="th2">INOX</th></tr></thead><tbody>'+rows+'</tbody><tfoot><tr style="font-weight:bold;background:#f5f5f5"><td colspan="2" style="text-align:center;font-size:14px">Tổng</td><td style="font-size:15px">'+tot+'</td><td colspan="12"></td></tr></tfoot></table><table style="width:100%;margin-top:20px;border:none"><tr><td style="width:50%;text-align:center;border:none;font-size:14px;font-weight:bold">Người giao</td><td style="width:50%;text-align:center;border:none;font-size:14px;font-weight:bold">Người nhận</td></tr><tr><td style="text-align:center;border:none;font-size:12px;color:#555">(Ký, họ tên)</td><td style="text-align:center;border:none;font-size:12px;color:#555">(Ký, họ tên)</td></tr><tr><td style="height:60px;border:none"></td><td style="height:60px;border:none"></td></tr></table><\/body><\/html>';var w=window.open('','_blank');w.document.write(html);w.document.close();setTimeout(function(){w.print();},500);}},h('i',{className:'ti ti-printer',style:{fontSize:14}}),'In ngay'),
        h('button',{className:'bp',onClick:onClose},'Đóng')
      )
    )
  );
}
function OrderForm({order,customers,products,quotes,employees,currentUser,prodShifts,prodCats,onSave,onClose}){
  const[f,sf]=useState(order?{...order}:{orderId:'',customerId:'',customer:'',pointId:'',pointName:'',address:'',deliveryDate:fmtDate(),deliveryTime:'08:00',note:'',status:'pending',invoiceNo:'',workOut:'',workReturn:'',lines:[]});
  const[pointSearch,setPointSearch]=useState(order?(order.pointName||''):'');
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const selCust=customers.find(c=>c.id===f.customerId);
  const matchedPoint=f.pointId?(selCust?.points||[]).find(x=>x.id===f.pointId):findOrderPointMatch(f,customers||[])?.point||null;
  const matchedPointArea=matchedPoint?.area||f.area||'';
  const resolvedPointName=matchedPoint?.name||f.pointName||f.address||'';
  const setCust=cid=>{const c=customers.find(x=>x.id===cid);sf(p=>({...p,customerId:cid,customer:c?c.name:'',pointId:'',pointName:'',address:'',area:''}));};
  const setPt=pid=>{const pt=selCust?.points.find(x=>x.id===pid);sf(p=>({...p,pointId:pid,pointName:pt?pt.name:'',address:pt?pt.address:'',area:pt ? (pt.area||'') : ''}));};
  const allPoints=customers.flatMap(c=>(c.points||[]).filter(pt=>pt&&pt.id).map(pt=>({...pt,customerId:c.id,customerName:c.name,searchLabel:pt.name+(c.name?' - '+c.name:'')})));
  const normPoint=s=>String(s||'').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/\s+/g,' ');
  const pickPoint=pt=>{
    setPointSearch(pt?pt.name:'');
    sf(p=>({...p,pointId:pt?.id||'',pointName:pt?.name||'',address:pt?.address||'',area:pt?.area||'',customerId:pt?.customerId||'',customer:pt?.customerName||''}));
  };
  const setPointText=v=>{
    setPointSearch(v);
    const nv=normPoint(v);
    const exact=allPoints.find(pt=>normPoint(pt.name)===nv||normPoint(pt.searchLabel)===nv);
    if(exact) pickPoint(exact);
    else sf(p=>({...p,pointId:'',pointName:v,address:'',customerId:'',customer:''}));
  };
  const addLine=()=>sf(p=>({...p,lines:[...p.lines,{id:uid(),productId:'',productName:'',unit:'',weightPerUnit:0,qtyProd:0,qtyInvoice:0,shift:'day',price:0,note:''}]}));
  const updLine=(id,data)=>sf(p=>({...p,lines:p.lines.map(l=>l.id===id?data:l)}));
  const delLine=id=>sf(p=>({...p,lines:p.lines.filter(l=>l.id!==id)}));
  const lineQty=l=>numFmt(l.qtyInvoice)||numFmt(l.qtyProd)||numFmt(l.qty)||numFmt(l.quantity)||0;
  const lineWeight=l=>{const p=products.find(x=>x.id===l.productId);const unit=String(l.unit||p?.unit||'').trim().toLowerCase().replace(/[^a-z]/g,'');const qty=lineQty(l);if(unit==='kg'||unit==='kgs'||unit==='kilogram'||unit==='kilograms')return qty;return (p?.weightPerUnit||numFmt(l.weightPerUnit)||0)*qty;};
  const totalWeight=f.lines.reduce((s,l)=>s+lineWeight(l),0);
  const totalPurchase=f.lines.reduce((s,l)=>{
    const p=products.find(x=>x.id===l.productId)||{};
    return s+(isGoodsProduct(p,prodCats||[])?lineQty(l)*numFmt(l.purchasePrice||l.price):0);
  },0);
  // Tự động lấy ca SX từ giờ giao
  const autoShift=getProdShiftForOrder({...f,deliveryTime:f.deliveryTime,area:matchedPointArea||f.area||'',pointName:resolvedPointName||f.pointName||'',address:f.address||''},prodShifts||[],customers||[]);
  const submit=()=>{
    if(!f.customerId){window.showToast('Vui lòng chọn khách hàng!','warn');return;}
    const prodShiftId=autoShift?autoShift.id:(f.prodShiftId||'');
    onSave({...f,area:matchedPointArea,prodShiftId,updatedBy:currentUser.name,updatedAt:fmtDT()});
  };
  return h(Modal,{title:order?'Sửa đơn '+order.id:'Tạo đơn giao hàng mới',onClose,lg:true},
    h(F,{label:'Địa điểm giao * ('+customers.reduce((n,c)=>n+(c.points||[]).length,0)+' điểm)'},h('div',null,
      h('input',{value:pointSearch,onChange:e=>setPointText(e.target.value),list:'delivery-point-list',placeholder:'Gõ tên địa điểm để tìm nhanh...',autoComplete:'off'}),
      h('datalist',{id:'delivery-point-list'},
        allPoints.map(pt=>h('option',{key:pt.customerId+'_'+pt.id,value:pt.searchLabel},pt.name))
      ),
      f.pointId&&h('div',{style:{fontSize:11,color:'var(--tx2)',marginTop:4}},f.customer||'')
    )),
    h('div',{style:{display:'grid',gridTemplateColumns:'90px 100px 100px 90px 90px 1fr',gap:'0 8px'}},
      h(F,{label:'Ngày giao'},h('input',{value:f.deliveryDate,onChange:e=>s('deliveryDate',e.target.value),placeholder:'DD/MM/YY'})),
      h(F,{label:'Giờ giao'},h('input',{value:f.deliveryTime,onChange:e=>s('deliveryTime',e.target.value),placeholder:'08:00'})),
      h(F,{label:'Trạng thái'},h('select',{value:f.status,onChange:e=>s('status',e.target.value),style:{fontSize:12}},
        [['pending','Chờ xếp'],['assigned','Đã xếp'],['delivering','Đang giao'],['done','Đã giao'],['failed','Giao lỗi'],['cancelled','Hủy']].map(([v,l])=>h('option',{key:v,value:v},l))
      )),
      h(F,{label:'Công đi'},h('input',{type:'number',min:0,step:.5,value:f.workOut,onChange:e=>s('workOut',e.target.value),placeholder:'0'})),
      h(F,{label:'Công về'},h('input',{type:'number',min:0,step:.5,value:f.workReturn,onChange:e=>s('workReturn',e.target.value),placeholder:'0'})),
      h(F,{label:'Ghi chú chung'},h('input',{value:f.note,onChange:e=>s('note',e.target.value),placeholder:'Ghi chú cho toàn đơn...'})),
    ),
    // Hiển thị thông tin ca SX tự động
    autoShift?h('div',{style:{display:'flex',alignItems:'center',gap:12,padding:'6px 10px',background:'#E6F1FB',borderRadius:'var(--r)',marginBottom:8,fontSize:12,color:'#185FA5'}},
      h('i',{className:'ti ti-clock-bolt',style:{fontSize:16}}),
      h('span',{style:{fontWeight:600}},autoShift.name),
      h('span',null,'⚙ SX: '+(autoShift.actualProdTime||autoShift.endTime||'—')+' ('+(addDaysVN(f.deliveryDate,autoShift.prodDateOffset||0)||'?')+')'),
      h('span',null,'🏷 Tem: '+(autoShift.labelPrintTime||'—')+' ('+(addDaysVN(f.deliveryDate,autoShift.labelPrintDateOffset||0)||'?')+')')
    ):h('div',{style:{display:'flex',alignItems:'center',gap:8,padding:'5px 10px',background:'#FFF0F0',borderRadius:'var(--r)',marginBottom:8,fontSize:12,color:'#A32D2D'}},
      h('i',{className:'ti ti-alert-triangle',style:{fontSize:14}}),
      'Giờ '+f.deliveryTime+' chưa khớp ca sản xuất nào. Kiểm tra lại bảng Ca sản xuất.'
    ),
    h('div',{className:'divider'}),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}},
      h('div',{style:{fontWeight:500,fontSize:13,color:'var(--pri3)'}},'Chi tiết hàng hóa'),
      h('div',{style:{fontSize:12,color:(totalWeight>0||totalPurchase>0)?'var(--pri)':'var(--tx2)'}},
        [totalWeight>0?'Tổng KL hóa đơn: '+totalWeight.toFixed(2)+' kg':'',totalPurchase>0?'Giá mua: '+moneyFmt(totalPurchase):''].filter(Boolean).join(' · ')
      )
    ),
      f.lines.map(l=>h(OrderDetailLine,{key:l.id,line:l,products,prodCats:prodCats||[],prodShifts:prodShifts||[],deliveryDate:f.deliveryDate,deliveryTime:f.deliveryTime,pointName:resolvedPointName,area:matchedPointArea,onChange:data=>updLine(l.id,data),onRemove:()=>delLine(l.id)})),
    h('button',{onClick:addLine,style:{fontSize:12,padding:'5px 12px',marginBottom:8}},h('i',{className:'ti ti-plus',style:{fontSize:13,marginRight:4}}),'Thêm hàng hóa'),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu đơn hàng'))
  );
}


/* ─── IMPORT PREVIEW MODAL ─── */
function ImportPreviewModal({data, customers, setCustomers, orders, setOrders, prodShifts, onClose}) {
  const {newOrders=[], dupOrders=[], unknownPts=[]} = data||{};
  const [skipDups, setSkipDups] = React.useState(true);
  const [ptAssign, setPtAssign] = React.useState({}); // pointName -> customerId
  const [addToCustomer, setAddToCustomer] = React.useState({}); // pointName -> bool
  const [ptArea, setPtArea] = React.useState({}); // pointName -> area
  const [ptMerge, setPtMerge] = React.useState({}); // pointName -> existingPointId (gộp vào điểm có sẵn)

  // Hàm tính độ tương đồng tên (Levenshtein đơn giản)
  const similarity = (a, b) => {
    const s1 = (a||'').trim().toLowerCase().replace(/\s+/g,' ');
    const s2 = (b||'').trim().toLowerCase().replace(/\s+/g,' ');
    if(s1===s2) return 1;
    if(!s1||!s2) return 0;
    const longer = s1.length>s2.length?s1:s2;
    const shorter = s1.length>s2.length?s2:s1;
    if(longer.includes(shorter)) return shorter.length/longer.length;
    // Levenshtein
    const dp=Array.from({length:shorter.length+1},(_,i)=>i);
    for(let i=1;i<=longer.length;i++){
      let prev=i;
      for(let j=1;j<=shorter.length;j++){
        const val=longer[i-1]===shorter[j-1]?dp[j-1]:1+Math.min(dp[j-1],dp[j],prev);
        dp[j-1]=prev; prev=val;
      }
      dp[shorter.length]=prev;
    }
    return 1-dp[shorter.length]/longer.length;
  };

  // Tìm địa điểm gần giống (>= 75%) trong tất cả khách hàng
  const allExistingPts = customers.flatMap(c=>(c.points||[]).map(p=>({...p, custId:c.id, custName:c.name})));
  const similarMap = {}; // ptName -> [{pt, score}]
  unknownPts.forEach(pt=>{
    const matches = allExistingPts
      .map(ep=>({ep, score:similarity(pt, ep.name)}))
      .filter(x=>x.score>=0.75)
      .sort((a,b)=>b.score-a.score)
      .slice(0,3);
    if(matches.length>0) similarMap[pt]=matches;
  });

  const toImport = skipDups ? newOrders.filter(o=>!dupOrders.includes(o)) : newOrders;

  const doImport = () => {
    // Xử lý từng địa điểm mới
    Object.entries(ptAssign).forEach(([pt, custId]) => {
      if(!custId) return;
      const mergeIntoId = ptMerge[pt]; // gộp vào điểm đã có
      let resolvedPointId='', resolvedPointName='';
      if(mergeIntoId) {
        // Gộp: dùng điểm đã có, không tạo mới
        const existing = allExistingPts.find(p=>p.id===mergeIntoId);
        if(existing){ resolvedPointId=existing.id; resolvedPointName=existing.name; }
      } else if(addToCustomer[pt]) {
        // Tạo mới
        const newId='PT'+uid();
        resolvedPointId=newId; resolvedPointName=pt;
        setCustomers(prev => prev.map(c => {
          if(c.id !== custId) return c;
          const pts = c.points||[];
          if(pts.find(p=>p.name.trim().toUpperCase()===pt.toUpperCase())) return c;
          return {...c, points:[...pts,{id:newId,name:pt,area:ptArea[pt]||'',address:''}]};
        }));
      }
      // Cập nhật đơn hàng với thông tin khách hàng & điểm giao
      const cust = customers.find(c=>c.id===custId);
      if(cust) toImport.forEach(o=>{
        if(o.pointName.trim().toUpperCase()===pt.toUpperCase()){
          o.customerId=cust.id; o.customer=cust.name;
          if(resolvedPointId){ o.pointId=resolvedPointId; o.pointName=resolvedPointName||pt; }
        }
      });
    });
    setOrders(p=>[...p,...toImport]);
    window.showToast('Đã import '+toImport.length+' đơn hàng ('+toImport.reduce((s,o)=>s+(o.lines||[]).length,0)+' dòng sản phẩm)!','success');
    onClose();
  };

  return h(Modal,{title:'Xem trước import đơn hàng',lg:true,onClose},
    // Summary
    h('div',{style:{display:'flex',gap:10,marginBottom:'1rem',flexWrap:'wrap'}},
      h('div',{style:{background:'#EAF3DE',border:'1px solid #52b788',borderRadius:'var(--r)',padding:'8px 16px',fontSize:13}},
        h('div',{style:{fontWeight:600,color:'#2D5A0E'}},newOrders.length+' đơn mới'),
        h('div',{style:{color:'#555'}},newOrders.reduce((s,o)=>s+(o.lines||[]).length,0)+' sản phẩm')
      ),
      dupOrders.length>0&&h('div',{style:{background:'#FFF3CD',border:'1px solid #FFC107',borderRadius:'var(--r)',padding:'8px 16px',fontSize:13}},
        h('div',{style:{fontWeight:600,color:'#856404'}},dupOrders.length+' đơn trùng'),
        h('div',{style:{color:'#555'}},'Cùng địa điểm + ngày + giờ')
      ),
      unknownPts.length>0&&h('div',{style:{background:'#FEE8E8',border:'1px solid #E06060',borderRadius:'var(--r)',padding:'8px 16px',fontSize:13}},
        h('div',{style:{fontWeight:600,color:'#A32D2D'}},unknownPts.length+' địa điểm mới'),
        h('div',{style:{color:'#555'}},'Chưa có trong danh sách KH')
      )
    ),

    // Duplicate handling
    dupOrders.length>0&&h('div',{style:{background:'#FFFBF0',border:'1px solid #FFC107',borderRadius:'var(--r)',padding:'12px',marginBottom:'1rem'}},
      h('div',{style:{fontWeight:600,marginBottom:8,fontSize:14}},'⚠️ Các đơn trùng:'),
      dupOrders.map(o=>h('div',{key:o.id,style:{fontSize:12,padding:'3px 0',color:'#666'}},
        '• '+o.deliveryDate+' '+o.deliveryTime+' — '+o.pointName
      )),
      h('div',{style:{marginTop:10,display:'flex',gap:16}},
        h('label',{style:{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:13}},
          h('input',{type:'radio',checked:skipDups,onChange:()=>setSkipDups(true)}),
          'Bỏ qua đơn trùng'
        ),
        h('label',{style:{display:'flex',alignItems:'center',gap:6,cursor:'pointer',fontSize:13}},
          h('input',{type:'radio',checked:!skipDups,onChange:()=>setSkipDups(false)}),
          'Import thêm cả đơn trùng'
        )
      )
    ),

    // Unknown points handling
    unknownPts.length>0&&h('div',{style:{background:'#FEF6F6',border:'1px solid #E06060',borderRadius:'var(--r)',padding:'12px',marginBottom:'1rem'}},
      h('div',{style:{fontWeight:600,marginBottom:8,fontSize:14}},'🆕 Địa điểm giao mới — chưa có trong danh mục:'),
      unknownPts.map(pt=>{
        const similar = similarMap[pt]||[];
        const isMerging = !!ptMerge[pt];
        return h('div',{key:pt,style:{padding:'8px 0',borderBottom:'1px solid #f5c6c6'}},
          // Tên địa điểm + badge gần giống
          h('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:6}},
            h('span',{style:{fontWeight:600,fontSize:13}},pt),
            similar.length>0&&h('span',{style:{fontSize:11,background:'#FFF3CD',color:'#856404',
              border:'1px solid #FFC107',borderRadius:10,padding:'1px 8px'}},
              '⚠ có '+similar.length+' địa điểm gần giống'
            )
          ),
          // Gợi ý gộp nếu có địa điểm gần giống
          similar.length>0&&h('div',{style:{background:'#FFFBF0',border:'1px solid #FFC107',
            borderRadius:'var(--r)',padding:'8px 10px',marginBottom:6}},
            h('div',{style:{fontSize:12,fontWeight:600,color:'#856404',marginBottom:6}},
              '🔍 Địa điểm gần giống — chọn để gộp hoặc tạo mới:'
            ),
            similar.map(({ep,score})=>h('label',{key:ep.id,
              style:{display:'flex',alignItems:'center',gap:8,padding:'4px 6px',
                borderRadius:4,cursor:'pointer',marginBottom:2,
                background:ptMerge[pt]===ep.id?'#FFF3CD':'transparent'}
            },
              h('input',{type:'radio',
                name:'merge_'+pt,
                checked:ptMerge[pt]===ep.id,
                onChange:()=>{
                  setPtMerge(p=>({...p,[pt]:ep.id}));
                  setPtAssign(p=>({...p,[pt]:ep.custId}));
                  setAddToCustomer(p=>({...p,[pt]:false}));
                },
                style:{cursor:'pointer',accentColor:'#856404'}
              }),
              h('div',{style:{flex:1}},
                h('span',{style:{fontWeight:500,fontSize:12}},ep.name),
                h('span',{style:{fontSize:11,color:'var(--tx2)',marginLeft:6}},'('+ep.custName+')'),
                ep.area&&h('span',{style:{fontSize:11,background:'var(--bg2)',
                  padding:'0 5px',borderRadius:8,marginLeft:4}},ep.area)
              ),
              h('span',{style:{fontSize:11,color:'#856404',fontWeight:600}},
                Math.round(score*100)+'% giống'
              )
            )),
            // Option tạo mới
            h('label',{style:{display:'flex',alignItems:'center',gap:8,padding:'4px 6px',
              borderRadius:4,cursor:'pointer',
              background:!ptMerge[pt]?'#F0FAF0':'transparent'}
            },
              h('input',{type:'radio',
                name:'merge_'+pt,
                checked:!ptMerge[pt],
                onChange:()=>setPtMerge(p=>{const n={...p};delete n[pt];return n;}),
                style:{cursor:'pointer',accentColor:'var(--pri)'}
              }),
              h('span',{style:{fontSize:12,color:'var(--pri)',fontWeight:500}},
                '+ Tạo địa điểm mới "'+pt+'"'
              )
            )
          ),
          // Chọn khách hàng + khu vực + thêm vào danh mục (ẩn nếu đang gộp)
          h('div',{style:{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}},
            h('select',{
              value:ptAssign[pt]||'',
              onChange:e=>{setPtAssign(p=>({...p,[pt]:e.target.value}));setPtMerge(p=>{const n={...p};delete n[pt];return n;});},
              style:{padding:'4px 8px',fontSize:12,borderRadius:'var(--r)',border:'1px solid var(--bd)',minWidth:160}
            },
              h('option',{value:''},'— Gán vào khách hàng... —'),
              customers.map(c=>h('option',{key:c.id,value:c.id},c.name))
            ),
            !isMerging&&h('select',{
              value:ptArea[pt]||'',
              onChange:e=>setPtArea(p=>({...p,[pt]:e.target.value})),
              style:{padding:'4px 8px',fontSize:12,borderRadius:'var(--r)',border:'1px solid var(--bd)',minWidth:110}
            },
              h('option',{value:''},'— Khu vực —'),
              [...new Set(customers.flatMap(c=>(c.points||[]).map(p=>p.area)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi')).map(a=>h('option',{key:a,value:a},a))
            ),
            !isMerging&&ptAssign[pt]&&h('label',{style:{display:'flex',alignItems:'center',gap:5,fontSize:12,cursor:'pointer'}},
              h('input',{type:'checkbox',checked:!!addToCustomer[pt],
                onChange:e=>setAddToCustomer(p=>({...p,[pt]:e.target.checked}))}),
              'Thêm vào danh mục địa điểm'
            ),
            isMerging&&h('span',{style:{fontSize:12,color:'#856404',fontWeight:500}},
              '↪ Gộp vào: "'+( allExistingPts.find(p=>p.id===ptMerge[pt])?.name||'')+'"'
            )
          )
        );
      })
    ),

    // Orders preview table
    h('div',{style:{maxHeight:200,overflowY:'auto',marginBottom:'1rem'}},
      h('table',{style:{width:'100%',fontSize:12,borderCollapse:'collapse'}},
        h('thead',null,h('tr',{style:{background:'var(--bg2)'}},
          ['Ngày','Địa điểm','Giờ','Khách hàng','SP','Trạng thái'].map(c=>
            h('th',{key:c,style:{padding:'5px 8px',textAlign:'left',borderBottom:'1px solid var(--bd)',fontWeight:600}},c)
          )
        )),
        h('tbody',null,toImport.map(o=>h('tr',{key:o.id},
          h('td',{style:{padding:'4px 8px'}},o.deliveryDate),
          h('td',{style:{padding:'4px 8px',fontWeight:500}},o.pointName),
          h('td',{style:{padding:'4px 8px'}},o.deliveryTime),
          h('td',{style:{padding:'4px 8px',color:'var(--tx2)'}},o.customer||h('span',{style:{color:'#E06060'}},'Chưa gán')),
          h('td',{style:{padding:'4px 8px'}},(o.lines||[]).length+' SP'),
          h('td',{style:{padding:'4px 8px'}},
            dupOrders.includes(o)?h('span',{style:{color:'#856404',fontSize:11}},'⚠️ trùng'):
            h('span',{style:{color:'#2D5A0E',fontSize:11}},'✓ mới')
          )
        )))
      )
    ),

    h(Row,null,
      h('button',{onClick:onClose},'Hủy'),
      h('button',{className:'bp',onClick:doImport,style:{padding:'8px 20px'}},
        h('i',{className:'ti ti-file-import',style:{fontSize:14}}),
        ' Import '+toImport.length+' đơn'
      )
    )
  );
}

function ImageOrderImportModal({customers,products,orders,setOrders,prodShifts,onClose}) {
  const[file,setFile]=useState(null);
  const[img,setImg]=useState('');
  const[text,setText]=useState('');
  const[rows,setRows]=useState([]);
  const[busy,setBusy]=useState(false);
  const[progress,setProgress]=useState('');
  const inputRef=useRef(null);
  const norm=s=>String(s||'').trim().replace(/\s+/g,' ');
  const shiftTimes={'SANG':'03:00','SÁNG':'03:00','TRUA':'08:00','TRƯA':'08:00','CHIEU':'14:00','CHIỀU':'14:00','DEM':'20:00','ĐÊM':'20:00'};
  const noAccent=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').toUpperCase();
  const findPoint=line=>{
    const src=norm(line).toUpperCase();
    const plain=noAccent(src);
    let best=null;
    customers.forEach(c=>(c.points||[]).forEach(pt=>{
      const pn=norm(pt.name).toUpperCase();
      const pp=noAccent(pn);
      if(!pn)return;
      if(src.includes(pn)||pn.includes(src)||plain.includes(pp)||pp.includes(plain)||((plain.includes('DBG')||plain.includes('TANG 1'))&&pp.includes('DBG'))||(plain.includes('TRINA')&&pp.includes('TRINA'))){
        const score=Math.min(src.length,pn.length)/Math.max(src.length,pn.length);
        if(!best||score>best.score)best={cust:c,pt,score};
      }
    }));
    return best;
  };
  const findProduct=line=>{
    const src=norm(line).toUpperCase();
    let best=null;
    products.forEach(p=>{
      const pn=norm(p.name).toUpperCase();
      if(!pn)return;
      if(src.includes(pn)||pn.includes(src)){
        const score=Math.min(src.length,pn.length)/Math.max(src.length,pn.length);
        if(!best||score>best.score)best={prod:p,score};
      }
    });
    return best;
  };
  const readDate=line=>{
    const src=String(line||'');
    const hasDateContext=/\b(NGAY|NGÀY|DATE)\b/i.test(noAccent(src));
    const m=src.match(/(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?|\b(\d{1,2})\.(\d{1,2})\.(\d{2,4})\b/);
    if(!m)return '';
    const a=Number(m[1]||m[4]),b=Number(m[2]||m[5]);
    const yy=m[3]||m[6]||'';
    if(!yy&&!hasDateContext&&src.trim().length>12)return '';
    const y=yy?String(yy).padStart(4,'20'):String(new Date().getFullYear());
    if(a<=12&&b>12)return pad2(b)+'/'+pad2(a)+'/'+y;
    return pad2(a)+'/'+pad2(b)+'/'+y;
  };
  const readTime=line=>{
    const m=String(line||'').match(/\b([01]?\d|2[0-3])[:hH.]([0-5]\d)\b/);
    return m?pad2(m[1])+':'+pad2(m[2]):'';
  };
  const findYoungsunCustomer=()=>customers.find(c=>noAccent(c.name).includes('YOUNG')||noAccent(c.name).includes('YOUNGSUN'))||{};
  const excelOrderId=(date,index)=>{
    const p=String(date||fmtDate()).split('/');
    const dd=pad2(p[0]),mm=pad2(p[1]),yy=String(p[2]||new Date().getFullYear()).slice(-2);
    return 'D'+yy+dd+mm+String(index).padStart(3,'0');
  };
  const dateFromShort=(s,baseDate)=>{
    const src=noAccent(s);
    const shift='SANG|TRUA|CHIEU|DEM';
    const m=src.match(new RegExp('(?:'+shift+')\\s*(\\d{1,2})[\\/\\-.](\\d{1,2})\\b|\\b(\\d{1,2})[\\/\\-.](\\d{1,2})\\s*(?:'+shift+')'));
    if(!m)return '';
    const y=(baseDate&&baseDate.split('/')[2])||String(new Date().getFullYear());
    return pad2(m[1]||m[3])+'/'+pad2(m[2]||m[4])+'/'+y;
  };
  const guessShiftItems=(note,totalQty,baseDate)=>{
    const src=noAccent(note);
    const parts=src.split(/[\/;,]+/).map(x=>x.trim()).filter(Boolean);
    const detailed=[];
    parts.forEach(part=>{
      const k=Object.keys(shiftTimes).find(x=>part.includes(x));
      if(!k)return;
      const dt=dateFromShort(part,baseDate);
      const noDate=part.replace(/\b\d{1,2}[\/\-.]\d{1,2}\b/g,' ');
      const nums=[...noDate.matchAll(/(\d+(?:[,.]\d+)?)(?=\s*(KG|K|$))/g)].map(m=>numFmt(m[1])).filter(Boolean);
      detailed.push({key:k,time:shiftTimes[k],date:dt||baseDate,qty:nums.length?nums[nums.length-1]:totalQty});
    });
    if(detailed.length)return detailed;
    const found=Object.keys(shiftTimes).filter(k=>src.includes(k)).map(k=>({key:k,time:shiftTimes[k],date:dateFromShort(src,baseDate)||baseDate}));
    const uniq=[];found.forEach(x=>{if(!uniq.some(u=>u.time===x.time))uniq.push(x);});
    const hourOnly=src.match(/\b([01]?\d|2[0-3])\s*H\b/);
    if(!uniq.length)return [{time:hourOnly?pad2(hourOnly[1])+':00':'08:00',date:dateFromShort(src,baseDate)||baseDate,qty:totalQty,shift:''}];
    if(uniq.length===1)return [{time:uniq[0].time,date:uniq[0].date,qty:totalQty,shift:uniq[0].key}];
    return uniq.map((x,i)=>{
      const tail=src.slice(src.indexOf(x.key)+x.key.length);
      const m=tail.match(/(\d+(?:[,.]\d+)?)/);
      return {time:x.time,date:x.date,qty:m?numFmt(m[1]):(i===0?totalQty:0),shift:x.key};
    }).filter(x=>x.qty>0);
  };
  const parseYoungsunText=raw=>{
    const lines=String(raw||'').replace(/\r/g,'\n').split('\n').map(norm).filter(Boolean);
    const joined=lines.join(' ');
    if(!/(?:[BTK8]\d{3,})/i.test(joined)||!/SC/i.test(joined))return [];
    let curDate=readDate(joined)||'';let curPoint='';
    lines.forEach(line=>{
      const d=readDate(line);if(d)curDate=d;
      const plain=noAccent(line);
      if(plain.includes('TRINA'))curPoint='TRINA';
      if(plain.includes('DBG'))curPoint=plain.includes('TANG')?'DBG tầng 1':'DBG';
    });
    const cust=findYoungsunCustomer();
    const resultMap={};
    const ensureOrder=(point,time,date)=>{
      const ptMatch=findPoint(point);
      const pt=ptMatch?.pt||{};
      const c=ptMatch?.cust||cust;
      const d=date||curDate||fmtDate();
      const key=(point||'')+'|'+d+'|'+time;
      if(!resultMap[key])resultMap[key]={id:excelOrderId(d,Object.keys(resultMap).length+1),deliveryDate:d,deliveryTime:time,pointId:pt.id||'',pointName:pt.name||point,customerId:c.id||'',customer:c.name||'YOUNGSUN',address:pt.address||'',area:pt.area||'',status:'pending',note:'Nhập từ ảnh Youngsun OCR',workOut:0,workReturn:0,prodShiftId:(getProdShiftForOrder({deliveryDate:d,deliveryTime:time,pointId:pt.id||'',pointName:pt.name||point,customerId:c.id||'',customer:c.name||'YOUNGSUN',address:pt.address||'',area:pt.area||''},prodShifts||[],customers||[])||{}).id||'',lines:[],createdAt:fmtDate(),updatedAt:fmtDT()};
      return resultMap[key];
    };
    lines.forEach(line=>{
      const plain=noAccent(line);
      if(/^(BEP|NGAY|MA\b|TEN\b|NCC\b|DVT\b|GHI CHU\b|SL\b)/.test(plain))return;
      if(!/\bSC\b/i.test(line))return;
      let m=line.match(/\b([BTK8]\d{3,})\b[\s.,;:-]+(.+?)\s+SC\s+([A-ZÀ-Ỹa-zà-ỹ]+)\s+(\d+(?:[,.]\d+)?)(?:\s+(.+))?$/i);
      if(!m){
        const loose=line.match(/\b([BTK8]\d{3,})\b[\s.,;:-]+(.+?)\s+SC\s+([A-ZÀ-Ỹa-zà-ỹ]{1,5})\s+(\d+(?:[,.]\d+)?)(.*)$/i);
        if(loose)m=loose;
      }
      if(!m){
        const simple=line.match(/\b([BTK8]\d{3,})\b[\s.,;:-]+(.+?)\s+(\d+(?:[,.]\d+)?)(?:\s+(.+))?$/i);
        if(simple){
          const rawTail=norm(simple[2]).replace(/\bSC\b/ig,'').trim();
          const unitMatch=rawTail.match(/\b(KG|K|G|CAI|CÁI|GOI|GÓI|THUNG|THÙNG|HOP|HỘP|BAO|BO|BỘ|LIT|LÍT)\b$/i);
          const rawUnit=unitMatch?unitMatch[1]:'KG';
          m=[null,simple[1],unitMatch?rawTail.replace(unitMatch[0],'').trim():rawTail,rawUnit,simple[3],simple[4]||''];
        }
      }
      if(!m)return;
      let code=m[1].toUpperCase();
      if(/^8\d{4}$/.test(code))code='B'+code.slice(1);
      let rawName=norm(m[2])
        .replace(/~?SL\s*D[ẠA]T|DAT\s*HA|ĐẠT\s*HÀ|DAT|H[Il]GHICHU|GHI\s*CHU/ig,'')
        .replace(/\bNCC\b|\bDVT\b/ig,'')
        .trim();
      if(!rawName||/^(TEN|TÊN)$/i.test(rawName))return;
      const unit=(m[3]||'KG').toUpperCase(), total=numFmt(m[4]), note=m[5]||'';
      const prodMatch=findProduct(rawName);
      const prod=prodMatch?.prod||products.find(p=>noAccent(p.name)===noAccent(rawName))||{};
      const lineDate=dateFromShort(note,curDate)||curDate;
      const items=guessShiftItems(note,total,lineDate);
      items.forEach(it=>{
        const o=ensureOrder(curPoint||'YOUNGSUN',it.time,it.date||lineDate);
        o.lines.push({id:uid(),productId:prod.id||'',productName:prod.name||rawName,customerCode:code,unit,weightPerUnit:prod.weightPerUnit||0,qtyProd:it.qty,qtyInvoice:it.qty,shift:it.time==='20:00'?'night':'day',note:note});
      });
    });
    return Object.values(resultMap).filter(o=>o.lines.length);
  };
  const parseText=raw=>{
    const youngsun=parseYoungsunText(raw);
    if(youngsun.length)return youngsun;
    const clean=String(raw||'').replace(/\r/g,'\n').replace(/[|]/g,' ').split('\n').map(norm).filter(Boolean);
    const result=[];let cur=null;let curDate='';
    const flush=()=>{if(cur&&cur.lines.length)result.push(cur);cur=null;};
    clean.forEach(line=>{
      const d=readDate(line);if(d)curDate=d;
      const t=readTime(line);
      const ptMatch=findPoint(line);
      if(ptMatch||t){
        if(ptMatch||(!cur&&t)){
          if(cur&&cur.lines.length)flush();
          const pt=ptMatch?.pt||{};
          const cust=ptMatch?.cust||{};
          const od=d||curDate||fmtDate();
          cur={id:excelOrderId(od,result.length+1),deliveryDate:od,deliveryTime:t||'08:00',pointId:pt.id||'',pointName:pt.name||line.replace(/\b([01]?\d|2[0-3])[:hH.]([0-5]\d)\b/g,'').trim(),customerId:cust.id||'',customer:cust.name||'',address:pt.address||'',area:pt.area||'',status:'pending',note:'Nhập từ ảnh OCR',workOut:0,workReturn:0,prodShiftId:(getProdShiftForOrder({deliveryDate:od,deliveryTime:t||'08:00',pointId:pt.id||'',pointName:pt.name||line.replace(/\b([01]?\d|2[0-3])[:hH.]([0-5]\d)\b/g,'').trim(),customerId:cust.id||'',customer:cust.name||'',address:pt.address||'',area:pt.area||''},prodShifts||[],customers||[])||{}).id||'',lines:[],createdAt:fmtDate(),updatedAt:fmtDT()};
        } else if(cur&&t) cur.deliveryTime=t;
      }
      if(!cur)return;
      const qtyMatch=line.match(/(\d+(?:[,.]\d+)?)\s*(kg|kgs|gói|goi|cái|cai|thùng|thung|túi|tui|hộp|hop|bao|bộ|bo|lít|lit)?\s*$/i);
      const prodMatch=findProduct(line);
      if(qtyMatch&&(prodMatch||!ptMatch)){
        const qty=numFmt(qtyMatch[1]);
        let name=line.replace(qtyMatch[0],'').replace(/\b([01]?\d|2[0-3])[:hH.]([0-5]\d)\b/g,'').trim();
        if(prodMatch)name=prodMatch.prod.name;
        if(name&&name.length>1){
          const prod=prodMatch?.prod||products.find(p=>norm(p.name).toUpperCase()===name.toUpperCase())||{};
          const unit=qtyMatch[2]||prod.unit||'Kg';
          cur.lines.push({id:uid(),productId:prod.id||'',productName:name,unit,weightPerUnit:prod.weightPerUnit||0,qtyProd:qty,qtyInvoice:qty,shift:'day',note:''});
        }
      }
    });
    flush();
    return result.filter(o=>o.lines.length);
  };
  const setImageFile=f=>{
    if(!f)return;
    setFile(f);setRows([]);setText('');
    const r=new FileReader();
    r.onload=e=>setImg(e.target.result);
    r.readAsDataURL(f);
  };
  const runOcr=async()=>{
    if(!file){window.showToast('Hãy chọn hoặc kéo ảnh vào trước.','warn');return;}
    if(!window.Tesseract){window.showToast('Chưa tải được thư viện OCR. Kiểm tra mạng.','error');return;}
    setBusy(true);setProgress('Đang đọc ảnh...');
    try{
      const res=await Tesseract.recognize(file,'vie+eng',{logger:m=>{if(m.status)setProgress(m.status+(m.progress?(' '+Math.round(m.progress*100)+'%'):''));}});
      const txt=res?.data?.text||'';
      setText(txt);
      setRows(parseText(txt));
      setProgress('Đã đọc xong');
    }catch(e){window.showToast('Không đọc được ảnh: '+(e.message||e),'error');}
    finally{setBusy(false);}
  };
  const reparse=()=>setRows(parseText(text));
  const updateOrder=(id,data)=>setRows(p=>p.map(o=>o.id===id?{...o,...data}:o));
  const updateLine=(oid,lid,data)=>setRows(p=>p.map(o=>o.id===oid?{...o,lines:o.lines.map(l=>l.id===lid?{...l,...data}:l)}:o));
  const allPoints=(customers||[]).flatMap(c=>(c.points||[]).map(pt=>({...pt,customerId:c.id,customerName:c.name})));
  const updatePointName=(id,value)=>{
    const m=findPoint(value);
    updateOrder(id,{pointName:value,pointId:m?.pt?.id||'',address:m?.pt?.address||'',area:m?.pt?.area||'',customerId:m?.cust?.id||'',customer:m?.cust?.name||''});
  };
  const setPointById=(id,pointId)=>{
    if(!pointId){updateOrder(id,{pointId:'',pointName:'',address:'',area:'',customerId:'',customer:''});return;}
    const pt=allPoints.find(x=>x.id===pointId)||{};
    updateOrder(id,{pointId:pt.id||'',pointName:pt.name||'',address:pt.address||'',area:pt.area||'',customerId:pt.customerId||'',customer:pt.customerName||''});
  };
  const setProductById=(oid,lid,productId)=>{
    if(!productId){updateLine(oid,lid,{productId:'',productName:'',unit:'',weightPerUnit:0});return;}
    const p=(products||[]).find(x=>x.id===productId)||{};
    updateLine(oid,lid,{productId:p.id||'',productName:p.name||'',unit:p.unit||'',weightPerUnit:p.weightPerUnit||0});
  };
  const importRows=()=>{
    if(!rows.length){window.showToast('Chưa có đơn hàng nào để nhập.','warn');return;}
    const dup=rows.filter(o=>orders.some(ex=>ex.deliveryDate===o.deliveryDate&&ex.pointName===o.pointName&&ex.deliveryTime===o.deliveryTime));
    const finalRows=dup.length&&confirm('Có '+dup.length+' đơn có thể bị trùng. Bỏ qua đơn trùng?')?rows.filter(o=>!dup.includes(o)):rows;
    if(!finalRows.length){window.showToast('Không còn đơn hàng mới để nhập.','info');return;}
    setOrders(p=>[...p,...finalRows]);
    window.showToast('Đã nhập '+finalRows.length+' đơn hàng từ ảnh.','success');
    onClose();
  };
  return h(Modal,{title:'Tự động lấy đơn từ ảnh',lg:true,onClose},
    h('div',{style:{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,alignItems:'start'}},
      h('div',null,
        h('div',{
          onDragOver:e=>{e.preventDefault();},
          onDrop:e=>{e.preventDefault();setImageFile(e.dataTransfer.files&&e.dataTransfer.files[0]);},
          onClick:()=>inputRef.current&&inputRef.current.click(),
          style:{border:'1.5px dashed var(--pri)',borderRadius:'var(--rl)',padding:'1.25rem',minHeight:220,display:'flex',alignItems:'center',justifyContent:'center',textAlign:'center',cursor:'pointer',background:'#f7fbf8',overflow:'hidden'}
        },
          img?h('img',{src:img,style:{maxWidth:'100%',maxHeight:260,objectFit:'contain'}})
          :h('div',null,h('i',{className:'ti ti-photo-scan',style:{fontSize:44,color:'var(--pri)',display:'block',marginBottom:8}}),'Kéo ảnh vào đây hoặc bấm để chọn ảnh')
        ),
        h('input',{ref:inputRef,type:'file',accept:'image/*',style:{display:'none'},onChange:e=>setImageFile(e.target.files&&e.target.files[0])}),
        h('div',{style:{display:'flex',gap:6,flexWrap:'wrap',marginTop:10}},
          h('button',{className:'bp',onClick:runOcr,disabled:busy},h('i',{className:'ti ti-scan-text',style:{fontSize:14}}),busy?'Đang đọc...':'AI/OCR đọc ảnh'),
          h('button',{onClick:reparse,disabled:busy||!text},h('i',{className:'ti ti-table-import',style:{fontSize:14}}),'Vào bảng xem trước')
        ),
        progress&&h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:8}},progress)
      ),
      h('div',null,
        h(F,{label:'Nội dung OCR'},h('textarea',{value:text,onChange:e=>setText(e.target.value),rows:12,placeholder:'Sau khi OCR, chữ đọc được sẽ hiện ở đây. Có thể sửa rồi bấm Tách lại dữ liệu.'})),
        h('div',{style:{fontSize:12,color:'var(--tx2)'}},'Mẹo: ảnh rõ, thẳng, đủ sáng và mỗi dòng có tên hàng + số lượng sẽ đọc tốt hơn.')
      )
    ),
    h('div',{style:{marginTop:'1rem'}},
      h('div',{style:{fontWeight:600,marginBottom:8,color:'var(--pri3)'}},'Bảng xem trước ('+rows.length+' đơn, '+rows.reduce((s,o)=>s+(o.lines||[]).length,0)+' dòng hàng)'),
      h('div',{className:'tw',style:{maxHeight:260}},
        h('table',null,
          h('thead',null,h('tr',null,...['Thông tin đơn','Dòng hàng trong đơn'].map(c=>h('th',{key:c},c)))),
          h('tbody',null,rows.length?rows.map(o=>h('tr',{key:o.id},
            h('td',null,
              h('div',{style:{display:'grid',gridTemplateColumns:'92px 70px',gap:5,marginBottom:5}},
                h('input',{value:o.deliveryDate,onChange:e=>updateOrder(o.id,{deliveryDate:e.target.value}),style:{fontSize:12,padding:'5px 6px'}}),
                h('input',{value:o.deliveryTime,onChange:e=>updateOrder(o.id,{deliveryTime:e.target.value,prodShiftId:(getProdShiftForOrder({...o,deliveryTime:e.target.value},prodShifts||[],customers||[])||{}).id||''}),style:{fontSize:12,padding:'5px 6px'}})
              ),
              h('select',{value:o.pointId||'__current__',onChange:e=>e.target.value==='__current__'?null:setPointById(o.id,e.target.value),style:{width:'100%',fontSize:12,padding:'5px 6px',fontWeight:600,marginBottom:4}},
                !o.pointId&&h('option',{value:'__current__'},(o.pointName||'— Chọn địa điểm —')+' (chưa khớp)'),
                h('option',{value:''},'— Chọn địa điểm —'),
                allPoints.map(pt=>h('option',{key:pt.id,value:pt.id},pt.customerName+' - '+pt.name))
              ),
              h('input',{value:o.customer||'',readOnly:true,style:{width:'100%',fontSize:12,padding:'5px 6px',background:'#f7faf8'}}),
              !o.pointId&&h('div',{style:{fontSize:11,color:'#A32D2D',marginTop:2}},'Chưa khớp danh mục')
            ),
            h('td',null,
              h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:5}},(o.lines||[]).length+' dòng hàng'),
              (o.lines||[]).map(l=>h('div',{key:l.id,style:{display:'grid',gridTemplateColumns:'70px minmax(180px,1fr) 64px 58px',gap:5,marginBottom:5,alignItems:'center'}},
                h('input',{value:l.customerCode||'',onChange:e=>updateLine(o.id,l.id,{customerCode:e.target.value}),placeholder:'Mã',style:{fontSize:12,padding:'4px 5px'}}),
                h('select',{value:l.productId||'__current__',onChange:e=>e.target.value==='__current__'?null:setProductById(o.id,l.id,e.target.value),style:{fontSize:12,padding:'4px 5px'}},
                  !l.productId&&h('option',{value:'__current__'},(l.productName||'— Chọn sản phẩm —')+' (chưa khớp)'),
                  h('option',{value:''},'— Chọn sản phẩm —'),
                  (products||[]).map(p=>h('option',{key:p.id,value:p.id},(p.code?p.code+' - ':'')+p.name))
                ),
                h('input',{value:l.qtyInvoice,onChange:e=>updateLine(o.id,l.id,{qtyInvoice:numFmt(e.target.value),qtyProd:numFmt(e.target.value)}),placeholder:'SL',style:{fontSize:12,padding:'4px 5px'}}),
                h('input',{value:l.unit||'',onChange:e=>updateLine(o.id,l.id,{unit:e.target.value}),placeholder:'ĐVT',style:{fontSize:12,padding:'4px 5px'}})
              ))
            )
          )):h('tr',null,h('td',{colSpan:2,className:'empty-st'},'Chưa có dữ liệu xem trước.')))
        )
      )
    ),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:importRows,disabled:busy||!rows.length},h('i',{className:'ti ti-file-import',style:{fontSize:14}}),'Nhập đơn hàng'))
  );
}

function PrintByCustomerModal({orders,customers,products,company,initialDate,onClose}) {
  const [custId,sCust]=useState('');
  const [df,sdf]=useState(initialDate||'');
  const [dt,sdt]=useState(initialDate||'');
  const [tpl,setTpl]=useState('welstory');
  const [selected,setSelected]=useState({});
  const parseD=s=>{
    if(!s)return null;
    if(/^\d{4}-\d{2}-\d{2}$/.test(s)){const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d);}
    const[d,m,y]=String(s).split('/').map(Number);return new Date(y,m-1,d);
  };
  const inRange=d=>{
    const dt2=parseD(d);if(!dt2)return false;
    const f=df?parseD(df):null;const t=dt?parseD(dt):null;
    if(f&&dt2<f)return false;if(t&&dt2>t)return false;return true;
  };
  const selectedCustomer=customers.find(c=>c.id===custId);
  const orderDate=o=>o.deliveryDate||o.date||o.ngayGiao||'';
  const filtered=orders.filter(o=>
    o.status!=='cancelled'&&
    (!custId||o.customerId===custId||o.custId===custId||selectedCustomer?.name===o.customer)&&
    inRange(orderDate(o))
  ).sort((a,b)=>{
    const da=parseD(orderDate(a));const db=parseD(orderDate(b));
    const dateDiff=(da&&db)?da-db:String(orderDate(a)).localeCompare(String(orderDate(b)));
    return dateDiff||((a.deliveryTime||'').localeCompare(b.deliveryTime||''));
  });
  const selectedOrders=filtered.filter(o=>selected[o.id]!==false);
  const allChecked=filtered.length>0&&selectedOrders.length===filtered.length;
  const toggleAll=checked=>setSelected(p=>{const n={...p};filtered.forEach(o=>{n[o.id]=checked;});return n;});
  const toggleOne=(id,checked)=>setSelected(p=>({...p,[id]:checked}));

  const doPrint=()=>{
    if(!selectedOrders.length){window.showToast('Chọn ít nhất 1 đơn để in!','warn');return;}
    const extractPart=(html,tag)=>{
      const m=String(html||'').match(new RegExp('<'+tag+'[^>]*>([\\s\\S]*?)<\\/'+tag+'>','i'));
      return m?m[1]:'';
    };
    const docs=selectedOrders.map(o=>buildPrintHTML(tpl,o,company));
    const style=extractPart(docs[0],'style');
    const bodyParts=docs.map((html,idx)=>{
      const body=extractPart(html,'body')||html;
      return idx<docs.length-1?body+'<div style="page-break-after:always"></div>':body;
    }).join('');
    const win=window.open('','_blank');
    win.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Phieu giao hang</title><style>'+style+'<\/style><\/head><body>'+bodyParts+'<\/body><\/html>');
    win.document.close();
    setTimeout(function(){win.print();},500);
  };

  return h(Modal,{title:'In phiếu giao hàng theo khách hàng',lg:true,onClose},
    h('div',{className:'g4'},
      h(F,{label:'Khách hàng'},h('select',{value:custId,onChange:e=>sCust(e.target.value)},
        h('option',{value:''},'— Tất cả —'),
        customers.map(c=>h('option',{key:c.id,value:c.id},c.name))
      )),
      h(F,{label:'Mẫu in'},h('select',{value:tpl,onChange:e=>setTpl(e.target.value)},
        PRINT_TEMPLATES.map(t=>h('option',{key:t.id,value:t.id},t.name))
      )),
      h(F,{label:'Từ ngày'},h('input',{type:'date',value:df,onChange:e=>sdf(e.target.value)})),
      h(F,{label:'Đến ngày'},h('input',{type:'date',value:dt,onChange:e=>sdt(e.target.value)}))
    ),
    filtered.length>0?h('div',null,
      h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'10px 14px',marginBottom:'1rem',fontSize:13}},
        h('i',{className:'ti ti-file-invoice',style:{color:'var(--pri)',marginRight:6}}),
        h('strong',null,selectedOrders.length+'/'+filtered.length+' phiếu đã chọn'),
        ' — '+selectedOrders.reduce((s,o)=>s+(o.lines||[]).length,0)+' dòng sản phẩm'
      ),
      h('div',{style:{maxHeight:200,overflowY:'auto',marginBottom:'1rem'}},
        h('table',{style:{width:'100%',fontSize:12,borderCollapse:'collapse'}},
          h('thead',null,h('tr',{style:{background:'var(--bg2)'}},
            h('th',{style:{padding:'5px 8px',textAlign:'left',borderBottom:'1px solid var(--bd)',width:34}},
              h('input',{type:'checkbox',checked:allChecked,onChange:e=>toggleAll(e.target.checked),style:{width:'auto'}})
            ),
            ['Ngày','Địa điểm','Giờ','SP'].map(c=>h('th',{key:c,style:{padding:'5px 8px',textAlign:'left',borderBottom:'1px solid var(--bd)'}},c))
          )),
          h('tbody',null,filtered.map(o=>h('tr',{key:o.id},
            h('td',{style:{padding:'4px 8px'}},h('input',{type:'checkbox',checked:selected[o.id]!==false,onChange:e=>toggleOne(o.id,e.target.checked),style:{width:'auto'}})),
            h('td',{style:{padding:'4px 8px'}},orderDate(o)),
            h('td',{style:{padding:'4px 8px',fontWeight:500}},o.pointName||'—'),
            h('td',{style:{padding:'4px 8px'}},o.deliveryTime||'—'),
            h('td',{style:{padding:'4px 8px'}},(o.lines||[]).length)
          )))
        )
      ),
      h(Row,null,
        h('button',{onClick:onClose},'Hủy'),
        h('button',{className:'bp',onClick:doPrint,disabled:!selectedOrders.length,style:{padding:'8px 20px'}},h('i',{className:'ti ti-printer',style:{fontSize:15}}),' In '+selectedOrders.length+' phiếu')
      )
    ):h('div',null,
      h('div',{style:{textAlign:'center',padding:'2rem',color:'var(--tx2)',fontSize:13}},'Không có đơn hàng. Chọn khách hàng hoặc điều chỉnh khoảng ngày.'),
      h(Row,null,h('button',{onClick:onClose},'Đóng'))
    )
  );
}

function PrintLabelsMultiModal({orders,customers,initialDate,onClose,onPrint}) {
  const [custId,sCust]=useState('');
  const [df,sdf]=useState(initialDate||'');
  const [dt,sdt]=useState(initialDate||'');
  const [selected,setSelected]=useState({});
  const parseD=s=>{
    if(!s)return null;
    if(/^\d{4}-\d{2}-\d{2}$/.test(s)){const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d);}
    const[d,m,y]=String(s).split('/').map(Number);return new Date(y,m-1,d);
  };
  const inRange=d=>{
    const dt2=parseD(d);if(!dt2)return false;
    const f=df?parseD(df):null;const t=dt?parseD(dt):null;
    if(f&&dt2<f)return false;if(t&&dt2>t)return false;return true;
  };
  const selectedCustomer=customers.find(c=>c.id===custId);
  const orderDate=o=>o.deliveryDate||o.date||o.ngayGiao||'';
  const filtered=orders.filter(o=>
    o.status!=='cancelled'&&
    (!custId||o.customerId===custId||o.custId===custId||selectedCustomer?.name===o.customer)&&
    inRange(orderDate(o))
  ).sort((a,b)=>{
    const da=parseD(orderDate(a));const db=parseD(orderDate(b));
    const dateDiff=(da&&db)?da-db:String(orderDate(a)).localeCompare(String(orderDate(b)));
    return dateDiff||((a.deliveryTime||'').localeCompare(b.deliveryTime||''));
  });
  const selectedOrders=filtered.filter(o=>selected[o.id]!==false);
  const allChecked=filtered.length>0&&selectedOrders.length===filtered.length;
  const toggleAll=checked=>setSelected(p=>{const n={...p};filtered.forEach(o=>{n[o.id]=checked;});return n;});
  const toggleOne=(id,checked)=>setSelected(p=>({...p,[id]:checked}));
  const doPrint=()=>{
    if(!selectedOrders.length){window.showToast('Chọn ít nhất 1 đơn để in tem!','warn');return;}
    onPrint(selectedOrders);
  };
  return h(Modal,{title:'In tem cho nhiều đơn hàng',lg:true,onClose},
    h('div',{className:'g3'},
      h(F,{label:'Khách hàng'},h('select',{value:custId,onChange:e=>sCust(e.target.value)},
        h('option',{value:''},'— Tất cả —'),
        customers.map(c=>h('option',{key:c.id,value:c.id},c.name))
      )),
      h(F,{label:'Từ ngày'},h('input',{type:'date',value:df,onChange:e=>sdf(e.target.value)})),
      h(F,{label:'Đến ngày'},h('input',{type:'date',value:dt,onChange:e=>sdt(e.target.value)}))
    ),
    filtered.length>0?h('div',null,
      h('div',{style:{background:'var(--bg2)',borderRadius:'var(--r)',padding:'10px 14px',marginBottom:'1rem',fontSize:13}},
        h('i',{className:'ti ti-tag',style:{color:'var(--pri)',marginRight:6}}),
        h('strong',null,selectedOrders.length+'/'+filtered.length+' đơn đã chọn'),
        ' — '+selectedOrders.reduce((s,o)=>s+(o.lines||[]).length,0)+' dòng sản phẩm'
      ),
      h('div',{style:{maxHeight:200,overflowY:'auto',marginBottom:'1rem'}},
        h('table',{style:{width:'100%',fontSize:12,borderCollapse:'collapse'}},
          h('thead',null,h('tr',{style:{background:'var(--bg2)'}},
            h('th',{style:{padding:'5px 8px',textAlign:'left',borderBottom:'1px solid var(--bd)',width:34}},
              h('input',{type:'checkbox',checked:allChecked,onChange:e=>toggleAll(e.target.checked),style:{width:'auto'}})
            ),
            ['Ngày','Địa điểm','Giờ','SP'].map(c=>h('th',{key:c,style:{padding:'5px 8px',textAlign:'left',borderBottom:'1px solid var(--bd)'}},c))
          )),
          h('tbody',null,filtered.map(o=>h('tr',{key:o.id},
            h('td',{style:{padding:'4px 8px'}},h('input',{type:'checkbox',checked:selected[o.id]!==false,onChange:e=>toggleOne(o.id,e.target.checked),style:{width:'auto'}})),
            h('td',{style:{padding:'4px 8px'}},orderDate(o)),
            h('td',{style:{padding:'4px 8px',fontWeight:500}},o.pointName||'—'),
            h('td',{style:{padding:'4px 8px'}},o.deliveryTime||'—'),
            h('td',{style:{padding:'4px 8px'}},(o.lines||[]).length)
          )))
        )
      ),
      h(Row,null,
        h('button',{onClick:onClose},'Hủy'),
        h('button',{className:'bp',onClick:doPrint,disabled:!selectedOrders.length,style:{padding:'8px 20px'}},h('i',{className:'ti ti-printer',style:{fontSize:15}}),' In tem '+selectedOrders.length+' đơn')
      )
    ):h('div',null,
      h('div',{style:{textAlign:'center',padding:'2rem',color:'var(--tx2)',fontSize:13}},'Không có đơn hàng. Chọn khách hàng hoặc điều chỉnh khoảng ngày.'),
      h(Row,null,h('button',{onClick:onClose},'Đóng'))
    )
  );
}

function IntemTab({products,company}){
  const printableProducts=(products||[]).filter(Boolean).sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'vi'));
  const [printerState,setPrinterState]=useLS('scf_420b_wifi_printer',{ip:'',foundIps:[],lastScanAt:'',status:''});
  const [printerIp,setPrinterIp]=useState(printerState?.ip||'');
  const [foundIps,setFoundIps]=useState(Array.isArray(printerState?.foundIps)?printerState.foundIps:[]);
  const [scanMsg,setScanMsg]=useState(printerState?.status||'Chưa quét máy in');
  const [scanLoading,setScanLoading]=useState(false);
  const [productId,setProductId]=useState(printableProducts[0]?.id||'');
  const [templateType,setTemplateType]=useState('58x40');
  const [prodDate,setProdDate]=useState(isoDate());
  const [prodTime,setProdTime]=useState(shortTime(timeNow()));
  const [totalKg,setTotalKg]=useState('');
  const [packQty,setPackQty]=useState(1);
  const [packWeight,setPackWeight]=useState('');
  useEffect(()=>{if(!productId&&printableProducts[0]?.id)setProductId(printableProducts[0].id);},[productId,printableProducts]);
  const selectedProduct=printableProducts.find(p=>String(p.id||'')===String(productId||''))||null;
  const productNeedsLabel=!!selectedProduct?.needsLabel;
  const labelRule=resolveProductLabelPackRule(selectedProduct,selectedProduct?.name||'');
  const defaultPackWeight=numFmt(selectedProduct?.weightPerUnit)||0;
  useEffect(()=>{
    if(templateType==='100x100'&&defaultPackWeight>0&&!numFmt(packWeight))setPackWeight(String(defaultPackWeight));
  },[templateType,defaultPackWeight]);
  const toVnDate=value=>vnDateFromISO(value)||fmtAnyDate(value)||value||'';
  const scanCandidateIps=()=>{
    const match=String(printerIp||'').trim().match(/^(\d+\.\d+\.\d+)\.(\d{1,3})$/);
    const preferredPrefix=match?match[1]:'';
    const preferredTail=match?Math.max(1,Math.min(254,Number(match[2])||1)):0;
    const prefixes=[preferredPrefix,'192.168.1','192.168.0','192.168.31','10.0.0','10.0.1'].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i);
    const tails=preferredTail
      ?[preferredTail,preferredTail-1,preferredTail+1,preferredTail-2,preferredTail+2,100,101,110,120,130,140,150,160,170,180,190,200,210,220,230]
      :[10,20,30,40,50,60,70,80,90,100,101,110,120,130,140,150,160,170,180,190,200,210,220,230,240,250];
    const list=[];
    prefixes.forEach(prefix=>{
      tails.forEach(tail=>{
        const n=Number(tail);
        if(n>=1&&n<=254)list.push(prefix+'.'+n);
      });
    });
    return [...new Set(list)];
  };
  const probePrinterIp=ip=>new Promise(resolve=>{
    const ctl=typeof AbortController!=='undefined'?new AbortController():null;
    const timer=setTimeout(()=>{try{ctl&&ctl.abort();}catch{}resolve(false);},900);
    fetch('http://'+ip+'/?_='+(Date.now()),{mode:'no-cors',cache:'no-store',signal:ctl?ctl.signal:undefined})
      .then(()=>{clearTimeout(timer);resolve(true);})
      .catch(()=>{clearTimeout(timer);resolve(false);});
  });
  const scanPrinterIps=async()=>{
    setScanLoading(true);
    setScanMsg('Đang quét mạng nội bộ để tìm máy in 420B...');
    const candidates=scanCandidateIps();
    const found=[];
    for(let i=0;i<candidates.length;i+=6){
      const batch=candidates.slice(i,i+6);
      const result=await Promise.all(batch.map(async ip=>(await probePrinterIp(ip))?ip:null));
      result.filter(Boolean).forEach(ip=>{if(!found.includes(ip))found.push(ip);});
      if(found.length>=6)break;
    }
    const nextIp=found[0]||printerIp||'';
    const status=found.length
      ?('Đã tìm thấy '+found.length+' IP có phản hồi. Đang chọn '+nextIp)
      :'Chưa tìm thấy IP phản hồi. Có thể máy in không bật web nội bộ. Hãy nhập IP tay nếu đã biết.';
    setFoundIps(found);
    setPrinterIp(nextIp);
    setScanMsg(status);
    setPrinterState(prev=>({...prev,ip:nextIp,foundIps:found,lastScanAt:fmtDT(),status}));
    setScanLoading(false);
  };
  const savePrinterIp=()=>{
    const ip=String(printerIp||'').trim();
    if(!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)){window.showToast('Nhập đúng IP máy in, ví dụ 192.168.1.120','warn');return;}
    const status='Đã lưu IP máy in 420B: '+ip;
    setScanMsg(status);
    setPrinterState(prev=>({...prev,ip,foundIps:[...new Set([ip,...(prev?.foundIps||[])])],lastScanAt:fmtDT(),status}));
    setFoundIps(prev=>[...new Set([ip,...prev])]);
    window.showToast('Đã lưu IP máy in','success');
  };
  const openPrinterPage=()=>{
    const ip=String(printerIp||'').trim();
    if(!ip){window.showToast('Chưa có IP máy in để mở','warn');return;}
    window.open('http://'+ip,'_blank');
  };
  const splitClassicWeights=kg=>{
    if(!productNeedsLabel)return [];
    const total=Number(numFmt(kg)||0);
    if(!(total>0))return [];
    const pack=Number(labelRule.pack||10);
    const full=Math.floor(total/pack);
    const remain=Number((total-full*pack).toFixed(2));
    const parts=Array.from({length:full},()=>pack);
    if(remain>0){
      if(labelRule.mergeSmallRemainder&&remain<2&&parts.length)parts[parts.length-1]=Number((parts[parts.length-1]+remain).toFixed(2));
      else parts.push(remain);
    }
    return parts;
  };
  const buildPackWeights=()=>{
    if(!productNeedsLabel)return [];
    const count=Math.max(0,Math.round(numFmt(packQty)||0));
    const each=Number(numFmt(packWeight)||defaultPackWeight||0);
    if(!(count>0) || !(each>0))return [];
    return Array.from({length:count},()=>each);
  };
  const labelWeights=templateType==='58x40'?splitClassicWeights(totalKg):buildPackWeights();
  const formatKg=kg=>Number(numFmt(kg)||0).toLocaleString('vi-VN',{maximumFractionDigits:2});
  const summaryLine=labelWeights.length
    ?labelWeights.map((kg,idx)=>formatKg(kg)+'kg').join(' | ')
    :'Chưa có tem để in';
  const classicSvg=kg=>{
    const product=String(selectedProduct?.name||'').trim()||'SẢN PHẨM';
    const nsx=toVnDate(prodDate);
    const gioSx=String(prodTime||'').trim().replace(':','H').replace(/H00$/,'H');
    const directUse=product.toUpperCase().includes('BÚN LÁ')||product.toUpperCase().includes('BUN LA')||product.toUpperCase().includes('BÁNH CUỐN')||product.toUpperCase().includes('BANH CUON')||product.toUpperCase().includes('BÁNH PHỞ CUỐN')||product.toUpperCase().includes('BANH PHO CUON');
    const hdsd=directUse?'Ăn trực tiếp':'Trần qua nước sôi trước khi ăn.';
    return '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"580\" height=\"400\" viewBox=\"0 0 580 400\">'
      +'<rect width=\"580\" height=\"400\" fill=\"white\"/>'
      +'<rect x=\"10\" y=\"10\" width=\"560\" height=\"380\" fill=\"white\" stroke=\"#111\" stroke-width=\"2\"/>'
      +'<text x=\"160\" y=\"68\" font-family=\"Arial,sans-serif\" font-size=\"54\" font-weight=\"700\" text-anchor=\"middle\" lengthAdjust=\"spacingAndGlyphs\" textLength=\"270\">'+String(product).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))+'</text>'
      +'<text x=\"425\" y=\"68\" font-family=\"Arial,sans-serif\" font-size=\"52\" font-weight=\"700\" text-anchor=\"middle\">'+formatKg(kg)+'</text>'
      +'<text x=\"520\" y=\"68\" font-family=\"Arial,sans-serif\" font-size=\"38\" font-weight=\"700\" text-anchor=\"middle\">KG</text>'
      +'<text x=\"22\" y=\"112\" font-family=\"Arial,sans-serif\"><tspan font-size=\"22\">SP CỦA: C.TY TNHH </tspan><tspan font-size=\"23\" font-weight=\"700\">THỰC PHẨM SÔNG CÔNG</tspan></text>'
      +'<text x=\"22\" y=\"154\" font-family=\"Arial,sans-serif\" font-size=\"23\">ĐC: Tổ 1. P.Mỏ Chè, Sông Công, T.Thái Nguyên</text>'
      +'<text x=\"22\" y=\"196\" font-family=\"Arial,sans-serif\" font-size=\"23\" font-weight=\"700\">SĐT : 0969709878</text>'
      +'<text x=\"258\" y=\"196\" font-family=\"Arial,sans-serif\" font-size=\"23\">THÀNH PHẦN: Bột gạo, nước</text>'
      +'<text x=\"22\" y=\"238\" font-family=\"Arial,sans-serif\" font-size=\"23\">HDSD: '+hdsd.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))+'</text>'
      +'<text x=\"512\" y=\"238\" font-family=\"Arial,sans-serif\" font-size=\"25\" text-anchor=\"end\"><tspan font-weight=\"700\">PH</tspan> 5-8</text>'
      +'<text x=\"22\" y=\"280\" font-family=\"Arial,sans-serif\" font-size=\"23\">K.cáo: Không dùng khi biến màu hoặc có mùi lạ</text>'
      +'<text x=\"22\" y=\"322\" font-family=\"Arial,sans-serif\" font-size=\"26\" font-weight=\"700\">NSX:</text>'
      +'<text x=\"132\" y=\"322\" font-family=\"Arial,sans-serif\" font-size=\"26\" font-weight=\"700\">'+nsx.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))+'</text>'
      +'<text x=\"342\" y=\"322\" font-family=\"Arial,sans-serif\" font-size=\"26\" font-weight=\"700\">GIỜ SX</text>'
      +'<text x=\"512\" y=\"322\" font-family=\"Arial,sans-serif\" font-size=\"26\" font-weight=\"700\" text-anchor=\"end\">'+gioSx.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))+'</text>'
      +'<text x=\"28\" y=\"364\" font-family=\"Arial,sans-serif\" font-size=\"23\">HSD: 24H</text>'
      +'<text x=\"170\" y=\"364\" font-family=\"Arial,sans-serif\" font-size=\"23\">FORMOL: 0</text>'
      +'<text x=\"302\" y=\"364\" font-family=\"Arial,sans-serif\" font-size=\"23\">HÀN THE: 0</text>'
      +'<text x=\"552\" y=\"364\" font-family=\"Arial,sans-serif\" font-size=\"23\" text-anchor=\"end\">BQ: 0-10°C</text>'
      +'</svg>';
  };
  const pacSvg=kg=>{
    const product=String(selectedProduct?.name||'').trim().toUpperCase()||'SẢN PHẨM';
    const nsx=toVnDate(prodDate);
    const gioSx=String(prodTime||'').trim().replace(':','H').replace(/H00$/,'H');
    return '<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"1000\" height=\"1000\" viewBox=\"0 0 1000 1000\">'
      +'<rect width=\"1000\" height=\"1000\" fill=\"white\"/>'
      +'<rect x=\"56\" y=\"56\" width=\"888\" height=\"888\" fill=\"white\" stroke=\"#111\" stroke-width=\"5\"/>'
      +'<line x1=\"86\" y1=\"152\" x2=\"914\" y2=\"152\" stroke=\"#111\" stroke-width=\"2\"/>'
      +'<line x1=\"760\" y1=\"56\" x2=\"760\" y2=\"152\" stroke=\"#111\" stroke-width=\"2\"/>'
      +'<line x1=\"844\" y1=\"56\" x2=\"844\" y2=\"152\" stroke=\"#111\" stroke-width=\"2\"/>'
      +'<text x=\"414\" y=\"118\" font-family=\"Times New Roman,serif\" font-size=\"62\" font-weight=\"700\" text-anchor=\"middle\">'+product.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))+'</text>'
      +'<text x=\"802\" y=\"118\" font-family=\"Times New Roman,serif\" font-size=\"58\" font-weight=\"700\" text-anchor=\"middle\">'+formatKg(kg)+'</text>'
      +'<text x=\"886\" y=\"118\" font-family=\"Times New Roman,serif\" font-size=\"46\" text-anchor=\"middle\">KG</text>'
      +'<text x=\"88\" y=\"214\" font-family=\"Times New Roman,serif\" font-size=\"28\" font-weight=\"700\">SP CỦA: CÔNG TY TNHH THỰC PHẨM SÔNG CÔNG</text>'
      +'<text x=\"88\" y=\"294\" font-family=\"Times New Roman,serif\" font-size=\"28\" font-weight=\"700\">ĐC: Tổ 1. P.Mỏ Chè, Sông Công, T.Thái Nguyên</text>'
      +'<line x1=\"86\" y1=\"332\" x2=\"914\" y2=\"332\" stroke=\"#bbb\" stroke-width=\"1\"/>'
      +'<line x1=\"352\" y1=\"332\" x2=\"352\" y2=\"408\" stroke=\"#bbb\" stroke-width=\"1\"/>'
      +'<text x=\"88\" y=\"386\" font-family=\"Times New Roman,serif\" font-size=\"32\" font-weight=\"700\">SĐT : 0969709878</text>'
      +'<text x=\"372\" y=\"386\" font-family=\"Times New Roman,serif\" font-size=\"32\" font-weight=\"700\">TP: Bột gạo, nước</text>'
      +'<line x1=\"86\" y1=\"412\" x2=\"914\" y2=\"412\" stroke=\"#bbb\" stroke-width=\"1\"/>'
      +'<text x=\"88\" y=\"500\" font-family=\"Times New Roman,serif\" font-size=\"30\" font-weight=\"700\">BQ : 15°C-20°C. Đóng gói hở. HSD 12h trần nước sôi trước khi dùng.</text>'
      +'<line x1=\"86\" y1=\"526\" x2=\"914\" y2=\"526\" stroke=\"#ddd\" stroke-width=\"1\"/>'
      +'<text x=\"88\" y=\"610\" font-family=\"Times New Roman,serif\" font-size=\"30\" font-weight=\"700\">BQ : 10°C-15°C. Đóng gói hở. HSD 24h trần nước sôi trước khi dùng.</text>'
      +'<line x1=\"86\" y1=\"636\" x2=\"914\" y2=\"636\" stroke=\"#ddd\" stroke-width=\"1\"/>'
      +'<text x=\"88\" y=\"720\" font-family=\"Times New Roman,serif\" font-size=\"30\" font-weight=\"700\">BQ : 5°C-10°C. Đóng gói hở. HSD 36h trần nước sôi trước khi dùng.</text>'
      +'<line x1=\"86\" y1=\"746\" x2=\"914\" y2=\"746\" stroke=\"#ddd\" stroke-width=\"1\"/>'
      +'<text x=\"88\" y=\"830\" font-family=\"Times New Roman,serif\" font-size=\"30\" font-weight=\"700\">BQ : 0°C-5°C. Đóng gói kín. HSD 72h trần nước sôi trước khi dùng.</text>'
      +'<line x1=\"86\" y1=\"856\" x2=\"914\" y2=\"856\" stroke=\"#ddd\" stroke-width=\"1\"/>'
      +'<text x=\"88\" y=\"904\" font-family=\"Times New Roman,serif\" font-size=\"28\" font-weight=\"700\">K.cáo: Không dùng khi biến màu hoặc có mùi lạ</text>'
      +'<line x1=\"86\" y1=\"936\" x2=\"914\" y2=\"936\" stroke=\"#111\" stroke-width=\"2\"/>'
      +'<line x1=\"260\" y1=\"936\" x2=\"260\" y2=\"986\" stroke=\"#111\" stroke-width=\"1\"/>'
      +'<line x1=\"442\" y1=\"936\" x2=\"442\" y2=\"986\" stroke=\"#111\" stroke-width=\"1\"/>'
      +'<line x1=\"608\" y1=\"936\" x2=\"608\" y2=\"986\" stroke=\"#111\" stroke-width=\"1\"/>'
      +'<line x1=\"732\" y1=\"936\" x2=\"732\" y2=\"986\" stroke=\"#111\" stroke-width=\"1\"/>'
      +'<line x1=\"816\" y1=\"936\" x2=\"816\" y2=\"986\" stroke=\"#111\" stroke-width=\"1\"/>'
      +'<text x=\"110\" y=\"973\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\">FORMOL</text>'
      +'<text x=\"352\" y=\"973\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\" text-anchor=\"middle\">0</text>'
      +'<text x=\"525\" y=\"973\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\" text-anchor=\"middle\">PH:5-8</text>'
      +'<text x=\"670\" y=\"973\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\" text-anchor=\"middle\">HÀN THE</text>'
      +'<text x=\"774\" y=\"973\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\" text-anchor=\"middle\">0</text>'
      +'<text x=\"864\" y=\"973\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\" text-anchor=\"middle\">BQ</text>'
      +'<text x=\"928\" y=\"973\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\" text-anchor=\"middle\">0-10°C</text>'
      +'<text x=\"120\" y=\"1015\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\">NSX:</text>'
      +'<text x=\"360\" y=\"1015\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\" text-anchor=\"middle\">'+nsx.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))+'</text>'
      +'<text x=\"650\" y=\"1015\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\">GIỜ SX:</text>'
      +'<text x=\"866\" y=\"1015\" font-family=\"Times New Roman,serif\" font-size=\"24\" font-weight=\"700\" text-anchor=\"middle\">'+gioSx.replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))+'</text>'
      +'</svg>';
  };
  const openLabelWindow=()=>{
    if(!selectedProduct){window.showToast('Chọn sản phẩm trước khi in tem','warn');return;}
    if(!productNeedsLabel){window.showToast('Sản phẩm này đang để không in tem trong danh mục sản phẩm','warn');return;}
    if(!labelWeights.length){
      window.showToast(templateType==='58x40'?'Nhập tổng kg cần in để tách tem':'Nhập số gói/số tem và kg mỗi tem để in','warn');
      return;
    }
    const isClassic58=templateType==='58x40';
    const width=templateType==='100x100'?'100mm':'58mm';
    const height=templateType==='100x100'?'100mm':'40mm';
    const contentWidth=templateType==='100x100'?'100mm':'58mm';
    const contentHeight=templateType==='100x100'?'100mm':'40mm';
    const labels=labelWeights.map((kg,idx)=>{
      const svg=templateType==='100x100'?pacSvg(kg):classicSvg(kg);
      const src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
      return '<section class=\"label'+(isClassic58?' classic58':'')+'\"><img class=\"label-img'+(isClassic58?' classic58-img':'')+'\" alt=\"Tem '+(idx+1)+'\" src=\"'+src+'\"></section>';
    }).join('');
    const popup=window.open('','_blank','width=1200,height=850');
    if(!popup){window.showToast('Trình duyệt đang chặn cửa sổ in. Hãy cho phép popup.','warn');return;}
    popup.document.write('<html><head><title>In tem '+String(selectedProduct.name||'')+'</title><style>'
      +'@page{size:'+width+' '+height+';margin:0}'
      +'html,body{margin:0;padding:0;font-family:Arial,sans-serif;background:#eef3f0}'
      +'body{display:flex;min-height:100vh}'
      +'.summary{width:320px;box-sizing:border-box;padding:18px;background:#f6fbf8;border-right:1px solid #d8e4dc}'
      +'.summary h2{margin:0 0 10px;font-size:24px;color:#1f5134}'
      +'.summary .meta{font-size:13px;line-height:1.6;color:#23402f}'
      +'.summary .chips{margin-top:10px;display:flex;flex-wrap:wrap;gap:6px}'
      +'.summary .chip{display:inline-flex;padding:4px 10px;border-radius:999px;background:#fff;border:1px solid #c9dbcf;font-size:12px;font-weight:600;color:#23402f}'
      +'.summary .note{margin-top:10px;font-size:12px;color:#56705f}'
      +'.labels{flex:1;display:flex;flex-direction:column;gap:0;padding:0}'
      +'.label{position:relative;display:block;width:'+width+';height:'+height+';overflow:hidden;break-after:page;page-break-after:always}'
      +'.label:last-child{break-after:auto;page-break-after:auto}'
      +'.label-img{display:block;width:'+width+';height:'+height+'}'
      +'.label.classic58{width:58mm;height:40mm}'
      +'.label-img.classic58-img{position:static;width:58mm;height:40mm;transform:none}'
      +'@media print{body{display:block;background:#fff}.summary{display:none}.labels{display:block}.label.classic58{width:58mm;height:40mm}.label-img.classic58-img{position:static;width:'+contentWidth+';height:'+contentHeight+';transform:rotate(180deg);transform-origin:center center}}'
      +'</style></head><body>'
      +'<aside class=\"summary\"><h2>Intem 420B</h2>'
      +'<div class=\"meta\"><b>Sản phẩm:</b> '+String(selectedProduct.name||'')+'<br><b>Mẫu tem:</b> '+templateType+'<br><b>Ngày SX:</b> '+toVnDate(prodDate)+'<br><b>Giờ SX:</b> '+String(prodTime||'—')+'<br><b>Tổng số tem:</b> '+labelWeights.length+'<br><b>IP máy in:</b> '+String(printerIp||'Chưa lưu')+'</div>'
      +'<div class=\"chips\">'+labelWeights.map((kg,idx)=>'<span class=\"chip\">Tem '+(idx+1)+': '+formatKg(kg)+'kg</span>').join('')+'</div>'
      +'<div class=\"note\">Trình duyệt sẽ mở hộp in. Nếu máy 420B đã cài trên Windows, chọn đúng máy in trong hộp in để in ra tem.</div>'
      +'</aside><main class=\"labels\">'+labels+'</main></body></html>');
    popup.document.close();
    setTimeout(()=>popup.print(),350);
  };
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-printer',style:{fontSize:20}}),'Intem'),
    h('div',{className:'card',style:{marginBottom:'1rem'}},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:14,flexWrap:'wrap',marginBottom:14}},
        h('div',null,
          h('div',{style:{fontSize:16,fontWeight:700,color:'var(--pri3)',marginBottom:4}},'Kết nối máy in nhiệt 420B qua Wi‑Fi'),
          h('div',{style:{fontSize:12,color:'var(--tx2)',maxWidth:760}},'App sẽ quét nhanh các IP nội bộ thường dùng để tìm máy in có phản hồi. Nếu máy in không mở web nội bộ thì có thể không quét thấy, khi đó mình nhập IP tay rồi lưu lại.')
        ),
        h('div',{style:{background:'var(--bg2)',padding:'10px 12px',borderRadius:'var(--r)',minWidth:220}},
          h('div',{style:{fontSize:12,color:'var(--tx2)',marginBottom:4}},'Máy in đang chọn'),
          h('div',{style:{fontWeight:700,color:'var(--pri3)'}},printerIp||'Chưa có IP'),
          printerState?.lastScanAt&&h('div',{style:{fontSize:11,color:'var(--tx2)',marginTop:4}},'Lần quét: '+printerState.lastScanAt)
        )
      ),
      h('div',{className:'g3'},
        h(F,{label:'IP máy in 420B'},
          h('input',{value:printerIp,onChange:e=>setPrinterIp(e.target.value),placeholder:'Ví dụ: 192.168.1.120'})
        ),
        h(F,{label:'IP tìm thấy'},
          h('select',{value:printerIp,onChange:e=>setPrinterIp(e.target.value)},
            h('option',{value:''},foundIps.length?'— Chọn IP đã quét —':'— Chưa có IP quét thấy —'),
            foundIps.map(ip=>h('option',{key:ip,value:ip},ip))
          )
        ),
        h(F,{label:'Trạng thái quét'},
          h('div',{style:{minHeight:40,padding:'8px 10px',border:'1px solid var(--bd)',borderRadius:'var(--r)',background:'#fff',fontSize:12,color:'var(--tx2)',lineHeight:1.45}},scanMsg)
        )
      ),
      h(Row,null,
        h('button',{onClick:scanPrinterIps,disabled:scanLoading,style:{padding:'8px 14px'}},h('i',{className:'ti ti-wifi',style:{fontSize:14}}),scanLoading?'Đang quét...':'Quét IP máy in'),
        h('button',{onClick:savePrinterIp,style:{padding:'8px 14px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu IP'),
        h('button',{onClick:openPrinterPage,disabled:!printerIp,style:{padding:'8px 14px'}},h('i',{className:'ti ti-world-www',style:{fontSize:14}}),'Mở trang máy in')
      )
    ),
    h('div',{className:'card'},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:14,flexWrap:'wrap',marginBottom:14}},
        h('div',null,
          h('div',{style:{fontSize:16,fontWeight:700,color:'var(--pri3)',marginBottom:4}},'Tạo tem thủ công'),
          h('div',{style:{fontSize:12,color:'var(--tx2)',maxWidth:760}},'Chọn sản phẩm, nhập ngày SX, giờ SX và mẫu tem. Với tem 58x40, app sẽ tự tách số tem theo quy tắc của sản phẩm. Với tem 100x100, mình nhập số gói/số tem và kg mỗi tem.')
        ),
        h('div',{style:{background:'var(--bg2)',padding:'10px 12px',borderRadius:'var(--r)',minWidth:250}},
          h('div',{style:{fontSize:12,color:'var(--tx2)',marginBottom:4}},'Tóm tắt nhanh'),
          h('div',{style:{fontWeight:700,color:'var(--pri3)'}},selectedProduct?.name||'Chưa chọn sản phẩm'),
          h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:4}},'Mẫu '+templateType+' · '+labelWeights.length+' tem')
        )
      ),
      h('div',{className:'g2'},
        h(F,{label:'Sản phẩm'},
          h('select',{value:productId,onChange:e=>setProductId(e.target.value)},
            h('option',{value:''},'— Chọn sản phẩm —'),
            printableProducts.map(p=>h('option',{key:p.id,value:p.id},p.code?(p.code+' - '+p.name):p.name))
          )
        ),
        h(F,{label:'Mẫu tem'},
          h('select',{value:templateType,onChange:e=>setTemplateType(e.target.value)},
            h('option',{value:'58x40'},'58 x 40 mm'),
            h('option',{value:'100x100'},'100 x 100 mm')
          )
        )
      ),
      h('div',{className:'g2'},
        h(F,{label:'Ngày sản xuất'},h('input',{type:'date',value:prodDate,onChange:e=>setProdDate(e.target.value)})),
        h(F,{label:'Giờ sản xuất'},h('input',{type:'time',value:prodTime,onChange:e=>setProdTime(e.target.value)}))
      ),
      !productNeedsLabel&&selectedProduct&&h('div',{style:{background:'#fff7ed',padding:'10px 12px',borderRadius:'var(--r)',fontSize:12,color:'#9A3412',marginBottom:'1rem'}},'Sản phẩm này đang để trạng thái Không in tem trong danh mục sản phẩm. Nếu muốn in, cần bật lại cờ in tem ở danh mục sản phẩm.'),
      templateType==='58x40'
        ?h('div',{className:'g2'},
          h(F,{label:'Tổng kg cần in'},h('input',{type:'number',min:0,step:'0.01',value:totalKg,onChange:e=>setTotalKg(e.target.value),disabled:!productNeedsLabel,placeholder:labelRule.pack?('Ví dụ: '+labelRule.pack*5+7):'Ví dụ: 57'})),
          h(F,{label:'Quy tắc tem đang áp dụng'},
            h('div',{style:{minHeight:40,padding:'8px 10px',border:'1px solid var(--bd)',borderRadius:'var(--r)',background:'#fff',fontSize:12,color:'var(--tx2)',lineHeight:1.45}},
              productNeedsLabel?(labelRule.pack+'kg/tem'+(labelRule.mergeSmallRemainder?' · gộp phần lẻ nhỏ':' · tách riêng phần lẻ')):'Sản phẩm không in tem'
            )
          )
        )
        :h('div',{className:'g2'},
          h(F,{label:'Số gói / số tem'},h('input',{type:'number',min:1,step:1,value:packQty,onChange:e=>setPackQty(e.target.value),disabled:!productNeedsLabel,placeholder:'Ví dụ: 14'})),
          h(F,{label:'Kg mỗi gói / tem'},h('input',{type:'number',min:0,step:'0.01',value:packWeight,onChange:e=>setPackWeight(e.target.value),disabled:!productNeedsLabel,placeholder:defaultPackWeight?String(defaultPackWeight):'Ví dụ: 5'}))
        ),
      h('div',{style:{background:'var(--bg2)',padding:'10px 12px',borderRadius:'var(--r)',fontSize:12,color:'var(--tx2)',marginBottom:'1rem'}},
        h('div',{style:{fontWeight:600,color:'var(--pri3)',marginBottom:6}},'Kết quả tách tem'),
        h('div',null,summaryLine),
        templateType==='100x100'&&defaultPackWeight>0&&h('div',{style:{marginTop:6}},'Khối lượng mặc định của sản phẩm: ',h('b',null,formatKg(defaultPackWeight)),'kg / ',selectedProduct?.unit||'gói')
      ),
      h(Row,null,
        h('button',{className:'bp',onClick:openLabelWindow,style:{padding:'8px 20px'}},h('i',{className:'ti ti-printer',style:{fontSize:15}}),'Tạo tem và mở in')
      )
    )
  );
}

function DeliveryOrdersTab({orders,setOrders,customers,setCustomers,products,prodCats,quotes,employees,currentUser,trips,setTrips,company,prodShifts,prodShiftRules,shifts,menuHidden,setMenuHidden,printTemplateSettings}){
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[print,spr]=useState(null);const[invoiceView,setInvoiceView]=useState(null);const[q,sq]=useState('');const[filter,sf]=useState('all');const[sortMode,setSortMode]=useState('area');const _td0=fmtDate();const _ti0=_td0.split('/').reverse().join('-');const[fDate,sfDate]=useState(_ti0);const[fPoint,sfPoint]=useState('');const[fTime,sfTime]=useState('');const[fArea,sfArea]=useState('');let oSeq=orders.length+1;
  const deliveryTopScroll=useRef(null);
  const deliveryTableScroll=useRef(null);
  const normArea=v=>String(v||'').trim().replace(/\s+/g,' ').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/Đ/g,'D').replace(/đ/g,'d').toUpperCase();
  const areaKey=v=>normArea(v).replace(/[^A-Z0-9]/g,'');
  const sameArea=(a,b)=>{
    const ak=areaKey(a), bk=areaKey(b);
    if(!ak||!bk)return false;
    if(ak==='CHUAPHANKHUVUC'||bk==='CHUAPHANKHUVUC')return false;
    return ak===bk||ak.includes(bk)||bk.includes(ak);
  };
  const orderContext=o=>{
    const resolved=findOrderPointMatch(o,customers||[]);
    const pt=resolved?.point||{};
    const cust=resolved?.customer||{};
    return {
      ...o,
      deliveryTime:normalizeTimeInput(o?.deliveryTime||''),
      pointId:pt.id||o?.pointId||'',
      pointName:pt.name||o?.pointName||o?.address||'',
      address:pt.address||o?.address||'',
      area:pt.area||o?.area||'',
      customerId:cust.id||o?.customerId||'',
      customer:cust.name||o?.customer||''
    };
  };
  useEffect(()=>{
    const onKey=e=>{
      if((e.ctrlKey||e.metaKey)&&!e.altKey&&String(e.key||'').toLowerCase()==='d'){
        e.preventDefault();
        if(!modal&&!print&&!invoiceView){se(null);sm('f');}
      }
    };
    document.addEventListener('keydown',onKey,true);
    return()=>document.removeEventListener('keydown',onKey,true);
  },[modal,print,invoiceView]);
  useEffect(()=>{
    const top=deliveryTopScroll.current, body=deliveryTableScroll.current;
    if(!top||!body)return;
    let lock=false;
    const syncTop=()=>{if(lock)return;lock=true;body.scrollLeft=top.scrollLeft;lock=false;};
    const syncBody=()=>{if(lock)return;lock=true;top.scrollLeft=body.scrollLeft;lock=false;};
    top.addEventListener('scroll',syncTop);
    body.addEventListener('scroll',syncBody);
    return()=>{top.removeEventListener('scroll',syncTop);body.removeEventListener('scroll',syncBody);};
  },[]);
  const save=d=>{if(edit)applyOrdersAndTripSync(p=>p.map(x=>x.id===edit.id?d:x));else{const datePart=(d.deliveryDate||fmtDate()).split('/').slice(0,2).join('');const id='DGH'+datePart+String(oSeq++).toString().padStart(3,'0');applyOrdersAndTripSync(p=>[...p,{...d,id,createdAt:fmtDate()}]);}sm(null);se(null);};
  const saveInvoiceImage=async(order,file)=>{
    if(!file)return;
    try{
      const url=await uploadPhoto(file,'order-invoices/'+(order.id||'order'));
      setOrders(prev=>prev.map(x=>x.id===order.id?{...x,invoiceImage:url,invoiceImageName:file.name||'hoa-don.jpg',invoiceUploadedAt:fmtDT(),invoiceUploadedBy:currentUser?.name||''}:x));
    }catch(e){window.showToast('Không đọc được ảnh hóa đơn: '+(e.message||e),'error');}
  };
  const pickInvoiceImage=order=>{
    const inp=document.createElement('input');
    inp.type='file';inp.accept='image/*';inp.capture='environment';
    inp.onchange=e=>saveInvoiceImage(order,e.target.files&&e.target.files[0]);
    inp.click();
  };
  const del=id=>{
    if(confirm('Xóa đơn hàng?'))applyOrdersAndTripSync(p=>p.filter(x=>x.id!==id));
  };
  const sts=[['all','Tất cả'],['pending','Chờ xếp'],['assigned','Đã xếp'],['delivering','Đang giao'],['done','Đã giao'],['failed','Giao lỗi'],['cancelled','Hủy']];
  const getArea=o=>{
    const direct=String(o?.area||'').trim();
    if(direct&&areaKey(direct)!=='CHUAPHANKHUVUC')return direct;
    const resolved=findOrderPointMatch(o,customers||[]);
    const areaFromPoint=String(resolved?.point?.area||'').trim();
    if(areaFromPoint&&areaKey(areaFromPoint)!=='CHUAPHANKHUVUC')return areaFromPoint;
    return '';
  };
  const tripDateOptionsForOrder=o=>[o?.deliveryDate,addDaysVN(o?.deliveryDate,-1),getOrderTripDate(o,prodShifts||[])].filter(Boolean).filter((v,i,a)=>a.indexOf(v)===i);
  const tripOptionsForOrder=o=>{
    const dateSet=new Set(tripDateOptionsForOrder(o));
    return (trips||[]).filter(t=>!t.deliveryDate||dateSet.has(t.deliveryDate)||t.id===o.tripId);
  };
  const tripMatchesArea=(trip,area)=>!!area&&(sameArea(trip?.area,area)||sameArea(trip?.shiftName,area));
  const tripMatchesShift=(trip,shiftId,shiftName)=>{
    const desiredId=String(shiftId||'').trim();
    const desiredName=normalizeLookupText(shiftName||'');
    const tripId=String(trip?.shiftId||'').trim();
    const tripName=normalizeLookupText(trip?.shiftName||'');
    return (!!desiredId&&tripId===desiredId)|| (!!desiredName&&tripName===desiredName);
  };
  const autoTripForOrder=o=>{
    const ctx=orderContext(o);
    const preferredDate=getOrderTripDate(ctx,prodShifts||[])||'';
    const preferredShiftId=getOrderTripShiftId(ctx,prodShifts||[]);
    const preferredShiftName=getOrderTripShiftName(ctx,prodShifts||[]);
    const area=getArea(ctx);
    const options=tripOptionsForOrder(ctx);
    if(!options.length||!preferredDate)return null;
    const sameAreaOptions=area?options.filter(t=>tripMatchesArea(t,area)):[];
    if(sameAreaOptions.length){
      const byDate=preferredDate?sameAreaOptions.filter(t=>t.deliveryDate===preferredDate):sameAreaOptions;
      if(preferredDate&&!byDate.length)return null;
      return [...byDate].sort((a,b)=>{
        const ad=parseAnyDate(a.deliveryDate||''),bd=parseAnyDate(b.deliveryDate||'');
        const byDate=(bd?.getTime?.()||0)-(ad?.getTime?.()||0);
        if(byDate)return byDate;
        const score=t=>(tripMatchesShift(t,preferredShiftId,preferredShiftName)?60:0)+(t.id===o.tripId?20:0);
        return score(b)-score(a)||(String(a.id||'').localeCompare(String(b.id||''),'vi'));
      })[0]||null;
    }
    const shiftOptions=(preferredShiftId||preferredShiftName)?options.filter(t=>tripMatchesShift(t,preferredShiftId,preferredShiftName)):[]; 
    if(shiftOptions.length){
      const byDate=preferredDate?shiftOptions.filter(t=>t.deliveryDate===preferredDate):shiftOptions;
      if(preferredDate&&!byDate.length)return null;
      return [...byDate].sort((a,b)=>{
        const ad=parseAnyDate(a.deliveryDate||''),bd=parseAnyDate(b.deliveryDate||'');
        const byDate=(bd?.getTime?.()||0)-(ad?.getTime?.()||0);
        if(byDate)return byDate;
        const score=t=>(t.id===o.tripId?20:0);
        return score(b)-score(a)||(String(a.id||'').localeCompare(String(b.id||''),'vi'));
      })[0]||null;
    }
    const candidates=preferredDate?options.filter(t=>t.deliveryDate===preferredDate):options;
    if(!candidates.length)return null;
    return [...candidates].sort((a,b)=>{
      const score=t=>(t.deliveryDate===preferredDate?100:0)+(t.id===o.tripId?20:0)+(tripMatchesArea(t,area)?10:0);
      const diff=score(b)-score(a);
      if(diff)return diff;
      const ad=parseAnyDate(a.deliveryDate||''),bd=parseAnyDate(b.deliveryDate||'');
      const byDate=(bd?.getTime?.()||0)-(ad?.getTime?.()||0);
      if(byDate)return byDate;
      return String(a.id||'').localeCompare(String(b.id||''),'vi');
    })[0]||null;
  };
  const syncTripOrderIds=nextOrders=>{
    let changed=false;
    const nextTrips=(trips||[]).map(t=>{
      const desired=nextOrders.filter(o=>o.tripId===t.id).map(o=>o.id);
      const current=t.orderIds||[];
      if(desired.length!==current.length||desired.some((id,idx)=>id!==current[idx])){
        changed=true;
        return {...t,orderIds:desired};
      }
      return t;
    });
    if(changed)setTrips(nextTrips);
  };
  // Chỉ ghi dữ liệu tự động khi người dùng thao tác hoặc bấm cập nhật,
  // tránh vừa mở tab đã quét + lưu lại toàn bộ đơn hàng.
  const applyOrdersAndTripSync=updater=>{
    setOrders(prev=>{
      const nextOrders=typeof updater==='function'?updater(prev):updater;
      syncTripOrderIds(nextOrders);
      return nextOrders;
    });
  };
  const setOrderTripMode=(order,mode)=>{
    if(mode==='manual'){
      const currentTripId=order.tripId||autoTripForOrder(order)?.id||null;
      applyOrdersAndTripSync(prev=>prev.map(x=>x.id===order.id?{...x,tripAssignMode:'manual',tripId:currentTripId,status:currentTripId?'assigned':'pending'}:x));
      return;
    }
    applyOrdersAndTripSync(prev=>prev.map(x=>x.id===order.id?{...x,tripAssignMode:'auto'}:x));
  };
  const assignTripManually=(order,newTripId)=>{
    applyOrdersAndTripSync(prev=>prev.map(x=>x.id===order.id?{...x,tripAssignMode:'manual',tripId:newTripId||null,status:newTripId?'assigned':'pending'}:x));
  };
  const list=orders.filter(x=>{
    if(filter!=='all'&&x.status!==filter) return false;
    if(q&&!x.customer.toLowerCase().includes(q.toLowerCase())&&!x.id.toLowerCase().includes(q.toLowerCase())&&!x.pointName.toLowerCase().includes(q.toLowerCase())) return false;
    if(fDate){const d=fDate.split('-').reverse().join('/');if(x.deliveryDate!==d) return false;}
    if(fPoint&&!x.pointName.toLowerCase().includes(fPoint.toLowerCase())) return false;
    if(fTime&&normalizeTimeInput(x.deliveryTime||'')!==fTime) return false;
    if(fArea&&getArea(x)!==fArea) return false;
    return true;
  });
  const updateAutoProductionTimes=()=>{
    const targetIds=new Set(list.filter(o=>o.status!=='cancelled'&&o.tripAssignMode!=='manual').map(o=>o.id));
    let changed=0,lineChanged=0,miss=0;
    const nextOrders=orders.map(o=>{
      if(!targetIds.has(o.id))return o;
      const ctx=orderContext(o);
      const autoShift=getProdShiftForOrder({...ctx,deliveryTime:o.deliveryTime},prodShifts||[],customers||[]);
      if(!autoShift){miss++;return o;}
      const autoProdTime=autoShift.actualProdTime||autoShift.endTime||'';
      const autoProdDate=addDaysVN(o.deliveryDate,autoShift.prodDateOffset||0);
      const autoLabelTime=autoShift.labelPrintTime||'';
      const autoLabelDate=addDaysVN(o.deliveryDate,autoShift.labelPrintDateOffset||0);
      const nextCtx={...ctx,area:ctx.area||'',prodShiftId:autoShift.id};
      const autoTrip=autoTripForOrder(nextCtx);
      const nextTripId=autoTrip?.id||null;
      const nextStatus=nextTripId?'assigned':'pending';
      let touched=o.prodShiftId!==autoShift.id||o.tripId!==nextTripId||o.status!==nextStatus||o.tripAssignMode!=='auto';
      const lines=(o.lines||[]).map(l=>{
        if(l.shiftOverride)return l;
        const next={...l,prodTime:autoProdTime,prodDate:autoProdDate,labelTime:autoLabelTime,labelDate:autoLabelDate};
        if(l.prodTime!==next.prodTime||l.prodDate!==next.prodDate||l.labelTime!==next.labelTime||l.labelDate!==next.labelDate){lineChanged++;touched=true;}
        return next;
      });
      if(touched)changed++;
      return touched?{...o,prodShiftId:autoShift.id,tripId:nextTripId,tripAssignMode:'auto',status:nextStatus,lines,updatedAt:fmtDT(),updatedBy:currentUser?.name||''}:o;
    });
    applyOrdersAndTripSync(nextOrders);
    window.showToast('Đã cập nhật tự động ca SX, ngày SX, giờ SX, ngày in tem, giờ in tem và chuyến xe cho '+changed+' đơn, '+lineChanged+' dòng'+(miss?'. '+miss+' đơn chưa tìm thấy ca SX.':''),'success',7000);
  };
  const orderLineQty=l=>numFmt(l.qtyInvoice)||numFmt(l.qtyProd)||numFmt(l.qty)||numFmt(l.quantity)||0;
  const orderLineWeight=l=>{
    const p=products?.find(x=>x.id===l.productId);
    const unit=String(l.unit||p?.unit||'').trim().toLowerCase().replace(/[^a-z]/g,'');
    const qty=orderLineQty(l);
    if(unit==='kg'||unit==='kgs'||unit==='kilogram'||unit==='kilograms')return qty;
    const wpu=p?.weightPerUnit||numFmt(l.weightPerUnit)||0;
    return wpu*qty;
  };
  const calcOrderWeight=o=>(o.lines||[]).reduce((s,l)=>s+orderLineWeight(l),0);
  const shiftScheduleMeta=(shifts||[]).map((sh,idx)=>({
    ...sh,
    _order:idx,
    _start:String(sh.timeStart||sh.startTime||'').trim(),
    _startMin:String(sh.timeStart||sh.startTime||'').trim()?timeToMin(sh.timeStart||sh.startTime):Number.MAX_SAFE_INTEGER
  }));
  const matchShiftSchedule=({shiftId,shiftName,area,deliveryTime}={})=>{
    const desiredId=String(shiftId||'').trim();
    const desiredName=normalizeLookupText(shiftName||'');
    const desiredArea=String(area||'').trim();
    const desiredTime=String(deliveryTime||'').trim();
    const scoreShift=sh=>{
      let score=0;
      if(desiredId&&String(sh.id||'').trim()===desiredId)score+=5000;
      const shName=normalizeLookupText(sh.name||'');
      if(desiredName&&shName===desiredName)score+=1600;
      else if(desiredName&&shName&&(shName.includes(desiredName)||desiredName.includes(shName)))score+=900;
      if(desiredArea&&sameArea(sh.area,desiredArea))score+=700;
      const shTime=String(sh.timeStart||sh.startTime||'').trim();
      if(desiredTime&&shTime===desiredTime)score+=1200;
      return score;
    };
    const ranked=shiftScheduleMeta
      .map(sh=>({sh,score:scoreShift(sh)}))
      .filter(x=>x.score>0)
      .sort((a,b)=>b.score-a.score||a.sh._order-b.sh._order||a.sh._startMin-b.sh._startMin||(String(a.sh.id||'').localeCompare(String(b.sh.id||''),'vi')));
    return ranked[0]?.sh||null;
  };
  const tripGroupLabel=t=>{
    if(!t)return 'Chưa có chuyến';
    const parts=[t.deliveryDate,t.shiftName,t.area].filter(Boolean);
    return parts.join(' · ')||t.id||'Chưa có chuyến';
  };
  const orderMeta=list.map(o=>{
    const ctx=orderContext(o);
    const totalW=calcOrderWeight(ctx);
    const tripMode=o.tripAssignMode==='manual'?'manual':'auto';
    const autoTrip=autoTripForOrder(ctx);
    const manualTrip=ctx.tripId?(trips||[]).find(t=>t.id===ctx.tripId):null;
    const effectiveTrip=tripMode==='manual'?(manualTrip||autoTrip||null):autoTrip;
    const preferredTripDate=getOrderTripDate(ctx,prodShifts||[])||'';
    const preferredTripShiftName=getOrderTripShiftName(ctx,prodShifts||[])||'';
    const area=getArea(ctx)||'';
    return {...o,_ctx:ctx,_totalW:totalW,_autoTrip:autoTrip,_effectiveTrip:effectiveTrip,_preferredTripDate:preferredTripDate,_preferredTripShiftName:preferredTripShiftName,_area:area};
  });
  const groupInfoForOrder=o=>{
    if(sortMode==='trip'){
      if(o._effectiveTrip){
        const label=tripGroupLabel(o._effectiveTrip);
        const tripDateObj=parseAnyDate(o._effectiveTrip.deliveryDate||'');
        const shiftMeta=matchShiftSchedule({shiftId:o._effectiveTrip.shiftId,shiftName:o._effectiveTrip.shiftName,area:o._effectiveTrip.area,deliveryTime:o._effectiveTrip.deliveryTime});
        return {
          key:'trip:'+(o._effectiveTrip.id||tripGroupLabel(o._effectiveTrip)),
          label,
          summaryLabel:label,
          mode:'trip',
          sortDate:tripDateObj?tripDateObj.getTime():Number.MAX_SAFE_INTEGER,
          sortShiftOrder:shiftMeta?shiftMeta._order:Number.MAX_SAFE_INTEGER,
          sortShiftTime:shiftMeta?shiftMeta._startMin:(String(o._effectiveTrip.deliveryTime||'').trim()?timeToMin(o._effectiveTrip.deliveryTime):Number.MAX_SAFE_INTEGER),
          sortText:label
        };
      }
      const pendingKey=[o._preferredTripDate,o._preferredTripShiftName||o._area||''].join('|');
      const pendingLabel=[o._preferredTripDate,o._preferredTripShiftName||o._area].filter(Boolean).join(' · ');
      const label=(pendingLabel?pendingLabel+' · ':'')+'Chưa tạo chuyến';
      const pendingDateObj=parseAnyDate(o._preferredTripDate||'');
      const shiftMeta=matchShiftSchedule({shiftName:o._preferredTripShiftName,area:o._area,deliveryTime:o._ctx?.deliveryTime});
      return {
        key:'trip:pending:'+pendingKey,
        label,
        summaryLabel:label,
        mode:'trip',
        sortDate:pendingDateObj?pendingDateObj.getTime():Number.MAX_SAFE_INTEGER,
        sortShiftOrder:shiftMeta?shiftMeta._order:Number.MAX_SAFE_INTEGER,
        sortShiftTime:shiftMeta?shiftMeta._startMin:(String(o._ctx?.deliveryTime||'').trim()?timeToMin(o._ctx.deliveryTime):Number.MAX_SAFE_INTEGER),
        sortText:pendingLabel||'Chưa tạo chuyến'
      };
    }
    return {
      key:'area:'+areaKey(o._area||''),
      label:o._area||'Chưa phân khu vực',
      summaryLabel:o._area||'Chưa phân khu vực',
      mode:'area',
      sortDate:0,
      sortText:o._area||'Chưa phân khu vực'
    };
  };
  const sortedList=[...orderMeta].sort((a,b)=>{
    const ga=groupInfoForOrder(a),gb=groupInfoForOrder(b);
    if(sortMode==='trip'){
      const dateCmp=(ga.sortDate||0)-(gb.sortDate||0);
      if(dateCmp!==0)return dateCmp;
      const shiftOrderCmp=(ga.sortShiftOrder??Number.MAX_SAFE_INTEGER)-(gb.sortShiftOrder??Number.MAX_SAFE_INTEGER);
      if(shiftOrderCmp!==0)return shiftOrderCmp;
      const shiftTimeCmp=(ga.sortShiftTime??Number.MAX_SAFE_INTEGER)-(gb.sortShiftTime??Number.MAX_SAFE_INTEGER);
      if(shiftTimeCmp!==0)return shiftTimeCmp;
      const groupCmp=(ga.sortText||'').localeCompare(gb.sortText||'','vi');
      if(groupCmp!==0)return groupCmp;
    }else{
      const areaCmp=(ga.sortText||'zzz').localeCompare(gb.sortText||'zzz','vi');
      if(areaCmp!==0)return areaCmp;
    }
    if(sortMode==='trip'){
      const timeCmp=(a._ctx.deliveryTime||'').localeCompare(b._ctx.deliveryTime||'');
      if(timeCmp!==0)return timeCmp;
    }
    const pointCmp=(a._ctx.pointName||'').localeCompare(b._ctx.pointName||'','vi');
    if(pointCmp!==0)return pointCmp;
    return sortMode==='trip'?String(a.id||'').localeCompare(String(b.id||''),'vi'):(a._ctx.deliveryTime||'').localeCompare(b._ctx.deliveryTime||'');
  });
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  const labelPackRule=line=>{
    const product=(products||[]).find(p=>String(p.id||'')===String(line?.productId||''))||null;
    return resolveProductLabelPackRule(product,line?.productName||product?.name||'');
  };
  const pacPackWeight=line=>{
    const product=(products||[]).find(p=>String(p.id||'')===String(line?.productId||''))||null;
    const explicit=numFmt(product?.weightPerUnit)||numFmt(line?.weightPerUnit)||0;
    if(explicit>0)return explicit;
    const text=[line?.productName,product?.name,line?.customerProductName,product?.custName].filter(Boolean).join(' ').toUpperCase();
    const m=text.match(/(\d+(?:[.,]\d+)?)\s*KG\s*\/\s*PAC\b/);
    return m?numFmt(String(m[1]).replace(',','.')):0;
  };
  const isPacPackageLine=line=>{
    const product=(products||[]).find(p=>String(p.id||'')===String(line?.productId||''))||null;
    const text=[line?.productName,product?.name,line?.customerProductName,product?.custName].filter(Boolean).join(' ').toUpperCase();
    const unit=String(line?.unit||product?.unit||'').trim().toLowerCase();
    return text.includes('/PAC')||text.includes('KG/PAC')||(/\bpac\b/i.test(text)&&/gói|goi/i.test(unit));
  };
  const splitLabelWeights=(totalKg,line)=>{
    const rule=labelPackRule(line);
    if(!rule.enabled)return [];
    if(isPacPackageLine(line)){
      const packCount=Math.max(0,Math.round(orderLineQty(line)));
      const perPackWeight=Number(pacPackWeight(line)||0);
      if(!(packCount>0) || !(perPackWeight>0))return [];
      return Array.from({length:packCount},()=>perPackWeight);
    }
    const kg=Number(numFmt(totalKg)||0);
    if(!(kg>0))return [];
    const pack=Number(rule.pack||10);
    const full=Math.floor(kg/pack);
    const rem=Number((kg-full*pack).toFixed(2));
    const parts=Array.from({length:full},()=>pack);
    if(rem>0){
      if(rule.mergeSmallRemainder&&rem<2&&parts.length)parts[parts.length-1]=Number((parts[parts.length-1]+rem).toFixed(2));
      else parts.push(rem);
    }
    return parts;
  };
  const labelLinesForOrder=o=>{
    const plan=prodShiftPlan(o,prodShifts||[],prodShiftRules);
    const labels=[];
    (o.lines||[]).forEach(l=>{
      const kg=orderLineWeight(l);
      if(!kg)return;
      splitLabelWeights(kg,l).forEach(partKg=>labels.push({line:l,kg:partKg,plan,order:o}));
    });
    return labels;
  };
  const cleanPacProductName=name=>String(name||'')
    .replace(/\s+/g,' ')
    .replace(/\s*,\s*\d+(?:[.,]\d+)?\s*KG\s*\/\s*PAC\b/ig,'')
    .replace(/\s+\d+(?:[.,]\d+)?\s*KG\s*\/\s*PAC\b/ig,'')
    .replace(/\s*,\s*PAC\b/ig,'')
    .trim()
    .toUpperCase();
  const buildLabelSummaryHtml=labels=>{
    const summaryMap=new Map();
    labels.forEach(it=>{
      const product=String(it.line?.productName||'Sản phẩm').trim()||'Sản phẩm';
      const kgKey=String(numFmt(it.kg));
      const productMap=summaryMap.get(product)||new Map();
      const current=productMap.get(kgKey)||{kg:numFmt(it.kg),count:0};
      current.count+=1;
      productMap.set(kgKey,current);
      summaryMap.set(product,productMap);
    });
    return [...summaryMap.entries()].map(([product,weightMap])=>{
      const parts=[...weightMap.values()]
        .sort((a,b)=>b.kg-a.kg)
        .map(item=>'<span class="summary-chip">'+esc(Number(item.kg||0).toLocaleString('vi-VN',{maximumFractionDigits:2}))+'kg × '+item.count+'</span>')
        .join('');
      return '<div class="summary-row"><div class="summary-product">'+esc(product)+'</div><div class="summary-parts">'+parts+'</div></div>';
    }).join('');
  };
  const buildPrintOrderSummaryHtml=ordersForPrint=>{
    const list=(Array.isArray(ordersForPrint)?ordersForPrint:[ordersForPrint]).filter(Boolean);
    const points=[...new Set(list.map(o=>String(o?.pointName||'').trim()).filter(Boolean))];
    const pointLabel=points.length<=1?(points[0]||'Chưa có địa điểm'):(points.length+' địa điểm');
    const grouped=new Map();
    list.forEach(o=>{
      (o?.lines||[]).filter(Boolean).forEach(line=>{
        const product=String(line?.productName||'Sản phẩm').trim()||'Sản phẩm';
        const unit=String(line?.unit||((products||[]).find(p=>String(p.id||'')===String(line?.productId||''))||{}).unit||'').trim();
        const key=product+'__'+unit;
        const current=grouped.get(key)||{product,unit,qty:0};
        current.qty+=orderLineQty(line);
        grouped.set(key,current);
      });
    });
    const rows=[...grouped.values()]
      .map(item=>'<div class="summary-row"><div class="summary-product">'+esc(item.product)+'</div><div class="summary-parts"><span class="summary-chip">'+esc(Number(item.qty||0).toLocaleString('vi-VN',{maximumFractionDigits:2})+(item.unit?' '+item.unit:''))+'</span></div></div>')
      .join('');
    return {
      pointLabel,
      rows: rows||'<div class="summary-row"><div class="summary-product">Chưa có sản phẩm</div></div>'
    };
  };
  const buildClassicLabelSvg=(it,o)=>{
    const l=it.line;
    const product=l.productName||'';
    const nsx=it.plan?.prodDate||o.deliveryDate||'';
    const gioSx=(it.plan?.prodTime||'').replace(':','H').replace(/H00$/,'H');
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
        '<text x="22" y="154" font-family="Arial,sans-serif" font-size="23">ĐC: Tổ 1. P.Mỏ Chè, Sông Công, T.Thái Nguyên</text>'+
        '<text x="22" y="196" font-family="Arial,sans-serif" font-size="23" font-weight="700">SĐT : 0969709878</text>'+
        '<text x="258" y="196" font-family="Arial,sans-serif" font-size="23">THÀNH PHẦN: Bột gạo, nước</text>'+
        '<text x="22" y="238" font-family="Arial,sans-serif" font-size="23">HDSD: '+esc(hdsd)+'</text>'+
        '<text x="512" y="238" font-family="Arial,sans-serif" font-size="25" text-anchor="end"><tspan font-weight="700">PH</tspan> 5-8</text>'+
        '<text x="22" y="280" font-family="Arial,sans-serif" font-size="23">K.cáo: Không dùng khi biến màu hoặc có mùi lạ</text>'+
        '<text x="22" y="322" font-family="Arial,sans-serif" font-size="26" font-weight="700">NSX:</text>'+
        '<text x="132" y="322" font-family="Arial,sans-serif" font-size="26" font-weight="700">'+esc(nsx)+'</text>'+
        '<text x="342" y="322" font-family="Arial,sans-serif" font-size="26" font-weight="700">GIỜ SX</text>'+
        '<text x="512" y="322" font-family="Arial,sans-serif" font-size="26" font-weight="700" text-anchor="end">'+esc(gioSx)+'</text>'+
        '<text x="28" y="364" font-family="Arial,sans-serif" font-size="23">HSD: 24H</text>'+
        '<text x="170" y="364" font-family="Arial,sans-serif" font-size="23">FORMOL: 0</text>'+
        '<text x="302" y="364" font-family="Arial,sans-serif" font-size="23">HÀN THE: 0</text>'+
        '<text x="552" y="364" font-family="Arial,sans-serif" font-size="23" text-anchor="end">BQ: 0-10°C</text>'+
      '</svg>'
    );
  };
  const buildPacLabelSvg=(it,o)=>{
    const l=it.line;
    const matchedPoint=(customers||[])
      .flatMap(c=>(c.points||[]))
      .find(p=>p.id===o.pointId||p.id===o.ptId||p.name===o.pointName);
    const pointName=String(matchedPoint?.name||o.pointName||'KHO VẬN').toUpperCase();
    const product=cleanPacProductName(l.productName||'');
    const kgNum=Number(it.kg||0).toLocaleString('vi-VN',{maximumFractionDigits:2});
    const nsx=it.plan?.prodDate||o.deliveryDate||'';
    const gioSx=String(it.plan?.prodTime||'').replace(':','H').replace(/H00$/,'H')||'';
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="1000" viewBox="0 0 1000 1000">'+
        '<rect width="1000" height="1000" fill="white"/>'+
        '<g transform="translate(28 41) scale(0.95)">'+
        '<rect x="0" y="0" width="1000" height="1006" fill="white" stroke="#111" stroke-width="6"/>'+
        '<text x="430" y="143" font-family="Times New Roman,serif" font-size="70" font-weight="700" text-anchor="middle">'+esc(product)+'</text>'+
        '<text x="804" y="143" font-family="Times New Roman,serif" font-size="70" font-weight="700" text-anchor="middle">'+esc(kgNum)+'</text>'+
        '<text x="922" y="143" font-family="Times New Roman,serif" font-size="52" font-weight="700" text-anchor="middle">KG</text>'+
        '<text x="72" y="245" font-family="Times New Roman,serif" font-size="32" font-weight="700">SP CỦA: CÔNG TY TNHH THỰC PHẨM SÔNG CÔNG</text>'+
        '<text x="72" y="329" font-family="Times New Roman,serif" font-size="32" font-weight="700">ĐC: Tổ 1. P.Mỏ Chè, Sông Công, T.Thái Nguyên</text>'+
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
  const openLabelPrintWindow=(labels,ordersForPrint,mode)=>{
    if(!labels.length)return;
    const isPacMode=mode==='pac';
    const isClassic58=!isPacMode;
    const pageSize=isPacMode?'100mm 100mm':'58mm 40mm';
    const labelWidth=isPacMode?'100mm':'58mm';
    const labelHeight=isPacMode?'100mm':'40mm';
    const contentWidth=isPacMode?'100mm':'58mm';
    const contentHeight=isPacMode?'100mm':'40mm';
    const title=isPacMode?'In tem kho vận ':'In tem ';
    const printOrders=(Array.isArray(ordersForPrint)?ordersForPrint:[ordersForPrint]).filter(Boolean);
    const orderSummary=buildPrintOrderSummaryHtml(printOrders);
    const cards=labels.map(it=>{
      const product=it.line?.productName||'';
      const orderForLabel=it.order||printOrders[0]||{};
      const svg=isPacMode?buildPacLabelSvg(it,orderForLabel):buildClassicLabelSvg(it,orderForLabel);
      const src='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
      return '<section class="label'+(isClassic58?' classic58':'')+'"><img class="label-img'+(isClassic58?' classic58-img':'')+'" alt="Tem '+esc(product)+'" src="'+src+'"></section>';
    }).join('');
    const w=window.open('','_blank');
    if(!w){window.showToast('Trình duyệt đang chặn cửa sổ in tem. Hãy cho phép popup rồi thử lại.','warn');return;}
    const titleSuffix=printOrders.length===1?String(printOrders[0]?.id||''):String(printOrders.length)+' đơn';
    w.document.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>'+title+esc(titleSuffix)+'</title><style>'+
      '@page{size:'+pageSize+';margin:0}'+
      '*{box-sizing:border-box}'+
      'html,body{margin:0;padding:0;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}'+
      'body{font-family:Arial,"Times New Roman",serif;color:#111;padding:10px}'+
      '.summary{margin-bottom:10px;padding:10px 12px;border:1px solid #cfe0d7;border-radius:10px;background:#f4faf7}'+
      '.summary-title{font-size:14px;font-weight:700;margin-bottom:8px}'+
      '.summary-sub{font-size:12px;color:#355447;margin-bottom:8px}'+
      '.summary-row{display:flex;align-items:flex-start;gap:8px;justify-content:space-between;margin-bottom:6px}'+
      '.summary-row:last-child{margin-bottom:0}'+
      '.summary-product{font-size:13px;font-weight:700;min-width:170px}'+
      '.summary-parts{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end}'+
      '.summary-chip{display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;background:#fff;border:1px solid #b9d1c3;font-size:12px;font-weight:700;color:#234234}'+
      '.labels{display:flex;flex-direction:column;gap:0}'+
      '.label{position:relative;display:block;width:'+labelWidth+';height:'+labelHeight+';overflow:hidden;break-after:page;page-break-after:always}'+
      '.label:last-child{break-after:auto;page-break-after:auto}'+
      '.label-img{display:block;width:'+labelWidth+';height:'+labelHeight+';image-rendering:high-quality;-webkit-user-select:none;user-select:none}'+
      '.label.classic58{width:58mm;height:40mm}'+
      '.label-img.classic58-img{position:static;width:58mm;height:40mm;transform:none}'+
      '@media print{body{padding:0}.summary{display:none}.labels{display:block}.label.classic58{width:58mm;height:40mm}.label-img.classic58-img{position:static;width:'+contentWidth+';height:'+contentHeight+';transform:rotate(180deg);transform-origin:center center}}'+
      '<\/style><\/head><body><div class="summary"><div class="summary-title">Tóm tắt tem trước khi in</div><div class="summary-sub">Địa điểm: '+esc(orderSummary.pointLabel)+' · Tổng số tem: '+labels.length+' · Số đơn: '+printOrders.length+'</div>'+orderSummary.rows+'</div><div class="labels">'+cards+'<\/div><\/body><\/html>');
    w.document.close();
    setTimeout(()=>w.print(),400);
  };
  const printLabels=o=>{
    const labels=labelLinesForOrder(o);
    if(!labels.length){window.showToast('Đơn này chưa có số kg để in tem!','warn');return;}
    const pacLabels=labels.filter(it=>isPacPackageLine(it?.line));
    const classicLabels=labels.filter(it=>!isPacPackageLine(it?.line));
    if(pacLabels.length&&classicLabels.length)window.showToast('Đơn này có cả tem PAC kho vận và tem thường. Hệ thống sẽ mở 2 cửa sổ in riêng.','ok');
    if(pacLabels.length)openLabelPrintWindow(pacLabels,[o],'pac');
    if(classicLabels.length)openLabelPrintWindow(classicLabels,[o],'classic');
  };
  const printLabelsForOrders=ordersToPrint=>{
    const printOrders=(ordersToPrint||[]).filter(Boolean);
    if(!printOrders.length){window.showToast('Chọn ít nhất 1 đơn để in tem!','warn');return;}
    const labels=printOrders.flatMap(o=>labelLinesForOrder(o));
    if(!labels.length){window.showToast('Các đơn đã chọn chưa có dữ liệu để in tem!','warn');return;}
    const pacLabels=labels.filter(it=>isPacPackageLine(it?.line));
    const classicLabels=labels.filter(it=>!isPacPackageLine(it?.line));
    if(pacLabels.length&&classicLabels.length)window.showToast('Danh sách đang có cả tem PAC kho vận và tem thường. Hệ thống sẽ mở 2 cửa sổ in riêng.','ok');
    if(pacLabels.length)openLabelPrintWindow(pacLabels,printOrders,'pac');
    if(classicLabels.length)openLabelPrintWindow(classicLabels,printOrders,'classic');
  };
  const orderTableRows=[];
  let currentGroup=null,groupKL=0,groupCount=0;
  sortedList.forEach((o,i)=>{
    const group=groupInfoForOrder(o);
    if(!currentGroup||group.key!==currentGroup.key){
      if(currentGroup)orderTableRows.push({_sub:true,group:currentGroup,kl:groupKL,cnt:groupCount});
      currentGroup=group;groupKL=0;groupCount=0;
      orderTableRows.push({_hdr:true,group});
    }
    groupKL+=o._totalW;groupCount++;
    orderTableRows.push(o);
    if(i===sortedList.length-1&&currentGroup)orderTableRows.push({_sub:true,group:currentGroup,kl:groupKL,cnt:groupCount});
  });
  return h('div',{className:'delivery-page'+(menuHidden?' compact-menu':'')},
    h('div',{className:'delivery-sticky-head'},
      h('div',{className:'delivery-title-row',style:{marginBottom:10}},
        h('div',{className:'delivery-status-row'},sts.map(([v,l])=>h('button',{key:v,className:'pill'+(filter===v?' on':''),onClick:()=>sf(v)},l+' ('+(v==='all'?orders.length:orders.filter(x=>x.status===v).length)+')'))),
        h('div',{className:'delivery-title-actions'},
          h('button',{
            onClick:()=>sm('imageImport'),
            style:{padding:'6px 12px',fontSize:12,display:'flex',alignItems:'center',gap:5,background:'#6D28D9',color:'#fff',border:'none',borderRadius:'var(--r)',cursor:'pointer'}
          },h('i',{className:'ti ti-photo-scan',style:{fontSize:14}}),'Lấy đơn từ ảnh'),
          h('button',{
            onClick:()=>sm('print'),
            style:{padding:'6px 12px',fontSize:12,display:'flex',alignItems:'center',gap:5,background:'#185FA5',color:'#fff',border:'none',borderRadius:'var(--r)',cursor:'pointer'}
          },h('i',{className:'ti ti-printer',style:{fontSize:14}}),'In phiếu KH'),
          h('button',{
            onClick:()=>sm('printlabels'),
            style:{padding:'6px 12px',fontSize:12,display:'flex',alignItems:'center',gap:5,background:'#8B5E00',color:'#fff',border:'none',borderRadius:'var(--r)',cursor:'pointer'}
          },h('i',{className:'ti ti-tags',style:{fontSize:14}}),'In tem nhiều đơn'),
          h('button',{
            onClick:updateAutoProductionTimes,
            title:'Cập nhật lại ca SX, ngày SX, giờ SX, chuyến xe, ngày in tem và giờ in tem cho các đơn đang dùng tự động trong danh sách đang lọc',
            style:{padding:'6px 12px',fontSize:12,display:'flex',alignItems:'center',gap:5,background:'#2d6a4f',color:'#fff',border:'none',borderRadius:'var(--r)',cursor:'pointer'}
          },h('i',{className:'ti ti-refresh',style:{fontSize:14}}),'Cập nhật SX + chuyến'),
          h('button',{
            title:'Import đơn hàng từ file Excel của khách hàng',
            onClick:()=>document.getElementById('import-from-customer-hidden')?.click(),
            style:{padding:'6px 12px',fontSize:12,display:'flex',alignItems:'center',gap:5,background:'var(--pri3)',color:'#fff',border:'none',borderRadius:'var(--r)',cursor:'pointer'}
          },h('i',{className:'ti ti-file-import',style:{fontSize:14}}),'Import từ KH'),
          h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Tạo đơn giao'})
        )
      ),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h('div',{style:{display:'flex',gap:6,flexWrap:'wrap',alignItems:'center',flex:'1 1 760px'}},
        h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm đơn hàng...',style:{flex:'1 1 160px',minWidth:130}}),
        h('input',{type:'date',value:fDate,onChange:e=>sfDate(e.target.value),
          title:'Ngày giao',
          style:{padding:'5px 8px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12,width:130}}),
        h('input',{type:'text',value:fPoint,onChange:e=>sfPoint(e.target.value),
          placeholder:'Địa điểm...',
          style:{padding:'5px 8px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12,width:110}}),
        h('select',{value:fTime,onChange:e=>sfTime(e.target.value),
          style:{padding:'5px 8px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12,width:100}},
          h('option',{value:''},'Tất cả giờ'),
          [...new Set(orders.map(o=>normalizeTimeInput(o.deliveryTime||'')).filter(Boolean))].sort((a,b)=>timeToMin(a)-timeToMin(b)||a.localeCompare(b,'vi')).map(t=>h('option',{key:t,value:t},t))
        ),
        h('select',{value:fArea,onChange:e=>sfArea(e.target.value),
          style:{padding:'5px 8px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:12,width:120}},
          h('option',{value:''},'Tất cả KV'),
          [...new Set(customers.flatMap(c=>(c.points||[]).map(p=>p.area)).filter(Boolean))].sort().map(a=>h('option',{key:a,value:a},a))
        ),
        (fDate||fPoint||fTime||fArea)&&h('button',{
          onClick:()=>{sfDate('');sfPoint('');sfTime('');sfArea('');},
          style:{padding:'5px 8px',fontSize:12,borderRadius:'var(--r)',border:'1px solid var(--bd)',cursor:'pointer',color:'var(--tx2)',whiteSpace:'nowrap'}
        },'✕'),
        (fDate||fPoint||fTime||fArea)&&h('span',{style:{fontSize:12,color:'var(--pri)',fontWeight:500,whiteSpace:'nowrap'}},
          list.length+' kết quả'
        ),
        h('div',{style:{display:'flex',alignItems:'center',gap:4,padding:3,border:'1px solid var(--bd)',borderRadius:999,background:'var(--bg2)'}},
          h('span',{style:{fontSize:11,color:'var(--tx2)',padding:'0 6px',whiteSpace:'nowrap'}},'Sắp xếp'),
          h('button',{
            type:'button',
            onClick:()=>setSortMode('area'),
            style:{padding:'5px 10px',fontSize:12,border:'none',borderRadius:999,cursor:'pointer',background:sortMode==='area'?'var(--pri)':'transparent',color:sortMode==='area'?'#fff':'var(--tx2)',fontWeight:600,whiteSpace:'nowrap'}
          },'Theo khu vực'),
          h('button',{
            type:'button',
            onClick:()=>setSortMode('trip'),
            style:{padding:'5px 10px',fontSize:12,border:'none',borderRadius:999,cursor:'pointer',background:sortMode==='trip'?'var(--pri)':'transparent',color:sortMode==='trip'?'#fff':'var(--tx2)',fontWeight:600,whiteSpace:'nowrap'}
          },'Theo chuyến')
        ),
        h(ExportBtn,{onClick:()=>{
          // Flatten orders + lines for Excel export
          const rows=[];
          list.forEach(o=>{
            if(!o.lines||o.lines.length===0){
              const plan=prodShiftPlan(o,prodShifts||[],prodShiftRules);
              rows.push({'Mã đơn':o.id,'Khách hàng':o.customer,'Ngày giao':o.deliveryDate,'Giờ giao':normalizeTimeInput(o.deliveryTime||''),'Điểm giao':o.pointName||'','Công đi':o.workOut||0,'Công về':o.workReturn||0,'Trạng thái':o.status,'Ghi chú đơn':o.note||'','Sản phẩm':'','ĐVT':'','SL Đặt':0,'SL hóa đơn':0,'Giá mua':0,'Thành tiền mua':0,'Ca SX':plan?.shift?.name||'','Giờ SX thực tế':plan?.prodTime||'','Ngày SX':plan?.prodDate||'','Giờ in tem':plan?.labelTime||'','Ngày in tem':plan?.labelDate||'','Ghi chú dòng':''});
            } else {
              o.lines.forEach((l,i)=>{
                const plan=i===0?prodShiftPlan(o,prodShifts||[],prodShiftRules):null;
                const buy=numFmt(l.purchasePrice||l.price);
                const qty=numFmt(l.qtyInvoice)||numFmt(l.qtyProd);
                rows.push({'Mã đơn':i===0?o.id:'','Khách hàng':i===0?o.customer:'','Ngày giao':i===0?o.deliveryDate:'','Giờ giao':i===0?normalizeTimeInput(o.deliveryTime||''):'','Điểm giao':i===0?(o.pointName||''):'','Công đi':i===0?(o.workOut||0):0,'Công về':i===0?(o.workReturn||0):0,'Trạng thái':i===0?o.status:'','Ghi chú đơn':i===0?(o.note||''):'',' Sản phẩm':l.productName||'','ĐVT':l.unit||'','SL Đặt':l.qtyProd||0,'SL hóa đơn':l.qtyInvoice||0,'Giá mua':buy,'Thành tiền mua':buy*qty,'Ca SX':i===0?(plan?.shift?.name||''):'','Giờ SX thực tế':i===0?(plan?.prodTime||''):'','Ngày SX':i===0?(plan?.prodDate||''):'','Giờ in tem':i===0?(plan?.labelTime||''):'','Ngày in tem':i===0?(plan?.labelDate||''):'','Ghi chú dòng':l.note||''});
              });
            }
          });
          const ws=XLSX.utils.json_to_sheet(rows);
          const wb=XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb,ws,'Don giao hang');
          XLSX.writeFile(wb,'Don_giao_hang_'+fmtDate().split('/').join('-')+'.xlsx');
        }}),
        h(ImportBtn,{onFile:rows=>{
          // Group rows by Mã đơn to reconstruct orders
          const orderMap={};
          rows.forEach(r=>{
            const id=(r['Mã đơn']||'').toString().trim();
            if(id){
              // New order header
              const seq=Object.keys(orderMap).length+1;
              orderMap[id]={
                id:id||('D'+new Date().getFullYear().toString().slice(-2)+String(seq).padStart(6,'0')),
                customer:r['Khách hàng']||'',custId:'',
                deliveryDate:r['Ngày giao']||fmtDate(),
                deliveryTime:normalizeTimeInput(r['Giờ giao']||''),
                prodShiftId:((prodShifts||[]).find(s=>(s.name||'')===(r['Ca SX']||''))||getProdShiftForOrder({deliveryTime:normalizeTimeInput(r['Giờ giao']||''),pointName:r['Điểm giao']||r['Địa điểm']||'',area:r['Khu vực']||'',address:r['Địa điểm']||'',customer:r['Khách hàng']||''},prodShifts||[],customers||[]))?.id||'',
                address:r['Địa chỉ']||'',
                pointName:r['Điểm giao']||'',ptId:'',
                workOut:r['Công đi']||0,workReturn:r['Công về']||0,
                status:r['Trạng thái']||'pending',
                note:r['Ghi chú đơn']||'',
                lines:[],createdAt:fmtDate(),updatedAt:fmtDT()
              };
              // Find custId
              const cust=customers.find(c=>c.name===r['Khách hàng']);
              if(cust){orderMap[id].custId=cust.id;}
            }
            // Add line to latest order
            const latestId=id||Object.keys(orderMap)[Object.keys(orderMap).length-1];
            const sp=r[' Sản phẩm']||r['Sản phẩm']||'';
            if(latestId&&orderMap[latestId]&&sp){
              const prod=products.find(p=>p.name===sp);
              orderMap[latestId].lines.push({
                id:uid(),
                productId:prod?prod.id:'',productName:sp,
                unit:r['ĐVT']||'',
                weightPerUnit:prod?prod.weightPerUnit||0:0,
                qtyProd:Number(r['SL Đặt']||r['SL đặt']||r['SL sản xuất'])||0,
                qtyInvoice:Number(r['SL hóa đơn'])||0,
                purchasePrice:numFmt(r['Giá mua']),
                price:numFmt(r['Giá mua']),
                shift:(r['Ca SX']||'').includes('đêm')?'night':'day',
                note:r['Ghi chú dòng']||''
              });
            }
          });
          const imported=Object.values(orderMap).filter(o=>o.customer);
          setOrders(p=>{
            const map={};p.forEach(x=>{map[x.id]=x;});
            imported.forEach(x=>{map[x.id]=map[x.id]?{...map[x.id],...x,lines:x.lines.length?x.lines:map[x.id].lines}:x;});
            return Object.values(map);
          });
          window.showToast('Đã nhập/cập nhật '+imported.length+' đơn hàng','success');
        }}),
        h('button',{
          type:'button',
          onClick:()=>setMenuHidden(v=>!v),
          title:(menuHidden?'Hiện lại header + menu web':'Ẩn header + menu web')+' (Ctrl + Shift + A)',
          style:{padding:'6px 12px',fontSize:12,border:'1px solid var(--bd)',borderRadius:'var(--r)',background:'#fff',color:'var(--tx2)',whiteSpace:'nowrap',display:'inline-flex',alignItems:'center',gap:5}
        },
          h('i',{className:'ti '+(menuHidden?'ti-layout-navbar-expand':'ti-layout-navbar-collapse'),style:{fontSize:14}}),
          menuHidden?'Hiện menu':'Ẩn menu'
        ),
        modal==='print'&&h(PrintByCustomerModal,{orders,customers,products,company,initialDate:fDate,onClose:()=>sm(null)}),
        modal==='printlabels'&&h(PrintLabelsMultiModal,{orders,customers,initialDate:fDate,onClose:()=>sm(null),onPrint:printLabelsForOrders}),
        modal==='importPreview'&&window._importData&&h(ImportPreviewModal,{data:window._importData,customers,setCustomers,orders,setOrders,onClose:()=>{sm(null);delete window._importData;}}),
        modal==='imageImport'&&h(ImageOrderImportModal,{customers,products,orders,setOrders,prodShifts,onClose:()=>sm(null)}),
        h('button',{
          onClick:()=>sm('imageImport'),
          style:{display:'none'}
        },h('i',{className:'ti ti-photo-scan',style:{fontSize:14}}),'Lấy đơn từ ảnh'),
        h('button',{
          id:'import-from-customer-hidden',
          title:'Import đơn hàng từ file Excel của khách hàng',
          style:{display:'none'},
          onClick:()=>{
            const inp=document.createElement('input');
            inp.type='file';inp.accept='.xlsx,.xls';
            inp.onchange=e=>{
              const file=e.target.files[0];if(!file)return;
              const reader=new FileReader();
              reader.onload=ev=>{
                const wb=XLSX.read(ev.target.result,{type:'binary'});
                const ws=wb.Sheets[wb.SheetNames[0]];
                const raw=XLSX.utils.sheet_to_json(ws,{header:1,defval:null});
                // Parse rows: [date, point, productStr, qtyHD, _, time]
                const orderMap={};
                const invalidDateRows=[];
                raw.forEach((r,idx)=>{
                  if(!r[1]||!r[2]) return;
                  // Format date
                  let dStr='';
                  if(r[0] instanceof Date||typeof r[0]==='number'){
                    const d=typeof r[0]==='number'?new Date(Math.round((r[0]-25569)*86400*1000)):r[0];
                    const excelDate=XLSX.SSF.parse_date_code(r[0]);
                    if(excelDate){dStr=String(excelDate.d).padStart(2,'0')+'/'+String(excelDate.m).padStart(2,'0')+'/'+excelDate.y;}
                    else{dStr=String(d.getDate()).padStart(2,'0')+'/'+String(d.getMonth()+1).padStart(2,'0')+'/'+d.getFullYear();}
                  } else if(typeof r[0]==='string') dStr=r[0];
                  const point=(r[1]||'').toString().trim();
                  const time=(r[5]||r[4]||'').toString().trim();
                  const dParts=(dStr||'').split('/');
                  const dd=(dParts[0]||'').toString().padStart(2,'0');
                  const mm=(dParts[1]||'').toString().padStart(2,'0');
                  const yyyy=(dParts[2]||'').toString();
                  const validDate=/^\d{2}$/.test(dd)&&/^\d{2}$/.test(mm)&&/^\d{4}$/.test(yyyy);
                  if(!validDate){
                    invalidDateRows.push(idx+1);
                    return;
                  }
                  const yy=yyyy.slice(-2);
                  const dateCode=yy+dd+mm;
                  const key=dStr+'|'+point+'|'+time;
      if(!orderMap[key]){
                    const autoProdShift=getProdShiftForOrder({deliveryTime:time,pointName:point,area:'',address:'',customer:''},prodShifts||[],customers||[]);
                    orderMap[key]={
                      id:'D'+dateCode+String(Object.keys(orderMap).length+1).padStart(3,'0'),
                      deliveryDate:dStr,pointName:point,pointId:'',
                      customer:'',customerId:'',address:'',
                      productionShift:autoProdShift,
                      prodShiftId:autoProdShift?.id||'',
                      deliveryTime:time,status:'pending',
                      note:'',workOut:0,workReturn:0,
                      lines:[],createdAt:fmtDate(),updatedAt:fmtDT()
                    };
                    // Find matching point in customers
                    customers.forEach(c=>(c.points||[]).forEach(pt=>{
                      if(pt.name.trim().toUpperCase()===point.toUpperCase()){
                        orderMap[key].pointId=pt.id;
                        orderMap[key].pointName=pt.name;
                        orderMap[key].customer=c.name;
                        orderMap[key].customerId=c.id;
                        orderMap[key].address=pt.address||'';
                      }
                    }));
                  }
                  // Parse product
                  const {name,unit}=parseProductStr((r[2]||'').toString());
                  const qtyHD=parseFloat(r[3])||0;
                  // Find product in catalog
                  const prod=products.find(p=>p.name.toUpperCase()===name.toUpperCase())||{};
                  orderMap[key].lines.push({
                    id:uid(),productId:prod.id||'',productName:name,
                    unit:unit,weightPerUnit:prod.weightPerUnit||0,
                    qtyProd:qtyHD,qtyInvoice:qtyHD,shift:'day',note:''
                  });
                });
                const newOrders=Object.values(orderMap).filter(o=>o.lines.length>0);
                if(newOrders.length===0){
                  window.showToast(invalidDateRows.length?'Có '+invalidDateRows.length+' dòng thiếu hoặc sai ngày/năm.':'Không đọc được đơn hàng nào!',invalidDateRows.length?'warn':'error');
                  return;
                }
                // Check duplicates & unknown points
                const dupOrders=newOrders.filter(o=>orders.some(ex=>ex.deliveryDate===o.deliveryDate&&ex.pointName===o.pointName&&ex.deliveryTime===o.deliveryTime));
                const unknownPts=[...new Set(newOrders.filter(o=>!o.customerId).map(o=>o.pointName))];
                // Store parsed data for modal
                if(invalidDateRows.length){
                  window.showToast('Đã bỏ qua '+invalidDateRows.length+' dòng thiếu hoặc sai ngày/năm.','warn');
                }
                window._importData={newOrders,dupOrders,unknownPts,invalidDateRows};
                sm('importPreview');
              };
              reader.readAsBinaryString(file);
            };
            inp.click();
          }
        },h('i',{className:'ti ti-file-import',style:{fontSize:14}}),'Import từ KH'),
        false&&h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Tạo đơn giao'})
      )),
      h('div',{ref:deliveryTopScroll,className:'desktop-only delivery-top-scroll'},
        h('div',{style:{width:1240,height:1}})
      )
    ),
    h('div',{className:'delivery-body'},
      h('div',{className:'desktop-only tw delivery-table-wrap',ref:deliveryTableScroll},
        h('table',{style:{minWidth:1240,width:'100%',tableLayout:'fixed'}},
        h('colgroup',null,
          h('col',{style:{width:'14%'}}),
          h('col',{style:{width:98}}),
          h('col',{style:{width:210}}),
          h('col',{style:{width:88}}),
          h('col',{style:{width:88}}),
          h('col',{style:{width:72}}),
          h('col',{style:{width:70}}),
          h('col',{style:{width:105}}),
          h('col',{style:{width:245}}),
          h('col',{style:{width:90}})
        ),
        h('thead',null,h('tr',null,
          h('th',null,'Địa điểm giao'),
          h('th',null,'Ngày giao'),
          h('th',null,'Ca SX'),
          h('th',null,'SL ĐẶT'),
          h('th',null,'SL HĐ'),
          h('th',null,'Giờ'),
          h('th',null,'Hóa đơn'),
          h('th',null,'Trạng thái'),
          h('th',null,'Chuyến'),
          h('th',null,'')
        )),
        h('tbody',null,list.length?orderTableRows.map((o,_i)=>{
          if(o._hdr) return h('tr',{key:'oh'+_i},h('td',{colSpan:10,style:{background:'#2d6a4f',color:'#fff',fontWeight:700,fontSize:13,padding:'5px 12px'}},(o.group?.mode==='trip'?'🚚 Chuyến: ':'📍 Khu vực: ')+(o.group?.label||'')));
          if(o._sub) return h('tr',{key:'os'+_i},
            h('td',{colSpan:6,style:{background:'#e8f5e9',fontWeight:600,fontSize:12,padding:'4px 12px',color:'#2d6a4f',textAlign:'right'}},'Tổng '+(o.group?.summaryLabel||'')+': '+o.cnt+' đơn — '+o.kl.toFixed(1)+' kg'),
            h('td',{colSpan:4,style:{background:'#e8f5e9'}})
          );
          const ctx=o._ctx||orderContext(o);
          const totalW=o._totalW||calcOrderWeight(ctx);
          const tripMode=o.tripAssignMode==='manual'?'manual':'auto';
          const tripDateOffset=getOrderTripDateOffset(ctx,prodShifts||[]);
          const tripDateOffsetLabel=(tripDateOffset===null||tripDateOffset===undefined||Number.isNaN(tripDateOffset))?'?':tripDateOffset;
          const preferredTripDate=o._preferredTripDate||getOrderTripDate(ctx,prodShifts||[])||'';
          const preferredTripShiftName=o._preferredTripShiftName||getOrderTripShiftName(ctx,prodShifts||[]);
          const autoTrip=o._autoTrip===undefined?autoTripForOrder(ctx):o._autoTrip;
          const tripOptions=tripOptionsForOrder(ctx);
          const selectedTripId=tripMode==='manual'?(ctx.tripId||''):(autoTrip?.id||'');
          const tripLabel=autoTrip?.area||autoTrip?.shiftName||preferredTripShiftName;
          const plansForDisplay=prodShiftPlansForOrder(ctx,prodShifts||[],prodShiftRules);
          const firstPlanForDisplay=plansForDisplay[0]||prodShiftPlan(ctx,prodShifts||[],prodShiftRules);
          const planRows=plansForDisplay.length
            ?plansForDisplay.map((plan,pi)=>({key:plan.line?.id||('plan_'+pi),plan,line:plan.line||ctx.lines?.[pi]||{},productName:plan.productName||plan.line?.productName||'Sản phẩm'}))
            :(ctx.lines||[]).map((line,pi)=>({key:line.id||('line_'+pi),plan:null,line,productName:line.productName||'Sản phẩm'}));
          const renderLineMetric=(getter,empty='—')=>h('div',{style:{display:'grid',gap:0,minWidth:0}},planRows.length
            ?planRows.map((row,ri)=>h('div',{key:'metric_'+row.key,style:{fontSize:12,lineHeight:1.35,marginTop:ri?6:0,paddingTop:ri?5:0,borderTop:ri?'1px dashed var(--bd)':'none',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}},getter(row)))
            :h('span',{style:{fontSize:12,color:'var(--tx2)'}},empty)
          );
          const tripText=t=>{
            if(!t)return 'Chưa có chuyến phù hợp';
            const parts=[];
            if(t.deliveryDate) parts.push(t.deliveryDate);
            if(t.shiftName) parts.push(t.shiftName);
            if(t.driverName) parts.push(t.driverName); else parts.push('Chưa có lái xe');
            if(t.area) parts.push(t.area);
            return parts.join(' · ');
          };
          const tripSelect=h('div',{style:{display:'grid',gap:6,minWidth:0,width:'100%'}},
            h('div',{style:{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}},
              h('span',{className:'badge',style:{background:tripMode==='manual'?'#FFF3CD':'#E8F5E9',color:tripMode==='manual'?'#8A5A00':'#1B5E20'}},tripMode==='manual'?'Chọn tay':'T.Đ ('+tripDateOffsetLabel+')'),
              tripLabel&&h('span',{style:{fontSize:11,color:'var(--tx2)'}},'Ca giao: '+tripLabel),
              h('button',{
                type:'button',
                onClick:()=>setOrderTripMode(o,tripMode==='manual'?'auto':'manual'),
                style:{padding:'3px 8px',fontSize:11,borderRadius:999,border:'1px solid var(--bd)',background:'#fff',cursor:'pointer'}
              },tripMode==='manual'?'Về T.Đ':'Đ.Tay')
            ),
            tripMode==='manual'
              ?h('select',{
                  value:selectedTripId,
                  onChange:e=>assignTripManually(o,e.target.value),
                  style:{fontSize:12,padding:'4px 6px',borderRadius:'var(--r)',border:'1px solid var(--bd)',width:'100%',maxWidth:'100%',color:selectedTripId?'var(--pri)':'var(--tx2)'}
                },
                  h('option',{value:''},'— Chọn chuyến —'),
                  tripOptions.map(t=>h('option',{key:t.id,value:t.id},tripText(t)))
                )
              :h('div',{style:{fontSize:12,color:selectedTripId?'var(--pri3)':'var(--tx2)',lineHeight:1.4,padding:'2px 0'}},tripText(autoTrip))
          );
          return h('tr',{key:o.id},
            h('td',null,
              h('div',{style:{fontWeight:600,fontSize:13}},ctx.pointName||'—'),
              h('div',{style:{fontSize:11,color:'var(--tx2)',marginTop:2}},ctx.customer)
            ),
            h('td',null,ctx.deliveryDate),
            // Cột Ca SX: tự động hoặc sửa tay
            h('td',null,(()=>{ 
              const autoPsh=getProdShiftForOrder({...ctx,deliveryTime:ctx.deliveryTime},prodShifts||[],customers||[]);
              const curPsh=ctx.prodShiftId?(prodShifts||[]).find(s=>s.id===ctx.prodShiftId):null;
              const dispPsh=curPsh||autoPsh;
              const firstPlan=firstPlanForDisplay;
              return h('div',{style:{width:'100%',maxWidth:210}},
                firstPlan
                  ?h('div',null,
                    h('span',{style:{display:'inline-block',padding:'2px 8px',borderRadius:10,fontSize:11,fontWeight:700,background:firstPlan.shift.color,color:firstPlan.shift.textColor,cursor:'pointer',border:curPsh?'2px solid '+firstPlan.shift.textColor:'1px dashed '+firstPlan.shift.textColor,title:curPsh?'Đã gán tay - click để đặt lại tự động':'Tự động - click để gán tay'},
                        onClick:()=>{
                          if(curPsh){
                            setOrders(prev=>prev.map(x=>x.id===o.id?{...x,prodShiftId:null}:x));
                          } else {
                            const chosen=window.prompt('Chọn ca SX (nhập tên ca):',autoPsh?.name||'');
                            if(chosen){
                              const sel=(prodShifts||[]).find(s=>s.name.toLowerCase().includes(chosen.toLowerCase()));
                              if(sel)setOrders(prev=>prev.map(x=>x.id===o.id?{...x,prodShiftId:sel.id}:x));
                            }
                          }
                        }
                      },firstPlan.shift.name+(curPsh?' ✎':'')),
                    planRows.map((row,pi)=>h('div',{key:row.key,style:{fontSize:10,color:'var(--tx2)',lineHeight:1.35,marginTop:pi?6:4,paddingTop:pi?5:0,borderTop:pi?'1px dashed var(--bd)':'none'}},
                      h('div',{style:{fontWeight:600,color:row.plan?.manual?'#8A5A00':'var(--pri3)',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}},(pi+1)+'. '+row.productName),
                      'SX: ',row.plan?.prodTime||row.line?.prodTime||'—',' / ',row.plan?.prodDate||row.line?.prodDate||'—'
                    ))
                  )
                  :h('span',{style:{fontSize:11,color:'var(--tx2)'}},'—')
              );
            })()),
            h('td',null,renderLineMetric(row=>numFmt(row.line?.qtyProd).toLocaleString('vi-VN',{minimumFractionDigits:0,maximumFractionDigits:2}))),
            h('td',null,renderLineMetric(row=>orderLineQty(row.line).toLocaleString('vi-VN',{minimumFractionDigits:0,maximumFractionDigits:2}))),
            h('td',null,ctx.deliveryTime||'—'),
            h('td',null,
              o.invoiceImage
                ?h('div',{style:{display:'flex',gap:4,alignItems:'center'}},
                  h('button',{className:'bi',onClick:()=>setInvoiceView(o),title:'Xem hóa đơn đã upload'},h('i',{className:'ti ti-photo-check',style:{fontSize:15,color:'var(--pri)'}})),
                  h('button',{className:'bi',onClick:()=>pickInvoiceImage(o),title:'Đổi ảnh hóa đơn'},h('i',{className:'ti ti-camera-up',style:{fontSize:15}}))
                )
                :h('button',{className:'bi',onClick:()=>pickInvoiceImage(o),title:'Upload/chụp ảnh hóa đơn'},h('i',{className:'ti ti-camera-plus',style:{fontSize:15}}))
            ),
            h('td',null,h(StatusBadge,{s:ctx.status})),
            h('td',null,tripSelect),
            h('td',null,h('div',{style:{display:'flex',gap:2}},
              h('button',{className:'bi',onClick:()=>spr(o),title:'In hóa đơn'},h('i',{className:'ti ti-printer',style:{fontSize:14}})),
              h('button',{className:'bi',onClick:()=>printLabels(o),title:'In tem'},h('i',{className:'ti ti-tag',style:{fontSize:14}})),
              h('button',{className:'bi',onClick:()=>{se(o);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
              h('button',{className:'bi',onClick:()=>del(o.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
            ))
          );
        }):h('tr',null,h('td',{colSpan:10,className:'empty-st'},'Chưa có đơn giao hàng nào.')))
        )
      )
    ),
    h('div',{className:'mobile-only mobile-card-list'},
      list.length?orderTableRows.map((o,_i)=>{
        if(o._hdr)return h('div',{key:'moh'+_i,style:{background:'#2d6a4f',color:'#fff',fontWeight:700,fontSize:13,padding:'8px 12px',borderRadius:10}},(o.group?.mode==='trip'?'Chuyến: ':'Khu vực: ')+(o.group?.label||''));
        if(o._sub)return h('div',{key:'mos'+_i,style:{background:'#e8f5e9',color:'#2d6a4f',fontWeight:600,fontSize:12,padding:'8px 12px',borderRadius:10}},'Tổng '+(o.group?.summaryLabel||'')+': '+o.cnt+' đơn — '+o.kl.toFixed(1)+' kg');
        const ctx=o._ctx||orderContext(o);
        const totalW=o._totalW||calcOrderWeight(ctx);
        const tripMode=o.tripAssignMode==='manual'?'manual':'auto';
        const tripDateOffset=getOrderTripDateOffset(ctx,prodShifts||[]);
        const tripDateOffsetLabel=(tripDateOffset===null||tripDateOffset===undefined||Number.isNaN(tripDateOffset))?'?':tripDateOffset;
        const preferredTripDate=o._preferredTripDate||getOrderTripDate(ctx,prodShifts||[])||'';
        const preferredTripShiftName=o._preferredTripShiftName||getOrderTripShiftName(ctx,prodShifts||[]);
        const autoTrip=o._autoTrip===undefined?autoTripForOrder(ctx):o._autoTrip;
        const tripOptions=tripOptionsForOrder(ctx);
        const selectedTripId=tripMode==='manual'?(ctx.tripId||''):(autoTrip?.id||'');
        const tripLabel=autoTrip?.area||autoTrip?.shiftName||preferredTripShiftName;
        const tripText=t=>{
          if(!t)return 'Chưa có chuyến phù hợp';
          const parts=[];
          if(t.deliveryDate) parts.push(t.deliveryDate);
          if(t.shiftName) parts.push(t.shiftName);
          if(t.driverName) parts.push(t.driverName); else parts.push('Chưa có lái xe');
          if(t.area) parts.push(t.area);
          return parts.join(' · ');
        };
        const plans=prodShiftPlansForOrder(ctx,prodShifts||[],prodShiftRules);
        const firstPlan=plans[0]||prodShiftPlan(ctx,prodShifts||[],prodShiftRules);
        return h('div',{key:'mod_'+o.id,className:'mobile-data-card'},
          h('div',{className:'mobile-data-head'},
            h('div',null,
              h('div',{className:'mobile-data-title'},ctx.pointName||'—'),
              h('div',{className:'mobile-data-sub'},ctx.customer||'—')
            ),
            h('div',{className:'mobile-data-sub'},(ctx.deliveryDate||'—')+(ctx.deliveryTime?' • '+ctx.deliveryTime:''))
          ),
          firstPlan&&h('div',{className:'mobile-data-text'},
            h('span',{style:{display:'inline-block',padding:'3px 9px',borderRadius:12,fontSize:11,fontWeight:700,background:firstPlan.shift.color,color:firstPlan.shift.textColor,marginBottom:6}},firstPlan.shift.name),
            plans.map((plan,pi)=>h('div',{key:(plan.line?.id||pi),style:{fontSize:11,color:'var(--tx2)',lineHeight:1.4,marginTop:pi?6:0}},
              h('div',{style:{fontWeight:600,color:plan.manual?'#8A5A00':'var(--pri3)'}},(pi+1)+'. '+(plan.productName||'Sản phẩm')),
              'SX: '+(plan.prodDate||'—')+' • '+(plan.prodTime||'—')
            ))
          ),
          h('div',{className:'mobile-data-grid'},
            h('div',{className:'mobile-data-item'},h('b',null,'Hàng hóa'),h('span',null,(ctx.lines||[]).length+' mặt hàng')),
            h('div',{className:'mobile-data-item'},h('b',null,'Khối lượng'),h('span',null,totalW>0?totalW.toFixed(2)+' kg':'—')),
            h('div',{className:'mobile-data-item'},h('b',null,'Trạng thái'),h(StatusBadge,{s:ctx.status})),
            h('div',{className:'mobile-data-item'},h('b',null,'Hóa đơn'),h('span',null,ctx.invoiceImage?'Đã có ảnh':'Chưa có'))
          ),
          h('div',{style:{background:'var(--bg2)',borderRadius:10,padding:'10px'}},
            h('div',{style:{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:6}},
              h('span',{className:'badge',style:{background:tripMode==='manual'?'#FFF3CD':'#E8F5E9',color:tripMode==='manual'?'#8A5A00':'#1B5E20'}},tripMode==='manual'?'Chọn tay':'T.Đ ('+tripDateOffsetLabel+')'),
              tripLabel&&h('span',{style:{fontSize:12,color:'var(--tx2)'}},'Ca giao: '+tripLabel),
              h('button',{
                type:'button',
                onClick:()=>setOrderTripMode(o,tripMode==='manual'?'auto':'manual'),
                style:{padding:'3px 8px',fontSize:11,borderRadius:999,border:'1px solid var(--bd)',background:'#fff',cursor:'pointer'}
              },tripMode==='manual'?'Về T.Đ':'Đ.Tay')
            ),
            tripMode==='manual'
              ?h('select',{
                  value:selectedTripId,
                  onChange:e=>assignTripManually(o,e.target.value),
                  style:{fontSize:12,padding:'6px 8px',borderRadius:'var(--r)',border:'1px solid var(--bd)',width:'100%',color:selectedTripId?'var(--pri)':'var(--tx2)'}
                },
                  h('option',{value:''},'— Chọn chuyến —'),
                  tripOptions.map(t=>h('option',{key:t.id,value:t.id},tripText(t)))
                )
              :h('div',{style:{fontSize:12,color:selectedTripId?'var(--pri3)':'var(--tx2)',lineHeight:1.45}},tripText(autoTrip))
          ),
          h('div',{className:'mobile-data-actions'},
            h('button',{className:'bi',onClick:()=>spr(o),title:'In hóa đơn'},h('i',{className:'ti ti-printer',style:{fontSize:14}})),
            h('button',{className:'bi',onClick:()=>printLabels(o),title:'In tem'},h('i',{className:'ti ti-tag',style:{fontSize:14}})),
            h('button',{className:'bi',onClick:()=>pickInvoiceImage(o),title:'Ảnh hóa đơn'},h('i',{className:o.invoiceImage?'ti ti-photo-check':'ti ti-camera-plus',style:{fontSize:15,color:o.invoiceImage?'var(--pri)':'inherit'}})),
            h('button',{className:'bi',onClick:()=>{se(o);sm('f')},title:'Sửa'},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
            h('button',{className:'bi',onClick:()=>del(o.id),title:'Xóa',style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
          )
        );
      }):h('div',{className:'empty-st'},'Chưa có đơn giao hàng nào.')
    ),
        modal==='f'&&h(OrderForm,{order:edit,customers,products,prodCats,quotes,employees,currentUser,prodShifts,onSave:save,onClose:()=>{sm(null);se(null);}}),
    print&&h(PrintTemplateModal,{order:print,company,onClose:()=>spr(null)}),
    invoiceView&&h(Modal,{title:'Ảnh hóa đơn - '+invoiceView.id,lg:true,onClose:()=>setInvoiceView(null)},
      h('div',{style:{display:'grid',gap:10}},
        h('div',{style:{fontSize:13,color:'var(--tx2)'}},
          h('b',null,invoiceView.pointName||invoiceView.customer||''),' — ',invoiceView.deliveryDate||'',invoiceView.deliveryTime?' · '+invoiceView.deliveryTime:'',
          invoiceView.invoiceUploadedAt?(' · Upload: '+invoiceView.invoiceUploadedAt):''
        ),
        h('div',{style:{border:'1px solid var(--bd)',borderRadius:'var(--r)',background:'#f7faf8',padding:10,textAlign:'center',maxHeight:'70vh',overflow:'auto'}},
          h('img',{src:invoiceView.invoiceImage,style:{maxWidth:'100%',height:'auto',borderRadius:'var(--r)'}})
        ),
        h(Row,null,
          h('button',{onClick:()=>pickInvoiceImage(invoiceView)},h('i',{className:'ti ti-camera-up',style:{fontSize:14}}),' Đổi ảnh'),
          h('button',{className:'bp',onClick:()=>setInvoiceView(null)},'Đóng')
        )
      )
    )
  );
}

/* ─── DELIVERY TRIPS ─── */
function TripForm({trip,orders,employees,shifts,customers,products,currentUser,onSave,onClose}){
  const drivers=employees.filter(e=>e.role==='driver'||e.dept==='Lái xe');
  const[f,sf]=useState(trip?{driverWork:0,weightRate:0,tripAllowance:0,attendanceStatus:'pending',...trip}:{driverName:'',driverId:'',shiftId:'',shiftName:'',deliveryDate:fmtDate(),deliveryTime:'07:00',orderIds:[],note:'',status:'planning',driverWork:0,weightRate:0,tripAllowance:0,attendanceStatus:'pending'});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  // Bộ lọc đơn hàng
  const[fArea,setFArea]=useState('');
  const[fDate,setFDate]=useState('');
  const[fCust,setFCust]=useState('');
  const[fTimeFrom,setFTimeFrom]=useState('');
  const[fTimeTo,setFTimeTo]=useState('');
  // Lấy khu vực của đơn
  const getOArea=o=>{
    const c=customers?.find(x=>x.id===o.customerId);
    const pt=(c?.points||[]).find(p=>p.id===o.pointId||p.name===o.pointName);
    return o.area||pt?.area||'';
  };
  const availOrders=orders.filter(o=>o.status==='pending'||(trip&&(trip.orderIds||[]).includes(o.id)));
  // Áp dụng bộ lọc
  const filteredOrders=availOrders.filter(o=>{
    if(fDate&&o.deliveryDate!==fDate.split('-').reverse().join('/'))return false;
    if(fArea&&getOArea(o)!==fArea)return false;
    if(fCust&&o.customerId!==fCust)return false;
    if(fTimeFrom&&o.deliveryTime&&o.deliveryTime<fTimeFrom)return false;
    if(fTimeTo&&o.deliveryTime&&o.deliveryTime>fTimeTo)return false;
    return true;
  });
  const toggle=id=>sf(p=>({...p,orderIds:(p.orderIds||[]).includes(id)?p.orderIds.filter(x=>x!==id):[...p.orderIds,id]}));
  const toggleAll=()=>{
    const ids=filteredOrders.map(o=>o.id);
    const allChecked=ids.every(id=>(f.orderIds||[]).includes(id));
    sf(p=>({...p,orderIds:allChecked?p.orderIds.filter(id=>!ids.includes(id)):[...new Set([...p.orderIds,...ids])]}));
  };
  const lineQty=l=>numFmt(l.qtyInvoice)||numFmt(l.qtyProd)||numFmt(l.qty)||numFmt(l.quantity)||0;
  const lineWeight=l=>{const prod=products?.find(p=>p.id===l.productId);const unit=String(l.unit||prod?.unit||'').trim().toLowerCase().replace(/[^a-z]/g,'');const qty=lineQty(l);if(unit==='kg'||unit==='kgs'||unit==='kilogram'||unit==='kilograms')return qty;const wpu=prod?.weightPerUnit||numFmt(l.weightPerUnit)||0;return wpu*qty;};
  const orderWeight=o=>(o.lines||[]).reduce((s,l)=>s+lineWeight(l),0);
  const totalW=(f.orderIds||[]).reduce((sum,oid)=>{const o=orders.find(x=>x.id===oid);return sum+(o?orderWeight(o):0);},0);
  const submit=()=>{
    if(!f.driverName){window.showToast('Vui lòng chọn hoặc nhập tên lái xe!','warn');return;}
    if(f.orderIds.length===0){window.showToast('Vui lòng chọn ít nhất 1 đơn hàng!','warn');return;}
    onSave({...f,totalWeight:totalW,updatedBy:currentUser.name,updatedAt:fmtDT()});
  };
  // Danh sách khu vực và KH để lọc
  const allAreas=[...new Set(availOrders.map(o=>getOArea(o)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const allCusts=[...new Set(availOrders.map(o=>o.customerId).filter(Boolean))].map(id=>customers?.find(c=>c.id===id)).filter(Boolean);
  const allFilteredChecked=filteredOrders.length>0&&filteredOrders.every(o=>(f.orderIds||[]).includes(o.id));
  const someFilteredChecked=filteredOrders.some(o=>(f.orderIds||[]).includes(o.id))&&!allFilteredChecked;
  const isCompleted=f.status==='completed';

  return h(Modal,{title:trip?'Sửa chuyến '+trip.id:'Tạo chuyến giao hàng',onClose,lg:true},
    h('div',{className:'g2'},
      h(F,{label:'Lái xe *'},h('select',{value:f.driverId,onChange:e=>{const emp=employees.find(x=>x.id===e.target.value);sf(p=>({...p,driverId:e.target.value,driverName:emp?emp.name:p.driverName}));},style:{marginBottom:0}},
        h('option',{value:''},'— Chọn từ danh sách —'),drivers.map(e=>h('option',{key:e.id,value:e.id},e.name))
      )),
      h(F,{label:'Hoặc nhập tên lái xe'},h('input',{value:f.driverName,onChange:e=>s('driverName',e.target.value),placeholder:'Tên lái xe...'})),
    ),
    h('div',{className:'g3'},
      h(F,{label:'Ngày giao'},h('input',{value:f.deliveryDate,onChange:e=>s('deliveryDate',e.target.value),placeholder:'DD/MM/YYYY'})),
      h(F,{label:'Ca giao'},h('select',{value:f.shiftId,onChange:e=>{const sh=(shifts||[]).find(x=>x.id===e.target.value);sf(p=>({...p,shiftId:e.target.value,shiftName:sh?sh.name:'',deliveryTime:sh&&sh.startTime?sh.startTime:p.deliveryTime}));}},
        h('option',{value:''},'— Chọn ca —'),
        (shifts||[]).map(sh=>h('option',{key:sh.id,value:sh.id},sh.name||sh.id))
      )),
      h(F,{label:'Công lái xe'},h('input',{type:'number',step:'0.5',min:'0',value:f.driverWork,onChange:e=>s('driverWork',parseFloat(e.target.value)||0),placeholder:'0'})),
      h(F,{label:'Đơn giá/kg'},h('input',{type:'number',min:'0',value:f.weightRate||0,onChange:e=>s('weightRate',parseFloat(e.target.value)||0),placeholder:'0'})),
      h(F,{label:'Phụ cấp chuyến'},h('input',{type:'number',min:'0',value:f.tripAllowance||0,onChange:e=>s('tripAllowance',parseFloat(e.target.value)||0),placeholder:'0'})),
      h(F,{label:'Trạng thái'},h('select',{value:f.status,onChange:e=>s('status',e.target.value)},
        [['planning','Lên kế hoạch'],['assigned','Đã giao lái xe'],['active','Đang giao'],['completed','Hoàn thành']].map(([v,l])=>h('option',{key:v,value:v},l))
      )),
    ),
    h(F,{label:'Ghi chú'},h('textarea',{value:f.note,onChange:e=>s('note',e.target.value),rows:2})),
    h('div',{className:'divider'}),
    // ── PHẦN 1: ĐÃ TRONG CHUYẾN (luôn hiện trên cùng) ──
    (()=>{
      const inTripAll=availOrders.filter(o=>(f.orderIds||[]).includes(o.id));
      if(inTripAll.length===0)return null;
      return h('div',{style:{marginBottom:8}},
        h('div',{style:{padding:'5px 10px',background:'#2d6a4f',color:'#fff',fontSize:12,fontWeight:700,
          borderRadius:'var(--r) var(--r) 0 0',display:'flex',justifyContent:'space-between',alignItems:'center'}},
          h('span',null,'✓ ĐÃ TRONG CHUYẾN ('+inTripAll.length+' đơn · '+totalW.toFixed(1)+' kg)'),
          !isCompleted&&h('button',{onClick:()=>sf(p=>({...p,orderIds:[]})),
            style:{fontSize:11,padding:'1px 8px',background:'rgba(255,255,255,.2)',border:'1px solid rgba(255,255,255,.4)',color:'#fff',borderRadius:4,cursor:'pointer'}
          },'Bỏ tất cả')
        ),
        h('div',{style:{maxHeight:180,overflowY:'auto',border:'1px solid #2d6a4f',borderTop:'none',
          borderRadius:'0 0 var(--r) var(--r)',padding:4,background:'#f5fbf5'}},
          inTripAll.map(o=>{
            const w=orderWeight(o);
            const oCust=customers?.find(c=>c.id===o.customerId)||null;
            const oPt=oCust?(oCust.points||[]).find(p=>p.id===o.pointId||p.name===o.pointName):null;
            const oArea=o.area||oPt?.area||'';
            return h('label',{key:o.id,style:{display:'flex',alignItems:'center',gap:10,padding:'6px 8px',
              borderRadius:'var(--r)',cursor:'pointer',marginBottom:2,
              background:'#f0faf0',border:'1px solid var(--pri)'}},
              h('input',{type:'checkbox',checked:true,disabled:isCompleted,onChange:()=>toggle(o.id),
                style:{width:'auto',flexShrink:0,accentColor:'var(--pri)'}}),
              h('div',{style:{flex:1,minWidth:0}},
                h('div',{style:{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}},
                  h('span',{style:{fontWeight:600,fontSize:13,color:'var(--pri)'}},o.pointName||o.customer||o.id),
                  oArea&&h('span',{style:{fontSize:11,background:'#e8f5e9',color:'#2d6a4f',padding:'1px 7px',borderRadius:10,fontWeight:600}},oArea),
                  o.deliveryTime&&h('span',{style:{fontSize:12,background:'var(--bg2)',padding:'1px 6px',borderRadius:8,color:'var(--tx2)'}},
                    h('i',{className:'ti ti-clock',style:{fontSize:10,marginRight:2}}),o.deliveryTime)
                ),
                h('div',{style:{fontSize:11,color:'var(--tx2)',marginTop:2,display:'flex',gap:8}},
                  h('span',null,o.id),
                  o.customer&&o.customer!==o.pointName&&h('span',null,'KH: '+o.customer),
                  w>0&&h('span',{style:{color:'#2d6a4f',fontWeight:500}},w.toFixed(1)+' kg'),
                  (o.lines||[]).length>0&&h('span',null,(o.lines||[]).length+' SP')
                )
              )
            );
          })
        )
      );
    })(),
    // ── PHẦN 2: BỘ LỌC + THÊM ĐƠN ──
    !isCompleted&&h('div',{style:{marginBottom:6}},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}},
        h('div',{style:{fontWeight:600,fontSize:13,color:'var(--tx2)'}},'+ Thêm đơn hàng vào chuyến'),
        filteredOrders.filter(o=>!(f.orderIds||[]).includes(o.id)).length>0&&h('button',{
          onClick:()=>sf(p=>({...p,orderIds:[...new Set([...p.orderIds,...filteredOrders.map(o=>o.id)])]})),
          style:{fontSize:12,padding:'3px 10px',border:'1px solid var(--pri)',color:'var(--pri)',background:'transparent',borderRadius:'var(--r)',cursor:'pointer'}
        },'Chọn tất cả ('+filteredOrders.filter(o=>!(f.orderIds||[]).includes(o.id)).length+')')
      ),
      h('div',{style:{display:'flex',gap:6,flexWrap:'wrap',marginBottom:6}},
        h('input',{type:'date',value:fDate,onChange:e=>setFDate(e.target.value),
          style:{padding:'4px 8px',fontSize:12,border:'1px solid var(--bd)',borderRadius:'var(--r)'}
        }),
        h('select',{value:fArea,onChange:e=>setFArea(e.target.value),
          style:{padding:'4px 8px',fontSize:12,border:'1px solid var(--bd)',borderRadius:'var(--r)',flex:'1 1 90px'}
        },h('option',{value:''},'Tất cả khu vực'),allAreas.map(a=>h('option',{key:a,value:a},a))),
        h('select',{value:fCust,onChange:e=>setFCust(e.target.value),
          style:{padding:'4px 8px',fontSize:12,border:'1px solid var(--bd)',borderRadius:'var(--r)',flex:'1 1 110px'}
        },h('option',{value:''},'Tất cả KH'),allCusts.map(c=>h('option',{key:c.id,value:c.id},c.name))),
        h('div',{style:{display:'flex',alignItems:'center',gap:4}},
          h('input',{type:'time',value:fTimeFrom,onChange:e=>setFTimeFrom(e.target.value),
            title:'Giờ từ',style:{padding:'4px 6px',fontSize:12,border:'1px solid var(--bd)',borderRadius:'var(--r)',width:90}
          }),
          h('span',{style:{fontSize:12,color:'var(--tx2)'}},'→'),
          h('input',{type:'time',value:fTimeTo,onChange:e=>setFTimeTo(e.target.value),
            title:'Giờ đến',style:{padding:'4px 6px',fontSize:12,border:'1px solid var(--bd)',borderRadius:'var(--r)',width:90}
          })
        ),
        (fDate||fArea||fCust||fTimeFrom||fTimeTo)&&h('button',{
          onClick:()=>{setFDate('');setFArea('');setFCust('');setFTimeFrom('');setFTimeTo('');},
          style:{padding:'4px 8px',fontSize:12,color:'#A32D2D',border:'1px solid #f0a0a0',borderRadius:'var(--r)',background:'transparent',cursor:'pointer'}
        },'✕ Xóa lọc')
      )
    ),
    !isCompleted&&(()=>{
      // Render 1 order item
      const renderOrder=(o,checked,highlight)=>{
        const w=orderWeight(o);
        const oCust=customers?.find(c=>c.id===o.customerId)||null;
        const oPt=oCust?(oCust.points||[]).find(p=>p.id===o.pointId||p.name===o.pointName):null;
        const oArea=o.area||oPt?.area||'';
        return h('label',{key:o.id,style:{display:'flex',alignItems:'center',gap:10,padding:'7px 8px',
          borderRadius:'var(--r)',cursor:'pointer',marginBottom:2,
          background:highlight?'#f0faf0':checked?'#EEF5FF':'#fff',
          border:'1px solid '+(highlight?'var(--pri)':checked?'#93c5fd':'var(--bd)')}},
          h('input',{type:'checkbox',checked,onChange:()=>toggle(o.id),style:{width:'auto',flexShrink:0,accentColor:'var(--pri)'}}),
          h('div',{style:{flex:1,minWidth:0}},
            h('div',{style:{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}},
              h('span',{style:{fontWeight:600,fontSize:13,color:'var(--pri)'}},o.pointName||o.customer||o.id),
              oArea&&h('span',{style:{fontSize:11,background:'#e8f5e9',color:'#2d6a4f',padding:'1px 7px',borderRadius:10,fontWeight:600}},oArea),
              o.deliveryTime&&h('span',{style:{fontSize:12,background:'var(--bg2)',padding:'1px 6px',borderRadius:8,color:'var(--tx2)'}},
                h('i',{className:'ti ti-clock',style:{fontSize:10,marginRight:2}}),o.deliveryTime
              )
            ),
            h('div',{style:{fontSize:11,color:'var(--tx2)',marginTop:2,display:'flex',gap:8}},
              h('span',null,o.id),
              o.customer&&o.customer!==o.pointName&&h('span',null,'KH: '+o.customer),
              w>0&&h('span',{style:{color:'#2d6a4f',fontWeight:500}},w.toFixed(1)+' kg'),
              (o.lines||[]).length>0&&h('span',null,(o.lines||[]).length+' SP')
            )
          )
        );
      };
      // Đã trong chuyến: lấy từ TẤT CẢ đơn (không qua filter) để luôn hiện đủ
      // Có thể thêm: qua filter, chưa trong chuyến
      const notInTrip=filteredOrders.filter(o=>!(f.orderIds||[]).includes(o.id));
      return h('div',{style:{border:'.5px solid var(--bd)',borderRadius:'var(--r)',overflow:'hidden'}},
        // Phần ĐÃ CÓ trong chuyến
        // Phần CÓ THỂ THÊM
        h('div',null,
          h('div',{style:{padding:'5px 10px',background:'var(--bg2)',fontSize:11,fontWeight:700,color:'var(--tx2)',letterSpacing:.5,borderTop:'none',display:'flex',justifyContent:'space-between',alignItems:'center'}},
            h('span',null,notInTrip.length>0?'+ CÓ THỂ THÊM ('+notInTrip.length+' đơn)':'Không có đơn hàng nào thêm'),
            notInTrip.length>0&&h('button',{onClick:()=>sf(p=>({...p,orderIds:[...new Set([...p.orderIds,...notInTrip.map(o=>o.id)])]})),
              style:{fontSize:11,padding:'1px 8px',border:'1px solid var(--pri)',color:'var(--pri)',background:'transparent',borderRadius:4,cursor:'pointer'}
            },'Thêm tất cả')
          ),
          notInTrip.length>0&&h('div',{style:{maxHeight:220,overflowY:'auto',padding:6}},
            notInTrip.map(o=>renderOrder(o,false,false))
          ),
          notInTrip.length===0&&h('div',{style:{textAlign:'center',padding:'1rem',color:'var(--tx2)',fontSize:13}},
            fDate||fArea||fCust?'Không có đơn hàng khớp bộ lọc.':'Không có đơn hàng chờ giao.'
          )
        )
      );
    })(),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu chuyến'))
  );
}
function BulkTripModal({orders,employees,shifts,customers,products,trips,currentUser,initialDate,initialShift,onSave,onClose}){
  const today=new Date().toISOString().slice(0,10);
  const [date,setDate]=useState(initialDate||today);
  const [selShifts,setSelShifts]=useState(initialShift?[initialShift]:[]); // shift ids
  const [selAreas,setSelAreas]=useState([]);   // areas
  const [driver,setDriver]=useState('');
  const [driverName,setDriverName]=useState('');
  const drivers=employees.filter(e=>e.role==='driver'||e.dept==='Lái xe');

  // Lấy khu vực của đơn
  const getOArea=o=>{
    const c=customers?.find(x=>x.id===o.customerId);
    const pt=(c?.points||[]).find(p=>p.id===o.pointId||p.name===o.pointName);
    return o.area||pt?.area||'';
  };
  const fmtDate2=s=>{if(!s)return'';const[y,m,d]=s.split('-');return d+'/'+m+'/'+y;};
  const dateVN=fmtDate2(date);

  // Đơn hàng chờ theo ngày
  const pendingOrders=orders.filter(o=>{
    if(o.tripId||o.status==='done'||o.status==='cancelled')return false;
    return !dateVN||o.deliveryDate===dateVN;
  });
  const allAreas=[...new Set(pendingOrders.map(o=>getOArea(o)).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'vi'));
  const allShifts=shifts||[];

  const toggleShift=id=>setSelShifts(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id]);
  const toggleArea=a=>setSelAreas(p=>p.includes(a)?p.filter(x=>x!==a):[...p,a]);
  const lineQty=l=>numFmt(l.qtyInvoice)||numFmt(l.qtyProd)||numFmt(l.qty)||numFmt(l.quantity)||0;
  const lineWeight=l=>{const prod=products?.find(p=>p.id===l.productId);const unit=String(l.unit||prod?.unit||'').trim().toLowerCase().replace(/[^a-z]/g,'');const qty=lineQty(l);if(unit==='kg'||unit==='kgs'||unit==='kilogram'||unit==='kilograms')return qty;const wpu=prod?.weightPerUnit||numFmt(l.weightPerUnit)||0;return wpu*qty;};
  const orderWeight=o=>(o.lines||[]).reduce((s,l)=>s+lineWeight(l),0);
  const ordersWeight=rows=>(rows||[]).reduce((s,o)=>s+orderWeight(o),0);

  // Preview: logic đúng
  // - Chọn ca + khu vực → mỗi combo (ca × khu vực) = 1 chuyến, đơn thuộc khu vực đó
  // - Chỉ chọn ca (không chọn khu vực) → mỗi ca = 1 chuyến, gộp tất cả đơn
  // - Chỉ chọn khu vực (không chọn ca) → mỗi khu vực = 1 chuyến
  // - Không chọn gì → mỗi khu vực = 1 chuyến (gộp tất cả)
  const preview=React.useMemo(()=>{
    const combos=[];
    const useShifts=selShifts.length>0?allShifts.filter(s=>selShifts.includes(s.id)):[];
    const useAreas=selAreas.length>0?selAreas:allAreas;
    if(useShifts.length>0&&useAreas.length>0){
      // Ca × Khu vực
      useShifts.forEach(sh=>{
        useAreas.forEach(area=>{
          const matchOrders=pendingOrders.filter(o=>getOArea(o)===area);
          if(matchOrders.length===0)return;
          combos.push({shiftId:sh.id,shiftName:sh.name||sh.id,area,orders:matchOrders});
        });
      });
    } else if(useShifts.length>0){
      // Chỉ theo ca — gộp tất cả khu vực vào mỗi ca
      useShifts.forEach(sh=>{
        if(pendingOrders.length===0)return;
        combos.push({shiftId:sh.id,shiftName:sh.name||sh.id,area:'Tất cả',orders:pendingOrders});
      });
    } else {
      // Theo khu vực (mặc định)
      useAreas.forEach(area=>{
        const matchOrders=pendingOrders.filter(o=>getOArea(o)===area);
        if(matchOrders.length===0)return;
        combos.push({shiftId:'',shiftName:'',area,orders:matchOrders});
      });
    }
    return combos;
  },[selShifts.join(','),selAreas.join(','),date,pendingOrders.length]);

  const submit=()=>{
    if(preview.length===0){window.showToast('Không có đơn hàng phù hợp để tạo chuyến!','warn');return;}
    const drName=driverName||(drivers.find(d=>d.id===driver)?.name||'');
    // Tạo ID trước để check trùng trong batch
    const usedIds=new Set(trips.map(t=>t.id));
    const newTrips=[];
    const dupWarnings=[];
    const dupCombos=preview.filter(combo=>combo.shiftId&&trips.some(t=>t.deliveryDate===dateVN&&t.shiftId===combo.shiftId));
    if(dupCombos.length>0){
      window.showToast('Ngày '+dateVN+' đã có chuyến giao hàng trùng ca: '+dupCombos.map(c=>c.shiftName||c.shiftId).join(', ')+'. Không tạo thêm.','warn');
      return;
    }
    preview.forEach(combo=>{
      const [dd,mm,yy]=(dateVN||fmtDate()).split('/');
      const datePart=(dd||'')+(mm||'')+(yy||'').slice(-2);
      const shiftAbbr=(combo.shiftName||'').toUpperCase()
        .replace(/CA\s*/,'')
        .replace(/SÁNG|SANG/,'S').replace(/TRƯA|TRUA/,'T')
        .replace(/CHIỀU|CHIEU/,'C').replace(/ĐÊM|DEM/,'D')
        .replace(/[^A-Z0-9]/g,'').slice(0,3)||(combo.area||'XX').replace(/[^A-Z0-9]/gi,'').slice(0,2).toUpperCase();
      const driverAbbr=drName.trim().split(/\s+/).map(w=>w[0]).join('').toUpperCase().slice(0,3);
      const areaCode=(combo.area||'').replace(/[^A-Z0-9]/gi,'').slice(0,3).toUpperCase();
      let baseId='CH'+datePart+shiftAbbr+'_'+areaCode+'_'+(driverAbbr||'XX');
      let id=baseId; let seq=2;
      while(usedIds.has(id)){id=baseId+'_'+seq;seq++;}
      // Kiểm tra trùng: chuyến cùng ngày + khu vực khi không chọn ca
      const dupTrip=trips.find(t=>
        t.deliveryDate===dateVN&&
        !combo.shiftId&&
        t.id.includes(areaCode)
      );
      if(dupTrip) dupWarnings.push('⚠ Khu vực '+combo.area+(combo.shiftName?' / '+combo.shiftName:'')+' đã có chuyến: '+dupTrip.id);
      usedIds.add(id);
      const w=ordersWeight(combo.orders);
      newTrips.push({
        id,driverName:drName,driverId:driver||'',
        shiftId:combo.shiftId,shiftName:combo.shiftName,
        deliveryDate:dateVN,deliveryTime:'',
        orderIds:combo.orders.map(o=>o.id),
        status:drName?'assigned':'planning',note:'',driverWork:0,weightRate:0,tripAllowance:0,attendanceStatus:'pending',totalWeight:w,
        createdAt:fmtDate(),updatedBy:currentUser.name,updatedAt:fmtDT()
      });
    });
    // Cảnh báo trùng khu vực khi tạo không theo ca
    if(dupWarnings.length>0){
      const msg=dupWarnings.join('\n')+'\n\nVẫn tiếp tục tạo '+newTrips.length+' chuyến mới?';
      if(!confirm(msg))return;
    }
    onSave(newTrips);
  };

  return h(Modal,{title:'Tạo nhiều chuyến cùng lúc',onClose,lg:true},
    h('div',{className:'g2',style:{marginBottom:12}},
      h(F,{label:'Ngày giao'},h('input',{type:'date',value:date,onChange:e=>setDate(e.target.value)})),
      h('div',{style:{display:'flex',flexDirection:'column',gap:6}},
        h(F,{label:'Lái xe'},h('select',{value:driver,onChange:e=>{setDriver(e.target.value);const emp=drivers.find(x=>x.id===e.target.value);if(emp)setDriverName(emp.name);}},
          h('option',{value:''},'— Chọn từ danh sách —'),
          drivers.map(e=>h('option',{key:e.id,value:e.id},e.name))
        )),
        h(F,{label:'Hoặc nhập tên'},h('input',{value:driverName,onChange:e=>setDriverName(e.target.value),placeholder:'Tên lái xe...'}))
      )
    ),
    // Chọn ca
    allShifts.length>0&&h('div',{style:{marginBottom:12}},
      h('div',{style:{fontSize:12,fontWeight:600,color:'var(--tx2)',marginBottom:6}},
        'Ca giao hàng (không chọn = tạo theo khu vực, không phân ca)'
      ),
      h('div',{style:{display:'flex',gap:8,flexWrap:'wrap'}},
        allShifts.map(sh=>h('label',{key:sh.id,
          style:{display:'flex',alignItems:'center',gap:6,padding:'5px 12px',
            borderRadius:'var(--r)',border:'1px solid '+(selShifts.includes(sh.id)?'var(--pri)':'var(--bd)'),
            cursor:'pointer',background:selShifts.includes(sh.id)?'#f0faf0':'#fff',fontSize:13}
        },
          h('input',{type:'checkbox',checked:selShifts.includes(sh.id),onChange:()=>toggleShift(sh.id),style:{cursor:'pointer'}}),
          sh.name||sh.id
        ))
      )
    ),
    // Chọn khu vực
    allAreas.length>0&&h('div',{style:{marginBottom:12}},
      h('div',{style:{fontSize:12,fontWeight:600,color:'var(--tx2)',marginBottom:6}},
        'Khu vực (không chọn = tất cả khu vực)'
      ),
      h('div',{style:{display:'flex',gap:8,flexWrap:'wrap'}},
        allAreas.map(a=>h('label',{key:a,
          style:{display:'flex',alignItems:'center',gap:6,padding:'5px 12px',
            borderRadius:'var(--r)',border:'1px solid '+(selAreas.includes(a)?'var(--pri)':'var(--bd)'),
            cursor:'pointer',background:selAreas.includes(a)?'#f0faf0':'#fff',fontSize:13}
        },
          h('input',{type:'checkbox',checked:selAreas.includes(a),onChange:()=>toggleArea(a),style:{cursor:'pointer'}}),
          a
        ))
      )
    ),
    // Preview chuyến sẽ tạo
    preview.length>0&&h('div',{style:{marginBottom:12}},
      h('div',{style:{fontWeight:600,fontSize:13,color:'var(--pri3)',marginBottom:8}},
        '📋 Sẽ tạo '+preview.length+' chuyến:'
      ),
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:8}},
        preview.map((combo,i)=>h('div',{key:i,style:{border:'1px solid var(--bd)',borderRadius:'var(--r)',
          padding:'8px 10px',background:'#f5fbf5'}},
          h('div',{style:{fontWeight:600,fontSize:13,color:'var(--pri)'}},combo.area),
          combo.shiftName&&h('div',{style:{fontSize:12,color:'var(--tx2)'}},combo.shiftName),
          h('div',{style:{fontSize:12,marginTop:4}},combo.orders.length+' đơn · '+
            ordersWeight(combo.orders).toFixed(1)+' kg'
          )
        ))
      )
    ),
    preview.length===0&&date&&h('div',{style:{textAlign:'center',padding:'1rem',color:'var(--tx2)',fontSize:13}},
      'Không có đơn hàng chờ giao vào ngày '+fmtDate2(date)
    ),
    h(Row,null,
      h('button',{onClick:onClose},'Hủy'),
      h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'},disabled:preview.length===0},
        h('i',{className:'ti ti-stack-2',style:{fontSize:14}}),
        ' Tạo '+preview.length+' chuyến'
      )
    )
  );
}

function TripsTab({trips,setTrips,orders,setOrders,employees,shifts,customers,products,currentUser}){
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[open,so]=useState(null);
  const _td1=fmtDate();const _ti1=_td1.split('/').reverse().join('-');const[fDate,sfDate]=useState(_ti1);const[fShift,sfShift]=useState('');const[fDriver,sfDriver]=useState('');
  const isDriver=currentUser?.role==='driver';
  const canManageTrips=currentUser?.role==='admin'||currentUser?.role==='manager';
  const deptKey=String(currentUser?.dept||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const canEditDeliveryOrder=canManageTrips||deptKey.includes('ke toan');
  const cleanName=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,' ');
  const isOwnTrip=t=>!isDriver||t.driverId===currentUser.id||cleanName(t.driverName)===cleanName(currentUser.name);
  const visibleTrips=trips.filter(isOwnTrip);
  const canUploadProof=canManageTrips||isDriver;
  let tSeq=trips.length+1;
  const orderStatusForTrip=s=>s==='active'?'delivering':s==='completed'?'done':'assigned';
  const save=d=>{
    if(edit){
      const old=trips.find(t=>t.id===edit.id);
      const tripId=edit.id;
      if(old){setOrders(p=>p.map(o=>{
        if((old.orderIds||[]).includes(o.id)&&!(d.orderIds||[]).includes(o.id))return {...o,tripId:null,status:'pending'};
        if((d.orderIds||[]).includes(o.id))return {...o,tripId,status:orderStatusForTrip(d.status)};
        return o;
      }));}
      setTrips(p=>p.map(t=>t.id===edit.id?{...edit,...d,id:tripId}:t));
    } else {
      const [dd2,mm2,yy2]=(d.deliveryDate||fmtDate()).split('/');
      const datePart=(dd2||'00')+(mm2||'00')+(yy2||'0000').slice(-2);
      // Ca: lấy chữ viết tắt (CA SANG→S, CA TRUA→T, CA CHIEU→C, CA DEM→D)
      const shiftAbbr=(d.shiftName||'').toUpperCase()
        .replace(/CA\s*/,'')
        .replace(/SÁNG|SANG/,'S').replace(/TRƯA|TRUA/,'T')
        .replace(/CHIỀU|CHIEU/,'C').replace(/ĐÊM|DEM/,'D')
        .replace(/[^A-Z0-9]/g,'').slice(0,3)||'CA';
      // Lái xe: 2-3 chữ cái đầu họ tên
      const driverAbbr=d.driverName?(d.driverName.trim().split(/\s+/).map(w=>w[0]).join('').toUpperCase().slice(0,3)):'';
      const baseId='CH'+datePart+shiftAbbr+(driverAbbr?'_'+driverAbbr:'');
      // Tránh trùng: thêm số thứ tự nếu cần
      let id=baseId;
      let seq=2;
      while(trips.find(t=>t.id===id)){id=baseId+'_'+seq;seq++;}
      setTrips(p=>[...p,{...d,id,createdAt:fmtDate()}]);
      setOrders(p=>p.map(o=>(d.orderIds||[]).includes(o.id)?{...o,tripId:id,status:orderStatusForTrip(d.status)}:o));
    }
    sm(null);se(null);
  };
  const del=id=>{
    const t=trips.find(x=>x.id===id);
    if(t)setOrders(p=>p.map(o=>(t.orderIds||[]).includes(o.id)?{...o,tripId:null,status:'pending'}:o));
    if(confirm('Xóa chuyến giao?'))setTrips(p=>p.filter(x=>x.id!==id));
  };
  const updStatus=(id,status)=>{
    const t=trips.find(x=>x.id===id);
    const stamp=fmtDT();
    setTrips(p=>p.map(x=>x.id===id?{
      ...x,
      status,
      ...(status==='assigned'?{assignedAt:x.assignedAt||stamp}:{}),
      ...(status==='active'?{startTime:x.startTime||stamp}:{}),
      ...(status==='completed'?{endTime:x.endTime||stamp,completedAt:x.completedAt||stamp,attendanceStatus:x.attendanceStatus||'pending'}:{})
    }:x));
    if(t){
      if(status==='assigned')setOrders(p=>p.map(o=>(t.orderIds||[]).includes(o.id)?{...o,status:'assigned'}:o));
      if(status==='active')setOrders(p=>p.map(o=>(t.orderIds||[]).includes(o.id)?{...o,status:'delivering'}:o));
      if(status==='completed')setOrders(p=>p.map(o=>(t.orderIds||[]).includes(o.id)?{...o,status:'done'}:o));
    }
  };
  const lineQty=l=>numFmt(l.qtyInvoice)||numFmt(l.qtyProd)||numFmt(l.qty)||numFmt(l.quantity)||0;
  const lineWeight=l=>{const prod=products?.find(p=>p.id===l.productId);const unit=String(l.unit||prod?.unit||'').trim().toLowerCase().replace(/[^a-z]/g,'');const qty=lineQty(l);if(unit==='kg'||unit==='kgs'||unit==='kilogram'||unit==='kilograms')return qty;const wpu=prod?.weightPerUnit||numFmt(l.weightPerUnit)||0;return wpu*qty;};
  const orderWeight=o=>(o.lines||[]).reduce((s,l)=>s+lineWeight(l),0);
  const deliveryOrderValue=o=>numFmt(o.deliveryOrder??o.deliverySeq??o.deliveryIndex);
  const sortedTripOrders=trip=>orders.filter(o=>(trip.orderIds||[]).includes(o.id)).sort((a,b)=>{
    const av=deliveryOrderValue(a),bv=deliveryOrderValue(b);
    const ao=av>0?av:999999,bo=bv>0?bv:999999;
    return ao-bo||(a.deliveryTime||'').localeCompare(b.deliveryTime||'')||(a.pointName||a.customer||'').localeCompare(b.pointName||b.customer||'','vi');
  });
  const updateDeliveryOrder=(orderId,value)=>{
    const v=numFmt(value);
    setOrders(prev=>prev.map(o=>o.id===orderId?{...o,deliveryOrder:v||'',deliverySeq:v||'',updatedBy:currentUser?.name||'',updatedAt:fmtDT()}:o));
  };
  const calcTripWeight=t=>{
    const tripOrders=sortedTripOrders(t);
    return tripOrders.reduce((s,o)=>s+orderWeight(o),0)||numFmt(t.totalWeight);
  };
  const filteredTrips=visibleTrips.filter(t=>((!fDate||(t.deliveryDate===(fDate.split('-').reverse().join('/'))))||!fDate)&&(!fShift||t.shiftId===fShift)&&(!fDriver||t.driverName===fDriver));
  const attendanceRows=filteredTrips.filter(t=>t.status==='completed').map(t=>{
    const tripOrders=sortedTripOrders(t);
    const weight=calcTripWeight(t);
    const kgPay=weight*numFmt(t.weightRate);
    const allowance=numFmt(t.tripAllowance);
    return {...t,tripOrders,weight,kgPay,allowance,totalPay:kgPay+allowance};
  });
  const attendanceTotal=attendanceRows.reduce((a,t)=>({
    trips:a.trips+1,
    orders:a.orders+t.tripOrders.length,
    weight:a.weight+t.weight,
    work:a.work+numFmt(t.driverWork),
    pay:a.pay+t.totalPay
  }),{trips:0,orders:0,weight:0,work:0,pay:0});
  const confirmAttendance=id=>{
    setTrips(p=>p.map(t=>t.id===id?{...t,attendanceStatus:'confirmed',confirmedBy:currentUser.name,confirmedAt:fmtDT()}:t));
  };
  const saveOrderInvoiceImage=async(order,file)=>{
    if(!file)return;
    try{
      const url=await uploadPhoto(file,'order-invoices/'+(order.id||'order'));
      setOrders(prev=>prev.map(x=>x.id===order.id?{...x,invoiceImage:url,invoiceImageName:file.name||'hoa-don.jpg',invoiceUploadedAt:fmtDT(),invoiceUploadedBy:currentUser?.name||''}:x));
    }catch(e){window.showToast('Không đọc được ảnh hóa đơn: '+(e.message||e),'error');}
  };
  const pickOrderInvoiceImage=order=>{
    const inp=document.createElement('input');
    inp.type='file';inp.accept='image/*';inp.capture='environment';
    inp.onchange=e=>saveOrderInvoiceImage(order,e.target.files&&e.target.files[0]);
    inp.click();
  };
  const updateDeliveredQty=(orderId,lineId,value)=>{
    const qty=numFmt(value);
    setOrders(prev=>prev.map(o=>o.id===orderId?{...o,lines:(o.lines||[]).map(l=>l.id===lineId?{...l,qtyDelivered:qty,deliveredAt:fmtDT(),deliveredBy:currentUser?.name||''}:l)}:o));
  };
  const createTripForSelection=()=>{
    if(!canManageTrips){window.showToast('Tài khoản lái xe chỉ xem chuyến được giao.','info');return;}
    if(!fDate){window.showToast('Vui lòng chọn ngày giao trước khi tạo chuyến!','warn');return;}
    if(!fShift){window.showToast('Vui lòng chọn ca giao hàng!','warn');return;}
    const sh=(shifts||[]).find(x=>x.id===fShift);
    if(!sh){window.showToast('Ca giao hàng không hợp lệ!','error');return;}
    const dateVN=fDate.split('-').reverse().join('/');
    const existed=trips.find(t=>t.deliveryDate===dateVN&&t.shiftId===sh.id);
    if(existed){window.showToast('Ngày '+dateVN+' đã có chuyến của ca này rồi: '+existed.id+'. Không tạo thêm.','warn');return;}
    const [dd2,mm2,yy2]=dateVN.split('/');
    const datePart=(dd2||'00')+(mm2||'00')+(yy2||'0000').slice(-2);
    const shiftAbbr=(sh.name||sh.id||'').toUpperCase()
      .replace(/CA\s*/,'')
      .replace(/SÁNG|SANG/,'S').replace(/TRƯA|TRUA/,'T')
      .replace(/CHIỀU|CHIEU/,'C').replace(/ĐÊM|DEM/,'D')
      .replace(/[^A-Z0-9]/g,'').slice(0,3)||'CA';
    const baseId='CH'+datePart+shiftAbbr;
    let id=baseId;let seq=2;
    while(trips.find(t=>t.id===id)){id=baseId+'_'+seq;seq++;}
    const stamp=fmtDT();
    setTrips(p=>[...p,{
      id,deliveryDate:dateVN,deliveryTime:sh.timeStart||sh.startTime||'',
      shiftId:sh.id,shiftName:sh.name||sh.id,area:sh.area||'',
      driverName:'',driverId:'',orderIds:[],totalWeight:0,
      status:'planning',note:'',driverWork:0,weightRate:0,tripAllowance:0,
      attendanceStatus:'pending',createdAt:stamp,updatedBy:currentUser.name,updatedAt:stamp
    }]);
    so(id);
  };
  const printTrip=trip=>{
    const tripOrders=sortedTripOrders(trip);
    const totalW=calcTripWeight(trip);
    const w=window.open('','_blank','width=900,height=700');
    if(!w){window.showToast('Trình duyệt đang chặn popup in. Hãy cho phép popup.','warn');return;}
    const rows=tripOrders.map(o=>{
      const ow=orderWeight(o);
      const items=(o.lines||[]).reduce((s,l)=>s+(l.productName?'• '+l.productName+' '+lineQty(l)+(l.unit?' '+l.unit:'')+'<br>':''),'');
      return '<tr><td style="text-align:center">'+(deliveryOrderValue(o)||'')+'</td><td>'+(o.pointName||o.customer||'')+'</td><td>'+(o.deliveryTime||'')+'</td><td>'+items+'</td><td style="font-weight:700">'+ow.toFixed(2)+'</td></tr>';
    }).join('');
    w.document.write('<html><head><title>Chuyến '+trip.id+'</title><style>body{font-family:Arial;padding:16px;font-size:13px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #333;padding:5px 8px}th{background:#d9e8d9}h2{color:#2d6a4f}.total{font-weight:700;text-align:right;padding:8px;background:#f5fbf5}@media print{@page{margin:8mm}}<\/style><\/head><body><h2>Chuyến: '+trip.id+'</h2><p>Ngày: <b>'+trip.deliveryDate+'</b> &nbsp;|&nbsp; Ca: <b>'+(trip.shiftName||'—')+'</b> &nbsp;|&nbsp; Lái xe: <b>'+(trip.driverName||'—')+'</b> &nbsp;|&nbsp; Tổng KL: <b>'+totalW.toFixed(2)+' kg</b></p><table><thead><tr><th>Thứ tự giao</th><th>Địa điểm</th><th>Giờ</th><th>Hàng hóa</th><th>KL (kg)</th></tr></thead><tbody>'+rows+'<\/tbody><\/table><div class="total">Tổng: '+tripOrders.length+' đơn — '+totalW.toFixed(2)+' kg</div><br><div style="display:flex;justify-content:space-between;margin-top:24px"><div style="text-align:center;width:40%"><div>Lái xe</div><div style="height:50px"></div><small>(Ký tên)</small></div><div style="text-align:center;width:40%"><div>Người nhận</div><div style="height:50px"></div><small>(Ký tên)</small></div></div><\/body><\/html>');
    w.document.close();setTimeout(()=>w.print(),400);
  };
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-steering-wheel',style:{fontSize:20}}),'Chuyến giao hàng'),
    h('div',{style:{display:'flex',justifyContent:'flex-end',gap:8,marginBottom:'1rem'}},
      canManageTrips&&h('button',{
        onClick:()=>sm('bulk'),
        style:{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',fontSize:13,
          border:'1px solid var(--pri)',color:'var(--pri)',background:'transparent',
          borderRadius:'var(--r)',cursor:'pointer',fontWeight:500}
      },h('i',{className:'ti ti-stack-2',style:{fontSize:15}}),'Tạo nhiều chuyến'),
      canManageTrips&&h(AddBtn,{onClick:createTripForSelection,label:'Tạo chuyến mới'})
    ),
    h('div',{style:{display:'flex',gap:8,marginBottom:'1rem',flexWrap:'wrap'}},
      h('input',{type:'date',value:fDate,onChange:e=>sfDate(e.target.value),style:{padding:'6px 10px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:13}}),
      h('select',{value:fShift,onChange:e=>sfShift(e.target.value),style:{padding:'6px 10px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:13}},
        h('option',{value:''},'Tất cả ca'),
        (shifts||[]).map(sh=>h('option',{key:sh.id,value:sh.id},sh.name||sh.id))
      ),
      !isDriver&&h('select',{value:fDriver,onChange:e=>sfDriver(e.target.value),style:{padding:'6px 10px',borderRadius:'var(--r)',border:'1px solid var(--bd)',fontSize:13}},
        h('option',{value:''},'Tất cả lái xe'),
        [...new Set(visibleTrips.map(t=>t.driverName).filter(Boolean))].map(d=>h('option',{key:d,value:d},d))
      ),
      (fDate||fShift||fDriver)&&h('button',{onClick:()=>{sfDate('');sfShift('');sfDriver('');},style:{padding:'6px 10px',fontSize:12,borderRadius:'var(--r)',border:'1px solid var(--bd)',cursor:'pointer',color:'var(--tx2)'}},'✕ Xóa lọc')
    ),
    h('div',{className:'card',style:{marginBottom:'1rem'}},
      h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,marginBottom:10,flexWrap:'wrap'}},
        h('div',{style:{fontWeight:600,color:'var(--pri3)'}},h('i',{className:'ti ti-clipboard-check',style:{fontSize:16,marginRight:6}}),'Chấm công lái xe theo chuyến'),
        h('div',{style:{display:'flex',gap:12,fontSize:12,color:'var(--tx2)',flexWrap:'wrap'}},
          h('span',null,'Chuyến: ',h('b',null,attendanceTotal.trips)),
          h('span',null,'Đơn: ',h('b',null,attendanceTotal.orders)),
          h('span',null,'Kg: ',h('b',null,attendanceTotal.weight.toFixed(1))),
          h('span',null,'Công: ',h('b',null,attendanceTotal.work)),
          h('span',null,'Tổng tiền: ',h('b',null,attendanceTotal.pay.toLocaleString('vi-VN')))
        )
      ),
      attendanceRows.length?h('div',{className:'tw'},
        h('table',null,
          h('thead',null,h('tr',null,...['Ngày','Lái xe','Chuyến','Đơn','Kg chuyến','Công','Tiền kg','Phụ cấp','Tổng','Xác nhận'].map(c=>h('th',{key:c},c)))),
          h('tbody',null,attendanceRows.map(t=>h('tr',{key:'att'+t.id},
            h('td',null,t.deliveryDate),
            h('td',null,t.driverName||'—'),
            h('td',null,h('span',{style:{color:'var(--pri)',fontWeight:500}},t.id)),
            h('td',null,t.tripOrders.length),
            h('td',null,t.weight.toFixed(2)+' kg'),
            h('td',null,numFmt(t.driverWork)),
            h('td',null,t.kgPay?t.kgPay.toLocaleString('vi-VN'):'—'),
            h('td',null,t.allowance?t.allowance.toLocaleString('vi-VN'):'—'),
            h('td',null,h('b',null,t.totalPay?t.totalPay.toLocaleString('vi-VN'):'—')),
            h('td',null,t.attendanceStatus==='confirmed'
              ?h('span',{className:'badge',style:{background:'#E1F5EE',color:'#0F6E56'}},'Đã xác nhận')
              :canManageTrips?h('button',{onClick:()=>confirmAttendance(t.id),style:{fontSize:11,padding:'4px 8px'}},'Xác nhận'):h('span',{style:{fontSize:12,color:'var(--tx2)'}},'Chờ xác nhận')
            )
          )))
        )
      ):h('div',{style:{fontSize:13,color:'var(--tx2)',padding:'8px 0'}},'Chưa có chuyến hoàn thành để chấm công theo bộ lọc hiện tại.')
    ),
    filteredTrips.length?h('div',{style:{display:'flex',flexDirection:'column',gap:'1rem'}},
      filteredTrips.map(trip=>{
        const tripOrders=sortedTripOrders(trip);
        const isOpen=open===trip.id;
        const totalW=calcTripWeight(trip);
        return h('div',{key:trip.id,className:'card',style:{padding:0,overflow:'hidden'}},
          h('div',{style:{display:'flex',alignItems:'center',gap:12,padding:'1rem 1.25rem',cursor:'pointer'},onClick:()=>so(isOpen?null:trip.id)},
            h('i',{className:'ti ti-chevron-'+(isOpen?'up':'down'),style:{fontSize:16,color:'var(--tx2)',flexShrink:0}}),
            h('div',{style:{flex:1}},
              h('div',{style:{display:'flex',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:4}},
                h('span',{style:{fontWeight:500}},trip.deliveryDate&&trip.shiftName?trip.deliveryDate+' — '+trip.shiftName:trip.id),
                h('span',{style:{color:'var(--tx2)'}},trip.driverName||'—'),
                h(StatusBadge,{s:trip.status})
              ),
              h('div',{style:{display:'flex',gap:16,fontSize:12,color:'var(--tx2)',flexWrap:'wrap'}},
                h('span',null,h('i',{className:'ti ti-calendar',style:{fontSize:12,marginRight:3}}),trip.deliveryDate+(trip.shiftName?' — '+trip.shiftName:trip.deliveryTime?' '+trip.deliveryTime:'')),
                trip.driverWork?h('span',null,h('i',{className:'ti ti-tools',style:{fontSize:12,marginRight:3}}),'Công: '+trip.driverWork):null,
                h('span',null,h('i',{className:'ti ti-package',style:{fontSize:12,marginRight:3}}),tripOrders.length+' đơn'),
                totalW>0&&h('span',{style:{color:'var(--pri)',fontWeight:500}},h('i',{className:'ti ti-weight',style:{fontSize:12,marginRight:3}}),totalW.toFixed(2)+' kg')
              )
            ),
            h('div',{style:{display:'flex',gap:4},onClick:e=>e.stopPropagation()},
              canManageTrips&&trip.status==='planning'&&h('button',{onClick:()=>updStatus(trip.id,'assigned'),style:{fontSize:11,padding:'4px 10px',background:'#E6F1FB',color:'#185FA5',border:'none',borderRadius:4}},'Giao lái xe'),
              canManageTrips&&(trip.status==='planning'||trip.status==='assigned')&&h('button',{onClick:()=>updStatus(trip.id,'active'),style:{fontSize:11,padding:'4px 10px',background:'#EAF3DE',color:'#3B6D11',border:'none',borderRadius:4}},'Bắt đầu giao'),
              canManageTrips&&trip.status==='active'&&h('button',{onClick:()=>updStatus(trip.id,'completed'),style:{fontSize:11,padding:'4px 10px',background:'#E1F5EE',color:'#0F6E56',border:'none',borderRadius:4}},'Hoàn thành'),
              h('button',{className:'bi',title:'In chuyến',onClick:()=>printTrip(trip)},h('i',{className:'ti ti-printer',style:{fontSize:15}})),
              canManageTrips&&h('button',{className:'bi',onClick:()=>{se(trip);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
              canManageTrips&&h('button',{className:'bi',onClick:()=>del(trip.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
            )
          ),
          isOpen&&h('div',{style:{borderTop:'.5px solid var(--bd)',padding:'1rem 1.25rem'}},
            // Tổng KL chuyến
            h('div',{style:{display:'flex',gap:16,marginBottom:10,flexWrap:'wrap',alignItems:'center'}},
              h('span',{style:{fontSize:13,fontWeight:600,color:'var(--pri)'}},
                h('i',{className:'ti ti-weight',style:{marginRight:4}}),
                'Tổng KL: '+(totalW>0?totalW.toFixed(2)+' kg':'—')
              ),
              h('span',{style:{fontSize:13,color:'var(--tx2)'}},tripOrders.length+' đơn hàng'),
              // Nút in
              h('button',{
                onClick:()=>printTrip(trip),
                style:{padding:'4px 12px',fontSize:12,display:'flex',alignItems:'center',gap:4,
                  border:'1px solid var(--pri)',color:'var(--pri)',background:'transparent',
                  borderRadius:'var(--r)',cursor:'pointer'}
              },h('i',{className:'ti ti-printer',style:{fontSize:13}}),'In chuyến')
            ),
            trip.note&&h('div',{style:{fontSize:13,color:'var(--tx2)',marginBottom:8,padding:'6px 10px',background:'var(--bg2)',borderRadius:'var(--r)'}},
              h('i',{className:'ti ti-notes',style:{marginRight:4}}),'Ghi chú: '+trip.note
            ),
            // Bảng đơn hàng
            h('div',{style:{fontWeight:500,fontSize:12,color:'var(--tx2)',marginBottom:6}},'Chi tiết đơn hàng:'),
            tripOrders.length?h('div',{className:'tw'},
              h('table',null,
                h('thead',null,h('tr',null,...['Thứ tự giao','Địa điểm','Giờ','Hàng hóa','SL đã giao','KL (kg)','Ảnh HĐ','Trạng thái'].map(c=>h('th',{key:c},c)))),
                h('tbody',null,tripOrders.map(o=>{
                  const w=orderWeight(o);
                  return h('tr',{key:o.id},
                    h('td',null,canEditDeliveryOrder
                      ?h('input',{type:'number',min:1,step:1,value:deliveryOrderValue(o)||'',placeholder:'...',onChange:e=>updateDeliveryOrder(o.id,e.target.value),style:{fontSize:12,padding:'4px 6px',width:64,textAlign:'center'}})
                      :h('span',{style:{fontWeight:600,color:'var(--pri)'}},deliveryOrderValue(o)||'—')
                    ),
                    h('td',null,h('span',{style:{fontWeight:600}},o.pointName||o.customer||'—')),
                    h('td',null,o.deliveryTime||'—'),
                    h('td',null,h('div',{style:{fontSize:11}},(o.lines||[]).map((l,i)=>h('div',{key:i,style:{minHeight:30,display:'flex',alignItems:'center'}},l.productName+' · '+lineQty(l)+(l.unit?' '+l.unit:''))))),
                    h('td',null,h('div',{style:{display:'grid',gap:4,minWidth:92}},(o.lines||[]).map(l=>h('input',{key:l.id,type:'number',min:0,step:'0.01',value:l.qtyDelivered??'',placeholder:String(lineQty(l)||0),onChange:e=>updateDeliveredQty(o.id,l.id,e.target.value),style:{fontSize:12,padding:'4px 6px',width:86,borderColor:(l.qtyDelivered!==undefined&&numFmt(l.qtyDelivered)!==lineQty(l))?'#E0A800':'var(--bd)'}})))),
                    h('td',null,w>0?h('span',{style:{fontWeight:600,color:'var(--pri)'}},w.toFixed(2)+' kg'):'—'),
                    h('td',null,
                      o.invoiceImage
                        ?h('div',{style:{display:'flex',gap:4}},
                          h('button',{className:'bi',title:'Xem ảnh hóa đơn',onClick:()=>window.open(o.invoiceImage,'_blank')},h('i',{className:'ti ti-photo-check',style:{fontSize:15,color:'var(--pri)'}})),
                          canUploadProof&&h('button',{className:'bi',title:'Chụp lại hóa đơn',onClick:()=>pickOrderInvoiceImage(o)},h('i',{className:'ti ti-camera-up',style:{fontSize:15}}))
                        )
                        :canUploadProof?h('button',{className:'bi',title:'Chụp hóa đơn đơn hàng',onClick:()=>pickOrderInvoiceImage(o)},h('i',{className:'ti ti-camera-plus',style:{fontSize:15}})):'—'
                    ),
                    h('td',null,h(StatusBadge,{s:o.status}))
                  );
                }))
              )
            ):h('p',{style:{fontSize:13,color:'var(--tx2)'}},'Chưa có đơn hàng.'),
            // Phần chụp ảnh sau giao
            h('div',{style:{marginTop:12,padding:'10px 12px',background:'#f8f9fa',border:'1px solid var(--bd)',borderRadius:'var(--r)'}},
              h('div',{style:{fontWeight:600,fontSize:12,color:'var(--tx2)',marginBottom:8,display:'flex',alignItems:'center',gap:6}},
                h('i',{className:'ti ti-camera',style:{fontSize:14}}),'Ảnh xác nhận giao hàng'
              ),
              // Hiện ảnh đã upload
              (trip.photos||[]).length>0&&h('div',{style:{display:'flex',gap:8,flexWrap:'wrap',marginBottom:8}},
                (trip.photos||[]).map((ph,i)=>h('div',{key:i,style:{position:'relative'}},
                  h('img',{src:ph,alt:'Ảnh '+i,
                    style:{width:100,height:100,objectFit:'cover',borderRadius:'var(--r)',border:'1px solid var(--bd)',cursor:'pointer'},
                    onClick:()=>window.open(ph,'_blank')
                  }),
                  canManageTrips&&h('button',{
                    onClick:()=>setTrips(prev=>prev.map(t=>t.id===trip.id?{...t,photos:(t.photos||[]).filter((_,j)=>j!==i)}:t)),
                    style:{position:'absolute',top:2,right:2,background:'rgba(163,45,45,.8)',color:'#fff',
                      border:'none',borderRadius:'50%',width:18,height:18,fontSize:11,cursor:'pointer',
                      display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1}
                  },'×')
                ))
              ),
              // Nút upload ảnh
              canUploadProof&&h('label',{style:{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',
                border:'1px dashed var(--pri)',color:'var(--pri)',borderRadius:'var(--r)',
                cursor:'pointer',fontSize:12,fontWeight:500}},
                h('i',{className:'ti ti-upload',style:{fontSize:14}}),
                (trip.photos||[]).length>0?'Thêm ảnh':'Chụp / tải ảnh lên',
                h('input',{type:'file',accept:'image/*',capture:'environment',multiple:true,
                  style:{display:'none'},
                  onChange:async e=>{
                    const files=Array.from(e.target.files);
                    for(const file of files){
                      try{
                        const url=await uploadPhoto(file,'trip-proofs/'+(trip.id||'trip'));
                        setTrips(prev=>prev.map(t=>t.id===trip.id?{...t,photos:[...(t.photos||[]),url]}:t));
                      }catch(err){window.showToast('Không đọc được ảnh: '+(err.message||err),'error');}
                    }
                    e.target.value='';
                  }
                })
              ),
              (trip.photos||[]).length>0&&h('span',{style:{fontSize:11,color:'var(--tx2)',marginLeft:8}},
                (trip.photos||[]).length+' ảnh'
              )
            )
          )
        );
      })
    ):h('div',{style:{textAlign:'center',padding:'3rem',color:'var(--tx2)',background:'#fff',borderRadius:'var(--rl)',border:'.5px solid var(--bd)'}},
      h('i',{className:'ti ti-steering-wheel',style:{fontSize:56,display:'block',marginBottom:'1rem',color:'var(--pri2)'}}),
      'Chưa có chuyến giao hàng nào.'
    ),
    canManageTrips&&modal==='f'&&h(TripForm,{trip:edit,orders,employees,shifts,customers,products,currentUser,onSave:save,onClose:()=>{sm(null);se(null);}}),
    canManageTrips&&modal==='bulk'&&h(BulkTripModal,{orders,employees,shifts,customers,products,trips,currentUser,initialDate:fDate,initialShift:fShift,
      onSave:(newTrips)=>{
        setTrips(p=>[...p,...newTrips]);
        // Cập nhật tripId cho đơn hàng
        newTrips.forEach(t=>{
          setOrders(p=>p.map(o=>(t.orderIds||[]).includes(o.id)?{...o,tripId:t.id,status:t.status==='assigned'?'assigned':'pending'}:o));
        });
        sm(null);
      },
      onClose:()=>sm(null)
    })
  );
}

/* ═══════════ GIAI ĐOẠN 4: SẢN XUẤT ═══════════ */

/* ─── Tổng hợp sản xuất ─── */
function ProductionSummaryTab({orders,products,prodShifts,prodShiftRules,prodActuals,setProdActuals,currentUser}){
  const[date,setDate]=useState(fmtDate());
  const[shift,setShift]=useState('all');
  const rules=(prodShiftRules&&prodShiftRules.length?prodShiftRules:DEF_PROD_SHIFT_RULES);
  const actualKey=(prodDate,shiftId,productId)=>[prodDate||'',shiftId||'',productId||''].join('|');
  const readActualQty=(prodDate,shiftId,productId)=>{
    const rec=(prodActuals||{})[actualKey(prodDate,shiftId,productId)];
    return rec&&rec.qty!==undefined&&rec.qty!==null?numFmt(rec.qty):'';
  };
  const readBadQty=(prodDate,shiftId,productId)=>{
    const rec=(prodActuals||{})[actualKey(prodDate,shiftId,productId)];
    return rec&&rec.badQty!==undefined&&rec.badQty!==null?numFmt(rec.badQty):'';
  };
  const saveActuals=(prodDate,shiftId,productId,productName,data)=>{
    const key=actualKey(prodDate,shiftId,productId);
    const nextQty=data&&data.qty!==undefined?(data.qty===''?'':numFmt(data.qty)):undefined;
    const nextBadQty=data&&data.badQty!==undefined?(data.badQty===''?'':numFmt(data.badQty)):undefined;
    setProdActuals(prev=>{
      const base=prev||{};
      const next={...base};
      const current=next[key]||{};
      const merged={
        ...current,
        ...(nextQty!==undefined?{qty:nextQty}:{}),
        ...(nextBadQty!==undefined?{badQty:nextBadQty}:{})
      };
      const emptyQty=merged.qty===''||merged.qty===undefined||merged.qty===null;
      const emptyBadQty=merged.badQty===''||merged.badQty===undefined||merged.badQty===null;
      if(emptyQty&&emptyBadQty){
        delete next[key];
      }else{
        next[key]={...merged,date:prodDate,shiftId,productId,productName,updatedAt:fmtDT(),updatedBy:currentUser?.name||''};
      }
      return next;
    });
  };

  // Aggregate from delivery orders
  const dayOrders=orders.filter(o=>o.status!=='cancelled');
  const aggMap={};
  dayOrders.forEach(o=>{
    const plans=prodShiftPlansForOrder(o,prodShifts||[]);
    (o.lines||[]).forEach((l,idx)=>{
      if(!l.productId)return;
      const plan=plans[idx]||prodShiftPlan(o,prodShifts||[]);
      const prodTime=l.shiftOverride?(l.prodTime||plan?.prodTime||''):(plan?.prodTime||'');
      const prodDate=l.shiftOverride?(l.prodDate||plan?.prodDate||o.deliveryDate):(plan?.prodDate||o.deliveryDate);
      if(prodDate!==date)return;
      const rule=getProdWorkShiftRule(prodTime,rules)||{id:'unknown',name:'Chưa xác định',group:'Chưa xác định',color:'#F1EFE8',textColor:'#5F5E5A'};
      const key=l.productId+'_'+rule.id;
      if(!aggMap[key])aggMap[key]={productId:l.productId,productName:l.productName,unit:l.unit,shift:rule.id,shiftName:rule.name,shiftGroup:rule.group,rule,qtyProd:0,orders:[],prodDate:date};
      aggMap[key].qtyProd+=numFmt(l.qtyProd);
      aggMap[key].orders.push(o.id);
    });
  });
  // Sort theo thứ tự sản phẩm trong bảng sản phẩm (products array)
  const prodOrder=Object.fromEntries(products.map((p,i)=>[p.id,i]));
  const sortByProdOrder=(a,b)=>{
    const ai=prodOrder[a.productId]??9999;
    const bi=prodOrder[b.productId]??9999;
    return ai-bi;
  };
  const rows=Object.values(aggMap).filter(r=>shift==='all'||r.shift===shift);
  const unknownRule={id:'unknown',name:'Chưa xác định',group:'Chưa xác định',start:'',end:'',color:'#F1EFE8',textColor:'#5F5E5A'};
  const shiftGroups=[...rules,unknownRule].map(rule=>({rule,rows:rows.filter(r=>r.shift===rule.id).sort(sortByProdOrder)})).filter(g=>g.rows.length);
  const sumActualRows=list=>list.reduce((sum,r)=>sum+numFmt(readActualQty(r.prodDate,r.shift,r.productId)),0);
  const sumBadRows=list=>list.reduce((sum,r)=>sum+numFmt(readBadQty(r.prodDate,r.shift,r.productId)),0);
  const readGoodQty=(prodDate,shiftId,productId)=>numFmt(readActualQty(prodDate,shiftId,productId))-numFmt(readBadQty(prodDate,shiftId,productId));
  const isInvalidActualRow=(prodDate,shiftId,productId)=>numFmt(readBadQty(prodDate,shiftId,productId))>numFmt(readActualQty(prodDate,shiftId,productId));
  const calcBadRate=(actualQty,badQty)=>numFmt(actualQty)>0?(numFmt(badQty)/numFmt(actualQty))*100:0;
  const fmtRate=rate=>((Math.round(numFmt(rate)*10)/10).toLocaleString('vi-VN'))+'%';
  const sumGoodRows=list=>list.reduce((sum,r)=>sum+readGoodQty(r.prodDate,r.shift,r.productId),0);
  const hasInvalidRows=list=>list.some(r=>isInvalidActualRow(r.prodDate,r.shift,r.productId));
  const majorGroupMap={};
  const majorGroupOrder=[];
  shiftGroups.forEach(g=>{
    const gName=g.rule.group||'Chưa xác định';
    const qtyProd=g.rows.reduce((sum,r)=>sum+numFmt(r.qtyProd),0);
    const qtyActual=sumActualRows(g.rows);
    const qtyBad=sumBadRows(g.rows);
    const qtyGood=sumGoodRows(g.rows);
    const badRate=calcBadRate(qtyActual,qtyBad);
    const hasInvalid=hasInvalidRows(g.rows);
    if(!majorGroupMap[gName]){
      majorGroupMap[gName]={
        name:gName,
        shifts:[],
        qtyProd:0,
        qtyActual:0,
        qtyBad:0,
        qtyGood:0,
        badRate:0,
        hasInvalid:false,
        rowCount:0,
        color:g.rule.color||'#EAF3DE',
        textColor:g.rule.textColor||'var(--pri3)'
      };
      majorGroupOrder.push(gName);
    }
    majorGroupMap[gName].shifts.push({...g,qtyProd,qtyActual,qtyBad,qtyGood,badRate,hasInvalid});
    majorGroupMap[gName].qtyProd+=qtyProd;
    majorGroupMap[gName].qtyActual+=qtyActual;
    majorGroupMap[gName].qtyBad+=qtyBad;
    majorGroupMap[gName].qtyGood+=qtyGood;
    majorGroupMap[gName].badRate=calcBadRate(majorGroupMap[gName].qtyActual,majorGroupMap[gName].qtyBad);
    majorGroupMap[gName].hasInvalid=majorGroupMap[gName].hasInvalid||hasInvalid;
    majorGroupMap[gName].rowCount+=g.rows.length;
  });
  const majorGroups=majorGroupOrder.map(name=>majorGroupMap[name]).filter(Boolean);

  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-clipboard-list',style:{fontSize:20}}),'Tổng hợp sản xuất'),
    h('div',{className:'card',style:{marginBottom:'1.25rem'}},
      h('div',{className:'g3'},
        h(F,{label:'Ngày sản xuất'},h('input',{type:'date',value:toIsoDate(date),onChange:e=>setDate(vnDateFromISO(e.target.value)||''),placeholder:'DD/MM/YYYY'})),
        h(F,{label:'Ca sản xuất'},h('select',{value:shift,onChange:e=>setShift(e.target.value)},
          h('option',{value:'all'},'Tất cả ca'),
          rules.map(r=>h('option',{key:r.id,value:r.id},r.name))
        )),
        h('div',{style:{display:'flex',flexDirection:'column',justifyContent:'flex-end'}},
          h('div',{style:{fontSize:13,color:'var(--tx2)',marginBottom:4}},'Số dòng sản xuất ngày này'),
          h('div',{style:{fontSize:20,fontWeight:600,color:'var(--pri)'}},rows.length+' dòng')
        )
      )
    ),
    rows.length===0?h('div',{style:{textAlign:'center',padding:'3rem',color:'var(--tx2)',background:'#fff',borderRadius:'var(--rl)',border:'.5px solid var(--bd)'}},
      h('i',{className:'ti ti-clipboard-x',style:{fontSize:56,display:'block',marginBottom:'1rem',color:'var(--pri2)'}}),
      'Không có dữ liệu sản xuất cho ngày '+date
    ):h('div',null,
      h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:'1rem',marginBottom:'1.25rem'}},
        majorGroups.map(g=>h('div',{key:'sum_'+g.name,className:'card',style:{padding:'1rem',border:`1px solid ${g.hasInvalid?'#FCA5A5':g.color}`,boxShadow:'none',background:'linear-gradient(180deg,#fff,rgba(255,255,255,.96))'}},
          h('div',{style:{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start'}},
            h('div',null,
              h('div',{style:{fontSize:12,fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',color:g.textColor}},g.name),
              h('div',{style:{fontSize:12,color:g.hasInvalid?'#B91C1C':'var(--tx2)',marginTop:4}},g.hasInvalid?'Có dòng nhập lỗi cần kiểm tra':g.shifts.length+' ca nhỏ · '+g.rowCount+' dòng')
            ),
            h('div',{style:{padding:'4px 10px',borderRadius:999,background:g.color,color:g.textColor,fontSize:12,fontWeight:600}},g.shifts.map(s=>s.rule.name.replace((g.name||'')+' ','')).join(' • '))
          ),
          h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:10,marginTop:'1rem'}},
            h('div',{style:{padding:'10px 12px',borderRadius:'var(--r)',background:'var(--bg)'}},
              h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng SL đặt'),
              h('div',{style:{fontSize:24,fontWeight:700,color:'var(--pri3)'}},g.qtyProd.toLocaleString())
            ),
            h('div',{style:{padding:'10px 12px',borderRadius:'var(--r)',background:'#F8FBF9'}},
              h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng SL SX'),
              h('div',{style:{fontSize:24,fontWeight:700,color:'var(--pri)'}},g.qtyActual.toLocaleString())
            ),
            h('div',{style:{padding:'10px 12px',borderRadius:'var(--r)',background:'#FFF7ED'}},
              h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng hàng lỗi'),
              h('div',{style:{fontSize:24,fontWeight:700,color:'#C2410C'}},g.qtyBad.toLocaleString())
            ),
            h('div',{style:{padding:'10px 12px',borderRadius:'var(--r)',background:g.hasInvalid?'#FEF2F2':'#F0FDF4'}},
              h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tổng SL đạt'),
              h('div',{style:{fontSize:24,fontWeight:700,color:g.hasInvalid?'#B91C1C':'#15803D'}},g.qtyGood.toLocaleString())
            ),
            h('div',{style:{padding:'10px 12px',borderRadius:'var(--r)',background:'#EFF6FF'}},
              h('div',{style:{fontSize:11,color:'var(--tx2)',marginBottom:4}},'Tỷ lệ lỗi'),
              h('div',{style:{fontSize:24,fontWeight:700,color:g.hasInvalid?'#B91C1C':'#1D4ED8'}},fmtRate(g.badRate))
            )
          )
        ))
      ),
      h('div',{style:{display:'grid',gap:'1.25rem'}},
        majorGroups.map(g=>h('div',{key:g.name,className:'card',style:{padding:'1rem',overflow:'hidden'}},
          h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,flexWrap:'wrap',marginBottom:'1rem'}},
            h('div',{style:{display:'flex',alignItems:'center',gap:10}},
              h('div',{style:{width:14,height:14,borderRadius:'50%',background:g.textColor}}),
              h('div',null,
                h('div',{style:{fontSize:22,fontWeight:700,color:'var(--pri3)',lineHeight:1.1}},g.name),
                h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:4}},'Gồm '+g.shifts.length+' ca nhỏ')
              )
            ),
            h('div',{style:{display:'flex',gap:8,flexWrap:'wrap'}},
              h('div',{style:{padding:'8px 12px',borderRadius:'var(--r)',background:'var(--bg)',minWidth:120}},
                h('div',{style:{fontSize:11,color:'var(--tx2)'}},'SL đặt ca lớn'),
                h('div',{style:{fontSize:18,fontWeight:700,color:'var(--pri3)'}},g.qtyProd.toLocaleString())
              ),
              h('div',{style:{padding:'8px 12px',borderRadius:'var(--r)',background:'#F8FBF9',minWidth:120}},
                h('div',{style:{fontSize:11,color:'var(--tx2)'}},'SL SX ca lớn'),
                h('div',{style:{fontSize:18,fontWeight:700,color:'var(--pri)'}},g.qtyActual.toLocaleString())
              ),
              h('div',{style:{padding:'8px 12px',borderRadius:'var(--r)',background:'#FFF7ED',minWidth:120}},
                h('div',{style:{fontSize:11,color:'var(--tx2)'}},'Hàng lỗi ca lớn'),
                h('div',{style:{fontSize:18,fontWeight:700,color:'#C2410C'}},g.qtyBad.toLocaleString())
              ),
              h('div',{style:{padding:'8px 12px',borderRadius:'var(--r)',background:g.hasInvalid?'#FEF2F2':'#F0FDF4',minWidth:120}},
                h('div',{style:{fontSize:11,color:'var(--tx2)'}},'SL đạt ca lớn'),
                h('div',{style:{fontSize:18,fontWeight:700,color:g.hasInvalid?'#B91C1C':'#15803D'}},g.qtyGood.toLocaleString())
              ),
              h('div',{style:{padding:'8px 12px',borderRadius:'var(--r)',background:'#EFF6FF',minWidth:120}},
                h('div',{style:{fontSize:11,color:'var(--tx2)'}},'Tỷ lệ lỗi ca lớn'),
                h('div',{style:{fontSize:18,fontWeight:700,color:g.hasInvalid?'#B91C1C':'#1D4ED8'}},fmtRate(g.badRate))
              )
            )
          ),
          h('div',{style:{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:'1rem'}},
            g.shifts.map(({rule,rows:groupRows,qtyProd,qtyActual,qtyBad,qtyGood,badRate,hasInvalid})=>h('div',{key:rule.id,style:{border:`1px solid ${hasInvalid?'#FCA5A5':(rule.color||'var(--bd)')}`,borderRadius:'var(--rl)',overflow:'hidden',background:'#fff'}},
              h('div',{style:{padding:'12px 14px',background:rule.color||'#F8FBF9',borderBottom:'.5px solid var(--bd)'}},
                h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:8,flexWrap:'wrap'}},
                  h('div',null,
                    h('div',{style:{fontSize:20,fontWeight:700,color:rule.textColor||'var(--pri3)',lineHeight:1.1}},rule.name),
                    h('div',{style:{fontSize:12,color:hasInvalid?'#B91C1C':'var(--tx2)',marginTop:4}},hasInvalid?'SL lỗi đang lớn hơn SL SX ở một số dòng':((rule.start&&rule.end?rule.start+' - '+rule.end+' · ':'')+groupRows.length+' sản phẩm'))
                  ),
                  h('div',{style:{display:'flex',flexWrap:'wrap',gap:8,justifyContent:'flex-end',marginLeft:'auto'}},
                    h('div',{style:{minWidth:80,padding:'6px 8px',borderRadius:'var(--r)',background:'rgba(255,255,255,.75)',textAlign:'center'}},
                      h('div',{style:{fontSize:11,color:'var(--tx2)'}},'SL đặt'),
                      h('div',{style:{fontSize:18,fontWeight:700,color:'var(--pri3)'}},qtyProd.toLocaleString())
                    ),
                    h('div',{style:{minWidth:80,padding:'6px 8px',borderRadius:'var(--r)',background:'rgba(255,255,255,.75)',textAlign:'center'}},
                      h('div',{style:{fontSize:11,color:'var(--tx2)'}},'SL SX'),
                      h('div',{style:{fontSize:18,fontWeight:700,color:'var(--pri)'}},qtyActual.toLocaleString())
                    ),
                    h('div',{style:{minWidth:80,padding:'6px 8px',borderRadius:'var(--r)',background:'#FFF7ED',textAlign:'center'}},
                      h('div',{style:{fontSize:11,color:'var(--tx2)'}},'Hàng lỗi'),
                      h('div',{style:{fontSize:18,fontWeight:700,color:'#C2410C'}},qtyBad.toLocaleString())
                    ),
                    h('div',{style:{minWidth:80,padding:'6px 8px',borderRadius:'var(--r)',background:hasInvalid?'#FEF2F2':'#F0FDF4',textAlign:'center'}},
                      h('div',{style:{fontSize:11,color:'var(--tx2)'}},'SL đạt'),
                      h('div',{style:{fontSize:18,fontWeight:700,color:hasInvalid?'#B91C1C':'#15803D'}},qtyGood.toLocaleString())
                    ),
                    h('div',{style:{minWidth:80,padding:'6px 8px',borderRadius:'var(--r)',background:'#EFF6FF',textAlign:'center'}},
                      h('div',{style:{fontSize:11,color:'var(--tx2)'}},'Tỷ lệ lỗi'),
                      h('div',{style:{fontSize:18,fontWeight:700,color:hasInvalid?'#B91C1C':'#1D4ED8'}},fmtRate(badRate))
                    )
                  )
                )
              ),
              h('div',{className:'tw'},
                h('table',null,
                  h('thead',null,h('tr',null,...['Sản phẩm','ĐVT','SL Đặt','SL SX','SL hàng lỗi','SL đạt','Tỷ lệ lỗi','Đơn hàng'].map(c=>h('th',{key:c},c)))),
                  h('tbody',null,groupRows.map((r,i)=>{
                    const rowInvalid=isInvalidActualRow(r.prodDate,r.shift,r.productId);
                    const rowActualQty=numFmt(readActualQty(r.prodDate,r.shift,r.productId));
                    const rowBadQty=numFmt(readBadQty(r.prodDate,r.shift,r.productId));
                    const rowGoodQty=readGoodQty(r.prodDate,r.shift,r.productId);
                    const rowBadRate=calcBadRate(rowActualQty,rowBadQty);
                    return h('tr',{key:i,style:rowInvalid?{background:'#FEF2F2'}:null},
                    h('td',null,h('div',{style:{fontWeight:500}},r.productName)),
                    h('td',null,h('span',{className:'badge',style:{background:rule.color||'#EAF3DE',color:rule.textColor||'#3B6D11'}},r.unit)),
                    h('td',null,h('span',{style:{fontSize:16,fontWeight:600,color:'var(--pri)'}},r.qtyProd.toLocaleString())),
                    h('td',null,h('input',{
                      type:'number',
                      min:0,
                      step:'0.01',
                      value:readActualQty(r.prodDate,r.shift,r.productId),
                      onChange:e=>saveActuals(r.prodDate,r.shift,r.productId,r.productName,{qty:e.target.value}),
                      placeholder:'Nhập SL SX',
                      style:{width:110,fontSize:13,padding:'5px 8px',borderRadius:'var(--r)',border:'1px solid var(--bd)',textAlign:'right'}
                    })),
                    h('td',null,h('input',{
                      type:'number',
                      min:0,
                      step:'0.01',
                      value:readBadQty(r.prodDate,r.shift,r.productId),
                      onChange:e=>saveActuals(r.prodDate,r.shift,r.productId,r.productName,{badQty:e.target.value}),
                      placeholder:'Nhập SL lỗi',
                      style:{width:110,fontSize:13,padding:'5px 8px',borderRadius:'var(--r)',border:rowInvalid?'1px solid #DC2626':'1px solid #FDBA74',textAlign:'right',background:rowInvalid?'#FEF2F2':'#FFF7ED',color:rowInvalid?'#B91C1C':'inherit'}
                    })),
                    h('td',null,h('div',null,
                      h('div',{style:{fontSize:16,fontWeight:700,color:rowInvalid?'#B91C1C':'#15803D'}},rowGoodQty.toLocaleString()),
                      rowInvalid&&h('div',{style:{fontSize:11,color:'#B91C1C',marginTop:4}},'Hàng lỗi vượt SL SX')
                    )),
                    h('td',null,h('div',{style:{fontSize:16,fontWeight:700,color:rowInvalid?'#B91C1C':'#1D4ED8'}},fmtRate(rowBadRate))),
                    h('td',null,h('span',{style:{fontSize:11,color:'var(--tx2)'}},r.orders.join(', ')))
                  )}))
                )
              )
            ))
          )
        ))
      )
    )
  );
}

/* ─── Đơn sản xuất ─── */
function ProdOrderForm({po,products,currentUser,onSave,onClose}){
  const[f,sf]=useState(po?{...po}:{shift:'day',date:fmtDate(),status:'planning',note:'',lines:[]});
  const s=(k,v)=>sf(p=>({...p,[k]:v}));
  const addLine=()=>sf(p=>({...p,lines:[...p.lines,{id:uid(),productId:'',productName:'',unit:'',qtyRequired:0,qtyProduced:0,note:''}]}));
  const updLine=(id,data)=>sf(p=>({...p,lines:p.lines.map(l=>l.id===id?data:l)}));
  const delLine=id=>sf(p=>({...p,lines:p.lines.filter(l=>l.id!==id)}));
  const submit=()=>{
    if(f.lines.length===0){window.showToast('Thêm ít nhất 1 sản phẩm cần sản xuất!','warn');return;}
    onSave({...f,updatedBy:currentUser.name,updatedAt:fmtDT()});
  };
  return h(Modal,{title:po?'Sửa đơn sản xuất':'Tạo đơn sản xuất',onClose},
    h('div',{className:'g3'},
      h(F,{label:'Ngày sản xuất'},h('input',{value:f.date,onChange:e=>s('date',e.target.value),placeholder:'DD/MM/YYYY'})),
      h(F,{label:'Ca sản xuất'},h('select',{value:f.shift,onChange:e=>s('shift',e.target.value)},
        h('option',{value:'day'},'☀️ Ca sáng'),
        h('option',{value:'night'},'🌙 Ca đêm')
      )),
      h(F,{label:'Trạng thái'},h('select',{value:f.status,onChange:e=>s('status',e.target.value)},
        [['planning','Lên kế hoạch'],['in_progress','Đang sản xuất'],['done','Hoàn thành'],['cancelled','Hủy']].map(([v,l])=>h('option',{key:v,value:v},l))
      )),
    ),
    h(F,{label:'Ghi chú'},h('textarea',{value:f.note,onChange:e=>s('note',e.target.value),rows:2})),
    h('div',{className:'divider'}),
    h('div',{style:{fontWeight:500,fontSize:13,color:'var(--pri3)',marginBottom:8}},'Danh sách sản phẩm cần sản xuất'),
    h('div',{style:{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr auto',gap:6,marginBottom:4}},
      ['Sản phẩm','ĐVT','SL cần SX','SL đã SX',''].map(c=>h('span',{key:c,style:{fontSize:11,color:'var(--tx2)',fontWeight:500}},c))
    ),
    f.lines.map(l=>h('div',{key:l.id,style:{display:'grid',gridTemplateColumns:'2fr 1fr 1fr 1fr auto',gap:6,marginBottom:6,alignItems:'center'}},
      h('select',{value:l.productId,onChange:e=>{const p=products.find(x=>x.id===e.target.value)||{};updLine(l.id,{...l,productId:e.target.value,productName:p.name||'',unit:p.unit||''});},style:{fontSize:13}},
        h('option',{value:''},'— Chọn SP —'),products.map(p=>h('option',{key:p.id,value:p.id},p.name))
      ),
      h('input',{value:l.unit,readOnly:true,style:{fontSize:13,background:'var(--bg2)',cursor:'default'}}),
      h('input',{type:'number',min:0,value:l.qtyRequired,onChange:e=>updLine(l.id,{...l,qtyRequired:numFmt(e.target.value)}),style:{fontSize:13}}),
      h('input',{type:'number',min:0,value:l.qtyProduced,onChange:e=>updLine(l.id,{...l,qtyProduced:numFmt(e.target.value)}),style:{fontSize:13,borderColor:numFmt(l.qtyProduced)>=numFmt(l.qtyRequired)&&numFmt(l.qtyRequired)>0?'#52b788':''}}),
      h('button',{className:'bi',onClick:()=>delLine(l.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:14}}))
    )),
    h('button',{onClick:addLine,style:{fontSize:12,padding:'5px 12px',marginBottom:8}},h('i',{className:'ti ti-plus',style:{fontSize:13,marginRight:4}}),'Thêm sản phẩm'),
    h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'}},h('i',{className:'ti ti-device-floppy',style:{fontSize:14}}),'Lưu đơn SX'))
  );
}
function ProdOrdersTab({prodOrders,setProdOrders,products,currentUser}){
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[filter,sf]=useState('all');const[q,sq]=useState('');
  let pSeq=prodOrders.length+1;
  const save=d=>{if(edit)setProdOrders(p=>p.map(x=>x.id===edit.id?d:x));else{const id='SX'+String(pSeq++).toString().padStart(4,'0');setProdOrders(p=>[...p,{...d,id,createdBy:currentUser.name,createdAt:fmtDT()}]);}sm(null);se(null);};
  const del=id=>{if(confirm('Xóa đơn sản xuất?'))setProdOrders(p=>p.filter(x=>x.id!==id));};
  const sts=[['all','Tất cả'],['planning','Kế hoạch'],['in_progress','Đang SX'],['done','Hoàn thành']];
  const list=prodOrders.filter(x=>(filter==='all'||x.status===filter)&&(!q||x.id.toLowerCase().includes(q.toLowerCase())||x.date.includes(q)));
  const statusMap={planning:['#E6F1FB','#185FA5','Kế hoạch'],in_progress:['#FAEEDA','#854F0B','Đang SX'],done:['#EAF3DE','#3B6D11','Hoàn thành'],cancelled:['#FCEBEB','#A32D2D','Hủy']};
  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-building-factory',style:{fontSize:20}}),'Đơn sản xuất'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h('div',{style:{display:'flex',gap:5,flexWrap:'wrap'}},sts.map(([v,l])=>h('button',{key:v,className:'pill'+(filter===v?' on':''),onClick:()=>sf(v)},l+' ('+(v==='all'?prodOrders.length:prodOrders.filter(x=>x.status===v).length)+')'))),
      h('div',{style:{display:'flex',gap:6}},
        h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm đơn SX...'}),
        h(AddBtn,{onClick:()=>{se(null);sm('f')},label:'Tạo đơn SX'})
      )
    ),
    list.length?h('div',{style:{display:'flex',flexDirection:'column',gap:'1rem'}},
      list.map(po=>{
        const [bg,tx,label]=statusMap[po.status]||['#F1EFE8','#5F5E5A',po.status];
        const done=po.lines?po.lines.filter(l=>numFmt(l.qtyProduced)>=numFmt(l.qtyRequired)&&numFmt(l.qtyRequired)>0).length:0;
        const total=po.lines?po.lines.length:0;
        return h('div',{key:po.id,className:'card'},
          h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'1rem'}},
            h('div',null,
              h('div',{style:{display:'flex',alignItems:'center',gap:8,marginBottom:4}},
                h('span',{style:{fontWeight:600,fontSize:15,color:'var(--pri3)'}},po.id),
                h('span',{className:'badge',style:{background:po.shift==='day'?'#FFF9C4':'#EDE9FE',color:po.shift==='day'?'#854F0B':'#5B21B6'}},(po.shift==='day'?'☀️ Ca sáng':'🌙 Ca đêm')),
                h('span',{className:'badge',style:{background:bg,color:tx}},label)
              ),
              h('div',{style:{fontSize:12,color:'var(--tx2)',display:'flex',gap:12}},
                h('span',null,h('i',{className:'ti ti-calendar',style:{fontSize:12,marginRight:3}}),po.date),
                h('span',null,h('i',{className:'ti ti-list-check',style:{fontSize:12,marginRight:3}}),done+'/'+total+' SP hoàn thành'),
                po.updatedBy&&h('span',null,h('i',{className:'ti ti-user',style:{fontSize:12,marginRight:3}}),po.updatedBy)
              )
            ),
            h('div',{style:{display:'flex',gap:4}},
              h('button',{className:'bi',onClick:()=>{se(po);sm('f')}},h('i',{className:'ti ti-edit',style:{fontSize:15}})),
              h('button',{className:'bi',onClick:()=>del(po.id),style:{color:'#A32D2D'}},h('i',{className:'ti ti-trash',style:{fontSize:15}}))
            )
          ),
          po.lines&&po.lines.length>0&&h('div',{className:'tw'},
            h('table',null,
              h('thead',null,h('tr',null,...['Sản phẩm','Đơn vị','SL cần SX','SL đã SX','Tiến độ'].map(c=>h('th',{key:c},c)))),
              h('tbody',null,po.lines.map(l=>{
                const pct=numFmt(l.qtyRequired)>0?Math.min(100,Math.round(numFmt(l.qtyProduced)/numFmt(l.qtyRequired)*100)):0;
                const done2=numFmt(l.qtyProduced)>=numFmt(l.qtyRequired)&&numFmt(l.qtyRequired)>0;
                return h('tr',{key:l.id,style:{background:done2?'rgba(82,183,136,.05)':''}},
                  h('td',null,h('div',{style:{fontWeight:500}},l.productName||'—')),
                  h('td',null,h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--tx)'}},l.unit||'—')),
                  h('td',null,h('span',{style:{fontWeight:500}},numFmt(l.qtyRequired).toLocaleString())),
                  h('td',null,h('span',{style:{fontWeight:600,color:done2?'var(--pri)':'var(--tx)'}},numFmt(l.qtyProduced).toLocaleString())),
                  h('td',null,
                    h('div',{style:{display:'flex',alignItems:'center',gap:8}},
                      h('div',{style:{flex:1,height:6,background:'var(--bg2)',borderRadius:3,overflow:'hidden'}},
                        h('div',{style:{height:'100%',width:pct+'%',background:done2?'var(--pri)':'#f8c30f',borderRadius:3,transition:'width .3s'}})
                      ),
                      h('span',{style:{fontSize:12,fontWeight:500,color:done2?'var(--pri)':'var(--tx2)',minWidth:35}},pct+'%')
                    )
                  )
                );
              }))
            )
          ),
          po.note&&h('div',{style:{fontSize:12,color:'var(--tx2)',marginTop:'1rem',padding:'6px 10px',background:'var(--bg2)',borderRadius:4}},'📝 '+po.note)
        );
      })
    ):h('div',{style:{textAlign:'center',padding:'3rem',color:'var(--tx2)',background:'#fff',borderRadius:'var(--rl)',border:'.5px solid var(--bd)'}},
      h('i',{className:'ti ti-building-factory',style:{fontSize:56,display:'block',marginBottom:'1rem',color:'var(--pri2)'}}),
      'Chưa có đơn sản xuất nào.'
    ),
    modal==='f'&&h(ProdOrderForm,{po:edit,products,currentUser,onSave:save,onClose:()=>{sm(null);se(null);}})
  );
}

/* ─── Tồn kho ─── */
function StockForm({entry,onSave,onClose}){
    const[f,sf]=useState(entry?{...entry}:{stockMorning:0,stockEvening:0,note:''});
    const submit=()=>{onSave({...entry,...f,updatedBy:currentUser.name,updatedAt:fmtDT()});};
    return h(Modal,{title:'Cập nhật tồn kho — '+entry.productName,onClose},
      h('div',{style:{background:'var(--bg2)',padding:'10px 14px',borderRadius:'var(--r)',marginBottom:'1rem',fontSize:13}},
        h('div',{style:{fontWeight:500}},entry.productName),
        h('div',{style:{color:'var(--tx2)',fontSize:12}},entry.unit)
      ),
      h('div',{className:'g2'},
        h(F,{label:'Tồn kho 9h sáng'},h('input',{type:'number',min:0,value:f.stockMorning,onChange:e=>sf(p=>({...p,stockMorning:numFmt(e.target.value)}))})),
        h(F,{label:'Tồn kho 1h đêm'},h('input',{type:'number',min:0,value:f.stockEvening,onChange:e=>sf(p=>({...p,stockEvening:numFmt(e.target.value)}))})),
      ),
      h(F,{label:'Ghi chú'},h('input',{value:f.note||'',onChange:e=>sf(p=>({...p,note:e.target.value}))})),
      h(Row,null,h('button',{onClick:onClose},'Hủy'),h('button',{className:'bp',onClick:submit,style:{padding:'8px 20px'}},'Cập nhật tồn kho'))
    );
  }
function StockTab({stock,setStock,products,currentUser}){
  const[modal,sm]=useState(null);const[edit,se]=useState(null);const[q,sq]=useState('');

  // Ensure all products have a stock entry
  const stockMap={};(stock||[]).forEach(s=>{stockMap[s.productId]=s;});



  const saveStock=d=>{
    setStock(p=>{const idx=p.findIndex(x=>x.productId===d.productId);if(idx>=0){const n=[...p];n[idx]=d;return n;}return[...p,d];});
    sm(null);se(null);
  };

  const exportCols=[['productId','Mã SP'],['productName','Tên SP'],['unit','ĐVT'],['stockMorning','Tồn 9h sáng'],['stockEvening','Tồn 1h đêm'],['updatedBy','Người cập nhật'],['updatedAt','Thời gian']];
  const allStockRows=products.map(p=>stockMap[p.id]||{productId:p.id,productName:p.name,unit:p.unit,stockMorning:0,stockEvening:0,updatedBy:'',updatedAt:''});
  const filtered=allStockRows.filter(x=>!q||x.productName.toLowerCase().includes(q.toLowerCase()));

  return h('div',null,
    h('div',{className:'ptitle'},h('i',{className:'ti ti-package',style:{fontSize:20}}),'Quản lý tồn kho'),
    h('div',{style:{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:8}},
      h(SearchBar,{value:q,onChange:sq,placeholder:'Tìm sản phẩm...'}),
      h('div',{style:{display:'flex',gap:6}},
        h(ExportBtn,{onClick:()=>xlsxExport(allStockRows,exportCols,'Ton_kho')}),
        h(ImportBtn,{onFile:rows=>{
          const updated=rows.map(r=>({productId:r['Mã SP']||'',productName:r['Tên SP']||'',unit:r['ĐVT']||'',stockMorning:numFmt(r['Tồn 9h sáng']),stockEvening:numFmt(r['Tồn 1h đêm']),updatedBy:currentUser.name,updatedAt:fmtDT()})).filter(r=>r.productId);
          setStock(p=>{const map={};p.forEach(x=>{map[x.productId]=x;});updated.forEach(x=>{map[x.productId]=x;});return Object.values(map);});
          window.showToast('Đã cập nhật '+updated.length+' sản phẩm','success');
        }})
      )
    ),
    h('div',{style:{background:'#E6F1FB',border:'.5px solid #93c5fd',borderRadius:'var(--r)',padding:'10px 14px',marginBottom:'1rem',fontSize:12,color:'#185FA5'}},
      h('i',{className:'ti ti-info-circle',style:{fontSize:13,marginRight:6}}),
      'Tồn kho được cập nhật 2 lần/ngày: lúc ',h('b',null,'9:00 sáng'),' và ',h('b',null,'1:00 đêm'),'. Nhấn vào biểu tượng chỉnh sửa để cập nhật thủ công.'
    ),
    h('div',{className:'tw'},
      h('table',null,
        h('thead',null,h('tr',null,...['Sản phẩm','Đơn vị','Tồn 9h sáng','Tồn 1h đêm','Cập nhật lúc','Người cập nhật',''].map(c=>h('th',{key:c},c)))),
        h('tbody',null,filtered.length?filtered.map(row=>{
          const s=stockMap[row.productId];
          const morning=s?s.stockMorning:0;
          const evening=s?s.stockEvening:0;
          const low=morning<50||evening<50;
          return h('tr',{key:row.productId,style:{background:low&&(morning>0||evening>0)?'rgba(252,235,235,.3)':''}},
            h('td',null,h('div',{style:{fontWeight:500}},row.productName),(low&&(morning>0||evening>0))&&h('span',{className:'badge',style:{background:'#FCEBEB',color:'#A32D2D',marginLeft:6,fontSize:10}},'Sắp hết')),
            h('td',null,h('span',{className:'badge',style:{background:'var(--bg2)',color:'var(--tx)'}},row.unit)),
            h('td',null,h('span',{style:{fontSize:16,fontWeight:600,color:morning<50&&morning>0?'#A32D2D':'var(--pri)'}},morning.toLocaleString())),
            h('td',null,h('span',{style:{fontSize:16,fontWeight:600,color:evening<50&&evening>0?'#A32D2D':'var(--tx)'}},evening.toLocaleString())),
            h('td',null,h('span',{style:{fontSize:11,color:'var(--tx2)'}},s?.updatedAt||'Chưa cập nhật')),
            h('td',null,h('span',{style:{fontSize:12}},s?.updatedBy||'—')),
            h('td',null,h('button',{className:'bi',onClick:()=>{se({...row,stockMorning:morning,stockEvening:evening,...(s||{})});sm('f');}},h('i',{className:'ti ti-edit',style:{fontSize:15}})))
          );
        }):h('tr',null,h('td',{colSpan:7,className:'empty-st'},'Chưa có sản phẩm nào trong danh mục.')))
      )
    ),
    modal==='f'&&edit&&h(StockForm,{entry:edit,onSave:saveStock,onClose:()=>{sm(null);se(null);}})
  );
}


/* === ERROR BOUNDARY === */
class ErrorBoundary extends React.Component {
  constructor(props){super(props);this.state={error:null};}
  static getDerivedStateFromError(e){return{error:e};}
  componentDidCatch(e,i){console.error(e,i);}
  render(){
    if(this.state.error){
      const e=this.state.error;
      return h('div',{style:{padding:'2rem',fontFamily:'monospace',background:'#fff',minHeight:'100vh'}},
        h('h2',{style:{color:'#A32D2D',marginBottom:'1rem'}},'LỖI RENDER: '+e.message),
        h('pre',{style:{fontSize:11,background:'#f5f5f5',padding:'1rem',borderRadius:4,overflow:'auto',whiteSpace:'pre-wrap'}},e.stack),
        h('p',{style:{marginTop:'1rem',fontSize:13,color:'#666'}},'Chup man hinh nay gui lai de fix!')
      );
    }
    return this.props.children;
  }
}

/* ─── APP ROOT ─── */
const PTITLES = {
  welcome:'Tổng quan', company:'Thông tin công ty', appearance:'Cài đặt giao diện', printtemplates:'Mẫu in Excel & mapping biến', employees:'Nhân viên', attendance:'Chấm công', advances:'Ứng lương', rewards:'Thưởng phạt', leaves:'Xin phép nghỉ', prodshifts:'Cài đặt ca SX + ca GH tự động',
  backup:'Backup dữ liệu', materials:'Nguyên vật liệu', assets:'Danh mục tài sản', products:'Sản phẩm', depts:'Bộ phận',
  customers:'Khách hàng', workcats:'Danh mục công việc', tasks:'Giao việc', shifts:'Ca giao hàng',
  workreport_vp:'CÔNG KẾ TOÁN', workreport_sx:'CÔNG SẢN XUẤT', workreport_lx:'CÔNG LÁI XE', workreport_total:'TỔNG CÔNG',
  process_accounting:'QUY TRÌNH KẾ TOÁN', process_bun:'QT SẢN XUẤT BÚN', process_pho:'QT SX PHỞ', process_banhcuon:'QT SX BÁNH CUỐN',
  quotes:'Báo giá', delivery:'Đơn giao hàng', intem:'Intem', orderdetail:'Chi tiết đơn hàng', trips:'Chuyến giao hàng',
  salesreport:'Báo cáo bán hàng', fuelreport:'Báo cáo mua xăng dầu', marketsales:'Bán hàng chợ', powdersales:'Bán bột bún',
  nccs:'Nhà cung cấp', purchaseorders:'Đơn mua hàng', fuelpurchases:'Đơn mua xăng dầu', purchasereport:'Báo cáo mua hàng', maintreport:'Báo cáo sửa chữa', materialusage:'Báo cáo NVL tồn và tiêu dùng', powderdebtreport:'Báo cáo công nợ', dbusage:'Dung lượng Supabase',
  maint_vehicle:'Bảo dưỡng xe', maint_machine:'Bảo dưỡng máy',
  prodsummary:'Tổng hợp sản xuất', prodorders:'Đơn sản xuất', stock:'Tồn kho',
};

const PICONS = {
  purchase:'ti-shopping-cart', tasks:'ti-clipboard-check', prodsummary:'ti-clipboard-list',
  prodorders:'ti-building-factory', stock:'ti-package', attendance:'ti-face-id', advances:'ti-cash-banknote', rewards:'ti-scale', leaves:'ti-calendar-minus', assets:'ti-building-warehouse', appearance:'ti-typography', printtemplates:'ti-file-spreadsheet',
  workreport_vp:'ti-building', workreport_sx:'ti-building-factory', workreport_lx:'ti-steering-wheel', workreport_total:'ti-report-analytics',
  process_accounting:'ti-file-invoice', process_bun:'ti-tools-kitchen-2', process_pho:'ti-bowl', process_banhcuon:'ti-cookie',
  marketsales:'ti-building-store', powdersales:'ti-bowl', intem:'ti-printer',
  powderdebtreport:'ti-report-money', dbusage:'ti-database', fuelpurchases:'ti-gas-station', fuelreport:'ti-gas-station', maintreport:'ti-tool', materialusage:'ti-chart-histogram',
  maint_vehicle:'ti-car', maint_machine:'ti-settings'
};

function App(){
  const[session,setSession]=useLS('scf_session',null);
  const[menuHidden,setMenuHidden]=useLS('scf_topnav_hidden',false);
  const[employees,_se]=useState(DEF_EMPS);
  const[company,_sc]=useState(DEF_COMPANY);
  const[materials,_sm]=useState(DEF_MATERIALS);
  const[assets,_sas]=useState([]);
  const[prodCats,_spc]=useState(DEF_PRODCATS);
  const[products,_sp]=useState(DEF_PRODUCTS);
  const[prodShifts,_sps]=useState(DEF_PROD_SHIFTS);
  const[prodShiftRules,_spr]=useState(DEF_PROD_SHIFT_RULES);
  const[areas,_sar]=useState(DEF_AREAS);
  const[customers,_scu]=useState(DEF_CUSTOMERS);
  const[workcats,_swc]=useState(DEF_WORKCATS);
  const[depts,_sdp]=useState(DEF_DEPTS);
  const[tasks,_stasks]=useState([]);
  const[nccs,_sncc]=useState([]);
  const[purchases,_spu]=useState([]);
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
  const[leaves,_slv]=useState([]);
  const[uiSettings,_sui]=useState(DEF_UI_SETTINGS);
  const[printTemplateSettings,_spt]=useState(DEF_PRINT_TEMPLATE_SETTINGS);
  window.__SCF_CUSTOMERS=customers||[];
  window.__SCF_PROD_SHIFTS=prodShifts||[];
  const setEmployees=mkSet('scf_employees',_se);
  const setCompany=mkSet('scf_company',_sc);
  const setMaterials=mkSet('scf_materials',_sm);
  const setAssets=mkSet('scf_assets',_sas);
  const setProdCats=mkSet('scf_prodcats',_spc);
  const setProducts=mkSet('scf_products',_sp);
  const setProdShifts=mkSet('scf_prod_shifts',_sps);
  const setProdShiftRules=mkSet('scf_prod_shift_rules',_spr);
  const setAreas=mkSet('scf_areas',_sar);
  const setCustomers=mkSet('scf_customers',_scu);
  const setWorkcats=mkSet('scf_workcats',_swc);
  const setDepts=mkSet('scf_depts',_sdp);
  const setTasks=mkSet('scf_tasks',_stasks);
  const setNCCs=mkSet('scf_nccs',_sncc);
  const setPurchases=mkSet('scf_purchases',_spu);
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
  const setLeaves=mkSet('scf_leaves',_slv);
  const setUiSettings=mkSet('scf_ui_settings',_sui);
  const setPrintTemplateSettings=mkSet('scf_print_template_settings',_spt);
  const[loading,setLoading]=useState(true);
  const[col,setCol]=useState(false);
  const[page,setPage]=useState('welcome');
  useEffect(()=>{
    (async()=>{
      try{
        const[e,c,m,assetData,pc,p,cu,ar,wc,tk,ncc,pu,q,fp,mo,o,t,a,adv,rw,lv,dp,ui,pts,pa]=await Promise.all([
          dbGet('scf_employees',DEF_EMPS),dbGet('scf_company',DEF_COMPANY),
          dbGet('scf_materials',DEF_MATERIALS),dbGet('scf_assets',[]),dbGet('scf_prodcats',DEF_PRODCATS),
          dbGet('scf_products',DEF_PRODUCTS),dbGet('scf_customers',DEF_CUSTOMERS),
          dbGet('scf_areas',DEF_AREAS),
          dbGet('scf_workcats',DEF_WORKCATS),dbGet('scf_tasks',[]),dbGet('scf_nccs',[]),dbGet('scf_purchases',[]),dbGet('scf_quotes',[]),
          dbGet('scf_fuelpurchases',[]),
          dbGet('scf_material_month_openings',[]),
          dbGet('scf_orders',[]),dbGet('scf_trips',[]),dbGet('scf_attendance',[]),
          dbGet('scf_advances',[]),dbGet('scf_rewards',[]),dbGet('scf_leaves',[]),dbGet('scf_depts',DEF_DEPTS),dbGet('scf_ui_settings',DEF_UI_SETTINGS),dbGet('scf_print_template_settings',DEF_PRINT_TEMPLATE_SETTINGS),dbGet('scf_prod_actuals',{}),
        ]);
        const normalizedOrders=normalizeOrdersForStorage(o||[]);
        _se(e);_sc(c);_sm(m);_sas(assetData);_spc(pc);_sp(p);_scu(cu);_sar(ar);_swc(wc);_stasks(tk);_sncc(ncc);_spu(pu);_sfp(fp);_smo(mo);const shData=await dbGet('scf_shifts',D_SHIFTS);_ssh(shData);_sq(q);_so(normalizedOrders);_st(t);_sa(a);_sadv(adv);_srw(rw);_slv(lv);_sdp(dp);_sui(normalizeUiSettings(ui));_spt(normalizePrintTemplateSettings(pts));_spa(pa||{});const psData=await dbGet('scf_prod_shifts',DEF_PROD_SHIFTS);_sps(psData);const psrData=await dbGet('scf_prod_shift_rules',DEF_PROD_SHIFT_RULES);_spr(psrData);
        if(ordersNeedTimeNormalization(o||[]))dbSet('scf_orders',normalizedOrders);
      }catch(err){console.warn(err);}finally{setLoading(false);}
    })();
  },[]);
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
        const[o,t]=await Promise.all([dbGet('scf_orders',orders),dbGet('scf_trips',trips)]);
        _so(normalizeOrdersForStorage(o||[]));_st(t||[]);
      }catch(e){console.warn('Auto sync:',e.message||e);}
    };
    const tm=setInterval(refresh,15000);
    window.scfSyncNow=refresh;
    return()=>clearInterval(tm);
  },[loading]);

  /* ── TỰ ĐỘNG TẠO CHUYẾN MỖI NGÀY LÚC 6:00 ── */
  const[autoNotif,setAutoNotif]=useState(null);
  useEffect(()=>{
    if(loading) return;
    const now=new Date();
    if(now.getHours()<6) return;
    const todayKey='scf_autotrip_'+now.toISOString().slice(0,10);
    if(localStorage.getItem(todayKey)) return;
    if(!shifts||shifts.length===0) return;
    const tom=new Date(now); tom.setDate(tom.getDate()+1);
    const tStr=String(tom.getDate()).padStart(2,'0')+'/'+String(tom.getMonth()+1).padStart(2,'0')+'/'+tom.getFullYear();
    setTrips(prev=>{
      const news=[];
      shifts.forEach(sh=>{
        if(!prev.some(t=>t.deliveryDate===tStr&&t.shiftId===sh.id)){
          news.push({
            id:'CH'+uid(),deliveryDate:tStr,
            deliveryTime:sh.timeStart||'',
            shiftId:sh.id,shiftName:sh.name,area:sh.area||'',
            driverName:'',driverId:'',orderIds:[],totalWeight:0,
            status:'planning',
            note:'Tự động tạo: '+sh.name+(sh.area?' - '+sh.area:''),
            createdAt:fmtDT(),autoCreated:true
          });
        }
      });
      if(news.length>0){
        localStorage.setItem(todayKey,'1');
        setTimeout(()=>window.showToast&&window.showToast('Đã tự động tạo '+news.length+' chuyến giao hàng cho ngày '+tStr,'info',6000),1500);
        return[...prev,...news];
      }
      return prev;
    });
  },[loading,shifts]);

  const cu=session?employees.find(e=>e.id===session.id):null;
  useEffect(()=>{
    if(cu&&cu.mustChangePw&&!sessionStorage.getItem('scf_pw_warned_'+cu.id)){
      sessionStorage.setItem('scf_pw_warned_'+cu.id,'1');
      setTimeout(()=>window.showToast&&window.showToast('Vui lòng đổi mật khẩu mặc định ngay để bảo mật tài khoản!','warn',7000),1500);
    }
  },[cu?.id,cu?.mustChangePw]);
  if(loading)return h('div',{className:'load-screen'},
    h('img',{src:LOGO_SRC,style:{width:80,height:80,marginBottom:12,borderRadius:12}}),
    h('div',{style:{fontSize:17,fontWeight:600,color:'var(--pri3)',marginBottom:4}},'Thực Phẩm Sông Công'),
    h('div',{style:{fontSize:13,color:'var(--pri2)',display:'flex',alignItems:'center',gap:6}},h('i',{className:'ti ti-loader-2 spin',style:{fontSize:16}}),'Đang tải dữ liệu...')
  );
  if(!cu)return h(LoginPage,{employees,onLogin:u=>setSession({id:u.id})});
  const activeLevel=getLvl(cu.role,page,cu.permLevels);
  const readOnly=activeLevel==='r';
  window.__SCF_ACCESS_CONTEXT={role:cu.role,page,level:activeLevel,readOnly};
  const wips=['purchase','workreport_vp','workreport_sx','workreport_lx','workreport_total','process_accounting','process_bun','process_pho','process_banhcuon','marketsales'];
  return h('div',{className:'layout'},
    h('div',{className:'main'},
      !menuHidden&&h('div',{className:'topbar'},
        h('div',{className:'topbar-main'},
          h('div',{className:'topbar-brand'},
            h('img',{src:LOGO_SRC,className:'topbar-logo'}),
            h('div',{className:'topbar-title'},
              h('div',{className:'topbar-company'},company?.name||'SCF'),
              h('div',{className:'topbar-meta'},
                h('span',null,'Menu'),
                sb&&h('span',{style:{width:7,height:7,borderRadius:'50%',background:'#52b788',display:'inline-block'},title:'Đã kết nối Supabase'})
              )
            )
          ),
          h('div',{className:'topbar-actions'},
            h('div',{className:'topbar-user'},
              h('div',{className:'topbar-user-name'},cu.name),
              h('div',{className:'topbar-user-dept'},
                h('span',{className:'badge '+({admin:'chip-admin',manager:'chip-manager',staff:'chip-staff',driver:'chip-driver'}[cu.role]||'chip-staff'),style:{fontSize:10}},ROLES[cu.role]||cu.role),
                h('span',{style:{fontSize:11,color:'rgba(255,255,255,.78)'}},cu.dept)
              )
            ),
            h('button',{onClick:()=>setSession(null),style:{fontSize:12,padding:'5px 10px',color:'#A32D2D',borderColor:'#F7C1C1'}},h('i',{className:'ti ti-logout',style:{fontSize:14}}),'Đăng xuất')
          )
        ),
        h(TopNav,{page,setPage,role:cu.role,perms:cu.permissions})
      ),
      h('div',{
        className:'content'+(menuHidden?' compact-top':'')+(readOnly?' scf-readonly':'')+(activeLevel!=='rwd'?' scf-no-delete':''),
        onClickCapture:e=>guardPermissionAction(e,cu.role,page,cu.permLevels)
      },
        readOnly&&h('div',{className:'scf-readonly-banner'},h('i',{className:'ti ti-eye',style:{fontSize:16}}),'Chế độ Chỉ xem — bạn có thể xem, tìm kiếm, lọc, in và xuất báo cáo nhưng không thể thay đổi dữ liệu.'),
        !canAccess(cu.role,page,cu.permissions)&&h('div',{style:{textAlign:'center',padding:'4rem 2rem'}},
          h('i',{className:'ti ti-lock',style:{fontSize:64,display:'block',marginBottom:'1rem',color:'#f8c30f'}}),
          h('h2',{style:{fontSize:18,fontWeight:500,marginBottom:8}},'Không có quyền truy cập'),
          h('p',{style:{fontSize:13,color:'var(--tx2)'}},'Tài khoản của bạn không có quyền xem trang này.'),
          h('button',{className:'bp',onClick:()=>setPage('welcome'),style:{marginTop:'1.5rem',padding:'8px 20px',display:'inline-flex'}},'Về trang chủ')
        ),
        canAccess(cu.role,page)&&page==='welcome'&&h(WelcomePage,{emp:cu,company}),
        canAccess(cu.role,'company',cu.permissions)&&page==='company'&&h(CompanySettings,{company,setCompany}),
        canAccess(cu.role,'appearance',cu.permissions)&&page==='appearance'&&h(AppearanceSettingsTab,{uiSettings,setUiSettings}),
        canAccess(cu.role,'printtemplates',cu.permissions)&&page==='printtemplates'&&h(PrintTemplateSettingsTab,{templateSettings:printTemplateSettings,setTemplateSettings:setPrintTemplateSettings,products,customers}),
        canAccess(cu.role,'employees',cu.permissions)&&page==='employees'&&h(EmployeeTab,{employees,setEmployees,cu,depts}),
        canAccess(cu.role,'attendance',cu.permissions)&&page==='attendance'&&h(AttendanceTab,{attendance,setAttendance,employees,setEmployees,currentUser:cu,company}),
        canAccess(cu.role,'advances',cu.permissions)&&page==='advances'&&h(MoneyTab,{mode:'advance',records:advances,setRecords:setAdvances,employees,currentUser:cu}),
        canAccess(cu.role,'rewards',cu.permissions)&&page==='rewards'&&h(MoneyTab,{mode:'reward',records:rewards,setRecords:setRewards,employees,currentUser:cu}),
        canAccess(cu.role,'leaves',cu.permissions)&&page==='leaves'&&h(LeaveTab,{leaves,setLeaves,employees,currentUser:cu}),
        canAccess(cu.role,'backup',cu.permissions)&&page==='backup'&&h(BackupTab,{employees,materials,assets,prodCats,products,customers,workcats,tasks,advances,rewards,leaves,nccs,purchases,depts,prodShiftRules,uiSettings,printTemplateSettings}),
        canAccess(cu.role,'materials',cu.permissions)&&page==='materials'&&h(MaterialsTab,{materials,setMaterials,purchases}),
        canAccess(cu.role,'assets',cu.permissions)&&page==='assets'&&h(AssetsTab,{assets,setAssets}),
        canAccess(cu.role,'depts',cu.permissions)&&page==='depts'&&h(DeptsTab,{depts,setDepts,employees,workcats}),
        canAccess(cu.role,'products',cu.permissions)&&page==='products'&&h(ProductsTab,{products,setProducts,prodCats,setProdCats}),
        canAccess(cu.role,'customers',cu.permissions)&&page==='customers'&&h(CustomersTab,{customers,setCustomers,shifts,orders,areas,cu}),
        canAccess(cu.role,'areas',cu.permissions)&&page==='areas'&&h(AreasTab,{areas,setAreas,customers,setCustomers,orders}),
        canAccess(cu.role,'prodshifts',cu.permissions)&&page==='prodshifts'&&h(ProdShiftsTab,{prodShifts,setProdShifts,prodShiftRules,setProdShiftRules,orders,customers,shifts}),
        canAccess(cu.role,'workcats',cu.permissions)&&page==='workcats'&&h(WorkCatsTab,{workcats,setWorkcats,depts}),
        canAccess(cu.role,'tasks',cu.permissions)&&page==='tasks'&&h(TasksTab,{tasks,setTasks,workcats,employees,currentUser:cu}),
        canAccess(cu.role,'nccs',cu.permissions)&&page==='nccs'&&h(NCCTab,{nccs,setNCCs,purchases}),
        canAccess(cu.role,'purchaseorders',cu.permissions)&&page==='purchaseorders'&&h(PurchaseTab,{purchases,setPurchases,nccs,setNCCs,materials,products,cu,setPage}),
        canAccess(cu.role,'fuelpurchases',cu.permissions)&&page==='fuelpurchases'&&h(FuelPurchaseTab,{rows:fuelPurchases,setRows:setFuelPurchases,employees,assets,currentUser:cu}),
        canAccess(cu.role,'fuelreport',cu.permissions)&&page==='fuelreport'&&h(FuelPurchaseReportTab,{rows:fuelPurchases}),
        canAccess(cu.role,'purchasereport',cu.permissions)&&page==='purchasereport'&&h(PurchaseReportTab,{purchases,nccs}),
        canAccess(cu.role,'maintreport',cu.permissions)&&page==='maintreport'&&h(MaintenanceReportTab),
        canAccess(cu.role,'materialusage',cu.permissions)&&page==='materialusage'&&h(MaterialUsageReportTab,{materials,purchases,monthOpenings:materialMonthOpenings,setMonthOpenings:setMaterialMonthOpenings}),
        canAccess(cu.role,'powderdebtreport',cu.permissions)&&page==='powderdebtreport'&&h(PowderDebtReportTab,{customers}),
        canAccess(cu.role,'maint_vehicle',cu.permissions)&&page==='maint_vehicle'&&h(MaintenanceTab,{title:'Bảo dưỡng xe',icon:'ti-car',assets,employees}),
        canAccess(cu.role,'maint_machine',cu.permissions)&&page==='maint_machine'&&h(MaintenanceTab,{title:'Bảo dưỡng máy',icon:'ti-settings',assets,employees}),
        canAccess(cu.role,'shifts',cu.permissions)&&page==='shifts'&&h(ShiftsTab,{shifts,setShifts}),
        canAccess(cu.role,'quotes',cu.permissions)&&page==='quotes'&&h(QuotesTab,{quotes,setQuotes,customers,products,currentUser:cu}),
        canAccess(cu.role,'delivery',cu.permissions)&&page==='delivery'&&h(DeliveryOrdersTab,{orders,setOrders,customers,setCustomers,products,prodCats,quotes,employees,currentUser:cu,trips,setTrips,company,prodShifts,prodShiftRules,shifts,menuHidden,setMenuHidden,printTemplateSettings}),
        canAccess(cu.role,'intem',cu.permissions)&&page==='intem'&&h(IntemTab,{products,company}),
        canAccess(cu.role,'trips',cu.permissions)&&page==='trips'&&h(TripsTab,{trips,setTrips,orders,setOrders,employees,shifts,customers,products,currentUser:cu}),
        canAccess(cu.role,'orderdetail',cu.permissions)&&page==='orderdetail'&&h(OrderDetailListTab,{orders,setOrders,products,customers,shifts,currentUser:cu,prodShifts}),
        canAccess(cu.role,'salesreport',cu.permissions)&&page==='salesreport'&&h(SalesReportTab,{orders,customers,products,shifts:prodShifts,quotes}),
        canAccess(cu.role,'powdersales',cu.permissions)&&page==='powdersales'&&h(PowderSalesTab,{customers,trips,employees,setPage}),
        canAccess(cu.role,'prodsummary',cu.permissions)&&page==='prodsummary'&&h(ProductionSummaryTab,{orders,products,prodShifts,prodShiftRules,prodActuals,setProdActuals,currentUser:cu}),
        canAccess(cu.role,'prodorders',cu.permissions)&&page==='prodorders'&&h(ProdOrdersTab,{prodOrders,setProdOrders,products,currentUser:cu}),
        canAccess(cu.role,'stock',cu.permissions)&&page==='stock'&&h(StockTab,{stock,setStock,products,currentUser:cu}),
        canAccess(cu.role,'dbusage',cu.permissions)&&page==='dbusage'&&h(SupabaseUsageReportTab,{employees,materials,assets,prodCats,products,customers,areas,workcats,tasks,nccs,purchases,quotes,orders,trips,attendance,advances,rewards,leaves,depts,shifts,prodShifts,prodShiftRules,prodOrders,stock,company}),
        wips.includes(page)&&h(PlaceholderTab,{title:PTITLES[page],icon:PICONS[page]||'ti-clock'})
      )
    )
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
    if(el) el.innerHTML='<div style="padding:2rem;font-family:monospace;background:#fff;min-height:100vh"><h2 style="color:#A32D2D">LOI RENDER: '+e.message+'</h2><pre style="font-size:11px;margin-top:1rem;white-space:pre-wrap">'+e.stack+'</pre></div>';
    else document.body.innerHTML='<pre style="color:red;padding:2rem">LOI: app div not found!\n'+e.stack+'</pre>';
  }
} catch(e) {
  document.getElementById('app').innerHTML = '<div style="padding:2rem;color:#A32D2D;font-family:monospace;background:#fff;min-height:100vh"><h2>Loi render SCF App</h2><p style="margin-top:1rem">'+e.message+'</p><pre style="margin-top:1rem;font-size:11px;opacity:.6">'+e.stack+'</pre></div>';
}


