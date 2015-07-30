var itemCreate = require("../common/CreateItem");
var itemEdit = require("../common/EditItem");
var rightClick = require("../common/RightMenu");
describe('Create Clock', function() {
    var createClass = new itemCreate();
    var editItemClass = new itemEdit();
    var rightClickClass = new rightClick();

    var ITEM_NAME = "Clock";
    var ITEM_TYPE = "clock";
    var ITEM_MENU_GLYPH = 'C\nClock';
    var ITEM_GRID_SELECT = 'P\nC\nClock';
    beforeEach(require('../common/Launch'));
    it('should Create new Clock', function(){
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
    it('should check clock', function () {

        function getTime() {
            function addZero(time){
                if(time < 10){
                    return '0' + time;
                }
                return time;
            }
           var currentdate = new Date();


           var month = currentdate.getMonth() + 1;
           month = addZero(month);

           var day = currentdate.getDate();
           day = addZero(day);

           var hour = currentdate.getHours() - 5;
           hour = addZero(hour);

           var second = currentdate.getSeconds();
           second = addZero(second);

           var minute = currentdate.getMinutes();
           minute = addZero(minute);

           return ("UTC " + currentdate.getFullYear()  + "/" + (month) + "/" +
                    day + " " + (hour) + ":" + minute + ":" + second + " PM");
       }

       var current,clock;
       rightClickClass.select(ITEM_MENU_GLYPH, true).click().then(function () {
           browser.sleep(1000);
           current = browser.executeScript(getTime);
       }).then(function () {
              clock = element(by.css('.l-time-display.l-digital.l-clock.s-clock.ng-scope'));
              clock.getText().then(function (time) {
                   expect(current).toEqual(time);
              })
       })

    });
});
