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
import { ACTIVE_ROLE_BROADCAST_CHANNEL_NAME } from './constants.js';

class ActiveRoleSynchronizer {
  #roleChannel;

  constructor(openmct) {
    this.openmct = openmct;
    this.#roleChannel = new BroadcastChannel(ACTIVE_ROLE_BROADCAST_CHANNEL_NAME);
    this.setActiveRoleFromChannelMessage = this.setActiveRoleFromChannelMessage.bind(this);

    this.subscribeToRoleChanges(this.setActiveRoleFromChannelMessage);
  }
  subscribeToRoleChanges(callback) {
    this.#roleChannel.addEventListener('message', callback);
  }
  unsubscribeFromRoleChanges(callback) {
    this.#roleChannel.removeEventListener('message', callback);
  }

  setActiveRoleFromChannelMessage(event) {
    const role = event.data;
    this.openmct.user.setActiveRole(role);
  }
  broadcastNewRole(role) {
    if (!this.#roleChannel.name) {
      return false;
    }

    this.#roleChannel.postMessage(role);
  }
  destroy() {
    this.unsubscribeFromRoleChanges(this.setActiveRoleFromChannelMessage);
    this.#roleChannel.close();
  }
}

export default ActiveRoleSynchronizer;
