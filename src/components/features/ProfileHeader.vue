<template>
  <div class="profile-header">
    <div class="header-image-container">
      <img :src="headerImage" alt="Header Image" class="header-image" />
      <label class="upload-header-icon" @click="showFileUploadModal('header')">
        <i class="fas fa-camera"></i>
      </label>
    </div>
    <div class="profile-picture-container">
      <div class="profile-picture-circle">
        <img :src="profilePicture" alt="Profile Picture" class="profile-image" />
        <label class="upload-icon" @click="showFileUploadModal('profile')">
          <i class="fas fa-camera"></i>
        </label>
      </div>
    </div>
    <div class="name-container">
      <h1 class="name">{{ user.fullName }}</h1>
      <p class="chatter-name">@{{ user.chatterName }}</p>
    </div>
    <p class="about-me">{{ user.aboutMe }}</p>
    <div class="stats-container">
      <p>
        <strong>{{ totalLikes }}</strong> Likes
        <strong>{{ totalBookmarks }}</strong> Bookmarks
        <strong>{{ user.following }}</strong> Following
        <strong>{{ user.followers }}</strong> Followers
      </p>
    </div>
    <FileUpload v-if="showFileUpload" :type="uploadType" @uploadComplete="fetchUserData" @close="closeFileUploadModal" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, onMounted } from 'vue';
import { supabase } from '../supabase';
import FileUpload from '../features/FileUpload.vue';

interface User {
  fullName: string;
  chatterName: string;
  aboutMe: string;
  id: string;
  profile_image_url: string;
  header_image_url: string;
  followers: number;
  following: number;
}

export default defineComponent({
  name: 'ProfileHeader',
  components: {
    FileUpload,
  },
  props: {
    userId: {
      type: String,
      required: true,
    },
    totalLikes: {
      type: Number,
      required: true,
    },
    totalBookmarks: {
      type: Number,
      required: true,
    },
  },
  setup(props) {
    const user = ref<User>({
      fullName: '',
      chatterName: '',
      aboutMe: '',
      id: '',
      profile_image_url: '/src/assets/Default_pfp.svg',
      header_image_url: 'default-header-image-path',
      followers: 0,
      following: 0,
    });
    const showFileUpload = ref(false);
    const uploadType = ref<'profile' | 'header'>('profile');
    const profilePicture = ref<string>('/src/assets/Default_pfp.svg');
    const headerImage = ref<string>('default-header-image-path');

    const fetchUserData = async () => {
      console.log(`Fetching data for user ID: ${props.userId}`);
      const { data, error } = await supabase
        .from('users')
        .select('full_name, chatter_name, about_me, id, profile_image_url, header_image_url, followers, following')
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
          profile_image_url: data.profile_image_url || '/src/assets/Default_pfp.svg',
          header_image_url: data.header_image_url || 'default-header-image-path',
          followers: data.followers || 0,
          following: data.following || 0,
        };
        profilePicture.value = user.value.profile_image_url;
        headerImage.value = user.value.header_image_url;
        console.log('Fetched user data:', user.value);
      }
    };

    const showFileUploadModal = (type: 'profile' | 'header') => {
      uploadType.value = type;
      showFileUpload.value = true;
    };

    const closeFileUploadModal = () => {
      showFileUpload.value = false;
    };

    watch(() => props.userId, fetchUserData, { immediate: true });

    return {
      user,
      showFileUploadModal,
      closeFileUploadModal,
      showFileUpload,
      uploadType,
      fetchUserData,
      profilePicture,
      headerImage,
    };
  },
});
</script>

<style scoped>
.profile-header {
  text-align: left;
  margin: 0;
  /* box-shadow: 0 4px 10px rgba(0, 0, 0, 0.9);  */
  background-color: #2b3138;
  overflow: hidden; /* Ensure the border radius is applied correctly */
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
  bottom: 80px;
  right: 450px;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  padding: 10px;
  border-radius: 50%;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.upload-header-icon:hover {
  opacity: 1;
}

.profile-picture-container {
  position: relative;
  bottom: 90px;
  padding-left: 20px;
  display: flex;
  align-items: center; /* Center align items horizontally */
  gap: 10px;
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

.name-container {
  align-items: left; /* Center align items horizontally */
  margin-top: -100px; /* Adjust the margin to position the name container correctly */
  padding-left: 20px;
}

.name {
  font-size: 24px;
  color: #cebfad;
}

.chatter-name {
  font-size: 18px;
  color: #cebfad;
  margin-top: -15px; /* Minimal space between name and chatter-name */
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
</style>
