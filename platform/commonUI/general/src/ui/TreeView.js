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
    'angular'
], function (angular, TreeNodeView) {
    'use strict';

    var $ = angular.element.bind(angular);

    function TreeView() {
        this.ul = $('<ul>');
        this.ul.addClass('tree');
        this.nodeViews = [];
    }

    TreeView.prototype.setSize = function (sz) {
        var nodeView;

        while (this.nodeViews.length < sz) {
            nodeView = new TreeNodeView();
            this.nodeViews.push(nodeView);
            this.ul.append($(nodeView.elements()));
        }

        while (this.nodeViews.length > sz) {
            nodeView = this.nodeViews.pop();
            $(nodeView.elements()).remove();
        }
    };

    TreeView.prototype.loadComposition = function (domainObject) {
        var self = this;

        function addNode(domainObject, index) {
            self.nodeViews[index].model(domainObject);
        }

        function addNodes(domainObjects) {
            if (domainObject === self.activeObject) {
                self.setSize(domainObjects.length);
                domainObjects.forEach(addNode);
            }
        }

        // TODO: Add pending indicator
        domainObject.useCapability('composition')
            .then(addNodes);
    };

    TreeView.prototype.model = function (domainObject) {
        if (this.unlisten) {
            this.unlisten();
        }

        this.activeObject = domainObject;
        this.ul.empty();

        if (domainObject && domainObject.hasCapability('composition')) {
            this.unlisten = domainObject.getCapability('mutation')
                .listen(this.loadComposition.bind(this));
            this.loadComposition(domainObject);
        } else {
            this.setSize(0);
        }
    };

    /**
     *
     * @returns {HTMLElement[]}
     */
    TreeView.prototype.elements = function () {
        return this.ul;
    };


    return TreeView;
});