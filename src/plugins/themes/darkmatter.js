// Note: This darkmatter theme is in Beta and is not yet ready for prime time. It needs some more tweaking.
import { installTheme } from './installTheme.js';

export default function plugin() {
  return function install(openmct) {
    installTheme(openmct, 'darkmatter');
  };
}
