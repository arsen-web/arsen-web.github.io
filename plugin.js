(function(plugin){
    plugin.id = "torrent-component";
    plugin.version = "1.0";
    plugin.type = "component";

    const STORAGE_KEY = "torrent_plugin_source";
    const SOURCES = {
        torlook: "TorLook",
        rutor: "Rutor (в разработке)",
        rutracker: "RuTracker (в разработке)"
    };

    function getSource(){
        return Lampa.Storage.get(STORAGE_KEY, 'torlook');
    }

    function setSource(val){
        Lampa.Storage.set(STORAGE_KEY, val);
    }

    // Поиск через TorLook
    function searchTorlook(query, callback){
        const url = `https://api.torlook.info/search/json?q=${encodeURIComponent(query)}`;

        fetch(url)
            .then(resp => resp.json())
            .then(data => {
                const results = data.map(item => ({
                    title: item.title,
                    magnet: item.link,
                    size: item.size,
                    seeds: item.seeders
                }));
                callback(results);
            })
            .catch(e => {
                console.error('TorLook error:', e);
                callback([]);
            });
    }

    // Интерфейс компонента
    function renderComponent(){
        const scroll = new Lampa.Scroll({ over: true });
        const html = $('<div class="torrent-component layer--wheight"></div>');
        const list = $('<div class="torrent-results"></div>');
        const input = $('<input type="text" placeholder="Введите название..." class="torrent-input">');

        html.append(`<div class="settings-param selector focus" data-name="source"><div class="settings-param__name">Источник</div><div class="settings-param__value">${SOURCES[getSource()]}</div></div>`);
        html.append(input);
        html.append(list);

        scroll.render().append(list);
        html.append(scroll.render());

        let lastInput = '';
        let timer;

        input.on('input', () => {
            const val = input.val().trim();
            if (val !== lastInput) {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    lastInput = val;
                    searchTorlook(val, results => {
                        list.empty();
                        if (results.length === 0) {
                            list.append('<div class="empty">Ничего не найдено</div>');
                        } else {
                            results.forEach(item => {
                                const btn = $(`<div class="torrent-item selector">
                                    <div class="name">${item.title}</div>
                                    <div class="info">${item.size} | сидов: ${item.seeds}</div>
                                </div>`);
                                btn.on('hover:enter', () => {
                                    Lampa.Player.play({
                                        url: item.magnet,
                                        title: item.title,
                                        method: 'torrent'
                                    });
                                });
                                list.append(btn);
                            });
                        }
                        scroll.update();
                    });
                }, 500);
            }
        });

        html.find('[data-name="source"]').on('hover:enter', () => {
            const keys = Object.keys(SOURCES);
            const current = getSource();
            const index = keys.indexOf(current);
            const next = keys[(index + 1) % keys.length];
            setSource(next);
            html.find('[data-name="source"] .settings-param__value').text(SOURCES[next]);
        });

        Lampa.Controller.add('torrent_component', {
            toggle: function(){
                Lampa.Controller.collectionSet(this.render(), this);
                Lampa.Controller.collectionFocus(false, this.render());
            },
            render: () => html,
            destroy: () => scroll.destroy()
        });

        Lampa.Activity.push({
            url: '',
            title: 'Поиск торрентов',
            component: 'torrent_component',
            page: 1,
            source: '',
            search: '',
            background: '',
            ready: true
        });

        Lampa.Controller.toggle('torrent_component');
    }

    plugin.component = function(){
        return {
            name: 'Поиск торрентов',
            icon: 'magnet',
            onClick: renderComponent
        };
    };

    plugin.init = function(){
        console.log("Torrent component plugin initialized");
    };
})(Lampa.Plugin.create('torrent-component'));
