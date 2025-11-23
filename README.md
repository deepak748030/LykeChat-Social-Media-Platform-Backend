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

## 📱 Complete API Documentation with Mock Data

### 1. Authentication APIs

#### Send OTP
**API Endpoint**: `POST /api/auth/send-otp`

**Request Body (JSON)**:
```json
{
  "phone": "+919999966666"
}
```

**Response for Existing User**:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "type": "login",
  "phone": "+919999966666",
  "otp": "123456"
}
```

**Response for New User**:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "type": "signup",
  "phone": "+919999966666",
  "otp": "123456"
}
```

#### Verify OTP
**API Endpoint**: `POST /api/auth/verify-otp`

**Request Body for Login (JSON)**:
```json
{
  "phone": "+919999966666",
  "otp": "123456"
}
```

**Request Body for Signup with Complete Details (JSON)**:
```json
{
  "phone": "+919999966666",
  "otp": "123456",
  "userDetails": {
    "name": "John Doe",
    "profileId": "johndoe",
    "email": "john@example.com",
    "profession": "Software Engineer",
    "bio": "Digital Creator from India",
    "interests": ["Technology", "Photography", "Travel"],
    "dateOfBirth": "1995-06-15",
    "country": "India",
    "state": "Delhi",
    "district": "New Delhi",
    "website": "https://johndoe.com"
  }
}
```

**Login Response**:
```json
{
  "success": true,
  "message": "Login successful",
  "type": "login",
  "token": "jwt_token_here",
  "user": {
    "_id": "user123",
    "name": "John Doe",
    "profileId": "johndoe",
    "profileImage": "/uploads/profiles/john.jpg",
    "bio": "Digital Creator from India",
    "profession": "Software Engineer",
    "followersCount": 1250,
    "followingCount": 243,
    "postsCount": 45,
    "isVerified": false
  }
}
```

### 2. User Profile APIs

#### Update Profile
**API Endpoint**: `PUT /api/users/profile`

**FormData Request Example (JavaScript)**:
```javascript
const updateProfileWithFormData = async (token) => {
  const formData = new FormData();

  // Text fields
  formData.append('name', 'Jane Doe');
  formData.append('profileId', 'janedoe_official');
  formData.append('email', 'jane.doe@example.com');
  formData.append('dateOfBirth', '1990-05-20');
  formData.append('country', 'India');
  formData.append('state', 'Maharashtra');
  formData.append('district', 'Mumbai');
  formData.append('tahsil', 'Andheri');
  formData.append('village', 'Versova');
  formData.append('profession', 'Software Engineer');
  formData.append('education', 'B.Tech in Computer Science');
  formData.append('interests', JSON.stringify(['Technology', 'Reading', 'Hiking']));
  formData.append('bio', 'Passionate developer and nature enthusiast.');
  formData.append('website', 'https://janedoe.dev');

  // Profile image file
  // In React Native: const imageUri = await ImagePicker.launchImageLibraryAsync();
  // formData.append('profileImage', { uri: imageUri, name: 'profile.jpg', type: 'image/jpeg' });
  
  const response = await fetch('http://localhost:5000/api/users/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  return await response.json();
};
```

**Response**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "_id": "user123",
    "name": "Jane Doe",
    "profileId": "janedoe_official",
    "email": "jane.doe@example.com",
    "profileImage": "/uploads/profiles/profile-1678901234567.jpg",
    "bio": "Passionate developer and nature enthusiast.",
    "profession": "Software Engineer",
    "followersCount": 1250,
    "followingCount": 243,
    "postsCount": 45,
    "isVerified": false
  }
}
```

#### Follow/Unfollow User
**API Endpoint**: `POST /api/users/:profileId/follow`

**Request Body**: No body required

**Response**:
```json
{
  "success": true,
  "message": "User followed successfully",
  "isFollowing": true
}
```

### 3. Posts APIs

#### Create Post
**API Endpoint**: `POST /api/posts`

**FormData Request Example (JavaScript)**:
```javascript
const createPostWithFormData = async (token) => {
  const formData = new FormData();

  // Text fields
  formData.append('caption', 'Exploring the beautiful mountains today! #nature #travel');
  formData.append('tags', 'mountains,travel,adventure');
  formData.append('location', JSON.stringify({
    name: 'Himalayan Peaks',
    coordinates: { latitude: 30.7333, longitude: 76.7794 }
  }));
  formData.append('visibility', 'public'); // 'public' or 'private'
  formData.append('commentsEnabled', 'true');

  // Multiple media files
  // In React Native: 
  // const imageResult = await ImagePicker.launchImageLibraryAsync();
  // const videoResult = await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'Videos' });
  // formData.append('media', { uri: imageResult.uri, name: 'image.jpg', type: 'image/jpeg' });
  // formData.append('media', { uri: videoResult.uri, name: 'video.mp4', type: 'video/mp4' });

  const response = await fetch('http://localhost:5000/api/posts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  return await response.json();
};
```

**Response**:
```json
{
  "success": true,
  "message": "Post created successfully",
  "post": {
    "_id": "post123",
    "author": {
      "_id": "user123",
      "name": "Jane Doe",
      "profileId": "janedoe_official",
      "profileImage": "/uploads/profiles/jane.jpg",
      "isVerified": false
    },
    "caption": "Exploring the beautiful mountains today! #nature #travel",
    "media": [
      {
        "type": "image",
        "url": "/uploads/posts/mountain_view-1678901234567.jpg"
      },
      {
        "type": "video",
        "url": "/uploads/posts/mountain_trek-1678901234568.mp4",
        "thumbnail": "/uploads/posts/thumb_mountain_trek-1678901234568.jpg"
      }
    ],
    "tags": ["mountains", "travel", "adventure"],
    "location": {
      "name": "Himalayan Peaks",
      "coordinates": { "latitude": 30.7333, "longitude": 76.7794 }
    },
    "visibility": "public",
    "commentsEnabled": true,
    "likesCount": 0,
    "commentsCount": 0,
    "sharesCount": 0,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Like/Unlike Post
**API Endpoint**: `POST /api/posts/:id/like`

**Request Body**: No body required

**Response**:
```json
{
  "success": true,
  "message": "Post liked successfully",
  "isLiked": true,
  "likesCount": 129
}
```

#### Share Post
**API Endpoint**: `POST /api/posts/:id/share`

**Request Body**: No body required

**Response**:
```json
{
  "success": true,
  "message": "Post shared successfully",
  "sharesCount": 9
}
```

### 4. Stories APIs

#### Create Story
**API Endpoint**: `POST /api/stories`

**FormData Request Example (JavaScript)**:
```javascript
const createStoryWithFormData = async (token) => {
  const formData = new FormData();

  // Text fields
  formData.append('caption', 'My morning coffee view!');

  // Single media file
  // In React Native:
  // const mediaResult = await ImagePicker.launchImageLibraryAsync();
  // formData.append('media', { uri: mediaResult.uri, name: 'story.jpg', type: 'image/jpeg' });

  const response = await fetch('http://localhost:5000/api/stories', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  return await response.json();
};
```

**Response**:
```json
{
  "success": true,
  "message": "Story created successfully",
  "story": {
    "_id": "story123",
    "author": {
      "_id": "user123",
      "name": "Jane Doe",
      "profileId": "janedoe_official",
      "profileImage": "/uploads/profiles/jane.jpg",
      "isVerified": false
    },
    "caption": "My morning coffee view!",
    "media": {
      "type": "image",
      "url": "/uploads/stories/coffee_story-1678901234567.jpg"
    },
    "viewsCount": 0,
    "createdAt": "2024-01-15T08:30:00Z",
    "expiresAt": "2024-01-16T08:30:00Z"
  }
}
```

#### View Story
**API Endpoint**: `POST /api/stories/:id/view`

**Request Body**: No body required

**Response**:
```json
{
  "success": true,
  "message": "Story viewed successfully",
  "viewsCount": 25
}
```

### 5. Comments APIs

#### Create Comment
**API Endpoint**: `POST /api/comments`

**Request Body (JSON)**:
```json
{
  "content": "Amazing view! Where is this place?",
  "postId": "post123"
}
```

**Create Reply to Comment**:
```json
{
  "content": "This is in the Himalayas, near Manali!",
  "postId": "post123",
  "parentCommentId": "comment123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Comment created successfully",
  "comment": {
    "_id": "comment124",
    "author": {
      "_id": "user456",
      "name": "Amit Sharma",
      "profileId": "amitsharma",
      "profileImage": "/uploads/profiles/amit.jpg",
      "isVerified": false
    },
    "content": "Amazing view! Where is this place?",
    "post": "post123",
    "parentComment": null,
    "likesCount": 0,
    "repliesCount": 0,
    "createdAt": "2024-01-15T11:00:00Z"
  }
}
```

#### Like/Unlike Comment
**API Endpoint**: `POST /api/comments/:id/like`

**Request Body**: No body required

**Response**:
```json
{
  "success": true,
  "message": "Comment liked successfully",
  "isLiked": true,
  "likesCount": 5
}
```

#### Update Comment
**API Endpoint**: `PUT /api/comments/:id`

**Request Body (JSON)**:
```json
{
  "content": "Amazing view! Where exactly is this place? Looks incredible!"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Comment updated successfully",
  "comment": {
    "_id": "comment124",
    "author": {
      "_id": "user456",
      "name": "Amit Sharma",
      "profileId": "amitsharma",
      "profileImage": "/uploads/profiles/amit.jpg",
      "isVerified": false
    },
    "content": "Amazing view! Where exactly is this place? Looks incredible!",
    "post": "post123",
    "likesCount": 5,
    "repliesCount": 1,
    "createdAt": "2024-01-15T11:00:00Z"
  }
}
```

### 6. Services APIs

#### Create Service
**API Endpoint**: `POST /api/services`

**FormData Request Example (JavaScript)**:
```javascript
const createServiceWithFormData = async (token) => {
  const formData = new FormData();

  // Text fields
  formData.append('title', 'Professional Web Development');
  formData.append('description', 'Full-stack web development services using modern technologies like React, Node.js, and MongoDB.');
  formData.append('category', 'Software Development');
  
  formData.append('pricing', JSON.stringify({
    type: 'hourly',
    minPrice: 1500,
    maxPrice: 3000,
    currency: 'INR'
  }));
  
  formData.append('location', JSON.stringify({
    type: 'both',
    address: {
      street: '123 Tech Street',
      city: 'New Delhi',
      state: 'Delhi',
      country: 'India',
      zipCode: '110001'
    },
    coordinates: { latitude: 28.6139, longitude: 77.2090 }
  }));
  
  formData.append('availability', JSON.stringify({
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    timeSlots: [
      { start: '09:00', end: '17:00' }
    ]
  }));
  
  formData.append('tags', 'web development,react,nodejs,mongodb');

  // Multiple service images
  // In React Native:
  // const image1 = await ImagePicker.launchImageLibraryAsync();
  // const image2 = await ImagePicker.launchImageLibraryAsync();
  // formData.append('images', { uri: image1.uri, name: 'service1.jpg', type: 'image/jpeg' });
  // formData.append('images', { uri: image2.uri, name: 'service2.jpg', type: 'image/jpeg' });

  const response = await fetch('http://localhost:5000/api/services', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  return await response.json();
};
```

**Response**:
```json
{
  "success": true,
  "message": "Service created successfully",
  "service": {
    "_id": "service123",
    "provider": {
      "_id": "user123",
      "name": "Jane Doe",
      "profileId": "janedoe_official",
      "profileImage": "/uploads/profiles/jane.jpg",
      "isVerified": false
    },
    "title": "Professional Web Development",
    "description": "Full-stack web development services using modern technologies like React, Node.js, and MongoDB.",
    "category": "Software Development",
    "pricing": {
      "type": "hourly",
      "minPrice": 1500,
      "maxPrice": 3000,
      "currency": "INR"
    },
    "location": {
      "type": "both",
      "address": {
        "street": "123 Tech Street",
        "city": "New Delhi",
        "state": "Delhi",
        "country": "India",
        "zipCode": "110001"
      }
    },
    "images": [
      "/uploads/services/service1-1678901234567.jpg",
      "/uploads/services/service2-1678901234568.jpg"
    ],
    "tags": ["web development", "react", "nodejs", "mongodb"],
    "rating": {
      "average": 0,
      "count": 0
    },
    "createdAt": "2024-01-15T12:00:00Z"
  }
}
```

#### Add Service Review
**API Endpoint**: `POST /api/services/:id/review`

**Request Body (JSON)**:
```json
{
  "rating": 5,
  "comment": "Excellent service! Very professional and delivered on time."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Review added successfully",
  "rating": {
    "average": 4.8,
    "count": 15
  }
}
```

### 7. Advertisements APIs

#### Create Advertisement
**API Endpoint**: `POST /api/advertisements`

**FormData Request Example (JavaScript)**:
```javascript
const createAdvertisementWithFormData = async (token) => {
  const formData = new FormData();

  // Text fields
  formData.append('title', 'Premium Fitness App');
  formData.append('description', 'Get fit with our AI-powered personal trainer app. Download now!');
  formData.append('link', 'https://fitnessapp.com/download');
  formData.append('type', 'banner');
  formData.append('priority', '5');
  
  formData.append('targetAudience', JSON.stringify({
    ageRange: { min: 18, max: 45 },
    interests: ['fitness', 'health', 'wellness'],
    location: {
      countries: ['India'],
      states: ['Delhi', 'Mumbai', 'Bangalore'],
      cities: ['New Delhi', 'Mumbai', 'Bangalore']
    }
  }));
  
  formData.append('budget', JSON.stringify({
    type: 'cpm',
    amount: 50,
    currency: 'INR'
  }));
  
  formData.append('schedule', JSON.stringify({
    startDate: '2024-01-15T00:00:00Z',
    endDate: '2024-02-15T23:59:59Z',
    timezone: 'Asia/Kolkata'
  }));

  // Advertisement image
  // In React Native:
  // const adImage = await ImagePicker.launchImageLibraryAsync();
  // formData.append('image', { uri: adImage.uri, name: 'ad.jpg', type: 'image/jpeg' });

  const response = await fetch('http://localhost:5000/api/advertisements', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  return await response.json();
};
```

**Response**:
```json
{
  "success": true,
  "message": "Advertisement created successfully",
  "advertisement": {
    "_id": "ad123",
    "title": "Premium Fitness App",
    "description": "Get fit with our AI-powered personal trainer app. Download now!",
    "image": "/uploads/advertisements/ad-1678901234567.jpg",
    "link": "https://fitnessapp.com/download",
    "type": "banner",
    "targetAudience": {
      "ageRange": { "min": 18, "max": 45 },
      "interests": ["fitness", "health", "wellness"],
      "location": {
        "countries": ["India"],
        "states": ["Delhi", "Mumbai", "Bangalore"]
      }
    },
    "budget": {
      "type": "cpm",
      "amount": 50,
      "currency": "INR"
    },
    "schedule": {
      "startDate": "2024-01-15T00:00:00Z",
      "endDate": "2024-02-15T23:59:59Z",
      "timezone": "Asia/Kolkata"
    },
    "metrics": {
      "impressions": 0,
      "clicks": 0,
      "conversions": 0,
      "spend": 0
    },
    "status": "draft",
    "priority": 5,
    "createdAt": "2024-01-15T13:00:00Z"
  }
}
```

#### Record Advertisement Click
**API Endpoint**: `POST /api/advertisements/:id/click`

**Request Body**: No body required

**Response**:
```json
{
  "success": true,
  "message": "Click recorded successfully",
  "redirectUrl": "https://fitnessapp.com/download"
}
```

## 🔗 Complete API Endpoints List

### Authentication
- `POST /api/auth/send-otp` - Send OTP to phone number
- `POST /api/auth/verify-otp` - Verify OTP and authenticate
- `GET /api/auth/me` - Get current user info

### Users
- `GET /api/users/search` - Search users
- `GET /api/users/suggestions` - Get suggested users
- `GET /api/users/profile` - Get current user profile
- `GET /api/users/:profileId` - Get user profile by profileId
- `PUT /api/users/profile` - Update profile (FormData)
- `POST /api/users/:profileId/follow` - Follow/unfollow user
- `GET /api/users/:profileId/posts` - Get user posts

### Posts
- `POST /api/posts` - Create new post (FormData)
- `GET /api/posts/feed` - Get home feed
- `GET /api/posts/trending` - Get trending posts
- `GET /api/posts/:id` - Get single post
- `POST /api/posts/:id/like` - Like/unlike post
- `POST /api/posts/:id/share` - Share post
- `DELETE /api/posts/:id` - Delete post

### Comments
- `POST /api/comments` - Create comment (JSON)
- `GET /api/comments/post/:postId` - Get post comments
- `GET /api/comments/:commentId/replies` - Get comment replies
- `POST /api/comments/:id/like` - Like/unlike comment
- `PUT /api/comments/:id` - Update comment (JSON)
- `DELETE /api/comments/:id` - Delete comment

### Stories
- `POST /api/stories` - Create story (FormData)
- `GET /api/stories/feed` - Get stories feed
- `GET /api/stories/my` - Get user's stories
- `GET /api/stories/user/:profileId` - Get user stories
- `POST /api/stories/:id/view` - View story
- `GET /api/stories/:id/viewers` - Get story viewers
- `DELETE /api/stories/:id` - Delete story

### Services
- `POST /api/services` - Create service (FormData)
- `GET /api/services` - Get all services
- `GET /api/services/trending` - Get trending services
- `GET /api/services/my` - Get user's services
- `GET /api/services/:id` - Get single service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service
- `POST /api/services/:id/review` - Add review (JSON)

### Advertisements
- `POST /api/advertisements` - Create advertisement (FormData)
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
  education: String,
  interests: [String],
  dateOfBirth: Date,
  country: String,
  state: String,
  district: String,
  tahsil: String,
  village: String,
  website: String,
  followers: [ObjectId],
  following: [ObjectId],
  followersCount: Number,
  followingCount: Number,
  postsCount: Number,
  isVerified: Boolean,
  isActive: Boolean
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
  location: {
    name: String,
    coordinates: { latitude: Number, longitude: Number }
  },
  visibility: String (enum: 'public', 'private'),
  commentsEnabled: Boolean,
  isActive: Boolean
}
```

### Story Model
```javascript
{
  author: ObjectId,
  media: {
    type: String (image/video),
    url: String,
    thumbnail: String
  },
  caption: String,
  views: [{
    user: ObjectId,
    viewedAt: Date
  }],
  viewsCount: Number,
  isActive: Boolean,
  expiresAt: Date (24 hours from creation)
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
- Use FormData for file uploads (posts, stories, services, advertisements, profile images)
- Use JSON for text-only requests (comments, reviews, authentication)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.