define([
    "./src/ExampleStyleGuideModelProvider",
    "./src/MCTExample",
    'legacyRegistry'
], function (
    ExampleStyleGuideModelProvider,
    MCTExample,
    legacyRegistry
) {
    legacyRegistry.register("example/styleguide", {
        "name": "Open MCT Style Guide",
        "description": "Examples and documentation illustrating UI styles in use in Open MCT.",
        "extensions":
        {
            "types": [
                { "key": "styleguide.intro", "name": "Introduction", "cssclass": "icon-page", "description": "Introduction and overview to the style guide" },
                { "key": "styleguide.controls", "name": "Controls", "cssclass": "icon-page", "description": "Buttons, selects, menus, etc." },
                { "key": "styleguide.input", "name": "Text Inputs", "cssclass": "icon-page", "description": "Various text inputs" },
                { "key": "styleguide.glyphs", "name": "Glyphs", "cssclass": "icon-page", "description": "Glyphs overview" }
            ],
            "views": [
                { "key": "styleguide.intro", "type": "styleguide.intro", "name": "Introduction", "cssclass": "icon-page", "templateUrl": "templates/intro.html", "editable": false },
                { "key": "styleguide.controls", "type": "styleguide.controls", "name": "Controls", "cssclass": "icon-page", "templateUrl": "templates/controls.html", "editable": false },
                { "key": "styleguide.input", "type": "styleguide.input", "name": "Text Inputs", "cssclass": "icon-page", "templateUrl": "templates/input.html", "editable": false },
                { "key": "styleguide.glyphs", "type": "styleguide.glyphs", "name": "Glyphs", "cssclass": "icon-page", "templateUrl": "templates/glyphs.html", "editable": false }
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
                        "location": "ROOT",
                        "composition": [
                            "intro",
                            "controls",
                            "input",
                            "glyphs"
                        ]
                    }
                }
            ],
            "directives": [
                {
                    "key": "mctExample",
                    "implementation": MCTExample
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
                    "stylesheetUrl": "css/style-guide-espresso.css",
                    "theme": "espresso"
                },
                {
                    "stylesheetUrl": "css/style-guide-snow.css",
                    "theme": "snow"
                }
            ]
        }
    });
});
