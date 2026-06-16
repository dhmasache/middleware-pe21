import type { JestConfigWithTsJest } from 'ts-jest';

const jestConfig: JestConfigWithTsJest = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    // Resuelve de inmediato las importaciones que terminan en '.js' apuntando a tus archivos '.ts'
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'node16', // Evita el error de resolución obsoleto (node10)
          verbatimModuleSyntax: false,
          ignoreDeprecations: '6.0'    // Silencia por completo la advertencia TS5107
        },
      },
    ],
  },
};

export default jestConfig;