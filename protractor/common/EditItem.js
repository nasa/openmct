/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
var EditItem = (function () {
    function EditItem() {
    }
    //finds the Edit Button
    EditItem.prototype.SelectItem = function (item_title) {
        return element.all(by.css('.item.grid-item.ng-scope')).filter(function (arg){ 
            return arg.getText().then(function (text) {
               // expect(text).toEqual("fh");
                return text == item_title;
            });
        });
    };
    EditItem.prototype.EditButton = function () {
        return element.all(by.css('[ng-click="parameters.action.perform()"]')).filter(function (arg) {
            return arg.getAttribute("title").then(function (title){
                //expect(title).toEqual("Edit this object.");
                return title == 'Edit this object.';
            })
        });
    };
    EditItem.prototype.CreateActivity = function () {
        element.all(by.css('[ng-controller="ClickAwayController as toggle"]')).click();
        browser.sleep(1000);
        var list = element.all(by.css('[ng-repeat="option in structure.options"]')).filter(function (arg){
            return arg.getText().then(function (text){
                //expect(text).toEqual("Edit this object.");
                return text == "a\nActivity";
            });
        }).click();
    };
    EditItem.prototype.saveButton = function () {
         element.all(by.css('[ng-click="currentAction.perform()"]')).filter(function (args){
            return args.getText().then(function (text) {
                //expect(text).toEqual("Save");
                return text == "Save"; 
            });
        }).click();
    };
    function getFolderType(arg) {

    }
    return EditItem;
    
})();
module.exports = EditItem;
