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

/**
 * This bundle implements object types and associated views for
 * display-building.
 * @namespace platform/features/layout
 */
define(
    ['./PlotOptionsForm'],
    function (PlotOptionsForm) {
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
         * @memberof platform/features/layout
         * @constructor
         * @param {Scope} $scope the controller's Angular scope
         */
        function PlotOptionsController($scope, topic) {

            var self = this,
                domainObject = $scope.domainObject,
                composition,
                mutationListener,
                formListener,
                configuration = domainObject.getModel().configuration || {};

            this.plotOptionsForm = new PlotOptionsForm(topic);

            /*
             * Determine whether the changes to the model that triggered a
             * mutation event were purely compositional.
             */
            function hasCompositionChanged(oldComposition, newComposition){
                // Framed slightly strangely, but the boolean logic is
                // easier to follow for the unchanged case.
                var isUnchanged = oldComposition === newComposition ||
                        (
                            oldComposition.length === newComposition.length &&
                            oldComposition.every( function (currentValue, index) {
                                return newComposition[index] && currentValue === newComposition[index];
                            })
                        );
                return !isUnchanged;
            }

            /*
             Default the plot options model
             */
            function defaultConfiguration() {
                configuration.plot = configuration.plot || {};
                configuration.plot.xAxis = configuration.plot.xAxis || {};
                configuration.plot.yAxis = configuration.plot.yAxis || {}; // y-axes will be associative array keyed on axis key
                configuration.plot.series = configuration.plot.series || {}; // series will be associative array keyed on sub-object id
                $scope.configuration = configuration;
            }

            /*
             When a child is added to, or removed from a plot, update the
             plot options model
             */
            function updateChildren() {
                domainObject.useCapability('composition').then(function(children){
                    $scope.children = children;
                    composition = domainObject.getModel().composition;
                    children.forEach(function(child){
                        configuration.plot.series[child.getId()] = configuration.plot.series[child.getId()] || {};
                    });
                });
            }

            /*
             On changes to the form, update the configuration on the domain
             object
             */
            function updateConfiguration() {
                domainObject.useCapability('mutation', function(model){
                    model.configuration = model.configuration || {};
                    model.configuration.plot = configuration.plot;
                });
            }

            /*
             Set form structures on scope
             */
            $scope.plotSeriesForm = this.plotOptionsForm.plotSeriesForm;
            $scope.xAxisForm = this.plotOptionsForm.xAxisForm;
            $scope.yAxisForm = this.plotOptionsForm.yAxisForm;

            /*
             Listen for changes to the domain object and update the object's
             children.
             */
            mutationListener = domainObject.getCapability('mutation').listen(function(model) {
                if (hasCompositionChanged(composition, model.composition)) {
                    updateChildren();
                }
            });

            formListener = this.plotOptionsForm.listen(updateConfiguration);

            defaultConfiguration();
            updateChildren();

            $scope.$on("$destroy", function() {
                //Clean up any listeners on destruction of controller
                mutationListener();
                formListener();
            });

        }

        return PlotOptionsController;
    }
);

