var itemCreate = require("../common/CreateItem");
var itemEdit = require("../common/EditItem");

describe('Create Web Page', function() {
    var createClass = new itemCreate();
    var editItemClass = new itemEdit();
    var ITEM_NAME = "Activity Mode";
    var ITEM_TYPE = "activity-mode";
    var ITEM_MENU_GLYPH = 'A\nActivity Mode';
    var ITEM_GRID_SELECT = 'P\nA\nActivity Mode';
    beforeEach(require('../common/Launch'));
    it('should Create new Activity Mode', function(){
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
            createClass.fillFolderForum(ITEM_NAME,ITEM_TYPE).click();
            browser.sleep(1000);

        }).then(function (){
            var item = editItemClass.SelectItem(ITEM_GRID_SELECT);
            expect(item.count()).toBe(1);
            browser.sleep(1000);
        });

    });

});
