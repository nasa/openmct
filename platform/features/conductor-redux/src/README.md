## Use Cases
1. Historical session is loaded and system sets time bounds on conductor
2. Real-time session is loaded, setting custom start and end deltas 
3. User changes time of interest
4. Plot controller listens for change to TOI
5. Plot Controller updated on tick
6. Plot Controller updated when user changes bounds (eg to reset plot zoom)
7. Conductor controller needs to update bounds and mode on TC when user changes bounds

### Additional possible use-cases
1. Telemetry adapter wants to indicate presence of data at a particular time
2. Time conductor controller wants to paint map of data availability.

These use-cases could be features of the TimeConductor, but perhaps makes 
sense to make knowledge of data availability the sole preserve of telemetry 
adapters, not TimeConductor itself. Adapters will be ultimately responsible 
for providing these data so doesn't make much sense to duplicate elsewhere.
The TimeConductorController - which knows tick interval on scale (which 
TimeConductor API does not) - could simply request data availability from 
telemetry API and paint it into the Time Conductor UI

## Example implementations of use cases
### 1. Historical session is loaded (outside of TC) and system sets time bounds on conductor
``` javascript
function loadSession(telemetryMetadata) {
    MCT.conductor.timeSystem(session.timeSystem());
    
    //Set start and end modes to fixed date
    MCT.conductor.mode(new FixedMode());
        
    //Set both inner and outer bounds
    MCT.conductor.bounds({start: session.start(), end: session.end()});
}
```

### 2. Real-time session is loaded (outside of TC), setting custom start and end deltas 
``` javascript
function loadSession(session) {
    var FIFTEEN_MINUTES = 15 * 60 * 1000;
    
    // Could have a central ticking source somewhere, or connect to a 
    // remote ticking source. Should not need to be done manually with 
    // each session load. Actually not quite sure what to do with tick 
    // sources yet.
    
    var tickSource = new LocalClock();
    tickSource.attach(); // Start ticking
    
    var mode = new RealtimeMode({
        startDelta: FIFTEEN_MINUTES,
        endDelta: 0 // End delta offset is from "Now" in the time system
    });
    
    MCT.conductor.timeSystem(session.timeSystem());
    
    // Set mode to realtime, specifying a tick source 
    MCT.conductor.mode(mode);
        
    //No need to set bounds manually, will be established by mode and the deltas specified
}
```

### 3. User changes time of interest
```javascript
//Somewhere in the TimeConductorController...
function changeTOI(newTime) {
    MCT.conductor.timeOfInterest(newTime);
}
```

### 4. Plot controller listens for change to TOI
```javascript
// toi is attribute of Time Conductor object. Add a listener to the time 
// conductor to be alerted to changes in value

// Time conductor is an event emitter, listen to timeOfInterest event
MCT.conductor.on("timeOfInterest", function (timeOfInterest) {
    plot.setTimeOfInterest(timeOfInterest);
}
```

### 5. Plot Controller updated on tick
``` javascript
MCT.conductor.on("bounds", function (bounds) {
    plotUpdater.setDomainBounds(bounds.start, bounds.end);
});
```

### 6. Plot Controller updated when user changes bounds (eg to reset plot zoom)
``` javascript
MCT.conductor.on("refresh", function (conductor) {
    plotUpdater.setDomainBounds(conductor.bounds.start, conductor.bounds.end);
    //Also need to reset tick labels. if time system has changed.
}

```

### 7. Conductor controller needs to update bounds and mode on TC when user changes bounds
```javascript
function dragStartHandle(finalPos){
    var bounds = MCT.conductor.bounds();
    bounds.start = positionToTime(finalPos)
    
    //Boolean parameter forces conductor refresh, bringing views into line
    MCT.conductor.bounds(bounds, true);
}

function dragEndHandle(finalPos){
    var bounds = MCT.conductor.bounds();
    bounds.end = positionToTime(finalPos);
    
    //Boolean parameter forces conductor refresh, bringing views into line
    MCT.conductor.bounds(bounds, true);
}

```