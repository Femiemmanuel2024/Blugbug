<template>
  <div class="info-data">
    <div class="row search-bar-row">
      <SearchBar />
    </div>
    <div class="row bookmarked-blogs-row">
      <BookmarkedBlugs />
    </div>
    <div class="row latest-blogs-row">
      <LatestBlogs />
    </div>
    <div class="row top-liked-row">
      <TopLiked />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import SearchBar from '../features/SearchBar.vue'; // Adjust the path as needed
import LatestBlogs from './LatestBlogs.vue'; // Import LatestBlogs component
import TopLiked from './TopLiked.vue'; // Import TopLiked component
import BookmarkedBlugs from './BookmarkedBlugs.vue'; // Import BookmarkedBlugs component

export default defineComponent({
  name: 'InfoData',
  components: {
    SearchBar,
    LatestBlogs, // Register LatestBlogs component
    TopLiked, // Register TopLiked component
    BookmarkedBlugs, // Register BookmarkedBlugs component
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

.bookmarked-blogs-row {
  height: 200px;
  max-height: 200px;
}

.latest-blogs-row {
  height: 200px;
  max-height: 200px;
}

.top-liked-row {
  
  height: 100%;
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
