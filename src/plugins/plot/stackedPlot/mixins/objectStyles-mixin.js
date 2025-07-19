/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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

import StyleRuleManager from '@/plugins/condition/StyleRuleManager';
import { STYLE_CONSTANTS } from '@/plugins/condition/utils/constants';

export default {
  inject: ['openmct', 'domainObject', 'objectPath'],
  data() {
    return {
      objectStyle: undefined
    };
  },
  mounted() {
    this.objectStyles = this.getObjectStyleForItem(this.childObject.configuration);
    this.initObjectStyles();
  },
  beforeUnmount() {
    if (this.stopListeningStyles) {
      this.stopListeningStyles();
    }

    if (this.stopListeningFontStyles) {
      this.stopListeningFontStyles();
    }

    if (this.styleRuleManager) {
      this.styleRuleManager.destroy();
    }
  },
  methods: {
    getObjectStyleForItem(config) {
      if (config && config.objectStyles) {
        return config.objectStyles ? Object.assign({}, config.objectStyles) : undefined;
      } else {
        return undefined;
      }
    },
    initObjectStyles() {
      if (!this.styleRuleManager) {
        this.styleRuleManager = new StyleRuleManager(
          this.objectStyles,
          this.openmct,
          this.updateStyle.bind(this),
          true
        );
      } else {
        this.styleRuleManager.updateObjectStyleConfig(this.objectStyles);
      }

      if (this.stopListeningStyles) {
        this.stopListeningStyles();
      }

      this.stopListeningStyles = this.openmct.objects.observe(
        this.childObject,
        'configuration.objectStyles',
        (newObjectStyle) => {
          //Updating styles in the inspector view will trigger this so that the changes are reflected immediately
          this.styleRuleManager.updateObjectStyleConfig(newObjectStyle);
        }
      );

      if (
        this.childObject &&
        this.childObject.configuration &&
        this.childObject.configuration.fontStyle
      ) {
        const { fontSize, font } = this.childObject.configuration.fontStyle;
        this.setFontSize(fontSize);
        this.setFont(font);
      }

      this.stopListeningFontStyles = this.openmct.objects.observe(
        this.childObject,
        'configuration.fontStyle',
        (newFontStyle) => {
          this.setFontSize(newFontStyle.fontSize);
          this.setFont(newFontStyle.font);
        }
      );
    },
    getStyleReceiver() {
      let styleReceiver;

      if (this.$el !== undefined) {
        styleReceiver =
          this.$el.querySelector('.js-style-receiver') || this.$el.querySelector(':first-child');

        if (styleReceiver === null) {
          styleReceiver = undefined;
        }
      }

      return styleReceiver;
    },
    setFontSize(newSize) {
      let elemToStyle = this.getStyleReceiver();

      if (elemToStyle !== undefined) {
        elemToStyle.dataset.fontSize = newSize;
      }
    },
    setFont(newFont) {
      let elemToStyle = this.getStyleReceiver();

      if (elemToStyle !== undefined) {
        elemToStyle.dataset.font = newFont;
      }
    },
    updateStyle(styleObj) {
      const elemToStyle = this.getStyleReceiver();

      if (!styleObj || !elemToStyle) {
        return;
      }
      // handle visibility separately
      if (styleObj.isStyleInvisible !== undefined) {
        elemToStyle.classList.toggle(STYLE_CONSTANTS.isStyleInvisible, styleObj.isStyleInvisible);
        styleObj.isStyleInvisible = null;
      }

      Object.entries(styleObj).forEach(([key, value]) => {
        if (typeof value !== 'string' || !value.includes('__no_value')) {
          elemToStyle.style[key] = value;
        } else {
          elemToStyle.style[key] = ''; // remove the property
        }
      });
    }
  }
};
