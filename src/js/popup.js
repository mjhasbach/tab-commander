$(function() {
    var popup = {
        blockDomain: {
            current: function() {
                this.go({current: true});
            },
            others: function() {
                this.go({others: true});
            },
            go: function(opt, cb) {
                if (!_.isObject(opt)) {
                    throw new TypeError('opt must be an object');
                }

                common.page.getCurrentActive(function(tab) {
                    var storage = {};

                    if (opt.current) {
                        storage.blockedDomains = {add: tab.domain};
                    }

                    if (opt.others) {
                        storage.allowedDomain = tab.domain;
                    }

                    common.storage.update(storage, function() {
                        if (opt.current) {
                            common.page.goToBlockPage({url: tab.url, blocked: tab.domain});
                        }

                        if (_.isFunction(cb)) { cb(); }

                        window.close();
                    });
                });
            }
        },
        hideTabs: {
            current: function() {
                this.go({current: true});
            },
            others: function() {
                this.go({others: true});
            },
            currentDomain: function() {
                this.go({currentDomain: true});
            },
            otherDomains: function() {
                this.go({otherDomains: true});
            },
            go: function(opt, cb) {
                if (!_.isObject(opt)) {
                    throw new TypeError('opt must be an object');
                }

                common.page.getCurrentActive(function(tab) {
                    chrome.tabs.query({}, function(tabs) {
                        var storage = {tabs: {add: []}},
                            done = function(err) {
                                if (err) { throw err; }
                                if (_.isFunction(cb)) { cb(); }
                                window.close();
                            };

                        tabs = _.filter(tabs, function(iterTab) {
                            var domain = common.page.removeSubdomainFromHostname(new URL(iterTab.url).hostname);

                            return ((iterTab.id === tab.id && opt.current) ||
                                (iterTab.id !== tab.id && opt.others) ||
                                (domain === tab.domain && opt.currentDomain) ||
                                (domain !== tab.domain && opt.otherDomains))
                                && !common.page.isChrome(iterTab.url)
                        });

                        if (tabs.length) {
                            _.each(tabs, function(tab) {
                                storage.tabs.add.push([tab.title, tab.url, tab.pinned]);
                            });

                            common.storage.update(storage, function() {
                                async.each(
                                    tabs,
                                    function(tab, next) {
                                        chrome.tabs.remove(tab.id, function() {
                                            next();
                                        });
                                    },
                                    done
                                );
                            });
                        }
                        else { done(); }
                    });
                });
            }
        },
        bindEvents: function() {
            $('#blockOtherDomains').click(function() {
                popup.blockDomain.others();
            });

            $('#blockThisDomain').click(function() {
                popup.blockDomain.current();
            });

            $('#hideThisTab').click(function() {
                popup.hideTabs.current();
            });

            $('#hideOtherTabs').click(function() {
                popup.hideTabs.others();
            });

            $('#hideCurrentDomain').click(function() {
                popup.hideTabs.currentDomain();
            });

            $('#hideOtherDomains').click(function() {
                popup.hideTabs.otherDomains();
            });

            $('#manageHiddenTabs').click(function() {
                chrome.tabs.create({url: common.page.extension.hidden});
            });

            $('#removeAllData').click(function() {
                //todo warning prompt
                common.storage.update({}, function() {
                    window.close();
                });
            });
        }
    };

    popup.bindEvents();
});