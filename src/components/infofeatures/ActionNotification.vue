<template>
  <div class="notification-container">
    <button @click="handleClick" class="notification-icon">
      <i class="fas fa-bell"></i>
      <span v-if="unreadCount" class="unread-count">{{ unreadCount }}</span>
    </button>
    <div v-if="showNotifications" class="notification-list">
      <ul>
        <li @click="clearAllNotifications" class="clear-all">
          Clear All Notifications
        </li>
        <li v-for="notification in notifications" :key="notification.id">
          {{ notification.message }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { supabase } from '../supabase';  // Adjust the path as needed
import { eventBus } from '../event-bus';

interface Notification {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
  user_id: string;
  displayed: boolean;
}

const notifications = ref<Notification[]>([]);
const showNotifications = ref(false);
const unreadCount = ref(0);
const intervalId = ref<number | null>(null);

const fetchNotifications = async () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', currentUser.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching notifications:', error.message);
    return;
  }

  notifications.value = data as Notification[];
  unreadCount.value = data.filter((n: Notification) => !n.read).length;
};

const markNotificationsAsRead = async () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', currentUser.id);

  unreadCount.value = 0;
};

const handleClick = () => {
  showNotifications.value = !showNotifications.value;
  if (showNotifications.value) {
    markNotificationsAsRead();
  }
};

const clearAllNotifications = () => {
  notifications.value = [];
  unreadCount.value = 0;
};

const addNotification = (notification: { userId: string; message: string }) => {
  notifications.value.push({
    id: Date.now().toString(),
    message: notification.message,
    read: false,
    created_at: new Date().toISOString(),
    user_id: notification.userId,
    displayed: true,
  });
  unreadCount.value += 1;
};

eventBus.on('likeNotification', addNotification);

onMounted(fetchNotifications);
onUnmounted(() => {
  if (intervalId.value) {
    clearInterval(intervalId.value);
  }
});
</script>

<style scoped>
.notification-container {
  position: relative;
}

.notification-icon {
  background: none;
  border: none;
  color: #ffffff;
  cursor: pointer;
  font-size: 18px;
}

.unread-count {
  background-color: red;
  color: white;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 12px;
  position: absolute;
  top: -1px;
  right: 1px;
  border: 1px solid white;
}

.notification-list {
  position: absolute;
  top: 40px;
  left: 0;
  background-color: #333;
  color: white;
  border-radius: 5px;
  width: 300px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 9999;
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
}

.notification-list li:last-child {
  border-bottom: none;
}

.clear-all {
  font-weight: bold;
  color: rgb(255, 255, 255);
  background-color: black;
}
</style>
