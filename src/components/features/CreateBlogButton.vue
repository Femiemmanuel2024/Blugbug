<template>
    <button @click="navigateToCreateBlog" class="create-blog-button">
      Blug
    </button>
  </template>
  
  <script lang="ts">
  import { defineComponent } from 'vue';
  import { useRouter } from 'vue-router';
  
  export default defineComponent({
    name: 'CreateBlogButton',
    setup() {
      const router = useRouter();
  
      const navigateToCreateBlog = () => {
        router.push('./create-blog'); // Route to the blog post creation page
      };
  
      return {
        navigateToCreateBlog,
      };
    },
  });
  </script>
  
  <style scoped>
  .create-blog-button {
    padding: 20px;
    background-color: blue; /* Set background color to blue */
    color: white;
    border: none;
    border-radius: 50%; /* Make the button circular */
    cursor: pointer;
    font-size: 18px;
    font-weight: bold;
    opacity: 0.8; /* Set initial opacity to 80% */
    transition: opacity 0.3s ease; /* Smooth transition for opacity change */
    z-index: 9999; /* Ensure the button is always on top */
    position: fixed; /* Fix the button at the bottom-right corner */
    bottom: 20px; /* Distance from the bottom of the page */
    right: 60px; /* Distance from the right side of the page */
    width: 80px; /* Set width to make it a circle */
    height: 80px; /* Set height to make it a circle */
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .create-blog-button:hover {
    opacity: 1; /* Set opacity to 100% on hover */
  }
  </style>
  