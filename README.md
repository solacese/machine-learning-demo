# machine-learning-demo
Demo of a web application using PubSub+ JavaScript API connecting to public cloud based Machine Learning Functions-as-a-Service (FaaS)

Machine Learning Functions of 'Image Analysis' and 'Sentiment Analysis' are used from the following providers:

- AWS: Comprehend and Rekognition (via API Gateway and Lambda)

  https://aws.amazon.com/comprehend/
  
  https://aws.amazon.com/rekognition/

- Azure: Text Analytics and Computer Vision

  https://azure.microsoft.com/en-us/services/cognitive-services/text-analytics/
  
  https://azure.microsoft.com/en-us/services/cognitive-services/computer-vision/

- Google: Natural Language and Vision

  https://cloud.google.com/natural-language/
  
  https://cloud.google.com/vision/
  
  
Solace features used:
- REST Microgateway

  https://docs.solace.com/Features/Microgateway-Concepts/Microgateway-Use-Cases.htm


The data source for images and text for analysis is real-time BBC News as provided from their RSS feeds. (Also accessed via the PubSub+ broker as a REST GET operation.)

View the demo in action here:
http://london.solace.com/cloud-analytics/machine-learning.html
