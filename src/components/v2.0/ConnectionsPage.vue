<template>
  <div class="connections-page">
    <div class="container">
      <!-- Left Column -->
      <div class="left-column">
        <button @click="goBack" class="back-button">
          <i class="fas fa-arrow-left"></i> <!-- Font Awesome icon for the back arrow -->
        </button>
        <NavBar />

        <!-- Tabs for switching between followers and following -->
        <div class="tabs">
          <button :class="{ active: activeTab === 'followers' }" @click="activeTab = 'followers'">Followers</button>
          <button :class="{ active: activeTab === 'following' }" @click="activeTab = 'following'">Following</button>
        </div>

        <!-- Content for each tab -->
        <div class="tab-content">
          <FollowersList v-if="activeTab === 'followers'" />
          <FollowingList v-if="activeTab === 'following'" />
        </div>
      </div>

      <!-- Right Column -->
      <div class="right-column">
        <InfoData/>
        <!-- Right column content here if needed -->
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import NavBar from '../../components/NavBar.vue';
import InfoData from '../infofeatures/InfoData.vue';
import FollowersList from '../v2.0/FollowersList.vue';
import FollowingList from '../v2.0/FollowingList.vue';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'ConnectionsPage',
  components: {
    NavBar,
    FollowersList,
    FollowingList,
    InfoData,
  },
  setup() {
    const activeTab = ref('followers'); // Default to 'followers' tab
    const router = useRouter();

    const goBack = () => {
      router.back(); // Use Vue Router's back method to navigate to the previous page
    };

    return {
      activeTab,
      goBack,
    };
  },
});
</script>

<style scoped>
.connections-page {
  padding: 20px;
  background-color: #2b3138;
  color: #cebfad;
  margin-top: 60px;
  margin-left: 50px;
  margin-right: 50px;
}

.container {
  display: flex;
  justify-content: space-between;
}

.left-column {
  width: 70%;
  padding-right: 20px; /* Optional: Add some space between columns */
}

.right-column {
  /* width: 30%;
  background-color: red;
  min-height: 100vh;  */
  /* Ensure the right column stretches to full height */
  width: 30%;
  background-color: #1e2127;
  max-height: calc(100vh - 63px);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 63px;
  right: 0;
  margin-right: 30px;
  transition: right 0.3s ease-in-out;
  border-left: 1px solid black;
}

.tabs {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.tabs button {
  flex-grow: 1;
  padding: 10px 0px;
  border: none;
  border-radius: 0px 0px 5px 5px;
  cursor: pointer;
  background-color: #0c1118;
  color: white;
  transition: background-color 0.3s;
  margin: 0 0px;
}

.tabs button.active {
  background-color: #2b3138;
}

.tab-content {
  margin-top: 20px;
}

.back-button {
  background: none;
  border: none;
  color: #ffffff;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  background-color: #fd662f;
  padding: 10px;
  border-radius: 50%;
  margin-bottom: 20px; /* Spacing below the back button */
}

/* CSS for iPad screen size */
@media screen and (min-width: 768px) and (max-width: 1024px) {
  /* Add styles for iPad screen size here */
}

/* CSS for phone screen size */
@media screen and (max-width: 767px) {
  .connections-page {
    padding: 20px;
    background-color: #2b3138;
    color: #cebfad;
    margin-top: 120px;
    margin-left: 10px;
    margin-right: 10px;
  }

  .container {
    flex-direction: column;
  }

  .left-column{
    width: 100%;
    padding-right: 0; /* Remove padding when stacked */
  }

  .right-column{
    display: none;
  }
}

</style>
