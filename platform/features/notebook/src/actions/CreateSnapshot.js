/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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

        var SNAPSHOT_TEMPLATE = '<mct-representation key="\'draggedEntry\'"' +
                                    'parameters="{entry:entryId,embed:embedId}"' +
                                    'class="t-rep-frame holder"' +
                                    'mct-object="selObj">' +
                                '</mct-representation>';

        function CreateSnapshot($compile,context) {
            context = context || {};
            this.domainObject = context.selectedObject || context.domainObject;
            this.context = context;
            this.$compile = $compile;
        }


        CreateSnapshot.prototype.perform = function ($event,snapshot,embedId,entryId,$scope) {
            var compile = this.$compile;
            var model = this.domainObject.model;
            var elementPos = model.entries.map(function (x) {
                return x.createdOn;
            }).indexOf(entryId);
            var entryEmbeds = model.entries[elementPos].embeds;
            var embedPos = entryEmbeds.map(function (x) {
                return x.id;
            }).indexOf(embedId);
            var embedType = entryEmbeds[embedPos].type;

            $scope.getDomainObj(embedType).then(function (resp) {
                if (entryId >= 0 && embedId >= 0) {
                    $scope.selObj = resp[embedType];
                    $scope.entryId = elementPos;
                    $scope.embedId = embedPos;
                    compile(SNAPSHOT_TEMPLATE)($scope);
                }
            });
        };

        return CreateSnapshot;
    }
);
