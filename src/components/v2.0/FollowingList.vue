<template>
    <div class="following-list">
      <!-- Similar structure and functionality as FollowersList -->
      <h1>Following</h1>
      <table class="following-table">
        <thead>
          <tr>
            <th>Chatter Name</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="following in following" :key="following.id">
            <td v-if="following.chatterName">{{ following.chatterName }}</td>
            <td v-else></td>
            <td><FollowStatus :followerId="following.id" /></td>
            <td>
              <button
                :class="['remove-button', clickedIds.includes(following.id) ? 'clicked' : '']"
                @click="removeFollowing(following.id)"
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
  import FollowStatus from '../v2.0/FollowStatus.vue';
  import { supabase } from '../supabase'; 
  
  interface Following {
    id: string;
    chatterName: string | null;
  }
  
  export default defineComponent({
    name: 'FollowingList',
    components: {
      FollowStatus,
    },
    setup() {
      const following = ref<Following[]>([]);
      const clickedIds = ref<string[]>([]);
  
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = currentUser.id;
  
      const fetchFollowingIds = async () => {
        const { data, error } = await supabase
          .from('users')
          .select('following_id')
          .eq('id', userId)
          .single();
  
        if (error) {
          console.error('Error fetching following:', error.message);
          return;
        }
  
        if (data && data.following_id) {
          await displayFollowingIds(data.following_id);
        }
      };
  
      const displayFollowingIds = async (followingIds: string[]) => {
        for (const id of followingIds) {
          const { data, error } = await supabase
            .from('users')
            .select('chatter_name')
            .eq('id', id)
            .single();
  
          if (error) {
            console.error(`Error fetching chatter name for ID ${id}:`, error.message);
            following.value.push({ id, chatterName: null });
            continue;
          }
  
          if (data) {
            following.value.push({ id, chatterName: data.chatter_name });
          }
        }
      };
  
      const removeFollowing = async (followingId: string) => {
        clickedIds.value.push(followingId);
        // Logic to remove following similar to removeFollower in FollowersList
      };
  
      onMounted(async () => {
        await fetchFollowingIds();
      });
  
      return {
        following,
        removeFollowing,
        clickedIds,
      };
    },
  });
  </script>
  
  <style scoped>
  /* Similar styles as FollowersList */
  .following-list {
    padding: 20px;
    background-color: #2b3138;
    color: #cebfad;
    border: solid 5px #0c1118;
  }
  
  .following-table {
    width: 100%;
    border-collapse: collapse;
    color: #cebfad;
  }
  
  .following-table th,
  .following-table td {
    border: 1px solid #cebfad;
    padding: 10px;
    text-align: left;
  }
  
  .following-table th {
    background-color: #0c1118;
  }
  
  .following-table tr:nth-child(even) {
    background-color: #2b3138;
  }
  
  .following-table tr:nth-child(odd) {
    background-color: #1f252b;
  }
  
  .following-table td {
    background-color: #2b3138;
  }
  
  .remove-button {
    padding: 5px 10px;
    background-color: #fd662f;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .remove-button.clicked {
    background-color: red;
  }
  </style>
  