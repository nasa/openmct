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
    <div class="c-text-view"
         :style="styleObject">
        {{ item.config.element.text }}
    </div>
 </template>

<style lang="scss">
    @import '~styles/sass-base';

    .c-text-view {
        display: flex;
        align-items: stretch;

        .c-frame & {
            @include abs();
            border: 1px solid transparent;
        }
    }
</style>

 <script>
    export default {
        props: {
            item: Object
        },
        computed: {
            styleObject() {
                let element = this.item.config.element;
                return {
                    backgroundColor: element.fill,
                    borderColor: element.stroke,
                    color: element.color,
                    fontSize: element.size
                }
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