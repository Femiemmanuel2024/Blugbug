import { createRouter, createWebHistory } from 'vue-router';
import LoginPage from './components/LoginPage.vue';
import SignUpPage from './components/SignUpPage.vue';
import HomePage from './components/UserProfile/HomePage.vue';
import ChattersPage from './components/ChattersPage.vue';
import BlugPage from './components/BlugPage.vue';
import SearchBar from './components/features/SearchBar.vue';
import PublicProfile from './components/UserProfile/PublicProfile.vue';
import SignUpConfirmation from './components/SignUpConfirmation.vue';
import ProfileSettings from './components/ProfileSettings.vue';
import FileUpload from './components/features/FileUpload.vue'; 
import TiptapfullPage from './components/TiptapfullPage.vue';
import NotFound from './components/NotFound.vue';
import TermsAndConditions from './components/features/TermsAndConditions.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginPage },
  { path: '/signup', component: SignUpPage },
  { path: '/home', component: HomePage },
  { path: '/MyBlug', component: ChattersPage },
  { path: '/BlugPage', name: 'BlugPage', component: BlugPage }, 
  { path: '/logout', component: LoginPage },
  { path: '/searchbar', component: SearchBar },
  { path: '/settings', component: ProfileSettings },
  { path: '/user/:userId', name: 'PublicProfile', component: PublicProfile },
  { path: '/signup-confirmation', component: SignUpConfirmation },
  { path: '/upload/:type', name: 'FileUpload', component: FileUpload }, 
  { path: '/fullpage', component: TiptapfullPage },
  {path: '/TermsAndConditions', component: TermsAndConditions},
  { path: '/:catchAll(.*)', name: 'NotFound', component: NotFound }  // This catches all undefined routes
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0 };
    }
  },
});

export default router;
