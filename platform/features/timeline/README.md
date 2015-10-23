This bundle provides the Timeline domain object type, as well
as other associated domain object types and relevant views.

# Implementation notes

## Model Properties

The properties below record properties relevant to using and
understanding timelines based on their JSON representation.
Additional common properties, such as `modified`
or `persisted` timestamps, may also be present.

### Timeline Model

A timeline's model looks like:

```
{
    "type": "timeline",
    "start": {
        "timestamp": <number> (milliseconds since epoch),
        "epoch": <string> (currently, always "SET")
    },
    "capacity": <number> (optional; battery capacity in watt-hours)
    "composition": <string[]> (array of identifiers for contained objects)
}
```

The identifiers in a timeline's `composition` field should refer to
other Timeline objects, or to Activity objects.

### Activity Model

An activity's model looks like:

```
{
    "type": "activity",
    "start": {
        "timestamp": <number> (milliseconds since epoch),
        "epoch": <string> (currently, always "SET")
    },
    "duration": {
        "timestamp": <number> (duration of this activity, in milliseconds)
        "epoch": "SET" (this is ignored)
    },
    "relationships": {
        "modes": <string[]> (array of applicable Activity Mode ids)
    },
    "link": <string> (optional; URL linking to associated external resource)
    "composition": <string[]> (array of identifiers for contained objects)
}
```

The identifiers in a timeline's `composition` field should only refer to
other Activity objects.

### Activity Mode Model

An activity mode's model looks like:

```
{
    "type": "mode",
    "resources": {
        "comms": <number> (communications utilization, in Kbps)
        "power": <number> (power utilization, in watts)
    }
}
```
