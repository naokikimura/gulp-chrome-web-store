# gulp-chrome-web-store

[![npm version](https://badge.fury.io/js/gulp-chrome-web-store.svg)](https://badge.fury.io/js/gulp-chrome-web-store) [![Build Status](https://travis-ci.com/naokikimura/gulp-chrome-web-store.svg?branch=master)](https://travis-ci.com/naokikimura/gulp-chrome-web-store) [![Known Vulnerabilities](https://snyk.io/test/github/naokikimura/gulp-chrome-web-store/badge.svg?targetFile=package.json)](https://snyk.io/test/github/naokikimura/gulp-chrome-web-store?targetFile=package.json)

Upload and publish items to the Chrome Web Store with Gulp

## Installation

```sh
npm i -D gulp-chrome-web-store
```

## Configuration

Refer to [this page](https://developer.chrome.com/webstore/using_webstore_api) to get the response of credentials and access token.

Set that value in an environment variable.
- `CHROME_WEB_STORE_API_CREDENTIAL`
- `CHROME_WEB_STORE_API_ACCESS_TOKEN_RESPONSE`

For example:
```sh
export CHROME_WEB_STORE_API_CREDENTIAL=$( cat <<EOF | tr -d ' \r\n'
{
  "installed": {
    "client_id": "999999999999-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com",
    "project_id": "foo-bar-baz",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "abcdefghijklmnopqrstuvwx",
    "redirect_uris": [
      "urn:ietf:wg:oauth:2.0:oob",
      "http://localhost"
    ]
  }
}
EOF
)

export CHROME_WEB_STORE_API_ACCESS_TOKEN_RESPONSE=$(cat <<EOF | tr -d ' \r\n'
{
  "access_token": "vpvEyHWpX^{CQC`fREmnwCHb`ejN`ox^XxEbYDKXmghM`]lrL{ddTrxdgtgLEvAeX\oP]NkRgjFcvNE_enJZI`BNcvZScQOA\BAA|NSzB_Xg_ie_yXLrQ[sII_]r|jW{nzZULNP",
  "expires_in": 3599,
  "refresh_token": "riM{R[Lir|hyHT|DNeWZhQzVpOjvTbTMayHZdfNFlR{TB]KFSh^DyjNZySyj|aWYajb]dNCIRTZXmKKuB`bbUyoLRGkPWao|pibdNSk",
  "scope": "https://www.googleapis.com/auth/chromewebstore",
  "token_type": "Bearer"
}
EOF
)
```
## Usage

For example:

```js
const gulp = require('gulp')
const chromeWebStore = require('gulp-chrome-web-store')(
    process.env.CHROME_WEB_STORE_API_CREDENTIAL,
    process.evn.CHROME_WEB_STORE_API_ACCESS_TOKEN_RESPONSE,
);
const itemId = 'ID of your Chrome extension';
const item = chromeWebStore.item(itemId);

exports.deploy = () => {
    return gulp.src('your-chrome-extension.zip')
        .pipe(item.upload());
}

exports.publish = () => {
    return item.publish();
}
```
