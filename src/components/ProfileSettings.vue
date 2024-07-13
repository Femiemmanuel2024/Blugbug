<template>
    <div class="analytics-page">
      <NavBar />
      <div class="content">
        <h1>User Analytics</h1>
        <table v-if="user">
          <tr>
            <th>Full Name</th>
            <td>{{ user.full_name }}</td>
          </tr>
          <tr>
            <th>Chatter Name</th>
            <td>{{ user.chatter_name }}</td>
          </tr>
          <tr>
            <th>Email</th>
            <td>{{ user.email }}</td>
          </tr>
          <tr>
            <th>About Me</th>
            <td>{{ user.about_me }}</td>
          </tr>
          <tr>
            <th>Profile Image</th>
            <td><img :src="user.profile_image_url" alt="Profile Image" class="image"/></td>
          </tr>
          <tr>
            <th>Header Image</th>
            <td><img :src="user.header_image_url" alt="Header Image" class="image"/></td>
          </tr>
        </table>
        <div v-else>
          Loading user data...
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, onMounted } from 'vue';
  import { supabase } from './supabase';
  import NavBar from '../components/NavBar.vue';
  
  interface User {
    id: string;
    full_name: string;
    chatter_name: string;
    email: string;
    about_me: string;
    profile_image_url: string;
    header_image_url: string;
  }
  
  export default defineComponent({
    name: 'AnalyticsPage',
    components: {
      NavBar,
    },
    setup() {
      const user = ref<User | null>(null);
  
      const fetchUserData = async () => {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          console.error('User ID not found in local storage');
          return;
        }
  
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
  
        if (error) {
          console.error('Error fetching user data:', error.message);
          return;
        }
  
        if (data) {
          user.value = data;
        }
      };
  
      onMounted(() => {
        fetchUserData();
      });
  
      return {
        user,
      };
    },
  });
  </script>
  
  <style scoped>
  .analytics-page {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 20px;
  }
  
  .content {
    max-width: 800px;
    width: 100%;
  }
  
  h1 {
    margin-bottom: 20px;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
  }
  
  th, td {
    padding: 10px;
    border: 1px solid #ddd;
  }
  
  th {
    background-color: #f4f4f4;
  }
  
  .image {
    max-width: 100px;
    max-height: 100px;
    object-fit: cover;
  }
  </style>
  