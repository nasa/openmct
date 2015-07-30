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
            expect(time).toEqual("0D 00:00:01")
        })
    });

});
