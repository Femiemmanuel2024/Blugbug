<template>
  <div class="info-data">
    <div class="row search-bar-row">
      <SearchBar />
    </div>
    <div class="row latest-blogs-row">
      <LatestBlogs />
    </div>
    <div class="row most-liked-chattees-row">
      <h2>Most Liked Chattees</h2>
      <p>Text content for most liked chattees.</p>
    </div>
    <div class="row top-chattees-row">
      <h2>Top Chattees</h2>
      <p>Text content for top chattees.</p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import SearchBar from '../features/SearchBar.vue'; // Adjust the path as needed
import LatestBlogs from './LatestBlogs.vue'; // Import LatestBlogs component

export default defineComponent({
  name: 'InfoData',
  components: {
    SearchBar,
    LatestBlogs, // Register LatestBlogs component
  },
});
</script>

<style scoped>
.info-data {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.row {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: auto;
  
  
}

.row:last-child {
  border-bottom: none; /* Remove border for the last row */
}

.info-data h2 {
  color: #cebfad;
  margin-bottom: 10px;
}

.info-data p {
  font-size: 14px;
  color: #d7c9b7;
}

/* Individual row classes for height customization */
.search-bar-row {
  height: 50px;
  max-height: 130px;
}

.latest-blogs-row {
  height: 200px;
  max-height: 200px;
}

.most-liked-chattees-row {
  height: 150px;
  max-height: 150px;
}

.top-chattees-row {
  height: 150px;
  max-height: 150px;
}

/* Custom scrollbar for WebKit browsers (Chrome, Safari) */
.row::-webkit-scrollbar {
  width: 12px; /* Width of the scrollbar */
  height: 12px; /* Height of the scrollbar (for horizontal scrollbar) */
}

.row::-webkit-scrollbar-track {
  background: #1e2127; /* Background color of the scrollbar track */
  border-radius: 10px; /* Rounding of the scrollbar track corners */
}

.row::-webkit-scrollbar-thumb {
  background: #fd662f; /* Color of the scrollbar thumb */
  border-radius: 10px; /* Rounding of the scrollbar thumb corners */
  border: 2px solid #1e2127; /* Padding around scrollbar thumb */
}

.row::-webkit-scrollbar-thumb:hover {
  background: #e04a2e; /* Color of the scrollbar thumb on hover */
}

/* Custom scrollbar for Firefox */
.row {
  scrollbar-width: thin; /* Width of the scrollbar */
  scrollbar-color: #fd662f #1e2127; /* Color of the scrollbar thumb and track */
}

/* Firefox scrollbar track and thumb pseudo-elements */
.row {
  scrollbar-color: #fd662f #1e2127; /* Color of the scrollbar thumb and track */
  scrollbar-width: thin; /* Width of the scrollbar */
}

.row::-moz-scrollbar-track {
  background: #1e2127; /* Background color of the scrollbar track */
  border-radius: 10px; /* Rounding of the scrollbar track corners */
}

.row::-moz-scrollbar-thumb {
  background: #fd662f; /* Color of the scrollbar thumb */
  border-radius: 10px; /* Rounding of the scrollbar thumb corners */
  border: 2px solid #1e2127; /* Padding around scrollbar thumb */
}

.row::-moz-scrollbar-thumb:hover {
  background: #e04a2e; /* Color of the scrollbar thumb on hover */
}
</style>
