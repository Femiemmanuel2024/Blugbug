<template>
  <div class="confirmation-overlay">
    <div class="confirmation-modal">
      <h2>Sign Up Successful</h2>
      <p>Welcome, {{ chatterName }}!</p>
      <button @click="goToLoginPage">Go to Login Page</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';

export default defineComponent({
  name: 'SignUpConfirmation',
  props: {
    chatterName: {
      type: String,
      required: true
    }
  },
  setup() {
    const router = useRouter();

    const goToLoginPage = () => {
      router.push('/login');
    };

    return {
      goToLoginPage
    };
  }
});
</script>

<style scoped>
.confirmation-overlay {
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

.confirmation-modal {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.confirmation-modal h2 {
  margin-bottom: 10px;
}

.confirmation-modal p {
  margin-bottom: 20px;
}

.confirmation-modal button {
  padding: 10px 20px;
  background-color: #FF5733;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
