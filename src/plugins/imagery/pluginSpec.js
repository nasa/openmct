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

import {
  createMouseEvent,
  createOpenMct,
  resetApplicationState,
  simulateKeyEvent
} from 'utils/testing';
import Vue from 'vue';

import ClearDataPlugin from '../clearData/plugin';

const ONE_MINUTE = 1000 * 60;
const TEN_MINUTES = ONE_MINUTE * 10;
const MAIN_IMAGE_CLASS = '.js-imageryView-image';
const NEW_IMAGE_CLASS = '.c-imagery__age.c-imagery--new';
const REFRESH_CSS_MS = 500;

function formatThumbnail(url) {
  return url.replace('logo-openmct.svg', 'logo-nasa.svg');
}

function getImageInfo(doc) {
  let imageElement = doc.querySelectorAll(MAIN_IMAGE_CLASS)[0];
  let timestamp = imageElement.dataset.openmctImageTimestamp;
  let identifier = imageElement.dataset.openmctObjectKeystring;
  let url = imageElement.src;

  return {
    timestamp,
    identifier,
    url
  };
}

function isNew(doc) {
  let newIcon = doc.querySelectorAll(NEW_IMAGE_CLASS);

  return newIcon.length !== 0;
}

function generateTelemetry(start, count) {
  let telemetry = [];
  for (let i = 1, l = count + 1; i < l; i++) {
    let stringRep = i + 'minute';
    let logo = 'images/logo-openmct.svg';

    telemetry.push({
      name: stringRep + ' Imagery',
      utc: start + i * ONE_MINUTE,
      url: location.host + '/' + logo + '?time=' + stringRep,
      timeId: stringRep,
      value: 100
    });
  }

  return telemetry;
}

describe('The Imagery View Layouts', () => {
  const imageryKey = 'example.imagery';
  const imageryForTimeStripKey = 'example.imagery.time-strip.view';
  const START = Date.now();
  const COUNT = 10;

  // let resolveFunction;
  let originalRouterPath;
  let telemetryPromise;
  let telemetryPromiseResolve;
  let cleanupFirst;

  let openmct;
  let parent;
  let child;
  let historicalProvider;
  let imageTelemetry = generateTelemetry(START - TEN_MINUTES, COUNT);
  let imageryObject = {
    identifier: {
      namespace: '',
      key: 'imageryId'
    },
    name: 'Example Imagery',
    type: 'example.imagery',
    location: 'parentId',
    modified: 0,
    persisted: 0,
    configuration: {
      layers: [
        {
          name: '16:9',
          visible: true
        }
      ]
    },
    telemetry: {
      values: [
        {
          name: 'Image',
          key: 'url',
          format: 'image',
          layers: [
            {
              source: location.host + '/images/bg-splash.jpg',
              name: '16:9'
            }
          ],
          hints: {
            image: 1,
            priority: 3
          },
          source: 'url'
        },
        {
          name: 'Image Thumbnail',
          key: 'thumbnail-url',
          format: 'thumbnail',
          hints: {
            thumbnail: 1,
            priority: 3
          },
          source: 'url'
        },
        {
          name: 'Name',
          key: 'name',
          source: 'name',
          hints: {
            priority: 0
          }
        },
        {
          name: 'Time',
          key: 'utc',
          format: 'utc',
          hints: {
            domain: 2,
            priority: 1
          },
          source: 'utc'
        },
        {
          name: 'Local Time',
          key: 'local',
          format: 'local-format',
          hints: {
            domain: 1,
            priority: 2
          },
          source: 'local'
        }
      ]
    }
  };

  // this setups up the app
  beforeEach((done) => {
    cleanupFirst = [];

    openmct = createOpenMct();

    telemetryPromise = new Promise((resolve) => {
      telemetryPromiseResolve = resolve;
    });

    historicalProvider = {
      request: () => {
        return Promise.resolve(imageTelemetry);
      }
    };
    spyOn(openmct.telemetry, 'findRequestProvider').and.returnValue(historicalProvider);

    spyOn(openmct.telemetry, 'request').and.callFake(() => {
      telemetryPromiseResolve(imageTelemetry);

      return telemetryPromise;
    });

    parent = document.createElement('div');
    parent.style.width = '640px';
    parent.style.height = '480px';

    child = document.createElement('div');
    child.style.width = '640px';
    child.style.height = '480px';

    parent.appendChild(child);
    document.body.appendChild(parent);

    spyOn(window, 'ResizeObserver').and.returnValue({
      observe() {},
      disconnect() {}
    });

    spyOn(openmct.objects, 'get').and.returnValue(Promise.resolve(imageryObject));

    originalRouterPath = openmct.router.path;

    openmct.telemetry.addFormat({
      key: 'thumbnail',
      format: formatThumbnail
    });

    openmct.on('start', done);
    openmct.startHeadless();
  });

  afterEach((done) => {
    openmct.router.path = originalRouterPath;

    // Needs to be in a timeout because plots use a bunch of setTimeouts, some of which can resolve during or after
    // teardown, which causes problems
    // This is hacky, we should find a better approach here.
    setTimeout(() => {
      //Cleanup code that needs to happen before dom elements start being destroyed
      cleanupFirst.forEach((cleanup) => cleanup());
      cleanupFirst = [];
      document.body.removeChild(parent);

      resetApplicationState(openmct).then(done).catch(done);
    });
  });

  it('should provide an imagery time strip view when in a time strip', () => {
    openmct.router.path = [
      {
        identifier: {
          key: 'test-timestrip',
          namespace: ''
        },
        type: 'time-strip'
      }
    ];

    let applicableViews = openmct.objectViews.get(imageryObject, [
      imageryObject,
      {
        identifier: {
          key: 'test-timestrip',
          namespace: ''
        },
        type: 'time-strip'
      }
    ]);
    let imageryView = applicableViews.find(
      (viewProvider) => viewProvider.key === imageryForTimeStripKey
    );

    expect(imageryView).toBeDefined();
  });

  it('should provide an imagery view only for imagery producing objects', () => {
    let applicableViews = openmct.objectViews.get(imageryObject, [imageryObject]);
    let imageryView = applicableViews.find((viewProvider) => viewProvider.key === imageryKey);

    expect(imageryView).toBeDefined();
  });

  it('should not provide an imagery view when in a time strip', () => {
    openmct.router.path = [
      {
        identifier: {
          key: 'test-timestrip',
          namespace: ''
        },
        type: 'time-strip'
      }
    ];

    let applicableViews = openmct.objectViews.get(imageryObject, [
      imageryObject,
      {
        identifier: {
          key: 'test-timestrip',
          namespace: ''
        },
        type: 'time-strip'
      }
    ]);
    let imageryView = applicableViews.find((viewProvider) => viewProvider.key === imageryKey);

    expect(imageryView).toBeUndefined();
  });

  it('should provide an imagery view when navigated to in the composition of a time strip', () => {
    openmct.router.path = [imageryObject];

    let applicableViews = openmct.objectViews.get(imageryObject, [
      imageryObject,
      {
        identifier: {
          key: 'test-timestrip',
          namespace: ''
        },
        type: 'time-strip'
      }
    ]);
    let imageryView = applicableViews.find((viewProvider) => viewProvider.key === imageryKey);

    expect(imageryView).toBeDefined();
  });

  describe('Clear data action for imagery', () => {
    let applicableViews;
    let imageryViewProvider;
    let imageryView;
    let componentView;
    let clearDataPlugin;
    let clearDataAction;

    beforeEach(() => {
      openmct.time.timeSystem('utc', {
        start: START - 5 * ONE_MINUTE,
        end: START + 5 * ONE_MINUTE
      });

      applicableViews = openmct.objectViews.get(imageryObject, [imageryObject]);
      imageryViewProvider = applicableViews.find((viewProvider) => viewProvider.key === imageryKey);
      imageryView = imageryViewProvider.view(imageryObject, [imageryObject]);
      imageryView.show(child);
      componentView = imageryView._getInstance().$children[0];

      clearDataPlugin = new ClearDataPlugin(['example.imagery'], { indicator: true });
      openmct.install(clearDataPlugin);
      clearDataAction = openmct.actions.getAction('clear-data-action');

      return Vue.nextTick();
    });

    it('clear data action is installed', () => {
      expect(clearDataAction).toBeDefined();
    });

    it('on clearData action should clear data for object is selected', (done) => {
      // force show the thumbnails
      componentView.forceShowThumbnails = true;
      Vue.nextTick(() => {
        let clearDataResolve;
        let telemetryRequestPromise = new Promise((resolve) => {
          clearDataResolve = resolve;
        });
        expect(parent.querySelectorAll('.c-imagery__thumb').length).not.toBe(0);

        openmct.objectViews.on('clearData', (_domainObject) => {
          return Vue.nextTick(() => {
            expect(parent.querySelectorAll('.c-imagery__thumb').length).toBe(0);

            clearDataResolve();
          });
        });
        clearDataAction.invoke(imageryObject);

        telemetryRequestPromise.then(() => {
          done();
        });
      });
    });
  });

  describe('imagery view', () => {
    let applicableViews;
    let imageryViewProvider;
    let imageryView;

    beforeEach(() => {
      openmct.time.timeSystem('utc', {
        start: START - 5 * ONE_MINUTE,
        end: START + 5 * ONE_MINUTE
      });

      applicableViews = openmct.objectViews.get(imageryObject, [imageryObject]);
      imageryViewProvider = applicableViews.find((viewProvider) => viewProvider.key === imageryKey);
      imageryView = imageryViewProvider.view(imageryObject, [imageryObject]);
      imageryView.show(child);

      imageryView._getInstance().$children[0].forceShowThumbnails = true;

      return Vue.nextTick();
    });

    it('on mount should show the the most recent image', async () => {
      //Looks like we need Vue.nextTick here so that computed properties settle down
      await Vue.nextTick();
      await Vue.nextTick();
      await Vue.nextTick();
      const imageInfo = getImageInfo(parent);
      expect(imageInfo.url.indexOf(imageTelemetry[COUNT - 1].timeId)).not.toEqual(-1);
    });

    it('on mount should show any image layers', async () => {
      //Looks like we need Vue.nextTick here so that computed properties settle down
      await Vue.nextTick();
      await Vue.nextTick();
      const layerEls = parent.querySelectorAll('.js-layer-image');
      expect(layerEls.length).toEqual(1);
    });

    it('should use the image thumbnailUrl for thumbnails', async () => {
      await Vue.nextTick();
      await Vue.nextTick();
      const fullSizeImageUrl = imageTelemetry[5].url;
      const thumbnailUrl = formatThumbnail(imageTelemetry[5].url);

      // Ensure thumbnails are shown w/ thumbnail Urls
      const thumbnails = parent.querySelectorAll(`img[src='${thumbnailUrl}']`);
      expect(thumbnails.length).toBeGreaterThan(0);

      // Click a thumbnail
      parent.querySelectorAll(`img[src='${thumbnailUrl}']`)[0].click();
      await Vue.nextTick();

      // Ensure full size image is shown w/ full size url
      const fullSizeImages = parent.querySelectorAll(`img[src='${fullSizeImageUrl}']`);
      expect(fullSizeImages.length).toBeGreaterThan(0);
    });

    it('should show the clicked thumbnail as the main image', async () => {
      //Looks like we need Vue.nextTick here so that computed properties settle down
      await Vue.nextTick();
      await Vue.nextTick();
      const thumbnailUrl = formatThumbnail(imageTelemetry[5].url);
      parent.querySelectorAll(`img[src='${thumbnailUrl}']`)[0].click();
      await Vue.nextTick();
      const imageInfo = getImageInfo(parent);

      expect(imageInfo.url.indexOf(imageTelemetry[5].timeId)).not.toEqual(-1);
    });

    xit('should show that an image is new', (done) => {
      openmct.time.clock('local', {
        start: -1000,
        end: 1000
      });

      Vue.nextTick(() => {
        // used in code, need to wait to the 500ms here too
        setTimeout(() => {
          const imageIsNew = isNew(parent);
          expect(imageIsNew).toBeTrue();
          done();
        }, REFRESH_CSS_MS);
      });
    });

    it('should show that an image is not new', async () => {
      await Vue.nextTick();
      await Vue.nextTick();
      const target = formatThumbnail(imageTelemetry[4].url);
      parent.querySelectorAll(`img[src='${target}']`)[0].click();

      await Vue.nextTick();
      const imageIsNew = isNew(parent);

      expect(imageIsNew).toBeFalse();
    });

    it('should navigate via arrow keys', async () => {
      await Vue.nextTick();
      await Vue.nextTick();
      const keyOpts = {
        element: parent.querySelector('.c-imagery'),
        key: 'ArrowLeft',
        keyCode: 37,
        type: 'keyup'
      };

      simulateKeyEvent(keyOpts);

      await Vue.nextTick();
      const imageInfo = getImageInfo(parent);
      expect(imageInfo.url.indexOf(imageTelemetry[COUNT - 2].timeId)).not.toEqual(-1);
    });

    it('should navigate via numerous arrow keys', async () => {
      await Vue.nextTick();
      await Vue.nextTick();
      const element = parent.querySelector('.c-imagery');
      const type = 'keyup';
      const leftKeyOpts = {
        element,
        type,
        key: 'ArrowLeft',
        keyCode: 37
      };
      const rightKeyOpts = {
        element,
        type,
        key: 'ArrowRight',
        keyCode: 39
      };

      // left thrice
      simulateKeyEvent(leftKeyOpts);
      simulateKeyEvent(leftKeyOpts);
      simulateKeyEvent(leftKeyOpts);
      // right once
      simulateKeyEvent(rightKeyOpts);

      await Vue.nextTick();
      const imageInfo = getImageInfo(parent);
      expect(imageInfo.url.indexOf(imageTelemetry[COUNT - 3].timeId)).not.toEqual(-1);
    });
    it('shows an auto scroll button when scroll to left', (done) => {
      Vue.nextTick(() => {
        // to mock what a scroll would do
        imageryView._getInstance().$refs.ImageryContainer.autoScroll = false;
        Vue.nextTick(() => {
          let autoScrollButton = parent.querySelector('.c-imagery__auto-scroll-resume-button');
          expect(autoScrollButton).toBeTruthy();
          done();
        });
      });
    });
    it('scrollToRight is called when clicking on auto scroll button', async () => {
      await Vue.nextTick();
      // use spyon to spy the scroll function
      spyOn(imageryView._getInstance().$refs.ImageryContainer, 'scrollHandler');
      imageryView._getInstance().$refs.ImageryContainer.autoScroll = false;
      await Vue.nextTick();
      parent.querySelector('.c-imagery__auto-scroll-resume-button').click();
      expect(imageryView._getInstance().$refs.ImageryContainer.scrollHandler);
    });
    xit('should change the image zoom factor when using the zoom buttons', async () => {
      await Vue.nextTick();
      let imageSizeBefore;
      let imageSizeAfter;

      // test clicking the zoom in button
      imageSizeBefore = parent
        .querySelector('.c-imagery_main-image_background-image')
        .getBoundingClientRect();
      parent.querySelector('.t-btn-zoom-in').click();
      await Vue.nextTick();
      imageSizeAfter = parent
        .querySelector('.c-imagery_main-image_background-image')
        .getBoundingClientRect();
      expect(imageSizeAfter.height).toBeGreaterThan(imageSizeBefore.height);
      expect(imageSizeAfter.width).toBeGreaterThan(imageSizeBefore.width);
      // test clicking the zoom out button
      imageSizeBefore = parent
        .querySelector('.c-imagery_main-image_background-image')
        .getBoundingClientRect();
      parent.querySelector('.t-btn-zoom-out').click();
      await Vue.nextTick();
      imageSizeAfter = parent
        .querySelector('.c-imagery_main-image_background-image')
        .getBoundingClientRect();
      expect(imageSizeAfter.height).toBeLessThan(imageSizeBefore.height);
      expect(imageSizeAfter.width).toBeLessThan(imageSizeBefore.width);
    });
    xit('should reset the zoom factor on the image when clicking the zoom button', async (done) => {
      await Vue.nextTick();
      // test clicking the zoom reset button
      // zoom in to scale up the image dimensions
      parent.querySelector('.t-btn-zoom-in').click();
      await Vue.nextTick();
      let imageSizeBefore = parent
        .querySelector('.c-imagery_main-image_background-image')
        .getBoundingClientRect();
      await Vue.nextTick();
      parent.querySelector('.t-btn-zoom-reset').click();
      let imageSizeAfter = parent
        .querySelector('.c-imagery_main-image_background-image')
        .getBoundingClientRect();
      expect(imageSizeAfter.height).toBeLessThan(imageSizeBefore.height);
      expect(imageSizeAfter.width).toBeLessThan(imageSizeBefore.width);
      done();
    });

    it('should display the viewable area when zoom factor is greater than 1', async () => {
      await Vue.nextTick();
      await Vue.nextTick();
      expect(parent.querySelectorAll('.c-thumb__viewable-area').length).toBe(0);

      parent.querySelector('.t-btn-zoom-in').click();
      await Vue.nextTick();
      expect(parent.querySelectorAll('.c-thumb__viewable-area').length).toBe(1);

      parent.querySelector('.t-btn-zoom-reset').click();
      await Vue.nextTick();
      expect(parent.querySelectorAll('.c-thumb__viewable-area').length).toBe(0);
    });

    it('should reset the brightness and contrast when clicking the reset button', async () => {
      const viewInstance = imageryView._getInstance();
      await Vue.nextTick();

      // Save the original brightness and contrast values
      const origBrightness = viewInstance.$refs.ImageryContainer.filters.brightness;
      const origContrast = viewInstance.$refs.ImageryContainer.filters.contrast;

      // Change them to something else (default: 100)
      viewInstance.$refs.ImageryContainer.setFilters({
        brightness: 200,
        contrast: 200
      });
      await Vue.nextTick();

      // Verify that the values actually changed
      expect(viewInstance.$refs.ImageryContainer.filters.brightness).toBe(200);
      expect(viewInstance.$refs.ImageryContainer.filters.contrast).toBe(200);

      // Click the reset button
      parent.querySelector('.t-btn-reset').click();
      await Vue.nextTick();

      // Verify that the values were reset
      expect(viewInstance.$refs.ImageryContainer.filters.brightness).toBe(origBrightness);
      expect(viewInstance.$refs.ImageryContainer.filters.contrast).toBe(origContrast);
    });
  });

  describe('imagery time strip view', () => {
    let applicableViews;
    let imageryViewProvider;
    let imageryView;
    let componentView;

    beforeEach(() => {
      openmct.time.timeSystem('utc', {
        start: START - 5 * ONE_MINUTE,
        end: START + 5 * ONE_MINUTE
      });

      const mockClock = jasmine.createSpyObj('clock', ['on', 'off', 'currentValue']);
      mockClock.key = 'mockClock';
      mockClock.currentValue.and.returnValue(1);

      openmct.time.addClock(mockClock);
      openmct.time.clock('mockClock', {
        start: START - 5 * ONE_MINUTE,
        end: START + 5 * ONE_MINUTE
      });

      openmct.router.path = [
        {
          identifier: {
            key: 'test-timestrip',
            namespace: ''
          },
          type: 'time-strip'
        }
      ];

      applicableViews = openmct.objectViews.get(imageryObject, [
        imageryObject,
        {
          identifier: {
            key: 'test-timestrip',
            namespace: ''
          },
          type: 'time-strip'
        }
      ]);
      imageryViewProvider = applicableViews.find(
        (viewProvider) => viewProvider.key === imageryForTimeStripKey
      );
      imageryView = imageryViewProvider.view(imageryObject, [
        imageryObject,
        {
          identifier: {
            key: 'test-timestrip',
            namespace: ''
          },
          type: 'time-strip'
        }
      ]);
      imageryView.show(child);

      componentView = imageryView.getComponent().$children[0];
      spyOn(componentView.previewAction, 'invoke').and.callThrough();

      return Vue.nextTick();
    });

    afterEach(() => {
      openmct.time.setClock('local');
    });

    it('on mount should show imagery within the given bounds', async () => {
      await Vue.nextTick();
      await Vue.nextTick();
      const imageElements = parent.querySelectorAll('.c-imagery-tsv__image-wrapper');
      expect(imageElements.length).toEqual(5);
    });

    it('should show the clicked thumbnail as the preview image', async () => {
      await Vue.nextTick();
      await Vue.nextTick();
      const mouseDownEvent = createMouseEvent('mousedown');
      let imageWrapper = parent.querySelectorAll(`.c-imagery-tsv__image-wrapper`);
      imageWrapper[2].dispatchEvent(mouseDownEvent);
      await Vue.nextTick();
      const timestamp = imageWrapper[2].id.replace('wrapper-', '');
      expect(componentView.previewAction.invoke).toHaveBeenCalledWith(
        [componentView.objectPath[0]],
        {
          timestamp: Number(timestamp),
          objectPath: componentView.objectPath
        }
      );
    });

    it('should remove images when clock advances', async () => {
      openmct.time.tick(ONE_MINUTE * 2);
      await Vue.nextTick();
      await Vue.nextTick();
      const imageElements = parent.querySelectorAll('.c-imagery-tsv__image-wrapper');
      expect(imageElements.length).toEqual(4);
    });

    it('should remove images when start bounds shorten', async () => {
      openmct.time.timeSystem('utc', {
        start: START,
        end: START + 5 * ONE_MINUTE
      });
      await Vue.nextTick();
      await Vue.nextTick();
      const imageElements = parent.querySelectorAll('.c-imagery-tsv__image-wrapper');
      expect(imageElements.length).toEqual(1);
    });

    it('should remove images when end bounds shorten', async () => {
      openmct.time.timeSystem('utc', {
        start: START - 5 * ONE_MINUTE,
        end: START - 2 * ONE_MINUTE
      });
      await Vue.nextTick();
      await Vue.nextTick();
      const imageElements = parent.querySelectorAll('.c-imagery-tsv__image-wrapper');
      expect(imageElements.length).toEqual(4);
    });

    it('should remove images when both bounds shorten', async () => {
      openmct.time.timeSystem('utc', {
        start: START - 2 * ONE_MINUTE,
        end: START + 2 * ONE_MINUTE
      });
      await Vue.nextTick();
      await Vue.nextTick();
      const imageElements = parent.querySelectorAll('.c-imagery-tsv__image-wrapper');
      expect(imageElements.length).toEqual(3);
    });
  });
});
