/// <reference path="./dts/jquery.d.ts"/>
/// <reference path="./dts/leaflet.d.ts"/>
/// <reference path="./dts/osmtogeojson.d.ts"/>
module t {
	export class mapForm {

		constructor()
		{
			this.initMap();
		}

		initMap(): void
		{
			this._level = 0;
			this.__map = new L.Map('map', {});
			this.__map.setView([51.04022, 13.73245], 18);
			/*L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
				maxZoom: 22
			}).addTo(this.__map);*/

			L.tileLayer('https://api.tiles.mapbox.com/v4/mapbox.streets-basic/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoidWJhaG52ZXJsZWloIiwiYSI6IjZyVGcyZzAifQ.EP3L8P8zlHIRF7-pB7zfDA', {
				attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
				maxZoom: 22
			}).addTo(this.__map);

			this.loadStyle().then(() => this.load()); //First load Style, then load the mapdata
			
		}

		load(): void
		{
			$.getJSON('./data/dresden_hbf.json', (json) => {
				console.log("--", json)
				let geojson = osmtogeojson(json, {
					flatProperties: true,
					polygonFeatures: () => true //all closed lines are polygons
				});
				L.geoJson(geojson, {
					//smoothFactor: 0, //don't Simplify Lines
					filter: (feature) => this._layerFilter(feature), //`() =>` to keep scope
					style: (feature) => this._styleGeoJson(feature), //`() =>` to keep scope
					pointToLayer: (feature: any, latlng: L.LatLng) => {
						return this.createsStyledMarker(feature, latlng);
					}
				}).addTo(this.__map);
			});
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
				//TODO: filter multilevel objects
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
				console.log(levels);
				return levels;
			}
		}

		createsStyledMarker(feature: any, latlng: L.LatLng): any
		{
			return new L.Marker(latlng);
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
	}
}