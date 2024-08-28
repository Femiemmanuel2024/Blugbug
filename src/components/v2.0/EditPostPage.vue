<template>
  <div class="edit-post-page">
    <NavBar />
    <div v-if="isLoading" class="loading-message">Loading...</div> <!-- Displaying loading message -->
    <div v-else class="content-container"> <!-- Display content container only when not loading -->
      <!-- View-only title display -->
      <div class="title-display">{{ title }}</div>

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
    const showTitleError = ref<boolean>(false);
    const showContentError = ref<boolean>(false);
    const showCategoryError = ref<boolean>(false);
    const isLoading = ref<boolean>(true);
    const tiptapEditorRef = ref(null);

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
      const bodyDiv = doc.querySelector('div.blog-body');
      content.value = bodyDiv ? bodyDiv.innerHTML : '';

      // Generate a new "Edited on" timestamp
      const now = new Date();
      editedOn.value = now.toLocaleString();

      // Use nextTick to ensure DOM is updated before accessing $refs
      nextTick(() => {
        if (tiptapEditorRef.value && tiptapEditorRef.value.editor) {
          tiptapEditorRef.value.editor.commands.setContent(content.value);
          // Append timestamp to the editor content for visual reference
          const timestamp = `<p>This post was edited on ${editedOn.value}</p>`;
          tiptapEditorRef.value.editor.commands.insertContent(timestamp);
        }
      });

      isLoading.value = false;
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

      // Include the "Edited on" timestamp in the HTML content
      const htmlContent = `
        <html>
          <head>
            <meta name="editedOn" content="${editedOn.value}" /> <!-- Store edited timestamp -->
          </head>
          <body>
            <h1>${title.value}</h1>
            <div class="blog-body">${content.value}</div> <!-- Save content in the specific div -->
            <p>This Blug was edited on ${editedOn.value}</p> <!-- Include the edited on timestamp in the content -->
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
      editedOn, // Return editedOn for binding
      updateContent,
      saveChanges,
      showTitleError,
      showContentError,
      showCategoryError,
      cancelEdit,
      isLoading,
      tiptapEditorRef,
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
  background-color: #eee; /* Gray background to indicate read-only */
  color: #666; /* Gray text color */
  cursor: not-allowed; /* Show not-allowed cursor */
}

.timestamp-display {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  font-size: 18px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
  background-color: #eee; /* Gray background to indicate read-only */
  color: #666; /* Gray text color */
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
  width: 50%; /* Make buttons occupy half width each */
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
  margin-top: 20px; /* Adjust margin as needed */
}

/* CSS for iPad screen size */
@media screen and (min-width: 768px) and (max-width: 1024px) {
  /* Add styles for iPad screen size here */
}

/* CSS for phone screen size */
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
  /* Add styles for phone screen size here */
}
</style>
