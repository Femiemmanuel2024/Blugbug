<template>
  <div class="profile-header">
    <div class="header-image-container">
      <img :src="headerImage" alt="Header Image" class="header-image" />
      <label v-if="!disableUpload" class="upload-header-icon" @click="showFileUploadModal('header')">
        <i class="fas fa-camera"></i>
      </label>
    </div>
    <div class="profile-info-container">
      <div class="profile-picture-circle">
        <img :src="profilePicture" alt="Profile Picture" class="profile-image" />
        <label v-if="!disableUpload" class="upload-icon" @click="showFileUploadModal('profile')">
          <i class="fas fa-camera"></i>
        </label>
      </div>
      <button class="create-post-button" @click="showCreatePostModal">Create Blug</button>
    </div>
    <div class="name-container">
      <div class="name-wrapper">
        <h1 class="name">{{ user.fullName }}</h1>
        <div v-if="checkmarkIconUrl" class="checkmark-icon-circle">
          <img :src="checkmarkIconUrl" alt="Checkmark Icon" class="checkmark-icon" />
        </div>
      </div>
      <p class="chatter-name">@{{ user.chatterName }}</p>
    </div>
    <p class="about-me">{{ user.aboutMe }}</p>
    <div class="stats-container">
      <p>
        <strong>{{ formatCount(totalLikes) }}</strong> Likes
        <strong>{{ formatCount(totalBookmarks) }}</strong> Bookmarks
        <strong>{{ user.following }}</strong> Following
        <strong>{{ user.followers }}</strong> Followers
      </p>
    </div>
    <FileUpload v-if="showFileUpload" :type="uploadType" @uploadComplete="fetchUserData" @close="closeFileUploadModal" />
    <CreateBlogPost v-if="showCreatePost" :isModalVisible="showCreatePost" @closeModal="hideCreatePostModal" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { supabase } from '../supabase';
import FileUpload from '../features/FileUpload.vue';
import CreateBlogPost from './CreateBlogPost.vue';

interface User {
  fullName: string;
  chatterName: string;
  aboutMe: string;
  id: string;
  profile_image_url: string;
  header_image_url: string;
  checkmark_url: string | null;
  followers: number;
  following: number;
}

export default defineComponent({
  name: 'ProfileHeader',
  components: {
    FileUpload,
    CreateBlogPost,
  },
  props: {
    userId: {
      type: String,
      required: true,
    },
    disableUpload: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const user = ref<User>({
      fullName: '',
      chatterName: '',
      aboutMe: '',
      id: '',
      profile_image_url: '/Default_pfp.svg',
      header_image_url: '/Default_Header.svg',
      checkmark_url: null,
      followers: 0,
      following: 0,
    });
    const totalLikes = ref(0);
    const totalBookmarks = ref(0);
    const showFileUpload = ref(false);
    const showCreatePost = ref(false);
    const uploadType = ref<'profile' | 'header' | 'checkmark'>('profile');
    const profilePicture = ref<string>('/Default_pfp.svg');
    const headerImage = ref<string>('/Default_Header.svg');
    const checkmarkIconUrl = ref<string | null>(null);

    const fetchUserData = async () => {
      console.log(`Fetching data for user ID: ${props.userId}`);
      const { data, error } = await supabase
        .from('users')
        .select('full_name, chatter_name, about_me, id, profile_image_url, header_image_url, checkmark_url, followers, following')
        .eq('id', props.userId)
        .single();

      if (error) {
        console.error('Error fetching user data:', error.message);
        return;
      }

      if (data) {
        user.value = {
          fullName: data.full_name,
          chatterName: data.chatter_name,
          aboutMe: data.about_me,
          id: data.id,
          profile_image_url: data.profile_image_url || '/Default_pfp.svg',
          header_image_url: data.header_image_url || '/Default_Header.svg',
          checkmark_url: data.checkmark_url || null,
          followers: data.followers || 0,
          following: data.following || 0,
        };
        profilePicture.value = user.value.profile_image_url;
        headerImage.value = user.value.header_image_url;
        checkmarkIconUrl.value = user.value.checkmark_url;
        console.log('Fetched user data:', user.value);
        console.log('Profile picture URL:', profilePicture.value);
        console.log('Header image URL:', headerImage.value);

        // Fetch total likes and bookmarks after fetching user data
        await fetchTotalLikesAndBookmarks();
      }
    };

    const fetchTotalLikesAndBookmarks = async () => {
      const { data, error } = await supabase
        .from('blog_post')
        .select('likes, bookmarked_by')
        .eq('user_id', props.userId);

      if (error) {
        console.error('Error fetching total likes and bookmarks:', error.message);
        return;
      }

      if (data) {
        totalLikes.value = data.reduce((sum, post) => sum + post.likes, 0);
        totalBookmarks.value = data.reduce((sum, post) => sum + (post.bookmarked_by ? post.bookmarked_by.length : 0), 0);
      }
    };

    const showFileUploadModal = (type: 'profile' | 'header' | 'checkmark') => {
      if (!props.disableUpload) {
        uploadType.value = type;
        showFileUpload.value = true;
      }
    };

    const closeFileUploadModal = () => {
      showFileUpload.value = false;
    };

    const showCreatePostModal = () => {
      showCreatePost.value = true;
    };

    const hideCreatePostModal = () => {
      showCreatePost.value = false;
    };

    const formatCount = (count: number) => {
      if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + 'm';
      } else if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'k';
      } else {
        return count.toString();
      }
    };

    watch(() => props.userId, fetchUserData, { immediate: true });

    return {
      user,
      showFileUploadModal,
      closeFileUploadModal,
      showCreatePostModal,
      hideCreatePostModal,
      showFileUpload,
      showCreatePost,
      uploadType,
      fetchUserData,
      profilePicture,
      headerImage,
      checkmarkIconUrl,
      totalLikes,
      totalBookmarks,
      formatCount,
    };
  },
});
</script>

<style scoped>
.profile-header {
  text-align: left;
  margin: 0;
  background-color: #2b3138;
  overflow: hidden;
  border: solid 5px #0c1118;
}

.header-image-container {
  width: 100%;
  height: 200px;
  position: relative;
  background-color: #f0f0f0;
}

.header-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-header-icon {
  position: absolute;
  bottom: 50%;
  right: 50%;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 10px;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0.0;
  transition: opacity 0.3s ease;
}

.upload-header-icon:hover {
  opacity: 1;
}

.profile-info-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  margin-top: -90px;
}

.profile-picture-circle {
  width: 150px;
  height: 150px;
  background-color: #fff;
  border-radius: 50%;
  border: 3px solid rgb(255, 255, 255);
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  position: relative;
}

.profile-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

.upload-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 10px;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.upload-icon:hover {
  opacity: 1;
}

.create-post-button {
  padding: 10px 20px;
  background-color: #fd662f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 80px;
}

.create-post-button:hover {
  background-color: #e04a2e;
}

.name-container {
  align-items: left;
  margin-top: 10px;
  padding-left: 20px;
}

.name-wrapper {
  display: flex;
  align-items: center;
}

.name {
  font-size: 24px;
  color: #cebfad;
}

.chatter-name {
  font-size: 18px;
  color: #cebfad;
  margin-top: -15px;
}

.about-me {
  padding-left: 20px;
  font-size: 16px;
  color: gray;
}

.stats-container {
  padding-left: 20px;
  color: #cebfad;
}

.checkmark-icon-circle {
  width: 20px;
  height: 20px;
  background-color: #fff;
  border-radius: 50%;
  margin-left: 10px;
}

.checkmark-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

/* Additional Media Queries */
@media (max-width: 1024px) {
  .create-post-button {
    padding: 10px 20px;
  }
}

@media (max-width: 850px) {
  .profile-info-container {
    flex-direction: row;
    align-items: center;
    margin-top:-80px ;
  }

  .create-post-button {
    margin-top: 60px;
  }
}

@media (max-width: 480px) {
  .profile-info-container {
    flex-direction: row;
    align-items: center;
  }

  .create-post-button {
    margin-top: 60px;
  }
}
</style>
