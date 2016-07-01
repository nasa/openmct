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
            "stylesheets": [
                {
                    "stylesheetUrl": "css/todo.css"
                }
            ]
        }
    });
});
