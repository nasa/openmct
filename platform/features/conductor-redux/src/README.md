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
1. Historical session is loaded and needs to set bounds on time conductor
2. User changes time of interest
3. Plot controller listens for change to TOI
4. Real-time object is loaded and time conductor is set up in real-time mode showing last 15 minutes of data.
5. Switch to follow time. Set inner end to now, and outer end to now + 1 hour
6. Plot controller updated on tick
7. Plot Controller updated when user changes bounds
8. Conductor controller needs to update bounds and mode on TC when user changes bounds

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
### 1. Historical session is loaded and system sets time bounds on conductor
``` javascript
function loadSession(session) {
    var tc = MCT.conductor;
    tc.timeSystem(session.metadata.timeSystem);
    
    //Set start and end modes to fixed date
    tc.startMode(tc.Modes.FIXED);
    tc.endMode(tc.Modes.FIXED);
    
    //Set both inner and outer bounds
    tc.bounds.inner.start.time(session.metadata.firstTime);
    tc.bounds.inner.end.time(session.metadata.lastTime);
    tc.bounds.outer.start.time(session.metadata.firstTime);
    tc.bounds.outer.end.time(session.metadata.lastTime);
}
```
### 2. User changes time of interest
```javascript
//Somewhere in the TimeConductorController...
function changeTOI(newTime) {
    MCT.conductor.timeOfInterest(newTime);
}
```
### 3. Plot controller listens for change to TOI
```javascript
// toi is attribute of Time Conductor object. Add a listener to the time 
// conductor to be alerted to changes in value

MCT.conductor.listen(function (conductor) {
    var toi = conductor.timeOfInterest();
    plot.setTimeOfInterest(toi);
});
```
### 4. Real-time object is loaded and time conductor is set up in real-time mode showing last 15 minutes of data.
```javascript
// Notional initialization function, perhaps in a 'runs' extension
function initializeConductor(telemetryMetadata) {
    var tc = MCT.conductor,
        FIFTEEN_MINUTES = 15 * 60 * 1000;
    tc.timeSystem(telemetryMetadata.timeSystem);
    
    //Start and end modes set separately (to support fixed start, follow 
    // time end. Follow time = RELATIVE end mode where delta value = 0) 
    tc.startMode(tc.Modes.RELATIVE);
    tc.endMode(tc.Modes.RELATIVE);
    
    // Delta defined in ms. Start time delta is relative to end time.
    tc.bounds.inner.start.delta(FIFTEEN_MINUTES);
    tc.bounds.outer.start.delta(FIFTEEN_MINUTES);
    
    // Delta defined in ms. An end time delta value is relative to 'now'. 
    // Thus, an end delta of zero is 'follow time'. May be > 0 to track 
    // time in the future.
    // Could add a convenience function to TC to make setting follow 
    // time mode a little clearer
    tc.bounds.inner.end.delta(0);
    tc.bounds.outer.end.delta(0);
}
```
### 5. Switch to follow time. Set inner end to now, and outer end to now + 1 hour

```javascript

var tc = MCT.conductor;

// Somewhere in the time conductor controller...
function setFollowTime() {
    var ONE_HOUR = 1 * 60 * 60 * 1000;
    
    tc.endMode(tc.bounds.Modes.RELATIVE);
    tc.startMode(tc.bounds.Modes.RELATIVE);
    
    //Set start deltas. Start deltas always relative to end
    tc.bounds.inner.start.delta(-ONE_HOUR);
    tc.bounds.outer.start.delta(-ONE_HOUR);
    
    //Set end deltas. End deltas always relative to `now`
    tc.bounds.inner.end.delta(0);
    tc.bounds.outer.end.delta(ONE_HOUR);
}
```

### 6. Plot Controller updated on tick
``` javascript
// Plot only really interested in inner bounds.
// Specify event type of TICK to receive tick events only.
MCT.conductor.bounds.inner.listen(function (innerBounds) {
    plotUpdater.setDomainBounds(bounds.start.time(), bounds.end.time());
}, MCT.conductor.bounds.EventTypes.TICK);
```

### 7. Plot Controller updated when user changes bounds
``` javascript
// Plot only really interested in inner bounds
// Specify event type of USER to receive user events (such as bounds 
// handles being dragged) only.
MCT.conductor.bounds.inner.listen(function(bounds) {
    plotUpdater.setDomainBounds(bounds.start.time(), bounds.end.time());
}, MCT.conductor.bounds.EventTypes.USER);
```

### 8. Conductor controller needs to update bounds and mode on TC when user changes bounds
```javascript
var tc = MCT.conductor;

function dragInnerStartHandle(finalPos){
    var startTime = positionToTime(finalPos);
    tc.bounds.inner.start.time(startTime);
}

function dragInnerEndHandle(finalPos){
    var endTime = positionToTime(finalPos);
    tc.bounds.inner.end.time(endTime);
}

function toggleFollowMode(mode){
    if (mode === 'follow') {
        // Set end mode to 'relative'. This means that times specified 
        // are relative to now.
        tc.endMode(tc.Modes.RELATIVE);
        
        // Set a delta value of zero, locking the end to now.
        // Could add a convenience function for doing this.
        tc.bounds.inner.end.delta(0);
        tc.bounds.outer.end.delta(0);
    }
}

```