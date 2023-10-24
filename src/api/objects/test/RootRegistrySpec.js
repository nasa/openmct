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

import { createOpenMct, resetApplicationState } from '../../../utils/testing';

describe('RootRegistry', () => {
  let openmct;
  let idA;
  let idB;
  let idC;
  let idD;

  beforeEach((done) => {
    openmct = createOpenMct();
    idA = {
      key: 'keyA',
      namespace: 'something'
    };
    idB = {
      key: 'keyB',
      namespace: 'something'
    };
    idC = {
      key: 'keyC',
      namespace: 'something'
    };
    idD = {
      key: 'keyD',
      namespace: 'something'
    };

    openmct.on('start', done);
    openmct.startHeadless();
  });

  afterEach(async () => {
    await resetApplicationState(openmct);
  });

  it('can register a root by identifier', () => {
    openmct.objects.addRoot(idA);

    return openmct.objects.getRoot().then((rootObject) => {
      expect(rootObject.composition).toEqual([idA]);
    });
  });

  it('can register multiple roots by identifier', () => {
    openmct.objects.addRoot([idA, idB]);

    return openmct.objects.getRoot().then((rootObject) => {
      expect(rootObject.composition).toEqual([idA, idB]);
    });
  });

  it('can register an asynchronous root ', () => {
    openmct.objects.addRoot(() => Promise.resolve(idA));

    return openmct.objects.getRoot().then((rootObject) => {
      expect(rootObject.composition).toEqual([idA]);
    });
  });

  it('can register multiple asynchronous roots', () => {
    openmct.objects.addRoot(() => Promise.resolve([idA, idB]));

    return openmct.objects.getRoot().then((rootObject) => {
      expect(rootObject.composition).toEqual([idA, idB]);
    });
  });

  it('can combine different types of registration', () => {
    openmct.objects.addRoot([idA, idB]);
    openmct.objects.addRoot(() => Promise.resolve([idC]));

    return openmct.objects.getRoot().then((rootObject) => {
      expect(rootObject.composition).toEqual([idA, idB, idC]);
    });
  });

  it('supports priority ordering for identifiers', () => {
    openmct.objects.addRoot(idA, openmct.priority.LOW);
    openmct.objects.addRoot(idB, openmct.priority.HIGH);
    openmct.objects.addRoot(idC); // DEFAULT

    return openmct.objects.getRoot().then((rootObject) => {
      expect(rootObject.composition[0]).toEqual(idB);
      expect(rootObject.composition[1]).toEqual(idC);
      expect(rootObject.composition[2]).toEqual(idA);
    });
  });

  it('supports priority ordering for different types of registration', () => {
    openmct.objects.addRoot(() => Promise.resolve([idC]), openmct.priority.LOW);
    openmct.objects.addRoot(idB, openmct.priority.HIGH);
    openmct.objects.addRoot([idA, idD]); // default

    return openmct.objects.getRoot().then((rootObject) => {
      expect(rootObject.composition[0]).toEqual(idB);
      expect(rootObject.composition[1]).toEqual(idA);
      expect(rootObject.composition[2]).toEqual(idD);
      expect(rootObject.composition[3]).toEqual(idC);
    });
  });
});
