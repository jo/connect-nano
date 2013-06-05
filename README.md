# connect-nano [![Build Status](https://secure.travis-ci.org/jo/connect-nano.png?branch=master)](http://travis-ci.org/jo/connect-nano)

Provide [`req.nano`](https://github.com/dscape/nano), passing session cookies to CouchDB and back again.

## Getting Started
Install the module with: `npm install connect-nano`

```javascript
var connect = require('connect');
var nano = require('connect-nano');

var app = connect()
  .use(connect.cookieParser())  // connect-nano depends on cookieParser
  .use(nano('http://localhost:5984'))
  .use('/login', function(req, res) {
    req.pipe(req.nano.request({
      method: 'post',
      path: '_session',
      content_type: 'application/x-www-form-urlencoded; charset=utf-8'
    })).pipe(res);
  })
  .use('/session', function(req, res) {
    req.nano.request({ path: '_session' }).pipe(res);
  })
  .use('/me', function(req, res) {
    req.nano.request({ path: '_session' }, function(err, data) {
      if (err) {
        return res.end(err);
      }
      req.nano.use('_users').get('org.couchdb.user:' + data.userCtx.name).pipe(res);
    });
  })
  .listen(3000);
```

## Options
connect-nano passes configuration directly over to `nano()`,
see [nano configuration](https://github.com/dscape/nano#configuration).

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style.
Add unit tests for any new or changed functionality.
Lint and test your code using [Grunt](http://gruntjs.com/).

## License
Copyright (c) 2013 null2 GmbH, Johannes J. Schmidt  
Licensed under the MIT license.
