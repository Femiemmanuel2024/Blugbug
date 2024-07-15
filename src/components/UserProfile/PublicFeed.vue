<template>
  <div class="public-profile-page">
    <div class="content">
      <div class="container">
        <div class="left-column">
          <div class="left-container">
            <div class="feedheader">
              <h3>Bloggas</h3>
            </div>
            <ul>
              <li v-for="(post, index) in posts" :key="index">
                <div @click="viewPost(index)" class="post-title">{{ post.title }}</div>
                <div class="post-meta">by {{ post.userFullName }} on {{ formatDateTime(post.date) }}</div>
                <div class="post-actions">
                  <i class="fas fa-thumbs-up"></i>
                  <span>{{ post.likes }}</span>
                  <i class="fas fa-bookmark" @click.stop="bookmarkPost(post.id)"></i>
                  <button @click="readPost(post.title)">Read</button>
                </div>
                <div v-if="selectedPost && selectedPost.id === post.id" class="post-content" v-html="selectedPost.bodyContent"></div>
              </li>
            </ul>
          </div>
        </div>
        <div class="right-column">
          <div v-if="selectedPost">
            <h2>{{ selectedPost.title }}</h2>
            <div class="postbody" v-html="selectedPost.bodyContent"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '../supabase';

interface Post {
  id: number;
  title: string | null;
  content: string;
  bodyContent: string;
  userId: string;
  userFullName: string;
  date: string;
  likes: number;
}

export default defineComponent({
  name: 'PublicProfile',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const userId = ref<string>(Array.isArray(route.params.userId) ? route.params.userId[0] : route.params.userId);
    const posts = ref<Post[]>([]);
    const selectedPost = ref<Post | null>(null);

    const fetchPostsFromBucket = async (userId: string) => {
      const { data, error } = await supabase.storage
        .from('blog-post')
        .list(userId, {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' },
        });

      if (error) {
        console.error('Error fetching posts:', error.message);
        return [];
      }

      return data || [];
    };

    const fetchPostContent = async (filePath: string) => {
      const { data, error } = await supabase.storage
        .from('blog-post')
        .download(filePath);

      if (error) {
        console.error('Error fetching post content:', error.message);
        return '';
      }

      return data ? await data.text() : '';
    };

    const extractPostElements = (htmlContent: string) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const h1Element = doc.querySelector('h1');
      const bodyContent = Array.from(doc.body.children)
        .filter((child) => child.tagName !== 'H1')
        .map((child) => child.outerHTML)
        .join('');
      return {
        title: h1Element ? h1Element.textContent : 'Untitled',
        content: htmlContent,
        bodyContent,
      };
    };

    const loadPosts = async () => {
      const postFiles = await fetchPostsFromBucket(userId.value);

      const loadedPosts = await Promise.all(
        postFiles.map(async (file) => {
          const htmlContent = await fetchPostContent(`${userId.value}/${file.name}`);
          const { title, content, bodyContent } = extractPostElements(htmlContent);
          return {
            id: Date.now(), // You might want to use a better ID
            title,
            content,
            bodyContent,
            userId: userId.value,
            userFullName: 'Unknown', // This could be fetched from another source if needed
            date: new Date().toISOString(),
            likes: 0, // Initialize likes to 0
          };
        })
      );

      posts.value = loadedPosts;
    };

    const viewPost = (index: number) => {
      selectedPost.value = posts.value[index];
    };

    const readPost = (title: string) => {
      router.push({ name: 'BlugPage', query: { search: title } });
    };

    const bookmarkPost = (postId: number) => {
      console.log(`Bookmarking post with id: ${postId}`);
      // Add logic to handle bookmarking the post
    };

    const formatDateTime = (dateTime: string) => {
      const date = new Date(dateTime);
      const formattedTime = date.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
      const formattedDate = date.toLocaleDateString();
      return `${formattedTime} on ${formattedDate}`;
    };

    watch(() => route.params.userId, (newUserId) => {
      if (newUserId) {
        userId.value = Array.isArray(newUserId) ? newUserId[0] : newUserId;
        loadPosts();
      }
    });

    onMounted(() => {
      loadPosts();
    });

    return {
      posts,
      selectedPost,
      viewPost,
      readPost,
      bookmarkPost,
      formatDateTime,
    };
  },
});
</script>

<style scoped>
.public-profile-page {
  border: solid 5px #0c1118;
}

ul {
  list-style-type: none;
  padding: 0;
  color: #cebfad;
  padding-left: 30px;
}

li {
  display: flex;
  flex-direction: column;
  padding: 10px 0;
  border-bottom: 1px solid #ccc;
}

.feedheader {
  border-bottom: 1px solid #ccc;
  display: flex;
  justify-content: center;
  background-color: #f53;
  width: 80px;
  margin-left: 10px;
  border-radius: 10px 10px 0px 0px;
  max-height: 50px;
  margin: 10px 20px;
}

h3 {
  text-align: center;
}

.post-title {
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
}

.post-meta {
  font-size: 14px;
  color: gray;
}

.post-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.post-actions i {
  font-size: 20px;
  cursor: pointer;
}

.post-content {
  margin-top: 10px;
}

.postbody {
  color: #cebfad;
  font-size: 15px;
}
</style>
