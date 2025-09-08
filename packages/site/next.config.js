/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

const nextConfig = {
  output: 'export',                  // enables static export
  distDir: 'out',                    // put the files in ./out
  images: { unoptimized: true },     // needed for export
  basePath: isProd ? '/farewell' : '',
  assetPrefix: isProd ? '/farewell/' : '',
  trailingSlash: true
}

module.exports = nextConfig
