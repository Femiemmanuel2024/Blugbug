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
        <div class="bottom-column">
          <div v-if="selectedPost" :key="currentComponentKey" class="blogcontainer">
            <h2>{{ selectedPost.title }}</h2>
            <div v-html="selectedPost.bodyContent" class="postbody"></div>
            <InteractivePage />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
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
    const currentComponentKey = ref<number>(0);
    const searchQuery = ref<string>('');
    const route = useRoute();
    const postsPerPage = ref<number>(10);
    const currentPage = ref<number>(0);

    // Fetch metadata of posts without their content
    const fetchPostsFromDatabase = async () => {
      const { data, error } = await supabase.from('blog_post').select('*');
      if (error) return [];
      return data || [];
    };

    // Fetch the actual content of the post on demand
    const fetchPostContent = async (filePath: string) => {
      console.log('Fetching file from path:', filePath); // Debugging: Log the file path
      try {
        const { data, error } = await supabase.storage.from('blog-post').download(filePath);
        if (error) throw error;
        if (data) {
          return await data.text();
        }
      } catch (error) {
        console.error('Error fetching post content:', error.message); // Log any errors encountered
        return '';
      }
    };

    const loadPosts = async () => {
      const postFiles = await fetchPostsFromDatabase();
      const loadedPosts = postFiles.map((post) => ({
        id: post.id,
        title: post.title,
        content: '', // Leave content empty initially
        bodyContent: '', // Leave bodyContent empty initially
        userId: post.user_id,
        userFullName: post.user_full_name || 'Unknown',
        date: post.created_at,
      }));
      loadedPosts.sort(() => Math.random() - 0.5); // Shuffle posts
      posts.value = loadedPosts;
      updateDisplayedPosts();
    };

    const updateDisplayedPosts = () => {
      const start = currentPage.value * postsPerPage.value;
      const end = start + postsPerPage.value;
      if (searchQuery.value) {
        displayedPosts.value = filteredPosts.value;
      } else {
        displayedPosts.value = filteredPosts.value.slice(start, end);
      }
    };

    // Fetch and display the content of the post when the user clicks "Read"
    const viewPost = async (post: Post) => {
      console.log('Post ID:', post.id);
      
      const { data, error } = await supabase
        .from('blog_post')
        .select('id, user_id, blog_id')
        .eq('id', post.id)
        .single();

      if (error) {
        console.error('Error fetching post details:', error.message);
        return;
      }

      const { id, user_id, blog_id } = data;
      console.log('User ID:', user_id);
      console.log('Blog ID:', blog_id);

      const filePath = `${user_id}/${blog_id}.html`;
      console.log('Fetching file from path:', filePath);
      
      const htmlContent = await fetchPostContent(filePath);
      const { title, bodyContent } = extractPostElements(htmlContent);

      selectedPost.value = { ...post, title, bodyContent };
      currentComponentKey.value += 1;

      // Update the URL without reloading the page
      window.history.pushState({}, '', `/blugpage?postId=${post.id}`);

      localStorage.setItem('user_id', user_id);
      localStorage.setItem('blog_id', blog_id);
      localStorage.setItem('id', id);
    };

    const sharePost = (post: Post) => {
      const postUrl = `${window.location.origin}/BlugPage?postId=${post.id}`;

      if (navigator.share) {
        navigator.share({
          title: post.title,
          url: postUrl
        }).then(() => {
          console.log('Thanks for sharing!');
        }).catch(console.error);
      } else {
        // Fallback for browsers that don't support Web Share API
        navigator.clipboard.writeText(postUrl).then(() => {
          alert('Link copied to clipboard!');
        }).catch(err => {
          console.error('Could not copy text: ', err);
        });
      }
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

    const filteredPosts = computed(() => {
      const query = searchQuery.value.toLowerCase();
      return posts.value.filter((post) =>
        post.title?.toLowerCase().includes(query)
      );
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
      loadPosts().then(() => {
        const postId = route.query.postId as string;
        if (postId) {
          const post = posts.value.find(post => post.id === parseInt(postId));
          if (post) {
            viewPost(post);
          }
        }
      });

      const updatePostsPerPage = () => {
        postsPerPage.value = window.innerWidth <= 430 ? 5 : 10;
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
      sharePost,
      currentComponentKey,
      searchQuery,
      prevPage,
      nextPage,
      hasPrevPage,
      hasNextPage,
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

.navbar {
  flex-shrink: 0;
}

.content {
  display: flex;
  flex-direction: column;
  flex-grow: 0;
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
  font-size: 12px;
  border: none;
  box-sizing: border-box;
  background-color: #2b3138;
  color: #d7c9b7;
  padding-right: 30px;
  font-size: 14px;
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
  background-color: none;
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
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
  justify-content: center;
}

.left-title {
  background-color: #1e2127;
  width: 100%;
  padding: 2px;
}

.left-title h1 {
  text-align: center;
  width: 100%;
  font-size: 14px;
  justify-content: center;
  color: #cebfad;
}

.bottom-column {
  width: 100%;
  background-color: #1e2127;
  overflow-y: auto;
  color: #cebfad;
}

.blogcontainer {
  padding: 20px;
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
  padding: 0px;
  border-radius: 10px;
  width: 200px;
  height: 100px;
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
  flex-grow: 1;
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
  line-clamp: 3;
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
  text-align: center;
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
  text-align: center;
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
  margin: 10px 10px;
}

.navigation-buttons button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

h2 {
  color: #cebfad;
  font-size: 2rem;
}

.postbody {
  color: #cebfad;
  font-size: 1rem;
}

.blog-header {
  display: flex;
  justify-content: center;
  color: #cebfad;
}

@media (max-width: 430px) {
  .blug-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    padding-right: 1px;
    padding-left: 1px;
    padding-top: 140px;
  }

  .container {
    flex-direction: column;
  }

  .top-column {
    order: 1;
    width: 100%;
  }

  .bottom-column {
    order: 2;
    width: 100%;
  }

  .blog-list {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  ul {
    display: block;
  }

  li {
    display: block;
    margin-bottom: 5px;
    height: 100px;
    width: 100%;
  }

  .post-title {
    text-align: left;
  }

  .search-bar input {
    width: 100%;
    padding: 10px;
    font-size: 12px;
    border: none;
    box-sizing: border-box;
    background-color: #2b3138;
    color: #d7c9b7;
    padding-right: 30px;
    font-size: 14px;
    border-radius: 10px;
  }
}

.list-container {
  display: flex;
  flex-direction: column;
}
</style>
