<template>
    <div>
      <div ref="quillEditor" class="quill-editor"></div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, onMounted } from 'vue';
  import Quill from 'quill'; // Import Quill
  import 'quill/dist/quill.snow.css'; // Import Quill CSS directly
  
  export default defineComponent({
    name: 'QuillEditor',
    setup() {
      const quillEditor = ref<HTMLDivElement | null>(null);
      const quillInstance = ref<any>(null);
  
      const initQuill = () => {
        if (quillEditor.value) {
          const options = {
            placeholder: 'Compose like a bloggabug',
            theme: 'snow',
          };
          quillInstance.value = new Quill(quillEditor.value, options);
        }
      };
  
      onMounted(() => {
        initQuill();
      });
  
      return {
        quillEditor,
        quillInstance,
      };
    },
  });
  </script>
  
  <style scoped>
  .quill-editor {
    height: 300px;
  }
  </style>
  