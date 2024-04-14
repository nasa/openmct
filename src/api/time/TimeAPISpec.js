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

describe('The Time API', function () {
  let api;
  let timeSystemKey;
  let timeSystem;
  let clockKey;
  let clock;
  let bounds;
  let eventListener;
  let toi;
  let openmct;

  beforeEach(function () {
    openmct = createOpenMct();
    api = new TimeAPI(openmct);
    timeSystemKey = 'timeSystemKey';
    timeSystem = { key: timeSystemKey };
    clockKey = 'someClockKey';
    clock = jasmine.createSpyObj('clock', ['on', 'off', 'currentValue']);
    clock.currentValue.and.returnValue(100);
    clock.key = clockKey;
    bounds = {
      start: 0,
      end: 1
    };
    eventListener = jasmine.createSpy('eventListener');
    toi = 111;
  });

  it('Supports setting and querying of time of interest', function () {
    expect(api.timeOfInterest()).not.toBe(toi);
    api.timeOfInterest(toi);
    expect(api.timeOfInterest()).toBe(toi);
  });

  it('[Legacy TimeAPI]: Allows setting of valid bounds', function () {
    bounds = {
      start: 0,
      end: 1
    };
    expect(api.bounds()).not.toBe(bounds);
    expect(api.bounds.bind(api, bounds)).not.toThrow();
    expect(api.bounds()).toEqual(bounds);
  });

  it('Allows setting of valid bounds', function () {
    bounds = {
      start: 0,
      end: 1
    };
    expect(api.getBounds()).not.toBe(bounds);
    expect(api.setBounds.bind(api, bounds)).not.toThrow();
    expect(api.getBounds()).toEqual(bounds);
  });

  it('[Legacy TimeAPI]: Disallows setting of invalid bounds', function () {
    bounds = {
      start: 1,
      end: 0
    };
    expect(api.bounds()).not.toEqual(bounds);
    expect(api.bounds.bind(api, bounds)).toThrow();
    expect(api.bounds()).not.toEqual(bounds);

    bounds = { start: 1 };
    expect(api.bounds()).not.toEqual(bounds);
    expect(api.bounds.bind(api, bounds)).toThrow();
    expect(api.bounds()).not.toEqual(bounds);
  });

  it('Disallows setting of invalid bounds', function () {
    bounds = {
      start: 1,
      end: 0
    };
    expect(api.getBounds()).not.toEqual(bounds);
    expect(api.setBounds.bind(api, bounds)).toThrow();
    expect(api.getBounds()).not.toEqual(bounds);

    bounds = { start: 1 };
    expect(api.getBounds()).not.toEqual(bounds);
    expect(api.setBounds.bind(api, bounds)).toThrow();
    expect(api.getBounds()).not.toEqual(bounds);
  });

  it('[Legacy TimeAPI]: Allows setting of previously registered time system with bounds', function () {
    api.addTimeSystem(timeSystem);
    expect(api.timeSystem()).not.toBe(timeSystem);
    expect(function () {
      api.timeSystem(timeSystem, bounds);
    }).not.toThrow();
    expect(api.timeSystem()).toEqual(timeSystem);
  });

  it('Allows setting of previously registered time system with bounds', function () {
    api.addTimeSystem(timeSystem);
    expect(api.getTimeSystem()).not.toBe(timeSystem);
    expect(function () {
      api.setTimeSystem(timeSystem, bounds);
    }).not.toThrow();
    expect(api.getTimeSystem()).toEqual(timeSystem);
  });

  it('[Legacy TimeAPI]: Disallows setting of time system without bounds', function () {
    api.addTimeSystem(timeSystem);
    expect(api.timeSystem()).not.toBe(timeSystem);
    expect(function () {
      api.timeSystem(timeSystemKey);
    }).toThrow();
    expect(api.timeSystem()).not.toBe(timeSystem);
  });

  it('Allows setting of time system without bounds', function () {
    api.addTimeSystem(timeSystem);
    expect(api.getTimeSystem()).not.toBe(timeSystem);
    expect(function () {
      api.setTimeSystem(timeSystemKey);
    }).not.toThrow();
    expect(api.getTimeSystem()).not.toBe(timeSystem);
  });

  it('Disallows setting of invalid time system', function () {
    expect(function () {
      api.setTimeSystem();
    }).toThrow();
    expect(function () {
      api.setTimeSystem('invalidTimeSystemKey');
    }).toThrow();
    expect(function () {
      api.setTimeSystem({
        key: 'invalidTimeSystemKey'
      });
    }).toThrow();
    expect(function () {
      api.setTimeSystem(42);
    }).toThrow();
  });

  it('allows setting of timesystem without bounds with clock', function () {
    api.addTimeSystem(timeSystem);
    api.addClock(clock);
    api.clock(clockKey, {
      start: 0,
      end: 1
    });
    expect(api.timeSystem()).not.toBe(timeSystem);
    expect(function () {
      api.timeSystem(timeSystemKey);
    }).not.toThrow();
    expect(api.timeSystem()).toEqual(timeSystem);
  });

  it('Emits a legacy event when time system changes', function () {
    api.addTimeSystem(timeSystem);
    expect(eventListener).not.toHaveBeenCalled();
    api.on('timeSystem', eventListener);
    api.timeSystem(timeSystemKey, bounds);
    expect(eventListener).toHaveBeenCalledWith(timeSystem);
  });

  it('Emits an event when time system changes', function () {
    api.addTimeSystem(timeSystem);
    expect(eventListener).not.toHaveBeenCalled();
    api.on('timeSystemChanged', eventListener);
    api.timeSystem(timeSystemKey, bounds);
    expect(eventListener).toHaveBeenCalledWith(timeSystem);
  });

  it('Emits an event when time of interest changes', function () {
    expect(eventListener).not.toHaveBeenCalled();
    api.on('timeOfInterest', eventListener);
    api.timeOfInterest(toi);
    expect(eventListener).toHaveBeenCalledWith(toi);
  });

  it('Emits a legacy event when bounds change', function () {
    expect(eventListener).not.toHaveBeenCalled();
    api.on('bounds', eventListener);
    api.bounds(bounds);
    expect(eventListener).toHaveBeenCalledWith(bounds, false);
  });

  it('Emits an event when bounds change', function () {
    expect(eventListener).not.toHaveBeenCalled();
    api.on('boundsChanged', eventListener);
    api.bounds(bounds);
    expect(eventListener).toHaveBeenCalledWith(bounds, false);
  });

  it('If bounds are set and TOI lies inside them, do not change TOI', function () {
    api.timeOfInterest(6);
    api.bounds({
      start: 1,
      end: 10
    });
    expect(api.timeOfInterest()).toEqual(6);
  });

  it('If bounds are set and TOI lies outside them, reset TOI', function () {
    api.timeOfInterest(11);
    api.bounds({
      start: 1,
      end: 10
    });
    expect(api.timeOfInterest()).toBeUndefined();
  });

  it('Maintains delta during tick', function () {
    const initialBounds = { start: 100, end: 200 };
    api.bounds(initialBounds);
    const mockTickSource = jasmine.createSpyObj('mockTickSource', ['on', 'off', 'currentValue']);
    mockTickSource.key = 'mct';
    mockTickSource.currentValue.and.returnValue(150);
    api.addClock(mockTickSource);
    api.clock('mct', { start: 0, end: 100 });

    // Simulate a tick event
    const tickCallback = mockTickSource.on.calls.mostRecent().args[1];
    tickCallback(150);

    const newBounds = api.bounds();
    expect(newBounds.end - newBounds.start).toEqual(initialBounds.end - initialBounds.start);
  });

  it('Allows registered time system to be activated', function () {
    api.addClock(clock);
    api.clock(clockKey, { start: 0, end: 100 });
    api.addTimeSystem(timeSystem);
    api.timeSystem(timeSystemKey);
    expect(api.timeSystem().key).toEqual(timeSystemKey);
  });

  it('Allows a registered tick source to be activated', function () {
    const mockTickSource = jasmine.createSpyObj('mockTickSource', ['on', 'off', 'currentValue']);
    mockTickSource.key = 'mockTickSource';
    mockTickSource.currentValue.and.returnValue(50);
    api.addClock(mockTickSource);
    api.clock(mockTickSource.key, { start: 0, end: 100 });

    expect(mockTickSource.on).toHaveBeenCalledWith('tick', jasmine.any(Function));
  });

  describe(' when enabling a tick source', function () {
    let mockTickSource;
    let anotherMockTickSource;
    const mockOffsets = {
      start: 0,
      end: 1
    };

    beforeEach(function () {
      mockTickSource = jasmine.createSpyObj('clock', ['on', 'off', 'currentValue']);
      mockTickSource.currentValue.and.returnValue(10);
      mockTickSource.key = 'mts';

      anotherMockTickSource = jasmine.createSpyObj('clock', ['on', 'off', 'currentValue']);
      anotherMockTickSource.key = 'amts';
      anotherMockTickSource.currentValue.and.returnValue(10);

      api.addClock(mockTickSource);
      api.addClock(anotherMockTickSource);
    });

    it('[Legacy TimeAPI]: sets bounds based on current value', function () {
      api.clock('mts', mockOffsets);
      expect(api.bounds()).toEqual({
        start: 10,
        end: 11
      });
    });

    it('does not set bounds based on current value', function () {
      api.setClock('mts');
      expect(api.getBounds()).toEqual({});
    });

    it('does not set invalid clock', function () {
      expect(function () {
        api.setClock();
      }).toThrow();
      expect(function () {
        api.setClock({});
      }).toThrow();
      expect(function () {
        api.setClock('invalidClockKey');
      }).toThrow();
    });

    it('[Legacy TimeAPI]: a new tick listener is registered', function () {
      api.clock('mts', mockOffsets);
      expect(mockTickSource.on).toHaveBeenCalledWith('tick', jasmine.any(Function));
    });

    it('a new tick listener is registered', function () {
      api.setClock('mts', mockOffsets);
      expect(mockTickSource.on).toHaveBeenCalledWith('tick', jasmine.any(Function));
    });

    it('listener of existing tick source is reregistered', function () {
      api.clock('mts', mockOffsets);
      api.clock('amts', mockOffsets);
      expect(mockTickSource.off).toHaveBeenCalledWith('tick', jasmine.any(Function));
    });

    it('[Legacy TimeAPI]: Allows the active clock to be set and unset', function () {
      expect(api.clock()).toBeUndefined();
      api.clock('mts', mockOffsets);
      expect(api.clock()).toBeDefined();
      // Unset the clock
      api.stopClock();
      expect(api.clock()).toBeUndefined();
    });

    it('Provides a default time context', () => {
      const timeContext = api.getContextForView([]);
      expect(timeContext).not.toBe(null);
    });

    it('Without a clock, is in fixed time mode', () => {
      const timeContext = api.getContextForView([]);
      expect(timeContext.isRealTime()).toBe(false);
    });

    it('Provided a clock, is in real-time mode', () => {
      const timeContext = api.getContextForView([]);
      timeContext.clock('mts', {
        start: 0,
        end: 1
      });
      expect(timeContext.isRealTime()).toBe(true);
    });
  });

  it('on tick, observes offsets, and indicates tick in bounds callback', function () {
    const mockTickSource = jasmine.createSpyObj('clock', ['on', 'off', 'currentValue']);
    mockTickSource.currentValue.and.returnValue(100);
    let tickCallback;
    const boundsCallback = jasmine.createSpy('boundsCallback');
    const clockOffsets = {
      start: -100,
      end: 100
    };
    mockTickSource.key = 'mts';

    api.addClock(mockTickSource);
    api.clock('mts', clockOffsets);

    api.on('bounds', boundsCallback);

    tickCallback = mockTickSource.on.calls.mostRecent().args[1];
    tickCallback(1000);
    expect(boundsCallback).toHaveBeenCalledWith(
      {
        start: 900,
        end: 1100
      },
      true
    );
  });
});
