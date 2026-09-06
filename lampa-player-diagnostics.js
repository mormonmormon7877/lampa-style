/* Read-only Lampa player diagnostics. No controller switching or key interception. */
(function () {
    'use strict';
    if (window.__applePlayerDiagnostics) window.__applePlayerDiagnostics.destroy();
    var box = null, timer = null, lastKey = '-', dead = false;
    function value(key) { try { return String(Lampa.Storage.field ? Lampa.Storage.field(key) : Lampa.Storage.get(key,'')); } catch (ignore) { return '?'; } }
    function visible(el) { return !!(el && el.getClientRects().length); }
    function update() {
        if (dead || !window.Lampa || !document.body) return;
        var root = document.querySelector('.player');
        if (!visible(root)) { if (box) box.style.display = 'none'; return; }
        if (!box) {
            box = document.createElement('div');
            box.id = 'apple-player-diagnostics';
            box.style.cssText = 'position:fixed;top:16%;left:3%;max-width:94%;z-index:2147483500;background:rgba(0,0,0,.85);color:#fff;font:18px Arial;line-height:1.5;padding:10px;white-space:pre-wrap;pointer-events:none';
            document.body.appendChild(box);
        }
        box.style.display = 'block';
        var state = {}, video = null, focused = root.querySelector('.focus'), panel = root.querySelector('.player-panel'), data = {};
        try { state = Lampa.Controller.enabled() || {}; } catch (ignore) {}
        try { video = Lampa.PlayerVideo.video(); } catch (ignore) {}
        try { data = Lampa.Player.playdata() || {}; } catch (ignore) {}
        var count = 0, buttons = root.querySelectorAll('.player-panel .selector');
        for (var i=0;i<buttons.length;i++) if (visible(buttons[i])) count++;
        var style = document.getElementById('lampa-apple-ui-fixed');
        box.textContent = 'Диагностика D1 | Плеер: ' + value('player') + ' | Навигация: ' + value('navigation_type') +
            '\nУправление: ' + (state.name || 'нет') + ' | Кнопка: ' + (focused ? focused.className : 'нет выделения') +
            '\nПанель: ' + (visible(panel) ? 'видна' : 'скрыта') + ' | Кнопок: ' + count + ' | Пауза: ' + (video ? String(video.paused) : '?') +
            '\nЗапуск: ' + (data.launch_player || 'по настройке') + ' | IPTV: ' + !!data.iptv + ' | Клавиша: ' + lastKey +
            '\nОформление: ' + (style ? 'есть' : 'нет') + ' | Заставка: ' + (document.getElementById('apple-pause-overlay') ? 'открыта' : 'закрыта');
    }
    function key(event) { lastKey = String(event.keyCode || event.which); }
    window.addEventListener('keydown',key,true);
    timer = setInterval(update,500);
    window.__applePlayerDiagnostics = {destroy:function () {
        dead = true;clearInterval(timer);window.removeEventListener('keydown',key,true);
        if (box && box.parentNode) box.parentNode.removeChild(box);
    }};
    update();
})();
