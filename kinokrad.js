(function () {
    'use strict';
    if (window.kinokradPersonal) return;
    var SITE = 'https://kinokrad.im';
    var PLAYER = 'https://franko.uacdn.online';
    var serial = 0;
    var tvSession = null;
    function notice(message) { if (Lampa.Noty) Lampa.Noty.show(message); }
    function endTV() {
        if (!tvSession) return;
        tvSession.active = false;
        clearTimeout(tvSession.timer);
        if (tvSession.restoreURL) tvSession.restoreURL();
        if (Lampa.Storage.field('player') === tvSession.playerSetting) Lampa.Storage.set('player', tvSession.previousPlayer);
        tvSession = null;
    }
    function tvControls(video, manifest, metadata) {
        var api = window.webapis && window.webapis.avplay;
        if (!api || !Lampa.Storage || !Lampa.Player.listener) throw Error('Для управления звуком нужен Samsung-плеер в приложении Lampa.');
        endTV();
        var session = {active:true, busy:false, rate:null, previousPlayer:Lampa.Storage.field('player'), playerSetting:'tizen'};
        tvSession = session;
        video.kinokradTV = session;
        var lines = manifest.split(/\r?\n/), levels = [], seen = {}, stream;
        lines.forEach(function (line) {
            if (line.indexOf('#EXT-X-STREAM-INF:') === 0) stream = line;
            else if (stream && line && line.charAt(0) !== '#') {
                var size = stream.match(/RESOLUTION=(\d+)x(\d+)/), rate = stream.match(/(?:[:,])BANDWIDTH=(\d+)/);
                if (size && rate && !seen[size[1] + 'x' + size[2]]) {
                    seen[size[1] + 'x' + size[2]] = true;
                    var width = Number(size[1]);
                    levels.push({title:width === 1920 ? '1080p' : width === 1280 ? '720p' : width === 854 ? '480p' : size[2] + 'p', rate:Number(rate[1])});
                }
                stream = null;
            }
        });
        function active() { return session.active && tvSession === session; }
        function selectAudio(index) {
            if (!active() || session.busy) return notice('Дождитесь загрузки видео.');
            var paused = false;
            try {
                var state = api.getState();
                if (state !== 'PLAYING' && state !== 'PAUSED') throw Error('not playing');
                var tracks = api.getTotalTrackInfo().filter(function (track) { return track.type === 'AUDIO'; }).sort(function (a,b) { return a.index-b.index; });
                if (!tracks[index]) throw Error('track unavailable');
                paused = state === 'PAUSED';
                if (paused) api.play();
                api.setSelectTrack('AUDIO', tracks[index].index);
            } catch (e) { notice('Телевизор не смог переключить эту озвучку.'); }
            finally { if (paused) { try { api.pause(); } catch (e) {} } }
        }
        function switchQuality(rate) {
            if (!active() || session.busy) return notice('Дождитесь переключения качества.');
            var state, position, audio, oldRate = session.rate;
            try {
                state = api.getState();
                if (state !== 'PLAYING' && state !== 'PAUSED') throw Error('not playing');
                position = api.getCurrentTime();
                audio = api.getCurrentStreamInfo().filter(function (t) { return t.type === 'AUDIO'; })[0];
            } catch (e) { return notice('Сначала дождитесь начала воспроизведения.'); }
            session.busy = true;
            function prepare(value, recovery) {
                if (!active()) return;
                try {
                    api.stop(); // AVPlay must be IDLE before ADAPTIVE_INFO.
                    var allRates = levels.map(function (l) { return l.rate; });
                    var range = value || (Math.min.apply(Math, allRates) + '~' + Math.max.apply(Math, allRates));
                    api.setStreamingProperty('ADAPTIVE_INFO', 'BITRATES=' + range);
                    api.prepareAsync(function () {
                        if (!active()) return;
                        function resume() {
                            if (!active()) return;
                            try {
                                api.play();
                                if (audio) { try { api.setSelectTrack('AUDIO', audio.index); } catch (e) { notice('Проверьте выбранную озвучку после смены качества.'); } }
                                if (state === 'PAUSED') api.pause();
                                session.rate = value;
                            } catch (e) { notice('Не удалось продолжить просмотр. Откройте фильм заново.'); }
                            session.busy = false;
                        }
                        try { api.seekTo(position, resume, function () { notice('Не удалось восстановить позицию просмотра.'); resume(); }); }
                        catch (e) { notice('Не удалось восстановить позицию просмотра.'); resume(); }
                    }, function () { failed(recovery); });
                } catch (e) { failed(recovery); }
            }
            function failed(recovery) {
                if (!active()) return;
                if (!recovery) { notice('Это качество недоступно. Возвращаю прежний режим.'); prepare(oldRate, true); }
                else { session.busy = false; notice('Не удалось восстановить видео. Откройте фильм заново.'); }
            }
            prepare(rate, false);
        }
        if (levels.length) video.quality = [{title:'Автоматически', rate:null}].concat(levels).map(function (level) {
            return {title:level.title, quality:level.rate ? level.title : 'auto', selected:!level.rate,
                instance:{trigger:function () { switchQuality(level.rate); }}};
        });
        var names = metadata && metadata.translate && metadata.translate.tracks;
        if (names && names.length) video.voiceovers = names.map(function (track, index) {
            return {name:track.name, onSelect:function () { selectAudio(index); }};
        });
        // Restore this setting when this playback ends or another source starts.
        Lampa.Storage.set('player', 'tizen');
        video.launch_player = 'inner';
        video.hls_type = 'native';
    }
    function launchTV(title, url, manifest, metadata, back, fallback, nativeFailure) {
        var video = {url:url, title:title, launch_player:'inner'};
        if (metadata && metadata.translate) video.translate = metadata.translate;
        if (!fallback) tvControls(video, manifest, metadata);
        else {
            endTV();
            tvSession = {active:true, previousPlayer:Lampa.Storage.field('player'), playerSetting:'inner'};
            video.kinokradTV = tvSession;
            if (!metadata || metadata.format !== 'dash') video.hls_type = 'hlsjs';
            video.hls_manifest_timeout = 12000;
            video.hls_retry_timeout = 12000;
            Lampa.Storage.set('player', 'inner');
            // Lampa supplies HLS.js quality and audio controls after the manifest loads.
        }
        var session = tvSession, pv = Lampa.PlayerVideo;
        session.fallback = !!fallback;
        session.started = false;
        function active() { return tvSession === session && session.active; }
        function failure(reason) {
            if (!active() || session.failed) return;
            session.failed = true;
            clearTimeout(session.timer);
            var state = '';
            if (!fallback) { try { state = ' / ' + window.webapis.avplay.getState(); } catch (e) {} }
            var code = (fallback ? 'HTML' : 'SAMSUNG') + ': ' + reason + state;
            Lampa.Player.close();
            if (active()) endTV();
            if (!fallback) {
                notice('Samsung не запустил видео. Пробую резервный режим Lampa.');
                launchTV(title, url, manifest, metadata, back, true, code);
            } else {
                fail((nativeFailure ? 'Видео не запустилось в двух режимах. Код: ' + nativeFailure + '; ' : 'Видео не запустилось. Код: ') + code + '. Источник: ' + new URL(url).hostname, back);
            }
        }
        session.arm = function () {
            if (!active() || session.started) return;
            clearTimeout(session.timer);
            session.timer = setTimeout(function () { failure('нет воспроизведения за 25 секунд'); }, 25000);
        };
        session.progress = function (e) {
            if (!active()) return;
            var current = Number(e.current);
            if (isFinite(current) && typeof session.lastTime === 'number' && current > session.lastTime) {
                session.started = true;
                clearTimeout(session.timer);
            }
            session.lastTime = current;
        };
        session.error = function (e) {
            if (!active() || session.started || !e.fatal) return;
            // Defer teardown until the current Lampa event has finished dispatching.
            clearTimeout(session.timer);
            session.timer = setTimeout(function () { failure(String(e.error || 'ошибка плеера').replace(/https?:\/\/\S+/g, '[адрес]')); }, 0);
        };
        if (!fallback && pv && typeof pv.url === 'function') {
            var originalURL = pv.url;
            var directURL = function (src, changeQuality) {
                // Only this session's native stream skips Lampa's redundant HLS.js parser.
                return originalURL.call(this, src, active() && src === url ? true : changeQuality);
            };
            pv.url = directURL;
            session.restoreURL = function () { if (pv.url === directURL) pv.url = originalURL; };
        }
        Lampa.Select.hide();
        try { Lampa.Player.play(video); Lampa.Player.playlist([video]); }
        catch (e) { failure('ошибка запуска'); }
    }
    function isAndroid() { return Lampa.Platform.is('android'); }
    function isTizen() { return Lampa.Platform.is('tizen') || typeof window.tizen !== 'undefined'; }
    function safe(s) { return String(s || '').replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
    function menu(title, items, select, back) {
        Lampa.Select.show({title:safe(title), items:items, onSelect:select, onBack:back || home});
    }
    function fail(message, back) {
        menu('Кінокрад — не удалось открыть', [{title:safe(message)}, {title:'Назад'}], back || home, back || home);
    }
    function request(url, callback, back, body) {
        var generation = ++serial;
        var network, xhr;
        menu('Кінокрад', [{title:'Загрузка…'}, {title:'Отмена'}], cancel, cancel);
        function cancel() { serial++; if (network) network.clear(); if (xhr) xhr.abort(); (back || home)(); }
        function success(data) {
            if (generation !== serial) return;
            try { callback(data); } catch (e) { fail(e.message || 'Формат сайта изменился', back); }
        }
        function error(status) {
            if (generation !== serial) return;
            var host = new URL(url).hostname;
            fail('Не удалось загрузить ' + host + (status ? ' (HTTP ' + status + ')' : '') +
                (isTizen() && !status ? '. Проверьте доступ к сайту в вашей сборке Lampa и соединение ТВ.' : '. Попробуйте позже.'), back);
        }
        if (isAndroid()) {
            network = new Lampa.Reguest();
            network.timeout(20000);
            network.native(url, success, function (e) { error(e && e.status); }, body ? JSON.stringify(body) : false,
                {dataType:'text', headers:body ? {'Content-Type':'application/json'} : {}, contentType:body ? 'application/json' : undefined});
        } else {
            // Packaged Tizen apps use their configured network access policy.
            // Do not rely on AndroidJS, browser fetch, or an unrelated public proxy.
            xhr = new XMLHttpRequest();
            xhr.open(body ? 'POST' : 'GET', url, true);
            xhr.timeout = 20000;
            if (body) xhr.setRequestHeader('Content-Type', 'application/json');
            xhr.onload = function () { if (xhr.status >= 200 && xhr.status < 300) success(xhr.responseText); else error(xhr.status); };
            xhr.onerror = function () { error(0); };
            xhr.ontimeout = function () { error(0); };
            xhr.send(body ? JSON.stringify(body) : null);
        }
    }
    function documentOf(html) { return new DOMParser().parseFromString(html, 'text/html'); }
    function catalogItems(html) {
        var doc = documentOf(html), seen = {}, result = [];
        Array.prototype.forEach.call(doc.querySelectorAll('.kino-card .kino-poster'), function (a) {
            var url = new URL(a.getAttribute('href'), SITE);
            if (url.origin !== SITE || seen[url.href]) return;
            seen[url.href] = true;
            var title = a.getAttribute('title') || a.textContent.trim();
            var container = a.closest('.kino-card'), yearLink = container && container.querySelector('.kino-card-year, .card-title-year, a[href*="/xfsearch/year/"]');
            var yearMatch = yearLink && String(yearLink.getAttribute('title') || yearLink.textContent).match(/\b(?:19|20)\d{2}\b/);
            var year = yearMatch ? yearMatch[0] : '';
            result.push({title:safe(title), subtitle:safe(year), year:year, url:url.href, name:title});
        });
        return result;
    }
    function cardSearch(card) {
        if (!isAndroid() && !isTizen()) return fail('Откройте плагин в приложении Lampa для Android или Samsung Tizen.', close);
        var title = card.title || card.name || '', year = String(card.release_date || card.first_air_date || '').slice(0,4);
        var queries = [], index = 0;
        function close() { serial++; clearTimeout(timer); Lampa.Select.hide(); Lampa.Controller.toggle('full_start'); }
        function add(q) { q = String(q || '').trim(); if (q && queries.indexOf(q) === -1) queries.push(q); }
        function edit() {
            serial++;
            Lampa.Input.edit({title:'Название на украинском', value:queries[0] || title, free:true, nosave:true}, function (q) {
                if (!q || !q.trim()) return close();
                queries = []; index = 0; add(q); search();
            });
        }
        function search() {
            var q = queries[index++];
            if (!q) return menu('Совпадений нет · ' + title, [{title:'Изменить название', edit:true}, {title:'Назад'}], function (a) { if (a.edit) edit(); else close(); }, close);
            request(SITE + '/index.php?do=search&subaction=search&story=' + encodeURIComponent(q), function (html) {
                var found = catalogItems(html);
                if (!found.length) return search();
                if (year) found.sort(function (a,b) { return Number(b.year === year) - Number(a.year === year); });
                var choices = found.concat([{title:'Изменить название', edit:true}]);
                function results() {
                    menu('Выберите совпадение · ' + title + (year ? ' (' + year + ')' : ''), choices, function (a) {
                        if (a.edit) edit(); else film(a, results);
                    }, close);
                }
                results();
            }, close);
        }
        var tmdb = Lampa.Api && Lampa.Api.sources && Lampa.Api.sources.tmdb;
        if (card.source === 'tmdb' && /^\d+$/.test(String(card.id)) && tmdb && typeof tmdb.get === 'function') {
            var generation = ++serial, finished = false, timer;
            function finish(localized) {
                if (finished || generation !== serial) return;
                finished = true; clearTimeout(timer);
                add(localized && (localized.title || localized.name)); add(title); add(card.original_title || card.original_name); search();
            }
            menu('Ищу название · ' + title, [{title:'Отмена'}], close, close);
            timer = setTimeout(function () { finish(); }, 10000);
            try { tmdb.get((card.name || card.first_air_date || card.media_type === 'tv' ? 'tv/' : 'movie/') + card.id, {langs:'uk'}, finish, function () { finish(); }); }
            catch (e) { finish(); }
        } else { add(title); add(card.original_title || card.original_name); search(); }
    }
    function cardButton(e) {
        if (!e || e.type !== 'complite' || !e.data || !e.data.movie) return;
        var root = e.body || (e.object && e.object.activity && e.object.activity.render());
        if (!root || typeof root.find !== 'function' || root.find('.kinokrad-online-button').length) return;
        var buttons = root.find('.full-start-new__buttons, .full-start__buttons').eq(0);
        if (!buttons.length) return;
        var grouped = buttons.find('.buttons--container').eq(0);
        if (grouped.length) buttons = grouped;
        var card = e.data.movie;
        if (!card.source && e.object && e.object.source) { card = Object.assign({}, card, {source:e.object.source}); }
        var button = $('<div class="full-start__button selector kinokrad-online-button"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg><span>Онлайн · Кінокрад</span></div>');
        button.on('hover:enter', function () { cardSearch(card); });
        buttons.append(button);
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
            var sources = [];
            Array.prototype.forEach.call(buttons, function (button) {
                var u = new URL(button.getAttribute('data-url'), SITE);
                if (u.origin === PLAYER && /^\/show\/kinopoisk\/\d+$/.test(u.pathname)) sources.push({title:'Українською · выбор озвучки', subtitle:'Franko / UACDN · украинские озвучки', url:u.href, type:'ua'});
                else if (u.origin === 'https://api.nextembed.ws' && /^\/embed\/movie\/\d+$/.test(u.pathname)) sources.push({title:'Плеєр 2 · другие озвучки и оригинал', subtitle:'NextEmbed · HLS, дополнительный DASH для фильмов', url:u.href, type:'next'});
                else if (u.origin === 'https://ashdi.vip' && /^\/(vod|serial)\/\d+$/.test(u.pathname)) sources.push({title:'Плеєр 3 · дополнительный источник', subtitle:'Ashdi · фильмы, переводы и серии', url:u.href, type:'ashdi'});
            });
            if (!sources.length) return fail('На этой странице нет поддерживаемого плеера.', back);
            function showSources() {
                menu(item.name + ' · источник', sources, function (source) {
                    request(source.url, function (html) {
                        if (source.type === 'ua') translations(item, source.url, payload(html), showSources);
                        else extraSource(item, source, html, showSources);
                    }, showSources);
                }, back);
            }
            showSources();
        }, back);
    }
    function literal(html, pattern) {
        var match = pattern.exec(html);
        if (!match) return null;
        var start = match.index + match[0].length, quote = html.charAt(start), i, c, escaped = false;
        if (quote === "'" || quote === '"') {
            var value = '';
            for (i = start + 1; i < html.length; i++) {
                c = html.charAt(i);
                if (c === quote) return value;
                if (c !== '\\') { value += c; continue; }
                c = html.charAt(++i);
                if (c === 'u' || c === 'x') {
                    var count = c === 'u' ? 4 : 2, hex = html.substr(i + 1, count);
                    if (!new RegExp('^[0-9a-fA-F]{' + count + '}$').test(hex)) throw Error('Неверная строка плейлиста.');
                    value += String.fromCharCode(parseInt(hex, 16)); i += count;
                } else if (c !== '\n' && c !== '\r') value += ({n:'\n', r:'\r', t:'\t', b:'\b', f:'\f'})[c] || c;
            }
        } else if (quote === '[' || quote === '{') {
            var depth = 0, inString = false;
            for (i = start; i < html.length; i++) {
                c = html.charAt(i);
                if (inString) {
                    if (escaped) escaped = false;
                    else if (c === '\\') escaped = true;
                    else if (c === '"') inString = false;
                } else if (c === '"') inString = true;
                else if (c === '[' || c === '{') depth++;
                else if (c === ']' || c === '}') { if (--depth === 0) return JSON.parse(html.slice(start, i + 1)); }
            }
        }
        throw Error('Не удалось прочитать список серий источника.');
    }
    function trackMetadata(audio) {
        return audio && Array.isArray(audio.names) && audio.names.length ?
            {translate:{tracks:audio.names.map(function (name) { return {name:safe(name)}; })}} : {};
    }
    function nextSeasons(item, list, back) {
        var available = list.filter(function (s) { return !s.blocked && Array.isArray(s.episodes) && s.episodes.length; });
        available.sort(function (a,b) { return Number(a.season) - Number(b.season); });
        if (!available.length) return fail('У источника нет доступных сезонов.', back);
        menu(item.name + ' · сезон', available.map(function (s) { return {title:'Сезон ' + s.season, data:s}; }), function (selected) {
            var season = selected.data;
            function showEpisodes() {
                var episodes = season.episodes.filter(function (e) { return !e.blocked && typeof e.hls === 'string' && /^https:\/\//.test(e.hls); });
                if (!episodes.length) return fail('В этом сезоне нет доступных HLS-серий.', function () { nextSeasons(item, list, back); });
                menu(item.name + ' · сезон ' + season.season, episodes.map(function (e) { return {title:'Серия ' + e.episode, data:e}; }), function (entry) {
                    var e = entry.data;
                    quality(item.name + ' · S' + season.season + ' E' + e.episode, e.hls, showEpisodes, trackMetadata(e.audio));
                }, function () { nextSeasons(item, list, back); });
            }
            showEpisodes();
        }, back);
    }
    function folderPlaylist(title, list, back, depth) {
        if (depth > 8) return fail('Слишком много вложенных папок плейлиста.', back);
        var entries = list.filter(function (entry) { return entry && (Array.isArray(entry.folder) || (typeof entry.file === 'string' && /^https:\/\/[^\s]+\.m3u8(?:[?#]|$)/.test(entry.file))); });
        if (!entries.length) return fail('В этой папке нет доступных серий.', back);
        function show() {
            menu(title, entries.map(function (entry, index) { return {title:safe(entry.title || ('Серия ' + (index + 1))), data:entry}; }), function (selected) {
                var entry = selected.data, name = title + ' · ' + String(entry.title || '').trim();
                if (Array.isArray(entry.folder)) folderPlaylist(name, entry.folder, show, depth + 1);
                else quality(name, entry.file, show);
            }, back);
        }
        show();
    }
    function extraSource(item, source, html, back) {
        // Parse only data literals. Never execute scripts from the source page.
        if (source.type === 'next') {
            var seasonsList = literal(html, /\bseasons\s*:\s*(?=\[)/);
            if (Array.isArray(seasonsList)) return nextSeasons(item, seasonsList, back);
        } else {
            var file = literal(html, /\bfile\s*:\s*(?=['"\[])/);
            var folders = typeof file === 'string' && /^\s*\[/.test(file) ? JSON.parse(file) : file;
            if (Array.isArray(folders)) return folderPlaylist(item.name, folders, back, 0);
        }
        var match = source.type === 'next' ? html.match(/\bhls\s*:\s*("(?:[^"\\]|\\.)*")/) : html.match(/\bfile\s*:\s*['"](https:\/\/[^'"\s]+\.m3u8[^'"\s]*)['"]/);
        if (!match) return fail('Этот формат плеера пока не поддерживается. Выберите другой источник.', back);
        var url = source.type === 'next' ? JSON.parse(match[1]) : match[1];
        if (!/^https:\/\//.test(url)) return fail('Источник не вернул видеоссылку.', back);
        var metadata = {};
        if (source.type === 'next') {
            var audio = html.match(/\baudio\s*:\s*(\{[^\r\n]+\})\s*,/);
            var names = audio ? JSON.parse(audio[1]).names : [];
            if (Array.isArray(names) && names.length) metadata.translate = {tracks:names.map(function (name) { return {name:safe(name)}; })};
        }
        var entries = [{title:'Смотреть', subtitle:'Озвучка переключается в меню звуковых дорожек плеера'}];
        if (metadata.translate) entries[0].subtitle += ': ' + metadata.translate.tracks.map(function (t) { return t.name; }).join(', ');
        var dash = source.type === 'next' ? literal(html, /\bdash\s*:\s*(?=")/) : null;
        if (typeof dash === 'string' && /^https:\/\/[^\s]+\.mpd(?:[?#]|$)/.test(dash)) entries.push({title:'Смотреть в DASH · до Full HD', subtitle:'Дополнительные качества источника. Звук зависит от поддержки телевизором.', dash:true});
        function showFormats() {
            menu(item.name + ' · ' + (source.type === 'next' ? 'Плеєр 2' : 'Плеєр 3'), entries, function (entry) {
                if (entry.dash) playDash(item.name, dash, metadata, showFormats);
                else quality(item.name, url, back, metadata);
            }, back);
        }
        showFormats();
    }
    function playDash(title, url, metadata, back) {
        request(url, function (xml) {
            var doc = new DOMParser().parseFromString(String(xml), 'text/xml');
            if (!doc.getElementsByTagName('MPD').length || doc.getElementsByTagName('parsererror').length) return fail('Источник вернул неверный DASH-плейлист.', back);
            var reps = Array.prototype.slice.call(doc.getElementsByTagName('Representation'));
            var audio = [], video = [];
            reps.forEach(function (rep) {
                var parent = rep.parentNode;
                var mime = rep.getAttribute('mimeType') || parent.getAttribute('mimeType') || '';
                var codec = rep.getAttribute('codecs') || parent.getAttribute('codecs') || '';
                var type = mime.split('/')[0] || parent.getAttribute('contentType');
                if (type === 'audio') audio.push(mime + '; codecs="' + codec + '"');
                if (type === 'video') video.push(mime + '; codecs="' + codec + '"');
            });
            if (!audio.length || !video.length) return fail('В DASH-плейлисте нет видео или звуковых дорожек.', back);
            if (isTizen()) {
                if (typeof dashjs === 'undefined') return fail('В этой сборке Lampa нет DASH-плеера. Обновите приложение или выберите «Смотреть».', back);
                var mse = window.MediaSource;
                if (mse && typeof mse.isTypeSupported === 'function') {
                    var supports = function (types) { return types.some(function (type) { return mse.isTypeSupported(type); }); };
                    if (!supports(audio)) return fail('Телевизор не поддерживает звук этого DASH-источника. Вернитесь и выберите «Смотреть» или Плеєр 3.', back);
                    if (!supports(video)) return fail('Телевизор не поддерживает видео этого DASH-источника. Вернитесь и выберите «Смотреть» или Плеєр 3.', back);
                }
                launchTV(title, url, String(xml), {format:'dash', translate:metadata.translate}, back, true);
            } else {
                menu('Где открыть DASH?', [{title:'Внутри Lampa', mode:'inner'}, {title:'В видеоприложении Android', mode:'android'}], function (entry) {
                    Lampa.Select.hide();
                    var data = {url:url, title:title, launch_player:entry.mode};
                    if (metadata.translate) data.translate = metadata.translate;
                    Lampa.Player.play(data); Lampa.Player.playlist([data]);
                }, back);
            }
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
            quality(title, data.file, back);
        }, back, {id:Number(p.id), translation:p.translate || null, season_number:p.season || null, episode_number:p.episode || null,
            force_cdn:p.force_cdn || '', turnstile_token:'', bootstrap_token:p.player_files_token || ''});
    }
    function quality(title, url, back, metadata) {
        request(url, function (text) {
            if (String(text).indexOf('#EXTM3U') !== 0) return fail('Источник вернул неверный видеоплейлист.', back);
            if (isTizen()) {
                // Start directly in the HLS.js mode confirmed working on Samsung NU7400.
                launchTV(title, url, String(text), metadata, back, true);
                return;
            }
            var items = [{title:'Автоматически', url:url}];
            // Keep the master when it carries separate audio/subtitle renditions.
            if (!/#EXT-X-MEDIA:/.test(text)) {
                var lines = String(text).split(/\r?\n/), info = '';
                lines.forEach(function (line) {
                    line = line.trim();
                    if (line.indexOf('#EXT-X-STREAM-INF:') === 0) info = line;
                    else if (line && line.charAt(0) !== '#' && info) {
                        var resolved = new URL(line, url), size = info.match(/RESOLUTION=(\d+)x(\d+)/);
                        if (resolved.protocol === 'https:' && size) {
                            var width = Number(size[1]);
                            var label = width === 1920 ? '1080p' : width === 1280 ? '720p' : width === 854 ? '480p' : size[1] + '×' + size[2];
                            items.push({title:label, url:resolved.href});
                        }
                        info = '';
                    }
                });
            }
            menu('Качество видео', items, function (item) {
                function launch(mode) {
                    var video = {url:item.url, title:title};
                    if (metadata && metadata.translate) video.translate = metadata.translate;
                    if (mode) video.launch_player = mode;
                    Lampa.Select.hide();
                    Lampa.Player.play(video);
                    Lampa.Player.playlist([video]);
                }
                if (isAndroid()) menu('Где открыть видео?', [
                    {title:'В видеоприложении Android', subtitle:'Выберите установленный VLC, MX Player или другой плеер', mode:'android'},
                    {title:'Внутри Lampa', subtitle:'Некоторые источники блокируют этот способ', mode:'inner'}
                ], function (choice) { launch(choice.mode); }, function () { quality(title, url, back, metadata); });
                else launch();
            }, back);
        }, back);
    }
    function home() {
        serial++;
        if (!isAndroid() && !isTizen()) return fail('Откройте плагин в приложении Lampa для Android или Samsung Tizen.', function () { Lampa.Select.hide(); Lampa.Controller.toggle('menu'); });
        menu('Кінокрад 0.5.1 · ' + (isAndroid() ? 'Android' : 'Tizen'), [{title:'Поиск', action:'search'}, {title:'Все новинки', path:'/'}, {title:'Фильмы', path:'/films/'}, {title:'Сериалы', path:'/serials/'}], function (item) {
            if (item.action === 'search') Lampa.Input.edit({title:'Название на украинском', value:'', free:true, nosave:true}, function (q) { if (q && q.trim()) catalog('/', 1, q.trim()); else home(); });
            else catalog(item.path, 1);
        }, function () { serial++; Lampa.Select.hide(); Lampa.Controller.toggle('menu'); });
    }
    function start() {
        if (window.kinokradPersonal) return;
        window.kinokradPersonal = {version:'0.5.1', open:home};
        if (Lampa.Listener) Lampa.Listener.follow('full', cardButton);
        if (Lampa.Player.listener) {
            Lampa.Player.listener.follow('destroy', endTV);
            Lampa.Player.listener.follow('create', function (e) { if (tvSession && (!e.data || e.data.kinokradTV !== tvSession)) endTV(); });
            Lampa.Player.listener.follow('ready', function (e) { if (tvSession && e && e.kinokradTV === tvSession && tvSession.arm) tvSession.arm(); });
        }
        if (Lampa.PlayerVideo && Lampa.PlayerVideo.listener) {
            Lampa.PlayerVideo.listener.follow('timeupdate', function (e) { if (tvSession && tvSession.progress) tvSession.progress(e); });
            Lampa.PlayerVideo.listener.follow('error', function (e) { if (tvSession && tvSession.error) tvSession.error(e); });
        }
    }
    if (window.appready) start();
    else Lampa.Listener.follow('app', function (e) { if (e.type === 'ready') start(); });
})();


