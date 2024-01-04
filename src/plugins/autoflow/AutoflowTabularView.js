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

import autoflowTemplate from './autoflow-tabular.html';
import AutoflowTabularConstants from './AutoflowTabularConstants.js';
import AutoflowTabularController from './AutoflowTabularController.js';
import VueView from './VueView.js';

const { ROW_HEIGHT, SLIDER_HEIGHT, INITIAL_COLUMN_WIDTH, MAX_COLUMN_WIDTH, COLUMN_WIDTH_STEP } =
  AutoflowTabularConstants;

/**
 * Implements the Autoflow Tabular view of a domain object using Vue.
 * Extends VueView to utilize Vue.js functionalities.
 */
export default class AutoflowTabularView extends VueView {
  /**
   * Create an AutoflowTabularView instance.
   * @param {Object} domainObject - The domain object to be displayed.
   * @param {Object} openmct - The Open MCT instance.
   */
  constructor(domainObject, openmct) {
    const data = {
      items: [],
      columns: [],
      width: INITIAL_COLUMN_WIDTH,
      filter: '',
      updated: 'No updates',
      rowCount: 1
    };

    super({
      data: data,
      methods: {
        increaseColumnWidth: () => {
          data.width += COLUMN_WIDTH_STEP;
          data.width = data.width > MAX_COLUMN_WIDTH ? INITIAL_COLUMN_WIDTH : data.width;
        },
        reflow: () => {
          let column = [];
          let index = 0;
          const filteredItems = data.items.filter((item) =>
            item.name.toLowerCase().includes(data.filter.toLowerCase())
          );

          data.columns = [];

          while (index < filteredItems.length) {
            if (column.length >= data.rowCount) {
              data.columns.push(column);
              column = [];
            }

            column.push(filteredItems[index]);
            index += 1;
          }

          if (column.length > 0) {
            data.columns.push(column);
          }
        }
      },
      watch: {
        filter: 'reflow',
        items: 'reflow',
        rowCount: 'reflow'
      },
      template: autoflowTemplate,
      unmounted: () => {
        this.controller.destroy();
        if (this.interval) {
          clearInterval(this.interval);
          this.interval = undefined;
        }
      },
      mounted: function () {
        this.controller.activate();

        const updateRowHeight = () => {
          const tabularArea = this.$refs.autoflowItems;
          const height = tabularArea ? tabularArea.clientHeight : 0;
          const available = height - SLIDER_HEIGHT;
          const rows = Math.max(1, Math.floor(available / ROW_HEIGHT));
          data.rowCount = rows;
        };

        this.interval = setInterval(updateRowHeight, 50);
        this.$nextTick(updateRowHeight);
      }
    });

    this.controller = new AutoflowTabularController(domainObject, data, openmct);
    this.interval = undefined;
  }
}
