import missingObjectInterceptor from './missingObjectInterceptor';

export default function plugin() {
  return function install(openmct) {
    missingObjectInterceptor(openmct);
  };
}
