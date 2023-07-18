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
import PollQuestionComponent from './PollQuestion.vue';

export default class PollQuestionIndicator extends AbstractStatusIndicator {
  createPopupComponent() {
    const indicator = this.getIndicator();
    const { vNode } = mount(
      {
        components: {
          PollQuestion: PollQuestionComponent
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
        template: '<poll-question :positionX="positionX" :positionY="positionY" />'
      },
      {
        app: this.openmct.app
      }
    );

    return vNode.componentInstance;
  }

  createIndicator() {
    const pollQuestionIndicator = this.openmct.indicators.simpleIndicator();

    pollQuestionIndicator.text('No Poll Question');
    pollQuestionIndicator.description('Set the current poll question');
    pollQuestionIndicator.iconClass('icon-status-poll-edit');
    pollQuestionIndicator.element.classList.add('c-indicator--operator-status');
    pollQuestionIndicator.element.classList.add('no-minify');
    pollQuestionIndicator.on('click', this.showPopup);

    return pollQuestionIndicator;
  }
}
