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
								$.extend(style, valueStyle["style"]);
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

					let label = "";
					//einschalten sobald bei jedem zoom neu geladen und damit gerendert wird
					//if (!featureStyle.labelMinZoom || (zoom >= featureStyle.labelMinZoom.labelMinZoom))
					//{
					label = feature.properties.name ? '<div class="label-text">' + feature.properties.name + '</div>' : "";
					//}

					let icon = new L.DivIcon({
						//iconUrl: "http://osm.lyrk.de/address/leaflet/images/marker-iconred.png",
						html: (featureStyle.iconUrl ? '<img class="label-icon" src="' + featureStyle.iconUrl + '" />' : "")
						+ label,
						className: "label-class " + (featureStyle.markerClassName ? featureStyle.markerClassName : ""),
						iconAnchor: <any>[50, 50]
					});
					let marker = new L.Marker(point, { icon: icon });

					return marker;
				}
			}
		}
	}
}