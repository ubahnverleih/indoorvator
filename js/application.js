var t;
(function (t) {
    var mapForm = (function () {
        function mapForm() {
            var _this = this;
            this.initMap();
            $('#simulatebutton').on('click', function () { return _this.simulateBrokenLift(); });
            $("#wheelchairtoggle").on('click', function () { return _this.toggleWheelChair(); });
        }
        mapForm.prototype.initMap = function () {
            var _this = this;
            this._level = 0;
            this.__map = new L.Map('map', {});
            this.__map.setView([51.04022, 13.73245], 19);
            this._isWheelchairstyleActive = false;
            L.tileLayer('https://api.tiles.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidWJhaG52ZXJsZWloIiwiYSI6IjZyVGcyZzAifQ.EP3L8P8zlHIRF7-pB7zfDA', {
                attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
                maxZoom: 22
            }).addTo(this.__map);
            this._lastZoomLevel = this.__map.getZoom();
            this.loadStyle()
                .then(function () { return _this.loadWheelchairStyle(); })
                .then(function () { return _this.load(); })
                .then(function () { return _this.loadDbElevators(); });
            this.__map.on('zoomend', function () {
                if (_this._lastZoomLevel && ((_this._lastZoomLevel >= 17) && (_this.__map.getZoom() > _this._lastZoomLevel))) {
                    _this.load(true);
                }
                else {
                    _this.load();
                }
                _this._lastZoomLevel = _this.__map.getZoom();
            });
            this.__map.on('moveend', function (e) {
                console.log(e.hard);
                if (e.hard === false) {
                }
                else {
                    console.log('load');
                    _this.load();
                }
            });
        };
        mapForm.prototype.load = function (resueData) {
            var _this = this;
            resueData = resueData ? resueData : false;
            if ((resueData && this._jsonData) || (this.__map.getZoom() < 17)) {
                this.render(this._jsonData);
                var deferred = $.Deferred();
                deferred.resolve(this._jsonData);
                return deferred.promise();
            }
            else {
                this._levelList = [];
                var xhr = this.loadFromOverpass();
                xhr.done(function (json) {
                    _this._jsonData = json;
                    _this.render(json);
                });
                return xhr;
            }
        };
        mapForm.prototype.render = function (json) {
            var _this = this;
            var geojson = osmtogeojson(json, {
                flatProperties: true,
                polygonFeatures: function () { return true; }
            });
            this.__map.eachLayer(function (layer) {
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
            }).addTo(this.__map);
            this.initLevelButtons();
            this.showElevators();
        };
        mapForm.prototype.loadStyle = function () {
            var _this = this;
            return $.getJSON('./mapstyle/style.json', function (json) {
                _this._style = json;
            });
        };
        mapForm.prototype.loadWheelchairStyle = function () {
            var _this = this;
            return $.getJSON('./mapstyle/wheelchairstyle.json', function (json) {
                _this._wheelchairStyle = json;
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
            var style = this._isWheelchairstyleActive ? this._wheelchairStyle : this._style;
            var s = t.styleParser.getSimpleStyleForFeature(feature, style);
            var marker = t.styleParser.getLabelMarker(feature, style, this.__map.getZoom());
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
                var button = $('<div class="levelbutton' + additionalClass + '">' + level + '</div>');
                levelContainer.append(button);
                button.on('click', function () { return _this.switchLevel(level); });
            });
        };
        mapForm.prototype.switchLevel = function (level) {
            this._level = level;
            return this.load(true);
        };
        mapForm.prototype.addToLevelList = function (levels) {
            var _this = this;
            levels.forEach(function (level) {
                if (!isNaN(level)) {
                    if ($.inArray(level, _this._levelList) == -1) {
                        _this._levelList.push(level);
                    }
                }
            });
            this._levelList.sort(function (a, b) { return a - b; });
            this._levelList = this._levelList.reverse();
        };
        mapForm.prototype.simulateBrokenLift = function () {
            var _this = this;
            this.switchLevel(1).then(function () {
                _this.__map.setView([51.04034, 13.73327], 19);
                setTimeout(function () {
                    $.getJSON("./data/unavailable_plattform.geojson", function (geojson) {
                        var layer = L.geoJson(geojson, {
                            style: function () {
                                return {
                                    "fill": true,
                                    "fillColor": "#FF0000",
                                    "fillOpacity": 0.6,
                                    "stroke": false
                                };
                            }
                        });
                        layer.addTo(_this.__map);
                    });
                    var marker = new L.Marker([51.0403711, 13.733309], {
                        icon: new L.Icon({
                            iconUrl: "./img/mapicons/elevator_red_filled.png",
                            iconAnchor: new L.Point(12, 14)
                        })
                    });
                    marker.addTo(_this.__map);
                }, 1500);
            });
        };
        mapForm.prototype.loadDbElevators = function () {
            var _this = this;
            this._elevatorMarkers = [];
            $.getJSON("http://adam.noncd.db.de/api/v1.0/facilities", function (json) {
                if (json) {
                    json.forEach(function (elevator) {
                        var icon = new L.Icon({
                            iconUrl: "./img/mapicons/" + ((elevator.state == "INACTIVE") ? "elevator_red_filled.png" : "elevator_green_filled.png"),
                            iconAnchor: new L.Point(12, 14)
                        });
                        if (elevator.geocoordY && elevator.geocoordX) {
                            var marker = new L.Marker([elevator.geocoordY, elevator.geocoordX], {
                                icon: icon
                            });
                            _this._elevatorMarkers.push(marker);
                        }
                    });
                }
            });
            this.showElevators();
        };
        mapForm.prototype.showElevators = function () {
            var _this = this;
            if (this._elevatorMarkers) {
                this._elevatorMarkers.forEach(function (marker) {
                    marker.addTo(_this.__map);
                });
            }
        };
        mapForm.prototype.loadFromOverpass = function () {
            var _this = this;
            this.loadindicator(1);
            var bounds = this.__map.getBounds();
            var bboxxtring = (bounds.getSouth() - 0.0005) + ","
                + (bounds.getWest() - 0.0005) + ","
                + (bounds.getNorth() + 0.0005) + ","
                + (bounds.getEast() + 0.0005);
            var overpassQuery = "\n\t\t\t\t[out:json][timeout:25];\n\t\t\t\t(\n\t\t\t\t// query part for: \u201Cindoor=*\u201D\n\t\t\t\tnode[\"indoor\"]({{bbox}});\n\t\t\t\tway[\"indoor\"]({{bbox}});\n\t\t\t\trelation[\"indoor\"]({{bbox}});\n\t\t\t\tway[\"railway\" = \"platform\"]({{bbox}});\n\t\t\t\tway[\"public_transport\" = \"platform\"]({{bbox}});\n\t\t\t\trelation[\"public_transport\" = \"platform\"]({{bbox}});\n\t\t\t\tway[\"highway\" = \"platform\"]({{bbox}});\n\t\t\t\trelation[\"railway\" = \"platform\"]({{bbox}});\n\t\t\t\tnode[\"room\"]({{bbox}});\n\t\t\t\tway[\"room\"]({{bbox}});\n\t\t\t\trelation[\"room\"]({{bbox}});\n\t\t\t\tnode[\"highway\" = \"elevator\"]({{bbox}});\n\t\t\t\tnode[\"level\"]({{bbox}});\n\t\t\t\tway[\"highway\"~\"footway|elevator|steps|path\"]({{bbox}});\n\t\t\t\t);\n\t\t\t\t// print results\n\t\t\t\tout body;\n\t\t\t\t>;\n\t\t\t\tout skel qt;";
            overpassQuery = overpassQuery.replace(/{{bbox}}/g, bboxxtring);
            var apiUrl = "http://overpass.osm.rambler.ru/cgi/interpreter?data=";
            var url = apiUrl + encodeURI(overpassQuery);
            var request = $.getJSON(url, function (result) {
            });
            request.always(function () {
                _this.loadindicator(-1);
            });
            return request;
        };
        mapForm.prototype.activateWheelchairStyle = function () {
            this._isWheelchairstyleActive = true;
            this.load(true);
        };
        mapForm.prototype.deactivateWheelchairStyle = function () {
            this._isWheelchairstyleActive = false;
            this.load(true);
        };
        mapForm.prototype.toggleWheelChair = function () {
            var button = $("#wheelchairtoggle");
            if (this._isWheelchairstyleActive) {
                this.deactivateWheelchairStyle();
                button.removeClass('pressed');
            }
            else {
                this.activateWheelchairStyle();
                button.addClass('pressed');
            }
        };
        mapForm.prototype.loadindicator = function (n) {
            if (!this._activeLoads) {
                this._activeLoads = 0;
            }
            this._activeLoads = this._activeLoads + n;
            if (this._activeLoads < 0) {
                this._activeLoads = 0;
            }
            if (this._activeLoads == 0) {
                $("#loading").hide();
            }
            if (this._activeLoads > 0) {
                $("#loading").show();
            }
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
                    iconAnchor: [50, 25]
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