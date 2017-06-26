define([
	'openmct',
	'./src/controllers/ImageryTimelineController',
	
], function (
	openmct,
	ImageryTimelineController
) {
	openmct.legacyRegistry.register("platform/features/imagery-timeline", {
		"name" : "Imagery Timeline",
		"description": "Provides a timeline view of imagery telemetry.",
		"extensions": {
			"views": [
				{
					"name": "Imagery Timeline",
					"key": "imagery.timeline",
					"cssClass": "icon-image",
					"templateUrl": "templates/timeline.html",
					"needs": [ "telemetry" ],
					"delegation": true
				}
			],
			"stylesheets": [
				{
					"stylesheetUrl": "css/timeline.css"
				}
			],
			"controllers": [
				{
					"key": "ImageryTimelineController",
                    "implementation": ImageryTimelineController,
                    "depends": ["$scope", "openmct"]
				}
			]
		}
	})

});