;(function(e,t,n){function i(n,s){if(!t[n]){if(!e[n]){var o=typeof require=="function"&&require;if(!s&&o)return o(n,!0);if(r)return r(n,!0);throw new Error("Cannot find module '"+n+"'")}var u=t[n]={exports:{}};e[n][0].call(u.exports,function(t){var r=e[n][1][t];return i(r?r:t)},u,u.exports)}return t[n].exports}var r=typeof require=="function"&&require;for(var s=0;s<n.length;s++)i(n[s]);return i})({1:[function(require,module,exports){

function include(script) {
    $.ajax({
        url: script,
        dataType: "script",
        async: false,           // <-- This is the key
        success: function () {
            // all good...
        },
        error: function () {
            throw new Error("Could not load script " + script);
        }
    });
}

include("/harkxsocket/assets/js/ie-emulation-modes-warning.js");
include("/harkxsocket/Scripts/XSockets.latest.min.js");
include("/harkxsocket/Scripts/XSockets.WebRTC.latest.js");
include("/harkxsocket/dist/js/bootstrap.min.js");
include("/harkxsocket/assets/js/ie10-viewport-bug-workaround.js");

var hark = require('../hark.js');

var bows = require('bows');

var tagVolumes = [];

var streamVolumes = [];
var referenceVolumes = [];
for (var i = 0; i < 100; i++) {
  tagVolumes.push(-100);
  streamVolumes.push(-100);
  referenceVolumes.push(-50);
}

(function() {

          var brokerController, context, ws, webRTC, localid;
          
            // connect to the server using a predefined context (a.k.a room )
            // we pass a 'static' guid as a parameters , see ctx below
            context = '1c743b9b-f19f-4b74-a472-4081dbc14f43';
            
            ws = new XSockets.WebSocket("wss://rtcplaygrouund.azurewebsites.net:443", ["connectionbroker"], {
                ctx: context
            }); 

            var onError = function(err) {
              console.log("error:", err);
            };
            
                var addRemoteVideo = function(peerId,mediaStream) {
                    
                    var remoteVideo = document.createElement("video");
                    remoteVideo.setAttribute("id", mediaStream.id);
                    remoteVideo.setAttribute("autoplay", "autoplay");
                    remoteVideo.setAttribute("height", "200");
                    remoteVideo.setAttribute("width", "200");
                    remoteVideo.setAttribute("class","vid-circle");
                    remoteVideo.setAttribute("rel",peerId);
                    attachMediaStream(remoteVideo, mediaStream);
                    $("#remotevideos").append(remoteVideo);
                    console.log("remote id is: ", peerId);
            
                    
                };


                var onConnectionLost = function (remotePeer) {
                    console.log("onconnectionlost");
                    var peerId = remotePeer.PeerId;
                    var videoToRemove = $("video[rel='" + peerId + "']");
                    videoToRemove.remove();
                    //$("#remotevideos").removeChild(videoToRemove);
                };


                var oncConnectionCreated = function() {
                    console.log("oncconnectioncreated", arguments);
                }

                var onGetUerMedia = function(stream) {
                    console.log("Successfully got some userMedia , hopefully a goat will appear..");
                    webRTC.connectToContext(); // connect to the current context?
                };

                var onRemoteStream = function (remotePeer) {    
                    addRemoteVideo(remotePeer.PeerId, remotePeer.stream);
                    console.log("Opps, we got a remote stream. lets see if its a goat..");
                };

                
                var onLocalStream = function(mediaStream) {
                    console.log("Got a localStream", mediaStream.id);
                    localid = mediaStream.id;
                    //attachMediaStream($(".localvideo video "), mediaStream);
                    var videoTag = document.getElementById('localVideoStream');

                    attachMediaStream(videoTag, mediaStream);    

                    var notification = document.querySelector('#userSpeaking');
                    var speechEvents = hark(mediaStream);

                    speechEvents.on('speaking', function() {
                      notification.style.display = 'block';
                      console.log('speaking');
                      //$("#localVideoStream").width(300).height(300);
                       // Lets notify/share others,
                      brokerController.publish("StreamInfo", { peerId: mediaStream.id,streamInfo: 1 });
                    });

                    speechEvents.on('volume_change', function(volume, threshold) {
                      console.log(volume, threshold)
                      streamVolumes.push(volume);
                      streamVolumes.shift();
                    });

                    speechEvents.on('stopped_speaking', function() {
                      notification.style.display = 'none';
                      console.log('stopped_speaking');

                       // Lets notify/share others,
                      brokerController.publish("StreamInfo", { peerId: mediaStream.id,streamInfo: 0 });
                    });

                   
                };

                var onContextCreated = function(ctx) {
                    console.log("RTC object created, and a context is created - ", ctx);
                    webRTC.getUserMedia(webRTC.userMediaConstraints.hd(true), onGetUerMedia, onError);
                };

                var onOpen = function() {
                    

                    console.log("Connected to the brokerController - 'connectionBroker'");

                    webRTC = new XSockets.WebRTC(this);
                    webRTC.onlocalstream = onLocalStream;
                    webRTC.oncontextcreated = onContextCreated;
                    webRTC.onconnectioncreated = oncConnectionCreated;
                    webRTC.onconnectionlost = onConnectionLost;
                   
                    webRTC.onremotestream = onRemoteStream;

                    
                    brokerController.subscribe('StreamInfo', function (data) {
                
                        console.log(data);
                        var notification = document.querySelector('#remoteuserspeaking');
                        if (data.streamInfo == 1 && data.peerId != localid){
                            console.log("subscribe remote id is: ", data.peerId);
                            notification.style.display = 'block';
                            $("video[id='" + data.peerId + "']").width(300).height(300);
                        }
                        else if (data.streamInfo == 0 && data.peerId != null){
                            notification.style.display = 'none';
                            $("video[id='" + data.peerId + "']").width(200).height(200);
                        }

                    });
                };

                var onConnected = function() {
                    console.log("connection to the 'broker' server is established");
                    console.log("Try get the broker controller form server..");
                    brokerController = ws.controller("connectionbroker");
                    brokerController.onopen = onOpen;
                };
                
                ws.onconnected = onConnected;  

})();


},{"../hark.js":2,"attachmediastream":5,"bows":3,"getusermedia":4}],4:[function(require,module,exports){
// getUserMedia helper by @HenrikJoreteg
var func = (navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia);

},{}],5:[function(require,module,exports){
module.exports = function (stream, el, options) {
    var URL = window.URL;
    var opts = {
        autoplay: true,
        mirror: false,
        muted: false
    };
    var element = el || document.createElement('video');
    var item;

    if (options) {
        for (item in options) {
            opts[item] = options[item];
        }
    }

    if (opts.autoplay) element.autoplay = 'autoplay';
    if (opts.muted) element.muted = true;
    if (opts.mirror) {
        ['', 'moz', 'webkit', 'o', 'ms'].forEach(function (prefix) {
            var styleName = prefix ? prefix + 'Transform' : 'transform';
            element.style[styleName] = 'scaleX(-1)';
        });
    }

    // this first one should work most everywhere now
    // but we have a few fallbacks just in case.
    if (URL && URL.createObjectURL) {
        element.src = URL.createObjectURL(stream);
    } else if (element.srcObject) {
        element.srcObject = stream;
    } else if (element.mozSrcObject) {
        element.mozSrcObject = stream;
    } else {
        return false;
    }

    return element;
};

},{}],2:[function(require,module,exports){
var WildEmitter = require('wildemitter');

function getMaxVolume (analyser, fftBins) {
  var maxVolume = -Infinity;
  analyser.getFloatFrequencyData(fftBins);

  for(var i=4, ii=fftBins.length; i < ii; i++) {
    if (fftBins[i] > maxVolume && fftBins[i] < 0) {
      maxVolume = fftBins[i];
    }
  };

  return maxVolume;
}


var audioContextType = window.AudioContext || window.webkitAudioContext;
// use a single audio context due to hardware limits
var audioContext = null;
module.exports = function(stream, options) {
  var harker = new WildEmitter();


  // make it not break in non-supported browsers
  if (!audioContextType) return harker;

  //Config
  var options = options || {},
      smoothing = (options.smoothing || 0.1),
      interval = (options.interval || 50),
      threshold = options.threshold,
      play = options.play,
      history = options.history || 10,
      running = true;

  //Setup Audio Context
  if (!audioContext) {
    audioContext = new audioContextType();
  }
  var sourceNode, fftBins, analyser;

  analyser = audioContext.createAnalyser();
  analyser.fftSize = 512;
  analyser.smoothingTimeConstant = smoothing;
  fftBins = new Float32Array(analyser.fftSize);

  if (stream.jquery) stream = stream[0];
  if (stream instanceof HTMLAudioElement || stream instanceof HTMLVideoElement) {
    //Audio Tag
    sourceNode = audioContext.createMediaElementSource(stream);
    if (typeof play === 'undefined') play = true;
    threshold = threshold || -50;
  } else {
    //WebRTC Stream
    sourceNode = audioContext.createMediaStreamSource(stream);
    threshold = threshold || -50;
  }

  sourceNode.connect(analyser);
  if (play) analyser.connect(audioContext.destination);

  harker.speaking = false;

  harker.setThreshold = function(t) {
    threshold = t;
  };

  harker.setInterval = function(i) {
    interval = i;
  };

  harker.stop = function() {
    running = false;
    harker.emit('volume_change', -100, threshold);
    if (harker.speaking) {
      harker.speaking = false;
      harker.emit('stopped_speaking');
    }
    analyser.disconnect();
    sourceNode.disconnect();
  };
  harker.speakingHistory = [];
  for (var i = 0; i < history; i++) {
      harker.speakingHistory.push(0);
  }

  // Poll the analyser node to determine if speaking
  // and emit events if changed
  var looper = function() {
    setTimeout(function() {

      //check if stop has been called
      if(!running) {
        return;
      }

      var currentVolume = getMaxVolume(analyser, fftBins);

      harker.emit('volume_change', currentVolume, threshold);

      var history = 0;
      if (currentVolume > threshold && !harker.speaking) {
        // trigger quickly, short history
        for (var i = harker.speakingHistory.length - 3; i < harker.speakingHistory.length; i++) {
          history += harker.speakingHistory[i];
        }
        if (history >= 2) {
          harker.speaking = true;
          harker.emit('speaking');
        }
      } else if (currentVolume < threshold && harker.speaking) {
        for (var i = 0; i < harker.speakingHistory.length; i++) {
          history += harker.speakingHistory[i];
        }
        if (history == 0) {
          harker.speaking = false;
          harker.emit('stopped_speaking');
        }
      }
      harker.speakingHistory.shift();
      harker.speakingHistory.push(0 + (currentVolume > threshold));

      looper();
    }, interval);
  };
  looper();


  return harker;
}

},{"wildemitter":6}],6:[function(require,module,exports){
/*
WildEmitter.js is a slim little event emitter by @henrikjoreteg largely based
on @visionmedia's Emitter from UI Kit.

Why? I wanted it standalone.

I also wanted support for wildcard emitters like this:

emitter.on('*', function (eventName, other, event, payloads) {

});

emitter.on('somenamespace*', function (eventName, payloads) {

});

Please note that callbacks triggered by wildcard registered events also get
the event name as the first argument.
*/

module.exports = WildEmitter;

function WildEmitter() { }

WildEmitter.mixin = function (constructor) {
    var prototype = constructor.prototype || constructor;

    prototype.isWildEmitter= true;

    // Listen on the given `event` with `fn`. Store a group name if present.
    prototype.on = function (event, groupName, fn) {
        this.callbacks = this.callbacks || {};
        var hasGroup = (arguments.length === 3),
            group = hasGroup ? arguments[1] : undefined,
            func = hasGroup ? arguments[2] : arguments[1];
        func._groupName = group;
        (this.callbacks[event] = this.callbacks[event] || []).push(func);
        return this;
    };

    // Adds an `event` listener that will be invoked a single
    // time then automatically removed.
    prototype.once = function (event, groupName, fn) {
        var self = this,
            hasGroup = (arguments.length === 3),
            group = hasGroup ? arguments[1] : undefined,
            func = hasGroup ? arguments[2] : arguments[1];
        function on() {
            self.off(event, on);
            func.apply(this, arguments);
        }
        this.on(event, group, on);
        return this;
    };

    // Unbinds an entire group
    prototype.releaseGroup = function (groupName) {
        this.callbacks = this.callbacks || {};
        var item, i, len, handlers;
        for (item in this.callbacks) {
            handlers = this.callbacks[item];
            for (i = 0, len = handlers.length; i < len; i++) {
                if (handlers[i]._groupName === groupName) {
                    //console.log('removing');
                    // remove it and shorten the array we're looping through
                    handlers.splice(i, 1);
                    i--;
                    len--;
                }
            }
        }
        return this;
    };

    // Remove the given callback for `event` or all
    // registered callbacks.
    prototype.off = function (event, fn) {
        this.callbacks = this.callbacks || {};
        var callbacks = this.callbacks[event],
            i;

        if (!callbacks) return this;

        // remove all handlers
        if (arguments.length === 1) {
            delete this.callbacks[event];
            return this;
        }

        // remove specific handler
        i = callbacks.indexOf(fn);
        callbacks.splice(i, 1);
        if (callbacks.length === 0) {
            delete this.callbacks[event];
        }
        return this;
    };

    /// Emit `event` with the given args.
    // also calls any `*` handlers
    prototype.emit = function (event) {
        this.callbacks = this.callbacks || {};
        var args = [].slice.call(arguments, 1),
            callbacks = this.callbacks[event],
            specialCallbacks = this.getWildcardCallbacks(event),
            i,
            len,
            item,
            listeners;

        if (callbacks) {
            listeners = callbacks.slice();
            for (i = 0, len = listeners.length; i < len; ++i) {
                if (!listeners[i]) {
                    break;
                }
                listeners[i].apply(this, args);
            }
        }

        if (specialCallbacks) {
            len = specialCallbacks.length;
            listeners = specialCallbacks.slice();
            for (i = 0, len = listeners.length; i < len; ++i) {
                if (!listeners[i]) {
                    break;
                }
                listeners[i].apply(this, [event].concat(args));
            }
        }

        return this;
    };

    // Helper for for finding special wildcard event handlers that match the event
    prototype.getWildcardCallbacks = function (eventName) {
        this.callbacks = this.callbacks || {};
        var item,
            split,
            result = [];

        for (item in this.callbacks) {
            split = item.split('*');
            if (item === '*' || (split.length === 2 && eventName.slice(0, split[0].length) === split[0])) {
                result = result.concat(this.callbacks[item]);
            }
        }
        return result;
    };

};

WildEmitter.mixin(WildEmitter);

},{}],3:[function(require,module,exports){
(function(window) {
  var logger = require('andlog'),
      goldenRatio = 0.618033988749895,
      hue = 0,
      padLength = 15,
      yieldColor,
      bows;

  yieldColor = function() {
    hue += goldenRatio;
    hue = hue % 1;
    return hue * 360;
  };

  bows = function(str) {
    var msg;
    msg = "%c" + (str.slice(0, padLength));
    msg += Array(padLength + 3 - msg.length).join(' ') + '|';

    return logger.log.bind(logger, msg, "color: hsl(" + (yieldColor()) + ",99%,40%); font-weight: bold");
  };

  bows.config = function(config) {
    if (config.padLength) {
      return padLength = config.padLength;
    }
  };

  if (typeof module !== 'undefined') {
    module.exports = bows;
  } else {
    window.bows = bows;
  }
}).call(this);

},{"andlog":7}],7:[function(require,module,exports){
// follow @HenrikJoreteg and @andyet if you like this ;)
(function () {
    var inNode = typeof window === 'undefined',
        ls = !inNode && window.localStorage,
        out = {};

    if (inNode) {
        module.exports = console;
        return;
    }

    var andlogKey = ls.andlogKey || 'debug'
    if (ls && ls[andlogKey] && window.console) {
        out = window.console;
    } else {
        var methods = "assert,count,debug,dir,dirxml,error,exception,group,groupCollapsed,groupEnd,info,log,markTimeline,profile,profileEnd,time,timeEnd,trace,warn".split(","),
            l = methods.length,
            fn = function () {};

        while (l--) {
            out[methods[l]] = fn;
        }
    }
    if (typeof exports !== 'undefined') {
        module.exports = out;
    } else {
        window.console = out;
    }
})();

},{}]},{},[1])