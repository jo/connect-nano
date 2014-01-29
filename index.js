/*
 * connect-nano
 * https://github.com/jo/connect-nano
 *
 * Copyright (c) 2013 Johannes J. Schmidt
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function couch(config) {
  return function(req, res, next) {
    if (req.nano) {
      return next();
    }

    function setCookie(headers) {
      if (headers && headers['set-cookie'] && !res.getHeader('set-cookie')) {
        res.setHeader('Set-Cookie', headers['set-cookie']);
      }
    }

    function patch(obj) {
      var api = {};
      Object.keys(obj).forEach(function(key) {
        if (key === 'config') { 
          api.config = obj.config;
          return;
        }

        switch (typeof obj[key]) {
          case 'function':
            api[key] = function() {
              var args = Array.prototype.slice.call(arguments);
              var callback = args.pop();
              if (typeof callback === 'function') {
                return obj[key].apply(this, args.concat(function(err, data, headers) {
                  setCookie(headers);
                  callback.apply(this, [err, data, headers]);
                }));
              } 
              var ret = obj[key].apply(this, arguments);
              if (ret.__isRequestRequest) {
                ret.on('response', function(response) {
                  setCookie(response.headers);
                });
                return ret;
              }
              if (typeof ret === 'object') {
                return patch(ret);
              }
              return ret;
            };
            break;
          case 'object':
            api[key] = patch(obj[key]);
            break;
          default:
            api[key] = obj[key];
        }
      });
      return api;
    }

    var nano = require('nano')(config);
    if (req.cookies['AuthSession']) {
      nano.config.cookie = 'AuthSession=' + req.cookies['AuthSession'];
    }
    req.nano = patch(nano);

    next();
  };
};
