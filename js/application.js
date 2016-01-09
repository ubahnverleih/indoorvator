var t;
(function (t) {
    var mapForm = (function () {
        function mapForm() {
            this.initMap();
        }
        mapForm.prototype.initMap = function () {
            this._level = 0;
            this.__map = new L.Map('map', {});
            this.__map.setView([51.04022, 13.73245], 18);
            L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
                maxZoom: 19
            }).addTo(this.__map);
            this.load();
        };
        mapForm.prototype.load = function () {
            var _this = this;
            $.getJSON('./data/dresden_hbf.geojson', function (geojson) {
                console.log(geojson);
                L.geoJson(geojson, {
                    filter: function (feature) { return _this._layerFilter(feature); },
                    style: function (feature) { return _this._styleGeoJson(feature); }
                }).addTo(_this.__map);
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
            var properties = feature.properties;
            if (properties && properties["indoor"] && properties["indoor"] === "corridor") {
                return {
                    color: "#000",
                    weight: 1,
                    opacity: 1,
                    fillOpacity: 0.8,
                    fillColor: "#FFFFFF"
                };
            }
            return {
                "color": "#ff7800"
            };
        };
        return mapForm;
    })();
    t.mapForm = mapForm;
})(t || (t = {}));
$(function () {
    new t.mapForm();
});
//# sourceMappingURL=application.js.map