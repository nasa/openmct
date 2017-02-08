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
                { "key": "styleguide.standards", "name": "Standards", "cssclass": "icon-page", "description": "" },
                { "key": "styleguide.colors", "name": "Colors", "cssclass": "icon-page", "description": "" },
                { "key": "styleguide.glyphs", "name": "Glyphs", "cssclass": "icon-page", "description": "Glyphs overview" },
                { "key": "styleguide.controls", "name": "Controls", "cssclass": "icon-page", "description": "Buttons, selects, HTML controls" },
                { "key": "styleguide.input", "name": "Text Inputs", "cssclass": "icon-page", "description": "Various text inputs" },
                { "key": "styleguide.menus", "name": "Menus", "cssclass": "icon-page", "description": "Context menus, dropdowns" }
            ],
            "views": [
                { "key": "styleguide.intro", "type": "styleguide.intro", "name": "Introduction", "cssclass": "icon-page", "templateUrl": "templates/intro.html", "editable": false },
                { "key": "styleguide.standards", "type": "styleguide.standards", "name": "Standards", "cssclass": "icon-page", "templateUrl": "templates/standards.html", "editable": false },
                { "key": "styleguide.colors", "type": "styleguide.colors", "name": "Colors", "cssclass": "icon-page", "templateUrl": "templates/colors.html", "editable": false },
                { "key": "styleguide.glyphs", "type": "styleguide.glyphs", "name": "Glyphs", "cssclass": "icon-page", "templateUrl": "templates/glyphs.html", "editable": false },
                { "key": "styleguide.controls", "type": "styleguide.controls", "name": "Controls", "cssclass": "icon-page", "templateUrl": "templates/controls.html", "editable": false },
                { "key": "styleguide.input", "type": "styleguide.input", "name": "Text Inputs", "cssclass": "icon-page", "templateUrl": "templates/input.html", "editable": false },
                { "key": "styleguide.menus", "type": "styleguide.menus", "name": "Menus", "cssclass": "icon-page", "templateUrl": "templates/menus.html", "editable": false }
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
