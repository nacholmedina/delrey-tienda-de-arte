import { listMarcas } from '../_lib/r2.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const marcas = await listMarcas();
    res.status(200).json({ marcas });
  } catch (err) {
    console.error('Error listing marcas:', err);
    res.status(500).json({ error: 'Failed to list marcas' });
  }
}
