<template>
  <div class="edit-post-page">
    <NavBar />
    <div v-if="isLoading" class="loading-message">Loading...</div>
    <div v-else class="content-container">
      <!-- View-only title display -->
      <div class="title-display">{{ title }}</div>

      <!-- Header image display -->
      <img v-if="headerImageUrl" :src="headerImageUrl" alt="Blog Header Image" class="header-image" />

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
    const editedOn = ref<string>('');
    const showTitleError = ref<boolean>(false);
    const showContentError = ref<boolean>(false);
    const showCategoryError = ref<boolean>(false);
    const isLoading = ref<boolean>(true);
    const tiptapEditorRef = ref(null);
    const headerImageUrl = ref<string | null>(null); // State for the header image URL

    const fetchBlogPost = async () => {
      isLoading.value = true;
      const blogId = route.params.blogId as string;
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = currentUser.id;

      // Define the path for the HTML file and the header image
      const htmlFilePath = `${userId}/${blogId}/${blogId}.html`;
      const headerImagePath = `${userId}/${blogId}/header-image.webp`; // Correct image path

      try {
        // Fetch blog post HTML content
        const { data: htmlData, error: htmlError } = await supabase.storage
          .from('blog-post')
          .download(htmlFilePath);

        if (htmlError) throw new Error(`Error fetching blog post HTML: ${htmlError.message}`);

        const fileText = await htmlData.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(fileText, 'text/html');

        // Extract the title from the HTML
        title.value = doc.querySelector('h1')?.textContent || 'Untitled';

        // Extract the body content from the article element
        const bodyDiv = doc.querySelector('article.blog-body');
        content.value = bodyDiv ? bodyDiv.innerHTML : '';

        // Fetch the public URL of the header image
        const { data: headerImageData, error: headerImageError } = await supabase.storage
          .from('blog-post')
          .getPublicUrl(headerImagePath);

        if (headerImageError) {
          console.error(`Error fetching header image URL: ${headerImageError.message}`);
        } else {
          headerImageUrl.value = headerImageData.publicUrl; // Set the header image URL
        }

        // Generate the "Edited on" timestamp
        editedOn.value = new Date().toLocaleString();

        nextTick(() => {
          if (tiptapEditorRef.value?.editor) {
            tiptapEditorRef.value.editor.commands.setContent(content.value);
            const timestamp = `<p>This post was edited on ${editedOn.value}</p>`;
            tiptapEditorRef.value.editor.commands.insertContent(timestamp);
          }
        });

      } catch (error) {
        console.error(error.message);
      } finally {
        isLoading.value = false;
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

      // Include the "Edited on" timestamp and save HTML content
      const htmlContent = `
        <html>
          <head>
            <meta name="editedOn" content="${editedOn.value}" />
          </head>
          <body>
            <h1>${title.value}</h1>
            <article class="blog-body">${content.value}</article>
            <p>This Blug was edited on ${editedOn.value}</p>
          </body>
        </html>
      `;
      const fileName = `${blogId}.html`;
      const { error: uploadError } = await supabase.storage
        .from('blog-post')
        .update(`${userId}/${blogId}/${fileName}`, new Blob([htmlContent], { type: 'text/html' }));

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
      editedOn,
      headerImageUrl, // Include header image URL in return
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
  background-color: #eee;
  color: #666;
  cursor: not-allowed;
}

.header-image {
  width: 900px; /* Set the width of the image */
  height: 300px; /* Set the height of the image */
  object-fit: cover; /* Ensures the image covers the specified dimensions */
  display: block; /* Ensures the image is displayed as a block element */
  margin: 0 auto; /* Centers the image horizontally */
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
