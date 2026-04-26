/**
 * Cloudinary Upload Service
 * Drop-in replacement for Multer local storage.
 * Usage: const url = await uploadToCloudinary(buffer, folder, publicId);
 */
const https  = require('https');
const crypto = require('crypto');

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY    = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

/**
 * Upload a Buffer or base64 string to Cloudinary.
 * @param {Buffer|string} fileData - Raw buffer or base64 data URI
 * @param {string}        folder   - Cloudinary folder (e.g. 'avatars')
 * @param {string}        [publicId] - Optional stable public ID
 * @returns {Promise<{ url: string; publicId: string }>}
 */
async function uploadToCloudinary(fileData, folder = 'samarpan', publicId) {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) {
    throw new Error('[Cloudinary] Missing env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();

  // Build signature
  const sigData = publicId
    ? `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`
    : `folder=${folder}&timestamp=${timestamp}${API_SECRET}`;
  const signature = crypto.createHash('sha1').update(sigData).digest('hex');

  // Encode file
  const base64 = Buffer.isBuffer(fileData)
    ? `data:image/webp;base64,${fileData.toString('base64')}`
    : fileData;

  // Build form body
  const params = new URLSearchParams({
    file:      base64,
    folder,
    timestamp,
    api_key:   API_KEY,
    signature,
    ...(publicId ? { public_id: publicId } : {}),
  });

  return new Promise((resolve, reject) => {
    const body = params.toString();
    const options = {
      hostname: 'api.cloudinary.com',
      path:     `/v1_1/${CLOUD_NAME}/image/upload`,
      method:   'POST',
      headers: {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.error) return reject(new Error(json.error.message));
          resolve({ url: json.secure_url, publicId: json.public_id });
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

/**
 * Delete an asset from Cloudinary by public ID.
 */
async function deleteFromCloudinary(publicId) {
  if (!CLOUD_NAME || !API_KEY || !API_SECRET) return;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = crypto.createHash('sha1')
    .update(`public_id=${publicId}&timestamp=${timestamp}${API_SECRET}`)
    .digest('hex');

  const body = new URLSearchParams({ public_id: publicId, timestamp, api_key: API_KEY, signature }).toString();
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.cloudinary.com',
      path:     `/v1_1/${CLOUD_NAME}/image/destroy`,
      method:   'POST',
      headers:  { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
    };
    const req = https.request(options, (res) => {
      let d = ''; res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
    });
    req.on('error', reject); req.write(body); req.end();
  });
}

module.exports = { uploadToCloudinary, deleteFromCloudinary };
