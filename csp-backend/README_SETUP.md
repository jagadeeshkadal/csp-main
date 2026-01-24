# Setup Instructions

## Backend Setup

1. **Install Dependencies**
   ```bash
   cd csp-backend
   npm install
   ```

2. **Set Up Environment Variables**
   - Copy `env.template` to `.env`:
     ```bash
     cp env.template .env
     ```
   - **Get Gemini API Key**:
     - Go to: https://aistudio.google.com/app/apikey
     - Sign in with your Google account (same as Firebase project)
     - Click "Create API Key"
     - Copy the key and add it to `.env`:
       ```env
       GEMINI_API_KEY=your_api_key_here
       ```
   - Update other variables in `.env` as needed (DATABASE_URL, PORT, etc.)

3. **Generate Prisma Client**
   ```bash
   npm run generate
   ```

4. **Seed Database with Sample Agents**
   ```bash
   npm run seed
   ```
   This will create 8 sample AI agents:
   - Email Assistant
   - Code Helper
   - Writing Assistant
   - Customer Support
   - Data Analyst
   - Marketing Expert
   - Product Manager
   - Design Consultant

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## Frontend Setup

1. **Install Dependencies**
   ```bash
   cd csp-frontend
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

## API Endpoints

### Agents
- `GET /agents` - Get all active agents
- `GET /agents/search?q=term` - Search agents
- `GET /agents/:id` - Get agent by ID
- `POST /agents` - Create agent (admin)
- `PUT /agents/:id` - Update agent (admin)
- `DELETE /agents/:id` - Delete agent (admin)

### Conversations
- `GET /conversations` - Get user's conversations
- `GET /conversations/:id` - Get conversation with messages
- `POST /conversations` - Create or get existing conversation
- `GET /conversations/:id/messages` - Get messages
- `POST /conversations/:id/messages` - Send message

## Testing the Application

1. Sign in with Google
2. You'll see a sidebar with AI agents
3. Click on any agent to start a conversation
4. Type a message and press Enter or click Send
5. Messages will be saved and displayed in the conversation

## Notes

- All endpoints require authentication (JWT token in Authorization header)
- The frontend automatically includes the token in requests
- Conversations are created automatically when you select an agent
- Messages are stored with sender type (user/agent)
