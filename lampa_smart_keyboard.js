/* Lampa Smart Keyboard 4.2: inline cursor editing on native Lampa keyboard */
(function(){
'use strict';
if(window.LampaSmartKeyboard&&window.LampaSmartKeyboard.version==='4.2')return;
var cursor=0,tracking=false,patched=false,scheduled=false,marker=null;
function split(s){return Array.from(s||'')}
function limit(n,max){return Math.max(0,Math.min(n,max))}
function searchOpen(){return document.body&&document.body.classList.contains('search--open')}
function display(value){
 if(!searchOpen())return;
 var input=document.querySelector('.search__input');
 if(!input)return;
 if(!marker||!marker.isConnected){
  marker=document.createElement('div');
  marker.className='lsk-cursor-line';
  marker.style.cssText='font:22px Arial,sans-serif;color:#fff;background:#222735;padding:8px 12px;margin:5px 0;border-radius:6px;overflow-wrap:anywhere';
  input.parentNode.insertBefore(marker,input.nextSibling);
 }
 var a=split(value),p=limit(cursor,a.length);
 marker.textContent='';
 marker.appendChild(document.createTextNode(a.slice(0,p).join('')));
 var caret=document.createElement('span');caret.textContent='│';caret.style.color='#ffd34b';caret.style.fontWeight='bold';
 marker.appendChild(caret);
 marker.appendChild(document.createTextNode(a.slice(p).join('')));
 if(!a.length)marker.appendChild(document.createTextNode('  ← курсор →'));
}
function installLargeStyle(){
 if(document.getElementById('lsk-large-style'))return;
 var style=document.createElement('style');
 style.id='lsk-large-style';
 style.textContent='body.search--open .simple-keyboard:has(.lsk-left){width:100%!important;max-width:100%!important;font-size:1.25em!important}' +
 'body.search--open .simple-keyboard:has(.lsk-left) .hg-row{display:flex!important;gap:6px!important;margin-bottom:7px!important}' +
 'body.search--open .simple-keyboard:has(.lsk-left) .hg-button{min-height:64px!important;min-width:0!important;flex:1 1 0!important;padding:10px 3px!important;font-size:25px!important;display:flex!important;align-items:center!important;justify-content:center!important;box-sizing:border-box!important}' +
 'body.search--open .simple-keyboard:has(.lsk-left) .lsk-left,body.search--open .simple-keyboard:has(.lsk-left) .lsk-right{flex:2 1 0!important;font-size:19px!important}';
 document.head.appendChild(style);
}
function nativeClass(){return window.SimpleKeyboard&&window.SimpleKeyboard.default}
function patchInstance(kb){
 if(!kb||kb.__lskPatched||typeof kb.handleButtonClicked!=='function')return;
 var original=kb.handleButtonClicked;
 kb.handleButtonClicked=function(button,event){
  if(!searchOpen()||!tracking)return original.apply(this,arguments);
  var a=split(this.getInput()||'');
  cursor=limit(cursor,a.length);
  if(button==='{BKSP}'||button==='{SPACE}'||(typeof button==='string'&&button.charAt(0)!=='{')){
   if(button==='{BKSP}'&&cursor>0){a.splice(cursor-1,1);cursor--}
   else if(button==='{SPACE}'){a.splice(cursor,0,' ');cursor++}
   else if(button.charAt(0)!=='{'){
    var letters=split(button);
    Array.prototype.splice.apply(a,[cursor,0].concat(letters));
    cursor+=letters.length;
   }
   var value=a.join('');
   this.setInput(value);
   if(this.options&&typeof this.options.onChange==='function')this.options.onChange(value);
   display(value);
   return;
  }
  return original.apply(this,arguments);
 };
 kb.__lskPatched=true;
}
function voiceSearch(kb){
 var Recognition=window.SpeechRecognition||window.webkitSpeechRecognition;
 if(!Recognition){
  if(window.Lampa&&Lampa.Noty&&Lampa.Noty.show)Lampa.Noty.show('Голосовой ввод недоступен в браузере телевизора');
  else alert('Голосовой ввод недоступен в браузере телевизора');
  return;
 }
 try{
  var rec=new Recognition();
  rec.lang=(window.Lampa&&Lampa.Storage&&Lampa.Storage.get&&Lampa.Storage.get('language','ru')==='uk')?'uk-UA':'ru-RU';
  rec.interimResults=false;
  rec.maxAlternatives=1;
  rec.onresult=function(event){
   var phrase=event.results&&event.results[0]&&event.results[0][0]&&event.results[0][0].transcript;
   if(!phrase)return;
   kb.setInput(phrase);
   cursor=split(phrase).length;
   if(kb.options&&typeof kb.options.onChange==='function')kb.options.onChange(phrase);
   display(phrase);
  };
  rec.onerror=function(event){
   var msg=event&&event.error==='not-allowed'?'Нет доступа к микрофону':'Голосовой ввод: '+(event.error||'ошибка');
   if(window.Lampa&&Lampa.Noty&&Lampa.Noty.show)Lampa.Noty.show(msg);
  };
  rec.start();
 }catch(e){
  if(window.Lampa&&Lampa.Noty&&Lampa.Noty.show)Lampa.Noty.show('Не удалось включить микрофон');
 }
}
function customSearchKeyboard(opts){
 var self=this;
 this.options=opts;
 this.options.layoutName='default';
 this.options.lastLayerSelect='default';
 this.input='';
 this.__lskCustom=true;
 function render(){
  var host=document.querySelector('.simple-keyboard');
  if(!host)return;
  host.innerHTML='';
  var rows=self.options.layout[self.options.layoutName]||self.options.layout.default||[];
  rows.forEach(function(row){
   var line=document.createElement('div');
   line.className='hg-row';
   row.split(/\s+/).forEach(function(key){
    if(!key)return;
    var el=document.createElement('div');
    el.className='hg-button';
    el.setAttribute('data-skbtn',key);
    var labels={'{BKSP}':'⌫','{SPACE}':'Пробел','{LANG}':'🌐','{SIM}':'#+','{ABC}':'АБВ','{MIC}':'🎤','{ENTER}':'OK','{SEARCH}':'Поиск','{SHIFT}':'⇧'};
    el.textContent=labels[key]||key;
    line.appendChild(el);
   });
   host.appendChild(line);
  });
  // Cursor keys are native remote-navigable elements.
  var last=host.querySelector('.hg-row:last-child');
  if(last){
   [['◀ Курсор',-1,'lsk-left'],['Курсор ▶',1,'lsk-right']].forEach(function(item){
    var el=document.createElement('div');
    el.className='hg-button selector binded '+item[2];
    el.textContent=item[0];
    el.style.cssText='min-width:108px;background:#dcb332;color:#151515;font-weight:bold';
    el.setAttribute('data-skbtn',item[2]);
    if(window.jQuery)window.jQuery(el).on('hover:enter',function(){move(item[1])});
    el.addEventListener('click',function(){move(item[1])});
    last.appendChild(el);
   });
  }
 }
 this.getInput=function(){return self.input};
 this.setInput=function(v){self.input=String(v||'')};
 this.setOptions=function(o){
  for(var k in o)if(Object.prototype.hasOwnProperty.call(o,k))self.options[k]=o[k];
  render();
 };
 this.handleButtonClicked=function(key){
  if(key==='{MIC}'){voiceSearch(self);return}
  if(key==='{BKSP}'||key==='{SPACE}'||(key.charAt(0)!=='{')){
   var arr=split(self.input);
   cursor=limit(cursor,arr.length);
   if(key==='{BKSP}'&&cursor>0){arr.splice(cursor-1,1);cursor--}
   else if(key==='{SPACE}'){arr.splice(cursor,0,' ');cursor++}
   else if(key.charAt(0)!=='{'){
    var letters=split(key);
    Array.prototype.splice.apply(arr,[cursor,0].concat(letters));
    cursor+=letters.length;
   }
   self.input=arr.join('');
   if(typeof self.options.onChange==='function')self.options.onChange(self.input);
   display(self.input);
  }else if(typeof self.options.onKeyPress==='function')self.options.onKeyPress(key);
 };
 render();
}
function installPatch(){
 if(patched)return true;
 var cls=nativeClass();
 if(typeof cls!=='function')return false;
 function WrappedKeyboard(opts){
  var layout=opts&&opts.layout;
  var isSearch=layout&&layout.sim&&layout.en&&layout.default&&layout.sim.length===2&&layout.en.length===3;
  if(isSearch)return new customSearchKeyboard(opts);
  var instance=Reflect.construct(cls,arguments,cls);
  patchInstance(instance);
  return instance;
 }
 WrappedKeyboard.prototype=cls.prototype;
 try{window.SimpleKeyboard.default=WrappedKeyboard;patched=true;return true}
 catch(e){console.error('[LSK] custom keyboard',e);return false}
}
function move(delta){
 if(!searchOpen())return;
 var cls=nativeClass(),input=document.querySelector('.search__input');
 var value=input&&input.classList.contains('filled')?(input.textContent||'').replace(/\u00a0/g,' '):'';
 cursor=limit(cursor+delta,split(value).length);
 display(value);
}
function installControls(){
 if(!searchOpen())return;
 if(!installPatch())return;
 var kb=document.querySelector('.simple-keyboard'),last=kb&&kb.querySelector('.hg-row:last-child');
 if(!last)return;
 if(!tracking){tracking=true;cursor=split((document.querySelector('.search__input') ? document.querySelector('.search__input').textContent : '')||'').length}
 if(!kb.querySelector('.lsk-left')){
  [['◀ Курсор',-1,'lsk-left'],['Курсор ▶',1,'lsk-right']].forEach(function(item){
   var b=document.createElement('div');
   b.className='hg-button selector binded '+item[2];
   b.textContent=item[0];b.style.cssText='min-width:108px;background:#dcb332;color:#151515;font-weight:bold';
   b.setAttribute('data-skbtn',item[2]);
   if(window.jQuery)window.jQuery(b).on('hover:enter',function(){move(item[1])});
   b.addEventListener('click',function(e){e.stopPropagation();move(item[1])});
   last.appendChild(b);
   try{if(window.Lampa&&Lampa.Controller&&Lampa.Controller.collectionAppend)Lampa.Controller.collectionAppend(b)}catch(e){}
  });
 }
 var field=document.querySelector('.search__input');
 if(field)display(field.classList.contains('filled')?(field.textContent||'').replace(/\u00a0/g,' '):'');
}
function schedule(){
 if(scheduled)return;scheduled=true;
 setTimeout(function(){
  scheduled=false;
  if(searchOpen())installControls();
  else{tracking=false;marker=null}
 },160);
}
function init(){
 if(!document.body)return;
 installLargeStyle();
 installPatch();
 var observer=new MutationObserver(schedule);
 observer.observe(document.body,{childList:true,subtree:true});
 if(window.Lampa&&Lampa.Search&&Lampa.Search.listener){
  Lampa.Search.listener.follow('open',function(){tracking=false;cursor=0;schedule()});
  Lampa.Search.listener.follow('close',function(){tracking=false;marker=null});
 }
 setInterval(schedule,1700);
 schedule();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
// Header action: restart Lampa from the native TV remote navigation.
function installRestart(){
 if(document.querySelector('.lsk-restart-action'))return true;
 var host=document.querySelector('.head__actions');
 if(!host)return false;
 var btn=document.createElement('div');
 btn.className='head__action selector lsk-restart-action';
 btn.setAttribute('title','Перезагрузка Lampa');
 btn.setAttribute('aria-label','Перезагрузка Lampa');
 btn.style.cssText='display:flex;align-items:center;justify-content:center;min-width:42px;min-height:42px;cursor:pointer';
 btn.innerHTML='<svg viewBox="0 0 24 24" width="27" height="27" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11a9 9 0 1 1 2.7 6.4"/><path d="M3 4v7h7"/></svg>';
 var action=function(){window.location.reload()};
 if(window.jQuery)window.jQuery(btn).on('hover:enter',action);
 btn.addEventListener('click',function(e){e.stopPropagation();action()});
 host.insertBefore(btn,host.firstChild);
 try{
  if(window.Lampa&&Lampa.Controller&&Lampa.Controller.collectionAppend)Lampa.Controller.collectionAppend(btn);
 }catch(e){}
 return true;
}
var restartTimer=setInterval(installRestart,2000);
installRestart();
window.LampaSmartKeyboard={version:'4.2',move:move};
console.log('[Lampa Smart Keyboard] native inline editor 4.2');
})();