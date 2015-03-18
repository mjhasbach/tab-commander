$(function() {
    var hiddenTabs = {
        settings: {
            $removeTabs: $('#removeTabs')
        },
        createTable: function(cb) {
            if (!_.isFunction(cb)) {
                throw new TypeError('cb must be a function');
            }

            common.storage.get(function(storage) {
                hiddenTabs.$table = $('table');
                hiddenTabs.$table.on('init.dt', function() {
                    cb();
                }).dataTable({
                    processing: true,
                    lengthMenu: [5, 10, 15, 20, 30, 40, 50, 75, 100],
                    iDisplayLength: 10,
                    data: storage.tabs.data,
                    columns: storage.tabs.columns,
                    autoWidth: false,
                    conditionalPagination: {enable: true},
                    oLanguage: {
                        sInfo: 'Showing _START_ to _END_ of _TOTAL_ tabs',
                        sInfoEmpty: '',
                        sLengthMenu: 'Show _MENU_ tabs',
                        sZeroRecords: 'No tabs are hidden'
                    }
                });
            });
        },
        openTab: function($row, cb) {
            var $cells = $row.find('td'),
                api = hiddenTabs.$table.api();

            if (api.data().length) {
                common.page.getCurrentActive(function(tab) {
                    chrome.tabs.create({
                        url: $cells.eq(api.column('URL:name').index()).text(),
                        pinned: $cells.eq(api.column('URL:name').index()).text() === 'true',
                        index: tab.index + 1,
                        active: false
                    }, function() {
                        if (_.isFunction(cb)) {
                            cb();
                        }
                    });
                });
            }
        },
        openMultipleTabs: function($tabs) {
            $tabs.each(function(row) {
                hiddenTabs.openTab($(row));
            });
        },
        syncTableAndStorage: function() {
            common.storage.update({tabs: {update: _.toArray(hiddenTabs.$table.api().data())}});
        },
        bindEvents: function() {
            hiddenTabs.$table.on('click', 'tbody tr', function() {
                var $row = $(this);

                hiddenTabs.openTab($row, function() {
                    if (hiddenTabs.settings.removeTabs) {
                        hiddenTabs.$table.api().row($row).remove().draw();
                        hiddenTabs.syncTableAndStorage();
                    }
                });
            });

            $('#removeAll').click(function() {
                hiddenTabs.$table.api().clear().draw();
                hiddenTabs.syncTableAndStorage();
            });

            $('#removeCurrent').click(function() {
                hiddenTabs.$table.api().rows($('tr')).remove().draw();
                hiddenTabs.syncTableAndStorage();
            });

            $('#openAll').click(function() {
                hiddenTabs.openMultipleTabs(hiddenTabs.$table.api().rows().nodes());
            });

            $('#openCurrent').click(function() {
                hiddenTabs.openMultipleTabs(hiddenTabs.$table.api().rows({page: 'current'}).nodes());
            });

            $('#openSettings').click(function() {
                hiddenTabs.settings.dialog = $('#settings').bPopup({transition: 'slideIn'});
            });

            $('#closeSettings').click(function() {
                hiddenTabs.settings.dialog.close();
            });

            hiddenTabs.settings.$removeTabs.click(function() {
                var removeTabs = hiddenTabs.settings.$removeTabs.prop('checked');

                hiddenTabs.settings.removeTabs = removeTabs;
                common.storage.update({settings: {removeTabs: removeTabs}});
            });
        }
    };

    common.storage.get(function(storage) {
        hiddenTabs.settings.removeTabs = storage.settings.removeTabs;
        hiddenTabs.settings.$removeTabs.prop('checked', hiddenTabs.settings.removeTabs);

        hiddenTabs.createTable(function() {
            hiddenTabs.bindEvents();
        });
    });
});