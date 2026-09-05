/* Apple-inspired styling for Lampa. Version 7: glass cards and sidebar selection. Standalone ES5 plugin. */
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
    apply();
})();
