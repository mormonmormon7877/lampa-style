/* Apple-inspired styling for Lampa. Version 4: wide glass edge. Standalone ES5 plugin. */
(function () {
    'use strict';
    var id = 'lampa-apple-ui-fixed';
    var attempts = 0;
    var css = [
        'body{background:#111!important;font-family:Arial,sans-serif}',
        'body .card .card__view{border-radius:16px!important;overflow:visible!important}',
        'body .card .card__img{border-radius:16px!important}',
        'body .card.focus .card__view::after,body .card.hover .card__view::after{content:""!important;display:block!important;position:absolute!important;box-sizing:border-box!important;top:0!important;left:0!important;right:0!important;bottom:0!important;border:15px solid rgba(225,240,255,.32)!important;border-top-color:rgba(255,255,255,.88)!important;border-left-color:rgba(240,248,255,.62)!important;border-bottom-color:rgba(190,216,240,.38)!important;border-right-color:rgba(225,240,255,.48)!important;border-radius:16px!important;background:transparent!important;z-index:20!important;pointer-events:none!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.55),inset 0 3px 6px rgba(255,255,255,.22),inset 0 -2px 5px rgba(20,35,55,.3),0 0 0 1px rgba(255,255,255,.35),0 3px 14px rgba(0,0,0,.45),0 0 12px rgba(210,235,255,.22)!important}',
        '.card__title{font-weight:500!important}',
        '.menu{background-color:rgba(20,20,20,.96)}',
        '.menu__item{border-radius:12px}',
        'body .menu__item.focus{background:#fff!important;color:#111!important;box-shadow:0 0 14px rgba(134,202,255,.6)!important}',
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
    apply();
})();
