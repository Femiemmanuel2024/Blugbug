<template>
  <div class="posts-container" v-if="posts.length">
    <h3>Blog Posts</h3>
    <ul>
      <li v-for="(post, index) in posts" :key="post.id">
        <div class="post-title">{{ post.title }}</div>
        <div class="post-actions">
          <button @click.stop="likePost(index)" aria-label="Like Post">
            <i class="fas fa-thumbs-up"></i>
          </button>
          <button @click.stop="bookmarkPost(index)" aria-label="Bookmark Post">
            <i class="fas fa-bookmark"></i>
          </button>
          <button @click.stop="viewPost(index)" aria-label="View Post">
            <i class="fas fa-eye"></i>
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';

interface Post {
  id: number;
  title: string;
  content: string;
  likes: number;
  bookmarked: boolean;
  userId: string;
}

export default defineComponent({
  name: 'BlogPosts',
  emits: ['viewPost'],
  setup(_, { emit }) {
    const posts = ref<Post[]>([]);

    const loadPosts = () => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = currentUser.id;
      const savedPosts = JSON.parse(localStorage.getItem(`${userId}_blogPosts`) || '[]');
      posts.value = savedPosts;
    };

    onMounted(() => {
      loadPosts();
    });

    return {
      posts,
      likePost(index: number) {
        posts.value[index].likes++;
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userId = currentUser.id;
        localStorage.setItem(`${userId}_blogPosts`, JSON.stringify(posts.value));
      },
      bookmarkPost(index: number) {
        posts.value[index].bookmarked = !posts.value[index].bookmarked;
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userId = currentUser.id;
        localStorage.setItem(`${userId}_blogPosts`, JSON.stringify(posts.value));
      },
      viewPost(index: number) {
        emit('viewPost', index);
      }
    };
  },
});
</script>

<style scoped>
.posts-container {
  margin: 20px 0;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #ccc;
}

.post-title {
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
}

.post-actions {
  display: flex;
  margin-top: 10px;
  gap: 10px;
}

.post-actions button {
  background: none;
  border: none;
  color: #f53;
  cursor: pointer;
  font-size: 20px;
}
</style>
