### README

This document provides a simple guide on how to set up and run the web application.

### Prerequisites
- Node.js and npm installed
- Supabase account and project set up

### Installation

1. **Clone the Repository:**
   ```sh
   git clone https://github.com/your-username/chatter.git
   cd chatter
   ```

2. **Install Dependencies:**
   ```sh
   npm install
   ```

3. **Set Up Environment Variables:**
   - Create a `.env` file in the root directory from the `.env.example`:
     ```sh
     cp .env.example .env
     ```
   - Add your Supabase URL and key to the `.env` file:
     ```env
     VITE_SUPABASE_URL=your-supabase-url
     VITE_SUPABASE_KEY=your-supabase-key
     ```

### Running the Application

1. **Start the Development Server:**
   ```sh
   npm run dev
   ```

2. **Open the Application:**
   - Open your browser and navigate to `http://localhost:5173`.

### Running Tests

1. **Start the Test Server:**
   ```sh
   npm run test:e2e:dev
   ```

2. **Open Cypress:**
   ```sh
   npx cypress open
   ```

3. **Run Tests:**
   - In the Cypress UI, select the test you want to run.

### Additional Information

For further details on each component's functionality and usage, refer to the component's implementation and the associated Vue.js documentation.