//Starting up an HTTP Server
//Primary file for API


//Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
const fs = require('fs');

// Instantiating the HTTP Server
var httpServer = http.createServer(function(req,res) {
    unifiedServer(req,res);
});

// Start the Server.
httpServer.listen(config.httpPort,function() {
    console.log("The server is listening on port "+config.httpPort);
});

// Create variable for httpServer
var httpsServer = https.createServer(httpsServerOptions,function(req,res) {
    unifiedServer(req,res);
});

// Instantiating the HTTPS Server
var httpsServerOptions = {
    pfx : fs.readFileSync('./https/pki/frodo.local.pfx'),
    passphrase: 'Sauron is a bully!'
};

//Start the HTTPS Server
httpsServer.listen(config.httpsPort,function() {
    console.log("The server is listening on port "+config.httpsPort);
});

// All the server logic for both the http and https servers
var unifiedServer = function(req,res){

    // Get the URL string and parse it into an object
    var parsedUrl = url.parse(req.url,true);
    // Get the path
    var path = parsedUrl.pathname;

    // Remove all special characters in the path
    var trimmedPath = path.replace(/^\/+|\/+$/g,'')

    //Get the edied query string as an object
    var queryStringObject = parsedUrl.query;

    // Get the HTTP Method
    var method = req.method.toLowerCase();

    // Get the headers as an object
    var headers = req.headers

    // Get the payload if there is any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', function(data) {
        buffer += decoder.write(data);
    });
    req.on('end',function(){
        buffer += decoder.end();

        // Choose the handler this request should go to. If one is not found send to notFound handler.
        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        // Construct the data object to send to the handler
        var data = {
            'trimmedPath' : trimmedPath,
            'queryStringObject' : queryStringObject,
            'method' : method,
            'headers' : headers,
            'payLoad' : buffer
        };

        // Route the request to the handler specified in the router
        chosenHandler(data,function(statusCode,payLoad){
            // Use the status code callback by the handler, or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200

            // Use the payload called back by the handler, or default to an empty object
            payLoad = typeof(payLoad) == 'object' ? payLoad : {};

            // Convert payload to a string
            var payLoadString = JSON.stringify(payLoad);

            // Return the response
            res.setHeader('Content-Type','application/json');
            res.writeHead(statusCode);
            res.end(payLoadString);

            // Log the request path
            console.log('Returning this response: ',statusCode,payLoadString);
        });
    });    
};

// Define handlers
var handlers = {};

// Not found handler
handlers.notFound = function(data, callback){
    callback(404);
}

// Ping Handlers
handlers.ping = function(data,callback){
    callback(200);
}

// Create JSON for Hello handler
var responseString = '{ "name" : "hello", "response" : "Hey, what\'s going on?"}';

// Convert JSON string into an object
var responseObj = JSON.parse(responseString);

// Hello handlers
handlers.hello = function(data,callback){
    console.log(responseObj.response);
}

// Define a request router
var router = {
    'ping' : handlers.ping,
    'hello': handlers.hello
}

