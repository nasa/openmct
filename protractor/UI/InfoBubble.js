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
var fullScreenFile = require("../common/Buttons");
var createItem = require("../common/CreateItem")
var itemEdit = require("../common/EditItem");
var rightMenu = require("../common/RightMenu");
var Drag = require("../common/drag");

describe('Info Bubble', function() {
    var fullScreenClass = new fullScreenFile();
    var createClass = new createItem();
    var editItemClass = new itemEdit();
    var rightMenuClass = new rightMenu();
    var dragDrop = new Drag();

    beforeEach(require('../common/Launch'));

    it('should detect info bubble', function(){
        var myitem = (element.all(by.repeater('child in composition'))).get(0);
        browser.actions().mouseMove(myitem).perform();
        browser.sleep(4000);
        expect(element(by.css('.t-infobubble.s-infobubble.l-infobubble-wrapper')).isDisplayed()).toBe(true);
    });
});
