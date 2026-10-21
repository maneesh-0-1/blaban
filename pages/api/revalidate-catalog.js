export default async function handler(req, res) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const secret = req.query.secret || req.body?.secret;
  const EXPECTED_SECRET = process.env.REVALIDATE_SECRET || 'blaban_edge_revalidate_2026';

  if (secret !== EXPECTED_SECRET) {
    return res.status(401).json({ message: 'Invalid revalidation secret token' });
  }

  try {
    const tag = req.query.tag || req.body?.tag;
    const tags = req.body?.tags || (tag ? [tag] : ['catalog', 'products', 'categories']);

    // Revalidate on-demand pages if any
    try {
      await res.revalidate?.('/');
    } catch (e) {}
    try {
      await res.revalidate?.('/home');
    } catch (e) {}

    return res.status(200).json({
      revalidated: true,
      tags: tags,
      timestamp: new Date().toISOString(),
      message: 'Catalog cache successfully purged on Vercel Edge',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
