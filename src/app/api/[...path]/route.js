import { createApiRouter } from '../../../../server/api.js';

// Vercel runs the Next app without the custom Express entrypoint. Reuse the
// same MVP router through a small Node runtime adapter so every existing REST
// action remains available in the deployed app.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const io = {
  emit() {},
};
const router = createApiRouter(io);

async function dispatch(request, context) {
  const url = new URL(request.url);
  const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.json().catch(() => ({}));
  const headers = Object.fromEntries(request.headers.entries());

  const routerPath = `${url.pathname.replace(/^\/api(?=\/|$)/, '') || '/'}${url.search}`;
  const req = {
    method: request.method,
    url: routerPath,
    originalUrl: `${url.pathname}${url.search}`,
    headers,
    body,
    query: Object.fromEntries(url.searchParams.entries()),
    path: routerPath.split('?')[0],
    get(name) {
      return headers[name.toLowerCase()];
    },
  };

  return new Promise((resolve) => {
    const responseHeaders = new Headers({ 'content-type': 'application/json; charset=utf-8' });
    let statusCode = 200;
    let settled = false;
    const finish = (payload = '') => {
      if (settled) return;
      settled = true;
      resolve(new Response(payload, { status: statusCode, headers: responseHeaders }));
    };
    const res = {
      status(code) {
        statusCode = code;
        return this;
      },
      json(payload) {
        finish(JSON.stringify(payload));
        return this;
      },
      send(payload) {
        finish(typeof payload === 'string' ? payload : JSON.stringify(payload));
        return this;
      },
      end(payload = '') {
        finish(payload);
      },
      setHeader(name, value) {
        responseHeaders.set(name, Array.isArray(value) ? value.join(', ') : String(value));
      },
      getHeader() {
        return undefined;
      },
      removeHeader() {},
      headersSent: false,
    };

    router.handle(req, res, () => finish(JSON.stringify({ success: false, message: 'Not found' })));
  });
}

export async function GET(request, context) {
  return dispatch(request, context);
}

export async function POST(request, context) {
  return dispatch(request, context);
}

export async function PATCH(request, context) {
  return dispatch(request, context);
}
