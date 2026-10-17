/* Lampa Smart Keyboard 3.2: inline cursor editing on native Lampa keyboard */
(function(){
'use strict';
if(window.LampaSmartKeyboard&&window.LampaSmartKeyboard.version==='3.2')return;
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
function nativeClass(){return window.SimpleKeyboard&&window.SimpleKeyboard.default}
function installPatch(){
 if(patched)return true;
 var cls=nativeClass();
 if(!cls||!cls.prototype||typeof cls.prototype.handleButtonClicked!=='function')return false;
 var original=cls.prototype.handleButtonClicked;
 cls.prototype.handleButtonClicked=function(button,event){
  if(!searchOpen()||!tracking)return original.apply(this,arguments);
  var before=this.getInput()||'',a=split(before);
  cursor=limit(cursor,a.length);
  var result;
  if(button==='{BKSP}'||button==='{SPACE}'){
   if(button==='{BKSP}'&&cursor>0){a.splice(cursor-1,1);cursor--}
   if(button==='{SPACE}'){a.splice(cursor,0,' ');cursor++}
   var next=a.join('');
   this.setInput(next);
   if(this.options&&typeof this.options.onChange==='function')this.options.onChange(next);
   display(next);
   return;
  }
  if(typeof button==='string'&&button.charAt(0)!=='{'&&button.length){
   // Native library appends characters. Restore insertion at the cursor afterwards.
   result=original.apply(this,arguments);
   var after=this.getInput()||'',added=split(after).slice(split(before).length).join('');
   if(added){
    var addedChars=split(added);Array.prototype.splice.apply(a,[cursor,0].concat(addedChars));cursor+=addedChars.length;
    var corrected=a.join('');
    if(corrected!==after){
     this.setInput(corrected);
     if(this.options&&typeof this.options.onChange==='function')this.options.onChange(corrected);
    }
    display(corrected);
   }else display(after);
   return result;
  }
  result=original.apply(this,arguments);
  display(this.getInput()||'');
  return result;
 };
 patched=true;
 return true;
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
   b.className='hg-button selector '+item[2];
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
 if(!window.Lampa||!Lampa.Head||typeof Lampa.Head.addIcon!=='function')return false;
 if(document.querySelector('.lsk-restart-action'))return true;
 var icon='<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11a9 9 0 1 1 2.7 6.4"/><path d="M3 4v7h7"/></svg>';
 try{
  var button=Lampa.Head.addIcon(icon,function(){window.location.reload()});
  if(button&&button.addClass){
   button.addClass('lsk-restart-action');
   button.attr('title','Перезапустить Lampa');
   button.attr('aria-label','Перезапустить Lampa');
  }
  return true;
 }catch(e){console.error('[Lampa Smart Keyboard] restart button',e);return false}
}
var restartTries=0,restartTimer=setInterval(function(){
 if(installRestart()||++restartTries>120)clearInterval(restartTimer);
},500);
window.LampaSmartKeyboard={version:'3.2',move:move};
console.log('[Lampa Smart Keyboard] native inline editor 3.2');
})();