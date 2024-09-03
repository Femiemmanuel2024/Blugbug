<template>
  <nav class="navbar">
    <div class="navbar-left">
      <img src="/brand_logo.svg" alt="BloggaBug Logo" class="brandlogo" />
    </div>
    <div class="navbar-right">
      <router-link to="/home" class="nav-icon" @click="navigate('/home', $event)">
        <font-awesome-icon :icon="['fas', 'house']" class="icon" />
        <span class="icon-label">Home</span>
      </router-link>
      <router-link to="/MyBlug" class="nav-icon" @click="navigate('/MyBlug', $event)">
        <font-awesome-icon :icon="['fas', 'comments']" class="icon" />
        <span class="icon-label">MyBlug</span>
      </router-link>
      <router-link to="/BlugPage" class="nav-icon blug-icon" @click="navigate('/BlugPage', $event)">
        <font-awesome-icon :icon="['fas', 'globe']" class="icon" />
        <span class="icon-label">Blug</span>
      </router-link>

      <!-- Grouping ActionNotification with nav icons -->
      <div class="nav-icon" @click="animateIcon($event)">
        <ActionNotification />
        <!-- <span class="icon-label">Alert</span> -->
      </div>

      <router-link to="/settings" class="nav-icon" @click="navigate('/settings', $event)">
        <font-awesome-icon :icon="['fas', 'gear']" class="icon" />
        <span class="icon-label">Settings</span>
      </router-link>

      <router-link v-if="isAdmin" to="/admin-manager" class="nav-icon" @click="navigate('/admin-manager', $event)">
        <font-awesome-icon :icon="['fas', 'toolbox']" class="icon" />
        <span class="icon-label">Admin Manager</span>
      </router-link>

      <router-link to="/login" class="nav-icon" @click="logout">
        <font-awesome-icon :icon="['fas', 'sign-out-alt']" class="icon" />
        <span class="icon-label">Logout</span>
      </router-link>
    </div>
  </nav>
</template>


<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import ActionNotification from './infofeatures/ActionNotification.vue';

export default defineComponent({
  name: 'NavBar',
  components: {
    FontAwesomeIcon,
    ActionNotification,
  },
  setup(_, { emit }) {
    const router = useRouter();
    const isAdmin = ref(false);
    const adminId = '73170619-38c9-45d5-afe8-324709ef325a';

    onMounted(() => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (currentUser.id === adminId) {
        isAdmin.value = true;
      }
    });

    const navigate = async (path: string, event: MouseEvent) => {
      event.preventDefault();
      router.push(path);
    };

    const logout = () => {
      localStorage.clear();
      emit('logout');
      router.push('/login');
    };

    const animateIcon = (event: MouseEvent) => {
      const icon = event.currentTarget as HTMLElement;
      icon.classList.add('animate');
      setTimeout(() => {
        icon.classList.remove('animate');
      }, 300);
    };

    return {
      isAdmin,
      logout,
      navigate,
      animateIcon,
    };
  },
});
</script>

<style scoped>
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css');

.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #1e2127;
  box-shadow: 0 0px 5px rgba(0, 0, 0, 0.9);
  z-index: 9998;
}

.navbar-left, .navbar-right {
  display: flex;
  align-items: center;
}

.navbar-left {
  padding-left: 60px;
}

.navbar-right {
  justify-content: flex-end;
  padding-right: 40px;
}

.nav-icon {
  display: flex;
  align-items: center;
  color: rgb(255, 255, 255);
  text-decoration: none;
  font-size: 14px;
  margin: 0 10px;
  transition: transform 0.3s;
}

.nav-icon .icon-label {
  margin-left: 5px;
  font-size: 14px;
}

.nav-icon-alert {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin: 0 0px;
}

.alert-label {
  margin-left: 5px; /* Ensure text is right next to the icon */
  font-size: 14px;
  color: rgb(255, 255, 255);
}

.nav-icon:active {
  transform: scale(0.9);
}

.nav-icon:hover {
  color: #fd662f;
}

.animate {
  animation: click-animation 0.3s ease;
}

.brandlogo {
  height: 70px;
  width: auto;
  margin-right: 0px;
  transition: transform 0.3s ease;
}

.brandlogo:hover {
  transform: scale(1.1);
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

.router-link-active {
  color: #fd662f !important;
}

.blug-icon:hover .icon {
  animation: hover-animation 0.3s ease;
}

::v-deep .notification-list {
  z-index: 10000;
}

@media (max-width: 480px) {
  .navbar {
    flex-direction: column;
    align-items: center;
  }
  .navbar-left {
    flex-direction: column;
    padding-left: 0;
    padding-bottom: -20px;
    margin-bottom: -10px;
  }
  .navbar-right {
    justify-content: center;
    width: 100%;
    padding-right: 0;
    padding-top: 0px;
  }
  .nav-icon {
    font-size: 18px;
    margin-top: 20px;
    margin-bottom: 20px;
    width: 100%;
    padding-left: 12px;
  }
  .icon-label {
    display: none;
  }



  .alert-label{
    display: none;
  }
}

@media (min-width:481px) and (max-width:768px) {
  /* Add your specific styles here */
}

@media (min-width: 768px) and (max-width: 1024px) {
  .navbar {
    padding: 5px 5px;
  }
  .navbar-left {
    padding-left: 30px;
  }
  .navbar-right {
    padding-right: 20px;
  }
  .nav-icon {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: rgb(255, 255, 255);
    text-decoration: none;
    font-size: 14px;
    margin: 0 10px;
    transition: transform 0.3s;
  }
}
</style>
