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
            L.tileLayer('https://api.tiles.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidWJhaG52ZXJsZWloIiwiYSI6IjZyVGcyZzAifQ.EP3L8P8zlHIRF7-pB7zfDA', {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
                maxZoom: 22
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
                    style: function (feature) { return _this._styleGeoJson(feature); },
                    pointToLayer: function (feature, latlng) {
                        return _this.createsStyledMarker(feature, latlng);
                    }
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
                var parsedLevels = this.parseLevel(level);
                if ($.inArray(this._level, parsedLevels) !== -1) {
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
            var marker = t.styleParser.getLabelMarker(feature, this._style, this.__map.getZoom());
            if (marker) {
                marker.addTo(this.__map);
            }
            return s;
        };
        mapForm.prototype.parseLevel = function (levelString) {
            if (levelString) {
                var levels = levelString.split(";");
                levels.forEach(function (level, index) {
                    levels[index] = parseInt(level, 10);
                });
                console.log(levels);
                return levels;
            }
        };
        mapForm.prototype.createsStyledMarker = function (feature, latlng) {
            return new L.Marker(latlng);
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
        styleParser.getLabelMarker = function (feature, styleJson, zoom) {
            if (feature.geometry.type === "Polygon") {
                var featureStyle = this.getSimpleStyleForFeature(feature, styleJson);
                if (featureStyle.showText) {
                    var coordinates = [];
                    feature.geometry.coordinates[0].forEach(function (c) {
                        coordinates.push({ lat: c[1], lng: c[0] });
                    });
                    var polygon = new L.Polygon(coordinates);
                    var point = polygon.getBounds().getCenter();
                    var label = "";
                    label = feature.properties.name ? '<div class="label-text">' + feature.properties.name + '</div>' : "";
                    var icon = new L.DivIcon({
                        html: (featureStyle.iconUrl ? '<img class="label-icon" src="' + featureStyle.iconUrl + '" />' : "")
                            + label,
                        className: "label-class " + (featureStyle.markerClassName ? featureStyle.markerClassName : ""),
                        iconAnchor: [50, 50]
                    });
                    var marker = new L.Marker(point, { icon: icon });
                    return marker;
                }
            }
        };
        return styleParser;
    })();
    t.styleParser = styleParser;
})(t || (t = {}));
//# sourceMappingURL=application.js.map