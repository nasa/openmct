
define([
    './DsnParser',
    'text!./res/test-dsn-response.xml'
], function (
    DsnParser,
    testXmlResponse
) {
    'use strict';

    describe('DsnParser', function () {
        var domParser = new DOMParser(),
            dsnParser = new DsnParser();

        describe('parses a response', function () {
            var dsn,
                dsnXml;

            beforeEach(function () {
                dsnXml = domParser.parseFromString(testXmlResponse, 'application/xml');
                dsn = dsnParser.parseXml(dsnXml);
            });

            afterEach(function () {
                dsn = {};
                dsnXml = {};
            });

            it('with a station element', function () {
                expect(dsn.data['cdscc.station']).toBeDefined();
                expect(dsn.data['cdscc.name']).toBe('cdscc');
                expect(dsn.data['cdscc.friendly.name']).toBe('Canberra');
                expect(dsn.data['cdscc.utc.time']).toBe(1549708172929);
                expect(dsn.data['cdscc.time.zone.offset']).toBe(39600000);
            });

            it('with a dish element', function () {
                var downSignal = {},
                    upSignal = {},
                    target = {};

                expect(dsn.data['dss14.antenna']).toBeDefined();
                expect(dsn.data['dss14.name']).toBe('DSS14');
                expect(dsn.data['dss14.azimuth.angle']).toBe('86.24');
                expect(dsn.data['dss14.elevation.angle']).toBe('15.91');
                expect(dsn.data['dss14.wind.speed']).toBe('12.35');
                expect(dsn.data['dss14.mspa']).toBe('false');
                expect(dsn.data['dss14.array']).toBe('false');
                expect(dsn.data['dss14.ddor']).toBe('false');
                expect(dsn.data['dss14.created']).toBe('2019-02-09T09:35:17.496Z');
                expect(dsn.data['dss14.updated']).toBe('2019-02-09T09:35:20.154Z');

                expect(dsn.data['dss14.signals']).toBeDefined();

                downSignal = dsn.data['dss14.signals'][0];
                expect(downSignal['dss14.signal.direction']).toBe('down');
                expect(downSignal['dss14.signal.type']).toBe('data');
                expect(downSignal['dss14.signal.type.debug']).toBe('IN LOCK OFF 1 MCD2');
                expect(downSignal['dss14.signal.data.rate']).toBe('160.002853');
                expect(downSignal['dss14.signal.frequency']).toBe('8420585323.254991');
                expect(downSignal['dss14.signal.power']).toBe('-155.647873');
                expect(downSignal['dss14.signal.spacecraft']).toBe('VGR1');
                expect(downSignal['dss14.signal.spacecraft.id']).toBe('31');

                upSignal = dsn.data['dss14.signals'][1];
                expect(upSignal['dss14.signal.direction']).toBe('up');
                expect(upSignal['dss14.signal.type']).toBe('none');
                expect(upSignal['dss14.signal.type.debug']).toBe('none');
                expect(upSignal['dss14.signal.data.rate']).toBe('0');
                expect(upSignal['dss14.signal.frequency']).toBe('none');
                expect(upSignal['dss14.signal.power']).toBe('0');
                expect(upSignal['dss14.signal.spacecraft']).toBe('');
                expect(upSignal['dss14.signal.spacecraft.id']).toBe('');
                expect(dsn.data['dss14.targets']).toBeDefined();

                expect(dsn.data['dss14.targets']).toBeDefined();

                target = dsn.data['dss14.targets'][0];
                expect(target['dss14.target.name']).toBe('VGR1');
                expect(target['dss14.target.id']).toBe('31');
                expect(target['dss14.target.upleg.range']).toBe('2.1700581860317E10');
                expect(target['dss14.target.downleg.range']).toBe('2.1698131625495E10');
                expect(target['dss14.target.rtlt']).toBe('144764.894661');
            });

            it('with a timestamp element', function () {
               expect(dsn.data.timestamp).toBe(1549708172928);
            });
        });

        describe('parses a response', function () {
            var dsn,
                dsnXml,
                xml;

            beforeEach(function () {
                xml = '<dsn><spacecraft id="1" name="VGR1" friendlyName="Voyager 1" /></dsn>';
                dsnXml = domParser.parseFromString(xml, 'application/xml');
                dsn = dsnParser.parseXml(dsnXml);
            });

            afterEach(function () {
                dsn = {};
                dsnXml = {};
            });

            it('with an unknown element', function () {
                expect(dsn.data).toBeDefined();
                expect(Object.keys(dsn.data).length).toBe(0);
            });
        });

        describe('parses an empty response', function () {
            var dsn,
                dsnXml;

            beforeEach(function () {
                dsnXml = domParser.parseFromString('<dsn></dsn>', 'application/xml');
                dsn = dsnParser.parseXml(dsnXml);
            });

            afterEach(function () {
                dsn = {};
                dsnXml = {};
            });

            it('with no child elements', function () {
                expect(dsn.data).toBeDefined();
                expect(Object.keys(dsn.data).length).toBe(0);
            });
        });
    });
});
