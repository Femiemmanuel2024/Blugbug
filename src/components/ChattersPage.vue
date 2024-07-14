<template>
  <div class="chatters-page">
    <NavBar />
    <div class="content">
      <div class="container">
        <div class="left-column">
          <div class="left-title">
            <h1 class="blog-header">All Blog Posts</h1>
          </div>
          <div class="left-container">
            <ul>
              <li class="list-container" v-for="(post, index) in posts" :key="index">
                <span class="post-title" @click="viewPost(index)">{{ post.title }}</span>
                <div class="post-actions">
                  <button @click="viewPost(index)">Read</button>
                  <button @click="deletePost(index)">Delete</button>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div class="right-column">
          <div v-if="selectedPost" :key="currentComponentKey">
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
import { defineComponent, ref, onMounted } from 'vue';
import NavBar from './NavBar.vue';
import { supabase } from './supabase'; // Make sure the correct path is used
import InteractivePage from './features/InteractionPage.vue'; // Import the InteractivePage component

interface Post {
  id: number;
  title: string | null; // Allow title to be string or null
  content: string;
  bodyContent: string; // Added field for body content
  userId: string;
  userFullName: string;
  date: string;
}

export default defineComponent({
  name: 'ChattersPage',
  components: {
    NavBar,
    InteractivePage,
  },
  setup() {
    const posts = ref<Post[]>([]);
    const selectedPost = ref<Post | null>(null);
    const currentComponentKey = ref<number>(0); // Key to force component re-render

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
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = currentUser.id;
      const postFiles = await fetchPostsFromBucket(userId);

      const loadedPosts = await Promise.all(
        postFiles.map(async (file) => {
          const htmlContent = await fetchPostContent(`${userId}/${file.name}`);
          const { title, content, bodyContent } = extractPostElements(htmlContent);
          return {
            id: Date.now(), // You might want to use a better ID
            title,
            content,
            bodyContent,
            userId,
            userFullName: currentUser.fullName || 'Unknown', // Adjust according to your user structure
            date: new Date().toISOString(),
          };
        })
      );

      posts.value = loadedPosts;
    };

    const viewPost = async (index: number) => {
      const post = posts.value[index];

      const { data, error } = await supabase
        .from('blog_post')
        .select('id, user_id')
        .eq('title', post.title)
        .single();

      if (error) {
        console.error('Error fetching post details:', error.message);
        return;
      }

      const { id, user_id } = data;

      // Clear local storage and save new user.id and blog.id
      localStorage.removeItem('user_id');
      localStorage.removeItem('blog_id');
      localStorage.setItem('user_id', user_id);
      localStorage.setItem('blog_id', id);

      // Log to verify
      console.log(`User ID: ${user_id}, Blog Post ID: ${id}`);
      console.log('Stored User ID:', localStorage.getItem('user_id'));
      console.log('Stored Blog ID:', localStorage.getItem('blog_id'));

      selectedPost.value = post;
      currentComponentKey.value += 1; // Update the key to force re-render
    };

    const deletePost = async (index: number) => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = currentUser.id;
      const post = posts.value[index];
      const filePath = `${userId}/${post.title}.html`;

      const { error } = await supabase.storage
        .from('blog-post')
        .remove([filePath]);

      if (error) {
        console.error('Error deleting post:', error.message);
        return;
      }

      posts.value.splice(index, 1);
      localStorage.setItem(`${userId}_blogPosts`, JSON.stringify(posts.value));
    };

    const formatDate = (dateString: string) => {
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const formatTime = (dateString: string) => {
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      };
      return new Date(dateString).toLocaleTimeString(undefined, options);
    };

    onMounted(() => {
      loadPosts();
    });

    return {
      posts,
      selectedPost,
      viewPost,
      deletePost,
      currentComponentKey,
      formatDate,
      formatTime,
    };
  },
});
</script>

<style scoped>
.chatters-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-right: 50px;
  padding-left: 50px;
}

.navbar {
  flex-shrink: 0;
}

.content {
  display: flex;
  flex-grow: 1;
  width: 100%;
}

.container {
  display: flex;
  width: 100%;
  background: linear-gradient(45deg, #202329, #4e545b);
}

.left-column {
  width: 25%;
  padding: 20px;
  background-color: none;
  overflow-y: hidden;
}

.left-container {
  padding: 20px;
  background-color: none; /* Container background color */
  border-radius: 10px;
  text-align: left;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.left-title  {
  background-color: #1e2127;
  width: 100%;
  padding: 2px;
}

.left-title h1{
  text-align: center;
  width: 100%;
  font-size: 14px;
  justify-content: center;
  color: #cebfad;
}

.right-column {
  width: 75%;
  padding: 20px;
  background-color: #1e2127;
  overflow-y: auto;
  color: #cebfad;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.post-title {
  flex: 1;
  font-size: 14px;
  cursor: pointer;
  color: #cebfad;
  text-align: left; /* Left align the post titles */
}

.post-title:hover {
  color: #fd662f;
}

.post-actions {
  display: flex;
  gap: 10px;
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

@media (max-width: 430px) {
  .chatters-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-right: 1px;
  padding-left: 1px;
}

  .container {
    flex-direction: column;
  }
  
  

  .left-column {
    order: 1;
    width: 90%;
  }

  .right-column {
    order: 2;
    width: 88%;
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
}

.list-container{
  display: flex;
}
</style>
