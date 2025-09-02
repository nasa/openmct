/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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
    var nextWork = Math.min.apply(
      Math,
      Object.values(subscriptions).map(function (subscription) {
        return subscription(now);
      })
    );
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
    let work;
    if (data.spectra) {
      work = function (now) {
        while (nextStep < now) {
          const messageCopy = Object.create(message);
          message.data.start = nextStep - 60 * 1000;
          message.data.end = nextStep;
          onRequest(messageCopy);
          nextStep += step;
        }

        return nextStep;
      };
    } else {
      work = function (now) {
        while (nextStep < now) {
          self.postMessage({
            id: message.id,
            data: {
              name: data.name,
              utc: nextStep,
              yesterday: nextStep - 60 * 60 * 24 * 1000,
              sin: sin(
                nextStep,
                data.period,
                data.amplitude,
                data.offset,
                data.phase,
                data.randomness,
                data.infinityValues,
                data.exceedFloat32
              ),
              wavelengths: wavelengths(),
              intensities: intensities(),
              cos: cos(
                nextStep,
                data.period,
                data.amplitude,
                data.offset,
                data.phase,
                data.randomness,
                data.infinityValues,
                data.exceedFloat32
              )
            }
          });
          nextStep += step;
        }

        return nextStep;
      };
    }

    subscriptions[message.id] = work;
    workSubscriptions();
  }

  function onUnsubscribe(message) {
    delete subscriptions[message.data.id];
  }

  function onRequest(message) {
    var request = message.data;
    if (request.end === undefined) {
      request.end = Date.now();
    }

    if (request.start === undefined) {
      request.start = request.end - FIFTEEN_MINUTES;
    }

    var now = Date.now();
    var start = request.start;
    var end = request.end > now ? now : request.end;
    var period = request.period;
    var dataRateInHz = request.dataRateInHz;
    var loadDelay = Math.max(request.loadDelay, 0);
    var size = request.size;
    var duration = end - start;
    var step = 1000 / dataRateInHz;
    var maxPoints = Math.floor(duration / step);
    var nextStep = start - (start % step) + step;

    var data = [];

    if (request.strategy === 'minmax' && size) {
      // Calculate the number of cycles to include based on size (2 points per cycle)
      var totalCycles = Math.min(Math.floor(size / 2), Math.floor(duration / period));

      for (let cycle = 0; cycle < totalCycles; cycle++) {
        // Distribute cycles evenly across the time range
        let cycleStart = start + (duration / totalCycles) * cycle;
        let minPointTime = cycleStart; // Assuming min at the start of the cycle
        let maxPointTime = cycleStart + period / 2; // Assuming max at the halfway of the cycle

        data.push(createDataPoint(minPointTime, request), createDataPoint(maxPointTime, request));
      }
    } else {
      for (let i = 0; i < maxPoints && nextStep < end; i++, nextStep += step) {
        data.push(createDataPoint(nextStep, request));
      }
    }

    if (request.strategy !== 'minmax' && size) {
      data = data.slice(-size);
    }

    if (loadDelay === 0) {
      postOnRequest(message, request, data);
    } else {
      setTimeout(() => postOnRequest(message, request, data), loadDelay);
    }
  }

  function createDataPoint(time, request) {
    return {
      utc: time,
      yesterday: time - 60 * 60 * 24 * 1000,
      sin: sin(
        time,
        request.period,
        request.amplitude,
        request.offset,
        request.phase,
        request.randomness,
        request.infinityValues,
        request.exceedFloat32
      ),
      wavelengths: wavelengths(),
      intensities: intensities(),
      cos: cos(
        time,
        request.period,
        request.amplitude,
        request.offset,
        request.phase,
        request.randomness,
        request.infinityValues,
        request.exceedFloat32
      )
    };
  }

  function postOnRequest(message, request, data) {
    self.postMessage({
      id: message.id,
      data: request.spectra
        ? {
            wavelength: data.map((item) => {
              return item.wavelength;
            }),
            cos: data.map((item) => {
              return item.cos;
            })
          }
        : data
    });
  }

  function cos(
    timestamp,
    period,
    amplitude,
    offset,
    phase,
    randomness,
    infinityValues,
    exceedFloat32
  ) {
    if (infinityValues && exceedFloat32) {
      if (Math.random() > 0.5) {
        return Number.POSITIVE_INFINITY;
      } else if (Math.random() < 0.01) {
        return getRandomFloat32OverflowValue();
      }
    } else if (infinityValues && Math.random() > 0.5) {
      return Number.POSITIVE_INFINITY;
    } else if (exceedFloat32 && Math.random() < 0.01) {
      return getRandomFloat32OverflowValue();
    }

    return (
      amplitude * Math.cos(phase + (timestamp / period / 1000) * Math.PI * 2) +
      amplitude * Math.random() * randomness +
      offset
    );
  }

  function sin(
    timestamp,
    period,
    amplitude,
    offset,
    phase,
    randomness,
    infinityValues,
    exceedFloat32
  ) {
    if (infinityValues && exceedFloat32) {
      if (Math.random() > 0.5) {
        return Number.POSITIVE_INFINITY;
      } else if (Math.random() < 0.01) {
        return getRandomFloat32OverflowValue();
      }
    } else if (infinityValues && Math.random() > 0.5) {
      return Number.POSITIVE_INFINITY;
    } else if (exceedFloat32 && Math.random() < 0.01) {
      return getRandomFloat32OverflowValue();
    }

    return (
      amplitude * Math.sin(phase + (timestamp / period / 1000) * Math.PI * 2) +
      amplitude * Math.random() * randomness +
      offset
    );
  }

  // Values exceeding float32 range (Positive: 3.4+38, Negative: -3.4+38)
  function getRandomFloat32OverflowValue() {
    const sign = Math.random() > 0.5 ? 1 : -1;

    return sign * 3.4e39;
  }

  function wavelengths() {
    let values = [];
    while (values.length < 5) {
      const randomValue = Math.random() * 100;
      if (!values.includes(randomValue)) {
        values.push(String(randomValue));
      }
    }

    return values;
  }

  function intensities() {
    let values = [];
    while (values.length < 5) {
      const randomValue = Math.random() * 10;
      if (!values.includes(randomValue)) {
        values.push(String(randomValue));
      }
    }

    return values;
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
})();
