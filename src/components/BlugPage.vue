<template>
  <div class="blug-page">
    <NavBar />
    <div class="content">
      <div class="centered-chatter-name">
        <img :src="profileImageUrl || defaultProfileImageUrl" alt="Profile Image" class="profile-image" />
        <h2>{{ chatterName ? 'Hi, ' + chatterName : '' }}</h2>
      </div>
      <div class="search-bar">
        <!-- Updated search bar design -->
        <div class="search-input-container">
          <input type="text" v-model="searchQuery" placeholder="Search..." />
          <div class="search-icon">
            <font-awesome-icon :icon="['fas', 'magnifying-glass']" />
          </div>
        </div>
      </div>
      <div class="container">
        <div class="top-column">
          <div class="top-title">
            <h1 class="blog-header">BlugWorld</h1>
          </div>
          <div class="top-container">
            <ul class="blog-list">
              <li class="list-container" v-for="(post, index) in displayedPosts" :key="index">
                <div class="image-row">
                  <!-- Use placeholder if imageUrl is not found -->
                  <img :src="post.imageUrl" alt="Blog Image" class="post-image" />
                </div>
                <div class="title-row">
                  <span class="post-title">{{ post.title }}</span>
                </div>
                <!-- Display categories in a simple container -->
                <div class="category-container">
                  <span v-for="category in post.categories" :key="category" class="category-badge">{{ category }}</span>
                </div>
                <div class="bottom-row">
                  <button class="read-button" @click="viewPost(post)">Read</button>
                  <div class="likes-count">
                    <span class="like-icon">
                      <font-awesome-icon :icon="['fas', 'heart']" />
                    </span>
                    {{ formattedLikes(post.likes) }}</div>
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

interface Post {
  id: number;
  title: string | null;
  userId: string;
  userFullName: string;
  date: string;
  imageUrl: string;
  likes: number;
  categories: string[]; // Add categories field
}

export default defineComponent({
  name: 'BlugPage',
  components: {
    NavBar,
    FontAwesomeIcon,
    FooterNav,
  },
  setup() {
    const posts = ref<Post[]>([]);
    const displayedPosts = ref<Post[]>([]);
    const searchQuery = ref<string>('');
    const chatterName = ref<string | null>(null);
    const profileImageUrl = ref<string | null>(null);
    const defaultProfileImageUrl = '/Default_pfp.svg'; // Default profile image path
    const router = useRouter();
    const postsPerPage = ref<number>(16); // Adjusted to display 16 cards per page
    const currentPage = ref<number>(0);
    const placeholderImageUrl = '/blug_default.png'; // Ensure this file exists in the public directory

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

    const loadPosts = async () => {
      const { data, error } = await supabase.from('blog_post').select('*');
      if (error) {
        console.error('Error fetching posts:', error.message);
        return;
      }
      const loadedPosts = await Promise.all(
        (data || []).map(async (post) => {
          const filePath = `${post.user_id}/${post.blog_id}/header-image.webp`; // Update to fetch image from blog ID folder
          const imageUrl = await fetchImage(filePath);

          return {
            id: post.id,
            title: post.title,
            userId: post.user_id,
            userFullName: post.user_full_name || 'Unknown',
            date: post.created_at,
            imageUrl: imageUrl || placeholderImageUrl, // Use placeholder if image URL is not found
            likes: post.likes || 0,
            categories: post.categories || [], // Add categories to post data
          };
        })
      );
      loadedPosts.sort(() => Math.random() - 0.5); // Shuffle posts
      posts.value = loadedPosts;
      updateDisplayedPosts();
    };

    const fetchImage = async (filePath: string) => {
      const { data } = supabase.storage.from('blog-post').getPublicUrl(filePath);
      if (!data || !data.publicUrl) {
        return placeholderImageUrl;  // Return placeholder if image URL is not found
      }
      return data.publicUrl;
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
      localStorage.setItem('user_id', user_id);
      localStorage.setItem('blog_id', blog_id);

      router.push({ name: 'BlugReader', query: { blogId: blog_id.toString() } });
    };

    const formattedLikes = (likes: number) => {
      if (likes >= 1000) {
        return (likes / 1000).toFixed(1) + 'k';
      }
      return likes.toString();
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
      loadPosts();
      const updatePostsPerPage = () => {
        postsPerPage.value = 16; // Display 16 posts per page
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
  outline: none; /* Remove input outline */
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

.search-icon .fa-magnifying-glass {
  font-size: 16px;
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
  height: 70%; /* Set height to 70% */
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
  height: 10%; /* Set height to 10% */
  padding: 10px;
  text-align: center;
  background-color: #333;
  color: white;
  width: 100%;
  font-size: 16px;
}

.category-container {
  height: 10%; /* Set height to 10% */
  justify-content: center;
  align-items: center;
  flex-wrap: nowrap;
}

.category-badge {
  background: none;
  color: #ffffff; /* Text color */
  font-size: 10px;
  margin: 2px;
  letter-spacing: -3px;
}

.bottom-row {
  display: flex;
  width: 100%;
  padding: 10px;
  background-color: #333;
  color: white;
  height: 10%; /* Set height to 10% */
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

@supports (-ms-ime-align: auto) {
  /* This block will only be applied in Microsoft Edge */
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
  height: 20%; /* Set height to 10% */
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
</style>