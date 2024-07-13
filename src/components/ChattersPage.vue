<template>
  <div class="chatters-page">
    <NavBar />
    <div class="content">
      <div class="container"> <!-- Added container with red background -->
        <div class="left-column">
          <!-- Wrap the all blogpost and the blog titles in another container -->
          <div class="left-container">
            <!-- Highlighted part to edit the h1 size -->
            <h1 class="blog-header">All Blog Posts</h1>
            <ul>
              <li v-for="(post, index) in posts" :key="index">
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
import { defineComponent, ref, onMounted } from 'vue';
import NavBar from './NavBar.vue';
import { supabase } from './supabase'; // Make sure the correct path is used

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
  },
  setup() {
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

    const viewPost = (index: number) => {
      selectedPost.value = posts.value[index];
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

    onMounted(() => {
      loadPosts();
    });

    return {
      posts,
      selectedPost,
      viewPost,
      deletePost,
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

.blog-header {
  font-size: 2rem; /* Adjust the font size as needed */
}

.right-column {
  width: 75%;
  padding: 20px;
  border-left: 1px solid #ccc;
  background-color: #1e2127;
  overflow-y: auto;
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
  text-decoration: underline;
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
  font-size: 50px;
}

.postbody {
  color: #cebfad;
  font-size: 15px;
}
</style>
