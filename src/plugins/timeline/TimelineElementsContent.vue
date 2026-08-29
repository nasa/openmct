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
  <template v-if="fixed">
    <input
      :value="size"
      aria-labelledby="pixelSize"
      class="field control c-input--sm"
      :pattern="/\d+/"
      type="number"
      name="value"
      min="0"
      @change="changeSize"
    />
  </template>
  <select v-model="fixed" aria-label="fixedOrFlex" @change="toggleFixed">
    <option :value="false">flex</option>
    <option :value="true">px</option>
  </select>
</template>
<script>
import { inject, ref, watch } from 'vue';

export default {
  props: {
    index: {
      type: Number,
      required: true
    },
    container: {
      type: Object,
      required: true
    }
  },
  setup(props) {
    const openmct = inject('openmct');
    const domainObject = inject('domainObject');

    const fixed = ref(props.container.fixed ?? false);
    const size = ref(props.container.size);

    watch(
      () => props.container,
      () => {
        fixed.value = props.container.fixed;
        size.value = props.container.size;
      }
    );

    function toggleFixed() {
      openmct.objectViews.emit(
        `contextAction:${openmct.objects.makeKeyString(domainObject.identifier)}`,
        'toggleFixedContextAction',
        props.index,
        fixed.value
      );
    }

    function changeSize(event) {
      const _size = Number(event.target.value);
      openmct.objectViews.emit(
        `contextAction:${openmct.objects.makeKeyString(domainObject.identifier)}`,
        'changeSizeContextAction',
        props.index,
        _size
      );
    }

    return {
      openmct,
      domainObject,
      fixed,
      size,
      changeSize,
      toggleFixed
    };
  }
};
</script>
