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
  faChartLine, 
  faSignOutAlt, 
  faTrashAlt, 
  faCog, 
  faHeart, 
  faBookmark, 
  faCircleCheck, 
  faCircleXmark 
} from '@fortawesome/free-solid-svg-icons';

// Add the icons to the library
library.add(faHouse, faComments, faChartLine, faSignOutAlt, faTrashAlt, faCog, faHeart, faBookmark, faCircleCheck, faCircleXmark);

const app = createApp(App);

app.component('QuillEditor', QuillEditor); // Register QuillEditor globally
app.component('font-awesome-icon', FontAwesomeIcon); // Register FontAwesomeIcon globally

app.use(router).mount('#app');
