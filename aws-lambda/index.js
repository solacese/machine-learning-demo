exports.handler = (event, context, callback) => {
    
    // A function to take care of sending the response back
    var sendResponse = function (responseBody)
    {

        if (typeof responseBody == 'undefined')
        {
            responseBody = '{"status":"OK"}';
        }
        var response = {
            statusCode: 200,
            headers: {
            },
            body: JSON.stringify(responseBody)
        };
        console.log ("Sending response back: " + JSON.stringify(response));
        callback(null, response);
    }

    // A function to take care of sending any error response back    
    var sendErrorResponse = function (errorMessage)
    {
        var errorMessageJson = '{ "error": "' + errorMessage + '" }';
        var response = {
            statusCode: 200,
            headers: {
            },
            body: errorMessageJson
        };
    
        console.log ("Sending error response back: " + JSON.stringify(response));
        callback(null, response);
    }
    
    
    var processImageFromURL = function (url) {
    
        var http = require('http');
        http.get(url, function(res) {

        var data = [];      // The image will be downloaded in chunks of data.
        
          // Callback for each data chunk arrival
          res.on('data', function (chunk) {
            data.push(chunk);  
          });
          
          // Call back for when all data arrival complete
          res.on('end', function (chunk) {
            //at this point data is an array of Buffers
            //so Buffer.concat() can make us a new Buffer
            //of all of them together
            var buffer = Buffer.concat(data);
            callRekognition(buffer);              
          });
          
        }).on('error', function(error) {
           sendErrorResponse("Error accessing image URL. Message: " + error.message);
        });
    }
    
    var callRekognition = function (img) {
        var aws = require('aws-sdk');
        var rekognition = new aws.Rekognition();
        
        var params = 
            {
                Image: { 
                    Bytes: img
                }
            };
            
        rekognition.detectLabels(params, function(err, data) {
            if (err) 
            {
                sendErrorResponse(err.message); // an error occurred
            }
            else
            {
                sendResponse(data);           // successful response
            }
        });
    }
    
    var processTextSentiment = function (text)
    {
        var aws = require('aws-sdk');
        var comprehend = new aws.Comprehend();
        var params = 
            {
                "LanguageCode": "en", /* required */
                "Text": text /* required */
            }
                    
        comprehend.detectSentiment(params, function(err, data) {
            if (err) 
            {
                console.log(err, err.stack); // an error occurred
                sendErrorResponse("Error from Comprehend Service: " + err.message);
            }
            else
            {
                console.log("Sentiment: " + JSON.stringify(data));           // successful response
                sendResponse(data);
            }
          
        }); 
    }
    

    // Is it a POST or something else?
    if (event.httpMethod == "POST") // That's all we care about
    {
        
        // Now get the JSON message
        try 
        {
            var jsonRequest = JSON.parse(event.body);  

            var requestType = "";
            if (jsonRequest.type) 
            {
                requestType = jsonRequest.type;
            }

            switch (requestType)
            {
                case "image":
                    processImageFromURL(jsonRequest.url);
                    break;
                    
                case "sentiment":
                    processTextSentiment (jsonRequest.text);
                    break;
                    
                default:
                    sendErrorResponse("No matching types in request") ;   
                    break;
            }
        }
        catch (error)
        {
            sendErrorResponse(error.message);
        }
    }
    else
    {
        sendResponse();
    }
};
