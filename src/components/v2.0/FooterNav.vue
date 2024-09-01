<template>
    <footer class="footer-nav">
      <div class="footer-left">
        <span>BlugBug2024</span>
      </div>
      <div class="footer-right">
        <div class="footer-help-icon" @click="toggleLogComplainModal">
          <font-awesome-icon :icon="['fas', 'headset']" class="icon" />
          <span class="icon-label">Help</span>
        </div>
      </div>
      
      <!-- Include LogComplaint modal component and pass showModal prop -->
      <LogComplaint 
        v-if="showLogComplainModal" 
        :showModal="showLogComplainModal" 
        @close="toggleLogComplainModal" 
      />
    </footer>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref } from 'vue';
  import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
  import LogComplaint from './LogComplaint.vue'; // Ensure the path is correct
  
  export default defineComponent({
    name: 'FooterNav',
    components: {
      FontAwesomeIcon,
      LogComplaint,
    },
    setup() {
      const showLogComplainModal = ref(false); // Control the visibility of the modal
  
      const toggleLogComplainModal = () => {
        showLogComplainModal.value = !showLogComplainModal.value;
      };
  
      return {
        showLogComplainModal,
        toggleLogComplainModal,
      };
    },
  });
  </script>
  
  <style scoped>
  .footer-nav {
    
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: #1e2127;
    padding: 50px 90px;
    z-index: 9998;
    border-top: 1px solid rgb(0, 0, 0);
  }
  
  .footer-left, .footer-right {
    display: flex;
    align-items: center;
  }
  
  .footer-right {
    justify-content: flex-end;
  }
  
  .footer-left{
    color: antiquewhite;
  }

  .footer-help-icon {
    display: flex;
    align-items: center;
    color: rgb(255, 255, 255);
    text-decoration: none;
    font-size: 14px;
    margin: 0 10px;
    transition: transform 0.3s;
    cursor: pointer;
  }
  
  .footer-help-icon:hover {
    color: #fd662f;
  }
  
  .icon-label {
    margin-left: 5px;
    font-size: 14px;
  }
  
  @media (max-width: 480px) {
    .footer-nav {
      padding: 50px 50px;
      align-items: center;
    }
    .footer-left, .footer-right {
      
      align-items: center;
    }
  }
  </style>
  