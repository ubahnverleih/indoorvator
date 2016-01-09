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
			L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
				attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors',
				maxZoom: 19
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
					filter: (feature) => this._layerFilter(feature), //`() =>` to keep scope
					style: (feature) => this._styleGeoJson(feature) //`() =>` to keep scope
					//pointToLayer: (feature) => this._styleMarker(feature)
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
				//TODO: filter multilevel objects
				if (level == this._level)
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
			styleParser.createLabelMarker(feature, this.__map);
			/*if (s) 
				console.log(s);*/
			return s;
			
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