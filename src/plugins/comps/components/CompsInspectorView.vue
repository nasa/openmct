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
  <div class="c-inspect-properties">
    <template v-if="isEditing">
      <ul class="c-inspect-properties__section">
        <li class="c-inspect-properties__row">
          <div class="c-inspect-properties__label" title="Output Format">
            <label for="OutputFormatControl">Output Format</label>
          </div>
          <div class="c-inspect-properties__value">
            <input
              id="OutputFormatControl"
              v-model="inputFormatValue"
              type="text"
              class="c-input--flex"
              @change="changeInputFormat()"
            />
          </div>
        </li>
      </ul>
    </template>
  </div>
</template>

<script setup>
import { inject, onBeforeMount, onBeforeUnmount, ref } from 'vue';

const isEditing = ref(false);
const inputFormatValue = ref('');

const openmct = inject('openmct');
const domainObject = inject('domainObject');
const compsManagerPool = inject('compsManagerPool');

onBeforeMount(() => {
  isEditing.value = openmct.editor.isEditing();
  openmct.editor.on('isEditing', toggleEdit);
  inputFormatValue.value = domainObject.configuration.comps.outputFormat;
});

onBeforeUnmount(() => {
  openmct.editor.off('isEditing', toggleEdit);
});

function toggleEdit(passedIsEditing) {
  isEditing.value = passedIsEditing;
}

function changeInputFormat() {
  openmct.objects.mutate(domainObject, `configuration.comps.outputFormat`, inputFormatValue.value);
  compsManagerPool.setDomainObject(domainObject);
}
</script>
