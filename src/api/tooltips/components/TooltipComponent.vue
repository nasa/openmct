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
  <div ref="tooltip-wrapper" class="c-menu c-tooltip-wrapper" :style="toolTipLocationStyle">
    <div class="c-tooltip">
      {{ toolTipText }}
    </div>
  </div>
</template>

<script>
export default {
  inject: ['toolTipText', 'toolTipLocation', 'parentElement'],
  computed: {
    toolTipCoordinates() {
      return this.parentElement.getBoundingClientRect();
    },
    toolTipLocationStyle() {
      const { top, left, height, width } = this.toolTipCoordinates;
      let toolTipLocationStyle = {};

      if (this.toolTipLocation === 'above') {
        toolTipLocationStyle = { top: `${top - 5}px`, left: `${left}px` };
      }
      if (this.toolTipLocation === 'below') {
        toolTipLocationStyle = { top: `${top + height}px`, left: `${left}px` };
      }
      if (this.toolTipLocation === 'right') {
        toolTipLocationStyle = { top: `${top}px`, left: `${left + width}px` };
      }
      if (this.toolTipLocation === 'left') {
        toolTipLocationStyle = { top: `${top}px`, left: `${left - width}px` };
      }
      if (this.toolTipLocation === 'center') {
        toolTipLocationStyle = { top: `${top + height / 2}px`, left: `${left + width / 2}px` };
      }

      return toolTipLocationStyle;
    }
  }
};
</script>
