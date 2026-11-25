// Storybook 설정: 화면 부품과 디자인 토큰 카탈로그 (npm run storybook)
/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx)'],
  addons: ['@storybook/addon-docs'],
  framework: { name: '@storybook/react-vite', options: {} },
  // vite.config.js의 API 플러그인은 서버를 켠다 → Storybook에서는 뺀다
  viteFinal(config) {
    config.plugins = (config.plugins ?? []).flat().filter((p) => p?.name !== 'app-api')
    return config
  },
}
export default config
