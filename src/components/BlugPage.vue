<template>
  <div class="blug-page">
    <NavBar />
    <div class="content">
      <div class="search-bar">
        <input type="text" v-model="searchQuery" placeholder="Search for blog post by title" />
      </div>
      <div class="container">
        <div class="top-column">
          <div class="top-title">
            <h1 class="blog-header">BlugWorld</h1>
          </div>
          <div class="top-container">
            <ul class="blog-list">
              <li class="list-container" v-for="(post, index) in displayedPosts" :key="index">
                <div class="title-row post-title-container">
                  <span class="post-title">{{ post.title }}</span>
                </div>
                <div class="button-row">
                  <button class="read-button" @click="viewPost(post)">
                    Read
                  </button>
                  <button class="share-button" @click="sharePost(post)">
                    Share
                  </button>
                </div>
              </li>
            </ul>
          </div>
          <div class="navigation-buttons" v-if="!searchQuery">
            <button @click="prevPage" :disabled="!hasPrevPage">
              <font-awesome-icon :icon="['fas', 'circle-left']" />
            </button>
            <button @click="nextPage" :disabled="!hasNextPage">
              <font-awesome-icon :icon="['fas', 'circle-right']" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch, toRaw } from 'vue';
import { useRouter } from 'vue-router';
import NavBar from './NavBar.vue';
import { supabase } from './supabase';
import InteractivePage from './features/InteractionPage.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

interface Post {
  id: number;
  title: string | null;
  content: string;
  bodyContent: string;
  userId: string;
  userFullName: string;
  date: string;
}

export default defineComponent({
  name: 'BlugPage',
  components: {
    NavBar,
    InteractivePage,
    FontAwesomeIcon,
  },
  setup() {
    const posts = ref<Post[]>([]);
    const displayedPosts = ref<Post[]>([]);
    const selectedPost = ref<Post | null>(null);
    const searchQuery = ref<string>('');
    const router = useRouter();
    const postsPerPage = ref<number>(10);
    const currentPage = ref<number>(0);

    const loadPosts = async () => {
      const { data, error } = await supabase.from('blog_post').select('*');
      if (error) {
        console.error('Error fetching posts:', error.message);
        return;
      }
      const loadedPosts = (data || []).map((post) => ({
        id: post.id,
        title: post.title,
        content: '',
        bodyContent: '',
        userId: post.user_id,
        userFullName: post.user_full_name || 'Unknown',
        date: post.created_at,
      }));
      loadedPosts.sort(() => Math.random() - 0.5); // Shuffle posts
      posts.value = loadedPosts;
      updateDisplayedPosts();
    };

    const fetchPostContent = async (filePath: string) => {
      try {
        const { data, error } = await supabase.storage.from('blog-post').download(filePath);
        if (error) throw error;
        return await data.text();
      } catch (error) {
        console.error('Error fetching post content:', error.message);
        return '';
      }
    };

    const viewPost = async (post: Post) => {
      const { data, error } = await supabase
        .from('blog_post')
        .select('id, user_id, blog_id')
        .eq('id', post.id)
        .single();

      if (error) {
        console.error('Error fetching post details:', error.message);
        return;
      }

      const { user_id, blog_id } = data;
      const filePath = `${user_id}/${blog_id}.html`;
      const htmlContent = await fetchPostContent(filePath);
      const { title, bodyContent } = extractPostElements(htmlContent);

      selectedPost.value = { ...post, title, bodyContent };
      
      localStorage.setItem('user_id', user_id);
      localStorage.setItem('blog_id', blog_id);

      router.push({ name: 'BlugReader', query: { blogId: blog_id.toString() } });
    };

    const sharePost = (post: Post) => {
      const rawPost = toRaw(post); // Unwrap the proxy to get the raw object

      // Generate a shareable URL (assuming you have a route to view individual posts)
      const shareableURL = `${window.location.origin}/post/${rawPost.id}`;

      // Copy the URL to the clipboard
      navigator.clipboard.writeText(shareableURL).then(() => {
        console.log('URL copied to clipboard:', shareableURL);
        alert('Link copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy text: ', err);
      });
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

    const updateDisplayedPosts = () => {
      const start = currentPage.value * postsPerPage.value;
      const end = start + postsPerPage.value;
      displayedPosts.value = filteredPosts.value.slice(start, end);
    };

    const filteredPosts = computed(() => {
      const query = searchQuery.value.toLowerCase();
      return posts.value.filter((post) => post.title?.toLowerCase().includes(query));
    });

    const prevPage = () => {
      if (currentPage.value > 0) {
        currentPage.value--;
        updateDisplayedPosts();
      }
    };

    const nextPage = () => {
      if ((currentPage.value + 1) * postsPerPage.value < filteredPosts.value.length) {
        currentPage.value++;
        updateDisplayedPosts();
      }
    };

    const hasPrevPage = computed(() => currentPage.value > 0);
    const hasNextPage = computed(() => (currentPage.value + 1) * postsPerPage.value < filteredPosts.value.length);

    onMounted(() => {
      loadPosts();
      const updatePostsPerPage = () => {
        postsPerPage.value = 10; // Always display 10 posts per page
        updateDisplayedPosts();
      };

      window.addEventListener('resize', updatePostsPerPage);
      updatePostsPerPage();

      return () => {
        window.removeEventListener('resize', updatePostsPerPage);
      };
    });

    watch(searchQuery, updateDisplayedPosts);

    return {
      displayedPosts,
      selectedPost,
      viewPost,
      searchQuery,
      prevPage,
      nextPage,
      hasPrevPage,
      hasNextPage,
      sharePost,
    };
  },
});
</script>

<style scoped>
.blug-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-right: 50px;
  padding-left: 50px;
  padding-top: 63px;
}

.content {
  display: flex;
  flex-direction: column;
  width: 100%;
  background-color: #1e2127;
}

.search-bar {
  display: flex;
  justify-content: center;
  padding: 10px;
}

.search-bar input {
  width: 50%;
  padding: 10px;
  font-size: 14px;
  border: none;
  background-color: #2b3138;
  color: #d7c9b7;
  border-radius: 10px;
}

.container {
  display: flex;
  flex-direction: column;
  width: 100%;
  background: linear-gradient(45deg, #202329, #4e545b);
}

.top-column {
  width: 100%;
  overflow-y: hidden;
}

.top-container {
  padding: 20px;
  background-color: none;
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.blog-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr); /* Display in 4 columns */
  gap: 10px;
  justify-content: center;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #444;
  padding: 0;
  border-radius: 10px;
  width: 100%;
  overflow: hidden;
  justify-content: space-between;
  transition: transform 0.2s;
}

li:hover {
  transform: scale(1.05);
}

.title-row {
  width: 100%;
  text-align: center;
  padding: 10px;
}

.post-title {
  font-size: 14px;
  color: #fff;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  white-space: normal;
  padding-left: 10px;
  padding-right: 10px;
}

.button-row {
  display: flex;
  width: 100%;
}

.read-button {
  width: 65%;
  background-color: #fd662f;
  color: white;
  border: none;
  border-radius: 4px 0 0 4px;
  padding: 10px;
}

.read-button:hover {
  background-color: #e04a2e;
}

.share-button {
  width: 35%;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 0 4px 4px 0;
  padding: 10px;
}

.share-button:hover {
  background-color: #0056b3;
}

.navigation-buttons {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  gap: 10px;
}

.navigation-buttons button {
  background-color: #fd662f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  margin: 10px;
}

.navigation-buttons button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.blog-header {
  display: flex;
  justify-content: center;
  color: #cebfad;
}

@media (max-width: 430px) {
  .blug-page {
    padding-right: 1px;
    padding-left: 1px;
    padding-top: 140px;
  }

  .blog-list {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .search-bar input {
    width: 100%;
    padding: 10px;
    font-size: 12px;
  }
}
</style>
