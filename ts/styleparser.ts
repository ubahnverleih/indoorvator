/// <reference path="./dts/jquery.d.ts"/>
/// <reference path="./dts/leaflet.d.ts"/>
module t {
	export class styleParser {
		public static getSimpleStyleForFeature(feature: any, styleJson: any[]): any
		{
			let properties = feature.properties;
			let style: any = {};
			if (properties)
			{
				styleJson.forEach((selection: any) => {	
					let key = selection["key"];
					if (properties[key])
					{
						$.extend(style, selection["style"]); //merge new style parts in existing style (and overwrite existing properties with new ones)
					}

					if (selection["valueStyles"])
					{
						selection["valueStyles"].forEach((valueStyle: any) => {
							if (properties[key] == valueStyle.value)
							{
								$.extend(style, valueStyle["style"]); //merge new style parts in existing style (and overwrite existing properties with new ones)
							}
						})
					}
				})
			}
			return style;
		}

		public static getLabelMarker(feature: any, styleJson: any[], zoom: number): L.Marker
		{
			if (feature.geometry.type === "Polygon")
			{
				let featureStyle = this.getSimpleStyleForFeature(feature, styleJson);

				if (featureStyle.showText) {
					let coordinates: any[] = [];
					//flip coordinates (only get outer ring [0])
					feature.geometry.coordinates[0].forEach((c: number[]) => {
						coordinates.push({ lat: c[1], lng: c[0] })
					});
					let polygon = new L.Polygon(coordinates);
					let point = polygon.getBounds().getCenter();

					let icon = this.getIconForProperties(feature, styleJson, zoom);
					let marker = new L.Marker(point, { icon: icon });

					return marker;
				}
			}
		}

		public static getIconForProperties(feature: any, styleJson: any[], zoom: number): L.Icon
		{
			let featureStyle = this.getSimpleStyleForFeature(feature, styleJson);
			let label = "";
			
			//icon limit
			if ((!featureStyle.iconMinZoom) || (zoom >= featureStyle.iconMinZoom))
			{
				//label limit
				if ((!featureStyle.labelMinZoom) || (zoom >= featureStyle.labelMinZoom))
				{
					label = feature.properties.name ? '<div class="label-text">' + feature.properties.name + '</div>' : "";
				}

				let icon = new L.DivIcon({
					//iconUrl: "http://osm.lyrk.de/address/leaflet/images/marker-iconred.png",
					html: (featureStyle.iconUrl ? '<img class="label-icon" src="' + featureStyle.iconUrl + '" />' : "")
					+ label,
					className: "label-class " + (featureStyle.markerClassName ? featureStyle.markerClassName : ""),
					iconAnchor: <any>[50, 25]
				});
				//console.log(icon);
				return icon;
			}
			else {
				let icon = new L.DivIcon({
					html: "",
					className: "label-empty"
				})
				return icon;
			}
		}
	}
}