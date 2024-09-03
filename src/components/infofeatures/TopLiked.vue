<template>
  <div class="top-liked">
    <div class="top-row">
      <h3>Top Liked Blugs</h3>
    </div>
    <div class="bottom-row">
      <ul>
        <li v-if="isLoading">
          <span>Loading...</span>
        </li>
        <li v-else v-for="(blog, index) in topLikedBlogs" :key="index">
          <span class="title">{{ truncateTitle(blog.title) }}</span>
          <button @click="readBlog(blog.blogId)">Read</button>
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
  blogId: string; // Updated to use blogId for navigation
}

export default defineComponent({
  name: 'TopLiked',
  setup() {
    const topLikedBlogs = ref<Blog[]>([]);
    const isLoading = ref<boolean>(true);
    const router = useRouter();

    const fetchTopLikedBlogs = async () => {
      isLoading.value = true; // Start loading animation
      topLikedBlogs.value = []; // Clear previous data

      const { data, error } = await supabase
        .from('blog_post')
        .select('title, likes, user_id, blog_id')
        .order('likes', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching top liked blog posts:', error.message);
        isLoading.value = false;
        return;
      }

      const blogs = data.map((post) => ({
        title: post.title,
        likes: post.likes,
        blogId: post.blog_id, // Updated to include blogId
      }));

      topLikedBlogs.value = blogs;
      isLoading.value = false; // End loading animation
    };

    const truncateTitle = (title: string) => {
      return title.length > 35 ? title.substring(0, 35) + '...' : title;
    };

    const readBlog = (blogId: string) => {
      // Navigate to BlugReader page with the blogId
      router.push({ name: 'BlugReader', query: { blogId } });
    };

    onMounted(() => {
      fetchTopLikedBlogs();
      setInterval(fetchTopLikedBlogs, 300000); // Refetch every 5 minutes
    });

    return {
      topLikedBlogs,
      truncateTitle,
      readBlog,
      isLoading,
    };
  },
});
</script>

<style scoped>
.top-liked {
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
  padding-top: 5px;
}

.top-liked ul {
  list-style-type: none;
  padding: 0;
}

.top-liked li {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.top-liked .title {
  flex: 1;
  color: #ffffff;
}

.top-liked button {
  background-color: #fd662f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 5px 10px;
}

.top-liked button:hover {
  background-color: #e04a2e;
}
</style>
