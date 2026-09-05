/* Apple-inspired styling for Lampa. Version 19: hold video frame between screensavers. Standalone ES5 plugin. */
(function () {
    'use strict';
    var id = 'lampa-apple-ui-fixed';
    var attempts = 0;
    var css = [
        'body{background:#111!important;font-family:Arial,sans-serif}',
        'body .card .card__view{border-radius:16px!important;overflow:visible!important}',
        'body .card .card__img{border-radius:16px!important}',
        "body .card.focus .card__view::after,body .card.hover .card__view::after{content:\"\"!important;display:block!important;position:absolute!important;box-sizing:border-box!important;top:-15px!important;left:-15px!important;right:-15px!important;bottom:-15px!important;border:15px solid rgba(255,255,255,.13)!important;border-radius:31px!important;background:transparent!important;z-index:20!important;pointer-events:none!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.48),0 0 0 1px rgba(255,255,255,.56),0 5px 12px rgba(0,0,0,.18)!important}",
        "@supports (-webkit-mask-composite:xor){body .card.focus .card__view::after,body .card.hover .card__view::after{border:0!important;padding:15px!important;background:linear-gradient(125deg,rgba(255,255,255,.48) 0%,rgba(255,255,255,.1) 19%,rgba(255,255,255,.035) 43%,rgba(255,255,255,.2) 74%,rgba(255,255,255,.4) 100%)!important;-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0)!important;-webkit-mask-composite:xor!important;mask-composite:exclude!important;-webkit-backdrop-filter:blur(6px) saturate(145%)!important;backdrop-filter:blur(6px) saturate(145%)!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.7)!important}}",
        '.card__title{font-weight:500!important}',
        '.menu{background-color:rgba(20,20,20,.96)}',
        '.menu__item{border-radius:12px}',
        'body .menu:not(.editable) .menu__text{display:inline-block;-webkit-transform-origin:left center;transform-origin:left center;-webkit-transform:scale(1);transform:scale(1);-webkit-transition:-webkit-transform .18s ease;transition:transform .18s ease;}',
        'body .menu:not(.editable) .menu__item.focus .menu__text,body .menu:not(.editable) .menu__item.hover .menu__text{-webkit-transform:scale(1.15)!important;transform:scale(1.15)!important;}',
        '@media (prefers-reduced-motion:reduce){body .menu .menu__text{-webkit-transition:none!important;transition:none!important;}}',
        "body .menu:not(.editable) .menu__item.focus,body .menu:not(.editable) .menu__item.hover{background:linear-gradient(125deg,rgba(255,255,255,.28) 0%,rgba(255,255,255,.09) 19%,rgba(255,255,255,.035) 43%,rgba(255,255,255,.12) 74%,rgba(255,255,255,.24) 100%)!important;color:#fff!important;border-radius:16px!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.6),inset 0 1px 3px rgba(255,255,255,.16),0 3px 8px rgba(0,0,0,.15)!important;-webkit-backdrop-filter:blur(6px) saturate(145%)!important;backdrop-filter:blur(6px) saturate(145%)!important;}",
        "body .menu:not(.editable) .menu__item.focus .menu__text,body .menu:not(.editable) .menu__item.hover .menu__text{color:#fff!important;}",
        "body .menu:not(.editable) .menu__item.focus .menu__ico > img,body .menu:not(.editable) .menu__item.hover .menu__ico > img{-webkit-filter:none!important;filter:none!important;}",
        "body .menu:not(.editable) .menu__item.focus .menu__ico [stroke]:not([stroke=\"none\"]),body .menu:not(.editable) .menu__item.hover .menu__ico [stroke]:not([stroke=\"none\"]){stroke:#fff!important;}",
        "body .menu:not(.editable) .menu__item.focus .menu__ico [fill]:not([fill=\"none\"]),body .menu:not(.editable) .menu__item.hover .menu__ico [fill]:not([fill=\"none\"]){fill:#fff!important;}",
        '@media (prefers-reduced-motion:reduce){.card .card__view{transition:none}}'
    ].join('\n');
    function apply() {
        var existing = document.getElementById(id);
        if (existing) {
            existing.textContent = css;
            return;
        }
        var parent = document.head || document.documentElement;
        if (!parent) {
            if (++attempts < 100) setTimeout(apply, 100);
            return;
        }
        var style = document.createElement('style');
        style.id = id;
        style.type = 'text/css';
        style.textContent = css;
        parent.appendChild(style);
    }
    // All generated CSS uses numeric, bounded preferences (no CSS variables required).
    var baseCss = css;
    var owner = window.__lampaAppleGlass;
    if (owner && owner.destroy) owner.destroy();
    var timer = 0;
    var frame = 0;
    var observer = null;
    var row = null;
    var dead = false;
    var bootAttempts = 0;
    var controllerListener = null;
    var panelController = null;
    var originalPanelUp = null;
    var component = 'apple_glass';
    var prefix = 'apple_glass_';
    var options = [
        ['tone', 'Вид стекла', {'clear':'Обычное стекло','dark':'Тёмное стекло','smoke':'Дымчатое стекло'}, 'clear'],
        ['width', 'Толщина рамки', {'5':'5 px','10':'10 px','15':'15 px','20':'20 px'}, '15'],
        ['transparency', 'Прозрачность стекла', {'50':'50% — ярче','70':'70% — обычная','85':'85% — прозрачнее'}, '70'],
        ['zoom', 'Увеличение постера', {'0':'Выключено','5':'5%','6':'6%','7':'7%'}, '6'],
        ['shine', 'Блик при выборе', {'true':'Включён','false':'Выключен'}, 'true'],
        ['dim', 'Затемнение соседних постеров', {'0':'Выключено','15':'Лёгкое — 15%','25':'Обычное — 25%','35':'Сильнее — 35%'}, '25'],
        ['buttons', 'Стеклянные кнопки фильма', {'true':'Включены','false':'Выключены'}, 'true'],
        ['player', 'Стеклянный плеер', {'true':'Включён','false':'Выключен'}, 'true'],
        ['remote', 'Меню плеера стрелкой вверх', {'true':'Качество, звук и режимы','false':'Штатное управление'}, 'true']
    ];
    function pref(name) {
        var spec;
        for (var i = 0; i < options.length; i++) if (options[i][0] === name) spec = options[i];
        var value = spec[3];
        try { if (window.Lampa && Lampa.Storage) value = String(Lampa.Storage.get(prefix + name, value)); } catch (ignore) {}
        return Object.prototype.hasOwnProperty.call(spec[2], value) ? value : spec[3];
    }
    function render() {
        var width = Number(pref('width'));
        var gain = (100 - Number(pref('transparency'))) / 30;
        var tone = pref('tone');
        if (tone === 'dark') gain *= 0.65;
        if (tone === 'smoke') gain *= 0.4;
        var panelAlpha = (tone === 'smoke' ? 0.55 : tone === 'dark' ? 0.38 : 0.20) * ((100 - Number(pref('transparency'))) / 30);
        var scale = 1 + Number(pref('zoom')) / 100;
        var cardRing = 'body .card.focus .card__view::after,body .card.hover .card__view::after';
        var episodeRing = 'body .full-episode.focus::after,body .full-episode.hover::after,body .card-episode.focus .full-episode::after,body .card-episode.hover .full-episode::after';
        var ring = cardRing + ',' + episodeRing;
        var selected = 'body .card.focus .card__view,body .card.hover .card__view';
        var result = baseCss.split(cardRing).join(ring).replace(/-15px/g, '-' + width + 'px')
            .replace(/border:15px/g, 'border:' + width + 'px')
            .replace(/padding:15px/g, 'padding:' + width + 'px')
            .replace(/border-radius:31px/g, 'border-radius:' + (16 + width) + 'px')
            .replace(/rgba\(255,255,255,([.\d]+)\)/g, function (all, alpha) {
                return 'rgba(255,255,255,' + Math.min(1, Number(alpha) * gain).toFixed(3) + ')';
            });
        result += '\nbody .card .card__view{-webkit-transform-origin:center center;transform-origin:center center;-webkit-transition:-webkit-transform .2s ease;transition:transform .2s ease;}';
        result += '\nbody .card .card__view{margin-bottom:' + (width + 10) + 'px!important;}';
        result += '\n' + selected + '{-webkit-animation:none!important;animation:none!important;-webkit-transform:scale(' + scale + ')!important;transform:scale(' + scale + ')!important;}';
        result += '\nbody .card.focus,body .card.hover{z-index:3;}';
        result += '\nbody .full-episode{position:relative;overflow:visible!important;}';
        result += '\nbody .menu,body .wrap__left{background:transparent!important;}';
        result += '\nbody .wrap__left > .scroll{background:linear-gradient(135deg,rgba(255,255,255,.09),rgba(255,255,255,.015) 45%,rgba(255,255,255,.045)),rgba(12,16,22,' + Math.min(.8,panelAlpha).toFixed(3) + ')!important;border-radius:0 22px 22px 0!important;box-shadow:inset -1px 0 0 rgba(255,255,255,.22),8px 0 22px rgba(0,0,0,.12)!important;-webkit-backdrop-filter:blur(10px) saturate(135%)!important;backdrop-filter:blur(10px) saturate(135%)!important;}';
        result += '\nbody .atv-glass-row .card:not(.focus):not(.hover) .card__img{opacity:' + (1 - Number(pref('dim')) / 100) + '!important;}';
        if (pref('shine') === 'true') {
            // The existing mask clips the moving reflection to the ring only.
            var reflection = 'linear-gradient(110deg,transparent 35%,rgba(255,255,255,.48) 49%,transparent 63%)';
            var glass = 'linear-gradient(125deg,rgba(255,255,255,' + (.48 * gain).toFixed(3) + ') 0%,rgba(255,255,255,' + (.1 * gain).toFixed(3) + ') 19%,rgba(255,255,255,' + (.035 * gain).toFixed(3) + ') 43%,rgba(255,255,255,' + (.2 * gain).toFixed(3) + ') 74%,rgba(255,255,255,' + (.4 * gain).toFixed(3) + ') 100%)';
            result += '\n@supports (-webkit-mask-composite:xor){' + ring + '{background-image:' + reflection + ',' + glass + '!important;background-size:300% 100%,100% 100%!important;background-repeat:no-repeat!important;background-position:-100% 0,0 0;-webkit-animation:atv-glass-shine 2s ease-out 1 both;animation:atv-glass-shine 2s ease-out 1 both;}}';
            result += '\n@-webkit-keyframes atv-glass-shine{from{background-position:150% 0,0 0}to{background-position:-100% 0,0 0}}@keyframes atv-glass-shine{from{background-position:150% 0,0 0}to{background-position:-100% 0,0 0}}';
        }
        if (pref('buttons') === 'true') {
            result += '\nbody .full-start__button{background:linear-gradient(125deg,rgba(255,255,255,.15),rgba(255,255,255,.035) 50%,rgba(255,255,255,.10))!important;color:#fff!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.25)!important;}';
            result += '\nbody .full-start__button.focus,body .full-start__button.hover{background:linear-gradient(125deg,rgba(255,255,255,.28),rgba(255,255,255,.06) 45%,rgba(255,255,255,.24))!important;color:#fff!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.65),0 3px 8px rgba(0,0,0,.18)!important;-webkit-backdrop-filter:blur(6px) saturate(145%);backdrop-filter:blur(6px) saturate(145%);}';
            result += '\nbody .full-start__button.loading.focus:before{-webkit-filter:none!important;filter:none!important;}';
        }
        var sourceGlass = 'linear-gradient(125deg,rgba(255,255,255,' + (.28 * gain).toFixed(3) + ') 0%,rgba(255,255,255,' + (.09 * gain).toFixed(3) + ') 19%,rgba(255,255,255,' + (.035 * gain).toFixed(3) + ') 43%,rgba(255,255,255,' + (.12 * gain).toFixed(3) + ') 74%,rgba(255,255,255,' + (.24 * gain).toFixed(3) + ') 100%)';
        result += '\nbody .selectbox .selectbox-item.focus,body .selectbox .selectbox-item.hover,body .online.focus,body .online.hover{background:' + sourceGlass + '!important;color:#fff!important;border-radius:16px!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.6),inset 0 1px 3px rgba(255,255,255,.16),0 3px 8px rgba(0,0,0,.15)!important;-webkit-backdrop-filter:blur(6px) saturate(145%)!important;backdrop-filter:blur(6px) saturate(145%)!important;}';
        result += '\nbody .selectbox .selectbox-item.focus .selectbox-item__title,body .selectbox .selectbox-item.hover .selectbox-item__title{color:#fff!important;}';
        result += '\nbody .selectbox .selectbox-item.focus .selectbox-item__checkbox,body .selectbox .selectbox-item.focus .settings-folder__icon{-webkit-filter:none!important;filter:none!important;}';
        result += '\nbody .selectbox .selectbox-item.focus::after{border-color:#fff!important;}';
        var settingsTargets = 'body .settings-folder.focus,body .settings-folder.hover,body .settings-param.focus,body .settings-param.hover';
        result += '\n' + settingsTargets + '{background:' + sourceGlass + '!important;color:#fff!important;border-radius:16px!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.6),inset 0 1px 3px rgba(255,255,255,.16),0 3px 8px rgba(0,0,0,.15)!important;-webkit-backdrop-filter:blur(6px) saturate(145%)!important;backdrop-filter:blur(6px) saturate(145%)!important;}';
        result += '\nbody .settings-folder.focus .settings-folder__icon,body .settings-folder.hover .settings-folder__icon,body .settings-param.focus .settings-folder__icon,body .settings-param.hover .settings-folder__icon,body .settings-param.focus .selectbox-item__checkbox{-webkit-filter:none!important;filter:none!important;}';
        var shineTargets = 'body .menu:not(.editable) .menu__item.focus,body .menu:not(.editable) .menu__item.hover,body .selectbox .selectbox-item.focus,body .selectbox .selectbox-item.hover,body .online.focus,body .online.hover';
        shineTargets += ',' + settingsTargets;
        if (pref('player') === 'true') {
            var playerTargets = 'body .player-panel .button.focus,body .player-panel .button.hover';
            result += '\nbody .player-panel__body{background:linear-gradient(125deg,rgba(255,255,255,.10),rgba(255,255,255,.025)),rgba(10,14,20,' + Math.min(.85,panelAlpha + .28).toFixed(3) + ')!important;border-radius:22px!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.2),0 8px 30px rgba(0,0,0,.25)!important;-webkit-backdrop-filter:blur(10px) saturate(135%);backdrop-filter:blur(10px) saturate(135%);}';
            result += '\n' + playerTargets + '{background:' + sourceGlass + '!important;color:#fff!important;border-radius:14px!important;box-shadow:inset 0 0 0 2px rgba(255,255,255,.8),0 0 12px rgba(255,255,255,.12)!important;}';
            result += '\nbody .player-panel .button.focus svg,body .player-panel .button.hover svg{color:#fff!important;-webkit-filter:none!important;filter:none!important;}';
            result += '\nbody .player-panel__timeline{height:8px!important;border-radius:8px!important;background:rgba(255,255,255,.18)!important;overflow:visible!important;}';
            result += '\nbody .player-panel__peding{border-radius:8px!important;background:rgba(255,255,255,.3)!important;}body .player-panel__position{height:100%!important;border-radius:8px!important;background:linear-gradient(90deg,#b9dfff,#fff)!important;}';
            result += '\nbody .player-panel__position > div{position:absolute!important;right:-8px!important;top:50%!important;width:16px!important;height:16px!important;margin-top:-8px!important;border-radius:50%!important;background:#fff!important;box-shadow:0 0 0 3px rgba(255,255,255,.2)!important;pointer-events:none!important;}';
            result += '\nbody .player-panel__timeline.focus{box-shadow:0 0 0 2px rgba(255,255,255,.7)!important;}';
            result += '\nbody .player-panel__timenow,body .player-panel__timeend{font-size:1.2em!important;font-weight:600!important;line-height:1.3!important;}body .player-panel__filename,body .player-info__name{font-size:1.6em!important;line-height:1.25!important;text-shadow:0 2px 5px #000;}';
            shineTargets += ',' + playerTargets;
        }
        result += '\n.atv-player-hint{font-size:1em;line-height:1.3;color:rgba(255,255,255,.85);padding:.7em 1em;text-align:center;pointer-events:none;}';
        if (pref('buttons') === 'true') shineTargets += ',body .full-start__button.focus,body .full-start__button.hover';
        if (pref('shine') === 'true') {
            result += '\n' + shineTargets + '{background-image:linear-gradient(110deg,transparent 35%,rgba(255,255,255,.28) 49%,transparent 63%),' + sourceGlass + '!important;background-size:300% 100%,100% 100%!important;background-repeat:no-repeat!important;background-position:-100% 0,0 0;-webkit-animation:atv-glass-shine 2s ease-out 1 both!important;animation:atv-glass-shine 2s ease-out 1 both!important;}';
        }
        if (tone !== 'clear') {
            var tint = tone === 'dark' ? 'rgba(12,17,24,.38)' : 'rgba(5,8,12,.65)';
            var tintTargets = shineTargets;
            if (pref('buttons') === 'true') tintTargets += ',body .full-start__button';
            result += '\n' + tintTargets + '{background-color:' + tint + '!important;}';
            // Without mask support, tint only the border; never cover the poster.
            result += '\n' + ring + '{border-color:' + tint + '!important;}';
            result += '\n@supports (-webkit-mask-composite:xor){' + ring + '{background-color:' + tint + '!important;}}';
        }
        var noMotionTargets = shineTargets.replace(/body /g, 'body.no--animation ');
        result += '\n' + noMotionTargets + '{-webkit-animation:none!important;animation:none!important;}';
        result += '\n@media(prefers-reduced-motion:reduce){' + shineTargets + '{-webkit-animation:none!important;animation:none!important;}}';
        result += '\n' + episodeRing.replace(/body /g, 'body.no--animation ') + '{-webkit-animation:none!important;animation:none!important;}';
        result += '\n@media(prefers-reduced-motion:reduce){' + episodeRing + '{-webkit-animation:none!important;animation:none!important;}}';
        result += '\nbody.no--animation .card__view,body.no--animation .card__view::after{-webkit-transition:none!important;transition:none!important;-webkit-animation:none!important;animation:none!important;}';
        result += '\n@media(prefers-reduced-motion:reduce){body .card__view,body .card__view::after{-webkit-transition:none!important;transition:none!important;-webkit-animation:none!important;animation:none!important;}}';
        css = result;
        apply();
        refreshRow();
        hookPlayer();
    }
    function restorePanel() {
        if (panelController && panelController.up === playerUp) panelController.up = originalPanelUp;
        panelController = null;
        originalPanelUp = null;
    }
    function playerUp() {
        if (!openPlayerMenu() && originalPanelUp) originalPanelUp.call(panelController);
    }
    function tell(message) {
        if (window.Lampa && Lampa.Noty && Lampa.Noty.show) Lampa.Noty.show(message);
    }
    function nativePlayerAction(selector, title) {
        Lampa.Controller.toggle('player_panel');
        var button = document.querySelector('.player .player-panel ' + selector);
        if (!button || button.classList.contains('hide')) {
            tell(title + ': источник не передал доступные варианты.');
            return;
        }
        try {
            if (Lampa.Utils && Lampa.Utils.trigger) Lampa.Utils.trigger(button, 'hover:enter');
            else if (window.$) window.$(button).trigger('hover:enter');
            else { tell('Не удалось открыть штатное меню этой версии Lampa.'); return; }
            if (Lampa.Select.opened && !Lampa.Select.opened()) tell(title + ': список вариантов недоступен для этого видео.');
        } catch (error) { tell('Не удалось открыть: ' + title); }
    }
    function chooseGlassMode() {
        Lampa.Select.show({title:'Режим стекла',items:[
            {title:'Обычное стекло',value:'clear',selected:pref('tone') === 'clear'},
            {title:'Тёмное стекло',value:'dark',selected:pref('tone') === 'dark'},
            {title:'Дымчатое стекло',value:'smoke',selected:pref('tone') === 'smoke'}
        ],onSelect:function (item) {
            Lampa.Storage.set(prefix + 'tone',item.value);
            render();
            Lampa.Controller.toggle('player_panel');
        },onBack:openPlayerMenu});
    }
    function openPlayerMenu() {
        if (dead || !window.Lampa || !Lampa.Select || !Lampa.Select.show || !Lampa.Controller || !document.querySelector('.player .player-panel')) return false;
        Lampa.Select.show({title:'Качество, звук и режимы',items:[
            {title:'Качество видео',action:'quality'},
            {title:'Звуковая дорожка / озвучка',action:'tracks'},
            {title:'Субтитры',action:'subs'},
            {title:'Источник / поток',action:'flow'},
            {title:'Формат изображения и скорость',action:'settings'},
            {title:'Режим стекла',action:'glass'},
            {title:'Перемотка',action:'rewind'}
        ],onSelect:function (item) {
            if (item.action === 'glass') { chooseGlassMode(); return; }
            if (item.action === 'rewind') {
                Lampa.Controller.toggle('player_panel');
                if (originalPanelUp) originalPanelUp.call(panelController);
                return;
            }
            nativePlayerAction('.player-panel__' + item.action,item.title);
        },onBack:function () { Lampa.Controller.toggle('player_panel'); }});
        return true;
    }
    function hookPlayer() {
        if (dead || !window.Lampa || !Lampa.Controller || !Lampa.Controller.enabled) return;
        if (pref('remote') !== 'true' || !Lampa.Select || !Lampa.Select.show) {
            restorePanel();
            var hints = document.querySelectorAll('.atv-player-hint');
            for (var i = 0; i < hints.length; i++) hints[i].parentNode.removeChild(hints[i]);
            return;
        }
        var active = Lampa.Controller.enabled();
        if (active.name !== 'player_panel' || !active.controller) return;
        if (panelController !== active.controller) {
            restorePanel();
            panelController = active.controller;
            originalPanelUp = panelController.up;
            panelController.up = playerUp;
        }
        var body = document.querySelector('.player .player-panel__body');
        if (body && !body.querySelector('.atv-player-hint')) {
            var hint = document.createElement('div');
            hint.className = 'atv-player-hint';
            hint.textContent = '↑ Качество, звук и режимы • OK — выбрать • Назад — к видео';
            body.appendChild(hint);
        }
    }
    function refreshRow() {
        var next = null;
        if (pref('dim') !== '0') {
            var cards = document.querySelectorAll('.card.focus,.card.hover');
            for (var i = 0; i < cards.length; i++) {
                if (!cards[i].getClientRects().length) continue;
                next = cards[i].parentElement;
                var ancestor = next;
                while (ancestor && ancestor !== document.body) {
                    if (ancestor.classList.contains('items-line')) { next = ancestor; break; }
                    ancestor = ancestor.parentElement;
                }
                break;
            }
        }
        if (next === row) return;
        if (row) row.classList.remove('atv-glass-row');
        row = next;
        if (row) row.classList.add('atv-glass-row');
    }
    function schedule() {
        if (dead || frame) return;
        frame = window.requestAnimationFrame(function () { frame = 0; if (!dead) refreshRow(); });
    }
    function watch() {
        if (observer || !document.body || !window.MutationObserver) return;
        observer = new MutationObserver(function (changes) {
            for (var i = 0; i < changes.length; i++) {
                var change = changes[i];
                if (change.type === 'childList' || (change.target.classList &&
                    (change.target.classList.contains('card') || /\b(focus|hover)\b/.test(change.oldValue || '')))) {
                    schedule(); break;
                }
            }
        });
        observer.observe(document.body, {subtree:true,childList:true,attributes:true,attributeFilter:['class'],attributeOldValue:true});
        refreshRow();
    }
    function setup() {
        if (dead) return;
        watch();
        var api = window.Lampa && Lampa.SettingsApi;
        if (!api || !api.addComponent || !api.addParam || !Lampa.Storage || !document.body) {
            if (++bootAttempts < 240) timer = setTimeout(setup, 250);
            return;
        }
        if (api.removeComponent) api.removeComponent(component);
        else if (window.__appleGlassSettingsAdded) { render(); return; }
        api.addComponent({component:component,name:'Стеклянный интерфейс',icon:'<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="1.5"/><path d="M7 12l5-5m-2 10l7-7" stroke="currentColor" stroke-width="1.5"/></svg>'});
        for (var i = 0; i < options.length; i++) {
            var spec = options[i];
            api.addParam({component:component,param:{name:prefix + spec[0],type:'select',values:spec[2],default:spec[3]},field:{name:spec[1]},onChange:function () {
                // Lampa writes Storage before invoking onChange.
                if (window.__lampaAppleGlass) window.__lampaAppleGlass.render();
            }});
        }
        window.__appleGlassSettingsAdded = true;
        if (!controllerListener && Lampa.Controller && Lampa.Controller.listener && Lampa.Controller.listener.follow) {
            controllerListener = Lampa.Controller.listener;
            controllerListener.follow('toggle',hookPlayer);
        }
        render();
    }
    window.__lampaAppleGlass = {
        render:render,
        destroy:function () {
            dead = true;
            if (controllerListener && controllerListener.remove) controllerListener.remove('toggle',hookPlayer);
            restorePanel();
            var hints = document.querySelectorAll('.atv-player-hint');
            for (var i = 0; i < hints.length; i++) hints[i].parentNode.removeChild(hints[i]);
            clearTimeout(timer);
            if (frame) window.cancelAnimationFrame(frame);
            if (observer) observer.disconnect();
            if (row) row.classList.remove('atv-glass-row');
        }
    };
    render();
    setup();

})();

/* Pause screensaver v19. Independent lifecycle; never changes the movie URL/time. */
(function () {
    'use strict';
    if (window.__applePauseSaver) window.__applePauseSaver.destroy();
    var defaultManifest = 'https://mormonmormon7877.github.io/lampa-style/screensavers/manifest.json';
    try { if (document.currentScript && document.currentScript.src) defaultManifest = new URL('screensavers/manifest.json',document.currentScript.src).href; } catch (ignore) {}
    var key = 'apple_pause_';
    var component = 'apple_pause_saver';
    var delayTimer, mediaTimer, clockTimer, bootTimer, request;
    var overlay = null, media = null, clock = null, still = null;
    var files = [], fileIndex = 0, failures = 0, generation = 0;
    var paused = false, dead = false, preview = false, previous = '';
    var swallowed = null, subscriptions = [], attempts = 0;
    var defaults = {delay:'120',mode:'clock',interval:'30',manifest:defaultManifest};
    var choices = {
        delay:{'0':'Выключена','30':'30 секунд','60':'1 минута','120':'2 минуты','300':'5 минут','600':'10 минут','900':'15 минут'},
        mode:{clock:'Часы',images:'Картинки из папки',videos:'Видео из папки',mixed:'Картинки и видео'},
        interval:{'15':'15 секунд','30':'30 секунд','60':'1 минута','120':'2 минуты'}
    };
    function get(name) {
        var value = defaults[name];
        try { value = String(Lampa.Storage.get(key + name,value)); } catch (ignore) {}
        if (choices[name] && !Object.prototype.hasOwnProperty.call(choices[name],value)) value = defaults[name];
        return value;
    }
    function notify(message) { if (window.Lampa && Lampa.Noty) Lampa.Noty.show(message); }
    function moviePaused() {
        if (!window.Lampa || !Lampa.Player || !Lampa.Player.opened || !Lampa.Player.opened()) return false;
        var root = document.querySelector('.player');
        if (root && root.classList.contains('player--loading')) return false;
        try {
            var video = Lampa.PlayerVideo && Lampa.PlayerVideo.video();
            if (video && typeof video.paused === 'boolean') return video.paused && !video.ended;
        } catch (ignore) {}
        return paused;
    }
    function releaseMedia() {
        clearTimeout(mediaTimer);
        if (media) {
            media.onload = media.onerror = media.onended = media.onloadeddata = media.onplaying = null;
            if (media.tagName === 'VIDEO') {
                media.pause(); media.removeAttribute('src'); media.load();
            }
            if (media.parentNode) media.parentNode.removeChild(media);
            media = null;
        }
    }
    function hide(rearm) {
        generation++;
        if (request) { request.abort(); request = null; }
        releaseMedia();
        clearInterval(clockTimer);
        if (overlay) overlay.parentNode.removeChild(overlay);
        overlay = null; clock = null; still = null; preview = false;
        if (window.Lampa && Lampa.Controller && Lampa.Controller.enabled().name === component && previous) Lampa.Controller.toggle(previous);
        if (rearm) arm();
    }
    function arm() {
        clearTimeout(delayTimer);
        if (dead || overlay || get('delay') === '0' || !moviePaused()) return;
        delayTimer = setTimeout(function () {
            if (!moviePaused() || dead) return;
            if (document.hidden || (Lampa.Select && Lampa.Select.opened && Lampa.Select.opened()) || document.body.classList.contains('settings--open')) { arm(); return; }
            show(false);
        },Number(get('delay')) * 1000);
    }
    function stopped() { paused = false; clearTimeout(delayTimer); hide(false); }
    function onPause() { paused = true; arm(); }
    function tick() {
        if (!clock) return;
        var now = new Date();
        clock.textContent = ('0' + now.getHours()).slice(-2) + ':' + ('0' + now.getMinutes()).slice(-2);
        var corners = [['12%','14%'],['65%','18%'],['60%','68%'],['15%','65%']];
        var corner = corners[Math.floor(Date.now() / 30000) % corners.length];
        clock.style.left = corner[0]; clock.style.top = corner[1];
    }
    function loadList(done, report) {
        if (request) request.abort();
        var token = generation;
        var base;
        try { base = new URL(get('manifest')); if (!/^https?:$/.test(base.protocol)) throw new Error(); }
        catch (ignore) { if (report) notify('Укажите HTTP(S)-адрес manifest.json.'); done([]); return; }
        var xhr = request = new XMLHttpRequest();
        xhr.open('GET',base.href + (base.search ? '&' : '?') + 'v=' + Date.now(),true);
        xhr.timeout = 10000;
        function finish(list) {
            if (request === xhr) request = null;
            if (!dead && token === generation) done(list);
        }
        xhr.onload = function () {
            var list = [];
            try {
                if (xhr.status < 200 || xhr.status >= 300) throw new Error();
                var data = JSON.parse(xhr.responseText);
                if (!Array.isArray(data.files)) throw new Error();
                data.files.slice(0,200).forEach(function (entry) {
                    if (typeof entry !== 'string') return;
                    var url = new URL(entry,base.href);
                    if (!/^https?:$/.test(url.protocol)) return;
                    var type = /\.(mp4|webm)$/i.test(url.pathname) ? 'video' : /\.(jpg|jpeg|png|webp|svg)$/i.test(url.pathname) ? 'image' : '';
                    if (type) list.push({url:url.href,type:type});
                });
                if (report) notify('Заставок в папке: ' + list.length);
            } catch (ignore) { if (report) notify('Не удалось прочитать папку. Проверьте адрес manifest.json.'); }
            finish(list);
        };
        xhr.onerror = xhr.ontimeout = function () { if (report) notify('Папка заставок недоступна.'); finish([]); };
        xhr.send();
    }
    function nextMedia() {
        // Keep a frame while releasing the decoder for the next clip.
        if (media && still && media.tagName === 'VIDEO' && media.readyState >= 2) {
            try {
                still.width = Math.min(media.videoWidth,1920);
                still.height = Math.round(still.width * media.videoHeight / media.videoWidth);
                still.getContext('2d').drawImage(media,0,0,still.width,still.height);
                still.style.display = 'block';
            } catch (ignore) {}
        }
        releaseMedia();
        if (!overlay || !files.length || failures >= files.length) return;
        var entry = files[fileIndex++ % files.length];
        var item = media = document.createElement(entry.type === 'video' ? 'video' : 'img');
        item.style.cssText = 'position:absolute;inset:0;top:0;left:0;width:100%;height:100%;object-fit:contain;pointer-events:none';
        var token = generation;
        function failed() {
            if (generation !== token || media !== item) return;
            failures++;
            if (preview) notify('Не удалось загрузить видео: ' + entry.url.split('/').pop());
            // A failed video decoder must not affect the paused movie.
            nextMedia();
        }
        item.onerror = failed;
        overlay.insertBefore(item,clock);
        if (entry.type === 'video') {
            item.muted = true; item.defaultMuted = true; item.setAttribute('muted','');
            item.setAttribute('playsinline',''); item.preload = 'auto';
            item.style.visibility = 'hidden';
            item.onplaying = function () {
                if (media !== item) return;
                clearTimeout(mediaTimer); failures = 0;
                item.style.visibility = 'visible';
                if (still) still.style.display = 'none';
            };
            item.onended = function () { if (media === item) { failures = 0; nextMedia(); } };
            item.onloadeddata = function () { if (media === item) failures = 0; };
            item.src = entry.url;
            var promise = item.play();
            if (promise && promise.catch) promise.catch(failed);
            mediaTimer = setTimeout(function () { if (media === item && item.style.visibility === 'hidden') failed(); },30000);
        } else {
            item.onload = function () {
                if (media !== item) return;
                failures = 0; clearTimeout(mediaTimer);
                if (still) still.style.display = 'none';
                mediaTimer = setTimeout(nextMedia,Number(get('interval')) * 1000);
            };
            item.src = entry.url;
            mediaTimer = setTimeout(failed,15000);
        }
    }
    function show(isPreview) {
        if (dead || overlay || (!isPreview && !moviePaused())) return;
        clearTimeout(delayTimer);
        generation++; preview = isPreview;
        overlay = document.createElement('div'); overlay.id = 'apple-pause-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:2147483000;background:#000;overflow:hidden;color:#b7bcc5';
        still = document.createElement('canvas');
        still.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;object-fit:contain;display:none';
        overlay.appendChild(still);
        clock = document.createElement('div');
        clock.style.cssText = 'position:absolute;font:300 6vw Arial,sans-serif;text-shadow:0 2px 12px #000;z-index:1;pointer-events:none';
        overlay.appendChild(clock);document.body.appendChild(overlay);
        tick();clockTimer = setInterval(tick,1000);
        if (Lampa.Controller && Lampa.Controller.add) {
            previous = Lampa.Controller.enabled().name;
            var dismiss = function () { hide(true); };
            Lampa.Controller.add(component,{invisible:true,toggle:function () {},up:dismiss,down:dismiss,left:dismiss,right:dismiss,enter:dismiss,back:dismiss,long:dismiss});
            Lampa.Controller.toggle(component);
        }
        if (get('mode') !== 'clock') loadList(function (list) {
            if (!overlay) return;
            files = list.filter(function (item) { return get('mode') === 'mixed' || (get('mode') === 'images' && item.type === 'image') || (get('mode') === 'videos' && item.type === 'video'); });
            fileIndex = 0; failures = 0;
            nextMedia();
        },false);
    }
    function input(event) {
        var code = event.keyCode || event.which;
        if (event.type === 'keyup') {
            if (swallowed !== null && code === swallowed) { swallowed = null; event.preventDefault(); event.stopImmediatePropagation(); }
            return;
        }
        if (swallowed !== null && event.type === 'keydown' && code === swallowed) { event.preventDefault(); event.stopImmediatePropagation(); return; }
        if (overlay) {
            if (event.type === 'keydown') swallowed = code;
            event.preventDefault();event.stopImmediatePropagation();hide(true);
        } else arm();
    }
    function changed() { hide(false);arm(); }
    function subscribe(bus,event,fn) { if (bus && bus.follow) { bus.follow(event,fn);subscriptions.push([bus,event,fn]); } }
    function setup() {
        if (dead) return;
        if (!window.Lampa || !Lampa.SettingsApi || !Lampa.Storage || !document.body) {
            if (++attempts < 240) bootTimer = setTimeout(setup,250);
            return;
        }
        var api = Lampa.SettingsApi;
        if (api.removeComponent) api.removeComponent(component);
        api.addComponent({component:component,name:'Заставка',icon:'<svg viewBox="0 0 24 24" fill="none"><rect x="2" y="3" width="20" height="15" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M8 22h8m-4-4v4" stroke="currentColor" stroke-width="1.5"/></svg>'});
        [['delay','Включать после паузы'],['mode','Тип заставки'],['interval','Смена картинки']].forEach(function (entry) {
            api.addParam({component:component,param:{name:key + entry[0],type:'select',values:choices[entry[0]],default:defaults[entry[0]]},field:{name:entry[1]},onChange:changed});
        });
        api.addParam({component:component,param:{name:key + 'manifest',type:'input',values:'',default:defaultManifest},field:{name:'Папка заставок',description:'Адрес файла screensavers/manifest.json на вашем GitHub Pages.'},onChange:changed});
        api.addParam({component:component,param:{name:key + 'refresh',type:'button'},field:{name:'Проверить папку'},onChange:function () { loadList(function () {},true); }});
        api.addParam({component:component,param:{name:key + 'preview',type:'button'},field:{name:'Предпросмотр',description:'Любая кнопка закрывает заставку. Фильм остаётся на паузе.'},onChange:function () { show(true); }});
        var videoBus = Lampa.PlayerVideo && Lampa.PlayerVideo.listener;
        subscribe(videoBus,'pause',onPause);subscribe(videoBus,'play',stopped);subscribe(videoBus,'ended',stopped);subscribe(videoBus,'destroy',stopped);
        var playerBus = Lampa.Player && Lampa.Player.listener;
        subscribe(playerBus,'destroy',stopped);subscribe(playerBus,'start',stopped);subscribe(playerBus,'external',stopped);
        window.addEventListener('keydown',input,true);window.addEventListener('keyup',input,true);
        window.addEventListener('mousedown',input,true);window.addEventListener('touchstart',input,true);
        arm();
    }
    window.__applePauseSaver = {destroy:function () {
        dead = true;clearTimeout(delayTimer);clearTimeout(bootTimer);hide(false);
        subscriptions.forEach(function (sub) { if (sub[0].remove) sub[0].remove(sub[1],sub[2]); });
        window.removeEventListener('keydown',input,true);window.removeEventListener('keyup',input,true);
        window.removeEventListener('mousedown',input,true);window.removeEventListener('touchstart',input,true);
    }};
    setup();
})();
