<template>
  <div class="search-bar-container">
    <div class="input-wrapper">
      <input class="inputbar" v-model="searchQuery" placeholder="Find a Blugger" @input="searchUsers" />
      <i class="fas fa-search search-icon"></i>
    </div>
    <!-- Limit the display of search results to 5 -->
    <ul class="results-list" v-if="limitedResults.length">
      <li v-for="user in limitedResults" :key="user.email">
        <router-link :to="{ name: 'PublicProfile', params: { userId: user.id, chatterName: user.chatterName } }" @click.native="storeUserId(user.id)">
          {{ user.fullName }} (@{{ user.chatterName }})
        </router-link>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { supabase } from '../supabase'; // Adjust the path as needed

interface User {
  id: string;
  email: string;
  fullName: string;
  chatterName: string;
}

export default defineComponent({
  name: 'SearchBar',
  setup() {
    const searchQuery = ref('');
    const searchResults = ref<User[]>([]);

    const searchUsers = async () => {
      if (searchQuery.value.trim() === '') {
        searchResults.value = [];
        return;
      }

      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, email, full_name, chatter_name')
          .or(`full_name.ilike.%${searchQuery.value}%,chatter_name.ilike.%${searchQuery.value}%`);

        if (error) {
          console.error('Error fetching users:', error);
          return;
        }

        if (data) {
          searchResults.value = data.map(user => ({
            id: user.id,
            email: user.email,
            fullName: user.full_name,
            chatterName: user.chatter_name
          }));
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      }
    };

    const storeUserId = (userId: string) => {
      localStorage.setItem('searchedUserId', userId);
      console.log('Stored User ID:', userId);
    };

    // Computed property to limit displayed results to 5
    const limitedResults = computed(() => {
      return searchResults.value.slice(0, 5);
    });

    return {
      searchQuery,
      searchResults,
      searchUsers,
      storeUserId,
      limitedResults,
    };
  },
});
</script>

<style scoped>
.search-bar-container {
  position: relative;
  width: 100%;
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.inputbar {
  width: 100%;
  padding: 10px;
  font-size: 12px;
  border: none;
  box-sizing: border-box;
  background-color: #2b3138; /* Background color */
  color: #d7c9b7; /* Text color */
  padding-right: 30px; /* Add space for the icon */
  font-size: 14px;
}

.inputbar:hover {
  border: 1px solid #ed6834;
}

.search-icon {
  position: absolute;
  top: 50%;
  right: 10px;
  transform: translateY(-50%);
  color: #d7c9b7; /* Icon color */
  pointer-events: none; /* Prevent the icon from capturing mouse events */
}

.results-list {
  color: #ffffff; /* Change text color to white */
  background-color: #2b3138; /* Background color */
  list-style: none;
  padding: 0;
  margin: 0;
  max-height: 200px; /* Add max-height to limit visible space */
  overflow-y: auto; /* Allow scrolling for overflow */
  border-radius: 0px 0px 10px 10px;
}

.results-list li {
  font-size: 14px;
  padding: 10px;
  
  /* border-bottom: 0.5px solid #d7c9b7;  */
  /* Add border for separation */
}

.results-list li a {
  color: #ffffff; /* Link text color to white */
  text-decoration: none;
}

.results-list li:hover {
  background-color: #ed6834;
  font-size: 16px;
}
</style>
