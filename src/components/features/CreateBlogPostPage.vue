<template>
  <div class="create-blog-post-page">
  <NavBar/>
    <div class="content-container">
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
        <button @click="cancelCreation">Cancel</button>
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
import NavBar from '../NavBar.vue';
import { v4 as uuidv4 } from 'uuid';

export default defineComponent({
  name: 'CreateBlogPostPage',
  components: {
    NavBar,
    TiptapEditor,
  },
  setup() {
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
            <p class="date-meta">Date: ${new Date(timestamp.value).toLocaleString()}</p>
            <div class="blog-body">${content.value}</div> <!-- Wrap content in a specific div -->
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
      router.push('/home');
    };

    const cancelCreation = () => {
      router.push('/home'); // Navigate back to home or previous page
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
      cancelCreation,
    };
  },
});
</script>

<style scoped>
.create-blog-post-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: #1e1e1e;
  margin-top: 70px;
}

.content-container {
  background-color: #333;
  color: white;
  padding: 20px;
  border-radius: 10px;
  width: 100%;
  text-align: center;
  height: fit-content;
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

.date-meta {
  color: #e04a2e;
}

/* CSS for iPad screen size */
@media screen and (min-width: 768px) and (max-width: 1024px) {
  /* Add styles for iPad screen size here */
}

/* CSS for phone screen size */
@media screen and (max-width: 767px) {
  .create-blog-post-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  background-color: #1e1e1e;
  margin-top: 160px;
}

.content-container {
  background-color: #333;
  color: white;
  padding: 20px;
  border-radius: 10px;
  width: 100%;
  text-align: center;
  height: fit-content;
}
.category-selection select {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

.category-selection option {
  padding: 10px;
  font-size: 12px;
  background-color: #333;
  color: white;
  width: 100%;
  height: fit-content;
}
  /* Add styles for phone screen size here */
}

</style>
