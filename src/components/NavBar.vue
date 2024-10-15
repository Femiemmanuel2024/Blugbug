<template>
  <nav class="navbar">
    <div class="navbar-left">
      <img src="/brand_logo.svg" alt="BloggaBug Logo" class="brandlogo" />
    </div>
    <div class="navbar-right">
      <!-- Home Link -->
      <router-link to="/home" class="nav-icon" @click="navigate('/home', $event)">
        <font-awesome-icon :icon="['fas', 'house']" class="icon" />
        <span class="icon-label">Home</span>
      </router-link>

      <!-- MyBlug Link -->
      <router-link to="/MyBlug" class="nav-icon" @click="navigate('/MyBlug', $event)">
        <font-awesome-icon :icon="['fas', 'comments']" class="icon" />
        <span class="icon-label">MyBlug</span>
      </router-link>

      <!-- Blug Page Link -->
      <router-link to="/BlugPage" class="nav-icon blug-icon" @click="navigate('/BlugPage', $event)">
        <font-awesome-icon :icon="['fas', 'globe']" class="icon" />
        <span class="icon-label">Blug</span>
      </router-link>

      <!-- Alerts Icon with Notification Counter -->
      <div class="nav-icon" @click="toggleNotifications">

        <span v-if="unreadCount" class="unread-count">{{ unreadCount }}</span>
        <font-awesome-icon :icon="['fas', 'bell']" class="icon" />
        <span class="icon-label">Alerts</span>
      


      </div>

      <!-- Notification Dropdown -->
      <div v-if="showNotifications" class="notification-list">
        <div class="notification-controls">
          <div class="control-column">
            <button @click="checkForNotifications" class="control-button">
              <font-awesome-icon :icon="['fas', 'arrows-rotate']" class="iconB" />
              <div class="control-label">Refresh</div>
            </button>
          </div>
          <div class="control-column">
            <button @click="deleteAllNotifications" class="control-button">
              <font-awesome-icon :icon="['fas', 'circle-xmark']" class="iconB" />
              <div class="control-label">Clear</div>
            </button>
          </div>
          <div class="control-column">
            <button @click="navigateToNotificationHistory" class="control-button">
              <font-awesome-icon :icon="['fas', 'clock-rotate-left']" class="iconB" />
              <div class="control-label">View</div>
            </button>
          </div>
        </div>
        <ul>
          <li v-for="notification in notifications" :key="notification.id">
            <span @click="markAsRead(notification)" class="notification-message link">
              {{ notification.message }}
            </span>
          </li>
        </ul>
      </div>

      <!-- Settings Link -->
      <router-link to="/settings" class="nav-icon" @click="navigate('/settings', $event)">
        <font-awesome-icon :icon="['fas', 'gear']" class="icon" />
        <span class="icon-label">Settings</span>
      </router-link>

      <!-- Admin Manager Link -->
      <router-link v-if="isAdmin" to="/admin-manager" class="nav-icon" @click="navigate('/admin-manager', $event)">
        <font-awesome-icon :icon="['fas', 'toolbox']" class="icon" />
        <span class="icon-label">Admin Manager</span>
      </router-link>

      <!-- Logout Link -->
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
import { supabase } from './supabase';

export default defineComponent({
  name: 'NavBar',
  components: {
    FontAwesomeIcon,
  },
  setup(_, { emit }) {
    const router = useRouter();
    const isAdmin = ref(false);
    const unreadCount = ref(0);
    const notifications = ref([]);
    const showNotifications = ref(false);
    const adminId = '73170619-38c9-45d5-afe8-324709ef325a';

    onMounted(() => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (currentUser.id === adminId) {
        isAdmin.value = true;
      }
      fetchNotifications();
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

    const fetchNotifications = async () => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (currentUser.id) {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('read', false)
          .order('created_at', { ascending: false });

        if (!error) {
          notifications.value = data;
          unreadCount.value = notifications.value.length;
        }
      }
    };

    const toggleNotifications = () => {
      showNotifications.value = !showNotifications.value;
      if (showNotifications.value) {
        fetchNotifications();
      }
    };

    const markAsRead = async (notification) => {
      const { id } = notification;
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      notifications.value = notifications.value.filter((n) => n.id !== id);
      unreadCount.value = notifications.value.length;
    };

    return {
      isAdmin,
      navigate,
      logout,
      toggleNotifications,
      unreadCount,
      notifications,
      markAsRead,
      showNotifications,
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

.navbar-left,
.navbar-right {
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
  position: relative; /* For notification counter */
  cursor: pointer; /* Ensure pointer cursor */
}

.unread-count {
  background-color: red;
  color: white;
  border-radius: 50%;
  padding: 3px 3px;
  font-size: 10px;
  position: absolute;
  top: -10px;
  right: 35px;
  height: 10px;
  width: 10px;
  border: 1px solid white;
  text-align: center;
}

.notification-list {
  position: absolute;
  top: 70px;
  right: 70px;
  background-color: rgb(36, 36, 36);
  color: white;
  border-radius: 5px;
  width: 300px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 10000;
  font-size: 12px;
}

.notification-controls {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background-color: #fd662f;
  border-bottom: 1px solid #444;
}

.control-column {
  display: flex;
  justify-content: center;
  width: 33%;
}

.control-button {
  width: 100%;
  background-color: #fd662f;
  border: none;
  padding: 0px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 12px;
  text-align: center;
  color: rgb(255, 255, 255);
  transition: transform 0.2s;
}

.control-button:hover {
  transform: scale(1.05);
}

.router-link-active {
  color: orange !important; /* Active nav link color */
}

.nav-icon:hover {
  color: #e04a2e; /* Hover color */
}

.notification-list ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.notification-list li {
  padding: 10px;
  border-bottom: 1px solid #444;
  cursor: pointer;
  color: #cebfad;
}

.notification-list li:hover {
  background-color: #1e2127;
}

.notification-list li:last-child {
  border-bottom: none;
}

.notification-message.link {
  cursor: pointer;
  color: #cebfad;
  font-size: 12px;
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
  .unread-count {
  background-color: red;
  color: white;
  border-radius: 50%;
  padding: 3px 3px;
  font-size: 10px;
  position: absolute;
  top: -10px;
  right: 15px;
  height: 10px;
  width: 10px;
  border: 1px solid white;
  text-align: center;
}
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

  .notification-list {
  position: absolute;
  top: 120px;
  right: 55px;
  background-color: rgb(36, 36, 36);
  color: white;
  border-radius: 5px;
  width: 300px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 10000;
  font-size: 12px;
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