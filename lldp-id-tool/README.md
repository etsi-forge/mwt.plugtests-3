# LLDP ID tool for mWT Plugtests

ETSI has organised the third mWT (millimetre Wave Transmission) SDN (Software Defined Network) Plugtests™ event which took place from 17 to 19 November 2020. This event was held remotely.

For more information visit [the event website](https://www.etsi.org/events/1823-mwt-plugtests-3) or read the [event report](https://portal.etsi.org/Portals/0/TBpages/CTI/Docs/3rd_mWT_PLUGTESTS_REPORT_v1_0.zip).

Contact: plugtests@etsi.org.

## Content of the directory

* `lldp-plug-id.js`: Contains the LLDP logic, e.g. functions to parse and convert LLDP packets and PlugIds
* `web-server.js`: Contains a web-server app that calculates and respond with a Plug ID
* `web-interface.html`: A web interface to manually run the comparison of LLDP-links

Legacy files from early versions of the package

* `cli.js`: A command line executor of the comparison algorithm
* `test/test.js` : A test script to validate the `lib` and `cli` files

## Usage

### Web server

#### Requirements

The tool requires NodeJs (https://nodejs.org) installed. Required dependencies may be installed via NPM (https://www.npmjs.com) with the following CLI command:

    npm install axios http-server

#### Usage

Fire up the http server to serve the JSON files:

    cd "LLDP Samples"
    http-server --cors .

From a differeent terminal, Launch the plug-id server:

    nodejs web-server.js [packets-server-address]

Open a browser at `http://localhost:6767/` to see the human interface:

    http://localhost:6767/

Open a browser at `http://localhost:6767/plugid` and the parameters 'domain1' and 'domain2' to retrieve packets
and calculate plugid, e.g:

    http://localhost:6767/plugid?domain1=Nokia_Wavence_LLDP.json&domain2=SIAE_lldp.json

#### Run the tests

A simple unit test suite is available in the test/test.js file (using `mocha`).
To run the tests hit 

    npm test

### Command line interface `deprecated`

To run the command line script, you need to have Nodejs installed.
The command expects the 4 values for each of the Plug ids as in the example below:

    node cli.js 0 0 0 1 0 0 0 0


