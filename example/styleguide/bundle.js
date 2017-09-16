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
                { "key": "styleguide.intro", "name": "Introduction", "cssClass": "icon-page", "description": "Introduction and overview to the style guide" },
                { "key": "styleguide.standards", "name": "Standards", "cssClass": "icon-page", "description": "" },
                { "key": "styleguide.colors", "name": "Colors", "cssClass": "icon-page", "description": "" },
                { "key": "styleguide.status", "name": "status", "cssClass": "icon-page", "description": "Limits, telemetry paused, etc." },
                { "key": "styleguide.glyphs", "name": "Glyphs", "cssClass": "icon-page", "description": "Glyphs overview" },
                { "key": "styleguide.controls", "name": "Controls", "cssClass": "icon-page", "description": "Buttons, selects, HTML controls" },
                { "key": "styleguide.input", "name": "Text Inputs", "cssClass": "icon-page", "description": "Various text inputs" },
                { "key": "styleguide.menus", "name": "Menus", "cssClass": "icon-page", "description": "Context menus, dropdowns" }
            ],
            "views": [
                { "key": "styleguide.intro", "type": "styleguide.intro", "templateUrl": "templates/intro.html", "editable": false },
                { "key": "styleguide.standards", "type": "styleguide.standards", "templateUrl": "templates/standards.html", "editable": false },
                { "key": "styleguide.colors", "type": "styleguide.colors", "templateUrl": "templates/colors.html", "editable": false },
                { "key": "styleguide.status", "type": "styleguide.status", "templateUrl": "templates/status.html", "editable": false },
                { "key": "styleguide.glyphs", "type": "styleguide.glyphs", "templateUrl": "templates/glyphs.html", "editable": false },
                { "key": "styleguide.controls", "type": "styleguide.controls", "templateUrl": "templates/controls.html", "editable": false },
                { "key": "styleguide.input", "type": "styleguide.input", "templateUrl": "templates/input.html", "editable": false },
                { "key": "styleguide.menus", "type": "styleguide.menus", "templateUrl": "templates/menus.html", "editable": false }
            ],
            "roots": [
                {
                    "id": "styleguide:home"
                }
            ],
            "models": [
                {
                    "id": "styleguide:home",
                    "priority" : "preferred",
                    "model": {
                        "type": "folder",
                        "name": "Style Guide Home",
                        "location": "ROOT",
                        "composition": [
                            "intro",
                            "standards",
                            "colors",
                            "status",
                            "glyphs",
                            "styleguide:ui-elements"
                        ]
                    }
                },
                {
                    "id": "styleguide:ui-elements",
                    "priority" : "preferred",
                    "model": {
                        "type": "folder",
                        "name": "UI Elements",
                        "location": "styleguide:home",
                        "composition": [
                            "controls",
                            "input",
                            "menus"
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
