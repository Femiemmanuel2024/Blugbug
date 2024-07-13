import { createRouter, createWebHistory } from 'vue-router';
import LoginPage from './components/LoginPage.vue';
import SignUpPage from './components/SignUpPage.vue';
import HomePage from './components/UserProfile/HomePage.vue';
import ChattersPage from './components/ChattersPage.vue';
import AnalyticsPage from './components/AnalyticsPage.vue';
import SearchBar from './components/features/SearchBar.vue';
import PublicProfile from './components/UserProfile/PublicProfile.vue';
import SignUpConfirmation from './components/SignUpConfirmation.vue';
import ProfileSettings from './components/ProfileSettings.vue';
import FileUpload from './components/features/FileUpload.vue'; // Import FileUpload component

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginPage },
  { path: '/signup', component: SignUpPage },
  { path: '/home', component: HomePage },
  { path: '/chatters', component: ChattersPage },
  { path: '/analytics', component: AnalyticsPage },
  { path: '/logout', component: LoginPage },
  { path: '/searchbar', component: SearchBar },
  {path:'/settings', component: ProfileSettings},
  { path: '/user/:chatterName', name: 'PublicProfile', component: PublicProfile },
  { path: '/signup-confirmation', component: SignUpConfirmation },
  { path: '/upload/:type', name: 'FileUpload', component: FileUpload }, // Add route for FileUpload
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
