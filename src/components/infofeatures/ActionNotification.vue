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

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { supabase } from '../supabase'; // Adjust the path as needed

interface Notification {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
  user_id: string;
}

export default defineComponent({
  name: 'ActionNotification',
  setup() {
    const notifications = ref<Notification[]>([]);
    const showNotifications = ref(false);
    const unreadCount = ref(0);

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

    const fetchFollowers = async () => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const { data, error } = await supabase
        .from('users')
        .select('followers_id')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        console.error('Error fetching followers:', error.message);
        return;
      }

      const followerIds = data.followers_id || [];
      const followerNotifications = await Promise.all(
        followerIds.map(async (followerId: string) => {
          const { data: followerData, error: followerError } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', followerId)
            .single();

          if (followerError) {
            console.error('Error fetching follower data:', followerError.message);
            return null;
          }

          return {
            id: followerId,
            message: `${followerData.full_name} is now following you.`,
            read: false,
            created_at: new Date().toISOString(),
            user_id: currentUser.id,
          } as Notification;
        })
      );

      notifications.value = followerNotifications.filter((n) => n !== null) as Notification[];
      unreadCount.value = notifications.value.length;
    };

    const toggleNotifications = () => {
      showNotifications.value = !showNotifications.value;
      if (showNotifications.value) {
        markNotificationsAsRead();
      }
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
      toggleNotifications();
    };

    const sendWelcomeNotification = async () => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', currentUser.id)
        .eq('message', 'Welcome to Bloggabug');

      if (error) {
        console.error('Error checking existing notification:', error.message);
        return;
      }

      // Send the welcome notification only if it doesn't exist or has been read
      if (data.length === 0 || data.some((n: Notification) => n.read)) {
        await sendNotification('Welcome to Bloggabug');
      }
    };

    const sendNotification = async (message: string) => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const notification = {
        user_id: currentUser.id,
        message,
        read: false,
      };

      const { data, error } = await supabase.from('notifications').insert([notification]);

      if (error) {
        console.error('Error sending notification:', error.message);
      } else {
        console.log('Notification sent successfully:', data);
        fetchNotifications(); // Fetch the notifications again to update the list
      }
    };

    const clearAllNotifications = async () => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Error clearing notifications:', error.message);
        return;
      }

      notifications.value = [];
      unreadCount.value = 0;
    };

    onMounted(() => {
      fetchNotifications();
      sendWelcomeNotification();
      fetchFollowers();
    });

    return {
      notifications,
      showNotifications,
      unreadCount,
      handleClick,
      toggleNotifications,
      clearAllNotifications,
    };
  },
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
