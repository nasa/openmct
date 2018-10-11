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

import EventEmitter from 'EventEmitter';
/**
 * Event is fired when notification is dismissed, either by the user or automatically.
 * @event MCTNotification#destroy
 */
/**
 * Event is fired when notification is minimized. A notification can be minimized either automatically, or by the user.
 * When minimized, a notification is available from the notification list available from the notification indicator.
 * @event MCTNotification#minimize
 */
export default class MCTNotification extends EventEmitter {

    constructor(notificationModel, notificationAPI) {
        super();
        this.notifications = notificationAPI;
        this.model = notificationModel;
        this._initializeModel();
    }

    dismiss() {
        this.notifications.dismissOrMinimize(this);
    }

    /**
     * @param {Number} progress A value between 0 and 100
     * @param {String} [progressText] Text to show when the user hovers on the progress bar.
     */
    progress(progress, progressText) {
        this.model.progress = progress;
        this.model.progressText = progressText;
        this.emit('progress', progress, progressText);
    }

    /**
     * @private
     */
    _initializeModel() {
        this.model.minimized = this.model.minimized || false;
    }
}
