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
/*global define*/

define([
    "./src/indicators/ClockIndicator",
    "./src/services/TickerService",
    "./src/controllers/ClockController",
    "./src/controllers/TimerController",
    "./src/controllers/RefreshingController",
    "./src/actions/StartTimerAction",
    "./src/actions/RestartTimerAction",
    "text!./res/templates/clock.html",
    "text!./res/templates/timer.html",
    'legacyRegistry'
], function (
    ClockIndicator,
    TickerService,
    ClockController,
    TimerController,
    RefreshingController,
    StartTimerAction,
    RestartTimerAction,
    clockTemplate,
    timerTemplate,
    legacyRegistry
) {
    "use strict";

    legacyRegistry.register("platform/features/clock", {
        "name": "Clocks/Timers",
        "descriptions": "Domain objects for displaying current & relative times.",
        "configuration": {
            "paths": {
                "moment-duration-format": "moment-duration-format"
            },
            "shim": {
                "moment-duration-format": {
                    "deps": [
                        "moment"
                    ]
                }
            }
        },
        "extensions": {
            "constants": [
                {
                    "key": "CLOCK_INDICATOR_FORMAT",
                    "value": "YYYY/MM/DD HH:mm:ss"
                }
            ],
            "indicators": [
                {
                    "implementation": ClockIndicator,
                    "depends": [
                        "tickerService",
                        "CLOCK_INDICATOR_FORMAT"
                    ],
                    "priority": "preferred"
                }
            ],
            "services": [
                {
                    "key": "tickerService",
                    "implementation": TickerService,
                    "depends": [
                        "$timeout",
                        "now"
                    ]
                }
            ],
            "controllers": [
                {
                    "key": "ClockController",
                    "implementation": ClockController,
                    "depends": [
                        "$scope",
                        "tickerService"
                    ]
                },
                {
                    "key": "TimerController",
                    "implementation": TimerController,
                    "depends": [
                        "$scope",
                        "$window",
                        "now"
                    ]
                },
                {
                    "key": "RefreshingController",
                    "implementation": RefreshingController,
                    "depends": [
                        "$scope",
                        "tickerService"
                    ]
                }
            ],
            "views": [
                {
                    "key": "clock",
                    "type": "clock",
                    "editable": false,
                    "template": clockTemplate
                },
                {
                    "key": "timer",
                    "type": "timer",
                    "editable": false,
                    "template": timerTemplate
                }
            ],
            "actions": [
                {
                    "key": "timer.start",
                    "implementation": StartTimerAction,
                    "depends": [
                        "now"
                    ],
                    "category": "contextual",
                    "name": "Start",
                    "glyph": "ï",
                    "priority": "preferred"
                },
                {
                    "key": "timer.restart",
                    "implementation": RestartTimerAction,
                    "depends": [
                        "now"
                    ],
                    "category": "contextual",
                    "name": "Restart at 0",
                    "glyph": "r",
                    "priority": "preferred"
                }
            ],
            "types": [
                {
                    "key": "clock",
                    "name": "Clock",
                    "glyph": "\u0043",
                    "description": "A UTC-based clock that supports a variety of display formats. Clocks can be added to Display Layouts.",
                    "priority": 101,
                    "features": [
                        "creation"
                    ],
                    "properties": [
                        {
                            "key": "clockFormat",
                            "name": "Display Format",
                            "control": "composite",
                            "items": [
                                {
                                    "control": "select",
                                    "options": [
                                        {
                                            "value": "YYYY/MM/DD hh:mm:ss",
                                            "name": "YYYY/MM/DD hh:mm:ss"
                                        },
                                        {
                                            "value": "YYYY/DDD hh:mm:ss",
                                            "name": "YYYY/DDD hh:mm:ss"
                                        },
                                        {
                                            "value": "hh:mm:ss",
                                            "name": "hh:mm:ss"
                                        }
                                    ],
                                    "cssclass": "l-inline"
                                },
                                {
                                    "control": "select",
                                    "options": [
                                        {
                                            "value": "clock12",
                                            "name": "12hr"
                                        },
                                        {
                                            "value": "clock24",
                                            "name": "24hr"
                                        }
                                    ],
                                    "cssclass": "l-inline"
                                }
                            ]
                        }
                    ],
                    "model": {
                        "clockFormat": [
                            "YYYY/MM/DD hh:mm:ss",
                            "clock12"
                        ]
                    }
                },
                {
                    "key": "timer",
                    "name": "Timer",
                    "glyph": "\u00f5",
                    "description": "A timer that counts up or down to a datetime. Timers can be started, stopped and reset whenever needed, and support a variety of display formats. Each Timer displays the same value to all users. Timers can be added to Display Layouts.",
                    "priority": 100,
                    "features": [
                        "creation"
                    ],
                    "properties": [
                        {
                            "key": "timestamp",
                            "control": "datetime",
                            "name": "Target"
                        },
                        {
                            "key": "timerFormat",
                            "control": "select",
                            "name": "Display Format",
                            "options": [
                                {
                                    "value": "long",
                                    "name": "DDD hh:mm:ss"
                                },
                                {
                                    "value": "short",
                                    "name": "hh:mm:ss"
                                }
                            ]
                        }
                    ],
                    "model": {
                        "timerFormat": "DDD hh:mm:ss"
                    }
                }
            ],
            "licenses": [
                {
                    "name": "moment-duration-format",
                    "version": "1.3.0",
                    "author": "John Madhavan-Reese",
                    "description": "Duration parsing/formatting",
                    "website": "https://github.com/jsmreese/moment-duration-format",
                    "copyright": "Copyright 2014 John Madhavan-Reese",
                    "license": "license-mit",
                    "link": "https://github.com/jsmreese/moment-duration-format/blob/master/LICENSE"
                }
            ]
        }
    });
});
