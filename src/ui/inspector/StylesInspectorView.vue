/*****************************************************************************
* Open MCT, Copyright (c) 2014-2020, United States Government
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
<div class="u-contents"></div>
</template>

<script>
import ConditionalStylesView from '../../plugins/condition/components/inspector/ConditionalStylesView.vue';
import Vue from 'vue';
import { getStyleProp } from "../../plugins/condition/utils/styleUtils";

export default {
    inject: ['openmct'],
    data() {
        return {
            selection: []
        }
    },
    mounted() {
        this.openmct.selection.on('change', this.updateSelection);
        this.updateSelection(this.openmct.selection.get());
    },
    destroyed() {
        this.openmct.selection.off('change', this.updateSelection);
    },
    methods: {
        getStyleProperties(item) {
            let styleProps = {};
            Object.keys(item).forEach((key) => {
                Object.assign(styleProps, getStyleProp(key, item[key]));
            });
            return styleProps;
        },
        updateSelection(selection) {
            if (selection.length > 0 && selection[0].length > 0) {
                let isChildItem = false;
                let domainObject = selection[0][0].context.item;
                let layoutItem = {};
                let styleProps = this.getStyleProperties({
                    fill: 'transparent',
                    stroke: 'transparent',
                    color: 'transparent'
                });
                if (selection[0].length > 1) {
                    isChildItem = true;
                    //If there are more than 1 items in the selection[0] list, the first one could either be a sub domain object OR a layout drawing control.
                    //The second item in the selection[0] list is the container object (usually a layout)
                    if (!domainObject) {
                        styleProps = {};
                        layoutItem = selection[0][0].context.layoutItem;
                        styleProps = this.getStyleProperties(layoutItem);
                        domainObject = selection[0][1].context.item;
                    }
                }

                if (this.component) {
                    this.component.$destroy();
                    this.component = undefined;
                    this.$el.innerHTML = '';
                }
                let viewContainer = document.createElement('div');
                this.$el.append(viewContainer);
                this.component = new Vue({
                    provide: {
                        openmct: this.openmct,
                        domainObject: domainObject
                    },
                    el: viewContainer,
                    components: {
                        ConditionalStylesView
                    },
                    data() {
                        return {
                            layoutItem,
                            styleProps,
                            isChildItem
                        }
                    },
                    template: '<conditional-styles-view :can-hide="isChildItem" :item-id="layoutItem.id" :initial-styles="styleProps"></conditional-styles-view>'
                });
            }
        }
    }
}
</script>
