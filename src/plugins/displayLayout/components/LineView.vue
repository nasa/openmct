/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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

 <template>
  <div>
    <svg :width="gridSize[0] * element.width"
         :height=" gridSize[1] * element.height">
        <line :x1=" gridSize[0] * element.x1 + 1"
              :y1="gridSize[1] * element.y1 + 1 "
              :x2="gridSize[0] * element.x2 + 1"
              :y2=" gridSize[1] * element.y2 + 1 "
              :stroke="element.stroke"
              stroke-width="2">
        </line>
    </svg>
  </div>
 </template>

 <script>
    export default {
        props: {
            item: Object,
            gridSize: Array
        },
        computed: {
            element() {
                return this.item.config.element;
            }
        },
        mounted() {
            this.item.config.attachListeners();
        },
        destroyed() {
            this.item.config.removeListeners();
        }
    }
 </script>