<template>
  <div class="read-blog">
    <h1>{{ post.title }}</h1>
    <p>Written by: {{ post.userFullName }}</p>
    <p>Date: {{ post.date }}</p>
    <div v-html="htmlContent"></div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, computed } from 'vue';
import { marked } from 'marked';

interface Post {
  id: number;
  title: string;
  content: string;
  likes: number;
  bookmarked: boolean;
  userId: string;
  userFullName: string;
  date: string;
}

export default defineComponent({
  name: 'ReadBlog',
  props: {
    post: {
      type: Object as PropType<Post>,
      required: true,
    },
  },
  setup(props) {
    const htmlContent = computed(() => {
      return marked(props.post.content);
    });

    return {
      htmlContent,
    };
  },
});
</script>

<style scoped>
.read-blog {
  padding: 20px;
}

h1 {
  font-size: 2em;
  margin-bottom: 10px;
}

p {
  margin-bottom: 10px;
  color: #666;
}
</style>
