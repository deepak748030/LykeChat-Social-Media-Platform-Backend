const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const createUploadDirs = () => {
  const dirs = [
    'uploads',
    'uploads/profiles',
    'uploads/posts',
    'uploads/stories',
    'uploads/services',
    'uploads/advertisements'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

createUploadDirs();

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    
    // Determine upload path based on route
    if (req.route.path.includes('profile')) {
      uploadPath += 'profiles/';
    } else if (req.route.path.includes('post')) {
      uploadPath += 'posts/';
    } else if (req.route.path.includes('story')) {
      uploadPath += 'stories/';
    } else if (req.route.path.includes('service')) {
      uploadPath += 'services/';
    } else if (req.route.path.includes('advertisement')) {
      uploadPath += 'advertisements/';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedVideoTypes = /mp4|avi|mov|wmv|flv|webm|mkv/;
  
  const extension = path.extname(file.originalname).toLowerCase();
  const mimetype = file.mimetype;

  // Check file type
  if (mimetype.startsWith('image/') && allowedImageTypes.test(extension)) {
    cb(null, true);
  } else if (mimetype.startsWith('video/') && allowedVideoTypes.test(extension)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files per request
  }
});

// Upload middleware for different scenarios
const uploadMiddleware = {
  // Single image upload (for profile pictures)
  single: (fieldName) => upload.single(fieldName),
  
  // Multiple files upload (for posts)
  multiple: (fieldName, maxCount = 10) => upload.array(fieldName, maxCount),
  
  // Mixed upload (for services with multiple images)
  fields: (fields) => upload.fields(fields)
};

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 50MB.'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum 10 files allowed.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected field name in upload.'
      });
    }
  }
  
  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
};

module.exports = {
  uploadMiddleware,
  handleUploadError
};