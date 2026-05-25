const request = require('supertest');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
// Reset the on-disk store before loading the app so each suite is deterministic.
beforeAll(() => {
  if (fs.existsSync(DATA_DIR)) {
    for (const f of fs.readdirSync(DATA_DIR)) {
      if (f.endsWith('.json')) fs.unlinkSync(path.join(DATA_DIR, f));
    }
  }
});

const app = require('../src/server');

describe('API', () => {
  it('GET /api/health responds with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('POST /api/enhance returns enhanced text', async () => {
    const res = await request(app)
      .post('/api/enhance')
      .send({ text: '嗯你好' });
    expect(res.status).toBe(200);
    expect(res.body.enhanced).toBe('你好。');
  });

  it('POST /api/enhance rejects non-string text', async () => {
    const res = await request(app)
      .post('/api/enhance')
      .send({ text: 42 });
    expect(res.status).toBe(400);
  });

  it('POST /api/command returns parsed action', async () => {
    const res = await request(app)
      .post('/api/command')
      .send({ text: '换行' });
    expect(res.status).toBe(200);
    expect(res.body.command.action).toBe('NEWLINE');
  });

  it('hotwords full CRUD round-trip', async () => {
    await request(app).delete('/api/hotwords');
    const create = await request(app)
      .post('/api/hotwords')
      .send({ term: 'Kubernetes', aliases: ['k8s'] });
    expect(create.status).toBe(201);
    const id = create.body.id;

    const list = await request(app).get('/api/hotwords');
    expect(list.body).toHaveLength(1);
    expect(list.body[0].term).toBe('Kubernetes');

    const del = await request(app).delete(`/api/hotwords/${id}`);
    expect(del.status).toBe(204);

    const after = await request(app).get('/api/hotwords');
    expect(after.body).toHaveLength(0);
  });

  it('history endpoint stores and lists transcripts', async () => {
    await request(app).delete('/api/history');
    const create = await request(app).post('/api/history').send({ text: '你好世界' });
    expect(create.status).toBe(201);
    const list = await request(app).get('/api/history');
    expect(list.body).toHaveLength(1);
    expect(list.body[0].text).toBe('你好世界');
  });
});
