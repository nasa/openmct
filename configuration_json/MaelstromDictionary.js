export default {
    'telemetry': {
        type: 'folder',
        name: 'Maelstrom Telemetry',
        type: 'folder',
        location: 'ROOT',
        composition: [
            {
                namespace: 'maelstrom',
                key: 'velocity'
            },{
                namespace: 'maelstrom',
                key: 'acceleration-ms-2'
            },{
                namespace: 'maelstrom',
                key: 'acceleration-g'
            },{
                namespace: 'maelstrom',
                key: 'distance'
            },{
                namespace: 'maelstrom',
                key: 'distance-m'
            },{
                namespace: 'maelstrom',
                key: 'roll'
            },{
                namespace: 'maelstrom',
                key: 'pitch'
            },{
                namespace: 'maelstrom',
                key: 'yaw'
            },{
                namespace: 'maelstrom',
                key: 'event-index'
            },{
                namespace: 'maelstrom',
                key: 'event-time-str'
            },{
                namespace: 'maelstrom',
                key: 'ring'
            },{
                namespace: 'maelstrom',
                key: 'next-los'
            },{
                namespace: 'maelstrom',
                key: 'evr-1'
            },{
                namespace: 'maelstrom',
                key: 'evr-2'
            },{
                namespace: 'maelstrom',
                key: 'evr-3'
            },{
                namespace: 'maelstrom',
                key: 'evr-4'
            },{
                namespace: 'maelstrom',
                key: 'evr-5'
            }
        ]
    },
    'velocity': {
        type: 'maelstrom-telemetry',
        location: 'maelstrom:telemetry',
        name: 'Velocity',
        telemetry: {
            values: [{
                "key": "value",
                "name": "Velocity",
                "units": "ms",
                "format": "float",
                "source": "velocity",
                "hints": {
                    "range": 1
                }
            }, {
                "key": "utc",
                "source": "event_time",
                "name": "Time",
                "format": "utc-diy",
                "hints": {
                    "domain": 1
                }
            }
        ]}
    },
    'acceleration-ms-2': {
        type: 'maelstrom-telemetry',
        location: 'maelstrom:telemetry',
        name: 'Acceleration (ms^-2)',
        telemetry: {
            values: [{
                "key": "value",
                "name": "Acceleration",
                "units": "ms^-2",
                "format": "float",
                "source": "acceleration-ms-2",
                "hints": {
                    "range": 1
                }
            }, {
                "key": "utc",
                "source": "event_time",
                "name": "Time",
                "format": "utc-diy",
                "hints": {
                    "domain": 1
                }
            }
        ]}
    },
    'acceleration-g': {
        type: 'maelstrom-telemetry',
        location: 'maelstrom:telemetry',
        name: 'Acceleration (G)',
        telemetry: {
            values: [{
                "key": "value",
                "name": "Acceleration",
                "units": "ms^-2",
                "format": "float",
                "source": "acceleration-g",
                "hints": {
                    "range": 1
                }
            }, {
                "key": "utc",
                "source": "event_time",
                "name": "Time",
                "format": "utc-diy",
                "hints": {
                    "domain": 1
                }
            }
        ]}
    },
    'distance': {
        type: 'maelstrom-telemetry',
        location: 'maelstrom:telemetry',
        name: 'Distance (km)',
        telemetry: {
            values: [{
                "key": "value",
                "name": "Distance",
                "units": "km",
                "format": "float",
                "source": "distance-km",
                "hints": {
                    "range": 1
                }
            }, {
                "key": "utc",
                "source": "event_time",
                "name": "Time",
                "format": "utc-diy",
                "hints": {
                    "domain": 1
                }
            }
        ]}
    },
    'distance-m': {
        type: 'maelstrom-telemetry',
        location: 'maelstrom:telemetry',
        name: 'Distance (m)',
        telemetry: {
            values: [{
                "key": "value",
                "name": "Distance Meters",
                "units": "m",
                "format": "float",
                "source": "distance-m",
                "hints": {
                    "range": 1
                }
            }, {
                "key": "utc",
                "source": "event_time",
                "name": "Time",
                "format": "utc-diy",
                "hints": {
                    "domain": 1
                }
            }
            ]}
    },
    'roll': {
        type: 'maelstrom-telemetry',
        location: 'maelstrom:telemetry',
        name: 'Roll',
        telemetry: {
            values: [{
                "key": "value",
                "name": "Roll",
                "units": "degrees",
                "format": "float",
                "source": "roll",
                "hints": {
                    "range": 1
                }
            }, {
                "key": "utc",
                "source": "event_time",
                "name": "Time",
                "format": "utc-diy",
                "hints": {
                    "domain": 1
                }
            }
        ]}
    },
    'pitch': {
        type: 'maelstrom-telemetry',
        location: 'maelstrom:telemetry',
        name: 'Pitch',
        telemetry: {
            values: [{
                "key": "value",
                "name": "Pitch",
                "units": "degrees",
                "format": "float",
                "source": "pitch",
                "hints": {
                    "range": 1
                }
            }, {
                "key": "utc",
                "source": "event_time",
                "name": "Time",
                "format": "utc-diy",
                "hints": {
                    "domain": 1
                }
            }
        ]}
    },
    'yaw': {
        type: 'maelstrom-telemetry',
        location: 'maelstrom:telemetry',
        name: 'Yaw',
        telemetry: {
            values: [{
                "key": "value",
                "name": "Yaw",
                "units": "degrees",
                "format": "float",
                "source": "yaw",
                "hints": {
                    "range": 1
                }
            }, {
                "key": "utc",
                "source": "event_time",
                "name": "Time",
                "format": "utc-diy",
                "hints": {
                    "domain": 1
                }
            }
        ]}
    },
    'event-index': {
        type: 'maelstrom-telemetry',
        location: 'maelstrom:telemetry',
        name: 'Event Index',
        telemetry: {
            values: [{
                "key": "value",
                "name": "Event Index",
                "units": "i",
                "format": "float",
                "source": "event-index",
                "hints": {
                    "range": 1
                }
            }, {
                "key": "utc",
                "source": "event_time",
                "name": "Time",
                "format": "utc-diy",
                "hints": {
                    "domain": 1
                }
            }
        ]}
    },
    'event-time-str': {
        type: 'maelstrom-telemetry',
        location: 'maelstrom:telemetry',
        name: 'Event Time Str',
        telemetry: {
            values: [{
                "key": "value",
                "name": "Event Time Str",
                "units": "",
                "format": "string",
                "source": "event-time-str",
                "hints": {
                    "range": 1
                }
            }, {
                "key": "utc",
                "source": "event_time",
                "name": "Time",
                "format": "utc-diy",
                "hints": {
                    "domain": 1
                }
            }
        ]}
    },
    'ring': {
        type: 'maelstrom-telemetry',
        location: 'maelstrom:telemetry',
        name: 'Ring',
        telemetry: {
            values: [{
                "key": "value",
                "name": "Ring",
                "units": "",
                "format": "int",
                "source": "ring",
                "hints": {
                    "range": 24
                }
            }, {
                "key": "utc",
                "source": "event_time",
                "name": "Time",
                "format": "utc-diy",
                "hints": {
                    "domain": 1
                }
            }
        ]}
    },
    'next-los': {
        type: 'maelstrom-telemetry',
        location: 'maelstrom:telemetry',
        name: 'Next LOS',
        telemetry: {
            values: [{
                "key": "value",
                "name": "Next LOS",
                "units": "",
                "format": "string",
                "source": "next-los",
                "hints": {
                    "range": 1
                }
            }, {
                "key": "utc",
                "source": "event_time",
                "name": "Time",
                "format": "utc-diy",
                "hints": {
                    "domain": 1
                }
            }
        ]}
    },
    'evr-1': {
        type: 'maelstrom-telemetry',
        location: 'maelstrom:telemetry',
        name: 'EVR 1',
        telemetry: {
            values: [{
                "key": "value",
                "name": "EVR-1",
                "units": "",
                "format": "string",
                "source": "evr-1",
                "hints": {
                    "range": 1
                }
            }, {
                "key": "utc",
                "source": "event_time",
                "name": "Time",
                "format": "utc-diy",
                "hints": {
                    "domain": 1
                }
            }
        ]}
    },
    'evr-2': {
        type: 'maelstrom-telemetry',
        location: 'maelstrom:telemetry',
        name: 'EVR 2',
        telemetry: {
            values: [{
                "key": "value",
                "name": "EVR-2",
                "units": "",
                "format": "string",
                "source": "evr-2",
                "hints": {
                    "range": 1
                }
            }, {
                "key": "utc",
                "source": "event_time",
                "name": "Time",
                "format": "utc-diy",
                "hints": {
                    "domain": 1
                }
            }
        ]}
    },
    'evr-3': {
        type: 'maelstrom-telemetry',
        location: 'maelstrom:telemetry',
        name: 'EVR 3',
        telemetry: {
            values: [{
                "key": "value",
                "name": "EVR-3",
                "units": "",
                "format": "string",
                "source": "evr-3",
                "hints": {
                    "range": 1
                }
            }, {
                "key": "utc",
                "source": "event_time",
                "name": "Time",
                "format": "utc-diy",
                "hints": {
                    "domain": 1
                }
            }
        ]}
    },
    'evr-4': {
        type: 'maelstrom-telemetry',
        location: 'maelstrom:telemetry',
        name: 'EVR 4',
        telemetry: {
            values: [{
                "key": "value",
                "name": "EVR-4",
                "units": "",
                "format": "string",
                "source": "evr-4",
                "hints": {
                    "range": 1
                }
            }, {
                "key": "utc",
                "source": "event_time",
                "name": "Time",
                "format": "utc-diy",
                "hints": {
                    "domain": 1
                }
            }
        ]}
    },
    'evr-5': {
        type: 'maelstrom-telemetry',
        location: 'maelstrom:telemetry',
        name: 'EVR 5',
        telemetry: {
            values: [{
                "key": "value",
                "name": "EVR-5",
                "units": "",
                "format": "string",
                "source": "evr-5",
                "hints": {
                    "range": 1
                }
            }, {
                "key": "utc",
                "source": "event_time",
                "name": "Time",
                "format": "utc-diy",
                "hints": {
                    "domain": 1
                }
            }
        ]}
    }
}