/*
Released under BSD 3-Clause
Author: Michele Carignani, ETSI CTI, cti_support@etsi.org
*/

var btoa = require('btoa');

/**
 *  First byte of the calculated plug-id
 */
const SEED = [0x01];


/*
 * Compares two Lldp Links represented as Bytes Arrays.
 * Returns True when RX > TX, based on the length of the arrays.
 * Returns False otherwise.
 */
function plug_ids_cmp(RX, TX) {

    if (RX.length != TX.length){
        return RX.length > TX.length;
    }

    for (var i = 0; i < RX.length; i++){
        if(RX[i] != TX[i]){ return RX[i] > TX[i]; }
    }

    // they are equal, therefore no impact on the ordering
    return true;
    
}

/*
 * Returns the representation of byte i as a String in hexadecimal digits
 */
function dec2hex(i) {
    return (i + 0x10000).toString(16).substr(-2).toUpperCase();
}

function parse_mac_addr(mac_addr) {
    return mac_addr
            .split(":")
            .map(a => Number.parseInt(a, 16));
}

function get_chassis_id(obj, subtype) {

    if (subtype == 0x04) {
        return parse_mac_addr(obj["lldp.chassis.id.mac"]);
    }

    if (subtype == 0x07) {
        var mac_str = obj["lldp.chassis.id"].split(":");
        var bytes_arr = mac_str.map(a => Number.parseInt(a, 16));
        return bytes_arr;
    }

    throw new Error("Chassis ID subtype not supported: " + subtype);
}

function get_port_id(obj, subtype) {

    if (subtype == 0x01) {
        return obj["lldp.port.id"].split("").map(function(x) {
            return x.charCodeAt();
        });
    }

    if (subtype == 0x03) {
        return parse_mac_addr(obj["lldp.port.id.mac"]);
    }

    if (subtype == 0x05) {
        return obj["lldp.port.id"].split("").map(function(x) {
            return x.charCodeAt();
        });
    }

    if (subtype == 0x07) {
        return parse_mac_addr(obj["lldp.port.id"]);
    }

    throw new Error("Port ID subtype not supported: " + subtype);
}

function fromJSONtoLink(json_obj) {

    var chassis_data, port_data;

    for (var i in json_obj) {
        if (i.startsWith("Chassis Subtype")) chassis_data = json_obj[i];
        if (i.startsWith("Port Subtype"))    port_data = json_obj[i];
    }

    if (! chassis_data ) { throw new Error("Cannot find chassis data in ", json_obj); }
    if (! port_data ) { throw new Error("Cannot find port data in ", json_obj); }

    var chassis_id_subtype = Number.parseInt(chassis_data["lldp.chassis.subtype"], 16);
    var chassis_id = get_chassis_id(chassis_data, chassis_id_subtype);

    var port_id_subtype = Number.parseInt(port_data["lldp.port.subtype"], 16);
    var port_id = get_port_id(port_data, port_id_subtype);

    return LldpLink(
        chassis_id_subtype,
        chassis_id,
        port_id_subtype,
        port_id
    );
}

function fromJSONtoPlugId(a, b) {
    var link_a = linkToBytesArray(fromJSONtoLink(a));
    var link_b = linkToBytesArray(fromJSONtoLink(b));

    var seed = SEED;

    if (plug_ids_cmp(link_a, link_b)) {
        return seed.concat(link_a).concat(link_b);
    } else {
        return seed.concat(link_b).concat(link_a);
    }
}

function linkToBytesArray(l) {
    var res = [];
    res.push(l["chassis-id-subtype"]);
    res = res.concat(l["chassis-id"]);
    res.push(l["port-id-subtype"]);
    res = res.concat(l["port-id"]);
    return res;
}

function plugIdToHex(plid) {
    var to_str = plid.map(function(x) {
        return dec2hex(x);
    });
    var big_str = to_str.join("");
    return big_str;
}

function plugIdToBase64(plid) {
    return btoa(
      plid
      .map(x => String.fromCharCode(x))
      .join("")
    );
}

/*
*  Returns a LldpLink object represented as an object of type
*  {
      'type': 'object',
      'properties': {
          'chassis-id-subtype' : { 'type' : 'Number'},
          'chassis-id' : { 'type' : 'Array', 'items' : {'type' : 'Byte' }},
          'port-id-subtype' : { 'type' : 'Number'},
          'port-id' : { 'type' : 'Array', 'items' : {'type' : 'Byte' }}
      }

   }
*/
function LldpLink(a, b, c, d) {

    if (!(Number.isInteger(a) && Number.isInteger(c)) ||
        !(Array.isArray(b) && Array.isArray(d))
    ) {
        throw new Error("Type error in LLdpLink creation");
    }

    return {
        'chassis-id-subtype': cap255(toPositiveHex(a)),
        'chassis-id': b,
        'port-id-subtype': cap255(toPositiveHex(c)),
        'port-id': d
    };
}

/*
 * Extract the LLDP layer from a JSON packet exports generated by Wireshark
 * 
 * \param f   the object obtained parsing the JSON file (may be an array of packets)
 */
function find_info_in_file(f) {

    try {

        if (Array.isArray(f)) {
            for(var i = 0; i < f.length; i++){
                if(f[i]["_source"]["layers"]["lldp"]) { f = f[i]; }
            }
        }

        return f["_source"]["layers"]["lldp"];

    } catch (err) {
        return err;
    }
}

/*
 *  Returns a PlugId object
 */
function PlugId(type, lldp_link_a, lldp_link_b) {
    return {
        'type': type,
        'lldp_link_a': lldp_link_a,
        'lldp_link_b': lldp_link_b
    };
}

/* Converts a string to a hexadecimal number.
 *
 */
function toPositiveHex(a) {
    var r = parseInt(a, 16);
    if (isNaN(r) || r < 0) {
        throw new Error("Cannot convert '" + a + "' to a positive hexadecimal number");
    }
    return r;
}

/*  Ensures that the number is below 255 (in base 10).
 *
 */
function cap255(a) {
    if (a > 255) {
        throw new Error("Number " + a + "(base 10) should be in the [0,255] (base 10) interval.");
    }
    return a;
}

exports.LldpLink = LldpLink;
exports.plug_ids_cmp = plug_ids_cmp;
exports.fromJSONtoLink = fromJSONtoLink;
exports.fromJSONtoPlugId = fromJSONtoPlugId;
exports.plugIdToBase64 = plugIdToBase64;
exports.get_chassis_id = get_chassis_id;
exports.dec2hex = dec2hex;
exports.plugIdToHex = plugIdToHex;
exports.find_info_in_file = find_info_in_file;