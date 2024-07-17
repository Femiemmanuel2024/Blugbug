<template>
  <div class="file-upload-overlay">
    <div class="file-upload-modal">
      <h2>Upload {{ type === 'profile' ? 'Profile' : 'Header' }} Image</h2>
      <input type="file" @change="onFileChange" />
      <button @click="uploadFile" :disabled="isLoading">Upload</button>
      <button @click="closeModal" :disabled="isLoading">Cancel</button>
      <div v-if="isLoading" class="loading-spinner"></div>
      <div v-if="uploadUrl">File uploaded successfully: <a :href="uploadUrl" target="_blank">{{ uploadUrl }}</a></div>
      <div v-if="errorMessage">{{ errorMessage }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { supabase } from '../supabase'; // Ensure this path is correct based on your project structure
import type { PropType } from 'vue'; // Correctly import PropType

export default defineComponent({
  name: 'FileUpload',
  props: {
    type: {
      type: String as PropType<'profile' | 'header'| 'checkmark'>,
      required: true,
    },
  },
  emits: ['uploadComplete', 'close'],
  setup(props, { emit }) {
    const file = ref<File | null>(null);
    const uploadUrl = ref<string | null>(null);
    const errorMessage = ref<string | null>(null);
    const isLoading = ref<boolean>(false);

    const onFileChange = (event: Event) => {
      const target = event.target as HTMLInputElement;
      if (target.files && target.files.length > 0) {
        file.value = target.files[0];
      }
    };

    const uploadFile = async () => {
      if (!file.value) {
        errorMessage.value = 'Please select a file first.';
        return;
      }

      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = currentUser.id;
      if (!userId) {
        errorMessage.value = 'User ID not found in local storage';
        return;
      }

      isLoading.value = true;
      const bucket = props.type === 'profile' ? 'profile-images' : 'profile-header';
      const filePath = `${userId}/${Date.now()}_${file.value.name}`;
      console.log('Uploading file to path:', filePath);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file.value);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        errorMessage.value = `Error uploading file: ${uploadError.message}`;
        isLoading.value = false;
        return;
      }

      const { data: publicData, error: publicError } = supabase
        .storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (publicError) {
        console.error('Error getting public URL:', publicError);
        errorMessage.value = `Error getting public URL: ${publicError.message}`;
        isLoading.value = false;
        return;
      }

      uploadUrl.value = publicData.publicUrl;
      errorMessage.value = null;

      const columnToUpdate = props.type === 'profile' ? 'profile_image_url' : 'header_image_url';
      const { error: updateError } = await supabase
        .from('users')
        .update({ [columnToUpdate]: uploadUrl.value })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user image URL:', updateError);
        errorMessage.value = `Error updating user image URL: ${updateError.message}`;
        isLoading.value = false;
        return;
      }

      console.log(`${columnToUpdate} updated successfully`);
      emit('uploadComplete');
      isLoading.value = false;
      closeModal();
    };

    const closeModal = () => {
      emit('close');
    };

    return {
      onFileChange,
      uploadFile,
      uploadUrl,
      errorMessage,
      isLoading,
      closeModal,
    };
  },
});
</script>

<style scoped>
.file-upload-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  backdrop-filter: blur(5px);
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.file-upload-modal {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.file-upload-modal h2 {
  margin-bottom: 10px;
}

.file-upload-modal input[type="file"] {
  margin-bottom: 10px;
}

.file-upload-modal button {
  padding: 10px 20px;
  margin: 5px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.file-upload-modal button[disabled] {
  background-color: #a0c4ff;
  cursor: not-allowed;
}

.file-upload-modal button:hover {
  background-color: #0056b3;
}

.file-upload-modal button[disabled]:hover {
  background-color: #a0c4ff;
}

.file-upload-modal div {
  margin-top: 10px;
  font-size: 14px;
}

.loading-spinner {
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #007bff;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
