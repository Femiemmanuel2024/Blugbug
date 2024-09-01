<template>
  <div class="profile-header">
    <!-- Top Row -->
    <div class="top-row">
      <div class="header-image-container">
        <img :src="headerImage" alt="Header Image" class="header-image" loading="lazy" />
        <label v-if="!disableUpload" class="upload-header-icon" @click="showFileUploadModal('header')">
          <i class="fas fa-camera"></i>
        </label>
      </div>
      <div class="profile-picture-container">
        <div class="profile-picture-circle">
          <img :src="profilePicture" alt="Profile Picture" class="profile-image" loading="lazy" />
          <label v-if="!disableUpload" class="upload-icon" @click="showFileUploadModal('profile')">
            <i class="fas fa-camera"></i>
          </label>
        </div>
      </div>
    </div>

    <!-- Bottom Row -->
    <div class="bottom-row">
      <!-- First Column -->
      <div class="info-column">
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
            <button class="followers-button" @click="navigateToFollowing">{{ user.following }} Following</button>
            <button class="followers-button" @click="navigateToFollowers">{{ user.followers }} Followers</button>
          </p>
          <!-- New Interest Container -->
          <div class="interest-container">
            <div class="interest-column">
              <span class="interest-title">My Interest</span>
            </div>
            <div class="interest-column2">
              <p class="interest-list">{{ displayInterest(user.interestId) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Second Column -->
      <div class="action-column">
        <button class="create-blug-button" @click="navigateToCreateBlogPostPage">
          <font-awesome-icon :icon="['fas', 'pen-clip']" />
        </button>
      </div>
    </div>

    <FileUpload v-if="showFileUpload" :type="uploadType" @uploadComplete="fetchUserData" @close="closeFileUploadModal" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabase';
import FileUpload from '../features/FileUpload.vue';

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
  interestId: string | null;
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
    disableUpload: {
      type: Boolean,
      default: false,
    },
  },
  setup(props) {
    const router = useRouter();

    const user = ref<User>({
      fullName: 'Default Name',
      chatterName: '',
      aboutMe: '',
      id: '',
      profile_image_url: '/Default_pfp.svg',
      header_image_url: '/Default_Header.svg',
      checkmark_url: null,
      followers: 0,
      following: 0,
      interestId: null,
    });
    const totalLikes = ref(0);
    const totalBookmarks = ref(0);
    const showFileUpload = ref(false);
    const uploadType = ref<'profile' | 'header' | 'checkmark'>('profile');
    const profilePicture = ref<string>('/Default_pfp.svg');
    const headerImage = ref<string>('/Default_Header.svg');
    const checkmarkIconUrl = ref<string | null>(null);

    const fetchUserData = async () => {
      const cachedData = localStorage.getItem(`user_data_${props.userId}`);
      if (cachedData) {
        user.value = JSON.parse(cachedData);
        profilePicture.value = user.value.profile_image_url;
        headerImage.value = user.value.header_image_url;
        checkmarkIconUrl.value = user.value.checkmark_url;
      }

      const { data, error } = await supabase
        .from('users')
        .select('full_name, chatter_name, about_me, id, profile_image_url, header_image_url, checkmark_url, followers, following, interest_id')
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
          interestId: data.interest_id || null,
        };
        profilePicture.value = user.value.profile_image_url;
        headerImage.value = user.value.header_image_url;
        checkmarkIconUrl.value = user.value.checkmark_url;

        localStorage.setItem(`user_data_${props.userId}`, JSON.stringify(user.value));

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

    const navigateToCreateBlogPostPage = () => {
      router.push({ name: 'CreateBlogPostPage' });
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

    const displayInterest = (interestId: string | null) => {
      return interestId ? interestId : 'User has not selected any interest yet';
    };

    const navigateToFollowers = () => {
      router.push({ path: '/connections', query: { tab: 'followers' } });
    };

    const navigateToFollowing = () => {
      router.push({ path: '/connections', query: { tab: 'following' } });
    };

    watch(() => props.userId, fetchUserData, { immediate: true });

    return {
      user,
      showFileUploadModal,
      closeFileUploadModal,
      navigateToCreateBlogPostPage,
      showFileUpload,
      uploadType,
      fetchUserData,
      profilePicture,
      headerImage,
      checkmarkIconUrl,
      totalLikes,
      totalBookmarks,
      formatCount,
      displayInterest,
      navigateToFollowers,
      navigateToFollowing,
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
  display: flex;
  flex-direction: column;
  border-radius: 90px 0px 0px 0px;
}

/* Top Row Styling */
.top-row {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.header-image-container {
  width: 100%;
  height: 200px;
  position: relative;
  background-color: #f0f0f0;
  border-radius: 90px 0px 0px 90px;
}

.header-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 90px 0px 0px 90px;
}

.upload-header-icon {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.9);
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
  position: absolute;
  top: 18px;
  left: 20px;
  width: 150px;
  height: 150px;
  z-index: 1;
}

.profile-picture-circle {
  width: 100%;
  height: 100%;
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

/* Bottom Row Styling */
.bottom-row {
  display: flex;
  width: 100%;
  margin-top: 0px;
}

.info-column {
  width: 70%;
  padding: 20px;
  color: #ffffff;
}

.name-container {
  margin-bottom: 10px;
  margin-top: -25px;
}

.name-wrapper {
  display: flex;
  align-items: center;
}

.name {
  font-size: 24px;
  color: #cebfad;
  margin-right: 10px;
}

.chatter-name {
  font-size: 18px;
  color: #cebfad;
  margin-top: -15px;
}

.about-me {
  font-size: 14px;
  color: gray;
  margin-bottom: 0px;
  margin-top: -15px;
}

.stats-container {
  font-size: 14px;
  color: #cebfad;
  margin-top: 0px;
}

.stat-label {
  font-weight: lighter;
  margin-right: 10px;
}

strong {
  font-weight: bold;
  margin-right: 5px;
}

.followers-button {
  background-color: transparent;
  border: none;
  color: #cebfad;
  font-size: 14px;
  cursor: pointer;
  margin-left: 10px;
}

.followers-button:hover {
  text-decoration: underline;
}

.checkmark-icon-circle {
  width: 20px;
  height: 20px;
  background-color: #fff;
  border-radius: 50%;
  border: 1px solid whitesmoke;
}

.checkmark-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  /* border-radius: 50%; */
}

.action-column {
  width: 30%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.create-blug-button {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #fd662f;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  cursor: pointer;
  transition: background-color 0.3s ease;
  border: 2px solid #cebfad;
}

.create-blug-button:hover {
  background-color: #e04a2e;
  transform: scale(1.1);
}

.interest-title{
  background-color: #0c1118;
  padding: 5px 10px 5px 10px;
  border-radius: 90px 0px 0px 90px;
}

/* General Styles */
.interest-container {
  display: flex;
  flex-direction: column; /* Stack columns vertically */
  gap: 10px;
  align-items: left;
}

.interest-column {
  flex: 1;
  min-width: 200px; /* Ensures the columns stack properly */
  max-width: 100%; /* Prevents columns from exceeding container width */
  text-align: center;
  word-wrap: break-word; /* Allow long words to wrap */
  overflow-wrap: break-word; /* Handle long words or URLs */
  /* margin-top: -15px; */
}

.interest-column2{
  width: 100%; /* Make each column take the full width */
  text-align: center; /* Center align the text */
  /* font-size: 9px;
  margin-top: -5px; */
}


.interest-title {
  font-weight: bold;
  display: block;
}

.interest-list {
  margin-top: 5px;
  white-space: normal; /* Allow text to wrap normally */
  word-break: normal; /* Prevent breaking words at mid-character */
  overflow-wrap: normal; /* Prevent breaking words unless necessary */
}

/* Media Queries for smaller screens */
@media screen and (max-width: 767px) {
  .interest-container {
    flex-direction: column;
    align-items: center; /* Center align for smaller screens */
  }

  .interest-column {
    width: 100%; /* Stack the columns on top of each other */
    text-align: center; /* Center align the text */
    word-break: normal; /* Prevent breaking words at mid-character */
    white-space: normal; /* Allow wrapping */
  }
}

/* Media Queries */
@media (max-width: 1024px) {
  .profile-header {
    padding: 10px;
  }

  .top-row {
    flex-direction: column;
    align-items: center;
  }

  .profile-picture-container {
    position: static;
    margin: 0 auto;
  }

  .bottom-row {
    flex-direction: column;
  }

  .info-column,
  .action-column {
    width: 100%;
    text-align: center;
  }

  .create-blug-button {
    margin-top: 20px;
  }
}

@media screen and (min-width: 768px) and (max-width: 1024px) {
  /* Add styles for iPad screen size here */
}

/* CSS for phone screen size */
@media screen and (max-width: 767px) {
  .interest-title {
    background-color: #0c1118;
    padding: 5px 10px 5px 10px;
    border-radius: 10px 10px 0px 0px;
  }

  .header-image-container {
  width: 100%;
  height: 100px;
  position: relative;
  background-color: #f0f0f0;
  border-radius: 90px 0px 0px 90px;
}

  .profile-picture-container {
    position: absolute;
    top: 8px;
    left: 10px;
    width: 80px;
    height: 80px;
    z-index: 1;
  }

  .profile-header {
    padding: 10px;
    align-items: center;
    border-radius: 70px 0px 0px 0px;
  }

  .top-row {
    align-items: center;
  }

  .bottom-row {
    display: flex;
    flex-direction: column;
    align-items: center; /* Center the content horizontally */
    justify-content: center; /* Center the content vertically */
    width: 100%; /* Make the bottom row take full width */
    margin-top: 0px;
  }

  .info-column,
  .action-column {
    width: 100%;
    text-align: center;
    margin-bottom: 0px; /* Add spacing between columns */
  }

  .create-blug-button {
    margin-top: -15px;
    margin-bottom: 10px; /* Add spacing below the button */
    border: 3px solid rgb(248, 247, 245);
  }

  .create-blug-button:hover {
    border: 3px solid rgb(248, 247, 245);
    transform: scale(1.1);
  }

  .stats-container,
  .about-me,
  .interest {
    text-align: center;
    font-size: 12px;
  }

  .followers-button {
    margin: 10px auto; /* Following and followers counter not button */
    font-size: 12px;
    margin-top: -10px;
  }

  .name-container {
    margin-top: -10px;
    text-align: center;
    text-align: center;
    display: flex; /* Use flexbox to align items side by side */
    justify-content: center; /* Center content horizontally */
    align-items: center; /* Align content vertically */
    gap: 10px; /* Add some space between full name and username */
  }

  .name-wrapper {
    justify-content: center; /* Center the name wrapper */
  }

  .name {
    text-align: center; /* Center the full name */
    margin-right: 0; /* Remove margin for centering */
    font-size: 14px;
  }

  .chatter-name {
    text-align: center; /* Center the chatter name */
    margin-top: 10px; /* Adjust margin for centering */
    font-size: 10px;
  }

  .interest-container {
    flex-direction: column;
    align-items: center; /* Center align for smaller screens */
  }

  .interest-column {
    width: 100%; /* Stack the columns on top of each other */
    text-align: center; /* Center align the text */
    word-break: normal; /* Prevent breaking words at mid-character */
    white-space: normal; /* Allow wrapping */
    margin-top: -15px;
  }
  .interest-column2{
    margin-top: -1px;
  }

  .checkmark-icon-circle {
  width: 15px;
  height: 15px;
  background-color: #fff;
  border-radius: 50%;
  padding: 1px;
  margin-left: 5px;
}

.checkmark-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}

}
</style>
