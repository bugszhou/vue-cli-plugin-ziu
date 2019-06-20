const path = require('path'),
  fs = require('fs'),
  glob = require('glob'),
  YAML = require('yaml'),
  cloneDeep = require('lodash/cloneDeep'),
  merge = require('lodash/merge');
/**
 * 环境变量支持yaml
 * @param api
 * @param projectOptions
 */
module.exports = (api, projectOptions) => {
  const envCwd = path.join(process.cwd(), 'config'),
    globConfig = {
      cwd: envCwd,
      root: '/',
    },
    PRJ_ENV = process.env.PRJ_ENV || process.env.NODE_ENV || 'production',
    defaultEnvFileGlob = glob.sync('default.*(yaml|yml)', globConfig);

  if (!defaultEnvFileGlob.length) {
    throw new Error(`config dir must include default.yml or default.yaml`);
  }

  const defaultEnv = getEnvData(defaultEnvFileGlob[0], envCwd),
    envFile = glob.sync(`${PRJ_ENV}.*(yaml|yml)`, globConfig),
    env = getEnvData(envFile[0], envCwd),
    envMergeData = merge({
      PRJ_ENV,
    }, defaultEnv, env);

  api.chainWebpack(webpackConfig => {
    // 通过 webpack-chain 修改 webpack 配置
    webpackConfig
      .plugin('define')
      .tap(envData => {
        let env = envData[0]['process.env'],
          args = cloneDeep(envData);
        if (!env) {
          env = {
            NODE_ENV: 'production',
            BASE_URL: '/',
          };
        }
        args[0]['process.env'] = {
          ...env,
          ENV_DATA: JSON.stringify(envMergeData),
        };
        return args;
      })
  });
};

function getEnvData(url = '', envCwd = process.cwd()) {
  if (!url) {
    return {};
  }
  return YAML.parse(fs.readFileSync(path.join(envCwd, url || ''), 'utf8'));
}
