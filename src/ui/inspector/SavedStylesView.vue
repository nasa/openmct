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
<div class="c-inspector__saved-styles c-inspect-styles">
    <div class="c-inspect-styles__header">
        Saved Styles
    </div>
    <div class="c-inspect-styles__content">
        <div class="c-inspect-styles__saved-style">
            <div
                v-for="(savedStyle, index) in savedStyles"
                :key="index"
                class="c-inspect-styles__saved-style"
            >
                <saved-style-selector
                    class="c-inspect-styles__selector"
                    :saved-style="savedStyle"
                />
            </div>
        </div>
    </div>
</div>
</template>

<script>
import SavedStyleSelector from './SavedStyleSelector.vue';

export default {
    name: 'SavedStylesView',
    components: {
        SavedStyleSelector
    },
    inject: [
        'openmct',
        'selection',
        'stylesManager'
    ],
    data() {
        return {
            savedStyles: undefined
        };
    },
    mounted() {
        this.stylesManager.on('stylesUpdated', this.setStyles);

        this.loadStyles();
        console.log(this.savedStyles);
    },
    methods: {
        loadStyles() {
            const styles = this.stylesManager.load();

            this.setStyles(styles);
        },
        setStyles(styles) {
            this.savedStyles = styles;
        },
        hash(style) {
            return `
                backgroundColor:${style.backgroundColor}
                border:${style.border}
                color:${style.color}
            `;
        },
        applySavedStyle(hash) {
            console.log(this.selection);
            console.log('applystyle');
        },
        applyStaticStyleToSingleSelection(style) {
            const selectionId = this.selection[0].context.layoutItem.id;
            let styleConfiguration = this.selection[0][1].context.item.configuration.objectStyles[selectionId].staticStyle;
            let styles = Object.keys(styleConfiguration);
            // styles.forEach(style => {
            //     styleConfiguration[style] = 
            // });
            console.log('applying single selection');
        },
        deleteSavedStyle(hash) {

        }
    }
};
</script>
