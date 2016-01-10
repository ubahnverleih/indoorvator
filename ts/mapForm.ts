/// <reference path="./dts/jquery.d.ts"/>
/// <reference path="./dts/leaflet.d.ts"/>
/// <reference path="./dts/osmtogeojson.d.ts"/>
module t {
	export class mapForm {

		constructor()
		{
			this.initMap();

			$('#simulatebutton').on('click', () => this.simulateBrokenLift());
			$("#wheelchairtoggle").on('click', () => this.toggleWheelChair());
			
		}

		initMap(): void
		{
			this._level = 0;
			this.__map = new L.Map('map', {});
			this.__map.setView([51.04022, 13.73245], 19);
			this._isWheelchairstyleActive = false;
			/*L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
				maxZoom: 22
			}).addTo(this.__map);*/

			L.tileLayer('https://api.tiles.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidWJhaG52ZXJsZWloIiwiYSI6IjZyVGcyZzAifQ.EP3L8P8zlHIRF7-pB7zfDA', {
				attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
				maxZoom: 22
			}).addTo(this.__map);

			this._lastZoomLevel = this.__map.getZoom();

			this.loadStyle()
				.then(() => this.loadWheelchairStyle())
				.then(() => this.load())
				.then(() => this.loadDbElevators()); //First load Style, then load the mapdata

			//reload/rerender on zoom
			this.__map.on('zoomend', () => {
				if (this._lastZoomLevel && ((this._lastZoomLevel >= 17) && (this.__map.getZoom() > this._lastZoomLevel))) {
					this.load(true);
				}
				else {
					this.load();
				}
				this._lastZoomLevel = this.__map.getZoom()
			});

			this.__map.on('moveend', (e: any) => {
				
				console.log(e.hard);
				if (e.hard === false)
				{
					//console.log("move with zoom");
				}
				else
				{
					console.log('load');
					this.load();
				}
			});
			//TODO reload/rerender on move - but only if movedistance is >= trashhold
			
		}

		load(resueData?: boolean): JQueryXHR
		{
			//TODO check zoomlevel
			resueData = resueData ? resueData : false;

			if ((resueData && this._jsonData) || (this.__map.getZoom() < 17))
			{
				this.render(this._jsonData);
				let deferred = $.Deferred<any>();
				deferred.resolve(this._jsonData);
				return <JQueryXHR>deferred.promise();
			}
			else
			{
				this._levelList = [];
				//this.loadFromOverpass() //TODO
				//let xhr = $.getJSON('./data/dresden_hbf.json', (json) => {
				
				let xhr = this.loadFromOverpass();
				xhr.done((json) => {
					this._jsonData = json;
					this.render(json);
				});
				return xhr;
			}
		}

		render(json: any)
		{
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
		}

		loadStyle(): JQueryXHR
		{
			return $.getJSON('./mapstyle/style.json', (json) => {
				this._style = json;
			});
		}

		loadWheelchairStyle(): JQueryXHR {
			return $.getJSON('./mapstyle/wheelchairstyle.json', (json) => {
				this._wheelchairStyle = json;
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
			let style = this._isWheelchairstyleActive ? this._wheelchairStyle : this._style;
			let s = styleParser.getSimpleStyleForFeature(feature, style);
			
			let marker = styleParser.getLabelMarker(feature, style, this.__map.getZoom());
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
			return this.load(true);
		}

		addToLevelList(levels: number[])
		{
			levels.forEach((level) => {
				if (!isNaN(level))
				{
					if ($.inArray(level, this._levelList) == -1) {
						this._levelList.push(level);
					}
				}
			});
			this._levelList.sort(); //TODO fixing sort
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
			$.getJSON("http://adam.noncd.db.de/api/v1.0/facilities", (json) => {
				if (json)
				{
					json.forEach((elevator: any) => {
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

		loadFromOverpass(): JQueryXHR 
		{ 
			this.loadindicator(1);
			let bounds = this.__map.getBounds()
			let bboxxtring = (bounds.getSouth()-0.0005) + ","
				+ (bounds.getWest()-0.0005) + ","
				+ (bounds.getNorth()+0.0005) + ","
				+ (bounds.getEast()+0.0005);
			let overpassQuery = `
				[out:json][timeout:25]; 
				( 
				// query part for: “indoor=*” 
				node["indoor"]({{bbox}}); 
				way["indoor"]({{bbox}}); 
				relation["indoor"]({{bbox}}); 
				way["railway" = "platform"]({{bbox}}); 
				way["highway" = "platform"]({{bbox}}); 
				relation["railway" = "platform"]({{bbox}}); 
				node["room"]({{bbox}}); 
				way["room"]({{bbox}}); 
				relation["room"]({{bbox}}); 
				node["highway" = "elevator"]({{bbox}}); 
				node["level"]({{bbox}}); 
				way["highway"~"footway|elevator|steps|path"]({{bbox}}); 
				); 
				// print results 
				out body; 
				>; 
				out skel qt;`;
			overpassQuery = overpassQuery.replace(/{{bbox}}/g, bboxxtring);

			//let url = "http://overpass.osm.rambler.ru/cgi/interpreter?data=%2F*%0AThis%20has%20been%20generated%20by%20the%20overpass-turbo%20wizard.%0AThe%20original%20search%20was%3A%0A%E2%80%9Cindoor%3D*%E2%80%9D%0A*%2F%0A%5Bout%3Ajson%5D%5Btimeout%3A25%5D%3B%0A%2F%2F%20gather%20results%0A%28%0A%20%20%2F%2F%20query%20part%20for%3A%20%E2%80%9Cindoor%3D*%E2%80%9D%0A%20%20node%5B%22indoor%22%5D%2851.0399426744667%2C13.732688874006271%2C51.040494161677266%2C13.733840882778168%29%3B%0A%20%20way%5B%22indoor%22%5D%2851.0399426744667%2C13.732688874006271%2C51.040494161677266%2C13.733840882778168%29%3B%0A%20%20relation%5B%22indoor%22%5D%2851.0399426744667%2C13.732688874006271%2C51.040494161677266%2C13.733840882778168%29%3B%0A%20%20way%5B%22railway%22%3D%22platform%22%5D%2851.0399426744667%2C13.732688874006271%2C51.040494161677266%2C13.733840882778168%29%3B%0A%20%20way%5B%22highway%22%3D%22platform%22%5D%2851.0399426744667%2C13.732688874006271%2C51.040494161677266%2C13.733840882778168%29%3B%0A%20%20relation%5B%22railway%22%3D%22platform%22%5D%2851.0399426744667%2C13.732688874006271%2C51.040494161677266%2C13.733840882778168%29%3B%0A%20%20node%5B%22room%22%5D%2851.0399426744667%2C13.732688874006271%2C51.040494161677266%2C13.733840882778168%29%3B%0A%20%20way%5B%22room%22%5D%2851.0399426744667%2C13.732688874006271%2C51.040494161677266%2C13.733840882778168%29%3B%0A%20%20relation%5B%22room%22%5D%2851.0399426744667%2C13.732688874006271%2C51.040494161677266%2C13.733840882778168%29%3B%0A%20%20node%5B%22highway%22%3D%22elevator%22%5D%2851.0399426744667%2C13.732688874006271%2C51.040494161677266%2C13.733840882778168%29%3B%0A%20%20node%5B%22level%22%5D%2851.0399426744667%2C13.732688874006271%2C51.040494161677266%2C13.733840882778168%29%3B%0A%20%20way%5B%22highway%22~%22footway%7Celevator%7Csteps%7Cpath%22%5D%2851.0399426744667%2C13.732688874006271%2C51.040494161677266%2C13.733840882778168%29%3B%0A%29%3B%0A%2F%2F%20print%20results%0Aout%20body%3B%0A%3E%3B%0Aout%20skel%20qt%3B"
			let apiUrl = "http://overpass.osm.rambler.ru/cgi/interpreter?data=";
			let url = apiUrl + encodeURI(overpassQuery);
			let request = $.getJSON(url, (result) => {
				//console.log(result);
			});
			request.always(() => {
				
				this.loadindicator(-1);
			});

			return request;
		}

		activateWheelchairStyle()
		{
			this._isWheelchairstyleActive = true;
			this.load(true);
		}

		deactivateWheelchairStyle() {
			this._isWheelchairstyleActive = false;
			this.load(true);
		}

		toggleWheelChair()
		{
			let button = $("#wheelchairtoggle")
			if (this._isWheelchairstyleActive)
			{
				this.deactivateWheelchairStyle();
				button.removeClass('pressed');
			}
			else
			{
				this.activateWheelchairStyle();
				button.addClass('pressed');
			}
		}

		loadindicator(n: number) {
			if (!this._activeLoads) {
				this._activeLoads = 0;
			}
			this._activeLoads = this._activeLoads + n;

			//should never happen ;)
			if (this._activeLoads < 0)
			{
				this._activeLoads = 0;
			}

			if (this._activeLoads == 0) {
				$("#loading").hide();
			}
			if (this._activeLoads > 0)
			{
				$("#loading").show();
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
		 * Wheelchairstyle
		 */
		private _wheelchairStyle: any;

		/**
		 * List of all available Levels
		 */
		private _levelList: number[];

		private _elevatorMarkers: L.Marker[];

		/**
		 * last Zoomlevel. Used to detect if zoomed in or out.
		 */
		private _lastZoomLevel: number;

		/**
		 * indicate that the wheelchairstyle is activated
		 */
		private _isWheelchairstyleActive: boolean;

		/**
		 * cached OSM JSON
		 */
		private _jsonData: any;

		private _activeLoads: number;
	}
}