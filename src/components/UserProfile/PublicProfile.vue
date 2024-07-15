<template>
  <div class="new-user-page">
    <NavBar />
    <div class="content">
      <div class="left-column">
        <ProfileHeader 
          :userId="userId" 
          :totalLikes="totalLikes" 
          :totalBookmarks="totalBookmarks"
          :followingCount="followingCount" 
          :followersCount="followersCount"
          :disableUpload="true"
        />
        <FollowButton :userId="userId" />
        <BlogPosts :posts="posts" @likePost="likePost" @bookmarkPost="bookmarkPost" />
        <PublicFeed />
      </div>
      <div class="right-column">
        <InfoData />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '../supabase';
import NavBar from '../NavBar.vue';
import ProfileHeader from '../features/ProfileHeader.vue';
import FollowButton from './FollowButton.vue';
import BlogPosts from '../features/BlogPosts.vue';
import InfoData from '../infofeatures/InfoData.vue';
import PublicFeed from './PublicFeed.vue';

interface User {
  id: string;
  fullName: string;
  chatterName: string;
  aboutMe: string;
  email: string;
  profile_image_url: string;
  header_image_url: string;
  followers: number;
  following: number;
}

interface Post {
  id: number;
  title: string;
  content: string;
  likes: number;
  bookmarked: boolean;
  user: string;
  userFullName: string;
  date: string;
}

export default defineComponent({
  name: 'PublicProfile',
  components: {
    NavBar,
    ProfileHeader,
    FollowButton,
    BlogPosts,
    InfoData,
    PublicFeed,
  },
  setup() {
    const route = useRoute();
    const userId = ref<string>(Array.isArray(route.params.userId) ? route.params.userId[0] : route.params.userId);
    const user = ref<User | null>(null);
    const posts = ref<Post[]>([]);
    const totalLikes = ref<number>(0);
    const totalBookmarks = ref<number>(0);
    const followingCount = ref<number>(0);
    const followersCount = ref<number>(0);

    const fetchUserData = async () => {
      console.log(`Fetching data for user ID: ${userId.value}`);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId.value)
        .single();

      if (error) {
        console.error('Error fetching user data:', error.message);
        return;
      }

      if (data) {
        user.value = {
          id: data.id,
          fullName: data.full_name,
          chatterName: data.chatter_name,
          aboutMe: data.about_me,
          email: data.email,
          profile_image_url: data.profile_image_url || '/src/assets/Default_pfp.svg',
          header_image_url: data.header_image_url || 'default-header-image-path',
          followers: data.followers,
          following: data.following,
        };
        followersCount.value = data.followers;
        followingCount.value = data.following;
        fetchUserPosts();
      }
    };

    const fetchUserPosts = async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId.value);

      if (error) {
        console.error('Error fetching user posts:', error.message);
        return;
      }

      if (data) {
        posts.value = data;
        totalLikes.value = posts.value.reduce((acc, post) => acc + post.likes, 0);
        totalBookmarks.value = posts.value.filter(post => post.bookmarked).length;
      }
    };

    const likePost = (index: number) => {
      posts.value[index].likes++;
    };

    const bookmarkPost = (index: number) => {
      posts.value[index].bookmarked = !posts.value[index].bookmarked;
    };

    watch(() => route.params.userId, (newUserId) => {
      if (newUserId) {
        userId.value = Array.isArray(newUserId) ? newUserId[0] : newUserId;
        fetchUserData();
      }
    });

    onMounted(() => {
      fetchUserData();
    });

    return {
      userId,
      user,
      posts,
      totalLikes,
      totalBookmarks,
      followingCount,
      followersCount,
      likePost,
      bookmarkPost,
    };
  },
});
</script>

<style scoped>
.new-user-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #ffffff;
  padding-right: 50px;
  padding-left: 50px;
  padding-top: 82px;
}

.navbar {
  flex-shrink: 0;
}

.content {
  display: flex;
  flex-grow: 1;
  width: 100%;
}

.left-column {
  width: 75%;
  overflow-y: auto;
  height: 100%;
  background-color: #2b3138;
}

.feed-container {
  padding: 10px;
  border: solid 5px #0c1118;
}

.right-column {
  width: 25%;
  background-color: #1e2127;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

button {
  width: 15%;
  padding: 10px;
  margin-left: 15px;
  font-size: 16px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  margin-top: 10px;
  background-color: #fd662f; /* Button color */
  color: white; /* White text */
  position: absolute;
  right: 400px;
  top: 310px;
}
</style>
