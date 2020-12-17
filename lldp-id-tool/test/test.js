/*
    Released under BSD 3-Clause
    Author: Michele Carignani, ETSI CTI, cti_support@etsi.org
*/

const plugid = require('../lldp-plug-id.js');
var assert = require('assert');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function test_fromJSONtoLink_Example_1() {

    var input = {
          "Chassis Subtype = MAC address, Id: 2c:97:b1:f6:f7:21": {
            "lldp.tlv.type": "1",
            "lldp.tlv.len": "7",
            "lldp.chassis.subtype": "4",
            "lldp.chassis.id.mac": "2c:97:b1:f6:f7:21"
          },
          "Port Subtype = Interface name, Id: GigabitEthernet 2\/255\/2": {
            "lldp.tlv.type": "2",
            "lldp.tlv.len": "24",
            "lldp.port.subtype": "5",
            "lldp.port.id": "GigabitEthernet 2\/255\/2"
        }
    };

    var input2 = {
          "Chassis Subtype = MAC address, Id: 00:b0:ac:06:78:01": {
            "lldp.tlv.type": "1",
            "lldp.tlv.len": "7",
            "lldp.chassis.subtype": "4",
            "lldp.chassis.id.mac": "00:b0:ac:06:78:01"
          },
          "Port Subtype = Interface alias, Id: Gi0/4" : {
            "lldp.tlv.type": "2",
            "lldp.tlv.len": "6",
            "lldp.port.subtype": "1",
            "lldp.port.id": "Gi0/4"
          }
    };

    it("parses mac ids", function(){
        assert.deepStrictEqual(
            plugid.get_chassis_id(
                input2["Chassis Subtype = MAC address, Id: 00:b0:ac:06:78:01"], 4), 
                [ 0x00,0xb0,0xac,0x06,0x78,0x01 ]
            );
        assert.deepStrictEqual(
            plugid.get_chassis_id(
                input2["Chassis Subtype = MAC address, Id: 00:b0:ac:06:78:01"], 4), 
                [0,176,172,6,120,1]
        );
    });

    it("prints mac ids", function(){
        var mac = plugid.get_chassis_id(
                input2["Chassis Subtype = MAC address, Id: 00:b0:ac:06:78:01"], 4);

        assert.deepStrictEqual(
            mac.map(plugid.dec2hex).join(""),
            "00b0ac067801".toUpperCase()
            );
    })

    it("parses JSON into link", function(){
        var link = plugid.fromJSONtoLink(input2);
        assert.equal(link['chassis-id-subtype'], 4);
        assert.deepStrictEqual(link['chassis-id'], [ 0x00,0xb0,0xac,0x06,0x78,0x01 ]);
        assert.equal(link['port-id-subtype'], 1 );
        assert.deepStrictEqual(link['port-id'], [ 0x47,0x69,0x30,0x2F,0x34]);
    });

    it("finds information in Wireshark JSON file for IP20 example", function(){
        
        var ip20_example_json = JSON.parse(fs.readFileSync('LLDP-Samples/IP20_LLDP.json'));
        var info = plugid.find_info_in_file(ip20_example_json);
        assert(info);

    });

    it("parses JSON into link for IP20 example", function(){
        var ip20_example_json = JSON.parse(fs.readFileSync('LLDP-Samples/IP20_LLDP.json'));
        var link = plugid.fromJSONtoLink(plugid.find_info_in_file(ip20_example_json));
        assert.equal(link['chassis-id-subtype'], 4);
        assert.deepStrictEqual(link['chassis-id'], [ 0x00, 0x0a, 0x25, 0x3a, 0x6c ,0xee ]);
        assert.equal(link['port-id-subtype'], 3 );
        assert.deepStrictEqual(link['port-id'], [ 0x00, 0x0a, 0x25, 0x3a, 0x6c, 0xf1]);
    });

    it("compares link bytes arrays", function(){
        assert(plugid.plug_ids_cmp([0,2,3], [0,1]));
    })

    it("shall work on Example-1 for Hex", function(){
        var plug_id = plugid.fromJSONtoPlugId(input, input2);
        var sss = plugid.plugIdToHex(plug_id);
        
        var expected = "01"
                        +"042c97b1f6f721054769676162697445746865726E657420322F3235352F32"
                        +"0400b0ac067801014769302F34";

        assert.equal(sss, expected.toUpperCase());
    });

    it("shall work on Example-1 for Base64", function(){
        var plug_id = plugid.fromJSONtoPlugId(input, input2);
        var sss = plugid.plugIdToBase64(plug_id);
        assert.equal(sss, "AQQsl7H29yEFR2lnYWJpdEV0aGVybmV0IDIvMjU1LzIEALCsBngBAUdpMC80");
    });

    it("finds information in Wireshark JSON file for all samples", function(){

        var dir = 'LLDP-Samples';

        fs.readdir(dir, function (err, files) {
            if (err) { return console.log('Unable to scan directory: ' + err); } 

            files.forEach(function (file) {
                if(file.match(/\.json/)) {
                    var sample_json = JSON.parse(fs.readFileSync(path.join(dir, file)));
                    var info = plugid.find_info_in_file(sample_json);
                    assert(info['End of LLDPDU']);
                }
            });
        });

    });
    
}


describe("plug-ids-lib", function(){
    describe("fromJSONtoLink", test_fromJSONtoLink_Example_1);
});

