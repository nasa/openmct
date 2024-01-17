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

export default class SaveImageAction {
  constructor(openmct) {
    this.openmct = openmct;

    this.cssClass = 'icon-save-as';
    this.description = 'Save image to file';
    this.group = 'action';
    this.key = 'saveImageAs';
    this.name = 'Save Image As';
    this.priority = 1;
  }

  async invoke(objectPath, view) {
    const viewContext = (view.getViewContext && view.getViewContext()) || {};
    try {
      const filename =
        viewContext.imageUrl.split('/').pop().split('#')[0].split('?')[0] || 'downloaded-image.png';
      const response = await fetch(viewContext.imageUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      // Create a temporary anchor element and trigger the download
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename; // Set the filename for the download

      // Append anchor to body, trigger click, then remove it from the DOM
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Revoke the blob URL after the download
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Could not download the image.', error);
    }
  }

  appliesTo(objectPath, view = {}) {
    const viewContext = (view.getViewContext && view.getViewContext()) || {};
    if (!viewContext.imageUrl) {
      return false;
    }
  }
}
