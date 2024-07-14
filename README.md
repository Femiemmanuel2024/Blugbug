### README

This document provides an overview of the components used in the project, along with a brief description of their functionalities.

#### `infofeatures` Directory
- **ActionNotification.vue**
  - Manages user notifications. Displays a list of notifications and plays a notification sound when a new notification is received. Allows users to mark notifications as read and clear all notifications.

- **InfoData.vue**
  - Displays various information data. (Detailed functionality needs to be specified based on the implementation.)

- **LatestBlogs.vue**
  - Lists the latest blogs posted by users. (Detailed functionality needs to be specified based on the implementation.)

#### `UserProfile` Directory
- **AnalyticsPage.vue**
  - Provides analytics data related to user activities. (Detailed functionality needs to be specified based on the implementation.)

- **ChattersPage.vue**
  - Manages and displays the list of users (Chatters). (Detailed functionality needs to be specified based on the implementation.)

- **LoginPage.vue**
  - Handles user login functionality. Displays login form and manages authentication.

- **MarkdownEditor.vue**
  - A markdown editor for creating and editing blog posts with markdown syntax.

- **NavBar.vue**
  - A navigation bar component that provides links to different parts of the application.

- **ProfileSettings.vue**
  - Manages user profile settings. Allows users to update their profile information.

- **QuillEditor.vue**
  - A rich-text editor based on Quill for creating and editing blog posts.

- **ReadBlog.vue**
  - Displays a full blog post for reading. Handles the presentation of the blog content.

- **SignUpConfirmation.vue**
  - Handles the confirmation process after user signup. Displays confirmation messages and instructions.

- **SignUpPage.vue**
  - Manages user signup functionality. Displays signup form and handles user registration.

#### `features` Directory
- **BlogPosts.vue**
  - Manages and displays a list of blog posts. Provides functionalities to like, bookmark, and interact with blog posts.

- **CreateBlogPost.vue**
  - Provides a form and functionality for creating new blog posts.

- **Feed.vue**
  - Displays a feed of blog posts from users that the current user is following. Allows users to like posts and view content.

- **FileUpload.vue**
  - Manages file uploads for blog posts or user profile images. Provides functionality to upload and handle files.

- **ProfileHeader.vue**
  - Displays the profile header for a user, including their profile picture, name, and other relevant information.

- **SearchBar.vue**
  - Provides a search bar for finding users. Displays search results and manages user interactions with search results.

#### Additional Files
- **supabase.ts**
  - Contains the Supabase client setup and configuration for interacting with the Supabase backend.

### Usage
Each component is used within the Vue.js application to provide specific functionalities. The components are organized based on their roles and the part of the application they serve. 

For example:
- **NavBar.vue** is used globally across the application to provide navigation.
- **LoginPage.vue** and **SignUpPage.vue** handle user authentication and registration.
- **BlogPosts.vue** and **Feed.vue** manage the display and interaction with blog content.
- **ProfileHeader.vue** and **ProfileSettings.vue** manage user profiles and settings.
- **ActionNotification.vue** handles user notifications.

### Setup
To set up and run the application, ensure you have the necessary dependencies installed and the Supabase backend configured. Then, start the Vue.js application using your preferred method (e.g., `npm run serve`).

For further details on each component's functionality, refer to the component's implementation and the associated Vue.js documentation.