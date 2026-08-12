import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    watch: {
      // db.json은 json-server가 매 요청마다 다시 쓰는 런타임 데이터 파일이다. 프로젝트 루트
      // 안에 있어 기본적으로 Vite의 감시 대상에 포함되는데, E2E 테스트처럼 짧은 시간에 여러
      // 번 쓰기가 몰리면 그때마다 브라우저 전체 새로고침이 발동해 화면의 React 상태(선택된
      // 노트 등)가 날아가는 원인이 됐다. 프론트엔드 소스가 아니므로 감시에서 제외한다.
      ignored: ['**/db.json'],
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test-setup.ts',
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
