/*global define*/

define(
    [],
    function () {
        "use strict";

        function ExampleFormController($scope) {
            $scope.state = {

            };

            $scope.toolbar = {
                name: "An example toolbar.",
                sections: [
                    {
                        description: "First section",
                        items: [
                            {
                                name: "X",
                                description: "X coordinate",
                                control: "textfield",
                                pattern: "^\\d+$",
                                size: 2,
                                key: "x"
                            },
                            {
                                name: "Y",
                                description: "Y coordinate",
                                control: "textfield",
                                pattern: "^\\d+$",
                                size: 2,
                                key: "y"
                            },
                            {
                                name: "W",
                                description: "Cell width",
                                control: "textfield",
                                pattern: "^\\d+$",
                                size: 2,
                                key: "w"
                            },
                            {
                                name: "H",
                                description: "Cell height",
                                control: "textfield",
                                pattern: "^\\d+$",
                                size: 2,
                                key: "h"
                            }

                        ]
                    },
                    {
                        description: "Second section",
                        items: [
                            {
                                control: "button",
                                glyph: "1",
                                description: "Button A",
                                click: function () {
                                    window.alert("A");
                                }
                            },
                            {
                                control: "button",
                                glyph: "2",
                                description: "Button B",
                                click: function () {
                                    window.alert("B");
                                }
                            },
                            {
                                control: "button",
                                glyph: "3",
                                description: "Button C",
                                disabled: true,
                                click: function () {
                                    window.alert("C");
                                }
                            }
                        ]
                    },
                    {
                        items: [
                            {
                                control: "color",
                                key: "color"
                            }
                        ]
                    }
                ]
            };

            $scope.form = {
                name: "An example form.",
                sections: [
                    {
                        name: "First section",
                        rows: [
                            {
                                name: "Check me",
                                control: "checkbox",
                                key: "checkMe"
                            },
                            {
                                name: "Enter your name",
                                required: true,
                                control: "textfield",
                                key: "yourName"
                            },
                            {
                                name: "Enter a number",
                                control: "textfield",
                                pattern: "^\\d+$",
                                key: "aNumber"
                            }
                        ]
                    },
                    {
                        name: "Second section",
                        rows: [
                            {
                                name: "Pick a date",
                                required: true,
                                description: "Enter date in form YYYY-DDD",
                                control: "datetime",
                                key: "aDate"
                            },
                            {
                                name: "Choose something",
                                control: "select",
                                options: [
                                    { name: "Hats", value: "hats" },
                                    { name: "Bats", value: "bats" },
                                    { name: "Cats", value: "cats" },
                                    { name: "Mats", value: "mats" }
                                ],
                                key: "aChoice"
                            },
                            {
                                name: "Choose something",
                                control: "select",
                                required: true,
                                options: [
                                    { name: "Hats", value: "hats" },
                                    { name: "Bats", value: "bats" },
                                    { name: "Cats", value: "cats" },
                                    { name: "Mats", value: "mats" }
                                ],
                                key: "aRequiredChoice"
                            }
                        ]
                    }
                ]
            };
        }

        return ExampleFormController;
    }
);