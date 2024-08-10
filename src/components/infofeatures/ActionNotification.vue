<template>
  <div class="notification-container">
    <button @click="toggleNotifications" class="notification-icon">
      <div class="icon-wrapper">
        <i class="fas fa-bell"></i>
        <span v-if="unreadCount" class="unread-count">{{ unreadCount }}</span>
      </div>
      <span class="notification-label">Alerts</span>
    </button>
    <div v-if="showNotifications" class="notification-list">
      <ul>
        <li v-for="notification in notifications" :key="notification.id">
          <span
            @click="markAsRead(notification)"
            class="notification-message link"
          >
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
  blog_title?: string;
}

const notifications = ref<Notification[]>([]);
const showNotifications = ref(false);
const unreadCount = ref(0);
const router = useRouter();
const notificationAudio = ref<HTMLAudioElement | null>(null);

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
      .select('id, user_id, message, read, blog_title')
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

    // Log the fetched data
    console.log('Fetched Notifications:', notifications.value);
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

  // Navigate to BlugPage with the search query
  if (notification.message === 'Welcome to Blugbug') {
    router.push({ name: 'BlugPage', query: { search: 'Welcome to Blugbug' } });
  } else if (notification.blog_title) {
    router.push({ name: 'BlugPage', query: { search: notification.blog_title } });
  }
};

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value;
  if (showNotifications.value) {
    fetchNotifications();
    playNotificationSound(); // Play sound when the icon is clicked and notifications are shown
  }
};

const handleFollowersNotifications = async (currentUser: any) => {
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('followers_id, chatter_name')
    .eq('id', currentUser.id)
    .single();

  if (userError) {
    console.error('Error fetching user data:', userError.message);
    return;
  }

  const { followers_id, chatter_name } = userData || {};

  if (!followers_id) {
    console.log('No followers found.');
    return;
  }

  for (const followerId of followers_id) {
    const { data: followerData, error: followerError } = await supabase
      .from('users')
      .select('chatter_name')
      .eq('id', followerId)
      .maybeSingle();  // Replaces single() to avoid errors if multiple rows exist

    if (followerError) {
      console.error('Error fetching follower data:', followerError.message);
      continue;
    }

    if (!followerData) {
      console.log(`Follower with ID ${followerId} not found.`);
      continue;
    }

    const followerName = followerData.chatter_name;

    const { data: followNotification, error: followError } = await supabase
      .from('notifications')
      .select('id, user_id, message, read')
      .eq('user_id', currentUser.id)
      .eq('message', `${followerName} is following you`)
      .maybeSingle();  // Use maybeSingle() instead of single() to avoid the error

    if (followError) {
      console.error('Error checking follow notification:', followError.message);
      continue;
    }

    if (!followNotification) {
      const { error: insertFollowError } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: currentUser.id,
            message: `${followerName} is following you`,
            read: false,
            created_at: new Date().toISOString(),
          },
        ]);

      if (insertFollowError) {
        console.error('Error creating follow notification:', insertFollowError.message);
      } else {
        console.log(`Follow notification for ${followerName} created successfully.`);
      }
    }
  }
};

const handleClick = async () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if (currentUser.id) {
    // Check for the welcome notification
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
    } else {
      console.log('Welcome notification already sent and read.');
    }

    // Handle followers notifications
    await handleFollowersNotifications(currentUser);

    // Fetch notifications to display
    fetchNotifications();
  } else {
    console.error('No user is currently logged in.');
  }
};

onMounted(() => {
  handleClick();
  fetchNotifications();
  setInterval(fetchNotifications, 300000); 
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

  /* .unread-count {
    top: -5px;
    right: 0;
  } */
}

@media (max-width:1024px){
  .notification-label {
    display: none;
  }

  /* .unread-count {
    top: -5px;
    right: 2px;
  } */
}

@media (max-width: 430px) {
  .notification-list {
    left: -139px;
  }

  /* .unread-count {
    top: -5px;
    right: 20px;
  } */
}
</style>
