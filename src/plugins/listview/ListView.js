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
    '../../api/objects/object-utils.js'
], function (
    $,
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

            container.appendChild(element);
        }
        var createTableHeader = function (parentElement) {
            var headElement = document.createElement('thead');

            var rowElement = document.createElement('tr');
            //populate table header with column names
            ['Name','Type','Created Date','Update Date'].forEach(function (columnName){
                var element = document.createElement('th');
                element.appendChild(document.createTextNode(columnName));
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
            rowElement.addEventListener('click',function(){
                domainObject.action.perform('navigate');
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
