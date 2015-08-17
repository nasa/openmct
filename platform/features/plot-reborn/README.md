# plot-reborn

The `plot-reborn` bundle provides directives for composing plot based views.
It also exposes domain objects for plotting telemetry points.

## Views

* OverlayPlot: can be used on any domain object that has or delegates a 
    telemetry capability.

* StackedPlot: can be used on any domain object that delegates telemetry or 
    delegates composition of elements that have telemetry.

## Directives

* `mct-chart`: an element that takes `series`, `viewport`, and
    `rectangles` and plots the data.  Adding points to a series after it has 
    been initially plotted can be done either by recreating the series object
    or by broadcasting "series:data:add" with arguments `event`, `seriesIndex`, 
    `points`.  This will append `points` to the `series` at index `seriesIndex`.

* `mct-plot`: A directive that wraps a mct-chart and handles user interactions
    with that plot.  It emits events that a parent view can use for coordinating
    functionality:
    * emits a `user:viewport:change:start` event when the viewport begins being
        changed by a user, to allow any parent controller to prevent viewport 
        modifications while the user is interacting with the plot.
    * emits a `user:viewport:change:end` event when the user has finished
        changing the viewport.  This allows a controller on a parent scope to
        track viewport history and provide any necessary functionality
        around viewport changes, e.g. viewport history.

* `mct-overlay-plot`: A directive that takes `domainObject` and plots either a
    single series of data (in the case of a single telemetry object) or multiple
    series of data (in the case of a object which delegates telemetry).

## Controllers

NOTE: this section not accurate.  Essentially, these controllers format data for
the mct-chart directive.  They also handle live viewport updating, as well as
managing all transformations from domain objects to views.

* StackPlotController: Uses the composition capability of a StackPlot domain 
    object to retrieve SubPlots and render them with individual PlotControllers.
* PlotController: Uses either a domain object that delegates telemetry or a 
    domain object with telemetry to and feeds that data to the mct-chart 
    directive.

## TODOS:

* [ ] Re-implement history stack.
* [ ] Re-implement plot pallette.
* [ ] Re-implement stacked plot viewport synchronization (share viewport object)
* [ ] Other things?
* [ ] Handle edge cases with marquee zoom/panning.
* [ ] Tidy code.

