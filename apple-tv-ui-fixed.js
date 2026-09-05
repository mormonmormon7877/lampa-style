/* Apple-inspired styling for Lampa. Standalone ES5 plugin. */
(function () {
    'use strict';
    var id = 'lampa-apple-ui-fixed';
    var attempts = 0;
    var css = [
        'body{background:#111!important;font-family:Arial,sans-serif}',
        '.card .card__view{border-radius:16px;overflow:hidden;transition:transform .18s ease,box-shadow .18s ease}',
        '.card .card__img{border-radius:16px}',
        '.card.focus .card__view,.card:focus .card__view{box-shadow:0 0 0 3px #fff,0 8px 18px rgba(0,0,0,.45)}',
        '.card__title{font-weight:500!important}',
        '.menu{background-color:rgba(20,20,20,.96)}',
        '.menu__item{border-radius:12px}',
        '.menu__item.focus,.menu__item:focus{background-color:rgba(255,255,255,.18)}',
        '@media (hover:hover){.card:hover .card__view{box-shadow:0 0 0 3px #fff}.menu__item:hover{background-color:rgba(255,255,255,.12)}}',
        '@media (prefers-reduced-motion:reduce){.card .card__view{transition:none}}'
    ].join('\n');
    function apply() {
        if (document.getElementById(id)) return;
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
