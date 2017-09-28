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

define([], function () {
    var SLIDESHOW_TEMPLATE =
        '<span ng-controller="SlideshowController as slideshow">' +
        '<mct-representation key="slideshow.key()" mct-object="slideshow.object()">' +
        '</mct-representation></span>';

    function SlideshowController($scope, $interval) {
        this.composition = [];
        this.counter = 0;

        $scope.$watch('domainObject', this.update.bind(this));

        var interval = $interval(function () {
            this.counter += 1;
        }.bind(this), 4000);
        //$scope.$on("$destroy", interval.cancel.bind(interval));
    }

    SlideshowController.prototype.update = function (domainObject) {
        var composition = domainObject.useCapability("composition");

        if (!composition) {
            this.composition = [];
            return;
        }

        composition.then(function (composition) {
            this.composition = composition;
        }.bind(this));
    };

    SlideshowController.prototype.object = function () {
        return Array.isArray(this.composition) && this.composition.length ?
            this.composition[this.counter % this.composition.length] :
            undefined;
    };

    SlideshowController.prototype.key = function () {
        var object = this.object();
        var view = object && object.useCapability('view')[0];
        return view && view.key;
    };

    return function slideshow(options) {
        return function install(openmct) {
            openmct.types.addType('slideshow', {
                name: "Slideshow",
                description: "A slideshow display of other objects",
                cssClass: 'icon-object',
                initialize: function (slideshow) {
                    slideshow.composition = [];
                },
                creatable: true
            });

            openmct.legacyExtension("controllers", {
                key: "SlideshowController",
                implementation: SlideshowController,
                depends: [ "$scope", "$interval" ]
            });

            openmct.legacyExtension("views", {
                key: "slideshow",
                type: "slideshow",
                editable: true,
                gestures: [ "drop" ],
                template: SLIDESHOW_TEMPLATE
            });
        };
    };
});
