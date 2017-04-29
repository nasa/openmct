
define(
    ['moment'],
    function (moment) {

        var ROW_HEIGHT = 16,
            SLIDER_HEIGHT = 10,
            INITIAL_COLUMN_WIDTH = 225,
            MAX_COLUMN_WIDTH = 525,
            COLUMN_WIDTH_STEP = 25,
            DEBOUNCE_INTERVAL = 100,
            DATE_FORMAT = "YYYY-DDD HH:mm:ss.SSS\\Z",
            NOT_UPDATED = "No updates",
            EMPTY_ARRAY = [];

        /**
         * Responsible for supporting the autoflow tabular view.
         * Implements the all-over logic which drives that view,
         * mediating between template-provided areas, the included
         * `mct-autoflow-table` directive, and the underlying
         * domain object model.
         * @constructor
         */
        function AutflowTabularController(
            $scope,
            $timeout,
            telemetrySubscriber
        ) {
            var filterValue = "",
                filterValueLowercase = "",
                subscription,
                filteredObjects = [],
                lastUpdated = {},
                updateText = NOT_UPDATED,
                rangeValues = {},
                classes = {},
                limits = {},
                updatePending = false,
                lastBounce = Number.NEGATIVE_INFINITY,
                columnWidth = INITIAL_COLUMN_WIDTH,
                rows = 1,
                counter = 0;

            // Trigger an update of the displayed table by incrementing
            // the counter that it watches.
            function triggerDisplayUpdate() {
                counter += 1;
            }

            // Check whether or not an object's name matches the
            // user-entered filter value.
            function filterObject(domainObject) {
                return (domainObject.getModel().name || "")
                    .toLowerCase()
                    .indexOf(filterValueLowercase) !== -1;
            }

            // Comparator for sorting points back into packet order
            function compareObject(objectA, objectB) {
                var indexA = objectA.getModel().index || 0,
                    indexB = objectB.getModel().index || 0;
                return indexA - indexB;
            }

            // Update the list of currently-displayed objects; these
            // will be the subset of currently subscribed-to objects
            // which match a user-entered filter.
            function doUpdateFilteredObjects() {
                // Generate the list
                filteredObjects = (
                    subscription ?
                            subscription.getTelemetryObjects() :
                            []
                ).filter(filterObject).sort(compareObject);

                // Clear the pending flag
                updatePending = false;

                // Track when this occurred, so that we can wait
                // a whole before updating again.
                lastBounce = Date.now();

                triggerDisplayUpdate();
            }

            // Request an update to the list of current objects; this may
            // run on a timeout to avoid excessive calls, e.g. while the user
            // is typing a filter.
            function updateFilteredObjects() {
                // Don't do anything if an update is already scheduled
                if (!updatePending) {
                    if (Date.now() > lastBounce + DEBOUNCE_INTERVAL) {
                        // Update immediately if it's been long enough
                        doUpdateFilteredObjects();
                    } else {
                        // Otherwise, update later, and track that we have
                        // an update pending so that subsequent calls can
                        // be ignored.
                        updatePending = true;
                        $timeout(doUpdateFilteredObjects, DEBOUNCE_INTERVAL);
                    }
                }
            }

            // Track the latest data values for this domain object
            function recordData(telemetryObject) {
                // Get latest domain/range values for this object.
                var id = telemetryObject.getId(),
                    domainValue = subscription.getDomainValue(telemetryObject),
                    rangeValue = subscription.getRangeValue(telemetryObject);

                // Track the most recent timestamp change observed...
                if (domainValue !== undefined && domainValue !== lastUpdated[id]) {
                    lastUpdated[id] = domainValue;
                    // ... and update the displayable text for that timestamp
                    updateText = isNaN(domainValue) ? "" :
                            moment.utc(domainValue).format(DATE_FORMAT);
                }

                // Store data values into the rangeValues structure, which
                // will be used to populate the table itself.
                // Note that we want full precision here.
                rangeValues[id] = rangeValue;

                // Update limit states as well
                classes[id] = limits[id] && (limits[id].evaluate({
                    // This relies on external knowledge that the
                    // range value of a telemetry point is encoded
                    // in its datum as "value."
                    value: rangeValue
                }) || {}).cssClass;
            }


            // Look at telemetry objects from the subscription; this is watched
            // to detect changes from the subscription.
            function subscribedTelemetry() {
                return subscription ?
                        subscription.getTelemetryObjects() : EMPTY_ARRAY;
            }

            // Update the data values which will be used to populate the table
            function updateValues() {
                subscribedTelemetry().forEach(recordData);
                triggerDisplayUpdate();
            }

            // Getter-setter function for user-entered filter text.
            function filter(value) {
                // If value was specified, we're a setter
                if (value !== undefined) {
                    // Store the new value
                    filterValue = value;
                    filterValueLowercase = value.toLowerCase();
                    // Change which objects appear in the table
                    updateFilteredObjects();
                }

                // Always act as a getter
                return filterValue;
            }

            // Update the bounds (width and height) of this view;
            // called from the mct-resize directive. Recalculates how
            // many rows should appear in the contained table.
            function setBounds(bounds) {
                var availableSpace = bounds.height - SLIDER_HEIGHT;
                rows = Math.max(1, Math.floor(availableSpace / ROW_HEIGHT));
            }

            // Increment the current column width, up to the defined maximum.
            // When the max is hit, roll back to the default.
            function increaseColumnWidth() {
                columnWidth += COLUMN_WIDTH_STEP;
                // Cycle down to the initial width instead of exceeding max
                columnWidth = columnWidth > MAX_COLUMN_WIDTH ?
                        INITIAL_COLUMN_WIDTH : columnWidth;
            }

            // Get displayable text for last-updated value
            function updated() {
                return updateText;
            }

            // Unsubscribe, if a subscription is active.
            function releaseSubscription() {
                if (subscription) {
                    subscription.unsubscribe();
                    subscription = undefined;
                }
            }

            // Update set of telemetry objects managed by this view
            function updateTelemetryObjects(telemetryObjects) {
                updateFilteredObjects();
                limits = {};
                telemetryObjects.forEach(function (telemetryObject) {
                    var id = telemetryObject.getId();
                    limits[id] = telemetryObject.getCapability('limit');
                });
            }

            // Create a subscription for the represented domain object.
            // This will resolve capability delegation as necessary.
            function makeSubscription(domainObject) {
                // Unsubscribe, if there is an existing subscription
                releaseSubscription();

                // Clear updated timestamp
                lastUpdated = {};
                updateText = NOT_UPDATED;

                // Create a new subscription; telemetrySubscriber gets
                // to do the meaningful work here.
                subscription = domainObject && telemetrySubscriber.subscribe(
                    domainObject,
                    updateValues
                );

                // Our set of in-view telemetry objects may have changed,
                // so update the set that is being passed down to the table.
                updateFilteredObjects();
            }

            // Watch for changes to the set of objects which have telemetry
            $scope.$watch(subscribedTelemetry, updateTelemetryObjects);

            // Watch for the represented domainObject (this field will
            // be populated by mct-representation)
            $scope.$watch("domainObject", makeSubscription);

            // Make sure we unsubscribe when this view is destroyed.
            $scope.$on("$destroy", releaseSubscription);

            return {
                /**
                 * Get the number of rows which should be shown in this table.
                 * @return {number} the number of rows to show
                 */
                getRows: function () {
                    return rows;
                },
                /**
                 * Get the objects which should currently be displayed in
                 * this table. This will be watched, so the return value
                 * should be stable when this list is unchanging. Only
                 * objects which match the user-entered filter value should
                 * be returned here.
                 * @return {DomainObject[]} the domain objects to include in
                 *         this table.
                 */
                getTelemetryObjects: function () {
                    return filteredObjects;
                },
                /**
                 * Set the bounds (width/height) of this autoflow tabular view.
                 * The template must ensure that these bounds are tracked on
                 * the table area only.
                 * @param bounds the bounds; and object with `width` and
                 *        `height` properties, both as numbers, in pixels.
                 */
                setBounds: setBounds,
                /**
                 * Increments the width of the autoflow column.
                 * Setting does not yet persist.
                 */
                increaseColumnWidth: increaseColumnWidth,
                /**
                 * Get-or-set the user-supplied filter value.
                 * @param {string} [value] the new filter value; omit to use
                 *        as a getter
                 * @returns {string} the user-supplied filter value
                 */
                filter: filter,
                /**
                 * Get all range values for use in this table. These will be
                 * returned as an object of key-value pairs, where keys are
                 * domain object IDs, and values are the most recently observed
                 * data values associated with those objects, formatted for
                 * display.
                 * @returns {object.<string,string>} most recent values
                 */
                rangeValues: function () {
                    return rangeValues;
                },
                /**
                 * Get CSS classes to apply to specific rows, representing limit
                 * states and/or stale states. These are returned as key-value
                 * pairs where keys are domain object IDs, and values are CSS
                 * classes to display for domain objects with those IDs.
                 * @returns {object.<string,string>} CSS classes
                 */
                classes: function () {
                    return classes;
                },
                /**
                 * Get the "last updated" text for this view; this will be
                 * the most recent timestamp observed for any telemetry-
                 * providing object, formatted for display.
                 * @returns {string} the time of the most recent update
                 */
                updated: updated,
                /**
                 * Get the current column width, in pixels.
                 * @returns {number} column width
                 */
                columnWidth: function () {
                    return columnWidth;
                },
                /**
                 * Keep a counter and increment this whenever the display
                 * should be updated; this will be watched by the
                 * `mct-autoflow-table`.
                 * @returns {number} a counter value
                 */
                counter: function () {
                    return counter;
                }
            };
        }

        return AutflowTabularController;
    }
);
