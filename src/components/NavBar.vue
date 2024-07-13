<template>
  <nav class="navbar">
    <div class="navbar-left">
      <ActionNotification class="nav-icon" @click="animateIcon($event)" />
      <DeleteAllPostsButton class="nav-icon" @click="animateIcon($event)">
        <font-awesome-icon :icon="['fas', 'trash-alt']" />
        <span class="icon-label">Delete</span>
      </DeleteAllPostsButton>
      <div class="brandlogo">BloggaBug</div>
    </div>
    <div class="navbar-right">
      <router-link to="/home" class="nav-icon" @click="animateIcon($event)">
        <font-awesome-icon :icon="['fas', 'house']" />
        <span class="icon-label">Home</span>
      </router-link>
      <router-link to="/chatters" class="nav-icon" @click="animateIcon($event)">
        <font-awesome-icon :icon="['fas', 'comments']" />
        <span class="icon-label">Chatters</span>
      </router-link>
      <router-link to="/analytics" class="nav-icon" @click="animateIcon($event)">
        <font-awesome-icon :icon="['fas', 'chart-line']" />
        <span class="icon-label">Analytics</span>
      </router-link>
      <router-link to="/settings" class="nav-icon" @click="animateIcon($event)">
        <font-awesome-icon :icon="['fas', 'gear']" />
        <span class="icon-label">Settings</span>
      </router-link>
      <router-link to="/login" class="nav-icon" @click.native="logout">
        <font-awesome-icon :icon="['fas', 'sign-out-alt']" />
        <span class="icon-label">Logout</span>
      </router-link>
    </div>
  </nav>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import DeleteAllPostsButton from './UserProfile/DeleteAllPostsButton.vue';
import ActionNotification from './infofeatures/ActionNotification.vue';

export default defineComponent({
  name: 'NavBar',
  components: {
    DeleteAllPostsButton,
    ActionNotification,
  },
  setup(_, { emit }) {
    const router = useRouter();

    const logout = () => {
      // Clear all data from local storage
      localStorage.clear();
      // Emit logout event (if needed)
      emit('logout');
      // Redirect to the login page
      router.push('/login');
    };

    const animateIcon = (event: MouseEvent) => {
      const icon = event.currentTarget as HTMLElement;
      icon.classList.add('animate');
      setTimeout(() => {
        icon.classList.remove('animate');
      }, 300); // Duration of the animation
    };

    return {
      logout,
      animateIcon,
    };
  },
});
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css');

.navbar {
  display: flex;
  justify-content: space-between; /* Space between left and right sections */
  align-items: center;
  padding: 10px 0px 10px 10px; /* Padding for spacing */
  background-color: #1e2127;
}

.navbar-left, .navbar-right {
  display: flex;
  align-items: center;
}

.navbar-right {
  background-color: rgba(43, 49, 56, 1);
  overflow: hidden;
  border-radius: 0px;
  height: 70px;
  width: 25.2%;
}

.nav-icon {
  display: flex;
  flex-direction: column; /* Column layout to place label below icon */
  justify-content: center;
  align-items: center;
  color: rgb(255, 255, 255);
  text-decoration: none;
  font-size: 14px; /* Adjust font size for icon */
  margin: 0 10px;
  width: 40px; /* Fixed width */
  height: 40px; /* Fixed height */
  border-radius: 50%;
  transition: transform 0.3s;
}

.icon-label {
  font-size: 12px; /* Smaller font size for label */
  margin-top: 5px; /* Space between icon and label */
}



.nav-icon:active {
  transform: scale(0.9);
}

.animate {
  animation: click-animation 0.3s ease;
}

.brandlogo {
  color: bisque;
}

@keyframes click-animation {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1);
  }
}
</style>
