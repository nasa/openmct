* Working on pre-processing telemetry data to pre-merge values based on column keys. I changed from using metadata and doing it manually to placing a method on TableColumn and for some reason the processing time blew up from ~10ms to ~25ms. Need to investigate why. Just the cost of calling functions?


* On filtering, if the new filter string starts with the old filter string, filter based on the list of previously filtered results, not the base list.
* For sizing row, size once based on first result, plus some padding, then elipses. Will support custom column sizing soon.
* Don't forget the default sort behavior, and sticking to the bottom for realtime numerical
* Need to merge time columns


To ask Jay
* Move the presentation by Charles and I
* Open source renewal 
    - Change the language to remove references to OSGI etc.
    - A new functional description that includes newer features
    - Open source server?
    - Third party licenses
    - List of innovators
* Even's visit