<template>
  <div class="modal-container" v-if="isModalVisible">
    <div class="modal-content">
      <input v-model="title" placeholder="Enter the title" class="title-input" />
      <TiptapEditor ref="tiptapEditor" @updateContent="updateContent" />
      <div class="editor-actions">
        <button @click="publishContent">Publish</button>
        <button @click="$emit('closeModal')">Close</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import TiptapEditor from '../TiptapEditor.vue';
import { supabase } from '../supabase';
import { v4 as uuidv4 } from 'uuid';

export default defineComponent({
  name: 'CreateBlogPost',
  components: {
    TiptapEditor,
  },
  props: {
    isModalVisible: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['closeModal'],
  setup(_, { emit }) {
    const router = useRouter();
    const user = ref<any>(null);
    const title = ref<string>('');
    const content = ref<string>('');
    const timestamp = ref<string>('');

    onMounted(() => {
      fetchUserInfo();
    });

    const fetchUserInfo = async () => {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = currentUser.id;

      const { data, error } = await supabase
        .from('users')
        .select('full_name, chatter_name')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user data:', error.message);
      } else {
        user.value = data;
      }
    };

    const updateContent = (updatedContent: string, updatedTimestamp: string) => {
      content.value = updatedContent;
      timestamp.value = updatedTimestamp;
    };

    const publishContent = async () => {
      if (!title.value.trim() || !content.value.trim()) {
        console.error('Title and content are required');
        return;
      }

      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = currentUser.id;

      const htmlContent = `
        <html>
          <body>
            <h1>${title.value}</h1>
            <p>Created by: ${user.value.full_name}</p>
            <p>Date: ${timestamp.value}</p>
            ${content.value}
          </body>
        </html>
      `;

      const blogId = uuidv4();
      const fileName = `${blogId}.html`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('blog-post')
        .upload(`${userId}/${fileName}`, new Blob([htmlContent], { type: 'text/html' }));

      if (uploadError) {
        console.error('Error uploading file:', uploadError.message);
        return;
      }

      console.log('File uploaded:', uploadData);

      const { data: insertData, error: insertError } = await supabase
        .from('blog_post')
        .insert([
          {
            user_id: userId,
            blog_id: blogId,
            title: title.value,
            likes: 0,
            comments: [],
            bookmarks: 0,
            full_name: user.value.full_name,
            chatter_name: user.value.chatter_name,
          },
        ]);

      if (insertError) {
        console.error('Error inserting blog post:', insertError.message);
        return;
      }

      console.log('Blog post inserted:', insertData);
      emit('closeModal');
      router.push('/home');
    };

    return {
      title,
      updateContent,
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
  z-index: 9999;
}

.modal-content {
  position: relative;
  top: 0px;
  background-color: #333;
  color: white;
  padding: 20px;
  border-radius: 10px;
  width: 1200px;
  height: 550px;
  text-align: center;
  z-index: 9999;
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

.editor-actions {
  display: flex;
  justify-content: space-between;
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
</style>
