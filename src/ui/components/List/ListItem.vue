<!--
 Open MCT, Copyright (c) 2014-2023, United States Government
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
  <tr class="c-list-item js-list-item" :class="item.cssClass || ''">
    <td
      v-for="itemValue in formattedItemValues"
      :key="itemValue.key"
      class="c-list-item__value js-list-item__value"
      :class="['--' + itemValue.key]"
      :title="itemValue.text"
    >
      {{ itemValue.text }}
    </td>
  </tr>
</template>

<script>
import _ from 'lodash';

export default {
  inject: ['openmct'],
  props: {
    item: {
      type: Object,
      required: true
    },
    itemProperties: {
      type: Array,
      required: true
    }
  },
  computed: {
    formattedItemValues() {
      let values = [];
      this.itemProperties.forEach((property) => {
        // eslint-disable-next-line you-dont-need-lodash-underscore/get
        let value = _.get(this.item, property.key);
        if (property.format) {
          value = property.format(value, this.item, property.key, this.openmct);
        }

        values.push({
          text: value,
          key: property.key
        });
      });

      return values;
    }
  }
};
</script>
