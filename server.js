require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const root = __dirname;
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json' };

function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function body(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', c => raw += c);
    req.on('end', () => {
      try { resolve(JSON.parse(raw || '{}')); } catch { reject(); }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  try {
    if (url.pathname === '/api/register' && req.method === 'POST') {
      const { name, email, password, role = 'user' } = await body(req);
      if (!name || !email || !password) return send(res, 400, { error: 'Please complete all required fields.' });
      const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (existing) return send(res, 409, { error: 'This email is already registered.' });
      const user = await prisma.user.create({
        data: { name, email: email.toLowerCase(), password, role },
      });
      return send(res, 201, { user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }

    if (url.pathname === '/api/login' && req.method === 'POST') {
      const { email, password } = await body(req);
      const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
      if (!user || user.password !== password) {
        return send(res, 401, { error: 'Invalid email or password.' });
      }
      return send(res, 200, { user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }

    if (url.pathname === '/api/reports' && req.method === 'GET') {
      const reports = await prisma.report.findMany({ orderBy: { createdAt: 'desc' } });
      return send(res, 200, { reports });
    }

    if (url.pathname === '/api/reports' && req.method === 'POST') {
      const { type, otherType, location, priority, description, reporter } = await body(req);
      const finalType = type === 'Other' ? otherType : type;
      if (!finalType || !location || !priority || !description) {
        return send(res, 400, { error: 'Please complete all report details.' });
      }
      if (type === 'Other' && finalType.trim().length < 3) {
        return send(res, 400, { error: 'Custom problem type must have at least 3 characters.' });
      }
      const report = await prisma.report.create({
        data: {
          type: finalType.trim(),
          location: location.trim(),
          priority,
          description: description.trim(),
          status: 'Submitted',
          reporter,
        },
      });
      return send(res, 201, { report });
    }

    // PATCH /api/reports/:id  (update status)
    const reportMatch = url.pathname.match(/^\/api\/reports\/([^/]+)$/);
    if (reportMatch && req.method === 'PATCH') {
      const id = reportMatch[1];
      const { status } = await body(req);
      if (!status) return send(res, 400, { error: 'Status is required.' });
      const updated = await prisma.report.update({
        where: { id },
        data: { status },
      });
      return send(res, 200, { report: updated });
    }

    // static files
    const file = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
    const resolved = path.resolve(root, file);
    if (!resolved.startsWith(root)) throw new Error('Blocked');
    fs.readFile(resolved, (err, content) => {
      if (err) { res.writeHead(404); return res.end('Not found'); }
      res.writeHead(200, { 'Content-Type': types[path.extname(resolved)] || 'text/plain' });
      res.end(content);
    });
  } catch (e) {
    console.error(e);
    send(res, 400, { error: 'Invalid request.' });
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`UrbanPulse running at http://localhost:${PORT}`));