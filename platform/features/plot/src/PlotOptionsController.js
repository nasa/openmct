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
         * @memberof platform/features/plot
         * @constructor
         * @param {Scope} $scope the controller's Angular scope
         */
        function PlotOptionsController($scope) {

            var self = this;
            this.$scope = $scope;
            this.domainObject = $scope.domainObject;
            this.configuration = this.domainObject.getModel().configuration || {};
            this.plotOptionsForm = new PlotOptionsForm();
            this.composition = [];
            this.watches = [];

            /*
             Listen for changes to the domain object and update the object's
             children.
             */
            this.mutationListener = this.domainObject.getCapability('mutation').listen(function(model) {
                if (self.hasCompositionChanged(self.composition, model.composition)) {
                    self.updateChildren();
                }
            });

            /*
             Set form structures on scope
             */
            $scope.plotSeriesForm = this.plotOptionsForm.plotSeriesForm;
            $scope.xAxisForm = this.plotOptionsForm.xAxisForm;
            $scope.yAxisForm = this.plotOptionsForm.yAxisForm;

            $scope.$on("$destroy", function() {
                //Clean up any listeners on destruction of controller
                self.mutationListener();
            });

            this.defaultConfiguration();
            this.updateChildren();

            /*
             * Setup a number of watches for changes to form values. On
             * change, update the model configuration via mutation
             */
            $scope.$watchCollection('configuration.plot.yAxis', function(newValue, oldValue){
                self.updateConfiguration(newValue, oldValue);
            });
            $scope.$watchCollection('configuration.plot.xAxis', function(newValue, oldValue){
                self.updateConfiguration(newValue, oldValue);
            });

            this.watchSeries();

        }

        /**
         * Unregister all watches for series data (ie. the configuration for
         * child objects)
         * @private
         */
        PlotOptionsController.prototype.clearSeriesWatches = function() {
            this.watches.forEach(function(watch) {
                watch();
            });
            this.watches = [];
        };

        /**
         * Attach watches for each object in the plot's composition
         * @private
         */
        PlotOptionsController.prototype.watchSeries = function() {
            var self = this;

            this.clearSeriesWatches();

            (self.$scope.children || []).forEach(function(child, index){
                self.watches.push(
                    self.$scope.$watchCollection(
                        'configuration.plot.series[' + index + ']',
                        function(newValue, oldValue){
                            self.updateConfiguration(newValue, oldValue);
                        }
                    )
                );
            });
        };

        /**
         * Determine whether the changes to the model that triggered a
         * mutation event were purely compositional.
         *
         * @private
         */
        PlotOptionsController.prototype.hasCompositionChanged = function(oldComposition, newComposition){
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
        };

        /**
         * Default the plot options model
         *
         * @private
         */
        PlotOptionsController.prototype.defaultConfiguration = function () {
            this.configuration.plot = this.configuration.plot || {};
            this.configuration.plot.xAxis = this.configuration.plot.xAxis || {};
            this.configuration.plot.yAxis = this.configuration.plot.yAxis || {}; // y-axes will be associative array keyed on axis key
            this.configuration.plot.series = this.configuration.plot.series || []; // series will be associative array keyed on sub-object id
            this.$scope.configuration = this.configuration;
        };

        /**
         * When a child is added to, or removed from a plot, update the
         * plot options model
         * @private
         */
        PlotOptionsController.prototype.updateChildren = function() {
            var self = this;
            this.domainObject.useCapability('composition').then(function(children){
                self.$scope.children = children;
                self.composition = self.domainObject.getModel().composition;
                children.forEach(function(child, index){
                    self.configuration.plot.series[index] =
                        self.configuration.plot.series[index] || {'id': child.getId()};
                });
                self.watchSeries();
            });
        };

        /**
         * On changes to the form, update the configuration on the domain
         * object
         * @private
         */
        PlotOptionsController.prototype.updateConfiguration = function() {
            var self = this;
            this.domainObject.useCapability('mutation', function(model){
                model.configuration = model.configuration || {};
                model.configuration.plot = self.configuration.plot;
            });
        };

        return PlotOptionsController;
    }
);

