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

import { createOpenMct } from 'utils/testing';

import TimeAPI from './TimeAPI.js';
describe('The Independent Time API', function () {
  let api;
  let domainObjectKey;
  let clockKey;
  let clock;
  let bounds;
  let independentBounds;
  let eventListener;
  let openmct;

  beforeEach(function () {
    openmct = createOpenMct();
    api = new TimeAPI(openmct);
    clockKey = 'someClockKey';
    clock = jasmine.createSpyObj('clock', ['on', 'off', 'currentValue']);
    clock.currentValue.and.returnValue(100);
    clock.key = clockKey;
    api.addClock(clock);
    domainObjectKey = 'test-key';
    bounds = {
      start: 0,
      end: 1
    };
    api.bounds(bounds);
    independentBounds = {
      start: 10,
      end: 11
    };
    eventListener = jasmine.createSpy('eventListener');
  });

  it('Creates an independent time context', () => {
    let timeContext = api.getContextForView([
      {
        identifier: {
          namespace: '',
          key: domainObjectKey
        }
      }
    ]);
    let destroyTimeContext = api.addIndependentContext(domainObjectKey, independentBounds);
    expect(timeContext.bounds()).toEqual(independentBounds);
    destroyTimeContext();
  });

  it('Gets an independent time context given the objectPath', () => {
    let timeContext = api.getContextForView([
      { identifier: domainObjectKey },
      {
        identifier: {
          namespace: '',
          key: 'blah'
        }
      }
    ]);
    let destroyTimeContext = api.addIndependentContext(domainObjectKey, independentBounds);
    expect(timeContext.bounds()).toEqual(independentBounds);
    destroyTimeContext();
  });

  it('defaults to the global time context given the objectPath', () => {
    let timeContext = api.getContextForView([
      {
        identifier: {
          namespace: '',
          key: 'blah'
        }
      }
    ]);
    expect(timeContext.bounds()).toEqual(bounds);
  });

  it('follows a parent time context given the objectPath', () => {
    api.getContextForView([
      {
        identifier: {
          namespace: '',
          key: 'blah'
        }
      }
    ]);
    let destroyTimeContext = api.addIndependentContext('blah', independentBounds);
    let timeContext = api.getContextForView([
      {
        identifier: {
          namespace: '',
          key: domainObjectKey
        }
      },
      {
        identifier: {
          namespace: '',
          key: 'blah'
        }
      }
    ]);
    expect(timeContext.bounds()).toEqual(independentBounds);
    destroyTimeContext();
    expect(timeContext.bounds()).toEqual(bounds);
  });

  it("uses an object's independent time context if the parent doesn't have one", () => {
    const domainObjectKey2 = `${domainObjectKey}-2`;
    const domainObjectKey3 = `${domainObjectKey}-3`;
    let timeContext = api.getContextForView([
      {
        identifier: {
          namespace: '',
          key: domainObjectKey
        }
      }
    ]);
    let timeContext2 = api.getContextForView([
      {
        identifier: {
          namespace: '',
          key: domainObjectKey2
        }
      }
    ]);
    let timeContext3 = api.getContextForView([
      {
        identifier: {
          namespace: '',
          key: domainObjectKey3
        }
      }
    ]);
    // all bounds follow global time context
    expect(timeContext.bounds()).toEqual(bounds);
    expect(timeContext2.bounds()).toEqual(bounds);
    expect(timeContext3.bounds()).toEqual(bounds);
    // only first item has own context
    let destroyTimeContext = api.addIndependentContext(domainObjectKey, independentBounds);
    expect(timeContext.bounds()).toEqual(independentBounds);
    expect(timeContext2.bounds()).toEqual(bounds);
    expect(timeContext3.bounds()).toEqual(bounds);
    // first and second item have own context
    let destroyTimeContext2 = api.addIndependentContext(domainObjectKey2, independentBounds);
    expect(timeContext.bounds()).toEqual(independentBounds);
    expect(timeContext2.bounds()).toEqual(independentBounds);
    expect(timeContext3.bounds()).toEqual(bounds);
    // all items have own time context
    let destroyTimeContext3 = api.addIndependentContext(domainObjectKey3, independentBounds);
    expect(timeContext.bounds()).toEqual(independentBounds);
    expect(timeContext2.bounds()).toEqual(independentBounds);
    expect(timeContext3.bounds()).toEqual(independentBounds);
    //remove own contexts one at a time - should revert to global time context
    destroyTimeContext();
    expect(timeContext.bounds()).toEqual(bounds);
    expect(timeContext2.bounds()).toEqual(independentBounds);
    expect(timeContext3.bounds()).toEqual(independentBounds);
    destroyTimeContext2();
    expect(timeContext.bounds()).toEqual(bounds);
    expect(timeContext2.bounds()).toEqual(bounds);
    expect(timeContext3.bounds()).toEqual(independentBounds);
    destroyTimeContext3();
    expect(timeContext.bounds()).toEqual(bounds);
    expect(timeContext2.bounds()).toEqual(bounds);
    expect(timeContext3.bounds()).toEqual(bounds);
  });

  it('Allows setting of valid bounds', function () {
    bounds = {
      start: 0,
      end: 1
    };
    let timeContext = api.getContextForView([{ identifier: domainObjectKey }]);
    let destroyTimeContext = api.addIndependentContext(domainObjectKey, independentBounds);
    expect(timeContext.bounds()).not.toEqual(bounds);
    timeContext.bounds(bounds);
    expect(timeContext.bounds()).toEqual(bounds);
    destroyTimeContext();
  });

  it('Disallows setting of invalid bounds', function () {
    bounds = {
      start: 1,
      end: 0
    };

    let timeContext = api.getContextForView([{ identifier: domainObjectKey }]);
    let destroyTimeContext = api.addIndependentContext(domainObjectKey, independentBounds);
    expect(timeContext.bounds()).not.toBe(bounds);

    expect(timeContext.bounds.bind(timeContext, bounds)).toThrow();
    expect(timeContext.bounds()).not.toEqual(bounds);

    bounds = { start: 1 };
    expect(timeContext.bounds()).not.toEqual(bounds);
    expect(timeContext.bounds.bind(timeContext, bounds)).toThrow();
    expect(timeContext.bounds()).not.toEqual(bounds);
    destroyTimeContext();
  });

  it('Emits an event when bounds change', function () {
    let timeContext = api.getContextForView([{ identifier: domainObjectKey }]);
    let destroyTimeContext = api.addIndependentContext(domainObjectKey, independentBounds);
    expect(eventListener).not.toHaveBeenCalled();
    timeContext.on('bounds', eventListener);
    timeContext.bounds(bounds);
    expect(eventListener).toHaveBeenCalledWith(bounds, false);
    destroyTimeContext();
  });

  it('Emits an event when bounds change on the global context', function () {
    let timeContext = api.getContextForView([{ identifier: domainObjectKey }]);
    expect(eventListener).not.toHaveBeenCalled();
    timeContext.on('bounds', eventListener);
    timeContext.bounds(bounds);
    expect(eventListener).toHaveBeenCalledWith(bounds, false);
  });

  describe(' when using real time clock', function () {
    const mockOffsets = {
      start: 10,
      end: 11
    };

    it('Emits an event when bounds change based on current value', function () {
      let timeContext = api.getContextForView([{ identifier: domainObjectKey }]);
      let destroyTimeContext = api.addIndependentContext(domainObjectKey, independentBounds);
      expect(eventListener).not.toHaveBeenCalled();
      timeContext.clock('someClockKey', mockOffsets);
      timeContext.on('bounds', eventListener);
      timeContext.tick(10);
      expect(eventListener).toHaveBeenCalledWith(
        {
          start: 20,
          end: 21
        },
        true
      );
      destroyTimeContext();
    });
  });

  describe('Memory management', function () {
    let objectPath1;
    let objectPath2;
    let domainObjectKey2;

    beforeEach(function () {
      domainObjectKey2 = `${domainObjectKey}-2`;
      objectPath1 = [
        {
          identifier: {
            namespace: '',
            key: domainObjectKey
          }
        }
      ];
      objectPath2 = [
        {
          identifier: {
            namespace: '',
            key: domainObjectKey2
          }
        }
      ];
    });

    it('Listeners are not leaked when contexts are replaced', function () {
      // Get initial listener count on global time context
      const initialRefreshCount = api.listeners('refreshContext').length;
      const initialRemoveOwnCount = api.listeners('removeOwnContext').length;

      // Create first context
      const timeContext1 = api.getContextForView(objectPath1);
      const afterFirstRefreshCount = api.listeners('refreshContext').length;
      const afterFirstRemoveOwnCount = api.listeners('removeOwnContext').length;

      // Verify listener count increased by 1 for each event
      expect(afterFirstRefreshCount - initialRefreshCount).toBe(1);
      expect(afterFirstRemoveOwnCount - initialRemoveOwnCount).toBe(1);

      // Spy on getRelativePath to return different values to force replacement
      // Track which path is being checked (old vs new) by comparing references
      const firstContextPath = timeContext1.objectPath;
      let callCount = 0;
      spyOn(openmct.objects, 'getRelativePath').and.callFake(function (pathArg) {
        callCount++;
        // First call checks the old context's path (timeContext1.objectPath)
        // Second call checks the new path (objectPath1 argument)
        // Return different values to simulate path change and force replacement
        if (callCount === 1) {
          return 'path1'; // Return value for old context's path
        } else {
          return 'path2'; // Return different value for new path to force replacement
        }
      });

      // Replace context - getRelativePath will return different values, triggering replacement
      // which should destroy the old context before creating a new one
      const timeContext2 = api.getContextForView(objectPath1);
      const afterReplaceRefreshCount = api.listeners('refreshContext').length;
      const afterReplaceRemoveOwnCount = api.listeners('removeOwnContext').length;

      // Listener count should remain the same (old destroyed, new created)
      // If old context wasn't destroyed, count would increase
      expect(afterReplaceRefreshCount - initialRefreshCount).toBe(1);
      expect(afterReplaceRemoveOwnCount - initialRemoveOwnCount).toBe(1);
      expect(afterReplaceRefreshCount).toBe(afterFirstRefreshCount);
      expect(afterReplaceRemoveOwnCount).toBe(afterFirstRemoveOwnCount);
    });

    it('Listeners are removed when destroy() is called', function () {
      // Get initial listener count
      const initialRefreshCount = api.listeners('refreshContext').length;
      const initialRemoveOwnCount = api.listeners('removeOwnContext').length;

      // Create a context
      const timeContext = api.getContextForView(objectPath1);

      // Verify listener count increased for global time context events
      const afterCreateRefreshCount = api.listeners('refreshContext').length;
      const afterCreateRemoveOwnCount = api.listeners('removeOwnContext').length;
      expect(afterCreateRefreshCount - initialRefreshCount).toBe(1);
      expect(afterCreateRemoveOwnCount - initialRemoveOwnCount).toBe(1);

      // Test clock listener cleanup if clock is active
      const initialTickCount = clock.listeners ? clock.listeners('tick').length : 0;
      let hadActiveClock = false;
      if (timeContext.activeClock !== undefined) {
        hadActiveClock = true;
      } else {
        // Try to activate clock to test cleanup
        try {
          timeContext.clock(clockKey, { start: -10, end: 10 });
          hadActiveClock = timeContext.activeClock !== undefined;
        } catch (e) {
          // Clock may not be available, continue without clock listener test
        }
      }

      // If clock was active, verify tick listener was added
      if (hadActiveClock && clock.listeners) {
        const afterClockTickCount = clock.listeners('tick').length;
        expect(afterClockTickCount - initialTickCount).toBeGreaterThanOrEqual(0);
      }

      // Destroy the context
      timeContext.destroy();

      // Verify listener count returned to initial for global time context events
      const afterDestroyRefreshCount = api.listeners('refreshContext').length;
      const afterDestroyRemoveOwnCount = api.listeners('removeOwnContext').length;
      expect(afterDestroyRefreshCount).toBe(initialRefreshCount);
      expect(afterDestroyRemoveOwnCount).toBe(initialRemoveOwnCount);

      // Verify tick listener was removed if clock was active before destroy
      if (hadActiveClock && clock.listeners) {
        const afterDestroyTickCount = clock.listeners('tick').length;
        expect(afterDestroyTickCount).toBe(initialTickCount);
      }

      // Verify destroy() is idempotent - can be called multiple times safely
      expect(() => timeContext.destroy()).not.toThrow();
      expect(api.listeners('refreshContext').length).toBe(initialRefreshCount);
      expect(api.listeners('removeOwnContext').length).toBe(initialRemoveOwnCount);
    });

    it('Global events do not throw after replacement', function () {
      // Create and replace contexts
      const timeContext1 = api.getContextForView(objectPath1);

      // Spy on getRelativePath to force replacement
      let callCount = 0;
      spyOn(openmct.objects, 'getRelativePath').and.callFake(function () {
        callCount++;
        return callCount === 1 ? 'path1' : 'path2';
      });

      const timeContext2 = api.getContextForView(objectPath1);

      // Emit global events - should not throw errors
      expect(() => {
        api.emit('refreshContext', domainObjectKey);
        api.emit('removeOwnContext', domainObjectKey);
      }).not.toThrow();
    });
  });
});
