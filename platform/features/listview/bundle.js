define([
    './src/controllers/ListViewController',
    './src/directives/MCTGesture',
    'text!./res/templates/listview.html',
    'legacyRegistry'
], function (
    ListViewController,
    MCTGesture,
    listViewTemplate,
    legacyRegistry
) {
    legacyRegistry.register("platform/features/listview", {
        "name": "List View Plugin",
        "description": "Allows folder contents to be shown in list format",
        "extensions":
        {
            "views": [
                {
                    "key": "list",
                    "type": "folder",
                    "name": "List",
                    "cssClass": "icon-list-view",
                    "template": listViewTemplate
                }
            ],
            "controllers": [
                {
                    "key": "ListViewController",
                    "implementation": ListViewController,
                    "depends": ["$scope"]
                }
            ],
            "directives": [
                {
                    "key": "mctGesture",
                    "implementation" : MCTGesture,
                    "depends": ["gestureService"]
                }
            ]
        }
    });
});
