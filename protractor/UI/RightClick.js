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
var right_click = require("../common/RightMenu.js");
var Create = require("../common/CreateItem")
var itemEdit = require("../common/EditItem");

describe('The Right Menu', function() {
    var clickClass = new right_click();
    var createClass = new Create();
    var editItemClass = new itemEdit();
    var ITEM_NAME = "Folder";
    var ITEM_TYPE = "folder";
    var ITEM_MENU_GLYPH = 'F\nFolder';
    var ITEM_GRID_SELECT = 'P\nF\nFolder\n0 Items';

    beforeEach(require('../common/Launch'));

    it('should Dissapear After Delete', function(){
        browser.wait(function() {
           createClass.createButton().click();
           return true;
        }).then(function (){
            var folder =  createClass.selectNewItem(ITEM_TYPE);
            expect(folder.getText()).toEqual([ ITEM_MENU_GLYPH ]);
            browser.sleep(1000);
            folder.click()
        }).then(function() {
            browser.wait(function () {
                return element.all(by.model('ngModel[field]')).isDisplayed();
            })
            createClass.fillFolderForum(ITEM_NAME, ITEM_TYPE).click();
            browser.sleep(1000);
        }).then(function (){
            var item = editItemClass.SelectItem(ITEM_GRID_SELECT);
            expect(item.count()).toBe(1);
            browser.sleep(1000);
        }).then(function () {
            var MyItem =  ">\nF\nMy Items"
            element.all(by.repeater('child in composition')).filter(function (ele){
                return ele.getText().then(function(text) {
                    return text === MyItem;
                });
            }).all(by.css('.ui-symbol.view-control.ng-binding.ng-scope')).click();
            var object = element.all(by.repeater('child in composition')).filter(function (ele){
                return ele.getText().then(function(text) {
                    return text === ">\nF\nFolder";
                });
            });
            browser.sleep(1000)
            browser.actions().mouseMove(object.get(0)).perform();
            browser.actions().click(protractor.Button.RIGHT).perform();
            browser.sleep(1000)
            var menu = element.all(by.css('.ng-binding')).filter(function (ele){
                return ele.getText().then(function (text) {
                    return text == "Z\nRemove";
               })
            })
            menu.click();
            browser.sleep(1000)
            
            expect(menu.isDisplayed()).toBe(false);
        })
    });

});
