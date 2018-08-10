* Stop Vue from decorating EVERYTHING (but especially the telemetry collection)
* Fix memory leaks
* Export
* Add loading spinner
* Need minimum width on tables. Provided by calcTableWidthPx in MCTTableController
* Add elipses for overflow on table cells
* Make sure time columns are being correctly merged
* Look at optimizing styles in telemetry-table-row
* Handle window resizing
* Look at scroll-x again. Sounded like there might be some subtlety missing there (something to do with small columns?).
* Push WIP PR

* [X] Add filtering
    * If the new filter string starts with the old filter string, filter based on the list of previously filtered results, not the base list.
    * Add the clear filter button
* [X] Cache formatted values for "just in time" formatting. I think cache on row. Opportunity to cache on column to benefit from multiple rows with the same value, but memory management becomes a problem then as cache could grow infinitely if the table is left to run.
* [X] Do some more testing with multiple objects. Not working properly right now.
* [X] Rows not being removed when object removed from composition
* [X] Subscribe to realtime data
* [X] Column widths should be done on receipt of FIRST DATA, not on receipt of historical data.
* [X] Filter subscription data

To Test
* Multiple instances of tables?
* Behavior at different widths.

Post WIP PR
* Performance
    * Don't wrap row on load, do it on scroll.
    * On batch insert, check bounds once, rather than on each insert.
* Show / hide columns (ie. table configuration)
* See if sticky headers can be simplified (eg. can we combine headers table with content table?)
* Default sort behavior, and sticking to the bottom for realtime numerical
* Look at setting top on tbody, instead of each tr
* Replace all "mct-table" classes
* Consider making the sizing row a separate component. Encapsulate all sizing logic in there.
* consider making the header table a separate component.
* Test where no time column present (what will it sort by)

* [X] Optimization - don't both sorting filtered rows initially, just copy over values from bounded row collection which have already been sorted. 