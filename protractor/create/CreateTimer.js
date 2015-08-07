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
var rightClick = require("../common/RightMenu");

describe('Create Timer', function() {
    var createClass = new itemCreate();
    var editItemClass = new itemEdit();
    var rightMenu = new rightClick();

    var ITEM_NAME = "Timer";
    var ITEM_TYPE = "timer";
    var ITEM_MENU_GLYPH = 'õ\nTimer';
    var ITEM_GRID_SELECT = 'P\nõ\nTimer';

    beforeEach(require('../common/Launch'));

    it('should Create Timer', function(){
        //button.click()
        browser.wait(function() {
           createClass.createButton().click();
           return true;
        }).then(function (){
            var folder =  createClass.selectNewItem(ITEM_TYPE)
            expect(folder.getText()).toEqual([ ITEM_MENU_GLYPH ]);
            browser.sleep(1000);
               folder.click()
        }).then(function() {
            browser.wait(function () {
                return element.all(by.model('ngModel[field]')).isDisplayed();
            })
            createClass.fillFolderForum(ITEM_NAME, ITEM_TYPE).click();
            browser.sleep(1500);
        }).then(function (){
            var item = editItemClass.SelectItem(ITEM_GRID_SELECT);
            expect(item.count()).toBe(1);
            browser.sleep(1000);
        });
    });
    it('should test Timer', function(){
        browser.sleep(2000)
        rightMenu.reset(ITEM_MENU_GLYPH);
        browser.sleep(1000)
        var timer = element(by.css('.value.ng-binding.active'))
        timer.getText().then(function (time) {
            var timerChecker = false;
            if(time == "0D 00:00:01" || time == "0D 00:00:02"){
                timerChecker = true;
            }
            expect(timerChecker).toEqual(true)
        })
    });

});
