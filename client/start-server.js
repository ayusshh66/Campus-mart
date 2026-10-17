import { createServer } from 'vite';

async function start() {
  try {
    const server = await createServer({
      configFile: './vite.config.ts',
      server: { port: 5173, host: 'localhost' }
    });
    await server.listen();
    server.printUrls();
  } catch (e) {
    console.error('Failed to start Vite server:', e);
    process.exit(1);
  }
}

start();
