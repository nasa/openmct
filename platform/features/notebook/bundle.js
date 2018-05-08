define([
    "legacyRegistry",
    "./src/controllers/NotebookController",
    "./src/controllers/NewEntryController",
    "./src/controllers/SelectSnapshotController",
    "./src/controllers/LayoutNotebookController",
    "./src/directives/MCTSnapshot",
    "../layout/src/MCTTriggerModal",
    "./src/directives/EntryDnd",
    "./src/actions/ViewSnapshot",
    "./src/actions/AnnotateSnapshot",
    "./src/actions/RemoveEmbed",
    "./src/actions/CreateSnapshot",
    "./src/actions/RemoveSnapshot",
    "./src/actions/NewEntryContextual",
    "./src/capabilities/NotebookCapability",
    "./src/policies/CompositionPolicy",
    "./src/policies/ViewPolicy",
    "text!./res/templates/layoutNotebook.html",
    "text!./res/templates/notebook.html",
    "text!./res/templates/entry.html",
    "text!./res/templates/annotation.html",
    "text!./res/templates/notifications.html",
    "text!../layout/res/templates/frame.html",
    "text!./res/templates/controls/embedControl.html",
    "text!./res/templates/controls/snapSelect.html"
], function (
    legacyRegistry,
    NotebookController,
    NewEntryController,
    SelectSnapshotController,
    LayoutNotebookController,
    MCTSnapshot,
    MCTModalNotebook,
    MCTEntryDnd,
    ViewSnapshotAction,
    AnnotateSnapshotAction,
    RemoveEmbedAction,
    CreateSnapshotAction,
    RemoveSnapshotAction,
    newEntryAction,
    NotebookCapability,
    CompositionPolicy,
    ViewPolicy,
    layoutNotebookTemplate,
    notebookTemplate,
    entryTemplate,
    annotationTemplate,
    notificationsTemplate,
    frameTemplate,
    embedControlTemplate,
    snapSelectTemplate
) {
    legacyRegistry.register("platform/features/notebook", {
        "name": "Notebook Plugin",
        "description": "Create and save timestamped notes with embedded object snapshots.",
        "extensions":
        {
            "types": [
            {
                "key": "notebook",
                "name": "Notebook",
                "cssClass": "icon-notebook",
                "description": "Create and save timestamped notes with embedded object snapshots.",
                "features": ["creation"],
                "model": {
                      "entries": [],
                      "composition": [],
                      "entryTypes": []
                  }
            }
          ],
            "views": [
            {
                "key": "notebook.view",
                "type": "notebook",
                "cssClass": "icon-notebook",
                "name": "notebook",
                "template": notebookTemplate,
                "editable": false,
                "uses": [
                      "composition",
                      "action"
                  ],
                "gestures": [
                    "drop"
                ]
            }
          ],
            "controllers": [
             {
                 "key": "NotebookController",
                 "implementation": NotebookController,
                 "depends": ["$scope",
                             "dialogService",
                             "popupService",
                             "agentService",
                             "objectService",
                             "navigationService",
                             "now",
                             "actionService",
                             "$timeout",
                             "$element",
                             "$sce"
                             ]
             },
             {
                 "key": "NewEntryController",
                 "implementation": NewEntryController,
                 "depends": ["$scope",
                              "$rootScope"
                             ]
             },
             {
                 "key": "selectSnapshotController",
                 "implementation": SelectSnapshotController,
                 "depends": ["$scope",
                              "$rootScope"
                             ]
             },
             {
                 "key": "LayoutNotebookController",
                 "implementation": LayoutNotebookController,
                 "depends": ["$scope"]
             }
           ],
            "representations": [
                {
                    "key": "draggedEntry",
                    "template": entryTemplate
                },
                {
                    "key": "frameLayoutNotebook",
                    "template": frameTemplate
                }
            ],
            "templates": [
                {
                    "key": "annotate-snapshot",
                    "template": annotationTemplate
                },
                {
                    "key": "notificationTemplate",
                    "template": notificationsTemplate
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
                        "$rootScope",
                        "$compile",
                        "dndService",
                        "typeService",
                        "notificationService"
                    ]
                },
                 {
                    "key": "mctModalNotebook",
                    "implementation": MCTModalNotebook,
                    "depends": [
                        "$document"
                    ]
                }
            ],
            "actions": [
                {
                    "key": "view-snapshot",
                    "implementation": ViewSnapshotAction,
                    "name": "View Snapshot",
                    "description": "View the large image in a modal",
                    "category": "embed",
                    "depends": [
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
                    "depends": [
                      "dialogService",
                      "dndService",
                      "$rootScope"
                    ]
                },

                {
                    "key": "remove-embed",
                    "implementation": RemoveEmbedAction,
                    "name": "Remove...",
                    "cssClass": "icon-trash labeled",
                    "description": "Remove this embed",
                    "category": [
                        "embed",
                        "embed-no-snap"
                    ],
                    "depends": [
                      "dialogService"
                    ]
                },
                {
                    "key": "remove-snapshot",
                    "implementation": RemoveSnapshotAction,
                    "name": "Remove Snapshot",
                    "cssClass": "icon-trash labeled",
                    "description": "Remove Snapshot of the embed",
                    "category": "embed",
                    "depends": [
                      "dialogService"
                    ]
                },
                {
                    "key": "notebook-new-entry",
                    "implementation": newEntryAction,
                    "name": "New Notebook Entry",
                    "cssClass": "icon-notebook labeled",
                    "description": "Add a new Notebook entry",
                    "category": [
                        "contextual",
                         "view-control"
                    ],
                    "depends": [
                      "$compile",
                      "$rootScope",
                      "dialogService",
                      "notificationService",
                      "linkService"
                    ],
                    "priority": "preferred"
                }
            ],
            "licenses": [
                {
                    "name": "painterro",
                    "version": "4.1.0",
                    "author": "Mike Bostock",
                    "description": "D3 (or D3.js) is a JavaScript library for visualizing data using web standards. D3 helps you bring data to life using SVG, Canvas and HTML. D3 combines powerful visualization and interaction techniques with a data-driven approach to DOM manipulation, giving you the full capabilities of modern browsers and the freedom to design the right visual interface for your data.",
                    "website": "https://d3js.org/",
                    "copyright": "Copyright 2010-2016 Mike Bostock",
                    "license": "BSD-3-Clause",
                    "link": "https://github.com/d3/d3/blob/master/LICENSE"
                }
            ],
            "capabilities": [
                {
                    "key": "notebook",
                    "name": "Notebook Capability",
                    "description": "Provides a capability for looking for a notebook domain object",
                    "implementation": NotebookCapability,
                    "depends": [
                        "typeService"
                    ]
                }
            ],
            "policies": [
                {
                    "category": "composition",
                    "implementation": CompositionPolicy,
                    "message": "Objects of this type cannot contain objects of that type."
                }
            ],
            "controls": [
              {
                  "key": "embed-control",
                  "template": embedControlTemplate
              },
               {
                  "key": "snapshot-select",
                  "template":  snapSelectTemplate
              }
            ],
            "stylesheets": [
                {
                    "stylesheetUrl": "css/notebook.css"
                },
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
