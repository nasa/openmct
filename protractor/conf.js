/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global exports,process*/

// conf.js
exports.config = {
    allScriptsTimeout: 500000,
    jasmineNodeOpts: {defaultTimeoutInterval: 360000},
    seleniumAddress: 'http://localhost:4444/wd/hub',
    //specs: ['StressTestCarrot.js'],
    specs: [
        // 'create/CreateActivity.js',
        // 'delete/DeleteActivity.js',
        // 'create/CreateActivityMode.js',
        // 'delete/DeleteActivityMode.js',
        // 'create/CreateClock.js',
        // 'delete/DeleteClock.js',
        'create/CreateDisplay.js',
        'delete/DeleteDisplay.js',
        'create/CreateFolder.js',
        'delete/DeleteFolder.js',
        // 'create/CreateTelemetry.js',
        // 'delete/DeleteTelemetry.js',
        // 'create/CreateTimeline.js',
        // 'delete/DeleteTimeline.js',
        // 'create/CreateTimer.js',
        // 'delete/DeleteTimer.js',
        'create/CreateWebPage.js',
        'delete/DeleteWebPage.js',
        'UI/Fullscreen.js',
        'create/CreateButton.js',
        //"UI/DragDrop.js",
        "UI/NewWindow.js"
        //'UI/InfoBubble.js',
        //'UI/RightClick.js'
    ],
    capabilities: {
        'browserName': 'chrome', // or 'safari'
        'chromeOptions': {}
    }
};

// Allow specifying binary location as an environment variable,
// for cases where Chrome is not installed in a usual location.
if (process.env.CHROME_BIN) {
    exports.config.capabilities.chromeOptions.binary =
        process.env.CHROME_BIN;
}
