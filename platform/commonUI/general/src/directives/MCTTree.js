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

define([
    'text!../../res/templates/subtree.html'
], function (subtreeTemplate) {
    function MCTTreeController($scope, $element) {
        var ul = elem.filter('ul'),
            activeObject,
            unlisten;

        function addNodes(domainObjects) {
            domainObjects.forEach(function (addNode));
        }

        function loadComposition(domainObject) {
            activeObject = domainObject;
            ul.empty();
            if (domainObject.hasCapability('composition')) {
                // TODO: Add pending indicator
                domainObject.useCapability('composition')
                    .then(addNodes);
            }
        }

        function changeObject(domainObject) {
            if (unlisten) {
                unlisten();
            }

            unlisten = domainObject.getCapability('mutation')
                .listen(loadComposition);

            loadComposition(domainObject);
        }

        scope.$watch('mctObject', changeObject);
    }

    function MCTTree() {
        return {
            restrict: "E",
            controller: [
                '$scope',
                '$element',
                MCTTreeController
            ],
            require: [ "mctTree" ],
            scope: { mctObject: "=" },
            template: subtreeTemplate
        };
    }

    return MCTTree;
});
