import { ref, provide, inject } from 'vue';

// Create a unique symbol for the modal state
const modalSymbol = Symbol('modal');

/**
 * Function to provide the modal state and toggle functionality.
 */
export function provideModalState() {
  // Create a ref to manage the visibility of the modal
  const showModal = ref(false);

  // Function to toggle the modal visibility
  const toggleModal = () => {
    showModal.value = !showModal.value;
  };

  // Provide the state and toggle function using the unique symbol
  provide(modalSymbol, { showModal, toggleModal });

  return {
    showModal,
    toggleModal,
  };
}

/**
 * Function to inject the modal state and toggle functionality.
 */
export function useModalState() {
  // Inject the modal state and toggle function using the unique symbol
  const modalState = inject<{ showModal: typeof ref<boolean>; toggleModal: () => void }>(modalSymbol);
  
  // Throw an error if the function is used without a provider
  if (!modalState) {
    throw new Error('useModalState() is called without provider.');
  }
  return modalState;
}
