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

import PreviewAction from './PreviewAction.js';

const VIEW_HISTORICAL_DATA_ACTION_KEY = 'viewHistoricalData';

class ViewHistoricalDataAction extends PreviewAction {
  constructor(openmct) {
    super(openmct);

    this.name = 'View Historical Data';
    this.key = VIEW_HISTORICAL_DATA_ACTION_KEY;
    this.description = 'View Historical Data in a Table or Plot';
    this.cssClass = 'icon-eye-open';
    this.hideInDefaultMenu = true;
  }

  appliesTo(objectPath, view = {}) {
    let viewContext = view.getViewContext && view.getViewContext();

    return (
      objectPath.length && viewContext && viewContext.row && viewContext.row.viewHistoricalData
    );
  }
}

export { VIEW_HISTORICAL_DATA_ACTION_KEY };

export default ViewHistoricalDataAction;
