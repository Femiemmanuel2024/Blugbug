<template>
  <div class="public-profile-page">
    <div class="content">
      <div class="container">
        <div class="left-column">
          <div class="left-container">
            <div class="feedheader"></div>
            <ul>
              <li v-for="(post, index) in posts" :key="post.id">
                <div @click="viewPost(index)" class="post-title">{{ post.title }}</div>
                <div class="post-meta">by {{ post.userFullName }} on {{ formatDateTime(post.date) }}</div>
                <div class="post-actions">
                  <span class="action-item">Likes: {{ post.likes }}</span>
                  <button @click="readPost(post.title ?? '')" class="action-item">Read</button>
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
  id: string;
  title: string | null;
  content: string;
  bodyContent: string;
  userId: string;
  userFullName: string;
  date: string;
  likes: number;
  bookmarked_by: string[];
}

export default defineComponent({
  name: 'PublicProfile',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const userId = ref<string>(Array.isArray(route.params.userId) ? route.params.userId[0] : route.params.userId);
    const posts = ref<Post[]>([]);
    const selectedPost = ref<Post | null>(null);

    const fetchBlogPosts = async (userId: string) => {
      const { data, error } = await supabase
        .from('blog_post')
        .select('id, title, likes, user_id, created_at')
        .eq('user_id', userId);

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
      const blogPosts = await fetchBlogPosts(userId.value);

      const loadedPosts = await Promise.all(
        blogPosts.map(async (post) => {
          const filePath = `${userId.value}/${post.id}.html`;
          const htmlContent = await fetchPostContent(filePath);
          const { title, content, bodyContent } = extractPostElements(htmlContent);
          return {
            id: post.id,
            title: post.title ?? 'Untitled',
            content,
            bodyContent,
            userId: userId.value,
            userFullName: 'Unknown',
            date: post.created_at,
            likes: post.likes,
            bookmarked_by: [],
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
  padding-right: 10px;
}

li {
  display: flex;
  flex-direction: column;
  padding: 10px 0;
  border-bottom: solid 1px #cebfad;
}

.feedheader {
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
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.post-actions .action-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  background: none;
  border: none;
  color: #f53;
  cursor: pointer;
  font-size: 14px;
  padding: 5px;
}

.post-actions .action-item:hover {
  color: #fd662f;
}

.post-content {
  margin-top: 10px;
}

.postbody {
  color: #cebfad;
  font-size: 15px;
}

@media (max-width: 780px) {
  ul {
    padding-left: 10px;
    padding-right: 10px;
  }
}
</style>
