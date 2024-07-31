<template>
  <div class="loginbody">
    <div class="columns-container">
      <div class="column left-column">
        <div class="image-container">
          <img src="/Signinsvg.svg" alt="Sign In" class="signin-image" />
        </div>
        <h1>Welcome to Blugbug</h1>
        <p>
          We're excited to have you join our vibrant community. Connect with
          friends, share your thoughts, and explore new ideas. Happy chatting!
        </p>
        
      </div>
      <div class="column right-column">
        <div class="login-container">
          <h1>Login</h1>
          <form @submit.prevent="onSubmit">
            <div class="form-group">
              <input
                type="text"
                placeholder="Email Address or Blugger Name"
                v-model="username"
                required
              />
            </div>
            <div class="form-group password-group">
              <input
                :type="passwordFieldType"
                placeholder="Password"
                v-model="password"
                required
              />
              <i :class="passwordFieldIcon" @click="togglePasswordVisibility"></i>
            </div>
            <button
              type="submit"
              :class="['btn', isInvalidLogin ? 'btn-invalid' : 'btn-login']"
            >
              {{ isInvalidLogin ? 'Wrong Details' : 'Login' }}
            </button>
          </form>
          <p>
            Don't have an account?
            <router-link to="/signup">Sign Up</router-link>
          </p>
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
      } catch (err: any) {
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
/* CSS Reset */
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

.loginbody {
  background: linear-gradient(45deg, #202329, #4e545b);
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
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
  font-size: 50px;
  font-weight: bolder;
  text-align: center;
  width: 100%;
  line-height: 0.9;
  
}

.left-column p {
  margin-top: 30px;
  padding-left: 50px;
  padding-right: 50px;
  font-size: 14px;
  text-align: center;
}

.image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
}

.image-container .signin-image {
  width: 100%;
  max-width: 400px;
  border-radius: 10px;
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
  margin-top: 60px;
  margin-bottom: 20px;
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
  margin-top: 120px; /* Spacing */
  color: #d7c9b7; /* Text color */
}

/* Media query for phone view */
@media (max-width: 430px) {
  .columns-container {
    flex-direction: column;
    width: 90%;
    height: 100vh;
    margin-top: 10px;
    margin-bottom: 10px;
    align-self: center;
  }

  .left-column h1 {
    color: #ed6834; /* Text color for "Chatter" */
    font-size: 25px;
    font-weight: bolder;
    text-align: center;
    width: 100%;
  }

  .login-container {
    margin: 20px;
    max-width: 100%; /* Adjust the max-width for mobile view */
  }

  .loginbody {
    background: linear-gradient(45deg, #202329, #4e545b);
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative; /* Allow absolute positioning for the login container */
  }

  .left-column p {
    margin-top: 10px;
    margin-bottom: 20px;
    padding-left: 20px;
    padding-right: 20px;
    font-size: 12px;
    justify-content: center;
  }

  .login-container {
    height: 100%;
    width: 100%;
    max-width: 500px;
    padding: 20px;
    background-color: none; /* Container background color */
    border-radius: 10px;
    text-align: center;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* Add shadow to the login container */
  }

  .login-container h1 {
    font-size: 24px;
    color: #cebfad; /* Text color */
    margin-top: 10px;
    margin-bottom: 20px;
  }

  .right-column {
    background-color: #2b3138; /* Background color for the right column */
    display: flex; /* Ensure flexbox properties apply */
    justify-content: center; /* Center the login container horizontally */
    align-items: center;
    padding-bottom: 200px;
  }
}
</style>
