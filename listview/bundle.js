define([
    'openmct',
    './src/controllers/ListViewController',
    './src/directives/MCTGesture'
], function (
    openmct,
    ListViewController,
    MCTGesture
) {
    openmct.legacyRegistry.register("listview", {
        "name": "List View Plugin",
        "description": "Allows folder contents to be shown in list format",
        "extensions":
        {
          "views": [
            {
              "key": "list",
              "type": "folder",
              "name": "List",
              "cssClass": "icon-check",
              "templateUrl": "templates/listview.html"
            }
          ],
          "controllers":[
            {
              "key": "ListViewController",
              "implementation": ListViewController,
              "depends": ["$scope"]
            }
        ],
        "directives":[
            {
                "key": "mctGesture",
                "implementation" : MCTGesture,
                "depends": ["gestureService"]
            }
        ]
        }
    });
});
