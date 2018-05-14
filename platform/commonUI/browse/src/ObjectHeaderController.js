/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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
    function () {

        /**
         * Controller to provide the ability to inline edit an object name.
         *
         * @constructor
         * @memberof platform/commonUI/browse
         */
        function ObjectHeaderController($scope) {
            this.$scope = $scope;
            this.domainObject = $scope.domainObject;
            this.editable = this.allowEdit();
        }

        /**
         * Updates the object name on blur and enter keypress events.
         *
         * @param event the mouse event
         */
        ObjectHeaderController.prototype.updateName = function (event) {
            if (!event || !event.currentTarget) {
                return;
            }

            if (event.type === 'blur') {
                this.updateModel(event);
            } else if (event.which === 13) {
                this.updateModel(event);
                event.currentTarget.blur();
                window.getSelection().removeAllRanges();
            }
        };

        /**
         * Updates the model.
         *
         * @param event the mouse event
         * @param private
         */
        ObjectHeaderController.prototype.updateModel = function (event) {
            var name = event.currentTarget.textContent.replace(/\n/g, ' ');

            if (name.length === 0) {
                name = "Unnamed " + this.domainObject.getCapability("type").typeDef.name;
                event.currentTarget.textContent = name;
            }

            if (name !== this.domainObject.getModel().name) {
                this.domainObject.getCapability('mutation').mutate(function (model) {
                    model.name = name;
                });
            }
        };

        /**
         * Checks if the domain object is editable.
         *
         * @private
         * @return true if object is editable
         */
        ObjectHeaderController.prototype.allowEdit = function () {
            var type = this.domainObject && this.domainObject.getCapability('type');
            return !!(type && type.hasFeature('creation'));
        };

        return ObjectHeaderController;
    }
);
