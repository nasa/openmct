import { formatUtc, parseDuration, validateMultiFormat } from '../../utils/time.js';

const DATE_FORMAT = 'HH:mm:ss';
const DATE_FORMATS = [DATE_FORMAT, `${DATE_FORMAT}.SSS`];

/**
 * Formatter for duration. Uses Luxon to produce a date from a given
 * value, but output is formatted to display only time. Can be used for
 * specifying a time duration. For specifying duration, it's best to
 * specify a date of January 1, 1970, as the ms offset will equal the
 * duration represented by the time.
 *
 * @implements {Format}
 * @constructor
 */
class DurationFormat {
  constructor() {
    this.key = 'duration';
  }
  format(value, formatString) {
    return formatUtc(value, formatString || DATE_FORMAT);
  }

  parse(text) {
    return parseDuration(text);
  }

  validate(text) {
    return validateMultiFormat(text, DATE_FORMATS);
  }
}

export default DurationFormat;
