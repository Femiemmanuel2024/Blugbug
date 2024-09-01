<template>
  <div class="chatters-page">
    <NavBar />
    
    <div class="content">
      <div class="container">
        <div class="left-column" v-if="!isLeftColumnHidden">
          <div class="left-title">
            <h1 class="blog-header">My Blug Posts</h1>
          </div>
          <div class="left-container">
            <ul>
              <li class="list-container" v-for="(post, index) in posts" :key="index">
                <span class="post-title" @click="viewPost(index)">{{ post.title }}</span>
                <div class="post-actions">
                  <i class="fas fa-eye" @click="viewPost(index)" title="Read"></i>
                  <i class="fas fa-edit" @click="editPost(index)" title="Edit"></i>
                  <i class="fas fa-trash" @click="deletePost(index)" title="Delete"></i>
                </div>
              </li>
            </ul>
          </div>
        </div>
        <div class="right-column" :class="{ 'expanded': isLeftColumnHidden }">
          <div class="top-bar" v-if="isLeftColumnHidden">
            <i class="fas fa-arrow-left" @click="showLeftColumn" title="Back"></i>
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
  blogId: string;  // Added blogId to store the actual blog ID
  userFullName: string;
  date: string;
  imageUrl?: string; // Add imageUrl field
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
    const currentComponentKey = ref<number>(0); // Key to force component re-render
    const isLeftColumnHidden = ref<boolean>(false); // State to control the visibility of the left column
    const router = useRouter(); // Use router for navigation

    const loadPosts = async () => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = currentUser.id;

      if (!userId) {
        console.error('User ID not found.');
        return;
      }

      // Fetch all blog posts for the logged-in user
      const { data: blogPosts, error } = await supabase
        .from('blog_post')
        .select('id, title, user_id, blog_id')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching blog posts:', error.message);
        return;
      }

      // Map the fetched posts to the posts array
      posts.value = blogPosts.map(post => ({
        id: post.id,
        title: post.title,
        content: '', // Content will be fetched when the post is viewed
        bodyContent: '',
        userId: post.user_id,
        blogId: post.blog_id,  // Store the blog ID
        userFullName: currentUser.fullName || 'Unknown', // Adjust based on your user structure
        date: new Date().toISOString(), // Example date
      }));

      console.log('Loaded posts:', posts.value);
    };

    const fetchPostContent = async (userId: string, blogId: string) => {
      const filePath = `${userId}/${blogId}/${blogId}.html`; // Path to the HTML file
      console.log(`Fetching content for file: ${filePath}`);
      const { data, error } = await supabase.storage
        .from('blog-post')
        .download(filePath);

      if (error) {
        console.error('Error fetching post content:', error.message);
        return { content: '', imageUrl: '' };
      }

      console.log('Post content fetched successfully for file:', filePath);
      const contentText = data ? await data.text() : '';

      // Fetch the header image URL
      const imageFilePath = `${userId}/${blogId}/header-image.webp`; // Path to the header image
      const { data: headerImageData, error: imageError } = supabase.storage
        .from('blog-post')
        .getPublicUrl(imageFilePath);

      if (imageError) {
        console.error('Error fetching header image:', imageError.message);
        return { content: contentText, imageUrl: '' };
      }

      console.log('Header image URL fetched:', headerImageData.publicUrl);
      return { content: contentText, imageUrl: headerImageData.publicUrl || '' };
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

    const viewPost = async (index: number) => {
      const post = posts.value[index];
      const userId = post.userId;
      const blogId = post.blogId;  // Use the stored blogId to fetch content

      // Save blog_id to local storage
      localStorage.setItem('blog_id', blogId);

      // Fetch the post content and image URL
      const { content: htmlContent, imageUrl } = await fetchPostContent(userId, blogId);
      if (!htmlContent) {
        console.warn('No content found for post:', post.title);
        return;
      }

      const { title, bodyContent } = extractPostElements(htmlContent);
      selectedPost.value = { ...post, title, bodyContent, imageUrl }; // Include image URL in selectedPost
      currentComponentKey.value += 1; // Update the key to force re-render

      // Hide the left column when a post is viewed
      isLeftColumnHidden.value = true;
    };

    const editPost = (index: number) => {
      const post = posts.value[index];
      
      // Save blog_id to local storage
      localStorage.setItem('blog_id', post.blogId);

      router.push({ name: 'EditPostPage', params: { blogId: post.blogId } });
    };

    const showLeftColumn = () => {
      isLeftColumnHidden.value = false;
    };

    const deletePost = async (index: number) => {
      const post = posts.value[index];
      const userId = post.userId;
      const blogId = post.blogId;  // Use the stored blogId
      const filePath = `${userId}/${blogId}/${blogId}.html`;

      const { error: deleteError } = await supabase.storage
        .from('blog-post')
        .remove([filePath]);

      if (deleteError) {
        console.error('Error deleting post:', deleteError.message);
        return;
      }

      // Remove the post from the local state
      posts.value.splice(index, 1);
      localStorage.setItem(`${userId}_blogPosts`, JSON.stringify(posts.value));
    };

    onMounted(() => {
      loadPosts();
    });

    return {
      posts,
      selectedPost,
      viewPost,
      editPost, // Include the editPost method in the returned object
      deletePost,
      currentComponentKey,
      isLeftColumnHidden,
      showLeftColumn,
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
  width: 50%; /* Set the width of the image */
  height: 300px; /* Set the height of the image */
  object-fit: contain; /* Ensures the image covers the specified dimensions */
  display: block; /* Ensures the image is displayed as a block element */
  margin: 0 auto; /* Centers the image horizontally */
}


.content {
  display: flex;
  flex-grow: 1;
  width: 100%;
}

.container {
  display: flex;
  width: 100%;
  background: linear-gradient(45deg, #202329, #4e545b);
}

.left-column {
  width: 25%;
  padding: 20px;
  background-color: none;
  overflow-y: hidden;
  transition: width 0.5s;
}

.left-container {
  padding: 20px;
  background-color: none; /* Container background color */
  border-radius: 10px;
  text-align: left;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.left-title {
  background-color: #1e2127;
  width: 100%;
  padding: 2px;
}

.left-title h1 {
  text-align: center;
  width: 100%;
  font-size: 14px;
  justify-content: center;
  color: #cebfad;
}

.right-column {
  width: 75%;
  padding: 20px;
  background-color: #1e2127;
  overflow-y: auto;
  color: #cebfad;
  transition: width 0.5s;
}

.right-column.expanded {
  width: 100%;
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
  justify-content: space-between;
  align-items: flex-start; /* Align to the top */
  margin-bottom: 5px;
  border-bottom: 1px solid #444; /* Thin border line */
  padding-bottom: 5px; /* Add some padding */
}

.post-title {
  flex: 1;
  font-size: 14px;
  cursor: pointer;
  color: #cebfad;
  text-align: left; /* Left align the post titles */
  overflow-wrap: anywhere; /* Allow long titles to wrap */
  white-space: pre-line; /* Preserve whitespace and allow wrapping */
}

.post-title:hover {
  color: #fd662f;
}

.post-actions {
  display: flex;
  align-items: center; /* Align icons with the first line of the title */
  gap: 10px;
  margin-left: 10px;
}

.post-actions i {
  cursor: pointer;
  color: #cebfad;
}

.post-actions i:hover {
  color: #fd662f;
}

button {
  padding: 5px 10px;
  background-color: #fd662f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #e04a2e;
}

h2 {
  color: #cebfad;
  font-size: 2rem;
}

.postbody {
  color: #cebfad;
  font-size: 1rem;
}

@media (max-width: 430px) {
  .chatters-page {
    display: flex;
    flex-direction: column;
    height: 100vh;
    padding-right: 1px;
    padding-left: 1px;
    padding-top: 100px;
  }

  .container {
    flex-direction: column;
  }

  .left-column {
    order: 1;
    width: 90%;
    z-index: 5;
  }

  .right-column {
    order: 2;
    width: 90%;
    padding-right: 20px;
    padding-left: 20px;
  }

  .right-column.expanded {
    width: 90%;
  }

  ul {
    display: block;
  }

  li {
    display: block;
    margin-bottom: 5px;
  }

  .post-title {
    text-align: left;
  }
}

.list-container {
  display: flex;
}
</style>
