export default {
  transform: {
    '^.+\\.js$': ['babel-jest', { presets: ['@babel/preset-env'] }],
  },
  extensionsToTreatAsEsm: [],
  testEnvironment: 'node',
  moduleNameMapper: {
   '^(.+)\.js$': '$1',
  },
};
