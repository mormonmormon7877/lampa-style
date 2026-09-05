/* Apple-inspired styling for Lampa. Version 17: glass player and remote options menu. Standalone ES5 plugin. */
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
