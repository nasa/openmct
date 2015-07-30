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
var itemCreate = require("../common/CreateItem");
var itemEdit = require("../common/EditItem");

describe('Create Timeline', function() {
    var createItemClass = new itemCreate();
    var editItemClass = new itemEdit();
    var ITEM_NAME = "Timeline";
    var ITEM_TYPE = "timeline";
    var ITEM_MENU_GLYPH = 'S\nTimeline';
    var ITEM_GRID_SELECT = 'P\nS\nTimeline\n0 Items';
    beforeEach(require('../common/Launch'));
    it('should Create Timeline', function(){
        //button.click()
        browser.wait(function() {
           createItemClass.createButton().click();
           return true;
        }).then(function (){
            var folder =  createItemClass.selectNewItem(ITEM_TYPE)
            expect(folder.getText()).toEqual([ ITEM_MENU_GLYPH ]);
            folder.click()
        }).then(function() {
            browser.wait(function () {
                return element.all(by.model('ngModel[field]')).isDisplayed();
            })
            createItemClass.fillFolderForum(ITEM_NAME, ITEM_TYPE).click();
            browser.sleep(1000);
        }).then(function (){
            var fo= element.all(by.css('.item.grid-item.ng-scope')).filter(function (arg){
                return arg.getText().then(function (text) {
                    expect(text).toEqual("fh");
                    return text == ITEM_GRID_SELECT;
                });
            });
            var item = editItemClass.SelectItem(ITEM_GRID_SELECT);
            expect(item.count()).toBe(1);

        });
    });
    it('should Create Timeline Activity', function(){
        var item = editItemClass.SelectItem(ITEM_GRID_SELECT);
        expect(item.count()).toBe(1);
        item.click();
        browser.sleep(1000);
        expect(browser.getTitle()).toEqual(ITEM_NAME);
        browser.sleep(1000);
        var edit = editItemClass.EditButton();
        expect(edit.count()).toBe(1);
        edit.click();
        browser.sleep(1000);
        editItemClass.CreateActivity();
        var ok = createItemClass.fillFolderForum("Activity", "activity");
        browser.sleep(1000);
        ok.click();
        browser.sleep(1000);
        editItemClass.saveButton();
        //save.click();
        browser.sleep(5000);
    });

});
