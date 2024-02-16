import esbuild from 'esbuild';

const buildDirectory = 'dist';
const production = process.env.NODE_ENV === 'production';

const entryPoints = ['src/*.ts', 'src/pages/*.ts'];

/**
 * Default Settings
 * @type {esbuild.BuildOptions}
 */
const defaultSettings = {
  bundle: true,
  outdir: buildDirectory,
  minify: true,
  sourcemap: !production,
  target: production ? 'es2017' : 'esnext',
  entryPoints,
};

if (production) {
  esbuild.build(defaultSettings);
} else {
  let ctx = await esbuild.context(defaultSettings);

  let { port } = await ctx.serve({
    servedir: buildDirectory,
    port: 3000,
  });

  console.log(`Serving at http://localhost:${port}`);
}