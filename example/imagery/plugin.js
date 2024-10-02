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

import DEFAULT_IMAGE_SAMPLES from '@/../example/imagery/exampleImages.js';
import Layer16x9 from '@/plugins/imagery/layers/example-imagery-layer-16x9.png';
import LayerSafe from '@/plugins/imagery/layers/example-imagery-layer-safe.png';
import LayerScale from '@/plugins/imagery/layers/example-imagery-layer-scale.png';

const DEFAULT_IMAGE_LOAD_DELAY_IN_MILLISECONDS = 20000;
const MIN_IMAGE_LOAD_DELAY_IN_MILLISECONDS = 5000;

/** @type {import('openmct').OpenMCT} */
let openmctInstance;

/**
 * @returns {function(import('openmct').OpenMCT): void}
 */
export default function () {
  return function install(openmct) {
    openmctInstance = openmct;
    openmct.types.addType('example.imagery', {
      key: 'example.imagery',
      name: 'Example Imagery',
      cssClass: 'icon-image',
      description:
        'For development use. Creates example imagery data that mimics a live imagery stream.',
      creatable: true,
      initialize: (object) => {
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
                  source: Layer16x9,
                  name: '16:9'
                },
                {
                  source: LayerSafe,
                  name: 'Safe'
                },
                {
                  source: LayerScale,
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
      format: function (url) {
        return `${url}?w=100&h=100`;
      }
    };

    openmct.telemetry.addFormat({
      key: 'thumbnail',
      ...formatThumbnail
    });
    openmct.telemetry.addProvider(getRealtimeProvider(openmct));
    openmct.telemetry.addProvider(getHistoricalProvider(openmct));
    openmct.telemetry.addProvider(getLadProvider(openmct));
  };
}

/**
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function getCompassValues(min, max) {
  // Seed the random value by current time so we can get a consistent value for testing when we mock
  // the clock
  return min + Math.random(Date.now()) * (max - min);
}

/**
 * @param {ImageryConfiguration} configuration
 * @returns {string[]}
 */
function getImageSamples(configuration) {
  let imageSamples = DEFAULT_IMAGE_SAMPLES;

  imageSamples = getImageLocations(configuration) ?? imageSamples;

  return imageSamples;
}

/**
 * @param {ImageryConfiguration} configuration
 * @returns {string[]?}
 */
function getImageLocations(configuration) {
  let imageLocations = null;
  if (configuration.imageLocation) {
    imageLocations = configuration.imageLocation.split(',');
  }
  return imageLocations;
}

/**
 * @param {DomainObject} domainObject
 * @returns {number}
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
 * @param {import('openmct').OpenMCT} openmct
 * @returns {TelemetryProvider}
 */
function getRealtimeProvider(openmct) {
  return {
    supportsSubscribe: (domainObject) => domainObject.type === 'example.imagery',
    subscribe: (domainObject, callback) => {
      const delay = getImageLoadDelay(domainObject);
      const interval = setInterval(() => {
        const imageSamples = getImageSamples(domainObject.configuration);
        const datum = pointForTimestamp(openmct.time.now(), domainObject.name, imageSamples, delay);
        callback(datum);
      }, delay);

      return () => {
        clearInterval(interval);
      };
    }
  };
}

/**
 * @param {import('openmct').OpenMCT} openmct
 * @returns {HistoricalProvider}
 */
function getHistoricalProvider(openmct) {
  return {
    supportsRequest: (domainObject, options) => {
      return domainObject.type === 'example.imagery' && options.strategy !== 'latest';
    },
    request: (domainObject, options) => {
      const delay = getImageLoadDelay(domainObject);
      let start = options.start;
      const end = Math.min(options.end, openmct.time.now());
      const data = [];
      while (start <= end && data.length < delay) {
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
 * @param {import('openmct').OpenMCT} openmct
 * @returns {LadProvider}
 */
function getLadProvider(openmct) {
  return {
    supportsRequest: (domainObject, options) => {
      return domainObject.type === 'example.imagery' && options.strategy === 'latest';
    },
    request: (domainObject, options) => {
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
 * @param {number} timestamp
 * @param {string} name
 * @param {string[]} imageSamples
 * @param {number} delay
 * @returns {TelemetryDatum}
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

/**
 * @typedef {import('openmct').DomainObject} DomainObject
 */

/**
 * @typedef {Object} ImageryConfiguration
 * @property {string} imageLocation - Comma-separated list of image URLs
 * @property {number} imageLoadDelayInMilliSeconds - Delay between image loads in milliseconds
 * @property {Array<string>} imageSamples - Array of image URLs
 * @property {Array<Object>} layers - Array of layer objects
 */

/**
 * @typedef {Object} TelemetryDatum
 * @property {string} name
 * @property {number} utc
 * @property {number} local
 * @property {string} url
 * @property {number} sunOrientation
 * @property {number} cameraAzimuth
 * @property {number} heading
 * @property {Object} transformations
 * @property {string} imageDownloadName
 */

/**
 * @typedef {Object} TelemetryProvider
 * @property {function(DomainObject): boolean} supportsSubscribe
 * @property {function(DomainObject, function(TelemetryDatum): void): function(): void} subscribe
 */

/**
 * @typedef {Object} HistoricalProvider
 * @property {function(DomainObject, Object): boolean} supportsRequest
 * @property {function(DomainObject, Object): Promise<TelemetryDatum[]>} request
 */

/**
 * @typedef {Object} LadProvider
 * @property {function(DomainObject, Object): boolean} supportsRequest
 * @property {function(DomainObject, Object): Promise<TelemetryDatum[]>} request
 */
