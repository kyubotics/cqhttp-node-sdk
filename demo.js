const CQHttp = require('./');

const bot = new CQHttp({
    api_root: 'http://127.0.0.1:5700/',
    access_token: '123',
    secret: 'abc'
});

bot.on('message', context => {
    bot('send_msg', {
        ...context,
        message: '哈喽～'
    });
});

bot.on('event', context => {
    if (context.event === 'group_increase') {
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

bot.listen(8080);
