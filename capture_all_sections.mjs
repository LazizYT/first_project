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

    // 1. Screenshot Sword section
    console.log('Capturing Sword section...');
    await call('Runtime.evaluate', {
      expression: `
        document.getElementById('services-arsenal').scrollIntoView({ behavior: 'instant' });
      `,
    });
    await sleep(1500);
    const shotSword = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('d:\\3d_web\\first_project\\screenshot_sword_inverted.png', Buffer.from(shotSword.data, 'base64'));

    // 2. Screenshot Operatives section
    console.log('Capturing Operatives section...');
    await call('Runtime.evaluate', {
      expression: `
        document.getElementById('operatives').scrollIntoView({ behavior: 'instant' });
      `,
    });
    await sleep(1500);
    const shotOps = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('d:\\3d_web\\first_project\\screenshot_operatives_interactive.png', Buffer.from(shotOps.data, 'base64'));

    // 3. Screenshot Cyber Forge section
    console.log('Capturing Cyber Forge section...');
    await call('Runtime.evaluate', {
      expression: `
        document.getElementById('cyber-forge').scrollIntoView({ behavior: 'instant' });
      `,
    });
    await sleep(1500);
    const shotForge = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('d:\\3d_web\\first_project\\screenshot_cyber_forge.png', Buffer.from(shotForge.data, 'base64'));

    // 4. Screenshot Synapse Raid section
    console.log('Capturing Synapse Raid section...');
    await call('Runtime.evaluate', {
      expression: `
        document.getElementById('synapse-raid').scrollIntoView({ behavior: 'instant' });
      `,
    });
    await sleep(1500);
    const shotRaid = await call('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync('d:\\3d_web\\first_project\\screenshot_synapse_raid.png', Buffer.from(shotRaid.data, 'base64'));

    console.log('All screenshots captured successfully!');
    ws.close();
  } catch (err) {
    console.error('Error during test:', err);
  } finally {
    edge.kill();
  }
}

run();
