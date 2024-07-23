<template>
  <div class="modal-container" v-if="isModalVisible">
    <div class="modal-content">
      <input v-model="title" placeholder="Enter the title" class="title-input" />
      <TiptapEditor ref="tiptapEditor" @updateContent="updateContent" />
      <div class="editor-actions">
        <div class="category-selection">
          <select v-model="selectedCategory">
            <option value="" disabled>Select a category</option>
            <option v-for="category in categories" :key="category">{{ category }}</option>
          </select>
        </div>
        <button @click="publishContent">Publish</button>
        <button @click="$emit('closeModal')">Close</button>
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
    const selectedCategory = ref<string>('');
    const showTitleError = ref<boolean>(false);
    const showContentError = ref<boolean>(false);
    const showCategoryError = ref<boolean>(false);
    const timestamp = ref<string>('');

    const categories = ref<string[]>([
      "Health and Wellness",
      "Fitness and Exercise",
      "Nutrition and Diet",
      "Mental Health and Well-being",
      "Yoga and Meditation",
      "Beauty and Skincare",
      "Fashion and Style",
      "Travel and Adventure",
      "Solo Travel Tips",
      "Budget Travel",
      "Luxury Travel Destinations",
      "Digital Nomad Lifestyle",
      "Home Decor and Interior Design",
      "DIY Home Projects",
      "Gardening and Landscaping",
      "Parenting Tips and Advice",
      "Pregnancy and Newborn Care",
      "Toddler Activities",
      "Education and Learning",
      "Homeschooling Tips",
      "Student Life and Study Hacks",
      "Career Development",
      "Resume Writing Tips",
      "Job Interview Preparation",
      "Personal Finance",
      "Investing and Wealth Management",
      "Budgeting and Saving Tips",
      "Side Hustles and Freelancing",
      "Entrepreneurship and Startups",
      "Marketing and Branding Strategies",
      "Social Media Tips and Trends",
      "Tech Gadgets and Reviews",
      "Software and App Development",
      "Coding and Programming",
      "Web Design and Development",
      "Photography Tips and Techniques",
      "Art and Creativity",
      "Music and Concert Reviews",
      "Film and TV Show Reviews",
      "Book Recommendations and Reviews",
      "Literary Analysis and Criticism",
      "History and Historical Events",
      "Philosophy and Ethics",
      "Religion and Spirituality",
      "Cultural Traditions and Festivals",
      "Environmental Issues and Conservation",
      "Climate Change Solutions",
      "Wildlife and Nature Conservation",
      "Adventure Sports and Extreme Activities",
      "Sports News and Updates"
    ]);

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

    const updateContent = (updatedContent: string) => {
      content.value = updatedContent;
      timestamp.value = new Date().toISOString();
    };

    const publishContent = async () => {
      showTitleError.value = !title.value.trim();
      showContentError.value = !content.value.trim();
      showCategoryError.value = !selectedCategory.value;

      if (showTitleError.value || showContentError.value || showCategoryError.value) {
        return;
      }

      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userId = currentUser.id;

      const htmlContent = `
        <html>
          <body>
            <h1>${title.value}</h1>
            <p>Created by: ${user.value.full_name}</p>
            <p>Date: ${new Date(timestamp.value).toLocaleString()}</p>
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
            categories: selectedCategory.value,
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
      categories,
      selectedCategory,
      showTitleError,
      showContentError,
      showCategoryError,
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
  z-index: 10050;
}

.modal-content {
  position: relative;
  top: 0px;
  background-color: #333;
  color: white;
  padding: 20px;
  border-radius: 10px;
  width: 1200px;
  height: 450px;
  text-align: center;
  z-index: 10050;
  margin-bottom: 140px;
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

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.category-selection select {
  padding: 10px;
  font-size: 16px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.category-selection select:focus {
  outline: none;
  box-shadow: 0 0 5px #fd662f;
  border-color: #fd662f;
}

.category-selection option {
  padding: 10px;
  font-size: 16px;
  background-color: #333;
  color: white;
}

.error-message {
  color: red;
  margin-top: 5px;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
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

@media (max-width: 430px) {
  .modal-content {
    position: relative;
    top: 100px;
    background-color: #333;
    color: white;
    padding: 20px;
    border-radius: 10px;
    width: 90%;
    height: 550px;
    text-align: center;
    z-index: 10050;
  }

  .category-selection select {
    font-size: 16px;
    border-radius: 4px;
    border: 1px solid #ccc;
    width: 99%;
  }

  .category-selection option {
  font-size: 10px;
  background-color: #333;
  color: white;
}
}
</style>
