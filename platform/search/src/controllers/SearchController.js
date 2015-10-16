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
/*global define*/

/**
 * Module defining SearchController. Created by shale on 07/15/2015.
 */
define(function () {
    "use strict";

    var INITIAL_LOAD_NUMBER = 20,
        LOAD_INCREMENT = 20;

    /**
     * Controller for search in Tree View.
     *
     * Filtering is currently buggy; it filters after receiving results from
     * search providers, the downside of this is that it requires search
     * providers to provide objects for all possible results, which is
     * potentially a hit to persistence, thus can be very very slow.
     *
     * Ideally, filtering should be handled before loading objects from the persistence
     * store, the downside to this is that filters must be applied to object
     * models, not object instances.
     *
     * @constructor
     * @param $scope
     * @param searchService
     */
    function SearchController($scope, searchService) {
        var controller = this;
        this.$scope = $scope;
        this.searchService = searchService;
        this.numberToDisplay = INITIAL_LOAD_NUMBER;
        this.fullResults = [];
        this.filteredResults = [];
        this.$scope.results = [];
        this.$scope.loading = false;
        this.pendingQuery = undefined;
        this.$scope.ngModel.filter = function () {
            return controller.onFilterChange.apply(controller, arguments);
        };
    }

    /**
     * Returns true if there are more results than currently displayed for the
     * for the current query and filters.
     */
    SearchController.prototype.areMore = function () {
        return this.$scope.results.length < this.filteredResults.length;
    };

    /**
     * Display more results for the currently displayed query and filters.
     */
    SearchController.prototype.loadMore = function () {
        this.numberToDisplay += LOAD_INCREMENT;
        this.updateResults();
    };

    /**
     * Search for the query string specified in scope.
     */
    SearchController.prototype.search = function () {
        var inputText = this.$scope.ngModel.input,
            controller = this;

        this.clearResults();

        if (inputText) {
            this.$scope.loading = true;
            this.$scope.ngModel.search = true;
        } else {
            this.pendingQuery = undefined;
            this.$scope.ngModel.search = false;
            this.$scope.loading = false;
            return;
        }

        if (this.pendingQuery === inputText) {
            return; // don't issue multiple queries for the same term.
        }

        this.pendingQuery = inputText;

        this
            .searchService
            .query(inputText, 60) // TODO: allow filter in search service.
            .then(function (results) {
                if (controller.pendingQuery !== inputText) {
                    return; // another query in progress, so skip this one.
                }
                controller.onSearchComplete(results);
            });
    };

    /**
     * Refilter results and update visible results when filters have changed.
     */
    SearchController.prototype.onFilterChange = function () {
        this.filter();
        this.updateVisibleResults();
    };

    /**
     * Filter `fullResults` based on currenly active filters, storing the result
     * in `filteredResults`.
     *
     * @private
     */
    SearchController.prototype.filter = function () {
        var includeTypes = this.$scope.ngModel.checked;

        if (this.$scope.ngModel.checkAll) {
            this.filteredResults = this.fullResults;
            return;
        }

        this.filteredResults = this.fullResults.filter(function (hit) {
            return includeTypes[hit.object.getModel().type];
        });
    };


    /**
     * Clear the search results.
     *
     * @private
     */
    SearchController.prototype.clearResults = function () {
        this.$scope.results = [];
        this.fullResults = [];
        this.filteredResults = [];
        this.numberToDisplay = INITIAL_LOAD_NUMBER;
    };



    /**
     * Update search results from given `results`.
     *
     * @private
     */
    SearchController.prototype.onSearchComplete = function (results) {
        this.fullResults = results.hits;
        this.filter();
        this.updateVisibleResults();
        this.$scope.loading = false;
        this.pendingQuery = undefined;
    };

    /**
     * Update visible results from filtered results.
     *
     * @private
     */
    SearchController.prototype.updateVisibleResults = function () {
        this.$scope.results =
            this.filteredResults.slice(0, this.numberToDisplay);
    };

    return SearchController;
});
