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
    'angular',
    './Region',
    '../../api/objects/object-utils'
], function (
    angular,
    Region,
    objectUtils
) {
    function MCTView(newViews, PublicAPI) {
        var definitions = {};

        newViews.forEach(function (newView) {
            definitions[newView.region] = definitions[newView.region] || {};
            definitions[newView.region][newView.key] = newView.factory;
        });

        return {
            restrict: 'E',
            link: function (scope, element, attrs) {
                var key, mctObject, regionId, region;

                function maybeShow() {
                    if (!definitions[regionId] || !definitions[regionId][key] || !mctObject) {
                        return;
                    }

                    region.show(definitions[regionId][key].view(mctObject));
                }

                function setKey(k) {
                    key = k;
                    maybeShow();
                }

                function setObject(obj) {
                    mctObject = undefined;
                    PublicAPI.Objects.get(objectUtils.parseKeyString(obj.getId()))
                        .then(function (mobj) {
                            mctObject = mobj;
                            maybeShow();
                        });
                }

                function setRegionId(r) {
                    regionId = r;
                    maybeShow();
                }

                region = new Region(element[0]);

                scope.$watch('key', setKey);
                scope.$watch('region', setRegionId);
                scope.$watch('mctObject', setObject);
            },
            scope: {
                key: "=",
                region: "=",
                mctObject: "="
            }
        };
    }

    return MCTView;
});
