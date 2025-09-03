import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { ImageAnnotatorClient } from '@google-cloud/vision';

// Node.js'in 'http' isteğinin gövdesini (body) okumak için bir yardımcı fonksiyon
// Vite'ın geliştirme sunucusunda Express gibi dahili bir body-parser olmadığı için bu gereklidir.
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error("Geçersiz JSON formatı."));
      }
    });
    req.on('error', reject);
  });
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // .env dosyasındaki ortam değişkenlerini Node.js tarafında güvenli bir şekilde yükle
  // 'process.cwd()' projenin kök dizinini belirtir. '' ön eki tüm değişkenleri yükler.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      {
        name: 'google-cloud-vision-proxy',
        configureServer(server) {
          // '/api/ocr' adresine gelen istekleri dinleyecek bir middleware (aracı yazılım) oluştur
          server.middlewares.use('/api/ocr', async (req, res, next) => {
            // Sadece POST metoduna izin ver
            if (req.method !== 'POST') {
              return next(); // Eğer POST değilse, işlemi Vite'ın diğer middleware'lerine devret
            }

            try {
              // Google Cloud Vision istemcisini, .env'den yüklediğimiz hizmet hesabı bilgileriyle başlat
              const client = new ImageAnnotatorClient({
                credentials: {
                  client_email: env.GOOGLE_CLIENT_EMAIL,
                  private_key: env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // .env'deki \n karakterlerini gerçek satır sonuna çevir
                }
              });

              // Frontend'den gelen isteğin gövdesini oku
              const { image } = await readBody(req);
              if (!image) {
                res.statusCode = 400;
                return res.end(JSON.stringify({ message: "Resim verisi (image) bulunamadı." }));
              }
              
              // Base64 başlığını temizle
              const base64Image = image.replace(/^data:image\/\w+;base64,/, '');

              // Google'a gönderilecek isteği hazırla
              const request = {
                image: { content: base64Image },
                features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
              };
              
              // İsteği gönder ve sonucu al
              const [result] = await client.documentTextDetection(request);
              const text = result.fullTextAnnotation?.text || '';

              // Başarılı sonucu JSON olarak frontend'e gönder
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ text }));

            } catch (error) {
              console.error("Cloud Vision Proxy Hatası:", error);
              res.statusCode = 500;
              res.end(JSON.stringify({ message: 'Cloud Vision API çağrılırken sunucu hatası oluştu.', error: error.message }));
            }
          });
        },
      },
    ],
    // Senin orijinal ayarını koruyoruz
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});