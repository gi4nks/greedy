import { createApp } from './src/app';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

function startServer() {
  try {
    const app = createApp();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
