<template>
    <div class="blugworld-manager">
      <h3>Blugworld Manager</h3>
  
      <!-- Loading Modal -->
      <div v-if="isLoading" class="modal">
        <div class="modal-content">
          <i class="fas fa-spinner fa-spin"></i>
          <p>Loading...</p>
        </div>
      </div>
  
      <!-- Delete Confirmation Modal -->
      <div v-if="showDeleteModal" class="modal">
        <div class="modal-content">
          <p>Are you sure you want to delete this blog?</p>
          <button @click="confirmDelete(true)">
            <i class="fas fa-check"></i>
          </button>
          <button @click="confirmDelete(false)">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
  
      <table v-else>
        <thead>
          <tr>
            <th>S/N</th>
            <th>User ID</th>
            <th>Blog ID</th>
            <th>Blog Name</th>
            <th>Chattername</th>
            <th>Title</th>
            <th>Header Present</th>
            <th>Upload Header</th>
            <th>Delete</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(blog, index) in blogList" :key="blog.blogId">
            <td>{{ index + 1 }}</td>
            <td>{{ blog.userId }}</td>
            <td>{{ blog.blogId }}</td>
            <td>{{ blog.fullName }}</td>
            <td>{{ blog.chatterName }}</td>
            <td>{{ blog.title }}</td>
            <td>{{ blog.headerPresent ? 'Yes' : 'No' }}</td>
            <td>
              <input type="file" @change="uploadHeader(blog.userId, blog.blogId, $event)" accept=".webp" />
            </td>
            <td>
              <button @click="promptDelete(blog.blogId)" :disabled="isDeleting[blog.blogId]">
                <span v-if="isDeleting[blog.blogId]">Deleting...</span>
                <span v-else>Delete</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, onMounted, reactive } from 'vue';
  import { supabase } from '../supabase'; // Adjust path as needed
  
  export default defineComponent({
    name: 'BlugworldManager',
    setup() {
      const isLoading = ref(true);
      const showDeleteModal = ref(false);
      const blogList = ref<any[]>([]);
      const isDeleting = reactive<Record<string, boolean>>({});
      const deleteCandidate = ref<string | null>(null); // Track which blogId is to be deleted
  
      const fetchBlogData = async () => {
        try {
          isLoading.value = true;
  
          // Fetch folders from Supabase storage (simulated call for folder structure)
          const { data: userFolders, error: folderError } = await supabase.storage.from('blog-post').list('', { limit: 100 });
  
          if (folderError) {
            console.error('Error fetching folders:', folderError.message);
            return;
          }
  
          for (const userFolder of userFolders) {
            const { data: blogFolders, error: blogError } = await supabase.storage.from('blog-post').list(userFolder.name);
  
            if (blogError) {
              console.error('Error fetching blog folders for user:', userFolder.name, blogError.message);
              continue;
            }
  
            for (const blogFolder of blogFolders) {
              // Check for the presence of header-image.webp
              const { data: headerFiles } = await supabase.storage.from('blog-post').list(`${userFolder.name}/${blogFolder.name}`);
              const headerPresent = headerFiles.some(file => file.name === 'header-image.webp');
  
              // Fetch blog details from Supabase table
              const { data: blogData, error: blogPostError } = await supabase
                .from('blog_post')
                .select('full_name, chatter_name, title')
                .eq('blog_id', blogFolder.name)
                .single();
  
              if (blogPostError) {
                console.error('Error fetching blog data:', blogPostError.message);
                continue;
              }
  
              blogList.value.push({
                userId: userFolder.name,
                blogId: blogFolder.name,
                fullName: blogData?.full_name,
                chatterName: blogData?.chatter_name,
                title: blogData?.title,
                headerPresent
              });
            }
          }
        } catch (error) {
          console.error('Unexpected error:', error);
        } finally {
          isLoading.value = false;
        }
      };
  
      const promptDelete = (blogId: string) => {
        deleteCandidate.value = blogId;
        showDeleteModal.value = true;
      };
  
      const confirmDelete = async (confirm: boolean) => {
        if (confirm && deleteCandidate.value) {
          const blogId = deleteCandidate.value;
          try {
            isDeleting[blogId] = true;
  
            // Delete the folder in Supabase storage
            const { error: deleteFolderError } = await supabase.storage.from('blog-post').remove([`${blogId}`]);
  
            if (deleteFolderError) {
              console.error('Error deleting folder:', deleteFolderError.message);
              return;
            }
  
            // Delete the blog entry from the table
            const { error: deleteBlogError } = await supabase
              .from('blog_post')
              .delete()
              .eq('blog_id', blogId);
  
            if (deleteBlogError) {
              console.error('Error deleting blog from table:', deleteBlogError.message);
              return;
            }
  
            // Remove deleted blog from local state
            blogList.value = blogList.value.filter(blog => blog.blogId !== blogId);
          } catch (error) {
            console.error('Unexpected error during deletion:', error);
          } finally {
            isDeleting[blogId] = false;
            showDeleteModal.value = false;
            deleteCandidate.value = null;
          }
        } else {
          showDeleteModal.value = false;
          deleteCandidate.value = null;
        }
      };
  
      const uploadHeader = async (userId: string, blogId: string, event: Event) => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (file) {
          try {
            isLoading.value = true;
            const filePath = `${userId}/${blogId}/header-image.webp`;
            const { error: uploadError } = await supabase.storage.from('blog-post').upload(filePath, file);
  
            if (uploadError) {
              console.error('Error uploading header:', uploadError.message);
              return;
            }
  
            // Update the headerPresent status
            const blogIndex = blogList.value.findIndex(blog => blog.blogId === blogId);
            if (blogIndex !== -1) blogList.value[blogIndex].headerPresent = true;
  
          } catch (error) {
            console.error('Error uploading header:', error);
          } finally {
            isLoading.value = false;
          }
        }
      };
  
      onMounted(fetchBlogData);
  
      return {
        isLoading,
        showDeleteModal,
        blogList,
        isDeleting,
        promptDelete,
        confirmDelete,
        uploadHeader,
      };
    },
  });
  </script>
  
  <style scoped>
  .blugworld-manager {
    padding: 20px;
  }
  
  .modal {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    padding: 20px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.26);
    z-index: 1000;
    text-align: center;
  }
  
  .modal-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }
  
  th, td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
    color: #ddd;
  }
  
  th {
    background-color: #f4f4f4;
  }
  
  button {
    padding: 5px 10px;
    background-color: #fd662f;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  button:disabled {
    background-color: #ddd;
    cursor: not-allowed;
  }
  
  input[type="file"] {
    display: inline-block;
    margin-top: 5px;
  }
  
  .fa-check, .fa-times {
    font-size: 1.5rem;
    margin: 10px;
    cursor: pointer;
  }
  
  .fa-check:hover {
    color: green;
  }
  
  .fa-times:hover {
    color: red;
  }
  </style>
  