'use strict';

const Callable = require('./callable');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser')
const route = require('koa-route');
const crypto = require('crypto');
const axios = require('axios');

module.exports = class CQHttp extends Callable {
    constructor({ apiRoot, accessToken, secret }) {
        super('__call__');
        if (apiRoot) {
            const headers = { 'Content-Type': 'application/json' }
            if (accessToken) headers['Authorization'] = `Token ${accessToken}`;
            this.apiClient = axios.create({ baseURL: apiRoot, headers: headers });
        }

        this.secret = secret;
        this.app = new Koa();
        this.app.use(bodyParser());
        this.app.use(route.post('/', this.handle.bind(this)));
        this.callbacks = { message: [], event: [], notice: [], request: [] };
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
	
    delete (post_type,index) {
        this.callbacks[post_type].splice(index,1);
    }

    __call__ (action, params = {}) {
        if (this.apiClient) {
            return this.apiClient.post(`/${action}`, params).then(response => {
                let err = {
                    status: response.status
                };
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
