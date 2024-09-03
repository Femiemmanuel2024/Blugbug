<template>
  <div class="latest-blogs">
    <div class="top-row">
      <h3>Latest Blugs</h3>
    </div>
    <div class="bottom-row">
      <ul>
        <li v-if="isLoading">
          <span>Loading...</span>
        </li>
        <li v-else v-for="(blog, index) in latestBlogs" :key="index">
          <span class="title">{{ truncateTitle(blog.title) }}</span>
          <button @click="readBlog(blog.blogId)">Read</button>
        </li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabase'; // Adjust the path as needed

interface Blog {
  title: string;
  date: string;
  blogId: string; // Added blogId to be used for navigation
}

export default defineComponent({
  name: 'LatestBlogs',
  setup() {
    const latestBlogs = ref<Blog[]>([]);
    const isLoading = ref<boolean>(true);
    const router = useRouter();

    const fetchLatestBlogs = async () => {
      isLoading.value = true;
      latestBlogs.value = [];

      // Fetch top 5 latest blogs sorted by date and time without downloading content
      const { data, error } = await supabase
        .from('blog_post')
        .select('title, date, blog_id')
        .order('date', { ascending: false })
        .order('time', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching latest blog posts:', error.message);
        isLoading.value = false;
        return;
      }

      // Map the fetched data to the latestBlogs array
      latestBlogs.value = data.map((post) => ({
        title: post.title,
        date: post.date,
        blogId: post.blog_id,
      }));

      isLoading.value = false;
    };

    const truncateTitle = (title: string) => {
      return title.length > 35 ? title.substring(0, 35) + '...' : title;
    };

    const readBlog = (blogId: string) => {
      router.push({ name: 'BlugReader', query: { blogId } });
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
}

.top-row {
  flex: 0 0 auto;
  margin-bottom: 30px;
  margin-top: 0px;
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
  padding-top: 7px;
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
