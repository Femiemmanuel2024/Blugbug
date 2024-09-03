<template>
  <div class="notification-history">
    <!-- Back Arrow and Title -->
    <div class="header">
      <button @click="goBack" class="back-button">
        <i class="fas fa-arrow-left"></i> <!-- Font Awesome icon for the back arrow -->
      </button>
      <span class="header-title">Notifications</span>
    </div>

    <!-- NavBar Component -->
    <NavBar />

    <!-- Main Content -->
    <div class="content">
      <div v-for="(group, date) in groupedNotifications" :key="date">
        <!-- Display the actual date and the relative time -->
        <h3 class="date-header">
          {{ date }}
          <span class="relative-time">({{ formatDateDifference(date) }})</span>
        </h3>
        <ul>
          <li
            v-for="notification in group"
            :key="notification.id"
            @click="handleClick(notification.blog_id)"
            class="notification-item"
          >
            <span>{{ notification.message }}</span>
            <span class="notification-time">{{ formatTime(notification.created_at) }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- FooterNav Component -->
    <FooterNav />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '../supabase';
import NavBar from '../NavBar.vue';
import FooterNav from './FooterNav.vue';

interface Notification {
  id: number;
  user_id: string;
  blog_id: string;
  message: string;
  created_at: string;
}

export default defineComponent({
  name: 'NotificationHistory',
  components: {
    NavBar,
    FooterNav,
  },
  setup() {
    const notifications = ref<Notification[]>([]);
    const groupedNotifications = ref<{ [date: string]: Notification[] }>({});
    const router = useRouter();

    const fetchNotifications = async () => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = currentUser.id;

      if (!userId) {
        console.error('User ID not found.');
        return;
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching notifications:', error.message);
        return;
      }

      notifications.value = data || [];
      groupNotificationsByDate();
    };

    const groupNotificationsByDate = () => {
      groupedNotifications.value = notifications.value.reduce((groups, notification) => {
        const date = new Date(notification.created_at).toISOString().split('T')[0]; // Get the date part only
        if (!groups[date]) groups[date] = [];
        groups[date].push(notification);
        return groups;
      }, {} as { [date: string]: Notification[] });
    };

    const formatDateDifference = (dateString: string): string => {
      const now = new Date();
      const date = new Date(dateString);
      const diffTime = now.getTime() - date.getTime();

      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);
      const diffYears = Math.floor(diffDays / 365);

      if (diffDays === 0) {
        return 'today';
      } else if (diffDays === 1) {
        return 'yesterday';
      } else if (diffDays < 7) {
        return `${diffDays} days ago`;
      } else if (diffWeeks === 1) {
        return '1 week ago';
      } else if (diffWeeks < 4) {
        return `${diffWeeks} weeks ago`;
      } else if (diffMonths === 1) {
        return '1 month ago';
      } else if (diffMonths < 12) {
        return `${diffMonths} months ago`;
      } else if (diffYears === 1) {
        return '1 year ago';
      } else {
        return `${diffYears} years ago`;
      }
    };

    const formatTime = (dateString: string): string => {
      const date = new Date(dateString);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;  // Returns time in HH:MM format
    };

    const handleClick = (blogId: string) => {
      router.push({ name: 'BlugReader', query: { blogId: blogId } }); // Add blogId as query parameter
    };

    const goBack = () => {
      router.back(); // Use Vue Router's back method to navigate to the previous page
    };

    onMounted(() => {
      fetchNotifications();
    });

    return {
      groupedNotifications,
      handleClick,
      formatDateDifference,
      formatTime,
      goBack,
    };
  },
});
</script>

<style scoped>
.notification-history {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding-right: 50px;
  padding-left: 50px;
  padding-top: 100px;
  background-color: #1e2127;
  margin-left: 50px;
  margin-right: 50px;
}

.header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.back-button {
  background: none;
  border: none;
  color: #ffffff;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  background-color: #fd662f;
  padding: 10px;
  border-radius: 50%;
  margin-left: 20px;
}

.header-title {
  font-size: 18px;
  color: #ffffff;
  margin-left: 10px;
}

.date-header {
  color: #e0e0e0;
  margin-bottom: 10px;
  font-size: 16px; /* Adjust font size for the actual date */
}

.relative-time {
  font-size: 12px; /* Smaller font size for the relative time */
  color: #a0a0a0; /* Optional: Different color for the relative time */
  margin-left: 8px; /* Small space between the date and relative time */
}

.content {
  flex-grow: 1;
  padding: 20px;
}

ul {
  list-style: none;
  padding: 0;
}

.notification-item {
  padding: 10px;
  margin-bottom: 8px;
  background-color: #f1f1f1;
  cursor: pointer;
  border-radius: 4px;
  transition: background-color 0.3s ease;
  display: flex;  /* Use flexbox to align items */
  justify-content: space-between;  /* Space out the message and time */
}

.notification-item:hover {
  background-color: #fd662f;
  color: #e0e0e0;
}

.notification-time {
  font-size: 12px; /* Smaller font size for the time */
  color: #a0a0a0; /* Optional: Different color for the time */
}

@media (max-width: 767px) {
  .notification-history {
    padding-right: 1px;
    padding-left: 1px;
    padding-top: 130px;
    margin-left: 10px;
    margin-right: 10px;
  }

  .header {
    justify-content: space-between; /* Ensure space between back button and title */
    margin-bottom: 0px;
    padding: 0px 10px 0px 10px ;
  }

  .back-button {
    font-size: 16px;
  }

  .header-title {
    font-size: 16px;
  }

  .date-header {
    font-size: 14px;
  }

  .relative-time {
    font-size: 10px;
  }

  .notification-item {
    padding: 8px;
    flex-direction: column; /* Stack the message and time vertically */
    align-items: flex-start; /* Align items to the left */
  }

  .notification-time {
    align-self: flex-end; /* Align the time to the right at the bottom */
    margin-top: 5px;
  }

  .content {
    padding: 10px;
  }
}
</style>
