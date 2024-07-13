<template>
  <div class="modal-container" v-if="isModalVisible">
    <div class="modal-content">
      <input v-model="title" placeholder="Enter the title" class="title-input" />
      <QuillEditor ref="quillEditor" />
      <button @click="publishContent">Publish</button>
      <button @click="$emit('closeModal')">Close</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import QuillEditor from '../QuillEditor.vue';
import ActionNotification from '../infofeatures/ActionNotification.vue'; // Import ActionNotification
import { supabase } from '../supabase';

export default defineComponent({
  name: 'CreateBlogPost',
  components: {
    QuillEditor,
    ActionNotification, // Register the component
  },
  props: {
    isModalVisible: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['publishContent', 'closeModal'],
  setup(_, { emit }) {
    const router = useRouter();
    const title = ref<string>('');
    const content = ref<string>('');
    const createdBy = ref<string>('');
    const currentDate = ref<string>('');
    const quillEditor = ref<any>(null);
    const notificationRef = ref<any>(null); // Reference to the ActionNotification component

    onMounted(() => {
      fetchUserInfo();
      if (quillEditor.value) {
        quillEditor.value.quillInstance.on('text-change', () => {
          content.value = quillEditor.value.quillInstance.root.innerHTML;
        });
      }
      const now = new Date();
      currentDate.value = now.toLocaleString();
    });

    const fetchUserInfo = async () => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = currentUser.id;

      const { data, error } = await supabase
        .from('users')
        .select('full_name')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user data:', error.message);
      } else {
        createdBy.value = data.full_name;
      }
    };

    const publishContent = async () => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = currentUser.id;

      if (title.value.trim() && content.value.trim()) {
        const htmlContent = `
          <html>
            <body>
              <h1>${title.value}</h1>
              <p>Created by: ${createdBy.value}</p>
              <p>Date: ${currentDate.value}</p>
              ${content.value}
            </body>
          </html>
        `;

        const fileName = `${Date.now()}.html`;
        const { data, error } = await supabase.storage
          .from('blog-post')
          .upload(`${userId}/${fileName}`, new Blob([htmlContent], { type: 'text/html' }));

        if (error) {
          console.error('Error uploading file:', error.message);
        } else {
          console.log('File uploaded:', data);
          emit('publishContent', { title: title.value, content: htmlContent });

          // Clear the inputs
          title.value = '';
          quillEditor.value.quillInstance.root.innerHTML = '';

          // Send notification
          if (notificationRef.value) {
            console.log('Sending notification...');
            notificationRef.value.sendNotification();
          }

          // Route back to homepage after successful upload
          router.push('/home');
        }
      } else {
        alert('Title and content are required!');
      }
    };

    return {
      title,
      content,
      createdBy,
      currentDate,
      quillEditor,
      notificationRef, // Return the reference
      publishContent,
    };
  },
});
</script>

<style scoped>
.modal-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: #333;
  color: white;
  padding: 20px;
  border-radius: 10px;
  width: 80%;
  max-width: 600px;
  text-align: center;
}

.title-input {
  width: 100%;
  padding: 10px;
  margin-bottom: 10px;
  font-size: 18px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

.quill-editor {
  height: 300px;
  background-color: white;
  color: black;
}

button {
  margin-top: 10px;
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
</style>
