import { authenticate } from '../_lib/auth.js';
import { deleteMarca } from '../_lib/r2.js';

export default async function handler(req, res) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const user = await authenticate(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id } = req.query;

  try {
    await deleteMarca(id);
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Error deleting marca:', err);
    res.status(500).json({ error: 'Failed to delete marca' });
  }
}
