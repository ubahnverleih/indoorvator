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
            this.__map.on('zoomend', function () {
                _this.load();
            });
        };
        mapForm.prototype.load = function () {
            var _this = this;
            this._levelList = [];
            var xhr = $.getJSON('./data/dresden_hbf.json', function (json) {
                var geojson = osmtogeojson(json, {
                    flatProperties: true,
                    polygonFeatures: function () { return true; }
                });
                _this.__map.eachLayer(function (layer) {
                    if (!(layer instanceof L.TileLayer)) {
                        _this.__map.removeLayer(layer);
                    }
                });
                L.geoJson(geojson, {
                    filter: function (feature) { return _this._layerFilter(feature); },
                    style: function (feature) { return _this._styleGeoJson(feature); },
                    pointToLayer: function (feature, latlng) {
                        return _this.createsStyledMarker(feature, latlng);
                    }
                }).addTo(_this.__map);
                _this.initLevelButtons();
            });
            return xhr;
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
                this.addToLevelList(parsedLevels);
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
                return levels;
            }
        };
        mapForm.prototype.createsStyledMarker = function (feature, latlng) {
            var icon = t.styleParser.getIconForProperties(feature, this._style, this.__map.getZoom());
            if (icon) {
                return new L.Marker(latlng, { icon: icon });
            }
            return new L.Marker(latlng);
        };
        mapForm.prototype.initLevelButtons = function () {
            var _this = this;
            console.log("init this");
            var levelContainer = $('#level');
            levelContainer.html("");
            this._levelList.forEach(function (level) {
                var additionalClass = "";
                if (_this._level === level) {
                    additionalClass = " levelbutton-active";
                }
                var button = $('<div class="levelbutton ' + additionalClass + '">' + level + '</div>');
                levelContainer.append(button);
                button.on('click', function () { return _this.switchLevel(level); });
            });
        };
        mapForm.prototype.switchLevel = function (level) {
            this._level = level;
            this.load();
        };
        mapForm.prototype.addToLevelList = function (levels) {
            var _this = this;
            levels.forEach(function (level) {
                if ($.inArray(level, _this._levelList) == -1) {
                    _this._levelList.push(level);
                }
            });
            this._levelList.sort();
            this._levelList = this._levelList.reverse();
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
                    var icon = this.getIconForProperties(feature, styleJson, zoom);
                    var marker = new L.Marker(point, { icon: icon });
                    return marker;
                }
            }
        };
        styleParser.getIconForProperties = function (feature, styleJson, zoom) {
            var featureStyle = this.getSimpleStyleForFeature(feature, styleJson);
            var label = "";
            if ((!featureStyle.iconMinZoom) || (zoom >= featureStyle.iconMinZoom)) {
                if ((!featureStyle.labelMinZoom) || (zoom >= featureStyle.labelMinZoom)) {
                    label = feature.properties.name ? '<div class="label-text">' + feature.properties.name + '</div>' : "";
                }
                var icon = new L.DivIcon({
                    html: (featureStyle.iconUrl ? '<img class="label-icon" src="' + featureStyle.iconUrl + '" />' : "")
                        + label,
                    className: "label-class " + (featureStyle.markerClassName ? featureStyle.markerClassName : ""),
                    iconAnchor: [50, 50]
                });
                return icon;
            }
            else {
                var icon = new L.DivIcon({
                    html: "",
                    className: "label-empty"
                });
                return icon;
            }
        };
        return styleParser;
    })();
    t.styleParser = styleParser;
})(t || (t = {}));
//# sourceMappingURL=application.js.map