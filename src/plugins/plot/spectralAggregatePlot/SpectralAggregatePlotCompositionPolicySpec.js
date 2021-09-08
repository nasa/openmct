/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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

import SpectralAggregatePlotCompositionPolicy from "./SpectralAggregatePlotCompositionPolicy";
import { createOpenMct } from "utils/testing";

fdescribe("The spectral aggregation plot composition policy", () => {
    let openmct;

    beforeEach(() => {
        const mockNonSpectralMetaData = {
            "period": 10,
            "amplitude": 1,
            "offset": 0,
            "dataRateInHz": 1,
            "phase": 0,
            "randomness": 0,
            valuesForHints: () => {
                return [
                    {
                        "key": "sin",
                        "name": "Sine",
                        "unit": "Hz",
                        "formatString": "%0.2f",
                        "hints": {
                            "range": 1,
                            "priority": 4
                        },
                        "source": "sin"
                    },
                    {
                        "key": "cos",
                        "name": "Cosine",
                        "unit": "deg",
                        "formatString": "%0.2f",
                        "hints": {
                            "range": 2,
                            "priority": 5
                        },
                        "source": "cos"
                    }
                ];
            },
            values: [
                {
                    "key": "name",
                    "name": "Name",
                    "format": "string",
                    "source": "name",
                    "hints": {
                        "priority": 0
                    }
                },
                {
                    "key": "utc",
                    "name": "Time",
                    "format": "utc",
                    "hints": {
                        "domain": 1,
                        "priority": 1
                    },
                    "source": "utc"
                },
                {
                    "key": "yesterday",
                    "name": "Yesterday",
                    "format": "utc",
                    "hints": {
                        "domain": 2,
                        "priority": 2
                    },
                    "source": "yesterday"
                },
                {
                    "key": "cos",
                    "name": "Cosine",
                    "unit": "deg",
                    "formatString": "%0.2f",
                    "hints": {
                        "domain": 3,
                        "priority": 3
                    },
                    "source": "cos"
                },
                {
                    "key": "sin",
                    "name": "Sine",
                    "unit": "Hz",
                    "formatString": "%0.2f",
                    "hints": {
                        "range": 1,
                        "priority": 4
                    },
                    "source": "sin"
                },
                {
                    "key": "cos",
                    "name": "Cosine",
                    "unit": "deg",
                    "formatString": "%0.2f",
                    "hints": {
                        "range": 2,
                        "priority": 5
                    },
                    "source": "cos"
                }
            ]
        };
        openmct = createOpenMct();
        const mockTypeDef = {
            telemetry: mockNonSpectralMetaData
        };
        const mockTypeService = {
            getType: () => {
                return {
                    typeDef: mockTypeDef
                };
            }
        };
        openmct.$injector = {
            get: () => {
                return mockTypeService;
            }
        };

        openmct.telemetry.isTelemetryObject = function (domainObject) {
            return true;
        };
    });

    it("exists", () => {
        expect(SpectralAggregatePlotCompositionPolicy(openmct).allow).toBeDefined();
    });

    it("allow composition only for telemetry that provides/supports spectral data", () => {
        const parent = {
            "composition": [],
            "configuration": {},
            "name": "Some Spectral Aggregate Plot",
            "type": "telemetry.plot.spectral.aggregate",
            "location": "mine",
            "modified": 1631005183584,
            "persisted": 1631005183502,
            "identifier": {
                "namespace": "",
                "key": "b78e7e23-f2b8-4776-b1f0-3ff778f5c8a9"
            }
        };
        const child = {
            "telemetry": {
                "period": 10,
                "amplitude": 1,
                "offset": 0,
                "dataRateInHz": 1,
                "phase": 0,
                "randomness": 0
            },
            "name": "Unnamed Sine Wave Generator",
            "type": "generator",
            "location": "mine",
            "modified": 1630399715531,
            "persisted": 1630399715531,
            "identifier": {
                "namespace": "",
                "key": "21d61f2d-6d2d-4bea-8b0a-7f59fd504c6c"
            }
        };
        expect(SpectralAggregatePlotCompositionPolicy(openmct).allow(parent, child)).toEqual(true);
    });

    it("disallows composition for telemetry that contain anything else", () => {

        const parent = {
            "composition": [],
            "configuration": {},
            "name": "Some Spectral Aggregate Plot",
            "type": "telemetry.plot.spectral.aggregate",
            "location": "mine",
            "modified": 1631005183584,
            "persisted": 1631005183502,
            "identifier": {
                "namespace": "",
                "key": "b78e7e23-f2b8-4776-b1f0-3ff778f5c8a9"
            }
        };
        const child = {
            "telemetry": {
                "period": 10,
                "amplitude": 1,
                "offset": 0,
                "dataRateInHz": 1,
                "phase": 0,
                "randomness": 0
            },
            "name": "Unnamed Sine Wave Generator",
            "type": "generator",
            "location": "mine",
            "modified": 1630399715531,
            "persisted": 1630399715531,
            "identifier": {
                "namespace": "",
                "key": "21d61f2d-6d2d-4bea-8b0a-7f59fd504c6c"
            }
        };
        expect(SpectralAggregatePlotCompositionPolicy(openmct).allow(parent, child)).toEqual(false);
    });

    it("disallows composition for non-aggregate plots", () => {
        const parent = {
            "composition": [],
            "configuration": {},
            "name": "Some Stacked Plot",
            "type": "telemetry.plot.stacked",
            "location": "mine",
            "modified": 1631005183584,
            "persisted": 1631005183502,
            "identifier": {
                "namespace": "",
                "key": "b78e7e23-f2b8-4776-b1f0-3ff778f5c8a9"
            }
        };
        const child = {
            "telemetry": {
                "period": 10,
                "amplitude": 1,
                "offset": 0,
                "dataRateInHz": 1,
                "phase": 0,
                "randomness": 0
            },
            "name": "Unnamed Sine Wave Generator",
            "type": "generator",
            "location": "mine",
            "modified": 1630399715531,
            "persisted": 1630399715531,
            "identifier": {
                "namespace": "",
                "key": "21d61f2d-6d2d-4bea-8b0a-7f59fd504c6c"
            }
        };
        expect(SpectralAggregatePlotCompositionPolicy(openmct).allow(parent, child)).toEqual(false);
    });
});

