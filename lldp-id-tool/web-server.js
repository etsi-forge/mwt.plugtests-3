/*     Released under BSD 3-Clause     
 *     Author: Michele Carignani, ETSI CTI, cti_support@etsi.org 
 */

/*
 *  A HTTP server of LLDP plug-id values calculated from raw LLDP packets dump
 *
 *  Packets dump shall be in the JSON format and be available over HTTP.
 *  The location can be passed as the first CLI argument (default is http://localhost:8080/)
 *
 *  The format of the packets should be either JSON Array or JSON Object with the field structure:
 *     '._source.layers.lldp.*'
 */

const axios = require('axios').default;
const http = require('http');
const url = require('url');
const querystring = require('querystring');
const sanitize = require("sanitize-filename");
const formidable = require('formidable');
const fs = require('fs');

const plugid = require('./lldp-plug-id.js');

// Default erver to retrieve the JSON files containing the LLDP packets
SERVER = "http://localhost:8080/"
PORT = 6767;

SAMPLES_DIR = 'LLDP-Samples/';

/*
 * Retrieves and returns a file over HTTP
 */
function go_get(url) {
    return axios.get(SERVER + url)
        .then(function(response) {
            res = response.data;
            // console.log("------ Response of " + url + ":\n" + res);
            return res;
        })
        .catch(function(error) {
            // console.log(error);
            return false;
        });
}

function respond404(error, response) {
	console.log(error);
    response.writeHead(404);
    response.write("<h1>Error 404</h1>File not found: <code>"+error+"</code>");
    response.end();
    console.log(" 404 Not found");
}

function respond400(error, response) {
	console.log(error);
    response.writeHead(400);
    response.write("<h1>Error 400</h1>Something went wrong: <br>\n<pre>"+error+"</pre>");
    response.end();
    console.log(" 400 Error");
}

function list_packets(request, response) {
   go_get("").then((res) => {
	   return response.end(res);
   });
}

/*
 * Handles a HTTP request
 */
function on_request2(request, response) {
    

    query = querystring.parse(url.parse(request.url).query);

    try {
    	a = sanitize(query["domain1"]);
    	b = sanitize(query["domain2"]);	
    } catch (error) {
    	respond400(error, response);
    	return response;
    }
    
    Promise.all([go_get(a), go_get(b)]).then(
        results => {
        	if (!results[0]) {
        		respond404(a, response);
        		return;
        	}

        	if (!results[1]) {
        		respond404(b, response);
        		return;
        	}

            info_a = plugid.find_info_in_file(results[0]);
            info_b = plugid.find_info_in_file(results[1]);

            var plug_id = plugid.fromJSONtoPlugId(info_a, info_b);
            var hex_plug_id = plugid.plugIdToHex(plug_id);
            var b64_plug_id = plugid.plugIdToBase64(plug_id);

            response.writeHead(200, {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            });
            response.write(JSON.stringify({
                "domain1": info_a,
                "domain2": info_b,
                "plug-id": {
                    "hex": hex_plug_id,
                    "base64": b64_plug_id
                }
            }));

            response.end();
            console.log(" 200 OK");
        }).catch(error => {
            respond400(error, response);
    });
}

function serve_ui(request, response){
    fs.createReadStream("web-interface.html").pipe(response);
    console.log(" 200 OK");
}

function serve_upload(request, response){

    if(request.method == "POST") {
        var form = new formidable.IncomingForm();
        form.maxFileSize = 1024 * 1024;
        form.parse(request, function (err, fields, files) {
            var oldpath = files.filetoupload.path;
            var newpath = SAMPLES_DIR + files.filetoupload.name;
            console.log(" uploaded ", files.filetoupload.name);
            fs.rename(oldpath, newpath, function (err) {
                if (err) throw err;
                response.write('<html><body><center>');
                response.write('<p>The file was correctly uploaded!</p>');
                response.write('<a href="/">Back to homepage</a>');
                response.write('</center></body></html>');
                response.end();
            });
        });
    } else if (request.method == "DELETE") {
    
      var fn = querystring.parse(url.parse(request.url).query)["fn"];
      
      if(fn == "" ) {
        respond400("Missing query parameter", response);
        return response;
      }
      
      try {
        fileToDelete = sanitize(fn);
        var path = SAMPLES_DIR + fileToDelete;  
        fs.unlinkSync(path);
      } catch (e) {
        respond400(e, response)
        return response;
      }
      
      console.log(" deleted ", fileToDelete);
      response.writeHead(204);
      return response.end();
      
    } else {
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write('<center>');
        response.write('<form action="upload" method="post" enctype="multipart/form-data">');
        response.write('<input type="file" name="filetoupload"><br>');
        response.write('<input type="submit">');
        response.write('</form>');
        response.write('</center>');
        return response.end();
    }

}

function on_request(request, response){

    process.stdout.write(Date(new Date()).toString() + "; "+request.url + "; " + request.headers['x-forwarded-for']+";" );

    if (request.url.startsWith("/static/")){
        fs.createReadStream(request.url.slice(1)).pipe(response);
        console.log(" 200 OK");
        return;
    }

    switch(request.url.split("?")[0]) {
        case "/plugid" : on_request2(request, response); break;
        case "/upload" : serve_upload(request, response); break;
        case "/favicon.ico" : respond404("favicon.ico", response); break;
	    case "/packets/" : list_packets(request, response); break;
	default: serve_ui(request, response);
    }

}

/* MAIN */

if (process.argv.length > 2 && process.argv[2].slice(0, 4) === "http") {
    SERVER = process.argv[2];
}
console.log("HTTP Server for LLDP packets: " + SERVER);

http.createServer(on_request).listen(PORT);
console.log("Listening requests on http://localhost:" + PORT + "/");
