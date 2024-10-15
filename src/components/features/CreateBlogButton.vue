<template>
  <button @click="navigateToCreateBlog" class="create-blog-button">
    <font-awesome-icon v-if="isSmallScreen" :icon="['fas', 'pen-clip']" />
    <span v-else>Blug</span> <!-- Show text on larger screens -->
  </button>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'CreateBlogButton',
  setup() {
    const router = useRouter();
    const isSmallScreen = ref(false); // Flag to track screen size

    const navigateToCreateBlog = () => {
      router.push('./create-blog'); // Route to the blog post creation page
    };

    const handleResize = () => {
      // Check if the screen width is below 768px (phone size)
      isSmallScreen.value = window.innerWidth < 768;
    };

    onMounted(() => {
      handleResize(); // Check size when component is mounted
      window.addEventListener('resize', handleResize); // Add event listener for screen resize
    });

    return {
      navigateToCreateBlog,
      isSmallScreen,
    };
  },
});
</script>

<style scoped>
.create-blog-button {
  padding: 10px;
  background-color: #1e2127;
  color: white;
  border: none;
  border-radius: 50%; /* Default circular shape */
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  opacity: 0.8; /* Set initial opacity to 80% */
  transition: opacity 0.3s ease, border-radius 0.3s ease; /* Smooth transition for opacity and shape change */
  z-index: 9999; /* Ensure the button is always on top */
  position: fixed; /* Fix the button at the bottom-right corner */
  bottom: 20px; /* Distance from the bottom of the page */
  right: 10px; /* Distance from the right side of the page */
  display: flex;
  justify-content: center;
  align-items: center;
  width: 70px;
  height: 70px;
}

/* Styles for larger screens (tablets and desktops) */
@media screen and (min-width: 768px) {
  .create-blog-button {
    width: 120px; /* Make the button wider */
    height: 50px; /* Adjust the height */
    border-radius: 20px; /* Make it a rounded rectangle */
    padding: 10px 20px; /* Adjust padding for text */
    right: 100px;
   
  }
}

/* On hover, set opacity to 100% */
.create-blog-button:hover {
  opacity: 1; /* Set opacity to 100% on hover */
}
</style>
