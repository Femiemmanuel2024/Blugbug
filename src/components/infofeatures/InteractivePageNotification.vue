<!-- <template>
    <div class="notification-container">
      <button @click="toggleNotifications" class="notification-icon">
        <i class="fas fa-bell"></i>
        <span v-if="unreadCount" class="unread-count">{{ unreadCount }}</span>
      </button>
      <div v-if="showNotifications" class="notification-list">
        <ul>
          <li v-for="notification in notifications" :key="notification.id" @click="markAsRead(notification)">
            {{ notification.message }}
          </li>
        </ul>
      </div>
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
  }
  
  const notifications = ref<Notification[]>([]);
  const showNotifications = ref(false);
  const unreadCount = ref(0);
  const router = useRouter();
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  
  const fetchNotifications = async () => {
    if (currentUser.id) {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, user_id, message, read')
        .eq('user_id', currentUser.id)
        .eq('read', false)
        .order('created_at', { ascending: false });
  
      if (error) {
        console.error('Error fetching notifications:', error.message);
        return;
      }
  
      notifications.value = data as Notification[];
      unreadCount.value = notifications.value.length;
  
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
    router.push({ name: 'BlugPage', query: { search: notification.message.split('"')[1] } });
  };
  
  const toggleNotifications = () => {
    showNotifications.value = !showNotifications.value;
    if (showNotifications.value) {
      fetchNotifications();
      sendLikeNotifications(); // Ensure like notifications are checked when toggling notifications
    }
  };
  
  const sendLikeNotifications = async () => {
    const { data: blogPosts, error: blogPostError } = await supabase
      .from('blog_post')
      .select('blog_id, title, liked_by, liked_by_chatter_names, user_id')
      .eq('user_id', currentUser.id);
  
    if (blogPostError) {
      console.error('Error fetching blog posts:', blogPostError.message);
      return;
    }
  
    if (blogPosts) {
      for (const blogPost of blogPosts) {
        const { blog_id, title, liked_by, liked_by_chatter_names, user_id } = blogPost;
  
        for (const [index, likerName] of liked_by_chatter_names.entries()) {
          const notificationMessage = `"${title}" was liked by "${likerName}"`;
  
          // Check if the notification already exists
          const { data: existingNotification, error: existingNotificationError } = await supabase
            .from('notifications')
            .select('id')
            .eq('user_id', user_id)
            .eq('message', notificationMessage)
            .single();
  
          if (existingNotificationError && existingNotificationError.code !== 'PGRST116') {
            console.error('Error checking existing notification:', existingNotificationError.message);
            continue;
          }
  
          if (!existingNotification) {
            const { error: insertError } = await supabase
              .from('notifications')
              .insert([
                {
                  user_id: user_id,
                  message: notificationMessage,
                  read: false,
                  created_at: new Date().toISOString(),
                },
              ]);
  
            if (insertError) {
              console.error('Error creating notification:', insertError.message);
            } else {
              console.log('Notification created successfully:', notificationMessage);
            }
          }
        }
      }
    }
  };
  
  onMounted(() => {
    fetchNotifications();
    sendLikeNotifications(); // Ensure like notifications are checked after login
    setInterval(fetchNotifications, 300000); // Fetch notifications every 5 minutes
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
  
  .notification-list li:hover {
    background-color: #fd662f;
  }
  
  .notification-list li:last-child {
    border-bottom: none;
  }
  
  @media (max-width: 430px) {
    .notification-list {
      position: absolute;
      top: 40px;
      left: -139px;
      background-color: #333;
      color: white;
      border-radius: 5px;
      width: 300px;
      max-height: 300px;
      overflow-y: auto;
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      z-index: 9999;
    }
  }
  </style>
   -->