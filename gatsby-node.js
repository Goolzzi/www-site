const path = require('path')

exports.createPages = ({ boundActionCreators, graphql }) => {
  const { createPage } = boundActionCreators

  return graphql(`
    {
      allMarkdownRemark(sort: { order: DESC, fields: [frontmatter___date] }, limit: 1000) {
        edges {
          node {
            excerpt(pruneLength: 400)
            html
            id
            frontmatter {
              contentType
              path
              date
              title
            }
          }
        }
      }
    }
  `).then(result => {
    if (result.errors) {
      return Promise.reject(result.errors)
    }
    result.data.allMarkdownRemark.edges.forEach(({ node }) => {
      createPage({
        path: node.frontmatter.path,
        component: path.resolve(`src/templates/${String(node.frontmatter.contentType)}.js`),
        context: {} // additional data can be passed via context
      })
    })
  })
}

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const { cssModulesConfig } = require('gatsby-1-config-css-modules');

exports.modifyWebpackConfig = ({ config, stage }) => {
  const sassFiles = /\.s[ac]ss$/;
  const sassModulesFiles = /\.module\.s[ac]ss$/;
  const sassLoader = `sass?${JSON.stringify({
    includePaths: path.resolve(path.resolve(), '../open/src/'),
  })}`;

  const extractText = new ExtractTextPlugin('styles.css', { allChunks: true });

  switch (stage) {
    case 'develop': {
      config.loader('sass', {
        test: sassFiles,
        exclude: sassModulesFiles,
        loaders: ['style', 'css', sassLoader],
      });

      config.loader('sassModules', {
        test: sassModulesFiles,
        loaders: ['style', cssModulesConfig(stage), sassLoader],
      });

      return config;
    }
    case 'build-css': {
      config.loader('sass', {
        test: sassFiles,
        exclude: sassModulesFiles,
        loader: ExtractTextPlugin.extract(['css?minimize', sassLoader]),
      });

      config.loader('sassModules', {
        test: sassModulesFiles,
        loader: ExtractTextPlugin.extract('style', [
          cssModulesConfig(stage),
          sassLoader,
        ]),
      });

      config._config.plugins.splice(1, 1, extractText);

      return config;
    }
    case 'develop-html':
    case 'build-html':
    case 'build-javascript': {
      config.loader('sass', {
        test: sassFiles,
        exclude: sassModulesFiles,
        loader: 'null',
      });

      config.loader('sassModules', {
        test: sassModulesFiles,
        loader: ExtractTextPlugin.extract('style', [
          cssModulesConfig(stage),
          sassLoader,
        ]),
      });

      return config;
    }
    default: {
      return config;
    }
  }
};