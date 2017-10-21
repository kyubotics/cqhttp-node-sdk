'use strict';

const Callable = require('./callable');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser')
const route = require('koa-route');
const crypto = require('crypto');
const axios = require('axios');

module.exports = class CQHttp extends Callable {
    constructor({ api_root, access_token, secret }) {
        super('__call__');
        if (api_root) {
            this.api_client = axios.create({
                baseURL: api_root,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': access_token ? `Token ${access_token}` : undefined
                }
            });
        }

        this.secret = secret;
        this.app = new Koa();
        this.app.use(bodyParser());
        this.app.use(route.post('/', this.handle.bind(this)));
        this.callbacks = { message: [], event: [], request: [] };
    }

    handle (ctx) {
        if (this.secret) {
            // check signature
            ctx.assert(ctx.request.headers['x-signature'] !== undefined, 401);
            const hmac = crypto.createHmac('sha1', this.secret);
            hmac.update(ctx.request.rawBody);
            const sig = hmac.digest('hex');
            ctx.assert(ctx.request.headers['x-signature'] === `sha1=${sig}`, 403);
        }

        ctx.assert(ctx.request.body.post_type !== undefined, 400);

        let result = {};
        const callbacks = this.callbacks[ctx.request.body.post_type];
        if (callbacks) {
            for (const cb of callbacks) {
                // only the result of the last callback matters
                const res = cb(ctx.request.body);
                if (res) {
                    result = res;
                }
            }
        }
        ctx.response.body = JSON.stringify(result);
    }

    on (post_type, callback) {
        this.callbacks[post_type].push(callback);
    }

    __call__ (action, params = {}) {
        if (this.api_client) {
            return this.api_client.post(`/${action}`, params).then(response => {
                let err = { status: response.status };
                if (response.status === 200) {
                    const data = response.data;
                    if (data.status === 'failed') {
                        err.retcode = data.retcode;
                        return Promise.reject(err);
                    }
                    return Promise.resolve(data.data);
                } else {
                    return Promise.reject(err);
                }
            });
        }
    }

    listen (...args) {
        this.app.listen(...args);
    }
}
