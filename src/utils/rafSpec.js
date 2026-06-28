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
import raf from './raf.js';

describe('The raf utility function', () => {
  it('Throttles function calls that arrive in quick succession using Request Animation Frame', () => {
    const unthrottledFunction = jasmine.createSpy('unthrottledFunction');
    const throttledCallback = jasmine.createSpy('throttledCallback');
    const throttledFunction = raf(throttledCallback);

    for (let i = 0; i < 10; i++) {
      unthrottledFunction();
      throttledFunction();
    }

    return new Promise((resolve) => {
      requestAnimationFrame(resolve);
    }).then(() => {
      expect(unthrottledFunction).toHaveBeenCalledTimes(10);
      expect(throttledCallback).toHaveBeenCalledTimes(1);
    });
  });
  it('Only invokes callback once per animation frame', () => {
    const throttledCallback = jasmine.createSpy('throttledCallback');
    const throttledFunction = raf(throttledCallback);

    for (let i = 0; i < 10; i++) {
      throttledFunction();
    }

    return new Promise((resolve) => {
      requestAnimationFrame(resolve);
    })
      .then(() => {
        return new Promise((resolve) => {
          requestAnimationFrame(resolve);
        });
      })
      .then(() => {
        expect(throttledCallback).toHaveBeenCalledTimes(1);
      });
  });
  it('Invokes callback again if called in subsequent animation frame', () => {
    const throttledCallback = jasmine.createSpy('throttledCallback');
    const throttledFunction = raf(throttledCallback);

    for (let i = 0; i < 10; i++) {
      throttledFunction();
    }

    return new Promise((resolve) => {
      requestAnimationFrame(resolve);
    })
      .then(() => {
        for (let i = 0; i < 10; i++) {
          throttledFunction();
        }

        return new Promise((resolve) => {
          requestAnimationFrame(resolve);
        });
      })
      .then(() => {
        expect(throttledCallback).toHaveBeenCalledTimes(2);
      });
  });
});
