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

import StyleRuleManager from "@/plugins/condition/StyleRuleManager";
import {getStylesWithoutNoneValue} from "@/plugins/condition/utils/styleUtils";

export default {
    inject: ['openmct'],
    data() {
        return {
            objectStyle: undefined,
            itemStyle: undefined,
            styleClass: '',
            itemFontStyle: undefined
        };
    },
    mounted() {
        this.parentDomainObject = this.$parent.domainObject;
        this.itemId = this.item.id;
        this.objectStyle = this.getObjectStyleForItem(this.parentDomainObject.configuration.objectStyles);
        this.initObjectStyles();
        this.itemFontStyle = this.getItemFontStyle(this.parentDomainObject.configuration.objectStyles);
    },
    destroyed() {
        if (this.stopListeningObjectStyles) {
            this.stopListeningObjectStyles();
        }
    },
    methods: {
        getObjectStyleForItem(objectStyle) {
            if (objectStyle) {
                return objectStyle[this.itemId] ? Object.assign({}, objectStyle[this.itemId]) : undefined;
            } else {
                return undefined;
            }
        },
        getItemFontStyle(objectStyles) {
            let itemFontStyle;

            if (objectStyles && objectStyles[this.itemId] && objectStyles[this.itemId].fontStyle) {
                itemFontStyle = JSON.parse(JSON.stringify(objectStyles[this.itemId].fontStyle));
            }

            return itemFontStyle;
        },
        initObjectStyles() {
            if (!this.styleRuleManager) {
                this.styleRuleManager = new StyleRuleManager(this.objectStyle, this.openmct, this.updateStyle.bind(this), true);
            } else {
                this.styleRuleManager.updateObjectStyleConfig(this.objectStyle);
            }

            if (this.stopListeningObjectStyles) {
                this.stopListeningObjectStyles();
            }

            this.stopListeningObjectStyles = this.openmct.objects.observe(this.parentDomainObject, 'configuration.objectStyles', (newObjectStyle) => {
                //Updating object styles in the inspector view will trigger this so that the changes are reflected immediately
                let newItemObjectStyle = this.getObjectStyleForItem(newObjectStyle);
                if (this.objectStyle !== newItemObjectStyle) {
                    this.updateItemFontStyle(newItemObjectStyle);
                    this.objectStyle = newItemObjectStyle;
                    this.styleRuleManager.updateObjectStyleConfig(this.objectStyle);
                }
                console.log('configuration.objectStyles');
            });
        },
        updateItemFontStyle(objectStyle) {
            console.log('here');
            if (!objectStyle) {
                console.log('no style');
                return;
            }

            const fontSize = objectStyle.fontStyle && objectStyle.fontStyle.fontSize;
            const font = objectStyle.fontStyle && objectStyle.fontStyle.font;

            if (this.itemFontStyle && (this.itemFontStyle.fontSize !== fontSize || this.itemFontStyle.font !== font)) {
                this.itemFontStyle = objectStyle.fontStyle;
            }
        },
        updateStyle(style) {
            this.itemStyle = getStylesWithoutNoneValue(style);
            this.styleClass = this.itemStyle && this.itemStyle.isStyleInvisible;
        }
    }
};
