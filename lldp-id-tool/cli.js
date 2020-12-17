/*
Released under BSD 3-Clause
Author: Michele Carignani, ETSI CTI, cti_support@etsi.org


THIS MODULE IS MISSING PROPER DOCUMENTATION AND DEPRECATED

*/

var lib = require('./plug-ids-lib.js');

var USAGE = "This tool is deprecated. Use at your own risk.";

if (process.argv.length < 10) {
	console.log(USAGE);
	process.exit();
}

console.log(
	lib.plug_ids_cmp(
		lib.LldpLink(process.argv[2], process.argv[3], process.argv[4], process.argv[5]), 
		lib.LldpLink(process.argv[6], process.argv[7], process.argv[8], process.argv[9])
	)
);
