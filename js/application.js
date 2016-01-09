var t;
(function (t) {
    var mapForm = (function () {
        function mapForm() {
            this.initMap();
        }
        mapForm.prototype.initMap = function () {
            var _this = this;
            this._level = 0;
            this.__map = new L.Map('map', {});
            this.__map.setView([51.04022, 13.73245], 18);
            L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(this.__map);
            this.loadStyle().then(function () { return _this.load(); });
        };
        mapForm.prototype.load = function () {
            var _this = this;
            $.getJSON('./data/dresden_hbf.json', function (json) {
                console.log("--", json);
                var geojson = osmtogeojson(json, {
                    flatProperties: true,
                    polygonFeatures: function () { return true; }
                });
                L.geoJson(geojson, {
                    filter: function (feature) { return _this._layerFilter(feature); },
                    style: function (feature) { return _this._styleGeoJson(feature); }
                }).addTo(_this.__map);
            });
        };
        mapForm.prototype.loadStyle = function () {
            var _this = this;
            return $.getJSON('./mapstyle/style.json', function (json) {
                _this._style = json;
            });
        };
        mapForm.prototype._layerFilter = function (feature) {
            var properties = feature.properties;
            if (properties.level) {
                var level = properties.level;
                if (level == this._level) {
                    return true;
                }
                else {
                    return false;
                }
            }
            return false;
        };
        mapForm.prototype._styleGeoJson = function (feature) {
            var s = t.styleParser.getSimpleStyleForFeature(feature, this._style);
            t.styleParser.createLabelMarker(feature, this.__map);
            return s;
        };
        return mapForm;
    })();
    t.mapForm = mapForm;
})(t || (t = {}));
$(function () {
    new t.mapForm();
});
var t;
(function (t) {
    var styleParser = (function () {
        function styleParser() {
        }
        styleParser.getSimpleStyleForFeature = function (feature, styleJson) {
            var properties = feature.properties;
            var style = {};
            if (properties) {
                styleJson.forEach(function (selection) {
                    var key = selection["key"];
                    if (properties[key]) {
                        $.extend(style, selection["style"]);
                    }
                    if (selection["valueStyles"]) {
                        selection["valueStyles"].forEach(function (valueStyle) {
                            if (properties[key] == valueStyle.value) {
                                $.extend(style, valueStyle["style"]);
                            }
                        });
                    }
                });
            }
            return style;
        };
        styleParser.createLabelMarker = function (feature, map) {
            if (feature.geometry.type === "Polygon") {
                console.log("GEOM", feature.geometry);
                var coordinates = [];
                feature.geometry.coordinates[0].forEach(function (c) {
                    coordinates.push({ lat: c[1], lng: c[0] });
                });
                console.log(coordinates);
                var polygon = new L.Polygon(coordinates);
                var point = polygon.getBounds().getCenter();
                var marker = new L.Marker(point);
                marker.addTo(map);
                console.log("MARKER", marker);
            }
        };
        return styleParser;
    })();
    t.styleParser = styleParser;
})(t || (t = {}));
//# sourceMappingURL=application.js.map