<template>
  <div class="loginbody">
    <div class="columns-container">
      <div class="column left-column">
        <h1>Welcome to Chatter</h1>
        <p>We're excited to have you join our vibrant community. Connect with friends, share your thoughts, and explore new ideas. Happy chatting!
          <div class="chatterdesign">CHATTER</div>
        </p>
      </div>
      <div class="column right-column">
        <div class="login-container">
          <h1>Login</h1>
          <form @submit.prevent="onSubmit">
            <div class="form-group">
              <input type="text" placeholder="Email Address or Chatter Name" v-model="username" required />
            </div>
            <div class="form-group password-group">
              <input :type="passwordFieldType" placeholder="Password" v-model="password" required />
              <i :class="passwordFieldIcon" @click="togglePasswordVisibility"></i>
            </div>
            <button
              type="submit"
              :class="['btn', isInvalidLogin ? 'btn-invalid' : 'btn-login']"
            >
              {{ isInvalidLogin ? 'Wrong Details' : 'Login' }}
            </button>
          </form>
          <p>Don't have an account? <router-link to="/signup">Sign Up</router-link></p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from './supabase'; // Import Supabase

export default defineComponent({
  name: 'LoginPage',
  setup() {
    const router = useRouter();
    const username = ref('');
    const password = ref('');
    const passwordFieldType = ref('password');
    const passwordFieldIcon = ref('fas fa-eye');
    const isInvalidLogin = ref(false);

    const onSubmit = async () => {
      try {
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .or(`email.eq.${username.value},chatter_name.eq.${username.value}`)
          .single();

        if (error || !user || user.password !== password.value) {
          isInvalidLogin.value = true;
          setTimeout(() => {
            isInvalidLogin.value = false;
          }, 2000);
          return;
        }

        localStorage.setItem('currentUser', JSON.stringify({ id: user.id, email: user.email }));
        router.push({ path: '/home' });
      } catch (err: any) {  // Specify 'any' type here
        console.error('Unexpected error:', err);
        alert(`Unexpected error: ${err.message}`);
      }
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
      username,
      password,
      passwordFieldType,
      passwordFieldIcon,
      onSubmit,
      togglePasswordVisibility,
      isInvalidLogin,
    };
  },
});
</script>

<style scoped>
.loginbody {
  background: linear-gradient(45deg, #202329, #4e545b);
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  position: relative; /* Allow absolute positioning for the login container */
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
  flex-direction: column;
  justify-content: center;
  align-items: left;
  background-color: #1e2127;
}

.left-column h1 {
  color: #ed6834; /* Text color for "Chatter" */
  font-size: 60px;
  font-weight: bolder;
  text-align: left;
  padding-left: 30px;
  padding-right: 30px;
  width: 90%;
  line-height: 0.9;
  margin-top: -40px;
}

.left-column p {
  margin-top: -10px;
  padding-left: 30px;
  padding-right: 80px;
  font-size: 12px;
}

.right-column {
  background-color: #2b3138; /* Background color for the right column */
  display: flex; /* Ensure flexbox properties apply */
  justify-content: center; /* Center the login container horizontally */
  align-items: center; /* Center the login container vertically */
}

.login-container {
  height: 80%;
  width: 100%;
  max-width: 400px;
  padding: 20px;
  background-color: none; /* Container background color */
  border-radius: 10px;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* Add shadow to the login container */
}

.login-container h1 {
  font-size: 24px;
  color: #cebfad; /* Text color */
  margin-top: 80px;
}

.login-container .btn {
  width: 50%;
  padding: 10px;
  font-size: 16px;
  border: none;
  border-radius: 20px;
  cursor: pointer;
  margin-top: 10px;
  background-color: #fd662f; /* Button color */
  color: white; /* White text */
}

.btn-login {
  background-color: #fd662f; /* Button color */
  color: white; /* White text */
}

.btn-invalid {
  background-color: red; /* Invalid login button color */
  color: white; /* White text */
}

.form-group {
  margin-bottom: 10px;
  position: relative;
}

.form-group input {
  width: 100%;
  padding: 10px;
  font-size: 12px;
  border: none;
  border-radius: 20px;
  box-sizing: border-box;
  background-color: #2b3138; /* Background color */
  color: #d7c9b7; /* Text color */
}

.password-group i {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  cursor: pointer;
  color: #d7c9b7; /* Icon color */
}

a {
  color: #ed6834; /* Link color */
  text-decoration: none;
}

p {
  margin-top: 150px; /* Spacing */
  color: #d7c9b7; /* Text color */
}

/* Media query for phone view */
@media (max-width: 768px) {
  .columns-container {
    flex-direction: column;
    height: auto; /* Adjust height for mobile view */
  }

  .left-column p {
    margin-top: -10px;
    padding-left: 30px;
    padding-right: 80px;
    font-size: 8px;
  }

  .left-column h1 {
    color: #ed6834; /* Text color for "Chatter" */
    font-size: 30px;
    font-weight: bolder;
    text-align: left;
    padding-left: 30px;
    padding-right: 30px;
    width: 90%;
    line-height: 0.9;
    margin-top: 20px;
  }

  .login-container {
    margin: 20px;
    max-width: 100%; /* Adjust the max-width for mobile view */
  }
}
</style>
