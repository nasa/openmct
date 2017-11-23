
define([], function () {
    'use strict';

    /**
     * Construct a new Deep Space Network parser.
     *
     * @memberof plugins/dsn
     * @constructor
     */
    function DsnParser() {
        this.dsn = { data: {} };
    }

    /**
     * Parses a station tag contained in the Deep Space Network's XML.
     *
     * @private
     * @param {Element} stationElement - The station to parse.
     * @returns {object} An object containing the station's data.
     */
    DsnParser.prototype.parseStationTag = function (stationElement) {
        var key = stationElement.getAttribute('name'),
            station = {};

        station[key + '.name'] = stationElement.getAttribute('name');
        station[key + '.friendly.name'] = stationElement.getAttribute('friendlyName');
        station[key + '.utc.time'] = parseInt(stationElement.getAttribute('timeUTC'), 10);
        station[key + '.time.zone.offset'] = parseInt(stationElement.getAttribute('timeZoneOffset'), 10);

        return station;
    };

    /**
     * Parses a dish tag contained in the Deep Space Network's XML.
     *
     * @private
     * @param {Element} dishElement - The dish to parse.
     * @returns {object} An object containing data about the dish's antenna, down signals,
     * up signals and targets.
     */
    DsnParser.prototype.parseDishTag = function (dishElement) {
        var children = dishElement.children,
            key,
            dish = {};

        key = dishElement.getAttribute('name').toLowerCase();

        dish[key + '.name'] = dishElement.getAttribute('name');
        dish[key + '.azimuth.angle'] = dishElement.getAttribute('azimuthAngle');
        dish[key + '.elevation.angle'] = dishElement.getAttribute('elevationAngle');
        dish[key + '.wind.speed'] = dishElement.getAttribute('windSpeed');
        dish[key + '.mspa'] = dishElement.getAttribute('isMSPA');
        dish[key + '.array'] = dishElement.getAttribute('isArray');
        dish[key + '.ddor'] = dishElement.getAttribute('isDDOR');
        dish[key + '.created'] = dishElement.getAttribute('created');
        dish[key + '.updated'] = dishElement.getAttribute('updated');
        dish[key + '.downSignals'] = [];
        dish[key + '.upSignals'] = [];
        dish[key + '.targets'] = [];

        for (var i = 0; i < children.length; i++) {
            var child = children[i];

            switch (child.tagName) {
                case 'downSignal':
                    dish[key + '.downSignals'].push({
                        'signal.type':       child.getAttribute('signalType'),
                        'signal.type.debug': child.getAttribute('signalTypeDebug'),
                        'data.rate':         child.getAttribute('dataRate'),
                        'frequency':         child.getAttribute('frequency'),
                        'power':             child.getAttribute('power'),
                        'spacecraft':        child.getAttribute('spacecraft'),
                        'spacecraft.id':     child.getAttribute('spacecraftId')
                    });
                    break;
                case 'upSignal':
                    dish[key + '.upSignals'].push({
                        'signal.type':       child.getAttribute('signalType'),
                        'signal.type.debug': child.getAttribute('signalTypeDebug'),
                        'data.rate':         child.getAttribute('dataRate'),
                        'frequency':         child.getAttribute('frequency'),
                        'power':             child.getAttribute('power'),
                        'spacecraft':        child.getAttribute('spacecraft'),
                        'spacecraft.id':     child.getAttribute('spacecraftId')
                    });
                    break;
                case 'target':
                    dish[key + '.targets'].push({
                        'name':          child.getAttribute('name'),
                        'id':            child.getAttribute('id'),
                        'upleg.range':   child.getAttribute('uplegRange'),
                        'downleg.range': child.getAttribute('downlegRange'),
                        'rtlt':          child.getAttribute('rtlt')
                    });
                    break;
            }
        }

        return dish;
    };

    /**
     * Parses the timestamp tag contained in the Deep Space Network's XML.
     *
     * @private
     * @param {Element} timestampElement - The timestamp to parse.
     * @returns {string} The time in milliseconds since the UNIX epoch.
     */
    DsnParser.prototype.parseTimestampTag = function (timestampElement) {
        return timestampElement.textContent;
    };

    /**
     * @typedef DsnData
     * @type {object}
     * @property {object} data - An object containing properties that match the values of domain
     * object identifier keys and their corresponding telemetry values.
     * @property {string} timestamp - The time in milliseconds since the UNIX epoch.
     */

    /**
     * Parses the station, dish and timestamp tags contained in the Deep Space Network's XML.
     *
     * @param {Document} xmlDocument - The XML document representing the Deep Space Network's data.
     * @returns {DsnData} The parsed XML as an object with properties that match the
     * values of domain object identifier keys.
     */
    DsnParser.prototype.parseXml = function (xmlDocument) {
        var dsn = {},
            dsnElements = xmlDocument.documentElement.children;

        for (var i = 0; i < dsnElements.length; i++) {
            var element = dsnElements[i];

            switch (element.tagName) {
                case 'station':
                    Object.assign(this.dsn.data, this.parseStationTag(element));
                    break;
                case 'dish':
                    Object.assign(this.dsn.data, this.parseDishTag(element));
                    break;
                case 'timestamp':
                    this.dsn.timestamp = this.parseTimestampTag(element);
            }
        }

        return this.dsn;
    };

    return DsnParser;
});
