<template>
  <div class="admin-manager-page">
    <NavBar />
    <div class="tabs">
      <button v-for="(tab, index) in tabs" :key="index" @click="currentTab = index">
        {{ tab }}
      </button>
    </div>

    <div v-if="currentTab === 0">
      <!-- Blog Post Table -->
      <h2>Blog Posts</h2>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Chatter Name</th>
            <th>User ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="post in blogPosts" :key="post.blog_id">
            <td>{{ post.title }}</td>
            <td>{{ post.chatter_name }}</td>
            <td>{{ post.user_id }}</td>
            <td>
              <button @click="deleteBlogPost(post.blog_id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="currentTab === 1">
      <!-- Notifications Table -->
      <h2>Notifications</h2>
      <table>
        <thead>
          <tr>
            <th>Message</th>
            <th>Created At</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="notification in notifications" :key="notification.id">
            <td>{{ notification.message }}</td>
            <td>{{ notification.created_at }}</td>
            <td>
              <button @click="deleteNotification(notification.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="currentTab === 2">
      <!-- Reply Table -->
      <h2>Replies</h2>
      <table>
        <thead>
          <tr>
            <th>Reply Text</th>
            <th>Commenter Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="reply in replies" :key="reply.serial_number">
            <td>{{ reply.reply_text }}</td>
            <td>{{ reply.commenter_name }}</td>
            <td>
              <button @click="deleteReply(reply.serial_number)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="currentTab === 3">
      <!-- Users Table -->
      <h2>Users</h2>
      <table>
        <thead>
          <tr>
            <th>Chatter Name</th>
            <th>Full Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.chatter_name }}</td>
            <td>{{ user.full_name }}</td>
            <td>
              <button @click="deleteUser(user.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="currentTab === 4">
      <!-- Blog Post Bucket -->
      <h2>Blog Post Bucket</h2>
      <table>
        <thead>
          <tr>
            <th>Chatter Name</th>
            <th>ID</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="bucketItem in bucketItems" :key="bucketItem.id">
            <td>{{ bucketItem.chatter_name }}</td>
            <td>{{ bucketItem.id }}</td>
            <td>
              <button @click="deleteBucketItem(bucketItem.id)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import NavBar from '../NavBar.vue';
import { supabase } from '../supabase';

export default defineComponent({
  name: 'AdminManager',
  components: {
    NavBar,
  },
  setup() {
    const tabs = ['Blog Posts', 'Notifications', 'Replies', 'Users', 'Blog Post Bucket'];
    const currentTab = ref(0);
    const blogPosts = ref([]);
    const notifications = ref([]);
    const replies = ref([]);
    const users = ref([]);
    const bucketItems = ref([]);

    const fetchBlogPosts = async () => {
      const { data, error } = await supabase.from('blog_post').select('title, chatter_name, user_id, blog_id');
      if (error) console.error('Error fetching blog posts:', error.message);
      else blogPosts.value = data;
    };

    const fetchNotifications = async () => {
      const { data, error } = await supabase.from('notifications').select('message, created_at, id').order('created_at', { ascending: false });
      if (error) console.error('Error fetching notifications:', error.message);
      else notifications.value = data;
    };

    const fetchReplies = async () => {
      const { data, error } = await supabase.from('reply_table').select('reply_text, commenter_name, serial_number');
      if (error) console.error('Error fetching replies:', error.message);
      else replies.value = data;
    };

    const fetchUsers = async () => {
      const { data, error } = await supabase.from('users').select('chatter_name, full_name, id');
      if (error) console.error('Error fetching users:', error.message);
      else users.value = data;
    };

    const fetchBucketItems = async () => {
      const { data, error } = await supabase.storage.from('blog-post').list();
      if (error) console.error('Error fetching bucket items:', error.message);
      else {
        const userIds = data.map(item => item.name.split('/')[0]);
        const { data: usersData, error: usersError } = await supabase.from('users').select('id, chatter_name').in('id', userIds);
        if (usersError) {
          console.error('Error fetching users for bucket items:', usersError.message);
        } else {
          bucketItems.value = data.map(item => {
            const user = usersData.find(user => user.id === item.name.split('/')[0]);
            return { id: item.name, chatter_name: user ? user.chatter_name : 'Unknown' };
          });
        }
      }
    };

    const deleteBlogPost = async (id) => {
      const { error } = await supabase.from('blog_post').delete().eq('blog_id', id);
      if (error) console.error('Error deleting blog post:', error.message);
      else fetchBlogPosts();
    };

    const deleteNotification = async (id) => {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) console.error('Error deleting notification:', error.message);
      else fetchNotifications();
    };

    const deleteReply = async (serialNumber) => {
      const { error } = await supabase.from('reply_table').delete().eq('serial_number', serialNumber);
      if (error) console.error('Error deleting reply:', error.message);
      else fetchReplies();
    };

    const deleteUser = async (id) => {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) console.error('Error deleting user:', error.message);
      else fetchUsers();
    };

    const deleteBucketItem = async (id) => {
      const { error } = await supabase.storage.from('blog-post').remove([id]);
      if (error) console.error('Error deleting bucket item:', error.message);
      else fetchBucketItems();
    };

    onMounted(() => {
      fetchBlogPosts();
      fetchNotifications();
      fetchReplies();
      fetchUsers();
      fetchBucketItems();
    });

    return {
      tabs,
      currentTab,
      blogPosts,
      notifications,
      replies,
      users,
      bucketItems,
      deleteBlogPost,
      deleteNotification,
      deleteReply,
      deleteUser,
      deleteBucketItem,
    };
  },
});
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
.admin-manager-page {
  padding: 20px;
  margin-top: 100px;
}

.tabs button {
  margin-right: 10px;
  color: #ddd;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
}

th, td {
  padding: 8px;
  text-align: left;
  color: #ddd;
}

th {
  color: #f2f2f2;
  background-color: #fd662f !important;
}

button {
  padding: 5px 10px;
  color: white;
  background-color: red;
  border: none;
  cursor: pointer;
  border-radius: 5px;
}

button:hover {
  background-color: darkred;
}
</style>
