gc2map.createSearch = function (me, komKode) {
    var type1, type2, gids = [], searchString;
    var placeStore = new geocloud.geoJsonStore({
        host: "//eu1.mapcentia.com",
        db: "dk",
        sql: null,
        pointToLayer: null,
        onLoad: function () {
            var resultLayer = new L.FeatureGroup();
            me.map.addLayer(resultLayer);
            resultLayer.addLayer(this.layer);
            me.zoomToExtentOfgeoJsonStore(this);
            if (me.map.getZoom() > 18) {
                me.map.setZoom(18);
            }
        }
    });
    $("#custom-search-form").show();
    $('#custom-search').typeahead({
        highlight: false
    }, {
        name: 'adresse',
        displayKey: 'value',
        templates: {
            header: '<h2 class="typeahead-heading">Adresser</h2>'
        },
        source: function (query, cb) {
            if (query.match(/\d+/g) === null && query.match(/\s+/g) === null) {
                type1 = "vejnavn,bynavn";
            }
            if (query.match(/\d+/g) === null && query.match(/\s+/g) !== null) {
                type1 = "vejnavn_bynavn";
            }
            if (query.match(/\d+/g) !== null) {
                type1 = "adresse";
            }
            var names = [];

            (function ca() {
                $.ajax({
                    url: '//eu1.mapcentia.com/api/v1/elasticsearch/search/dk/aws4/' + type1,
                    data: '&q={"query":{"filtered":{"query":{"query_string":{"default_field":"string","query":"' + encodeURIComponent(query.toLowerCase().replace(",", "")) + '","default_operator":"AND"}},"filter":{"term":{"kommunekode":"0' + komKode + '"}}}}}',
                    contentType: "application/json; charset=utf-8",
                    scriptCharset: "utf-8",
                    dataType: 'jsonp',
                    jsonp: 'jsonp_callback',
                    success: function (response) {
                        $.each(response.hits.hits, function (i, hit) {
                            var str = hit._source.properties.string;
                            gids[str] = hit._source.properties.gid;
                            names.push({value: str});
                        });
                        if (names.length === 1 && (type1 === "vejnavn,bynavn" || type1 === "vejnavn_bynavn")) {
                            type1 = "adresse";
                            names = [];
                            gids = [];
                            ca();
                        } else {
                            cb(names);
                        }
                    }
                })
            })();
        }
    }, {
        name: 'matrikel',
        displayKey: 'value',
        templates: {
            header: '<h2 class="typeahead-heading">Matrikel</h2>'
        },
        source: function (query, cb) {
            var names = [];
            type2 = (query.match(/\d+/g) != null) ? "jordstykke" : "ejerlav";
            (function ca() {
                $.ajax({
                    url: '//eu1.mapcentia.com/api/v1/elasticsearch/search/dk/matrikel/' + type2,
                    data: '&q={"sort":[{"sort_string":"asc"}],"query":{"filtered":{"query":{"query_string":{"default_field":"string","query":"' + encodeURIComponent(query.toLowerCase()) + '","default_operator":"AND"}},"filter":{"term":{"komkode":"' + komKode + '"}}}}}',
                    contentType: "application/json; charset=utf-8",
                    scriptCharset: "utf-8",
                    dataType: 'jsonp',
                    jsonp: 'jsonp_callback',
                    success: function (response) {
                        $.each(response.hits.hits, function (i, hit) {
                            var str = hit._source.properties.string;
                            gids[str] = hit._source.properties.gid;
                            names.push({value: str});
                        });
                        if (names.length === 1 && (type2 === "ejerlav")) {
                            type2 = "jordstykke";
                            names = [];
                            gids = [];
                            ca();
                        } else {
                            cb(names);
                        }
                    }
                });
            }());
        }
    });
    $('#custom-search').bind('typeahead:selected', function (obj, datum, name) {
        if ((type1 === "adresse" && name === "adresse") || (type2 === "jordstykke" && name === "matrikel")) {
            placeStore.reset();

            if (name === "matrikel") {
                placeStore.sql = "SELECT gid,the_geom,ST_asgeojson(ST_transform(the_geom,4326)) as geojson FROM matrikel.jordstykke WHERE gid=" + gids[datum.value];
            }
            if (name === "adresse") {
                placeStore.sql = "SELECT gid,the_geom,ST_asgeojson(ST_transform(the_geom,4326)) as geojson FROM adresse.adgang4 WHERE gid=" + gids[datum.value];
            }
            searchString = datum.value;
            placeStore.load();
        } else {
            setTimeout(function () {
                $(".typeahead").val(datum.value + " ").trigger("paste").trigger("input");
            }, 100);
        }
    });
};
