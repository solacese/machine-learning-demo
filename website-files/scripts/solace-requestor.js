// Jamil.Ahmed@Solace.com

var BasicRequestor = function (topicName) {
    'use strict';
    var requestor = {};
    requestor.session = null;
	
	
	var buttonMessage = "";

    // Logger
    requestor.log = function (line) {
        var now = new Date();
        var time = [('0' + now.getHours()).slice(-2), ('0' + now.getMinutes()).slice(-2),
            ('0' + now.getSeconds()).slice(-2)];
        var timestamp = '[' + time.join(':') + '] ';
        console.log(timestamp + line);
        
    };

    // Establishes connection to Solace message router
    requestor.connect = function () {
        if (requestor.session !== null) {
            requestor.log('Already connected and ready to send requests.');
            return;
        }
		
		var hosturl;
		if (window.location.protocol == "https:")
		{
			hosturl = "https://london.solace.com:8443";
		}
		else
		{
			hosturl = "http://london.solace.com:8080";

		}

		
        var username = "demo-user-public";
        var pass = "password";
		var vpn = "restgw-demo-solace-uk";

        // check for valid protocols
        if (hosturl.lastIndexOf('ws://', 0) !== 0 && hosturl.lastIndexOf('wss://', 0) !== 0 &&
            hosturl.lastIndexOf('http://', 0) !== 0 && hosturl.lastIndexOf('https://', 0) !== 0) {
            session.log('Invalid protocol - please use one of ws://, wss://, http://, https://');
            return;
        }

        if (!hosturl || !username || !pass || !vpn) {
            session.log('Cannot connect: please specify all the Solace message router properties.');
            return;
        }
        requestor.log('Connecting to Solace message router using url: ' + hosturl);
        requestor.log('Client username: ' + username);
        requestor.log('Solace message router VPN name: ' + vpn);
        // create session
        try {
            requestor.session = solace.SolclientFactory.createSession({
                // solace.SessionProperties
                url:      hosturl,
                vpnName:  vpn,
                userName: username,
                password: pass,
				connectTimeoutInMsecs: 5000,
				reconnectRetryWaitInMsecs: 2000,
				connectRetries: 3,
				readTimeoutInMsecs: 3000,
				keepAliveIntervalInMsecs: 3000,
				keepAliveIntervalsLimit: 10,
				reapplySubscriptions: true,
				webTransportProtocolList: [solace.TransportProtocol.HTTP_BINARY, solace.TransportProtocol.HTTP_BASE64]
            });
        } catch (error) {
            requestor.log(error.toString());
        }
		
		
        // define session event listeners
        requestor.session.on(solace.SessionEventCode.UP_NOTICE, function (sessionEvent) {
            requestor.log('=== Successfully connected and ready to send requests. ===');
			
			document.getElementById("request").innerHTML = "Fetching latest news articles...";
			initNewsArticles();

                                
        });
        requestor.session.on(solace.SessionEventCode.CONNECT_FAILED_ERROR, function (sessionEvent) {
			// If could not connect... 
			document.getElementById("request").innerHTML = "Failed to make a connection!" ;
			document.getElementById("request").setAttribute("class", "pure-button button-error");
            console.log('Connection failed to the message router: ' + sessionEvent.infoStr + " " + sessionEvent.reason + 
                ' - check correct parameter values and connectivity!');
			document.getElementById("connection").style = "display: true" ;
        });
        requestor.session.on(solace.SessionEventCode.DISCONNECTED, function (sessionEvent) {
            requestor.log('Disconnected.');
            if (requestor.session !== null) {
                requestor.session.dispose();
                requestor.session = null;
            }
			document.getElementById("request").innerHTML = "Connection Lost. Please refresh page.";
			document.getElementById("request").setAttribute("class", "pure-button button-error");
        });
		
		requestor.session.on(solace.SessionEventCode.RECONNECTING_NOTICE, function (sessionEvent) {
            
            console.log("Connection interrupted. Reconnecting...");
			buttonMessage = document.getElementById("request").innerHTML;
			document.getElementById("request").innerHTML = "Connection Interrupted. Reconnecting...";
			document.getElementById("request").disabled = true;
			document.getElementById("request").setAttribute("class", "pure-button button-error");
            
        });	
		
		requestor.session.on(solace.SessionEventCode.RECONNECTED_NOTICE, function (sessionEvent) {
            
            console.log("Connection Restored.");
			document.getElementById("request").innerHTML = buttonMessage;
			document.getElementById("request").disabled = false;
			document.getElementById("request").setAttribute("class", "pure-button pure-button-primary");

            
        });	
		
        // if secure connection, first load iframe so the browser can provide a client-certificate
        if (hosturl.lastIndexOf('wss://', 0) === 0 || hosturl.lastIndexOf('https://', 0) === 0) {
            var urlNoProto = hosturl.split('/').slice(2).join('/'); // remove protocol prefix
            document.getElementById('iframe').src = 'https://' + urlNoProto + '/crossdomain.xml';
        } else {
            requestor.connectToSolace();   // otherwise proceed
        }
    };

    // Actually connects the session triggered when the iframe has been loaded - see in html code
    requestor.connectToSolace = function () {
        try {
            requestor.session.connect();
        } catch (error) {
            requestor.log(error.toString());
        }
    };
	
	//////////////////////////////////////////////////////////////////////////////////////////////////////
	
	// sends request messages to the various services  
    requestor.sendRequest = function (correlationID, requestText, topicName) {	
			
        if (requestor.session !== null) {
			
            var request = solace.SolclientFactory.createMessage();
            //requestor.log("Request with ID: '" + correlationID + "' being sent to topic: '" + topicName + '"...');
			request.setCorrelationId(correlationID);
            request.setDestination(solace.SolclientFactory.createTopicDestination(topicName));
            request.setSdtContainer(solace.SDTField.create(solace.SDTFieldType.STRING, requestText));
            request.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
			
			
            try {
                requestor.session.sendRequest(
                    request,
                    10000, // 10 seconds timeout for this operation
                    function (session, message) {
                        requestor.replyReceivedCb(session, message);
                    },
                    function (session, event) {
                        requestor.requestFailedCb(session, event);
                    },
                    null // not setting a correlation object 
                );
            } catch (error) {
                requestor.log(error.toString());
            }
        } else {
            requestor.log('Cannot send request because not connected to Solace message router.');
        }
    };

    // Callback for request replies
    requestor.replyReceivedCb = function (session, message) {
		
		var messageCorrelationId = "";
				
		try {

			messageCorrelationId = message.getCorrelationId();
			//var messageStringRaw = message.getBinaryAttachment();
			
			// What type of message was received?
			var sdtContainer = message.getSdtContainer();
			
			if (sdtContainer)
			{
				var messageStringRaw = message.getSdtContainer().getValue();
				
			}
			else
			{
				var messageStringRaw = message.getBinaryAttachment();
			}
			
			var messageStringJson = messageStringRaw.substring(messageStringRaw.indexOf("{"),messageStringRaw.lastIndexOf("}")+1);
			
			if (messageStringJson !== "") {
				//console.log("Response received in JSON for correlation ID: '" + messageCorrelationId + "' : " + messageStringJson);
				processReceivedResponse(messageCorrelationId, JSON.parse(messageStringJson));
			}
			else
			{
				//console.log("Response received in non-JSON for correlation ID: '" + messageCorrelationId + "' : " + messageStringJson);
				messageStringRaw = message.getSdtContainer().getValue();
				processReceivedResponse(messageCorrelationId, messageStringRaw);
			}
		}
		catch (error)
		{
			var errorMsg = { "error" : "An exception occurred in the message receive callback: " + error.message };
			console.log(errorMsg.error + "[" + messageCorrelationId + "]");
			processReceivedResponse (messageCorrelationId, errorMsg);
		}
    };

	
    // Callback for request failures
    requestor.requestFailedCb = function (session, event) {		
		processReceivedResponse(event.Fg);	// Fg seems to hold the correlation ID from the original message...
    };
	
	

    // Gracefully disconnects from Solace message router
    requestor.disconnect = function () {
        requestor.log('Disconnecting from Solace message router...');
        if (requestor.session !== null) {
            try {
                requestor.session.disconnect();
            } catch (error) {
                requestor.log(error.toString());
            }
        } else {
            requestor.log('Not connected to Solace message router.');
        }
    };
	
	
	
    
    return requestor;
};