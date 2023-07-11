/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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
import PlotViewProvider from './PlotViewProvider';
import OverlayPlotViewProvider from './overlayPlot/OverlayPlotViewProvider';
import StackedPlotViewProvider from './stackedPlot/StackedPlotViewProvider';
import PlotsInspectorViewProvider from './inspector/PlotsInspectorViewProvider';
import OverlayPlotCompositionPolicy from './overlayPlot/OverlayPlotCompositionPolicy';
import StackedPlotCompositionPolicy from './stackedPlot/StackedPlotCompositionPolicy';
import PlotViewActions from './actions/ViewActions';
import StackedPlotsInspectorViewProvider from './inspector/StackedPlotsInspectorViewProvider';
import stackedPlotConfigurationInterceptor from './stackedPlot/stackedPlotConfigurationInterceptor';

export default function () {
  return function install(openmct) {
    openmct.types.addType('telemetry.plot.overlay', {
      key: 'telemetry.plot.overlay',
      name: 'Overlay Plot',
      cssClass: 'icon-plot-overlay',
      description:
        'Combine multiple telemetry elements and view them together as a plot with common X and Y axes. Can be added to Display Layouts.',
      creatable: true,
      initialize: function (domainObject) {
        domainObject.composition = [];
        domainObject.configuration = {
          //series is an array of objects of type: {identifier, series: {color...}, yAxis:{}}
          series: []
        };
      },
      priority: 891
    });

    openmct.types.addType('telemetry.plot.stacked', {
      key: 'telemetry.plot.stacked',
      name: 'Stacked Plot',
      cssClass: 'icon-plot-stacked',
      description:
        'Combine multiple telemetry elements and view them together as a plot with a common X axis and individual Y axes. Can be added to Display Layouts.',
      creatable: true,
      initialize: function (domainObject) {
        domainObject.composition = [];
        domainObject.configuration = {
          series: [],
          yAxis: {},
          xAxis: {}
        };
      },
      priority: 890
    });

    stackedPlotConfigurationInterceptor(openmct);

    openmct.objectViews.addProvider(new StackedPlotViewProvider(openmct));
    openmct.objectViews.addProvider(new OverlayPlotViewProvider(openmct));
    openmct.objectViews.addProvider(new PlotViewProvider(openmct));

    openmct.inspectorViews.addProvider(new PlotsInspectorViewProvider(openmct));
    openmct.inspectorViews.addProvider(new StackedPlotsInspectorViewProvider(openmct));

    openmct.composition.addPolicy(new OverlayPlotCompositionPolicy(openmct).allow);
    openmct.composition.addPolicy(new StackedPlotCompositionPolicy(openmct).allow);

    PlotViewActions.forEach((action) => {
      openmct.actions.register(action);
    });
  };
}
