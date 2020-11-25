export const mockTelemetryTableSelection = [
    [{
        context: {
            item: {
                configuration: {},
                type: 'table',
                identifier: {
                    key: 'mock-telemetry-table-1',
                    namespace: ''
                }
            }
        }
    }]
];

export const mockStyle = {
    backgroundColor: '#ff0000',
    border: '#ff0000',
    color: '#ff0000'
};

const mockDisplayLayoutPath = {
    context: {
        item: {
            identifier: {
                key: "6af3200d-928b-4ff0-8ed0-b94a0e6752d1",
                namespace: ""
            },
            type: "layout",
            configuration: {
                items: [
                    {
                        id: "dd3202e5-40d0-4112-8951-00f0f1ed6a29",
                        type: "box-view"
                    },
                    {
                        id: "b522d636-90b2-4f5f-9588-2a0345c30f87",
                        type: "box-view"
                    },
                    {
                        id: "537b7596-b442-44fe-b464-07f56bdc67c8",
                        type: "box-view"
                    }
                ],
                objectStyles: {
                    "dd3202e5-40d0-4112-8951-00f0f1ed6a29": {
                        staticStyle: {
                            style: {
                                backgroundColor: "#0000ff",
                                border: "1px solid #0000ff"
                            }
                        }
                    },
                    "b522d636-90b2-4f5f-9588-2a0345c30f87": {
                        staticStyle: {
                            style: {
                                backgroundColor: "#ff0000",
                                border: "1px solid #ff0000"
                            }
                        }
                    },
                    "537b7596-b442-44fe-b464-07f56bdc67c8": {
                        staticStyle: {
                            style: {
                                backgroundColor: "#ff0000",
                                border: "1px solid #ff0000"
                            }
                        }
                    }
                }
            }
        },
        supportsMultiSelect: true
    }
};

const mockBox1Path = {
    context: {
        index: 1,
        layoutItem: {
            id: "dd3202e5-40d0-4112-8951-00f0f1ed6a29",
            type: "box-view"
        }
    }
};

const mockBox2Path = {
    context: {
        index: 1,
        layoutItem: {
            id: "b522d636-90b2-4f5f-9588-2a0345c30f87",
            type: "box-view"
        }
    }
};

const mockBox3Path = {
    context: {
        index: 2,
        layoutItem: {
            id: "537b7596-b442-44fe-b464-07f56bdc67c8",
            type: "box-view"
        }
    }
};

export const mockMultiSelectionSameStyles = [
    [
        mockBox2Path,
        mockDisplayLayoutPath
    ],
    [
        mockBox3Path,
        mockDisplayLayoutPath
    ]
];

export const mockMultiSelectionMixedStyles = [
    [
        mockBox1Path,
        mockDisplayLayoutPath
    ],
    [
        mockBox2Path,
        mockDisplayLayoutPath
    ]
];
