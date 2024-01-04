/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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

/**
 * Module exports a function to install custom types in OpenMCT.
 *
 * @module example-imagery-plugin
 */

const DEFAULT_IMAGE_SAMPLES = [
  'https://www.hq.nasa.gov/alsj/a16/AS16-117-18731.jpg',
  'https://www.hq.nasa.gov/alsj/a16/AS16-117-18732.jpg',
  'https://www.hq.nasa.gov/alsj/a16/AS16-117-18733.jpg',
  'https://www.hq.nasa.gov/alsj/a16/AS16-117-18734.jpg',
  'https://www.hq.nasa.gov/alsj/a16/AS16-117-18735.jpg',
  'https://www.hq.nasa.gov/alsj/a16/AS16-117-18736.jpg',
  'https://www.hq.nasa.gov/alsj/a16/AS16-117-18737.jpg',
  'https://www.hq.nasa.gov/alsj/a16/AS16-117-18738.jpg',
  'https://www.hq.nasa.gov/alsj/a16/AS16-117-18739.jpg',
  'https://www.hq.nasa.gov/alsj/a16/AS16-117-18740.jpg',
  'https://www.hq.nasa.gov/alsj/a16/AS16-117-18741.jpg',
  'https://www.hq.nasa.gov/alsj/a16/AS16-117-18742.jpg',
  'https://www.hq.nasa.gov/alsj/a16/AS16-117-18743.jpg',
  'https://www.hq.nasa.gov/alsj/a16/AS16-117-18744.jpg',
  'https://www.hq.nasa.gov/alsj/a16/AS16-117-18745.jpg',
  'https://www.hq.nasa.gov/alsj/a16/AS16-117-18746.jpg',
  'https://www.hq.nasa.gov/alsj/a16/AS16-117-18747.jpg',
  'https://www.hq.nasa.gov/alsj/a16/AS16-117-18748.jpg'
];
const DEFAULT_IMAGE_LOAD_DELAY_IN_MILLISECONDS = 20000;
const MIN_IMAGE_LOAD_DELAY_IN_MILLISECONDS = 5000;

let openmctInstance;

/**
 * Installs the example imagery plugin into an OpenMCT instance.
 *
 * @param {Object} openmct - The OpenMCT instance.
 * @returns {Function} Function to install the plugin.
 */
function installPlugin(openmct) {
  return function install() {
    openmctInstance = openmct;
    openmct.types.addType('example.imagery', {
      key: 'example.imagery',
      name: 'Example Imagery',
      cssClass: 'icon-image',
      description:
        'For development use. Creates example imagery data that mimics a live imagery stream.',
      creatable: true,
      initialize: function initializeObject(object) {
        object.configuration = {
          imageLocation: '',
          imageLoadDelayInMilliSeconds: DEFAULT_IMAGE_LOAD_DELAY_IN_MILLISECONDS,
          imageSamples: [],
          layers: []
        };

        object.telemetry = {
          values: [
            {
              name: 'Name',
              key: 'name'
            },
            {
              name: 'Time',
              key: 'utc',
              format: 'utc',
              hints: {
                domain: 2
              }
            },
            {
              name: 'Local Time',
              key: 'local',
              format: 'local-format',
              hints: {
                domain: 1
              }
            },
            {
              name: 'Image',
              key: 'url',
              format: 'image',
              hints: {
                image: 1
              },
              layers: [
                {
                  source: 'dist/imagery/example-imagery-layer-16x9.png',
                  name: '16:9'
                },
                {
                  source: 'dist/imagery/example-imagery-layer-safe.png',
                  name: 'Safe'
                },
                {
                  source: 'dist/imagery/example-imagery-layer-scale.png',
                  name: 'Scale'
                }
              ]
            },
            {
              name: 'Image Thumbnail',
              key: 'thumbnail-url',
              format: 'thumbnail',
              hints: {
                thumbnail: 1
              },
              source: 'url'
            },
            {
              name: 'Image Download Name',
              key: 'imageDownloadName',
              format: 'imageDownloadName',
              hints: {
                imageDownloadName: 1
              }
            }
          ]
        };
      },
      form: [
        {
          key: 'imageLocation',
          name: 'Images url list (comma separated)',
          control: 'textarea',
          cssClass: 'l-inline',
          property: ['configuration', 'imageLocation']
        },
        {
          key: 'imageLoadDelayInMilliSeconds',
          name: 'Image load delay (milliseconds)',
          control: 'numberfield',
          required: true,
          cssClass: 'l-inline',
          property: ['configuration', 'imageLoadDelayInMilliSeconds']
        }
      ]
    });

    const formatThumbnail = {
      format: function formatUrl(url) {
        return `${url}?w=100&h=100`;
      }
    };

    openmct.telemetry.addFormat({ key: 'thumbnail', ...formatThumbnail });
    openmct.telemetry.addProvider(getRealtimeProvider(openmct));
    openmct.telemetry.addProvider(getHistoricalProvider(openmct));
    openmct.telemetry.addProvider(getLadProvider(openmct));
  };
}

/**
 * Generates a random value between min and max.
 *
 * @param {number} min - Minimum value.
 * @param {number} max - Maximum value.
 * @returns {number} A random number between min and max.
 */
function getCompassValues(min, max) {
  return min + Math.random() * (max - min);
}

/**
 * Retrieves image samples from the configuration.
 *
 * @param {Object} configuration - The configuration object.
 * @returns {Array<string>} Array of image sample URLs.
 */
function getImageSamples(configuration) {
  let imageSamples = DEFAULT_IMAGE_SAMPLES;

  if (configuration.imageLocation && configuration.imageLocation.length) {
    imageSamples = getImageUrlListFromConfig(configuration);
  }

  return imageSamples;
}

/**
 * Splits a comma-separated list of image URLs from configuration.
 *
 * @param {Object} configuration - The configuration object.
 * @returns {Array<string>} Array of image URLs.
 */
function getImageUrlListFromConfig(configuration) {
  return configuration.imageLocation.split(',');
}

/**
 * Determines the image load delay for a domain object.
 *
 * @param {Object} domainObject - The domain object.
 * @returns {number} The determined image load delay in milliseconds.
 */
function getImageLoadDelay(domainObject) {
  const imageLoadDelay = Math.trunc(
    Number(domainObject.configuration.imageLoadDelayInMilliSeconds)
  );

  if (!imageLoadDelay) {
    openmctInstance.objects.mutate(
      domainObject,
      'configuration.imageLoadDelayInMilliSeconds',
      DEFAULT_IMAGE_LOAD_DELAY_IN_MILLISECONDS
    );

    return DEFAULT_IMAGE_LOAD_DELAY_IN_MILLISECONDS;
  }

  if (imageLoadDelay < MIN_IMAGE_LOAD_DELAY_IN_MILLISECONDS) {
    openmctInstance.objects.mutate(
      domainObject,
      'configuration.imageLoadDelayInMilliSeconds',
      MIN_IMAGE_LOAD_DELAY_IN_MILLISECONDS
    );

    return MIN_IMAGE_LOAD_DELAY_IN_MILLISECONDS;
  }

  return imageLoadDelay;
}

/**
 * Provides a realtime telemetry data stream.
 *
 * @param {Object} openmct - The OpenMCT instance.
 * @returns {Object} The realtime provider object.
 */
function getRealtimeProvider(openmct) {
  return {
    supportsSubscribe: function supportsSubscribe(domainObject) {
      return domainObject.type === 'example.imagery';
    },
    subscribe: function subscribe(domainObject, callback) {
      const delay = getImageLoadDelay(domainObject);
      const interval = setInterval(function emitData() {
        const imageSamples = getImageSamples(domainObject.configuration);
        const datum = pointForTimestamp(openmct.time.now(), domainObject.name, imageSamples, delay);
        callback(datum);
      }, delay);

      return function unsubscribe() {
        clearInterval(interval);
      };
    }
  };
}

/**
 * Provides historical telemetry data.
 *
 * @param {Object} openmct - The OpenMCT instance.
 * @returns {Object} The historical provider object.
 */
function getHistoricalProvider(openmct) {
  return {
    supportsRequest: function supportsRequest(domainObject, options) {
      return domainObject.type === 'example.imagery' && options.strategy !== 'latest';
    },
    request: function request(domainObject, options) {
      const delay = getImageLoadDelay(domainObject);
      let start = options.start;
      const end = Math.min(options.end, openmct.time.now());
      const data = [];

      while (start <= end) {
        const imageSamples = getImageSamples(domainObject.configuration);
        const generatedDataPoint = pointForTimestamp(start, domainObject.name, imageSamples, delay);
        data.push(generatedDataPoint);
        start += delay;
      }

      return Promise.resolve(data);
    }
  };
}

/**
 * Provides the latest available data (LAD).
 *
 * @param {Object} openmct - The OpenMCT instance.
 * @returns {Object} The LAD provider object.
 */
function getLadProvider(openmct) {
  return {
    supportsRequest: function supportsRequest(domainObject, options) {
      return domainObject.type === 'example.imagery' && options.strategy === 'latest';
    },
    request: function request(domainObject, options) {
      const delay = getImageLoadDelay(domainObject);
      const datum = pointForTimestamp(
        openmct.time.now(),
        domainObject.name,
        getImageSamples(domainObject.configuration),
        delay
      );

      return Promise.resolve([datum]);
    }
  };
}

/**
 * Generates a telemetry point for a given timestamp.
 *
 * @param {number} timestamp - The timestamp for the telemetry point.
 * @param {string} name - The name of the telemetry point.
 * @param {Array<string>} imageSamples - Array of image sample URLs.
 * @param {number} delay - The delay between telemetry points.
 * @returns {Object} The telemetry point.
 */
function pointForTimestamp(timestamp, name, imageSamples, delay) {
  const url = imageSamples[Math.floor(timestamp / delay) % imageSamples.length];
  const urlItems = url.split('/');
  const imageDownloadName = `example.imagery.${urlItems[urlItems.length - 1]}`;
  const navCamTransformations = {
    translateX: 0,
    translateY: 18,
    rotation: 0,
    scale: 0.3,
    cameraAngleOfView: 70
  };

  return {
    name,
    utc: Math.floor(timestamp / delay) * delay,
    local: Math.floor(timestamp / delay) * delay,
    url,
    sunOrientation: getCompassValues(0, 360),
    cameraAzimuth: getCompassValues(0, 360),
    heading: getCompassValues(0, 360),
    transformations: navCamTransformations,
    imageDownloadName
  };
}

export default installPlugin;
