/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define([

], function (

) {

    // take a key string and turn it into a key object
    // 'scratch:root' ==> {namespace: 'scratch', identifier: 'root'}
    var parseKeyString = function (key) {
        if (typeof key === 'object') {
            return key;
        }
        var namespace = '',
            identifier = key;
        for (var i = 0, escaped = false; i < key.length; i++) {
            if (escaped) {
                escaped = false;
                namespace += key[i];
            } else {
                if (key[i] === "\\") {
                    escaped = true;
                } else if (key[i] === ":") {
                    // namespace = key.slice(0, i);
                    identifier = key.slice(i + 1);
                    break;
                }
                namespace += key[i];
            }
        }

        if (key === namespace) {
            namespace = '';
        }

        return {
            namespace: namespace,
            identifier: identifier
        };
    };

    // take a key and turn it into a key string
    // {namespace: 'scratch', identifier: 'root'} ==> 'scratch:root'
    var makeKeyString = function (key) {
        if (typeof key === 'string') {
            return key;
        }
        if (!key.namespace) {
            return key.identifier;
        }
        return [
            key.namespace.replace(':', '\\:'),
            key.identifier.replace(':', '\\:')
        ].join(':');
    };

    // Converts composition to use key strings instead of keys
    var toOldFormat = function (model) {
        model = JSON.parse(JSON.stringify(model));
        delete model.key;
        if (model.composition) {
            model.composition = model.composition.map(makeKeyString);
        }
        return model;
    };

    // converts composition to use keys instead of key strings
    var toNewFormat = function (model, key) {
        model = JSON.parse(JSON.stringify(model));
        model.key = key;
        if (model.composition) {
            model.composition = model.composition.map(parseKeyString);
        }
        return model;
    };

    var equals = function (a, b) {
        return makeKeyString(a.key) === makeKeyString(b.key);
    };

    return {
        toOldFormat: toOldFormat,
        toNewFormat: toNewFormat,
        makeKeyString: makeKeyString,
        parseKeyString: parseKeyString,
        equals: equals
    };
});
