# machine-learning-demo

**What does this demonstrate?**

A demo of a web application using [PubSub+ JavaScript Messaging API](https://dev.solace.com/tech/javascript-api/) connecting to public cloud based Machine Learning Functions-as-a-Service (FaaS) over REST.

The Machine Learning (ML) Functions of 'Sentiment Analysis' and 'Image Analysis' are used from AWS, Azure and Google.

**Cloud Services Used:**
- AWS: [Comprehend](https://aws.amazon.com/comprehend/) and [Rekognition](https://aws.amazon.com/rekognition/) (via a private REST endpoint created using [API Gateway](https://aws.amazon.com/api-gateway/) and [Lambda](https://aws.amazon.com/lambda/))
- Azure: [Text Analytics](https://azure.microsoft.com/en-us/services/cognitive-services/text-analytics/) and [Computer Vision](https://azure.microsoft.com/en-us/services/cognitive-services/computer-vision/) (via public REST endpoints)
- Google: [Natural Language](https://cloud.google.com/natural-language/) and [Vision](https://cloud.google.com/vision/) (via public REST endpoints)

**Real-time Data Sources**

The data source for images and text for ML analysis is real-time [BBC News](https://bbc.co.uk/news) as provided via their [RSS feeds](https://www.bbc.co.uk/news/10628494#userss). (Also accessed via the PubSub+ broker as a REST GET operation.)

  
**Solace PubSub+ features used:**
- [REST Microgateway](https://docs.solace.com/Features/Microgateway-Concepts/Microgateway-Use-Cases.htm)
- [Request/Reply Messaging](https://docs.solace.com/Messaging-Basics/Core-Concepts-Message-Models.htm#Request-)
- [WebSockets Messaging](https://docs.solace.com/Solace-PubSub-Messaging-APIs/JavaScript-API/Web-Messaging-Concepts/Web-Messaging-Architectures.htm)

**View the live demo in action here:
http://london.solace.com/cloud-analytics/machine-learning.html**

**Other Useful Links**
- [An example results image](website-files/example-result-1.png)
- [Read the medium.com article on this demo.](https://medium.com/solacedotcom/comparing-machine-learning-through-bbc-news-analysis-84ad9d7b1c94)
- [Sentiment Analysis - Wikipedia](https://en.wikipedia.org/wiki/Sentiment_analysis)
- [Image Analysis - Wikipedia](https://en.wikipedia.org/wiki/Image_analysis)

