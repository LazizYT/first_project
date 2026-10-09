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

  // Scroll to services-arsenal
  await call('Runtime.evaluate', {
    expression: `
      document.getElementById('services-arsenal').scrollIntoView({ behavior: 'instant' });
      window.scrollBy(0, 600);
    `,
  });
  await new Promise((r) => setTimeout(r, 800));

  const testResult = await call('Runtime.evaluate', {
    expression: `
      (() => {
        const cards = document.querySelectorAll('.spiral-card');
        return JSON.stringify({
          count: cards.length,
          card0Style: cards[0] ? cards[0].getAttribute('style') : null,
          card0CSS: cards[0] ? cards[0].style.cssText : null,
          spiralCardsContainer: document.querySelector('.spiral-cards-container')?.innerHTML.length
        });
      })()
    `,
    returnByValue: true,
  });
  console.log('Cards DOM check:', testResult.result.value);

  ws.close();
  edge.kill();
}

run();
