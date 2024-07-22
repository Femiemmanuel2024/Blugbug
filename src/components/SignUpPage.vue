<template>
  <div class="signupbody">
    <div class="columns-container">
      <div class="column left-column">
        <div class="login-options">
          <h2>Login Options</h2>
          <button class="btn btn-google" @click="signUpWithGmail">
            <img src="@/assets/google-logo.png" alt="Google Logo" class="auth-logo" /> Sign Up with Google
          </button>
          <button class="btn btn-facebook" @click="signUpWithFacebook">
            <img src="@/assets/facebook-logo.png" alt="Facebook Logo" class="auth-logo" /> Sign Up with Facebook
          </button>
        </div>
      </div>
      <div class="column right-column">
        <div class="signup-container">
          <h1>Create Account</h1>
          <form @submit.prevent="onSubmit">
            <div class="form-group">
              <input type="text" placeholder="Full Name" v-model="fullName" @input="generateChatterName" required />
            </div>
            <div class="form-group">
              <input type="text" placeholder="Blugger Name" v-model="chatterName" @input="validateChatterName" required />
              <p v-if="chatterNameWarning" class="warning">{{ chatterNameWarning }}</p>
            </div>
            <div class="form-group">
              <input type="email" placeholder="Email Address" v-model="email" required />
            </div>
            <div class="form-group password-group">
              <input :type="passwordFieldType" placeholder="Password" v-model="password" required />
              <i :class="passwordFieldIcon" @click="togglePasswordVisibility"></i>
            </div>
            <div class="form-group">
              <textarea placeholder="About Me" v-model="aboutMe" @input="limitAboutMeWords" maxlength="200"></textarea>
              <p class="word-counter">{{ aboutMeWordCount }} / 200 words</p>
            </div>
            <button type="submit" class="btn btn-signup">Create Account</button>
          </form>
          <p>Already have an account? <router-link to="/login">Login</router-link></p>
        </div>
      </div>
    </div>
    <SignUpConfirmation v-if="showConfirmation" :chatterName="chatterName" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from './supabase';
import SignUpConfirmation from './SignUpConfirmation.vue';

interface User {
  fullName: string;
  chatterName: string;
  email: string;
  password: string;
  aboutMe: string;
  followers: number;
  following: number;
  likes: number;
  bookmarks: number;
  posts: any[];
  bookmarksList: any[];
}

export default defineComponent({
  name: 'SignUpPage',
  components: {
    SignUpConfirmation
  },
  setup() {
    const router = useRouter();
    const fullName = ref('');
    const chatterName = ref('');
    const chatterNameWarning = ref('');
    const email = ref('');
    const password = ref('');
    const passwordFieldType = ref('password');
    const passwordFieldIcon = ref('fas fa-eye');
    const aboutMe = ref('');
    const showConfirmation = ref(false);
    const aboutMeWordCount = ref(0);

    const generateChatterName = () => {
      const randomSuffix = Math.floor(Math.random() * 1000);
      const nameParts = fullName.value.split(' ');
      const baseName = nameParts.join('').toLowerCase();
      chatterName.value = `${baseName}${randomSuffix}`;
    };

    const validateChatterName = () => {
      if (chatterName.value !== chatterName.value.toLowerCase()) {
        chatterNameWarning.value = 'Chatter Name must be all lowercase.';
      } else {
        chatterNameWarning.value = '';
      }
      chatterName.value = chatterName.value.toLowerCase();
    };

    const limitAboutMeWords = () => {
      const words = aboutMe.value.split(/\s+/);
      if (words.length > 200) {
        aboutMe.value = words.slice(0, 200).join(' ');
      }
      aboutMeWordCount.value = words.length;
    };

    const onSubmit = async () => {
      try {
        if (!chatterName.value) {
          generateChatterName();
        }

        const { data, error } = await supabase.from('users').insert([
          {
            full_name: fullName.value,
            chatter_name: chatterName.value,
            email: email.value,
            password: password.value,
            about_me: aboutMe.value,
            followers: 0,
            following: 0,
            likes: 0,
            bookmarks: 0,
            posts: [],
            bookmarksList: []
          }
        ]) as { data: User[] | null, error: any };

        if (data && data.length > 0) {
          localStorage.setItem('currentUser', JSON.stringify(data[0]));
        }
      } catch (err) {
        // Ignore the error completely
        console.error('Unexpected error:', err);
      } finally {
        showConfirmation.value = true;
      }
    };

    const signUpWithGmail = async () => {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) console.error('Error signing in with Google:', error.message);
    };

    const signUpWithFacebook = async () => {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'facebook' });
      if (error) console.error('Error signing in with Facebook:', error.message);
    };

    const togglePasswordVisibility = () => {
      if (passwordFieldType.value === 'password') {
        passwordFieldType.value = 'text';
        passwordFieldIcon.value = 'fas fa-eye-slash';
      } else {
        passwordFieldType.value = 'password';
        passwordFieldIcon.value = 'fas fa-eye';
      }
    };

    return {
      fullName,
      chatterName,
      chatterNameWarning,
      email,
      password,
      passwordFieldType,
      passwordFieldIcon,
      aboutMe,
      showConfirmation,
      aboutMeWordCount,
      onSubmit,
      signUpWithGmail,
      signUpWithFacebook,
      togglePasswordVisibility,
      generateChatterName,
      validateChatterName,
      limitAboutMeWords,
    };
  },
});
</script>

<style scoped>
.auth-logo{
  width: 10%;
  height: 10%;
}


.signupbody {
  background: linear-gradient(45deg, #202329, #4e545b);
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  position: relative;
}

.columns-container {
  display: flex;
  width: 70%;
  height: 80vh;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.9); /* Drop shadow */
  border-radius: 20px; /* Border radius */
  overflow: hidden; /* Ensure the border radius is applied correctly */
  border: solid 5px #0c1118;
}

.column {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #1e2127;
}

.left-column {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  padding: 20px;
}

.login-options h2 {
  color: #ffffff;
  margin-bottom: 20px;
}

.right-column {
  background-color: #2b3138; /* Background color for the right column */
  display: flex; /* Ensure flexbox properties apply */
  justify-content: center; /* Center the signup container horizontally */
  align-items: center; /* Center the signup container vertically */
}

.signup-container {
  width: 100%;
  max-width: 400px;
  padding: 20px;
  background-color: none;
  border-radius: 10px;
  text-align: center;
}

.signup-container h1 {
  font-size: 24px;
  color: #cebfad;
  margin-bottom: 40px;
}

.signup-container .btn {
  width: 50%;
  padding: 10px;
  font-size: 16px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  margin-top: 10px;
}

.signup-container .btn img.auth-logo {
  width: 20px;
  height: 20px;
  margin-right: 10px;
  vertical-align: middle;
}

.btn-google {
  background-color: #4285F4;
  color: white;
}

.btn-facebook {
  background-color: #3b5998;
  color: white;
}

.btn-signup {
  background-color: #FF5733;
  color: white;
}

.signup-container p {
  margin: 10px 0;
  color: #cebfad;
}

.form-group {
  width: 100%;
  margin-bottom: 10px;
  position: relative;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  font-weight: 500;
  border: none;
  border-radius: 20px;
  box-sizing: border-box;
  background-color: #2d333a;
  color: #cebfad;
  resize: none;
}

.password-group i {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #FF5733; /* Icon color */
}

a {
  color: #FF5733;
  text-decoration: none;
}

p {
  margin-top: 20px;
  color: #333;
}

.word-counter {
  font-size: 10px;
}

/* Media query for phone view */
@media (max-width: 768px) {
  .columns-container {
    flex-direction: column;
    height: auto;
    width: 90%;
    height: 90vh;
    
  }

  .left-column {
    display: none;
  }

  .right-column {
    flex-basis: 100%;
    justify-content: center;
    padding-right: 0;
  }

  .signup-container {
    margin: 20px;
    max-width: 100%;
  }
}
</style>
