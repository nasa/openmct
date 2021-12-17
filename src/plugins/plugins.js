/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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

/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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

import _ from 'lodash';

import UTCTimeSystem from './utcTimeSystem/plugin';
import RemoteClock from './remoteClock/plugin';
import LocalTimeSystem from './localTimeSystem/plugin';
import ISOTimeFormat from './ISOTimeFormat/plugin';
import MyItems from './myItems/plugin';
import GeneratorPlugin from '../../example/generator/plugin';
import AutoflowPlugin from './autoflow/AutoflowTabularPlugin';
import TimeConductorPlugin from './timeConductor/plugin';
import ExampleImagery from '../../example/imagery/plugin';
import ImageryPlugin from './imagery/plugin';
import SummaryWidget from './summaryWidget/plugin';
import URLIndicatorPlugin from './URLIndicatorPlugin/URLIndicatorPlugin';
import TelemetryMean from './telemetryMean/plugin';
import PlotPlugin from './plot/plugin';
import ChartPlugin from './charts/plugin';
import TelemetryTablePlugin from './telemetryTable/plugin';
import StaticRootPlugin from './staticRootPlugin/plugin';
import Notebook from './notebook/plugin';
import DisplayLayoutPlugin from './displayLayout/plugin';
import FormActions from './formActions/plugin';
import FolderView from './folderView/plugin';
import FlexibleLayout from './flexibleLayout/plugin';
import Tabs from './tabs/plugin';
import LADTable from './LADTable/plugin';
import Filters from './filters/plugin';
import ObjectMigration from './objectMigration/plugin';
import GoToOriginalAction from './goToOriginalAction/plugin';
import OpenInNewTabAction from './openInNewTabAction/plugin';
import ClearData from './clearData/plugin';
import WebPagePlugin from './webPage/plugin';
import ConditionPlugin from './condition/plugin';
import ConditionWidgetPlugin from './conditionWidget/plugin';
import Espresso from './themes/espresso';
import Maelstrom from './themes/maelstrom';
import Snow from './themes/snow';
import URLTimeSettingsSynchronizer from './URLTimeSettingsSynchronizer/plugin';
import NotificationIndicator from './notificationIndicator/plugin';
import NewFolderAction from './newFolderAction/plugin';
import NonEditableFolder from './nonEditableFolder/plugin';
import CouchDBPlugin from './persistence/couch/plugin';
import DefaultRootName from './defaultRootName/plugin';
import PlanLayout from './plan/plugin';
import ViewDatumAction from './viewDatumAction/plugin';
import ViewLargeAction from './viewLargeAction/plugin';
import ObjectInterceptors from './interceptors/plugin';
import PerformanceIndicator from './performanceIndicator/plugin';
import CouchDBSearchFolder from './CouchDBSearchFolder/plugin';
import Timeline from './timeline/plugin';
import Hyperlink from './hyperlink/plugin';
import Clock from './clock/plugin';
import DeviceClassifier from './DeviceClassifier/plugin';
import UTCTimeFormat from './UTCTimeFormat/plugin';
import Timer from './timer/plugin';
const bundleMap = {
    LocalStorage: 'platform/persistence/local',
    Elasticsearch: 'platform/persistence/elastic'
};

const plugins = _.mapValues(bundleMap, function (bundleName, pluginName) {
    return function pluginConstructor() {
        return function (openmct) {
            openmct.legacyRegistry.enable(bundleName);
        };
    };
});

plugins.UTCTimeSystem = UTCTimeSystem;
plugins.LocalTimeSystem = LocalTimeSystem;
plugins.RemoteClock = RemoteClock.default;

plugins.MyItems = MyItems.default;

plugins.StaticRootPlugin = StaticRootPlugin;

/**
 * A tabular view showing the latest values of multiple telemetry points at
 * once. Formatted so that labels and values are aligned.
 *
 * @param {Object} [options] Optional settings to apply to the autoflow
 * tabular view. Currently supports one option, 'type'.
 * @param {string} [options.type] The key of an object type to apply this view
 * to exclusively.
 */
plugins.AutoflowView = AutoflowPlugin;

plugins.Conductor = TimeConductorPlugin.default;

plugins.CouchDB = CouchDBPlugin.default;

plugins.Elasticsearch = function (url) {
    return function (openmct) {
        if (url) {
            const bundleName = "config/elastic";
            openmct.legacyRegistry.register(bundleName, {
                "extensions": {
                    "constants": [
                        {
                            "key": "ELASTIC_ROOT",
                            "value": url,
                            "priority": "mandatory"
                        }
                    ]
                }
            });
            openmct.legacyRegistry.enable(bundleName);
        }

        openmct.legacyRegistry.enable(bundleMap.Elasticsearch);
    };
};

plugins.Generator = function () {
    return GeneratorPlugin;
};

plugins.ExampleImagery = ExampleImagery.default;
plugins.ImageryPlugin = ImageryPlugin;
plugins.Plot = PlotPlugin.default;
plugins.Chart = ChartPlugin.default;
plugins.TelemetryTable = TelemetryTablePlugin;

plugins.SummaryWidget = SummaryWidget;
plugins.TelemetryMean = TelemetryMean;
plugins.URLIndicator = URLIndicatorPlugin;
plugins.Notebook = Notebook.default;
plugins.DisplayLayout = DisplayLayoutPlugin.default;
plugins.FormActions = FormActions;
plugins.FolderView = FolderView;
plugins.Tabs = Tabs;
plugins.FlexibleLayout = FlexibleLayout;
plugins.LADTable = LADTable.default;
plugins.Filters = Filters;
plugins.ObjectMigration = ObjectMigration.default;
plugins.GoToOriginalAction = GoToOriginalAction.default;
plugins.OpenInNewTabAction = OpenInNewTabAction.default;
plugins.ClearData = ClearData;
plugins.WebPage = WebPagePlugin.default;
plugins.Espresso = Espresso.default;
plugins.Maelstrom = Maelstrom.default;
plugins.Snow = Snow.default;
plugins.Condition = ConditionPlugin.default;
plugins.ConditionWidget = ConditionWidgetPlugin.default;
plugins.URLTimeSettingsSynchronizer = URLTimeSettingsSynchronizer.default;
plugins.NotificationIndicator = NotificationIndicator.default;
plugins.NewFolderAction = NewFolderAction.default;
plugins.NonEditableFolder = NonEditableFolder.default;
plugins.ISOTimeFormat = ISOTimeFormat.default;
plugins.DefaultRootName = DefaultRootName.default;
plugins.PlanLayout = PlanLayout.default;
plugins.ViewDatumAction = ViewDatumAction.default;
plugins.ViewLargeAction = ViewLargeAction.default;
plugins.ObjectInterceptors = ObjectInterceptors.default;
plugins.PerformanceIndicator = PerformanceIndicator.default;
plugins.CouchDBSearchFolder = CouchDBSearchFolder.default;
plugins.Timeline = Timeline.default;
plugins.Hyperlink = Hyperlink.default;
plugins.Clock = Clock.default;
plugins.Timer = Timer.default;
plugins.DeviceClassifier = DeviceClassifier.default;
plugins.UTCTimeFormat = UTCTimeFormat.default;

export default plugins;