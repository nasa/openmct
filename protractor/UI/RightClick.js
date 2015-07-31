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
describe('Right Click Interations', function() {
    var clickClass = new right_click();
    var createClass = new Create();
    var ITEM_NAME = "Folder";
    var ITEM_TYPE = "folder";
    var ITEM_MENU_GLYPH = 'F\nFolder';

    beforeEach(require('../common/Launch'));

    it('should delete the specified object', function(){
        createClass.createButton().click();
        var folder =  createClass.selectNewItem(ITEM_TYPE);
        expect(folder.getText()).toEqual([ ITEM_MENU_GLYPH ]);
        browser.sleep(1000);
        folder.click()
        browser.sleep(1000);
        browser.wait(function () {
            return element.all(by.model('ngModel[field]')).isDisplayed();
        })
        createClass.fillFolderForum(ITEM_NAME, ITEM_TYPE).click();
        clickClass.delete(ITEM_NAME);
        browser.sleep(1000);
    });

});
