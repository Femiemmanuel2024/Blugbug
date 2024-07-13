<template>
    <v-md-editor v-model="content" height="400px"></v-md-editor>
  </template>
  
  <script>
  import { defineComponent, ref } from 'vue';
  import VMdEditor from '@kangc/v-md-editor';
  import VMdPreview from '@kangc/v-md-editor/lib/preview';
  import vuepressTheme from '@kangc/v-md-editor/lib/theme/vuepress.js';
  import createTipPlugin from '@kangc/v-md-editor/lib/plugins/tip/plugin';
  
  VMdEditor.use(vuepressTheme);
  VMdPreview.use(vuepressTheme);
  VMdEditor.use(createTipPlugin());
  
  export default defineComponent({
    components: {
      VMdEditor,
    },
    setup() {
      const content = ref('');
      return {
        content,
      };
    },
  });
  </script>
  
  <style>
  @import "@kangc/v-md-editor/lib/style/base-editor.css";
  @import "@kangc/v-md-editor/lib/theme/style/vuepress.css";
  </style>
  