# machine-learning-demo
Demo of a web application using PubSub+ JavaScript API connecting to public cloud based Machine Learning Functions-as-a-Service (FaaS)

Machine Learning Functions of 'Image Analysis' and 'Sentiment Analysis' are used from the following providers:

- AWS: [Comprehend](https://aws.amazon.com/comprehend/) and [Rekognition](https://aws.amazon.com/rekognition/) (via a private REST endpoint created using [API Gateway](https://aws.amazon.com/api-gateway/) and [Lambda](https://aws.amazon.com/lambda/))
- Azure: [Text Analytics](https://azure.microsoft.com/en-us/services/cognitive-services/text-analytics/) and [Computer Vision](https://azure.microsoft.com/en-us/services/cognitive-services/computer-vision/) (via public REST endpoints)
- Google: [Natural Language](https://cloud.google.com/natural-language/) and [Vision](https://cloud.google.com/vision/) (via public REST endpoints)

  
Solace features used:
- [REST Microgateway](https://docs.solace.com/Features/Microgateway-Concepts/Microgateway-Use-Cases.htm)

The data source for images and text for analysis is real-time [BBC News](https://bbc.co.uk/news) as provided via their [RSS feeds](https://www.bbc.co.uk/news/10628494#userss). (Also accessed via the PubSub+ broker as a REST GET operation.)

View the demo in action here:
http://london.solace.com/cloud-analytics/machine-learning.html

[Click for an example result](example-result-1.png)

