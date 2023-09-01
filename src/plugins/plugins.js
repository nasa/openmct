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

import EventGeneratorPlugin from '../../example/eventGenerator/plugin';
import ExampleTags from '../../example/exampleTags/plugin';
import ExampleUser from '../../example/exampleUser/plugin';
import ExampleFaultSource from '../../example/faultManagement/exampleFaultSource';
import GeneratorPlugin from '../../example/generator/plugin';
import ExampleImagery from '../../example/imagery/plugin';
import AutoflowPlugin from './autoflow/AutoflowTabularPlugin';
import BarChartPlugin from './charts/bar/plugin';
import ScatterPlotPlugin from './charts/scatter/plugin';
import ClearData from './clearData/plugin';
import Clock from './clock/plugin';
import ConditionPlugin from './condition/plugin';
import ConditionWidgetPlugin from './conditionWidget/plugin';
import CouchDBSearchFolder from './CouchDBSearchFolder/plugin';
import DefaultRootName from './defaultRootName/plugin';
import DeviceClassifier from './DeviceClassifier/plugin';
import DisplayLayoutPlugin from './displayLayout/plugin';
import FaultManagementPlugin from './faultManagement/FaultManagementPlugin';
import Filters from './filters/plugin';
import FlexibleLayout from './flexibleLayout/plugin';
import FolderView from './folderView/plugin';
import FormActions from './formActions/plugin';
import GaugePlugin from './gauge/GaugePlugin';
import GoToOriginalAction from './goToOriginalAction/plugin';
import Hyperlink from './hyperlink/plugin';
import ImageryPlugin from './imagery/plugin';
import InspectorViews from './inspectorViews/plugin';
import ObjectInterceptors from './interceptors/plugin';
import ISOTimeFormat from './ISOTimeFormat/plugin';
import LADTable from './LADTable/plugin';
import LocalStorage from './localStorage/plugin';
import LocalTimeSystem from './localTimeSystem/plugin';
import MyItems from './myItems/plugin';
import NewFolderAction from './newFolderAction/plugin';
import * as Notebook from './notebook/plugin';
import NotificationIndicator from './notificationIndicator/plugin';
import ObjectMigration from './objectMigration/plugin';
import OpenInNewTabAction from './openInNewTabAction/plugin';
import OperatorStatus from './operatorStatus/plugin';
import PerformanceIndicator from './performanceIndicator/plugin';
import CouchDBPlugin from './persistence/couch/plugin';
import PlanLayout from './plan/plugin';
import PlotPlugin from './plot/plugin';
import RemoteClock from './remoteClock/plugin';
import StaticRootPlugin from './staticRootPlugin/plugin';
import SummaryWidget from './summaryWidget/plugin';
import Tabs from './tabs/plugin';
import TelemetryMean from './telemetryMean/plugin';
import TelemetryTablePlugin from './telemetryTable/plugin';
import Espresso from './themes/espresso';
import Snow from './themes/snow';
import TimeConductorPlugin from './timeConductor/plugin';
import Timeline from './timeline/plugin';
import TimeList from './timelist/plugin';
import Timer from './timer/plugin';
import URLIndicatorPlugin from './URLIndicatorPlugin/URLIndicatorPlugin';
import URLTimeSettingsSynchronizer from './URLTimeSettingsSynchronizer/plugin';
import UserIndicator from './userIndicator/plugin';
import UTCTimeSystem from './utcTimeSystem/plugin';
import ViewDatumAction from './viewDatumAction/plugin';
import ViewLargeAction from './viewLargeAction/plugin';
import WebPagePlugin from './webPage/plugin';

const plugins = {};

plugins.example = {};
plugins.example.ExampleUser = ExampleUser;
plugins.example.ExampleImagery = ExampleImagery;
plugins.example.ExampleFaultSource = ExampleFaultSource;
plugins.example.EventGeneratorPlugin = EventGeneratorPlugin;
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
plugins.Notebook = Notebook.NotebookPlugin;
plugins.RestrictedNotebook = Notebook.RestrictedNotebookPlugin;
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
plugins.ClearData = ClearData;
plugins.WebPage = WebPagePlugin;
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

export default plugins;
