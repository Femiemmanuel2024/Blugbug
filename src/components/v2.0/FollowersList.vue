<template>
    <div class="followers-list">
      <NavBar />
      <!-- Loading Modal -->
      <div v-if="isLoading" class="loading-modal">
        <div class="loading-spinner"></div>
      </div>
  
      <!-- Total Followers Counter -->
      <h2>Total Followers: {{ followers.length }}</h2>
  
      <h1>Followers</h1>
      <table class="followers-table" v-if="!isLoading">
        <thead>
          <tr>
            <th>Chatter Name</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="follower in followers" :key="follower.id">
            <!-- Only display chatterName if it is not null -->
            <td v-if="follower.chatterName">{{ follower.chatterName }}</td>
            <td v-else></td> <!-- Empty cell if no chatterName -->
            <!-- Include FollowStatus component in the Status column -->
            <td><FollowStatus :followerId="follower.id" /></td>
            <td>
              <!-- REMOVE button to remove follower -->
              <button
                :class="['remove-button', clickedIds.includes(follower.id) ? 'clicked' : '']"
                @click="removeFollower(follower.id)"
              >
                REMOVE
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, onMounted } from 'vue';
  import NavBar from '../../components/NavBar.vue';
  import FollowStatus from '../v2.0/FollowStatus.vue';
  import { supabase } from '../supabase'; // Adjust the import path to your Supabase setup
  
  interface Follower {
    id: string;
    chatterName: string | null;
  }
  
  export default defineComponent({
    name: 'FollowersList',
    components: {
      NavBar,
      FollowStatus, // Register FollowStatus component
    },
    setup() {
      const followers = ref<Follower[]>([]);
      const isLoading = ref(true); // Initialize loading state as true
      const clickedIds = ref<string[]>([]); // Array to track clicked follower IDs
  
      // Step 1: Fetch user ID from localStorage
      console.log('Fetching user ID from localStorage...');
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = currentUser.id;  // Extract the user ID
  
      if (!userId) {
        console.error('User ID is not available in localStorage.');
        isLoading.value = false; // Stop loading if user ID is not found
        return;
      }
      console.log('User ID fetched:', userId);
  
      // Step 2: Fetch list of follower IDs from Supabase using the retrieved userId
      const fetchFollowerIds = async () => {
        console.log('Fetching follower IDs from Supabase...');
        const { data, error } = await supabase
          .from('users')
          .select('followers_id')
          .eq('id', userId) // Use the userId fetched from localStorage
          .single();
  
        if (error) {
          console.error('Error fetching followers:', error.message);
          isLoading.value = false; // Stop loading on error
          return;
        }
  
        console.log('Fetched follower IDs:', data.followers_id);
  
        if (data && data.followers_id && data.followers_id.length > 0) {
          const uniqueFollowerIds = removeDuplicateIds(data.followers_id); // Remove duplicates
          await displayFollowerIds(uniqueFollowerIds); // Step 3
        }
  
        isLoading.value = false; // Stop loading after fetching is complete
      };
  
      // Function to remove duplicate IDs
      const removeDuplicateIds = (ids: string[]) => {
        const uniqueIds = Array.from(new Set(ids));
        if (uniqueIds.length !== ids.length) {
          console.log('Duplicates found and removed:', ids.length - uniqueIds.length);
          // Optionally update the database if needed to keep it clean
          updateFollowersIdInDatabase(uniqueIds);
        }
        return uniqueIds;
      };
  
      // Optional function to update the followers_id array in the database if duplicates were removed
      const updateFollowersIdInDatabase = async (uniqueFollowerIds: string[]) => {
        const { error } = await supabase
          .from('users')
          .update({ followers_id: uniqueFollowerIds })
          .eq('id', userId);
  
        if (error) {
          console.error('Error updating followers_id in database:', error.message);
        } else {
          console.log('followers_id updated in database to remove duplicates.');
        }
      };
  
      // Step 3: Display follower IDs and fetch chatter names
      const displayFollowerIds = async (followerIds: string[]) => {
        console.log('Displaying follower IDs and fetching chatter names...');
        
        for (const id of followerIds) {
          const { data, error } = await supabase
            .from('users')
            .select('chatter_name')
            .eq('id', id)
            .single();
          
          if (error) {
            console.error(`Error fetching chatter name for ID ${id}:`, error.message);
            followers.value.push({ id, chatterName: null }); // Push with null chatterName if there's an error
            continue;
          }
  
          console.log(`Fetched chatter name for ID ${id}:`, data.chatter_name);
          
          if (data) {
            followers.value.push({ id, chatterName: data.chatter_name });
          }
        }
  
        console.log('Followers list populated:', followers.value); // Step 5
      };
  
      // Function to remove a follower
      const removeFollower = async (followerId: string) => {
        // Add ID to clicked array to change button color
        clickedIds.value.push(followerId);
  
        try {
          // Fetch the current followers_id array
          const { data, error } = await supabase
            .from('users')
            .select('followers_id')
            .eq('id', userId)
            .single();
  
          if (error) {
            console.error('Error fetching followers to update:', error.message);
            return;
          }
  
          const currentFollowers = data?.followers_id || [];
  
          // Remove the followerId from the array
          const updatedFollowers = currentFollowers.filter((id: string) => id !== followerId);
  
          // Update the followers_id array in Supabase
          const { error: updateError } = await supabase
            .from('users')
            .update({ followers_id: updatedFollowers })
            .eq('id', userId);
  
          if (updateError) {
            console.error('Error updating followers:', updateError.message);
            return;
          }
  
          console.log(`Follower ${followerId} removed successfully.`);
          // Optionally remove the follower from the UI immediately
          followers.value = followers.value.filter(f => f.id !== followerId);
        } catch (err) {
          console.error('Unexpected error removing follower:', err);
        }
      };
  
      // Step 4: Fetch follower IDs on component mount
      onMounted(async () => {
        await fetchFollowerIds();
      });
  
      return {
        followers,
        isLoading, // Add isLoading to return to access in template
        removeFollower, // Expose the remove function to the template
        clickedIds, // Expose clickedIds to manage button state
      };
    },
  });
  </script>
  
  <style scoped>
  .followers-list {
    padding: 20px;
    background-color: #2b3138;
    color: #cebfad;
    padding-top: 10px;
  }
  
  .loading-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 9999; /* Ensure it is above other content */
  }
  
  .loading-spinner {
    border: 8px solid #f3f3f3;
    border-top: 8px solid #fd662f;
    border-radius: 50%;
    width: 60px;
    height: 60px;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  h1, h2 {
    color: #cebfad;
    margin-bottom: 20px;
  }
  
  .followers-table {
    width: 100%;
    border-collapse: collapse;
    color: #cebfad;
  }
  
  .followers-table th,
  .followers-table td {
    border: 1px solid #cebfad;
    padding: 10px;
    text-align: left;
  }
  
  .followers-table th {
    background-color: #0c1118;
  }
  
  .followers-table tr:nth-child(even) {
    background-color: #2b3138;
  }
  
  .followers-table tr:nth-child(odd) {
    background-color: #1f252b;
  }
  
  .followers-table td {
    background-color: #2b3138;
  }
  
  /* Styles for the remove button */
  .remove-button {
    padding: 5px 10px;
    background-color: #fd662f;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  /* Change button to red when clicked */
  .remove-button.clicked {
    background-color: red;
  }
  </style>
  