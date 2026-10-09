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
    '--disable-gpu',
    '--window-size=1600,1000',
    'about:blank',
  ]);

  try {
    await sleep(1500);

    // Get list of targets
    const res = await fetch('http://127.0.0.1:9222/json/list');
    const targets = await res.json();
    const target = targets[0];
    console.log('Target found:', target.id);

    const ws = new WebSocket(target.webSocketDebuggerUrl);

    let id = 1;
    const pending = new Map();

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && pending.has(msg.id)) {
        pending.get(msg.id)(msg.result);
        pending.delete(msg.id);
      }
    };

    await new Promise((resolve) => {
      ws.onopen = resolve;
    });

    function send(method, params = {}) {
      return new Promise((resolve) => {
        const curId = id++;
        pending.set(curId, resolve);
        ws.send(JSON.stringify({ id: curId, method, params }));
      });
    }

    console.log('Connected to CDP. Enabling Page & Runtime...');
    await send('Page.enable');
    await send('Runtime.enable');

    console.log('Navigating to http://localhost:3000/ ...');
    await send('Page.navigate', { url: 'http://localhost:3000/' });

    // Wait 4.5 seconds for Three.js, Oni Samurai GLB, and Sword GLB to load and preloader to dismiss
    console.log('Waiting for 3D assets to load...');
    await sleep(4500);

    // 1. Hero Screenshot
    console.log('Capturing Hero screenshot...');
    const shot1 = await send('Page.captureScreenshot', { format: 'png' });
    if (shot1 && shot1.data) {
      fs.writeFileSync('d:\\3d_web\\first_project\\hero_live.png', Buffer.from(shot1.data, 'base64'));
      console.log('Saved hero_live.png');
    }

    // 2. Scroll to Arsenal / 3D Spiral Gallery
    console.log('Scrolling to Arsenal Helix...');
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('services-arsenal').scrollIntoView({ behavior: 'instant' });
        window.scrollBy(0, 400);
      `,
    });
    await sleep(1500);

    const shot2 = await send('Page.captureScreenshot', { format: 'png' });
    if (shot2 && shot2.data) {
      fs.writeFileSync('d:\\3d_web\\first_project\\spiral_gallery_live.png', Buffer.from(shot2.data, 'base64'));
      console.log('Saved spiral_gallery_live.png');
    }

    // 3. Scroll deeper in spiral gallery
    console.log('Scrolling further down in spiral gallery...');
    await send('Runtime.evaluate', {
      expression: `
        window.scrollBy(0, 900);
      `,
    });
    await sleep(1500);

    const shot2b = await send('Page.captureScreenshot', { format: 'png' });
    if (shot2b && shot2b.data) {
      fs.writeFileSync('d:\\3d_web\\first_project\\spiral_gallery_mid_live.png', Buffer.from(shot2b.data, 'base64'));
      console.log('Saved spiral_gallery_mid_live.png');
    }

    // 4. Scroll to Operatives Showcase
    console.log('Scrolling to Operatives Showcase...');
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('operatives').scrollIntoView({ behavior: 'instant' });
      `,
    });
    await sleep(1200);

    const shot3 = await send('Page.captureScreenshot', { format: 'png' });
    if (shot3 && shot3.data) {
      fs.writeFileSync('d:\\3d_web\\first_project\\operatives_live.png', Buffer.from(shot3.data, 'base64'));
      console.log('Saved operatives_live.png');
    }

    // 5. Scroll to Synapse Raid & Pre-reg
    console.log('Scrolling to Synapse Raid...');
    await send('Runtime.evaluate', {
      expression: `
        document.getElementById('synapse-raid').scrollIntoView({ behavior: 'instant' });
      `,
    });
    await sleep(1200);

    const shot4 = await send('Page.captureScreenshot', { format: 'png' });
    if (shot4 && shot4.data) {
      fs.writeFileSync('d:\\3d_web\\first_project\\synapse_raid_live.png', Buffer.from(shot4.data, 'base64'));
      console.log('Saved synapse_raid_live.png');
    }

    ws.close();
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    edge.kill();
  }
}

run();
