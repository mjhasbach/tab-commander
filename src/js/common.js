var common = {
    storageKey: 'tab-commander',
    page: {
        extension: {
            blocked: 'src/html/blockedURL.html',
            hidden: 'src/html/hiddenTabs.html'
        },
        chrome: {
            chrome: 'chrome://',
            devTools: 'chrome-devtools://',
            extension: 'chrome-extension://',
            newTab: 'newtab'
        },
        isChrome: function(url) {
            var isChromePage = false;

            _.each(this.chrome, function(page) {
                if (url.substring(0, page.length) === page) {
                    isChromePage = true;
                    return false;
                }
            });

            return isChromePage;
        },
        removeSubdomainFromHostname: function(hostname) {
            if (_.isString(hostname)) {
                var parts = hostname.split('.');

                if (parts.length > 2) {
                    parts.shift();
                    return parts.join('.');
                }
                else {
                    return hostname;
                }
            }
            else {
                throw new TypeError('hostname must be a string');
            }
        },
        getCurrentActive: function(cb) {
            chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
                var tab = {};

                if (!_.isEmpty(tabs)) {
                    var url = tabs[0].url;

                    tab = {
                        url: url,
                        index: tabs[0].index,
                        domain: common.page.removeSubdomainFromHostname(new URL(url).hostname),
                        id: tabs[0].id
                    }
                }

                cb(tab);
            });
        },
        getUrlParam: function(name) {
            if (_.isString(name)) {
                var url = window.location.search.substring(1);
                var params = url.split('&');
                for (var i = 0; i < params.length; i++) {
                    var param = params[i].split('=');
                    if (param[0] === name) {
                        return decodeURIComponent(param[1]);
                    }
                }
            }
            else {
                throw new TypeError('name must be a string');
            }
        },
        goToBlockPage: function(opt) {
            chrome.tabs.update(null, {url: common.page.extension.blocked + '?' + $.param(opt)});
        }
    },
    storage: {
        init: function(storage) {
            if (_.isObject(storage)) {
                var _storage = storage[common.storageKey];

                if (!_.isObject(_storage)) {
                    _storage = {};
                }

                if (!_.isObject(_storage.tabs)) {
                    _storage.tabs = {};
                }

                if (!_.isArray(_storage.tabs.data)) {
                    _storage.tabs.data = [];
                }

                if (!_.isArray(_storage.tabs.columns)) {
                    _storage.tabs.columns = [
                        {name: 'Title', title: 'Title'},
                        {name: 'URL', title: 'URL'},
                        {name: 'Pinned', title: 'Pinned'}
                    ];
                }

                if (!_.isArray(_storage.blockedDomains)) {
                    _storage.blockedDomains = [];
                }

                if (!_.isString(_storage.allowedDomain)) {
                    _storage.allowedDomain = '';
                }

                if (!_.isObject(_storage.settings)) {
                    _storage.settings = {};
                }

                if (!_.isBoolean(_storage.settings.removeTabs)) {
                    _storage.settings.removeTabs = true;
                }

                return _storage;
            }
            else {
                throw new TypeError('storage must be an object');
            }
        },
        get: function(cb) {
            if (_.isFunction(cb)) {
                chrome.storage.sync.get(common.storageKey, function(storage) {
                    cb(common.storage.init(storage));
                });
            }
            else {
                throw new TypeError('cb must be a function');
            }
        },
        update: function(data, cb) {
            chrome.storage.sync.get(common.storageKey, function(storage) {
                var _storage = common.storage.init(storage);

                if (_.isObject(data)) {
                    var tabs = data.tabs,
                        blockedDomains = data.blockedDomains;

                    if (!_.isUndefined(tabs)) {
                        if (_.isObject(tabs)) {
                            if (_.isArray(tabs.add)) {
                                _.each(tabs.add, function(tab) {
                                    _storage.tabs.data.push(tab);
                                });
                            }
                            else if (_.isArray(tabs.update)) {
                                _storage.tabs.data = tabs.update;
                            }
                        }
                        else {
                            throw new TypeError('data.tabs must be an object');
                        }
                    }

                    if (!_.isUndefined(blockedDomains)) {
                        if (_.isObject(blockedDomains)) {
                            if (!_.isUndefined(blockedDomains.add)) {
                                if (_.isString(blockedDomains.add)) {
                                    _storage.blockedDomains.push(blockedDomains.add);
                                }
                                else if (_.isArray(blockedDomains.add)) {
                                    _.each(blockedDomains.add, function(domain, i) {
                                        if (_.isString(domain)) {
                                            _storage.blockedDomains.push(domain);
                                        }
                                        else {
                                            throw new TypeError('data.blockedDomains.add[' + i + '] was not a string. Value: ' + domain);
                                        }
                                    });
                                }
                                else {
                                    throw new TypeError('data.blockedDomains.add must be a string or an array');
                                }
                            }

                            if (!_.isUndefined(blockedDomains.remove)) {
                                if (_.isString(blockedDomains.remove)) {
                                    _storage.blockedDomains = _.without(_storage.blockedDomains, blockedDomains.remove);
                                }
                                else if (_.isArray(blockedDomains.remove)) {
                                    _.each(blockedDomains.remove, function(domain, i) {
                                        if (_.isString(domain)) {
                                            _.pull(_storage.blockedDomains, domain);
                                        }
                                        else {
                                            throw new TypeError('data.blockedDomains.remove[' + i + '] was not a string. Value: ' + domain);
                                        }
                                    });
                                }
                                else if (_.isBoolean(blockedDomains.remove)) {
                                    if (blockedDomains.remove) {
                                        _storage.blockedDomains = [];
                                    }
                                    else {
                                        throw new TypeError('data.blockedDomains.remove must be true');
                                    }
                                }
                                else {
                                    throw new TypeError('data.blockedDomains.remove must be a string, array, or boolean');
                                }
                            }
                        }
                        else {
                            throw new TypeError('data.blockedDomains must be an object');
                        }
                    }

                    if (!_.isUndefined(data.allowedDomain)) {
                        if (_.isString(data.allowedDomain)) {
                            _storage.allowedDomain = data.allowedDomain;
                        }
                        else {
                            throw new TypeError('data.allowedDomain must be a string');
                        }
                    }

                    if (!_.isUndefined(data.settings)) {
                        if (_.isObject(data.settings)) {
                            if (!_.isUndefined(data.settings.removeTabs)) {
                                if (_.isBoolean(data.settings.removeTabs)) {
                                    _storage.settings.removeTabs = data.settings.removeTabs;
                                }
                                else {
                                    throw new TypeError('data.allowedDomain must be a boolean');
                                }
                            }
                        }
                        else {
                            throw new TypeError('data.settings must be an object');
                        }
                    }

                    if (_.isEmpty(data)) {
                        _storage = common.storage.init({});
                    }

                    storage[common.storageKey] = _storage;

                    chrome.storage.sync.set(storage, function() {
                        if (_.isFunction(cb)) { cb(); }
                    });
                }
                else {
                    throw new Error('data must be an object');
                }
            });
        }
    }
};