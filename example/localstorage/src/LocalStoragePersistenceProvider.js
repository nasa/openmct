/*global define,localStorage*/
/**
 * Stubbed implementation of a persistence provider,
 * to permit objects to be created, saved, etc.
 */
define(
    [],
    function () {
        'use strict';

        function BrowserPersistenceProvider($q, SPACE) {
            var spaces = SPACE ? [SPACE] : [],
                promises = {
                    as: function (value) {
                        return $q.when(value);
                    }
                },
                provider;

            function setValue(key, value) {
                localStorage[key] = JSON.stringify(value);
            }

            function getValue(key) {
                if (localStorage[key]) {
                    return JSON.parse(localStorage[key]);
                }
                return {};
            }

            provider = {
                listSpaces: function () {
                    return promises.as(spaces);
                },
                listObjects: function (space) {
                    var space_obj = getValue(space);
                    return promises.as(Object.keys(space_obj));
                },
                createObject: function (space, key, value) {
                    var space_obj = getValue(space);
                    space_obj[key] = value;
                    setValue(space, space_obj);
                    return promises.as(true);
                },
                readObject: function (space, key) {
                    var space_obj = getValue(space);
                    return promises.as(space_obj[key]);
                },
                deleteObject: function (space, key, value) {
                    var space_obj = getValue(space);
                    delete space_obj[key];
                    return promises.as(true);
                }
            };

            provider.updateObject = provider.createObject;

            return provider;

        }

        return BrowserPersistenceProvider;
    }
);
