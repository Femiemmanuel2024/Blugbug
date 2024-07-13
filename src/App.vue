<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'App',
});
</script>

<style>
@import 'quill/dist/quill.snow.css'; /* Import Quill CSS */
body {
  font-family: 'Karla', sans-serif;
}
</style>


<!-- <template>
  <div id="app">
    <FileUpload />
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import FileUpload from './components/FileUpload.vue';  // Ensure this path is correct based on your project structure

export default defineComponent({
  name: 'App',
  components: {
    FileUpload,
  },
});
</script>

<style>
/* Add your global styles here */
</style> -->
