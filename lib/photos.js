'use strict';

const crypto = require('crypto')



function JSONToPhotoURL(img, size = 'c') {
  const { id, secret, server, farm } = img

  return `https://farm${farm}.staticflickr.com/${server}/${id}_${secret}_${size}.jpg`
}

//function signedAPIRequest(params, secret, verb = 'GET', apiUrl='https://api.flickr.com/services/rest/') {
//  const paramList = Object.entries(params).map(e => encodeURIComponent(e[0])+'='+encodeURIComponent(e[1]))
//  paramList.sort();
//
//  let base = [
//    verb,
//    apiUrl,
//    paramString.join('&')
//  ].join('&')
//
//  let hmacKey = key + "&" + (secret ? secret : ''),
//      hmac = crypto.createHmac("SHA1", hmacKey);
//  hmac.update(data);
//
//  encodeURIComponent( hmac.digest("base64") );
//}

module.exports = {
  JSONToPhotoURL
}
