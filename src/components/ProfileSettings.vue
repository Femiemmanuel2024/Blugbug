<template>
  <div class="profile-settings">
    <NavBar />
    <div class="content">
      <h1>Profile Settings</h1>
      <table v-if="user">
        <!-- Full Name -->
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
        <!-- Blugger Name -->
        <tr>
          <th>Blugger Name</th>
          <td>
            <input v-if="editing.chatter_name" v-model="user.chatter_name" />
            <span v-else>{{ user.chatter_name }}</span>
          </td>
          <td>
            <button @click="toggleEdit('chatter_name')">{{ editing.chatter_name ? 'Save' : 'Edit' }}</button>
          </td>
        </tr>
        <!-- Email -->
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
        <!-- Password -->
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
        <!-- About Me -->
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
        <!-- Secret Question -->
        <tr>
          <th>Secret Question</th>
          <td>
            <select v-if="editing.secret_question" v-model="user.secret_question">
              <option disabled value="">Select a Secret Question</option>
              <option v-for="question in secretQuestions" :key="question" :value="question">
                {{ question }}
              </option>
            </select>
            <span v-else>{{ user.secret_question }}</span>
          </td>
          <td>
            <button @click="toggleEdit('secret_question')">{{ editing.secret_question ? 'Save' : 'Edit' }}</button>
          </td>
        </tr>
        <!-- Secret Answer -->
        <tr>
          <th>Secret Answer</th>
          <td>
            <input v-if="editing.secret_answer" v-model="user.secret_answer" />
            <span v-else>{{ user.secret_answer ? '******' : '' }}</span>
          </td>
          <td>
            <button @click="toggleEdit('secret_answer')">{{ editing.secret_answer ? 'Save' : 'Edit' }}</button>
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
          <button
            v-for="category in categories"
            :key="category"
            :class="{'selected': selectedCategories.includes(category)}"
            @click="toggleCategorySelection(category)"
            @mouseover="showTooltip($event, category)"
            @mouseout="hideTooltip"
          >
            {{ category }}
            <span class="tooltip">{{ category }}</span>
          </button>
        </div>
        <div v-if="selectedCategories.length >= 5" class="limit-message">
          You can only select up to 5 categories.
        </div>
        <div class="accept-button-container">
          <button @click="saveCategories" class="accept-button">Accept</button>
        </div>
      </div>
      <p class='deactivate-message'>
        If you're considering deactivating your account, please reach out to us first. We're here to help resolve any issues you may be experiencing, and you may not need to deactivate your account after all.
      </p>
      <button class="deactivate-button" @click="showDeactivateModal">Deactivate Account</button>
    </div>

    <!-- Security Warning Modal -->
    <div v-if="showWarningModal" class="warning-modal">
      <div class="warning-modal-content">
        <font-awesome-icon :icon="['fas', 'circle-xmark']" class="close-icon" @click="closeWarningModal" />
        <h2>SECURITY WARNING</h2>
        <p>Add a secret question and answer for enhanced security.</p>
      </div>
    </div>
    
    <!-- Deactivation Modal -->
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
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

interface User {
  id: string;
  full_name: string;
  chatter_name: string;
  email: string;
  password: string;
  about_me: string;
  interest_id: string;
  secret_question: string;
  secret_answer: string;
}

export default defineComponent({
  name: 'ProfileSettings',
  components: {
    NavBar,
    FontAwesomeIcon
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
      secret_question: false,
      secret_answer: false,
    });
    const showModal = ref(false);
    const showWarningModal = ref(false);

    const secretQuestions = [
      'What was the name of your first pet?',
      'What is your mother’s maiden name?',
      'What was the make and model of your first car?',
      'What is the name of your favorite childhood friend?',
      'In what city were you born?',
      'What is your favorite book?'
    ];

    const categories = [
      "Health", "Fitness", "Nutrition", "MentalHealth", "Meditation", "Skincare", "Fashion",
      "Travel", "SoloTravel", "BudgetTravel", "LuxuryTravel", "Nomad", "HomeDecor", "DIY",
      "Gardening", "Parenting", "Pregnancy", "Toddler", "Education", "Homeschooling", "Student",
      "Career", "Resume", "Interview", "Finance", "Investing", "Budgeting", "SideHustles",
      "Entrepreneurship", "Marketing", "SocialMedia", "Tech", "Software", "Coding", "WebDesign",
      "Photography", "Art", "Music", "Film", "Books", "Literature", "History", "Philosophy",
      "Religion", "Culture", "Environment", "Climate", "Wildlife", "Adventure", "Sports"
    ];

    const selectedCategories = ref<string[]>([]);

    const fetchUserData = async () => {
      const currentUser = localStorage.getItem('currentUser');
      if (!currentUser) {
        return;
      }

      const userId = JSON.parse(currentUser).id;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return;
      }

      if (data) {
        user.value = data;
        selectedCategories.value = data.interest_id ? data.interest_id.split(',') : [];
        checkSecuritySettings(); // Check for missing secret question or answer
      }
    };

    const toggleEdit = async (field: keyof User) => {
      if (!user.value) return;

      if (editing.value[field]) {
        const { error } = await supabase
          .from('users')
          .update({ [field]: user.value[field] })
          .eq('id', user.value.id);

        if (error) {
          return;
        }
      }

      editing.value[field] = !editing.value[field];
    };

    const checkSecuritySettings = () => {
      if (!user.value?.secret_question || !user.value?.secret_answer) {
        showWarningModal.value = true;
      }
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

    const closeWarningModal = () => {
      showWarningModal.value = false;
    };

    const confirmDeactivation = async () => {
      if (!user.value) return;

      // Delete notifications associated with the user
      const { error: deleteNotificationsError } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.value.id);

      if (deleteNotificationsError) {
        console.error('Error deleting notifications:', deleteNotificationsError.message);
        return;
      }

      // Delete blog posts associated with the user
      const { error: deleteBlogPostsError } = await supabase
        .from('blog_post')
        .delete()
        .eq('user_id', user.value.id);

      if (deleteBlogPostsError) {
        console.error('Error deleting blog posts:', deleteBlogPostsError.message);
        return;
      }

      // Remove the user ID from followers_id arrays in the users table
      const { data: usersWithFollower, error: followersError } = await supabase
        .from('users')
        .select('id, followers_id');

      if (followersError) {
        console.error('Error fetching followers:', followersError.message);
        return;
      }

      if (usersWithFollower) {
        for (const otherUser of usersWithFollower) {
          const updatedFollowers = otherUser.followers_id?.filter((followerId: string) => followerId !== user.value!.id);
          
          const { error: updateError } = await supabase
            .from('users')
            .update({ followers_id: updatedFollowers })
            .eq('id', otherUser.id);

          if (updateError) {
            console.error('Error updating followers:', updateError.message);
            return;
          }
        }
      }

      // Delete the user from the users table
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', user.value.id);

      if (error) {
        console.error('Error deleting user:', error.message);
        return;
      }

      localStorage.removeItem('currentUser');
      router.push('/login');
    };

    const saveCategories = async () => {
      if (!user.value) return;

      const { error } = await supabase
        .from('users')
        .update({ interest_id: selectedCategories.value.join(',') })
        .eq('id', user.value.id);

      if (error) {
        return;
      }
    };

    const showTooltip = (event: MouseEvent, category: string) => {
      const tooltip = (event.currentTarget as HTMLElement).querySelector('.tooltip') as HTMLElement;
      tooltip.style.visibility = 'visible';
      tooltip.textContent = category; // Use the category parameter to set the tooltip text
    };

    const hideTooltip = (event: MouseEvent) => {
      const tooltip = (event.currentTarget as HTMLElement).querySelector('.tooltip') as HTMLElement;
      tooltip.style.visibility = 'hidden';
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
      closeWarningModal,
      confirmDeactivation,
      showModal,
      showWarningModal,
      secretQuestions,
      categories,
      selectedCategories,
      toggleCategorySelection,
      saveCategories,
      showTooltip,
      hideTooltip,
    };
  },
});
</script>

<style scoped>
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
  padding-top: 63px;
}

.content {
  background-color: #1e2127;
  padding: 20px 50px 20px 50px;
  width: 100%;
  max-width: 100%;
  min-height: 100vh;
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
td textarea,
td select {
  width: 100%;
  padding: 8px;
  background-color: #2b3138;
  color: #cebfad;
  border: none;
  border-radius: 4px;
  resize: none;
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
  width: 200px;
  margin-bottom: 10px;
  border-bottom: 1px solid #cebfad;
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
  padding: 5px 10px;
  cursor: pointer;
  width: 205px;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  position: relative;
}

.category-buttons button.selected {
  background-color: #fd662f;
  color: white;
}

.category-buttons button .tooltip {
  visibility: hidden;
  width: auto;
  background-color: black;
  color: #fff;
  text-align: center;
  border-radius: 6px;
  padding: 5px;
  position: absolute;
  z-index: 1;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 5px;
  white-space: nowrap;
}

.category-buttons button:hover .tooltip {
  visibility: visible;
}

.accept-button-container {
  display: flex;
  justify-content: flex-end;
}

.accept-button {
  margin-top: 10px;
  width: 210px;
  margin-bottom: 10px;
}

.limit-message {
  color: red;
  margin-top: 10px;
}

.deactivate-message {
  padding-top: 50px;
  color: #cebfad;
  border-top: 1px solid orange;
}

.deactivate-button {
  width: 50%;
  margin-top: 10px;
  background-color: red;
  justify-content: end;
  margin-bottom: 100px;
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

.warning-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
}

.warning-modal-content {
  background: red;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  color: white;
  width: 400px;
  position: relative;
}

.close-icon {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 18px;
  cursor: pointer;
  color: white;
}


/* CSS for iPad screen size */
@media screen and (min-width: 768px) and (max-width: 1024px) {
  /* Add styles for iPad screen size here */
}

/* CSS for phone screen size */
@media screen and (max-width: 767px) {
  .profile-settings {
  height: 100vh;
  padding-right: 2px;
  padding-left: 2px;
  padding-top: 160px;
}

.content {
  background-color: #1e2127;
  padding: 20px 0px 20px 0px;
  width: 100%;
  max-width: 100%;
  min-height: 100vh;
}

.category-buttons button {
  background-color: #2b3138;
  color: #cebfad;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  cursor: pointer;
  width: 100%;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  position: relative;
}

.deactivate-button{
  width: 100%;
}

.accept-button {
  margin-top: 10px;
  width: 100%;
  margin-bottom: 10px;
}

.selected-categories input {
  background-color: #2b3138;
  color: #cebfad;
  border: none;
  border-radius: 4px;
  padding: 5px;
  margin-right: 5px;
  width: 100%;
  margin-bottom: 10px;
  border-bottom: 1px solid #cebfad;
}
  /* Add styles for phone screen size here */
}
</style>
