/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval'
                https://www.google.com
                https://www.gstatic.com
                https://apis.google.com
                https://www.recaptcha.net
                https://www.gstatic.com/recaptcha
                https://checkout.razorpay.com;
              style-src 'self' 'unsafe-inline';
              connect-src 'self'
                http://localhost:5000
                http://127.0.0.1:5000
                https://www.google.com
                https://www.gstatic.com
                https://identitytoolkit.googleapis.com
                https://securetoken.googleapis.com
                https://apis.google.com
                https://yeah-lo-fe541.firebaseapp.com
                https://yelo-backend-r5pu.onrender.com 
                https://api.razorpay.com
                https://lumberjack.razorpay.com
                https://*.razorpay.com;
              frame-src
                https://www.google.com
                https://recaptcha.google.com
                https://www.recaptcha.net
                https://www.gstatic.com
                https://yeah-lo-fe541.firebaseapp.com
                https://checkout.razorpay.com
                https://api.razorpay.com
                https://*.razorpay.com;
              img-src 'self' data:
                https://www.gstatic.com
                https://www.google.com
                https://accounts.google.com
                https://drive.google.com
                https://lh3.googleusercontent.com
                https://flagcdn.com
                https://i.pinimg.com
                https://images.unsplash.com;
            `.replace(/\s{2,}/g, " ").trim(),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
