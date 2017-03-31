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
    '../configuration/configStore',
    '../lib/eventHelpers',
    'lodash'
], function (
    configStore,
    eventHelpers,
    _
) {
    "use strict";
    /**
     * The LayoutController is responsible for supporting the
     * Layout view. It arranges frames according to saved configuration
     * and provides methods for updating these based on mouse
     * movement.
     * @memberof platform/features/plot
     * @constructor
     * @param {Scope} $scope the controller's Angular scope
     */
    function PlotOptionsController($scope, openmct, $timeout) {
        this.$scope = $scope;
        this.openmct = openmct;
        this.$timeout = $timeout;

        this.configId = $scope.domainObject.getId();
        this.setUpScope();
        window.config = this;
    }

    eventHelpers.extend(PlotOptionsController.prototype);

    PlotOptionsController.prototype.updateYOptions = function () {
        if (!this.config.series.size()) {
            this.$scope.yAxisOptions = [];
        } else {
            var metadatas = this.config.series.map(function (s) {
                return s.get('metadata');
            });

            var options = this.openmct.telemetry.commonValuesForHints(metadatas, ['y']);
            this.$scope.yAxisOptions = options.map(function (o) {
                return {
                    name: o.key,
                    value: o.key
                };
            });
        }
        setTimeout(function () {
            this.$scope.$digest();
        }.bind(this));
    };

    PlotOptionsController.prototype.setColor = function (series, color) {
        var seriesWithColor = this.config.series.filter(function (s) {
            return s.get('color') === color;
        })[0];
        var oldColor = series.get('color');
        series.set('color', color);

        var seriesIndex = this.config.series.indexOf(series);
        this.openmct.objects.mutate(
            this.domainObject,
            'configuration.series[' + seriesIndex + '].color',
            color.asHexString()
        );

        if (seriesWithColor) {
            seriesWithColor.set('color', oldColor);
            var oldSeriesIndex = this.config.series.indexOf(seriesWithColor);
            this.openmct.objects.mutate(
                this.domainObject,
                'configuration.series[' + oldSeriesIndex + '].color',
                oldColor.asHexString()
            );
        }
    };

    PlotOptionsController.prototype.updateDomainObject = function (domainObject) {
        this.domainObject = domainObject;
    };

    PlotOptionsController.prototype.setUpScope = function () {
        var config = configStore.get(this.configId);
        if (!config || config.get('state') !== 'loaded') {
            this.$timeout(this.setUpScope.bind(this));
            return;
        }

        this.config = this.$scope.config = config;
        this.$scope.setColor = this.setColor.bind(this);
        this.$scope.form = {series: []};
        this.$scope.validation = {};

        this.domainObject = this.config.get('domainObject');
        this.unlisten = this.openmct.objects.observe(this.domainObject, '*', this.updateDomainObject.bind(this));

        this.listenTo(this.$scope, '$destroy', this.unlisten);
        this.listenTo(config.series, 'add', this.addSeries, this);
        this.listenTo(config.series, 'remove', this.removeSeries, this);
        config.series.forEach(this.addSeries, this);

        this.linkFields(config.yAxis, 'key', 'form.yAxis.key', undefined, undefined, 'configuration.yAxis.key');
        this.linkFields(config.yAxis, 'label', 'form.yAxis.label', undefined, undefined, 'configuration.yAxis.label');
        this.linkFields(config.yAxis, 'autoscale', 'form.yAxis.autoscale', Boolean, undefined, 'configuration.yAxis.autoscale');
        this.linkFields(config.yAxis, 'autoscalePadding', 'form.yAxis.autoscalePadding', Number, undefined, 'configuration.yAxis.autoscalePadding');
        this.linkFields(config.yAxis, 'range', 'form.yAxis.range', function coerceRange(range) {
            if (!range) {
                return {
                    min: 0,
                    max: 0
                };
            }
            var newRange = {};
            if (typeof range.min !== undefined) {
                newRange.min = Number(range.min);
            }
            if (typeof range.max !== undefined) {
                newRange.max = Number(range.max);
            }
            return newRange;
        }, function validateRange (range) {
            if (!range) {
                return 'Need range';
            }
            if (!range.min) {
                return 'Must specify min';
            }
            if (!range.max) {
                return 'Must specify max';
            }
            if (_.isNaN(Number(range.min))) {
                return 'Minimum must be a number.';
            }
            if (_.isNaN(Number(range.max))) {
                return 'Maximum must be a number.';
            }
            if (Number(range.min) > Number(range.max)) {
                return 'Minimum must be less than maximum.';
            }
            if (config.yAxis.get('autoscale')) {
                return false;
            }
            return true;
        }, 'configuration.yAxis.range');
    };

    PlotOptionsController.prototype.addSeries = function (series, index) {
        this.updateYOptions();
        if (this.$scope.form.series[index]) {
            // the way listeners work, this will blow up.  At this point, it
            // can't technically occur, but if we added some sort of reordering
            // at a later date, it would not be clear why this doesn't work.
            // So here's to hoping this helps debugging.
            throw new Error('Plot options does not support insert at index.');
        }
        var seriesObject = series.get('domainObject');
        var seriesId = [
            seriesObject.identifier.namespace,
            seriesObject.identifier.key
        ].join(':');
        var configPath = 'configuration.series[' + index + '].';
        var path = 'form.series[' + index + '].';
        this.$scope.domainObject.useCapability('composition')
            .then(function (children) {
                children.forEach(function (child) {
                    if (child.getId() == seriesId) {
                        series.oldObject = child;
                    }
                });
            }.bind(this));

        this.linkFields(series, 'interpolate', path + 'interpolate', undefined, undefined, configPath + 'interpolate');
        this.linkFields(series, 'markers', path + 'markers', undefined, undefined, configPath + 'markers');
        this.linkFields(series, 'markerSize', path + 'markerSize', Number, undefined, configPath + 'markerSize');
    };

    PlotOptionsController.prototype.removeSeries = function (series, index) {
        this.updateYOptions();
        this.stopListening(series);
        series.stopListening(this.$scope);
        this.$scope.form.series.splice(index, 1);
        var configSeries = this.domainObject.configuration.series.slice();
        configSeries.splice(index, 1);
        setTimeout(function () {
            this.openmct.objects.mutate(this.domainObject, 'configuration.series', configSeries);
        }.bind(this));
    };

    PlotOptionsController.prototype.linkFields = function (
        model,
        prop,
        scopePath,
        coerce,
        validate,
        objectPath
    ) {
        if (!coerce) {
            coerce = function (v) { return v; };
        }
        if (!validate) {
            validate = function () { return true; };
        }
        this.listenTo(model, 'change:' + prop, function (newVal, oldVal) {
            if (!_.isEqual(coerce(_.get(this.$scope, scopePath)), coerce(newVal))) {
                _.set(this.$scope, scopePath, coerce(newVal));
            }
        }, this);
        model.listenTo(this.$scope, 'change:' + scopePath, function (newVal, oldVal) {
            if (_.isEqual(coerce(newVal), coerce(model.get(prop)))) {
                return; // Don't trigger excessive mutations.
            }
            var validationResult = validate(newVal);
            if (validationResult === true) {
                delete this.$scope.validation[scopePath];
            } else {
                this.$scope.validation[scopePath] = validationResult;
                return;
            }
            if (!_.isEqual(coerce(newVal), coerce(oldVal))) {
                model.set(prop, coerce(newVal));
                if (objectPath && this.$scope.domainObject.getCapability('editor').isEditContextRoot()) {
                    this.openmct.objects.mutate(this.domainObject, objectPath, coerce(newVal));
                }
            };
        }, this);
        _.set(this.$scope, scopePath, coerce(model.get(prop)));
    };

    return PlotOptionsController;
});

