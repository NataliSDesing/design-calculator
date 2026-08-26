/// <reference types="vite/client" />

declare module '*.css' {
  const content: string;
  export default content;
}

declare module '@tailwindcss/vite' {
  import { Plugin } from 'vite';
  const plugin: () => Plugin;
  export default plugin;
}
