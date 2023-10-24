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

import { createOpenMct } from 'utils/testing';

import TimeAPI from './TimeAPI';
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
});
