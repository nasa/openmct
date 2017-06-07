define([
    'openmct',
    './src/controllers/ListViewController'
], function (
    openmct,
    ListViewController
) {
    openmct.legacyRegistry.register("listview", {
        "name": "List View Plugin",
        "description": "Allows folder contents to be shown in list format",
        "extensions":
        {
          "types":[
            {
              "key": "folder.listview",
              "name": "List View",
              "cssClass": "icon-check",
              "description": "List Format for folders",
              "features": ["creation"],
              "model":{
                "tasks":[
                  {"description":"Add a type","completed": true},
                  {"description":"Add a view"}
                ]
              }
            }
          ],
          "views": [
            {
              "key": "example.todo",
              "type": "folder",
              "name": "List",
              "cssClass": "icon-check",
              "templateUrl": "templates/listview.html",
              "editable": true,
              "toolbar":{
                "sections":[
                  {
                    "items":[
                      {
                         "text": "Add Task",
                         "cssClass": "icon-plus",
                         "method": "addTask",
                         "control": "button"
                      }
                    ]
                  },
                  {
                    "items": [
                     {
                         "cssClass": "icon-trash",
                         "method": "removeTask",
                         "control": "button"
                     }
                    ]
                  }
                ]
              }
            }
          ],
          "controllers":[
            {
              "key": "ListViewController",
              "implementation": ListViewController,
              "depends": ["$scope"]
            }
          ]
        }
    });
});
