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
import { createOpenMct, resetApplicationState } from 'utils/testing';

describe('the plugin', () => {
  let openmct;
  let viewDatumAction;
  let mockObjectPath;
  let mockView;
  let mockDatum;

  beforeEach((done) => {
    openmct = createOpenMct();

    openmct.on('start', done);
    openmct.startHeadless();

    viewDatumAction = openmct.actions._allActions.viewDatumAction;

    mockObjectPath = [
      {
        name: 'mock object',
        type: 'telemetry-table',
        identifier: {
          key: 'mock-object',
          namespace: ''
        }
      }
    ];

    mockDatum = {
      time: 123456789,
      sin: 0.4455512,
      cos: 0.4455512
    };

    mockView = {
      getViewContext: () => {
        return {
          row: {
            viewDatumAction: true,
            getDatum: () => {
              return mockDatum;
            }
          }
        };
      }
    };
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  it('installs the view datum action', () => {
    expect(viewDatumAction).toBeDefined();
  });

  describe('when invoked', () => {
    beforeEach(() => {
      openmct.overlays.overlay = function (options) {};

      spyOn(openmct.overlays, 'overlay');

      viewDatumAction.invoke(mockObjectPath, mockView);
    });

    it('creates an overlay', () => {
      expect(openmct.overlays.overlay).toHaveBeenCalled();
    });
  });
});
