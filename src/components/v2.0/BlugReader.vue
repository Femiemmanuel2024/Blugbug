<template>
  <div v-if="isLoading" class="loading-page">
    <!-- Display a loading indicator while the page is loading -->
    <div class="spinner"></div>
    <p>Loading...</p>
  </div>
  <div v-else class="blug-reader">
    <NavBar />
    <div class="blug-content" v-html="post?.content"></div>
    <InteractivePage :blogId="post?.id" ref="interactivePage" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { supabase } from '../supabase';
import NavBar from '../../components/NavBar.vue';
import InteractivePage from '../features/InteractionPage.vue';

interface Post {
  id: number;
  title: string;
  content: string;
  likes: number;
  user: string;
  userFullName: string;
  date: string;
  bookmarked_by: string[];
}

export default defineComponent({
  name: 'BlugReader',
  components: {
    NavBar,
    InteractivePage,
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const post = ref<Post | null>(null);
    const isLoading = ref(true);
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const interactivePageRef = ref<HTMLElement | null>(null); // Reference to the InteractivePage component

    const clearAndSetBlogIdInLocalStorage = (blogId: string) => {
      localStorage.removeItem('blog_id'); 
      localStorage.setItem('blog_id', blogId);
    };

    const loadPost = async (blogId: string) => {
      const { data, error } = await supabase
        .from('blog_post')
        .select('*')
        .eq('blog_id', blogId)
        .single();

      if (error) {
        console.error('Error fetching post:', error.message);
        isLoading.value = false; // Hide the loading page on error
        return;
      }

      if (data) {
        const filePath = `${data.user_id}/${data.blog_id}.html`;
        const { data: postContent, error: contentError } = await supabase.storage
          .from('blog-post')
          .download(filePath);

        if (contentError) {
          console.error('Error fetching post content:', contentError.message);
          isLoading.value = false; // Hide the loading page on error
          return;
        }

        const contentText = await postContent.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(contentText, 'text/html');

        // Center-align all <address> elements
const addresses = doc.querySelectorAll('address');
addresses.forEach(address => {
  address.style.textAlign = 'center'; // Center the address elements
});

// Center-align all <time> elements
  const times = doc.querySelectorAll('time');
times.forEach(time => {
  time.style.display = 'block';  // Make the <time> element a block-level element
  time.style.textAlign = 'center'; // Center the text
});


        // Center headers (h1) and paragraphs (p)
        const headers = doc.querySelectorAll('h1');
        headers.forEach(header => {
          header.style.textAlign = 'center'; // Center the headers
        });

        const paragraphs = doc.querySelectorAll('p');
        paragraphs.forEach(paragraph => {
          paragraph.style.textAlign = 'left'; // Center the paragraphs
        });

        // Modify image elements
        const images = doc.querySelectorAll('img');
        images.forEach(img => {
          img.classList.add('custom-img-class'); // Add a custom class
          img.style.width = '60%'; // Set width to 60%
          img.style.height = '300px'; // Set height to 300px
          img.style.objectFit = 'cover'; // Maintain aspect ratio
          img.style.display = 'block'; // Center the image horizontally
          img.style.margin = '0 auto'; // Center the image
          img.style.overflow = 'hidden'; // Hide overflow
        });

        const bodyContent = Array.from(doc.body.children)
          .map((child) => child.outerHTML)
          .join('');

        post.value = {
          id: data.id,
          title: data.title,
          content: bodyContent,
          likes: data.likes || 0,
          user: data.user_id,
          userFullName: data.user_full_name,
          date: data.created_at,
          bookmarked_by: data.bookmarked_by || [],
        };

        clearAndSetBlogIdInLocalStorage(data.blog_id);
        isLoading.value = false; // Hide the loading page when content is loaded
      }
    };

    const clearLocalStorageOnNavigate = () => {
      localStorage.removeItem('blog_id');
    };

    const toggleBookmark = async () => {
      if (!post.value) return;
      const isBookmarked = post.value.bookmarked_by.includes(currentUser.id);

      let updatedBookmarkedBy;
      if (isBookmarked) {
        updatedBookmarkedBy = post.value.bookmarked_by.filter(id => id !== currentUser.id);
      } else {
        updatedBookmarkedBy = [...post.value.bookmarked_by, currentUser.id];
      }

      const { error } = await supabase
        .from('blog_post')
        .update({ bookmarked_by: updatedBookmarkedBy })
        .eq('id', post.value.id);

      if (error) {
        console.error('Error updating bookmarks:', error.message);
        return;
      }

      post.value.bookmarked_by = updatedBookmarkedBy;
    };

    const autoScrollToInteractivePage = () => {
      if (interactivePageRef.value) {
        interactivePageRef.value.scrollIntoView({ behavior: 'smooth' });
      }
    };

    onMounted(() => {
      const blogId = route.query.blogId as string;
      loadPost(blogId);
    });

    // Watch for changes in the route or any prop passed from ActionNotifications.vue
    watch(
      () => route.query.blogId,
      (newBlogId, oldBlogId) => {
        if (newBlogId !== oldBlogId) {
          loadPost(newBlogId as string);
          autoScrollToInteractivePage();
        }
      }
    );

    onBeforeUnmount(() => {
      clearLocalStorageOnNavigate();
    });

    return {
      post,
      isLoading,
      toggleBookmark,
      interactivePageRef, // Return the reference for the InteractivePage component
    };
  },
});
</script>

<style scoped>
.blug-reader {
  padding: 0px;
  background-color: #2b3138;
  color: #cebfad;
  border: solid 5px #0c1118;
  margin-top: 70px;
  height: 100%;
  margin-right: 50px;
  margin-left: 50px;
}

.blug-content {
  margin-top: 20px;
  line-height: 1.6;
  padding: 20px;
}

.loading-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #2b3138;
  color: #cebfad;
}

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 4px solid #fd662f;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.bookmark-button {
  padding: 10px 20px;
  border: none;
  background-color: #fd662f;
  color: white;
  cursor: pointer;
  border-radius: 5px;
}

.bookmark-button:hover {
  background-color: #e04a2e;
}

/* Custom image styling */
.custom-img-class {
  width: 60%;
  height: 300px;
  object-fit: cover;
  display: block;
  margin: 0 auto;
  overflow: hidden;
}

/* CSS for iPad screen size */
@media screen and (min-width: 768px) and (max-width: 1024px) {
  /* Add styles for iPad screen size here */
}

/* CSS for phone screen size */
@media screen and (max-width: 767px) {
  .blug-reader {
    padding: 0px;
    background-color: #2b3138;
    color: #cebfad;
    border: solid 5px #0c1118;
    margin-top: 160px;
    height: 100%;
    margin-right: 2px;
    margin-left: 2px;
  }
  /* Add styles for phone screen size here */
}
</style>
