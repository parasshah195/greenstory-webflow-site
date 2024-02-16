# Green Story Webflow Site
This GitHub project provides a development workflow for JavaScript files in Green Story Webflow site. In essence, it uses esbuild to start a development server on [localhost:3000](http://localhost:3000) to build and serve any working file. However, once pushed up and merged into a version tagged branch, the production code will be loaded from [jsDelivr CDN](https://www.jsdelivr.com/). 

## Install
### Prerequisites
- Have node 16 and npm installed locally, recommended approach is through [NVM](https://github.com/nvm-sh/nvm)

### Setup
- Using node 16 and npm run `npm install`


## Usage
### Output
The project will process and output the files mentioned in the `entryPoints` const of `./bin/build.js` file. The output minified files will be in the `./dist` folder. 

Note: The setup won't automatically clean up deleted files that already exist in the `./dist` folder.

### Development
1. Whilst working locally, run `npm run dev` to start a development server on [localhost:3000](http://localhost:3000)
2. Add scripts to the Webflow site global settings/page-level, as required, by adding the script path to the `window.JS_SCRIPTS` set. The system will auto-load localhost script when available, else serve from production. **Do not include `/src` in the file path.**
   
    ```html
    <script>
        window.JS_SCRIPTS.add('{FILE_PATH_1}');
        window.JS_SCRIPTS.add('{FILE_PATH_2}');
    </script>
    ```
4. As changes are made to the code locally and saved, the [localhost:3000](http://localhost:3000) will then serve those files
5. The initial `entry.js` file needs to be made available via server first for this system to work (in the `<head>` area of the site).
   
   ```html
    <script src="https://cdn.jsdelivr.net/gh/parasshah195/greenstory-webflow-site/dist/entry.js"></script>
    ```

#### Debugging
There is an opt-in debugging setup that turns on logs in the console. The preference can be toggled via browser console, and is stored in browser localStorage.

- Add any console logs in the code using the `window.DEBUG` function. It's a `console.log` wrapper. There is also a `window.IS_DEBUG_MODE` variable to run conditions on
- Execute `window.setDebugMode(true)` in the console to turn on Debug mode. After reload, the console will start showing code logs.
- To turn it off, execute `window.setDebugMode(false)` in the console.

### Production
1. Run `pnpm build` to generate the production files in `./dist` folder
2. To push code to production, tag a version (follow [semver](https://semver.org/)) and push to GitHub. Once pushed, the production code will be auto loaded from [jsDelivr CDN](https://www.jsdelivr.net/).

[JSDelivr CDN Purge URL](https://www.jsdelivr.com/tools/purge)

#### jsDelivr Notes & Caveats
- Direct jsDelivr links directly use semver tagged releases when available, else falls back to the master branch [[info discussion link](https://github.com/jsdelivr/jsdelivr/issues/18376#issuecomment-1046876129)]
- Tagged version branches are purged every 12 hours from their servers [[info discussion link](https://github.com/jsdelivr/jsdelivr/issues/18376#issuecomment-1046918481)]
- To manually purge a tagged version's files, wait for 10 minutes after pushing the tag [[info discussion link](https://github.com/jsdelivr/jsdelivr/issues/18376#issuecomment-1047040896)]