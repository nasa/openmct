define([
    "./src/ExampleStyleGuideModelProvider",
    'legacyRegistry'
], function (
    ExampleStyleGuideModelProvider,
    legacyRegistry
) {
    legacyRegistry.register("example/styleguide", {
        "name": "Open MCT Style Guide",
        "description": "Examples and documentation illustrating UI styles in use in Open MCT.",
        "extensions":
        {
            "types": [
                {
                    "key": "styleguide.intro",
                    "name": "Introduction",
                    "cssclass": "icon-page",
                    "description": "Introduction and overview to the style guide."
                },
                {
                    "key": "styleguide.controls",
                    "name": "Controls",
                    "cssclass": "icon-page",
                    "description": "Open MCT Controls"
                }
            ],
            "views": [
                {
                    "key": "styleguide.intro",
                    "type": "styleguide.intro",
                    "cssclass": "icon-page",
                    "name": "Introduction",
                    "templateUrl": "templates/intro.html",
                    "editable": false
                },
                {
                    "key": "styleguide.controls",
                    "type": "styleguide.controls",
                    "cssclass": "icon-page",
                    "name": "Controls",
                    "templateUrl": "templates/controls.html",
                    "editable": false
                }
            ],
            "roots": [
                {
                    "id": "styleguide:folder"
                }
            ],
            "models": [
                {
                    "id": "styleguide:folder",
                    "priority" : "preferred",
                    "model": {
                        "type": "folder",
                        "name": "Style Guide",
                        "composition": [
                            "intro",
                            "controls"
                        ]
                    }
                }
            ],
            "components": [
                {
                    "provides": "modelService",
                    "type": "provider",
                    "implementation": ExampleStyleGuideModelProvider,
                    "depends": [
                        "$q"
                    ]
                }
            ],
            "stylesheets": [
                {
                    "stylesheetUrl": "css/style-guide.css",
                    "priority": "mandatory"
                }
            ]
        }
    });
});