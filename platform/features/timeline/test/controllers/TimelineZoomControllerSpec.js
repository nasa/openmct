/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/


define(
    ['../../src/controllers/TimelineZoomController'],
    function (TimelineZoomController) {
        'use strict';

        describe("The timeline zoom state controller", function () {
            var testConfiguration,
                mockScope,
                controller;

            beforeEach(function () {
                testConfiguration = {
                    levels: [
                        1000,
                        2000,
                        3500
                    ],
                    width: 12321
                };
                mockScope = jasmine.createSpyObj("$scope", ['$watch']);
                mockScope.commit = jasmine.createSpy('commit');
                controller = new TimelineZoomController(
                    mockScope,
                    testConfiguration
                );
            });

            it("starts off at a middle zoom level", function () {
                expect(controller.zoom()).toEqual(2000);
            });

            it("allows duration to be changed", function () {
                var initial = controller.duration();
                controller.duration(initial * 3.33);
                expect(controller.duration() > initial).toBeTruthy();
            });

            it("handles time-to-pixel conversions", function () {
                var zoomLevel = controller.zoom();
                expect(controller.toPixels(zoomLevel)).toEqual(12321);
                expect(controller.toPixels(zoomLevel * 2)).toEqual(24642);
            });

            it("handles pixel-to-time conversions", function () {
                var zoomLevel = controller.zoom();
                expect(controller.toMillis(12321)).toEqual(zoomLevel);
                expect(controller.toMillis(24642)).toEqual(zoomLevel * 2);
            });

            it("allows zoom to be changed", function () {
                controller.zoom(1);
                expect(controller.zoom()).toEqual(3500);
            });

            it("does not normally persist zoom changes", function () {
                controller.zoom(1);
                expect(mockScope.commit).not.toHaveBeenCalled();
            });

            it("persists zoom changes in Edit mode", function () {
                mockScope.domainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['hasCapability']
                );
                mockScope.domainObject.hasCapability.andCallFake(function (c) {
                    return c === 'editor';
                });
                controller.zoom(1);
                expect(mockScope.commit).toHaveBeenCalled();
                expect(mockScope.configuration.zoomLevel)
                    .toEqual(jasmine.any(Number));
            });

        });

    }
);
