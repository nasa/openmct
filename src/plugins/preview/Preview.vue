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
 <div class="l-preview-window">
    <div class="l-browse-bar__object-name--w" :class="type.cssClass">
        <span class="l-browse-bar__object-name">
            {{ domainObject.name }}
        </span>
        <span class="l-browse-bar__context-actions c-disclosure-button" @click="showContextMenu"></span>
    </div>
    <div class="l-preview-window__object-view" ref="objectView">
    </div>
</div>
 </template>
<style lang="scss">
    .l-preview-window {
        display: flex;
        flex-flow: column nowrap;

        &__object-view {
            flex: 1 1 auto;
        }
    }
</style>

 <script>
    export default {
        data() {
            let domainObject = this.objectPath[0]; 
            let type = this.openmct.types.get(domainObject.type);

            return {
                domainObject: domainObject,
                type: type
            };
        },
        inject: [
            'openmct',
            'objectPath'
        ],
        mounted() {
            let viewProvider = this.openmct.objectViews.get(this.domainObject)[0];
            this.view = viewProvider.view(this.domainObject);
            this.view.show(this.$refs.objectView);
        },
        methods: {
            showContextMenu(event){
                event.preventDefault();
                event.stopPropagation();
                this.openmct.contextMenu._showContextMenuForObjectPath(this.objectPath, event.clientX, event.clientY);
            }
        },
        destroy() {
            this.view.destroy();
        }
    }
 </script>
