/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2026, United States Government
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

import mount from 'utils/mount';

import { isSignalModuleType } from '../types/signal-types.js';
import SignalMapView from './SignalMapView.vue';
import SignalView from './SignalView.vue';

export function installSignalViewProvider(openmct) {
  openmct.objectViews.addProvider({
    key: 'signal.element.view',
    name: 'Signal View',
    cssClass: 'icon-telemetry',
    canView(domainObject) {
      return isSignalModuleType(domainObject.type);
    },
    canEdit(domainObject) {
      return isSignalModuleType(domainObject.type);
    },
    view(domainObject) {
      let destroyView;

      return {
        show(element) {
          const { destroy } = mount(
            {
              el: element,
              components: { SignalView },
              provide: { openmct, domainObject },
              template: '<SignalView />'
            },
            {
              app: openmct.app,
              element
            }
          );

          destroyView = destroy;
        },
        destroy() {
          if (destroyView) {
            destroyView();
          }
        }
      };
    },
    priority() {
      return 1;
    }
  });

  openmct.objectViews.addProvider({
    key: 'signal.map.view',
    name: 'Signal Map',
    cssClass: 'icon-map',
    canView(domainObject) {
      return isSignalModuleType(domainObject.type);
    },
    canEdit() {
      return false;
    },
    view(domainObject) {
      let destroyView;

      return {
        show(element) {
          const { destroy } = mount(
            {
              el: element,
              components: { SignalMapView },
              provide: { openmct, domainObject },
              template: '<SignalMapView />'
            },
            {
              app: openmct.app,
              element
            }
          );

          destroyView = destroy;
        },
        destroy() {
          if (destroyView) {
            destroyView();
          }
        }
      };
    },
    priority() {
      return 0;
    }
  });
}
