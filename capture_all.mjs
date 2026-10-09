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
    if (!page) {
      throw new Error('Page target not found');
    }

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

    await new Promise((resolve) => {
      ws.onopen = resolve;
    });

    function call(method, params = {}) {
      return new Promise((resolve) => {
        const id = idCounter++;
        pending.set(id, resolve);
        ws.send(JSON.stringify({ id, method, params }));
      });
    }

    // Set high-res viewport
    await call('Emulation.setDeviceMetricsOverride', {
      width: 1600,
      height: 1000,
      deviceScaleFactor: 1,
      mobile: false,
    });

    // 1. Capture Hero
    console.log('1. Capturing Hero Section...');
    await sleep(1000);
    const heroShot = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('d:\\3d_web\\first_project\\final_hero.png', Buffer.from(heroShot.data, 'base64'));

    // 2. Scroll to Spiral Gallery
    console.log('2. Scrolling to Arsenal Helix...');
    await call('Runtime.evaluate', {
      expression: `
        document.getElementById('services-arsenal').scrollIntoView({ behavior: 'instant' });
        window.scrollBy(0, 350);
      `,
    });
    await sleep(2000);
    const spiralShot1 = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('d:\\3d_web\\first_project\\final_spiral_start.png', Buffer.from(spiralShot1.data, 'base64'));

    // 3. Scroll mid-way through Spiral Gallery
    console.log('3. Scrolling to Arsenal Helix Mid-Flight...');
    await call('Runtime.evaluate', {
      expression: `
        window.scrollBy(0, 850);
      `,
    });
    await sleep(1500);
    const spiralShot2 = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('d:\\3d_web\\first_project\\final_spiral_mid.png', Buffer.from(spiralShot2.data, 'base64'));

    // 4. Scroll to Operatives Showcase
    console.log('4. Scrolling to Operatives Section...');
    await call('Runtime.evaluate', {
      expression: `
        document.getElementById('operatives').scrollIntoView({ behavior: 'instant' });
      `,
    });
    await sleep(1500);
    const opShot = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('d:\\3d_web\\first_project\\final_operatives.png', Buffer.from(opShot.data, 'base64'));

    // 5. Scroll to Synapse Raid & Footer
    console.log('5. Scrolling to Synapse Raid & Footer...');
    await call('Runtime.evaluate', {
      expression: `
        document.getElementById('synapse-raid').scrollIntoView({ behavior: 'instant' });
      `,
    });
    await sleep(1500);
    const raidShot = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('d:\\3d_web\\first_project\\final_synapse_raid.png', Buffer.from(raidShot.data, 'base64'));

    console.log('ALL SCREENSHOTS CAPTURED SUCCESSFULLY!');
    ws.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    edge.kill();
  }
}

run();
