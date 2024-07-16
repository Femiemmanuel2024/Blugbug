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
              <li class="list-container" v-for="(post, index) in filteredPosts" :key="index">
                <div class="post-title-container">
                  <span class="post-title" @click="viewPost(index)">{{ post.title }}</span>
                </div>
                <div class="post-actions">
                  <button @click="viewPost(index)">Read</button>
                </div>
              </li>
            </ul>
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
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import NavBar from './NavBar.vue';
import { supabase } from './supabase';
import InteractivePage from './features/InteractionPage.vue';

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
  },
  setup() {
    const posts = ref<Post[]>([]);
    const selectedPost = ref<Post | null>(null);
    const currentComponentKey = ref<number>(0);
    const searchQuery = ref<string>('');
    const route = useRoute();

    const fetchPostsFromDatabase = async () => {
      const { data, error } = await supabase.from('blog_post').select('*');

      if (error) {
        console.error('Error fetching posts:', error.message);
        return [];
      }

      return data || [];
    };

    const fetchPostContent = async (filePath: string) => {
      const { data, error } = await supabase.storage.from('blog-post').download(filePath);

      if (error) {
        console.error('Error fetching post content:', error.message);
        return '';
      }

      return data ? await data.text() : '';
    };

    const loadPosts = async () => {
      const postFiles = await fetchPostsFromDatabase();

      const loadedPosts = await Promise.all(
        postFiles.map(async (post) => {
          const filePath = `${post.user_id}/${post.blog_id}.html`;
          const htmlContent = await fetchPostContent(filePath);
          const { title, bodyContent } = extractPostElements(htmlContent);
          return {
            id: post.id,
            title: title || post.title,
            content: htmlContent,
            bodyContent,
            userId: post.user_id,
            userFullName: post.user_full_name || 'Unknown',
            date: post.created_at,
          };
        })
      );

      posts.value = loadedPosts;
    };

    const viewPost = async (index: number) => {
      const post = posts.value[index];

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
      const filePath = `${user_id}/${blog_id}.html`;
      const htmlContent = await fetchPostContent(filePath);
      const { title, bodyContent } = extractPostElements(htmlContent);

      selectedPost.value = { ...post, title, bodyContent };
      currentComponentKey.value += 1;

      localStorage.setItem('user_id', user_id);
      localStorage.setItem('blog_id', blog_id);
      localStorage.setItem('id', id);
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

    const filteredPosts = computed(() =>
      posts.value.filter((post) => post.title?.toLowerCase().includes(searchQuery.value.toLowerCase()))
    );

    onMounted(() => {
      loadPosts().then(() => {
        const searchParam = route.query.search as string;
        if (searchParam) {
          searchQuery.value = searchParam;
          const postIndex = posts.value.findIndex(post => post.title?.toLowerCase() === searchParam.toLowerCase());
          if (postIndex !== -1) {
            viewPost(postIndex);
          }
        }
      });
    });

    return {
      posts,
      selectedPost,
      viewPost,
      currentComponentKey,
      searchQuery,
      filteredPosts,
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
  padding-top: 82px;
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
  background-color: #2b3138; /* Background color */
  color: #d7c9b7; /* Text color */
  padding-right: 30px; /* Add space for the icon */
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
  padding: 10px;
  border-radius: 10px;
}

.post-title-container {
  width: 100%;
  text-align: center;
  margin-bottom: 10px;
}

.post-title {
  font-size: 14px;
  cursor: pointer;
  color: #fff;
  text-align: left;
}

.post-title:hover {
  color: #fd662f;
}

.post-actions {
  display: flex;
  justify-content: center;
}

button {
  padding: 5px 10px;
  background-color: #fd662f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #e04a2e;
}

h2 {
  color: #cebfad;
  font-size: 2rem;
}

.postbody {
  color: #cebfad;
  font-size: 1rem;
}

.blog-header{
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

  ul {
    display: block;
  }

  li {
    display: block;
    margin-bottom: 5px;
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
  background-color: #2b3138; /* Background color */
  color: #d7c9b7; /* Text color */
  padding-right: 30px; /* Add space for the icon */
  font-size: 14px;
  border-radius: 10px;
}
}

.list-container {
  display: flex;
  flex-direction: column;
}


</style>
