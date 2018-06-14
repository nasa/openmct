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

define(function () {
    function ListViewController($scope, formatService) {
        this.$scope = $scope;
        $scope.orderByField = 'title';
        $scope.reverseSort = false;

        this.updateView();
        var unlisten = $scope.domainObject.getCapability('mutation')
            .listen(this.updateView.bind(this));

        this.utc = formatService.getFormat('utc');

        //Trigger digestive cycle with $apply to update list view
        setTimeout(function () {
            $scope.$apply();
        });

        $scope.$on('$destroy', function () {
            unlisten();
        });

    }
    ListViewController.prototype.updateView = function () {
        this.$scope.domainObject.useCapability('composition')
            .then(function (children) {
                var formattedChildren = this.formatChildren(children);
                this.$scope.children = formattedChildren;
                this.$scope.data = {children: formattedChildren};
            }.bind(this)
        );
    };
    ListViewController.prototype.formatChildren = function (children) {
        return children.map(function (child) {
            return {
                icon: child.getCapability('type').getCssClass(),
                title: child.getModel().name,
                type: child.getCapability('type').getName(),
                persisted: this.utc.format(child.getModel().persisted),
                modified: this.utc.format(child.getModel().modified),
                asDomainObject: child,
                location: child.getCapability('location'),
                action: child.getCapability('action')
            };
        }, this);
    };

    return ListViewController;
});
