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
        <div class="header-toggle">
          <h3 :class="{ active: currentComponent === 'Feed' }" @click="showBlug">Blug</h3>
          <h3 :class="{ active: currentComponent === 'InterestPage' }" @click="showInterestFeed">Interest-Based Feed</h3>
        </div>
        <div class="feed-container">
          <component :is="currentComponent" />
        </div>
      </div>
      <div class="right-column">
        <InfoData />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import NavBar from '../NavBar.vue';
import ProfileHeader from '../features/ProfileHeader.vue';
import Feed from '../features/FeedPage.vue';
import InterestPage from '../features/InterestPage.vue';
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
    Feed,
    InterestPage,
    InfoData,
  },
  setup() {
    const userId = JSON.parse(localStorage.getItem('currentUser') || '{}').id;
    const user = ref<User | null>(null);
    const totalLikes = ref<number>(0);
    const totalBookmarks = ref<number>(0);
    const followingCount = ref<number>(0);
    const followersCount = ref<number>(0);

    const currentComponent = ref('Feed');

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
          profile_image_url: data.profile_image_url || '/public/Default_pfp.svg',
          header_image_url: data.header_image_url || '/public/default-header-image-path',
        };
      }
    };

    const showBlug = () => {
      currentComponent.value = 'Feed';
    };

    const showInterestFeed = () => {
      currentComponent.value = 'InterestPage';
    };

    onMounted(() => {
      fetchUserData();
    });

    return {
      userId,
      user,
      totalLikes,
      totalBookmarks,
      followingCount,
      followersCount,
      currentComponent,
      showBlug,
      showInterestFeed,
    };
  },
});
</script>

<style scoped>
.new-user-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #000000;
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
  background-color: #2b3138;
  padding: 10px;
  border: solid 5px #0c1118;
  padding-right: 50px;
}

.header-toggle {
  display: flex;
  justify-content: space-around;
  cursor: pointer;
  background-color: #1e2127;
  padding: 10px;
  color: #cebfad;
}

.header-toggle h3 {
  margin: 0 10px;
  cursor: pointer;
}

.header-toggle h3:hover {
  color: #f53;
}

.header-toggle h3.active {
  color: rgb(255, 255, 255);
  border-bottom: 2px solid #f53;
}

.right-column {
  width: 25%;
  background-color: #1e2127;
  height: 100%;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

h3 {
  border-bottom: 1px solid #ccc;
  display: flex;
  justify-content: center;
  background-color: #f53;
  width: 100%;
  margin-left: 10px;
  border-radius: 10px 10px 0px 0px;
  max-height: 50px;
  padding: 10px;
}

@media (max-width: 430px) {
  .new-user-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background-color: #020202;
    padding-right: 1px;
    padding-left: 1px;
  }

  .content {
    flex-direction: column;
  }

  .left-column,
  .right-column {
    width: 100%;
    overflow-y: auto;
    height: auto;
  }

  .navbar {
    max-width: 100%;
  }
}
</style>
