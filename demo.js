const CQHttp = require('./');

const bot = new CQHttp({
    apiRoot: 'http://127.0.0.1:5700/',
    accessToken: '123',
    secret: 'abc'
});

const SUPERUSER = 123456;

const msg_cb = bot.on('message', context => {
    bot('send_msg', {
        ...context,
        message: '哈喽～\n你发了：' + context.message
    });

    // 下面演示运行中删除事件回调
    if (context.user_id === SUPERUSER && context.message === 'delete callback') {
        bot.delete('message', msg_cb);
    }
});

bot.on('notice', context => {
    if (context.notice_type === 'group_increase') {
        // 处理群成员添加事件
        bot('get_group_member_info', {
            group_id: context.group_id,
            user_id: context.user_id
        }).then(data => {
            const name = data.nickname || '新人';
            bot('send_group_msg_async', {
                group_id: context.group_id,
                message: `欢迎${name}～`
            }).catch(err => { });
        }).catch(err => {
            console.log(err);
        });
    }
    // 忽略其它事件
});

bot.on('request', context => {
    if (context.request_type === 'group') {
        // 处理加群请求
        if (context.message !== 'some-secret') {
            return { approve: false, reason: '口令不对' };
        }
        return { approve: true };
    }
    // 忽略其它类型的请求
});

console.log('Start listening at http://127.0.0.1:8080/')
bot.listen(8080, '127.0.0.1');
