/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

/*global self*/

(function () {

    var FIFTEEN_MINUTES = 15 * 60 * 1000;

    var handlers = {
        subscribe: onSubscribe,
        unsubscribe: onUnsubscribe,
        request: onRequest
    };

    var subscriptions = {};

    function workSubscriptions(timestamp) {
        var now = Date.now();
        var nextWork = Math.min.apply(Math, Object.values(subscriptions).map(function (subscription) {
            return subscription(now);
        }));
        var wait = nextWork - now;
        if (wait < 0) {
            wait = 0;
        }

        if (Number.isFinite(wait)) {
            setTimeout(workSubscriptions, wait);
        }
    }

    function onSubscribe(message) {
        var data = message.data;

        // Keep
        var start = Date.now();
        var step = 1000 / data.dataRateInHz;
        var nextStep = start - (start % step) + step;

        function work(now) {
            while (nextStep < now) {
                self.postMessage({
                    id: message.id,
                    data: {
                        utc: nextStep,
                        yesterday: nextStep - 60*60*24*1000,
                        delta: 60*60*24*1000,
                        sin: sin(nextStep, data.period, data.amplitude, data.offset),
                        cos: cos(nextStep, data.period, data.amplitude, data.offset)
                    }
                });
                nextStep += step;
            }
            return nextStep;
        }

        subscriptions[message.id] = work;
        workSubscriptions();
    }

    function onUnsubscribe(message) {
        delete subscriptions[message.data.id];
    }

    function onRequest(message) {
        var data = message.data;
        if (data.end == undefined) {
            data.end = Date.now();
        }
        if (data.start == undefined){
            data.start = data.end - FIFTEEN_MINUTES;
        }

        var now = Date.now();
        var start = data.start;
        var end = data.end > now ? now : data.end;
        var amplitude = data.amplitude;
        var period = data.period;
        var offset = data.offset;
        var dataRateInHz = data.dataRateInHz;

        var step = 1000 / dataRateInHz;
        var nextStep = start - (start % step) + step;

        var data = [];

        for (; nextStep < end; nextStep += step) {
            data.push({
                utc: nextStep,
                yesterday: nextStep - 60*60*24*1000,
                delta: 60*60*24*1000,
                sin: sin(nextStep, period, amplitude, offset),
                cos: cos(nextStep, period, amplitude, offset)
            });
        }
        self.postMessage({
            id: message.id,
            data: data
        });
    }

    function cos(timestamp, period, amplitude, offset) {
        return amplitude *
            Math.cos(timestamp / period / 1000 * Math.PI * 2) + offset;
    }

    function sin(timestamp, period, amplitude, offset) {
        return amplitude *
            Math.sin(timestamp / period / 1000 * Math.PI * 2) + offset;
    }

    function sendError(error, message) {
        self.postMessage({
            error: error.name + ': ' + error.message,
            message: message,
            id: message.id
        });
    }

    self.onmessage = function handleMessage(event) {
        var message = event.data;
        var handler = handlers[message.request];

        if (!handler) {
            sendError(new Error('unknown message type'), message);
        } else {
            try {
                handler(message);
            } catch (e) {
                sendError(e, message);
            }
        }
    };

}());
