<template>
  <div class="blug-page">
    <NavBar />
    <CreateBlogButton/>

    <div class="content">
      
      <!-- Chatter Info -->
      <div class="centered-chatter-name">
        <img :src="profileImageUrl || defaultProfileImageUrl" alt="Profile Image" class="profile-image" />
        <h2>{{ chatterName ? 'Hi, ' + chatterName : '' }}</h2>
      </div>

      <!-- Search Bar -->
      <div class="search-bar">
        <div class="search-input-container">
          <input type="text" v-model="searchQuery" placeholder="Search..." />
          <div class="search-icon">
            <font-awesome-icon :icon="['fas', 'magnifying-glass']" />
          </div>
        </div>
      </div>

      <!-- Filter Buttons -->
      <div class="filter-buttons">
        <button @click="fetchPosts('date')" :class="{ active: currentFilter === 'date' }">Recent</button>
        <button @click="fetchPosts('interest')" :class="{ active: currentFilter === 'interest' }">Interest</button>
        <button @click="fetchPosts('trending')" :class="{ active: currentFilter === 'trending' }">Trending</button>
      </div>

       <!-- Loading Modal -->
       

      <!-- Post List -->
      <div class="container">
        <div v-if="loading" class="loading-modal">
        <p>Loading...</p>
      </div>
        <div class="top-column">
          <div class="top-title">
            <h1 class="blog-header">BlugWorld</h1>
          </div>
          <div class="top-container">
            <ul class="blog-list">
              <li class="list-container" v-for="(post, index) in displayedPosts" :key="index">
                <div class="image-row">
                  <img :src="post.imageUrl" alt="Blog Image" class="post-image" />
                </div>
                <div class="title-row">
                  <div :style="getTitleStyle(post.title)" class="post-title">{{ post.title }}</div>
                  <div class="post-categories" style="font-style: italic; font-size: 13px; color:#e04a2e;">{{ post.categories }}</div>
                </div>
                <div class="written-by">
                  <span>Written by {{ post.userFullName }}</span>
                </div>
                <div class="bottom-row">
                  <button class="read-button" @click="viewPost(post)">Read</button>
                  <div class="likes-count">
                    <span class="like-icon">
                      <font-awesome-icon :icon="['fas', 'heart']" />
                    </span>
                    {{ formattedLikes(post.likes) }}
                  </div>
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
    <FooterNav />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import NavBar from './NavBar.vue';
import { supabase } from './supabase';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import FooterNav from './v2.0/FooterNav.vue';
import CreateBlogButton from './features/CreateBlogButton.vue';

interface Post {
  blog_id: string;
  title: string | null;
  userId: string;
  userFullName: string;
  date: string;
  imageUrl: string;
  likes: number;
  categories: string;
}

export default defineComponent({
  name: 'BlugPage',
  components: {
    NavBar,
    FontAwesomeIcon,
    FooterNav,
    CreateBlogButton,
  },
  setup() {
    const posts = ref<Post[]>([]);
    const displayedPosts = ref<Post[]>([]);
    const searchQuery = ref<string>('');
    const chatterName = ref<string | null>(null);
    const profileImageUrl = ref<string | null>(null);
    const defaultProfileImageUrl = '/Default_pfp.svg';
    const router = useRouter();
    const postsPerPage = ref<number>(16);
    const currentPage = ref<number>(0);
    const placeholderImageUrl = '/blug_default.png';
    const currentFilter = ref<string>('date');
    const loading = ref<boolean>(false); // Loading state

    const loadChatterNameAndProfileImage = async () => {
      const currentUser = localStorage.getItem('currentUser');
      const userId = currentUser ? JSON.parse(currentUser).id : null;
      if (!userId) return;
      const { data, error } = await supabase
        .from('users')
        .select('chatter_name, profile_image_url')
        .eq('id', userId)
        .single();

      if (!error && data) {
        chatterName.value = data.chatter_name;
        profileImageUrl.value = data.profile_image_url || defaultProfileImageUrl;
      }
    };

    const fetchPosts = async (filter: string) => {
      currentFilter.value = filter;
      loading.value = true; // Start loading

      let query = supabase.from('blog_post').select('blog_id, title, user_id, created_at, likes, categories');

      // Fetch posts based on selected filter
      if (filter === 'date') {
        query = query.order('created_at', { ascending: false });
      } else if (filter === 'interest') {
        const currentUser = localStorage.getItem('currentUser');
        const userId = currentUser ? JSON.parse(currentUser).id : null;
        if (!userId) return;

        const { data: userInterest, error: interestError } = await supabase
          .from('users')
          .select('interest_id')
          .eq('id', userId)
          .single();

        if (interestError || !userInterest) {
          console.error('Error fetching user interest:', interestError?.message);
          loading.value = false; // End loading if error
          return;
        }

        const interestArray = userInterest.interest_id.split(',');

        query = query.or(
          interestArray
            .map((interest) => `categories.ilike.%${interest.trim()}%`)
            .join(',')
        );
      } else if (filter === 'trending') {
        query = query.order('likes', { ascending: false });
      }

      const { data: postsData, error } = await query;
      if (error) {
        console.error('Error fetching posts:', error.message);
        loading.value = false; // End loading if error
        return;
      }

      // Fetch images and full names for the posts
      const loadedPosts = await Promise.all(
        (postsData || []).map(async (post) => {
          const filePath = `${post.user_id}/${post.blog_id}/header-image.webp`;
          const imageUrl = await fetchImage(filePath);
          const userFullName = await fetchUserFullName(post.user_id);

          return {
            blog_id: post.blog_id,
            title: post.title,
            userId: post.user_id,
            userFullName: userFullName || 'Unknown',
            date: post.created_at,
            imageUrl: imageUrl || placeholderImageUrl,
            likes: post.likes || 0,
            categories: post.categories || 'Uncategorized',
          };
        })
      );

      posts.value = loadedPosts;
      updateDisplayedPosts();
      loading.value = false; // End loading
    };

    const fetchImage = async (filePath: string) => {
      const { data } = supabase.storage.from('blog-post').getPublicUrl(filePath);
      if (!data || !data.publicUrl) {
        return placeholderImageUrl;
      }
      return data.publicUrl;
    };

    const fetchUserFullName = async (userId: string) => {
      const { data, error } = await supabase.from('users').select('full_name').eq('id', userId).single();
      if (error) {
        console.error('Error fetching user full name:', error.message);
        return 'Unknown';
      }
      return data.full_name;
    };

    const viewPost = (post: Post) => {
      const blogId = post.blog_id;
      localStorage.setItem('user_id', post.userId);
      localStorage.setItem('blog_id', blogId);

      router.push({ name: 'BlugReader', query: { blogId: blogId } });
    };

    const formattedLikes = (likes: number) => {
      if (likes >= 1000) {
        return (likes / 1000).toFixed(1) + 'k';
      }
      return likes.toString();
    };

    const getTitleStyle = (title: string | null) => {
      if (title && title.length > 23) {
        return { fontSize: '12px' };
      }
      return { fontSize: '16px' };
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
      loadChatterNameAndProfileImage();
      fetchPosts('date'); // Load default filter (Recent) on mount
      const updatePostsPerPage = () => {
        postsPerPage.value = 16;
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
      viewPost,
      searchQuery,
      prevPage,
      nextPage,
      hasPrevPage,
      hasNextPage,
      formattedLikes,
      chatterName,
      profileImageUrl,
      placeholderImageUrl,
      defaultProfileImageUrl,
      fetchPosts,
      currentFilter,
      getTitleStyle,
      loading, // Expose loading state
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
  padding: 20px;
}

.search-input-container {
  display: flex;
  align-items: center;
  background-color: #2b3138;
  border-radius: 25px;
  padding: 5px 10px;
  width: 50%;
  height: 30px;
  overflow: hidden;
  justify-content: space-between;
}

.search-input-container input {
  flex-grow: 1;
  border: none;
  background: none;
  color: #d7c9b7;
  padding: 10px;
  font-size: 16px;
  border-radius: 25px 0 0 25px;
  outline: none;
}

.search-icon {
  background: none;
  border: none;
  padding: 30px 70px 30px 70px;
  margin-left: 10px;
  cursor: pointer;
  color: #d7c9b7;
  background-color: #e04a2e;
  left: 10px;
  position: relative;
}

.search-icon:hover {
  color: #ffffff;
}

.centered-chatter-name {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px 20px 0px 20px;
  color: #d7c9b7;
  font-weight: bold;
}

.profile-image {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-right: 10px;
  border: 2px solid #ffffff;
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
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  justify-content: center;
  padding-left: 40px;
  padding-right: 40px;
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
  border-radius: 10px;
  width: 250px;
  height: 300px;
  overflow: hidden;
  justify-content: space-between;
  transition: transform 0.2s;
}

li:hover {
  transform: scale(1.05);
}

.image-row {
  width: 100%;
  height: 70%;
  overflow: hidden;
}

.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.post-image:hover {
  transform: scale(1.1);
}

.title-row {
  padding: 5px;
  text-align: center;
  background-color: #333;
  color: white;
  width: 100%;
  font-size: 16px;
}

.written-by {
  padding: 5px;
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
  color: #ffffff;
  font-size: 12px;
}

.bottom-row {
  display: flex;
  width: 100%;
  padding: 10px;
  background-color: #333;
  color: white;
  height: 10%;
  justify-content: center;
}

.likes-count {
  font-size: 14px;
  padding: 10px;
  margin-right: 0px;
}

.like-icon {
  color: red;
}

.read-button {
  width: 65%;
  background-color: #fd662f;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px;
  cursor: pointer;
}

.read-button:hover {
  background-color: #e04a2e;
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
  margin-bottom: 0px;
  margin-top: 20px;
  font-size: 20px;
  font-weight: bold;
}

.post-categories {
  padding-top: 5px;
}

.loading-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6); /* Semi-transparent background */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-modal p {
  font-size: 24px;
  color: white;
}

@supports (-ms-ime-align: auto) {
  .blog-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    justify-content: center;
    padding-left: 40px;
    padding-right: 40px;
  }
}

@media (max-width: 430px) {
  .bottom-row {
    display: flex;
    width: 100%;
    justify-content: center;
    padding: 10px;
    background-color: #333;
    color: white;
    height: 20%;
  }

  .blug-page {
    padding-right: 1px;
    padding-left: 1px;
    padding-top: 120px;
  }

  .blog-list {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0px;
  }

  .search-input-container {
    width: 90%;
  }

  .search-input-container input {
    font-size: 14px;
  }

  li {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: #444;
    padding: 0;
    border-radius: 10px;
    width: 100%;
    height: 200px;
    overflow: hidden;
    justify-content: space-between;
    transition: transform 0.2s;
  }

  .search-icon {
    background: none;
    border: none;
    padding: 30px 100px 30px 40px;
    margin-left: 0px;
    cursor: pointer;
    color: #d7c9b7;
    background-color: #e04a2e;
  }
}

.filter-buttons {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 20px;
}

.filter-buttons button {
  background-color: #fd662f;
  color: white;
  border: none;
  padding: 10px 20px;
  cursor: pointer;
  border-radius: 4px;
}

.filter-buttons button:hover {
  background-color: #e04a2e;
}

.filter-buttons button.active {
  background-color: blue;
  color: white;
}
</style>
