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
import TermsAndConditions from './components/features/TermsAndConditions.vue';
import BlugReader from './components/v2.0/BlugReader.vue';
import CreateBlogPostPage from './components/features/CreateBlogPostPage.vue';
import ConnectionsPage from './components/v2.0/ConnectionsPage.vue';
import ReplyPage from './components/v2.0/ReplyPage.vue';
import EditPostPage from './components/v2.0/EditPostPage.vue';
import AdminManager from './components/v2.0/AdminManager.vue'; // Importing AdminManager.vue

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: LoginPage },
  { path: '/signup', component: SignUpPage },
  { path: '/home', component: HomePage },
  { path: '/myblug', component: ChattersPage },
  { path: '/blugpage', name: 'BlugPage', component: BlugPage },
  { path: '/logout', component: LoginPage },
  { path: '/searchbar', component: SearchBar },
  { path: '/settings', component: ProfileSettings },
  { path: '/user/:userId', name: 'PublicProfile', component: PublicProfile },
  { path: '/signup-confirmation', component: SignUpConfirmation },
  { path: '/upload/:type', name: 'FileUpload', component: FileUpload },
  { path: '/fullpage', component: TiptapfullPage },
  { path: '/terms-and-conditions', component: TermsAndConditions },
  { path: '/read', name: 'BlugReader', component: BlugReader },
  { path: '/create-blog', name: 'CreateBlogPostPage', component: CreateBlogPostPage },
  { path: '/connections', name: 'ConnectionsPage', component: ConnectionsPage },
  { path: '/reply', name: 'ReplyPage', component: ReplyPage },
  { path: '/edit/:blogId', name: 'EditPostPage', component: EditPostPage },
  { path: '/admin-manager', name: 'AdminManager', component: AdminManager }, // New route for Admin Manager
  { path: '/:catchAll(.*)', name: 'NotFound', component: NotFound }
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
