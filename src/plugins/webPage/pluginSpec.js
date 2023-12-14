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

import WebPagePlugin from './plugin';

function getView(openmct, domainObj, objectPath) {
  const applicableViews = openmct.objectViews.get(domainObj, objectPath);
  const webpageView = applicableViews.find((viewProvider) => viewProvider.key === 'webPage');

  return webpageView.view(domainObj, [domainObj]);
}

function destroyView(view) {
  return view.destroy();
}

describe('The web page plugin', function () {
  let mockDomainObject;
  let mockDomainObjectPath;
  let openmct;
  let element;
  let child;
  let view;

  beforeEach((done) => {
    mockDomainObjectPath = [
      {
        name: 'mock webpage',
        type: 'webpage',
        identifier: {
          key: 'mock-webpage',
          namespace: ''
        }
      }
    ];

    mockDomainObject = {
      displayFormat: '',
      name: 'Unnamed WebPage',
      type: 'webPage',
      location: 'f69c21ac-24ef-450c-8e2f-3d527087d285',
      modified: 1627483839783,
      url: '123',
      displayText: '123',
      persisted: 1627483839783,
      id: '3d9c243d-dffb-446b-8474-d9931a99d679',
      identifier: {
        namespace: '',
        key: '3d9c243d-dffb-446b-8474-d9931a99d679'
      }
    };

    openmct = createOpenMct();
    openmct.install(new WebPagePlugin());

    element = document.createElement('div');
    element.style.width = '640px';
    element.style.height = '480px';
    child = document.createElement('div');
    child.style.width = '640px';
    child.style.height = '480px';
    element.appendChild(child);

    openmct.on('start', done);
    openmct.startHeadless();
  });

  afterEach(() => {
    destroyView(view);

    return resetApplicationState(openmct);
  });

  describe('the view', () => {
    beforeEach(() => {
      view = getView(openmct, mockDomainObject, mockDomainObjectPath);
      view.show(child, true);
    });

    it('provides a view', () => {
      expect(view).toBeDefined();
    });
  });
});
