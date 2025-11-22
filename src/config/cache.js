const NodeCache = require('node-cache');

// Create cache instances for different types of data
const userCache = new NodeCache({ 
  stdTTL: parseInt(process.env.CACHE_TTL) || 3600, // 1 hour
  checkperiod: 600 // Check for expired keys every 10 minutes
});

const postCache = new NodeCache({ 
  stdTTL: 1800, // 30 minutes
  checkperiod: 300 // Check for expired keys every 5 minutes
});

const storyCache = new NodeCache({ 
  stdTTL: 86400, // 24 hours (stories expire in 24 hours)
  checkperiod: 3600 // Check for expired keys every hour
});

const serviceCache = new NodeCache({ 
  stdTTL: 7200, // 2 hours
  checkperiod: 600 
});

const adCache = new NodeCache({ 
  stdTTL: 3600, // 1 hour
  checkperiod: 300 
});

// Cache utility functions
const cacheUtils = {
  // Generate cache keys
  generateKey: (prefix, ...args) => {
    return `${prefix}:${args.join(':')}`;
  },

  // Get cache stats
  getStats: () => {
    return {
      user: userCache.getStats(),
      post: postCache.getStats(),
      story: storyCache.getStats(),
      service: serviceCache.getStats(),
      ad: adCache.getStats()
    };
  },

  // Clear all caches
  clearAll: () => {
    userCache.flushAll();
    postCache.flushAll();
    storyCache.flushAll();
    serviceCache.flushAll();
    adCache.flushAll();
  }
};

module.exports = {
  userCache,
  postCache,
  storyCache,
  serviceCache,
  adCache,
  cacheUtils
};