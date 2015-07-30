var itemCreate = require("../common/CreateItem");
var itemEdit = require("../common/EditItem");

describe('Create Web Page', function() {
    var createClass = new itemCreate();
    var editItemClass = new itemEdit();
    var ITEM_NAME = "Webpage";
    var ITEM_TYPE = "webpage";
    var ITEM_MENU_GLYPH = 'ê\nWeb Page';
    var ITEM_GRID_SELECT = 'P\nê\nWebpage';

    beforeEach(require('../common/Launch'));

    it('should Create new Web Page', function(){
        //button.click()
        browser.wait(function() {
           createClass.createButton().click();
           return true;
        }).then(function (){
            var folder =  createClass.selectNewItem('webpage')
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
