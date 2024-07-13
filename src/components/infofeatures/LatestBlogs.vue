<template>
  <div class="latest-blogs">
    <div class="top-row">
      <h3>Latest Blogs</h3>
    </div>
    <div class="bottom-row">
      <ul>
        <li v-if="isLoading">
          <span>Loading...</span>
        </li>
        <li v-else v-for="(blog, index) in latestBlogs" :key="index">
          <span class="title">{{ truncateTitle(blog.title) }}</span>
          <button @click="readBlog(blog.filePath)">Read</button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch } from 'vue';
import { supabase } from '../supabase'; // Adjust the path as needed

interface Blog {
  title: string;
  date: string;
  filePath: string;
}

export default defineComponent({
  name: 'LatestBlogs',
  setup() {
    const latestBlogs = ref<Blog[]>([]);
    const isLoading = ref<boolean>(true);

    const fetchUserIds = async () => {
      // Clear previous user IDs from local storage
      localStorage.removeItem('userIds');

      const { data, error } = await supabase
        .from('users')
        .select('id');

      if (error) {
        console.error('Error fetching user IDs:', error.message);
        return [];
      }

      const userIds = data.map((user: { id: string }) => user.id);
      // Save new user IDs to local storage
      localStorage.setItem('userIds', JSON.stringify(userIds));

      return userIds;
    };

    const fetchLatestBlogs = async () => {
      isLoading.value = true; // Start loading animation
      latestBlogs.value = []; // Clear previous data

      const userIds = await fetchUserIds();
      const allBlogs: Blog[] = [];

      for (const userId of userIds) {
        const { data, error } = await supabase.storage
          .from('blog-post')
          .list(userId, {
            limit: 100,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' },
          });

        if (error) {
          console.error(`Error fetching blog posts for user ${userId}:`, error.message);
          continue;
        }

        const userBlogs = await Promise.all(
          data.map(async (file) => {
            const filePath = `${userId}/${file.name}`;
            const { data, error } = await supabase.storage
              .from('blog-post')
              .download(filePath);

            if (error) {
              console.error('Error fetching blog content:', error.message);
              return null;
            }

            const content = data ? await data.text() : '';
            const parser = new DOMParser();
            const doc = parser.parseFromString(content, 'text/html');
            const title = doc.querySelector('h1')?.textContent || 'Untitled';
            const date = file.metadata?.created_at || new Date().toISOString();

            return { title, date, filePath };
          })
        );

        allBlogs.push(...userBlogs.filter((blog): blog is Blog => blog !== null));
      }

      allBlogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      latestBlogs.value = allBlogs.slice(0, 5);

      isLoading.value = false; // End loading animation
    };

    const truncateTitle = (title: string) => {
      return title.length > 15 ? title.substring(0, 15) + '...' : title;
    };

    const readBlog = (filePath: string) => {
      // Add logic to handle reading the blog, e.g., navigating to a detailed view page
      console.log(`Reading blog at: ${filePath}`);
    };

    const handleLoginEvent = () => {
      fetchLatestBlogs();
    };

    onMounted(() => {
      fetchLatestBlogs();
      window.addEventListener('user-logged-in', handleLoginEvent);
      setInterval(fetchLatestBlogs, 300000); // Refetch every 5 minutes
    });

    return {
      latestBlogs,
      truncateTitle,
      readBlog,
      isLoading,
    };
  },
});
</script>

<style scoped>
.latest-blogs {
  display: flex;
  flex-direction: column;
  background-color: #1e2127;
  padding: 1px;
  color: #ffffff;
  height: 100%;
  overflow: hidden;
  border-top: 1px solid #eaeaea;
  
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
  padding: 10px;
  font-size: 12px;
  border: none;
  box-sizing: border-box;
   /* Background color */
  color: #d7c9b7; /* Text color */
  padding: 10px;
  font-size: 12px;
  
}

.latest-blogs ul {
  list-style-type: none;
  padding: 0;
}

.latest-blogs li {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  
}

.latest-blogs .title {
  flex: 1;
  color: #ffffff;
}

.latest-blogs button {
  background-color: #fd662f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 5px 10px;
}

.latest-blogs button:hover {
  background-color: #e04a2e;
}
</style>
