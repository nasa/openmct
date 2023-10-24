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

const expandColumns = {
  name: 'Expand Columns',
  key: 'lad-expand-columns',
  description: 'Increase column widths to fit currently available data.',
  cssClass: 'icon-arrows-right-left labeled',
  invoke: (objectPath, view) => {
    view.getViewContext().toggleFixedLayout();
  },
  showInStatusBar: true,
  group: 'view'
};

const autosizeColumns = {
  name: 'Autosize Columns',
  key: 'lad-autosize-columns',
  description: 'Automatically size columns to fit the table into the available space.',
  cssClass: 'icon-expand labeled',
  invoke: (objectPath, view) => {
    view.getViewContext().toggleFixedLayout();
  },
  showInStatusBar: true,
  group: 'view'
};

const viewActions = [expandColumns, autosizeColumns];

viewActions.forEach((action) => {
  action.appliesTo = (objectPath, view = {}) => {
    const viewContext = view.getViewContext && view.getViewContext();
    if (!viewContext) {
      return false;
    }

    return viewContext.type === 'lad-table';
  };
});

export default viewActions;
