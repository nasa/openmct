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

import { createOpenMct, resetApplicationState } from '../utils/testing';

describe('The Editor API', () => {
  let openmct;

  beforeEach((done) => {
    openmct = createOpenMct();
    openmct.on('start', done);

    spyOn(openmct.objects, 'endTransaction');

    openmct.startHeadless();
  });

  afterEach(() => {
    return resetApplicationState(openmct);
  });

  it('opens a transaction on edit', () => {
    expect(openmct.objects.isTransactionActive()).toBeFalse();
    openmct.editor.edit();
    expect(openmct.objects.isTransactionActive()).toBeTrue();
  });

  it('closes an open transaction on successful save', async () => {
    spyOn(openmct.objects, 'getActiveTransaction').and.returnValue({
      commit: () => Promise.resolve(true)
    });

    openmct.editor.edit();
    await openmct.editor.save();

    expect(openmct.objects.endTransaction).toHaveBeenCalled();
  });

  it('does not close an open transaction on failed save', async () => {
    spyOn(openmct.objects, 'getActiveTransaction').and.returnValue({
      commit: () => Promise.reject()
    });

    openmct.editor.edit();
    await openmct.editor.save().catch(() => {});

    expect(openmct.objects.endTransaction).not.toHaveBeenCalled();
  });
});
