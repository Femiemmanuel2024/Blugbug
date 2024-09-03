<template>
  <div v-if="showModal" class="modal" @click.self="closeModal">
    <div class="modal-content">
      <div class="modal-header">
        LOG A COMPLAINT
        <button class="close-button" @click="closeModal">
          <i class="fa fa-times"></i>
        </button>
      </div>
      <div class="modal-body">
        <!-- Input bar for entering name or dropdown based on conditions -->
        <div v-if="isAdmin" class="dropdown-bar">
          <label for="complaint-select">Solve a Complaint:</label>
          <select id="complaint-select" v-model="selectedComplaintId">
            <option v-for="id in complaintOptions" :key="id" :value="id">{{ id }}</option>
          </select>
          <button class="okay-button" @click="fetchChatMessages">
            <i class="fa fa-check"></i>
          </button>
        </div>
        <div v-else>
          <div class="input-bar" v-if="!showDropdown">
            <input 
              type="text" 
              v-model="username" 
              placeholder="Enter your name" 
              @keyup.enter="handleNameSubmit"
            />
            <button class="checkmark-button" @click="handleNameSubmit">
              <i class="fa fa-check"></i>
            </button>
          </div>
          <div v-if="showNewComplaintButton">
            <button class="new-complaint-button" @click="createNewComplaint">
              New Complaint
            </button>
          </div>
          <div class="dropdown-bar" v-if="showDropdown">
            <label for="generated-case-select">Select Case ID:</label>
            <select id="generated-case-select" v-model="selectedComplaintId">
              <option v-for="id in complaintOptions" :key="id" :value="id">{{ id }}</option>
            </select>
            <button class="okay-button" @click="fetchChatMessages">
              <i class="fa fa-check"></i>
            </button>
          </div>
        </div>

        <!-- Chat box to show the conversation -->
        <div class="chat-box">
          <div class="chat-messages scrollbar-custom">
            <div 
              v-for="(message, index) in chatMessages" 
              :key="index" 
              :class="{'user-message': message.isUser, 'support-message': !message.isUser}"
            >
              {{ message.text }}
            </div>
          </div>

          <!-- Input to add more messages -->
          <div class="add-message">
            <textarea 
              v-model="newMessage" 
              placeholder="Type your message..." 
              @keyup.enter="sendMessage"
              class="message-textarea"
            ></textarea>
            <button class="send-button" @click="sendMessage">
              <i class="fa fa-paper-plane"></i>
            </button>
          </div>
          <div class="case-message">We try to respond within 24hrs, please check back after a while.
            Click on resolve case if your case has been resolved but you wish to keep the information in the chatbox for later use. 
            Click on close case to totally close the case.
          </div>
          <!-- Resolve and Close Case buttons -->
          <div class="case-actions">
            <button class="resolve-button" @click="resolveCase">
              Resolve Case
            </button>
            <button class="close-case-button" @click="closeCase">
              Close Case
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { supabase } from '../supabase'; // Adjust the path as needed

export default defineComponent({
  name: 'LogComplaint',
  props: {
    showModal: {
      type: Boolean,
      required: true
    }
  },
  emits: ['close'],
  setup(props, { emit }) {
    const username = ref<string>('');
    const selectedComplaintId = ref<string>('');
    const complaintOptions = ref<string[]>([]);
    const chatMessages = ref<{ text: string; isUser: boolean; timestamp?: string }[]>([]);
    const newMessage = ref<string>('');
    const userId = ref<string>('');
    const isAdmin = ref<boolean>(false);
    const showChatBox = ref<boolean>(false);
    const showDropdown = ref<boolean>(false);
    const showNewComplaintButton = ref<boolean>(false);

    // Initialize modal visibility with props
    const showModal = ref(props.showModal);

    const closeModal = () => {
      showModal.value = false;
      emit('close');
    };

    onMounted(async () => {
      userId.value = JSON.parse(localStorage.getItem('currentUser') || '{}').id || '';
      if (userId.value === '73170619-38c9-45d5-afe8-324709ef325a') {
        isAdmin.value = true;
        await fetchOpenComplaints();
      }
    });

    const fetchOpenComplaints = async () => {
      const { data, error } = await supabase
        .from('support_table')
        .select('case_id')
        .eq('is_open', true);

      if (error) {
        console.error('Error fetching complaints:', error.message);
      } else {
        complaintOptions.value = data.map((item: any) => item.case_id);
      }
    };

    const handleNameSubmit = async () => {
      if (username.value.trim()) {
        const { data, error } = await supabase
          .from('support_table')
          .select('case_id')
          .ilike('name', username.value);

        if (error) {
          console.error('Error checking name:', error.message);
          return;
        }

        if (data && data.length > 0) {
          complaintOptions.value = data.map((item: any) => item.case_id);
          showDropdown.value = true;
        } else {
          showNewComplaintButton.value = true;
        }
      } else {
        console.warn('No name entered');
      }
    };

    const createNewComplaint = async () => {
      const newCaseId = generateCaseId(username.value);
      const { error: insertError } = await supabase.from('support_table').insert({
        name: username.value,
        case_id: newCaseId,
        complain_messages: [],
        support_messages: [],
        complain_order: [],
        support_order: [],
        is_open: true
      });

      if (insertError) {
        console.error('Error creating new complaint:', insertError.message);
      } else {
        complaintOptions.value = [newCaseId];
        selectedComplaintId.value = newCaseId;
        showDropdown.value = true;
        showNewComplaintButton.value = false;
      }
    };

    const fetchChatMessages = async () => {
      if (!selectedComplaintId.value) return;

      const { data, error } = await supabase
        .from('support_table')
        .select('complain_messages, support_messages, complain_order, support_order')
        .eq('case_id', selectedComplaintId.value)
        .single();

      if (error) {
        console.error('Error fetching chat messages:', error.message);
      } else if (data) {
        const combinedMessages: { text: string; isUser: boolean; timestamp: string }[] = [];

        if (data.complain_messages && data.complain_order) {
          data.complain_messages.forEach((msg: string, index: number) => {
            combinedMessages.push({ text: msg, isUser: true, timestamp: data.complain_order[index] });
          });
        }

        if (data.support_messages && data.support_order) {
          data.support_messages.forEach((msg: string, index: number) => {
            combinedMessages.push({ text: msg, isUser: false, timestamp: data.support_order[index] });
          });
        }

        chatMessages.value = combinedMessages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        showChatBox.value = true;
      }
    };

    const sendMessage = async () => {
      if (!newMessage.value.trim()) return;

      const currentTimestamp = new Date().toISOString();
      const messageField = isAdmin.value ? 'support_messages' : 'complain_messages';
      const orderField = isAdmin.value ? 'support_order' : 'complain_order';

      const { data, error: fetchError } = await supabase
        .from('support_table')
        .select(`${messageField}, ${orderField}`)
        .eq('case_id', selectedComplaintId.value)
        .single();

      if (fetchError) {
        console.error('Error fetching current messages:', fetchError.message);
        return;
      }

      const currentMessages = data[messageField] || [];
      const currentOrders = data[orderField] || [];

      const updatedMessages = [...currentMessages, newMessage.value];
      const updatedOrders = [...currentOrders, currentTimestamp];

      const { error: updateError } = await supabase
        .from('support_table')
        .update({
          [messageField]: updatedMessages,
          [orderField]: updatedOrders
        })
        .eq('case_id', selectedComplaintId.value);

      if (updateError) {
        console.error('Error updating messages:', updateError.message);
      } else {
        chatMessages.value.push({ text: newMessage.value, isUser: !isAdmin.value });
      }

      newMessage.value = '';
    };

    const resolveCase = async () => {
      if (!selectedComplaintId.value) return;

      const { error } = await supabase
        .from('support_table')
        .update({ is_open: false })
        .eq('case_id', selectedComplaintId.value);

      if (error) {
        console.error('Error resolving case:', error.message);
      } else {
        console.log('Case resolved successfully');
      }
    };

    const closeCase = async () => {
      if (!selectedComplaintId.value) return;

      const { error } = await supabase
        .from('support_table')
        .delete()
        .eq('case_id', selectedComplaintId.value);

      if (error) {
        console.error('Error closing case:', error.message);
      } else {
        console.log('Case closed and deleted successfully');
      }
    };

    const generateCaseId = (name: string) => {
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      return `${name.toLowerCase()}-${randomNum}`;
    };

    return {
      username,
      selectedComplaintId,
      complaintOptions,
      handleNameSubmit,
      isAdmin,
      showChatBox,
      chatMessages,
      newMessage,
      fetchChatMessages,
      sendMessage,
      showDropdown,
      showNewComplaintButton,
      generateCaseId,
      resolveCase,
      closeCase,
      createNewComplaint,
      closeModal,
      showModal
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
  z-index: 999999;
}

/* Additional styles */
.modal-content {
  background: linear-gradient(45deg, #202329, #4e545b);
  padding: 20px;
  border-radius: 5px;
  width: 400px;
  max-width: 90%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: bold;
  color: wheat;
}

.close-button {
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  position: relative;
  top: -40px;
  left: 0px;
}

.close-button i {
  font-size: 30px;
}

.send-button {
  background-color: #3fc75e;
  color: white; 
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  margin-left: 10px;
}

.okay-button, .checkmark-button  {
  background-color: #3fc75e;
  color: white; 
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
}

.okay-button i, .checkmark-button i, .send-button i {
  font-size: 16px;
}

.okay-button:hover, .checkmark-button:hover, .send-button:hover {
  background-color: #218838;
}

.input-bar, .dropdown-bar {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.input-bar input, .dropdown-bar select {
  flex-grow: 1;
  padding: 8px;
  margin-right: 5px;
  border-radius: 4px;
}

input {
  border: none;
}

.chat-box {
  background-color: #f9f9f9;
  padding: 10px;
  margin-bottom: 10px;
  height: 300px; /* Fixed height for chat messages */
  overflow-y: auto;
  border: 1px solid #ccc;
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex-grow: 1;
  overflow-y: auto;
  max-height: 300px; /* Restrict chat message area height */
}

.user-message {
  text-align: left;
  background-color: #affbaf;
  padding: 5px;
  margin: 5px 0;
  margin-right: 50px;
}

.support-message {
  text-align: right;
  background-color: #e0e0ff;
  padding: 5px;
  margin: 5px 0;
  margin-left: 50px;
}

.add-message {
  display: flex;
  align-items: center;
  margin-top: auto; /* Pushes to the bottom */
}

.message-textarea {
  flex-grow: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  height: 40px; /* Maintain a constant height */
  resize: none; /* Prevent resizing */
  overflow-y: auto; /* Enable scrolling if needed */
  font-size: 14px;
  margin-right: 10px; /* Space between textarea and send button */
}

.case-actions {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 10px;
}

.resolve-button, .close-case-button {
  width: 48%; /* Each button takes up half the width */
  background-color: #ffc107;
  color: white;
  border: none;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  text-align: center;
}

.resolve-button:hover {
  background-color: #e0a800;
}

.close-case-button {
  background-color: #dc3545;
}

.close-case-button:hover {
  background-color: #c82333;
}

.new-complaint-button {
  background-color: #007bff;
  color: white;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 10px;
  width: 100%;
}

.new-complaint-button:hover {
  background-color: #0069d9;
}

.case-message {
  font-size: 10px;
  text-align: center;
}

/* For Webkit browsers (Chrome, Safari, Edge) */
::-webkit-scrollbar {
  width: 12px;  /* Width of the entire scrollbar */
}

::-webkit-scrollbar-track {
  background: #f1f1f1;  /* Color of the scrollbar track */
  border-radius: 10px;  /* Rounded corners for the scrollbar track */
}

::-webkit-scrollbar-thumb {
  background-color: #888; /* Color of the scrollbar thumb */
  border-radius: 10px;  /* Rounded corners for the scrollbar thumb */
  border: 3px solid #f1f1f1; /* Adds padding around thumb */
}

::-webkit-scrollbar-thumb:hover {
  background-color: #555;  /* Color of the scrollbar thumb on hover */
}

/* For Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: #888 #f1f1f1;
}

/* For Internet Explorer, Edge, and other browsers */
.scrollbar-custom {
  scrollbar-width: thin;  /* Thin scrollbar width */
  scrollbar-color: #888 #f1f1f1;  /* Thumb and track color for browsers that support the shorthand */
}

/* Make sure to add the class 'scrollbar-custom' to elements you want to apply this style to */

/* CSS for iPad screen size */
@media screen and (min-width: 768px) and (max-width: 1024px) {
  /* Add styles for iPad screen size here */
}

/* CSS for phone screen size */
@media screen and (max-width: 767px) {
  .modal {
    position: fixed;
    top: 50px;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 999999;
  }
  /* Add styles for phone screen size here */
}
</style>
