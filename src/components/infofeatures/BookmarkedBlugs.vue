<template>
    <div class="bookmarked-blugs">
      <div class="top-row">
        <h3>Bookmarked Blugs</h3>
      </div>
      <div class="bottom-row">
        <ul>
          <li v-if="isLoading">
            <span>Loading...</span>
          </li>
          <li v-else v-for="(blog, index) in bookmarkedBlogs" :key="index">
            <span class="title">{{ truncateTitle(blog.title) }}</span>
            <button @click="readBlog(blog.title)">Read</button>
          </li>
        </ul>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, onMounted } from 'vue';
  import { supabase } from '../supabase'; // Adjust the path as needed
  import { useRouter } from 'vue-router';
  
  interface Blog {
    title: string;
    likes: number;
    filePath: string;
  }
  
  export default defineComponent({
    name: 'BookmarkedBlugs',
    setup() {
      const bookmarkedBlogs = ref<Blog[]>([]);
      const isLoading = ref<boolean>(true);
      const router = useRouter();
  
      const fetchBookmarkedBlogs = async () => {
        isLoading.value = true; // Start loading animation
        bookmarkedBlogs.value = []; // Clear previous data
  
        const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const userId = currentUser.id;
  
        if (!userId) {
          console.error('No user is currently logged in.');
          isLoading.value = false;
          return;
        }
  
        const { data, error } = await supabase
          .from('blog_post')
          .select('title, likes, user_id, blog_id, bookmarked_by')
          .contains('bookmarked_by', [userId]);
  
        if (error) {
          console.error('Error fetching bookmarked blog posts:', error.message);
          isLoading.value = false;
          return;
        }
  
        const allBlogs: Blog[] = await Promise.all(
          data.map(async (post) => {
            const filePath = `${post.user_id}/${post.blog_id}.html`;
            const { data: fileData, error: fileError } = await supabase.storage
              .from('blog-post')
              .download(filePath);
  
            if (fileError) {
              console.error('Error fetching blog content:', fileError.message);
              return null;
            }
  
            const content = fileData ? await fileData.text() : '';
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            const title = doc.querySelector('h1')?.textContent || 'Untitled';
  
            return { title, likes: post.likes, filePath };
          })
        );
  
        bookmarkedBlogs.value = allBlogs.filter((blog): blog is Blog => blog !== null);
  
        isLoading.value = false; // End loading animation
      };
  
      const truncateTitle = (title: string) => {
        return title.length > 15 ? title.substring(0, 15) + '...' : title;
      };
  
      const readBlog = (title: string) => {
        router.push({ name: 'BlugPage', query: { search: title } });
      };
  
      onMounted(() => {
        fetchBookmarkedBlogs();
        setInterval(fetchBookmarkedBlogs, 300000); // Refetch every 5 minutes
      });
  
      return {
        bookmarkedBlogs,
        truncateTitle,
        readBlog,
        isLoading,
      };
    },
  });
  </script>
  
  <style scoped>
  .bookmarked-blugs {
    display: flex;
    flex-direction: column;
    background-color: #1e2127;
    padding: 1px;
    color: #ffffff;
    height: 100%;
    overflow: hidden;
  }
  
  .top-row {
    flex: 0 0 auto;
    margin-bottom: 30px;
    margin-top: -20px;
    height: 10px;
  }
  
  .bottom-row {
    flex: 1 1 auto;
    overflow: hidden;
  }
  
  h3 {
    width: 100%;
    font-size: 20px;
    border: none;
    box-sizing: border-box;
    color: #d7c9b7;
    background-color: #2b3138;
    border-bottom: 1px solid wheat;
    padding-bottom: 7px;
    padding-left: 5px;
  }
  
  .bookmarked-blugs ul {
    list-style-type: none;
    padding: 0;
  }
  
  .bookmarked-blugs li {
    display: flex;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  
  .bookmarked-blugs .title {
    flex: 1;
    color: #ffffff;
  }
  
  .bookmarked-blugs button {
    background-color: #fd662f;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    padding: 5px 10px;
  }
  
  .bookmarked-blugs button:hover {
    background-color: #e04a2e;
  }
  </style>
  