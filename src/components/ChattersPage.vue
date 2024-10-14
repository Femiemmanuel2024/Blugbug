<template>
  <div class="chatters-page">
    <NavBar />

    <div class="content">
      <!-- Left column, which is hidden when a post is selected -->
      <div v-if="!isPostSelected" class="left-column">
        <div class="left-title">
          <h1 class="blog-header">My Blug Posts</h1>
        </div>
        <div class="left-container">
          <!-- Blog post grid -->
          <ul class="blog-list">
            <li class="list-container" v-for="(post, index) in posts" :key="index">
              <div class="image-row">
                <img :src="post.imageUrl || placeholderImageUrl" alt="Post Image" class="post-image" />
              </div>
              <div class="title-row">
                <span class="post-title">{{ post.title }}</span>
              </div>
              <div class="post-actions">
                <button class="read-button" @click="viewPost(index)">Read</button>
                <!-- Edit and Delete buttons -->
                <i class="fas fa-edit" @click="editPost(index)" title="Edit"></i>
                <i class="fas fa-trash" @click="deletePost(index)" title="Delete"></i>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Right column, full-width when a post is selected -->
      <div v-if="isPostSelected" class="right-column full-width">
        <div class="top-bar">
          <i class="fas fa-arrow-left" @click="hidePost" title="Back"></i>
        </div>
        <div v-if="selectedPost" :key="currentComponentKey">
          <div>
            <img v-if="selectedPost.imageUrl" :src="selectedPost.imageUrl" alt="Header Image" class="header-image" />
          </div>
          <h2>{{ selectedPost.title }}</h2>
          <div v-html="selectedPost.bodyContent" class="postbody"></div>
          <InteractivePage />
        </div>
      </div>
    </div>

    <FooterNav />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import NavBar from './NavBar.vue';
import { supabase } from './supabase';
import InteractivePage from './features/InteractionPage.vue';
import FooterNav from '@/components/v2.0/FooterNav.vue';

interface Post {
  id: number;
  title: string | null;
  content: string;
  bodyContent: string;
  userId: string;
  blogId: string;
  userFullName: string;
  date: string;
  imageUrl?: string;
}

export default defineComponent({
  name: 'ChattersPage',
  components: {
    NavBar,
    InteractivePage,
    FooterNav,
  },
  setup() {
    const posts = ref<Post[]>([]);
    const selectedPost = ref<Post | null>(null);
    const currentComponentKey = ref<number>(0);
    const isPostSelected = ref<boolean>(false);
    const placeholderImageUrl = '/blug_default.png';
    const router = useRouter();

    // Load only the blog posts belonging to the logged-in user
    const loadPosts = async () => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = currentUser.id;

      if (!userId) {
        console.error('User ID not found.');
        return;
      }

      // Fetch only the blog posts owned by the logged-in user
      const { data: blogPosts, error } = await supabase
        .from('blog_post')
        .select('id, title, user_id, blog_id')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching blog posts:', error.message);
        return;
      }

      // Fetch each post's image URL from Supabase Storage
      posts.value = await Promise.all(
        blogPosts.map(async (post) => {
          const filePath = `${post.user_id}/${post.blog_id}/header-image.webp`; // Path to the header image
          const { data: imageData } = supabase.storage.from('blog-post').getPublicUrl(filePath);
          const imageUrl = imageData?.publicUrl || placeholderImageUrl; // Fallback to placeholder if no image found

          return {
            id: post.id,
            title: post.title,
            content: '',
            bodyContent: '',
            userId: post.user_id,
            blogId: post.blog_id,
            userFullName: currentUser.fullName || 'Unknown',
            date: new Date().toISOString(),
            imageUrl, // Set the fetched image URL
          };
        })
      );
    };

    const fetchPostContent = async (userId: string, blogId: string) => {
      const filePath = `${userId}/${blogId}/${blogId}.html`;
      const { data, error } = await supabase.storage.from('blog-post').download(filePath);

      if (error) {
        console.error('Error fetching post content:', error.message);
        return { content: '', imageUrl: '' };
      }

      const contentText = data ? await data.text() : '';
      const imageFilePath = `${userId}/${blogId}/header-image.webp`;
      const { data: headerImageData, error: imageError } = supabase.storage
        .from('blog-post')
        .getPublicUrl(imageFilePath);

      if (imageError) {
        console.error('Error fetching header image:', imageError.message);
        return { content: contentText, imageUrl: '' };
      }

      return { content: contentText, imageUrl: headerImageData.publicUrl || '' };
    };

    const viewPost = async (index: number) => {
      const post = posts.value[index];
      const userId = post.userId;
      const blogId = post.blogId;

      localStorage.setItem('blog_id', blogId);

      const { content: htmlContent, imageUrl } = await fetchPostContent(userId, blogId);
      const { title, bodyContent } = extractPostElements(htmlContent);

      selectedPost.value = { ...post, title, bodyContent, imageUrl };
      currentComponentKey.value += 1;
      isPostSelected.value = true; // Mark that a post is selected, hiding the left column
    };

    const hidePost = () => {
      selectedPost.value = null;
      isPostSelected.value = false; // Unselect the post, showing the left column again
    };

    const editPost = (index: number) => {
      const post = posts.value[index];
      localStorage.setItem('blog_id', post.blogId);
      router.push({ name: 'EditPostPage', params: { blogId: post.blogId } });
    };

    const deletePost = async (index: number) => {
      const post = posts.value[index];
      const { error: deleteError } = await supabase
        .from('blog_post')
        .delete()
        .eq('id', post.id);

      if (deleteError) {
        console.error('Error deleting post:', deleteError.message);
        return;
      }

      posts.value.splice(index, 1); // Remove the deleted post from the local list
    };

    const extractPostElements = (htmlContent: string) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const h1Element = doc.querySelector('h1');
      const bodyContent = Array.from(doc.body.children)
        .filter((child) => child.tagName !== 'H1')
        .map((child) => child.outerHTML)
        .join('');
      return {
        title: h1Element ? h1Element.textContent : 'Untitled',
        content: htmlContent,
        bodyContent,
      };
    };

    onMounted(() => {
      loadPosts();
    });

    return {
      posts,
      selectedPost,
      viewPost,
      hidePost,
      editPost, // Add editPost method to returned object
      deletePost, // Add deletePost method to returned object
      isPostSelected,
      currentComponentKey,
    };
  },
});
</script>

<style scoped>
.chatters-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding-right: 50px;
  padding-left: 50px;
  padding-top: 63px;
}

.navbar {
  flex-shrink: 0;
}

.header-image {
  width: 50%;
  height: 300px;
  object-fit: contain;
  display: block;
  margin: 0 auto;
}

.content {
  display: flex;
  width: 100%;
}

.left-column {
  width: 100%;
  padding: 20px;
  background-color: none;
  transition: width 0.5s;
  background: linear-gradient(45deg, #202329, #4e545b);
}

.left-container {
  padding: 20px;
  background-color: none;
  border-radius: 10px;
  text-align: left;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.left-title h1 {
  text-align: center;
  font-size: 24px;
  color: #cebfad;
}

.right-column {
  width: 100%; /* Full width when a post is selected */
  padding: 20px;
  background-color: #1e2127;
  color: #cebfad;
  overflow-y: auto;
  transition: width 0.5s;
}

.top-bar {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 20px;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-bottom: 10px;
  border: 1px solid #444;
  border-radius: 10px;
  padding: 10px;
  width: 250px;
  height: 300px;
  transition: transform 0.2s;
}

li:hover {
  transform: scale(1.05);
}

.post-title {
  font-size: 16px;
  color: #cebfad;
}

.post-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
}

.read-button {
  padding: 5px 10px;
  background-color: #fd662f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.read-button:hover {
  background-color: #e04a2e;
}

.post-actions i {
  cursor: pointer;
  color: #cebfad;
  margin-left: 10px;
}

.post-actions i:hover {
  color: #fd662f;
}

h2 {
  color: #cebfad;
}

.postbody {
  color: #cebfad;
}

.blog-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.image-row {
  width: 100%;
  height: 150px;
  overflow: hidden;
}

.post-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

@media (max-width: 768px) {
  .blog-list {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 430px) {
  .blog-list {
    grid-template-columns: 1fr;
  }

  .header-image {
    width: 100%;
    height: auto;
  }
}
</style>
