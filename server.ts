import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // In-memory / cache fallback for intermediate redirects on server-side
  // Seed initial codes for server-side HTTP 302 redirects
  const serverCodes: Record<
    string,
    {
      name: string;
      destinationUrl: string;
      type: string;
      status: string;
      expiresAt?: string;
      schedules?: Array<{
        name: string;
        destinationUrl: string;
        startDate: string;
        endDate: string;
      }>;
    }
  > = {
    SUMMER26: {
      name: 'Summer Refresh Drinks Menu',
      destinationUrl: 'https://example.com/menu/summer-refresh',
      type: 'qr',
      status: 'active'
    },
    'NFC-839271': {
      name: 'Table 04 Contactless Order Tag',
      destinationUrl: 'https://example.com/order?table=4&session=live',
      type: 'nfc',
      status: 'active'
    },
    '839271': {
      name: 'Table 04 Contactless Order Tag',
      destinationUrl: 'https://example.com/order?table=4&session=live',
      type: 'nfc',
      status: 'active'
    },
    'BAR-109283': {
      name: 'Single Origin Arabica Beans 250g',
      destinationUrl: 'https://example.com/products/arabica-single-origin',
      type: 'barcode',
      status: 'active'
    },
    '109283': {
      name: 'Single Origin Arabica Beans 250g',
      destinationUrl: 'https://example.com/products/arabica-single-origin',
      type: 'barcode',
      status: 'active'
    },
    'NFC-VIP09': {
      name: 'Keynote Speaker VIP Access Badge',
      destinationUrl: 'https://example.com/events/vip-networking-schedule',
      type: 'nfc',
      status: 'active'
    },
    VIP09: {
      name: 'Keynote Speaker VIP Access Badge',
      destinationUrl: 'https://example.com/events/vip-networking-schedule',
      type: 'nfc',
      status: 'active'
    },
    FEEDBACK: {
      name: 'Customer Satisfaction Survey',
      destinationUrl: 'https://example.com/feedback/q3-customer-pulse',
      type: 'qr',
      status: 'active'
    },
    SPRING26: {
      name: 'Past Seasonal Spring Menu (Archived)',
      destinationUrl: 'https://example.com/menu/spring-past',
      type: 'qr',
      status: 'expired',
      expiresAt: '2026-06-01T00:00:00Z'
    }
  };

  // Safe redirect helper
  function handleIntermediateRedirect(
    req: Request,
    res: Response,
    type: 'qr' | 'nfc' | 'barcode',
    uniqueId: string
  ) {
    const cleanId = uniqueId.trim();
    // Look up code
    let code = serverCodes[cleanId] || serverCodes[cleanId.toUpperCase()];
    if (!code) {
      // Try with type prefix
      const prefixed = `${type.toUpperCase()}-${cleanId}`;
      code = serverCodes[prefixed];
    }

    // If client requested JSON
    if (req.headers.accept?.includes('application/json')) {
      if (!code) {
        return res.status(404).json({ error: 'Code not found', uniqueId });
      }
      return res.json({ uniqueId, ...code });
    }

    // If not found in server cache, forward to client-side SPA which has the full reactive indexedDB / localStorage / Firestore store
    if (!code) {
      return res.redirect(`/#/${type}/${encodeURIComponent(uniqueId)}`);
    }

    // Check expiration
    if (code.expiresAt && new Date() > new Date(code.expiresAt)) {
      return res.status(410).send(renderStatusHtml('expired', code.name, cleanId));
    }

    // Check status
    if (code.status === 'disabled') {
      return res.status(403).send(renderStatusHtml('disabled', code.name, cleanId));
    }
    if (code.status === 'expired') {
      return res.status(410).send(renderStatusHtml('expired', code.name, cleanId));
    }

    // Safe URL check
    const dest = code.destinationUrl;
    if (!dest.startsWith('http://') && !dest.startsWith('https://')) {
      return res.status(400).send(renderStatusHtml('unsafe', code.name, cleanId));
    }

    // HTTP 302 Redirect
    return res.redirect(302, dest);
  }

  // PRD §7 Redirect Engine endpoints
  app.get('/q/:unique_id', (req, res) => {
    handleIntermediateRedirect(req, res, 'qr', req.params.unique_id);
  });

  app.get('/n/:unique_id', (req, res) => {
    handleIntermediateRedirect(req, res, 'nfc', req.params.unique_id);
  });

  app.get('/b/:unique_id', (req, res) => {
    handleIntermediateRedirect(req, res, 'barcode', req.params.unique_id);
  });

  // Health check API
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      service: 'LinkTag Redirect Engine',
      timestamp: new Date().toISOString()
    });
  });

  // HTML Status Template for Inactive/Expired Links (PRD §7 & §4.11)
  function renderStatusHtml(status: string, codeName: string, id: string): string {
    const isExpired = status === 'expired';
    const isUnsafe = status === 'unsafe';
    const title = isExpired
      ? 'Link Expired'
      : isUnsafe
      ? 'Blocked Unsafe Link'
      : 'Link Temporarily Disabled';
    const message = isExpired
      ? 'This campaign reached its scheduled expiration date.'
      : isUnsafe
      ? 'The destination URL contains an unverified or unsafe scheme.'
      : 'The link owner has temporarily paused this destination.';

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — LinkTag</title>
  <style>
    body { background: #020617; color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 16px; }
    .card { background: #0f172a; border: 1px solid #1e293b; border-radius: 16px; padding: 32px; max-width: 420px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); }
    .badge { display: inline-block; padding: 4px 12px; font-size: 11px; font-weight: 600; font-family: monospace; border-radius: 9999px; background: ${isExpired ? '#f43f5e20' : '#e2e8f010'}; color: ${isExpired ? '#fb7185' : '#94a3b8'}; border: 1px solid ${isExpired ? '#f43f5e40' : '#334155'}; margin-bottom: 16px; }
    h1 { font-size: 20px; font-weight: 700; margin: 0 0 8px; letter-spacing: -0.025em; }
    p { font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 0 0 24px; }
    .meta { background: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 12px; font-size: 12px; font-family: monospace; color: #cbd5e1; margin-bottom: 24px; word-break: break-all; }
    a.btn { display: inline-block; background: #4f46e5; color: white; padding: 10px 20px; font-size: 13px; font-weight: 600; text-decoration: none; border-radius: 8px; transition: background 0.2s; }
    a.btn:hover { background: #4338ca; }
    .footer { font-size: 10px; color: #64748b; font-family: monospace; margin-top: 24px; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">${status.toUpperCase()}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    <div class="meta">Code ID: ${id}</div>
    <a href="/" class="btn">Return to LinkTag Dashboard</a>
    <div class="footer">LinkTag Enterprise Redirect Architecture</div>
  </div>
</body>
</html>`;
  }

  // Dev mode: Mount Vite middleware
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production: serve built static assets
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`LinkTag server running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start LinkTag server:', err);
});
