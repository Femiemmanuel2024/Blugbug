module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.vue$': '@vue/vue3-jest',
    '^.+\\.tsx?$': 'ts-jest'
  },
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'vue'],
  transformIgnorePatterns: ['<rootDir>/node_modules/']
}
