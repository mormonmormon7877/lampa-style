(function () {
    'use strict';
    if (window.lampaShelfLoaded) return;
    window.lampaShelfLoaded = true;
    var ID = 'personal_shelf', started = false;
    var sections = [
        {title: 'Просмотренное', note: 'Карточки с вашей отметкой «Просмотрено».', local: true},
        {title: 'Новое', note: 'Последние добавления каталога CUB без просмотренного.', url: '?sort=latest'},
        {title: 'Интересное', note: 'Популярное в CUB без просмотренного.', url: '?sort=top'},
        {title: 'Сейчас смотрят', note: 'Подборка CUB. Статистика просмотров не подтверждена открытым кодом Lampa.', url: '?sort=now_playing'}
    ];
    function kind(card) { return card.media_type === 'tv' || card.name || card.original_name ? 'tv' : 'movie'; }
    function key(card) { return (card.source && card.source !== 'cub' && card.source !== 'tmdb' ? card.source : 'tmdb') + ':' + kind(card) + ':' + card.id; }
    function unique(cards) {
        var seen = {};
        return cards.filter(function (card) {
            if (!card || card.id == null) return false;
            var id = key(card);
            if (seen[id]) return false;
            seen[id] = true;
            return true;
        });
    }
    function watched() { return unique(Lampa.Favorite.get({type: 'viewed'}) || []); }
    function Page() {
        var html = $('<div class="personal-shelf"></div>');
        var scroll = new Lampa.Scroll({mask: true, over: true});
        var states = [], last = null, dead = false, active = false;
        function bind(button, action) {
            button.on('hover:focus', function () { last = button[0]; scroll.update(button, true); });
            button.on('hover:enter', action);
            return button;
        }
        function focusRefresh() {
            if (!active || dead) return;
            Lampa.Controller.collectionSet(html);
        }
        function addCard(state, card) {
            var button = $('<div class="personal-shelf__card selector"></div>').attr('data-shelf-key', key(card));
            var image = $('<div class="personal-shelf__poster"></div>').append($('<span class="personal-shelf__placeholder"></span>').text(card.title || card.name || 'Без названия'));
            if (card.poster_path) {
                var src = Lampa.Api.img(card.poster_path, 'w300');
                if (/^https?:\/\//i.test(src)) {
                    var img = $('<img loading="lazy" alt="">').attr('src', src);
                    img.on('error', function () { img.remove(); });
                    image.append(img);
                }
            }
            button.append(image, $('<div class="personal-shelf__name"></div>').text(card.title || card.name || 'Без названия'));
            var date = card.release_date || card.first_air_date || '';
            button.append($('<div class="personal-shelf__meta"></div>').text((kind(card) === 'tv' ? 'Сериал' : 'Фильм') + (date ? ' · ' + date.slice(0, 4) : '')));
            bind(button, function () {
                Lampa.Activity.push({component: 'full', id: card.id, method: kind(card), card: card, source: card.source || 'tmdb'});
            });
            state.grid.append(button);
        }
        function paint(state) {
            var oldKey = last && $.contains(state.grid[0], last) ? $(last).attr('data-shelf-key') : null;
            state.grid.empty();
            var viewed = {};
            watched().forEach(function (card) { viewed[key(card)] = true; });
            var cards = state.def.local ? watched().slice(0, state.limit) : state.cards.filter(function (card) {
                return state.index === 3 || !viewed[key(card)];
            });
            cards.forEach(function (card) { addCard(state, card); });
            if (oldKey) last = state.grid.find('.selector').filter(function () { return $(this).attr('data-shelf-key') === oldKey; })[0] || state.heading[0];
            if (state.def.local) state.more.toggle(state.limit < watched().length);
            state.message.text(state.error || (cards.length ? '' : state.def.local ? 'Пока нет отметок «Просмотрено». Добавьте их в карточках фильмов или сериалов.' : 'На загруженных страницах нет непросмотренных карточек.'));
            focusRefresh();
        }
        function load(state) {
            if (state.busy || dead) return;
            if (state.def.local) {
                state.limit += 20;
                paint(state);
                state.more.toggle(state.limit < watched().length);
                return;
            }
            state.busy = true;
            state.error = '';
            state.message.text('');
            state.more.text('Загрузка…');
            var settled = false;
            var timer = setTimeout(function () { finish(null); }, 15000);
            state.timer = timer;
            function finish(data) {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                state.busy = false;
                if (dead) return;
                if (!data || !Array.isArray(data.results)) {
                    state.error = 'CUB недоступен. Проверьте подключение и повторите загрузку.';
                    state.message.text(state.error);
                    state.more.text('Повторить').show();
                    focusRefresh();
                    return;
                }
                state.error = '';
                var before = state.cards.length;
                state.cards = unique(state.cards.concat(data.results));
                state.page++;
                paint(state);
                state.more.text('Показать ещё').toggle(data.results.length > 0 && state.cards.length > before && (!data.total_pages || state.page <= Number(data.total_pages)));
            }
            try {
                Lampa.Api.sources.cub.list({url: state.def.url, page: state.page}, finish, function () { finish(null); });
            } catch (e) { finish(null); }
        }
        this.create = function () {
            scroll.minus();
            html.append(scroll.render());
            var intro = $('<div class="personal-shelf__intro"></div>').text('Моя полка');
            scroll.append(intro);
            sections.forEach(function (def, index) {
                var box = $('<section class="personal-shelf__section"></section>');
                var heading = bind($('<div class="personal-shelf__heading selector"></div>').text(def.title), function () {
                    Lampa.Controller.collectionFocus(state.grid.find('.selector').first()[0] || state.more[0], html);
                });
                var state = {def: def, index: index, grid: $('<div class="personal-shelf__grid"></div>'), message: $('<div class="personal-shelf__message"></div>'), more: $('<div class="personal-shelf__more selector">Показать ещё</div>'), cards: [], page: 1, limit: 0};
                state.heading = heading;
                box.append(heading, $('<div class="personal-shelf__note"></div>').text(def.note), state.grid, state.message, state.more);
                bind(state.more, function () { load(state); });
                scroll.append(box);
                states.push(state);
                load(state);
            });
            this.activity.loader(false);
            this.activity.toggle();
            return this.render();
        };
        this.start = function () {
            active = true;
            states.forEach(function (state) { if (!state.busy) paint(state); });
            Lampa.Controller.add('content', {
                toggle: function () {
                    active = true;
                    Lampa.Controller.collectionSet(html);
                    Lampa.Controller.collectionFocus(last && $.contains(html[0], last) ? last : false, html);
                },
                left: function () { if (Navigator.canmove('left')) Navigator.move('left'); else Lampa.Controller.toggle('menu'); },
                right: function () { Navigator.move('right'); },
                up: function () { if (Navigator.canmove('up')) Navigator.move('up'); else Lampa.Controller.toggle('head'); },
                down: function () { Navigator.move('down'); },
                back: function () { Lampa.Activity.backward(); },
                gone: function () { active = false; }
            });
            Lampa.Controller.toggle('content');
        };
        this.pause = this.stop = function () { active = false; };
        this.render = function () { return html; };
        this.destroy = function () {
            dead = true;
            active = false;
            states.forEach(function (state) { clearTimeout(state.timer); });
            scroll.destroy();
            html.remove();
        };
    }
    function start() {
        if (started) return;
        started = true;
        if (!Lampa.Api || !Lampa.Api.sources || !Lampa.Api.sources.cub || !Lampa.Favorite) {
            Lampa.Noty.show('Моя полка: эта версия Lampa не поддерживается. Обновите приложение.');
            return;
        }
        Lampa.Component.add(ID, Page);
        $('<style id="personal-shelf-style">.personal-shelf{height:100%}.personal-shelf__intro{font-size:2em;font-weight:700;margin:0 0 1em}.personal-shelf__section{margin-bottom:2.5em}.personal-shelf__heading{font-size:1.5em;font-weight:600;display:inline-block;padding:.3em;border-radius:.3em}.personal-shelf__note,.personal-shelf__message{opacity:.7;margin:.5em 0 1em;line-height:1.5}.personal-shelf__grid{display:flex;flex-wrap:wrap;margin:0 -.5em}.personal-shelf__card{width:16.666%;padding:.5em;box-sizing:border-box;border-radius:.5em}.personal-shelf__poster{position:relative;padding-top:150%;background:#292c33;border-radius:.5em;overflow:hidden;font-size:.8em}.personal-shelf__placeholder{position:absolute;top:40%;left:10%;right:10%;text-align:center;line-height:1.4;opacity:.5}.personal-shelf__poster img{position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover}.personal-shelf__name{margin-top:.5em;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.personal-shelf__meta{opacity:.6;font-size:.8em;margin-top:.3em}.personal-shelf__more{display:inline-block;padding:.7em 1.2em;background:#30333b;border-radius:.4em;margin-top:1em}.personal-shelf .focus{outline:3px solid #8cbcff;background:rgba(100,160,255,.18)}@media(max-width:700px){.personal-shelf__card{width:33.333%}}</style>').appendTo('head');
        var menu = $('<li class="menu__item selector"><div class="menu__ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/></svg></div><div class="menu__text">Моя полка</div></li>');
        menu.on('hover:enter', function () { Lampa.Activity.push({component: ID, title: 'Моя полка', page: 1}); });
        $('.menu .menu__list').first().append(menu);
    }
    if (window.appready) start();
    else Lampa.Listener.follow('app', function (event) { if (event.type === 'ready') start(); });
})();
