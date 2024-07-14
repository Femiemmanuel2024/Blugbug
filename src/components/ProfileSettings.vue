<template>
  <div class="profile-settings">
    <NavBar />
    <div class="content">
      <h1>Profile Settings</h1>
      <table v-if="user">
        <tr>
          <th>Full Name</th>
          <td>
            <input v-if="editing.full_name" v-model="user.full_name" />
            <span v-else>{{ user.full_name }}</span>
          </td>
          <td>
            <button @click="toggleEdit('full_name')">{{ editing.full_name ? 'Save' : 'Edit' }}</button>
          </td>
        </tr>
        <tr>
          <th>Chatter Name</th>
          <td>
            <input v-if="editing.chatter_name" v-model="user.chatter_name" />
            <span v-else>{{ user.chatter_name }}</span>
          </td>
          <td>
            <button @click="toggleEdit('chatter_name')">{{ editing.chatter_name ? 'Save' : 'Edit' }}</button>
          </td>
        </tr>
        <tr>
          <th>Email</th>
          <td>
            <input v-if="editing.email" v-model="user.email" />
            <span v-else>{{ user.email }}</span>
          </td>
          <td>
            <button @click="toggleEdit('email')">{{ editing.email ? 'Save' : 'Edit' }}</button>
          </td>
        </tr>
        <tr>
          <th>Password</th>
          <td>
            <input v-if="editing.password" type="password" v-model="user.password" />
            <span v-else>********</span>
          </td>
          <td>
            <button @click="toggleEdit('password')">{{ editing.password ? 'Save' : 'Edit' }}</button>
          </td>
        </tr>
        <tr>
          <th>About Me</th>
          <td>
            <textarea v-if="editing.about_me" v-model="user.about_me"></textarea>
            <span v-else>{{ user.about_me }}</span>
          </td>
          <td>
            <button @click="toggleEdit('about_me')">{{ editing.about_me ? 'Save' : 'Edit' }}</button>
          </td>
        </tr>
      </table>
      <div v-else>
        Loading user data...
      </div>
      <button class="deactivate-button" @click="showDeactivateModal">Deactivate Account</button>
    </div>

    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h2>Sure you want to go Bloggabug?</h2>
        <div class="modal-actions">
          <button class="confirm" @click="confirmDeactivation">
            <font-awesome-icon :icon="['fas', 'circle-check']" /> 
          </button>
          <button class="cancel" @click="hideDeactivateModal">
            <font-awesome-icon :icon="['fas', 'circle-xmark']" /> 
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from './supabase';
import NavBar from '../components/NavBar.vue';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

interface User {
  id: string;
  full_name: string;
  chatter_name: string;
  email: string;
  password: string;
  about_me: string;
}

export default defineComponent({
  name: 'ProfileSettings',
  components: {
    NavBar,
    FontAwesomeIcon,
  },
  setup() {
    const router = useRouter();
    const user = ref<User | null>(null);
    const editing = ref<Record<string, boolean>>({
      full_name: false,
      chatter_name: false,
      email: false,
      password: false,
      about_me: false,
    });
    const showModal = ref(false);

    const fetchUserData = async () => {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        console.error('User ID not found in local storage');
        return;
      }

      const userId = JSON.parse(currentUser).id;

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
        console.log('User data fetched:', data);
        user.value = data;
      }
    };

    const toggleEdit = async (field: keyof User) => {
      if (!user.value) return;

      if (editing.value[field]) {
        console.log(`Saving ${field}:`, user.value[field]);
        const { error } = await supabase
          .from('users')
          .update({ [field]: user.value[field] })
          .eq('id', user.value.id);

        if (error) {
          console.error(`Error updating ${field}:`, error.message);
          return;
        }
        console.log(`${field} saved successfully.`);
      }

      editing.value[field] = !editing.value[field];
    };

    const showDeactivateModal = () => {
      showModal.value = true;
    };

    const hideDeactivateModal = () => {
      showModal.value = false;
    };

    const confirmDeactivation = async () => {
      if (!user.value) return;

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user.value.id);

      if (error) {
        console.error('Error deactivating account:', error.message);
        return;
      }

      console.log('Account deactivated successfully.');
      localStorage.removeItem('currentUser');
      router.push('/login'); // Redirect to login page
    };

    onMounted(() => {
      fetchUserData();
    });

    return {
      user,
      editing,
      toggleEdit,
      showDeactivateModal,
      hideDeactivateModal,
      confirmDeactivation,
      showModal,
    };
  },
});
</script>

<style scoped>
/* CSS Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.profile-settings {
  
  height: 100vh;
  padding-right: 50px;
  padding-left: 50px;
}

.content {
  background-color: #1e2127;
  padding: 20px 300px 20px 300px;
  width: 100%;
  max-width: 100%;
  height: 100vh;
}

h1 {
  color: #cebfad;
  margin-bottom: 20px;
  text-align: center;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

th, td {
  padding: 10px;
  /* border: 1px solid #ddd; */
}

th {
  background-color: #2b3138;
  color: #cebfad;
}

td input,
td textarea {
  width: 100%;
  padding: 8px;
  background-color: #2b3138;
  color: #cebfad;
  border: none;
  border-radius: 4px;
  
}
td{
  color: white;
}
button {
  padding: 5px 10px;
  background-color: #fd662f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #e04a2e;
}

.deactivate-button {
  width: 100%;
  margin-top: 10px;
  background-color: red;
}

.deactivate-button:hover {
  background-color: darkred;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: #1e2127;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  color: #cebfad;
  width: 25%;
}

.modal-actions {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
}

.modal-actions button {
  display: flex;
  align-items: center;

}

.confirm {
  background-color: #28a745;
  font-size: 30px;
}

.confirm:hover {
  background-color: #218838;
  
}

.cancel {
  background-color: #dc3545;
  font-size: 30px;
}

.cancel:hover {
  background-color: #c82333;
}


@media (max-width: 430px) {
  .profile-settings {
  
  height: 100vh;
  padding-right: 1px;
  padding-left: 1px;
}

.content {
  background-color: #1e2127;
  padding: 20px 5px 20px 5px;
  width: 100%;
  max-width: 100%;
  height: 100vh;
}

.deactivate-button {
  width: 50%;
  margin-top: 10px;
  background-color: red;
  align-self: center;
}


}


</style>
