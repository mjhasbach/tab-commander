$(function() {
    var blockedTab = {
        $unblock: $('<div>').addClass('unblock').text('Click here'),
        bindUnblock: function(url, storageUpdate) {
            blockedTab.$unblock.click(function() {
                common.storage.update(storageUpdate, function() {
                    common.page.getCurrentActive(function(tab) {
                        chrome.tabs.create({url: url, index: tab.index}, function() {
                            chrome.tabs.remove(tab.id);
                        });
                    });
                });
            });

            return blockedTab;
        },
        appendMessage: function(text) {
            $('body').append(
                $('<div>').addClass('message')
                    .append($('<div>').addClass('prefix').text(text))
                    .append(blockedTab.$unblock)
                    .append($('<div>').addClass('suffex').text('to remove this restriction and continue to the blocked URL.'))
            );

            return blockedTab;
        },
        render: function() {
            var url = common.page.getUrlParam('url'),
                allowed = common.page.getUrlParam('allowed'),
                blocked = common.page.getUrlParam('blocked');

            if (_.isString(url)) {
                var text = 'The URL ' + url + ' was blocked because ';

                if (_.isString(allowed)) {
                    text += allowed + ' is the only allowed domain.';

                    blockedTab.bindUnblock(url, {allowedDomain: ''}).appendMessage(text);
                }
                else if (_.isString(blocked)) {
                    text += blocked + ' is a blocked domain.';

                    blockedTab.bindUnblock(url, {blockedDomains: {remove: blocked}}).appendMessage(text);
                }
                else {
                    throw new TypeError('Either msg.allowed or msg.blocked must be a string');
                }
            }
            else {
                throw new TypeError('msg.url must be a string');
            }
        }
    };

    blockedTab.render();
});