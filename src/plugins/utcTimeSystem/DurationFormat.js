import moment from 'moment';

const DATE_FORMAT = 'HH:mm:ss';
const DATE_FORMATS = [DATE_FORMAT];

/**
 * Formatter for duration. Uses moment to produce a date from a given
 * value, but output is formatted to display only time. Can be used for
 * specifying a time duration. For specifying duration, it's best to
 * specify a date of January 1, 1970, as the ms offset will equal the
 * duration represented by the time.
 *
 * @implements {Format}
 * @constructor
 * @memberof platform/commonUI/formats
 */
class DurationFormat {
  constructor() {
    this.key = 'duration';
  }
  format(value) {
    return moment.utc(value).format(DATE_FORMAT);
  }

  parse(text) {
    return moment.duration(text).asMilliseconds();
  }

  validate(text) {
    return moment.utc(text, DATE_FORMATS, true).isValid();
  }
}

export default DurationFormat;
