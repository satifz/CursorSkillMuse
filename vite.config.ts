import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { apiMiddleware } from "./server/api-middleware.js";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    // Add API middleware plugin - MUST run first to catch /api/* routes
    {
      name: 'api-middleware',
      enforce: 'pre', // Run before other plugins
      configureServer(server) {
        console.log('='.repeat(60));
        console.log('[Vite Config] 🔧 Registering API middleware...');
        console.log('='.repeat(60));
        
        try {
          // Initialize middleware
          const middleware = apiMiddleware();
          console.log('[Vite Config] Middleware function created');
          
          // Create handler that logs every request
          const apiHandler = (req, res, next) => {
            // Log ALL requests to verify middleware is being called
            console.log(`[Vite Middleware] 🔍 Intercepting: ${req.method} ${req.url}`);
            
            // Special logging for API routes
            if (req.url.startsWith('/api/')) {
              console.log(`[Vite Middleware] 🎯 API ROUTE DETECTED: ${req.method} ${req.url}`);
            }
            
            // Call the actual middleware
            return middleware(req, res, next);
          };
          
          // Register middleware
          server.middlewares.use(apiHandler);
          
          console.log('[Vite Config] ✅ API middleware registered successfully');
          console.log('[Vite Config] Middleware stack:', server.middlewares.stack?.length || 'unknown', 'handlers');
          console.log('='.repeat(60));
        } catch (error) {
          console.error('='.repeat(60));
          console.error('[Vite Config] ❌ CRITICAL ERROR registering API middleware:');
          console.error(error);
          console.error('='.repeat(60));
          throw error;
        }
      }
    }
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
