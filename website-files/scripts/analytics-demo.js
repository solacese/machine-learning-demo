// Jamil.Ahmed@solace.com

var gNewsArticlesArray;
var gSelectedNewsID;
var gSubmittedNewsArticle;

var gNewsRequestFailureCount = 0;


var gGoogleImageRequestFailureCount = 0;
var gAzureImageRequestFailureCount = 0;
var gAwsImageRequestFailureCount = 0;

var gGoogleSentimentRequestFailureCount = 0;
var gAzureSentimentRequestFailureCount = 0;
var gAwsSentimentRequestFailureCount = 0;


var cMaxServiceFailureCount = 2;	// Three attempts

var gServiceResponsesReceived = 0;
var cServicesCount = 6;				// 6 services

var cUXMsgFetching = "Fetching latest news articles...";
var cUXMsgSubmitting = "Submitting News Article for Analysis... Please wait...";
var cUXMsgSubmit = "Submit article for analysis";
var cUXMsgNewsTimedOut = "News service request timed out! Try another selection.";

var dropdownIndexCached = 6	// Position in drop down menu for the cached news selection
var dropdownIndexGB = 2	// Position in drop down menu for the UK news selection
var dropdownIndexUS = 1	// Position in drop down menu for the US news selection
var dropdownIndexCA = 1	// Position in drop down menu for the CA news selection
var dropdownIndexIntl = 0	// Position in drop down menu for the International news selection


	//////////////////////// 	News Articles Processing and Display 	////////////////////////////////

function initNewsArticles ()
{
	// This will be called after connecting to the message router so get live news
	// This way the cached news is shown as a starting point if BBC service is not available
	var dropDown = document.getElementById("feedSelector");

	// Try a determine what the region the user is from and show Top Stories for that region
	try {
		var userLanguage = window.navigator.language;
	}
	catch (error)
	{
		// The browser must not support it...
	}
	switch (userLanguage)
	{
		case "en-GB":
			dropDown.selectedIndex = dropdownIndexGB;
			break;
		case "en-US":
			dropDown.selectedIndex = dropdownIndexUS;
			break;
		case "en-CA":
			dropDown.selectedIndex = dropdownIndexCA;
			break;
		default:
			dropDown.selectedIndex = dropdownIndexIntl;
			break;

	}

	//dropDown.selectedIndex = 0;
	refreshArticles();
}


function articleSelectionChanged(button) {

	var radios = document.getElementsByName(button);
	for (var i = 0, length = radios.length; i < length; i++)
	{
		if (radios[i].checked)
		{
			// Save the ID that is selected whenever the selection changes
			gSelectedNewsID = i;
			document.getElementById("row:" + radios[i].value).style.borderWidth = "2px";
		}
		else
		{
			document.getElementById("row:" + radios[i].value).style.borderWidth = 0;
		}
	}
}

function addArticles (newsArticlesArray) {

		// Clear current contents
		document.getElementById("articleSelector").innerHTML = "";
		const maxArticleCount = 20;

		for (var i = 0; i < newsArticlesArray.length; i++)
		{
			var newArticleLabel = '<label> <div class="news-row" id="row:article' + i + '"> <input type="radio" name="news-article" value="article' + i +'" hidden="true" onchange="articleSelectionChanged(\'news-article\')"> <div class="news-image"><img src="' + newsArticlesArray[i].imgS + '"></div> <div class="news-text"> <p> <b>' + newsArticlesArray[i].title + '</b><br>' + newsArticlesArray[i].description + '</p> </div> </div> </label>';

			document.getElementById("articleSelector").innerHTML += newArticleLabel;

			// Only process a maximum of 20 articles
			if (i+1 == maxArticleCount)
			{
				break;
			}
		}
		// Make the first one be selected by default
		gSelectedNewsID = 0;	// Reset the selection since article list has changed
		var radios = document.getElementsByName("news-article");
		radios[gSelectedNewsID].checked = true;
		articleSelectionChanged("news-article");

		// Update readiness status on main page
		// Only if the button was already in a refreshing state and not some other state (like making a new connection)
		buttonElement = document.getElementById("request");
		if (buttonElement.innerHTML == cUXMsgFetching )
		{
			buttonReadyToSubmit();
		}

}

function buttonReadyToSubmit ()
{
	buttonElement.innerHTML = cUXMsgSubmit;
	buttonElement.disabled = false;
	buttonElement.setAttribute("class", "pure-button pure-button-primary");
}


function refreshArticles ()
{
	// Dont touch the button if its already disabled with something else. (i.e. Making a connection to the router still)
	buttonElement = document.getElementById("request");
	if (! buttonElement.disabled )
	{
		buttonElement.innerHTML = innerHTML = cUXMsgFetching;
		buttonElement.disabled = true;
		buttonElement.setAttribute("class", "pure-button pure-button-primary");

	}
	sendNewsRequest();
}

function refreshArticlesTimeout ()
{
	document.getElementById("news-timeout").style = "display: true" ;
	buttonReadyToSubmit();
	// Revert back to cached examples only...
	var dropDown = document.getElementById("feedSelector");
	dropDown.selectedIndex = dropdownIndexCached;
	refreshArticles();
}

function refreshArticlesError () {
	document.getElementById("news-error").style = "display: true" ;
	buttonReadyToSubmit();
	// Revert back to cached examples only...
	var dropDown = document.getElementById("feedSelector");
	dropDown.selectedIndex = dropdownIndexCached;
	refreshArticles();
}

function submitButtonProcessingStart ()
{
	document.getElementById("request").innerHTML = cUXMsgSubmitting;
	document.getElementById("request").disabled = true;
}

function submitButtonProcessingEnd ()
{
	// have all the services responded?
	//console.log("Woke up to see if processing has ended, current responses: " + gServiceResponsesReceived);
	if (gServiceResponsesReceived => cServicesCount )	// Should really use == but debugging a case where it went to 7 once.
	{
		//console.log("All responses received, enabling button");
		buttonReadyToSubmit();
	}
	else
	{
		//console.log("Not all responses received, will check in 2 seconds");
		// Check again in 2 seconds...
		setTimeout(submitButtonProcessingEnd, 2000);
	}
}

function clearNewsErrorMessages()
{
	document.getElementById("news-timeout").style = "display: none" ;
	document.getElementById("news-error").style = "display: none" ;
}


	/////////////////////////////////////////////////	NEWS HANDLING	/////////////////////////////////////////////////////////

function sendNewsRequest () {

	var requestText = ''; // No text required
	var dropDown = document.getElementById("feedSelector");
	var topicName = dropDown.options[dropDown.selectedIndex].value;

	if (topicName == "curated-examples")
	{
		// No need for a request to be sentiment
		processBBCNewsResponse (gCuratedNewsXML);
	}
	else
	{
		// In case there are any errors shown from a previous run, clear them because the condition may have changed
		clearNewsErrorMessages ();
		// requestor.sendRequest("BBCNews", requestText, topicName);
		requestor.sendRequest("CNNNews", requestText, topicName);
	}
}


function processBBCNewsResponse (response)
{
	var responseStatus = isResponseFailed(response);

	if (responseStatus.failed && gNewsRequestFailureCount < cMaxServiceFailureCount)
	{
		// Failed for whatever reason, got another chance though...
		gNewsRequestFailureCount++;

		logger("News Request returned an error. Trying again... (Error: \"" + responseStatus.message + "\")");
		sendNewsRequest();
		return;
	}

	if (responseStatus.failed && gNewsRequestFailureCount == cMaxServiceFailureCount)
	{
		logger("Giving up on News Request after " + gNewsRequestFailureCount + " failed attempts.");
		gNewsRequestFailureCount = 0;	// Reset it back for the next run
		refreshArticlesTimeout();
	}
	else
	{
		try
		{

			var responseXML = response.substring(response.indexOf("<"),response.lastIndexOf(">")+1);
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(responseXML,"text/xml");

			var items = xmlDoc.getElementsByTagName("item");
			gNewsArticlesArray = new Array();

			var imgUrlSecure;

			for (var i = 0; i < items.length; i++)
			{
				gNewsArticlesArray[i] = new Array();
				gNewsArticlesArray[i]["title"] = items[i].getElementsByTagName("title")[0].childNodes[0].nodeValue;
				gNewsArticlesArray[i]["description"] = items[i].getElementsByTagName("description")[0].childNodes[0].nodeValue;
				gNewsArticlesArray[i]["img"] = items[i].getElementsByTagName("media:thumbnail")[0].getAttribute("url");
				gNewsArticlesArray[i]["url"] = items[i].getElementsByTagName("link")[0].childNodes[0].nodeValue;


				// The RSS feed provides the image URL as http, while being available as https too. Need that version when displaying image in the browser.
				imgUrlSecure = gNewsArticlesArray[i]["img"].replace("http://", "https://");
				gNewsArticlesArray[i]["imgS"] = imgUrlSecure;


				//console.log(gNewsArticlesArray[i].title + ":" + gNewsArticlesArray[i].description + ":" + gNewsArticlesArray[i].url);
			}
			addArticles(gNewsArticlesArray);

			// All good at this point then, there were no parse errors either
			gNewsRequestFailureCount = 0;	// Reset it back after a succesful result
		}
		catch (error)
		{
			logger("An error occured when processing the BBC News Response: " + error);
			console.log(responseXML);
			gNewsRequestFailureCount = 0;	// Reset it back for the next run
			refreshArticlesError();
		}

	}

}

function processCNNNewsResponse (response)
{
	var responseStatus = isResponseFailed(response);

	if (responseStatus.failed && gNewsRequestFailureCount < cMaxServiceFailureCount)
	{
		// Failed for whatever reason, got another chance though...
		gNewsRequestFailureCount++;

		logger("News Request returned an error. Trying again... (Error: \"" + responseStatus.message + "\")");
		sendNewsRequest();
		return;
	}

	if (responseStatus.failed && gNewsRequestFailureCount == cMaxServiceFailureCount)
	{
		logger("Giving up on News Request after " + gNewsRequestFailureCount + " failed attempts.");
		gNewsRequestFailureCount = 0;	// Reset it back for the next run
		refreshArticlesTimeout();
	}
	else
	{
		try
		{

			var responseXML = response.substring(response.indexOf("<"),response.lastIndexOf(">")+1);
			var parser = new DOMParser();
			var xmlDoc = parser.parseFromString(responseXML,"text/xml");

			var items = xmlDoc.getElementsByTagName("item");
			gNewsArticlesArray = new Array();

			var imgUrlNonSecure;
			var descriptionLong;
			var descriptionShort;
			var mediaArrayLength;
			
			var newsArticlesCount = 0;

			for (var i = 0; i < items.length; i++)
			{	
				
				 // FEED CLEANUP REQUIRED: 
				 // There is inconsistency in the rss feed with some advertising junk looking like news articles 
				 // Also some articles have an empty title or missing description tag. 
				 // Others have the media images empty 
				 // Some feeds have an image tag embedded in the description, others do not...

				if (items[i].getElementsByTagName("title")[0].childNodes[0] != null && 
								items[i].getElementsByTagName("description").length != 0)
				{
					
					descriptionLong = items[i].getElementsByTagName("description")[0].childNodes[0].nodeValue;
					// Need to strip the image?

					if (descriptionLong.includes("<img src")) 
					{
						descriptionShort = descriptionLong.substring(0, descriptionLong.indexOf("<img src"));
					}
					else 
					{
						descriptionShort = descriptionLong;
					}
					// Any images present?
					mediaArrayLength = items[i].getElementsByTagName("media:content").length;
					
					if ( descriptionShort.length > 0 && mediaArrayLength > 0)
					{

						gNewsArticlesArray[newsArticlesCount] = new Array();
												
						gNewsArticlesArray[newsArticlesCount]["title"] = items[i].getElementsByTagName("title")[0].childNodes[0].nodeValue;
						
						gNewsArticlesArray[newsArticlesCount]["description"] = descriptionShort;
						
						// Not always the same number of media entries, but the last one is always the "hp-video" entry...
						gNewsArticlesArray[newsArticlesCount]["imgS"] = items[i].getElementsByTagName("media:content")[mediaArrayLength -1].getAttribute("url");
						
						gNewsArticlesArray[newsArticlesCount]["url"] = items[i].getElementsByTagName("link")[0].childNodes[0].nodeValue;

						// The RSS feed provides the image URL as https, while being available as http too. Need that version when displaying image in the browser.
						imgUrlNonSecure = gNewsArticlesArray[newsArticlesCount]["imgS"].replace("https://", "http://");
						gNewsArticlesArray[newsArticlesCount]["img"] = imgUrlNonSecure;

						// console.log(gNewsArticlesArray[newsArticlesCount].img + ":" + gNewsArticlesArray[newsArticlesCount].title + ":" + gNewsArticlesArray[newsArticlesCount].description + ":" + gNewsArticlesArray[newsArticlesCount].url);
						
						newsArticlesCount++;
					}		
				}
			}
			
			// Did any articles even get successfully added?
			if (newsArticlesCount > 0 ) 
			{
				addArticles(gNewsArticlesArray);
				// All good at this point then, there were no parse errors either
				gNewsRequestFailureCount = 0;	// Reset it back after a successful result
			}
			else
			{
				logger("No articles were successfully processed from the returned RSS feed.")
				console.log(responseXML);
				gNewsRequestFailureCount = 0;	// Reset it back for the next run
				refreshArticlesError();
			}
			
		}
		catch (error)
		{
			logger("An error occured when processing the CNN News Response: " + error);
			console.log(responseXML);
			gNewsRequestFailureCount = 0;	// Reset it back for the next run
			refreshArticlesError();
		}

	}

}

	/////////////////////// SERVICE REQUESTS HANDLING	////////////////////

function analyseSubmittedArticle () {

	try {
		// (1) First lock the button from further submission
		submitButtonProcessingStart();
		logger("========================");

		// (2) Show which article was submitted-article
		addSubmittedArticle();

		// (3) Reset the results
		resetResults();
		gServiceResponsesReceived = 0;

		// (4) Submit to Image Analysis
		sendGoogleImageRequest (gSubmittedNewsArticle);
		sendAzureImageRequest (gSubmittedNewsArticle);
		sendAwsImageRequest (gSubmittedNewsArticle);


		// (5) Submit to Sentiment Analysis
		sendGoogleSentimentRequest (gSubmittedNewsArticle);
		sendAzureSentimentRequest (gSubmittedNewsArticle);
		sendAwsSentimentRequest (gSubmittedNewsArticle);


		// (6) Unlock button for new submissions
		setTimeout(submitButtonProcessingEnd, 4000);	// Will wait an initial 4 seconds to complete
	}
	catch(error)
	{
		console.error(error);
	}

}

function addSubmittedArticle () {

	gSubmittedNewsArticle = gNewsArticlesArray[gSelectedNewsID];
	var submittedArticleDiv = '<div class="submitted-row" id="row:submitted-article"> <div class="submitted-image"><a href="' + gSubmittedNewsArticle.url + '" target="_blank"><img src="' + gSubmittedNewsArticle.imgS + '"></a></div> <div class="submitted-text"> <p> <b>' + gSubmittedNewsArticle.title + '</b><br>' + gSubmittedNewsArticle.description + ' (<a href="' + gSubmittedNewsArticle.url + '" target="_blank"><u>Article Link.</u></a>) </p> </div> </div> <br>';

	document.getElementById("submitted-article-container").innerHTML = submittedArticleDiv;


}

function resetResults () {

		// (1) Clear the image label divs
		document.getElementById("image-analysis:aws").innerHTML =  "&ltWaiting for response&gt";
		document.getElementById("image-analysis:azure").innerHTML =  "&ltWaiting for response&gt";
		document.getElementById("image-analysis:google").innerHTML =  "&ltWaiting for response&gt";

		document.getElementById("sentiment-analysis:aws").innerHTML =  "<img src='waiting.png'>";
		document.getElementById("sentiment-analysis:azure").innerHTML =  "<img src='waiting.png'>";
		document.getElementById("sentiment-analysis:google").innerHTML =  "<img src='waiting.png'>";

		// (2) If this is the first run, show the Solace div now
		document.getElementById("solace").style = "display: true" ;

		// (3) Make the results pane be in full view
		document.getElementById("results-footer").scrollIntoView(false);


}


	///////////////////////////////////////////////////	SERVICE SENDS	///////////////////////////////////////////////////////////////////////

function sendGoogleImageRequest () {

	var requestJson =
			{
			  "requests": [
				{
				  "image": {
					"source": {
					  "imageUri": gSubmittedNewsArticle.img
					}
				  },
				  "features": [
					{
					  "type": "LABEL_DETECTION"
					}
				  ]
				}
			  ]
			}

	var requestText = JSON.stringify(requestJson);
	var topicName = "POST/v1/images:annotate";
	requestor.sendRequest("GoogleImage", requestText, topicName);
}

function sendGoogleSentimentRequest () {

	var requestJson =
		{
		  "encodingType": "UTF8",
		  "document":
			{
				"type": "PLAIN_TEXT",
				"content": gSubmittedNewsArticle.title + " " + gSubmittedNewsArticle.description
			}
		}

	var requestText = JSON.stringify(requestJson);
	var topicName = "POST/v1/documents:analyzeSentiment";
	requestor.sendRequest("GoogleSentiment", requestText, topicName);
}


function sendAzureImageRequest () {


	var requestJson =
		{
			"url": gSubmittedNewsArticle.img
		}

	var requestText = JSON.stringify(requestJson);
	var topicName = "POST/vision/v1.0/tag";
	requestor.sendRequest("AzureImage", requestText, topicName);
}

function sendAzureSentimentRequest () {

	var requestJson =
		{
			"documents": [
				{
					"language": "en",
					"id": "1",
					"text": gSubmittedNewsArticle.title + " " + gSubmittedNewsArticle.description
				}
			]
		}

	var requestText = JSON.stringify(requestJson);
	var topicName = "POST/text/analytics/v2.0/sentiment";
	requestor.sendRequest("AzureSentiment", requestText, topicName);
}

function sendAwsImageRequest () {


	var requestJson =
		{
			"type":"image",
			"url": gSubmittedNewsArticle.img
		}

	var requestText = JSON.stringify(requestJson);
	var topicName = "POST/aws/lambda/1";
	requestor.sendRequest("AWSImage", requestText, topicName);
}

function sendAwsSentimentRequest () {

	var requestJson =
		{
			"type": "sentiment",
			"text": gSubmittedNewsArticle.title + " " + gSubmittedNewsArticle.description
		}

	var requestText = JSON.stringify(requestJson);
	var topicName = "POST/aws/lambda/1";
	requestor.sendRequest("AWSSentiment", requestText, topicName);
}

	///////////////////////////////////////////////		SERVICE RESPONSES 	//////////////////////////////////////////////////////////

// Function to route the response to the right handler
function processReceivedResponse (correlationID, response)
{
	//console.log(response);	// DEBUG
	if (typeof correlationID == 'undefined')
	{
		// Received some errant response, ignore it...
		logger("Ignoring a response received with no correlation ID");
	}
	else
	{
		// Route it to the correct handler
		switch (correlationID)
		{
			
			case "BBCNews":
				processBBCNewsResponse (response);
				break;

			case "CNNNews":
				processCNNNewsResponse (response);
				break;
				
			case "GoogleImage":
				processGoogleImageResponse (response);
				break;

			case "GoogleSentiment":
				processGoogleSentimentResponse (response);
				break;

			case "AzureImage":
				processAzureImageResponse (response);
				break;

			case "AzureSentiment":
				processAzureSentimentResponse (response);
				break;

			case "AWSImage":
				processAwsImageResponse (response);
				break;

			case "AWSSentiment":
				processAwsSentimentResponse (response);
				break;

			default:
				logger("Ignoring response with unrecognised correlation ID: " + correlationID);
				break;
		}

	}

}


function processGoogleImageResponse (response)
{
	var serviceName = "Google";
	logger("Processing " + serviceName + " Image Response...");

	var responseStatus = isResponseFailed(response);
	if (responseStatus.failed && gGoogleImageRequestFailureCount < cMaxServiceFailureCount)
	{
		// Failed for whatever reason, got another chance though...
		gGoogleImageRequestFailureCount++;
		logger(serviceName + " Image Service returned an error. Trying again... (Error: \"" + responseStatus.message + "\")");
		sendGoogleImageRequest (gSubmittedNewsArticle);
		return;
	}

	gServiceResponsesReceived++; // Done waiting on this service. (Either success or fail.)

	if (responseStatus.failed && gGoogleImageRequestFailureCount == cMaxServiceFailureCount)
	{
		processImageServiceFailure (serviceName, responseStatus.message);
		// Reset the count for the next manual submit
		gGoogleImageRequestFailureCount = 0;
	}
	else
	{
		// All good at this point then
		gGoogleImageRequestFailureCount = 0;
		var labelsString = "";
		var labelCount = 0;

		var labelsArray = response.responses[0].labelAnnotations;

		for(var i = 0; i < labelsArray.length; i++)
		{
			var label = labelsArray[i].description;
			var score = labelsArray[i].score * 100;

			labelsString = labelsString + label + "&emsp;[" + score.toFixed(2) + "%] <br>"
			labelCount++;
		}

		var summaryString = "=> " + labelCount + " Labels returned <br>";
		document.getElementById("image-analysis:google").innerHTML =  summaryString + labelsString;
	}

}

function processGoogleSentimentResponse (response)
{
	var serviceName = "Google";
	logger("Processing " + serviceName + " Sentiment Response...");

	var responseStatus = isResponseFailed(response);
	if (responseStatus.failed && gGoogleSentimentRequestFailureCount < cMaxServiceFailureCount)
	{
		// Failed for whatever reason, got another chance though...
		gGoogleSentimentRequestFailureCount++;
		logger(serviceName + " Sentiment Service returned an error. Trying again... (Error: \"" + responseStatus.message + "\")");
		sendGoogleSentimentRequest (gSubmittedNewsArticle);
		return;
	}

	gServiceResponsesReceived++; // Done waiting on this service. (Either success or fail.)

	if (responseStatus.failed && gGoogleSentimentRequestFailureCount == cMaxServiceFailureCount)
	{
		processSentimentServiceFailure (serviceName, responseStatus.message);

		// Reset the count for the next manual submit
		gGoogleSentimentRequestFailureCount = 0;
	}
	else
	{
		// All good at this point then
		gGoogleSentimentRequestFailureCount = 0;
		var sentimentFloat = response.documentSentiment.score;
		var sentimentText = "";

		if ( sentimentFloat < -0.25 )
		{
			sentimentText = "negative";
		}
		else if (sentimentFloat > 0.25 )
		{
			sentimentText = "positive";
		}
		else
		{
			sentimentText = "neutral";
		}

		document.getElementById("sentiment-analysis:google").innerHTML =  "<img src='" + sentimentText + ".png' title='" + sentimentFloat + " in a range of -1.0 to 1.0, negative to positive'>";
	}

}


function processAzureImageResponse (response)
{

	var serviceName = "Azure";
	logger("Processing " + serviceName + " Image Response...");
	var responseStatus = isResponseFailed(response);
	if (responseStatus.failed && gAzureImageRequestFailureCount < cMaxServiceFailureCount)
	{
		// Failed for whatever reason, got another chance though...
		gAzureImageRequestFailureCount++;
		logger(serviceName + " Image Service returned an error. Trying again... (Error: \"" + responseStatus.message + "\")");
		sendAzureImageRequest (gSubmittedNewsArticle);
		return;
	}

	gServiceResponsesReceived++; // Done waiting on this service. (Either success or fail.)

	if (responseStatus.failed && gAzureImageRequestFailureCount == cMaxServiceFailureCount)
	{
		processImageServiceFailure (serviceName, responseStatus.message);
		// Reset the count for the next manual submit
		gAzureImageRequestFailureCount = 0;
	}
	else
	{
		// All good at this point then
		gAzureImageRequestFailureCount = 0

		var labelsString = "";
		var labelCount = 0;

		var labelsArray = response.tags;

		for(var i = 0; i < labelsArray.length; i++)
		{
			var label = labelsArray[i].name;
			var score = labelsArray[i].confidence * 100;

			labelsString = labelsString + label + "&emsp;[" + score.toFixed(2) + "%] <br>"
			labelCount++;
		}

		var summaryString = "=> " + labelCount + " Labels returned<br>";
		document.getElementById("image-analysis:azure").innerHTML =  summaryString + labelsString;
	}
}

function processAzureSentimentResponse (response)
{

	var serviceName = "Azure";
	logger("Processing " + serviceName + " Sentiment Response...");

	var responseStatus = isResponseFailed(response);
	if (responseStatus.failed && gAzureSentimentRequestFailureCount < cMaxServiceFailureCount)
	{
		// Failed for whatever reason, got another chance though...
		gAzureSentimentRequestFailureCount++;
		logger(serviceName + " Sentiment Service returned an error. Trying again... (Error: \"" + responseStatus.message + "\")");
		sendAzureSentimentRequest (gSubmittedNewsArticle);
		return;
	}

	gServiceResponsesReceived++; // Done waiting on this service. (Either success or fail.)

	if (responseStatus.failed && gAzureSentimentRequestFailureCount == cMaxServiceFailureCount)
	{
		processSentimentServiceFailure (serviceName, responseStatus.message);

		// Reset the count for the next manual submit
		gAzureSentimentRequestFailureCount = 0;
	}
	else
	{
		// All good at this point then
		gAzureSentimentRequestFailureCount = 0;
		var sentimentFloat = response.documents[0].score;
		var sentimentText = "";

		if ( sentimentFloat < 0.5 )
		{
			sentimentText = "negative";
		}
		else if (sentimentFloat > 0.5 )
		{
			sentimentText = "positive";
		}
		else
		{
			sentimentText = "neutral";
		}

		document.getElementById("sentiment-analysis:azure").innerHTML =  "<img src='" + sentimentText + ".png' title='" + sentimentFloat.toFixed(2) + " in a range of 0.0 to 1.0, negative to positive'>";
	}
}


function processAwsImageResponse (response)
{
	var serviceName = "AWS";
	logger("Processing " + serviceName + " Image Response...");

	var responseStatus = isResponseFailed(response);
	if (responseStatus.failed && gAwsImageRequestFailureCount < cMaxServiceFailureCount)
	{
		// Failed for whatever reason, got another chance though...
		gAwsImageRequestFailureCount++;
		logger(serviceName + " Image Service returned an error. Trying again... (Error: \"" + responseStatus.message + "\")");
		sendAwsImageRequest (gSubmittedNewsArticle);
		return;
	}

	gServiceResponsesReceived++; // Done waiting on this service. (Either success or fail.)

	if (responseStatus.failed && gAwsImageRequestFailureCount == cMaxServiceFailureCount)
	{
		processImageServiceFailure (serviceName, responseStatus.message);
		// Reset the count for the next manual submit
		gAwsImageRequestFailureCount = 0;
	}
	else
	{
		// All good at this point then
		gAwsImageRequestFailureCount = 0

		var labelsString = "";
		var labelCount = 0;

		var labelsArray = response.Labels;

		for(var i = 0; i < labelsArray.length; i++)
		{
			var label = labelsArray[i].Name;
			var score = labelsArray[i].Confidence;	// Already a percentage, no multiplication needed.

			labelsString = labelsString + label + "&emsp;[" + score.toFixed(2) + "%] <br>"
			labelCount++;
		}

		var summaryString = "=> " + labelCount + " Labels returned <br>";
		document.getElementById("image-analysis:aws").innerHTML =  summaryString + labelsString;
	}


}

function processAwsSentimentResponse (response)
{

	var serviceName = "AWS";
	logger("Processing " + serviceName + " Sentiment Response...");

	var responseStatus = isResponseFailed(response);
	if (responseStatus.failed && gAwsSentimentRequestFailureCount < cMaxServiceFailureCount)
	{
		// Failed for whatever reason, got another chance though...
		gAwsSentimentRequestFailureCount++;
		logger(serviceName + " Sentiment Service returned an error. Trying again... (Error: \"" + responseStatus.message + "\")");
		sendAwsSentimentRequest (gSubmittedNewsArticle);
		return;
	}

	gServiceResponsesReceived++; // Done waiting on this service. (Either success or fail.)

	if (responseStatus.failed && gAwsSentimentRequestFailureCount == cMaxServiceFailureCount)
	{
		processSentimentServiceFailure (serviceName, responseStatus.message);

		// Reset the count for the next manual submit
		gAzureSentimentRequestFailureCount = 0;
	}
	else
	{
		// All good at this point then
		gAwsSentimentRequestFailureCount = 0;
		var sentimentText = response.Sentiment.toLowerCase();
		var sentimentTextOrig = sentimentText;

		// For that sentiment what was the confidence score?
		var sentimentScore;
		switch (sentimentText)
		{
			case "positive":
				sentimentScore = response.SentimentScore.Positive;
				break;
			case "negative":
				sentimentScore = response.SentimentScore.Negative;
				break;
			case "neutral":
				sentimentScore = response.SentimentScore.Neutral;
				break;
			case "mixed":
				sentimentScore = response.SentimentScore.Mixed;
				break;
		}

		if (sentimentText == "mixed")
		{
			sentimentText = "neutral";	// Best match option to keep in line with others
		}

		document.getElementById("sentiment-analysis:aws").innerHTML =
			"<img src='" + sentimentText + ".png' title='Confidence score of " +
				(sentimentScore * 100).toFixed(2) + "% for " +
				sentimentTextOrig + "'>";
	}

}




// Functions to display the failure state
function processSentimentServiceFailure (serviceName, errorMsg)
{
	var finalErrorMsg = serviceName + " Sentiment Service returned an error: " + errorMsg;

	elementServiceName = "sentiment-analysis:" + serviceName.toLowerCase();
	document.getElementById(elementServiceName).innerHTML = "<img src='unavailable.png' title='" + finalErrorMsg + "'>";
	logger("Final: " + finalErrorMsg);
}
// Functions to display the failure state
function processImageServiceFailure (serviceName, errorMsg)
{
	var finalErrorMsg = serviceName + " Image Service returned an error: <br>" + errorMsg;

	elementServiceName = "image-analysis:" + serviceName.toLowerCase();
	document.getElementById(elementServiceName).innerHTML = "!! " + finalErrorMsg;
	logger("Final: " + finalErrorMsg);
}

// Each of the services have varying error responses. Deal with all the variations here in one place...
function isResponseFailed(response)
{
	var failed = false;
	var message = "";

	if (!response)
	{
		failed = true;
		message = "No response / timed out.";
		return {"failed" :	failed, "message" : message};
	}

	try
	{
		if ("message" in response.error)
		{
			message = response.error.message;
			failed = true;
			return {"failed" :	failed, "message" : message};
		}

	}
	catch (error)
	{
	}

	// The Google Vision Service
	try
	{
		if (("responses" in response) && ("error" in response.responses[0]))
		{
			message = response.responses[0].error.message;
			failed = true;
			return {"failed" :	failed, "message" : message};
		}

	}
	catch (error)
	{
	}


	// Nov 2018 - Google has started sending back an empty response array!! grrr.
	try
	{
		if (("responses" in response) && (response.responses[0].labelAnnotations == null))
		{
			message = "Returned an empty response"
			failed = true;
			return {"failed" :	failed, "message" : message};
		}

	}
	catch (error)
	{
	}


	try
	{
		if ("Message" in response)	// AWS API Gateway has suddenly started this new one...
		{

			if (response.Message.match(/^User: anonymous is not authorized to perform.*/))
			{
				message = "Some strangely intermittent but previously seen authorisation error: '" + response.Message + "'";
				failed = true;
				return {"failed" :	failed, "message" : message};
			}
		}

	}
	catch (error)
	{
	}

	try
	{
		if ("statusCode" in response)	// This is Azure
		{
			message = response.message;
			failed = true;
			return {"failed" :	failed, "message" : message};
		}

	}
	catch (error)
	{
	}




	try
	{
		if ("error" in response)
		{
			message = response.error;
			failed = true;
			return {"failed" :	failed, "message" : message};
		}

	}
	catch (error)
	{
	}

	try
	{
		if ("code" in response)
		{
			message = response.message;
			failed = true;
			return {"failed" :	failed, "message" : message};
		}

	}
	catch (error)
	{
	}

	try
	{
		if ("errors" in response)
		{
			message = response.errors[0].message;
			failed = true;
			return {"failed" :	failed, "message" : message};
		}

	}
	catch (error)
	{
	}

	try
	{
		if ("error" in response.responses[0])
		{
			message = response.responses[0].error.message;
			failed = true;
			return {"failed" :	failed, "message" : message};
		}
		return {"failed" :	failed, "message" : message};
	}
	catch (error)
	{
	}

	return {"failed" :	failed, "message" : message};
}


// Logger
function logger (line)
{
	var now = new Date();
	var time = [('0' + now.getHours()).slice(-2), ('0' + now.getMinutes()).slice(-2),
		('0' + now.getSeconds()).slice(-2)];
	var timestamp = '[' + time.join(':') + '] ';
	console.log(timestamp + line);

}
