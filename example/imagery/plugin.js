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
const DEFAULT_IMAGE_LOAD_DELAY_IN_MILISECONDS = 20000;
const MIN_IMAGE_LOAD_DELAY_IN_MILISECONDS = 5000;

let openmctInstance;

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
          imageLoadDelayInMilliSeconds: DEFAULT_IMAGE_LOAD_DELAY_IN_MILISECONDS,
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
      format: function (url) {
        return `${url}?w=100&h=100`;
      }
    };

    openmct.telemetry.addFormat({
      key: 'thumbnail',
      ...formatThumbnail
    });
    openmct.telemetry.addProvider(getRealtimeProvider());
    openmct.telemetry.addProvider(getHistoricalProvider());
    openmct.telemetry.addProvider(getLadProvider());
  };
}

function getCompassValues(min, max) {
  return min + Math.random() * (max - min);
}

function getImageSamples(configuration) {
  let imageSamples = DEFAULT_IMAGE_SAMPLES;

  if (configuration.imageLocation && configuration.imageLocation.length) {
    imageSamples = getImageUrlListFromConfig(configuration);
  }

  return imageSamples;
}

function getImageUrlListFromConfig(configuration) {
  return configuration.imageLocation.split(',');
}

function getImageLoadDelay(domainObject) {
  const imageLoadDelay = Math.trunc(
    Number(domainObject.configuration.imageLoadDelayInMilliSeconds)
  );
  if (!imageLoadDelay) {
    openmctInstance.objects.mutate(
      domainObject,
      'configuration.imageLoadDelayInMilliSeconds',
      DEFAULT_IMAGE_LOAD_DELAY_IN_MILISECONDS
    );

    return DEFAULT_IMAGE_LOAD_DELAY_IN_MILISECONDS;
  }

  if (imageLoadDelay < MIN_IMAGE_LOAD_DELAY_IN_MILISECONDS) {
    openmctInstance.objects.mutate(
      domainObject,
      'configuration.imageLoadDelayInMilliSeconds',
      MIN_IMAGE_LOAD_DELAY_IN_MILISECONDS
    );

    return MIN_IMAGE_LOAD_DELAY_IN_MILISECONDS;
  }

  return imageLoadDelay;
}

function getRealtimeProvider() {
  return {
    supportsSubscribe: (domainObject) => domainObject.type === 'example.imagery',
    subscribe: (domainObject, callback) => {
      const delay = getImageLoadDelay(domainObject);
      const interval = setInterval(() => {
        const imageSamples = getImageSamples(domainObject.configuration);
        const datum = pointForTimestamp(Date.now(), domainObject.name, imageSamples, delay);
        callback(datum);
      }, delay);

      return () => {
        clearInterval(interval);
      };
    }
  };
}

function getHistoricalProvider() {
  return {
    supportsRequest: (domainObject, options) => {
      return domainObject.type === 'example.imagery' && options.strategy !== 'latest';
    },
    request: (domainObject, options) => {
      const delay = getImageLoadDelay(domainObject);
      let start = options.start;
      const end = Math.min(options.end, Date.now());
      const data = [];
      while (start <= end && data.length < delay) {
        data.push(
          pointForTimestamp(
            start,
            domainObject.name,
            getImageSamples(domainObject.configuration),
            delay
          )
        );
        start += delay;
      }

      return Promise.resolve(data);
    }
  };
}

function getLadProvider() {
  return {
    supportsRequest: (domainObject, options) => {
      return domainObject.type === 'example.imagery' && options.strategy === 'latest';
    },
    request: (domainObject, options) => {
      const delay = getImageLoadDelay(domainObject);
      const datum = pointForTimestamp(
        Date.now(),
        domainObject.name,
        getImageSamples(domainObject.configuration),
        delay
      );

      return Promise.resolve([datum]);
    }
  };
}

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
