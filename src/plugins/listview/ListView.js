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

define([
    'zepto',
    '../../../../platform/core/src/capabilities/ContextualDomainObject.js',
    '../../api/objects/object-utils.js'
], function (
    $,
    ContextualDomainObject,
    objectUtils
) {

    /**
     * Displays folders in a list view.
     * @constructor
     */
    function ListView(openmct) {
        var createTable = function(container,domainObject) {
            var element = document.createElement('table');
            element.classList.add('list-view');
            createTableHeader(element);
            createTableBody(element, domainObject);
            element.addEventListener("click", function(event){
                var tableRef = event.currentTarget;
                var headerRef = event.target;
                if(headerRef.tagName ==="TH"){
                    sortTableByHeader(tableRef,headerRef);//current target is table element, target is th element
                };
            },false);
            initialTableSort(element);
            container.appendChild(element);
        }
        var createTableHeader = function (parentElement) {
            var headElement = document.createElement('thead');

            var rowElement = document.createElement('tr');
            //populate table header with column names
            [
                {title:'Name', order:'asc'},
                {title:'Type', order:'asc'},
                {title:'Created Date', order:'desc'},
                {title:'Update Date', order:'desc'}
            ].forEach(function (columnInfo, index){
                var element = document.createElement('th');
                element.classList.add('sortable');
                element.setAttribute('col', index);
                element.setAttribute('order', columnInfo.order);
                element.appendChild(document.createTextNode(columnInfo.title));
                rowElement.appendChild(element);
            });

            headElement.appendChild(rowElement);

            parentElement.appendChild(headElement);
        }

        var createTableBody = function (parentElement, domainObject) {
            var tbodyElement = document.createElement('tbody');

            openmct.composition.get(domainObject).load().then(
                function(compositions){
                    compositions.map(function(child){
                        var instantiate = this.openmct.$injector.get('instantiate');

                        var childKeystring = objectUtils.makeKeyString(child.identifier);
                        var childOldformat = objectUtils.toOldFormat(child);
                        var childOld = instantiate(childOldformat, childKeystring);

                        //can't access globalDomainObject TODO: figure out how to access it.
                        // var parentKeystring = this.objectUtils.makeKeyString(globalDomainObject.identifier);
                        // var parentOldformat = this.objectUtils.toOldFormat(globalDomainObject);
                        // var parentOld = instantiate(parentOldformat, parentKeystring);
                        //
                        // var contextObject = new ContextualDomainObject(childOld, parentOld);

                        return {
                            icon: childOld.getCapability('type').getCssClass(),
                            title: childOld.getModel().name,
                            type: childOld.getCapability('type').getName(),
                            persisted: new Date(
                                childOld.getModel().persisted
                            ).toUTCString(),
                            modified: new Date(
                                childOld.getModel().modified
                            ).toUTCString(),
                            asDomainObject: childOld,
                            location: childOld.getCapability('location'),
                            action: childOld.getCapability('action')
                        }
                    }).forEach(function (child){
                        createRow(tbodyElement, child);
                    });
                },
                function(err){
                    console.log(err);
                }
            )

            parentElement.appendChild(tbodyElement);
        }

        var createRow = function(parentElement, domainObject){
            var rowElement = document.createElement('tr');
            addIconAndTitle(rowElement, domainObject);
            addType(rowElement, domainObject);
            addPersistedValue(rowElement, domainObject);
            addModifiedValue(rowElement, domainObject);

            //TODO: implement the navigate functionality.
            //currently we are using $injector for angular and getting $location.
            //this allows us to get the path within the application.
            //this may be something along the lines of an internal view hierarchy.
            //not view hierarchy but a hierarchy of subfolder.
            //what belongs to what.
            rowElement.addEventListener('click',function(){

                var l =openmct.$injector.get('$location');
                l.path(l.path() + '/' + domainObject.asDomainObject.getId())
                // debugger;
                // domainObject.action.perform('navigate');
            });
            parentElement.appendChild(rowElement);
        }

        var addIconAndTitle = function(parentElement, domainObject){
            var tdElement = document.createElement('td');
            var divElement = document.createElement('div')
            divElement.classList.add('l-flex-row');
            createIconElement(divElement, domainObject);
            createTitleElement(divElement, domainObject);
            tdElement.appendChild(divElement);
            parentElement.appendChild(tdElement);
        }

        var createIconElement = function(parentElement, domainObject){
            var wrapElement = document.createElement('span');
            wrapElement.classList.add(...['flex-elem', 't-item-icon']);
            var element = document.createElement('span')
            element.classList.add(...['t-item-icon-glyph', domainObject.icon]);
            wrapElement.appendChild(element);
            parentElement.appendChild(wrapElement);
        }

        var createTitleElement = function(parentElement, domainObject){
            var element = document.createElement('span');
            element.classList.add(...['t-title-label', 'flex-elem', 'grows']);
            element.appendChild(document.createTextNode(domainObject.title));
            parentElement.appendChild(element);
        }

        var addType = function(parentElement, domainObject){
            var element = document.createElement('td');
            element.appendChild(document.createTextNode(domainObject.type));
            parentElement.appendChild(element);
        }

        var addPersistedValue = function(parentElement, domainObject){
            var element = document.createElement('td');
            element.appendChild(document.createTextNode(domainObject.persisted));
            parentElement.appendChild(element);
        }

        var addModifiedValue = function(parentElement, domainObject){
            var element = document.createElement('td');
            element.appendChild(document.createTextNode(domainObject.modified));
            parentElement.appendChild(element);
        }

        // function sortTable(table, col, reverse) {
        //     var tb = table.tBodies[0], // use `<tbody>` to ignore `<thead>` and `<tfoot>` rows
        //         tr = Array.prototype.slice.call(tb.rows, 0), // put rows into array
        //         i;
        //     reverse = -((+reverse) || -1);
        //     tr = tr.sort(function (a, b) { // sort rows
        //         return reverse // `-1 *` if want opposite order
        //             * (a.cells[col].textContent.trim() // using `.textContent.trim()` for test
        //                 .localeCompare(b.cells[col].textContent.trim())
        //                );
        //     });
        //     for(i = 0; i < tr.length; ++i) tb.appendChild(tr[i]); // append each row in order
        //     debugger;
        // }
        //
        // function makeSortable(table) {
        //     var th = table.tHead, i;
        //     th && (th = th.rows[0]) && (th = th.cells);
        //     if (th) i = th.length;
        //     else return; // if no `<thead>` then do nothing
        //     while (--i >= 0) (function (i) {
        //         var dir = 1;
        //         //backwards iteration through the rows. therefore time  are the last two
        //         if(i==0||i==1){
        //             th[i].addEventListener('click', function () {sortTable(table, i, -1)});
        //         }else{
        //             th[i].addEventListener('click', function () {sortTable(table, i, 1)});
        //         }
        //         //th[i].addEventListener('click', function () {sortTable(table, i, (dir = 1 - dir))});
        //
        //     }(i));
        // }
        // function makeAllSortable(parent) {
        //     parent = parent || document.body;
        //     var t = parent.getElementsByTagName('table'), i = t.length;
        //     while (--i >= 0) makeSortable(t[i]);
        // }

        function sortTableByHeader(table,header){
            // debugger;
            var col = header.getAttribute('col');
            var order = header.getAttribute('order');
            if(header.classList.contains('sort')){
                var ascLast = header.classList.contains('asc');
                clearTableHeaders(table);
                header.classList.add('sort');
                if(ascLast){
                    reverse = -1;
                    header.classList.add('desc');
                }else{
                    reverse = 1;
                    header.classList.add('asc');
                }
            }else{
                clearTableHeaders(table);
                header.classList.add('sort');
                if (order === 'asc'){
                    reverse = 1;
                    header.classList.add('asc')
                }else{
                    reverse = -1;
                    header.classList.add('desc')
                }
            }

            var body = table.tBodies[0];
            var rows = Array.prototype.slice.call(body.rows, 0);
            rows = rows.sort(function (a, b) { // sort rows
                return reverse // `-1 *` if want opposite order
                    * (a.cells[col].textContent.trim() // using `.textContent.trim()` for test
                        .localeCompare(b.cells[col].textContent.trim())
                       );
            });
            for(i = 0; i < rows.length; ++i) body.appendChild(rows[i]);
        }
        function initialTableSort(table){
            var col = 0;
            var reserve = 1;
            table.firstElementChild.firstElementChild.firstElementChild.classList.add('sort','asc');
            var body = table.tBodies[0];
            var rows = Array.prototype.slice.call(body.rows, 0);
            rows = rows.sort(function (a, b) { // sort rows
                return reverse // `-1 *` if want opposite order
                    * (a.cells[col].textContent.trim() // using `.textContent.trim()` for test
                        .localeCompare(b.cells[col].textContent.trim())
                       );
            });
            for(i = 0; i < rows.length; ++i) body.appendChild(rows[i]);
        }

        function clearTableHeaders(table){
            var tableHeadersHTMLCollection = table.firstElementChild.firstElementChild.children;
            var tableHeaders = Array.prototype.slice.call(tableHeadersHTMLCollection);
            tableHeaders.forEach(function(headerElement, index){
                //remove sort from all
                headerElement.classList.remove('sort','desc','asc');
            });
        }

        //Object defining the view
        return {
            name: 'listview',
            cssClass: 'icon-list-view',
            canView: function (d) {
                return d.type === 'folder' && 150;
            },
            view: function (domainObject) {
                return {
                    show: function (container) {
                        createTable(container, domainObject);
                    },
                    destroy: function (container) {

                    }
                }
            }
        }
    }

    return ListView;
});
