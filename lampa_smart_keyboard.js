/* Lampa Smart Keyboard 1.1 - experimental Samsung TV search input editor */
(function(){
'use strict';
if(window.LampaSmartKeyboard) return;
var state={open:false,lang:0,mode:false,pos:0,row:0,col:0,value:'',target:null,original:'',overlay:null};
var layouts=[
 ['RU',['йцукенгшщзхъ','фывапролджэ','ячсмитьбю']],
 ['UA',['йцукенгшщзхї','фівапролджє','ячсмитьбюґ']],
 ['EN',['qwertyuiop','asdfghjkl','zxcvbnm']]
];
var rows,root,preview,grid,info;
function chars(s){return Array.from(s)}
function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
function draw(){
 if(!state.open)return;
 var a=chars(state.value),p=clamp(state.pos,0,a.length);
 preview.textContent='';
 preview.appendChild(document.createTextNode(a.slice(0,p).join('')));
 var cursor=document.createElement('span');cursor.textContent='│';cursor.style.color='#ffcc48';preview.appendChild(cursor);
 preview.appendChild(document.createTextNode(a.slice(p).join('')));
 info.textContent=state.mode?'РЕДАКТИРОВАНИЕ: ← → перемещают курсор, OK возвращает к буквам':'ВВОД: стрелки выбирают кнопку, OK нажимает';
 grid.innerHTML=''; rows=layouts[state.lang][1].map(function(s){return chars(s)});
 rows.push(['←','→','⌫','Пробел','RU/UA/EN','Курсор','Очистить','Готово','Отмена']);
 rows.forEach(function(line,r){
  var bar=document.createElement('div');bar.style.cssText='display:flex;justify-content:center;gap:5px;margin:6px 0;flex-wrap:wrap';
  line.forEach(function(letter,c){
   var key=document.createElement('div');key.textContent=letter;key.style.cssText='min-width:32px;padding:11px 7px;border-radius:6px;text-align:center;background:'+(r===state.row&&c===state.col&&!state.mode?'#f5c542':'#343a46')+';color:'+(r===state.row&&c===state.col&&!state.mode?'#111':'#fff')+';font-size:21px';
   key.addEventListener('click',function(){state.row=r;state.col=c;press();});bar.appendChild(key);
  });grid.appendChild(bar);
 });
}
function press(){var key=rows[state.row][state.col],a=chars(state.value);
 if(key==='←')state.pos=clamp(state.pos-1,0,a.length);
 else if(key==='→')state.pos=clamp(state.pos+1,0,a.length);
 else if(key==='⌫'){if(state.pos){a.splice(state.pos-1,1);state.pos--;state.value=a.join('')}}
 else if(key==='Пробел'){a.splice(state.pos,0,' ');state.pos++;state.value=a.join('')}
 else if(key==='RU/UA/EN'){state.lang=(state.lang+1)%3}
 else if(key==='Курсор'){state.mode=true}
 else if(key==='Очистить'){state.value='';state.pos=0}
 else if(key==='Готово'){close(true);return}
 else if(key==='Отмена'){close(false);return}
 else {a.splice(state.pos,0,key);state.pos++;state.value=a.join('')}
 draw();}
function keydown(e){if(!state.open)return;var k=e.key||'',n=e.keyCode;
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter','Escape','Backspace'].indexOf(k)<0&&[37,38,39,40,13,27,8,10009].indexOf(n)<0)return;
 e.preventDefault();e.stopImmediatePropagation();
 if(k==='Escape'||n===27||n===10009){close(false);return}
 if(k==='Backspace'||n===8){var a=chars(state.value);if(state.pos){a.splice(--state.pos,1);state.value=a.join('')}draw();return}
 if(state.mode){if(k==='ArrowLeft'||n===37)state.pos=Math.max(0,state.pos-1);else if(k==='ArrowRight'||n===39)state.pos=Math.min(chars(state.value).length,state.pos+1);else if(k==='Enter'||n===13)state.mode=false;draw();return}
 if(k==='ArrowLeft'||n===37)state.col=clamp(state.col-1,0,rows[state.row].length-1);
 else if(k==='ArrowRight'||n===39)state.col=clamp(state.col+1,0,rows[state.row].length-1);
 else if(k==='ArrowUp'||n===38){state.row=clamp(state.row-1,0,rows.length-1);state.col=clamp(state.col,0,rows[state.row].length-1)}
 else if(k==='ArrowDown'||n===40){state.row=clamp(state.row+1,0,rows.length-1);state.col=clamp(state.col,0,rows[state.row].length-1)}
 else if(k==='Enter'||n===13){press();return}draw();}
function close(save){if(!state.open)return;state.open=false;window.removeEventListener('keydown',keydown,true);if(state.overlay)state.overlay.remove();
 if(save&&state.target){var t=state.target;try{var setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(t,state.value)}catch(e){t.value=state.value}
 t.dispatchEvent(new Event('input',{bubbles:true}));t.dispatchEvent(new Event('change',{bubbles:true}));try{t.focus()}catch(e){} }
 state.target=null;setTimeout(function(){if(typeof scan==='function')scan()},100);}
function open(target){if(state.open)return;state.target=target||null;state.value=target?target.value||'':'';state.original=state.value;state.pos=chars(state.value).length;state.row=0;state.col=0;state.mode=false;state.open=true;
 var overlay=document.createElement('div');overlay.style.cssText='position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.92);display:flex;align-items:center;justify-content:center;color:#fff;font-family:Arial,sans-serif';
 root=document.createElement('div');root.style.cssText='width:94%;max-width:960px;background:#20242c;border-radius:14px;padding:22px;box-sizing:border-box';
 var heading=document.createElement('div');heading.textContent='Lampa Smart Keyboard 1.0';heading.style.cssText='font-size:24px;margin-bottom:14px';
 preview=document.createElement('div');preview.style.cssText='background:#101318;border:1px solid #596170;border-radius:8px;padding:14px;min-height:30px;font-size:26px;white-space:pre-wrap;overflow-wrap:anywhere';
 info=document.createElement('div');info.style.cssText='font-size:15px;color:#bbb;margin:12px 0';grid=document.createElement('div');
 root.appendChild(heading);root.appendChild(preview);root.appendChild(info);root.appendChild(grid);overlay.appendChild(root);document.body.appendChild(overlay);state.overlay=overlay;
 window.addEventListener('keydown',keydown,true);draw();}
// v1.1: visible remote-accessible launch button; no double-click requirement.
var launcher=document.createElement('button');
launcher.type='button';
launcher.textContent='✎ Редактор';
launcher.setAttribute('aria-label','Открыть редактор поискового текста');
launcher.style.cssText='position:fixed;right:16px;bottom:18px;z-index:2147483640;background:#f5c542;color:#111;padding:13px 19px;border:3px solid #fff;border-radius:10px;font:bold 19px Arial;display:none';
document.body.appendChild(launcher);
var currentInput=null;
function isEditable(t){return t&&t.tagName==='INPUT'&&t.type!=='hidden'&&t.type!=='password'||t&&t.tagName==='TEXTAREA'}
function scan(){
 var inputs=document.querySelectorAll('input[type="search"],input[type="text"],textarea,.search__input');
 var candidate=null;
 for(var i=0;i<inputs.length;i++){
  var t=inputs[i],r=t.getBoundingClientRect();
  if(r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight){candidate=t;break}
 }
 currentInput=candidate;
 launcher.style.display=candidate&&!state.open?'block':'none';
}
launcher.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();if(currentInput)open(currentInput)});
document.addEventListener('focusin',function(e){if(isEditable(e.target)){currentInput=e.target;launcher.style.display='block'}},true);
document.addEventListener('click',function(e){
 var t=e.target;if(!t||!t.closest||state.open)return;
 var input=t.closest('input[type="search"],input[type="text"],textarea');
 if(input){currentInput=input;launcher.style.display='block'}
},true);
var observer=new MutationObserver(function(){scan()});
observer.observe(document.body,{childList:true,subtree:true});
setInterval(scan,1600);
scan();
window.LampaSmartKeyboard={open:open,close:close,version:'1.1',scan:scan};
console.log('[Lampa Smart Keyboard] 1.1 loaded');
})();