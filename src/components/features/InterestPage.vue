<template>
    <div class="feedheader">
      <!-- <h3>MyBlug</h3> -->
    </div>
    <ul>
      <li v-for="post in feedPosts" :key="post.id">
        <div @click="toggleContent(post.id)" class="post-title">{{ post.title }}</div>
        <div class="post-meta">by {{ post.userFullName }} on {{ formatDateTime(post.date) }}</div>
        <div class="post-actions">
          <i class="fas fa-thumbs-up"></i>
          <span>{{ post.likes }}</span>
          <i class="fas fa-bookmark" @click.stop="bookmarkPost(post.id)"></i>
          <button @click="readPost(post.title)">Read</button>
        </div>
        <div v-if="expandedPost === post.id" class="post-content" v-html="post.content"></div>
      </li>
    </ul>
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
  
      const bookmarkPost = (postId: number) => {
        console.log(`Bookmarking post with id: ${postId}`);
        // Add logic to handle bookmarking the post
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
  
  .feedheader {
    border-bottom: 1px solid #ccc;
    display: flex;
    justify-content: center;
    background-color: #f53;
    width: 80px;
    margin-left: 10px;
    border-radius: 10px 10px 0px 0px;
    max-height: 50px;
  }
  
  h3 {
    text-align: center;
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
    gap: 10px;
    margin-top: 10px;
  }
  
  .post-actions button {
    background: none;
    border: none;
    color: #f53;
    cursor: pointer;
    font-size: 20px;
  }
  
  .post-content {
    margin-top: 10px;
  }
  </style>
  