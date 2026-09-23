/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2026, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * 'License'); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
import { debounce } from 'lodash';
import { createOpenMct, renderWhenVisible, resetApplicationState } from 'utils/testing';
import { nextTick } from 'vue';

import { PIE_CHART_KEY, PIE_CHART_VIEW } from './PieChartConstants.js';

const pieChartDomainObject = {
  identifier: {
    key: 'pie-chart',
    namespace: 'test-namespace'
  },
  type: PIE_CHART_KEY,
  composition: []
};

const wedgeMetadata = [
  { key: 'shallow', name: 'Shallow' },
  { key: 'deep', name: 'Deep' }
];

describe('the plugin', () => {
  let openmct;
  let child;
  let pieChartHolder;

  beforeEach((done) => {
    pieChartHolder = document.createElement('div');
    pieChartHolder.style.display = 'block';
    pieChartHolder.style.width = '1920px';
    pieChartHolder.style.height = '1080px';

    child = document.createElement('div');
    pieChartHolder.appendChild(child);

    openmct = createOpenMct();
    openmct.on('start', done);

    openmct.install(openmct.plugins.PieChart());

    openmct.startHeadless();
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  describe('the pie chart object type', () => {
    it('defines a pie chart object type with the correct key', () => {
      const pieChartType = openmct.types.get(PIE_CHART_KEY);
      expect(pieChartType).not.toBeNull();
      expect(pieChartType.definition.name).toEqual('Pie Chart');
    });

    it('is creatable', () => {
      const pieChartType = openmct.types.get(PIE_CHART_KEY);
      expect(pieChartType.definition.creatable).toBeTrue();
    });
  });

  describe('the pie chart composition policy', () => {
    let parentObject;

    beforeEach(() => {
      parentObject = {
        composition: [],
        configuration: {},
        name: 'Some Pie Chart',
        type: PIE_CHART_KEY,
        location: 'mine',
        identifier: {
          namespace: '',
          key: 'b78e7e23-f2b8-4776-b1f0-3ff778f5c8a9'
        }
      };
    });

    it('allows composition for telemetry that contains at least one scalar range value', () => {
      const testTelemetryObject = {
        identifier: {
          namespace: '',
          key: 'test-object'
        },
        type: 'test-object',
        name: 'Test Object',
        telemetry: {
          values: [
            {
              key: 'shallow',
              source: 'shallow',
              name: 'Shallow',
              format: 'float',
              hints: { range: 1 }
            }
          ]
        }
      };
      const composition = openmct.composition.get(parentObject);
      expect(() => {
        composition.add(testTelemetryObject);
      }).not.toThrow();
      expect(parentObject.composition.length).toBe(1);
    });

    it("disallows composition for telemetry that don't contain any range hints", () => {
      const testTelemetryObject = {
        identifier: {
          namespace: '',
          key: 'test-object'
        },
        type: 'test-object',
        name: 'Test Object',
        telemetry: {
          values: [
            {
              key: 'some-key',
              name: 'Some attribute'
            }
          ]
        }
      };
      const composition = openmct.composition.get(parentObject);
      expect(() => {
        composition.add(testTelemetryObject);
      }).toThrow();
      expect(parentObject.composition.length).toBe(0);
    });

    it('disallows composition for telemetry whose only range value is array-valued', () => {
      const testTelemetryObject = {
        identifier: {
          namespace: '',
          key: 'test-object'
        },
        type: 'test-object',
        name: 'Test Object',
        telemetry: {
          values: [
            {
              key: 'depths',
              source: 'depths',
              name: 'Depths',
              format: 'float[]',
              hints: { range: 1 }
            }
          ]
        }
      };
      const composition = openmct.composition.get(parentObject);
      expect(() => {
        composition.add(testTelemetryObject);
      }).toThrow();
      expect(parentObject.composition.length).toBe(0);
    });
  });

  describe('the pie chart view', () => {
    let pieChartViewProvider;
    let pieChartView;
    let pieChartViewObject;
    let mutablePieChartObject;
    let randomShallowValue;
    let randomDeepValue;

    beforeEach(() => {
      randomShallowValue = Math.random() * 100;
      randomDeepValue = Math.random() * 100;

      pieChartViewObject = {
        ...pieChartDomainObject,
        configuration: {
          pieChartController: {
            shape: 'full-circle',
            target: 100,
            highlightedKey: 'deep'
          }
        },
        composition: [
          {
            namespace: 'test-namespace',
            key: 'test-object'
          }
        ],
        id: 'test-object',
        name: 'pie chart'
      };

      const testObjectProvider = jasmine.createSpyObj('testObjectProvider', [
        'get',
        'create',
        'update',
        'observe'
      ]);

      openmct.editor = {};
      openmct.editor.isEditing = () => false;

      const applicableViews = openmct.objectViews.get(pieChartViewObject, [pieChartViewObject]);
      pieChartViewProvider = applicableViews.find(
        (viewProvider) => viewProvider.key === PIE_CHART_VIEW
      );

      testObjectProvider.get.and.returnValue(Promise.resolve(pieChartViewObject));
      testObjectProvider.create.and.returnValue(Promise.resolve(pieChartViewObject));
      openmct.objects.addProvider('test-namespace', testObjectProvider);
      testObjectProvider.observe.and.returnValue(() => {});
      testObjectProvider.create.and.returnValue(Promise.resolve(true));
      testObjectProvider.update.and.returnValue(Promise.resolve(true));

      spyOn(openmct.telemetry, 'getMetadata').and.returnValue({
        valuesForHints: () => wedgeMetadata,
        isArrayValue: () => false
      });
      spyOn(openmct.telemetry, 'getFormatMap').and.returnValue({
        shallow: { format: () => randomShallowValue },
        deep: { format: () => randomDeepValue }
      });
      spyOn(openmct.telemetry, 'request').and.returnValue(
        Promise.resolve([{ shallow: randomShallowValue, deep: randomDeepValue }])
      );

      return openmct.objects.getMutable(pieChartViewObject.identifier).then((mutableObject) => {
        mutablePieChartObject = mutableObject;
        pieChartView = pieChartViewProvider.view(mutablePieChartObject, [mutablePieChartObject]);
        pieChartView.show(child, false, { renderWhenVisible });

        return nextTick();
      });
    });

    afterEach(() => {
      pieChartView.destroy();

      return resetApplicationState(openmct);
    });

    it('provides a pie chart view', () => {
      expect(pieChartViewProvider).toBeDefined();
    });

    it('renders a wedge per scalar range value', (done) => {
      function checkWedges() {
        const wedgeElements = pieChartHolder.querySelectorAll('.c-pie-chart__wedge');
        // one wedge per metadata entry, plus the remaining/unfilled wedge
        expect(wedgeElements.length).toBe(wedgeMetadata.length + 1);
        done();
      }

      const debouncedCheckWedges = debounce(checkWedges, 200);
      nextTick(debouncedCheckWedges);
    });

    it('highlights the configured wedge', (done) => {
      function checkHighlighted() {
        const highlightedElements = pieChartHolder.querySelectorAll(
          '.c-pie-chart__wedge.is-highlighted'
        );
        expect(highlightedElements.length).toBe(1);
        done();
      }

      const debouncedCheckHighlighted = debounce(checkHighlighted, 200);
      nextTick(debouncedCheckHighlighted);
    });
  });
});
