import missingObjectInterceptor from './missingObjectInterceptor.js';

export default function plugin() {
  return function install(openmct) {
    missingObjectInterceptor(openmct);
  };
}
