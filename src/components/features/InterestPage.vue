<template>
  <div class="feed-contain">
    <div class="feedheader">
      <!-- <h3>MyBlug</h3> -->
    </div>
    <ul>
      <li v-if="feedPosts.length === 0" class="no-interest-message">
        We currently have no blug on your interest. Have you selected them in your profile settings?
      </li>
      <li v-for="post in feedPosts" :key="post.id">
        <div @click="toggleContent(post.id)" class="post-title">{{ post.title }}</div>
        <div class="post-meta">by {{ post.userFullName }} on {{ formatDateTime(post.date) }}</div>
        <div class="post-actions">
          <span>Likes: {{ post.likes }}</span>
          <i 
            :class="['fas', 'fa-bookmark', { 'bookmarked': isBookmarked(post.bookmarked_by) }]"
            @click.stop="toggleBookmark(post.id, post.bookmarked_by)"
          ></i>
          <button @click="readPost(post.title)">Read</button>
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
  name: 'InterestPage',
  setup() {
    const feedPosts = ref<Post[]>([]);
    const expandedPost = ref<number | null>(null);
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const router = useRouter();

    const loadFeedPosts = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('interest_id')
        .eq('id', currentUser.id)
        .single();

      if (error) {
        console.error('Error fetching interest IDs:', error.message);
        return;
      }

      const interestIds = data.interest_id.split(','); // Split the interests into an array

      const { data: postData, error: postError } = await supabase
        .from('blog_post')
        .select('*')
        .in('categories', interestIds);

      if (postError) {
        console.error('Error fetching posts:', postError.message);
        return;
      }

      const allPosts: Post[] = [];

      for (const post of postData) {
        const filePath = `${post.user_id}/${post.blog_id}.html`;

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
          user: post.user_id,
          userFullName: createdByElement?.textContent?.replace('Created by: ', '') || 'Unknown',
          date: dateElement?.textContent?.replace('Date: ', '') || new Date().toISOString(),
          filePath: filePath,
          bookmarked_by: post.bookmarked_by || [],
        });
      }

      console.log('Fetched posts based on interests:', allPosts);

      feedPosts.value = allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      console.log('Sorted feed posts:', feedPosts.value);
    };

    const formatDateTime = (dateTime: string) => {
      const date = new Date(dateTime);
      const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const formattedDate = date.toLocaleDateString();
      return `${formattedTime} on ${formattedDate}`;
    };

    const readPost = (title: string) => {
      router.push({ name: 'BlugPage', query: { search: title } });
    };

    const isBookmarked = (bookmarkedBy: string[]) => {
      return bookmarkedBy.includes(currentUser.id);
    };

    const toggleBookmark = async (postId: number, bookmarkedBy: string[]) => {
      const isCurrentlyBookmarked = isBookmarked(bookmarkedBy);
      const updatedBookmarkedBy = isCurrentlyBookmarked
        ? bookmarkedBy.filter((id) => id !== currentUser.id)
        : [...bookmarkedBy, currentUser.id];

      const { error } = await supabase
        .from('blog_post')
        .update({ bookmarked_by: updatedBookmarkedBy })
        .eq('id', postId);

      if (error) {
        console.error('Error updating bookmark status:', error.message);
        return;
      }

      const postIndex = feedPosts.value.findIndex((post) => post.id === postId);
      if (postIndex !== -1) {
        feedPosts.value[postIndex].bookmarked_by = updatedBookmarkedBy;
      }
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
      isBookmarked,
      toggleBookmark,
      toggleContent,
      formatDateTime,
    };
  },
});
</script>

<style scoped>
.feed-container {
  margin: 20px 0;
  border: solid 5px #006aff;
}

ul {
  list-style-type: none;
  padding: 0;
  color: #cebfad;
  padding-left: 30px;
}

li {
  display: flex;
  flex-direction: column;
  padding: 10px 0;
  border-bottom: 1px solid #ccc;
}

.no-interest-message {
  font-size: 18px;
  color: red;
  text-align: center;
  margin-top: 20px;
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
  justify-content: flex-end;
  align-items: center;
  margin-top: 10px;
  gap: 15px;
}

.post-actions button {
  background: none;
  border: none;
  color: #f53;
  cursor: pointer;
  font-size: 20px;
}

.post-actions .fa-bookmark.bookmarked {
  color: orange;
}

.post-content {
  margin-top: 10px;
}
</style>
