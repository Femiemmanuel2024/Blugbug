<template>
  <div class="edit-post-page">
    <NavBar />
    <div v-if="isLoading" class="loading-message">Loading...</div>
    <div v-else class="content-container">
      <!-- View-only title display -->
      <div class="title-display">{{ title }}</div>

      <!-- Image upload input for header image -->
      <input type="file" @change="handleImageUpload" accept="image/*" class="image-input" />
      <!-- Image preview with placeholder -->
      <img :src="headerImageUrl || placeholderImageUrl" alt="Header Preview" class="header-preview" />

      <!-- TiptapEditor is initialized with the body content -->
      <TiptapEditor ref="tiptapEditor" :initialContent="content" @updateContent="updateContent" />

      <!-- Display Edited On Timestamp -->
      <p class="timestamp-display">Edited on: {{ editedOn }}</p>

      <div class="editor-actions">
        <button @click="saveChanges">Save Changes</button>
        <button @click="cancelEdit">Cancel</button>
      </div>
      <div v-if="showTitleError || showContentError || showCategoryError" class="error-message">
        <div v-if="showTitleError">Title is required</div>
        <div v-if="showContentError">Content is required</div>
        <div v-if="showCategoryError">Category is required</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, nextTick } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import NavBar from '../NavBar.vue';
import TiptapEditor from '../TiptapEditor.vue';
import { supabase } from '../supabase';

export default defineComponent({
  name: 'EditPostPage',
  components: {
    NavBar,
    TiptapEditor,
  },
  setup() {
    const router = useRouter();
    const route = useRoute();
    const title = ref<string>('');
    const content = ref<string>('');
    const editedOn = ref<string>(''); // New state for edited timestamp
    const headerImageUrl = ref<string>(''); // New state for header image URL
    const placeholderImageUrl = ref<string>('/blug_default.webp'); // Placeholder image URL
    const showTitleError = ref<boolean>(false);
    const showContentError = ref<boolean>(false);
    const showCategoryError = ref<boolean>(false);
    const isLoading = ref<boolean>(true);
    const tiptapEditorRef = ref(null);
    const newHeaderImageBase64 = ref<string>(''); // New state for the base64 of the new header image

    const fetchBlogPost = async () => {
      isLoading.value = true;
      const blogId = route.params.blogId as string;
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = currentUser.id;

      const { data, error } = await supabase.storage
        .from('blog-post')
        .download(`${userId}/${blogId}.html`);

      if (error) {
        console.error('Error fetching blog post:', error.message);
        isLoading.value = false;
        return;
      }

      const fileText = await data.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(fileText, 'text/html');

      // Extract the title
      title.value = doc.querySelector('h1')?.textContent || '';

      // Extract the body content from <div class="blog-body">
      const bodyDiv = doc.querySelector('article.blog-body');
      content.value = bodyDiv ? bodyDiv.innerHTML : '';

      // Extract the header image URL from <img> inside <div class="blug_banner">
      const imgElement = doc.querySelector('.blug_banner img');
      headerImageUrl.value = imgElement ? imgElement.src : '';

      // Generate a new "Edited on" timestamp
      const now = new Date();
      editedOn.value = now.toLocaleString();

      nextTick(() => {
        if (tiptapEditorRef.value && tiptapEditorRef.value.editor) {
          tiptapEditorRef.value.editor.commands.setContent(content.value);
          const timestamp = `<p>This post was edited on ${editedOn.value}</p>`;
          tiptapEditorRef.value.editor.commands.insertContent(timestamp);
        }
      });

      isLoading.value = false;
    };

    const handleImageUpload = (event: Event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        const file = files[0];
        const reader = new FileReader();
        reader.onload = () => {
          newHeaderImageBase64.value = reader.result as string; // Store base64 data for the new image
          headerImageUrl.value = reader.result as string; // Update the preview URL with the base64 data
        };
        reader.readAsDataURL(file);
      }
    };

    const updateContent = (updatedContent: string) => {
      content.value = updatedContent;
    };

    const saveChanges = async () => {
      showTitleError.value = !title.value.trim();
      showContentError.value = !content.value.trim();

      if (showTitleError.value || showContentError.value) {
        return;
      }

      isLoading.value = true;
      const blogId = route.params.blogId as string;
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = currentUser.id;

      // Include the "Edited on" timestamp and new header image in the HTML content
      const htmlContent = `
        <html>
          <head>
            <meta name="editedOn" content="${editedOn.value}" />
          </head>
          <body>
            <div class="blug_banner">
              <img src="${newHeaderImageBase64.value || headerImageUrl.value}" alt="Header Image" style="width: 100%; height: 200px;" />
            </div>
            <h1>${title.value}</h1>
            <article class="blog-body">${content.value}</article>
            <p>This Blug was edited on ${editedOn.value}</p>
          </body>
        </html>
      `;
      const fileName = `${blogId}.html`;
      const { error: uploadError } = await supabase.storage
        .from('blog-post')
        .update(`${userId}/${fileName}`, new Blob([htmlContent], { type: 'text/html' }));

      if (uploadError) {
        console.error('Error saving blog post:', uploadError.message);
        isLoading.value = false;
        return;
      }

      const { error: updateError } = await supabase
        .from('blog_post')
        .update({ title: title.value })
        .eq('blog_id', blogId);

      if (updateError) {
        console.error('Error updating blog post metadata:', updateError.message);
      }

      isLoading.value = false;
      router.push('/home');
    };

    const cancelEdit = () => {
      router.push('/home');
    };

    onMounted(() => {
      fetchBlogPost();
    });

    return {
      title,
      content,
      headerImageUrl, // Return the header image URL
      editedOn, // Return editedOn for binding
      updateContent,
      saveChanges,
      showTitleError,
      showContentError,
      showCategoryError,
      cancelEdit,
      isLoading,
      tiptapEditorRef,
      handleImageUpload, // Return the image upload function
      placeholderImageUrl, // Return the placeholder image URL
    };
  },
});
</script>

<style scoped>
.edit-post-page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #1e1e1e;
  margin-top: 70px;
  padding-left: 10px;
  padding-right: 10px;
  margin-left: 50px;
  margin-right: 50px;
  padding-top: 20px;
}

.content-container {
  background-color: #333;
  color: white;
  height: 100%;
  border-radius: 10px;
  width: 100%;
  text-align: center;
}

.title-display {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  font-size: 18px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  background-color: #eee;
  color: #666;
  cursor: not-allowed;
}

.image-input {
  margin-bottom: 10px;
}

.header-preview {
  width: 100%;
  height: 200px;
  object-fit: cover; /* Ensure the image covers the specified dimensions */
  margin-bottom: 10px; /* Space between image and editor */
}

.timestamp-display {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  font-size: 18px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  background-color: #eee;
  color: #666;
}

.error-message {
  color: red;
  margin-top: 5px;
}

.editor-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

button {
  width: 50%;
  padding: 10px 20px;
  background-color: #f53;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #e04a2e;
}

.loading-message {
  font-size: 24px;
  color: white;
  text-align: center;
  margin-top: 20px;
}

@media screen and (min-width: 768px) and (max-width: 1024px) {
  /* Add styles for iPad screen size here */
}

@media screen and (max-width: 767px) {
  .edit-post-page {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #1e1e1e;
    margin-top: 130px;
    padding-left: 10px;
    padding-right: 10px;
    margin-left: 2px;
    margin-right: 2px;
    padding-top: 20px;
  }
}
</style>
