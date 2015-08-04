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

describe('Create Sine Wave Generator', function() {
    var createClass = new itemCreate();
    var ITEM_NAME = "Sine Wave G";
    var ITEM_TYPE = "sinewave";
    var ITEM_MENU_GLYPH = 'T\nSine Wave Generator'
    beforeEach(require('../common/Launch'));
    it('should Create new Sin Wave Generator' , function(){
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
            var ok = createClass.fillFolderForum(ITEM_NAME, ITEM_TYPE);
            browser.sleep(1000);
            ok.click();
        }).then(function (){
            var checkfolder = element.all(by.css('.title.ng-binding')).filter(function (ele) {
                return ele.getTagName('div').then(function (tag){
                    return tag == 'div';
                });
            })
            expect(checkfolder.getText()).toEqual([ '', 'Sine Wave G' ]);

        });

    });

});
