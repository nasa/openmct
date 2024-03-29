<!--
 Open MCT, Copyright (c) 2014-2024, United States Government
 as represented by the Administrator of the National Aeronautics and Space
 Administration. All rights reserved.

 Open MCT is licensed under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->
<template>
  <td
    ref="tableCell"
    :title="formattedValue"
    :aria-label="`${columnKey} table cell ${formattedValue}`"
    @click="selectCell($event.currentTarget, columnKey)"
    @mouseover.ctrl="showToolTip"
    @mouseleave="hideToolTip"
  >
    {{ formattedValue }}
  </td>
</template>

<script>
import tooltipHelpers from '../../../api/tooltips/tooltipMixins.js';

export default {
  mixins: [tooltipHelpers],
  inject: ['openmct'],
  props: {
    row: {
      type: Object,
      required: true
    },
    columnKey: {
      type: String,
      required: true
    },
    objectPath: {
      type: Array,
      required: true
    }
  },
  computed: {
    formattedValue() {
      return this.row.getFormattedValue(this.columnKey);
    },
    isSelectable() {
      let column = this.row.columns[this.columnKey];

      return column && column.selectable;
    }
  },
  methods: {
    selectCell(element, columnKey) {
      if (this.isSelectable) {
        this.openmct.selection.select(
          [
            {
              element: element,
              context: {
                type: 'table-cell',
                row: this.row.objectKeyString,
                column: columnKey
              }
            },
            {
              element: this.openmct.layout.$refs.browseObject.$el,
              context: {
                item: this.objectPath[0]
              }
            }
          ],
          false
        );
        event.stopPropagation();
      }
    },
    async showToolTip() {
      if (this.columnKey !== 'name') {
        return;
      }
      const { BELOW } = this.openmct.tooltips.TOOLTIP_LOCATIONS;
      this.buildToolTip(await this.getObjectPath(this.row.objectKeyString), BELOW, 'tableCell');
    }
  }
};
</script>
