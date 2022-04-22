// 1. create an gauge plugin
// 2. create with custom settings
// 3. verify required fields are required
// 4. should not be able to create gaugue inside a gauge.
// 5. should not be able to move/duplicate gaugue inside a gauge.
// 6. delete gauge
// 7. snapshot gauge
// 8. snapshot gauge inside Notebook entry
// 9. gauge inside Notebook entry
// 10. can drop inside other objects:
//     can drop to display layout : yes
//     can drop to Flexible layout : yes
//     can drop to Folder : yes
//     can drop to Bar graph: No
//     can drop to clock: No
//     . can drop to condition set: No
//     . can drop to condition widegt: No
//     // .............all other objects
//     . can drop to webpage: No
// 11. drop telemetry inside a gauge and reflect on data in both fixed and realtime
// 12. can have only one telemetry per gague. (show confirmation dialog if want to replace)
// 12. all form props (except hidefromInspector) shows inside inspector
// 13. should be able to export and import
// 14. able to search in tree
// 15. supports fix and realtime mode
// 17. refresh after creating
// 18. open in new tab
// 19. two separate gauges inside display layout should not show same numbers unless have same telemetry (should show respctive telemetry data).
// 20. inside display layout compare gague values vs its telemetry value (should be same in fixed time and should tick with same rate/value in realtime)
// 21. same for two diff gauges- > inside display layout compare gague values vs its telemetry value (should be same in fixed time and should tick with same rate/value in realtime)
// 22. export jpeg/png of plugin
