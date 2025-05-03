import https from 'https';

export function getCoins(path) {
  const BASE_URL = 'https://api.coingecko.com/api/v3';

  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Node.js script)',
        Accept: 'application/json',
      },
    };

    https
      .get(`${BASE_URL}${path}`, options, (res) => {
        let data = '';

        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 100)}`));
          }

          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(
              new Error(`Failed to parse JSON: ${e.message} | Response: ${data.slice(0, 100)}`)
            );
          }
        });
      })
      .on('error', (err) => reject(new Error(`HTTP Request Failed: ${err.message}`)));
  });
}
