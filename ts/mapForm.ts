/// <reference path="./dts/jquery.d.ts"/>
/// <reference path="./dts/leaflet.d.ts"/>
/// <reference path="./dts/osmtogeojson.d.ts"/>
module t {
	export class mapForm {

		constructor()
		{
			this.initMap();

			$('#simulatebutton').on('click', () => this.simulateBrokenLift());
			
		}

		initMap(): void
		{
			this._level = 0;
			this.__map = new L.Map('map', {});
			this.__map.setView([51.04022, 13.73245], 19);
			/*L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
				maxZoom: 22
			}).addTo(this.__map);*/

			L.tileLayer('https://api.tiles.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidWJhaG52ZXJsZWloIiwiYSI6IjZyVGcyZzAifQ.EP3L8P8zlHIRF7-pB7zfDA', {
				attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
				maxZoom: 22
			}).addTo(this.__map);

			this.loadStyle().then(() => this.load()).then(() => this.loadDbElevators()); //First load Style, then load the mapdata

			this.__map.on('zoomend', () => {
				this.load();
			});
			
		}

		load(): JQueryXHR
		{
			this._levelList = [];
			let xhr = $.getJSON('./data/dresden_hbf.json', (json) => {
				let geojson = osmtogeojson(json, {
					flatProperties: true,
					polygonFeatures: () => true //all closed lines are polygons
				});

				this.__map.eachLayer((layer: any) => {
					if (!(layer instanceof L.TileLayer)) {
						this.__map.removeLayer(layer);
					}
				});

				L.geoJson(geojson, {
					//smoothFactor: 0, //don't Simplify Lines
					filter: (feature) => this._layerFilter(feature), //`() =>` to keep scope
					style: (feature) => this._styleGeoJson(feature), //`() =>` to keep scope
					pointToLayer: (feature: any, latlng: L.LatLng) => {
						return this.createsStyledMarker(feature, latlng);
					}
				}).addTo(this.__map);
				this.initLevelButtons();
				this.showElevators();
			});
			return xhr;
		}

		loadStyle(): JQueryXHR
		{
			return $.getJSON('./mapstyle/style.json', (json) => {
				this._style = json;
			});
		}
		/**
		 * Filtert alle Features raus, die nicht zum aktuellen Level gehören.
		 */
		_layerFilter(feature: any): boolean
		{
			let properties = feature.properties;
			if (properties.level)
			{
				let level = properties.level;
				let parsedLevels = this.parseLevel(level)
				
				//add parsedLevels to Levellist
				this.addToLevelList(parsedLevels);

				if ($.inArray(this._level, parsedLevels) !== -1)
				{
					return true;
				}
				else
				{
					return false;
				}
			}
			return false;
		}

		_styleGeoJson(feature: any): any
		{
			let s = styleParser.getSimpleStyleForFeature(feature, this._style);
			
			let marker = styleParser.getLabelMarker(feature, this._style, this.__map.getZoom());
			if (marker) {
				marker.addTo(this.__map);
			}
			/*if (s) 
				console.log(s);*/
			return s;
		}
		/**
		 * parsing Levels
		 */
		parseLevel(levelString: string): any[]
		{
			//TODO: parse things like "0-10", "-5--2", "0;2-4"
			if (levelString)
			{
				let levels = levelString.split(";");
				levels.forEach((level, index) => {
					levels[index] = <any>parseInt(level, 10);
				});
				return levels;
			}
		}

		createsStyledMarker(feature: any, latlng: L.LatLng): any
		{
			let icon = styleParser.getIconForProperties(feature, this._style, this.__map.getZoom());
			if (icon)
			{
				return new L.Marker(latlng, { icon: icon });
			}
			return new L.Marker(latlng);
		}

		initLevelButtons(): void
		{
			console.log("init this");
			let levelContainer = $('#level');
			levelContainer.html("");
			this._levelList.forEach((level) => {
				let additionalClass = "";
				if (this._level === level)
				{
					additionalClass = " levelbutton-active";
				}
				let button = $('<div class="levelbutton'+additionalClass+'">'+level+'</div>');
				
				levelContainer.append(button);
				button.on('click', () => this.switchLevel(level));
			});
		}

		switchLevel(level: number): JQueryXHR
		{
			this._level = level;
			return this.load();
		}

		addToLevelList(levels: number[])
		{
			levels.forEach((level) => {
				if ($.inArray(level, this._levelList) == -1) {
					this._levelList.push(level);
				}
			});
			this._levelList.sort()
			this._levelList = this._levelList.reverse();
		}

		/**
		 * Simulates a broken lift to a blattform in Dresden Hbf
		 */
		simulateBrokenLift():void
		{
			this.switchLevel(1).then(() => {
				this.__map.setView([51.04034, 13.73327], 19);

				//timeOut besause else new layer will be cleared
				setTimeout(() => {
					$.getJSON("./data/unavailable_plattform.geojson", (geojson) => {
						let layer = L.geoJson(geojson, {
							style: () => {
								return {
									"fill": true,
									"fillColor": "#FF0000",
									"fillOpacity": 0.6,
									"stroke": false
								}
							}
						});

						layer.addTo(this.__map);
					});

					let marker = new L.Marker([51.0403711, 13.733309], {
						icon: new L.Icon({
							iconUrl: "./img/mapicons/elevator_red_filled.png",
							iconAnchor: new L.Point(12, 14)
						})
					})
					marker.addTo(this.__map);

				}, 1500);
			});
		}

		loadDbElevators()
		{
			this._elevatorMarkers = [];
			console.log('load');
			$.getJSON("http://adam.noncd.db.de/api/v1.0/facilities", (json) => {
				if (json)
				{
					json.forEach((elevator: any) => {
						console.log(elevator);
						let icon = new L.Icon({
							iconUrl: "./img/mapicons/" + ((elevator.state == "INACTIVE") ? "elevator_red_filled.png" : "elevator_green_filled.png"),
							iconAnchor: new L.Point(12, 14)
						})

						var marker = new L.Marker([elevator.geocoordY, elevator.geocoordX], {
							icon: icon
						});
						this._elevatorMarkers.push(marker);
					});
				}
			});
			this.showElevators();
		}

		showElevators(): void
		{
			if (this._elevatorMarkers)
			{
				this._elevatorMarkers.forEach((marker) => {
					marker.addTo(this.__map);
				});
			}
		}


		/**
		 * Leaflet Mapobject
		 */ 
		private __map: L.Map;
		/**
		 * current map level
		 */
		private _level: number;
		/**
		 * Style
		 */
		private _style: any;
		/**
		 * List of all available Levels
		 */
		private _levelList: number[];

		private _elevatorMarkers: L.Marker[];
	}
}