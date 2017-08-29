define([
    'vue',
    'text!./lvt-table.html'
], function (
    Vue,
    tableTemplate
) {
    var LVTTableView = Vue.extend({
        template: tableTemplate,
        data: function () {
            return {
                headers: [
                    'Timestamp',
                    'Value'
                ],
                children: []
            };
        }
    });

    return LVTTableView;
});
