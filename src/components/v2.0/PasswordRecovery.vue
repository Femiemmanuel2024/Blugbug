<template>
  <div v-if="showModal" class="modal">
    <div class="modal-content">
      <!-- Updated Close Button with FontAwesome Icon -->
      <font-awesome-icon :icon="['fas', 'circle-xmark']" class="close-icon" @click="closeModal" />

      <!-- Step 1: Request username or fullname -->
      <div v-if="step === 1">
        <h3>Enter your Chattername or Fullname</h3>
        <input type="text" v-model="usernameOrFullname" placeholder="Chattername or Fullname" />
        <button @click="fetchUserSecretQuestion">Next</button>
        <p class="warning" v-if="errorMessage">{{ errorMessage }}</p>
      </div>

      <!-- Step 2: Answer secret question -->
      <div v-else-if="step === 2">
        <h3>{{ secretQuestion }}</h3>
        <input type="text" v-model="secretAnswer" placeholder="Your Answer" />
        <button @click="verifySecretAnswer">Submit</button>
        <p class="warning" v-if="errorMessage">{{ errorMessage }}</p>
      </div>

      <!-- Step 3: Reset password -->
      <div v-else-if="step === 3">
        <h3>Enter New Password</h3>
        <input type="password" v-model="newPassword" placeholder="New Password" />
        <input type="password" v-model="confirmPassword" placeholder="Re-enter New Password" />
        <button @click="resetPassword">Reset Password</button>
        <p class="warning" v-if="errorMessage">{{ errorMessage }}</p>
      </div>

      <!-- Step 4: Confirmation -->
      <div v-else-if="step === 4">
        <div class="confirmation">
          <span class="checkmark">&#10004;</span>
          <p>You can log in with your new password now!</p>
          <button @click="closeModal">Dismiss</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { supabase } from '../supabase'; // Adjust the path as needed
import bcrypt from 'bcryptjs';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

export default defineComponent({
  name: 'PasswordRecovery',
  components: {
    FontAwesomeIcon
  },
  props: {
    showModal: {
      type: Boolean,
      required: true
    }
  },
  setup(props, { emit }) {
    const step = ref(1);
    const usernameOrFullname = ref('');
    const secretQuestion = ref('');
    const secretAnswer = ref('');
    const newPassword = ref('');
    const confirmPassword = ref('');
    const userId = ref<string | null>(null);
    const errorMessage = ref('');

    // Close the modal
    const closeModal = () => {
      emit('close'); // Emit close event to the parent component
      resetFields();
    };

    // Reset fields
    const resetFields = () => {
      step.value = 1;
      usernameOrFullname.value = '';
      secretQuestion.value = '';
      secretAnswer.value = '';
      newPassword.value = '';
      confirmPassword.value = '';
      userId.value = null;
      errorMessage.value = '';
    };

    // Fetch user secret question
    const fetchUserSecretQuestion = async () => {
      // First, try to find by chatter_name
      let { data, error } = await supabase
        .from('users')
        .select('id, secret_question')
        .eq('chatter_name', usernameOrFullname.value)
        .single();

      // If no result for chatter_name, try to find by fullname
      if (error || !data) {
        ({ data, error } = await supabase
          .from('users')
          .select('id, secret_question')
          .eq('fullname', usernameOrFullname.value)
          .single());
      }

      if (error || !data) {
        errorMessage.value = 'User not found. Please try again.';
        return;
      }

      userId.value = data.id;
      secretQuestion.value = data.secret_question;
      step.value = 2;
      errorMessage.value = ''; // Clear any previous error message
    };

    // Verify the secret answer
    const verifySecretAnswer = async () => {
      const { data, error } = await supabase
        .from('users')
        .select('secret_answer')
        .eq('id', userId.value)
        .single();

      if (error || !data || data.secret_answer !== secretAnswer.value) {
        errorMessage.value = 'Incorrect answer. Please try again.';
        return;
      }

      step.value = 3;
      errorMessage.value = ''; // Clear any previous error message
    };

    // Reset the user's password
    const resetPassword = async () => {
      if (newPassword.value !== confirmPassword.value) {
        errorMessage.value = 'Passwords do not match. Please try again.';
        return;
      }

      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(newPassword.value, salt);

      const { error } = await supabase
        .from('users')
        .update({ password: hashedPassword })
        .eq('id', userId.value);

      if (error) {
        errorMessage.value = 'An error occurred while resetting your password. Please try again.';
        return;
      }

      step.value = 4;
    };

    return {
      step,
      usernameOrFullname,
      secretQuestion,
      secretAnswer,
      newPassword,
      confirmPassword,
      closeModal,
      fetchUserSecretQuestion,
      verifySecretAnswer,
      resetPassword,
      errorMessage
    };
  }
});
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-content {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  width: 400px;
  position: relative;
}

/* Updated Close Icon Style */
.close-icon {
  position: absolute;
  top: 10px;
  right: 15px;
  font-size: 25px;
  color: red;
  cursor: pointer;
}

input[type="text"], input[type="password"] {
  width: calc(100% - 20px);
  padding: 10px;
  margin-bottom: 15px;
  border: 1px solid #ddd;
  border-radius: 5px;
}

button {
  padding: 10px 20px;
  background-color: #fd662f;
  color: #fff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

button:hover {
  background-color: #e04a2e;
}

.confirmation {
  text-align: center;
}

.checkmark {
  color: green;
  font-size: 36px;
  display: block;
  margin-bottom: 10px;
}

.warning {
  color: red;
  font-size: 14px;
  margin-top: 10px;
}
</style>
