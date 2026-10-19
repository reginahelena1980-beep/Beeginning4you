import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import { app, checkFirestoreAvailability, syncScheduleSlots } from './src/server/app';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

export { app };

async function startServer() {
  // Verifica disponibilidade e permissões do Firestore
  const isAvailable = await checkFirestoreAvailability();

  // Sincronização inicial e mapeamento atômico de slots se Firestore estiver ativo
  if (isAvailable) {
    await syncScheduleSlots();
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ success: false, error: 'Endpoint da API não encontrado.' });
      }
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Bee-ginning 4 You] Servidor rodando na porta ${PORT}`);
  });
}

startServer();
