<template>
  <div class="confirmation-overlay">
    <div class="confirmation-modal">
      <h2>Sign Up Successful</h2>
      <p>Welcome, {{ chatterName }}!</p>
      <button @click="goToOnboardingPage">Proceed to Onboarding</button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useRouter } from 'vue-router';
import { supabase } from '@/components/supabase'; // Update the import path based on your project structure

export default defineComponent({
  name: 'SignUpConfirmation',
  props: {
    chatterName: {
      type: String,
      required: true
    }
  },
  setup(props) {
    const router = useRouter();

    // Function to fetch user_id and navigate to the onboarding page
    const goToOnboardingPage = async () => {
      try {
        // Fetch user_id and email using chatterName
        const { data, error } = await supabase
          .from('users')
          .select('id, email')
          .eq('chatter_name', props.chatterName)
          .single();

        if (error) {
          console.error('Error fetching user data:', error.message);
          return;
        }

        if (data && data.id) {
          // Save the fetched user data in local storage under the same key as LoginPage.vue
          localStorage.setItem('currentUser', JSON.stringify({ id: data.id, email: data.email }));
          
          // Navigate to the OnBoarding page
          router.push('/onboarding');
        } else {
          console.error('User not found');
        }
      } catch (err) {
        console.error('Error during onboarding navigation:', err);
      }
    };

    return {
      goToOnboardingPage
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
