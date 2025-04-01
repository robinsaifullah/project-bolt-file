import { BunConfig } from 'bun';

const config: BunConfig = {
  entry: './src/main.tsx',
  outdir: './dist',
  target: 'browser',
  minify: true,
  sourcemap: 'external',
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
  plugins: [
    {
      name: 'react',
      setup(build) {
        build.onResolve({ filter: /\.(tsx|jsx)$/ }, (args) => {
          return { path: args.path, namespace: 'react' };
        });
      },
    },
  ],
  dependencies: {
    '@supabase/supabase-js': '^2.39.3',
    'axios': '^1.6.7',
    'ccxt': '^4.2.15',
    'decimal.js': '^10.4.3',
    'ethers': '^6.11.1',
    'http-proxy-agent': '^7.0.2',
    'https-proxy-agent': '^7.0.4',
    'immer': '^10.0.3',
    'lucide-react': '^0.344.0',
    'react': '^18.2.0',
    'react-dom': '^18.2.0',
    'react-error-boundary': '^4.0.13',
    'socks-proxy-agent': '^8.0.2',
    'swr': '^2.2.5',
    'web-vitals': '^3.5.2',
    'web3': '^4.5.0',
    'ws': '^8.16.0',
    'zustand': '^4.5.1'
  },
  devDependencies: {
    '@types/node': '^20.11.19',
    '@types/react': '^18.2.55',
    '@types/react-dom': '^18.2.19',
    '@types/ws': '^8.5.10',
    'autoprefixer': '^10.4.18',
    'postcss': '^8.4.35',
    'tailwindcss': '^3.4.1'
  }
};

export default config;