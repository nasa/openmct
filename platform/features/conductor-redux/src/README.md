## Notes
API is notional for now, based on use-cases identified below. Possible the 
use cases are not sufficient, so please include in comments 
any other use cases you'd like to see. 

Plan now is to start building out test suite for the use cases identified below
in order to get the API functional. Need to discuss how UI aspects of timeline will be implemented.
Propose in place refactoring of existing timeline rather than starting again.

Some caveats / open questions
* I don't understand the use case shown on page 52 of UI sketches. It shows RT/FT, with deltas, 
with inner interval unlocked. Not sure what result would be, has inner end switched to fixed?
Also example on page 55 in real-time where inner end < now. Is there a use case for this? Semantically, it's saying
show me real time, but stale data. Why would a user want this? My feeling is that if the inner 
OR outer ends are moved behind NOW in real-time mode then you drop into historical mode.
* For the API itself, have ignored question of how it's namespaced / exposed. 
Examples assume global namespace and availability from window object. 
For now API implemented as standard standard Require JS AMDs. Could attach 
to window from bundle.js. Perhaps attaching to window not best approach though...
* Have not included validation (eg. start time < end time) or any other 
business logic such as what happens when outer interval gets dragged 
within range of inner interval. Focus is on teasing out the public API 
right now. 
* Time systems are vague right now also, I don't know how they're going 
to work or whether any API has yet been specified.
* Not clear on the differences between real-time and follow-time as it 
concerns the time conductor? For now the API has an end bounds mode
of FOLLOW which automatically tracks current time, and a start time mode 
of RELATIVE. I can envision a real-time plot that is not in follow time mode, 
but not sure what implication is for time conductor itself and how it 
differs from an historical plot?
* Should the time conductor be responsible for choosing time system / domain? Currently 
it is.

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
### 1. Real time session is loaded (outside of TC) and system sets time bounds on conductor
``` javascript
function loadSession(telemetryMetadata) {
    var tc = MCT.conductor;
    tc.timeSystem(session.timeSystem());
    
    //Set start and end modes to fixed date
    tc.mode(new FixedMode());
        
    //Set both inner and outer bounds
    tc.bounds({start: session.start(), end: session.end()});
}
```

### 2. Real-time session is loaded (outside of TC), setting custom start and end deltas 
``` javascript
function loadSession(session) {
    var tc = MCT.conductor;
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
    
    tc.timeSystem(session.timeSystem());
    
    // Set mode to realtime, specifying a tick source 
    tc.mode(mode);
        
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
    plot.setBounds(conductor.bounds());
    //Also need to reset tick labels. if time system has changed.
}

```

### 7. Conductor controller needs to update bounds and mode on TC when user changes bounds
```javascript
var tc = MCT.conductor;

function dragStartHandle(finalPos){
    var bounds = tc.bounds();
    bounds.start = positionToTime(finalPos)
    tc.bounds(bounds);
}

function dragEndHandle(finalPos){
    var bounds = tc.bounds();
    bounds.end = positionToTime(finalPos);
    tc.bounds(bounds);
}

```