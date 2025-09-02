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
import FolderGridView from './FolderGridView.js';
import FolderListView from './FolderListView.js';

export default function () {
  return function install(openmct) {
    openmct.types.addType('folder', {
      name: 'Folder',
      key: 'folder',
      description:
        "Create folders to organize other objects or links to objects without the ability to edit it's properties.",
      cssClass: 'icon-folder',
      creatable: true,
      initialize: function (domainObject) {
        domainObject.composition = [];
      }
    });

    openmct.objectViews.addProvider(new FolderGridView(openmct));
    openmct.objectViews.addProvider(new FolderListView(openmct));
  };
}
