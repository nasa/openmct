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

export default class CopyImageAction {
  constructor(openmct) {
    this.openmct = openmct;

    this.cssClass = 'icon-box-with-arrow';
    this.description = 'Copy the image to the clipboard';
    this.group = 'action';
    this.key = 'copyImage';
    this.name = 'Copy Image';
    this.priority = 1;
  }

  async invoke(objectPath, view) {
    const imageUrl = view.getViewContext().imageUrl;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const clipboardItem = new ClipboardItem({ [blob.type]: blob });
      await navigator.clipboard.write([clipboardItem]);
    } catch (err) {
      console.error('Failed to copy image to clipboard: ', err);
    }
  }

  appliesTo(objectPath, view = {}) {
    const viewContext = (view.getViewContext && view.getViewContext()) || {};
    if (!viewContext.imageUrl) {
      return false;
    }
  }
}
