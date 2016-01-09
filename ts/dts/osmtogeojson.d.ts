// Typedefinitions for osmtogeojson
// https://github.com/tyrasd/osmtogeojson
// Version 2.2.5

declare interface IosmtogeojsonOptions {
	flatProperties: any,
	uninterestingTags: any,
	polygonFeatures: any 
}

declare function osmtogeojson(data: any): any;
declare function osmtogeojson(data: any, options: IosmtogeojsonOptions): any;