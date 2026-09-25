(function () {
    'use strict';
    if (window.kinokradPersonal) return;
    var SITE = 'https://kinokrad.im';
    var PLAYER = 'https://franko.uacdn.online';
    var serial = 0;
    function safe(s) { return String(s || '').replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
    function menu(title, items, select, back) {
        Lampa.Select.show({title:safe(title), items:items, onSelect:select, onBack:back || home});
    }
    function fail(message, back) {
        menu('Кінокрад — не удалось открыть', [{title:safe(message)}, {title:'Назад'}], back || home, back || home);
    }
    function request(url, callback, back, body) {
        var generation = ++serial;
        var network = new Lampa.Reguest();
        network.timeout(20000);
        menu('Кінокрад', [{title:'Загрузка…'}, {title:'Отмена'}], cancel, cancel);
        function cancel() { serial++; network.clear(); (back || home)(); }
        network.native(url, function (data) {
            if (generation !== serial) return;
            try { callback(data); } catch (e) { fail(e.message || 'Формат сайта изменился', back); }
        }, function () { if (generation === serial) fail('Источник недоступен. Попробуйте позже.', back); }, body ? JSON.stringify(body) : false,
        {dataType:'text', headers:body ? {'Content-Type':'application/json'} : {}, contentType:body ? 'application/json' : undefined});
    }
    function documentOf(html) { return new DOMParser().parseFromString(html, 'text/html'); }
    function catalogItems(html) {
        var doc = documentOf(html), seen = {}, result = [];
        Array.prototype.forEach.call(doc.querySelectorAll('.kino-card .kino-poster'), function (a) {
            var url = new URL(a.getAttribute('href'), SITE);
            if (url.origin !== SITE || seen[url.href]) return;
            seen[url.href] = true;
            var title = a.getAttribute('title') || a.textContent.trim();
            result.push({title:safe(title), url:url.href, name:title});
        });
        return result;
    }
    function catalog(path, page, query) {
        var url = query ? SITE + '/index.php?do=search&subaction=search&story=' + encodeURIComponent(query) : SITE + path + (page > 1 ? 'page/' + page + '/' : '');
        request(url, function (html) {
            var items = catalogItems(html);
            if (!items.length) return fail(query ? 'Ничего не найдено. Попробуйте название на украинском.' : 'Каталог пуст или формат сайта изменился.', home);
            if (!query && documentOf(html).querySelector('a[href="' + SITE + path + 'page/' + (page+1) + '/"]')) items.push({title:'Следующая страница →', next:true});
            if (page > 1 && !query) items.unshift({title:'← Предыдущая страница', prev:true});
            menu(query ? 'Поиск: ' + query : 'Кінокрад · страница ' + page, items, function (item) {
                if (item.next || item.prev) return catalog(path, page + (item.next ? 1 : -1), query);
                film(item, function () { catalog(path, page, query); });
            }, home);
        }, home);
    }
    function payload(html) {
        var match = html.match(/window\.__PLAYER_PAYLOAD__\s*=\s*(\{[^\n]+\});/);
        if (!match) throw Error('Этот плеер пока не поддерживается.');
        return JSON.parse(match[1]);
    }
    function film(item, back) {
        request(item.url, function (html) {
            var buttons = documentOf(html).querySelectorAll('button[data-url]');
            var embed;
            Array.prototype.forEach.call(buttons, function (button) {
                var u = new URL(button.getAttribute('data-url'), SITE);
                if (u.origin === PLAYER && /^\/show\/kinopoisk\/\d+$/.test(u.pathname)) embed = u.href;
            });
            if (!embed) return fail('На этой странице нет поддерживаемого украинского плеера.', back);
            request(embed, function (html) { translations(item, embed, payload(html), back); }, back);
        }, back);
    }
    function translations(item, embed, p, back) {
        var items = (p.translations || []).map(function (t) { return {title:safe(t.title), id:t.id}; });
        if (!items.length) return fail('Озвучки пока недоступны.', back);
        menu(item.name + ' · озвучка', items, function (t) {
            var u = embed + '?translation=' + encodeURIComponent(t.id);
            var again = function () { translations(item, embed, p, back); };
            request(u, function (html) {
                var selected = payload(html);
                if (selected.is_serial) seasons(item, u, selected, again);
                else play(item.name, u, selected, again);
            }, again);
        }, back);
    }
    function seasons(item, embed, p, back) {
        var numbers = Object.keys(p.seasons_episodes || {}).sort(function(a,b){return Number(a)-Number(b);});
        if (!numbers.length) return fail('Сезоны этой озвучки недоступны.', back);
        menu(item.name + ' · сезон', numbers.map(function (s) { return {title:'Сезон ' + s, season:s}; }), function (s) {
            var again = function () { seasons(item, embed, p, back); };
            var episodes = p.seasons_episodes[s.season] || [];
            menu('Сезон ' + s.season, episodes.map(function (e) { return {title:'Серия ' + e, episode:e}; }), function (e) {
                var u = embed + '&season=' + encodeURIComponent(s.season) + '&episode=' + encodeURIComponent(e.episode);
                request(u, function (html) { play(item.name + ' · S' + s.season + ' E' + e.episode, u, payload(html), again); }, again);
            }, again);
        }, back);
    }
    function play(title, embed, p, back) {
        if (p.captcha_required !== false) return fail('Источник требует проверку в браузере. Автоматическое воспроизведение недоступно.', back);
        request(PLAYER + '/api/player/files', function (raw) {
            var data = typeof raw === 'string' ? JSON.parse(raw) : raw;
            if (!data.file || !/^https:\/\//.test(data.file)) return fail('Источник не вернул видеоссылку.', back);
            var video = {url:data.file, title:title};
            Lampa.Select.hide();
            Lampa.Player.play(video);
            Lampa.Player.playlist([video]);
        }, back, {id:Number(p.id), translation:p.translate || null, season_number:p.season || null, episode_number:p.episode || null,
            force_cdn:p.force_cdn || '', turnstile_token:'', bootstrap_token:p.player_files_token || ''});
    }
    function home() {
        serial++;
        if (!Lampa.Platform.is('android')) return fail('Эта версия рассчитана на приложение Lampa для Android.', function () { Lampa.Select.hide(); Lampa.Controller.toggle('menu'); });
        menu('Кінокрад · личный источник', [{title:'Поиск', action:'search'}, {title:'Все новинки', path:'/'}, {title:'Фильмы', path:'/films/'}, {title:'Сериалы', path:'/serials/'}], function (item) {
            if (item.action === 'search') Lampa.Input.edit({title:'Название на украинском', value:'', free:true, nosave:true}, function (q) { if (q && q.trim()) catalog('/', 1, q.trim()); else home(); });
            else catalog(item.path, 1);
        }, function () { serial++; Lampa.Select.hide(); Lampa.Controller.toggle('menu'); });
    }
    function start() {
        if (window.kinokradPersonal) return;
        window.kinokradPersonal = {version:'0.1.0', open:home};
        var button = $('<li class="menu__item selector"><div class="menu__ico"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M4 3h16v18H4zM6 5v3h3V5zm9 0v3h3V5zM6 16v3h3v-3zm9 0v3h3v-3zM10 9v6l5-3z"/></svg></div><div class="menu__text">Кінокрад</div></li>');
        button.on('hover:enter', home);
        $('.menu .menu__list').eq(0).append(button);
    }
    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });
})();

