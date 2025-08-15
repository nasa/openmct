/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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

import ExampleDataVisualizationSourcePlugin from '../../example/dataVisualization/plugin.js';
import EventGeneratorPlugin from '../../example/eventGenerator/plugin.js';
import ExampleTags from '../../example/exampleTags/plugin.js';
import ExampleUser from '../../example/exampleUser/plugin.js';
import ExampleFaultSource from '../../example/faultManagement/exampleFaultSource.js';
import GeneratorPlugin from '../../example/generator/plugin.js';
import ExampleImagery from '../../example/imagery/plugin.js';
import AutoflowPlugin from './autoflow/AutoflowTabularPlugin.js';
import BarChartPlugin from './charts/bar/plugin.js';
import ScatterPlotPlugin from './charts/scatter/plugin.js';
import ClearData from './clearData/plugin.js';
import Clock from './clock/plugin.js';
import ConditionPlugin from './condition/plugin.js';
import ConditionWidgetPlugin from './conditionWidget/plugin.js';
import CouchDBSearchFolder from './CouchDBSearchFolder/plugin.js';
import DefaultRootName from './defaultRootName/plugin.js';
import DeviceClassifier from './DeviceClassifier/plugin.js';
import DisplayLayoutPlugin from './displayLayout/plugin.js';
import FaultManagementPlugin from './faultManagement/FaultManagementPlugin.js';
import Filters from './filters/plugin.js';
import FlexibleLayout from './flexibleLayout/plugin.js';
import FolderView from './folderView/plugin.js';
import FormActions from './formActions/plugin.js';
import GaugePlugin from './gauge/GaugePlugin.js';
import GoToOriginalAction from './goToOriginalAction/plugin.js';
import Hyperlink from './hyperlink/plugin.js';
import ImageryPlugin from './imagery/plugin.js';
import InspectorDataVisualization from './inspectorDataVisualization/plugin.js';
import InspectorViews from './inspectorViews/plugin.js';
import ObjectInterceptors from './interceptors/plugin.js';
import ISOTimeFormat from './ISOTimeFormat/plugin.js';
import LADTable from './LADTable/plugin.js';
import LocalStorage from './localStorage/plugin.js';
import LocalTimeSystem from './localTimeSystem/plugin.js';
import MyItems from './myItems/plugin.js';
import NewFolderAction from './newFolderAction/plugin.js';
import { NotebookPlugin, RestrictedNotebookPlugin } from './notebook/plugin.js';
import NotificationIndicator from './notificationIndicator/plugin.js';
import ObjectMigration from './objectMigration/plugin.js';
import OpenInNewTabAction from './openInNewTabAction/plugin.js';
import OperatorStatus from './operatorStatus/plugin.js';
import PerformanceIndicator from './performanceIndicator/plugin.js';
import CouchDBPlugin from './persistence/couch/plugin.js';
import PlanLayout from './plan/plugin.js';
import PlotPlugin from './plot/plugin.js';
import ReloadAction from './reloadAction/plugin.js';
import RemoteClock from './remoteClock/plugin.js';
import StaticRootPlugin from './staticRootPlugin/plugin.js';
import SummaryWidget from './summaryWidget/plugin.js';
import Tabs from './tabs/plugin.js';
import TelemetryMean from './telemetryMean/plugin.js';
import TelemetryTablePlugin from './telemetryTable/plugin.js';
import DarkMatter from './themes/darkmatter.js';
import Espresso from './themes/espresso.js';
import Snow from './themes/snow.js';
import TimeConductorPlugin from './timeConductor/plugin.js';
import Timeline from './timeline/plugin.js';
import TimeList from './timelist/plugin.js';
import Timer from './timer/plugin.js';
import URLIndicatorPlugin from './URLIndicatorPlugin/URLIndicatorPlugin.js';
import URLTimeSettingsSynchronizer from './URLTimeSettingsSynchronizer/plugin.js';
import UserIndicator from './userIndicator/plugin.js';
import UTCTimeSystem from './utcTimeSystem/plugin.js';
import ViewDatumAction from './viewDatumAction/plugin.js';
import ViewLargeAction from './viewLargeAction/plugin.js';
import WebPagePlugin from './webPage/plugin.js';

/**
 * @type {Object}
 */
const plugins = {};

plugins.example = {};
plugins.example.ExampleUser = ExampleUser;
plugins.example.ExampleImagery = ExampleImagery;
plugins.example.ExampleFaultSource = ExampleFaultSource;
plugins.example.EventGeneratorPlugin = EventGeneratorPlugin;
plugins.example.ExampleDataVisualizationSourcePlugin = ExampleDataVisualizationSourcePlugin;
plugins.example.ExampleTags = ExampleTags;
plugins.example.Generator = () => GeneratorPlugin;

plugins.UTCTimeSystem = UTCTimeSystem;
plugins.LocalTimeSystem = LocalTimeSystem;
plugins.RemoteClock = RemoteClock;

plugins.MyItems = MyItems;

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

plugins.Conductor = TimeConductorPlugin;

plugins.CouchDB = CouchDBPlugin;

plugins.ImageryPlugin = ImageryPlugin;
plugins.Plot = PlotPlugin;
plugins.BarChart = BarChartPlugin;
plugins.ScatterPlot = ScatterPlotPlugin;
plugins.TelemetryTable = TelemetryTablePlugin;
plugins.SummaryWidget = SummaryWidget;
plugins.TelemetryMean = TelemetryMean;
plugins.URLIndicator = URLIndicatorPlugin;
plugins.Notebook = NotebookPlugin;
plugins.RestrictedNotebook = RestrictedNotebookPlugin;
plugins.DisplayLayout = DisplayLayoutPlugin;
plugins.FaultManagement = FaultManagementPlugin;
plugins.FormActions = FormActions;
plugins.FolderView = FolderView;
plugins.Tabs = Tabs;
plugins.FlexibleLayout = FlexibleLayout;
plugins.LADTable = LADTable;
plugins.Filters = Filters;
plugins.ObjectMigration = ObjectMigration;
plugins.GoToOriginalAction = GoToOriginalAction;
plugins.OpenInNewTabAction = OpenInNewTabAction;
plugins.ReloadAction = ReloadAction;
plugins.ClearData = ClearData;
plugins.WebPage = WebPagePlugin;
plugins.DarkmatterTheme = DarkMatter;
plugins.Espresso = Espresso;
plugins.Snow = Snow;
plugins.Condition = ConditionPlugin;
plugins.ConditionWidget = ConditionWidgetPlugin;
plugins.URLTimeSettingsSynchronizer = URLTimeSettingsSynchronizer;
plugins.NotificationIndicator = NotificationIndicator;
plugins.NewFolderAction = NewFolderAction;
plugins.ISOTimeFormat = ISOTimeFormat;
plugins.DefaultRootName = DefaultRootName;
plugins.PlanLayout = PlanLayout;
plugins.ViewDatumAction = ViewDatumAction;
plugins.ViewLargeAction = ViewLargeAction;
plugins.ObjectInterceptors = ObjectInterceptors;
plugins.PerformanceIndicator = PerformanceIndicator;
plugins.CouchDBSearchFolder = CouchDBSearchFolder;
plugins.Timeline = Timeline;
plugins.Hyperlink = Hyperlink;
plugins.Clock = Clock;
plugins.Timer = Timer;
plugins.DeviceClassifier = DeviceClassifier;
plugins.UserIndicator = UserIndicator;
plugins.LocalStorage = LocalStorage;
plugins.OperatorStatus = OperatorStatus;
plugins.Gauge = GaugePlugin;
plugins.Timelist = TimeList;
plugins.InspectorViews = InspectorViews;
plugins.InspectorDataVisualization = InspectorDataVisualization;

export default plugins;
