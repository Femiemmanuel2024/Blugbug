<template>
  <div class="connections-page">
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import NavBar from '../../components/NavBar.vue';
import FollowersList from '../v2.0/FollowersList.vue';
import FollowingList from '../v2.0/FollowingList.vue';

export default defineComponent({
  name: 'ConnectionsPage',
  components: {
    NavBar,
    FollowersList,
    FollowingList,
  },
  setup() {
    const activeTab = ref('followers'); // Default to 'followers' tab

    return {
      activeTab,
    };
  },
});
</script>

<style scoped>
.connections-page {
  padding: 20px;
  background-color: #2b3138;
  color: #cebfad;
  border: solid 5px #0c1118;
  margin-top: 45px;
}

.tabs {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
}

.tabs button {
  flex-grow: 1; /* Make buttons fill the available space equally */
  padding: 10px 0px;
  border: none;
  border-radius: 0px 0px 5px 5px;
  cursor: pointer;
  background-color: #0c1118;
  color: white;
  transition: background-color 0.3s;
  margin: 0 0px; /* Add some space between buttons */
}

.tabs button.active {
  background-color: #2b3138;
}

.tab-content {
  margin-top: 20px;
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
  border: solid 5px #0c1118;
  margin-top: 140px;
}
  /* Add styles for phone screen size here */
}

</style>