<template>
  <div class="reply-page">
    <NavBar />
    <div class="reply-content">
      <button @click="goBack" class="back-button">Back</button>
      <!-- Display the original comment and the user who commented -->
      <h2 class="comment-header">{{ originalComment }}</h2>
      <p class="commented-by">Commented by: {{ commentedBy }}</p>
      
      <div v-if="loading" class="loading-modal">
        <!-- Loading modal -->
        <p>Loading...</p>
      </div>
      
      <div v-else class="replies-container">
        <!-- Display all replies sorted by date -->
        <div class="replies">
          <div 
            v-for="reply in allReplies" 
            :key="reply.id" 
            :class="{'user-reply': isUserReply(reply), 'other-reply': !isUserReply(reply)}" 
            class="reply"
          >
            <p v-html="formatReplyText(reply.reply_text)"></p>
            <span class="reply-meta">{{ reply.commenter_name }} on {{ formatDateTime(reply.created_at) }}</span>
          </div>
        </div>
      </div>

      <div class="reply-input">
        <!-- Dropdown suggestions will appear in this purple row -->
        <div v-if="mentionSuggestions.length > 0" class="mention-suggestions">
          <ul>
            <li v-for="user in mentionSuggestions.slice(0, 3)" :key="user.id" @click="addMention(user.chatter_name)">
              {{ user.chatter_name }}
            </li>
          </ul>
        </div>

        <textarea 
          v-model="newReply" 
          placeholder="Write your reply..." 
          @input="handleMention" 
          style="resize: none;"
        ></textarea>
        <button @click="postReply" :disabled="!newReply.trim()">Reply</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { supabase } from '../supabase'; // Adjust the path as needed
import NavBar from '../NavBar.vue';

interface Reply {
  id: string;
  comment_id: string;
  owner_id: string;
  reply_text: string;
  created_at: string;
  user_id: string;
  commenter_name: string;
}

interface User {
  id: string;
  chatter_name: string;
}

export default defineComponent({
  name: 'ReplyPage',
  components: {
    NavBar,
  },
  setup() {
    const router = useRouter();
    const route = useRoute(); // Use route to access query parameters

    const originalComment = ref<string | null>(null);
    const commentedBy = ref<string | null>(null);
    const newReply = ref<string>('');
    const allReplies = ref<Reply[]>([]);
    const loggedInUserId = ref<string | null>(null);
    const commentOwnerId = ref<string | null>(null);
    const loading = ref(true); // Loading state
    const mentionSuggestions = ref<User[]>([]); // Users to suggest when "@" is typed

    const fetchOriginalComment = async () => {
      // Check if data is coming from query parameters (ActionNotifications.vue) or local storage (InteractionPage.vue)
      originalComment.value = route.query.commentMain as string || localStorage.getItem('comment_main');
      commentedBy.value = route.query.commentedBy as string || localStorage.getItem('commented_by');
      loggedInUserId.value = route.query.loggedInUser as string || JSON.parse(localStorage.getItem('currentUser') || '{}').id;

      if (commentedBy.value) {
        // Fetch user_id of the comment owner
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('chatter_name', commentedBy.value)
          .single();

        if (error) {
          console.error('Error fetching user_id:', error.message);
        } else if (data) {
          commentOwnerId.value = data.id;
        }
      }

      // Fetch the logged-in user's chatter_name from the users table
      if (loggedInUserId.value) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('chatter_name')
          .eq('id', loggedInUserId.value)
          .single();

        if (userError) {
          console.error('Error fetching user data:', userError.message);
        } else if (userData) {
          localStorage.setItem('chatter_name', userData.chatter_name); // Store chatter_name in local storage
        }
      }
    };

    const fetchReplies = async () => {
      if (!originalComment.value) return;

      const { data, error } = await supabase
        .from<Reply>('reply_table')
        .select('*')
        .eq('comment_main', originalComment.value)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching replies:', error.message);
        return;
      }

      if (data) {
        allReplies.value = data; // Combine all replies and sort them by date
      }
      loading.value = false; // Turn off loading state
    };

    const handleMention = async () => {
      const mentionPattern = /@(\w*)$/;
      const match = newReply.value.match(mentionPattern);

      if (match && match[1]) {
        await fetchUsers(match[1]);
      } else {
        mentionSuggestions.value = []; // Clear suggestions if "@" is removed or incomplete
      }
    };

    const fetchUsers = async (searchTerm: string) => {
      const { data, error } = await supabase
        .from('users')
        .select('id, chatter_name')
        .ilike('chatter_name', `%${searchTerm}%`);

      if (error) {
        console.error('Error fetching users:', error.message);
        return;
      }

      mentionSuggestions.value = data || [];
    };

    const addMention = (chatterName: string) => {
      newReply.value = newReply.value.replace(/@\w*$/, `@${chatterName} `);
      mentionSuggestions.value = []; // Clear suggestions after adding mention
    };

    const postReply = async () => {
      if (!originalComment.value || !loggedInUserId.value || !newReply.value.trim()) {
        console.error('Missing required information to post a reply.');
        return;
      }

      const storedCommenterName = localStorage.getItem('chatter_name'); // Get commenter_name from local storage

      // Insert the reply into the reply_table
      const { error: replyError } = await supabase
        .from('reply_table')
        .insert({
          comment_id: commentOwnerId.value, // Store the user_id of the comment owner
          comment_main: originalComment.value, // Store the original comment text
          owner_id: loggedInUserId.value, // The logged-in user's id
          reply_text: newReply.value.trim(), // Store the reply text
          created_at: new Date().toISOString(),
          user_id: loggedInUserId.value,
          commenter_name: storedCommenterName, // Store the commenter's name
        });

      if (replyError) {
        console.error('Error posting reply:', replyError.message);
        return;
      }

      // Create a notification for regular reply if no mentions are found
      if (!newReply.value.includes('@')) {
        await createReplyNotification();
      }

      await createMentionNotification(newReply.value); // Check for mentions and create notifications

      newReply.value = '';
      await fetchReplies();
    };

    const createReplyNotification = async () => {
      const storedCommenterName = localStorage.getItem('chatter_name');

      if (commentOwnerId.value) {
        const notificationMessage = `${storedCommenterName} replied to your comment`;

        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            user_id: commentOwnerId.value,
            message: notificationMessage,
            read: false,
            created_at: new Date().toISOString(),
            displayed: false,
            blog_title: originalComment.value, // Assuming the blog title is the comment text
            not_identifier: 'REPLY', // Set the value for both regular and mention replies
            comment_main: originalComment.value, // Store the original comment text in notifications
            commented_by: commentedBy.value, // Store the name of the original commenter in notifications
          });

        if (notificationError) {
          console.error('Error creating notification:', notificationError.message);
        }
      }
    };

    const createMentionNotification = async (replyText: string) => {
      const mentionPattern = /@(\w+)/g;
      let match;
      const storedCommenterName = localStorage.getItem('chatter_name');

      while ((match = mentionPattern.exec(replyText)) !== null) {
        const mentionedChatterName = match[1];
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .eq('chatter_name', mentionedChatterName)
          .single();

        if (error) {
          console.error(`Error fetching user id for ${mentionedChatterName}:`, error.message);
          continue;
        }

        if (data) {
          const notificationMessage = `${storedCommenterName} directed a reply to you.`;

          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: data.id,
              message: notificationMessage,
              read: false,
              created_at: new Date().toISOString(),
              displayed: false,
              not_identifier: 'REPLY', // Store as REPLY for mentions
              comment_main: originalComment.value,
              commented_by: mentionedChatterName,
            });

          if (notificationError) {
            console.error('Error creating mention notification:', notificationError.message);
          }
        }
      }
    };

    const formatReplyText = (text: string) => {
      return text.replace(/@(\w+)/g, '<span style="color: lightgreen;">@$1</span>');
    };

    const goBack = () => {
      router.back();
    };

    const formatDateTime = (dateTime: string) => {
      const date = new Date(dateTime);
      return date.toLocaleString();
    };

    const isUserReply = (reply: Reply) => {
      return reply.user_id === loggedInUserId.value;
    };

    onMounted(async () => {
      await fetchOriginalComment(); // Fetch the original comment and commenter_name
      await fetchReplies();
    });

    return {
      originalComment,
      commentedBy,
      newReply,
      allReplies,
      postReply,
      goBack,
      formatDateTime,
      isUserReply,
      loading,
      handleMention,
      mentionSuggestions,
      addMention,
      formatReplyText,
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
.reply-page {
  padding: 20px;
  margin-top: 100px;
  height: 100vh;
  padding-right: 50px;
  padding-left: 50px;
}

.back-button {
  background-color: #fd662f;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 10px;
}

.back-button:hover {
  background-color: #e04a2e;
}

.reply-content {
  margin-top: 20px;
}

.comment-header {
  font-size: 24px;
  font-weight: bold;
  color: #ccc;
  background-color: #1e2127;
  padding:10px 10px 0px 10px;
  border-radius: 10px 10px 0px 0px;
}

.commented-by {
  font-size: 18px;
  margin-bottom: 10px;
  color: #888;
  background-color: #1e2127;
  padding: 0px 0px 10px 10px;
}

.replies-container {
  display: flex;
  flex-direction: column;
}

.replies {
  width: 100%;
}

.reply {
  background-color: #f0f0f0;
  padding: 1px 10px 1px 10px;
  border-radius: 5px;
  margin-bottom: 10px;
  width: 100%;
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.user-reply {
  text-align: left;
  width: 90%;
  background-color: #DCF8C6;
  color: black;
}

.other-reply {
  text-align: right;
  width: 90%;
  margin-left: auto;
  background-color: #e04a2e;
  color: black;
}

.reply-meta {
  font-size: 12px;
  color: rgb(0, 0, 0);
  margin-top: 2px;
}

.reply-input {
  display: flex;
  flex-direction: column;
  margin-top: 20px;
  position: relative; /* Ensure relative positioning for dropdown */
}

.reply-input textarea {
  padding: 10px;
  margin-bottom: 10px;
  border: 1px solid #ccc;
  border-radius: 5px;
  resize: none; /* Disable resize functionality */
}

.reply-input button {
  background-color: #fd662f;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  font-weight: bold;
}

.reply-input button:hover {
  background-color: #e04a2e;
}

.loading-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-size: 18px;
}

.mention-suggestions {
  background-color: #ffffff; /* Set the background color to purple */
  color: rgb(0, 0, 0);
  width: 100%;
  max-height: 150px;
  overflow-y: auto;
  z-index: 1000;
  font-weight: bold;
  margin-bottom: 10px; /* Add margin to separate from textarea */
}

.mention-suggestions ul {
  list-style-type: none;
  margin: 0;
  padding: 0;
}

.mention-suggestions li {
  padding: 5px 10px;
  cursor: pointer;
}

.mention-suggestions li:hover {
  background-color: #e04a2e;
}

/* CSS for iPad screen size */
@media screen and (min-width: 768px) and (max-width: 1024px) {
  /* Add styles for iPad screen size here */
}

/* CSS for phone screen size */
@media screen and (max-width: 767px) {
  .reply-page {
  padding: 20px;
  margin-top: 140px;
  height: 100vh;
  padding-right: 2px;
  padding-left: 2px;
}

  /* Add styles for phone screen size here */
}


</style>
