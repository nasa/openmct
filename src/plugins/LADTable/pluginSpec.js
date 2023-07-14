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
import LadPlugin from './plugin.js';
import Vue from 'vue';
import {
  createOpenMct,
  getMockObjects,
  getMockTelemetry,
  getLatestTelemetry,
  spyOnBuiltins,
  resetApplicationState
} from 'utils/testing';

const TABLE_BODY_ROWS = '.js-lad-table__body__row';
const TABLE_BODY_FIRST_ROW = TABLE_BODY_ROWS + ':first-child';
const TABLE_BODY_FIRST_ROW_FIRST_DATA = TABLE_BODY_FIRST_ROW + ' .js-first-data';
const TABLE_BODY_FIRST_ROW_SECOND_DATA = TABLE_BODY_FIRST_ROW + ' .js-second-data';
const TABLE_BODY_FIRST_ROW_THIRD_DATA = TABLE_BODY_FIRST_ROW + ' .js-third-data';
const LAD_SET_TABLE_HEADERS = '.js-lad-table-set__table-headers';

function utcTimeFormat(value) {
  return new Date(value).toISOString().replace('T', ' ');
}

describe('The LAD Table', () => {
  const ladTableKey = 'LadTable';

  let openmct;
  let ladPlugin;
  let historicalProvider;
  let parent;
  let child;
  let telemetryCount = 3;
  let timeFormat = 'utc';
  let mockTelemetry = getMockTelemetry({
    count: telemetryCount,
    format: timeFormat
  });
  let mockObj = getMockObjects({
    objectKeyStrings: ['ladTable', 'telemetry'],
    format: timeFormat
  });
  let bounds = {
    start: 0,
    end: 4
  };

  // add telemetry object as composition in lad table
  mockObj.ladTable.composition.push(mockObj.telemetry.identifier);

  // this setups up the app
  beforeEach((done) => {
    openmct = createOpenMct();

    parent = document.createElement('div');
    child = document.createElement('div');
    parent.appendChild(child);

    spyOn(openmct.telemetry, 'request').and.returnValue(Promise.resolve([]));

    ladPlugin = new LadPlugin();
    openmct.install(ladPlugin);

    spyOn(openmct.objects, 'get').and.returnValue(Promise.resolve({}));

    historicalProvider = {
      request: () => {
        return Promise.resolve([]);
      }
    };
    spyOn(openmct.telemetry, 'findRequestProvider').and.returnValue(historicalProvider);

    openmct.time.bounds({
      start: bounds.start,
      end: bounds.end
    });

    openmct.on('start', done);
    openmct.startHeadless();
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  it('should provide a table view only for lad table objects', () => {
    let applicableViews = openmct.objectViews.get(mockObj.ladTable, []);

    let ladTableView = applicableViews.find((viewProvider) => viewProvider.key === ladTableKey);

    expect(applicableViews.length).toEqual(1);
    expect(ladTableView).toBeDefined();
  });

  describe('composition', () => {
    let ladTableCompositionCollection;

    beforeEach(() => {
      ladTableCompositionCollection = openmct.composition.get(mockObj.ladTable);

      return ladTableCompositionCollection.load();
    });

    it('should accept telemetry producing objects', () => {
      expect(() => {
        ladTableCompositionCollection.add(mockObj.telemetry);
      }).not.toThrow();
    });

    it('should reject non-telemtry producing objects', () => {
      expect(() => {
        ladTableCompositionCollection.add(mockObj.ladTable);
      }).toThrow();
    });
  });

  describe('table view', () => {
    let applicableViews;
    let ladTableViewProvider;
    let ladTableView;
    let anotherTelemetryObj = getMockObjects({
      objectKeyStrings: ['telemetry'],
      overwrite: {
        telemetry: {
          name: 'New Telemetry Object',
          identifier: {
            namespace: '',
            key: 'another-telemetry-object'
          }
        }
      }
    }).telemetry;

    const aggregateTelemetryObj = getMockObjects({
      objectKeyStrings: ['telemetry'],
      overwrite: {
        telemetry: {
          name: 'Aggregate Telemetry Object',
          identifier: {
            namespace: '',
            key: 'aggregate-telemetry-object'
          }
        }
      }
    }).telemetry;

    // add another aggregate telemetry object as composition in lad table to test multi rows
    aggregateTelemetryObj.composition = [anotherTelemetryObj.identifier];
    mockObj.ladTable.composition.push(aggregateTelemetryObj.identifier);

    beforeEach(async () => {
      let telemetryRequestResolve;
      let telemetryObjectResolve;
      let anotherTelemetryObjectResolve;
      let aggregateTelemetryObjectResolve;
      const telemetryRequestPromise = new Promise((resolve) => {
        telemetryRequestResolve = resolve;
      });
      const telemetryObjectPromise = new Promise((resolve) => {
        telemetryObjectResolve = resolve;
      });
      const anotherTelemetryObjectPromise = new Promise((resolve) => {
        anotherTelemetryObjectResolve = resolve;
      });

      const aggregateTelemetryObjectPromise = new Promise((resolve) => {
        aggregateTelemetryObjectResolve = resolve;
      });

      spyOnBuiltins(['requestAnimationFrame']);
      window.requestAnimationFrame.and.callFake((callBack) => {
        callBack();
      });

      historicalProvider.request = () => {
        telemetryRequestResolve(mockTelemetry);

        return telemetryRequestPromise;
      };

      openmct.objects.get.and.callFake((obj) => {
        if (obj.key === 'telemetry-object') {
          telemetryObjectResolve(mockObj.telemetry);

          return telemetryObjectPromise;
        } else if (obj.key === 'another-telemetry-object') {
          anotherTelemetryObjectResolve(anotherTelemetryObj);

          return anotherTelemetryObjectPromise;
        } else {
          aggregateTelemetryObjectResolve(aggregateTelemetryObj);

          return aggregateTelemetryObjectPromise;
        }
      });

      openmct.time.bounds({
        start: bounds.start,
        end: bounds.end
      });

      applicableViews = openmct.objectViews.get(mockObj.ladTable, []);
      ladTableViewProvider = applicableViews.find(
        (viewProvider) => viewProvider.key === ladTableKey
      );
      ladTableView = ladTableViewProvider.view(mockObj.ladTable, [mockObj.ladTable]);
      ladTableView.show(child, true);

      await Promise.all([
        telemetryRequestPromise,
        telemetryObjectPromise,
        anotherTelemetryObjectPromise,
        aggregateTelemetryObjectResolve
      ]);
      await Vue.nextTick();
    });

    it('should show one row per object in the composition', () => {
      const rowCount = parent.querySelectorAll(TABLE_BODY_ROWS).length;
      expect(rowCount).toBe(mockObj.ladTable.composition.length);
    });

    it('should show the most recent datum from the telemetry producing object', async () => {
      const latestDatum = getLatestTelemetry(mockTelemetry, { timeFormat });
      const expectedDate = utcTimeFormat(latestDatum[timeFormat]);
      await Vue.nextTick();
      const latestDate = parent.querySelector(TABLE_BODY_FIRST_ROW_SECOND_DATA).innerText;
      expect(latestDate).toBe(expectedDate);
      const dataType = parent
        .querySelector(TABLE_BODY_ROWS)
        .querySelector('.js-type-data').innerText;
      expect(dataType).toBe('Telemetry');
    });

    it('should show aggregate telemetry type with blank data', async () => {
      await Vue.nextTick();
      const lastestData = parent
        .querySelectorAll(TABLE_BODY_ROWS)[1]
        .querySelectorAll('td')[2].innerText;
      expect(lastestData).toBe('---');
      const dataType = parent
        .querySelectorAll(TABLE_BODY_ROWS)[1]
        .querySelector('.js-type-data').innerText;
      expect(dataType).toBe('Aggregate');
    });

    it('should show the name provided for the the telemetry producing object', () => {
      const rowName = parent.querySelector(TABLE_BODY_FIRST_ROW_FIRST_DATA).innerText.trim();

      const expectedName = mockObj.telemetry.name;
      expect(rowName).toBe(expectedName);
    });

    it('should show the correct values for the datum based on domain and range hints', async () => {
      const range = mockObj.telemetry.telemetry.values.find((val) => {
        return val.hints && val.hints.range !== undefined;
      }).key;
      const domain = mockObj.telemetry.telemetry.values.find((val) => {
        return val.hints && val.hints.domain !== undefined;
      }).key;
      const mostRecentTelemetry = getLatestTelemetry(mockTelemetry, { timeFormat });
      const rangeValue = mostRecentTelemetry[range];
      const domainValue = utcTimeFormat(mostRecentTelemetry[domain]);
      await Vue.nextTick();
      const actualDomainValue = parent.querySelector(TABLE_BODY_FIRST_ROW_SECOND_DATA).innerText;
      const actualRangeValue = parent.querySelector(TABLE_BODY_FIRST_ROW_THIRD_DATA).innerText;
      expect(actualRangeValue).toBe(rangeValue);
      expect(actualDomainValue).toBe(domainValue);
    });
  });
});

describe('The LAD Table Set', () => {
  const ladTableSetKey = 'LadTableSet';

  let openmct;
  let ladPlugin;
  let parent;
  let child;

  let mockObj = getMockObjects({
    objectKeyStrings: ['ladTable', 'ladTableSet', 'telemetry']
  });

  let bounds = {
    start: 0,
    end: 4
  };

  // add mock telemetry to lad table and lad table to lad table set (composition)
  mockObj.ladTable.composition.push(mockObj.telemetry.identifier);
  mockObj.ladTableSet.composition.push(mockObj.ladTable.identifier);

  beforeEach((done) => {
    openmct = createOpenMct();

    parent = document.createElement('div');
    child = document.createElement('div');
    parent.appendChild(child);

    ladPlugin = new LadPlugin();
    openmct.install(ladPlugin);

    openmct.time.bounds({
      start: bounds.start,
      end: bounds.end
    });

    openmct.on('start', done);
    openmct.startHeadless();
  });

  afterEach(() => {
    openmct.time.timeSystem('utc', {
      start: 0,
      end: 1
    });

    return resetApplicationState(openmct);
  });

  it('should provide a lad table set view only for lad table set objects', () => {
    spyOn(openmct.objects, 'get').and.returnValue(Promise.resolve({}));

    let applicableViews = openmct.objectViews.get(mockObj.ladTableSet, []);

    let ladTableSetView = applicableViews.find(
      (viewProvider) => viewProvider.key === ladTableSetKey
    );

    expect(applicableViews.length).toEqual(1);
    expect(ladTableSetView).toBeDefined();
  });

  describe('composition', () => {
    let ladTableSetCompositionCollection;

    beforeEach(() => {
      spyOn(openmct.objects, 'get').and.returnValue(Promise.resolve({}));

      ladTableSetCompositionCollection = openmct.composition.get(mockObj.ladTableSet);

      return ladTableSetCompositionCollection.load();
    });

    it('should accept lad table objects', () => {
      expect(() => {
        ladTableSetCompositionCollection.add(mockObj.ladTable);
      }).not.toThrow();
    });

    it('should reject non lad table objects', () => {
      expect(() => {
        ladTableSetCompositionCollection.add(mockObj.telemetry);
      }).toThrow();
    });
  });

  describe('table view', () => {
    let applicableViews;
    let ladTableSetViewProvider;
    let ladTableSetView;

    let otherObj = getMockObjects({
      objectKeyStrings: ['ladTable'],
      overwrite: {
        ladTable: {
          name: 'New LAD Table Object',
          identifier: {
            namespace: '',
            key: 'another-lad-object'
          }
        }
      }
    });

    // add another lad table (with telemetry object) object to the lad table set for multi row test
    otherObj.ladTable.composition.push(mockObj.telemetry.identifier);
    mockObj.ladTableSet.composition.push(otherObj.ladTable.identifier);

    beforeEach(() => {
      spyOn(openmct.telemetry, 'request').and.returnValue(Promise.resolve([]));

      spyOn(openmct.objects, 'get').and.callFake((obj) => {
        if (obj.key === 'lad-object') {
          return Promise.resolve(mockObj.ladTable);
        } else if (obj.key === 'another-lad-object') {
          return Promise.resolve(otherObj.ladTable);
        } else if (obj.key === 'telemetry-object') {
          return Promise.resolve(mockObj.telemetry);
        }
      });

      openmct.time.bounds({
        start: bounds.start,
        end: bounds.end
      });

      applicableViews = openmct.objectViews.get(mockObj.ladTableSet, []);
      ladTableSetViewProvider = applicableViews.find(
        (viewProvider) => viewProvider.key === ladTableSetKey
      );
      ladTableSetView = ladTableSetViewProvider.view(mockObj.ladTableSet, [mockObj.ladTableSet]);
      ladTableSetView.show(child);

      return Vue.nextTick();
    });

    it('should show one row per lad table object in the composition', () => {
      const ladTableSetCompositionCollection = openmct.composition.get(mockObj.ladTableSet);

      return ladTableSetCompositionCollection.load().then(() => {
        const rowCount = parent.querySelectorAll(LAD_SET_TABLE_HEADERS).length;

        expect(rowCount).toBe(mockObj.ladTableSet.composition.length);
      });
    });
  });
});
