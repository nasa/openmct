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

import OrbitalGroundTrackViewProvider from './OrbitalGroundTrackViewProvider.js';

/**
 * Plugin that adds satellite ground track visualization to Open MCT.
 * It registers a 'satellite' object type and a view provider for orbital ground tracks.
 * @returns {function} The plugin installer function.
 */
export default function plugin() {
  /**
   * Installs the plugin into Open MCT.
   * @param {Object} openmct The Open MCT API instance.
   */
  return function install(openmct) {
    openmct.types.addType('satellite', {
      name: 'Satellite',
      description: 'A satellite object defined by TLE data.',
      initialize: function (domainObject) {
        domainObject.tle = {
          line1: '',
          line2: ''
        };
      },
      form: [
        {
          key: 'tle.line1',
          name: 'TLE Line 1',
          control: 'textfield',
          required: true,
          property: ['tle', 'line1']
        },
        {
          key: 'tle.line2',
          name: 'TLE Line 2',
          control: 'textfield',
          required: true,
          property: ['tle', 'line2']
        }
      ],
      creatable: true
    });

    openmct.objectViews.addProvider(new OrbitalGroundTrackViewProvider(openmct));
  };
}
