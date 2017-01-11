/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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

define(
    [],
    () => {


        /**
         * Add one domain object to another's composition.
         * @constructor
         * @memberof platform/commonUI/edit
         * @implements {Action}
         */
        class EditAndComposeAction {
          constructor(context) {
            this.domainObject = (context || {}).domainObject;
            this.selectedObject = (context || {}).selectedObject;
        }

        perform() {
            var editAction = this.domainObject.getCapability('action').getActions("edit")[0];

            // Link these objects
            const doLink = () => {
                let composition = self.domainObject &&
                        this.domainObject.getCapability('composition');
                return composition && composition.add(this.selectedObject);
            }

            if (editAction) {
                editAction.perform();
            }

            return this.selectedObject && doLink();
        }
      }
        return EditAndComposeAction;
    }
);
