<template>
  <div class="interactive-page">
    <div class="content">
      <div class="interaction-container">
        <div class="like-section">
          <button @click="updateLikes" :class="{ liked: isLiked }">
            <font-awesome-icon :icon="['fas', 'heart']" />
            <span class="likescounter">{{ likes }}</span>
          </button>
        </div>
        <div class="bookmark-section">
          <button @click="updateBookmark" :class="{ bookmarked: isBookmarked }">
            <font-awesome-icon :icon="['fas', 'bookmark']" />
          </button>
        </div>
      </div>
      <div class="container">
        <div class="comments-section">
          <div v-for="(comment, index) in commentDetails" :key="index" class="comment">
            <p>{{ comment.text }}</p>
            <p class="comment-meta">{{ comment.meta }}</p>
          </div>
          <div class="comment-input">
            <input v-model="newComment" placeholder="Add a comment" @input="checkCommentLength" />
            <button @click="postComment" :disabled="newComment.length > 250">Post</button>
          </div>
          <p v-if="commentWarning" class="warning">{{ commentWarning }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { supabase } from '../supabase';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

interface Comment {
  text: string;
  meta: string;
}

interface BlogPost {
  blog_id: string;
  user_id: string;
  likes: number;
  liked_by: string[];
  liked_by_chatter_names: string[];
  bookmarked_by: string[];
  comments: string[];
  comment_details: Comment[];
  commented_by: string[];
  title: string;
}

interface User {
  id: string;
  chatter_name: string;
}

export default defineComponent({
  name: 'InteractivePage',
  components: {
    FontAwesomeIcon,
  },
  setup() {
    const likes = ref(0);
    const isLiked = ref(false);
    const isBookmarked = ref(false);
    const comments = ref<string[]>([]);
    const commentDetails = ref<Comment[]>([]);
    const newComment = ref('');
    const commentWarning = ref<string | null>(null);
    const blogId = ref<string | null>(null);
    const userId = ref<string | null>(null);
    const chatterName = ref<string | null>(null);
    const blogOwnerId = ref<string | null>(null);
    const blogTitle = ref<string | null>(null);

    const fetchUserDetails = async () => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      userId.value = currentUser.id;

      if (userId.value) {
        const { data, error } = await supabase
          .from<User>('users')
          .select('chatter_name')
          .eq('id', userId.value)
          .single();

        if (error) {
          console.error('Error fetching user details:', error.message);
          return null;
        }

        chatterName.value = data.chatter_name;
      }
    };

    const fetchLikesBookmarksComments = async () => {
      if (!blogId.value) {
        console.error('Blog ID not found in local storage');
        return;
      }

      const { data, error } = await supabase
        .from<BlogPost>('blog_post')
        .select('likes, liked_by, liked_by_chatter_names, bookmarked_by, comments, comment_details, commented_by, user_id, title')
        .eq('blog_id', blogId.value)
        .single();

      if (error) {
        console.error('Error fetching likes, bookmarks, and comments:', error.message);
        return;
      }

      if (data) {
        likes.value = data.likes;
        comments.value = data.comments || [];
        commentDetails.value = data.comment_details || [];
        isLiked.value = data.liked_by.includes(userId.value || '');
        isBookmarked.value = data.bookmarked_by.includes(userId.value || '');
        blogOwnerId.value = data.user_id;
        blogTitle.value = data.title;
      }
    };

    const createNotification = async (message: string) => {
      if (blogOwnerId.value && blogOwnerId.value !== userId.value) {
        const { error } = await supabase
          .from('notifications')
          .insert([
            {
              user_id: blogOwnerId.value,
              message: message,
              blog_title: blogTitle.value,
              read: false,
              created_at: new Date().toISOString(),
              displayed: false,
            },
          ]);

        if (error) {
          console.error('Error creating notification:', error.message);
        } else {
          console.log('Notification created successfully.');
        }
      }
    };

    const updateLikes = async () => {
      if (!blogId.value || !userId.value) {
        console.error('Blog ID or User ID not found in local storage');
        return;
      }

      if (isLiked.value) {
        console.log('User has already liked the post');
        return;
      }

      const { data, error } = await supabase
        .from<BlogPost>('blog_post')
        .select('liked_by, liked_by_chatter_names')
        .eq('blog_id', blogId.value)
        .single();

      if (error) {
        console.error('Error fetching current liked_by:', error.message);
        return;
      }

      if (data) {
        const currentLikedBy = data.liked_by || [];
        const currentLikedByChatterNames = data.liked_by_chatter_names || [];
        const updatedLikedBy = [...currentLikedBy, userId.value];
        const updatedLikedByChatterNames = [...currentLikedByChatterNames, chatterName.value];

        const { error: updateError } = await supabase
          .from('blog_post')
          .update({
            likes: likes.value + 1,
            liked_by: updatedLikedBy,
            liked_by_chatter_names: updatedLikedByChatterNames,
          })
          .eq('blog_id', blogId.value);

        if (updateError) {
          console.error('Error updating likes:', updateError.message);
          return;
        }

        likes.value += 1;
        isLiked.value = true;

        createNotification(`Your blug was liked by ${chatterName.value}`);
      }
    };

    const updateBookmark = async () => {
      if (!blogId.value || !userId.value) {
        console.error('Blog ID or User ID not found in local storage');
        return;
      }

      const { data, error } = await supabase
        .from<BlogPost>('blog_post')
        .select('bookmarked_by')
        .eq('blog_id', blogId.value)
        .single();

      if (error) {
        console.error('Error fetching current bookmarked_by:', error.message);
        return;
      }

      if (data) {
        const currentBookmarkedBy = data.bookmarked_by || [];

        let updatedBookmarkedBy;
        if (isBookmarked.value) {
          updatedBookmarkedBy = currentBookmarkedBy.filter(id => id !== userId.value);
        } else {
          updatedBookmarkedBy = [...currentBookmarkedBy, userId.value];
        }

        const { error: updateError } = await supabase
          .from('blog_post')
          .update({
            bookmarked_by: updatedBookmarkedBy,
          })
          .eq('blog_id', blogId.value);

        if (updateError) {
          console.error('Error updating bookmarks:', updateError.message);
          return;
        }

        isBookmarked.value = !isBookmarked.value;
      }
    };

    const postComment = async () => {
      if (!blogId.value || !userId.value || !newComment.value) {
        console.error('Blog ID, User ID, or comment text not found');
        return;
      }

      const { data, error } = await supabase
        .from<BlogPost>('blog_post')
        .select('comments, comment_details, commented_by')
        .eq('blog_id', blogId.value)
        .single();

      if (error) {
        console.error('Error fetching current comments:', error.message);
        return;
      }

      if (data) {
        const currentComments = data.comments || [];
        const currentCommentDetails = data.comment_details || [];
        const currentCommentedBy = data.commented_by || [];

        const newCommentText = newComment.value;
        const newCommentMeta = `was commented by ${chatterName.value || 'Anonymous'} on ${formatDate(new Date().toISOString())} at ${formatTime(new Date().toISOString())}`;

        const updatedComments = [...currentComments, newCommentText];
        const updatedCommentDetails = [...currentCommentDetails, { text: newCommentText, meta: newCommentMeta }];
        const updatedCommentedBy = [...currentCommentedBy, chatterName.value];

        const { error: updateError } = await supabase
          .from('blog_post')
          .update({
            comments: updatedComments,
            comment_details: updatedCommentDetails,
            commented_by: updatedCommentedBy,
          })
          .eq('blog_id', blogId.value);

        if (updateError) {
          console.error('Error updating comments:', updateError.message);
          return;
        }

        comments.value = updatedComments;
        commentDetails.value = updatedCommentDetails;
        newComment.value = '';

        createNotification(`${chatterName.value} commented on your blug`);
      }
    };

    const checkCommentLength = () => {
      if (newComment.value.length > 250) {
        commentWarning.value = 'Comment cannot exceed 250 characters';
      } else {
        commentWarning.value = null;
      }
    };

    const formatDate = (dateString: string) => {
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      };
      return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const formatTime = (dateString: string) => {
      const options: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      };
      return new Date(dateString).toLocaleTimeString(undefined, options);
    };

    onMounted(async () => {
      blogId.value = localStorage.getItem('blog_id');
      await fetchUserDetails();
      fetchLikesBookmarksComments();
    });

    return {
      likes,
      isLiked,
      isBookmarked,
      comments,
      commentDetails,
      newComment,
      commentWarning,
      updateLikes,
      updateBookmark,
      postComment,
      checkCommentLength,
      formatDate,
      formatTime,
    };
  },
});
</script>

<style scoped>
.interactive-page {
  height: 5px;
  margin-bottom: 500px;
}

.container {
  text-align: center;
}

.like-section, .bookmark-section {
  margin-top: 10px;
}

.comments-section {
  margin-top: 20px;
  background: #333;
  padding: 20px;
  border-radius: 0px 0px 10px 10px;
}

.comment {
  margin-bottom: 10px;
  padding: 10px;
  background: #444;
  border-radius: 5px;
}

.comment-meta {
  font-size: 0.8rem;
  color: #aaa;
}

.comment-input {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
}

input {
  flex: 1;
  padding: 10px;
  border: 1px solid #555;
  border-radius: 5px;
  background: #222;
  color: #cebfad;
}

button {
  display: flex;
  align-items: center;
  padding: 10px 20px;
  background: none;
  border: none;
  cursor: pointer;
}

button .fa-heart, button .fa-bookmark {
  color: #cebfad;
  font-size: 25px;
  margin-right: 8px;
}

button.liked .fa-heart {
  color: rgb(250, 0, 0);
}

button.bookmarked .fa-bookmark {
  color: #fd662f;
}

button:hover .fa-heart, button:hover .fa-bookmark {
  color: #fd662f;
}

button.post {
  padding: 10px 20px;
  background: #fd662f;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button.post:hover {
  background: #e04a2e;
}

button.post:disabled {
  background: #aaa;
  cursor: not-allowed;
}

.warning {
  color: red;
  margin-top: 10px;
}

.interaction-container{
  display: flex;
  flex-direction: row;
}

.likescounter{
  font-weight: bold;
  color: #cebfad;
}

@media (max-width: 430px) {
  button .fa-heart, button .fa-bookmark {
    color: #cebfad;
    font-size: 25px;
  }

  .interaction-container {
    display: flex;
    flex-direction: row;
    justify-content: center;
  }
}
</style>
