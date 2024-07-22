<template>
  <nav class="navbar">
    <div class="navbar-left">
      <img src="/brand_logo.svg" alt="BloggaBug Logo" class="brandlogo" />
    </div>
    <div class="navbar-right">
      <router-link to="/home" class="nav-icon" @click="animateIcon($event)">
        <font-awesome-icon :icon="['fas', 'house']" />
        <span class="icon-label">Home</span>
      </router-link>
      <router-link to="/MyBlug" class="nav-icon" @click="animateIcon($event)">
        <font-awesome-icon :icon="['fas', 'comments']" />
        <span class="icon-label">MyBlug</span>
      </router-link>
      <router-link to="/BlugPage" class="nav-icon blug-icon" @click="animateFlipIcon($event)">
        <font-awesome-icon :icon="['fas', 'globe']" />
        <span class="icon-label">Blug</span>
      </router-link>
      <div class="nav-icon alert-icon" @click="animateIcon($event)">
        <ActionNotification />
      </div>
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
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
import ActionNotification from './infofeatures/ActionNotification.vue';

export default defineComponent({
  name: 'NavBar',
  components: {
    ActionNotification,
  },
  setup(_, { emit }) {
    const router = useRouter();

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

    const animateFlipIcon = (event: MouseEvent) => {
      const icon = event.currentTarget as HTMLElement;
      icon.classList.add('animate-flip');
      setTimeout(() => {
        icon.classList.remove('animate-flip');
      }, 300);
    };

    return {
      logout,
      animateIcon,
      animateFlipIcon,
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
  /* padding: 10px 10px; */
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
  padding-right: 60px;
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

.nav-icon:active {
  transform: scale(0.9);
}

.nav-icon:hover {
  color: #fd662f;
}

.animate {
  animation: click-animation 0.3s ease;
}

.animate-flip {
  animation: flip-animation 0.3s ease;
}

.brandlogo {
  height: 50px; /* Adjust height as needed */
  width: 100%;
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

@keyframes flip-animation {
  0% {
    transform: rotateY(0);
  }
  50% {
    transform: rotateY(180deg);
  }
  100% {
    transform: rotateY(360deg);
  }
}

@keyframes hover-animation {
  0% {
    transform: rotateY(0);
  }
  50% {
    transform: rotateY(180deg);
  }
  100% {
    transform: rotateY(360deg);
  }
}

.router-link-active {
  color: #fd662f !important;
}

.blug-icon:hover {
  animation: hover-animation 0.3s ease;
}

/* Add z-index to ActionNotification to make it top-most */
::v-deep .notification-list {
  z-index: 10000;
}

/* Media query for mobile devices (less than 768px) */
@media (max-width: 767.98px) {
  .navbar {
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 10px 0;
    background-color: #1e2127;
    box-shadow: 0 0px 5px rgba(0, 0, 0, 0.9);
    z-index: 9999;
    width: 100%;
  }
  .navbar-left, .navbar-right {
    justify-content: center;
    width: 100%;
  }

  .navbar-left {
    padding-left: 0px;
  }

  .navbar-right {
    padding-right: 0px;
  }
  .nav-icon {
    font-size: 30px;
  }
  .icon-label {
    display: none;
  }
}

/* Media query for tablets (768px to 1024px) */
@media (min-width: 768px) and (max-width: 1024px) {
  .navbar {
    padding: 10px 10px;
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

  .icon-label {
    display: none;
  }
}
</style>
