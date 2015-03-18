var events = {
    handleNavigation: function(tab){
        common.storage.get(function(storage){
            if (!common.page.isChrome(tab.url)){
                if (!_.isEmpty(storage.allowedDomain) && tab.domain !== storage.allowedDomain){
                    common.page.goToBlockPage({url: tab.url, allowed: storage.allowedDomain});
                }
                else if (!_.isEmpty(storage.blockedDomains)){
                    _.each(storage.blockedDomains, function(domain){
                        if (tab.domain === domain){
                            common.page.goToBlockPage({url: tab.url, blocked: domain});
                            return false;
                        }
                    });
                }
            }
        });
    },

    bind: function() {
        chrome.webNavigation.onBeforeNavigate.addListener(function(details) {
            common.page.getCurrentActive(function(tab){
                if (tab.id === details.tabId && details.frameId === 0){
                    events.handleNavigation(tab);
                }
            });
        });

        chrome.tabs.onActivated.addListener(function() {
            common.page.getCurrentActive(function(tab){
                events.handleNavigation(tab);
            });
        });
    }
};

events.bind();