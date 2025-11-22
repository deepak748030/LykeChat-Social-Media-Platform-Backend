# LykeChat - Social Media Platform

A comprehensive social media platform similar to Instagram with additional features like services marketplace and community discussions.

## 🚀 Features

### Core Features
- **User Authentication**: Phone-based login/signup with OTP verification
- **User Profiles**: Complete profile management with profile pictures
- **Posts**: Create, view, like, comment, and share posts with multiple media files
- **Stories**: 24-hour disappearing stories with views tracking
- **Comments & Replies**: Nested comments system with likes
- **Follow System**: Follow/unfollow users with real-time counts
- **Home Feed**: Personalized feed from followed users
- **Services Marketplace**: Local services discovery and booking
- **Community**: Discussion forums with different categories
- **Advertisements**: Targeted advertising system

### Technical Features
- **Fast Performance**: Node.js with caching using node-cache
- **File Uploads**: Multer for handling images and videos
- **MongoDB**: Optimized queries with proper indexing
- **RESTful API**: Well-structured API endpoints
- **Error Handling**: Comprehensive error handling middleware
- **Security**: CORS, helmet, rate limiting

## 📁 Project Structure

```
lykechat/
├── src/
│   ├── config/
│   │   ├── db.js                 # MongoDB connection
│   │   └── cache.js              # Caching configuration
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── userController.js     # User management
│   │   ├── postController.js     # Posts management
│   │   ├── commentController.js  # Comments system
│   │   ├── storyController.js    # Stories features
│   │   ├── serviceController.js  # Services marketplace
│   │   └── adController.js       # Advertisements
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   ├── upload.js            # File upload handling
│   │   └── error.js             # Error handling
│   ├── models/
│   │   ├── User.js              # User schema
│   │   ├── Post.js              # Post schema
│   │   ├── Comment.js           # Comment schema
│   │   ├── Story.js             # Story schema
│   │   ├── Service.js           # Service schema
│   │   └── Advertisement.js     # Advertisement schema
│   └── routes/
│       ├── auth.js              # Authentication routes
│       ├── user.js              # User routes
│       ├── post.js              # Post routes
│       ├── comment.js           # Comment routes
│       ├── story.js             # Story routes
│       ├── service.js           # Service routes
│       └── advertisement.js     # Advertisement routes
├── uploads/                     # File uploads directory
├── server.js                    # Main server file
├── package.json
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud)

### Steps

1. **Clone the repository**
```bash
git clone https://github.com/deepak748030/LykeChat-Social-Media-Platform-Backend.git
cd lykechat
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
```bash
cp .env.example .env
```

Edit `.env` file with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/lykechat
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
NODE_ENV=development
DEFAULT_OTP=123456
```

4. **Start the server**

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## 📱 App Screens & API Mapping

### 1. Login/Signup Screen
**API Endpoint**: `POST /api/auth/login`

**Mock Data**:
```json
{
  "phone": "+919999966666",
  "otp": "123456",
  "userDetails": {
    "name": "John Doe",
    "profileId": "johndoe",
    "email": "john@example.com"
  }
}
```

### 2. OTP Verification Screen
**API Endpoint**: `POST /api/auth/login` (same as above)

**Mock Data**:
```json
{
  "phone": "+919999966666",
  "otp": "123456"
}
```

### 3. Profile Details Screen
**API Endpoint**: `PUT /api/users/profile`

**Mock Data**:
```json
{
  "name": "John Doe",
  "bio": "Digital Creator from India",
  "profession": "Software Engineer",
  "education": "B.Tech Computer Science",
  "interests": ["Technology", "Photography", "Travel"],
  "dateOfBirth": "1995-06-15",
  "country": "India",
  "state": "Delhi",
  "district": "New Delhi",
  "website": "https://johndoe.com"
}
```

### 4. Home Feed Screen
**API Endpoints**: 
- `GET /api/posts/feed` - Get posts
- `GET /api/stories/feed` - Get stories
- `GET /api/advertisements/feed` - Get ads

**Mock Response**:
```json
{
  "success": true,
  "posts": [
    {
      "_id": "post123",
      "author": {
        "_id": "user123",
        "name": "Priti Verma",
        "profileId": "pritiverma",
        "profileImage": "/uploads/profiles/priti.jpg",
        "isVerified": false
      },
      "caption": "Beautiful sunset today! 🌅",
      "media": [
        {
          "type": "image",
          "url": "/uploads/posts/sunset.jpg"
        }
      ],
      "likesCount": 128,
      "commentsCount": 24,
      "sharesCount": 8,
      "isLikedByUser": false,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 5. Community Screen
**API Endpoint**: `GET /api/posts/trending?category=tech`

**Mock Response**:
```json
{
  "success": true,
  "posts": [
    {
      "_id": "post456",
      "author": {
        "name": "Riya Singh",
        "profileId": "riyasingh",
        "profession": "Developer"
      },
      "caption": "Is it good time to quit Amazon with 4 years of exp in SDE - II and join a startup company with work from home?",
      "likesCount": 216,
      "commentsCount": 6,
      "category": "Tech & Support",
      "createdAt": "2024-01-15T09:00:00Z"
    }
  ]
}
```

### 6. Comments Screen
**API Endpoint**: `GET /api/comments/post/:postId`

**Mock Response**:
```json
{
  "success": true,
  "comments": [
    {
      "_id": "comment123",
      "author": {
        "name": "Amit Sharma",
        "profileImage": "/uploads/profiles/amit.jpg"
      },
      "content": "I think it depends on the startup. If it has good funding and growth potential, it could be a great move!",
      "likesCount": 24,
      "repliesCount": 2,
      "isLikedByUser": true,
      "createdAt": "2024-01-15T10:15:00Z"
    }
  ]
}
```

### 7. Services Screen
**API Endpoint**: `GET /api/services?location=Delhi`

**Mock Response**:
```json
{
  "success": true,
  "services": [
    {
      "_id": "service123",
      "provider": {
        "name": "Ravi Singh",
        "profileImage": "/uploads/profiles/ravi.jpg"
      },
      "title": "Software Development",
      "description": "Full-stack web development services",
      "pricing": {
        "type": "hourly",
        "minPrice": 1000,
        "maxPrice": 2000,
        "currency": "INR"
      },
      "rating": {
        "average": 4.5,
        "count": 129
      },
      "location": {
        "address": {
          "city": "New Delhi",
          "state": "Delhi"
        }
      }
    }
  ]
}
```

### 8. Users Discovery Screen
**API Endpoint**: `GET /api/users/suggestions`

**Mock Response**:
```json
{
  "success": true,
  "suggestions": [
    {
      "_id": "user456",
      "name": "Sachin Sharma",
      "profileId": "sachinsharma",
      "profession": "SDE - II",
      "profileImage": "/uploads/profiles/sachin.jpg",
      "followersCount": 1250,
      "isVerified": false
    }
  ]
}
```

### 9. User Profile Screen
**API Endpoint**: `GET /api/users/:profileId`

**Mock Response**:
```json
{
  "success": true,
  "user": {
    "_id": "user789",
    "name": "Manish Kumar",
    "profileId": "manishkumar",
    "profession": "Digital Creator",
    "bio": "Creating amazing content daily",
    "followersCount": 980,
    "followingCount": 243,
    "postsCount": 45,
    "profileImage": "/uploads/profiles/manish.jpg",
    "isFollowing": false
  }
}
```

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/login` - Login or register user
- `GET /api/auth/me` - Get current user info

### Users
- `GET /api/users/search` - Search users
- `GET /api/users/suggestions` - Get suggested users
- `GET /api/users/:profileId` - Get user profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/profile/image` - Upload profile image
- `POST /api/users/:profileId/follow` - Follow/unfollow user
- `GET /api/users/:profileId/posts` - Get user posts

### Posts
- `POST /api/posts` - Create new post
- `GET /api/posts/feed` - Get home feed
- `GET /api/posts/trending` - Get trending posts
- `GET /api/posts/:id` - Get single post
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/share` - Share post
- `DELETE /api/posts/:id` - Delete post

### Comments
- `POST /api/comments` - Create comment
- `GET /api/comments/post/:postId` - Get post comments
- `GET /api/comments/:commentId/replies` - Get comment replies
- `POST /api/comments/:id/like` - Like/unlike comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Stories
- `POST /api/stories` - Create story
- `GET /api/stories/feed` - Get stories feed
- `GET /api/stories/my` - Get user's stories
- `GET /api/stories/user/:profileId` - Get user stories
- `POST /api/stories/:id/view` - View story
- `GET /api/stories/:id/viewers` - Get story viewers
- `DELETE /api/stories/:id` - Delete story

### Services
- `POST /api/services` - Create service
- `GET /api/services` - Get all services
- `GET /api/services/trending` - Get trending services
- `GET /api/services/my` - Get user's services
- `GET /api/services/:id` - Get single service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service
- `POST /api/services/:id/review` - Add review

### Advertisements
- `POST /api/advertisements` - Create advertisement
- `GET /api/advertisements/feed` - Get ads for feed
- `GET /api/advertisements/:id` - Get single ad
- `POST /api/advertisements/:id/click` - Record ad click
- `PUT /api/advertisements/:id` - Update advertisement
- `DELETE /api/advertisements/:id` - Delete advertisement
- `GET /api/advertisements/:id/analytics` - Get ad analytics

## 🗄️ Database Models

### User Model
```javascript
{
  name: String,
  profileId: String (unique),
  email: String (optional),
  phone: String (unique),
  profileImage: String,
  bio: String,
  profession: String,
  followers: [ObjectId],
  following: [ObjectId],
  followersCount: Number,
  followingCount: Number,
  postsCount: Number,
  // ... location and other fields
}
```

### Post Model
```javascript
{
  author: ObjectId,
  caption: String,
  media: [{
    type: String (image/video),
    url: String,
    thumbnail: String
  }],
  likesCount: Number,
  commentsCount: Number,
  sharesCount: Number,
  tags: [String],
  location: Object,
  isActive: Boolean
}
```

## ⚡ Performance Features

- **Caching**: Redis-like caching with node-cache for frequently accessed data
- **Indexing**: Optimized MongoDB indexes for faster queries
- **Pagination**: Efficient pagination for large datasets
- **Lean Queries**: Using .lean() for faster read operations
- **File Optimization**: Multer with file size and type restrictions

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers middleware
- **Rate Limiting**: Request rate limiting to prevent abuse
- **File Upload Security**: File type and size validation
- **Input Validation**: Mongoose validation and sanitization

## 🚀 Getting Started for Development

1. **Install nodemon globally** (optional):
```bash
npm install -g nodemon
```

2. **Start MongoDB** locally or use MongoDB Atlas

3. **Run the development server**:
```bash
npm run dev
```

4. **Test the API** using Postman or any API testing tool

5. **Health Check**: Visit `http://localhost:5000/api/health`

## 📝 Notes

- Default OTP for testing: `123456`
- All uploaded files are stored in `/uploads` directory
- Cache TTL is configurable via environment variables
- The app supports both local and cloud MongoDB
- Soft delete is implemented for most entities
- All endpoints return consistent JSON response format

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.