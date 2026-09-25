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
import BatchingWebSocket from './BatchingWebSocket.js';

describe('The BatchingWebSocket', () => {
  let batchingWebSocket;
  let mockWorker;
  let destroyOpenMct;

  beforeEach(() => {
    // A real worker is built by stringifying installWorker, which under an
    // instrumented build carries references that do not exist in worker scope.
    mockWorker = {
      addEventListener: jasmine.createSpy('addEventListener'),
      postMessage: jasmine.createSpy('postMessage')
    };
    spyOn(window, 'Worker').and.returnValue(mockWorker);
    spyOn(console, 'warn');

    batchingWebSocket = new BatchingWebSocket({
      on: (event, callback) => {
        destroyOpenMct = callback;
      }
    });
  });

  afterEach(() => {
    destroyOpenMct();
  });

  describe('when given a throttle message pattern', () => {
    it('sends a well formed pattern to the worker', () => {
      batchingWebSocket.setThrottleMessagePattern('^important');

      expect(mockWorker.postMessage).toHaveBeenCalledOnceWith({
        type: 'setThrottleMessagePattern',
        throttleMessagePattern: '^important'
      });
    });

    it('refuses a pattern that will not compile', () => {
      batchingWebSocket.setThrottleMessagePattern('(');

      expect(mockWorker.postMessage).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
    });

    it('refuses a pattern that can backtrack catastrophically', () => {
      // The worker tests this pattern against every message that arrives, so
      // one like this would stall telemetry rather than prioritize any of it.
      batchingWebSocket.setThrottleMessagePattern('(a+)+$');

      expect(mockWorker.postMessage).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalled();
    });
  });
});
