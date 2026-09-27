import path from 'path';
import { createServer as createViteServer } from 'vite';
import { createApp } from './server/app.js';
import { runMigrations } from './server/database/migrator.js';

const PORT = 3000;

async function startServer() {
  const app = createApp();

  // Attempt database migrations in background if database URL is configured
  if (process.env.DATABASE_URL || process.env.SQL_HOST) {
    runMigrations().catch((err) => {
      console.warn('Initial migration skipped or deferred:', err.message);
    });
  }

  // Vite middleware for development vs static build for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use((await import('express')).default.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartShopX Central Authority Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
