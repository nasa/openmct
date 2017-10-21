define([
    "openmct",
    "./src/controllers/notebookController", 
    "./src/controllers/newEntryController",
    "./src/controllers/selectSnapshotController",
    "./src/directives/MCTSnapshot",
    "./src/directives/entryDnd",
    "./src/actions/viewSnapshot",
    "./src/actions/annotateSnapshot",
    "./src/actions/removeEmbed",
    "./src/actions/createSnapshot",
    "./src/actions/removeSnapshot",
    "./src/actions/newEntryContextual",
    "./src/capabilities/notebookCapability",
    "./src/indicators/notificationIndicator"
], function (
    openmct,
    notebookController,  
    newEntryController, 
    selectSnapshotController,     
    MCTSnapshot,
    MCTEntryDnd,
    viewSnapshotAction,
    AnnotateSnapshotAction,
    removeEmbedAction,
    createSnapshotAction,
    removeSnapshotAction,
    newEntryAction,
    NotebookCapability,
    NotificationLaunchIndicator
) {
    openmct.legacyRegistry.register("example/notebook", {
        "name": "Notebook Plugin",
        "description": "Create and save timestamped notes with embedded object snapshots.",
        "extensions":
        {
        	"types":[
        	{
               "key": "notebook",
               "name": "Notebook",
               "cssClass": "icon-notebook",
               "description": "Create and save timestamped notes with embedded object snapshots.",
               "features": ["creation"],
               "model": {
                    "entries":[
                      { "createdOn": 1507512539258, 
                        "text": "Quis qui dolupti atempe non preicias qui dolorro",
                        "embeds":[]
                      },
                      { "createdOn": 1507570153599, 
                        "text": "Rehek rerspis nis dem re verae remporrunti sintis vendi comnimi ntiusapic teceseque."
                      },
                      { "createdOn": 1507595098278, 
                        "text": "Rehek rerspis nis dem re verae remporrunti sintis vendi comnimi ntiusapic teceseque."
                      }
                    ],
                    "composition":[]              
                }
           }
           ],
           "views": [
            {
                "key": "notebook.view",
                "type": "notebook",
                "cssClass": "icon-notebook",
                "name": "notebook",
                "templateUrl": "templates/notebook.html",
                "editable": false,
                "uses": [
                      "composition",
                      "action"
                  ],
                  "gestures": [
                      "drop"
                  ]
            },
        	],
        	"controllers": [
             {
                 "key": "notebookController",
                 "implementation": notebookController,                 
                 "depends": [ "$scope", 
                             "dialogService",
                             "popupService",
                             "agentService",
                             "now",
                             "actionService",
                             "$timeout",
                             "$element"
                             ]
             },
             {
                 "key": "newEntryController",
                 "implementation": newEntryController,                 
                 "depends": [ "$scope", 
                              "$rootScope"
                             ]
             },
             {
                 "key": "selectSnapshotController",
                 "implementation": selectSnapshotController,                 
                 "depends": [ "$scope", 
                              "$rootScope"
                             ]
             }
       	   ],
           "representations": [
                {
                    "key": "draggedEntry",
                    "templateUrl": "templates/entry.html"
                }
            ],
            "templates": [
                {
                    "key": "annotate-snapshot",
                    "templateUrl": "templates/annotation.html"
                },
                {
                    "key": "notificationTemplate",
                    "templateUrl": "templates/notifications.html"
                }
            ],
            "directives": [
                {
                    "key": "mctSnapshot",
                    "implementation": MCTSnapshot,
                    "depends": [
                        "$rootScope",
                        "$document",
                        "exportImageService",
                        "dialogService",
                        "notificationService"
                    ]
                },
                {
                    "key": "mctEntryDnd",
                    "implementation": MCTEntryDnd,
                    "depends": [
                        "$rootScope","$compile","dndService","typeService"
                    ]
                }
            ],
             "actions": [
                {
                    "key": "view-snapshot",
                    "implementation": viewSnapshotAction,
                    "name": "View Snapshot",
                    "description": "View the large image in a modal",
                    "category": "embed",
                    "depends":[
                      "$compile"
                    ]
                },
                {
                    "key": "annotate-snapshot",
                    "implementation": AnnotateSnapshotAction,
                    "name": "Annotate Snapshot",
                    "cssClass": "icon-pencil labeled",
                    "description": "Annotate embed's snapshot",
                    "category": "embed",
                    "depends":[
                      "dialogService",
                      "dndService",
                      "$rootScope",
                    ]
                },                
                {
                    "key": "remove-snapshot",
                    "implementation": removeSnapshotAction,
                    "name": "Remove Snapshot",
                    "cssClass": "icon-trash labeled",
                    "description": "Remove Snapshot of the embed",
                    "category": "embed",
                    "depends":[
                      "dialogService"
                    ]
                },
                {
                    "key": "create-snapshot",
                    "implementation": createSnapshotAction,
                    "name": "Create Snapshot",
                    "description": "Create a snapshot for the embed",
                    "category": "embed-no-snap",
                    "priority": "preferred",
                    "depends":[
                      "$compile"
                    ]
                },
                {
                    "key": "remove-embed",
                    "implementation": removeEmbedAction,
                    "name": "Remove...",
                    "cssClass": "icon-trash labeled",
                    "description": "Remove this embed",
                    "category": [
                        "embed",
                        "embed-no-snap"
                    ],
                    "depends":[
                      "dialogService"
                    ]
                },
                {
                    "key": "notebook-new-entry",
                    "implementation": newEntryAction,
                    "name": "New Notebook Entry",
                    "cssClass": "icon-notebook labeled",
                    "description": "Add a new entry",
                    "category": [
                        "contextual",
                         "view-control"
                    ],
                    "depends":[
                      "$compile",
                      "$rootScope",
                      "dialogService",
                      "notificationService",
                      "linkService"
                    ],
                    "priority": "preferred"
                }
            ],
            "indicators": [
                {
                    "implementation": NotificationLaunchIndicator,
                    "priority": "fallback"
                }
            ],
            "capabilities": [
                {
                    "key": "notebook",
                    "name": "Notebook Capability",
                    "description": "Provides a capability for looking for a notebook domain object",
                    "implementation": NotebookCapability,
                    "depends": [
                        "typeService",
                    ]
                }
            ],
            "controls": [
              {
                  "key": "embed-control",
                  "templateUrl": "templates/controls/embedControl.html"
              },
               {
                  "key": "snapshot-select",
                  "templateUrl":  "templates/controls/snapSelect.html"
              }
            ],
     	     "stylesheets": [
              {
                  "stylesheetUrl": "css/notebook-espresso.css",
                  "theme": "espresso"
              },
              {
                  "stylesheetUrl": "css/notebook-snow.css",
                  "theme": "snow"
              }
          ]
        }
    });
});