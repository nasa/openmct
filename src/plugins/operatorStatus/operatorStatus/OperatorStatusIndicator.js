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
import mount from 'utils/mount';

import AbstractStatusIndicator from '../AbstractStatusIndicator';
import OperatorStatusComponent from './OperatorStatus.vue';

export default class OperatorStatusIndicator extends AbstractStatusIndicator {
  createPopupComponent() {
    const indicator = this.getIndicator();
    const { vNode } = mount(
      {
        components: {
          OperatorStatus: OperatorStatusComponent
        },
        provide: {
          openmct: this.openmct,
          indicator: indicator,
          configuration: this.getConfiguration()
        },
        data() {
          return {
            positionX: 0,
            positionY: 0
          };
        },
        template: '<operator-status :positionX="positionX" :positionY="positionY" />'
      },
      {
        app: this.openmct.app
      }
    );

    return vNode.componentInstance;
  }

  createIndicator() {
    const operatorIndicator = this.openmct.indicators.simpleIndicator();

    operatorIndicator.text('My Operator Status');
    operatorIndicator.description('Set my operator status');
    operatorIndicator.iconClass('icon-status-poll-question-mark');
    operatorIndicator.element.classList.add('c-indicator--operator-status');
    operatorIndicator.element.classList.add('no-minify');
    operatorIndicator.on('click', this.showPopup);

    return operatorIndicator;
  }
}
