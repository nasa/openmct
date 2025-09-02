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

const GO_TO_ORIGINAL_ACTION_KEY = 'goToOriginal';

class GoToOriginalAction {
  constructor(openmct) {
    this.name = 'Go To Original';
    this.key = GO_TO_ORIGINAL_ACTION_KEY;
    this.description = 'Go to the original unlinked instance of this object';
    this.group = 'action';
    this.priority = 4;

    this._openmct = openmct;
  }
  invoke(objectPath) {
    this._openmct.objects.getOriginalPath(objectPath[0].identifier).then((originalPath) => {
      let url =
        '#/browse/' +
        originalPath
          .map(
            function (o) {
              return o && this._openmct.objects.makeKeyString(o.identifier);
            }.bind(this)
          )
          .reverse()
          .slice(1)
          .join('/');

      this._openmct.router.navigate(url);
    });
  }
  appliesTo(objectPath) {
    if (this._openmct.editor.isEditing()) {
      return false;
    }

    let parentKeystring =
      objectPath[1] && this._openmct.objects.makeKeyString(objectPath[1].identifier);

    if (!parentKeystring) {
      return false;
    }

    return parentKeystring !== objectPath[0].location;
  }
}

export { GO_TO_ORIGINAL_ACTION_KEY };

export default GoToOriginalAction;
