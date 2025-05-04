(function(plugin){
    plugin.id = "torrent-source";
    plugin.version = "1.0";
    plugin.type = "video";

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

    plugin.search = function(object, callback){
        const query = object.search || object.title;
        const source = getSource();

        if(source === 'torlook') {
            searchTorlook(query, callback);
        }
        else {
            Lampa.Noty.show(`Источник "${SOURCES[source]}" пока не реализован`);
            callback([]);
        }
    };

    function searchTorlook(query, callback){
        const url = `https://api.torlook.info/search/json?q=${encodeURIComponent(query)}`;

        fetch(url)
            .then(resp => resp.json())
            .then(data => {
                const results = data.map(item => ({
                    file: item.link, // magnet-ссылка
                    title: item.title,
                    quality: 'torrent',
                    info: [item.size, `Сидов: ${item.seeders}`]
                }));

                callback(results);
            })
            .catch(e => {
                console.error('TorLook error:', e);
                callback([]);
            });
    }

    plugin.init = function(){
        console.log("Torrent plugin initialized");

        const current = getSource();

        // Добавляем раздел в "Настройки → Прочее"
        Lampa.Settings.add({
            title: 'Поиск торрентов',
            onRender: function(item){
                const select = $('<select></select>').addClass('settings--select');

                Object.keys(SOURCES).forEach(key => {
                    const option = $('<option></option>')
                        .text(SOURCES[key])
                        .val(key)
                        .prop('selected', key === current);
                    select.append(option);
                });

                select.on('change', function(){
                    const val = $(this).val();
                    setSource(val);
                    Lampa.Noty.show(`Источник: ${SOURCES[val]}`);
                });

                item.append(select);
            }
        });
    };
})(Lampa.Plugin.create('torrent-source'));
