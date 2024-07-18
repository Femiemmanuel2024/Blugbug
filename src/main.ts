import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { QuillEditor } from '@vueup/vue-quill'; // Import QuillEditor from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'; // Import Quill CSS

import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { 
  faHouse, 
  faComments, 
  faGlobe, 
  faSignOutAlt, 
  faTrashAlt, 
  faCog, 
  faHeart, 
  faBookmark, 
  faCircleCheck, 
  faCircleXmark,
  faBold, // Import faBold
  faItalic, // Import faItalic
  faAlignLeft, // Import faAlignLeft
  faAlignCenter, // Import faAlignCenter
  faAlignRight, // Import faAlignRight
  faImage, // Import faImage
  faLink, // Import faLink
  faBookOpenReader, // Import faBookOpenReader
  faCircleChevronDown, // Import faCircleChevronDown
  faCompressAlt, // Import faCompressAlt
  faExpandAlt, // Import faExpandAlt
  faExpand // Import faExpand
} from '@fortawesome/free-solid-svg-icons';

// Add the icons to the library
library.add(
  faHouse, 
  faComments, 
  faGlobe, 
  faSignOutAlt, 
  faTrashAlt, 
  faCog, 
  faHeart, 
  faBookmark, 
  faCircleCheck, 
  faCircleXmark,
  faBold,
  faItalic,
  faAlignLeft,
  faAlignCenter,
  faAlignRight,
  faImage,
  faLink,
  faBookOpenReader,
  faCircleChevronDown,
  faCompressAlt,
  faExpandAlt,
  faExpand
);

const app = createApp(App);

app.component('QuillEditor', QuillEditor); // Register QuillEditor globally
app.component('font-awesome-icon', FontAwesomeIcon); // Register FontAwesomeIcon globally

app.use(router).mount('#app');
