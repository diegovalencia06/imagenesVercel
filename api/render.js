const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Solo POST');

  // Protección: solo tu n8n puede usar el servicio
  if (process.env.RENDER_SECRET && req.headers['x-secret'] !== process.env.RENDER_SECRET) {
    return res.status(401).send('No autorizado');
  }

  const { html, width = 1080, height = 1920 } = req.body || {};
  if (!html) return res.status(400).send('Falta html');

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: 'shell',
      defaultViewport: { width, height, deviceScaleFactor: 1 }
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 25000 });
    await page.evaluate(() => document.fonts.ready);

    const png = await page.screenshot({
      type: 'png',
      clip: { x: 0, y: 0, width, height }
    });

    res.setHeader('Content-Type', 'image/png');
    res.status(200).send(png);
  } catch (e) {
    res.status(500).send(String(e));
  } finally {
    if (browser) await browser.close();
  }
};
