var omnisidebar = {
	initialized: false,
	
	// Delayed initialization, should improve startup performance (I can hardly tell the difference though)
	preinit: function() {
		Components.utils.import("resource://gre/modules/AddonManager.jsm");
		
		omnisidebar.hideIt(document.getElementById('sidebar-box'), false);
		omnisidebar.hideIt(document.getElementById('sidebar-box-twin'), false);
		
		omnisidebar.fixSimilarWeb();
		
		omnisidebar.timerAid.init('init', omnisidebar.init, 500);
		
		omnisidebar.listenerAid.remove(window, "load", omnisidebar.preinit, false);
		omnisidebar.listenerAid.add(window, "unload", omnisidebar.deinit, false);
	},
	
	init: function() { 
		omnisidebar.listenersplaced = false;
		omnisidebar.dragging = false;
		omnisidebar.customizing = false;
		omnisidebar.listeningResize = false;
		omnisidebar.autoClosing = false;
		omnisidebar.twined = false;
		omnisidebar.ssuri = '';
		
		omnisidebar.keysets = [
			{ key: 'S', mod: 'accel shift', key_twin: 'S', mod_twin: 'accel alt shift' },
			{ key: 'S', mod: 'accel alt', key_twin: 'S', mod_twin: 'accel alt shift' },
			{ key: 'L', mod: 'accel shift', key_twin: 'L', mod_twin: 'accel alt shift' },
			{ key: 'S', mod: 'accel shift', key_twin: 'L', mod_twin: 'accel shift' },
			{ key: 'L', mod: 'accel shift', key_twin: 'S', mod_twin: 'accel shift' },
			{ key: 'VK_F6', mod: 'accel', key_twin: 'VK_F6', mod_twin: 'accel shift' },
			{ key: 'VK_PAGE_UP', mod: 'accel shift', key_twin: 'VK_PAGE_DOWN', mod_twin: 'accel shift' }
		];
		
		omnisidebar.getelems();
		
		// Set initial hover calls
		omnisidebar.resizebox.hovers = 0;
		omnisidebar.resizebox_twin.hovers = 0;
		
		// Add the close button to the twin sidebar, it won't be added by the use of an overlay because I can't access browser.dtd for some reason
		var closebtn = omnisidebar.header.getElementsByClassName('tabs-closebutton')[0].cloneNode(true);
		closebtn.setAttribute('oncommand', 'omnisidebar.toggleSidebarTwin();');
		omnisidebar.header_twin.appendChild(closebtn);
		
		// Linux only has one icon setting
		omnisidebar.OS = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS;
		if(omnisidebar.OS != 'WINNT' && omnisidebar.OS != 'Darwin') {
			omnisidebar.prefs.coloricons.value = 'default';
		}
		
		// Preferences monitors
		omnisidebar.listenerAid.add(omnisidebar.prefs.mainSidebar, "change", function() { omnisidebar.moveSidebars(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.twinSidebar, "change", function() { omnisidebar.toggleTwin(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.renderabove, "change", function() { omnisidebar.setabove(); omnisidebar.rendersidebar(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.renderaboveTwin, "change", function() { omnisidebar.setabove(); omnisidebar.rendersidebar(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.undockMode, "change", function() { omnisidebar.setabove(); omnisidebar.rendersidebar(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.undockModeTwin, "change", function() { omnisidebar.setabove(); omnisidebar.rendersidebar(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.hideheadertoolbar, "change", function() { omnisidebar.toggleToolbar(); omnisidebar.rendersidebar(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.hideheadertitle, "change", function() { omnisidebar.toggletitle(); omnisidebar.rendersidebar(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.hideheaderdock, "change", function() { omnisidebar.toggledockbutton(); omnisidebar.rendersidebar(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.hideheaderclose, "change", function() { omnisidebar.toggleclose(); omnisidebar.rendersidebar(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.hideheadertoolbarTwin, "change", function() { omnisidebar.toggleToolbar(); omnisidebar.rendersidebar(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.hideheadertitleTwin, "change", function() { omnisidebar.toggletitle(); omnisidebar.rendersidebar(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.hideheaderdockTwin, "change", function() { omnisidebar.toggledockbutton(); omnisidebar.rendersidebar(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.hideheadercloseTwin, "change", function() { omnisidebar.toggleclose(); omnisidebar.rendersidebar(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.alternatebtns, "change", function() { omnisidebar.togglebuttons(); omnisidebar.rendersidebar(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.alternatebtnsTwin, "change", function() { omnisidebar.togglebuttons(); omnisidebar.rendersidebar(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.disablefx, "change", function() { omnisidebar.toggleFX(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.coloricons, "change", function() { omnisidebar.toggleIconsColor(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.coloriconsTwin, "change", function() { omnisidebar.toggleIconsColor(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.glassStyle, "change", function() { omnisidebar.toggleGlass(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.devTools, "change", function() { omnisidebar.toggleDevTools(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.devToolsTwin, "change", function() { omnisidebar.toggleDevTools(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.chosenKeyset, "change", function() { omnisidebar.setKeysets(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.titleButton, "change", function() { omnisidebar.toggleTitleButton(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.titleButtonTwin, "change", function() { omnisidebar.toggleTitleButton(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.alwaysAddons, "change", function() { omnisidebar.toggleAlways(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.alwaysConsole, "change", function() { omnisidebar.toggleAlways(); });
		omnisidebar.listenerAid.add(omnisidebar.prefs.alwaysDMT, "change", function() { omnisidebar.toggleAlways(); });
		
		// I guess Firefox has some defaults for these, they override the css set ones so we have to erase them
		omnisidebar.sidebar.style.maxWidth = '';
		omnisidebar.sidebar.style.minWidth = '5px';
		omnisidebar.sidebar.style.width = '';
		omnisidebar.sidebar_twin.style.maxWidth = '';
		omnisidebar.sidebar_twin.style.minWidth = '5px';
		omnisidebar.sidebar_twin.style.width = '';
		
		// Compatibility with the SimilarWeb add-on
		// override the settings introduced by the SimilarWeb add-on (this is why it's on a timer, it still would set these once)
		omnisidebar.timerAid.init('similarweb', omnisidebar.fixSimilarWeb, 0);
		
		// MileWideBack compatibility fix
		// hovering the back-strip will hover the sidebar
		if(omnisidebar.milewideback) {
			omnisidebar.listenerAid.add(omnisidebar.milewideback, 'mouseover', omnisidebar.milewidebackHover, false);
			omnisidebar.listenerAid.add(omnisidebar.milewideback, 'mouseout', omnisidebar.milewidebackOut, false);
		}
		
		// Set up context menu onpopupshowing event to do both the predetermined action and omnisidebar's functions
		omnisidebar.listenerAid.add(omnisidebar.toolbarcontextmenu, 'popupshowing', function(event) { omnisidebar.setContextMenu(event); }, false);
		omnisidebar.listenerAid.add(omnisidebar.toolbarcontextmenu, 'popuphiding', function() { omnisidebar.setBothHovers(false); }, false);
		omnisidebar.listenerAid.add(omnisidebar.appmenu, 'popupshowing', function(event) { omnisidebar.setAppMenu(event); }, false);
		omnisidebar.listenerAid.add(omnisidebar.viewtoolbars, 'popupshowing', function(event) { omnisidebar.setViewToolbarsMenu(event); }, false);
		
		// LessChrome compatibility fix: don't show the toolbox when our menus are the triggers
		omnisidebar.listenerAid.add(window, "LessChromeShowing", omnisidebar.cancelLessChrome, false);
		
		// Apply initial preferences, these need to be here and in this order
		omnisidebar.toggleConsole(); // Must come before toggleTwin() (setTwinBroadcasters())
		omnisidebar.toggleDMT(); // Must come before toggleTwin() (setTwinBroadcasters())
		omnisidebar.toggleTwin(); // Must come before setlast()
		omnisidebar.setlast();
		omnisidebar.listenerAid.add(omnisidebar.sidebar, 'DOMContentLoaded', omnisidebar.setlast, true);
		omnisidebar.listenerAid.add(omnisidebar.sidebar_twin, 'DOMContentLoaded', omnisidebar.setlast, true);
		
		// Show the sidebar toolbar when customizing
		omnisidebar.setWatchers(omnisidebar.toolbar);
		omnisidebar.toolbar.addAttributeWatcher('customizing', omnisidebar.customize);
		
		// Initialize XPCOM Interface Services, we're gonna need them already for the setWidth() function just below (inside rendersidebar())
		omnisidebar.sss = Components.classes["@mozilla.org/content/style-sheet-service;1"].getService(Components.interfaces.nsIStyleSheetService);
		omnisidebar.ios = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
		
		// Apply preferences and changes and stuff
		omnisidebar.toggleDevTools();
		omnisidebar.moveTotaltoolbarButtons();
		omnisidebar.setToolbarButtons(omnisidebar.toolbar, false);
		omnisidebar.setToolbarButtons(omnisidebar.devToolbar, false);
		omnisidebar.toggleGlass();
		omnisidebar.moveSidebars();
		omnisidebar.setabove();
		omnisidebar.toggleToolbar();
		omnisidebar.toggletitle();
		omnisidebar.toggleTitleButton();
		omnisidebar.toggledockbutton();
		omnisidebar.toggleclose();
		omnisidebar.togglebuttons();
		omnisidebar.toggleFX();
		omnisidebar.toggleIconsColor();
		omnisidebar.rendersidebar();
		omnisidebar.toggleStylish();
		omnisidebar.toggleAlways();
		
		// Updates width values when sidebar is resized and button check states
		omnisidebar.setWatchers(omnisidebar.box);
		omnisidebar.setWatchers(omnisidebar.box_twin);
		omnisidebar.box.addAttributeWatcher('width', omnisidebar.setWidth);
		omnisidebar.box_twin.addAttributeWatcher('width', omnisidebar.setWidth);
		
		omnisidebar.hideIt(omnisidebar.box, true);
		omnisidebar.hideIt(omnisidebar.box_twin, omnisidebar.prefs.twinSidebar.value);
		
		omnisidebar.initialized = true;
	},
	
	// Remove listeners on window unload
	deinit: function() {
		// Autoclose feature: we can't have the sidebars open when we restart
		if(omnisidebar.autoClosing) { 
			if(!omnisidebar.box.hidden && omnisidebar.prefs.renderabove.value && omnisidebar.prefs.undockMode.value == 'autoclose') { toggleSidebar(); }
			if(!omnisidebar.box_twin.hidden && omnisidebar.prefs.renderaboveTwin.value && omnisidebar.prefs.undockModeTwin.value == 'autoclose') { omnisidebar.toggleSidebarTwin(); }
		}
		
		// Button update listeners
		omnisidebar.unload(true);
		
		if(omnisidebar.listeningResize) {
			AddonManager.removeAddonListener(omnisidebar.lessChromeListener);
		}
		
		// Remove every event listener placed
		omnisidebar.listenerAid.clean();
	},
	
	// References elements inside omnisidebar for easier access everywhere
	getelems: function() {
		// Text strings
		omnisidebar.strings = document.getElementById("omnisidebar-strings");
		
		omnisidebar.addonsmenuitem = document.getElementById('addons_sidebar_viewmenu'); // omnisidebar sidebar Addons Manager menu item
		
		omnisidebar.toolbarcontextmenu = document.getElementById("toolbar-context-menu"); // Toolbar context menu
		omnisidebar.contextmenuitemtoggle = document.getElementById('toggle_sidebartoolbar'); // context menu item for toggling the toolbar
		omnisidebar.contextmenuitemoptions = document.getElementById('omnisidebar_menuoptions'); // context menu item for accessing omnisidebar options
		omnisidebar.menuseparator = document.getElementById('omnisidebar_separator'); // context menu separator
		omnisidebar.appmenu = document.getElementById('appmenu_customizeMenu'); // app customization menu
		omnisidebar.appmenuitemtoggle = document.getElementById('toggle_sidebartoolbar_appmenu'); // context menu item for toggling the toolbar
		omnisidebar.appmenuitemoptions = document.getElementById('omnisidebar_menuoptions_appmenu'); // context menu item for accessing omnisidebar options
		omnisidebar.viewtoolbars = document.getElementById('viewToolbarsMenu').firstChild; // View - Toolbars submenu
		omnisidebar.viewmenuitemtoggle = document.getElementById('toggle_sidebartoolbar_viewtoolbars'); // context menu item for toggling the toolbar
		
		omnisidebar.contextmenuitemtoggle_twin = document.getElementById('toggle_sidebartoolbar-twin'); // context menu item for toggling the toolbar
		omnisidebar.appmenuitemtoggle_twin = document.getElementById('toggle_sidebartoolbar_appmenu-twin'); // context menu item for toggling the toolbar
		omnisidebar.viewmenuitemtoggle_twin = document.getElementById('toggle_sidebartoolbar_viewtoolbars-twin'); // context menu item for toggling the toolbar
		
		omnisidebar.bottombox = document.getElementById('browser-bottombox'); // Bottom box with add-ons bar and find-bar
		omnisidebar.browser = document.getElementById('browser'); // Browser area, contains sidebar, browser and everything else between the toolbox and the bottom box
		omnisidebar.appcontent = document.getElementById('appcontent'); // Content browser
		omnisidebar.splitter = document.getElementById('sidebar-splitter'); // Splitter to resize the sidebar box
		omnisidebar.box = document.getElementById('sidebar-box'); // Sidebar box
		omnisidebar.header = document.getElementById('sidebar-header'); // Sidebar header
		omnisidebar.title = document.getElementById('sidebar-title'); // Sidebar title
		omnisidebar.customizingLabel = document.getElementById('sidebar-customizingLabel'); // Label to appear in the sidebar toolbar while customizing
		omnisidebar.sidebar = document.getElementById('sidebar'); // Sidebar content area
		omnisidebar.toolbar = document.getElementById('omnisidebarToolbar'); // omnisidebar sidebar toolbar
		omnisidebar.dockbutton = document.getElementById('omnisidebar_dock_button'); // omnisidebar dock/undock button
		omnisidebar.resizebox = document.getElementById('omnisidebar_resizebox'); // Box to hold resizeable sidebar while in renderabove
		omnisidebar.resizesidebar = document.getElementById('omnisidebar_resizesidebar'); // Box to hold sidebar contents while in renderabove
		omnisidebar.resizer = document.getElementById('omnisidebar_resizer'); // Resizer bar while in renderabove
		omnisidebar.devButton = document.getElementById('omnisidebar-devTools-button'); // Developer toolbarbutton
		omnisidebar.devToolbar = document.getElementById('omnisidebarDevToolbar'); // Developer toolbarbutton
		omnisidebar.stack = document.getElementById('stackSidebar'); // stack element for the customize screen
		
		omnisidebar.splitter_twin = document.getElementById('sidebar-splitter-twin'); // Splitter to resize the sidebar box
		omnisidebar.box_twin = document.getElementById('sidebar-box-twin'); // Sidebar box
		omnisidebar.header_twin = document.getElementById('sidebar-header-twin'); // Sidebar header
		omnisidebar.toolbar_twin = document.getElementById('omnisidebarToolbar-twin'); // omnisidebar sidebar toolbar
		omnisidebar.sidebar_twin = document.getElementById('sidebar-twin'); // Sidebar content area
		omnisidebar.title_twin = document.getElementById('sidebar-title-twin'); // Sidebar title
		omnisidebar.customizingLabel_twin = document.getElementById('sidebar-customizingLabel-twin'); // Label to appear in the sidebar toolbar while customizing
		omnisidebar.resizebox_twin = document.getElementById('omnisidebar_resizebox-twin'); // Box to hold resizeable sidebar while in renderabove
		omnisidebar.resizesidebar_twin = document.getElementById('omnisidebar_resizesidebar-twin'); // Box to hold sidebar contents while in renderabove
		omnisidebar.resizer_twin = document.getElementById('omnisidebar_resizer-twin'); // Resizer bar while in renderabove
		omnisidebar.dockbutton_twin = document.getElementById('omnisidebar_dock_button-twin'); // omnisidebar dock/undock button
		omnisidebar.devButton_twin = document.getElementById('omnisidebar-devTools-button-twin'); // Developer toolbarbutton
		omnisidebar.stack_twin = document.getElementById('stackSidebar-twin'); // stack element for the customize screen
		
		omnisidebar.milewideback = (typeof(MileWideBack) != 'undefined') ? document.getElementById('back-strip') : null; // MileWideBack Add-on
		
		omnisidebar.prefs = {
			lastcommand: Application.prefs.get('extensions.omnisidebar.lastcommand'), // Last opened sidebar
			lastcommandTwin: Application.prefs.get('extensions.omnisidebar.lastcommandTwin'), // Last opened sidebar
			mainSidebar: Application.prefs.get('extensions.omnisidebar.mainSidebar'), // Move sidebar to the right
			twinSidebar: Application.prefs.get('extensions.omnisidebar.twinSidebar'), // Show twin sidebar
			renderabove: Application.prefs.get('extensions.omnisidebar.renderabove'), // Render the sidebar above the webpage
			renderaboveTwin: Application.prefs.get('extensions.omnisidebar.renderaboveTwin'), // Render the twin sidebar above the webpage
			undockMode: Application.prefs.get('extensions.omnisidebar.undockMode'), // Render the sidebar above the webpage: mode
			undockModeTwin: Application.prefs.get('extensions.omnisidebar.undockModeTwin'), // Render the twin sidebar above the webpage: mode
			hideheadertoolbar: Application.prefs.get('extensions.omnisidebar.hideheadertoolbar'), // Hide the sidebar toolbar
			hideheadertitle: Application.prefs.get('extensions.omnisidebar.hideheadertitle'), // Hide sidebar title
			hideheaderdock: Application.prefs.get('extensions.omnisidebar.hideheaderdock'), // Hide sidebar docking button
			hideheaderclose: Application.prefs.get('extensions.omnisidebar.hideheaderclose'), // Hide close sidebar button
			hideheadertoolbarTwin: Application.prefs.get('extensions.omnisidebar.hideheadertoolbarTwin'), // Hide the sidebar toolbar
			hideheadertitleTwin: Application.prefs.get('extensions.omnisidebar.hideheadertitleTwin'), // Hide sidebar title
			hideheaderdockTwin: Application.prefs.get('extensions.omnisidebar.hideheaderdockTwin'), // Hide sidebar docking button
			hideheadercloseTwin: Application.prefs.get('extensions.omnisidebar.hideheadercloseTwin'), // Hide close sidebar button
			alternatebtns: Application.prefs.get('extensions.omnisidebar.alternatebtns'), // Alternate style for sidebar toolbar buttons
			alternatebtnsTwin: Application.prefs.get('extensions.omnisidebar.alternatebtnsTwin'), // Alternate style for sidebar toolbar buttons
			disablefx: Application.prefs.get('extensions.omnisidebar.disablefx'), // Alternate style for sidebar toolbar buttons
			coloricons: Application.prefs.get('extensions.omnisidebar.coloricons'), // Use colorful icons
			coloriconsTwin: Application.prefs.get('extensions.omnisidebar.coloriconsTwin'), // Use colorful icons
			glassStyle: Application.prefs.get('extensions.omnisidebar.glassStyle'), // Apply glass style to the sidebars
			titleButton: Application.prefs.get('extensions.omnisidebar.titleButton'), // Display a dropdown when clicking the title
			titleButtonTwin: Application.prefs.get('extensions.omnisidebar.titleButtonTwin'), // Display a dropdown when clicking the title
			devTools: Application.prefs.get('extensions.omnisidebar.devTools'), // Activate developers toolbar
			devToolsTwin: Application.prefs.get('extensions.omnisidebar.devToolsTwin'), // Activate developers toolbar
			chosenKeyset: Application.prefs.get('extensions.omnisidebar.chosenkeyset'), // keyset definitions
			stylish: Application.prefs.get('extensions.omnisidebar.stylish'), // To show/hide the stylish button in the customize dialog
			alwaysAddons: Application.prefs.get('extensions.omnisidebar.alwaysAddons'), // always open the addons manager in the sidebar
			alwaysConsole: Application.prefs.get('extensions.omnisidebar.alwaysConsole'), // always open the error console in the sidebar
			alwaysDMT: Application.prefs.get('extensions.omnisidebar.alwaysDMT'), // always open the error console in the sidebar
			keysets: [
				Application.prefs.get('extensions.omnisidebar.keysets.0'),
				Application.prefs.get('extensions.omnisidebar.keysets.1'),
				Application.prefs.get('extensions.omnisidebar.keysets.2'),
				Application.prefs.get('extensions.omnisidebar.keysets.3'),
				Application.prefs.get('extensions.omnisidebar.keysets.4'),
				Application.prefs.get('extensions.omnisidebar.keysets.5'),
				Application.prefs.get('extensions.omnisidebar.keysets.6')
			]
		};
	},
	
	get button () { var b = document.getElementById('omnisidebar_button'); if(!b) { omnisidebar.unload(); } return b; }, // omnisidebar Open Sidebar button
	get button_twin () { var b = document.getElementById('omnisidebar_button-twin'); if(!b) { omnisidebar.unload(); } return b; }, // omnisidebar Open Twin Sidebar button
	get stylishbutton () { return document.getElementById('stylish_sidebar_button'); }, // omnisidebar sidebar Stylish toolbar button
	get updscanbtn () { return document.getElementById('tools-updatescan-button'); }, // Update Scan button
	get feedbtn () { return document.getElementById('feedbar-button'); }, // Feed Sidebar button
		
	// onLoad and unLoad are used by the omnisidebar button to set up its listeners
	onLoad: function() {
		if(!omnisidebar.initialized) {
			omnisidebar.timerAid.init('onLoad', omnisidebar.onLoad, 500);
			return;
		}
		// on a timer so loading both osb and osb-twin buttons doesn't trigger the load functions twice unnecessarily
		omnisidebar.timerAid.init('onLoad', omnisidebar.loadButton, 50);
	},
	
	loadButton: function() {
		// add listeners for updating main omnisidebar button
		omnisidebar.setlast(); // This extra call (in addition to the init() one) is necessary to update the button, otherwise sometimes only the keyset would be updated
		omnisidebar.setButtons();
		
		if(omnisidebar.prefs.mainSidebar.value == 'right') {
			if(omnisidebar.button) {
				omnisidebar.button.setAttribute('movetoright', 'true');
			}
			if(omnisidebar.button_twin) {
				omnisidebar.button_twin.setAttribute('movetoleft', 'true');
			}
		} else {
			if(omnisidebar.button) {
				omnisidebar.button.removeAttribute('movetoright');
			}
			if(omnisidebar.button_twin) {
				omnisidebar.button_twin.removeAttribute('movetoleft');
			}
		}
		
		if(omnisidebar.button_twin) {
			omnisidebar.hideIt(omnisidebar.button_twin, omnisidebar.prefs.twinSidebar.value);
		}
		omnisidebar.btnLabels();
		
		omnisidebar.listenersplaced = true;
	},
	
	unload: function(force) {
		if(!omnisidebar.listenersplaced 
		|| (!force && (document.getElementById('omnisidebar_button') || document.getElementById('omnisidebar_button-twin')))) { 
			return; 
		}
		
		// Remove all button update related listeners
		if(omnisidebar.updscanbtn && omnisidebar.updscanbtn.attributesWatched) {
			omnisidebar.updscanbtn.removeAttributeWatcher('status', omnisidebar.updscanmodified);
		}
		if(omnisidebar.feedbtn && omnisidebar.feedbtn.attributesWatched) {
			omnisidebar.feedbtn.removeAttributeWatcher('status', omnisidebar.feedmodified);
		}
		
		omnisidebar.listenersplaced = false;
	},
	
	// omnisidebar button opens the last sidebar opened
	setlast: function() {
		if(omnisidebar.box.getAttribute('sidebarcommand') 
		&& document.getElementById(omnisidebar.box.getAttribute('sidebarcommand'))
		&& document.getElementById(omnisidebar.box.getAttribute('sidebarcommand')).localName == 'broadcaster'
		&& !document.getElementById(omnisidebar.box.getAttribute('sidebarcommand')).hasAttribute('disabled')) {
			omnisidebar.prefs.lastcommand.value = omnisidebar.box.getAttribute('sidebarcommand');
		} 
		else if(!document.getElementById(omnisidebar.prefs.lastcommand.value)
		|| document.getElementById(omnisidebar.prefs.lastcommand.value).localName != 'broadcaster'
		|| document.getElementById(omnisidebar.prefs.lastcommand.value).hasAttribute('disabled')) {
			omnisidebar.prefs.lastcommand.reset();
			omnisidebar.box.setAttribute("sidebarcommand", "");
			omnisidebar.title.value = "";
			omnisidebar.sidebar.setAttribute("src", "about:blank");
			omnisidebar.box.hidden = true;
			omnisidebar.splitter.hidden = true;
		}
			
		if(omnisidebar.prefs.twinSidebar.value) {
			if(omnisidebar.box_twin.getAttribute('sidebarcommand')
			&& document.getElementById(omnisidebar.box_twin.getAttribute('sidebarcommand'))
			&& document.getElementById(omnisidebar.box_twin.getAttribute('sidebarcommand')).localName == 'broadcaster'
			&& !document.getElementById(omnisidebar.box_twin.getAttribute('sidebarcommand')).hasAttribute('disabled')) {
				omnisidebar.prefs.lastcommandTwin.value = omnisidebar.box_twin.getAttribute('sidebarcommand');
			}
			else if(!document.getElementById(omnisidebar.prefs.lastcommandTwin.value)
			|| document.getElementById(omnisidebar.prefs.lastcommandTwin.value).localName != 'broadcaster'
			|| document.getElementById(omnisidebar.prefs.lastcommandTwin.value).hasAttribute('disabled')) {
				omnisidebar.prefs.lastcommandTwin.reset();
				omnisidebar.box_twin.setAttribute("sidebarcommand", "");
				omnisidebar.title_twin.value = "";
				omnisidebar.sidebar_twin.setAttribute("src", "about:blank");
				omnisidebar.box_twin.hidden = true;
				omnisidebar.splitter_twin.hidden = true;
			}
		}
		
		omnisidebar.setclass();
	},
	
	
	// Adds an 'insidebar' class tag to the opened page for easier costumization
	setclass: function() {
		if(typeof(omnisidebar.sidebar.contentDocument) != 'undefined') { // Fix for newly created profiles (unloaded sidebars)
			if(!omnisidebar.sidebar.contentDocument.documentElement.classList.contains('insidebar')) {
				omnisidebar.sidebar.contentDocument.documentElement.classList.add('insidebar');
			}
		}
		
		if(typeof(omnisidebar.sidebar_twin.contentDocument) != 'undefined') { // Fix for newly created profiles (unloaded sidebars)
			if(!omnisidebar.sidebar_twin.contentDocument.documentElement.classList.contains('insidebar')) {
				omnisidebar.sidebar_twin.contentDocument.documentElement.classList.add('insidebar');
			}
		}
	},
	
	// Handle broadcasters for twin sidebar buttons, remove them all when entering customization mode, add them back when customization is done
	setTwinToolbarButtons: function() {
		omnisidebar.setToolbarButtons(omnisidebar.toolbar_twin, true);
		
		if(!omnisidebar.initialized || omnisidebar.customizing) {
			omnisidebar.checkBroadcasters();
		} else {
			// Trick to check/uncheck as supposed to when exiting the customize screen
			omnisidebar.timerAid.init('toolbar', omnisidebar.checkBroadcasters, 100);
		}
	},
	
	setToolbarButtons: function(toolbar, twin) {
		for(var i=0; i<toolbar.childNodes.length; i++) {
			if(toolbar.childNodes[i].getAttribute('type') != 'checkbox'
			|| (toolbar.childNodes[i].getAttribute('group') != 'sidebar' && toolbar.childNodes[i].getAttribute('group') != 'twinSidebar')) {
				continue;
			}
			
			// First half of fix for not closing the sidebar when clicking already checked buttons
			omnisidebar.listenerAid.remove(toolbar.childNodes[i], 'click', omnisidebar.preventClose, false);
			
			// This ensures the buttons will only be checked when needed
			toolbar.childNodes[i].removeAttribute('checked');
			
			if(omnisidebar.customizing) {
				if(twin && toolbar.childNodes[i].hasAttribute('twin')) {
					toolbar.childNodes[i].removeAttribute('twin');
					toolbar.childNodes[i].setAttribute('observes', toolbar.childNodes[i].getAttribute('originalObserves'));
				}
				continue;
			}
			
			if(twin && omnisidebar.prefs.twinSidebar.value) {
				if(!toolbar.childNodes[i].hasAttribute('twin') && document.getElementById(toolbar.childNodes[i].getAttribute('observes') + '-twin')) { 
					toolbar.childNodes[i].setAttribute('originalObserves', toolbar.childNodes[i].getAttribute('observes'));
					toolbar.childNodes[i].setAttribute('observes', toolbar.childNodes[i].getAttribute('observes') + '-twin');
					toolbar.childNodes[i].setAttribute('twin', 'true');
				} 
			}
			
			// This adds back the checked state to necessary buttons, which is removed previously
			toolbar.childNodes[i].setAttribute('observes', toolbar.childNodes[i].getAttribute('observes'));
			
			// Second half of fix for not closing the sidebar when clicking already checked buttons
			omnisidebar.listenerAid.add(toolbar.childNodes[i], 'click', omnisidebar.preventClose, false);
		}
	},
	
	setTwinBroadcasters: function() {
		var allBroadcasters = document.getElementsByAttribute('group', 'sidebar');
		for(var i=0; i<allBroadcasters.length; i++) {
			if(!document.getElementById(allBroadcasters[i].id + '-twin')) {
				if(allBroadcasters[i].localName != 'broadcaster') {
					continue;
				}
				
				var newSet = allBroadcasters[i].cloneNode(true);
				newSet.id += '-twin';
				// The AMO team made me do this ;p
				// generated javascript commands from text strings can be unsafe
				//newSet.setAttribute('oncommand' , 'omnisidebar.toggleSidebarTwin("'+newSet.id+'");');
				newSet.setAttribute('oncommand', 'omnisidebar.toggleSidebarTwin(this.id);');
				newSet.setAttribute('group', 'twinSidebar');
				
				omnisidebar.setWatchers(newSet);
				newSet.addAttributeWatcher('disabled', omnisidebar.setlast);
				document.getElementById('mainBroadcasterSet').appendChild(newSet);
			}
			
			omnisidebar.setWatchers(allBroadcasters[i]);
			allBroadcasters[i].addAttributeWatcher('disabled', omnisidebar.setlast);
		}
	},
	
	checkBroadcasters: function() {
		var allTwinSidebarBroadcasters = document.getElementsByAttribute("group", "twinSidebar");
		for(var i=0; i<allTwinSidebarBroadcasters.length; i++) {
			if(allTwinSidebarBroadcasters[i].localName != 'broadcaster') { continue; }
			
			if(omnisidebar.initialized && !omnisidebar.customizing && allTwinSidebarBroadcasters[i].id == omnisidebar.box_twin.getAttribute('sidebarcommand')) {
				allTwinSidebarBroadcasters[i].setAttribute('checked', 'true');
			} else {
				allTwinSidebarBroadcasters[i].removeAttribute('checked');
			}
		}
		
		var allSidebarBroadcasters = document.getElementsByAttribute("group", "sidebar");
		for(var i=0; i<allSidebarBroadcasters.length; i++) {
			if(allSidebarBroadcasters[i].localName != 'broadcaster') { continue; }
			
			// No omnisidebar.initialized check on this one, toggleSidebar() isn't called at startup but the sidebar is still loaded before omnisidebar	
			if(/*omnisidebar.initialized &&*/ !omnisidebar.customizing && allSidebarBroadcasters[i].id == omnisidebar.box.getAttribute('sidebarcommand')) {
				allSidebarBroadcasters[i].setAttribute('checked', 'true');
			} else {
				allSidebarBroadcasters[i].removeAttribute('checked');
			}
		}
	},
	
	// We not only not close the sidebar from buttons in the sidebar toolbar, we also send a sidebar focused event when clicking them
	preventClose: function(e) {
		if(e.button == 0 && this.getAttribute('checked') == 'true' && this.id != 'uri_sidebar_button' && this.id != 'uri_sidebar_button-twin') {
			var command = this.getAttribute('oncommand').split('(')[1].split(')')[0];
			command = command.substr(1, command.length-2);
			
			if(this.getAttribute('group') == 'twinSidebar') {
				omnisidebar.toggleSidebarTwin(command, true);
			} else {
				toggleSidebar(command, true);
			}
			
			e.preventDefault();
			e.stopPropagation();
			return false;
		}
	},
	
	// Monitor 'new' attributes from sidebar toolbar buttons
	setButtons: function() {
		if(!omnisidebar.button && !omnisidebar.button_twin) { return false; }
		
		if(omnisidebar.customizing) {
			if(omnisidebar.button) {
				omnisidebar.button.removeAttribute('checked');
				omnisidebar.button.removeAttribute('checkState');
				omnisidebar.button.removeAttribute('updscannew');
				omnisidebar.button.removeAttribute('feednew');
			}
			if(omnisidebar.button_twin) {
				omnisidebar.button_twin.removeAttribute('checked');
				omnisidebar.button_twin.removeAttribute('checkState');
				omnisidebar.button_twin.removeAttribute('updscannew');
				omnisidebar.button_twin.removeAttribute('feednew');
			}
		}
		else {
			if(omnisidebar.button && !omnisidebar.box.hidden) {
				omnisidebar.button.setAttribute('checked', 'true');
			}
			if(omnisidebar.button_twin && !omnisidebar.box_twin.hidden) {
				omnisidebar.button_twin.setAttriute('checked', 'true');
			}
		}
		
		// Update Scanner Extension
		if(omnisidebar.updscanbtn) {
			if(omnisidebar.updscanbtn.parentNode.id == 'omnisidebarToolbar' || omnisidebar.updscanbtn.parentNode.id == 'omnisidebarToolbar-twin') {
				omnisidebar.setWatchers(omnisidebar.updscanbtn);
				omnisidebar.updscanbtn.addAttributeWatcher('status', omnisidebar.updscanmodified);
				if(omnisidebar.updscanbtn.hasAttribute('status') && (omnisidebar.updscanbtn.getAttribute('status') == 'CHANGE' || omnisidebar.updscanbtn.getAttribute('status') == 'CHANGE_DISABLED')) {
					omnisidebar.updscanicon(true);
				} else {
					omnisidebar.updscanicon(false);
				}
			}
			else {
				if(omnisidebar.updscanbtn.attributesWatched) {
					omnisidebar.updscanbtn.removeAttributeWatcher('status', omnisidebar.updscanmodified);
				}
			}
		}
		
		// Feed Sidebar extension
		if(omnisidebar.feedbtn) {
			if(omnisidebar.feedbtn.parentNode.id == 'omnisidebarToolbar' || omnisidebar.feedbtn.parentNode.id == 'omnisidebarToolbar-twin') { 
				omnisidebar.setWatchers(omnisidebar.feedbtn);
				omnisidebar.feedbtn.addAttributeWatcher('new', omnisidebar.feedmodified);
				if(omnisidebar.feedbtn.hasAttribute('new') && omnisidebar.feedbtn.getAttribute('new') == 'true') {
					omnisidebar.feedicon(true);
				} else {
					omnisidebar.feedicon(false);
				}
			}
			else {
				if(omnisidebar.feedbtn.attributesWatched) {
					omnisidebar.feedbtn.removeAttributeWatcher('status', omnisidebar.feedmodified);
				}
			}
		}
	},
	
	updscanmodified: function() { 
		if(arguments[2] == 'CHANGE' || arguments[2] == 'CHANGE_DISABLED') {
			omnisidebar.updscanicon(true);
		}
		else {
			omnisidebar.updscanicon(false);
		}
	},
	
	feedmodified: function() {
		if(arguments[2] == 'true') {
			omnisidebar.feedicon(true);
		}
		else {
			omnisidebar.feedicon(false);
		}
	},
	
	// Add appropriate 'new' attributes to omnisidebar buttons
	updscanicon: function(iupdscan) { 
		if(iupdscan) {
			if(omnisidebar.updscanbtn.parentNode.id == 'omnisidebarToolbar' && omnisidebar.button) {
				omnisidebar.button.setAttribute('updscannew', 'true');
			}
			else if(omnisidebar.updscanbtn.parentNode.id == 'omnisidebarToolbar-twin' && omnisidebar.button_twin) {
				omnisidebar.button_twin.setAttribute('updscannew', 'true');
			}
		}
		else {
			if(omnisidebar.updscanbtn.parentNode.id == 'omnisidebarToolbar' && omnisidebar.button) {
				omnisidebar.button.removeAttribute('updscannew');
			}
			else if(omnisidebar.updscanbtn.parentNode.id == 'omnisidebarToolbar-twin' && omnisidebar.button_twin) {
				omnisidebar.button_twin.removeAttribute('updscannew');
			}
		}
	},
	
	feedicon: function(ifeed) {
		if(ifeed) {
			if(omnisidebar.feedbtn.parentNode.id == 'omnisidebarToolbar' && omnisidebar.button) {
				omnisidebar.button.setAttribute('feednew', 'true');
			}
			else if(omnisidebar.feedbtn.parentNode.id == 'omnisidebarToolbar-twin' && omnisidebar.button_twin) {
				omnisidebar.button_twin.setAttribute('feednew', 'true');
			}
		}
		else {
			if(omnisidebar.feedbtn.parentNode.id == 'omnisidebarToolbar' && omnisidebar.button) {
				omnisidebar.button.removeAttribute('feednew');
			}
			else if(omnisidebar.feedbtn.parentNode.id == 'omnisidebarToolbar-twin' && omnisidebar.button_twin) {
				omnisidebar.button_twin.removeAttribute('feednew');
			}
		}
	},
	
	// Add costumizing attribute to sidebar and show the twin sidebar toolbar only if it's enabled or it has buttons
	customize: function() {
		if(arguments[2] == 'true') {
			omnisidebar.box.setAttribute('customizing', 'true');
			omnisidebar.hideIt(omnisidebar.customizingLabel, true);
			if(omnisidebar.prefs.twinSidebar.value || omnisidebar.toolbar_twin.firstChild) {
				omnisidebar.box_twin.setAttribute('customizing', 'true');
				omnisidebar.hideIt(omnisidebar.customizingLabel_twin, true);
				omnisidebar.hideIt(omnisidebar.box_twin, true);
			}
			omnisidebar.toolbar.setAttribute('flex', '1');
			omnisidebar.toolbar_twin.setAttribute('flex', '1');
			omnisidebar.stack.setAttribute('flex', '1');
			omnisidebar.stack_twin.setAttribute('flex', '1');
			omnisidebar.customizing = true;
		}
		else {
			omnisidebar.box.removeAttribute('customizing');
			omnisidebar.box_twin.removeAttribute('customizing');
			omnisidebar.hideIt(omnisidebar.customizingLabel, false);
			omnisidebar.hideIt(omnisidebar.customizingLabel_twin, false);
			omnisidebar.hideIt(omnisidebar.box_twin, omnisidebar.prefs.twinSidebar.value);
			omnisidebar.toolbar.removeAttribute('flex');
			omnisidebar.toolbar_twin.removeAttribute('flex');
			omnisidebar.stack.removeAttribute('flex');
			omnisidebar.stack_twin.removeAttribute('flex');
			omnisidebar.customizing = false;
		}
		omnisidebar.rendersidebar();
		omnisidebar.setTwinToolbarButtons();
		omnisidebar.setToolbarButtons(omnisidebar.toolbar, false);
		omnisidebar.setButtons();
	},
	
	// Keep the button label and tooltip when the observe attribute changes
	btnLabels: function() {
		if(omnisidebar.button) {
			if(omnisidebar.prefs.twinSidebar.value) {
				omnisidebar.button.setAttribute('label', omnisidebar.strings.getString('omnisidebarButtonMainLabel'));
				if(omnisidebar.box.hidden) {
					omnisidebar.button.setAttribute('tooltiptext', omnisidebar.strings.getString('omnisidebarButtonMainTooltip'));
				} else {
					omnisidebar.button.setAttribute('tooltiptext', omnisidebar.strings.getString('omnisidebarButtonMainCloseTooltip'));
				}
			} else {
				omnisidebar.button.setAttribute('label', omnisidebar.strings.getString('omnisidebarButtonlabel'));
				if(omnisidebar.box.hidden) {
					omnisidebar.button.setAttribute('tooltiptext', omnisidebar.strings.getString('omnisidebarButtonTooltip'));
				} else {
					omnisidebar.button.setAttribute('tooltiptext', omnisidebar.strings.getString('omnisidebarButtonCloseTooltip'));
				}
			}
		}
		
		if(omnisidebar.button_twin) {
			omnisidebar.button_twin.setAttribute('label', omnisidebar.strings.getString('omnisidebarButtonTwinLabel'));
			if(omnisidebar.box_twin.hidden) {
				omnisidebar.button_twin.setAttribute('tooltiptext', omnisidebar.strings.getString('omnisidebarButtonTwinTooltip'));
			} else {
				omnisidebar.button_twin.setAttribute('tooltiptext', omnisidebar.strings.getString('omnisidebarButtonTwinCloseTooltip'));
			}
		}
	},
	
	openOptions: function() {
		window.openDialog('chrome://omnisidebar/content/options.xul', '', 'chrome,resizable=false');
	},
	
	// sets the keyboard shortcuts
	setKeysets: function() {
		var redoKeysets = false;
		omnisidebar.curKeyset = {
			key: omnisidebar.keysets[omnisidebar.prefs.chosenKeyset.value].key,
			mod: omnisidebar.keysets[omnisidebar.prefs.chosenKeyset.value].mod,
			key_twin: omnisidebar.keysets[omnisidebar.prefs.chosenKeyset.value].key_twin,
			mod_twin: omnisidebar.keysets[omnisidebar.prefs.chosenKeyset.value].mod_twin
		};
		
		redoKeysets = !omnisidebar.verifyKeyset({ key: omnisidebar.curKeyset.key, modifiers: omnisidebar.curKeyset.mod });
		if(omnisidebar.prefs.twinSidebar.value && !redoKeysets) {
			redoKeysets = !omnisidebar.verifyKeyset({ key: omnisidebar.curKeyset.key_twin, modifiers: omnisidebar.curKeyset.mod_twin });
		}
		
		if(redoKeysets) {
			omnisidebar.redoKeysets();
		}
		
		// We need to remove and add the keyset element so the shortcuts update when changing the settings
		// setting them in the overlay would cause it to only update the keyboard shortcuts after a restart
		if(omnisidebar.keysetElement) {
			document.getElementById('main-window').removeChild(omnisidebar.keysetElement);
		}
		omnisidebar.keysetElement = document.createElement('keyset');
		omnisidebar.keysetElement.id = 'omnisidebarKeyset';
		
		omnisidebar.keyset = document.createElement('key');
		omnisidebar.keyset.id = 'omnisidebar_sidebarkey';
		omnisidebar.keyset.setAttribute('oncommand', 'toggleSidebar();');
		var keyAttr = 'key';
		if(omnisidebar.curKeyset.key.indexOf('VK_') === 0) {
			keyAttr = 'keycode';
		}
		omnisidebar.keyset.setAttribute(keyAttr, omnisidebar.curKeyset.key);
		omnisidebar.keyset.setAttribute('modifiers', omnisidebar.curKeyset.mod);
		omnisidebar.keyset = omnisidebar.keysetElement.appendChild(omnisidebar.keyset);
		
		if(omnisidebar.prefs.twinSidebar.value) {
			omnisidebar.keyset_twin = document.createElement('key');
			omnisidebar.keyset_twin.id = 'omnisidebar_sidebarkey-twin';
			omnisidebar.keyset_twin.setAttribute('oncommand', 'omnisidebar.toggleSidebarTwin();');
			var keyAttr = 'key';
			if(omnisidebar.curKeyset.key_twin.indexOf('VK_') === 0) {
				keyAttr = 'keycode';
			}
			omnisidebar.keyset_twin.setAttribute(keyAttr, omnisidebar.curKeyset.key_twin);
			omnisidebar.keyset_twin.setAttribute('modifiers', omnisidebar.curKeyset.mod_twin);
			omnisidebar.keyset_twin = omnisidebar.keysetElement.appendChild(omnisidebar.keyset_twin);
		}
		
		omnisidebar.keysetElement = document.getElementById('main-window').appendChild(omnisidebar.keysetElement);
		
		omnisidebar.disableKeysets();
	},
	
	verifyKeyset: function(values) {
		var allKeysets = document.getElementsByTagName('keyset');
		var moders = values.modifiers.split(" ");
		var keyAttr = 'key';
		
		if(values.key.indexOf('VK_') === 0) {
			keyAttr = 'keycode';
		}
		
		for(var i=0; i<allKeysets.length; i++) {
			var keys = allKeysets[i].getElementsByAttribute(keyAttr, values.key);
			for(var j=0; j<keys.length; j++) {
				if(keys[j].localName != 'key'
				|| keys[j].id == 'omnisidebar_sidebarkey' 
				|| keys[j].id == 'omnisidebar_sidebarkey-twin'
				|| keys[j].getAttribute('disabled') == 'true') {
					continue;
				}
				
				if(moders.length === 1) {
					if(keys[j].getAttribute('modifiers').indexOf(" ") == -1 && keys[j].getAttribute('modifiers').indexOf(",") == -1) {
						if(keys[j].getAttribute('modifiers') == moders[0]) {
							return false;
						}
					}
					continue;
				}
					
				if(keys[j].getAttribute('modifiers').indexOf(" ") > -1 && keys[j].getAttribute('modifiers').split(" ").length == moders.length) {
					for(var m=0; m<moders.length; m++) {
						if(keys[j].getAttribute('modifiers').split(" ").indexOf(moders[m]) == -1) {
							break;
						}
						return false;
					}
				}	
				if(keys[j].getAttribute('modifiers').indexOf(",") > -1 && keys[j].getAttribute('modifiers').split(",").length == moders.length) {
					for(var m=0; m<moders.length; m++) {
						if(keys[j].getAttribute('modifiers').split(",").indexOf(moders[m]) == -1) {
							break;
						}
						return false;
					}
				}
			}
		}
		return true;
	},
	
	redoKeysets: function() {
		var allKeysets = document.getElementsByTagName('keyset');
		
		for(var l=0; l<omnisidebar.keysets.length; l++) {
			if(!omnisidebar.verifyKeyset({ key: omnisidebar.keysets[l].key, modifiers: omnisidebar.keysets[l].mod })) { continue; }
			if(omnisidebar.prefs.twinSidebar.value
			&& !omnisidebar.verifyKeyset({ key: omnisidebar.keysets[l].key_twin, modifiers: omnisidebar.keysets[l].mod_twin })) { continue; }
			
			omnisidebar.prefs.chosenKeyset.value = l;
			omnisidebar.curKeyset = {
				key: omnisidebar.keysets[omnisidebar.prefs.chosenKeyset.value].key,
				mod: omnisidebar.keysets[omnisidebar.prefs.chosenKeyset.value].mod,
				key_twin: omnisidebar.keysets[omnisidebar.prefs.chosenKeyset.value].key_twin,
				mod_twin: omnisidebar.keysets[omnisidebar.prefs.chosenKeyset.value].mod_twin
			};
			break;
		}
	},
	
	disableKeysets: function() {
		for(var l=0; l<omnisidebar.keysets.length; l++) {
			if(!omnisidebar.verifyKeyset({ key: omnisidebar.keysets[l].key, modifiers: omnisidebar.keysets[l].mod })
			|| (omnisidebar.prefs.twinSidebar.value && !omnisidebar.verifyKeyset({ key: omnisidebar.keysets[l].key_twin, modifiers: omnisidebar.keysets[l].mod_twin }))) { 
				omnisidebar.prefs.keysets[l].value = false;
			} else {
				omnisidebar.prefs.keysets[l].value = true;
			}
		}
	},
		
	// Set css styling for variable values: widths and positions
	setWidth: function() {
		if(omnisidebar.dragging) { return; }
		
		// Unload current stylesheet if it's been loaded
		if(omnisidebar.ssuri != '') {
			if(omnisidebar.sss.sheetRegistered(omnisidebar.ssuri, omnisidebar.sss.AGENT_SHEET)) {
				omnisidebar.sss.unregisterSheet(omnisidebar.ssuri, omnisidebar.sss.AGENT_SHEET);
			}
			omnisidebar.ssuri = '';
		}
		
		// Bugfix for newly created profiles, needs a default value
		// Bugfix: sometimes these values are set to 0, probably due to some browser resizing going on somewhere
		var tempWidth = omnisidebar.box.getAttribute('width');
		if(!tempWidth || tempWidth == '0') { 
			var newWidth = omnisidebar.box.clientWidth || omnisidebar.width || 300;
			omnisidebar.box.setAttribute('width', newWidth);
		}
		var tempWidth = omnisidebar.box_twin.getAttribute('width');
		if(!tempWidth || tempWidth == '0') { 
			var newWidth = omnisidebar.box_twin.clientWidth || omnisidebar.width_twin || 300;
			omnisidebar.box_twin.setAttribute('width', newWidth);
		}
		omnisidebar.width = parseInt(omnisidebar.box.getAttribute('width'));
		omnisidebar.width_twin = parseInt(omnisidebar.box_twin.getAttribute('width'));
		
		// even though I already replace the resizing methods in similarweb, 
		// it still screws up the sidebar size sometimes when starting up so I'm hoping this fixes everything
		if(typeof(similarweb) != 'undefined') {
			similarweb.general.prefManager.setIntPref(similarweb.consts.PREF_SIDEBAR_WIDTH, omnisidebar.width);
			similarweb.general.prefManager.setCharPref(similarweb.consts.PREF_PREV_WIDTH, omnisidebar.width);
		}
		
		omnisidebar.sscode = '/*OmniSidebar CSS declarations of variable values*/\n';
		omnisidebar.sscode += '@namespace url(http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul);\n';
		omnisidebar.sscode += '@-moz-document url("chrome://browser/content/browser.xul") {\n';
		omnisidebar.sscode += '	#sidebar-box[customizing]  { width: ' + omnisidebar.width + 'px; }\n';
		omnisidebar.sscode += '	#sidebar-box-twin[customizing]  { width: ' + omnisidebar.width_twin + 'px; }\n';
		
		if(omnisidebar.prefs.renderabove.value) {
			omnisidebar.sscode += '	#sidebar-box[renderabove] { width: ' + omnisidebar.width + 'px; }\n';
			omnisidebar.sscode += '	#sidebar-box[renderabove]:not([movetoright]) { left: -' + omnisidebar.width + 'px; }\n';
			omnisidebar.sscode += '	#sidebar-box[renderabove][movetoright] { right: -' + omnisidebar.width + 'px; }\n';
			omnisidebar.sscode += '	#sidebar-box[renderabove="autohide"]:not([movetoright]) #omnisidebar_resizebox:hover,\n';
			omnisidebar.sscode += '	#sidebar-box[renderabove="autohide"]:not([movetoright]) #omnisidebar_resizebox[hover],\n';
			omnisidebar.sscode += '	#sidebar-box[renderabove]:not([renderabove="autohide"]):not([movetoright]) #omnisidebar_resizebox,\n';
			omnisidebar.sscode += '	#sidebar-box[renderabove][nohide]:not([movetoright]) #omnisidebar_resizebox,\n';
			omnisidebar.sscode += '	#sidebar-box[renderabove][customizing]:not([movetoright]) #omnisidebar_resizebox,\n';
			omnisidebar.sscode += '	#sidebar-box[customizing]:not([movetoright]) #omnisidebar_resizebox { left: ' + omnisidebar.width + 'px !important; }\n';
			omnisidebar.sscode += '	#sidebar-box[renderabove="autohide"][movetoright] #omnisidebar_resizebox:hover,\n';
			omnisidebar.sscode += '	#sidebar-box[renderabove="autohide"][movetoright] #omnisidebar_resizebox[hover],\n';
			omnisidebar.sscode += '	#sidebar-box[renderabove]:not([renderabove="autohide"])[movetoright] #omnisidebar_resizebox,\n';
			omnisidebar.sscode += '	#sidebar-box[renderabove][nohide][movetoright] #omnisidebar_resizebox,\n';
			omnisidebar.sscode += '	#sidebar-box[renderabove][customizing][movetoright] #omnisidebar_resizebox,\n';
			omnisidebar.sscode += '	#sidebar-box[customizing][movetoright] #omnisidebar_resizebox { right: ' + omnisidebar.width + 'px !important; }\n';
			// The !important tags are necessary
			
			// Bugfix for Tree Style Tabs: pinned tabs hide the top of the sidebar, they have a z-index of 100
			if(typeof(TreeStyleTabWindowHelper) != 'undefined') {
				omnisidebar.sscode += '	#sidebar-box[renderabove="autohide"] #omnisidebar_resizebox:hover,\n';
				omnisidebar.sscode += '	#sidebar-box[renderabove="autohide"] #omnisidebar_resizebox[hover],\n';
				omnisidebar.sscode += '	#sidebar-box[renderabove]:not([renderabove="autohide"]) #omnisidebar_resizebox { z-index: 200 !important; }\n';
			}
		}
		
		if(omnisidebar.prefs.renderaboveTwin.value) {
			omnisidebar.sscode += '	#sidebar-box-twin[renderabove] { width: ' + omnisidebar.width_twin + 'px; }\n';
			omnisidebar.sscode += '	#sidebar-box-twin[renderabove]:not([movetoleft]) { right: -' + omnisidebar.width_twin + 'px; }\n';
			omnisidebar.sscode += '	#sidebar-box-twin[renderabove][movetoleft] { left: -' + omnisidebar.width_twin + 'px; }\n';
			omnisidebar.sscode += '	#sidebar-box-twin[renderabove="autohide"]:not([movetoleft]) #omnisidebar_resizebox-twin:hover,\n';
			omnisidebar.sscode += '	#sidebar-box-twin[renderabove="autohide"]:not([movetoleft]) #omnisidebar_resizebox-twin[hover],\n';
			omnisidebar.sscode += '	#sidebar-box-twin[renderabove]:not([renderabove="autohide"]):not([movetoleft]) #omnisidebar_resizebox-twin,\n';
			omnisidebar.sscode += '	#sidebar-box-twin[renderabove][nohide]:not([movetoleft]) #omnisidebar_resizebox-twin,\n';
			omnisidebar.sscode += '	#sidebar-box-twin[renderabove][customizing]:not([movetoleft]) #omnisidebar_resizebox-twin,\n';
			omnisidebar.sscode += '	#sidebar-box-twin[customizing]:not([movetoleft]) #omnisidebar_resizebox-twin { right: ' + omnisidebar.width_twin + 'px !important; }\n';
			omnisidebar.sscode += '	#sidebar-box-twin[renderabove="autohide"][movetoleft] #omnisidebar_resizebox-twin:hover,\n';
			omnisidebar.sscode += '	#sidebar-box-twin[renderabove="autohide"][movetoleft] #omnisidebar_resizebox-twin[hover],\n';
			omnisidebar.sscode += '	#sidebar-box-twin[renderabove]:not([renderabove="autohide"])[movetoleft] #omnisidebar_resizebox-twin,\n';
			omnisidebar.sscode += '	#sidebar-box-twin[renderabove][nohide][movetoleft] #omnisidebar_resizebox-twin,\n';
			omnisidebar.sscode += '	#sidebar-box-twin[renderabove][customizing][movetoleft] #omnisidebar_resizebox-twin,\n';
			omnisidebar.sscode += '	#sidebar-box-twin[customizing][movetoleft] #omnisidebar_resizebox-twin { left: ' + omnisidebar.width_twin + 'px !important; }\n';
			// The !important tags are necessary
			
			// Bugfix for Tree Style Tabs: pinned tabs hide the top of the sidebar, they have a z-index of 100
			if(typeof(TreeStyleTabWindowHelper) != 'undefined') {
				omnisidebar.sscode += '	#sidebar-box-twin[renderabove="autohide"] #omnisidebar_resizebox-twin:hover,\n';
				omnisidebar.sscode += '	#sidebar-box-twin[renderabove="autohide"] #omnisidebar_resizebox-twin[hover],\n';
				omnisidebar.sscode += '	#sidebar-box-twin[renderabove]:not([renderabove="autohide"]) #omnisidebar_resizebox-twin { z-index: 200 !important; }\n';
			}
		}
		
		omnisidebar.sscode += '}';
			
		omnisidebar.ssuri = omnisidebar.ios.newURI("data:text/css," + encodeURIComponent(omnisidebar.sscode), null, null);
		omnisidebar.sss.loadAndRegisterSheet(omnisidebar.ssuri, omnisidebar.sss.AGENT_SHEET);
	},
	
	setHeight: function() {
		// I can't set these by css, cpu usage goes through the roof?!
		if(omnisidebar.prefs.renderabove.value && !omnisidebar.customizing) {
			omnisidebar.box.style.height = omnisidebar.appcontent.clientHeight +'px'; 
		} else {
			omnisidebar.box.style.height = '';
		}
		if(omnisidebar.prefs.renderaboveTwin.value && !omnisidebar.customizing) {
			omnisidebar.box_twin.style.height = omnisidebar.appcontent.clientHeight +'px';
		} else {
			omnisidebar.box_twin.style.height = '';
		}
	},
	
	// Sidebar display functions
	rendersidebar: function() {
		omnisidebar.setHeaders();
		omnisidebar.setHeight();
		omnisidebar.setWidth();
	},
	
	// Handles the headers visibility
	// Basically this hides the sidebar header if all its items are empty or if only the toolbar is visible and it has no visible buttons			
	setHeaders: function() {
		if((omnisidebar.prefs.hideheadertoolbar.value || !omnisidebar.toolbarhasbuttons()) 
		&& omnisidebar.prefs.hideheadertitle.value 
		&& omnisidebar.prefs.hideheaderdock.value 
		&& omnisidebar.prefs.hideheaderclose.value
		&& !omnisidebar.prefs.devTools.value) {
			omnisidebar.header.setAttribute('hidden', 'true');
		}
		else {
			omnisidebar.header.removeAttribute('hidden');
		}
		
		if((omnisidebar.prefs.hideheadertoolbarTwin.value || !omnisidebar.toolbarhasbuttons(true)) 
		&& omnisidebar.prefs.hideheadertitleTwin.value 
		&& omnisidebar.prefs.hideheaderdockTwin.value 
		&& omnisidebar.prefs.hideheadercloseTwin.value
		&& !omnisidebar.prefs.devToolsTwin.value) {
			omnisidebar.header_twin.setAttribute('hidden', 'true');
		}
		else {
			omnisidebar.header_twin.removeAttribute('hidden');
		}
	},
	
	// Checks if there are any (visible) buttons in the toolbar
	toolbarhasbuttons: function(twin) {
		if(!twin) {
			for(var i=0; i<omnisidebar.toolbar.childNodes.length; i++) {
				if(!omnisidebar.toolbar.childNodes[i].hasAttribute('collapsed') && !omnisidebar.toolbar.childNodes[i].hasAttribute('hidden')) {
					return true;
				}
			}
			return false;
		}
		else {
			for(var i=0; i<omnisidebar.toolbar_twin.childNodes.length; i++) {
				if(!omnisidebar.toolbar_twin.childNodes[i].hasAttribute('collapsed') && !omnisidebar.toolbar_twin.childNodes[i].hasAttribute('hidden')) {
					return true;
				}
			}
			return false;
		}
	},
	
	// Move sidebar to the right of the browser and the twin to the opposite side
	moveSidebars: function() {
		if(omnisidebar.prefs.mainSidebar.value == 'right') {
			omnisidebar.box.setAttribute('movetoright', 'true');
			omnisidebar.splitter.setAttribute('movetoright', 'true');
			if(omnisidebar.button) {
				omnisidebar.button.setAttribute('movetoright', 'true');
			}
			
			omnisidebar.box = omnisidebar.browser.insertBefore(omnisidebar.box, omnisidebar.browser.lastChild);
			omnisidebar.splitter = omnisidebar.browser.insertBefore(omnisidebar.splitter, omnisidebar.box);
			omnisidebar.resizer = omnisidebar.resizebox.insertBefore(omnisidebar.resizer, omnisidebar.resizesidebar);
			
			omnisidebar.box_twin.setAttribute('movetoleft', 'true');
			omnisidebar.splitter_twin.setAttribute('movetoleft', 'true');
			if(omnisidebar.button_twin) {
				omnisidebar.button_twin.setAttribute('movetoleft', 'true');
			}
			
			omnisidebar.splitter_twin = omnisidebar.browser.insertBefore(omnisidebar.splitter_twin, omnisidebar.browser.firstChild.nextSibling);
			omnisidebar.box_twin = omnisidebar.browser.insertBefore(omnisidebar.box_twin, omnisidebar.splitter_twin);
			omnisidebar.resizer_twin = omnisidebar.resizebox_twin.insertBefore(omnisidebar.resizer_twin, omnisidebar.resizesidebar_twin.nextSibling);
		}
		else {
			omnisidebar.box.removeAttribute('movetoright');
			omnisidebar.splitter.removeAttribute('movetoright');
			if(omnisidebar.button) {
				omnisidebar.button.removeAttribute('movetoright');
			}
			
			omnisidebar.splitter = omnisidebar.browser.insertBefore(omnisidebar.splitter, omnisidebar.browser.firstChild.nextSibling);
			omnisidebar.box = omnisidebar.browser.insertBefore(omnisidebar.box, omnisidebar.splitter);
			omnisidebar.resizer = omnisidebar.resizebox.insertBefore(omnisidebar.resizer, omnisidebar.resizesidebar.nextSibling);
			
			omnisidebar.box_twin.removeAttribute('movetoleft');
			omnisidebar.splitter_twin.removeAttribute('movetoleft');
			if(omnisidebar.button_twin) {
				omnisidebar.button_twin.removeAttribute('movetoleft');
			}
			
			omnisidebar.box_twin = omnisidebar.browser.insertBefore(omnisidebar.box_twin, omnisidebar.browser.lastChild);
			omnisidebar.splitter_twin = omnisidebar.browser.insertBefore(omnisidebar.splitter_twin, omnisidebar.box_twin);
			omnisidebar.resizer_twin = omnisidebar.resizebox_twin.insertBefore(omnisidebar.resizer_twin, omnisidebar.resizesidebar_twin);
		}
		
		// Compatibility fix for Findbar Tweak: make sure the position of the findbar is updated if needed when it is on top
		if(typeof(findbartweak) != 'undefined' && findbartweak.initialized && findbartweak.movetoTop.value && !gFindBar.hidden) {
			findbartweak.moveTop();
		}
	},
	
	// Set the sidebar above the webpage box; everything goes in the resizebox to enable resizing while in this mode
	setabove: function() {
		// Starting in Firefox 7 the resize mechanism when dragging a sidebar splitter is changed, it doesn't work the same way as before
		// With two sidebars it completely screws up so I'm setting these all the time instead of conditionally as before to always handle resizes correctly
		omnisidebar.splitter_twin.setAttribute('disabled', 'true');
		omnisidebar.splitter.setAttribute('disabled', 'true');
		omnisidebar.listenerAid.add(omnisidebar.splitter_twin, 'mousedown', omnisidebar.dragStart, false);
		omnisidebar.listenerAid.add(omnisidebar.splitter, 'mousedown', omnisidebar.dragStart, false);
			
		if(omnisidebar.prefs.renderabove.value) {
			omnisidebar.box.setAttribute('renderabove', omnisidebar.prefs.undockMode.value);
			omnisidebar.splitter.setAttribute('renderabove', 'true');
			
			omnisidebar.header = omnisidebar.resizesidebar.appendChild(omnisidebar.header);
			omnisidebar.sidebar = omnisidebar.resizesidebar.appendChild(omnisidebar.sidebar);
			omnisidebar.resizebox.removeAttribute('hidden');
			
			omnisidebar.dockbutton.setAttribute('omnisidebardock', 'true');
			omnisidebar.dockbutton.setAttribute('tooltiptext', omnisidebar.strings.getString('omnisidebardockbutton'));
		}
		else {
			omnisidebar.box.removeAttribute('renderabove');
			omnisidebar.splitter.removeAttribute('renderabove');
			
			omnisidebar.header = omnisidebar.box.appendChild(omnisidebar.header);
			omnisidebar.sidebar = omnisidebar.box.appendChild(omnisidebar.sidebar);
			omnisidebar.resizebox.setAttribute('hidden', 'true');
			
			omnisidebar.dockbutton.removeAttribute('omnisidebardock');
			omnisidebar.dockbutton.setAttribute('tooltiptext', omnisidebar.strings.getString('omnisidebarundockbutton'));
		}
		
		if(omnisidebar.prefs.renderaboveTwin.value) {
			omnisidebar.box_twin.setAttribute('renderabove', omnisidebar.prefs.undockModeTwin.value);
			omnisidebar.splitter_twin.setAttribute('renderabove', 'true');
			
			omnisidebar.header_twin = omnisidebar.resizesidebar_twin.appendChild(omnisidebar.header_twin);
			omnisidebar.sidebar_twin = omnisidebar.resizesidebar_twin.appendChild(omnisidebar.sidebar_twin);
			omnisidebar.resizebox_twin.removeAttribute('hidden');
			
			omnisidebar.dockbutton_twin.setAttribute('omnisidebardock', 'true');
			omnisidebar.dockbutton_twin.setAttribute('tooltiptext', omnisidebar.strings.getString('omnisidebardockbutton'));
		}
		else {
			omnisidebar.box_twin.removeAttribute('renderabove');
			omnisidebar.splitter_twin.removeAttribute('renderabove');
			
			omnisidebar.header_twin = omnisidebar.box_twin.appendChild(omnisidebar.header_twin);
			omnisidebar.sidebar_twin = omnisidebar.box_twin.appendChild(omnisidebar.sidebar_twin);
			omnisidebar.resizebox_twin.setAttribute('hidden', 'true');
			
			omnisidebar.dockbutton_twin.removeAttribute('omnisidebardock');
			omnisidebar.dockbutton_twin.setAttribute('tooltiptext', omnisidebar.strings.getString('omnisidebarundockbutton'));
		}
		
		// Auto-close feature
		if( (omnisidebar.prefs.renderabove.value && omnisidebar.prefs.undockMode.value == 'autoclose')
		||  (omnisidebar.prefs.renderaboveTwin.value && omnisidebar.prefs.undockModeTwin.value == 'autoclose') ) {
			if(!omnisidebar.autoClosing) {
				omnisidebar.listenerAid.add(window, 'focus', omnisidebar.autoClose, true);
				omnisidebar.autoClosing = true;
			}
		} else if(omnisidebar.autoClosing) {
			omnisidebar.listenerAid.remove(window, 'focus', omnisidebar.autoClose, true);
			omnisidebar.autoClosing = false;
		}
		
		// rendersidebar() needs to be called everytime the window is resized so the sidebars are properly resized as well
		// This is done in a timer to prevent excessive calls when resizing
		if(omnisidebar.prefs.renderabove.value || omnisidebar.prefs.renderaboveTwin.value) {
			if(!omnisidebar.listeningResize) {
				omnisidebar.listenerAid.add(window, 'resize', omnisidebar.resizeListener, false);
				
				// An issue with LessChromeHD, when shown the urlbar is blocked by the sidebars
				// Here's to hoping nothing else is affected by this
				AddonManager.addAddonListener(omnisidebar.lessChromeListener);
				AddonManager.getAddonByID('lessChrome.HD@prospector.labs.mozilla', function(addon) {
					if(addon && addon.isActive) { gNavToolbox.style.zIndex = '250'; }
				});
				
				omnisidebar.listeningResize = true;
			}
		} else if(omnisidebar.listeningResize) {
			omnisidebar.listenerAid.remove(window, 'resize', omnisidebar.resizeListener, false);
			
			AddonManager.removeAddonListener(omnisidebar.lessChromeListener);
			gNavToolbox.style.zIndex = '';
			
			omnisidebar.listeningResize = false;
		}
	},
	
	resizeListener: function() {
		omnisidebar.timerAid.init('resize', omnisidebar.rendersidebar, 750);
	},
	
	lessChromeListener: {
		onEnabled: function(addon) { 
			if(addon.id == 'lessChrome.HD@prospector.labs.mozilla') { gNavToolbox.style.zIndex = '250'; }
		},
		onDisabled: function(addon) {
			if(addon.id == 'lessChrome.HD@prospector.labs.mozilla') { gNavToolbox.style.zIndex = ''; }
		}
	},
	
	toggleabove: function(twin) {
		if(omnisidebar.customizing) { return false; }
		
		if(!twin) {
			omnisidebar.prefs.renderabove.value = !omnisidebar.prefs.renderabove.value;
		} else {
			omnisidebar.prefs.renderaboveTwin.value = !omnisidebar.prefs.renderaboveTwin.value;
		}
	},
	
	// Toolbar toggler by toolbar menu entries
	settoolbar: function(twin) {
		if(!twin) {
			omnisidebar.prefs.hideheadertoolbar.value = (omnisidebar.prefs.hideheadertoolbar.value) ? false : true;
		} else {
			omnisidebar.prefs.hideheadertoolbarTwin.value = (omnisidebar.prefs.hideheadertoolbarTwin.value) ? false : true;
		}
	},
	
	// General toggle functions
	toggleTwin: function() {
		if(omnisidebar.button_twin) {
			omnisidebar.hideIt(omnisidebar.button_twin, omnisidebar.prefs.twinSidebar.value);
		}
		omnisidebar.setKeysets();
		
		if(omnisidebar.prefs.twinSidebar.value) {
			if(!omnisidebar.twined) {
				omnisidebar.setTwinBroadcasters();
				// Check if the page assigned to the sidebar is still valid (happens when disabling add-ons like the feedbar for example)
				if(omnisidebar.box_twin.getAttribute('sidebarcommand')) {
					if(omnisidebar.initialized
					|| !document.getElementById(omnisidebar.box_twin.getAttribute('sidebarcommand'))
					|| document.getElementById(omnisidebar.box_twin.getAttribute('sidebarcommand')).hasAttribute('disabled')) {
						omnisidebar.box_twin.setAttribute('sidebarcommand', '');
						omnisidebar.title_twin.value = '';
					} else {
						omnisidebar.toggleSidebarTwin(omnisidebar.box_twin.getAttribute('sidebarcommand'), true);
					}
				}
				omnisidebar.setTwinToolbarButtons();
				omnisidebar.cloneDevToolbar();
				
				omnisidebar.twined = true;
			}
			
			if(omnisidebar.initialized) {
				omnisidebar.toggleDevTools();
				omnisidebar.hideIt(omnisidebar.box_twin, true);
				omnisidebar.setlast();
			}
		}
		else {
			omnisidebar.hideIt(omnisidebar.box_twin, false);
			omnisidebar.splitter_twin.hidden = true;
		}
		omnisidebar.hideIt(omnisidebar.contextmenuitemtoggle_twin, omnisidebar.prefs.twinSidebar.value);
		omnisidebar.hideIt(omnisidebar.appmenuitemtoggle_twin, omnisidebar.prefs.twinSidebar.value);
		omnisidebar.hideIt(omnisidebar.viewmenuitemtoggle_twin, omnisidebar.prefs.twinSidebar.value);
		omnisidebar.hideIt(document.getElementById('viewTwinSidebarMenuMenu'), omnisidebar.prefs.twinSidebar.value);
		omnisidebar.btnLabels();
	},
	
	toggleToolbar: function() {
		omnisidebar.hideIt(omnisidebar.toolbar, !omnisidebar.prefs.hideheadertoolbar.value && !omnisidebar.devButton.hasAttribute('checked'));
		omnisidebar.hideIt(omnisidebar.toolbar_twin, !omnisidebar.prefs.hideheadertoolbarTwin.value && !omnisidebar.devButton_twin.hasAttribute('checked'));
		
		if(omnisidebar.prefs.hideheadertoolbar.value) {
			omnisidebar.contextmenuitemtoggle.removeAttribute('checked');
			omnisidebar.appmenuitemtoggle.removeAttribute('checked');
			omnisidebar.viewmenuitemtoggle.removeAttribute('checked');
		}
		else {
			omnisidebar.contextmenuitemtoggle.setAttribute('checked', 'true');
			omnisidebar.appmenuitemtoggle.setAttribute('checked', 'true');
			omnisidebar.viewmenuitemtoggle.setAttribute('checked', 'true');
		}
		
		if(omnisidebar.prefs.hideheadertoolbarTwin.value) {
			omnisidebar.contextmenuitemtoggle_twin.removeAttribute('checked');
			omnisidebar.appmenuitemtoggle_twin.removeAttribute('checked');
			omnisidebar.viewmenuitemtoggle_twin.removeAttribute('checked');
		}
		else {
			omnisidebar.contextmenuitemtoggle_twin.setAttribute('checked', 'true');
			omnisidebar.appmenuitemtoggle_twin.setAttribute('checked', 'true');
			omnisidebar.viewmenuitemtoggle_twin.setAttribute('checked', 'true');
		}
	},
	
	toggletitle: function() {
		if(omnisidebar.prefs.hideheadertitle.value) {
			omnisidebar.box.setAttribute('notitle', 'true');
		} else {
			omnisidebar.box.removeAttribute('notitle');
		}
		
		if(omnisidebar.prefs.hideheadertitleTwin.value) {
			omnisidebar.box_twin.setAttribute('notitle', 'true');
		} else {
			omnisidebar.box_twin.removeAttribute('notitle');
		}
	},
	
	toggleTitleButton: function() {
		if(!omnisidebar.prefs.titleButton.value) {
			omnisidebar.box.setAttribute('noTitleButton', 'true');
		} else {
			omnisidebar.box.removeAttribute('noTitleButton');
		}
		
		if(!omnisidebar.prefs.titleButtonTwin.value) {
			omnisidebar.box_twin.setAttribute('noTitleButton', 'true');
		} else {
			omnisidebar.box_twin.removeAttribute('noTitleButton');
		}
	},
	
	toggledockbutton: function() {
		if(omnisidebar.prefs.hideheaderdock.value) {
			omnisidebar.box.setAttribute('nodock', 'true');
		} else {
			omnisidebar.box.removeAttribute('nodock');
		}
		
		if(omnisidebar.prefs.hideheaderdockTwin.value) {
			omnisidebar.box_twin.setAttribute('nodock', 'true');
		} else {
			omnisidebar.box_twin.removeAttribute('nodock');
		}
	},
	
	toggleclose: function() {
		if(omnisidebar.prefs.hideheaderclose.value) {
			omnisidebar.box.setAttribute('noclose', 'true');
		} else {
			omnisidebar.box.removeAttribute('noclose');
		}
		
		if(omnisidebar.prefs.hideheadercloseTwin.value) {
			omnisidebar.box_twin.setAttribute('noclose', 'true');
		} else {
			omnisidebar.box_twin.removeAttribute('noclose');
		}
	},
	
	togglebuttons: function() {
		if(omnisidebar.prefs.alternatebtns.value) {
			omnisidebar.toolbar.setAttribute('alternatebtns', 'true');
			omnisidebar.devToolbar.setAttribute('alternatebtns', 'true');
		} else {
			omnisidebar.toolbar.removeAttribute('alternatebtns');
			omnisidebar.devToolbar.removeAttribute('alternatebtns');
		}
		
		if(omnisidebar.prefs.alternatebtnsTwin.value) {
			omnisidebar.toolbar_twin.setAttribute('alternatebtns', 'true');
			if(omnisidebar.devToolbar_twin) {
				omnisidebar.devToolbar_twin.setAttribute('alternatebtns', 'true');
			}
		} else {
			omnisidebar.toolbar_twin.removeAttribute('alternatebtns');
			if(omnisidebar.devToolbar_twin) {
				omnisidebar.devToolbar_twin.removeAttribute('alternatebtns');
			}
		}
	},
	
	toggleFX: function() {
		if(omnisidebar.prefs.disablefx.value) {
			omnisidebar.box.setAttribute('disablefx', 'true');
			omnisidebar.box_twin.setAttribute('disablefx', 'true');
		}
		else {
			omnisidebar.box.removeAttribute('disablefx');
			omnisidebar.box_twin.removeAttribute('disablefx');
		}
	},
	
	toggleIconsColor: function() {
		omnisidebar.toolbar.setAttribute('coloricons', omnisidebar.prefs.coloricons.value);
		omnisidebar.devToolbar.setAttribute('coloricons', omnisidebar.prefs.coloricons.value);
		omnisidebar.toolbar_twin.setAttribute('coloricons', omnisidebar.prefs.coloriconsTwin.value);
		
		if(omnisidebar.devToolbar_twin) {
			omnisidebar.devToolbar_twin.setAttribute('coloricons', omnisidebar.prefs.coloriconsTwin.value);
		}
	},
	
	toggleGlass: function() {
		omnisidebar.glassuri = omnisidebar.ios.newURI("chrome://omnisidebar/skin/glass.css", null, null);
		if(omnisidebar.prefs.glassStyle.value && !omnisidebar.sss.sheetRegistered(omnisidebar.glassuri, omnisidebar.sss.AGENT_SHEET)) {
			omnisidebar.sss.loadAndRegisterSheet(omnisidebar.glassuri, omnisidebar.sss.AGENT_SHEET);
		} else if(!omnisidebar.prefs.glassStyle.value && omnisidebar.sss.sheetRegistered(omnisidebar.glassuri, omnisidebar.sss.AGENT_SHEET)) {
			omnisidebar.sss.unregisterSheet(omnisidebar.glassuri, omnisidebar.sss.AGENT_SHEET);
		}
		
		var appversion = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo).version;
		var versionChecker = Components.classes["@mozilla.org/xpcom/version-comparator;1"].getService(Components.interfaces.nsIVersionComparator);
		if(versionChecker.compare(appversion, "5.0") < 0) {
			omnisidebar.glassversionuri = omnisidebar.ios.newURI("chrome://omnisidebar/skin/glass-fx4.css", null, null);
		} else {
			omnisidebar.glassversionuri = omnisidebar.ios.newURI("chrome://omnisidebar/skin/glass-fx5.css", null, null);
		}
		
		if(omnisidebar.prefs.glassStyle.value && !omnisidebar.sss.sheetRegistered(omnisidebar.glassversionuri, omnisidebar.sss.AGENT_SHEET)) {
			omnisidebar.sss.loadAndRegisterSheet(omnisidebar.glassversionuri, omnisidebar.sss.AGENT_SHEET);
		} else if(!omnisidebar.prefs.glassStyle.value && omnisidebar.sss.sheetRegistered(omnisidebar.glassversionuri, omnisidebar.sss.AGENT_SHEET)) {
			omnisidebar.sss.unregisterSheet(omnisidebar.glassversionuri, omnisidebar.sss.AGENT_SHEET);
		}
	},
	
	toggleStylish: function() { 
		if(!omnisidebar.stylishbutton) { return; }		
		
		if(document.getElementById('viewStylishSidebar')) {
			omnisidebar.hideIt(omnisidebar.stylishbutton, true);
			omnisidebar.prefs.stylish.value = true;
		}
		else {
			omnisidebar.prefs.stylish.value = false;
			// Had to set with a timeout, if you disabled stylish and restarted the button wouldn't be hidden
			omnisidebar.timerAid.init('toggleStylish', function() { omnisidebar.hideIt(omnisidebar.stylishbutton, false); }, 100);
		}
	},
	
	// sets a console broadcaster for opening the error console in the sidebar if Console2 has not been found
	toggleConsole: function() {
		if(!document.getElementById('viewConsole2Sidebar')) {
			var consoleBroadcaster = document.createElement('broadcaster');
			consoleBroadcaster.id = 'viewConsole2Sidebar';
			consoleBroadcaster.setAttribute('label', omnisidebar.strings.getString('consoleSidebarLabel'));
			consoleBroadcaster.setAttribute('tooltiptext', omnisidebar.strings.getString('consoleSidebarTooltip'));
			consoleBroadcaster.setAttribute('autoCheck', 'false');
			consoleBroadcaster.setAttribute('type', 'checkbox');
			consoleBroadcaster.setAttribute('group', 'sidebar');
			consoleBroadcaster.setAttribute('sidebarurl', 'chrome://global/content/console.xul');
			consoleBroadcaster.setAttribute('sidebartitle', omnisidebar.strings.getString('consoleSidebarLabel'));
			consoleBroadcaster.setAttribute('oncommand', 'toggleSidebar("viewConsole2Sidebar");');
			document.getElementById('mainBroadcasterSet').appendChild(consoleBroadcaster);
		}
			
		document.getElementById('console_sidebar_button').setAttribute('observes', 'viewConsole2Sidebar');
	},
	
	// sets a download manager broadcaster for opening the downloads manager in the sidebar if dmt has not been found
	toggleDMT: function() {
		if(!document.getElementById('viewDmtSidebar')) {
			var dmtBroadcaster = document.createElement('broadcaster');
			dmtBroadcaster.id = 'viewDmtSidebar';
			dmtBroadcaster.setAttribute('label', omnisidebar.strings.getString('dmtSidebarLabel'));
			dmtBroadcaster.setAttribute('tooltiptext', omnisidebar.strings.getString('dmtSidebarTooltip'));
			dmtBroadcaster.setAttribute('autoCheck', 'false');
			dmtBroadcaster.setAttribute('type', 'checkbox');
			dmtBroadcaster.setAttribute('group', 'sidebar');
			dmtBroadcaster.setAttribute('sidebarurl', 'chrome://mozapps/content/downloads/downloads.xul');
			dmtBroadcaster.setAttribute('sidebartitle', omnisidebar.strings.getString('dmtSidebarLabel'));
			dmtBroadcaster.setAttribute('oncommand', 'toggleSidebar("viewDmtSidebar");');
			document.getElementById('mainBroadcasterSet').appendChild(dmtBroadcaster);
		}
	},
	
	toggleDOMInspector: function(DOMInspectorBroadcaster) {
		if(typeof(inspectDOMDocument) == 'undefined') {
			DOMInspectorBroadcaster.setAttribute('disabled', 'true');
		} else {
			DOMInspectorBroadcaster.removeAttribute('disabled');
		}
	},
	
	toggleDevTools: function() {
		omnisidebar.hideIt(omnisidebar.devButton, omnisidebar.prefs.devTools.value);
		omnisidebar.hideIt(omnisidebar.devButton_twin, omnisidebar.prefs.devToolsTwin.value);
		
		if(!omnisidebar.prefs.devTools.value) {
			omnisidebar.devButton.removeAttribute('checked');
			omnisidebar.hideIt(omnisidebar.devToolbar, false);
			omnisidebar.hideIt(omnisidebar.toolbar, !omnisidebar.prefs.hideheadertoolbar.value);
			document.getElementById('viewDOMInspectorSidebar').setAttribute('disabled', 'true');
			document.getElementById('viewConsole2Sidebar').setAttribute('disabled', 'true');
			document.getElementById('viewURISidebar').setAttribute('disabled', 'true');
		} else {
			if(!omnisidebar.initialized) {
				omnisidebar.hideIt(omnisidebar.toolbar, !omnisidebar.devButton.hasAttribute('checked') && !omnisidebar.prefs.hideheadertoolbarTwin.value);
				omnisidebar.hideIt(omnisidebar.devToolbar, omnisidebar.devButton.hasAttribute('checked'));
			}
			omnisidebar.toggleDOMInspector(document.getElementById('viewDOMInspectorSidebar'));
			document.getElementById('viewConsole2Sidebar').removeAttribute('disabled');
			document.getElementById('viewURISidebar').removeAttribute('disabled');
		}
		
		if(!omnisidebar.prefs.devToolsTwin.value) {
			omnisidebar.devButton_twin.removeAttribute('checked');
			omnisidebar.hideIt(omnisidebar.toolbar_twin, !omnisidebar.prefs.hideheadertoolbarTwin.value);
			if(omnisidebar.twined) {
				omnisidebar.hideIt(omnisidebar.devToolbar_twin, false);
				document.getElementById('viewDOMInspectorSidebar-twin').setAttribute('disabled', 'true');
				document.getElementById('viewConsole2Sidebar-twin').setAttribute('disabled', 'true');
				document.getElementById('viewURISidebar-twin').setAttribute('disabled', 'true');
			}
		
		} else {
			omnisidebar.hideIt(omnisidebar.toolbar_twin, !omnisidebar.devButton_twin.hasAttribute('checked') && !omnisidebar.prefs.hideheadertoolbarTwin.value);
			if(omnisidebar.twined) {
				omnisidebar.hideIt(omnisidebar.devToolbar_twin, omnisidebar.devButton_twin.hasAttribute('checked'));
				omnisidebar.toggleDOMInspector(document.getElementById('viewDOMInspectorSidebar-twin'));
				document.getElementById('viewConsole2Sidebar-twin').removeAttribute('disabled');
				document.getElementById('viewURISidebar-twin').removeAttribute('disabled');
			}
		}
	},
	
	// toggles what always opens in the sidebar
	toggleAlways: function() {
		if(omnisidebar.prefs.alwaysAddons.value) {
			if(document.getElementById('Tools:Addons').getAttribute('oncommand')) {
				document.getElementById('Tools:Addons')._command = document.getElementById('Tools:Addons').getAttribute('oncommand');
			}
			document.getElementById('Tools:Addons').removeAttribute('oncommand');
			document.getElementById('Tools:Addons').setAttribute('command', 'viewAddonSidebar');
		} else {
			document.getElementById('Tools:Addons').removeAttribute('command');
			if(document.getElementById('Tools:Addons')._command) {
				document.getElementById('Tools:Addons').setAttribute('oncommand', document.getElementById('Tools:Addons')._command);
			}
		}
		
		if(omnisidebar.prefs.alwaysConsole.value) {
			if(!omnisidebar._toJavaScriptConsole) {
				omnisidebar._toJavaScriptConsole = toJavaScriptConsole;
			}
			toJavaScriptConsole = function() { toggleSidebar("viewConsole2Sidebar"); };
			
			if(typeof(toErrorConsole) != 'undefined') {
				if(!omnisidebar._toErrorConsole) {
					omnisidebar._toErrorConsole = toErrorConsole;
				}
				toErrorConsole = function() { toggleSidebar("viewConsole2Sidebar"); };
			}
		} else {
			if(omnisidebar._toJavaScriptConsole) {
				toJavaScriptConsole = omnisidebar._toJavaScriptConsole;
			}
			if(omnisidebar._toErrorConsole) {
				toErrorConsole = omnisidebar._toErrorConsole;
			}
		}
		
		if(document.getElementById('Tools:Downloads').getAttribute('oncommand') == 'dmtToggleDownloadMgr(true,true);') { return; }
		if(omnisidebar.prefs.alwaysDMT.value) {
			if(document.getElementById('Tools:Downloads').getAttribute('oncommand')) {
				document.getElementById('Tools:Downloads')._command = document.getElementById('Tools:Downloads').getAttribute('oncommand');
			}
			document.getElementById('Tools:Downloads').removeAttribute('oncommand');
			document.getElementById('Tools:Downloads').setAttribute('command', 'viewDmtSidebar');
		} else {
			document.getElementById('Tools:Downloads').removeAttribute('command');
			if(document.getElementById('Tools:Downloads')._command) {
				document.getElementById('Tools:Downloads').setAttribute('oncommand', document.getElementById('Tools:Downloads')._command);
			}
		}
			
	},		
	
	// Clones the developer toolbar to the twin sidebar
	cloneDevToolbar: function() {
		omnisidebar.devToolbar_twin = document.getElementById('omnisidebarDevToolbar').cloneNode(true);
		omnisidebar.devToolbar_twin.id += '-twin';
		for(var i=0; i<omnisidebar.devToolbar_twin.childNodes.length; i++) {
			omnisidebar.devToolbar_twin.childNodes[i].id += '-twin';
		}
		omnisidebar.devToolbar_twin = omnisidebar.header_twin.insertBefore(omnisidebar.devToolbar_twin, omnisidebar.stack_twin);
		omnisidebar.setToolbarButtons(omnisidebar.devToolbar_twin, true);
		
		if(omnisidebar.initialized) {
			omnisidebar.togglebuttons();
			omnisidebar.toggleIconsColor();
		}
	},
	
	toggleDevToolbar: function(sidebar) {
		if(sidebar == 'twin') {
			if(!omnisidebar.devToolbar_twin) { return; }			
			var toolbar = omnisidebar.toolbar_twin;
			var devToolbar = omnisidebar.devToolbar_twin;
			var devButton = omnisidebar.devButton_twin;
			var hidePref = omnisidebar.prefs.hideheadertoolbarTwin.value;
		} else {
			var toolbar = omnisidebar.toolbar;
			var devToolbar = omnisidebar.devToolbar;
			var devButton = omnisidebar.devButton;
			var hidePref = omnisidebar.prefs.hideheadertoolbar.value;
		}
		
		if(devButton.hasAttribute('checked')) {
			devButton.removeAttribute('checked');
		} else {
			devButton.setAttribute('checked', 'true');
		}
		omnisidebar.hideIt(toolbar, !devButton.hasAttribute('checked') && !hidePref);
		omnisidebar.hideIt(devToolbar, devButton.hasAttribute('checked'));
	},
	
	openURIBar: function(e, el, anchor, menu) {
		if(e.originalTarget.id == 'uri_sidebar_button' || e.originalTarget.id == 'uri_sidebar_button-twin') {
			document.getElementById(menu).style.width = document.getElementById(anchor).clientWidth -2 +'px';
			document.getElementById(menu).openPopup(document.getElementById(anchor), 'after_start');
			
		} else if(el.getAttribute('group') == 'sidebar') {
			toggleSidebar('viewURISidebar');
		} else if(el.getAttribute('group') == 'twinSidebar') {
			omnisidebar.toggleSidebarTwin('viewURISidebar-twin');
		}
	},
	
	// Set the value of the developers tools URI bar to the value in the broadcaster
	resetURIBar: function(menu, bar, broadcaster) {
		document.getElementById(menu.getAttribute('box')).setAttribute('nohide', 'true');
		document.getElementById(bar).value = document.getElementById(broadcaster).getAttribute('sidebarurl');
		document.getElementById(bar).focus();
		document.getElementById(bar).select();
	},
	
	// loses focus from the texbox
	blurURIBar: function(menu, bar) {
		document.getElementById(menu.getAttribute('box')).removeAttribute('nohide');
		
		document.getElementById('main-window').focus();
	},
	
	// Loads the uri bar value into the sidebar
	loadURIBar: function(menu, bar, broadcaster) {
		omnisidebar.blurURIBar(document.getElementById(menu), bar);
		document.getElementById(menu).hidePopup();
		
		if(document.getElementById(bar).value.indexOf('about:') !== 0 && document.getElementById(bar).value.indexOf('chrome://') !== 0) { return; }
		
		document.getElementById(broadcaster).setAttribute('sidebarurl', document.getElementById(bar).value);
		document.getElementById(broadcaster).setAttribute('sidebartitle', document.getElementById(bar).value);
		document.getElementById(broadcaster).removeAttribute('checked'); // To make sure it always loads the sidebar from the same broadcaster
		if(document.getElementById(broadcaster).getAttribute('group') == 'sidebar') {
			toggleSidebar(broadcaster);
		} else if(document.getElementById(broadcaster).getAttribute('group') == 'twinSidebar') {
			omnisidebar.toggleSidebarTwin(broadcaster);
		}
	},
	
	keydownURIBar: function(e, menu, bar, broadcaster) {
		if(e.which == 27) {
			omnisidebar.blurURIBar(document.getElementById(menu), bar);
			document.getElementById(menu).hidePopup();
			return false;
		}
		if(e.which == 13) {
			omnisidebar.loadURIBar(menu, bar, broadcaster);
			return true;
		}
		return true;
	},
		
	// Stop LessChrome from showing the toolbox when the sidebar menus are triggered
	cancelLessChrome: function(e) {
		// Omnisidebar popup menus (and a few from right-clicks)
		if(e.target.id == 'openTwinSidebarMenu'
		|| e.target.id == 'openSidebarMenu'
		|| e.target.id == 'omnisidebarOptionsMenu'
		|| e.target.id == 'omnisidebarURIBarMenu'
		|| e.target.id == 'omnisidebarURIBarMenu-twin'
		// Right-clicking the header
		|| (e.target.triggerNode && (omnisidebar.hasAncestor(e.target.triggerNode, omnisidebar.header) || omnisidebar.hasAncestor(e.target.triggerNode, omnisidebar.header_twin)) )
		// Right-clicking elements in the actual sidebars
		|| (e.target.ownerDocument && 
			( (omnisidebar.sidebar.contentDocument && omnisidebar.sidebar.contentDocument == e.target.ownerDocument) 
			|| (omnisidebar.sidebar_twin.contentDocument && omnisidebar.sidebar_twin.contentDocument == e.target.ownerDocument) )
		) ) {
			e.preventDefault();
		}
	},
	
	// SimilarWeb add-on: Do not auto-hide if the 'add site' dialog is opened
	similarWebPopupShowing: function() {
		if(!omnisidebar.box.hidden && omnisidebar.box.getAttribute('sidebarcommand') == 'viewSimilarWebSidebar') {
			omnisidebar.setHover(omnisidebar.resizebox, true);
		}
		else if(!omnisidebar.box_twin.hidden && omnisidebar.box_twin.getAttribute('sidebarcommand') == 'viewSimilarWebSidebar-twin') {
			omnisidebar.setHover(omnisidebar.resizebox_twin, true);
		}
	},
	similarWebPopupHiding: function() {
		omnisidebar.setBothHovers(false);
	},
	
	// Bugfix: incompatibility with the SimilarWeb add-on, it has its own sidebar handling mechanism which I have to override
	// I'm trying a radical approach, substituting all SimilarWeb functions related only to this subject with dummy functions, it doesn't break add-on functionality
	fixSimilarWeb: function() {
		if(typeof(similarweb) == 'undefined') { return; }
		
		// Replace a bunch of functions that would conflict with the sidebar's appearance and display
		similarweb.overlay.checkRtlBrowser = function() { similarweb.overlay.strDirection = 'ltr'; };
		similarweb.overlay.initSidebarAppearance = function() { similarweb.overlay.m_blnSidebarInitialized = true; };
		similarweb.overlay.moveToRight = function() { return; };
		similarweb.overlay.moveToLeft = function() { return; };
		similarweb.sidebar.undoSidebarApperance = function() { return; };
		similarweb.sidebar.setSidebarWidth = function() { return; };
		
		if(!omnisidebar.initialized) { return; }
		
		// bunch of properties that may have already been modified by SimilarWeb
		omnisidebar.sidebar.style.maxWidth = '';
		omnisidebar.sidebar.style.minWidth = '5px';
		omnisidebar.sidebar.style.width = '';
		omnisidebar.sidebar_twin.style.maxWidth = '';
		omnisidebar.sidebar_twin.style.minWidth = '5px';
		omnisidebar.sidebar_twin.style.width = '';
		
		omnisidebar.box.style.minWidth = '5px';
		omnisidebar.box_twin.style.minWidth = '5px';
		omnisidebar.hideIt(omnisidebar.splitter, (!omnisidebar.box.hidden && !omnisidebar.prefs.renderabove.value));
		
		// Do not auto-hide if the 'add site' dialog is opened
		omnisidebar.listenerAid.add(document.getElementById('pnlSimilarWebAddSite'), 'popupshowing', omnisidebar.similarWebPopupShowing, false);
		omnisidebar.listenerAid.add(document.getElementById('pnlSimilarWebAddSite'), 'popuphiding', omnisidebar.similarWebPopupHiding, false);
		omnisidebar.listenerAid.add(document.getElementById('pnlSimilarWebThankYou'), 'popupshowing', omnisidebar.similarWebPopupShowing, false);
		omnisidebar.listenerAid.add(document.getElementById('pnlSimilarWebThankYou'), 'popuphiding', omnisidebar.similarWebPopupHiding, false);
	},
	
	// compatibility with MileWideBack
	// keep the sidebar visible when hovering the strip if it's opened and auto-hiding
	milewidebackHover: function() {
		if(omnisidebar.prefs.mainSidebar.value == 'left'
		&& !omnisidebar.box.hidden) {
			omnisidebar.setHover(omnisidebar.resizebox, true);
		}
		else if(omnisidebar.prefs.mainSidebar.value == 'right'
		&& !omnisidebar.box_twin.hidden) {
			omnisidebar.setHover(omnisidebar.resizebox_twin, true);
		}
	},
	milewidebackOut: function() {
		omnisidebar.setBothHovers(false);
	},
	
	// Sets toolbar context menu omnisidebar options item according to what called it
	// The timers is so the menus are given enough time to be populated
	setContextMenu: function(e) {
		if(e.originalTarget.triggerNode.id == 'omnisidebar_button' 
		|| e.originalTarget.triggerNode.id == 'omnisidebarToolbar' 
		|| e.originalTarget.triggerNode.id == 'sidebar-header' 
		|| e.originalTarget.triggerNode.parentNode.id == 'sidebar-header' 
		|| e.originalTarget.triggerNode.parentNode.id == 'omnisidebarToolbar'
		|| e.originalTarget.triggerNode.id == 'omnisidebar_button-twin' 
		|| e.originalTarget.triggerNode.id == 'omnisidebarToolbar-twin' 
		|| e.originalTarget.triggerNode.id == 'sidebar-header-twin' 
		|| e.originalTarget.triggerNode.parentNode.id == 'sidebar-header-twin' 
		|| e.originalTarget.triggerNode.parentNode.id == 'omnisidebarToolbar-twin') {
			omnisidebar.contextmenuitemoptions.removeAttribute('hidden');
			omnisidebar.menuseparator.removeAttribute('hidden');
			// Compatibility fix for Totaltoolbar, setting all these options on omnisidebar's toolbars just doesn't work and I wantto prevent any possible errors from it
			if(document.getElementById('tt-toolbar-properties')) {
				document.getElementById('tt-toolbar-properties').setAttribute('disabled', 'true');
			}
			
			if(omnisidebar.hasAncestor(e.originalTarget.triggerNode, omnisidebar.header)) {
				omnisidebar.setHover(omnisidebar.resizebox, true);
			}
			else if(omnisidebar.hasAncestor(e.originalTarget.triggerNode, omnisidebar.header_twin)) {
				omnisidebar.setHover(omnisidebar.resizebox_twin, true);
			}
		}
		else { 
			omnisidebar.contextmenuitemoptions.setAttribute('hidden', 'true');
			omnisidebar.menuseparator.setAttribute('hidden', 'true');
			if(document.getElementById('tt-toolbar-properties')) {
				document.getElementById('tt-toolbar-properties').removeAttribute('disabled');
			}
		}
		
		omnisidebar.timerAid.init('contextMenu', function() {
			omnisidebar.removeTotaltoolbarEntries(omnisidebar.toolbarcontextmenu);
			
			omnisidebar.contextmenuitemtoggle = omnisidebar.toolbarcontextmenu.insertBefore(omnisidebar.contextmenuitemtoggle, omnisidebar.toolbarcontextmenu.getElementsByAttribute('toolbarId', 'addon-bar')[0]);
			omnisidebar.contextmenuitemtoggle_twin = omnisidebar.toolbarcontextmenu.insertBefore(omnisidebar.contextmenuitemtoggle_twin, omnisidebar.toolbarcontextmenu.getElementsByAttribute('toolbarId', 'addon-bar')[0]);
		}, 50);
		
	},
	
	setAppMenu: function() {
		omnisidebar.timerAid.init('appMenu', function() {
			omnisidebar.removeTotaltoolbarEntries(omnisidebar.appmenu);
			
			omnisidebar.appmenuitemtoggle = omnisidebar.appmenu.insertBefore(omnisidebar.appmenuitemtoggle, omnisidebar.appmenu.getElementsByAttribute('toolbarId', 'addon-bar')[0]);
			omnisidebar.appmenuitemtoggle_twin = omnisidebar.appmenu.insertBefore(omnisidebar.appmenuitemtoggle_twin, omnisidebar.appmenu.getElementsByAttribute('toolbarId', 'addon-bar')[0]);
		}, 50);
	},
	
	setViewToolbarsMenu: function() {
		omnisidebar.timerAid.init('viewToolbarsMenu', function() {
			omnisidebar.removeTotaltoolbarEntries(omnisidebar.viewtoolbars);
			
			omnisidebar.viewmenuitemtoggle = omnisidebar.viewtoolbars.insertBefore(omnisidebar.viewmenuitemtoggle, omnisidebar.viewtoolbars.getElementsByAttribute('toolbarId', 'addon-bar')[0]);
			omnisidebar.viewmenuitemtoggle_twin = omnisidebar.viewtoolbars.insertBefore(omnisidebar.viewmenuitemtoggle_twin, omnisidebar.viewtoolbars.getElementsByAttribute('toolbarId', 'addon-bar')[0]);
		}, 50);
	},
	
	// Compatibility fix for Totaltoolbar, we don't want all those entries in the context menu
	removeTotaltoolbarEntries: function(menu) {
		for(var i=0; i<menu.childNodes.length; i++) {
			if(menu.childNodes[i].id.indexOf('toggle_omnisidebar') > -1) {
				menu.childNodes[i].setAttribute('collapsed', 'true');
			}
		}
	},
	
	// Compatibility fix for Totaltoolbar, move the buttons in Totaltoolbar's sidebar toolbar into ours and hide it
	moveTotaltoolbarButtons: function() {
		if(!document.getElementById('tt-toolbar-sidebarheader')) { return; }
		
		while(document.getElementById('tt-toolbar-sidebarheader').firstChild) {
			omnisidebar.toolbar.appendChild(document.getElementById('tt-toolbar-sidebarheader').firstChild);
		}
		
		document.getElementById('tt-toolbox-sidebarheader').setAttribute('collapsed', 'true');
	},
	
	// Populate the Sidebar view menus
	populateSidebarMenu: function(menu, group) {
		while(menu.firstChild) {
			menu.removeChild(menu.firstChild);
		}
		
		var groupBroadcasters = document.getElementsByAttribute('group', group);
		broadcasterLoop: for(var i=0; i<groupBroadcasters.length; i++) {
			if(groupBroadcasters[i].localName != 'broadcaster'
			|| groupBroadcasters[i].id.indexOf('BlankSidebar') > -1
			|| groupBroadcasters[i].id.indexOf('URISidebar') > -1
			|| groupBroadcasters[i].id.indexOf('WebPanelsSidebar') > -1
			|| groupBroadcasters[i].hasAttribute('disabled')) {
				continue;
			}
			
			var newEntry = document.createElement('menuitem');
			newEntry.id = 'menu' + groupBroadcasters[i].id;
			
			// Bugfix: Multiple entries, I have no idea why this would happen, but it does with the DragIt add-on
			for(var j=0; j<menu.childNodes.length; j++) {
				if(menu.childNodes[j].id == newEntry.id) { continue broadcasterLoop; }
			}
			
			newEntry.setAttribute('observes', groupBroadcasters[i].id);
			if(newEntry.getAttribute('label') == '') {
				newEntry.setAttribute('label', groupBroadcasters[i].getAttribute('sidebartitle'));
			}
			menu.appendChild(newEntry);
		}
	},
	
	openSidebarMenu: function(e, menu) {
		if(e.which != 1 || document.getElementById(document.getElementById(menu).getAttribute('box')).hasAttribute('noTitleButton')) { return; }
		
		document.getElementById(menu).style.minWidth = document.getElementById(document.getElementById(menu).getAttribute('target')).clientWidth +'px';
		document.getElementById(document.getElementById(menu).getAttribute('target')).setAttribute('active', 'true');
		document.getElementById(document.getElementById(menu).getAttribute('box')).setAttribute('nohide', 'true');
		document.getElementById(menu).openPopup(document.getElementById(document.getElementById(menu).getAttribute('target')), 'after_start');
	},
	
	closeSidebarMenu: function(menu) {
		document.getElementById(menu.getAttribute('target')).removeAttribute('active');
		document.getElementById(menu.getAttribute('box')).removeAttribute('nohide');
	},
	
	// Drag (resize when renderabove) handlers
	dragStart: function(e) {
		if(e.which != '1' || omnisidebar.customizing) { return; }
		
		omnisidebar.listenerAid.add(window, "mousemove", omnisidebar.drag, false);
		omnisidebar.listenerAid.add(window, "mouseup", omnisidebar.dragEnd, false);
		
		omnisidebar.dragging = true;
		omnisidebar.dragalt = true;
		omnisidebar.dragorix = e.screenX;
		if(e.target.id == 'omnisidebar_resizer' || e.target.id == 'sidebar-splitter') {
			omnisidebar.dragTarget = {
				target: omnisidebar.box,
				above: omnisidebar.prefs.renderabove.value,
				dragoriw: omnisidebar.box.clientWidth
			};
			omnisidebar.dragNotTarget = {
				target: omnisidebar.box_twin,
				above: omnisidebar.prefs.renderaboveTwin.value,
				dragoriw: omnisidebar.box_twin.clientWidth
			};
			if(omnisidebar.prefs.mainSidebar.value == 'left') {
				omnisidebar.dragalt = false;
			}
		} else {
			omnisidebar.dragTarget = {
				target: omnisidebar.box_twin,
				above: omnisidebar.prefs.renderaboveTwin.value,
				dragoriw: omnisidebar.box_twin.clientWidth
			};
			omnisidebar.dragNotTarget = {
				target: omnisidebar.box,
				above: omnisidebar.prefs.renderabove.value,
				dragoriw: omnisidebar.box.clientWidth
			};
			if(omnisidebar.prefs.mainSidebar.value == 'right') {
				omnisidebar.dragalt = false;
			}
		}
		omnisidebar.dragTarget.target.setAttribute('nohide', 'true');
	},
	
	dragEnd: function(e) {
		omnisidebar.listenerAid.remove(window, "mousemove", omnisidebar.drag, false);
		omnisidebar.listenerAid.remove(window, "mouseup", omnisidebar.dragEnd, false);
		omnisidebar.dragging = false;
		
		if(typeof(omnisidebar.dragNewW) == 'undefined') { omnisidebar.dragNewW = omnisidebar.dragTarget.target.clientWidth; } // again, this should never happen
		if(typeof(omnisidebar.dragOtherW) == 'undefined') { omnisidebar.dragOtherW = omnisidebar.dragNotTarget.target.clientWidth; } // again, this should never happen
		omnisidebar.dragTarget.target.setAttribute('width', omnisidebar.dragNewW);
		omnisidebar.dragTarget.target.style.width = '';
		omnisidebar.dragNotTarget.target.setAttribute('width', omnisidebar.dragOtherW);
		omnisidebar.dragNotTarget.target.style.width = '';
		
		// Delayed removal of "nohide" attribute is so the sidebar won't hide itself just after we finished resizing 
		// (finish resizing -> new values saved -> animations) and not (finish resizing -> animations -> new values saved)
		omnisidebar.timerAid.init('dragEnd', function() { omnisidebar.dragTarget.target.removeAttribute('nohide', 'true'); }, 100);
	},
	
	drag: function(e) {
		if(!omnisidebar.dragging) { // This is only for prevention, it's never happened but better safe than sorry
			omnisidebar.dragEnd();
			return; 
		}
		
		omnisidebar.dragcurx = e.screenX;
		
		// Are we dragging from the right or the left
		if(omnisidebar.dragalt) {
			omnisidebar.dragNewW = omnisidebar.dragTarget.dragoriw + (omnisidebar.dragorix - omnisidebar.dragcurx);
		}
		else {
			omnisidebar.dragNewW = omnisidebar.dragTarget.dragoriw + (omnisidebar.dragcurx - omnisidebar.dragorix);
		}
		if(omnisidebar.dragNewW < 5) { omnisidebar.dragNewW = 5; } // we so don't want this...
		else if(omnisidebar.dragNewW > omnisidebar.browser.clientWidth -73) { omnisidebar.dragNewW = omnisidebar.browser.clientWidth -73; } // or this
		
		// If new width makes it overlap the other sidebar...
		if(omnisidebar.dragNewW > omnisidebar.browser.clientWidth - omnisidebar.dragNotTarget.dragoriw -68) {
			omnisidebar.dragOtherW = omnisidebar.browser.clientWidth - omnisidebar.dragNewW -68;
		} else {
			omnisidebar.dragOtherW = omnisidebar.dragNotTarget.dragoriw;
		}
		
		// Temporarily apply new widths
		if(omnisidebar.dragTarget.above) {
			omnisidebar.dragTarget.target.style.width = omnisidebar.dragNewW +'px';
		} else {
			omnisidebar.dragTarget.target.setAttribute('width', omnisidebar.dragNewW);
		}
		if(omnisidebar.dragNotTarget.above) {
			omnisidebar.dragNotTarget.target.style.width = omnisidebar.dragOtherW +'px';
		} else {
			omnisidebar.dragNotTarget.target.setAttribute('width', omnisidebar.dragOtherW);
		}
	},
	
	autoClose: function(e) {
		omnisidebar.timerAid.init('autoClose', function(e) {
			var focusedNode = document.commandDispatcher.focusedElement || e.target;
			
			if(!omnisidebar.box.hidden && omnisidebar.prefs.renderabove.value && omnisidebar.prefs.undockMode.value == 'autoclose') {
				if(!omnisidebar.hasAncestor(focusedNode, omnisidebar.box)
				&& !omnisidebar.hasAncestor(focusedNode, document.getElementById('omnisidebarURIBarMenu'))
				&& (omnisidebar.box.getAttribute('sidebarcommand') != 'viewSimilarWebSidebar' || !omnisidebar.hasAncestor(focusedNode, document.getElementById('boxSimilarWebFloatingPanels')) ) ) {
					toggleSidebar();
				}
			}
			
			if(!omnisidebar.box_twin.hidden && omnisidebar.prefs.renderaboveTwin.value && omnisidebar.prefs.undockModeTwin.value == 'autoclose') {
				if(!omnisidebar.hasAncestor(focusedNode, omnisidebar.box_twin)
				&& !omnisidebar.hasAncestor(focusedNode, document.getElementById('omnisidebarURIBarMenu-twin'))
				&& (omnisidebar.box_twin.getAttribute('sidebarcommand') != 'viewSimilarWebSidebar-twin' || !omnisidebar.hasAncestor(focusedNode, document.getElementById('boxSimilarWebFloatingPanels')) ) ) {
					omnisidebar.toggleSidebarTwin();
				}
			}
		}, 100);
	},
	
	// toggleSidebar(), sidebarOnLoad() and fireSidebarFocusedEvent() modified for the twin sidebar
	toggleSidebarTwin: function(commandID, forceOpen) {
		if(!omnisidebar.initialized) {
			omnisidebar.timerAid.init('twinSidebar', function() { omnisidebar.toggleSidebarTwin(commandID, forceOpen); }, 500);
			return;
		}
		
		if (!commandID) {
			commandID = omnisidebar.box_twin.getAttribute("sidebarcommand") || omnisidebar.prefs.lastcommandTwin.value;
		}
		
		var sidebarBroadcaster = document.getElementById(commandID);
		// Because this.id passed here can come from observers and not the actual braodcasters we need to find it
		while(sidebarBroadcaster && sidebarBroadcaster.localName != 'broadcaster' && sidebarBroadcaster.getAttribute('observes')) {
			sidebarBroadcaster = document.getElementById(sidebarBroadcaster.getAttribute('observes'));
		}
		if(!sidebarBroadcaster) { return; } // Prevent some unforseen error here
		
		// Can't let both sidebars display the same page, it becomes unstable
		var url = sidebarBroadcaster.getAttribute("sidebarurl");
		if(url != 'about:blank' && document.getElementById(omnisidebar.prefs.lastcommand.value).getAttribute('sidebarurl') == url) {
			if(!omnisidebar.box.hidden) {
				toggleSidebar(omnisidebar.prefs.lastcommand.value, true);
				return;
			} else {
				omnisidebar.prefs.lastcommand.reset();
			}
		}
		
		// similarweb hides the header by default, I don't want that
		if(sidebarBroadcaster.id == 'viewSimilarWebSidebar-twin') {
			omnisidebar.setHeaders();
		}
		
		if (sidebarBroadcaster.getAttribute("checked") == "true") {
			if (!forceOpen) {
				sidebarBroadcaster.removeAttribute("checked");
				omnisidebar.box_twin.setAttribute("sidebarcommand", "");
				omnisidebar.title_twin.value = "";
				omnisidebar.sidebar_twin.setAttribute("src", "about:blank");
				omnisidebar.box_twin.hidden = true;
				if(omnisidebar.button_twin) {
					omnisidebar.button_twin.setAttribute('tooltiptext', omnisidebar.strings.getString('omnisidebarButtonTwinTooltip'));
					omnisidebar.button_twin.removeAttribute('checked');
				}
				omnisidebar.splitter_twin.hidden = true;
				if(content && (omnisidebar.box.hidden || !omnisidebar.prefs.renderabove.value || omnisidebar.prefs.undockMode.value != 'autoclose') ) {
					content.focus();
				}
			} else {
				omnisidebar.fireSidebarTwinFocusedEvent();
				omnisidebar.splitter_twin.hidden = false;
			}
			return;
		}
	
		var broadcasters = document.getElementsByAttribute("group", "twinSidebar");
		for (var i = 0; i < broadcasters.length; ++i) {
			if (broadcasters[i].localName != "broadcaster") {
				continue;
			}
			if (broadcasters[i] != sidebarBroadcaster) {
				broadcasters[i].removeAttribute("checked");
			} else {
				sidebarBroadcaster.setAttribute("checked", "true");
			}
		}
		omnisidebar.box_twin.hidden = false;
		if(omnisidebar.button_twin) {
			omnisidebar.button_twin.setAttribute('tooltiptext', omnisidebar.strings.getString('omnisidebarButtonTwinCloseTooltip'));
			omnisidebar.button_twin.setAttribute('checked', 'true');
		}
		omnisidebar.splitter_twin.hidden = false;
		
		var title = sidebarBroadcaster.getAttribute("sidebartitle") || sidebarBroadcaster.getAttribute("label");
		
		omnisidebar.sidebar_twin.setAttribute("src", url);
		omnisidebar.box_twin.setAttribute("sidebarcommand", sidebarBroadcaster.id);
		omnisidebar.title_twin.value = title;
		omnisidebar.title_twin.setAttribute('value', title); // Correct a bug where the title wouldn't show sometimes when starting firefox with the sidebar closed
		omnisidebar.box_twin.setAttribute("src", url);
		
		if (omnisidebar.sidebar_twin.contentDocument && omnisidebar.sidebar_twin.contentDocument.location.href != url) {
			omnisidebar.listenerAid.add(omnisidebar.sidebar_twin, "load", omnisidebar.sidebarTwinOnLoad, true);
		} else {
			omnisidebar.fireSidebarTwinFocusedEvent();
		}
	},
	
	fireSidebarTwinFocusedEvent: function() {
		var event = document.createEvent("Events");
		event.initEvent("SidebarFocused", true, false);
		if(omnisidebar.sidebar_twin.contentWindow) { omnisidebar.sidebar_twin.contentWindow.dispatchEvent(event); }
		
		if(omnisidebar.prefs.renderaboveTwin.value) {
			// For the autoclose feature, we need to focus the sidebar on open or it won't be focused
			if(omnisidebar.prefs.undockModeTwin.value == 'autoclose') {
				if(omnisidebar.sidebar_twin.contentDocument && omnisidebar.sidebar_twin.contentDocument.documentElement) {
					omnisidebar.sidebar_twin.contentDocument.documentElement.focus();
				} else {
					omnisidebar.box_twin.focus();
				}
			}
			
			// For the autohide feature, hover the sidebar for a moment when it opens even if the mouse isn't there, so the user knows the sidebar opened
			else if(omnisidebar.prefs.undockModeTwin.value == 'autohide') {
				omnisidebar.setHover(omnisidebar.resizebox_twin, true);
				omnisidebar.timerAid.init('autohideSidebarTwin', function() { omnisidebar.setHover(omnisidebar.resizebox_twin, false); }, 1000);
			}
		}
	},
	
	sidebarTwinOnLoad: function(event) {
		omnisidebar.listenerAid.remove(omnisidebar.sidebar_twin, "load", omnisidebar.sidebarTwinOnLoad, true);
		omnisidebar.timerAid.init('twinOnLoad', omnisidebar.fireSidebarTwinFocusedEvent, 0);
	},
	
	onDragEnter: function(box) {
		omnisidebar.setHover(box, true);
		omnisidebar.listenerAid.add(gBrowser, "dragenter", omnisidebar.onDragExitAll, false);
		omnisidebar.listenerAid.add(window, "dragdrop", omnisidebar.onDragExitAll, false);
	},
	
	onDragExit: function(box) {
		omnisidebar.setHover(box, false);
	},
	
	onDragExitAll: function() {
		omnisidebar.listenerAid.remove(gBrowser, "dragenter", omnisidebar.onDragExitAll, false);
		omnisidebar.listenerAid.remove(window, "dragdrop", omnisidebar.onDragExitAll, false);
		omnisidebar.setBothHovers(false);
	},
	
	setBothHovers: function(hover) {
		omnisidebar.setHover(omnisidebar.resizebox, hover);
		omnisidebar.setHover(omnisidebar.resizebox_twin, hover);
	},
	
	setHover: function(box, hover) {
		if(hover) {
			box.hovers++;
			box.setAttribute('hover', 'true');
		} else {
			if(box.hovers > 0) {
				box.hovers--;
			}
			if(box.hovers == 0) {
				box.removeAttribute('hover');
			}
		}
	}
};

// Small fix to toggleSidebar() to make it stop throwing an error
// Since it's already here I modded it a bit too
// We can't use a single function for both sidebars because you can toggle it without arguments and then it wouldn't know which sidebar to send the command the
function toggleSidebar(commandID, forceOpen) { 
	if(!omnisidebar.initialized) {
		omnisidebar.timerAid.init('mainSidebar', function() { toggleSidebar(commandID, forceOpen); }, 500);
		return;
	}
	
	// SimilarWeb hides the splitter and I don't want that
	if(omnisidebar.splitter.collapsed) {
		omnisidebar.hideIt(omnisidebar.splitter, (!omnisidebar.box.hidden && !omnisidebar.prefs.renderabove.value));
	}
		
	if(!commandID) {
		commandID = omnisidebar.box.getAttribute("sidebarcommand") || omnisidebar.prefs.lastcommand.value;
	}
	var sidebarBroadcaster = document.getElementById(commandID);
	if(!sidebarBroadcaster) { return; } // Prevent some unforseen error here
	
	// Can't let both sidebars display the same page, it becomes unstable
	var url = sidebarBroadcaster.getAttribute("sidebarurl");
	if(url != 'about:blank' && document.getElementById(omnisidebar.prefs.lastcommandTwin.value).getAttribute('sidebarurl') == url) {
		if(!omnisidebar.box_twin.hidden) {
			omnisidebar.toggleSidebarTwin(omnisidebar.prefs.lastcommandTwin.value, true);
			return;
		} else {
			omnisidebar.prefs.lastcommandTwin.reset();
		}
	}
	
	// similarweb hides the header by default, I don't want that
	if(sidebarBroadcaster.id == 'viewSimilarWebSidebar') {
		omnisidebar.setHeaders();
	}
	
	if(sidebarBroadcaster && sidebarBroadcaster.getAttribute("checked") == "true") {
		if(!forceOpen) {
			sidebarBroadcaster.removeAttribute("checked");
			omnisidebar.box.setAttribute("sidebarcommand", "");
			omnisidebar.title.value = "";
			omnisidebar.sidebar.setAttribute("src", "about:blank");
			omnisidebar.box.hidden = true;
			if(omnisidebar.button) {
				if(omnisidebar.prefs.twinSidebar.value) {
					omnisidebar.button.setAttribute('tooltiptext', omnisidebar.strings.getString('omnisidebarButtonMainTooltip'));
				} else {
					omnisidebar.button.setAttribute('tooltiptext', omnisidebar.strings.getString('omnisidebarButtonTooltip'));
				}
				omnisidebar.button.removeAttribute('checked');
			}
			omnisidebar.splitter.hidden = true;
			if(content && (omnisidebar.box_twin.hidden || !omnisidebar.prefs.renderaboveTwin.value || omnisidebar.prefs.undockModeTwin.value != 'autoclose') ) {
				content.focus();
			}
		} else {
			fireSidebarFocusedEvent();
		}
		return;
	}
	
	var broadcasters = document.getElementsByAttribute("group", "sidebar");
	for(var i = 0; i < broadcasters.length; ++i) {
		if(broadcasters[i].localName != "broadcaster") {
			continue;
		}
		if(broadcasters[i] != sidebarBroadcaster) {
			broadcasters[i].removeAttribute("checked");
		} else {
			sidebarBroadcaster.setAttribute("checked", "true");
		}
	}
	omnisidebar.box.hidden = false;
	if(omnisidebar.button) {
		if(omnisidebar.prefs.twinSidebar.value) {
			omnisidebar.button.setAttribute('tooltiptext', omnisidebar.strings.getString('omnisidebarButtonMainCloseTooltip'));
		} else {
			omnisidebar.button.setAttribute('tooltiptext', omnisidebar.strings.getString('omnisidebarButtonCloseTooltip'));
		}
		omnisidebar.button.setAttribute('checked', 'true');
	}
	omnisidebar.splitter.hidden = false;
	
	var title = sidebarBroadcaster.getAttribute("sidebartitle") || sidebarBroadcaster.getAttribute("label");
	
	omnisidebar.sidebar.setAttribute("src", url);
	omnisidebar.box.setAttribute("sidebarcommand", sidebarBroadcaster.id);
	omnisidebar.title.value = title;
	omnisidebar.title.setAttribute('value', title); // Correct a bug where the title wouldn't show sometimes when starting firefox with the sidebar closed
	omnisidebar.box.setAttribute("src", url);
	
	if (sidebar.contentDocument && sidebar.contentDocument.location.href != url) {
		sidebar.addEventListener("load", sidebarOnLoad, true);
	} else {
		fireSidebarFocusedEvent();
	}
}

function fireSidebarFocusedEvent() {
	var event = document.createEvent("Events");
	event.initEvent("SidebarFocused", true, false);
	if(omnisidebar.sidebar.contentWindow) { omnisidebar.sidebar.contentWindow.dispatchEvent(event); }
	
	if(omnisidebar.prefs.renderabove.value) {
		// For the autoclose feature, we need to focus the sidebar on open or it won't be focused
		if(omnisidebar.prefs.undockMode.value == 'autoclose') {
			if(omnisidebar.sidebar.contentDocument && omnisidebar.sidebar.contentDocument.documentElement) {
				omnisidebar.sidebar.contentDocument.documentElement.focus();
			} else {
				omnisidebar.box.focus();
			}
		}
		
		// For the autohide feature, hover the sidebar for a moment when it opens even if the mouse isn't there, so the user knows the sidebar opened
		else if(omnisidebar.prefs.undockMode.value == 'autohide') {
			omnisidebar.setHover(omnisidebar.resizebox, true);
			omnisidebar.timerAid.init('autohideSidebar', function() { omnisidebar.setHover(omnisidebar.resizebox, false); }, 1000);
		}
	}
}

Components.utils.import("chrome://omnisidebar/content/utils.jsm", omnisidebar);
omnisidebar.fixSimilarWeb();
omnisidebar.listenerAid.add(window, "load", omnisidebar.preinit, false);