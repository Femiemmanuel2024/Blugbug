<!-- FollowStatus.vue -->
<template>
    <button
      :class="['follow-status-button', isFollowing ? 'unfollow' : 'follow']"
      @click="toggleFollowStatus"
    >
      {{ isFollowing ? 'Unfollow' : 'Follow' }}
    </button>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, onMounted } from 'vue';
  import { supabase } from '../supabase'; // Adjust the import path to your Supabase setup
  
  export default defineComponent({
    name: 'FollowStatus',
    props: {
      followerId: {
        type: String,
        required: true,
      },
    },
    setup(props) {
      const isFollowing = ref(false);
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = currentUser.id;  // Logged-in user ID
  
      // Function to check if the user is already being followed
      const checkFollowStatus = async () => {
        if (!userId) {
          console.error('User ID is not available in localStorage.');
          return;
        }
  
        try {
          console.log('Checking follow status from Supabase...');
          const { data, error } = await supabase
            .from('users')
            .select('following_id')
            .eq('id', userId)
            .single();
  
          if (error) {
            console.error('Error fetching following status:', error.message);
            return;
          }
  
          const followingIds = data?.following_id || [];
          isFollowing.value = followingIds.includes(props.followerId);
        } catch (err) {
          console.error('Unexpected error fetching follow status:', err);
        }
      };
  
      // Function to toggle follow/unfollow status
      const toggleFollowStatus = async () => {
        if (!userId) {
          console.error('User ID is not available in localStorage.');
          return;
        }
  
        try {
          const { data, error } = await supabase
            .from('users')
            .select('following_id')
            .eq('id', userId)
            .single();
  
          if (error) {
            console.error('Error fetching following list:', error.message);
            return;
          }
  
          let followingIds = data?.following_id || [];
  
          if (isFollowing.value) {
            // If currently following, remove the follower ID
            followingIds = followingIds.filter((id: string) => id !== props.followerId);
          } else {
            // If not following, add the follower ID
            followingIds.push(props.followerId);
          }
  
          const { error: updateError } = await supabase
            .from('users')
            .update({ following_id: followingIds })
            .eq('id', userId);
  
          if (updateError) {
            console.error('Error updating following list:', updateError.message);
            return;
          }
  
          isFollowing.value = !isFollowing.value; // Toggle the follow status
        } catch (err) {
          console.error('Unexpected error toggling follow status:', err);
        }
      };
  
      onMounted(() => {
        checkFollowStatus(); // Check follow status on mount
      });
  
      return {
        isFollowing,
        toggleFollowStatus,
      };
    },
  });
  </script>
  
  <style scoped>
  .follow-status-button {
    padding: 5px 10px;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .follow-status-button.follow {
    background-color: green;
  }
  
  .follow-status-button.unfollow {
    background-color: red;
  }

  
/* CSS for iPad screen size */
@media screen and (min-width: 768px) and (max-width: 1024px) {
  /* Add styles for iPad screen size here */
}

/* CSS for phone screen size */
@media screen and (max-width: 767px) {
  
  /* Add styles for phone screen size here */
}
  </style>
  