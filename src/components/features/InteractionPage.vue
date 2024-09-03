<template>
  <div class="interactive-page">
    <div class="content">
      <div class="interaction-container">
        <div class="like-section">
          <button @click="toggleLike" :class="{ liked: isLiked }">
            <font-awesome-icon :icon="['fas', 'heart']" />
            <span class="likescounter">{{ likes }}</span>
          </button>
        </div>
        <div class="share-section">
          <button @click="sharePost">
            <font-awesome-icon :icon="['fas', 'share-from-square']" />
          </button>
        </div>
        <div class="bookmark-section">
          <button @click="toggleBookmark" :class="{ bookmarked: isBookmarked }">
            <font-awesome-icon :icon="['fas', 'bookmark']" />
          </button>
        </div>
      </div>
      <div class="container">
        <div class="comments-section">
          <!-- Display each comment with a reply button -->
          <div v-for="(comment, index) in formattedCommentDetails" :key="index" class="comment">
            <p v-html="comment.text"></p> <!-- Render the formatted comment with clickable mentions -->
            <p class="comment-meta">{{ comment.meta }}</p>
            <!-- Conditionally show delete button for comments if the user is the blog owner -->
            <button v-if="isBlogOwner" class="delete-comment" @click.stop="deleteComment(index)">
              <font-awesome-icon icon="fa-solid fa-trash" />
            </button>
            <!-- Add Reply button -->
            <button class="reply-button" @click="replyToComment(comment.text, comment.meta)">Reply</button>
          </div>
          <div class="comment-input">
            <input
              v-model="newComment"
              placeholder="Add a comment"
              @input="checkCommentLength"
              @keydown="handleMention"
              @blur="hideMentionsList"
            />
            <button @click="postComment" :disabled="newComment.length > 250">Post</button>
            <!-- Mentions dropdown -->
            <ul v-if="showMentionsList" class="mentions-list">
              <li v-for="user in mentionedUsers" :key="user.id" @click="addMention(user.chatter_name)">
                {{ user.chatter_name }}
              </li>
            </ul>
          </div>
          <p v-if="commentWarning" class="warning">{{ commentWarning }}</p>
        </div>
      </div>
    </div>
    <!-- Modal for "Link copied" -->
    <div v-if="isModalVisible" class="modal-overlay">
      <div class="modal">
        <p>Link copied to clipboard!</p>
        <button class="button-modal" @click="isModalVisible = false">Close</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
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
    const router = useRouter();
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
    const isModalVisible = ref(false); // State for modal visibility

    const mentionedUsers = ref<User[]>([]);
    const showMentionsList = ref(false);

    const isBlogOwner = computed(() => userId.value === blogOwnerId.value);

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

        chatterName.value = data?.chatter_name || null;
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
        isLiked.value = data.liked_by?.includes(userId.value || '') || false;
        isBookmarked.value = data.bookmarked_by?.includes(userId.value || '') || false;
        blogOwnerId.value = data.user_id;
        blogTitle.value = data.title;
      }
    };

    const replyToComment = (commentText: string, commentMeta: string) => {
      const commentedBy = commentMeta.match(/was commented by (.*) on/)[1];
      localStorage.setItem('comment_main', commentText);
      localStorage.setItem('commented_by', commentedBy);
      router.push({ name: 'ReplyPage' });
    };

    const deleteComment = async (index: number) => {
      if (!isBlogOwner.value) return;

      const commentToDelete = commentDetails.value[index];
      if (!commentToDelete) return;

      const commentMain = commentToDelete.text;

      const { error: deleteRepliesError } = await supabase
        .from('reply_table')
        .delete()
        .eq('comment_main', commentMain);

      if (deleteRepliesError) {
        console.error('Error deleting replies associated with the comment:', deleteRepliesError.message);
        return;
      }

      const updatedComments = comments.value.filter((_, i) => i !== index);
      const updatedCommentDetails = commentDetails.value.filter((_, i) => i !== index);

      const { error } = await supabase
        .from('blog_post')
        .update({
          comments: updatedComments,
          comment_details: updatedCommentDetails,
        })
        .eq('blog_id', blogId.value);

      if (error) {
        console.error('Error deleting comment:', error.message);
        return;
      }

      comments.value = updatedComments;
      commentDetails.value = updatedCommentDetails;
    };

    const createNotification = async (message: string, recipientId: string, blogId: string) => {
      const { error } = await supabase
        .from('notifications')
        .insert([
          {
            message: message,
            user_id: recipientId,
            blog_id: blogId,
            not_identifier: 'MENTION',
            created_at: new Date().toISOString(),
          },
        ]);

      if (error) {
        console.error('Error creating notification:', error.message);
      }
    };

    const toggleLike = async () => {
      if (!blogId.value || !userId.value) {
        console.error('Blog ID or User ID not found in local storage');
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

        if (isLiked.value) {
          const updatedLikedBy = currentLikedBy.filter(id => id !== userId.value);
          const updatedLikedByChatterNames = currentLikedByChatterNames.filter(name => name !== chatterName.value);

          const { error: updateError } = await supabase
            .from('blog_post')
            .update({
              likes: likes.value - 1,
              liked_by: updatedLikedBy,
              liked_by_chatter_names: updatedLikedByChatterNames,
            })
            .eq('blog_id', blogId.value);

          if (updateError) {
            console.error('Error updating likes:', updateError.message);
            return;
          }

          likes.value -= 1;
          isLiked.value = false;
        } else {
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
          createNotification(`Your blug was liked by ${chatterName.value}`, blogOwnerId.value!, blogId.value!);
        }
      }
    };

    const toggleBookmark = async () => {
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

    const sharePost = async () => {
      if (!blogId.value || !blogTitle.value) {
        console.error('Blog ID or title not found');
        return;
      }

      const shareLink = `${window.location.origin}/read?blogId=${blogId.value}`;
      
      document.title = blogTitle.value;
      setMetaTag('og:title', blogTitle.value);
      setMetaTag('og:url', shareLink);
      setMetaTag('og:image', 'path/to/default-image.jpg');

      try {
        await navigator.clipboard.writeText(shareLink);
        isModalVisible.value = true; // Show modal instead of alert
      } catch (error) {
        console.error('Failed to copy: ', error);
      }
    };

    const setMetaTag = (name: string, content: string) => {
      let element = document.querySelector(`meta[property='${name}']`);
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute('property', name);
        document.head.appendChild(element);
      }
      element.setAttribute('content', content);
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

        createNotification(`${chatterName.value} commented on your blug`, blogOwnerId.value!, blogId.value!);

        const mentionedUsernames = newCommentText.match(/@(\w+)/g);
        if (mentionedUsernames) {
          for (const mentionedUsername of mentionedUsernames) {
            const username = mentionedUsername.slice(1);
            console.log(`Searching for mentioned user: ${username}`);
            const { data: mentionedUser, error: userError } = await supabase
              .from<User>('users')
              .select('id')
              .eq('chatter_name', username)
              .single();

            if (userError) {
              console.error('Error fetching mentioned user:', userError.message);
              continue;
            }

            if (mentionedUser) {
              const mentionedUserId = mentionedUser.id;
              localStorage.setItem('mentionedUserId', mentionedUserId);
              console.log(`Found mentioned user with id: ${mentionedUserId}`);
              createNotification(`${chatterName.value} mentioned you in a blug`, mentionedUserId, blogId.value!);
            }
          }
        }
      }
    };

    const checkCommentLength = () => {
      if (newComment.value.length > 250) {
        commentWarning.value = 'Comment cannot exceed 250 characters';
      } else {
        commentWarning.value = null;
      }
    };

    const handleMention = async (event: KeyboardEvent) => {
      const inputValue = newComment.value;
      const cursorPosition = (event.target as HTMLInputElement).selectionStart || 0;

      const lastAtPosition = inputValue.lastIndexOf('@', cursorPosition - 1);

      if (lastAtPosition !== -1) {
        const searchQuery = inputValue.slice(lastAtPosition + 1, cursorPosition).trim();
        if (searchQuery) {
          const { data, error } = await supabase
            .from<User>('users')
            .select('id, chatter_name')
            .ilike('chatter_name', `${searchQuery}%`);

          if (error) {
            console.error('Error fetching mentioned users:', error.message);
            return;
          }

          mentionedUsers.value = data || [];
          showMentionsList.value = mentionedUsers.value.length > 0;
        }
      } else {
        showMentionsList.value = false;
      }
    };

    const addMention = (chatterName: string) => {
      const cursorPosition = (document.querySelector('.comment-input input') as HTMLInputElement).selectionStart || 0;
      const newValue = newComment.value.slice(0, cursorPosition).replace(/@\w*$/, `@${chatterName}`) + newComment.value.slice(cursorPosition);
      newComment.value = newValue + ' ';
      showMentionsList.value = false;
    };

    const hideMentionsList = () => {
      setTimeout(() => {
        showMentionsList.value = false;
      }, 100);
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

    const formattedCommentDetails = computed(() => {
      return commentDetails.value.map((comment) => {
        const formattedText = comment.text.replace(/@(\w+)/g, (match, username) => {
          return `<router-link to="/profile/${username}" style="color: orange;">${match}</router-link>`;
        });
        return {
          ...comment,
          text: formattedText,
        };
      });
    });

    onMounted(async () => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
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
      formattedCommentDetails,
      newComment,
      commentWarning,
      toggleLike,
      toggleBookmark,
      sharePost,
      postComment,
      checkCommentLength,
      handleMention,
      mentionedUsers,
      showMentionsList,
      addMention,
      hideMentionsList,
      formatDate,
      formatTime,
      isBlogOwner,
      deleteComment,
      replyToComment,
      isModalVisible, // Add isModalVisible to return
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
.interactive-page {
  height: 5px;
}

.container {
  text-align: center;
  width: 100%;
}

.like-section,
.bookmark-section {
  margin-top: 10px;
  background-color: #444;
  width: 100%;
}

.bookmark-section {
  background-color: #444;
}

.like-section {
  display: flex;
  justify-content: end;
  align-items: end;
  margin-top: 10px;
}

.share-section {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 10px;
  background-color: #444;
  width: 100%;
}

.comments-section {
  margin-top: 0px;
  background: #333;
  padding: 20px;
  border-radius: 0px 0px 10px 10px;
}

.comment {
  margin-bottom: 10px;
  padding: 10px;
  background: #444;
  border-radius: 5px;
  position: relative;
  margin-top: 20px;
}

.comment-meta {
  font-size: 0.8rem;
  color: #aaa;
}

.reply-button {
  margin-top: 10px;
  padding: 5px 10px;
  background: #fd662f;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  width: 100%;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.reply-button:hover {
  background: #e04a2e;
}

.comment-input {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 20px;
  position: relative;
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

button .fa-heart,
button .fa-bookmark,
button .fa-share-from-square {
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

button:hover .fa-heart,
button:hover .fa-bookmark {
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

button.delete-comment {
  position: absolute;
  top: 5px;
  right: 5px;
  background: none;
  border: none;
  color: #cebfad;
  cursor: pointer;
}

button.delete-comment:hover {
  color: #fd662f;
}

.warning {
  color: red;
  margin-top: 10px;
}

.interaction-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
}

.likescounter {
  font-weight: bold;
  color: #cebfad;
}

.mentions-list {
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  background: #333;
  border-radius: 5px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  max-height: 150px;
  overflow-y: auto;
  z-index: 9000;
}

.mentions-list li {
  padding: 8px 12px;
  cursor: pointer;
  color: #cebfad;
}

.mentions-list li:hover {
  background: #fd662f;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  
}

.modal button {
  margin-top: 10px;
  padding: 10px 20px;
  background: #fd662f;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  width: 100%;
}

.modal button:hover {
  background: #e04a2e;
}




@media (max-width: 430px) {
  button.delete-comment {
  position: absolute;
  top: -10px;
  right: 5px;
  color: #ffffff;
  cursor: pointer;
  background-color: red;
  border-radius: 100%;
  width: 20px;
  height: 29px;
  z-index: 999;
  padding: 10px 21px 10px 10px;
  

}

button.delete-comment:hover {
  color: #fd662f;
}


  button .fa-heart,
  button .fa-bookmark,
  button .fa-share-from-square {
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
