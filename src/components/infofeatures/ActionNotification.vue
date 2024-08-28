<template>
  <div class="notification-container" v-if="isLoggedIn">
    <button @click="toggleNotifications" class="notification-icon">
      <div class="icon-wrapper">
        <i class="fas fa-bell"></i>
        <span v-if="unreadCount" class="unread-count">{{ unreadCount }}</span>
      </div>
      <span class="notification-label">Alerts</span>
    </button>
    <div v-if="showNotifications" class="notification-list">
      <div class="notification-controls">
        <button @click="checkForNotifications">Check for Notifications</button>
        <button @click="deleteAllNotifications">Delete All Notifications</button>
      </div>
      <ul>
        <li v-for="notification in notifications" :key="notification.id">
          <span @click="markAsRead(notification)" class="notification-message link">
            {{ notification.message }}
          </span>
        </li>
      </ul>
    </div>
    <!-- Add audio element -->
    <audio ref="notificationAudio" src="/notificationalert.wav" preload="auto"></audio>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabase';

interface Notification {
  id: string;
  message: string;
  read: boolean;
  created_at: string;
  user_id: string;
  blog_id?: string;  // Ensure blog_id is included in the notification interface
  blog_title?: string;
  not_identifier?: string;
  comment_main?: string;  // Added comment_main
  commented_by?: string;  // Added commented_by
}

const notifications = ref<Notification[]>([]);
const showNotifications = ref(false);
const unreadCount = ref(0);
const router = useRouter();
const notificationAudio = ref<HTMLAudioElement | null>(null);
const isLoggedIn = ref(false); // State to check if user is logged in

const playNotificationSound = () => {
  if (notificationAudio.value) {
    notificationAudio.value.play();
  }
};

const fetchNotifications = async () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (currentUser.id) {
    const { data, error } = await supabase
      .from('notifications')
      .select('id, user_id, message, read, blog_id, blog_title, not_identifier, comment_main, commented_by')  // Fetch blog_id
      .eq('user_id', currentUser.id)
      .eq('read', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notifications:', error.message);
      return;
    }

    notifications.value = data as Notification[];
    unreadCount.value = notifications.value.length;

    // Play notification sound if there are new notifications
    if (unreadCount.value > 0) {
      playNotificationSound();
    }
  } else {
    console.error('No user is currently logged in.');
  }
};

const markAsRead = async (notification: Notification) => {
  const { id } = notification;
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);

  if (error) {
    console.error('Error marking notification as read:', error.message);
    return;
  }

  notifications.value = notifications.value.filter((n) => n.id !== id);
  unreadCount.value = notifications.value.length;

  // Check the not_identifier and navigate accordingly
  if (notification.not_identifier === 'MENTION') {
    handleMentionNotification(notification);  // Call new function for MENTION notifications
  } else if (notification.not_identifier === 'REPLY') {
    // Navigate to ReplyPage with required details
    router.push({
      name: 'ReplyPage',
      query: {
        commentMain: notification.comment_main,
        commentedBy: notification.commented_by,
        loggedInUser: notification.user_id,
      },
    });
  } else if (notification.blog_title) {
    router.push({ name: 'BlugPage', query: { search: notification.blog_title } });
  }
};

const handleMentionNotification = (notification: Notification) => {
  if (notification.blog_id) {
    // Save blog_id to local storage
    localStorage.setItem('blog_id', notification.blog_id);
    // Route to BlugReader.vue with blog_id as a query parameter
    router.push({ name: 'BlugReader', query: { blogId: notification.blog_id } });
  }
};

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value;
  if (showNotifications.value) {
    fetchNotifications(); // Fetch only when notifications are toggled on
    playNotificationSound();
  }
};

const deleteAllNotifications = async () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (!currentUser.id) {
    console.error('No user is currently logged in.');
    return;
  }

  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', currentUser.id);

  if (error) {
    console.error('Error deleting all notifications:', error.message);
    return;
  }

  notifications.value = [];
  unreadCount.value = 0;
  console.log('All notifications deleted successfully.');
};

const checkForNotifications = () => {
  fetchNotifications();
};

const handleClick = async () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (currentUser.id) {
    isLoggedIn.value = true; // User is logged in
    const { data: welcomeData, error: welcomeError } = await supabase
      .from('notifications')
      .select('id, user_id, message, read')
      .eq('user_id', currentUser.id)
      .eq('message', 'Welcome to Blugbug')
      .single();

    if (welcomeError && welcomeError.code !== 'PGRST116') {
      console.error('Error checking welcome notification:', welcomeError.message);
      return;
    }

    if (!welcomeData || (welcomeData && welcomeData.read === false)) {
      if (!welcomeData) {
        const { error: insertError } = await supabase
          .from('notifications')
          .insert([
            {
              user_id: currentUser.id,
              message: 'Welcome to Blugbug',
              read: false,
              created_at: new Date().toISOString(),
            },
          ]);

        if (insertError) {
          console.error('Error creating welcome notification:', insertError.message);
        } else {
          console.log('Welcome notification created successfully.');
        }
      }
    }

    fetchNotifications(); // Fetch notifications on login
  } else {
    console.error('No user is currently logged in.');
    isLoggedIn.value = false; // User is not logged in
  }
};

onMounted(() => {
  handleClick(); // Fetch notifications on login
});
</script>

<style scoped>
.notification-container {
  position: relative;
  display: flex;
  align-items: center;
}

.notification-icon {
  background: none;
  border: none;
  color: #ffffff;
  cursor: pointer;
  font-size: 18px;
  display: flex; /* Ensure label is part of the icon */
  align-items: center;
  position: relative; /* Add relative positioning */
  transition: transform 0.3s; /* Add transition for the hover effect */
}

.icon-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.unread-count {
  background-color: red;
  color: white;
  border-radius: 50%;
  padding: 1px 4px;
  font-size: 10px;
  position: absolute;
  top: -5px;
  right: -5px;
  border: 1px solid white;
}

.notification-icon:hover {
  color: #fd662f;
}

.notification-label {
  display: none;
  font-size: 14px; /* Match font size with navbar */
  color: #ffffff;
}

.notification-label:hover {
  color: #fd662f;
}

.notification-list {
  position: absolute;
  top: 40px;
  left: -120px;
  background-color: rgb(36, 36, 36);
  color: white;
  border-radius: 5px;
  width: 300px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  z-index: 10000;
  font-size: 12px;
  opacity: 0.9;
}

.notification-controls {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background-color: #333;
  border-bottom: 1px solid #444;
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

@media (max-width: 767.98px) {
  .notification-label {
    display: none;
  }

  .notification-icon {
    font-size: 30px;
  }
}

@media (max-width: 1024px) {
  .notification-label {
    display: none;
  }
}

@media (max-width: 430px) {
  .notification-list {
    left: -139px;
  }
}
</style>
