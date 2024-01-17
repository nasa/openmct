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

export default class OpenImageInNewTabAction {
  constructor(openmct) {
    this.openmct = openmct;

    this.cssClass = 'icon-new-window';
    this.description = 'Open the image in a new tab';
    this.group = 'action';
    this.key = 'openImageInNewTab';
    this.name = 'Open Image in New Tab';
    this.priority = 1;
  }

  invoke(objectPath, view) {
    const viewContext = (view.getViewContext && view.getViewContext()) || {};
    window.open(viewContext.imageUrl, '_blank').focus();
  }

  appliesTo(objectPath, view = {}) {
    const viewContext = (view.getViewContext && view.getViewContext()) || {};
    if (!viewContext.imageUrl) {
      return false;
    }
  }
}
