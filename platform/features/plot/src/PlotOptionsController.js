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
    ['./PlotOptionsForm'],
    (PlotOptionsForm) => {

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
        class PlotOptionsController {
          constructor($scope) {
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
            this.mutationListener = this.domainObject.getCapability('mutation').listen( (model) => {
                if (this.hasCompositionChanged(this.composition, model.composition)) {
                    this.updateChildren();
                }
            });

            /*
             Set form structures on scope
             */
            $scope.plotSeriesForm = this.plotOptionsForm.plotSeriesForm;
            $scope.xAxisForm = this.plotOptionsForm.xAxisForm;
            $scope.yAxisForm = this.plotOptionsForm.yAxisForm;

            $scope.$on("$destroy", () => {
                //Clean up any listeners on destruction of controller
                this.mutationListener();
            });

            this.defaultConfiguration();
            this.updateChildren();

            /*
             * Setup a number of watches for changes to form values. On
             * change, update the model configuration via mutation
             */
            $scope.$watchCollection('configuration.plot.yAxis', (newValue, oldValue) => {
                this.updateConfiguration(newValue, oldValue);
            });
            $scope.$watchCollection('configuration.plot.xAxis', (newValue, oldValue) => {
                this.updateConfiguration(newValue, oldValue);
            });

            this.watchSeries();

        }

        /**
         * Unregister all watches for series data (ie. the configuration for
         * child objects)
         * @private
         */
        clearSeriesWatches() {
            this.watches.forEach( (watch) => {
                watch();
            });
            this.watches = [];
        };

        /**
         * Attach watches for each object in the plot's composition
         * @private
         */
        watchSeries() {
            this.clearSeriesWatches();

            (this.$scope.children || []).forEach( (child, index) => {
                this.watches.push(
                    this.$scope.$watchCollection(
                        'configuration.plot.series[' + index + ']',
                         (newValue, oldValue) => {
                            this.updateConfiguration(newValue, oldValue);
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
        hasCompositionChanged(oldComposition, newComposition) {
            // Framed slightly strangely, but the boolean logic is
            // easier to follow for the unchanged case.
            let isUnchanged = oldComposition === newComposition ||
                    (
                        oldComposition.length === newComposition.length &&
                        oldComposition.every( (currentValue, index) => {
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
        defaultConfiguration() {
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
        updateChildren() {
            this.domainObject.useCapability('composition').then( (children) => {
                this.$scope.children = children;
                this.composition = this.domainObject.getModel().composition;
                children.forEach( (child, index) => {
                    this.configuration.plot.series[index] =
                        this.configuration.plot.series[index] || {'id': child.getId()};
                });
                this.watchSeries();
            });
        };

        /**
         * On changes to the form, update the configuration on the domain
         * object
         * @private
         */
        updateConfiguration() {
            this.domainObject.useCapability('mutation', (model) => {
                model.configuration = model.configuration || {};
                model.configuration.plot = this.configuration.plot;
            });
        };
      }
        return PlotOptionsController;
    }
);

