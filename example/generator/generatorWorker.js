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

(() => {
  const FIFTEEN_MINUTES = 15 * 60 * 1000;

  const handlers = {
    subscribe: onSubscribe,
    unsubscribe: onUnsubscribe,
    request: onRequest
  };

  const subscriptions = new Map();

  function workSubscriptions(timestamp) {
    const now = Date.now();
    const nextWork = Math.min(
      ...Array.from(subscriptions.values()).map((subscription) => subscription(now))
    );
    let wait = nextWork - now;
    wait = wait < 0 ? 0 : wait;

    if (Number.isFinite(wait)) {
      setTimeout(workSubscriptions, wait);
    }
  }

  function onSubscribe(message) {
    const { data } = message;

    const start = Date.now();
    const step = 1000 / data.dataRateInHz;
    let nextStep = start - (start % step) + step;
    let work;
    if (data.spectra) {
      work = (now) => {
        while (nextStep < now) {
          const messageCopy = { ...message };
          messageCopy.data.start = nextStep - 60 * 1000;
          messageCopy.data.end = nextStep;
          onRequest(messageCopy);
          nextStep += step;
        }

        return nextStep;
      };
    } else {
      work = (now) => {
        while (nextStep < now) {
          self.postMessage({
            id: message.id,
            data: {
              name: data.name,
              utc: nextStep,
              yesterday: nextStep - 60 * 60 * 24 * 1000,
              sin: sin(nextStep, data),
              wavelengths: wavelengths(),
              intensities: intensities(),
              cos: cos(nextStep, data)
            }
          });
          nextStep += step;
        }

        return nextStep;
      };
    }

    subscriptions.set(message.id, work);
    workSubscriptions();
  }

  function onUnsubscribe(message) {
    subscriptions.delete(message.data.id);
  }

  function onRequest(message) {
    const request = message.data;
    request.end = request.end ?? Date.now();
    request.start = request.start ?? request.end - FIFTEEN_MINUTES;

    const now = Date.now();
    const { start, end: requestEnd, period, dataRateInHz, loadDelay = 0, size } = request;
    const end = requestEnd > now ? now : requestEnd;
    const duration = end - start;
    const step = 1000 / dataRateInHz;
    const maxPoints = Math.floor(duration / step);
    let nextStep = start - (start % step) + step;

    let data = [];

    if (request.strategy === 'minmax' && size) {
      const totalCycles = Math.min(Math.floor(size / 2), Math.floor(duration / period));

      for (let cycle = 0; cycle < totalCycles; cycle++) {
        let cycleStart = start + (duration / totalCycles) * cycle;
        let minPointTime = cycleStart;
        let maxPointTime = cycleStart + period / 2;

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
      sin: sin(time, request),
      wavelengths: wavelengths(),
      intensities: intensities(),
      cos: cos(time, request)
    };
  }

  function postOnRequest(message, request, data) {
    self.postMessage({
      id: message.id,
      data: request.spectra
        ? {
            wavelength: data.map((item) => item.wavelength),
            cos: data.map((item) => item.cos)
          }
        : data
    });
  }

  function cos(
    timestamp,
    { period, amplitude, offset, phase, randomness, infinityValues, exceedFloat32 }
  ) {
    return calculateWaveform('cos', timestamp, {
      period,
      amplitude,
      offset,
      phase,
      randomness,
      infinityValues,
      exceedFloat32
    });
  }

  function sin(
    timestamp,
    { period, amplitude, offset, phase, randomness, infinityValues, exceedFloat32 }
  ) {
    return calculateWaveform('sin', timestamp, {
      period,
      amplitude,
      offset,
      phase,
      randomness,
      infinityValues,
      exceedFloat32
    });
  }

  function calculateWaveform(
    type,
    timestamp,
    { period, amplitude, offset, phase, randomness, infinityValues, exceedFloat32 }
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

    const waveFunction = type === 'sin' ? Math.sin : Math.cos;
    return (
      amplitude * waveFunction(phase + (timestamp / period / 1000) * Math.PI * 2) +
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
    return Array.from({ length: 5 }, () => String(Math.random() * 100));
  }

  function intensities() {
    return Array.from({ length: 5 }, () => String(Math.random() * 10));
  }

  function sendError(error, message) {
    self.postMessage({
      error: `${error.name}: ${error.message}`,
      message,
      id: message.id
    });
  }

  self.onmessage = (event) => {
    const { data: message } = event;
    const handler = handlers[message.request];

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
