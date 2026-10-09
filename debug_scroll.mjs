import { spawn } from 'child_process';

async function run() {
  const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
  const edge = spawn(edgePath, [
    '--headless=new',
    '--remote-debugging-port=9222',
    '--window-size=1600,1000',
    'http://localhost:3000/',
  ]);

  await new Promise((r) => setTimeout(r, 3500));

  const res = await fetch('http://127.0.0.1:9222/json/list');
  const list = await res.json();
  const page = list.find((t) => t.type === 'page' && t.url.includes('3000'));
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

  // Check initial state
  const info1 = await call('Runtime.evaluate', {
    expression: `
      JSON.stringify({
        scrollY: window.scrollY,
        secTop: document.getElementById('services-arsenal').getBoundingClientRect().top,
        secHeight: document.getElementById('services-arsenal').offsetHeight,
        vpTop: document.querySelector('.spiral-sticky-viewport').getBoundingClientRect().top,
        vpPosition: window.getComputedStyle(document.querySelector('.spiral-sticky-viewport')).position,
        cardsCount: document.querySelectorAll('.spiral-card').length,
        canvasWidth: document.getElementById('sword-canvas-container')?.clientWidth,
        canvasHeight: document.getElementById('sword-canvas-container')?.clientHeight
      })
    `,
    returnByValue: true,
  });
  console.log('Initial state:', JSON.parse(info1.result.value));

  // Now scroll to services-arsenal
  await call('Runtime.evaluate', {
    expression: `
      document.getElementById('services-arsenal').scrollIntoView({ behavior: 'instant' });
    `,
  });
  await new Promise((r) => setTimeout(r, 600));

  const info2 = await call('Runtime.evaluate', {
    expression: `
      JSON.stringify({
        scrollY: window.scrollY,
        secTop: document.getElementById('services-arsenal').getBoundingClientRect().top,
        vpTop: document.querySelector('.spiral-sticky-viewport').getBoundingClientRect().top,
        firstCardTransform: document.querySelector('.spiral-card')?.style.transform,
        firstCardOpacity: document.querySelector('.spiral-card')?.style.opacity,
        firstCardZIndex: document.querySelector('.spiral-card')?.style.zIndex
      })
    `,
    returnByValue: true,
  });
  console.log('After scrollIntoView:', JSON.parse(info2.result.value));

  // Now scroll by 1000px
  await call('Runtime.evaluate', {
    expression: `
      window.scrollBy(0, 1000);
    `,
  });
  await new Promise((r) => setTimeout(r, 600));

  const info3 = await call('Runtime.evaluate', {
    expression: `
      JSON.stringify({
        scrollY: window.scrollY,
        secTop: document.getElementById('services-arsenal').getBoundingClientRect().top,
        vpTop: document.querySelector('.spiral-sticky-viewport').getBoundingClientRect().top,
        firstCardTransform: document.querySelector('.spiral-card')?.style.transform
      })
    `,
    returnByValue: true,
  });
  console.log('After scrollBy 1000:', JSON.parse(info3.result.value));

  ws.close();
  edge.kill();
}

run();
