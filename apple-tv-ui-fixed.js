/* Apple-inspired styling for Lampa. Version 2. Standalone ES5 plugin. */
(function () {
    'use strict';
    var id = 'lampa-apple-ui-fixed';
    var attempts = 0;
    var css = [
        'body{background:#111!important;font-family:Arial,sans-serif}',
        'body .card .card__view{border-radius:16px!important;overflow:visible!important}',
        'body .card .card__img{border-radius:16px!important}',
        'body .card.focus .card__view::after,body .card.hover .card__view::after{content:""!important;display:block!important;position:absolute!important;top:0!important;left:0!important;right:0!important;bottom:0!important;border:4px solid #fff!important;border-radius:16px!important;z-index:20!important;pointer-events:none!important;box-shadow:0 0 0 2px #86caff,0 0 22px rgba(134,202,255,.8)!important}',
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
