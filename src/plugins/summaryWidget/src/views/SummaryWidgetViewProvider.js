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

import SummaryWidgetEditView from '../SummaryWidget';
import SummaryWidgetView from './SummaryWidgetView';

const DEFAULT_VIEW_PRIORITY = 100;
export default function SummaryWidgetViewProvider(openmct) {
  return {
    key: 'summary-widget-viewer',
    name: 'Summary View',
    cssClass: 'icon-summary-widget',
    canView: function (domainObject) {
      return domainObject.type === 'summary-widget';
    },
    canEdit: function (domainObject) {
      return domainObject.type === 'summary-widget';
    },
    view: function (domainObject) {
      return new SummaryWidgetView(domainObject, openmct);
    },
    edit: function (domainObject) {
      return new SummaryWidgetEditView(domainObject, openmct);
    },
    priority: function (domainObject) {
      if (domainObject.type === 'summary-widget') {
        return Number.MAX_VALUE;
      } else {
        return DEFAULT_VIEW_PRIORITY;
      }
    }
  };
}
