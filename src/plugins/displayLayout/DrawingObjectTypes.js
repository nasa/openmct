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
const displayLayoutDrawingObjectTypes = {
  'box-view': {
    name: 'Box',
    creatable: false,
    description: 'A rectangle shape.',
    cssClass: 'icon-box-round-corners'
  },
  'ellipse-view': {
    name: 'Ellipse',
    creatable: false,
    description: 'A ellipse shape.',
    cssClass: 'icon-circle'
  },
  'line-view': {
    name: 'Line',
    creatable: false,
    description: 'A line.',
    cssClass: 'icon-line-horz'
  },
  'text-view': {
    name: 'Text',
    creatable: false,
    description: 'An editable text box.',
    cssClass: 'icon-font'
  },
  'image-view': {
    name: 'Image',
    creatable: false,
    description: 'An image.',
    cssClass: 'icon-image'
  }
};

export default displayLayoutDrawingObjectTypes;
