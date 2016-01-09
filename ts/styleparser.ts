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

		public static createLabelMarker(feature: any, map: L.Map): void
		{
			if (feature.geometry.type === "Polygon")
			{
				let coordinates: any[] = [];
				//flip coordinates (only get outer ring [0])
				feature.geometry.coordinates[0].forEach((c: number[]) => {
					coordinates.push({ lat: c[1], lng: c[0] })
				});
				let polygon = new L.Polygon(coordinates);
				let point = polygon.getBounds().getCenter();
				let marker = new L.Marker(point);
				marker.addTo(map); 
				console.log("MARKER", marker);
				//mmm = marker;
			}
		}
	}
}