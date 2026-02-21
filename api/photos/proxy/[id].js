import { getPhotoStream } from '../../_lib/r2.js';

export default async function handler(req, res) {
  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Photo ID required' });
  }

  try {
    const result = await getPhotoStream(id);
    if (!result) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const { Body, contentType } = result;
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const chunks = [];
    for await (const chunk of Body) {
      chunks.push(chunk);
    }
    res.send(Buffer.concat(chunks));
  } catch (err) {
    console.error('Error proxying DelRey photo:', err);
    res.status(500).json({ error: 'Failed to load photo' });
  }
}
