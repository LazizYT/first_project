import { spawn } from 'child_process';
import fs from 'fs';

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function run() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=1600,1000',
    'http://localhost:3000/',
  ]);

  try {
    await sleep(4000);

    const res = await fetch('http://127.0.0.1:9222/json/list');
    const list = await res.json();
    const page = list.find((t) => t.type === 'page' && t.url.includes('3000'));
    if (!page) throw new Error('Page target not found');

    const ws = new WebSocket(page.webSocketDebuggerUrl);
    let idCounter = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.id && pending.has(data.id)) {
        pending.get(data.id)(data.result);
        pending.delete(data.id);
      }
    };

    await new Promise((r) => (ws.onopen = r));

    function call(method, params = {}) {
      return new Promise((resolve) => {
        const id = idCounter++;
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    await call('Emulation.setDeviceMetricsOverride', {
      width: 1600,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // Scroll to start of sword section
    console.log('Scrolling to Arsenal Helix start...');
    await call('Runtime.evaluate', {
      expression: `
        document.getElementById('services-arsenal').scrollIntoView({ behavior: 'instant' });
      `,
    });
    await sleep(1500);

    const shot1 = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('d:\\3d_web\\first_project\\sword_start_fixed.png', Buffer.from(shot1.data, 'base64'));
    console.log('Saved sword_start_fixed.png');

    // Scroll 500px down
    console.log('Scrolling down 500px...');
    await call('Runtime.evaluate', {
      expression: `
        window.scrollBy(0, 500);
      `,
    });
    await sleep(1500);

    const shot2 = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('d:\\3d_web\\first_project\\sword_mid_fixed.png', Buffer.from(shot2.data, 'base64'));
    console.log('Saved sword_mid_fixed.png');

    // Scroll another 700px down
    console.log('Scrolling down 700px more...');
    await call('Runtime.evaluate', {
      expression: `
        window.scrollBy(0, 700);
      `,
    });
    await sleep(1500);

    const shot3 = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('d:\\3d_web\\first_project\\sword_deep_fixed.png', Buffer.from(shot3.data, 'base64'));
    console.log('Saved sword_deep_fixed.png');

    ws.close();
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    edge.kill();
  }
}

run();
