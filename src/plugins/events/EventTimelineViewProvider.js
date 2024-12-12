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
import mount from 'utils/mount';

import EventTimelineView from './components/EventTimelineView.vue';

export default function EventTimestripViewProvider(openmct, extendedLinesBus) {
  const type = 'event.time-line.view';

  function hasEventTelemetry(domainObject) {
    const metadata = openmct.telemetry.getMetadata(domainObject);
    if (!metadata) {
      return false;
    }
    const hasDomain = metadata.valuesForHints(['domain']).length > 0;
    const hasNoRange = !metadata.valuesForHints(['range'])?.length;

    return hasDomain && hasNoRange;
  }

  return {
    key: type,
    name: 'Event Timeline View',
    cssClass: 'icon-event',
    canView: function (domainObject, objectPath) {
      let isChildOfTimeStrip = objectPath.find((object) => object.type === 'time-strip');

      return (
        hasEventTelemetry(domainObject) &&
        isChildOfTimeStrip &&
        !openmct.router.isNavigatedObject(objectPath)
      );
    },
    view: function (domainObject, objectPath) {
      let _destroy = null;
      let component = null;

      return {
        show: function (element) {
          const { vNode, destroy } = mount(
            {
              el: element,
              components: {
                EventTimelineView
              },
              provide: {
                openmct: openmct,
                domainObject: domainObject,
                objectPath: objectPath,
                extendedLinesBus
              },
              template: '<event-timeline-view ref="root"></event-timeline-view>'
            },
            {
              app: openmct.app,
              element
            }
          );
          _destroy = destroy;
          component = vNode.componentInstance;
        },

        destroy: function () {
          if (_destroy) {
            _destroy();
          }
        },

        getComponent() {
          return component;
        }
      };
    }
  };
}
