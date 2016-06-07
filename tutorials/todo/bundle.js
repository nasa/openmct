define([
    'legacyRegistry',
    './src/controllers/TodoController'
], function (
    legacyRegistry,
    TodoController
) {
    legacyRegistry.register("tutorials/todo", {
        "name": "To-do Plugin",
        "description": "Allows creating and editing to-do lists.",
        "extensions": {
            "types": [
                {
                    "key": "example.todo",
                    "name": "To-Do List",
                    "glyph": "2",
                    "description": "A list of things that need to be done.",
                    "features": ["creation"],
                    "model": {
                        "tasks": []
                    }
                }
            ],
            "views": [
                {
                    "key": "example.todo",
                    "type": "example.todo",
                    "glyph": "2",
                    "name": "List",
                    "templateUrl": "templates/todo.html",
                    "editable": true,
                    "toolbar": {
                        "sections": [
                            {
                                "items": [
                                    {
                                        "text": "Add Task",
                                        "glyph": "+",
                                        "method": "addTask",
                                        "control": "button"
                                    }
                                ]
                            },
                            {
                                "items": [
                                    {
                                        "glyph": "Z",
                                        "method": "removeTask",
                                        "control": "button"
                                    }
                                ]
                            }
                        ]
                    }
                }
            ],
            "controllers": [
                {
                    "key": "TodoController",
                    "implementation": TodoController,
                    "depends": [ "$scope", "dialogService" ]
                }
            ],
               "stylesheets": [
                   {
                       "stylesheetUrl": "css/todo.css"
              }
       ]
    }
});
});
