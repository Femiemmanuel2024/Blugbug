<template>
  <div class="signupbody">
    <div class="columns-container">
      <div class="column left-column">
        <img src="/Signup.svg" alt="Sign Up" class="signup-image" />
        <p class="signup-message">Join us today and start your journey with Blugbug!</p>
      </div>
      <div class="column right-column">
        <div class="signup-container">
          <h1>Create Account</h1>
          <form @submit.prevent="onSubmit" autocomplete="off">
            <div class="form-group">
              <input
                type="text"
                placeholder="Full Name"
                v-model="fullName"
                @input="generateChatterName"
                required
                autocomplete="off"
              />
            </div>
            <div class="form-group">
              <input
                type="text"
                placeholder="Blugger Name"
                v-model="chatterName"
                @input="validateChatterName"
                required
                autocomplete="off"
              />
              <p v-if="chatterNameWarning" class="warning">{{ chatterNameWarning }}</p>
            </div>
            <div class="form-group">
              <input
                type="email"
                placeholder="Email Address"
                v-model="email"
                required
                autocomplete="off"
              />
            </div>
            <div class="form-group password-group">
              <input
                :type="passwordFieldType"
                placeholder="Password"
                v-model="password"
                required
                autocomplete="off"
              />
              <i :class="passwordFieldIcon" @click="togglePasswordVisibility"></i>
            </div>
            <div class="form-group">
              <textarea
                placeholder="About Me"
                v-model="aboutMe"
                @input="limitAboutMeCharacters"
                maxlength="200"
                autocomplete="off"
              ></textarea>
              <p class="char-counter">{{ aboutMeCharCount }} / 200 characters</p>
            </div>
            <div class="form-group terms-group">
              <input
                type="checkbox"
                v-model="agreedToTerms"
                id="terms"
                required
              />
              <label for="terms">
                I agree to the
                <span @click="openModal" class="terms-link">terms and conditions</span>
              </label>
            </div>
            <button type="submit" class="btn btn-signup">Create Account</button>
          </form>
          <p>Already have an account? <router-link to="/login">Login</router-link></p>
        </div>
      </div>
    </div>
    <SignUpConfirmation v-if="showConfirmation" :chatterName="chatterName" />
    <TermsModal v-if="showModal" :isVisible="showModal" @close="closeModal" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { supabase } from './supabase';
import bcrypt from 'bcryptjs';
import SignUpConfirmation from './SignUpConfirmation.vue';
import TermsModal from './features/TermsAndConditions.vue';

export default defineComponent({
  name: 'SignUpPage',
  components: {
    SignUpConfirmation,
    TermsModal
  },
  setup() {
    const fullName = ref('');
    const chatterName = ref('');
    const chatterNameWarning = ref('');
    const email = ref('');
    const password = ref('');
    const passwordFieldType = ref('password');
    const passwordFieldIcon = ref('fas fa-eye');
    const aboutMe = ref('');
    const showConfirmation = ref(false);
    const aboutMeCharCount = ref(0);
    const agreedToTerms = ref(false);
    const showModal = ref(false);

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

    const limitAboutMeCharacters = () => {
      if (aboutMe.value.length > 200) {
        aboutMe.value = aboutMe.value.substring(0, 200);
      }
      aboutMeCharCount.value = aboutMe.value.length;
    };

    const onSubmit = async () => {
      if (!agreedToTerms.value) {
        alert('You must agree to the terms and conditions before signing up.');
        return;
      }

      try {
        if (!chatterName.value) {
          generateChatterName();
        }

        // Hash the password before storing it in the database
        const hashedPassword = await bcrypt.hash(password.value, 10);

        const { data } = await supabase.from('users').insert([
          {
            full_name: fullName.value,
            chatter_name: chatterName.value,
            email: email.value,
            password: hashedPassword,
            about_me: aboutMe.value,
            followers: 0,
            following: 0,
            likes: 0,
            bookmarks: 0,
            posts: [],
            bookmarksList: []
          }
        ]);

        if (data && data.length > 0) {
          localStorage.setItem('currentUser', JSON.stringify(data[0]));
        }
      } catch (err) {
        // Handle the error if necessary
      } finally {
        showConfirmation.value = true;
      }
    };

    const togglePasswordVisibility = () => {
      passwordFieldType.value = passwordFieldType.value === 'password' ? 'text' : 'password';
      passwordFieldIcon.value = passwordFieldType.value === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    };

    const openModal = () => {
      showModal.value = true;
    };

    const closeModal = () => {
      showModal.value = false;
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
      aboutMeCharCount,
      agreedToTerms,
      showModal,
      onSubmit,
      togglePasswordVisibility,
      generateChatterName,
      validateChatterName,
      limitAboutMeCharacters,
      openModal,
      closeModal,
    };
  },
});
</script>

<style scoped>
/* Your existing styles remain unchanged */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.signupbody {
  background: linear-gradient(45deg, #202329, #4e545b);
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100vh;
  position: relative;
}

.columns-container {
  display: flex;
  width: 70%;
  height: 80vh;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.9);
  border-radius: 20px;
  overflow: hidden;
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
}

.signup-image {
  width: 100%;
  max-width: 600px;
  height: auto;
  margin: 20px;
}

.signup-message {
  color: #cebfad;
  margin-top: 20px;
  font-size: 16px;
  text-align: center;
}

.right-column {
  background-color: #2b3138;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  height: 100%;
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
  padding: 10px;
  font-size: 16px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  margin-top: 10px;
}

.btn-signup {
  background-color: #FF5733;
  color: white;
  width: 100%;
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
  color: #FF5733;
}

.terms-group {
  display: flex;
  align-items: center;
  gap: 0px;
  margin-top: 5px;
  margin-left: -50px;
}

.terms-link {
  color: #ff5733;
  cursor: pointer;
  text-decoration: underline;
}

a {
  color: #FF5733;
  text-decoration: none;
}

p {
  margin-top: 20px;
  color: #333;
}

.char-counter {
  font-size: 10px;
}

.form-group input[type="checkbox"] {
  margin-left: 100px;
}

.form-group label {
  color: #cebfad;
  font-size: 14px;
  line-height: 1;
  white-space: nowrap;
}

@media (min-width: 479px) and (max-width: 768px) {

  .columns-container {
    flex-direction: column;
    height: auto;
    width: 90%;
    height: 800px;
    margin-top: 20px;
  }

  .signup-image {
    width: 60%;
    max-width: 600px;
    height: auto;
    margin: 20px;
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

  .btn-signup {
    background-color: #FF5733;
    color: white;
    width: 100%;
  }

  .signup-message {
    margin-bottom: 10px;
  }
}

@media (max-width: 478px) {
  .terms-group {
  display: flex;
  align-items: center;
  gap: 0px;
  margin-top: 5px;
  margin-left: -65px;
}

  .signupbody {
    height: 900px;
  }

  .columns-container {
    flex-direction: column;
    width: 90%;
    height: 850px;
  }

  .signup-image {
    width: 60%;
    max-width: 600px;
    height: auto;
    margin: 20px;
  }

  .right-column {
    flex-basis: 100%;
    justify-content: center;
    padding-right: 0;
  }

  .signup-container {
    width: 100%;
    max-width: 400px;
    padding: 20px;
    background-color: none;
    border-radius: 10px;
    text-align: center;
  }

  .btn-signup {
    background-color: #FF5733;
    color: white;
    width: 100%;
  }

  .signup-message {
    margin-bottom: 10px;
  }
}
</style>
