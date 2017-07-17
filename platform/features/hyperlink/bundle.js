define([
    './src/HyperlinkController',
    'legacyRegistry'
], function (
    HyperlinkController,
    legacyRegistry
) {
    legacyRegistry.register("platform/features/hyperlink", {
    "name": "Hyperlink",
    "description": "Insert a hyperlink to reference a link",
    "extensions": {
        "types": [
            {
                "key": "example.hyperlink",
                "name": "Hyperlink",
                "templateUrl": "templates/hyperlink.html",
                "cssClass": "icon-page",
                "description": "A hyperlink to redirect to a different link",
                "features": ["creation"],
                "properties": [
                  {
                    "key": "url",
                    "name": "URL",
                    "control": "textfield",
                    "pattern": "^(ftp|https?)\\:\\/\\/",
                    "required": true,
                    "cssClass": "l-input-lg"
                  },
                  {
                    "key": "displayText",
                    "name": "Text to Display",
                    "control": "textfield",
                    "required": true,
                    "cssClass": "l-input-lg"
                  },
                  {
                    "key": "showTitle",
                    "value": "false",
                  },{
                      "key": "displayFormat",
                      "name": "Display Format",
                      "control": "composite",
                      "items": [
                          {
                              "control": "select",
                              "options": [
                                  {
                                    "name": "Link",
                                    "value":"link"
                                  },
                                  {
                                      "value":"button",
                                      "name": "Button"
                                  }
                              ],
                              "cssClass": "l-inline"
                          }
                      ]
                  },
                  {
                      "key": "openNewTab",
                      "name": "Tab to Open Hyperlink",
                      "control": "composite",
                      "items": [
                          {
                              "control": "select",
                              "options": [
                                  {
                                    "name": "Open in this tab",
                                    "value":"thisTab"
                                  },
                                  {
                                      "value":"newTab",
                                      "name": "Open in a new tab"
                                  }
                              ],
                              "cssClass": "l-inline"
                          }
                      ]
                  }
                ],
                "model": {
                    "displayFormat": ["link"],
                    "openNewTab": ["thisTab"],
                    "showTitle":["false"]
                }

              }
        ],
        "views": [
            {
                "key": "example.hyperlink",
                "type": "example.hyperlink",
                "cssClass": "icon-check",
                "name": "List",
                "templateUrl": "templates/hyperlink.html",
                "editable": false
            }
        ],
        "controllers": [
            {
                "key": "HyperlinkController",
                "implementation": HyperlinkController,
                "depends": ["$scope"]
            }
        ],
    }
    });
});
