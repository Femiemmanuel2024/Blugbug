import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import './assets/reset.css';
import './assets/global.css';
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
  faExpand, 
  faToggleOn, 
  faToggleOff,
  faCircleRight, 
  faCircleLeft,
  faTrash,
  faBars, // Import faBars
  faToolbox,
  faArrowsRotate,
  faPlus,
  faUserMinus,
  faHeadset,
  faMagnifyingGlass,
  faPenClip,
  faPersonWalking,
  faPersonCircleMinus,
  faPersonCirclePlus,
  faClockRotateLeft,
  faShareFromSquare,
  faBell
} from '@fortawesome/free-solid-svg-icons';

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
  faExpand,
  faToggleOn,
  faToggleOff,
  faCircleRight, 
  faCircleLeft,
  faTrash,
  faToolbox,
  faCircleXmark,
  faArrowsRotate,
  faPlus,
  faUserMinus,
  faHeadset,
  faMagnifyingGlass,
  faPenClip,
  faPersonWalking,
  faPersonCircleMinus,
  faPersonCirclePlus,
  faClockRotateLeft,
  faShareFromSquare,
  faBell,
  faBars // Add faBars to library
);

const app = createApp(App);

app.component('QuillEditor', QuillEditor);
app.component('font-awesome-icon', FontAwesomeIcon);

app.use(router).mount('#app');
