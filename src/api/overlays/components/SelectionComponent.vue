<template>
  <div class="c-message">
    <!--Uses flex-row -->
    <div class="c-message__icon" :class="['u-icon-bg-color-' + iconClass]"></div>
    <div class="c-message__text">
      <!-- Uses flex-column -->
      <div v-if="title" class="c-message__title">
        {{ title }}
      </div>

      <div v-if="message" class="c-message__action-text">
        {{ message }}
      </div>
      <select @change="onChange">
        <option
          v-for="option in selectionOptions"
          :key="option.key"
          :value="option.key"
          :selected="option.key === currentSelection"
        >
          {{ option.name }}
        </option>
      </select>

      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  inject: ['iconClass', 'title', 'message', 'selectionOptions', 'currentSelection', 'onChange']
};
</script>
