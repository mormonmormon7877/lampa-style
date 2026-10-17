/* Lampa Smart Keyboard 2.0 — native search keyboard integration */
(function(){
'use strict';
if(window.LampaSmartKeyboard && window.LampaSmartKeyboard.version==='2.0')return;
var active=false,overlay=null,value='',pos=0,row=0,col=0,lang=0,rows=[],lastParams=null;
var layouts=[['RU',['йцукенгшщзхъ','фывапролджэ','ячсмитьбю']],['UA',['йцукенгшщзхї','фівапролджє','ячсмитьбюґ']],['EN',['qwertyuiop','asdfghjkl','zxcvbnm']]];
var preview,keys,notice;
function chars(s){return Array.from(s||'')}
function clamp(n,min,max){return Math.max(min,Math.min(n,max))}
function currentText(){
 var el=document.querySelector('.search__input');
 if(el&&el.classList.contains('filled'))return (el.textContent||'').replace(/\u00a0/g,' ');
 return '';
}
function render(){
 if(!active)return;
 var a=chars(value);pos=clamp(pos,0,a.length);
 preview.textContent='';
 preview.appendChild(document.createTextNode(a.slice(0,pos).join('')));
 var caret=document.createElement('span');caret.textContent='│';caret.style.color='#ffcb37';preview.appendChild(caret);
 preview.appendChild(document.createTextNode(a.slice(pos).join('')));
 notice.textContent='Язык: '+layouts[lang][0]+'   •   ← → по клавишам   •   OK выбрать   •   Назад отмена';
 rows=layouts[lang][1].map(function(s){return chars(s)});
 rows.push(['◀','▶','⌫','Пробел','Язык','Очистить','Готово','Отмена']);
 keys.textContent='';
 rows.forEach(function(line,r){
  var bar=document.createElement('div');bar.style.cssText='display:flex;justify-content:center;gap:5px;margin:6px 0;flex-wrap:wrap';
  line.forEach(function(letter,c){
   var k=document.createElement('div');k.textContent=letter;
   k.style.cssText='background:'+(r===row&&c===col?'#f6c84c':'#3c4351')+';color:'+(r===row&&c===col?'#111':'#fff')+';border-radius:6px;padding:10px 7px;min-width:34px;text-align:center;font-size:20px';
   k.onclick=function(){row=r;col=c;press()};bar.appendChild(k);
  });keys.appendChild(bar);
 });
}
function press(){
 var k=rows[row][col],a=chars(value);
 if(k==='◀')pos=clamp(pos-1,0,a.length);
 else if(k==='▶')pos=clamp(pos+1,0,a.length);
 else if(k==='⌫'){if(pos){a.splice(--pos,1);value=a.join('')}}
 else if(k==='Пробел'){a.splice(pos++,0,' ');value=a.join('')}
 else if(k==='Язык')lang=(lang+1)%layouts.length;
 else if(k==='Очистить'){value='';pos=0}
 else if(k==='Готово'){finish(true);return}
 else if(k==='Отмена'){finish(false);return}
 else {a.splice(pos++,0,k);value=a.join('')}
 render();
}
function keydown(e){
 if(!active)return;
 var n=e.keyCode,k=e.key;
 if([37,38,39,40,13,27,8,10009,461].indexOf(n)<0&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Enter','Escape','Backspace'].indexOf(k)<0)return;
 e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();
 if(n===27||n===10009||n===461||k==='Escape'){finish(false);return}
 if(n===8||k==='Backspace'){var a=chars(value);if(pos){a.splice(--pos,1);value=a.join('')}render();return}
 if(n===37||k==='ArrowLeft')col=clamp(col-1,0,rows[row].length-1);
 if(n===39||k==='ArrowRight')col=clamp(col+1,0,rows[row].length-1);
 if(n===38||k==='ArrowUp'){row=clamp(row-1,0,rows.length-1);col=clamp(col,0,rows[row].length-1)}
 if(n===40||k==='ArrowDown'){row=clamp(row+1,0,rows.length-1);col=clamp(col,0,rows[row].length-1)}
 if(n===13||k==='Enter'){press();return}
 render();
}
function open(){
 if(active)return;
 value=currentText();pos=chars(value).length;row=0;col=0;active=true;
 overlay=document.createElement('div');overlay.id='lsk-overlay';
 overlay.style.cssText='position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.94);display:flex;align-items:center;justify-content:center;color:#fff;font-family:Arial';
 var panel=document.createElement('div');panel.style.cssText='width:94%;max-width:1050px;padding:20px;background:#20242c;border-radius:14px;box-sizing:border-box';
 var title=document.createElement('div');title.textContent='Редактор поиска — курсор внутри строки';title.style.cssText='font-size:25px;margin-bottom:12px';
 preview=document.createElement('div');preview.style.cssText='background:#111722;padding:14px;font-size:26px;min-height:34px;overflow-wrap:anywhere;border-radius:8px';
 notice=document.createElement('div');notice.style.cssText='font-size:16px;margin:12px 0;color:#ddd';
 keys=document.createElement('div');panel.appendChild(title);panel.appendChild(preview);panel.appendChild(notice);panel.appendChild(keys);overlay.appendChild(panel);
 document.body.appendChild(overlay);window.addEventListener('keydown',keydown,true);render();
}
function finish(save){
 if(!active)return;
 active=false;window.removeEventListener('keydown',keydown,true);
 if(overlay&&overlay.parentNode)overlay.parentNode.removeChild(overlay);overlay=null;
 if(save&&window.Lampa&&Lampa.Search&&typeof Lampa.Search.close==='function'&&typeof Lampa.Search.open==='function'){
  try{Lampa.Search.close();Lampa.Search.open({input:value});}catch(err){console.error('[Smart Keyboard] search reopen failed',err)}
 }else if(window.Lampa&&Lampa.Controller){try{Lampa.Controller.toggle('keybord')}catch(e){}}
}
function installButton(){
 if(active||!document.body.classList.contains('search--open'))return;
 var keyboard=document.querySelector('.simple-keyboard');
 if(!keyboard)return;
 var rowEl=keyboard.querySelector('.hg-row:last-child');
 if(!rowEl)return;
 if(keyboard.querySelector('.lsk-native-button'))return;
 var btn=document.createElement('div');
 btn.className='hg-button selector lsk-native-button';
 btn.textContent='✎ Курсор';
 btn.setAttribute('data-skbtn','{LSK_EDIT}');
 btn.style.cssText='min-width:105px;background:#dcae27;color:#111;font-weight:bold';
 btn.addEventListener('hover:enter',function(e){if(e.stopImmediatePropagation)e.stopImmediatePropagation();open()});
 btn.addEventListener('click',function(e){e.stopPropagation();open()});
 rowEl.appendChild(btn);
}
function init(){
 if(!window.Lampa||!Lampa.Search||!Lampa.Search.listener)return false;
 Lampa.Search.listener.follow('open',function(){setTimeout(installButton,150);setTimeout(installButton,700)});
 var observer=new MutationObserver(function(){if(document.body.classList.contains('search--open'))installButton()});
 observer.observe(document.body,{subtree:true,childList:true});
 setInterval(installButton,2000);
 installButton();
 return true;
}
var attempts=0,timer=setInterval(function(){if(init()||++attempts>120)clearInterval(timer)},500);
window.LampaSmartKeyboard={version:'2.0',open:open,close:function(){finish(false)}};
console.log('[Lampa Smart Keyboard] 2.0 loaded');
})();