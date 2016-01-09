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
			this.load();
		}

		load(): void
		{
			$.getJSON('./data/dresden_hbf.json', (json) => {
				console.log("-", json)
				let geojson = osmtogeojson(json, {
					flatProperties: true,
					polygonFeatures: () => true //all closed lines are polygons
				});
				L.geoJson(geojson, {
					filter: (feature) => this._layerFilter(feature), //`() =>` to keep scope
					style: (feature) => this._styleGeoJson(feature) //`() =>` to keep scope
				}).addTo(this.__map);
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
			let properties = feature.properties;
			if (properties && properties["indoor"] && properties["indoor"] === "corridor")
			{
				return {
					color: "#000",
					weight: 1,
					opacity: 1,
					fillOpacity: 0.8,
					fillColor: "#FFFFFF"
				}
			}
			return {
				"color": "#ff7800"
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
	}
}