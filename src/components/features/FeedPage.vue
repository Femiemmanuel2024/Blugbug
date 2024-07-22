<template>
  <div class="feed-contain">
    <div class="feedheader">
      <!-- <h3>Blug</h3> -->
    </div>
    <ul>
      <li v-if="feedPosts.length === 0" class="no-following-message">
        You are currently following no one and have no blug feed to display.
      </li>
      <li v-for="post in feedPosts" :key="post.id">
        <div @click="toggleContent(post.id)" class="post-title">{{ post.title }}</div>
        <div class="post-meta">by {{ post.userFullName }} on {{ formatDateTime(post.date) }}</div>
        <div class="post-actions">
          <span class="action-item">Likes: {{ post.likes }}</span>
          <i 
            class="fas fa-bookmark action-item" 
            :class="{ 'bookmarked': isBookmarked(post) }"
            @click.stop="bookmarkPost(post)"
          ></i>
          <button @click="readPost(post.title)" class="action-item">Read</button>
        </div>
        <div v-if="expandedPost === post.id" class="post-content" v-html="post.content"></div>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { supabase } from '../supabase';
import { useRouter } from 'vue-router';

interface Post {
  id: number;
  title: string;
  content: string;
  likes: number;
  user: string;
  userFullName: string;
  date: string;
  filePath: string;
  bookmarked_by: string[];
}

export default defineComponent({
  name: 'FeedPage',
  setup() {
    const feedPosts = ref<Post[]>([]);
    const expandedPost = ref<number | null>(null);
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const router = useRouter();

    const loadFeedPosts = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('following_id')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        console.error('Error fetching following IDs:', error.message);
        return;
      }

      const followingIds = data.following_id;

      if (!followingIds || followingIds.length === 0) {
        feedPosts.value = [];
        return;
      }

      const allPosts: Post[] = [];

      for (const userId of followingIds) {
        const { data: postData, error: postError } = await supabase
          .from('blog_post')
          .select('*')
          .eq('user_id', userId);

        if (postError) {
          console.error('Error fetching posts:', postError.message);
          continue;
        }

        for (const post of postData) {
          const filePath = `${userId}/${post.blog_id}.html`;

          const { data: postContent, error: contentError } = await supabase.storage
            .from('blog-post')
            .download(filePath);

          if (contentError) {
            console.error('Error fetching post content:', contentError.message);
            continue;
          }

          const contentText = await postContent.text();
          const parser = new DOMParser();
          const doc = parser.parseFromString(contentText, 'text/html');
          const h1Element = doc.querySelector('h1');
          const createdByElement = doc.querySelector('p:nth-of-type(1)');
          const dateElement = doc.querySelector('p:nth-of-type(2)');
          const bodyContent = Array.from(doc.body.children)
            .filter((child) => !['H1', 'P'].includes(child.tagName))
            .map((child) => child.outerHTML)
            .join('');

          allPosts.push({
            id: post.id,
            title: h1Element ? h1Element.textContent || 'Untitled' : 'Untitled',
            content: bodyContent,
            likes: post.likes || 0,
            user: userId,
            userFullName: createdByElement?.textContent?.replace('Created by: ', '') || 'Unknown',
            date: dateElement?.textContent?.replace('Date: ', '') || new Date().toISOString(),
            filePath: filePath,
            bookmarked_by: post.bookmarked_by || []
          });
        }
      }

      feedPosts.value = allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    };

    const formatDateTime = (dateTime: string) => {
      const date = new Date(dateTime);
      const formattedTime = date.toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
      const formattedDate = date.toLocaleDateString();
      return `${formattedTime} on ${formattedDate}`;
    };

    const readPost = (title: string) => {
      router.push({ name: 'BlugPage', query: { search: title } });
    };

    const bookmarkPost = async (post: Post) => {
      const isBookmarked = post.bookmarked_by.includes(currentUser.id);

      let updatedBookmarkedBy;
      if (isBookmarked) {
        updatedBookmarkedBy = post.bookmarked_by.filter(id => id !== currentUser.id);
      } else {
        updatedBookmarkedBy = [...post.bookmarked_by, currentUser.id];
      }

      const { error } = await supabase
        .from('blog_post')
        .update({ bookmarked_by: updatedBookmarkedBy })
        .eq('id', post.id);

      if (error) {
        console.error('Error updating bookmarks:', error.message);
        return;
      }

      post.bookmarked_by = updatedBookmarkedBy;
    };

    const isBookmarked = (post: Post) => {
      return post.bookmarked_by.includes(currentUser.id);
    };

    const toggleContent = (postId: number) => {
      expandedPost.value = expandedPost.value === postId ? null : postId;
    };

    onMounted(() => {
      loadFeedPosts();
    });

    return {
      feedPosts,
      expandedPost,
      readPost,
      bookmarkPost,
      toggleContent,
      formatDateTime,
      isBookmarked,
    };
  },
});
</script>

<style scoped>
.feed-container {
  margin: 20px 0;
  border: solid 5px #006aff;
  padding: 5px;
}

ul {
  list-style-type: none;
  color: #cebfad;
  padding-left: 30px;
  padding-right: 10px;
  width: 100%;
}

li {
  display: flex;
  flex-direction: column;
  padding: 10px 0;
  border-bottom: 1px solid #ccc;
}

.post-item {
  border: none;
}

.post-title {
  font-size: 20px;
  font-weight: bold;
  cursor: pointer;
}

.post-meta {
  font-size: 14px;
  color: gray;
}

.post-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}

.post-actions .action-item {
  display: flex;
  align-items: center;
  font-size: 14px;
  background: none;
  border: none;
  color: #f53;
  cursor: pointer;
  padding: 5px;
}

.post-actions .action-item:hover {
  color: #fd662f;
}

.post-actions .fa-bookmark.bookmarked {
  color: yellow; /* Set bookmark color to yellow when active */
}

.post-content {
  margin-top: 10px;
}

.no-following-message {
  font-size: 18px;
  color: #cebfad;
  text-align: center;
  margin-top: 20px;
}

@media (max-width: 780px){
  ul {
  
  padding-left: 0px;
  padding-right: 0px;
}
}


</style>
