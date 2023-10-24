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

import HyperlinkProvider from './HyperlinkProvider';

export default function () {
  return function install(openmct) {
    openmct.types.addType('hyperlink', {
      name: 'Hyperlink',
      key: 'hyperlink',
      description: 'A text element or button that links to any URL including Open MCT views.',
      creatable: true,
      cssClass: 'icon-chain-links',
      initialize: function (domainObject) {
        domainObject.displayFormat = 'link';
        domainObject.linkTarget = '_self';
      },
      form: [
        {
          key: 'url',
          name: 'URL',
          control: 'textfield',
          required: true,
          cssClass: 'l-input-lg'
        },
        {
          key: 'displayText',
          name: 'Text to Display',
          control: 'textfield',
          required: true,
          cssClass: 'l-input-lg'
        },
        {
          key: 'displayFormat',
          name: 'Display Format',
          control: 'select',
          options: [
            {
              name: 'Link',
              value: 'link'
            },
            {
              name: 'Button',
              value: 'button'
            }
          ],
          cssClass: 'l-inline'
        },
        {
          key: 'linkTarget',
          name: 'Tab to Open Hyperlink',
          control: 'select',
          options: [
            {
              name: 'Open in this tab',
              value: '_self'
            },
            {
              name: 'Open in a new tab',
              value: '_blank'
            }
          ],
          cssClass: 'l-inline'
        }
      ]
    });
    openmct.objectViews.addProvider(new HyperlinkProvider(openmct));
  };
}
