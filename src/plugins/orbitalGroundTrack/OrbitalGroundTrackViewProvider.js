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
 *****************************************************************************/

import mount from '../../utils/mount.js';
import GroundTrackView from './components/GroundTrackView.vue';

/**
 * Provider for the Orbital Ground Track view.
 * Integrates with Open MCT's view system to provide map-based visualization for satellite objects.
 */
export default class OrbitalGroundTrackViewProvider {
  /**
   * Initializes the view provider.
   * @param {Object} openmct The Open MCT API instance.
   */
  constructor(openmct) {
    this.openmct = openmct;
    this.key = 'orbital-ground-track';
    this.name = 'Orbital Ground Track';
    this.cssClass = 'icon-telemetry';
  }

  /**
   * Determines if this provider can provide a view for the given domain object.
   * @param {Object} domainObject The domain object to check.
   * @returns {boolean} True if the view is applicable.
   */
  canView(domainObject) {
    return domainObject.type === 'satellite';
  }

  /**
   * Creates the view for the given domain object.
   * @param {Object} domainObject The domain object for the view.
   * @param {Object[]} objectPath The path to the domain object.
   * @returns {Object} The view definition.
   */
  view(domainObject, objectPath) {
    const openmct = this.openmct;
    let _destroy = null;

    return {
      show: (element) => {
        const { destroy } = mount(
          {
            el: element,
            components: {
              GroundTrackView
            },
            provide: {
              openmct,
              domainObject,
              objectPath
            },
            template: '<ground-track-view />'
          },
          {
            element
          }
        );
        _destroy = destroy;
      },
      destroy: () => {
        if (_destroy) {
          _destroy();
        }
      }
    };
  }

  /**
   * Sets the priority for this view provider.
   * @returns {number}
   */
  priority() {
    return 100;
  }
}
