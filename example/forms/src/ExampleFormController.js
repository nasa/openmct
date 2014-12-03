/*global define*/

define(
    [],
    function () {
        "use strict";

        function ExampleFormController($scope) {
            $scope.state = {

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