// Auto-generated shims for missing type declarations in this workspace
// Keeps IDE/TS happy when node_modules aren't installed in this environment

declare module 'react';
declare module 'react-dom/client';
declare module 'react/jsx-runtime';
declare module '@tanstack/react-query';
declare module 'framer-motion';
declare module 'recharts';
declare module 'lucide-react';
declare module 'clsx';
declare module 'date-fns';
declare module 'ethers';
declare module 'react-router-dom';
declare module 'tailwind-merge';
declare module 'uuid';
declare module 'zustand';
declare module 'axios';
declare module '@tailwindcss/vite';
declare module 'vite-plugin-singlefile';

interface ImportMetaEnv {
  readonly VITE_FINNHUB_API_KEY: string;
  // Add more environment variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.css';
declare module '*.svg';
declare module '*.png';
declare module '*.jpg';

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

export {};
