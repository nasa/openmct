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

import ActionsAPI from './actions/ActionsAPI';
import AnnotationAPI from './annotation/AnnotationAPI';
import CompositionAPI from './composition/CompositionAPI';
import EditorAPI from './Editor';
import FaultManagementAPI from './faultmanagement/FaultManagementAPI';
import FormsAPI from './forms/FormsAPI';
import IndicatorAPI from './indicators/IndicatorAPI';
import MenuAPI from './menu/MenuAPI';
import NotificationAPI from './notifications/NotificationAPI';
import ObjectAPI from './objects/ObjectAPI';
import PriorityAPI from './priority/PriorityAPI';
import StatusAPI from './status/StatusAPI';
import TelemetryAPI from './telemetry/TelemetryAPI';
import TimeAPI from './time/TimeAPI';
import TypeRegistry from './types/TypeRegistry';
import UserAPI from './user/UserAPI';

export default {
  ActionsAPI,
  CompositionAPI,
  EditorAPI,
  FaultManagementAPI,
  FormsAPI,
  IndicatorAPI,
  MenuAPI,
  NotificationAPI,
  ObjectAPI,
  PriorityAPI,
  StatusAPI,
  TelemetryAPI,
  TimeAPI,
  TypeRegistry,
  UserAPI,
  AnnotationAPI
};
