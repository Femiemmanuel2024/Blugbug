<template>
  <button @click="clearLocalStorage" class="delete-button">
    <i class="fas fa-trash-alt"></i>
  </button>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'DeleteAllPostsButton',
  methods: {
    clearLocalStorage() {
      localStorage.clear();
      alert('All posts have been deleted!');
    },
  },
});
</script>

<style scoped>
.delete-button {
  background-color: transparent;
  color: purple;
  border: none;
  padding: 10px;
  cursor: pointer;
  font-size: 24px;
}

.delete-button:hover {
  color: darkviolet; /* Change color on hover for better UX */
}
</style>
