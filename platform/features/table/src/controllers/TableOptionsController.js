/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global define*/

define(
    [],
    function () {
        "use strict";

        /**
         * Notes on implementation of plot options
         *
         * Multiple y-axes will have to be handled with multiple forms as
         * they will need to be stored on distinct model object
         *
         * Likewise plot series options per-child will need to be separate
         * forms.
         */

        /**
         * The LayoutController is responsible for supporting the
         * Layout view. It arranges frames according to saved configuration
         * and provides methods for updating these based on mouse
         * movement.
         * @memberof platform/features/plot
         * @constructor
         * @param {Scope} $scope the controller's Angular scope
         */
        function TableOptionsController($scope) {

            var self = this;

            this.$scope = $scope;
            this.domainObject = $scope.domainObject;
            this.listeners = [];

            $scope.columnsForm = {};

            function unlisten() {
                self.listeners.forEach(function (listener) {
                    listener();
                });
            }

            $scope.$watch('domainObject', function(domainObject) {
                unlisten();
                self.populateForm(domainObject.getModel());

                self.listeners.push(self.domainObject.getCapability('mutation').listen(function (model) {
                    self.populateForm(model);
                }));
            });

            /**
             * Maintain a configuration object on scope that stores column
             * configuration. On change, synchronize with object model.
             */
            $scope.$watchCollection('configuration.table.columns', function (columns){
                if (columns){
                    self.domainObject.useCapability('mutation', function (model) {
                       model.configuration.table.columns = columns;
                    });
                    self.domainObject.getCapability('persistence').persist();
                }
            });

            /**
             * Destroy all mutation listeners
             */
            $scope.$on('$destroy', unlisten);

        }

        TableOptionsController.prototype.populateForm = function (model) {
            var columnsDefinition = (((model.configuration || {}).table || {}).columns || {}),
                rows = [];
            this.$scope.columnsForm = {
                'name':'Columns',
                'sections': [{
                    'name': 'Columns',
                    'rows': rows
                }]};

            Object.keys(columnsDefinition).forEach(function (key){
                rows.push({
                    'name': key,
                    'control': 'checkbox',
                    'key': key
                });
            });
            this.$scope.configuration = JSON.parse(JSON.stringify(model.configuration || {}));
        };

        return TableOptionsController;
    }
);
