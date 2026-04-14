/**
 * Compatibility Service
 * 
 * Provides mapping functions to ensure that PostgreSQL/Prisma objects
 * are backward-compatible with a frontend designed for MongoDB/Mongoose.
 */

function mapId(obj) {
  if (!obj) return obj;
  if (Array.isArray(obj)) return obj.map(mapId);
  
  // Clone to avoid mutating the original Prisma object
  const mapped = { ...obj };
  
  // Add _id alias for id
  if (mapped.id && !mapped._id) {
    mapped._id = mapped.id;
  }
  
  // Handle Quiz-specific mappings (authorId -> author)
  if (mapped.authorId !== undefined && mapped.author === undefined) {
    mapped.author = mapped.authorId;
  }

  // Handle nested objects if they exist (recursively map included relations)
  if (mapped.quiz && typeof mapped.quiz === 'object') mapped.quiz = mapId(mapped.quiz);
  if (mapped.author && typeof mapped.author === 'object') mapped.author = mapId(mapped.author);
  if (mapped.user && typeof mapped.user === 'object') mapped.user = mapId(mapped.user);
  if (mapped.host && typeof mapped.host === 'object') mapped.host = mapId(mapped.host);

  return mapped;
}

module.exports = {
  mapId
};
