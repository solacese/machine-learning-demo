# Demo: Comparing Machine Learning through BBC News Analysis

## What does this demonstrate?

A demo of a web application using [PubSub+ JavaScript Messaging API](https://dev.solace.com/tech/javascript-api/) connecting to public cloud based Machine Learning Functions-as-a-Service (FaaS) over REST, and then comparing the results from each.

The Machine Learning (ML) Functions of 'Sentiment Analysis' and 'Image Analysis' are used from AWS, Azure and Google.

### Cloud Services Used
- AWS: [Comprehend](https://aws.amazon.com/comprehend/) and [Rekognition](https://aws.amazon.com/rekognition/) (via a private REST endpoint created using [API Gateway](https://aws.amazon.com/api-gateway/) and [Lambda](https://aws.amazon.com/lambda/))
- Azure: [Text Analytics](https://azure.microsoft.com/en-us/services/cognitive-services/text-analytics/) and [Computer Vision](https://azure.microsoft.com/en-us/services/cognitive-services/computer-vision/) (via public REST endpoints)
- Google: [Natural Language](https://cloud.google.com/natural-language/) and [Vision](https://cloud.google.com/vision/) (via public REST endpoints)

### Real-time Data Sources

The data source for images and text for ML analysis is real-time [BBC News](https://bbc.co.uk/news) as provided via their [RSS feeds](https://www.bbc.co.uk/news/10628494#userss). (Also accessed via the PubSub+ broker as a REST GET operation.)

  
### Solace PubSub+ features used
- [REST Microgateway](https://docs.solace.com/Features/Microgateway-Concepts/Microgateway-Use-Cases.htm)
- [Request/Reply Messaging](https://docs.solace.com/Messaging-Basics/Core-Concepts-Message-Models.htm#Request-)
- [WebSockets Messaging](https://docs.solace.com/Solace-PubSub-Messaging-APIs/JavaScript-API/Web-Messaging-Concepts/Web-Messaging-Architectures.htm)

**Try the live demo in action here:
http://london.solace.com/cloud-analytics/machine-learning.html**

### Other Useful Links
- [An example results image](website-files/example-result-1.png)
- [Read the medium.com article on this demo.](https://medium.com/solacedotcom/comparing-machine-learning-through-bbc-news-analysis-84ad9d7b1c94)
- [Sentiment Analysis - Wikipedia](https://en.wikipedia.org/wiki/Sentiment_analysis)
- [Image Analysis - Wikipedia](https://en.wikipedia.org/wiki/Image_analysis)


## Contents

This repository contains:

1. **[website-files](website-files/):** HTML and JavaScript files to run a local version of the website. This will still connect to the Solace PubSub+ broker as hosted at london.solace.com. 
2. **[pubsubplus-config](pubsubplus-config/):** Configuration and instructions to create your own PubSub+ Broker to support an independent copy of this demo application. 
3. **[other-files](other-files/):** Other supporting configuration/files required for this demo. Namely, configuration for an [nginx HTTP proxy server](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/) to centrally inject API keys/tokens to the outbound REST calls made by the PubSub+ Broker.

## Checking out

To check out the project, clone this GitHub repository:

```
git clone https://github.com/solacese/machine-learning-demo
cd machine-learning-demo
```

## Running the Demo

To run the demo open the below html file in your default browser:

```
start ./website-files/machine-learning.html
```

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## Authors

See the list of [contributors](https://github.com/solacese/machine-learning-demo/graphs/contributors) who participated in this project.

## License

This project is licensed under the Apache License, Version 2.0. - See the [LICENSE](LICENSE) file for details.

## Resources

For more information try these resources:

- The Solace Developer Portal website at: http://dev.solace.com
- Get a better understanding of [Solace technology](http://dev.solace.com/tech/).
- Check out the [Solace blog](http://dev.solace.com/blog/) for other interesting discussions around Solace technology
- Ask the [Solace community.](http://dev.solace.com/community/)
