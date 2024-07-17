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
      <div class="categories">
        <h2>Select Your Interested Categories</h2>
        <div class="selected-categories">
          <input v-for="category in selectedCategories" :key="category" type="text" :value="category" readonly />
        </div>
        <div class="category-buttons">
          <button v-for="category in categories" :key="category" :class="{'selected': selectedCategories.includes(category)}" @click="toggleCategorySelection(category)">
            {{ category }}
          </button>
        </div>
        <div v-if="selectedCategories.length >= 5" class="limit-message">
          You can only select up to 5 categories.
        </div>
        <button @click="saveCategories" class="accept-button">Accept</button>
      </div>
      <button class="deactivate-button" @click="showDeactivateModal">Deactivate Account</button>
    </div>

    <div v-if="showModal" class="modal">
      <div class="modal-content">
        <h2>Are you sure you want to deactivate your account?</h2>
        <div class="modal-actions">
          <button class="confirm" @click="confirmDeactivation">Yes</button>
          <button class="cancel" @click="hideDeactivateModal">No</button>
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

interface User {
  id: string;
  full_name: string;
  chatter_name: string;
  email: string;
  password: string;
  about_me: string;
  interest_id: string;
}

export default defineComponent({
  name: 'ProfileSettings',
  components: {
    NavBar,
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

    const categories = [
      'Health and Wellness', 'Fitness and Exercise', 'Nutrition and Diet', 'Mental Health and Well-being',
      'Yoga and Meditation', 'Beauty and Skincare', 'Fashion and Style', 'Travel and Adventure', 'Solo Travel Tips',
      'Budget Travel', 'Luxury Travel Destinations', 'Digital Nomad Lifestyle', 'Home Decor and Interior Design',
      'DIY Home Projects', 'Gardening and Landscaping', 'Parenting Tips and Advice', 'Pregnancy and Newborn Care',
      'Toddler Activities', 'Education and Learning', 'Homeschooling Tips', 'Student Life and Study Hacks',
      'Career Development', 'Resume Writing Tips', 'Job Interview Preparation', 'Personal Finance', 
      'Investing and Wealth Management', 'Budgeting and Saving Tips', 'Side Hustles and Freelancing',
      'Entrepreneurship and Startups', 'Marketing and Branding Strategies', 'Social Media Tips and Trends',
      'Tech Gadgets and Reviews', 'Software and App Development', 'Coding and Programming', 
      'Web Design and Development', 'Photography Tips and Techniques', 'Art and Creativity', 
      'Music and Concert Reviews', 'Film and TV Show Reviews', 'Book Recommendations and Reviews', 
      'Literary Analysis and Criticism', 'History and Historical Events', 'Philosophy and Ethics', 
      'Religion and Spirituality', 'Cultural Traditions and Festivals', 'Environmental Issues and Conservation', 
      'Climate Change Solutions', 'Wildlife and Nature Conservation', 'Adventure Sports and Extreme Activities', 
      'Sports News and Updates'
    ];

    const selectedCategories = ref<string[]>([]);

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
        selectedCategories.value = data.interest_id ? data.interest_id.split(',') : [];
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

    const toggleCategorySelection = (category: string) => {
      if (selectedCategories.value.includes(category)) {
        selectedCategories.value = selectedCategories.value.filter(item => item !== category);
      } else if (selectedCategories.value.length < 5) {
        selectedCategories.value.push(category);
      }
    };

    const showDeactivateModal = () => {
      showModal.value = true;
    };

    const hideDeactivateModal = () => {
      showModal.value = false;
    };

    const confirmDeactivation = async () => {
      if (!user.value) return;

      // Delete related notifications
      const { error: deleteNotificationsError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.value.id);

      if (deleteNotificationsError) {
        console.error('Error deleting related notifications:', deleteNotificationsError.message);
        return;
      }

      // Delete related blog posts
      const { error: deleteBlogPostsError } = await supabase
        .from('blog_post')
        .delete()
        .eq('user_id', user.value.id);

      if (deleteBlogPostsError) {
        console.error('Error deleting related blog posts:', deleteBlogPostsError.message);
        return;
      }

      // Delete the user
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

    const saveCategories = async () => {
      if (!user.value) return;

      const { error } = await supabase
        .from('users')
        .update({ interest_id: selectedCategories.value.join(',') })
        .eq('id', user.value.id);

      if (error) {
        console.error('Error saving categories:', error.message);
        return;
      }

      console.log('Categories saved successfully.');
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
      categories,
      selectedCategories,
      toggleCategorySelection,
      saveCategories,
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
  padding-top: 82px;
}

.content {
  background-color: #1e2127;
  padding: 20px 50px 20px 50px;
  width: 100%;
  max-width: 100%;
  min-height: 100vh; /* Ensure content covers full height */
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
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

th, td {
  padding: 10px;
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
  resize: none; /* Disable resize for textarea */
  height: 50px;
}

td {
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

.categories {
  margin-top: 20px;
}

.categories h2 {
  color: #cebfad;
  margin-bottom: 10px;
}

.selected-categories input {
  background-color: #2b3138;
  color: #cebfad;
  border: none;
  border-radius: 4px;
  padding: 5px;
  margin-right: 5px;
  width: auto;
  margin-bottom: 30px;
}

.category-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.category-buttons button {
  background-color: #2b3138;
  color: #cebfad;
  border: none;
  border-radius: 4px;
  padding: 5px 10px; /* Make the buttons smaller */
  cursor: pointer;
}

.category-buttons button.selected {
  background-color: #fd662f;
  color: white;
}

.accept-button {
  margin-top: 10px;
}

.limit-message {
  color: red;
  margin-top: 10px;
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
  padding: 10px 20px;
}

.confirm {
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.confirm:hover {
  background-color: #218838;
}

.cancel {
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
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
    min-height: 100vh; /* Ensure content covers full height */
  }

  .deactivate-button {
    width: 50%;
    margin-top: 10px;
    background-color: red;
    align-self: center;
  }
}
</style>
