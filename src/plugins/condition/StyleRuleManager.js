/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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

import EventEmitter from 'EventEmitter';

export default class StyleRuleManager extends EventEmitter {
  constructor(styleConfiguration, openmct, callback, suppressSubscriptionOnEdit) {
    super();
    this.openmct = openmct;
    this.callback = callback;
    this.refreshData = this.refreshData.bind(this);
    this.toggleSubscription = this.toggleSubscription.bind(this);
    if (suppressSubscriptionOnEdit) {
      this.openmct.editor.on('isEditing', this.toggleSubscription);
      this.isEditing = this.openmct.editor.editing;
    }

    if (styleConfiguration) {
      // We don't set the selectedConditionId here because we want condition set computation to happen before we apply any selected style
      const styleConfigurationWithNoSelection = Object.assign(styleConfiguration, {
        selectedConditionId: ''
      });
      this.initialize(styleConfigurationWithNoSelection);
      if (styleConfiguration.conditionSetIdentifier) {
        this.openmct.time.on('bounds', this.refreshData);
        this.subscribeToConditionSet();
      } else {
        this.applyStaticStyle();
      }
    }
  }

  toggleSubscription(isEditing) {
    this.isEditing = isEditing;
    if (this.isEditing) {
      if (this.stopProvidingTelemetry) {
        this.stopProvidingTelemetry();
        delete this.stopProvidingTelemetry;
      }

      if (this.conditionSetIdentifier) {
        this.applySelectedConditionStyle();
      }
    } else if (this.conditionSetIdentifier) {
      //reset the selected style and let the condition set output determine what it should be
      this.selectedConditionId = undefined;
      this.currentStyle = undefined;
      this.updateDomainObjectStyle();
      this.subscribeToConditionSet();
    }
  }

  initialize(styleConfiguration) {
    this.conditionSetIdentifier = styleConfiguration.conditionSetIdentifier;
    this.selectedConditionId = styleConfiguration.selectedConditionId;
    this.staticStyle = styleConfiguration.staticStyle;
    this.defaultConditionId = styleConfiguration.defaultConditionId;
    this.updateConditionStylesMap(styleConfiguration.styles || []);
  }

  subscribeToConditionSet() {
    if (this.stopProvidingTelemetry) {
      this.stopProvidingTelemetry();
      delete this.stopProvidingTelemetry;
    }

    this.openmct.objects.get(this.conditionSetIdentifier).then((conditionSetDomainObject) => {
      this.openmct.telemetry.request(conditionSetDomainObject).then((output) => {
        if (
          output &&
          output.length &&
          this.conditionSetIdentifier &&
          this.openmct.objects.areIdsEqual(
            conditionSetDomainObject.identifier,
            this.conditionSetIdentifier
          )
        ) {
          this.handleConditionSetResultUpdated(output[0]);
        }
      });
      if (
        this.conditionSetIdentifier &&
        this.openmct.objects.areIdsEqual(
          conditionSetDomainObject.identifier,
          this.conditionSetIdentifier
        )
      ) {
        this.stopProvidingTelemetry = this.openmct.telemetry.subscribe(
          conditionSetDomainObject,
          this.handleConditionSetResultUpdated.bind(this)
        );
      }
    });
  }

  refreshData(bounds, isTick) {
    if (!isTick) {
      let options = {
        start: bounds.start,
        end: bounds.end,
        size: 1,
        strategy: 'latest'
      };
      this.openmct.objects.get(this.conditionSetIdentifier).then((conditionSetDomainObject) => {
        this.openmct.telemetry.request(conditionSetDomainObject, options).then((output) => {
          if (output && output.length) {
            this.handleConditionSetResultUpdated(output[0]);
          }
        });
      });
    }
  }

  updateObjectStyleConfig(styleConfiguration) {
    if (!styleConfiguration || !styleConfiguration.conditionSetIdentifier) {
      this.initialize(styleConfiguration || {});
      this.applyStaticStyle();
      this.destroy(true);
    } else {
      let isNewConditionSet =
        !this.conditionSetIdentifier ||
        !this.openmct.objects.areIdsEqual(
          this.conditionSetIdentifier,
          styleConfiguration.conditionSetIdentifier
        );
      this.initialize(styleConfiguration);
      if (this.isEditing) {
        this.applySelectedConditionStyle();
      } else {
        //Only resubscribe if the conditionSet has changed.
        if (isNewConditionSet) {
          this.subscribeToConditionSet();
        }
      }
    }
  }

  updateConditionStylesMap(conditionStyles) {
    let conditionStyleMap = {};
    conditionStyles.forEach((conditionStyle) => {
      if (conditionStyle.conditionId) {
        conditionStyleMap[conditionStyle.conditionId] = conditionStyle.style;
      } else {
        conditionStyleMap.static = conditionStyle.style;
      }
    });
    this.conditionalStyleMap = conditionStyleMap;
  }

  handleConditionSetResultUpdated(resultData) {
    let foundStyle = this.conditionalStyleMap[resultData.conditionId];
    if (foundStyle) {
      if (foundStyle !== this.currentStyle) {
        this.currentStyle = foundStyle;
      }

      this.updateDomainObjectStyle();
    } else {
      this.applyStaticStyle();
    }
  }

  updateDomainObjectStyle() {
    if (this.callback) {
      this.callback(Object.assign({}, this.currentStyle));
    }
  }

  applySelectedConditionStyle() {
    const conditionId = this.selectedConditionId || this.defaultConditionId;
    if (!conditionId) {
      this.applyStaticStyle();
    } else if (this.conditionalStyleMap[conditionId]) {
      this.currentStyle = this.conditionalStyleMap[conditionId];
      this.updateDomainObjectStyle();
    }
  }

  applyStaticStyle() {
    if (this.staticStyle) {
      this.currentStyle = this.staticStyle.style;
    } else {
      if (this.currentStyle) {
        Object.keys(this.currentStyle).forEach((key) => {
          this.currentStyle[key] = '__no_value';
        });
      }
    }

    this.updateDomainObjectStyle();
  }

  destroy(skipEventListeners) {
    if (this.stopProvidingTelemetry) {
      this.stopProvidingTelemetry();
      delete this.stopProvidingTelemetry;
    }

    if (!skipEventListeners) {
      this.openmct.time.off('bounds', this.refreshData);
      this.openmct.editor.off('isEditing', this.toggleSubscription);
    }

    this.conditionSetIdentifier = undefined;
  }
}
