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
        />
        <button @click="toggleCreate">{{ buttonText }}</button>
        <CreateBlogPost 
          v-if="isCreating" 
          :isModalVisible="isCreating" 
          @publishContent="onPublishContent"
          @closeModal="toggleCreate"
        />
        <div class="feed-container">
          <Feed />
        </div>
      </div>
      <div class="right-column">
        <InfoData />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, computed } from 'vue';
import NavBar from '../NavBar.vue';
import ProfileHeader from '../features/ProfileHeader.vue';
import CreateBlogPost from '../features/CreateBlogPost.vue';
import Feed from '../features/Feed.vue';
import InfoData from '../infofeatures/InfoData.vue';
import { supabase } from '../supabase';

interface User {
  id: string;
  fullName: string;
  chatterName: string;
  aboutMe: string;
  email: string;
  profile_image_url: string;
  header_image_url: string;
}

export default defineComponent({
  name: 'HomePage',
  components: {
    NavBar,
    ProfileHeader,
    CreateBlogPost,
    Feed,
    InfoData,
  },
  setup() {
    const userId = JSON.parse(localStorage.getItem('currentUser') || '{}').id;
    const user = ref<User | null>(null);
    const isCreating = ref<boolean>(false);
    const totalLikes = ref<number>(0);
    const totalBookmarks = ref<number>(0);
    const followingCount = ref<number>(0);
    const followersCount = ref<number>(0);

    const fetchUserData = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
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
        };
      }
    };

    const toggleCreate = () => {
      isCreating.value = !isCreating.value;
    };

    const onPublishContent = (newPost: { title: string; content: string }) => {
      // Handle the event when a new post is published, if needed
    };

    const handleLoginEvent = () => {
      window.dispatchEvent(new CustomEvent('user-logged-in'));
    };

    onMounted(() => {
      fetchUserData();
      handleLoginEvent(); // Call the login event handler on mount
    });

    const buttonText = computed(() => {
      return window.innerWidth <= 414 ? 'Create' : isCreating.value ? 'Cancel' : 'Create Blug Post';
    });

    return {
      userId,
      user,
      isCreating,
      totalLikes,
      totalBookmarks,
      followingCount,
      followersCount,
      toggleCreate,
      onPublishContent,
      buttonText,
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
}

.feed-container {
  background-color: #2b3138; /* Example background color for feed */
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
  border-radius: 10px;
  cursor: pointer;
  margin-top: 10px;
  background-color: #fd662f; /* Button color */
  color: white; /* White text */
  position: absolute;
  right: 370px;
  top: 295px;
}





@media (max-width: 430px) {

  .new-user-page {
  display: flex;
  flex-direction: column;
  }

  .right-column{
    display: none;
  }

 
  .left-column {
    width: 100%;
    overflow-y: auto;
    height: 100%;
  }

  .new-user-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #020202;
    padding-right: 1px;
    padding-left: 1px;
  }

  .navbar {
    max-width: 100%;
  }

  button {
    width: 30%;
    padding: 10px;
    margin-left: 15px;
    font-size: 16px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    margin-top: 10px;
    background-color: #fd662f; /* Button color */
    color: white; /* White text */
    position: absolute;
    right: 25px;
    top: 295px;
  }
}



</style>