#!/bin/env node
Array.prototype.unique = function(a){
  return function(){return this.filter(a)}}(function(a,b,c){return c.indexOf(a,b+1)<0
});

var IPADDRESS = process.env.OPENSHIFT_NODEJS_IP;
var PORT      = process.env.OPENSHIFT_INTERNAL_PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080;

var DEBUG=false;

if (typeof IPADDRESS === "undefined") {
    //  Log errors on OpenShift but continue w/ 127.0.0.1 - this
    //  allows us to run/test the app locally.
    console.warn('No OPENSHIFT_NODEJS_IP var, using 127.0.0.1');
    IPADDRESS = "127.0.0.1";
};

var config = require("./config"),
    http = require('http'), 
    util = require('util'),
    request = require('request'),
    qs = require('querystring');

var app = require('express')();
var fs      = require('fs');
var server = require('http').Server(app);
var io = require('socket.io')(server);

io.set('origins', '*:*');
//io.set('transports', ['websocket']);

var Twit = require('twit')

var LanguageDetect = require('languagedetect');
var lngDetector = new LanguageDetect();

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', 'true');

    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }
};

//...
app.configure(function() {
    app.use(require('express').methodOverride());
    app.use(allowCrossDomain);
});



// The root path should serve the client HTML.
app.get('/', function (req, res) {
    res.sendfile(__dirname + '/placeholder.html');
});
app.get("/health",function (req, res) {
    res.send('1');
});

var oauth=config.oauth;

//Topics to analyze
var track="alfano,grillo,berlusconi,renzi,conte,tavecchio";

var params={
  track:track
};

var tweets=[];


var aliases={
  
};

//Hold some stats on the topics
var stats={
  topics:{
    "conte":0,
    "grillo":0,
    "berlusconi":0,
    "tavecchio":0,
    "renzi":0,
    "alfano":0
  }
};

var words=track.split(","),
    l_words=words.length;

//Start server
server.listen(PORT, IPADDRESS, function() {
    console.log('%s: Node server started on %s:%d ...',
                Date(Date.now() ), IPADDRESS, PORT);
});

//Intialize Web Socket via socket.io
io.on('connection', function (socket) {
  console.log("connect")
  
  socket.emit('open', { status: 'connected' });

  socket.on('disconnect', function () {
    if(DEBUG) {
      console.log("disconnect")
    }
    io.sockets.emit('close',{status:"disconnected"});
  });

});

//Initialize Twitter API Client
var T = new Twit({
    consumer_key:         config.oauth.consumer_key
  , consumer_secret:      config.oauth.consumer_secret
  , access_token:         config.oauth.token
  , access_token_secret:  config.oauth.token_secret
})
  
function createRequest() {
  var oauth=config.oauth;

  //Initialize stream of tweets
  var stream = T.stream('statuses/filter',{ 
      track: params.track
    });
  
  //Listener on tweets coming in from the streaming API
  stream.on('tweet', function (tweet) {
    
    //Only use tweets in Italian during the day (06:00 - 23:00). In the night show tweets in any language.
    if(tweet.lang!="it" && tweet.lang!='und') {
      
      var date = new Date(tweet.created_at)
          h = date.getHours(),
          tz = date.getTimezoneOffset()/60;
      if (h<(23-tz) && h>=(6-tz)) {
        return;
      }
    }
    if(DEBUG) {
      console.log(tweet.lang)
    }

    var __topics=calculateTopic(tweet.text);

    for(var i=0;i<__topics.length;i++) {
      if (DEBUG) {
        console.log("sending",__topics[i])
      }
      sendTweet(__topics[i],tweet);
    }

  })

}
createRequest();

//XHR service to send buffered data at the beginning of the visualization to
//avoid empty starting sea
app.get('/data', function (req, res) {
  if(DEBUG) {
   console.log("request for data")
  }

  res.send(JSON.stringify(tweets));

});

//Analyze, prepare, package and emit the tweet via web socket
function sendTweet(c,d) {
    if (DEBUG) {
      console.log("SENDING TWEET")
      console.log(d)
      console.log(c,aliases[c]?aliases[c]:c)
    }
    
    //Create Tweet/Wave
    var t={
      c:c,
      t:new Date(d.created_at).getTime(),
      d:d.text,
      id:d.id_str,
      uid:d.user.id,
      name:d.user.name,
      sname:d.user.screen_name,
      f:d.user.followers_count,
      l:d.lang,
      h:d.hashtags || [],
      r_id:d.in_reply_to_status_id_str || -1
    };
    
    if(d.hashtags) {
      t.h=doc.hashtags;
    }
    if(d.in_reply_to_status_id_str) {
      t.r_id=d.in_reply_to_status_id_str;
    }
    if(tweets.length>1) {
      var t_last=tweets[tweets.length-1].t;
      //keep a buffer 1 minute and 30 seconds of tweets
      tweets=tweets.filter(function(d){
        return (d.t > (t_last - (1000*60+1000*30)));
      });
    }
    //limit buffer to 100 tweets
    if(tweets.length>100) {
      tweets=tweets.slice(tweets.length-100,tweets.length);
    }
    tweets.push(t);

    //emit the tweet via socket
    io.sockets.emit('tweet',t);
}

//Analyze which topics are talked about in the text
function calculateTopic(text) {
  var topics=[];
  
  for(var c in stats.topics) {
    if(text.toLowerCase().indexOf(c)!=-1) {
      stats.topics[c]++;
      topics.push(c);
    }
  }

  return topics.unique();
}