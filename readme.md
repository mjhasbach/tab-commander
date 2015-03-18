# Tab Commander

Tab Commander is a Chrome extension which has the following features:

- Only allow access to the domain of the active tab in the current window
- Disallow access to the domain of the active tab in the current window
- Hide the active tab in the current window
- Hide all tabs except the active tab in the current window
- Hide all tabs on the domain of the active tab in the current window
- Hide all tabs that are not on the domain of the active tab in the current window
- Manage hidden tabs. Hidden tabs can be removed or restored one at a time, a page at a time, or all at once.
- Remove all data (hidden tabs, allowed / blocked domains, and settings)

Hidden tabs, allowed / blocked domains, and settings are saved using the [chrome.storage.sync](https://developer.chrome.com/extensions/storage#using-sync) API, which means those preferences will automatically be synced to any Chrome browser you are logged in to, provided you have sync enabled.