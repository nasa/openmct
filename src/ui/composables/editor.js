import { ref } from 'vue';

import { useEventListener } from './event';

/**
 * @param {import('../../../openmct').OpenMCT} openmct
 * @returns {{isEditing: import('vue').Ref<boolean>}} isEditing
 */
export function useIsEditing(openmct) {
  const isEditing = ref(false);

  // eslint-disable-next-line func-style
  const handler = (value) => (isEditing.value = value);

  // Use the base event listener composable
  useEventListener(openmct.editor, 'isEditing', handler);

  return { isEditing };
}
