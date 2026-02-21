import { authenticate } from '../_lib/auth.js';
import { uploadMarca } from '../_lib/r2.js';
import { randomUUID } from 'crypto';

export const config = {
  api: { bodyParser: { sizeLimit: '5mb' } },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await authenticate(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { image, contentType, name } = req.body || {};

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const type = contentType || 'image/jpeg';
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid image type.' });
    }

    const buffer = Buffer.from(image, 'base64');
    const id = randomUUID();
    const brandName = typeof name === 'string' ? name.trim().slice(0, 100) : '';
    const marca = await uploadMarca(id, buffer, type, brandName);
    res.status(201).json({ marca });
  } catch (err) {
    console.error('Error uploading marca:', err);
    res.status(500).json({ error: 'Failed to upload marca', detail: err.message });
  }
}
