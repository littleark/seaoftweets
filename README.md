Sea of Tweets
=========

Real time visualization of tweets.

  - Visualize tweets in real time through the Streaming API
  - Tweets as *Waves* (height and length of the tail based on followers)
  - Based on Node.js and Socket.IO
  - Ready to be published on OpenShift

The project started as a real time visualization of what Italians were talking about during the election in 2013. Later on it has evolved into a more generic visualization of what Italians are talking about (mailny politicians though).


Version
----

1.0

Tech
-----------

Sea of Tweets uses a number of technologies to work properly:

* [Node.js] - evented I/O for the backend
* [Socket.IO] - real-time bidirectional event-based communication
* [Twit] - Twitter API Client for node
* [D3.js] - JavaScript library for manipulating documents based on data
* [Node.js] - evented I/O for the backend
* [Express] - fast node.js network app framework [@tjholowaychuk]

Usage
--------------

##### Download all the Node.js needed modules

```sh
npm install
```
&nbsp;
##### Create a config.js file based on the template and set it up with the credentials provided for the [Twitter Streaming APIs]
```sh
cp config.template.js config.js
```
&nbsp;
##### Launch stream.js [pre-configured to work on a standard *localhost* installation and on [Openshift].
```sh
node stream.js
```
&nbsp;
##### Configure your client at web/js/c.js, setting HOST and PORT to your configuration (line 1 and 2).
&nbsp;
#### Open your browser at the location web/index.html - It should work!
&nbsp;
&nbsp;
License
----

MIT


[Socket.IO]: http://socket.io
[Node.js]:http://nodejs.org
[express]:http://expressjs.com
[Twit]:https://github.com/ttezel/twit
[D3.js]:http://d3js.org
[Twitter Streaming APIs]:https://dev.twitter.com/streaming/overview
[Openshift]: https://www.openshift.com/